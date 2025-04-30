FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Configuración para limitar el consumo de memoria de Python
ENV PYTHONMALLOC=malloc
# ENV PYTHONDEVMODE=1 # Desactivado para producción

WORKDIR /app

# Instalar dependencias de sistema en un solo paso
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    tesseract-ocr \
    tesseract-ocr-spa \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copiar solo requirements.txt primero para optimizar caché
COPY requirements.txt ./
# Instalar dependencias Python
RUN pip install --no-cache-dir -r requirements.txt

# Crear un usuario y grupo no root
RUN addgroup --system app && adduser --system --group app

# Copiar el resto del código al final para usar mejor caché
COPY . .

# Cambiar propietario de los archivos de la app
RUN chown -R app:app /app

# Cambiar al usuario no root
USER app

# Ejecutar con max-tasks-per-child para evitar memory leaks y prefetch=1 para mejor equilibrio de carga
CMD ["celery", "-A", "app.core.celery_app.celery", "worker", "--loglevel=info", "--concurrency=2", "--max-tasks-per-child=50", "--prefetch-multiplier=1", "--time-limit=300"]
