"""
파일 업로드 관련 테스트 (TC-UPLOAD-001 등)
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from core.models import Organization, SourceDocument

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
        """TC-UPLOAD-001: PDF 파일 업로드"""
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
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(SourceDocument.objects.filter(title="Test Document").exists())
