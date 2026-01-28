# -*- coding: utf-8 -*-
"""
TC-LEGACY-001, TC-LEGACY-002: extract_problems.parse_range 단위 테스트.

docs/test-cases.md TC-LEGACY-001/002, docs/test-scenarios.md TS-LEGACY-001/002
"""
from __future__ import annotations

import pytest
import click

from extract_problems import parse_range


# --- TC-LEGACY-001: parse_range 정상·경계 ---


@pytest.mark.unit
def test_parse_range_all_returns_full_range() -> None:
    """TC-LEGACY-001: parse_range('all', max_page) → [1..max_page]."""
    assert parse_range("all", 10) == list(range(1, 11))
    assert parse_range("ALL", 3) == [1, 2, 3]


@pytest.mark.unit
def test_parse_range_interval() -> None:
    """TC-LEGACY-001: parse_range('1-5', 10) → [1,2,3,4,5]."""
    assert parse_range("1-5", 10) == [1, 2, 3, 4, 5]


@pytest.mark.unit
def test_parse_range_single_page() -> None:
    """TC-LEGACY-001: parse_range('3', 10) → [3]."""
    assert parse_range("3", 10) == [3]


@pytest.mark.unit
def test_parse_range_clamping_end_exceeds_max() -> None:
    """TC-LEGACY-001: parse_range('8-12', 10) → [8,9,10] (클램핑)."""
    assert parse_range("8-12", 10) == [8, 9, 10]


@pytest.mark.unit
def test_parse_range_clamping_interval_larger_than_max() -> None:
    """TC-LEGACY-001: parse_range('1-5', 3) → [1,2,3]."""
    assert parse_range("1-5", 3) == [1, 2, 3]


@pytest.mark.unit
def test_parse_range_reversed_interval_normalized() -> None:
    """TC-LEGACY-001: start > end 이면 교환되어 반환 (구현: start,end swap)."""
    # extract_problems.parse_range 에서 start > end 시 swap 함
    assert parse_range("5-1", 10) == [1, 2, 3, 4, 5]


# --- TC-LEGACY-002: parse_range 잘못된 형식 시 예외 ---


@pytest.mark.unit
def test_parse_range_invalid_format_letters_raises() -> None:
    """TC-LEGACY-002: parse_range('a-b', 10) → BadParameter."""
    with pytest.raises(click.BadParameter) as exc_info:
        parse_range("a-b", 10)
    assert "형식" in str(exc_info.value) or "예:" in str(exc_info.value)


@pytest.mark.unit
def test_parse_range_invalid_format_triple_raises() -> None:
    """TC-LEGACY-002: parse_range('1-5-3', 10) → BadParameter."""
    with pytest.raises(click.BadParameter) as exc_info:
        parse_range("1-5-3", 10)
    assert "형식" in str(exc_info.value) or "예:" in str(exc_info.value)


@pytest.mark.unit
def test_parse_range_empty_raises() -> None:
    """TC-LEGACY-002: parse_range('', 10) → BadParameter."""
    with pytest.raises(click.BadParameter) as exc_info:
        parse_range("", 10)
    assert "형식" in str(exc_info.value) or "예:" in str(exc_info.value)
