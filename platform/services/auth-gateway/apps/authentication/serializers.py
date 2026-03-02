"""
Serializers for authentication app.
"""
from rest_framework import serializers
from django.conf import settings
from .models import MeshLogIQUser, UserProfile


class MeshLogIQUserSerializer(serializers.ModelSerializer):
    """Serializer for MeshLogIQUser model."""
    class Meta:
        model = MeshLogIQUser
        fields = [
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'keycloak_user_id',
            'is_active',
            'created_at',
            'last_login_at',
        ]
        read_only_fields = ['id', 'keycloak_user_id', 'created_at', 'last_login_at']


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model."""
    user = MeshLogIQUserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)
    
    class Meta:
        model = UserProfile
        fields = [
            'id',
            'user',
            'user_id',
            'timezone',
            'language',
            'theme',
            'notifications_enabled',
            'tenant_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']


class LoginRequestSerializer(serializers.Serializer):
    """Serializer for login request."""
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, style={'input_type': 'password'})


class RegisterRequestSerializer(serializers.Serializer):
    """Serializer for registration request."""
    email = serializers.EmailField(required=True)
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, style={'input_type': 'password'})
    first_name = serializers.CharField(required=False, default='')
    last_name = serializers.CharField(required=False, default='')


class TokenVerifyRequestSerializer(serializers.Serializer):
    """Serializer for token verification request."""
    token = serializers.CharField(required=True)