# Automated Invoice Processing System

This project automates the processing of invoices by leveraging a combination of powerful technologies, including a Flask backend, Celery for task management, MariaDB for data storage, Redis for caching, and both OCR and OpenAI for intelligent data extraction.

## Purpose

The primary goal of this project is to streamline invoice handling by automatically extracting relevant information from scanned invoice documents. The extracted data is then structured and made available through a user-friendly API, allowing seamless integration with other business systems.

## Technologies Used

*   **Backend:**
    *   **Flask:** A lightweight Python web framework used to build the API endpoints.
    *   **SQLAlchemy:** An ORM (Object-Relational Mapper) that simplifies database interactions.
    *   **Flask-Migrate:** For database schema migrations.
    *   **Flask-CORS:** Enables Cross-Origin Resource Sharing for frontend integration.
*   **Task Management:**
    *   **Celery:** A distributed task queue used to process invoices asynchronously.
*   **Database:**
    *   **MariaDB:** A robust and scalable relational database used to store invoice data.
*   **Caching and Broker:**
    *   **Redis:** Used as both a message broker for Celery and a caching layer for OCR and OpenAI results.
*   **Data Extraction:**
    *   **OCR (Tesseract):** Optical Character Recognition to extract text from scanned invoices.
    *   **OpenAI API:** Leveraged for advanced data extraction and summarization from the OCR output.
*   **Containerization:**
    *   **Docker:** Used to containerize the application and its dependencies.
    * **docker-compose:** Used to orchestrate the different dockers containers.
* **Frontend:**
    * **Vite:** A fast frontend tooling to make a ReactJS app.

## Setup and Run

1.  **Prerequisites:**
    *   Docker and Docker Compose installed.
    *   Python 3.8+
    *   An OpenAI API key (set as the `OPENAI_API_KEY` environment variable).

2.  **Clone the Repository:**
```
bash
    git clone <repository_url>
    cd <repository_directory>
    
```
3.  **Environment Variables:**
    *   Create a `.env` file in the root directory of the project.
    *   Set the following environment variables:
        *   `OPENAI_API_KEY`: Your OpenAI API key.
        *   `DATABASE_URL`: Your database URL. Example: `mysql://root:Root@mariadb:3306/invoices`
        *   `REDIS_URL`: Your redis URL. Example: `redis://redis:6379/0`
        * `SECRET_KEY`: A random string for the Flask app.
        * `FLASK_DEBUG`: `True` or `False` to enable/disable debug mode.
        * `PORT`: Port to use, default `8010`
        * `OCR_CACHE_DIR`: Cache directory for the OCR tasks.

4.  **Build and Run:**
```
bash
    docker-compose up --build -d
    
```
This command will:

    *   Build the Docker images for the backend, Celery worker, and frontend.
    *   Start the MariaDB and Redis containers.
    *   Run the Flask application and Celery worker.

5. **Running Migrations:**
    * After running the containers, run the following command to apply the migrations:
```
bash
    docker exec -it flask_backend flask db upgrade
    
```
## API Endpoints

### Invoices

*   **`POST /api/invoices/ocr`**
    *   **Description:** Upload one or more invoice files for processing.
    *   **Request:** `multipart/form-data` with `file` (one or more files).
    *   **Response:** JSON array with the status for each uploaded invoice.
    *   **Status Codes**:
        * `202`: accepted, invoice is being processed
        * `400`: Bad request, no files provided
*   **`GET /api/invoices/<int:invoice_id>`**
    *   **Description:** Get details of a specific invoice.
    *   **Response:** JSON with invoice details.
    * **Status Codes**:
        * `200`: Ok
        * `404`: Invoice not found
*   **`POST /api/invoices/<int:invoice_id>/confirm`**
    *   **Description:** Confirm the extracted data for an invoice.
    *   **Response:** JSON with confirmation message.
    * **Status Codes**:
        * `200`: Ok
        * `400`: Bad request, no preview data found.
        * `404`: Invoice not found
*   **`POST /api/invoices/<int:invoice_id>/reject`**
    *   **Description:** Reject the extracted data for an invoice.
    *   **Request body**: JSON, with optional key `reason` to specify a reject reason.
    *   **Response:** JSON with rejection message.
    * **Status Codes**:
        * `200`: Ok
        * `400`: Bad request, invoice not in a correct state.
        * `404`: Invoice not found
*   **`GET /api/invoices/`**
    *   **Description:** List invoices with pagination, filtering, searching, and sorting.
    *   **Query Parameters:**
        *   `page`: Page number (default: 1).
        *   `per_page`: Number of items per page (default: 10).
        *   `status`: Filter by invoice status.
        *   `search`: Search by filename.
        *   `sort_by`: Sort column (default: `created_at`).
        *   `sort_order`: Sort order (`asc` or `desc`, default: `desc`).
    * **Status Codes**:
        * `200`: Ok
*   **`POST /api/invoices/<int:invoice_id>/retry`**
    *   **Description:** Retry processing a failed or rejected invoice.
    *   **Response:** JSON with message.
    * **Status Codes**:
        * `202`: Accepted
        * `400`: Bad request, invoice not in a correct state.
        * `404`: Invoice not found
*   **`GET /api/invoices/status-summary/`**
    *   **Description:** Get a summary of invoice statuses.
    *   **Response:** JSON with a summary of invoice statuses.
    * **Status Codes**:
        * `200`: Ok
*   **`GET /api/invoices/data`**
    *   **Description:** List the invoices with data and filters.
    *   **Query Parameters:**
        *   `page`: Page number (default: 1).
        *   `per_page`: Number of items per page (default: 10).
        *   `op_number`: Filter by operation code.
    *   **Response:** JSON with a list of invoices with extracted data.
    * **Status Codes**:
        * `200`: Ok
* **`GET /api/invoices/<int:invoice_id>/download`**
    * **Description**: Download a invoice by the `invoice_id`
    * **Status codes**:
        * `200`: Ok, return the file.
        * `404`: Invoice not found or file not found.

## Contributing

Contributions to this project are welcome! To contribute:

1.  **Fork the Repository:** Fork this repository to your own GitHub account.
2.  **Create a Branch:** Create a new branch for your changes:
```
bash
    git checkout -b feature/my-new-feature
    
```
3.  **Make Your Changes:** Implement your feature or bug fix.
4.  **Commit Your Changes:** Commit your changes with a descriptive message:
```
bash
    git commit -m "feat: Add a new feature"
    
```
5.  **Push to Your Fork:** Push your branch to your forked repository:
```
bash
    git push origin feature/my-new-feature
    
```
6.  **Create a Pull Request:** Create a pull request from your branch to the `main` branch of this repository.

Please make sure to follow the code style of the project and include tests for your changes.