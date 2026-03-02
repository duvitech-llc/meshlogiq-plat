"""
URL patterns for tenants app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'tenants', views.TenantViewSet, basename='tenant')
router.register(r'tenant-users', views.TenantUserViewSet, basename='tenant-user')
router.register(r'tenant-settings', views.TenantSettingViewSet, basename='tenant-setting')

urlpatterns = [
    path('', include(router.urls)),
]