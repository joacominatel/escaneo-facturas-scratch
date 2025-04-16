import os
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

def create_celery_app():
    celery = Celery(
        __name__,
        broker=os.getenv("REDIS_URL"),
        backend=os.getenv("REDIS_URL")
    )
    celery.conf.update(
        task_serializer='json',
        accept_content=['json'],
        result_serializer='json',
        timezone='UTC',
        enable_utc=True
    )
    return celery

celery = create_celery_app()
