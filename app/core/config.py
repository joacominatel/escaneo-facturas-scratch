import os
from dotenv import load_dotenv

load_dotenv('.env')

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'fallback_secret')
    DEBUG = os.getenv('FLASK_DEBUG', 'False') == 'True'
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PORT = int(os.getenv('PORT', 8010))
    # Configuración para SocketIO y Celery
    # Usar 'redis' como host por defecto si corre en Docker y no se define en .env
    SOCKETIO_MESSAGE_QUEUE = os.getenv('SOCKETIO_MESSAGE_QUEUE', 'redis://redis:6379/0')
    CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://redis:6379/1')
    CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://redis:6379/2')
    
    # Configuración de caché con Redis
    CACHE_TYPE = os.getenv('CACHE_TYPE', 'redis')
    CACHE_REDIS_URL = os.getenv('CACHE_REDIS_URL', 'redis://redis:6379/3')
    CACHE_DEFAULT_TIMEOUT = int(os.getenv('CACHE_DEFAULT_TIMEOUT', 3600))  # 1 hora por defecto