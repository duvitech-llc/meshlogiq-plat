"""
URL patterns for devices app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'devices', views.DeviceViewSet, basename='device')
router.register(r'provision-tokens', views.ProvisionTokenViewSet, basename='provision-token')
router.register(r'logs', views.DeviceLogViewSet, basename='device-log')

urlpatterns = [
    path('', include(router.urls)),
]