from django.db import models


class Device(models.Model):
    BRAND_CHOICES = [
        ('hikvision', 'Hikvision'),
        ('dahua', 'Dahua'),
        ('zkteco', 'ZKTeco'),
        ('anviz', 'Anviz'),
        ('other', 'Boshqa'),
    ]
    STATUS_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('syncing', 'Sinxronlanmoqda'),
        ('error', 'Xatolik'),
        ('unknown', 'Noma\'lum'),
    ]

    school = models.ForeignKey('organizations.School', on_delete=models.CASCADE, related_name='devices')
    name = models.CharField(max_length=100, verbose_name='Qurilma nomi')
    brand = models.CharField(max_length=20, choices=BRAND_CHOICES, verbose_name='Brend')
    model = models.CharField(max_length=100, blank=True, verbose_name='Model')
    serial_number = models.CharField(max_length=100, unique=True, verbose_name='Seriya raqami')
    ip_address = models.GenericIPAddressField(verbose_name='IP manzil')
    port = models.IntegerField(default=80, verbose_name='Port')
    username = models.CharField(max_length=50, default='admin', verbose_name='Foydalanuvchi')
    password = models.CharField(max_length=100, verbose_name='Parol')
    location = models.CharField(max_length=200, blank=True, verbose_name='Joylashuv')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unknown')
    last_seen = models.DateTimeField(null=True, blank=True, verbose_name='Oxirgi ko\'rilgan')
    firmware_version = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Qurilma'
        verbose_name_plural = 'Qurilmalar'
        ordering = ['school', 'name']

    def __str__(self):
        return f"{self.name} ({self.ip_address}) - {self.school.name}"

    def get_adapter(self):
        from .adapters.factory import get_adapter
        return get_adapter(self)


class DeviceSyncLog(models.Model):
    SYNC_TYPE_CHOICES = [
        ('push', 'Qurilmaga yuklash'),
        ('pull', 'Qurilmadan olish'),
        ('check', 'Holat tekshirish'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Kutilmoqda'),
        ('running', 'Ishlayapti'),
        ('success', 'Muvaffaqiyatli'),
        ('failed', 'Muvaffaqiyatsiz'),
    ]

    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='sync_logs')
    sync_type = models.CharField(max_length=20, choices=SYNC_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_records = models.IntegerField(default=0)
    synced_records = models.IntegerField(default=0)
    failed_records = models.IntegerField(default=0)
    error_message = models.TextField(blank=True)
    initiated_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True
    )
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Sinxronizatsiya logi'
        verbose_name_plural = 'Sinxronizatsiya loglari'
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.device.name} - {self.get_sync_type_display()} - {self.status}"

    @property
    def duration_seconds(self):
        if self.completed_at and self.started_at:
            return (self.completed_at - self.started_at).total_seconds()
        return None


class DeviceRawLog(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='raw_logs')
    employee_no = models.CharField(max_length=50, verbose_name="Xodim raqami (qurilmada)")
    event_time = models.DateTimeField(verbose_name='Voqea vaqti')
    event_type = models.IntegerField(default=0, verbose_name='Voqea turi')
    # 0=unknown, 1=check_in, 2=check_out, 196=face_recognition
    temperature = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    raw_data = models.JSONField(default=dict, verbose_name='Xom ma\'lumot')
    processed = models.BooleanField(default=False, verbose_name='Qayta ishlangan')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Xom log'
        verbose_name_plural = 'Xom loglar'
        ordering = ['-event_time']
        unique_together = ['device', 'employee_no', 'event_time']
        indexes = [
            models.Index(fields=['device', 'event_time']),
            models.Index(fields=['employee_no', 'event_time']),
            models.Index(fields=['processed']),
        ]

    def __str__(self):
        return f"{self.employee_no} - {self.event_time}"
