"""
Views for tenants app.
"""
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Tenant, TenantUser, TenantSetting
from .serializers import (
    TenantSerializer,
    TenantUserSerializer,
    TenantSettingSerializer,
)


class TenantViewSet(viewsets.ModelViewSet):
    """ViewSet for managing tenants."""
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter tenants based on user's tenant membership."""
        org_id = self.request.query_params.get('org_id')
        if org_id:
            return Tenant.objects.filter(org_id=org_id)
        return Tenant.objects.all()
    
    def create(self, request, *args, **kwargs):
        """Create a new tenant."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check if user has permission to create tenant
        if not request.user.is_staff:
            return Response(
                {'error': 'Only staff users can create tenants'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TenantUserViewSet(viewsets.ModelViewSet):
    """ViewSet for managing tenant users."""
    queryset = TenantUser.objects.all()
    serializer_class = TenantUserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter tenant users by current user's tenant."""
        org_id = self.request.query_params.get('org_id')
        if org_id:
            return TenantUser.objects.filter(tenant__org_id=org_id)
        return TenantUser.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Add user to tenant."""
        org_id = request.data.get('org_id')
        user_email = request.data.get('user_email')
        role = request.data.get('role', 'viewer')
        
        try:
            tenant = Tenant.objects.get(org_id=org_id)
        except Tenant.DoesNotExist:
            return Response(
                {'error': 'Tenant not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(email=user_email)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user already belongs to tenant
        if TenantUser.objects.filter(user=user, tenant=tenant).exists():
            return Response(
                {'error': 'User already belongs to tenant'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if current user has permission
        current_user_tenant = TenantUser.objects.filter(
            user=request.user,
            tenant=tenant
        ).first()
        
        if current_user_tenant and not current_user_tenant.has_permission('user:write'):
            return Response(
                {'error': 'Insufficient permissions'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        tenant_user = TenantUser.objects.create(
            user=user,
            tenant=tenant,
            role=role,
        )
        
        serializer = self.get_serializer(tenant_user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TenantSettingViewSet(viewsets.ModelViewSet):
    """ViewSet for managing tenant settings."""
    queryset = TenantSetting.objects.all()
    serializer_class = TenantSettingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter settings by current user's tenant."""
        org_id = self.request.query_params.get('org_id')
        if org_id:
            return TenantSetting.objects.filter(tenant__org_id=org_id)
        return TenantSetting.objects.filter(tenant__tenantuser__user=self.request.user)
    
    def update(self, request, *args, **kwargs):
        """Update tenant setting."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Check if user has permission to modify settings
        if not request.user.is_staff:
            return Response(
                {'error': 'Only staff users can modify settings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)