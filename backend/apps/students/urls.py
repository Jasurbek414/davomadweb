from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('students', views.StudentViewSet, basename='student')
router.register('teachers', views.TeacherViewSet, basename='teacher')
router.register('parents', views.ParentViewSet, basename='parent')
router.register('parent-links', views.ParentStudentLinkViewSet, basename='parent-link')

urlpatterns = [path('', include(router.urls))]
