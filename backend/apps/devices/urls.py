from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('devices', views.DeviceViewSet, basename='device')
router.register('device-sync-logs', views.DeviceSyncLogViewSet, basename='devicesynclog')
router.register('raw-logs', views.DeviceRawLogViewSet, basename='rawlog')

urlpatterns = [path('', include(router.urls))]
