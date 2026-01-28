# -*- coding: utf-8 -*-
"""
테스트 공용 fixture 및 설정.

docs/test-cases.md, docs/test-scenarios.md의 TC-LEGACY-* 및
추가 API/통합 테스트에서 사용할 fixture를 정의한다.
"""
from __future__ import annotations

from pathlib import Path

import pytest


# 프로젝트 루트 (tests/ 기준 상위)
PROJECT_ROOT = Path(__file__).resolve().parent.parent


@pytest.fixture
def project_root() -> Path:
    """프로젝트 루트 경로."""
    return PROJECT_ROOT


@pytest.fixture
def sample_page_path(project_root: Path) -> Path:
    """TC-LEGACY-003/004용 샘플 페이지 이미지 경로 (samples/sample_page.png)."""
    p = project_root / "samples" / "sample_page.png"
    if not p.exists():
        pytest.skip(reason="samples/sample_page.png 가 없음")
    return p
