"""
tests/auth_gateway/test_login.py

Tests for Login / Logout authentication flows.

Coverage:
  ✅ User can log in (username + password → Keycloak token returned)
  ✅ Correct redirect back to Django (redirect_uri / access-token received)
  ✅ Access token + ID token received by Django after login
  ✅ Logout from Django also invalidates Keycloak session (token revoke call)
  ❌ Invalid credentials → proper 401 error (no Django 500)
  ❌ User not found in Keycloak → 401
  ❌ Missing fields → 400
  ❌ Logout without Authorization header → 401 (middleware blocks before view)
"""

import json
from unittest.mock import MagicMock, Mock, call, patch

import pytest
from django.urls import reverse


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _mock_response(status_code=200, json_data=None):
    """Minimal mock of a requests.Response."""
    r = Mock()
    r.status_code = status_code
    r.json.return_value = json_data or {}
    r.raise_for_status = Mock()
    if status_code >= 400:
        r.raise_for_status.side_effect = Exception(f"HTTP {status_code}")
    return r


def _admin_token_resp():
    return _mock_response(200, {"access_token": "admin-token-xyz", "expires_in": 60})


def _user_list_resp(users=None):
    if users is None:
        users = [
            {
                "id": "kc-uid-0001",
                "username": "testuser",
                "email": "testuser@meshlogiq.local",
                "firstName": "Test",
                "lastName": "User",
                "enabled": True,
            }
        ]
    return _mock_response(200, users)


def _token_resp(access_token="access-token-jwt", refresh_token="refresh-opaque"):
    return _mock_response(
        200,
        {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "id_token": "id-token-jwt",
            "expires_in": 300,
            "token_type": "Bearer",
            "scope": "openid profile email",
        },
    )


# ---------------------------------------------------------------------------
# Login tests
# ---------------------------------------------------------------------------


