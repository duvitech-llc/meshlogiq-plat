"""
Test settings for auth-gateway.

Inherits all production settings and overrides the database to use in-memory
SQLite so tests run locally without a running PostgreSQL / Docker stack.
"""

from core.settings import *  # noqa: F401, F403

# Use in-memory SQLite — no Docker / network needed
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Speed up password hashing in tests
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# Remove whitenoise middleware — static files not needed in tests and it warns
# about the staticfiles directory not existing.
MIDDLEWARE = [m for m in MIDDLEWARE if "whitenoise" not in m]  # noqa: F405

# Plain static files storage — no collectstatic needed for tests
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}

# Silence AdminEmailHandler — it triggers template rendering in the test client
# signal machinery when a 500 is intentionally produced in a test.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "WARNING",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
    },
}
