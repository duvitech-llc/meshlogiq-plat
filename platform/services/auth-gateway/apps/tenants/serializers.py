"""
Serializers for tenants app.
"""
from rest_framework import serializers
from .models import Tenant, TenantUser, TenantSetting


class TenantSerializer(serializers.ModelSerializer):
    """Serializer for Tenant model."""
    class Meta:
        model = Tenant
        fields = [
            'id',
            'org_id',
            'org_name',
            'subscription_plan',
            'max_devices',
            'storage_quota_gb',
            'rate_limit_rpm',
            'keycloak_realm',
            'feature_flags',
            'current_device_count',
            'current_storage_gb',
            'stripe_customer_id',
            'stripe_subscription_id',
            'billing_email',
            'created_at',
            'upgraded_at',
            'downgraded_at',
            'downgrade_effective_date',
            'status',
            'metadata',
        ]
        read_only_fields = [
            'id',
            'org_id',
            'current_device_count',
            'current_storage_gb',
            'created_at',
            'upgraded_at',
            'downgraded_at',
            'downgrade_effective_date',
        ]


class TenantUserSerializer(serializers.ModelSerializer):
    """Serializer for TenantUser model."""
    user = serializers.CharField(source='user.email', read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)
    tenant = serializers.CharField(source='tenant.org_id', read_only=True)
    tenant_id = serializers.UUIDField(write_only=True, required=False)
    
    class Meta:
        model = TenantUser
        fields = [
            'id',
            'user',
            'user_id',
            'tenant',
            'tenant_id',
            'role',
            'is_active',
            'created_at',
            'invited_by',
        ]
        read_only_fields = ['id', 'created_at', 'invited_by']


class TenantSettingSerializer(serializers.ModelSerializer):
    """Serializer for TenantSetting model."""
    class Meta:
        model = TenantSetting
        fields = [
            'id',
            'tenant',
            'key',
            'value',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']