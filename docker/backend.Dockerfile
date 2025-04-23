FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

CMD ["flask", "db", "upgrade"]

COPY . .

CMD ["flask", "run", "--host=0.0.0.0", "--port=8010"]
