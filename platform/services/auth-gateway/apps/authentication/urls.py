"""
URL patterns for authentication app.
"""
from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'profile', views.ProfileViewSet, basename='profile')

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/me/', views.CurrentUserView.as_view(), name='current-user'),
    path('auth/jwks/', views.JWKSView.as_view(), name='jwks'),
    path('auth/verify/', views.VerifyTokenView.as_view(), name='token-verify'),
] + router.urls
