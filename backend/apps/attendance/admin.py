from django.contrib import admin
from .models import AttendanceRecord


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ['student', 'date', 'status', 'check_in', 'check_out', 'late_minutes', 'created_at']
    list_filter = ['status', 'date', 'student__school', 'student__class_ref']
    search_fields = ['student__first_name', 'student__last_name', 'student__student_id']
    date_hierarchy = 'date'
    readonly_fields = ['created_at', 'updated_at']
