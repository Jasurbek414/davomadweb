from django.contrib import admin
from .models import Device, DeviceSyncLog, DeviceRawLog


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ['name', 'school', 'brand', 'ip_address', 'status', 'last_seen', 'is_active']
    list_filter = ['brand', 'status', 'is_active', 'school']
    search_fields = ['name', 'serial_number', 'ip_address']
    readonly_fields = ['last_seen', 'created_at', 'updated_at']


@admin.register(DeviceSyncLog)
class DeviceSyncLogAdmin(admin.ModelAdmin):
    list_display = ['device', 'sync_type', 'status', 'total_records', 'synced_records', 'started_at']
    list_filter = ['sync_type', 'status']
    readonly_fields = ['started_at', 'completed_at']


@admin.register(DeviceRawLog)
class DeviceRawLogAdmin(admin.ModelAdmin):
    list_display = ['device', 'employee_no', 'event_time', 'event_type', 'processed', 'created_at']
    list_filter = ['processed', 'device']
    search_fields = ['employee_no']
    readonly_fields = ['created_at']
