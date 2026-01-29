"""
Celery 설정
"""

import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hancom_backend.settings")

app = Celery("hancom_backend")

# Redis를 브로커로 사용
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))

app.config_from_object("django.conf:settings", namespace="CELERY")
app.conf.broker_url = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"
app.conf.result_backend = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"

# 자동으로 tasks 모듈을 찾아서 등록
app.autodiscover_tasks()
