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

# Suppress whitenoise manifest errors that occur without collectstatic
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
