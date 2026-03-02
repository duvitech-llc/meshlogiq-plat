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
                audience=settings.KEYCLOAK_CLIENT_ID,
                issuer=settings.KEYCLOAK_ISSUER,
                options={
                    "verify_exp": True,
                    "require": ["exp", "iat", "iss", "aud", "sub"],
                },
            )
            
            # Add token payload to request for use in views
            request.auth_payload = payload
            request.auth_token = token
            
            # Extract user information from token
            request.user_id = payload.get('sub')
            request.username = payload.get('preferred_username', '')
            request.email = payload.get('email', '')
            
            # Check if this is a service account (has client_id in payload)
            is_service_account = payload.get('client_id') == settings.KEYCLOAK_CLIENT_ID
            
            if is_service_account:
                # For service accounts, create/update local user
                defaults = {
                    'email': payload.get('email', 'service@meshlogiq.local'),
                    'username': payload.get('client_id', 'service-account'),
                    'is_service_account': True,
                }
                request.user, _ = self.User.objects.get_or_create(
                    keycloak_user_id=request.user_id,
                    defaults=defaults
                )
            else:
                # For regular users, get or create local user
                request.user, _ = self.User.objects.get_or_create(
                    keycloak_user_id=request.user_id,
                    defaults={
                        'email': payload.get('email', ''),
                        'username': payload.get('preferred_username', ''),
                        'first_name': payload.get('given_name', ''),
                        'last_name': payload.get('family_name', ''),
                    }
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
