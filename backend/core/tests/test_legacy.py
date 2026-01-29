"""
기존 추출 스크립트 관련 테스트 (TC-LEGACY-001~004)
"""

from django.test import TestCase
import sys
from pathlib import Path

# extract_problems.py가 프로젝트 루트에 있다고 가정
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

try:
    from extract_problems import parse_range

    EXTRACT_AVAILABLE = True
except ImportError:
    EXTRACT_AVAILABLE = False


class LegacyTestCase(TestCase):
    def setUp(self):
        if not EXTRACT_AVAILABLE:
            self.skipTest("extract_problems 모듈을 사용할 수 없습니다.")

    def test_parse_range_all(self):
        """TC-LEGACY-001: parse_range 정상·경계 - 'all'"""
        result = parse_range("all", 10)
        self.assertEqual(result, list(range(1, 11)))

    def test_parse_range_range(self):
        """TC-LEGACY-001: parse_range 정상·경계 - '1-5'"""
        result = parse_range("1-5", 10)
        self.assertEqual(result, [1, 2, 3, 4, 5])

    def test_parse_range_single(self):
        """TC-LEGACY-001: parse_range 정상·경계 - 단일 숫자"""
        result = parse_range("3", 10)
        self.assertEqual(result, [3])

    def test_parse_range_clamping(self):
        """TC-LEGACY-001: parse_range 정상·경계 - 클램핑"""
        result = parse_range("8-12", 10)
        self.assertEqual(result, [8, 9, 10])

        result = parse_range("1-5", 3)
        self.assertEqual(result, [1, 2, 3])

    def test_parse_range_invalid_format(self):
        """TC-LEGACY-002: parse_range 잘못된 형식 시 예외"""
        from click import BadParameter

        with self.assertRaises(BadParameter):
            parse_range("a-b", 10)

        with self.assertRaises(BadParameter):
            parse_range("1-5-3", 10)

        with self.assertRaises(BadParameter):
            parse_range("", 10)
