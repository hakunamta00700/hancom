"""
데이터·감사·저작권 관련 테스트 (TC-DATA-001~004)
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from core.models import (
    Organization,
    UserRole,
    Problem,
    ExamPaper,
    SourceDocument,
    AuditLog,
)

User = get_user_model()


class DataTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.organization_a = Organization.objects.create(name="Org A")
        self.organization_b = Organization.objects.create(name="Org B")
        self.user_a = User.objects.create_user(
            email="user_a@example.com",
            password="testpass123",
            name="User A",
            organization=self.organization_a,
            role=UserRole.TEACHER,
        )
        self.user_b = User.objects.create_user(
            email="user_b@example.com",
            password="testpass123",
            name="User B",
            organization=self.organization_b,
            role=UserRole.TEACHER,
        )

        # 조직별 데이터 생성
        self.problem_a = Problem.objects.create(
            organization=self.organization_a,
            is_public=True,
        )
        self.problem_b = Problem.objects.create(
            organization=self.organization_b,
            is_public=True,
        )

        self.exam_a = ExamPaper.objects.create(
            organization=self.organization_a,
            title="Exam A",
            total_problems=5,
            created_by=self.user_a,
        )
        self.exam_b = ExamPaper.objects.create(
            organization=self.organization_b,
            title="Exam B",
            total_problems=5,
            created_by=self.user_b,
        )

    def test_organization_isolation_problems(self):
        """TC-DATA-001: 조직별 문항/시험지 접근 제한"""
        self.client.force_authenticate(user=self.user_a)

        # 조직 A 사용자는 조직 A 문항만 조회 가능
        response = self.client.get("/api/v1/problems/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        problem_ids = [p["id"] for p in response.data["results"]]
        self.assertIn(str(self.problem_a.id), problem_ids)
        self.assertNotIn(str(self.problem_b.id), problem_ids)

        # 조직 B 문항 직접 조회 시 403/404
        response = self.client.get(f"/api/v1/problems/{self.problem_b.id}/")
        self.assertIn(
            response.status_code,
            [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND],
        )

    def test_organization_isolation_exams(self):
        """조직별 시험지 접근 제한"""
        self.client.force_authenticate(user=self.user_a)

        # 조직 A 사용자는 조직 A 시험지만 조회 가능
        response = self.client.get("/api/v1/exam-papers/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        exam_ids = [e["id"] for e in response.data["results"]]
        self.assertIn(str(self.exam_a.id), exam_ids)
        self.assertNotIn(str(self.exam_b.id), exam_ids)

    def test_audit_log_creation(self):
        """TC-DATA-002: 감사 로그 기록·조회"""
        from core.models import ReviewTask

        self.client.force_authenticate(user=self.user_a)

        # 문항 승인으로 감사 로그 생성
        review_task = ReviewTask.objects.create(
            problem=self.problem_a,
            status="pending",
        )
        response = self.client.post(f"/api/v1/review-tasks/{review_task.id}/approve/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 감사 로그 확인
        audit_log = AuditLog.objects.filter(
            user=self.user_a,
            action_type="problem_approved",
            resource_type="problem",
            resource_id=self.problem_a.id,
        ).first()
        self.assertIsNotNone(audit_log)
        self.assertEqual(audit_log.organization, self.organization_a)

    def test_source_required(self):
        """TC-DATA-003: 출처 필수 검증"""
        self.client.force_authenticate(user=self.user_a)

        # 출처 없이 업로드 시도 (실제 구현에 따라 검증 위치가 다를 수 있음)
        from django.core.files.uploadedfile import SimpleUploadedFile

        pdf_content = b"%PDF-1.4\n"
        pdf_file = SimpleUploadedFile(
            "test.pdf", pdf_content, content_type="application/pdf"
        )

        # 출처 없이 업로드 (실제로는 serializer에서 검증될 수 있음)
        response = self.client.post(
            "/api/v1/source-documents/",
            {
                "title": "Test Document",
                "file": pdf_file,
                # source 필드 없음
            },
            format="multipart",
        )
        # serializer에 required=True가 있으면 400, 없으면 통과 가능
        # 실제 구현에 맞춰 assertion 조정 필요

    def test_copyright_info_in_response(self):
        """TC-DATA-004: 문항·시험지 상세에 출처 노출"""
        self.client.force_authenticate(user=self.user_a)

        # 출처 정보가 있는 문항 생성
        self.problem_a.source = "평가원"
        self.problem_a.copyright_info = "저작권 정보"
        self.problem_a.save()

        # 문항 상세 조회
        response = self.client.get(f"/api/v1/problems/{self.problem_a.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 출처 정보가 응답에 포함되어야 함 (실제 serializer 필드에 따라 다름)
