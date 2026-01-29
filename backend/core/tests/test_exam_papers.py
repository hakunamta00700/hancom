"""
시험지 관련 테스트
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Organization, ExamPaper, Problem, ExamPaperItem

User = get_user_model()


class ExamPaperTestCase(TestCase):
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
        self.problem = Problem.objects.create(
            organization=self.organization,
            is_public=True,
        )

    def test_create_exam_paper(self):
        """시험지 생성"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/v1/exam-papers/",
            {
                "title": "테스트 시험지",
                "total_problems": 0,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "테스트 시험지")

    def test_add_item(self):
        """문항 추가"""
        exam_paper = ExamPaper.objects.create(
            organization=self.organization,
            title="Test",
            total_problems=0,
            created_by=self.user,
        )
        self.client.force_authenticate(user=self.user)
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
