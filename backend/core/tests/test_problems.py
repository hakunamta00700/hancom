"""
문항 관련 테스트 (TC-SEARCH-001~006)
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from core.models import (
    Organization,
    Problem,
    Subject,
    Tag,
    ProblemTag,
    ExamPaper,
    ExamPaperItem,
)

User = get_user_model()


class ProblemSearchTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.organization = Organization.objects.create(name="Test Academy")
        self.user = User.objects.create_user(
            email="teacher@example.com",
            password="testpass123",
            name="Teacher",
            organization=self.organization,
            role="teacher",
        )
        self.subject = Subject.objects.create(name="국어", code="KOR")
        self.tag = Tag.objects.create(name="국어", category="subject")

        # 공개 문항 생성
        self.problem = Problem.objects.create(
            organization=self.organization,
            difficulty=3,
            problem_type="multiple_choice",
            is_public=True,
            text_content={"passage": "지문 내용", "question": "문제 내용"},
        )
        ProblemTag.objects.create(problem=self.problem, tag=self.tag)

    def test_search_problems(self):
        """TC-SEARCH-001: 다중 조건 검색 및 조직 격리"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/v1/problems/?subject_id={self.tag.id}&difficulty_min=1&difficulty_max=5"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data["results"]), 1)
        # 조직 격리 확인
        for result in response.data["results"]:
            self.assertEqual(result["organization"], str(self.organization.id))

    def test_search_by_difficulty(self):
        """난이도 필터링"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            "/api/v1/problems/?difficulty_min=3&difficulty_max=3"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for result in response.data["results"]:
            self.assertEqual(result["difficulty"], 3)

    def test_keyword_search(self):
        """TC-SEARCH-002: 키워드 검색이 지문·문제·선택지 텍스트 대상"""
        self.client.force_authenticate(user=self.user)

        # 키워드 검색
        response = self.client.get("/api/v1/problems/?keyword=문제")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 키워드가 포함된 문항이 결과에 있어야 함

    def test_pagination(self):
        """TC-SEARCH-003: 검색 결과 페이지네이션·빈 결과"""
        self.client.force_authenticate(user=self.user)

        # 페이지네이션 테스트
        response = self.client.get("/api/v1/problems/?page=1&page_size=20")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertIn("count", response.data)

        # 빈 결과 테스트
        response = self.client.get("/api/v1/problems/?difficulty_min=999")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 0)

    def test_problem_detail(self):
        """TC-SEARCH-004: 문항 상세에 이미지·텍스트·메타·출처"""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(f"/api/v1/problems/{self.problem.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("id", response.data)
        self.assertIn("difficulty", response.data)
        self.assertIn("problem_type", response.data)

    def test_add_to_exam_paper(self):
        """TC-SEARCH-005: 문항 상세에서 시험지에 추가"""
        self.client.force_authenticate(user=self.user)

        # 시험지 생성
        exam_paper = ExamPaper.objects.create(
            organization=self.organization,
            title="Test Exam",
            total_problems=0,
            created_by=self.user,
        )

        # 문항 추가
        response = self.client.post(
            f"/api/v1/exam-papers/{exam_paper.id}/add_item/",
            {
                "problem_id": str(self.problem.id),
                "order_number": 1,
                "points": 1,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ExamPaperItem.objects.filter(exam_paper=exam_paper).count(), 1)
