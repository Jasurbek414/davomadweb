from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    # API v1
    path('api/v1/', include([
        path('auth/', include('apps.accounts.urls')),
        path('', include('apps.organizations.urls')),
        path('', include('apps.students.urls')),
        path('', include('apps.devices.urls')),
        path('', include('apps.attendance.urls')),
        path('', include('apps.notifications.urls')),
        path('', include('apps.reports.urls')),
    ])),
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
