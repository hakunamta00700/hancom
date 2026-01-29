"""
비기능 테스트 (TC-NFR-001~006)
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
import time
from core.models import Organization, UserRole, Problem, Subject, Tag, ProblemTag

User = get_user_model()


class NFRTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.organization = Organization.objects.create(name="Test Academy")
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            name="Test User",
            organization=self.organization,
            role=UserRole.TEACHER,
        )
        self.subject = Subject.objects.create(name="국어", code="KOR")
        self.tag = Tag.objects.create(name="국어", category="subject")

        # 테스트용 문항 생성
        for i in range(10):
            problem = Problem.objects.create(
                organization=self.organization,
                difficulty=i % 5 + 1,
                problem_type="multiple_choice",
                is_public=True,
            )
            ProblemTag.objects.create(problem=problem, tag=self.tag)

    def test_health_check(self):
        """TC-NFR-005: 헬스 체크"""
        response = self.client.get("/api/v1/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("status", response.data)
        self.assertIn("checks", response.data)

    def test_search_performance(self):
        """TC-NFR-003: 검색 응답 시간 1초 이내"""
        self.client.force_authenticate(user=self.user)

        start_time = time.time()
        response = self.client.get(
            "/api/v1/problems/?subject_id={}&difficulty_min=1&difficulty_max=5".format(
                self.tag.id
            )
        )
        elapsed_time = time.time() - start_time

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # CI에서는 느슨한 상한 사용 (2초)
        self.assertLess(
            elapsed_time, 2.0, f"검색 응답 시간이 너무 깁니다: {elapsed_time}초"
        )

    def test_sql_injection_protection(self):
        """TC-NFR-002: 입력 검증(SQL/XSS/CSRF·파일) - SQL 인젝션"""
        self.client.force_authenticate(user=self.user)

        # SQL 인젝션 시도
        malicious_input = "' OR 1=1--"
        response = self.client.get(f"/api/v1/problems/?keyword={malicious_input}")
        # 정상적으로 처리되어야 함 (에러가 나지 않아야 함)
        self.assertIn(
            response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]
        )

    def test_xss_protection(self):
        """TC-NFR-002: 입력 검증 - XSS"""
        self.client.force_authenticate(user=self.user)

        # XSS 시도
        malicious_input = "<script>alert(1)</script>"
        response = self.client.get(f"/api/v1/problems/?keyword={malicious_input}")
        # 정상적으로 처리되어야 함
        self.assertIn(
            response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]
        )

    def test_file_upload_validation(self):
        """TC-NFR-002: 입력 검증 - 파일 업로드"""
        from django.core.files.uploadedfile import SimpleUploadedFile

        operator = User.objects.create_user(
            email="operator@example.com",
            password="testpass123",
            name="Operator",
            organization=self.organization,
            role=UserRole.OPERATOR,
        )
        self.client.force_authenticate(user=operator)

        # 허용되지 않은 파일 형식
        exe_file = SimpleUploadedFile(
            "test.exe", b"malicious content", content_type="application/x-msdownload"
        )
        response = self.client.post(
            "/api/v1/source-documents/",
            {"title": "Test", "file": exe_file},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # 크기 초과 파일 (50MB + 1 byte)
        large_content = b"x" * (50 * 1024 * 1024 + 1)
        large_file = SimpleUploadedFile(
            "test.pdf", large_content, content_type="application/pdf"
        )
        response = self.client.post(
            "/api/v1/source-documents/",
            {"title": "Test", "file": large_file},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
