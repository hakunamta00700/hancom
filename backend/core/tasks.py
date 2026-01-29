"""
Celery 태스크 정의
"""
import os
import sys
from pathlib import Path
from typing import List, Tuple
from celery import shared_task
from django.utils import timezone
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

# extract_problems.py의 함수들을 임포트하기 위해 경로 추가
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
try:
    from extract_problems import (
        pdf_page_to_image,
        process_page_image,
        parse_range,
    )
except ImportError:
    # extract_problems.py가 없는 경우를 대비
    pdf_page_to_image = None
    process_page_image = None
    parse_range = None

from .models import SourceDocument, IngestionJob, Problem, ReviewTask


@shared_task(bind=True)
def extract_problems_task(self, ingestion_job_id: str):
    """
    문항 추출 작업을 수행하는 Celery 태스크
    
    Args:
        ingestion_job_id: IngestionJob의 UUID 문자열
    """
    from django.db import transaction

    try:
        job = IngestionJob.objects.select_related("source_document").get(id=ingestion_job_id)
        doc = job.source_document

        # 작업 시작
        job.status = "processing"
        job.started_at = timezone.now()
        job.save()

        if not pdf_page_to_image or not process_page_image:
            raise ImportError("extract_problems 모듈을 임포트할 수 없습니다.")

        # 파일 경로 확인
        if not doc.file:
            raise ValueError("소스 문서 파일이 없습니다.")

        file_path = doc.file.path
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"파일을 찾을 수 없습니다: {file_path}")

        # PDF 열기
        import fitz  # PyMuPDF
        pdf_doc = fitz.open(file_path)
        page_count = len(pdf_doc)

        # 페이지 수 업데이트
        doc.page_count = page_count
        doc.save()

        total_problems = 0
        problems_created = []

        # 각 페이지 처리
        for page_num in range(1, page_count + 1):
            try:
                page = pdf_doc[page_num - 1]
                img = pdf_page_to_image(page, dpi=150)

                # 임시 디렉터리에 크롭 이미지 저장
                import tempfile
                import cv2
                import numpy as np

                with tempfile.TemporaryDirectory() as temp_dir:
                    temp_path = Path(temp_dir)
                    page_out_dir = temp_path / f"page{page_num}"
                    page_out_dir.mkdir(parents=True, exist_ok=True)

                    # 문항 추출
                    count = process_page_image(img, page_out_dir, debug=False)

                    # 추출된 문항 이미지를 Problem으로 저장
                    for idx in range(1, count + 1):
                        crop_file = page_out_dir / f"{idx}.png"
                        if crop_file.exists():
                            with open(crop_file, "rb") as f:
                                image_content = f.read()

                            # Problem 생성
                            problem = Problem.objects.create(
                                organization=doc.organization,
                                source_document=doc,
                                problem_number=total_problems + idx,
                                page_number=page_num,
                                is_public=False,  # 검수 전까지 비공개
                            )

                            # 이미지 파일 저장
                            image_filename = f"problem_{problem.id}_{page_num}_{idx}.png"
                            problem.image_file.save(
                                image_filename,
                                ContentFile(image_content),
                                save=True,
                            )

                            problems_created.append(problem.id)

                            # ReviewTask 생성
                            review_task = ReviewTask.objects.create(
                                problem=problem,
                                ingestion_job=job,
                                status="pending",
                            )
                            
                            # 자동 태깅 실행
                            from .tagging import auto_tag_problem
                            try:
                                auto_tag_problem(str(problem.id), use_real_llm=False)
                            except Exception as e:
                                import logging
                                logger = logging.getLogger(__name__)
                                logger.error(f"문항 {problem.id} 자동 태깅 실패: {str(e)}")

                    total_problems += count

                # 진행률 업데이트
                progress = int((page_num / page_count) * 100)
                job.progress = progress
                job.pages_processed = page_num
                job.problems_extracted = total_problems
                job.save()

                # Celery 진행률 업데이트
                self.update_state(
                    state="PROGRESS",
                    meta={
                        "progress": progress,
                        "pages_processed": page_num,
                        "problems_extracted": total_problems,
                    },
                )

            except Exception as e:
                # 페이지 처리 실패 시 로그만 남기고 계속 진행
                import logging

                logger = logging.getLogger(__name__)
                logger.error(f"페이지 {page_num} 처리 실패: {str(e)}")

        pdf_doc.close()

        # 작업 완료
        job.status = "completed"
        job.progress = 100
        job.completed_at = timezone.now()
        job.save()

        doc.status = "completed"
        doc.save()

        return {
            "status": "completed",
            "pages_processed": page_count,
            "problems_extracted": total_problems,
            "problem_ids": problems_created,
        }

    except Exception as e:
        # 작업 실패
        job.status = "failed"
        job.error_message = str(e)
        job.completed_at = timezone.now()
        job.save()

        if doc:
            doc.status = "failed"
            doc.save()

        raise


@shared_task
def retry_ingestion_job(ingestion_job_id: str):
    """
    실패한 추출 작업을 재시도
    
    Args:
        ingestion_job_id: IngestionJob의 UUID 문자열
    """
    from .models import IngestionJob

    job = IngestionJob.objects.get(id=ingestion_job_id)
    job.status = "pending"
    job.error_message = None
    job.started_at = None
    job.completed_at = None
    job.progress = 0
    job.pages_processed = 0
    job.problems_extracted = 0
    job.save()

    # 새 작업으로 큐에 등록
    extract_problems_task.delay(str(job.id))
