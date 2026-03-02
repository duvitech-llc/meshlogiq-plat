"""
URL configuration for meshlogiq-auth-gateway project.
"""

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def health_check(request):
    """Health check endpoint."""
    return JsonResponse({
        'status': 'healthy',
        'service': 'auth-gateway',
        'version': '1.0.0'
    })

urlpatterns = [
    # Health check
    path('health', health_check, name='health'),
    
    # Django admin
    path(f'{settings.DJANGO_ADMIN_URL}', admin.site.urls),
    
    # API endpoints
    path('api/', include('apps.authentication.urls')),
    path('api/', include('apps.tenants.urls')),
    path('api/', include('apps.devices.urls')),
]

# Static files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)