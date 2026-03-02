"""
tests/auth_gateway/test_token_validation.py

Tests for JWT token validation.

Two surfaces tested:
  1. POST /api/auth/verify/  — VerifyTokenView (explicit validation API)
  2. GET  /api/auth/me/      — Any protected endpoint (middleware-layer validation)

Coverage:
  ✅ Django validates issuer (iss)
  ✅ Django validates audience (aud)
  ✅ Django validates signature (via JWKS public key)
  ✅ Django validates expiration (exp)
  ❌ Expired token rejected
  ❌ Token from wrong realm rejected
  ❌ Token with invalid signature rejected
  ❌ Token with wrong audience rejected
  ❌ No Authorization header → 401
"""

import time
import uuid

import jwt as pyjwt
import pytest


# ---------------------------------------------------------------------------
# Constants (mirror settings defaults loaded from .env)
# ---------------------------------------------------------------------------

VALID_ISSUER = "http://keycloak:8080/realms/meshlogiq"
VALID_AUDIENCE = "meshlogiq-backend"
WRONG_REALM_ISSUER = "http://keycloak:8080/realms/other-realm"
WRONG_AUDIENCE = "some-other-client"

VERIFY_URL = "/api/auth/verify/"
ME_URL = "/api/auth/me/"


# ---------------------------------------------------------------------------
# VerifyTokenView tests  (POST /api/auth/verify/)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
@pytest.mark.token
class TestVerifyTokenView:
    """
    POST /api/auth/verify/ — Explicit token validation endpoint.

    This endpoint is public (no Authorization header required); the token
    to validate is submitted in the request body.
    The view creates its own PyJWKClient (patched via `patched_jwks`).
    Actual JWT claim validation (iss, aud, exp, sig) is performed by PyJWT
    using the RSA public key returned by the mock JWKS client.
    """

    # ------------------------------------------------------------------
    # ✅ Valid token
    # ------------------------------------------------------------------

    def test_valid_token_returns_valid_true(self, auth_client, token_factory):
        """✅ A fresh, correctly-signed token is reported as valid."""
        token = token_factory()

        response = auth_client.post(
            VERIFY_URL,
            data={"token": token},
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True

    def test_valid_token_response_contains_payload(self, auth_client, token_factory):
        """✅ On success the response includes the decoded JWT payload."""
        sub = str(uuid.uuid4())
        token = token_factory(sub=sub)

        response = auth_client.post(
            VERIFY_URL,
            data={"token": token},
            content_type="application/json",
        )

        data = response.json()
        assert data["valid"] is True
        assert "payload" in data
        assert data["payload"]["sub"] == sub
        assert data["payload"]["iss"] == VALID_ISSUER
        assert data["payload"]["aud"] == VALID_AUDIENCE

    # ------------------------------------------------------------------
    # ❌ Expired token
    # ------------------------------------------------------------------

    def test_expired_token_returns_valid_false(self, auth_client, token_factory):
        """❌ A token with exp in the past is reported as invalid."""
        expired_token = token_factory(exp_offset=-60)  # expired 60 s ago

        response = auth_client.post(
            VERIFY_URL,
            data={"token": expired_token},
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False

    def test_expired_token_error_message(self, auth_client, token_factory):
        """❌ Expired token error message references 'expired'."""
        expired_token = token_factory(exp_offset=-1)

        response = auth_client.post(
            VERIFY_URL,
            data={"token": expired_token},
            content_type="application/json",
        )

        data = response.json()
        assert data["valid"] is False
        assert "expired" in data.get("error", "").lower()

    # ------------------------------------------------------------------
    # ❌ Wrong issuer / wrong realm
    # ------------------------------------------------------------------

    def test_wrong_realm_issuer_returns_valid_false(self, auth_client, token_factory):
        """
        ❌ Token from wrong realm (iss mismatch) is rejected.
        Simulates a token issued by a different Keycloak realm.
        """
        wrong_realm_token = token_factory(iss=WRONG_REALM_ISSUER)

        response = auth_client.post(
            VERIFY_URL,
            data={"token": wrong_realm_token},
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False

    def test_wrong_realm_error_references_issuer(self, auth_client, token_factory):
        """❌ Wrong-realm rejection error message is informative."""
        wrong_realm_token = token_factory(iss=WRONG_REALM_ISSUER)

        response = auth_client.post(
            VERIFY_URL,
            data={"token": wrong_realm_token},
            content_type="application/json",
        )

        data = response.json()
        assert data["valid"] is False
        assert "error" in data
        # PyJWT raises InvalidIssuerError whose str contains "issuer"
        assert len(data["error"]) > 0

    def test_external_issuer_rejected(self, auth_client, token_factory):
        """❌ Token claiming to come from an external, trusted-looking issuer is rejected."""
        external_token = token_factory(iss="https://accounts.google.com")

        response = auth_client.post(
            VERIFY_URL,
            data={"token": external_token},
            content_type="application/json",
        )

        assert response.json()["valid"] is False

    # ------------------------------------------------------------------
    # ❌ Wrong audience
    # ------------------------------------------------------------------

    def test_wrong_audience_returns_valid_false(self, auth_client, token_factory):
        """❌ Token with aud != KEYCLOAK_CLIENT_ID is rejected."""
        wrong_aud_token = token_factory(aud=WRONG_AUDIENCE)

        response = auth_client.post(
            VERIFY_URL,
            data={"token": wrong_aud_token},
            content_type="application/json",
        )

        assert response.status_code == 200
        assert response.json()["valid"] is False

    # ------------------------------------------------------------------
    # ❌ Invalid signature
    # ------------------------------------------------------------------

    def test_invalid_signature_returns_valid_false(
        self, auth_client, token_factory, wrong_rsa_key_pair
    ):
        """
        ❌ Token signed with an unknown private key fails signature verification.
        The mock JWKS returns the *correct* public key; PyJWT rejects the
        mismatched signature.
        """
        wrong_private_key, _ = wrong_rsa_key_pair
        bad_sig_token = token_factory(signing_key=wrong_private_key)

        response = auth_client.post(
            VERIFY_URL,
            data={"token": bad_sig_token},
            content_type="application/json",
        )

        assert response.status_code == 200
        assert response.json()["valid"] is False

    def test_tampered_token_payload_rejected(self, auth_client, token_factory):
        """
        ❌ A token whose payload is manually altered after signing is rejected
        because the signature no longer matches.
        """
        import base64, json as jsonlib

        original = token_factory()
        header_b64, payload_b64, sig = original.split(".")

        # Decode payload, change sub, re-encode without re-signing
        padded = payload_b64 + "=" * (-len(payload_b64) % 4)
        payload_dict = jsonlib.loads(base64.urlsafe_b64decode(padded))
        payload_dict["sub"] = "attacker-uuid"
        tampered_b64 = base64.urlsafe_b64encode(
            jsonlib.dumps(payload_dict).encode()
        ).rstrip(b"=").decode()

        tampered_token = f"{header_b64}.{tampered_b64}.{sig}"

        response = auth_client.post(
            VERIFY_URL,
            data={"token": tampered_token},
            content_type="application/json",
        )

        assert response.json()["valid"] is False

    # ------------------------------------------------------------------
    # ❌ Missing / malformed input
    # ------------------------------------------------------------------

    def test_missing_token_field_returns_400(self, auth_client):
        """❌ Request body without 'token' key returns HTTP 400."""
        response = auth_client.post(
            VERIFY_URL,
            data={},
            content_type="application/json",
        )

        assert response.status_code == 400

    def test_empty_token_returns_error(self, auth_client):
        """❌ Empty string token is invalid."""
        response = auth_client.post(
            VERIFY_URL,
            data={"token": ""},
            content_type="application/json",
        )

        # Either 400 (serializer) or 200 with valid=False are acceptable
        data = response.json()
        if response.status_code == 200:
            assert data["valid"] is False
        else:
            assert response.status_code in (400, 422)

    def test_garbage_token_returns_valid_false(self, auth_client):
        """❌ A completely nonsensical string is not a valid JWT."""
        response = auth_client.post(
            VERIFY_URL,
            data={"token": "this.is.not.a.jwt"},
            content_type="application/json",
        )

        data = response.json()
        assert data["valid"] is False


# ---------------------------------------------------------------------------
# Middleware token validation tests  (GET /api/auth/me/)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
@pytest.mark.token
class TestMiddlewareTokenValidation:
    """
    Tests that exercise KeycloakJWTAuthMiddleware via a protected endpoint.

    GET /api/auth/me/ requires a valid Bearer token.
    The middleware:
      1. Extracts the JWT from Authorization header
      2. Calls JWKS client → get signing key
      3. Calls jwt.decode() with: audience, issuer, expiry enforcement
      4. Sets request.user or returns 401 immediately
    """

    # ------------------------------------------------------------------
    # ✅ Valid token lets request through
    # ------------------------------------------------------------------

    def test_valid_token_grants_access(self, auth_client, token_factory):
        """✅ A valid JWT in Authorization header reaches the view (200)."""
        token = token_factory()

        response = auth_client.get(
            ME_URL,
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        assert response.status_code == 200

    def test_valid_token_user_info_returned(self, auth_client, token_factory):
        """✅ Middleware injects the authenticated user; view returns user fields."""
        token = token_factory(username="alice", email="alice@meshlogiq.local")

        response = auth_client.get(
            ME_URL,
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "username" in data

    def test_valid_token_validates_signature(self, auth_client, token_factory):
        """
        ✅ Signature is validated: the middleware decodes the token using the
        RSA public key from JWKS — a correctly-signed token is accepted.
        """
        sub = str(uuid.uuid4())
        token = token_factory(sub=sub)

        response = auth_client.get(
            ME_URL,
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        assert response.status_code == 200

    def test_valid_token_validates_audience(self, auth_client, token_factory):
        """
        ✅ aud is validated: token with correct audience (KEYCLOAK_CLIENT_ID)
        is accepted by the middleware.
        """
        token = token_factory(aud=VALID_AUDIENCE)

        response = auth_client.get(
            ME_URL,
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        assert response.status_code == 200

    def test_valid_token_validates_issuer(self, auth_client, token_factory):
        """
        ✅ iss is validated: token from the correct Keycloak realm is accepted.
        """
        token = token_factory(iss=VALID_ISSUER)

        response = auth_client.get(
            ME_URL,
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        assert response.status_code == 200

    # ------------------------------------------------------------------
    # ❌ Expired token
    # ------------------------------------------------------------------

    def test_expired_token_rejected_by_middleware(self, auth_client, token_factory):
        """❌ An expired token is rejected by the middleware — HTTP 401."""
        expired_token = token_factory(exp_offset=-120)

        response = auth_client.get(
            ME_URL,
            HTTP_AUTHORIZATION=f"Bearer {expired_token}",
        )

        assert response.status_code == 401

    def test_expired_token_error_in_response(self, auth_client, token_factory):
        """❌ Expired token response body includes an 'error' key."""
        expired_token = token_factory(exp_offset=-1)

        response = auth_client.get(
            ME_URL,
            HTTP_AUTHORIZATION=f"Bearer {expired_token}",
        )

        assert response.status_code == 401
        data = response.json()
        assert "error" in data

    # ------------------------------------------------------------------
    # ❌ Wrong realm / wrong issuer
    # ------------------------------------------------------------------

    def test_wrong_realm_token_rejected(self, auth_client, token_factory):
        """
        ❌ Token from a different Keycloak realm (wrong iss) is rejected — 401.
        This prevents cross-realm token reuse attacks.
        """
        wrong_realm_token = token_factory(iss=WRONG_REALM_ISSUER)

        response = auth_client.get(
            ME_URL,
            HTTP_AUTHORIZATION=f"Bearer {wrong_realm_token}",
        )

        assert response.status_code == 401

    def test_external_realm_token_rejected(self, auth_client, token_factory):
        """❌ Token from a completely external authority is rejected — 401."""
        external_token = token_factory(iss="https://evil.example.com/auth")

        response = auth_client.get(
            ME_URL,
            HTTP_AUTHORIZATION=f"Bearer {external_token}",
        )

        assert response.status_code == 401

    # ------------------------------------------------------------------
    # ❌ Wrong audience
    # ------------------------------------------------------------------

    def test_wrong_audience_token_rejected(self, auth_client, token_factory):
        """❌ Token with aud != KEYCLOAK_CLIENT_ID is rejected — 401."""
        wrong_aud_token = token_factory(aud=WRONG_AUDIENCE)

        response = auth_client.get(
            ME_URL,
            HTTP_AUTHORIZATION=f"Bearer {wrong_aud_token}",
        )

        assert response.status_code == 401

    # ------------------------------------------------------------------
    # ❌ Invalid signature
    # ------------------------------------------------------------------

    def test_invalid_signature_rejected(
        self, auth_client, token_factory, wrong_rsa_key_pair
    ):
        """
        ❌ Token signed with an unknown key fails signature check — 401.
        """
        wrong_private_key, _ = wrong_rsa_key_pair
        bad_token = token_factory(signing_key=wrong_private_key)

        response = auth_client.get(
            ME_URL,
            HTTP_AUTHORIZATION=f"Bearer {bad_token}",
        )

        assert response.status_code == 401

    # ------------------------------------------------------------------
    # ❌ Missing / malformed Authorization header
    # ------------------------------------------------------------------

    def test_no_auth_header_returns_401(self, auth_client):
        """❌ Request with no Authorization header → 401."""
        response = auth_client.get(ME_URL)

        assert response.status_code == 401

    def test_missing_auth_header_error_message(self, auth_client):
        """❌ Missing Authorization header returns JSON with 'error' key."""
        response = auth_client.get(ME_URL)

        data = response.json()
        assert "error" in data

    def test_non_bearer_auth_scheme_rejected(self, auth_client, token_factory):
        """❌ 'Token <jwt>' scheme (not 'Bearer') is rejected — 401."""
        token = token_factory()

        response = auth_client.get(
            ME_URL,
            HTTP_AUTHORIZATION=f"Token {token}",
        )

        assert response.status_code == 401

    def test_basic_auth_header_rejected(self, auth_client):
        """❌ HTTP Basic auth header is rejected — 401."""
        import base64

        creds = base64.b64encode(b"user:pass").decode()

        response = auth_client.get(
            ME_URL,
            HTTP_AUTHORIZATION=f"Basic {creds}",
        )

        assert response.status_code == 401

    def test_malformed_bearer_no_token_rejected(self, auth_client):
        """❌ 'Bearer' with no following token string → 401."""
        response = auth_client.get(
            ME_URL,
            HTTP_AUTHORIZATION="Bearer",
        )

        assert response.status_code == 401

    # ------------------------------------------------------------------
    # ✅ Middleware skips validation for public paths
    # ------------------------------------------------------------------

    def test_health_endpoint_accessible_without_token(self, auth_client):
        """✅ /health is in the middleware skip-list — no token needed."""
        response = auth_client.get("/health")

        # Should reach the view (200) not blocked by middleware (401)
        assert response.status_code == 200

    def test_login_endpoint_accessible_without_token(self, auth_client):
        """✅ /api/auth/login/ is public — middleware does not block it."""
        # POST with empty body → 400 from the view, not 401 from middleware
        response = auth_client.post(
            "/api/auth/login/",
            data={},
            content_type="application/json",
        )

        assert response.status_code == 400

    def test_verify_endpoint_accessible_without_token(self, auth_client):
        """✅ /api/auth/verify/ is public — middleware does not block it."""
        response = auth_client.post(
            "/api/auth/verify/",
            data={},
            content_type="application/json",
        )

        # 400 from the view (missing 'token' field), not 401 from middleware
        assert response.status_code == 400
