# Django settings for MeshLogIQ Auth Gateway
"""
Django settings for meshlogiq-auth-gateway.
"""

from pathlib import Path
from datetime import timedelta
import os
import environ

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables
env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env')

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env('DJANGO_SECRET_KEY', default='django-insecure-dev-key-change-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env.bool('DJANGO_DEBUG', default=True)

# Allowed hosts
ALLOWED_HOSTS = env.list('DJANGO_ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

# CORS settings
CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS',
    default=['http://localhost:3000', 'https://meshlogiq.local']
)
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'content-type',
    'authorization',
    'x-request-id',
    'x-tenant-id',
]

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'corsheaders',
    
    # Local apps
    'apps.authentication',
    'apps.tenants',
    'apps.devices',
    'apps.api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'middleware.KeycloakJWTAuthMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# Database
DATABASE_HOST = env('DATABASE_HOST', default='localhost')
DATABASE_PORT = env.int('DATABASE_PORT', default=5432)
DATABASE_NAME = env('DATABASE_NAME', default='meshlogiq_auth')
DATABASE_USER = env('DATABASE_USER', default='postgres')
DATABASE_PASSWORD = env('DATABASE_PASSWORD', default='postgres')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': DATABASE_NAME,
        'USER': DATABASE_USER,
        'PASSWORD': DATABASE_PASSWORD,
        'HOST': DATABASE_HOST,
        'PORT': DATABASE_PORT,
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom user model
AUTH_USER_MODEL = 'authentication.MeshLogIQUser'

# Keycloak configuration
KEYCLOAK_URL = env('KEYCLOAK_URL', default='http://localhost:8080')
KEYCLOAK_REALM = env('KEYCLOAK_REALM', default='meshlogiq')
KEYCLOAK_CLIENT_ID = env('KEYCLOAK_CLIENT_ID', default='meshlogiq-backend')
KEYCLOAK_CLIENT_SECRET = env('KEYCLOAK_CLIENT_SECRET', default='')
KEYCLOAK_ADMIN_USERNAME = env('KEYCLOAK_ADMIN_USERNAME', default='admin')
KEYCLOAK_ADMIN_PASSWORD = env('KEYCLOAK_ADMIN_PASSWORD', default='')
KEYCLOAK_ADMIN_TOKEN = env('KEYCLOAK_ADMIN_TOKEN', default='')

# Keycloak JWKS URL (for token verification)
KEYCLOAK_JWKS_URL = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/certs"

# FastAPI settings
FASTAPI_HOST = env('FASTAPI_HOST', default='0.0.0.0')
FASTAPI_PORT = env.int('FASTAPI_PORT', default=8000)

# Redis configuration
REDIS_URL = env('REDIS_URL', default='redis://localhost:6379/0')

# Rate limiting defaults
RATE_LIMIT_DEFAULT = env.int('RATE_LIMIT_DEFAULT', default=100)  # requests per minute
RATE_LIMIT_BURST = env.int('RATE_LIMIT_BURST', default=20)

# Token lifespans
ACCESS_TOKEN_LIFETIME = timedelta(minutes=15)
REFRESH_TOKEN_LIFETIME = timedelta(days=1)

# Admin settings
DJANGO_ADMIN_URL = env('DJANGO_ADMIN_URL', default='admin/')