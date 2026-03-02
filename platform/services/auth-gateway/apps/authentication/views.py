"""
Views for authentication app.
"""
import requests
from django.conf import settings
from django.http import JsonResponse
from rest_framework import views, viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
import jwt
from jwt import PyJWKClient

from .models import MeshLogIQUser, UserProfile


class JWKSView(views.APIView):
    """Keycloak JWKS endpoint for token verification."""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Return Keycloak's JWKS for token verification."""
        try:
            response = requests.get(settings.KEYCLOAK_JWKS_URL)
            response.raise_for_status()
            return JsonResponse(response.json())
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)


class LoginView(views.APIView):
    """Login view - returns Keycloak token directly."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Handle login with username/password via Keycloak."""
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'error': 'Username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get Keycloak admin token
            admin_token = self._get_admin_token()
            
            # Get user from Keycloak
            users_url = f"{settings.KEYCLOAK_URL}/admin/realms/{settings.KEYCLOAK_REALM}/users"
            headers = {'Authorization': f'Bearer {admin_token}'}
            params = {'username': username}
            
            response = requests.get(users_url, headers=headers, params=params)
            if response.status_code != 200:
                return Response(
                    {'error': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            users = response.json()
            if not users:
                return Response(
                    {'error': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            user_id = users[0]['id']
            
            # Authenticate with credentials
            token_url = f"{settings.KEYCLOAK_URL}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/token"
            data = {
                'client_id': settings.KEYCLOAK_CLIENT_ID,
                'client_secret': settings.KEYCLOAK_CLIENT_SECRET,
                'grant_type': 'password',
                'username': username,
                'password': password,
            }
            
            response = requests.post(token_url, data=data)
            
            if response.status_code != 200:
                return Response(
                    {'error': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            token_data = response.json()
            
            # Get or create local user record
            user, created = MeshLogIQUser.objects.get_or_create(
                keycloak_user_id=user_id,
                defaults={
                    'username': username,
                    'email': users[0].get('email', ''),
                    'first_name': users[0].get('firstName', ''),
                    'last_name': users[0].get('lastName', ''),
                }
            )
            
            # Record login
            user.record_login()
            
            return Response({
                'access_token': token_data['access_token'],
                'refresh_token': token_data['refresh_token'],
                'expires_in': token_data['expires_in'],
                'token_type': token_data['token_type'],
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'keycloak_user_id': user.keycloak_user_id,
                }
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _get_admin_token(self):
        """Get Keycloak admin access token."""
        admin_url = f"{settings.KEYCLOAK_URL}/realms/master/protocol/openid-connect/token"
        data = {
            'client_id': 'admin-cli',
            'grant_type': 'password',
            'username': settings.KEYCLOAK_ADMIN_USERNAME,
            'password': settings.KEYCLOAK_ADMIN_PASSWORD,
        }
        response = requests.post(admin_url, data=data)
        response.raise_for_status()
        return response.json()['access_token']


class LogoutView(views.APIView):
    """Logout view to invalidate tokens."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Handle user logout."""
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                # Revoke token in Keycloak
                revoke_url = f"{settings.KEYCLOAK_URL}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/token"
                data = {
                    'client_id': settings.KEYCLOAK_CLIENT_ID,
                    'client_secret': settings.KEYCLOAK_CLIENT_SECRET,
                    'token': refresh_token,
                }
                requests.post(revoke_url, data=data)
            
            return Response({'message': 'Successfully logged out'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RegisterView(views.APIView):
    """Registration view for new users."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Handle user registration in Keycloak."""
        email = request.data.get('email')
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not all([email, username, password]):
            return Response(
                {'error': 'Email, username, and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create user in Keycloak
            admin_token = self._get_admin_token()
            
            create_url = f"{settings.KEYCLOAK_URL}/admin/realms/{settings.KEYCLOAK_REALM}/users"
            headers = {'Authorization': f'Bearer {admin_token}'}
            data = {
                'username': username,
                'email': email,
                'firstName': request.data.get('first_name', ''),
                'lastName': request.data.get('last_name', ''),
                'enabled': True,
                'credentials': [{'type': 'password', 'value': password, 'temporary': False}],
            }
            
            response = requests.post(create_url, headers=headers, json=data)
            
            if response.status_code != 201:
                return Response(
                    {'error': 'Failed to create user in Keycloak'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CurrentUserView(views.APIView):
    """Get current authenticated user info."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Return current user information."""
        user = request.user
        
        return Response({
            'id': str(user.id),
            'email': user.email,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'keycloak_user_id': user.keycloak_user_id,
            'is_staff': user.is_staff,
            'is_active': user.is_active,
            'created_at': user.created_at.isoformat(),
        })


class VerifyTokenView(views.APIView):
    """Verify Keycloak token validity."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Verify if a token is valid."""
        token = request.data.get('token')
        
        if not token:
            return Response(
                {'error': 'Token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get JWKS from Keycloak
            jwks_client = PyJWKClient(settings.KEYCLOAK_JWKS_URL)
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            
            # Decode and verify token
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=['RS256'],
                audience=settings.KEYCLOAK_CLIENT_ID,
                options={"verify_exp": True}
            )
            
            return Response({
                'valid': True,
                'payload': payload,
            })
        except jwt.ExpiredSignatureError:
            return Response({
                'valid': False,
                'error': 'Token has expired',
            })
        except jwt.InvalidTokenError as e:
            return Response({
                'valid': False,
                'error': str(e),
            })


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for managing users."""
    queryset = MeshLogIQUser.objects.all()
    serializer_class = None  # Add serializer when needed
    
    def get_permissions(self):
        if self.action == 'list':
            self.permission_classes = [IsAuthenticated]
        elif self.action == 'retrieve':
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()


class ProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user profiles."""
    queryset = UserProfile.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)