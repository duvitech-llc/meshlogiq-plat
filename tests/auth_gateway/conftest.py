"""
Shared fixtures for auth-gateway tests.

Provides:
- RSA key pair for signing test JWTs (session-scoped, generated once)
- token_factory: callable fixture that mints signed JWTs with configurable claims
- mock_signing_key: PyJWT signing-key mock backed by the test RSA public key
- patched_jwks: patches PyJWKClient in middleware AND views so no real Keycloak
                is needed. Must be active before the first Django request so
                that Django's lazy middleware chain is built with the mock.
- auth_client: Django test Client whose KeycloakJWTAuthMiddleware uses the mock
- keycloak_token_response: helper that builds a realistic Keycloak token payload
"""

import json
import time
import uuid
from unittest.mock import MagicMock, Mock, patch

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from django.test import Client, override_settings


# ---------------------------------------------------------------------------
# RSA key pair (session-scoped — generated once per test session)
# ---------------------------------------------------------------------------


@pytest.fixture(scope="session")
def rsa_key_pair():
    """Generate a 2048-bit RSA key pair for signing/verifying test JWTs."""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    return private_key, private_key.public_key()


@pytest.fixture(scope="session")
def rsa_private_key(rsa_key_pair):
    private_key, _ = rsa_key_pair
    return private_key


@pytest.fixture(scope="session")
def rsa_public_key(rsa_key_pair):
    _, public_key = rsa_key_pair
    return public_key


# ---------------------------------------------------------------------------
# A *different* RSA key pair — used to sign tokens that should fail signature
# validation (wrong key / wrong realm scenarios).
# ---------------------------------------------------------------------------


@pytest.fixture(scope="session")
def wrong_rsa_key_pair():
    """Second RSA key pair used to sign tokens that must be rejected."""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    return private_key, private_key.public_key()


# ---------------------------------------------------------------------------
# JWT token factory
# ---------------------------------------------------------------------------

# Canonical test values that mirror Django settings defaults
TEST_KEYCLOAK_URL = "http://keycloak:8080"
TEST_REALM = "meshlogiq"
TEST_CLIENT_ID = "meshlogiq-backend"
VALID_ISSUER = f"{TEST_KEYCLOAK_URL}/realms/{TEST_REALM}"
WRONG_ISSUER = f"{TEST_KEYCLOAK_URL}/realms/other-realm"


@pytest.fixture(scope="session")
def token_factory(rsa_private_key):
    """
    Returns a callable `make_token(**kwargs)` that produces a signed JWT.

    Keyword arguments (all optional):
        sub          – JWT subject (default: random UUID)
        iss          – issuer (default: VALID_ISSUER)
        aud          – audience (default: TEST_CLIENT_ID)
        exp_offset   – seconds from now until expiry (default: 300)
                       Pass a *negative* value to produce an expired token.
        username     – preferred_username claim
        email        – email claim
        roles        – list of realm roles
        extra        – dict of additional claims merged into the payload
        signing_key  – override the private key (e.g. wrong_rsa_key_pair[0])
    """

    def make_token(
        *,
        sub=None,
        iss=VALID_ISSUER,
        aud=TEST_CLIENT_ID,
        exp_offset=300,
        username="testuser",
        email="testuser@meshlogiq.local",
        roles=None,
        extra=None,
        signing_key=None,
    ):
        now = int(time.time())
        payload = {
            "iss": iss,
            "sub": sub or str(uuid.uuid4()),
            "aud": aud,
            "iat": now,
            "exp": now + exp_offset,
            "jti": str(uuid.uuid4()),
            "typ": "Bearer",
            "preferred_username": username,
            "email": email,
            "given_name": "Test",
            "family_name": "User",
            "realm_access": {"roles": roles or ["user"]},
            "scope": "openid profile email",
        }
        if extra:
            payload.update(extra)

        key = signing_key or rsa_private_key
        return jwt.encode(payload, key, algorithm="RS256")

    return make_token