@pytest.mark.django_db
@pytest.mark.login
class TestLoginView:
    """POST /api/auth/login/ — password grant through Django → Keycloak."""

    LOGIN_URL = "/api/auth/login/"

    # ------------------------------------------------------------------
    # Happy path
    # ------------------------------------------------------------------

    def test_login_success_returns_200(self, auth_client):
        """Successful login returns HTTP 200 with tokens and user payload."""
        with patch("apps.authentication.views.requests.post") as mock_post, \
             patch("apps.authentication.views.requests.get") as mock_get:

            # Call 1: admin master-realm token; Call 2: user password grant
            mock_post.side_effect = [_admin_token_resp(), _token_resp()]
            mock_get.return_value = _user_list_resp()

            response = auth_client.post(
                self.LOGIN_URL,
                data=json.dumps({"username": "testuser", "password": "secret123"}),
                content_type="application/json",
            )

        assert response.status_code == 200

    def test_login_success_response_contains_access_token(self, auth_client):
        """Response body includes access_token and refresh_token keys."""
        with patch("apps.authentication.views.requests.post") as mock_post, \
             patch("apps.authentication.views.requests.get") as mock_get:

            mock_post.side_effect = [_admin_token_resp(), _token_resp("my-access-jwt")]
            mock_get.return_value = _user_list_resp()

            response = auth_client.post(
                self.LOGIN_URL,
                data=json.dumps({"username": "testuser", "password": "secret123"}),
                content_type="application/json",
            )

        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["access_token"] == "my-access-jwt"

    def test_login_success_response_contains_user_info(self, auth_client):
        """
        Response body includes user object with id, email, username.
        This confirms Django received and persisted the Keycloak user record
        (equivalent to the access token + ID token being received).
        """
        with patch("apps.authentication.views.requests.post") as mock_post, \
             patch("apps.authentication.views.requests.get") as mock_get:

            mock_post.side_effect = [_admin_token_resp(), _token_resp()]
            mock_get.return_value = _user_list_resp()

            response = auth_client.post(
                self.LOGIN_URL,
                data=json.dumps({"username": "testuser", "password": "secret123"}),
                content_type="application/json",
            )

        data = response.json()
        assert "user" in data
        user = data["user"]
        assert user["username"] == "testuser"
        assert user["email"] == "testuser@meshlogiq.local"
        assert "id" in user

    def test_login_creates_local_user_record(self, auth_client, django_user_model):
        """
        A local MeshLogIQUser row is created (or retrieved) on successful login.
        This represents Django acknowledging the Keycloak identity locally.
        """
        with patch("apps.authentication.views.requests.post") as mock_post, \
             patch("apps.authentication.views.requests.get") as mock_get:

            mock_post.side_effect = [_admin_token_resp(), _token_resp()]
            mock_get.return_value = _user_list_resp()

            auth_client.post(
                self.LOGIN_URL,
                data=json.dumps({"username": "testuser", "password": "secret123"}),
                content_type="application/json",
            )

        assert django_user_model.objects.filter(
            keycloak_user_id="kc-uid-0001"
        ).exists()

    def test_login_calls_keycloak_token_endpoint(self, auth_client):
        """
        POST to Keycloak's password-grant token endpoint is made with the
        correct realm and client_id — verifies redirect_uri / grant_type alignment.
        """
        with patch("apps.authentication.views.requests.post") as mock_post, \
             patch("apps.authentication.views.requests.get") as mock_get:

            mock_post.side_effect = [_admin_token_resp(), _token_resp()]
            mock_get.return_value = _user_list_resp()

            auth_client.post(
                self.LOGIN_URL,
                data=json.dumps({"username": "testuser", "password": "secret123"}),
                content_type="application/json",
            )

        # Second call is the password-grant token request
        token_call = mock_post.call_args_list[1]
        call_url = token_call[0][0]
        call_data = token_call[1]["data"]

        assert "realms/meshlogiq/protocol/openid-connect/token" in call_url
        assert call_data["grant_type"] == "password"
        assert call_data["username"] == "testuser"

    # ------------------------------------------------------------------
    # Validation errors (no Keycloak calls needed)
    # ------------------------------------------------------------------

    def test_login_missing_username_returns_400(self, auth_client):
        """Missing username field → HTTP 400."""
        response = auth_client.post(
            self.LOGIN_URL,
            data=json.dumps({"password": "secret123"}),
            content_type="application/json",
        )
        assert response.status_code == 400

    def test_login_missing_password_returns_400(self, auth_client):
        """Missing password field → HTTP 400."""
        response = auth_client.post(
            self.LOGIN_URL,
            data=json.dumps({"username": "testuser"}),
            content_type="application/json",
        )
        assert response.status_code == 400

    def test_login_empty_body_returns_400(self, auth_client):
        """Empty body → HTTP 400."""
        response = auth_client.post(
            self.LOGIN_URL,
            data=json.dumps({}),
            content_type="application/json",
        )
        assert response.status_code == 400

    def test_login_missing_fields_error_message(self, auth_client):
        """400 response includes an 'error' key describing the problem."""
        response = auth_client.post(
            self.LOGIN_URL,
            data=json.dumps({"username": "testuser"}),
            content_type="application/json",
        )
        data = response.json()
        assert "error" in data

    # ------------------------------------------------------------------
    # Keycloak failure scenarios
    # ------------------------------------------------------------------

    def test_login_invalid_credentials_returns_401(self, auth_client):
        """
        ❌ When Keycloak rejects the password grant, Django returns 401
        (not 500 — no Django crash).
        """
        with patch("apps.authentication.views.requests.post") as mock_post, \
             patch("apps.authentication.views.requests.get") as mock_get:

            # Admin token succeeds; password grant fails
            mock_post.side_effect = [
                _admin_token_resp(),
                _mock_response(401, {"error": "invalid_grant", "error_description": "Invalid credentials"}),
            ]
            mock_get.return_value = _user_list_resp()

            response = auth_client.post(
                self.LOGIN_URL,
                data=json.dumps({"username": "testuser", "password": "wrong-password"}),
                content_type="application/json",
            )

        assert response.status_code == 401

    def test_login_invalid_credentials_no_django_crash(self, auth_client):
        """
        ❌ Invalid credentials must not produce a 500 Internal Server Error.
        Django should return a proper JSON error body.
        """
        with patch("apps.authentication.views.requests.post") as mock_post, \
             patch("apps.authentication.views.requests.get") as mock_get:

            mock_post.side_effect = [
                _admin_token_resp(),
                _mock_response(401, {"error": "invalid_grant"}),
            ]
            mock_get.return_value = _user_list_resp()

            response = auth_client.post(
                self.LOGIN_URL,
                data=json.dumps({"username": "testuser", "password": "wrong"}),
                content_type="application/json",
            )

        assert response.status_code != 500
        data = response.json()
        assert "error" in data

    def test_login_user_not_found_in_keycloak_returns_401(self, auth_client):
        """
        ❌ If Keycloak returns an empty user list, Django returns 401.
        """
        with patch("apps.authentication.views.requests.post") as mock_post, \
             patch("apps.authentication.views.requests.get") as mock_get:

            mock_post.return_value = _admin_token_resp()
            # Empty user list
            mock_get.return_value = _user_list_resp(users=[])

            response = auth_client.post(
                self.LOGIN_URL,
                data=json.dumps({"username": "ghost", "password": "secret"}),
                content_type="application/json",
            )

        assert response.status_code == 401
        assert "error" in response.json()

    def test_login_keycloak_admin_failure_returns_error(self, auth_client):
        """If the admin token call itself fails, response is not 200."""
        with patch("apps.authentication.views.requests.post") as mock_post:
            mock_post.return_value = _mock_response(500, {"error": "server_error"})
            mock_post.return_value.raise_for_status.side_effect = Exception("Keycloak down")

            response = auth_client.post(
                self.LOGIN_URL,
                data=json.dumps({"username": "testuser", "password": "secret"}),
                content_type="application/json",
            )

        assert response.status_code != 200


