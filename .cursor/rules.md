# 개발 규칙 및 문제 해결 가이드

이 문서는 개발 과정에서 발생한 문제와 해결 방법을 기록합니다.

## Git 커밋 메시지

### 한글 커밋 메시지 작성 방법
- Windows 환경에서 한글 커밋 메시지를 안전하게 저장하는 방법:
  1. 절대 터미널에서 직접 `-m` 옵션으로 한글 입력하지 말 것
  2. 커밋 메시지를 UTF-8로 저장된 파일로 작성
  3. `git commit -F commit-msg.txt` 사용
  4. 예시:
     ```powershell
     # 커밋 메시지 파일 생성
     echo "docs: user-stories.md 최신화" > commit-msg.txt
     git add .
     git commit -F commit-msg.txt
     ```

## 개발 환경 설정

### Docker Compose 실행
```powershell
docker-compose up -d
```

### 백엔드 마이그레이션
```powershell
cd backend
python manage.py migrate
```

### 프론트엔드 개발 서버
```powershell
cd frontend
npm run dev
```

## API 개발 패턴

### Django REST Framework ViewSet 패턴
- `viewsets.ModelViewSet` 사용 시 기본 CRUD 자동 생성
- 커스텀 액션은 `@action` 데코레이터 사용
- 예시:
  ```python
  @action(detail=True, methods=["post"])
  def approve(self, request, pk=None):
      # 커스텀 로직
      pass
  ```

### 프론트엔드 API 클라이언트 패턴
- `lib/api/client.ts`의 `apiClient` 사용
- 각 도메인별로 별도 파일 생성 (예: `lib/api/problems.ts`)
- 타입 정의는 각 API 파일에 함께 작성

## 문제 해결 기록

### 문제 발생 시 기록 형식
```
## [날짜] 문제 제목
**상황**: 어떤 작업을 하려고 했는지
**에러**: 발생한 에러 메시지 또는 문제 상황
**해결**: 어떻게 해결했는지
**참고**: 추가로 알아둘 사항
```

---

## 기록된 문제들

### 2026-01-29: Git 커밋 메시지 한글 깨짐 방지
**상황**: 한글 커밋 메시지를 직접 `-m` 옵션으로 입력하려고 함
**에러**: 커밋 메시지가 깨져서 저장됨
**해결**: UTF-8 인코딩된 텍스트 파일을 사용하여 `git commit -F` 명령어로 커밋
**참고**: Windows 환경에서는 특히 주의 필요

### 2026-01-29: Django REST Framework URL 패턴
**상황**: `@action` 데코레이터로 정의된 커스텀 액션의 URL 패턴 확인 필요
**에러**: 없음 (예방적 기록)
**해결**: DRF router에서 `@action` 메서드는 기본적으로 언더스코어(`_`)를 하이픈(`-`)으로 변환하여 URL 생성
  - 예: `incorrect_answers` 메서드 → `/api/v1/exam-attempts/incorrect-answers/` 엔드포인트
**참고**: `detail=False`인 경우 리소스 목록 레벨, `detail=True`인 경우 특정 리소스 레벨에 액션 추가

### 2026-01-29: Next.js 동적 라우팅과 쿼리 파라미터
**상황**: 학생 시험지 풀이 페이지에서 `attempt` ID를 쿼리 파라미터로 전달
**에러**: 없음
**해결**: `useSearchParams()` 훅을 사용하여 쿼리 파라미터 읽기
  - 예: `/student/exams?attempt=123` → `searchParams.get("attempt")`
**참고**: Next.js 13+ App Router에서는 `useSearchParams()`가 클라이언트 컴포넌트에서만 사용 가능

### 2026-01-29: Django F() 표현식을 사용한 순서 업데이트
**상황**: 문항 순서 변경 시 다른 문항들의 순서를 자동으로 조정해야 함
**에러**: 없음 (예방적 기록)
**해결**: Django의 `F()` 표현식을 사용하여 데이터베이스 레벨에서 순서 업데이트
  - 예: `ExamPaperItem.objects.filter(...).update(order_number=models.F("order_number") - 1)`
**참고**: `F()` 표현식은 데이터베이스 쿼리 레벨에서 계산되므로 성능이 좋고 race condition을 방지함

### 2026-01-29: React에서 즉시 실행 함수(IIFE) 사용
**상황**: JSX에서 복잡한 로직(정렬 등)을 수행한 후 map을 사용해야 함
**에러**: 없음
**해결**: 즉시 실행 함수(IIFE)를 사용하여 JSX 내에서 복잡한 로직 처리
  - 예: `{(() => { const sorted = [...items].sort(...); return sorted.map(...); })()}`
**참고**: JSX 내에서 직접 정렬/필터링을 하면 매 렌더링마다 실행되므로, useMemo를 사용하는 것이 더 효율적일 수 있음
