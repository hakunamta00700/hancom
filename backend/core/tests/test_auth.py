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
        """인증된 사용자 정보 조회"""
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

    def test_expired_token(self):
        """TC-AUTH-004: 만료된 토큰으로 API 호출 시 401"""
        from rest_framework_simplejwt.tokens import AccessToken
        from datetime import timedelta
        from django.utils import timezone

        # 만료된 토큰 생성
        token = AccessToken()
        token.set_exp(from_time=timezone.now() - timedelta(hours=1))
        expired_token = str(token)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {expired_token}")
        response = self.client.get("/api/v1/problems/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_teacher_cannot_access_operator_api(self):
        """TC-AUTH-005: 교사의 운영자 전용 API 호출 시 403"""
        teacher = User.objects.create_user(
            email="teacher2@example.com",
            password="testpass123",
            name="Teacher 2",
            organization=self.organization,
            role="teacher",
        )
        self.client.force_authenticate(user=teacher)
        response = self.client.get("/api/v1/review-tasks/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_organization_isolation(self):
        """TC-AUTH-006: 조직 격리 - 타 조직 문항 조회 불가"""
        # 다른 조직 생성
        org_b = Organization.objects.create(name="Org B")
        problem_b = Problem.objects.create(
            organization=org_b,
            is_public=True,
        )

        # 조직 A 사용자로 조직 B 문항 조회 시도
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/v1/problems/{problem_b.id}/")
        self.assertIn(
            response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]
        )

    def test_password_reset_flow(self):
        """TC-AUTH-007: 비밀번호 재설정 링크 요청 및 재설정"""
        from core.models import PasswordResetToken
        from django.utils import timezone
        from datetime import timedelta

        # 비밀번호 재설정 요청
        response = self.client.post(
            "/api/v1/auth/forgot-password/",
            {"email": "test@example.com"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 토큰 확인
        reset_token = PasswordResetToken.objects.filter(
            user=self.user, used=False
        ).first()
        self.assertIsNotNone(reset_token)

        # 비밀번호 재설정
        response = self.client.post(
            "/api/v1/auth/reset-password/",
            {
                "token": reset_token.token,
                "new_password": "newpass456",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 새 비밀번호로 로그인 확인
        response = self.client.post(
            "/api/v1/auth/token/",
            {"email": "test@example.com", "password": "newpass456"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_profile_update(self):
        """TC-AUTH-008: 프로필 수정 반영"""
        self.client.force_authenticate(user=self.user)

        # 프로필 수정
        response = self.client.patch(
            "/api/v1/auth/me/",
            {"name": "Updated Name"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Updated Name")

        # 수정 반영 확인
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Updated Name")
