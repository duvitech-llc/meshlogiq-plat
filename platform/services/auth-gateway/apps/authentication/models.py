"""
Authentication models for MeshLogIQ Auth Gateway.
"""
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone as tz
import uuid


class MeshLogIQUser(AbstractUser):
    """
    Custom user model extending Django's AbstractUser.
    
    This model represents a user in the MeshLogIQ platform.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Keycloak user ID (for linking with Keycloak authentication)
    keycloak_user_id = models.CharField(max_length=255, unique=True, blank=True, null=True)
    
    # Profile information
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(default=tz.now)
    last_login_at = models.DateTimeField(blank=True, null=True)
    
    # Status
    is_service_account = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        indexes = [
            models.Index(fields=['keycloak_user_id']),
        ]
    
    def __str__(self):
        return self.email
    
    @property
    def full_name(self):
        """Return the user's full name."""
        return f"{self.first_name} {self.last_name}".strip()
    
    def record_login(self):
        """Record the user's login timestamp."""
        self.last_login_at = tz.now()
        self.save(update_fields=['last_login_at'])


class UserProfile(models.Model):
    """
    Additional user profile information.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(MeshLogIQUser, on_delete=models.CASCADE, related_name='profile')
    
    # User preferences
    timezone = models.CharField(max_length=100, default='UTC')
    language = models.CharField(max_length=10, default='en')
    
    # Profile settings
    theme = models.CharField(max_length=20, default='light')
    notifications_enabled = models.BooleanField(default=True)
    
    # Tenant association (for multi-tenancy)
    tenant_id = models.UUIDField(blank=True, null=True)
    
    created_at = models.DateTimeField(default=tz.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Profile for {self.user.email}"