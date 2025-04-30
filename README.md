# Sistema Automatizado de Procesamiento de Facturas

Este proyecto automatiza el procesamiento de facturas utilizando una combinación de tecnologías: un backend con Flask, Celery para tareas asíncronas, MariaDB para la base de datos, Redis como broker y caché, OCR (Tesseract) y la API de OpenAI para la extracción inteligente de datos, y un frontend con Next.js.

## Propósito

El objetivo principal es agilizar el manejo de facturas mediante la extracción automática de información relevante de documentos escaneados. Los datos extraídos se estructuran y se exponen a través de una API RESTful, facilitando la integración con otros sistemas y la visualización/validación en el frontend.

## Arquitectura

El sistema sigue una arquitectura desacoplada basada en servicios contenerizados:

1.  **Frontend (Next.js):** Interfaz de usuario web para cargar facturas, ver su estado, validar/editar datos extraídos y visualizar resultados.
2.  **Backend (Flask):** API RESTful que maneja las solicitudes del frontend, gestiona la lógica de negocio inicial (guardar archivo, crear registro en DB), y encola tareas de procesamiento.
3.  **Worker (Celery):** Escucha tareas encoladas por el backend (a través de Redis). Ejecuta el procesamiento intensivo de facturas (OCR y extracción con OpenAI) de forma asíncrona.
4.  **Base de Datos (MariaDB):** Almacena información sobre las facturas, su estado, datos extraídos (previsualización y finales), y logs de procesamiento.
5.  **Broker/Cache (Redis):** Actúa como intermediario de mensajes entre el backend y el worker Celery. También puede usarse como caché para resultados de OCR/OpenAI.
6.  **WebSockets (Flask-SocketIO):** Permite al backend enviar actualizaciones en tiempo real al frontend sobre el progreso del procesamiento y cambios de estado.

## Flujo de Procesamiento de Facturas

1.  **Carga:** El usuario carga uno o más archivos (PDF, JPG, PNG) a través del frontend.
2.  **Recepción API:** El endpoint `POST /api/invoices/ocr` del backend recibe los archivos.
3.  **Validación Inicial:** El backend verifica tipos de archivo, busca duplicados por nombre de archivo y guarda los archivos válidos.
4.  **Registro Inicial:** Crea un registro `Invoice` en MariaDB con estado `processing` para cada archivo aceptado.
5.  **Encolado Tarea:** Encola una tarea `process_invoice_task` en Celery (vía Redis) para cada nueva factura.
6.  **Procesamiento Asíncrono (Worker):**
    *   El worker Celery toma la tarea.
    *   Realiza OCR (Tesseract) en el archivo para extraer texto.
    *   Envía el texto extraído a la API de OpenAI para obtener datos estructurados.
    *   Actualiza el registro `Invoice` en la DB con los `preview_data` (datos extraídos) y el estado `waiting_validation`.
7.  **Notificación Frontend:** El backend (o el worker) emite un evento WebSocket (`invoice_status_update`) para notificar al frontend del cambio de estado.
8.  **Validación Manual (Frontend):**
    *   El usuario ve la factura en estado `waiting_validation` con los datos extraídos (`preview_data`).
    *   El usuario puede editar los `preview_data` (usando `PATCH /api/invoices/<id>/preview`, que emite `invoice_preview_updated` por WebSocket).
    *   El usuario confirma (`POST /confirm`) o rechaza (`POST /reject`) la factura.
9.  **Finalización:**
    *   Si se confirma, el estado cambia a `processed`, `preview_data` se copia a `final_data`.
    *   Si se rechaza, el estado cambia a `rejected`.
    *   Se emite otro evento `invoice_status_update`.
10. **Reintento:** Facturas en estado `failed` (error en el worker) o `rejected` pueden ser reenviadas a procesar (`POST /retry`).

## Tecnologías Utilizadas

*   **Backend:**
    *   Python 3.8+
    *   Flask: Framework web.
    *   Flask-SQLAlchemy: ORM para MariaDB.
    *   Flask-Migrate: Migraciones de esquema de base de datos.
    *   Flask-SocketIO: Integración con WebSockets.
    *   Flask-CORS: Habilitar CORS para el frontend.
*   **Procesamiento Asíncrono:**
    *   Celery: Sistema de colas de tareas distribuidas.
*   **Base de Datos:**
    *   MariaDB (v10.11+): Base de datos relacional.
*   **Broker & Caché:**
    *   Redis (v7+): Broker de mensajes para Celery y caché opcional.
*   **Extracción de Datos:**
    *   Tesseract OCR: Reconocimiento óptico de caracteres.
    *   OpenAI API: Modelo de lenguaje para extracción estructurada.
*   **Frontend:**
    *   Node.js / npm
    *   Next.js (v15+): Framework React para renderizado en servidor y generación estática.
    *   React (v19+): Librería para construir interfaces de usuario.
    *   TypeScript: Superset de JavaScript con tipado estático.
    *   Tailwind CSS (v4+): Framework CSS utility-first.
    *   Shadcn/ui & Radix UI: Componentes UI.
    *   TanStack Table: Para tablas de datos.
    *   Socket.IO Client: Para comunicación WebSocket.
