"""
문항 관련 테스트 (TC-SEARCH-001 등)
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Organization, Problem, Subject, Tag, ProblemTag

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
        )
        ProblemTag.objects.create(problem=self.problem, tag=self.tag)

    def test_search_problems(self):
        """TC-SEARCH-001: 문항 검색"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/v1/problems/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data["results"]), 1)

    def test_search_by_difficulty(self):
        """난이도 필터링"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/v1/problems/?difficulty_min=3&difficulty_max=3")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for result in response.data["results"]:
            self.assertEqual(result["difficulty"], 3)
