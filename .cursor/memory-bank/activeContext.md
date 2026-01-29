# Active Context

## 현재 작업 포커스
- Docker Compose로 **백엔드 + 프론트엔드 동시 실행**이 가능하도록 구성

## 최근 변경
- `docker-compose.yml`에 `frontend` 서비스 추가
- `frontend/Dockerfile`, `frontend/.dockerignore` 추가

## 다음 단계(필요 시)
- 프론트에서 API 호출 규칙(환경변수 키/사용 위치) 확정
- 백엔드 마이그레이션/초기데이터/헬스체크(예: `depends_on` + `healthcheck`) 도입 여부 결정