*   **Contenerización y Orquestación:**
    *   Docker & Docker Compose: Para construir, desplegar y gestionar los servicios.

## Configuración y Ejecución (Usando Docker Compose)

1.  **Prerrequisitos:**
    *   Docker y Docker Compose instalados.
    *   Git.
    *   Una clave API de OpenAI.

2.  **Clonar el Repositorio:**
    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```

3.  **Variables de Entorno:**
    *   Crea un archivo `.env` en la raíz del proyecto (al mismo nivel que `docker-compose.yml`).
    *   Define las siguientes variables en el archivo `.env`. **Asegúrate de que no haya espacios alrededor del `=` y que los valores no estén entre comillas (a menos que sean parte del valor mismo).**

        ```dotenv
        # Clave API de OpenAI (obligatoria)
        OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

        # URL de conexión a la base de datos (usar el nombre del servicio de docker-compose)
        DATABASE_URL=mysql+pymysql://root:Root@mariadb:3306/invoices

        # URL de conexión a Redis (usar el nombre del servicio de docker-compose)
        REDIS_URL=redis://redis:6379/0

        # Clave secreta para Flask (genera una cadena aleatoria segura)
        SECRET_KEY=una_cadena_larga_y_aleatoria_para_seguridad

        # Opcional: Habilitar modo debug de Flask (True/False)
        FLASK_DEBUG=True

        # Opcional: Puerto para el backend (debe coincidir con docker-compose)
        # PORT=8010

        # Opcional: Directorio para caché de OCR (si se usa caché en disco)
        # OCR_CACHE_DIR=/app/ocr_cache
        ```

4.  **Construir y Ejecutar Contenedores:**
    *   Abre una terminal en la raíz del proyecto.
    *   Ejecuta:
        ```bash
        docker-compose up --build -d
        ```
    *   Este comando construirá las imágenes Docker (si no existen o si los Dockerfiles han cambiado) e iniciará todos los servicios definidos en `docker-compose.yml` en segundo plano (`-d`).

5.  **Ejecutar Migraciones de Base de Datos:**
    *   Una vez que los contenedores estén en ejecución (especialmente `mariadb` y `flask_backend`), ejecuta las migraciones para crear las tablas en la base de datos:
        ```bash
        docker exec -it flask_backend flask db upgrade
        ```
    *   Es posible que necesites esperar unos segundos después de `docker-compose up` para que el servicio de base de datos esté completamente listo antes de ejecutar este comando.

6.  **Acceder a la Aplicación:**
    *   **Frontend:** Abre tu navegador y ve a `http://localhost:3000`.
    *   **Backend API:** La API estará disponible en `http://localhost:8010` (o el puerto que hayas configurado). Por ejemplo, `http://localhost:8010/api/invoices/status-summary/`.

## API Endpoints

La API RESTful proporciona endpoints para gestionar el ciclo de vida de las facturas. Consulta la documentación detallada de la API para obtener información completa sobre cada endpoint, parámetros, cuerpos de solicitud/respuesta y códigos de estado:

➡️ **[Documentación Completa de la API](./docs/api.md)**

A continuación, un resumen rápido de los endpoints disponibles:

*   `POST /api/invoices/ocr`: Carga una o más facturas para procesar.
*   `GET /api/invoices/`: Lista facturas con filtros y paginación.
*   `GET /api/invoices/<int:invoice_id>`: Obtiene detalles de una factura específica.
*   `PATCH /api/invoices/<int:invoice_id>/preview`: Actualiza los datos de previsualización de una factura.
*   `POST /api/invoices/<int:invoice_id>/confirm`: Confirma los datos de una factura (estado `waiting_validation` -> `processed`).
*   `POST /api/invoices/<int:invoice_id>/reject`: Rechaza una factura.
*   `POST /api/invoices/<int:invoice_id>/retry`: Reintenta procesar una factura fallida o rechazada.
*   `GET /api/invoices/<int:invoice_id>/download`: Descarga el archivo original de la factura.
*   `GET /api/invoices/status-summary/`: Obtiene un resumen de facturas por estado.
*   `GET /api/invoices/data`: Obtiene datos estructurados de facturas procesadas (con filtros opcionales).

## Contribuciones

Las contribuciones son bienvenidas. Por favor, sigue estos pasos:

1.  Haz un Fork del repositorio.
2.  Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
3.  Realiza tus cambios.
4.  Haz commit de tus cambios (`git commit -m 'feat: Agrega nueva funcionalidad'`).
5.  Haz push a tu rama (`git push origin feature/nueva-funcionalidad`).
6.  Abre un Pull Request hacia la rama `main` del repositorio original.

Asegúrate de seguir el estilo de código del proyecto y, si es posible, añade pruebas para tus cambios.