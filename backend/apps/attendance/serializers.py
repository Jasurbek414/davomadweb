from rest_framework import serializers
from .models import AttendanceRecord


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_id_code = serializers.CharField(source='student.student_id', read_only=True)
    class_name = serializers.SerializerMethodField()
    school_name = serializers.CharField(source='student.school.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    check_in_str = serializers.SerializerMethodField()
    check_out_str = serializers.SerializerMethodField()
    student_photo = serializers.SerializerMethodField()
    check_in_device_name = serializers.CharField(source='check_in_device.name', read_only=True)
    check_out_device_name = serializers.CharField(source='check_out_device.name', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'student', 'student_name', 'student_id_code', 'student_photo',
            'class_name', 'school_name', 'date',
            'check_in', 'check_in_str', 'check_out', 'check_out_str',
            'check_in_device', 'check_in_device_name', 'check_out_device', 'check_out_device_name',
            'status', 'status_display', 'late_minutes', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_class_name(self, obj):
        if obj.student.class_ref:
            return obj.student.class_ref.name
        return None

    def get_check_in_str(self, obj):
        if obj.check_in:
            return obj.check_in.strftime('%H:%M')
        return None

    def get_check_out_str(self, obj):
        if obj.check_out:
            return obj.check_out.strftime('%H:%M')
        return None

    def get_student_photo(self, obj):
        if obj.student.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.student.photo.url)
        return None
