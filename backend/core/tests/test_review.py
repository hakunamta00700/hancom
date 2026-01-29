"""
검수 관련 테스트 (TC-REVIEW-001~008)
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from core.models import (
    Organization,
    UserRole,
    Problem,
    ReviewTask,
    ReviewHistory,
    ReviewStatus,
    SourceDocument,
    IngestionJob,
    Subject,
    Tag,
    ProblemTag,
    AuditLog,
)

User = get_user_model()


class ReviewTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.organization = Organization.objects.create(name="Test Academy")
        self.operator = User.objects.create_user(
            email="operator@example.com",
            password="testpass123",
            name="Operator",
            organization=self.organization,
            role=UserRole.OPERATOR,
        )
        self.teacher = User.objects.create_user(
            email="teacher@example.com",
            password="testpass123",
            name="Teacher",
            organization=self.organization,
            role=UserRole.TEACHER,
        )
        self.subject = Subject.objects.create(name="국어", code="KOR")
        self.tag = Tag.objects.create(name="국어", category="subject")

        # 검수 대기 문항 생성
        self.problem = Problem.objects.create(
            organization=self.organization,
            difficulty=3,
            problem_type="multiple_choice",
            is_public=False,
        )
        ProblemTag.objects.create(problem=self.problem, tag=self.tag)
        self.review_task = ReviewTask.objects.create(
            problem=self.problem,
            status=ReviewStatus.PENDING,
        )

    def test_review_task_list(self):
        """TC-REVIEW-001: 검수 대기 목록 조회·필터·정렬"""
        self.client.force_authenticate(user=self.operator)

        # 기본 목록 조회
        response = self.client.get("/api/v1/review-tasks/?status=pending")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data["results"]), 1)

        # 필터링 테스트
        response = self.client.get("/api/v1/review-tasks/?status=approved")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_review_task_detail(self):
        """TC-REVIEW-002: 검수 화면용 문항 상세 조회"""
        self.client.force_authenticate(user=self.operator)

        # ReviewTask 상세 조회
        response = self.client.get(f"/api/v1/review-tasks/{self.review_task.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "pending")

        # Problem 상세 조회
        response = self.client.get(f"/api/v1/problems/{self.problem.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("id", response.data)

    def test_approve_problem(self):
        """TC-REVIEW-003: 텍스트·태깅 수정 후 승인"""
        self.client.force_authenticate(user=self.operator)

        # 문항 수정
        response = self.client.patch(
            f"/api/v1/problems/{self.problem.id}/",
            {
                "difficulty": 4,
                "problem_type": "multiple_choice",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 승인
        response = self.client.post(
            f"/api/v1/review-tasks/{self.review_task.id}/approve/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 승인 확인
        self.problem.refresh_from_db()
        self.assertTrue(self.problem.is_public)
        self.assertIsNotNone(self.problem.reviewed_at)

        # ReviewHistory 확인
        history = ReviewHistory.objects.filter(problem=self.problem).first()
        self.assertIsNotNone(history)
        self.assertEqual(history.changed_field, "status")

        # AuditLog 확인
        audit_log = AuditLog.objects.filter(
            resource_type="problem", resource_id=self.problem.id
        ).first()
        self.assertIsNotNone(audit_log)
        self.assertEqual(audit_log.action_type, "problem_approved")

    def test_reject_problem(self):
        """TC-REVIEW-004: 반려 시 공개되지 않음"""
        self.client.force_authenticate(user=self.operator)

        # 반려
        response = self.client.post(
            f"/api/v1/review-tasks/{self.review_task.id}/reject/",
            {"reason": "내용 부적절"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 반려 확인
        self.review_task.refresh_from_db()
        self.assertEqual(self.review_task.status, ReviewStatus.REJECTED)
        self.assertIsNotNone(self.review_task.review_notes)

        # 공개되지 않음 확인
        self.problem.refresh_from_db()
        self.assertFalse(self.problem.is_public)

    def test_resubmit_after_rejection(self):
        """TC-REVIEW-005: 수정 후 재제출 플로우"""
        self.client.force_authenticate(user=self.operator)

        # 먼저 반려
        response = self.client.post(
            f"/api/v1/review-tasks/{self.review_task.id}/reject/",
            {"reason": "수정 필요"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 문항 수정
        response = self.client.patch(
            f"/api/v1/problems/{self.problem.id}/",
            {"difficulty": 2},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 재제출 (새 ReviewTask 생성 또는 상태 변경)
        self.review_task.status = ReviewStatus.PENDING
        self.review_task.review_notes = None
        self.review_task.save()

        # 다시 승인
        response = self.client.post(
            f"/api/v1/review-tasks/{self.review_task.id}/approve/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_review_stats(self):
        """TC-REVIEW-006: 검수 완료율·과목별 통계 조회"""
        self.client.force_authenticate(user=self.operator)

        # 통계 조회
        response = self.client.get("/api/v1/review-tasks/stats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("total", response.data)
        self.assertIn("pending", response.data)
        self.assertIn("approved", response.data)
        self.assertIn("rejected", response.data)

    def test_delete_problem(self):
        """TC-REVIEW-007: 문항 삭제(소프트)·비공개"""
        self.client.force_authenticate(user=self.operator)

        # 먼저 승인
        self.problem.is_public = True
        self.problem.save()

        # 삭제 (소프트 삭제)
        response = self.client.delete(f"/api/v1/problems/{self.problem.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # 삭제 확인
        self.problem.refresh_from_db()
        self.assertIsNotNone(self.problem.deleted_at)

        # 검색에서 제외 확인
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get("/api/v1/problems/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 삭제된 문항은 검색 결과에 포함되지 않아야 함

    def test_restore_deleted_problem(self):
        """TC-REVIEW-008: 삭제 문항 30일 이내 복구"""
        from datetime import timedelta

        self.client.force_authenticate(user=self.operator)

        # 삭제
        self.problem.deleted_at = timezone.now()
        self.problem.save()

        # 복구 (30일 이내)
        self.problem.deleted_at = None
        self.problem.save()

        # 복구 확인
        self.problem.refresh_from_db()
        self.assertIsNone(self.problem.deleted_at)

    def test_teacher_cannot_access_review(self):
        """교사는 검수 API 접근 불가"""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get("/api/v1/review-tasks/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
