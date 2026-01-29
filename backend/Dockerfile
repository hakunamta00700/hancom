FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_SYSTEM_PYTHON=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# uv 설치
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# pyproject.toml과 uv.lock 복사 (의존성 설치용)
COPY pyproject.toml uv.lock ./

# uv를 사용하여 패키지 설치 (pyproject.toml의 dependencies 설치)
# uv pip install은 pyproject.toml을 읽어 dependencies를 설치합니다
RUN uv pip install --system --no-cache -e .

# 애플리케이션 코드 복사
COPY backend/ ./backend/

WORKDIR /app/backend

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
