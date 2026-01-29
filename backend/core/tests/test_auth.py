"""
인증 관련 테스트 (TC-AUTH-001~005)
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Organization

User = get_user_model()


class AuthTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.organization = Organization.objects.create(name="Test Academy")
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            name="Test User",
            organization=self.organization,
        )

    def test_login_success(self):
        """TC-AUTH-001: 올바른 이메일/비밀번호로 로그인"""
        response = self.client.post(
            "/api/v1/auth/token/",
            {"email": "test@example.com", "password": "testpass123"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_wrong_password(self):
        """TC-AUTH-002: 잘못된 비밀번호로 로그인 실패"""
        response = self.client.post(
            "/api/v1/auth/token/",
            {"email": "test@example.com", "password": "wrongpass"},
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_user(self):
        """TC-AUTH-003: 존재하지 않는 사용자 로그인 실패"""
        response = self.client.post(
            "/api/v1/auth/token/",
            {"email": "nonexistent@example.com", "password": "anypass"},
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_me(self):
        """TC-AUTH-004: 인증된 사용자 정보 조회"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "test@example.com")

    def test_register(self):
        """TC-AUTH-005: 회원가입"""
        response = self.client.post(
            "/api/v1/auth/register/",
            {
                "email": "new@example.com",
                "password": "newpass123",
                "name": "New User",
                "organization_name": "New Academy",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["email"], "new@example.com")
        self.assertTrue(User.objects.filter(email="new@example.com").exists())
