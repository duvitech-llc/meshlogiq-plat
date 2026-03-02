"""
Device models for device management.
"""
from django.db import models
from django.utils import timezone
import uuid
from django.conf import settings


class Device(models.Model):
    """
    Device model for edge devices and IoT sensors.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Device identification
    device_id = models.CharField(max_length=64, unique=True)
    device_name = models.CharField(max_length=255)
    device_type = models.CharField(max_length=50)  # e.g., 'jetson-orin-nx', 'raspberry-pi', 'esp32'
    
    # Hardware fingerprint for security
    hw_fingerprint = models.CharField(max_length=255, blank=True)
    
    # Tenant association
    org_id = models.CharField(max_length=32)
    
    # Tier binding
    tier_at_provision = models.CharField(max_length=20)
    current_tier = models.CharField(max_length=20)
    
    # Certificate details
    cert_serial_number = models.CharField(max_length=100, blank=True)
    cert_issued_at = models.DateTimeField(blank=True, null=True)
    cert_expires_at = models.DateTimeField(blank=True, null=True)
    cert_revoked_at = models.DateTimeField(blank=True, null=True)
    
    # Status
    STATUS_PENDING = 'pending'
    STATUS_PROVISIONED = 'provisioned'
    STATUS_ACTIVE = 'active'
    STATUS_DEACTIVATED = 'deactivated'
    STATUS_REVOKED = 'revoked'
    
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_PROVISIONED, 'Provisioned'),
        (STATUS_ACTIVE, 'Active'),
        (STATUS_DEACTIVATED, 'Deactivated'),
        (STATUS_REVOKED, 'Revoked'),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING
    )
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    provisioned_at = models.DateTimeField(blank=True, null=True)
    last_seen_at = models.DateTimeField(blank=True, null=True)
    
    # Metadata
    metadata = models.JSONField(default=dict)
    
    class Meta:
        verbose_name = 'Device'
        verbose_name_plural = 'Devices'
        indexes = [
            models.Index(fields=['org_id']),
            models.Index(fields=['status']),
            models.Index(fields=['org_id', 'status']),
            models.Index(fields=['cert_serial_number']),
        ]
    
    def __str__(self):
        return f"{self.device_name} ({self.device_id})"
    
    def provision(self, cert_serial_number):
        """Mark device as provisioned."""
        self.status = self.STATUS_PROVISIONED
        self.cert_serial_number = cert_serial_number
        self.provisioned_at = timezone.now()
        self.save()
    
    def activate(self):
        """Activate device."""
        self.status = self.STATUS_ACTIVE
        self.last_seen_at = timezone.now()
        self.save()
    
    def deactivate(self, reason=None):
        """Deactivate device."""
        self.status = self.STATUS_DEACTIVATED
        self.save()
    
    def revoke(self, reason=None):
        """Revoke device certificate."""
        self.status = self.STATUS_REVOKED
        self.cert_revoked_at = timezone.now()
        self.save()
    
    def update_last_seen(self):
        """Update the last seen timestamp."""
        self.last_seen_at = timezone.now()
        self.save(update_fields=['last_seen_at'])


class ProvisionToken(models.Model):
    """
    One-time provisioning token for device provisioning workflow.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='provision_tokens')
    token = models.CharField(max_length=255, unique=True)
    
    # Expiry
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = 'Provision Token'
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"Token for {self.device.device_id}"
    
    def is_valid(self):
        """Check if token is still valid."""
        return (
            self.expires_at > timezone.now() and
            self.used_at is None
        )
    
    def use(self):
        """Mark token as used."""
        self.used_at = timezone.now()
        self.save()


class DeviceLog(models.Model):
    """
    Log entries for device operations.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='logs')
    event_type = models.CharField(max_length=50)  # e.g., 'provisioned', 'activated', 'deactivated'
    message = models.TextField(blank=True)
    
    # Metadata
    metadata = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = 'Device Log'
        verbose_name_plural = 'Device Logs'
        indexes = [
            models.Index(fields=['device', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.device.device_id}: {self.event_type}"