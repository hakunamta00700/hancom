# -*- coding: utf-8 -*-
"""
TC-LEGACY-003, TC-LEGACY-004: extract_problems.process_page_image 통합 테스트.

docs/test-cases.md TC-LEGACY-003/004, docs/test-scenarios.md TS-LEGACY-003/004
"""
from __future__ import annotations

import tempfile
from pathlib import Path

import cv2
import pytest

from extract_problems import process_page_image


# --- TC-LEGACY-003: 한 페이지에서 문항 블록 개수 ---


@pytest.mark.integration
def test_process_page_image_returns_blocks_and_saves_crops(
    sample_page_path: Path,
) -> None:
    """
    TC-LEGACY-003: process_page_image 호출 시 반환 블록 수 ≥ 1,
    저장된 크롭 파일 개수와 반환값이 일치한다.
    """
    img = cv2.imread(str(sample_page_path))
    if img is None:
        pytest.skip(reason="샘플 이미지를 로드할 수 없음")
    with tempfile.TemporaryDirectory() as tmp:
        page_out_dir = Path(tmp)
        count = process_page_image(img, page_out_dir, debug=False)
        assert count >= 1, "블록 개수는 최소 1개"
        # 저장된 크롭 PNG 개수(debug.png 제외) = 반환 count
        crops = [f for f in page_out_dir.glob("*.png") if f.name != "debug.png"]
        assert len(crops) == count, (
            f"저장된 크롭 수({len(crops)})와 반환 블록 수({count}) 일치해야 함"
        )


@pytest.mark.integration
def test_process_page_image_with_debug_saves_debug_image(
    sample_page_path: Path,
) -> None:
    """TC-LEGACY-003 보조: debug=True 시 debug.png가 생성된다."""
    img = cv2.imread(str(sample_page_path))
    if img is None:
        pytest.skip(reason="샘플 이미지를 로드할 수 없음")
    with tempfile.TemporaryDirectory() as tmp:
        page_out_dir = Path(tmp)
        process_page_image(img, page_out_dir, debug=True)
        assert (page_out_dir / "debug.png").exists()


# --- TC-LEGACY-004: 크롭 영역이 문항 단위인지 (최소 검증) ---


@pytest.mark.integration
def test_process_page_image_crop_files_non_empty(
    sample_page_path: Path,
) -> None:
    """
    TC-LEGACY-004 최소 검증: 각 크롭 파일이 비어 있지 않고,
    블록 수만큼 파일이 생성되어 문항 단위 분리가 수행된다.
    """
    img = cv2.imread(str(sample_page_path))
    if img is None:
        pytest.skip(reason="샘플 이미지를 로드할 수 없음")
    with tempfile.TemporaryDirectory() as tmp:
        page_out_dir = Path(tmp)
        count = process_page_image(img, page_out_dir, debug=False)
        crops = sorted(
            (f for f in page_out_dir.glob("*.png") if f.name != "debug.png"),
            key=lambda p: int(p.stem) if p.stem.isdigit() else 0,
        )
        assert len(crops) == count
        for p in crops:
            buf = p.read_bytes()
            assert len(buf) > 0, f"크롭 파일 {p.name} 은 비어 있으면 안 됨"