# ---------------------------------------------------------------------------
# Mock PyJWKClient that validates tokens against our test RSA public key
# ---------------------------------------------------------------------------


@pytest.fixture
def mock_signing_key(rsa_public_key):
    """
    A mock PyJWT signing-key object whose `.key` attribute is our RSA public key.
    PyJWT's `jwt.decode()` accepts this directly as the verification key.
    """
    signing_key = MagicMock()
    signing_key.key = rsa_public_key
    return signing_key


@pytest.fixture
def mock_jwks_client(mock_signing_key):
    """
    A mock PyJWKClient instance.  `get_signing_key_from_jwt` returns the test
    signing key so that `jwt.decode(..., signing_key.key, ...)` works correctly.
    """
    client_mock = MagicMock()
    client_mock.get_signing_key_from_jwt.return_value = mock_signing_key
    return client_mock


@pytest.fixture
def patched_jwks(mock_jwks_client):
    """
    Patches `PyJWKClient` in **both** the middleware module and the views module
    so that:
      1. `KeycloakJWTAuthMiddleware.__init__` stores our mock rather than trying
         to reach a real Keycloak JWKS endpoint.
      2. `VerifyTokenView` also uses the mock JWKS client.

    This fixture must be set up BEFORE the first Django request is processed,
    because Django builds its middleware chain lazily on first request.  Use
    `auth_client` (defined below) to guarantee correct ordering.
    """
    with (
        patch("middleware.PyJWKClient", return_value=mock_jwks_client),
        patch("apps.authentication.views.PyJWKClient", return_value=mock_jwks_client),
    ):
        yield mock_jwks_client


# ---------------------------------------------------------------------------
# auth_client — a Django test Client with the JWKS mock already in place
# ---------------------------------------------------------------------------


@pytest.fixture
def auth_client(patched_jwks, db):
    """
    A fresh Django test Client.

    `patched_jwks` is declared as a dependency *before* `Client()` is
    instantiated, so the patch context is live when Django builds its lazy
    middleware chain on the first request.
    """
    return Client(enforce_csrf_checks=False)


# ---------------------------------------------------------------------------
# Helpers for mocking Keycloak HTTP responses
# ---------------------------------------------------------------------------


def _mock_response(status_code=200, json_data=None):
    """Build a minimal mock of a `requests.Response`."""
    mock_resp = Mock()
    mock_resp.status_code = status_code
    mock_resp.json.return_value = json_data or {}
    mock_resp.raise_for_status = Mock()
    if status_code >= 400:
        mock_resp.raise_for_status.side_effect = Exception(
            f"HTTP {status_code}"
        )
    return mock_resp


@pytest.fixture
def keycloak_admin_token_response():
    """Mock successful admin token response from Keycloak master realm."""
    return _mock_response(
        200,
        {
            "access_token": "admin-access-token-xyz",
            "expires_in": 60,
            "token_type": "Bearer",
        },
    )


@pytest.fixture
def keycloak_user_list_response():
    """Mock Keycloak user-search response returning one user."""
    return _mock_response(
        200,
        [
            {
                "id": "kc-user-uuid-0001",
                "username": "testuser",
                "email": "testuser@meshlogiq.local",
                "firstName": "Test",
                "lastName": "User",
                "enabled": True,
            }
        ],
    )


@pytest.fixture
def keycloak_token_response(token_factory):
    """
    Mock Keycloak token endpoint response containing a real signed JWT so that
    the consumer can later validate it against the mock JWKS client.
    """
    access_token = token_factory()
    return _mock_response(
        200,
        {
            "access_token": access_token,
            "refresh_token": "refresh-token-opaque-xyz",
            "id_token": token_factory(extra={"nonce": "abc"}),
            "expires_in": 300,
            "refresh_expires_in": 1800,
            "token_type": "Bearer",
            "scope": "openid profile email",
        },
    )


@pytest.fixture
def keycloak_revoke_response():
    """Mock successful token revocation (Keycloak returns 200 with empty body)."""
    return _mock_response(200, {})
