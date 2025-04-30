FROM python:3.11-slim

WORKDIR /app

# Copiar solo requirements.txt primero para optimizar caché
COPY requirements.txt ./
# Instalar dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Crear un usuario y grupo no root
RUN addgroup --system app && adduser --system --group app

# Copiar el resto del código
COPY . .

# Cambiar propietario de los archivos de la app
RUN chown -R app:app /app

# Cambiar al usuario no root
USER app

EXPOSE 8010

# Usar log-level 'info' para producción
CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "--bind", "0.0.0.0:8010", "--log-level", "info", "wsgi:app"]
