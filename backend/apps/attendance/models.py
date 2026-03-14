from django.db import models


class AttendanceRecord(models.Model):
    STATUS_CHOICES = [
        ('present', 'Keldi'),
        ('late', 'Kech keldi'),
        ('absent', 'Kelmadi'),
        ('excused', 'Sababli kelmadi'),
    ]

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField(verbose_name='Sana')
    check_in = models.DateTimeField(null=True, blank=True, verbose_name='Kelish vaqti')
    check_out = models.DateTimeField(null=True, blank=True, verbose_name='Ketish vaqti')
    check_in_device = models.ForeignKey(
        'devices.Device', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='checkin_records', verbose_name='Kelish qurilmasi'
    )
    check_out_device = models.ForeignKey(
        'devices.Device', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='checkout_records', verbose_name='Ketish qurilmasi'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='absent')
    late_minutes = models.IntegerField(default=0, verbose_name='Kechikish (daqiqa)')
    raw_log = models.ForeignKey(
        'devices.DeviceRawLog', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='attendance_records'
    )
    notes = models.TextField(blank=True, verbose_name='Izoh')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Davomad yozuvi'
        verbose_name_plural = 'Davomad yozuvlari'
        ordering = ['-date', 'student__last_name']
        unique_together = ['student', 'date']
        indexes = [
            models.Index(fields=['date', 'student']),
            models.Index(fields=['student', 'status']),
            models.Index(fields=['date', 'status']),
        ]

    def __str__(self):
        return f"{self.student} - {self.date} - {self.get_status_display()}"

    @property
    def school(self):
        return self.student.school

    @property
    def class_ref(self):
        return self.student.class_ref
