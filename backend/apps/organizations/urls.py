from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('regions', views.RegionViewSet, basename='region')
router.register('districts', views.DistrictViewSet, basename='district')
router.register('schools', views.SchoolViewSet, basename='school')
router.register('classes', views.ClassViewSet, basename='class')

urlpatterns = [path('', include(router.urls))]
