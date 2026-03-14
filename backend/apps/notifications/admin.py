from django.contrib import admin
from .models import TelegramAccount, Notification


@admin.register(TelegramAccount)
class TelegramAccountAdmin(admin.ModelAdmin):
    list_display = ['telegram_id', 'username', 'first_name', 'phone', 'is_active', 'linked_at']
    list_filter = ['is_active']
    search_fields = ['username', 'phone', 'first_name']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'notification_type', 'status', 'is_read', 'created_at']
    list_filter = ['notification_type', 'status', 'is_read']
    search_fields = ['title', 'message']
