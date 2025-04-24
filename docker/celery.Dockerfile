FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Configuración para limitar el consumo de memoria de Python
ENV PYTHONMALLOC=malloc
ENV PYTHONDEVMODE=1

WORKDIR /app

# Instalar dependencias de sistema en un solo paso
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    tesseract-ocr \
    tesseract-ocr-spa \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias Python
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código al final para usar mejor caché
COPY . .

# Ejecutar con max-tasks-per-child para evitar memory leaks y prefetch=1 para mejor equilibrio de carga
CMD ["celery", "-A", "app.core.celery_app.celery", "worker", "--loglevel=info", "--concurrency=2", "--max-tasks-per-child=50", "--prefetch-multiplier=1", "--time-limit=300"]
