from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class TelegramAccount(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='telegram_account')
    telegram_id = models.BigIntegerField(unique=True)
    username = models.CharField(max_length=100, blank=True, null=True)
    first_name = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    linked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Telegram akkount'
        verbose_name_plural = 'Telegram akkountlar'

    def __str__(self):
        return f"@{self.username or self.telegram_id}"


class Notification(models.Model):
    TYPE_CHOICES = [
        ('check_in', 'Kelish'),
        ('check_out', 'Ketish'),
        ('absent', 'Kelmadi'),
        ('late', 'Kech keldi'),
        ('system', 'Tizim'),
        ('device', 'Qurilma'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Kutilmoqda'),
        ('sent', 'Yuborildi'),
        ('failed', 'Yuborilmadi'),
        ('read', "O'qildi"),
    ]

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    telegram_id = models.BigIntegerField(null=True, blank=True)
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    data = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_read = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Bildirishnoma'
        verbose_name_plural = 'Bildirishnomalar'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_notification_type_display()} - {self.title}"
