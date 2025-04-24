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
        enable_utc=True,
        worker_max_tasks_per_child=50,  # Reinicia el worker después de 50 tareas para evitar memory leaks
        worker_prefetch_multiplier=1,   # Cada worker procesa 1 tarea a la vez
        task_acks_late=True,            # Confirma la tarea cuando ha sido completada
        task_time_limit=300,            # Tiempo limite de 5 minutos por tarea
        task_soft_time_limit=240,       # Aviso de timeout a los 4 minutos
        worker_concurrency=2,           # Limita a 2 procesos de trabajo
        broker_pool_limit=5,            # Limita las conexiones al broker
        worker_max_memory_per_child=256*1024,  # Reinicia el worker después de usar 256MB
    )
    return celery

celery = create_celery_app()
