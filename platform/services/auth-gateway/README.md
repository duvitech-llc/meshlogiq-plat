# MeshLogIQ Auth Gateway

A Django-based authentication gateway with FastAPI for high-throughput endpoints. Provides authentication, device management, and user management services.

## Features

- **Authentication**: Keycloak-integrated authentication with JWT token support
- **User Management**: CRUD operations for users and profiles
- **Device Management**: Device registration, provisioning, and lifecycle management
- **Multi-tenancy**: Organization-based tenant management with role-based access control
- **FastAPI Endpoints**: High-throughput telemetry and command endpoints

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Auth Gateway (Django + FastAPI)                │
│  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │   Django API        │  │   FastAPI (High Throughput)  │  │
│  │   - Auth Endpoints  │  │   - Telemetry Ingestion      │  │
│  │   - User Management │  │   - Device Commands          │  │
│  │   - Tenant Management│  │   - Signed URLs            │  │
│  └─────────┬───────────┘  └──────────────────────────────┘  │
│            │                                                │
│            ▼                                                │
│    ┌─────────────────────┐                                  │
│    │     Keycloak        │                                  │
│    │     (Auth Server)   │                                  │
│    └─────────────────────┘                                  │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                        │
│  - PostgreSQL (User/Tenant Data)                            │
│  - Redis (Caching/Session)                                  │
│  - MinIO (File Storage)                                     │
└─────────────────────────────────────────────────────────────┘
```

## Setup

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Keycloak 24+

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Update .env with your configuration
# - Set DJANGO_SECRET_KEY to a secure random value
# - Update KEYCLOAK_URL, KEYCLOAK_CLIENT_ID, KEYCLOAK_CLIENT_SECRET
# - Update DATABASE_URL with your PostgreSQL connection string
# - Update REDIS_URL with your Redis connection string

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run the development server
python manage.py runserver
```

## API Endpoints

### Authentication

- `POST /api/auth/login/` - Login with username/password
- `POST /api/auth/logout/` - Logout (requires authentication)
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/verify/` - Verify JWT token validity
- `GET /api/auth/jwks/` - Get Keycloak JWKS for token verification
- `GET /api/auth/me/` - Get current user info (requires authentication)

### Users

- `GET /api/users/` - List users (requires authentication)
- `GET /api/users/{id}/` - Get user details (requires authentication)
- `POST /api/users/` - Create user (requires authentication)
- `PUT /api/users/{id}/` - Update user (requires authentication)
- `DELETE /api/users/{id}/` - Delete user (requires authentication)

### Profile

- `GET /api/profile/` - Get current user profile (requires authentication)
- `PUT /api/profile/` - Update current user profile (requires authentication)

## Development

### Running Tests

```bash
python manage.py test
```

### Code Quality

```bash
# Run linter
flake8 apps/

# Run type checker
mypy apps/
```

## Deployment

### Docker

```bash
# Build image
docker build -t meshlogiq-auth-gateway .

# Run container
docker run -p 8000:8000 --env-file .env meshlogiq-auth-gateway
```

### Kubernetes

See `k8s/` directory for deployment manifests.

## License

MIT