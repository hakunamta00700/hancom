# 테스트

`docs/test-scenarios.md`, `docs/test-cases.md`를 기준으로 테스트 코드를 두고 있다.

## 실행 방법

프로젝트 루트에서:

```bash
# 전체
pytest tests/ -v

# 단위만 (빠름, OCR/이미지 불필요)
pytest tests/unit -v

# 통합만 (EasyOCR·samples/sample_page.png 사용, 상대적으로 느림)
pytest tests/integration -v

# 마커로 구분
pytest tests/ -v -m unit
pytest tests/ -v -m integration
```

의존성은 `uv sync`(또는 `uv sync --extra dev`)로 설치한다. pytest는 `pyproject.toml`에 포함되어 있다.

## 구현된 테스트 케이스

| TC-ID | 파일 | 설명 |
|-------|------|------|
| TC-LEGACY-001 | `unit/test_legacy_parse_range.py` | `parse_range` 정상·경계 (all, 1-5, 단일, 클램핑) |
| TC-LEGACY-002 | `unit/test_legacy_parse_range.py` | `parse_range` 잘못된 형식 시 `BadParameter` |
| TC-LEGACY-003 | `integration/test_legacy_process_page.py` | `process_page_image` 블록 수 ≥ 1, 저장 크롭 수와 일치 |
| TC-LEGACY-004 | `integration/test_legacy_process_page.py` | 크롭 파일 비어 있지 않음 등 최소 검증 |

통합 테스트는 `samples/sample_page.png`가 있을 때만 실행되며, EasyOCR 모델 로딩으로 인해 첫 실행 시 지연이 있을 수 있다.
