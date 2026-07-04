FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY requirements.txt .

RUN uv pip install --system --no-cache -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "python manage.py check && python manage.py runserver 0.0.0.0:8000"]