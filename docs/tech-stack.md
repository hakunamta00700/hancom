# 기술스택 문서

**버전**: 1.0  
**작성일**: 2026-01-27  
**관련 문서**: [PRD](prd.md), [아키텍처](architecture.md)

---

## 1. 기술스택 개요

현재 프로젝트는 Python 기반으로 시작되었으며 (`extract_problems.py`, `pyproject.toml` 참조), 이를 기반으로 MVP 기술스택을 제안합니다.

---

## 2. 백엔드 스택

### 2.1 API 프레임워크

**추천: FastAPI**

**이유**:
- Python 기반 (기존 코드와 호환)
- 자동 API 문서 생성 (Swagger/OpenAPI)
- 비동기 지원 (높은 성능)
- 타입 힌팅 지원
- 빠른 개발 속도

**대안**:
- **Django REST Framework**: 더 무거우나 풍부한 기능, 관리자 페이지 내장
- **Flask**: 가볍지만 더 많은 설정 필요

**트레이드오프**:
- FastAPI: 현대적이고 빠르지만 생태계가 Django보다 작음
- Django: 검증된 프레임워크이지만 더 무거움

---

### 2.2 데이터베이스

**추천: PostgreSQL**

**이유**:
- 관계형 데이터베이스 (복잡한 쿼리 지원)
- JSONB 지원 (유연한 스키마)
- 풀텍스트 검색 지원 (tsvector)
- 확장성 및 성능
- 오픈소스

**대안**:
- **SQLite**: 개발 초기 단계에서 사용 가능 (단일 파일, 설정 간단)
- **MySQL/MariaDB**: PostgreSQL과 유사하나 JSON 지원이 약함

**트레이드오프**:
- PostgreSQL: 프로덕션에 적합하나 설정이 복잡
- SQLite: 개발 초기에는 빠르게 시작 가능하나 확장성 제한

**마이그레이션 전략**:
- 개발 초기: SQLite로 시작
- 프로덕션: PostgreSQL로 전환

---

### 2.3 캐시 및 작업 큐

**추천: Redis**

**이유**:
- 캐시와 작업 큐 모두 지원
- 빠른 성능
- 다양한 데이터 구조 지원
- 널리 사용됨

**대안**:
- **RabbitMQ**: 메시지 큐에 특화되어 있으나 캐시 기능 없음
- **Memcached**: 캐시에만 특화

**트레이드오프**:
- Redis: 범용적이지만 메시지 큐 기능이 RabbitMQ보다 약함
- RabbitMQ: 메시지 큐에 강하나 캐시는 별도 필요

---

### 2.4 작업 큐 프레임워크

**추천: Celery**

**이유**:
- Python 생태계에서 표준
- Redis/RabbitMQ 등 다양한 브로커 지원
- 작업 모니터링 도구 (Flower)
- 재시도, 스케줄링 등 고급 기능

**대안**:
- **RQ (Redis Queue)**: 더 간단하나 기능이 제한적
- **Dramatiq**: Celery보다 빠르나 생태계가 작음

**트레이드오프**:
- Celery: 기능이 풍부하나 설정이 복잡
- RQ: 간단하나 고급 기능 부족

**선택 기준**:
- MVP: RQ로 시작 (간단함)
- 프로덕션: Celery로 전환 (고급 기능 필요 시)

---

### 2.5 ORM

**추천: SQLAlchemy**

**이유**:
- Python에서 가장 널리 사용됨
- FastAPI와 잘 통합됨
- 유연한 쿼리 작성
- 마이그레이션 도구 (Alembic)

**대안**:
- **Django ORM**: Django 사용 시 자동 포함
- **Tortoise ORM**: 비동기 지원하나 생태계가 작음

**트레이드오프**:
- SQLAlchemy: 검증된 ORM이지만 학습 곡선 존재
- Django ORM: Django 사용 시 편리하나 Django에 종속

---

## 3. 프론트엔드 스택

### 3.1 프레임워크

**추천: Next.js**

**이유**:
- React 기반 (널리 사용됨)
- 서버 사이드 렌더링 (SSR) 지원
- API 라우트 지원 (백엔드와 통합 용이)
- 자동 코드 스플리팅
- SEO 친화적

**대안**:
- **React (CRA)**: 더 간단하나 SSR 없음
- **Vue.js (Nuxt.js)**: React 대안
- **SvelteKit**: 더 가볍고 빠름

**트레이드오프**:
- Next.js: 기능이 풍부하나 설정이 복잡
- CRA: 간단하나 SSR 없음

---

### 3.2 UI 라이브러리

**추천: Tailwind CSS + shadcn/ui**

**이유**:
- 유틸리티 퍼스트 CSS (빠른 개발)
- 커스터마이징 용이
- 접근성 고려된 컴포넌트 (shadcn/ui)
- TypeScript 지원

**대안**:
- **Material-UI (MUI)**: 풍부한 컴포넌트이지만 무거움
- **Chakra UI**: 간단하고 접근성 좋음
- **Ant Design**: 엔터프라이즈 스타일

