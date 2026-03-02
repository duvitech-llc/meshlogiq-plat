"""
Views for devices app.
"""
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import Http404
from django.utils import timezone
from .models import Device, ProvisionToken, DeviceLog
from .serializers import (
    DeviceSerializer,
    ProvisionTokenSerializer,
    DeviceLogSerializer,
    TelemetryBatchSerializer,
    DeviceCommandSerializer,
)


class DeviceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing devices."""
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter devices by current user's org_id."""
        org_id = self.request.query_params.get('org_id')
        if org_id:
            return Device.objects.filter(org_id=org_id)
        return Device.objects.all()
    
    def perform_create(self, serializer):
        """Set org_id from request on creation."""
        serializer.save(org_id=self.request.data.get('org_id'))
    
    def update(self, request, *args, **kwargs):
        """Partial update for device."""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        if request.data.get('status') == 'active':
            instance.activate()
        elif request.data.get('status') == 'deactivated':
            instance.deactivate()
        elif request.data.get('status') == 'revoked':
            instance.revoke()
        
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Mark device as deleted instead of hard delete."""
        instance = self.get_object()
        instance.status = 'revoked'
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProvisionTokenViewSet(viewsets.ModelViewSet):
    """ViewSet for managing provision tokens."""
    queryset = ProvisionToken.objects.all()
    serializer_class = ProvisionTokenSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter tokens by current user's org_id."""
        org_id = self.request.query_params.get('org_id')
        if org_id:
            return ProvisionToken.objects.filter(device__org_id=org_id)
        return ProvisionToken.objects.all()
    
    def create(self, request, *args, **kwargs):
        """Create a new provision token for a device."""
        device_id = request.data.get('device_id')
        
        try:
            device = Device.objects.get(device_id=device_id)
        except Device.DoesNotExist:
            return Response(
                {'error': 'Device not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        import uuid
        token = str(uuid.uuid4())
        
        from datetime import timedelta
        expires_at = timezone.now() + timedelta(hours=24)
        
        provision_token = ProvisionToken.objects.create(
            device=device,
            token=token,
            expires_at=expires_at,
        )
        
        serializer = self.get_serializer(provision_token)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DeviceLogViewSet(viewsets.ModelViewSet):
    """ViewSet for device logs."""
    queryset = DeviceLog.objects.all()
    serializer_class = DeviceLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter logs by current user's org_id."""
        org_id = self.request.query_params.get('org_id')
        device_id = self.request.query_params.get('device_id')
        
        queryset = DeviceLog.objects.all()
        if org_id:
            queryset = queryset.filter(device__org_id=org_id)
        if device_id:
            queryset = queryset.filter(device_id=device_id)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Create a new log entry for a device."""
        device_id = request.data.get('device_id')
        event_type = request.data.get('event_type')
        message = request.data.get('message', '')
        metadata = request.data.get('metadata', {})
        
        try:
            device = Device.objects.get(device_id=device_id)
        except Device.DoesNotExist:
            return Response(
                {'error': 'Device not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        log = DeviceLog.objects.create(
            device=device,
            event_type=event_type,
            message=message,
            metadata=metadata,
        )
        
        serializer = self.get_serializer(log)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TelemetryViewSet(viewsets.ViewSet):
    """ViewSet for telemetry ingestion."""
    permission_classes = [IsAuthenticated]
    
    def create(self, request):
        """Ingest telemetry data."""
        serializer = TelemetryBatchSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        device_id = serializer.validated_data['device_id']
        data = serializer.validated_data['data']
        
        try:
            device = Device.objects.get(device_id=device_id)
        except Device.DoesNotExist:
            return Response(
                {'error': 'Device not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update last seen
        device.update_last_seen()
        
        # Process telemetry (to be implemented)
        return Response({
            'status': 'received',
            'device_id': device_id,
            'message_count': len(data),
        })


class CommandViewSet(viewsets.ViewSet):
    """ViewSet for device commands."""
    permission_classes = [IsAuthenticated]
    
    def create(self, request, device_id=None):
        """Send command to a device."""
        serializer = DeviceCommandSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            device = Device.objects.get(device_id=device_id)
        except Device.DoesNotExist:
            return Response(
                {'error': 'Device not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Send command to device (to be implemented with NATS/Redis)
        return Response({
            'status': 'sent',
            'device_id': device_id,
            'command': serializer.validated_data['command'],
        })