"""
Tenant models for multi-tenancy support.
"""
from django.db import models
from django.utils import timezone
import uuid
from django.conf import settings


class Tenant(models.Model):
    """
    Tenant/organization model for multi-tenancy support.
    
    Each tenant has its own isolated data space, subscription tier,
    and configuration settings.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Organization identification
    org_id = models.CharField(max_length=32, unique=True)
    org_name = models.CharField(max_length=255)
    
    # Subscription tier
    SUBSCRIPTION_FREE = 'free'
    SUBSCRIPTION_BASIC = 'basic'
    SUBSCRIPTION_ENTERPRISE = 'enterprise'
    SUBSCRIPTION_CHOICES = [
        (SUBSCRIPTION_FREE, 'Free'),
        (SUBSCRIPTION_BASIC, 'Basic'),
        (SUBSCRIPTION_ENTERPRISE, 'Enterprise'),
    ]
    subscription_plan = models.CharField(
        max_length=20,
        choices=SUBSCRIPTION_CHOICES,
        default=SUBSCRIPTION_FREE
    )
    
    # Quotas
    max_devices = models.IntegerField(default=1)  # Free tier default
    storage_quota_gb = models.IntegerField(default=2)  # Free tier default
    rate_limit_rpm = models.IntegerField(default=100)  # Free tier default
    
    # Keycloak realm
    keycloak_realm = models.CharField(max_length=100, default='meshlogiq')
    
    # Feature flags
    feature_flags = models.JSONField(default=dict)
    
    # Current usage (cached)
    current_device_count = models.IntegerField(default=0)
    current_storage_gb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Billing
    stripe_customer_id = models.CharField(max_length=100, blank=True)
    stripe_subscription_id = models.CharField(max_length=100, blank=True)
    billing_email = models.EmailField(blank=True)
    
    # Lifecycle
    created_at = models.DateTimeField(default=timezone.now)
    upgraded_at = models.DateTimeField(blank=True, null=True)
    downgraded_at = models.DateTimeField(blank=True, null=True)
    downgrade_effective_date = models.DateField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        default='active',
        choices=[
            ('active', 'Active'),
            ('suspended', 'Suspended'),
            ('deleted', 'Deleted'),
        ]
    )
    
    # Metadata
    metadata = models.JSONField(default=dict)
    
    class Meta:
        verbose_name = 'Tenant'
        verbose_name_plural = 'Tenants'
        indexes = [
            models.Index(fields=['org_id']),
            models.Index(fields=['subscription_plan']),
        ]
    
    def __str__(self):
        return self.org_name
    
    def update_usage(self):
        """Update current usage metrics."""
        from apps.devices.models import Device
        
        self.current_device_count = Device.objects.filter(
            org_id=self.org_id,
            status__in=['active', 'provisioned']
        ).count()
        
        # Update storage usage (to be implemented with MinIO)
        self.save(update_fields=['current_device_count'])
    
    def can_provision_device(self):
        """Check if tenant can provision more devices."""
        return self.current_device_count < self.max_devices
    
    def get_feature_flags(self):
        """Get feature flags for this tenant."""
        default_flags = {
            'fleet_management': self.subscription_plan == 'enterprise',
            'advanced_analytics': self.subscription_plan in ['basic', 'enterprise'],
            'custom_integrations': self.subscription_plan == 'enterprise',
            'webhook_automation': self.subscription_plan in ['basic', 'enterprise'],
            'audit_logging': self.subscription_plan == 'enterprise',
            'data_export': self.subscription_plan in ['basic', 'enterprise'],
            'model_registry': self.subscription_plan in ['basic', 'enterprise'],
            'ros2_integration': self.subscription_plan == 'enterprise',
            'sla_monitoring': self.subscription_plan == 'enterprise',
        }
        return {**default_flags, **self.feature_flags}


class TenantUser(models.Model):
    """
    Link users to tenants with specific roles.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    
    # Role in tenant
    ROLE_OWNER = 'owner'
    ROLE_ADMIN = 'admin'
    ROLE_DEVELOPER = 'developer'
    ROLE_OPERATOR = 'operator'
    ROLE_VIEWER = 'viewer'
    ROLE_CHOICES = [
        (ROLE_OWNER, 'Owner'),
        (ROLE_ADMIN, 'Admin'),
        (ROLE_DEVELOPER, 'Developer'),
        (ROLE_OPERATOR, 'Operator'),
        (ROLE_VIEWER, 'Viewer'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_VIEWER)
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='invitations'
    )
    
    class Meta:
        unique_together = ['user', 'tenant']
        indexes = [
            models.Index(fields=['tenant', 'role']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.tenant.org_name} ({self.role})"
    
    def has_permission(self, permission):
        """Check if user has a specific permission based on role."""
        role_permissions = {
            self.ROLE_OWNER: [
                'billing:read', 'billing:write',
                'user:read', 'user:write', 'user:delete',
                'device:read', 'device:write', 'device:delete',
                'data:read', 'data:write', 'data:delete',
                'model:read', 'model:write', 'model:delete',
                'system:read', 'system:write',
            ],
            self.ROLE_ADMIN: [
                'user:read', 'user:write', 'user:delete',
                'device:read', 'device:write', 'device:delete',
                'data:read', 'data:write',
                'model:read', 'model:write',
                'system:read',
            ],
            self.ROLE_DEVELOPER: [
                'device:read', 'device:write',
                'data:read', 'data:write',
                'model:read', 'model:write',
            ],
            self.ROLE_OPERATOR: [
                'device:read',
                'data:read',
            ],
            self.ROLE_VIEWER: [
                'data:read',
            ],
        }
        return permission in role_permissions.get(self.role, [])


class TenantSetting(models.Model):
    """
    Tenant-specific settings and configuration.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='settings')
    
    # Setting key-value pairs
    key = models.CharField(max_length=255)
    value = models.JSONField()
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['tenant', 'key']
        indexes = [
            models.Index(fields=['tenant', 'key']),
        ]
    
    def __str__(self):
        return f"{self.tenant.org_name}.{self.key}"