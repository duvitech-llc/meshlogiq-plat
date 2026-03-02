# MeshLogIQ Platform

> Distributed, multi-tenant edge-to-cloud industrial AI platform.

MeshLogIQ connects edge AI nodes, IoT sensors, and robotics hardware to a cloud control plane that handles fleet management, video processing, telemetry ingestion, analytics pipelines, and a multi-tenant model registry — all behind a single Traefik ingress and deployable with one `docker compose up`.

---

## Table of Contents

- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
  - [1. TLS Certificates](#1-tls-certificates)
  - [2. Hosts File](#2-hosts-file)
  - [3. Environment Files](#3-environment-files)
  - [4. Start the Stack](#4-start-the-stack)
- [Service URLs](#service-urls)
- [Authentication](#authentication)
- [Running Tests](#running-tests)
- [Subscription Tiers](#subscription-tiers)
- [Contributing](#contributing)

---

## Architecture

MeshLogIQ follows an **edge-first, compose-first** design. All cloud services run as Docker containers behind a Traefik reverse proxy. Edge nodes communicate to the cloud via MQTT over WebSockets, gRPC, and WebRTC — all routed through the same Traefik ingress.

```
Edge Layer          Gateway Layer         Cloud (Docker Compose)
─────────────       ─────────────         ─────────────────────────────────
Jetson / Pi    →    MQTT Broker      →    Traefik (TLS, routing, metrics)
IoT MCUs       →    LoRaWAN LNS      →    ├── React Dashboard
BLE Sensors    →    BLE Gateway      →    ├── Auth Gateway (Django/Keycloak)
ROS2 Robots    →    ROS2 DDS Bridge  →    ├── Control Plane (FastAPI)
                                          ├── Telemetry Ingestion
                                          ├── Analytics Pipeline
                                          ├── Video Orchestrator
                                          ├── ROS2 Cloud Bridge
                                          ├── TimescaleDB (PostgreSQL 18)
                                          ├── Redis
                                          ├── NATS + JetStream
                                          └── MinIO (S3 data lake)
```

Full architecture diagrams are in [docs/meshlogiq-hla.md](docs/meshlogiq-hla.md).  
Authentication architecture is in [docs/auth-architecture.md](docs/auth-architecture.md).

---

## Repository Structure

```
meshlogiq-plat/
├── docs/                        # Architecture and design documentation
│   ├── meshlogiq-hla.md         # High-level architecture
│   ├── auth-architecture.md     # Multi-tenant auth & RBAC spec
│   └── notes/                   # Developer notes
├── infra/                       # Infrastructure and Compose stack
│   ├── docker-compose.yml       # Full local stack definition
│   ├── env_files/               # Per-service environment variable files
│   ├── db/initdb/               # PostgreSQL init SQL (extensions, Keycloak schema)
│   ├── keycloak/                # Keycloak realm import (realm-meshlogiciq.json)
│   ├── traefik/                 # Traefik static + dynamic config, TLS certs
│   └── scripts/                 # Utility scripts
├── platform/
│   ├── common/                  # Shared contracts, protobuf definitions, Python libs
│   ├── edge/                    # Edge agents (Jetson, Pi, generic Linux) and gateways
│   ├── frontend/                # React + Vite dashboard
│   └── services/
│       ├── auth-gateway/        # Django 4.2 auth service (Keycloak integration)
│       ├── analytics-pipeline/  # Analytics pipeline orchestrator
│       ├── control-plane/       # FastAPI control plane / API gateway
│       ├── ros2-bridge/         # ROS2 cloud bridge
│       ├── telemetry-ingestion/ # Telemetry and events processor
│       └── video-orchestrator/  # Video processing (GPU)
├── tests/
│   └── auth_gateway/            # pytest test suite for the auth service
└── agents/                      # AI agent definitions
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Reverse Proxy / Ingress** | Traefik (TLS termination, Docker-label routing, Prometheus metrics) |
| **Identity & SSO** | Keycloak 26.0 (OIDC / OAuth2, RS256 JWTs, JWKS) |
| **Auth Service** | Django 4.2 + Django REST Framework, gunicorn, whitenoise |
| **Control Plane** | FastAPI + gRPC |
| **Frontend** | React 18 + Vite, Keycloak JS adapter |
| **Database** | TimescaleDB / PostgreSQL 18 |
| **Cache** | Redis |
| **Messaging** | NATS 2 with JetStream |
| **Data Lake** | MinIO (S3-compatible — video, models, telemetry, pipeline outputs) |
| **Edge Agents** | Python (Jetson, Pi, generic Linux), ROS2 |
| **Languages** | Python, TypeScript, Rust/C++ (edge extensions) |
| **Container orchestration** | Docker Compose (dev), Kubernetes (production) |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose v2)
- OpenSSL (for TLS certificate generation)
- Python 3.12+ and a virtual environment manager (for running tests locally)

---

## Local Development Setup

### 1. TLS Certificates

All local services run on `*.meshlogiq.local` with HTTPS. Generate a local CA and wildcard certificate using the scripts in `infra/`:

**Linux / macOS**
```bash
cd infra
./generate-docustore-certs.sh
```

**Windows (PowerShell)**
```powershell
cd infra
.\generate-docustore-certs.ps1
```

Then import `meshlogiqlocalCA.pem` into your system's trusted root certificate store. After importing, browsers will trust `*.meshlogiq.local` without warnings.

> Detailed manual steps are in [infra/README.md](infra/README.md).

### 2. Hosts File

Add the following to `/etc/hosts` (Linux/macOS) or `C:\Windows\System32\drivers\etc\hosts` (Windows, run as Administrator):

```
127.0.0.1  meshlogiq.local traefik.meshlogiq.local sso.meshlogiq.local
127.0.0.1  auth.meshlogiq.local pgadmin.meshlogiq.local
127.0.0.1  minio.meshlogiq.local s3.meshlogiq.local
```

### 3. Environment Files

Copy the example env files and fill in any secrets:

```bash
# Linux / macOS
cd infra
./copy-env-files.sh

# Windows
.\copy-env-files.ps1
```

This copies every `*.env.example` in `infra/env_files/` to its corresponding `*.env`. The defaults work for a local stack out of the box; review and customise secrets before any shared deployment.

### 4. Start the Stack

```bash
cd infra
docker compose up -d
```

On first run Docker Compose will build the frontend and auth-gateway images, then start all services in dependency order. The database health-check gate ensures Keycloak and the auth service only start after PostgreSQL is ready.

---

## Service URLs

| Service | URL |
|---|---|
| **Dashboard** | https://meshlogiq.local |
| **Auth Gateway API** | https://auth.meshlogiq.local/api/auth/ |
| **Auth Gateway Admin** | https://auth.meshlogiq.local/admin/ |
| **Keycloak SSO** | https://sso.meshlogiq.local |
| **MinIO Console** | https://minio.meshlogiq.local |
| **MinIO S3 API** | https://s3.meshlogiq.local |
| **pgAdmin** | https://pgadmin.meshlogiq.local |
| **Traefik Dashboard** | https://traefik.meshlogiq.local |

### Create the Django admin superuser

After the first `docker compose up`, run:

```bash
docker exec meshlogiq-auth-gateway python manage.py createsuperuser
```

---

## Authentication

MeshLogIQ uses **Keycloak** as the identity provider with RS256-signed JWTs.

- The `meshlogiq` realm is auto-imported from `infra/keycloak/realm-meshlogiciq.json` on first start.
- The **auth-gateway** (Django) validates tokens using Keycloak's JWKS endpoint and enforces tenant-level RBAC.
- The **frontend** uses the Keycloak JS adapter with silent SSO check for session continuity.

**Auth flow summary:**

```
Browser → Traefik → Frontend (React)
                   → Auth Gateway  POST /api/auth/login/
                                   ← access_token (Keycloak JWT, RS256)
                   → Any service   Authorization: Bearer <token>
                                   → Middleware validates against JWKS
```

See [docs/auth-architecture.md](docs/auth-architecture.md) for the full multi-tenant RBAC specification, subscription tier definitions, device identity (mTLS), and service-to-service authentication.

---

## Running Tests

Tests are located in `tests/` and use **pytest** with **pytest-django**. They run against an in-memory SQLite database — no running Docker stack required.

### Set up the environment (once)

```bash
# From the workspace root
python -m venv .venv

# Activate (PowerShell)
.\.venv\Scripts\Activate.ps1

# Activate (bash)
source .venv/bin/activate

# Install dependencies
pip install -r platform/services/auth-gateway/requirements.txt \
            -r tests/requirements-test.txt
```

### Run the tests

```bash
# All 52 tests
pytest tests/auth_gateway/ -v

# Filter by marker
pytest -m login    # login / logout flow tests
pytest -m token    # JWT token validation tests

# Single file
pytest tests/auth_gateway/test_login.py -v
```

Detailed instructions are in [docs/notes/run-tests.md](docs/notes/run-tests.md).

---

## Subscription Tiers

| Tier | Devices | Storage | API Rate Limit | Keycloak Realm |
|---|---|---|---|---|
| **Free** | 1 | 2 GB | 100 req/min | Shared `meshlogiq` |
| **Basic** | 5 | 25 GB | 500 req/min | Shared `meshlogiq` |
| **Enterprise** | 50+ (configurable) | 1 TB+ (configurable) | Unthrottled | Optional dedicated realm |

Tier metadata is embedded in user JWTs (`subscription_plan`, `feature_flags`, `quotas`) and enforced at the API gateway, service, storage, and message broker layers.

---

## Contributing

1. Fork the repository and create a feature branch from `main`.
2. Follow the existing code conventions for the language/framework of the service you're modifying.
3. Add or update tests in `tests/` for any auth-gateway changes.
4. Ensure `pytest tests/auth_gateway/` passes with zero failures before opening a pull request.
5. Update relevant documentation in `docs/` if the change affects architecture or deployment.
