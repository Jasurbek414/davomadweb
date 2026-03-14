from rest_framework import serializers
from .models import Device, DeviceSyncLog, DeviceRawLog


class DeviceSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True)
    brand_display = serializers.CharField(source='get_brand_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Device
        fields = ['id', 'school', 'school_name', 'name', 'brand', 'brand_display',
                  'model', 'serial_number', 'ip_address', 'port', 'username', 'password',
                  'location', 'status', 'status_display', 'last_seen',
                  'firmware_version', 'is_active', 'created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True},
        }


class DeviceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ['school', 'name', 'brand', 'model', 'serial_number',
                  'ip_address', 'port', 'username', 'password', 'location']


class DeviceSyncLogSerializer(serializers.ModelSerializer):
    device_name = serializers.CharField(source='device.name', read_only=True)
    sync_type_display = serializers.CharField(source='get_sync_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    duration_seconds = serializers.FloatField(read_only=True)
    initiated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = DeviceSyncLog
        fields = ['id', 'device', 'device_name', 'sync_type', 'sync_type_display',
                  'status', 'status_display', 'total_records', 'synced_records',
                  'failed_records', 'error_message', 'duration_seconds',
                  'initiated_by', 'initiated_by_name', 'started_at', 'completed_at']

    def get_initiated_by_name(self, obj):
        if obj.initiated_by:
            return obj.initiated_by.full_name
        return 'Bot'


class DeviceRawLogSerializer(serializers.ModelSerializer):
    device_name = serializers.CharField(source='device.name', read_only=True)

    class Meta:
        model = DeviceRawLog
        fields = ['id', 'device', 'device_name', 'employee_no', 'event_time',
                  'event_type', 'temperature', 'processed', 'created_at']
