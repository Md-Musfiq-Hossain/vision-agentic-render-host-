FROM mcr.microsoft.com/playwright:v1.49.0-noble AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3-pip \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY requirements.txt .

RUN uv pip install --system --break-system-packages --no-cache -r requirements.txt

RUN playwright install chromium

COPY . .

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]