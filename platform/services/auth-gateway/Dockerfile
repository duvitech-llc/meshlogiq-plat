# MeshLogIQ Auth Gateway Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create entrypoint script
RUN echo '#!/bin/bash\n\
# Wait for database\n\
echo "Waiting for database..." &&\
python -c "import time; import socket; s = socket.socket(socket.AF_INET, socket.SOCK_STREAM); s.connect((os.environ.get(\"DATABASE_HOST\", \"db\"), int(os.environ.get(\"DATABASE_PORT\", 5432)))); s.close()" || true\n\
# Run migrations\n\
python manage.py migrate --noinput\n\
# Collect static files\n\
python manage.py collectstatic --noinput\n\
# Start the application\n\
exec "$@"' > /entrypoint.sh && chmod +x /entrypoint.sh

# Expose ports
EXPOSE 8000
EXPOSE 8001

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV DJANGO_SETTINGS_MODULE=core.settings

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python manage.py shell -c "import django; django.setup(); print('OK')" || exit 1

# Run the application
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]