**트레이드오프**:
- Tailwind: 빠른 개발이지만 디자인 시스템 구축 필요
- MUI: 즉시 사용 가능하나 커스터마이징 어려움

---

### 3.3 상태 관리

**추천: React Query (TanStack Query)**

**이유**:
- 서버 상태 관리에 특화
- 캐싱 및 동기화 자동 처리
- 로딩/에러 상태 관리
- FastAPI와 잘 통합

**대안**:
- **Zustand**: 간단한 전역 상태 관리
- **Redux**: 복잡한 상태 관리 필요 시

**트레이드오프**:
- React Query: 서버 상태에 특화되어 있으나 클라이언트 상태는 별도 필요
- Zustand: 간단하나 서버 상태 동기화는 수동 처리

---

## 4. 파일 처리 스택

### 4.1 PDF 처리

**추천: PyMuPDF (fitz)**

**이유**:
- 현재 프로젝트에서 이미 사용 중 (`extract_problems.py`)
- 빠른 성능
- PDF → 이미지 변환 지원
- 텍스트 추출 지원

**대안**:
- **pdf2image**: PIL 기반, 더 간단하나 기능 제한적
- **PyPDF2**: 텍스트 추출에 특화

**트레이드오프**:
- PyMuPDF: 기능이 풍부하나 라이선스 확인 필요 (AGPL)
- pdf2image: 간단하나 기능 제한적

---

### 4.2 이미지 처리

**추천: OpenCV + PIL**

**이유**:
- 현재 프로젝트에서 이미 사용 중 (`extract_problems.py`)
- 레이아웃 분석에 적합
- 다양한 이미지 처리 기능

**대안**:
- **scikit-image**: 과학 계산에 특화
- **Pillow만**: 간단한 작업에 충분

**트레이드오프**:
- OpenCV: 강력하나 학습 곡선 존재
- Pillow: 간단하나 고급 기능 부족

---

### 4.3 OCR

**추천: EasyOCR**

**이유**:
- 현재 프로젝트에서 이미 사용 중 (`extract_problems.py`)
- 한국어/영어 지원
- GPU 가속 지원
- 사용하기 쉬움

**대안**:
- **Tesseract**: 오픈소스, 한국어 지원 약함
- **PaddleOCR**: 한국어에 강하나 설정 복잡
- **Google Cloud Vision API**: 클라우드 서비스, 비용 발생

**트레이드오프**:
- EasyOCR: 사용하기 쉬우나 모델 크기가 큼
- Tesseract: 가볍지만 한국어 정확도 낮음
- Cloud API: 정확도 높으나 비용 발생

---

### 4.4 HWP 처리

**추천: Windows 전용 마이크로서비스**

**이유**:
- HWP는 Windows/한컴 오피스에 종속
- 현재 프로젝트에 실험 코드 존재 (`main.py`, `main2.py`, `main3.py`)
- 다른 서비스와 분리하여 운영

**구현 옵션**:
1. **pyhwpx**: Python 라이브러리 (Windows 전용)
2. **win32com**: COM 인터페이스 (Windows 전용)
3. **별도 Windows 서버**: 마이크로서비스로 분리

**트레이드오프**:
- Windows 전용: HWP 처리 가능하나 인프라 복잡도 증가
- 클라우드 서비스: 비용 발생

---

## 5. LLM 통합

### 5.1 LLM API

**추천: OpenAI GPT-4 또는 Claude**

**이유**:
- 높은 정확도
- 한국어 지원
- API 사용 간편
- 프롬프트 버전 관리 가능

**대안**:
- **자체 모델**: 비용 절감하나 인프라 필요
- **오픈소스 모델 (Llama)**: 비용 없으나 성능 제한

**트레이드오프**:
- Cloud API: 높은 성능이지만 비용 발생
- 자체 모델: 비용 절감하나 인프라 및 유지보수 필요

---

### 5.2 프롬프트 관리

**추천: LangChain 또는 직접 관리**

**이유**:
- 프롬프트 버전 관리
- A/B 테스트 가능
- 재사용 가능한 템플릿

**구현**:
- 데이터베이스에 프롬프트 템플릿 저장
- 버전 관리 및 변경 이력 추적

---

## 6. 파일 스토리지

### 6.1 객체 스토리지

**추천: MinIO (로컬) 또는 AWS S3 (프로덕션)**

**이유**:
- S3 호환 API
- 확장 가능
- 버전 관리 지원

**대안**:
- **로컬 파일 시스템**: 개발 초기 단계
- **Google Cloud Storage**: AWS 대안

**트레이드오프**:
- MinIO: 로컬 개발에 적합하나 프로덕션에서는 관리 필요
- AWS S3: 관리형 서비스이지만 비용 발생

**마이그레이션 전략**:
- 개발: MinIO 또는 로컬 파일 시스템
- 프로덕션: AWS S3 또는 유사 서비스

---

## 7. 모니터링 및 관측성

### 7.1 로깅

**추천: structlog + ELK 스택**

