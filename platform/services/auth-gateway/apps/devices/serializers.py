"""
Serializers for devices app.
"""
from rest_framework import serializers
from .models import Device, ProvisionToken, DeviceLog


class DeviceSerializer(serializers.ModelSerializer):
    """Serializer for Device model."""
    class Meta:
        model = Device
        fields = [
            'id',
            'device_id',
            'device_name',
            'device_type',
            'hw_fingerprint',
            'org_id',
            'tier_at_provision',
            'current_tier',
            'cert_serial_number',
            'cert_issued_at',
            'cert_expires_at',
            'cert_revoked_at',
            'status',
            'created_at',
            'provisioned_at',
            'last_seen_at',
            'metadata',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'provisioned_at',
            'last_seen_at',
            'cert_serial_number',
            'cert_issued_at',
            'cert_expires_at',
            'cert_revoked_at',
        ]


class ProvisionTokenSerializer(serializers.ModelSerializer):
    """Serializer for ProvisionToken model."""
    class Meta:
        model = ProvisionToken
        fields = [
            'id',
            'device',
            'token',
            'expires_at',
            'used_at',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'used_at']


class DeviceLogSerializer(serializers.ModelSerializer):
    """Serializer for DeviceLog model."""
    class Meta:
        model = DeviceLog
        fields = [
            'id',
            'device',
            'event_type',
            'message',
            'metadata',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class DeviceProvisionRequestSerializer(serializers.Serializer):
    """Serializer for device provisioning request."""
    device_id = serializers.CharField(required=True)
    device_name = serializers.CharField(required=True)
    device_type = serializers.CharField(required=True)
    org_id = serializers.CharField(required=True)
    metadata = serializers.JSONField(required=False, default=dict)


class TelemetryDataSerializer(serializers.Serializer):
    """Serializer for telemetry data."""
    timestamp = serializers.DateTimeField(required=True)
    data = serializers.JSONField(required=True)


class TelemetryBatchSerializer(serializers.Serializer):
    """Serializer for telemetry batch request."""
    device_id = serializers.CharField(required=True)
    data = serializers.ListField(child=serializers.JSONField(), required=True)


class DeviceCommandSerializer(serializers.Serializer):
    """Serializer for device command request."""
    command = serializers.CharField(required=True)
    parameters = serializers.JSONField(required=False, default=dict)