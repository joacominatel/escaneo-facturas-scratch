# Configuración Docker para la Aplicación de Escaneo de Facturas

Este directorio contiene los archivos Dockerfile y la configuración de Docker Compose necesarios para construir y ejecutar la aplicación completa (frontend, backend, worker, base de datos, y caché) en contenedores.

## Requisitos Previos

*   [Docker](https://docs.docker.com/get-docker/)
*   [Docker Compose](https://docs.docker.com/compose/install/) (Generalmente incluido con Docker Desktop)

## Estructura

*   `backend.Dockerfile`: Dockerfile para construir la imagen del servicio backend (Flask/Gunicorn).
*   `celery.Dockerfile`: Dockerfile para construir la imagen del worker Celery.
*   `frontend.Dockerfile`: Dockerfile multi-etapa para construir la imagen de producción del frontend (Next.js).
*   `docker-compose.yml`: (En la raíz del proyecto) Define y orquesta los servicios de la aplicación.
*   `README.md`: Este archivo.

## Variables de Entorno

La aplicación utiliza variables de entorno para la configuración. Docker Compose las carga desde un archivo `.env` ubicado en la raíz del proyecto.

Crea un archivo `.env` en la raíz del proyecto basado en `.env.example` (si existe) o con las siguientes variables mínimas:

```env
# Secret key para Flask (cambia esto por un valor seguro y aleatorio)
SECRET_KEY=tu_super_secreto_aqui

# URL de la Base de Datos (usará el servicio 'mariadb' definido en docker-compose)
DATABASE_URL=mysql+pymysql://root:Root@mariadb/invoices

# URLs de Redis (usará el servicio 'redis' definido en docker-compose)
SOCKETIO_MESSAGE_QUEUE=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# Configuración de Flask (opcional, defaults razonables en config.py)
# FLASK_DEBUG=True
# PORT=8010

```

**Importante:** Asegúrate de que el archivo `.env` esté incluido en tu `.gitignore` para no subir secretos al control de versiones.

## Cómo Construir y Ejecutar

1.  **Navega a la raíz del proyecto** (donde está `docker-compose.yml`).
2.  **Asegúrate de tener el archivo `.env`** configurado como se describe arriba.
3.  **Construye las imágenes y levanta los contenedores:**
    ```bash
    docker-compose up --build -d
    ```
    *   `--build`: Fuerza la reconstrucción de las imágenes si los Dockerfiles o el código fuente han cambiado.
    *   `-d`: Ejecuta los contenedores en segundo plano (detached mode).

4.  **Accede a las aplicaciones:**
    *   Frontend: [http://localhost:3000](http://localhost:3000)
    *   Backend (API): [http://localhost:8010](http://localhost:8010)

## Parar los Contenedores

Para detener los contenedores:

```bash
docker-compose down
```

Para detenerlos y eliminar los volúmenes de datos (¡cuidado, esto borrará los datos de la BD y Redis!):

```bash
docker-compose down -v
```

## Consideraciones

*   **Desarrollo vs. Producción:** La configuración actual monta el código fuente directamente en los contenedores (`backend`, `celery`, `frontend`), lo cual es ideal para desarrollo ya que los cambios se reflejan sin necesidad de reconstruir la imagen (aunque algunos cambios pueden requerir reiniciar el contenedor). Para producción, considera eliminar estos montajes de volumen de código fuente y depender únicamente del código copiado durante el build de la imagen.
*   **Dependencias:** `docker-compose` usa `depends_on` para ordenar el inicio de los contenedores. Sin embargo, esto no garantiza que el servicio interno (ej. la base de datos) esté completamente listo. Para mayor robustez, implementa lógica de espera/reintentos en tus aplicaciones o usa `healthchecks` en `docker-compose.yml`.
*   **Seguridad:** Revisa las variables en `.env` y considera el uso de Docker Secrets para información sensible en entornos de producción. Ejecutar contenedores como usuarios no root es una buena práctica de seguridad (recomendado implementar en los Dockerfiles).
*   **Recursos:** Se han definido límites básicos para el `celery_worker`. Ajusta estos y considera añadir límites para otros servicios según sea necesario para tu entorno. 