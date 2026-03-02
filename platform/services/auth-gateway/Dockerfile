# MeshLogIQ Auth Gateway Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    netcat-openbsd \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create entrypoint script
RUN printf '#!/bin/bash\nset -e\n\n\
# Wait for PostgreSQL to be ready\n\
echo "Waiting for database at $DATABASE_HOST:$DATABASE_PORT..."\n\
until nc -z "$DATABASE_HOST" "$DATABASE_PORT" 2>/dev/null; do\n\
  echo "  db not ready yet, retrying in 1s..."\n\
  sleep 1\n\
done\n\
echo "Database is up."\n\n\
# Run migrations\n\
python manage.py migrate --noinput\n\n\
# Collect static files (includes Django admin CSS/JS)\n\
python manage.py collectstatic --noinput\n\n\
# Hand off to CMD\n\
exec "$@"\n' > /entrypoint.sh && chmod +x /entrypoint.sh

# Expose port
EXPOSE 8000

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV DJANGO_SETTINGS_MODULE=core.settings

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
    CMD curl -f http://localhost:8000/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]

# Run the application with gunicorn
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120"]