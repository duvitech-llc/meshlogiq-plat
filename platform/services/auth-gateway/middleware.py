"""
JWT authentication middleware for Keycloak tokens.
"""
import jwt
from jwt import PyJWKClient
from django.conf import settings
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
import requests
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction


def _audience_matches(payload, accepted_audiences):
    """Return True when token aud/azp matches one of the accepted audiences."""
    token_aud = payload.get('aud')
    token_azp = payload.get('azp')

    if isinstance(token_aud, str):
        token_audiences = {token_aud}
    elif isinstance(token_aud, (list, tuple, set)):
        token_audiences = {str(aud) for aud in token_aud}
    else:
        token_audiences = set()

    if token_azp:
        token_audiences.add(str(token_azp))

    return bool(token_audiences.intersection(set(accepted_audiences)))


def _issuer_matches(token_issuer, accepted_issuers):
    """Return True when token issuer matches any accepted issuer (trailing slash tolerant)."""
    if not token_issuer:
        return False

    normalized_token_issuer = str(token_issuer).rstrip('/')
    normalized_issuers = {str(issuer).rstrip('/') for issuer in accepted_issuers}
    return normalized_token_issuer in normalized_issuers


def _upsert_local_user(UserModel, *, keycloak_user_id, username, email, first_name='', last_name='', is_service_account=False):
    """
    Resolve/create a local user for a Keycloak subject without violating
    username/email uniqueness constraints.
    """
    keycloak_user_id = str(keycloak_user_id) if keycloak_user_id else ''
    username = (username or '').strip()
    email = (email or '').strip()

    if not username:
      username = email.split('@')[0] if email and '@' in email else f'user-{keycloak_user_id[:8]}'
    if not email:
      email = f'{username}@meshlogiq.local'

    # 1) Preferred match: existing Keycloak-linked user
    existing = UserModel.objects.filter(keycloak_user_id=keycloak_user_id).first()
    if existing:
        updated = False
        if existing.username != username and not is_service_account:
            existing.username = username
            updated = True
        if existing.email != email:
            existing.email = email
            updated = True
        if not is_service_account:
            if first_name and existing.first_name != first_name:
                existing.first_name = first_name
                updated = True
            if last_name and existing.last_name != last_name:
                existing.last_name = last_name
                updated = True
        if existing.is_service_account != is_service_account:
            existing.is_service_account = is_service_account
            updated = True
        if updated:
            existing.save()
        return existing

    # 2) Reconcile legacy/local user by username or email and link Keycloak subject
    candidate = UserModel.objects.filter(username=username).first() if username else None
    if not candidate and email:
        candidate = UserModel.objects.filter(email=email).first()

    if candidate:
        candidate.keycloak_user_id = keycloak_user_id
        candidate.username = username
        candidate.email = email
        if not is_service_account:
            candidate.first_name = first_name or candidate.first_name
            candidate.last_name = last_name or candidate.last_name
        candidate.is_service_account = is_service_account
        candidate.save()
        return candidate

    # 3) Create new user; if race/constraint collision happens, retry reconcile path
    defaults = {
        'username': username,
        'email': email,
        'is_service_account': is_service_account,
    }
    if not is_service_account:
        defaults['first_name'] = first_name
        defaults['last_name'] = last_name

    try:
        with transaction.atomic():
            return UserModel.objects.create(keycloak_user_id=keycloak_user_id, **defaults)
    except IntegrityError:
        fallback = UserModel.objects.filter(username=username).first() or UserModel.objects.filter(email=email).first()
        if not fallback:
            raise
        fallback.keycloak_user_id = keycloak_user_id
        fallback.is_service_account = is_service_account
        if not is_service_account:
            fallback.first_name = first_name or fallback.first_name
            fallback.last_name = last_name or fallback.last_name
        fallback.save()
        return fallback


class KeycloakJWTAuthMiddleware(MiddlewareMixin):
    """
    Middleware to authenticate requests using Keycloak JWT tokens.
    
    Expects the Authorization header with Bearer token format:
    Authorization: Bearer <jwt-token>
    """
    
    def __init__(self, get_response=None):
        self.get_response = get_response
        self.jwks_client = PyJWKClient(settings.KEYCLOAK_JWKS_URL)
        self.User = get_user_model()
    
    def process_request(self, request):
        """Process incoming request and validate JWT token."""
        # Build admin prefix dynamically from settings (e.g. "admin/" → "/admin/")
        admin_prefix = '/' + settings.DJANGO_ADMIN_URL.lstrip('/')

        # Skip for admin and health check endpoints
        if request.path.startswith(admin_prefix) or request.path.startswith('/health'):
            return None
        
        # Skip for public endpoints
        public_paths = [
            '/api/auth/login/',
            '/api/auth/register/',
            '/api/auth/jwks/',
            '/api/auth/verify/',  # token validation endpoint — carries its own token in the body
        ]
        if any(request.path.startswith(path) for path in public_paths):
            return None
        
        # Get Authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header.startswith('Bearer '):
            return JsonResponse(
                {'error': 'Authorization header missing or invalid'},
                status=401
            )
        
        token = auth_header.split(' ')[1]
        
        try:
            # Get signing key from JWKS
            signing_key = self.jwks_client.get_signing_key_from_jwt(token)
            
            # Decode and verify token — enforce issuer so tokens from a
            # different realm / authority are rejected.
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=['RS256'],
                options={
                    "verify_exp": True,
                    "verify_iss": False,
                    "verify_aud": False,
                    "require": ["exp", "iat", "iss", "sub"],
                },
            )

            if not _issuer_matches(payload.get('iss'), settings.KEYCLOAK_ACCEPTED_ISSUERS):
                return JsonResponse(
                    {'error': 'Invalid token issuer'},
                    status=401
                )

            if not _audience_matches(payload, settings.KEYCLOAK_ACCEPTED_AUDIENCES):
                return JsonResponse(
                    {'error': 'Invalid token audience'},
                    status=401
                )
            
            # Add token payload to request for use in views
            request.auth_payload = payload
            request.auth_token = token
            
            # Extract user information from token
            request.user_id = payload.get('sub')
            request.username = payload.get('preferred_username', '')
            request.email = payload.get('email', '')
            
            # Check if this is a service account (has client_id in payload)
            is_service_account = payload.get('client_id') in settings.KEYCLOAK_ACCEPTED_AUDIENCES
            
            if is_service_account:
                request.user = _upsert_local_user(
                    self.User,
                    keycloak_user_id=request.user_id,
                    username=payload.get('client_id', 'service-account'),
                    email=payload.get('email', 'service@meshlogiq.local'),
                    is_service_account=True,
                )
            else:
                request.user = _upsert_local_user(
                    self.User,
                    keycloak_user_id=request.user_id,
                    username=payload.get('preferred_username', ''),
                    email=payload.get('email', ''),
                    first_name=payload.get('given_name', ''),
                    last_name=payload.get('family_name', ''),
                    is_service_account=False,
                )
            
            # Make user available for DRF permissions
            request.user = request.user
            
            return None
            
        except jwt.ExpiredSignatureError:
            return JsonResponse(
                {'error': 'Token has expired'},
                status=401
            )
        except jwt.InvalidTokenError as e:
            return JsonResponse(
                {'error': f'Invalid token: {str(e)}'},
                status=401
            )
        except Exception as e:
            return JsonResponse(
                {'error': f'Authentication failed: {str(e)}'},
                status=401
            )