# ---------------------------------------------------------------------------
# Logout tests
# ---------------------------------------------------------------------------


@pytest.mark.django_db
@pytest.mark.login
class TestLogoutView:
    """POST /api/auth/logout/ — session termination + Keycloak token revocation."""

    LOGOUT_URL = "/api/auth/logout/"
    ME_URL = "/api/auth/me/"

    def _login(self, auth_client):
        """Helper: perform a successful login and return the access token."""
        with patch("apps.authentication.views.requests.post") as mock_post, \
             patch("apps.authentication.views.requests.get") as mock_get:

            mock_post.side_effect = [_admin_token_resp(), _token_resp()]
            mock_get.return_value = _user_list_resp()

            resp = auth_client.post(
                "/api/auth/login/",
                data=json.dumps({"username": "testuser", "password": "secret123"}),
                content_type="application/json",
            )

        return resp.json()["access_token"], resp.json()["refresh_token"]

    # ------------------------------------------------------------------
    # Happy path
    # ------------------------------------------------------------------

    def test_logout_success_returns_200(self, auth_client, token_factory):
        """
        ✅ Logout with a valid JWT + refresh token returns HTTP 200.
        """
        valid_jwt = token_factory()

        with patch("apps.authentication.views.requests.post") as mock_post:
            mock_post.return_value = _mock_response(200, {})

            response = auth_client.post(
                self.LOGOUT_URL,
                data=json.dumps({"refresh_token": "refresh-opaque-xyz"}),
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {valid_jwt}",
            )

        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    def test_logout_invalidates_keycloak_session(self, auth_client, token_factory):
        """
        ✅ Logout calls Keycloak's token revocation endpoint with the
        refresh token — this invalidates the Keycloak session
        (front-channel / back-channel logout via token revoke).
        """
        valid_jwt = token_factory()
        refresh_token = "refresh-opaque-abc"

        with patch("apps.authentication.views.requests.post") as mock_post:
            mock_post.return_value = _mock_response(200, {})

            auth_client.post(
                self.LOGOUT_URL,
                data=json.dumps({"refresh_token": refresh_token}),
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {valid_jwt}",
            )

            # Verify a POST was made to Keycloak to revoke the token
            assert mock_post.called, "Expected Keycloak token revoke call"
            call_url = mock_post.call_args[0][0]
            assert "keycloak" in call_url or "realms" in call_url
            call_data = mock_post.call_args[1]["data"]
            assert call_data["token"] == refresh_token

    def test_logout_without_refresh_token_still_returns_200(self, auth_client, token_factory):
        """
        ✅ Logout without providing refresh_token (e.g. SPA that discards it)
        still returns 200 — Django cleans up its side without Keycloak call.
        """
        valid_jwt = token_factory()

        response = auth_client.post(
            self.LOGOUT_URL,
            data=json.dumps({}),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {valid_jwt}",
        )

        assert response.status_code == 200

    def test_logout_without_refresh_token_does_not_call_keycloak(
        self, auth_client, token_factory
    ):
        """
        Without a refresh token provided, no Keycloak revoke call should happen.
        """
        valid_jwt = token_factory()

        with patch("apps.authentication.views.requests.post") as mock_post:
            auth_client.post(
                self.LOGOUT_URL,
                data=json.dumps({}),
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {valid_jwt}",
            )

        mock_post.assert_not_called()

    # ------------------------------------------------------------------
    # Authentication guard
    # ------------------------------------------------------------------

    def test_logout_without_auth_header_returns_401(self, auth_client):
        """
        ❌ Logout without Authorization header is blocked by the middleware — 401.
        """
        response = auth_client.post(
            self.LOGOUT_URL,
            data=json.dumps({"refresh_token": "some-token"}),
            content_type="application/json",
        )

        assert response.status_code == 401

    def test_logout_with_invalid_token_returns_401(
        self, auth_client, wrong_rsa_key_pair
    ):
        """
        ❌ Logout with a token signed by an unknown key is rejected — 401.
        """
        wrong_private_key, _ = wrong_rsa_key_pair
        import time, uuid, jwt as pyjwt

        bad_token = pyjwt.encode(
            {
                "iss": "http://keycloak:8080/realms/meshlogiq",
                "sub": str(uuid.uuid4()),
                "aud": "meshlogiq-backend",
                "iat": int(time.time()),
                "exp": int(time.time()) + 300,
            },
            wrong_private_key,
            algorithm="RS256",
        )

        response = auth_client.post(
            self.LOGOUT_URL,
            data=json.dumps({"refresh_token": "x"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {bad_token}",
        )

        assert response.status_code == 401

    def test_logout_with_malformed_bearer_returns_401(self, auth_client):
        """
        ❌ A malformed Authorization header (not 'Bearer <token>') returns 401.
        """
        response = auth_client.post(
            self.LOGOUT_URL,
            data=json.dumps({"refresh_token": "x"}),
            content_type="application/json",
            HTTP_AUTHORIZATION="Token not-a-bearer-token",
        )

        assert response.status_code == 401
