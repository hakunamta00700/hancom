# 백엔드 테스트

## 실행 방법

```bash
# 모든 테스트 실행
python manage.py test

# 특정 테스트 실행
python manage.py test core.tests.test_auth
python manage.py test core.tests.test_problems

# 커버리지 포함 (pytest-cov 필요)
pytest --cov=core --cov-report=html
```

## 테스트 구조

- `test_auth.py`: 인증 관련 테스트 (TC-AUTH-001~005)
- `test_problems.py`: 문항 검색 테스트
- `test_exam_papers.py`: 시험지 관련 테스트
- `test_upload.py`: 파일 업로드 테스트

## 향후 추가 필요

- 통합 테스트 (end-to-end 워크플로우)
- 성능 테스트
- 보안 테스트
