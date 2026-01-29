"""
추출 작업 관련 테스트 (TC-EXTRACT-001~004)
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from core.models import (
    Organization,
    UserRole,
    SourceDocument,
    IngestionJob,
    IngestionStatus,
    Problem,
    ReviewTask,
)

User = get_user_model()


class ExtractTestCase(TestCase):
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

    def test_ingestion_job_list(self):
        """TC-EXTRACT-002: 작업 목록·상세에서 상태·진행률·처리 통계 조회"""
        self.client.force_authenticate(user=self.operator)

        # SourceDocument 및 IngestionJob 생성
        doc = SourceDocument.objects.create(
            organization=self.organization,
            title="Test Document",
            file_type="PDF",
            uploaded_by=self.operator,
        )
        job = IngestionJob.objects.create(
            source_document=doc,
            status=IngestionStatus.COMPLETED,
            progress=100,
            pages_processed=5,
            problems_extracted=10,
        )

        # 목록 조회
        response = self.client.get("/api/v1/ingestion-jobs/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data["results"]), 1)

        # 상세 조회
        response = self.client.get(f"/api/v1/ingestion-jobs/{job.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "completed")
        self.assertEqual(response.data["progress"], 100)
        self.assertEqual(response.data["pages_processed"], 5)
        self.assertEqual(response.data["problems_extracted"], 10)

    def test_ingestion_job_status_filter(self):
        """작업 상태 필터링"""
        self.client.force_authenticate(user=self.operator)

        doc = SourceDocument.objects.create(
            organization=self.organization,
            title="Test Document",
            file_type="PDF",
            uploaded_by=self.operator,
        )
        IngestionJob.objects.create(
            source_document=doc,
            status=IngestionStatus.PENDING,
        )

        # 상태 필터링
        response = self.client.get("/api/v1/ingestion-jobs/?status=pending")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for result in response.data["results"]:
            self.assertEqual(result["status"], "pending")

    def test_retry_failed_job(self):
        """TC-EXTRACT-003: 추출 실패 시 재시도"""
        self.client.force_authenticate(user=self.operator)

        doc = SourceDocument.objects.create(
            organization=self.organization,
            title="Test Document",
            file_type="PDF",
            uploaded_by=self.operator,
        )
        job = IngestionJob.objects.create(
            source_document=doc,
            status=IngestionStatus.FAILED,
            error_message="Test error",
        )

        # 재시도
        response = self.client.post(f"/api/v1/ingestion-jobs/{job.id}/retry/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retry_non_failed_job(self):
        """실패하지 않은 작업은 재시도 불가"""
        self.client.force_authenticate(user=self.operator)

        doc = SourceDocument.objects.create(
            organization=self.organization,
            title="Test Document",
            file_type="PDF",
            uploaded_by=self.operator,
        )
        job = IngestionJob.objects.create(
            source_document=doc,
            status=IngestionStatus.COMPLETED,
        )

        # 재시도 시도
        response = self.client.post(f"/api/v1/ingestion-jobs/{job.id}/retry/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_organization_isolation(self):
        """조직별 작업 격리"""
        org_b = Organization.objects.create(name="Org B")
        doc_b = SourceDocument.objects.create(
            organization=org_b,
            title="Org B Document",
            file_type="PDF",
        )
        IngestionJob.objects.create(source_document=doc_b)

        self.client.force_authenticate(user=self.operator)

        # 조직 A 사용자는 조직 B 작업을 볼 수 없어야 함
        response = self.client.get("/api/v1/ingestion-jobs/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for result in response.data["results"]:
            self.assertNotEqual(
                result["source_document"]["organization"], str(org_b.id)
            )
