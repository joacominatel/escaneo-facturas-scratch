FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

RUN apt-get update
RUN apt-get -y install poppler-utils
RUN apt-get -y install tesseract-ocr tesseract-ocr-spa

CMD ["flask", "db", "upgrade"]

COPY . .

CMD ["flask", "run", "--host=0.0.0.0", "--port=8010"]
