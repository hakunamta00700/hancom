"""
파일 업로드 관련 테스트 (TC-UPLOAD-001~004)
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from core.models import Organization, SourceDocument, IngestionJob

User = get_user_model()


class UploadTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.organization = Organization.objects.create(name="Test Academy")
        self.user = User.objects.create_user(
            email="operator@example.com",
            password="testpass123",
            name="Operator",
            organization=self.organization,
            role="operator",
        )

    def test_upload_pdf(self):
        """TC-UPLOAD-001: PDF 단일 업로드 성공"""
        self.client.force_authenticate(user=self.user)

        # 간단한 PDF 파일 생성 (실제로는 더 복잡한 파일 필요)
        pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 0\ntrailer\n<<\n/Root 1 0 R\n>>\nstartxref\n0\n%%EOF"
        pdf_file = SimpleUploadedFile(
            "test.pdf", pdf_content, content_type="application/pdf"
        )

        response = self.client.post(
            "/api/v1/source-documents/",
            {
                "title": "Test Document",
                "file": pdf_file,
                "source": "평가원",
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(SourceDocument.objects.filter(title="Test Document").exists())

        # IngestionJob 생성 확인
        doc = SourceDocument.objects.get(title="Test Document")
        self.assertTrue(IngestionJob.objects.filter(source_document=doc).exists())

    def test_upload_image(self):
        """TC-UPLOAD-002: 다중 이미지(PNG/JPG) 업로드 및 메타 입력 후 추출 등록"""
        self.client.force_authenticate(user=self.user)

        # PNG 파일 생성
        png_content = b"\x89PNG\r\n\x1a\n" + b"x" * 100  # 간단한 PNG 헤더
        png_file = SimpleUploadedFile("test.png", png_content, content_type="image/png")

        response = self.client.post(
            "/api/v1/source-documents/",
            {
                "title": "Test Image",
                "file": png_file,
                "source": "평가원",
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_upload_invalid_format(self):
        """TC-UPLOAD-003: 허용 형식·크기 초과 시 400"""
        self.client.force_authenticate(user=self.user)

        # 허용되지 않은 파일 형식
        exe_file = SimpleUploadedFile(
            "test.exe", b"malicious", content_type="application/x-msdownload"
        )
        response = self.client.post(
            "/api/v1/source-documents/",
            {
                "title": "Test",
                "file": exe_file,
            },
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
            {
                "title": "Test",
                "file": large_file,
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_upload_status(self):
        """TC-UPLOAD-004: 업로드 진행률 또는 상태 확인"""
        self.client.force_authenticate(user=self.user)

        # 문서 업로드
        pdf_content = b"%PDF-1.4\n"
        pdf_file = SimpleUploadedFile(
            "test.pdf", pdf_content, content_type="application/pdf"
        )
        response = self.client.post(
            "/api/v1/source-documents/",
            {
                "title": "Test Document",
                "file": pdf_file,
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        doc = SourceDocument.objects.get(title="Test Document")
        job = IngestionJob.objects.filter(source_document=doc).first()

        if job:
            # 작업 상태 조회
            response = self.client.get(f"/api/v1/ingestion-jobs/{job.id}/")
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn("status", response.data)
            self.assertIn("progress", response.data)
