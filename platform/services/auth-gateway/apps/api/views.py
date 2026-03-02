"""
API views for MeshLogIQ Auth Gateway.

This module contains views for authentication, device management, and other common backend operations.
FastAPI endpoints are handled in a separate service for high-throughput operations.
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

@api_view(['GET'])
def api_root(request, format=None):
    """API root endpoint."""
    return Response({
        'users': '/api/users/',
        'tenants': '/api/tenants/',
        'devices': '/api/devices/',
        'auth': '/api/auth/',
    }, status=status.HTTP_200_OK)
