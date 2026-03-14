from rest_framework import serializers
from .models import TelegramAccount, Notification


class TelegramAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = TelegramAccount
        fields = ['id', 'telegram_id', 'username', 'first_name', 'phone', 'is_active', 'linked_at']


class NotificationSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_notification_type_display', read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'type_display', 'title', 'message',
                  'data', 'status', 'is_read', 'sent_at', 'created_at']
