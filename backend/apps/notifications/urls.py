from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('notifications', views.NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
    path('telegram/link-parent/', views.TelegramLinkParentView.as_view(), name='telegram_link_parent'),
    path('telegram/my-children/', views.TelegramMyChildrenView.as_view(), name='telegram_my_children'),
    path('telegram/attendance-history/', views.TelegramAttendanceHistoryView.as_view(), name='telegram_attendance_history'),
]
