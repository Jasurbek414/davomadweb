from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/attendance/', consumers.AttendanceConsumer.as_asgi()),
]