**이유**:
- 구조화된 로깅
- 중앙 집중식 로그 관리
- 검색 및 분석 용이

**대안**:
- **Python logging**: 간단하나 중앙 집중화 없음
- **Sentry**: 에러 추적에 특화

---

### 7.2 메트릭

**추천: Prometheus + Grafana**

**이유**:
- 표준 메트릭 수집 도구
- 풍부한 시각화
- 알림 지원

**대안**:
- **Datadog**: 관리형 서비스이지만 비용 발생
- **New Relic**: APM에 특화

---

### 7.3 에러 추적

**추천: Sentry**

**이유**:
- 자동 에러 추적
- 스택 트레이스 분석
- 알림 지원

**대안**:
- **Rollbar**: Sentry 대안
- **자체 구축**: 비용 절감하나 개발 필요

---

## 8. 인증 및 보안

### 8.1 인증

**추천: JWT (JSON Web Token)**

**이유**:
- Stateless 인증
- 확장 가능
- 널리 사용됨

**라이브러리**:
- Python: `python-jose` 또는 `PyJWT`
- JavaScript: `jsonwebtoken`

**대안**:
- **세션 기반**: 간단하나 확장성 제한
- **OAuth 2.0**: 외부 인증 필요 시

---

### 8.2 비밀번호 암호화

**추천: bcrypt**

**이유**:
- 안전한 해싱 알고리즘
- Python에서 널리 사용되는 검증된 라이브러리
- 널리 사용됨

---

## 9. 배포 및 인프라

### 9.1 컨테이너화

**추천: Docker**

**이유**:
- 환경 일관성
- 배포 간편화
- 확장 가능

**대안**:
- **Podman**: Docker 대안
- **직접 배포**: 간단하나 환경 관리 어려움

---

### 9.2 오케스트레이션

**MVP: Docker Compose**

**이유**:
- 간단한 설정
- 로컬 개발 용이
- 단일 서버 배포에 적합

**프로덕션: Kubernetes**

**이유**:
- 수평 확장
- 자동 복구
- 서비스 디스커버리

**대안**:
- **Docker Swarm**: Kubernetes보다 간단
- **Nomad**: HashiCorp의 오케스트레이션 도구

---

### 9.3 CI/CD

**추천: GitHub Actions**

**이유**:
- GitHub 통합
- 무료 (공개 저장소)
- 다양한 액션 사용 가능

**대안**:
- **GitLab CI**: GitLab 사용 시
- **Jenkins**: 자체 호스팅 필요

---

## 10. 개발 도구

### 10.1 코드 품질

**추천:**
- **Black**: 코드 포맷팅
- **isort**: import 정렬
- **mypy**: 타입 체킹
- **pytest**: 테스트 프레임워크

**이유**:
- 현재 프로젝트 규칙에 명시됨
- Python 생태계 표준

---

### 10.2 API 문서

**추천: FastAPI 자동 생성**

**이유**:
- Swagger/OpenAPI 자동 생성
- 인터랙티브 문서
- 추가 도구 불필요

---

## 11. 기술스택 요약표

| 카테고리 | 기술 | 대안 | 선택 기준 |
|---------|------|------|----------|
| API 프레임워크 | FastAPI | Django REST Framework | 빠른 개발, 비동기 |
| 데이터베이스 | PostgreSQL | SQLite (개발) | 확장성, JSONB 지원 |
| 캐시/큐 | Redis | RabbitMQ | 범용성 |
| 작업 큐 | Celery | RQ | 고급 기능 필요 시 |
| ORM | SQLAlchemy | Django ORM | FastAPI 통합 |
| 프론트엔드 | Next.js | React (CRA) | SSR 필요 |
| UI 라이브러리 | Tailwind CSS | Material-UI | 빠른 개발 |
| PDF 처리 | PyMuPDF | pdf2image | 현재 사용 중 |
| 이미지 처리 | OpenCV + PIL | Pillow만 | 레이아웃 분석 필요 |
| OCR | EasyOCR | Tesseract | 한국어 지원 |
| LLM | OpenAI/Claude | 자체 모델 | 정확도 우선 |
| 파일 스토리지 | MinIO/S3 | 로컬 파일 시스템 | 확장성 |
| 모니터링 | Prometheus + Grafana | Datadog | 오픈소스 |
| 에러 추적 | Sentry | Rollbar | 자동 추적 |
| 컨테이너 | Docker | Podman | 표준 |
| CI/CD | GitHub Actions | GitLab CI | GitHub 통합 |

---

## 12. 마이그레이션 전략

### 12.1 개발 단계
- SQLite (데이터베이스)
- MinIO 또는 로컬 파일 시스템
- RQ (작업 큐, 간단함)

### 12.2 프로덕션 단계
- PostgreSQL (데이터베이스)
- AWS S3 또는 유사 서비스
- Celery (작업 큐, 고급 기능)

---

## 13. 참고 문서

- [PRD](prd.md)
- [아키텍처](architecture.md)
- [요구사항](requirements.md)
