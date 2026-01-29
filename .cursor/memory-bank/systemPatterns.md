# System Patterns

## 아키텍처 패턴(문서 기준)
- MVP: 모놀리식 + 비동기 작업 큐(장기적으로 마이크로서비스 확장)
- 데이터: PostgreSQL, 캐시/큐: Redis

## 컨테이너/개발 패턴
- `docker-compose.yml`로 로컬에서 백엔드/프론트/DB/Redis를 함께 실행
- 서비스 간 통신은 compose 네트워크의 **서비스명**(`backend`, `db`, `redis`)을 우선 사용

