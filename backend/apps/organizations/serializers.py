from rest_framework import serializers
from .models import Region, District, School, Class


class RegionSerializer(serializers.ModelSerializer):
    districts_count = serializers.SerializerMethodField()
    schools_count = serializers.SerializerMethodField()
    students_count = serializers.SerializerMethodField()
    code = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Region
        fields = ['id', 'name', 'code', 'is_active', 'districts_count', 'schools_count', 'students_count', 'created_at']

    def get_districts_count(self, obj):
        return obj.districts.filter(is_active=True).count()

    def get_schools_count(self, obj):
        return School.objects.filter(district__region=obj, is_active=True).count()

    def get_students_count(self, obj):
        from apps.students.models import Student
        return Student.objects.filter(school__district__region=obj, is_active=True).count()


class DistrictSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source='region.name', read_only=True)
    schools_count = serializers.SerializerMethodField()
    students_count = serializers.SerializerMethodField()
    code = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = District
        fields = ['id', 'region', 'region_name', 'name', 'code', 'is_active', 'schools_count', 'students_count', 'created_at']

    def get_schools_count(self, obj):
        return obj.schools.filter(is_active=True).count()

    def get_students_count(self, obj):
        from apps.students.models import Student
        return Student.objects.filter(school__district=obj, is_active=True).count()


class SchoolListSerializer(serializers.ModelSerializer):
    district_name = serializers.CharField(source='district.name', read_only=True)
    region_name = serializers.CharField(source='district.region.name', read_only=True)
    students_count = serializers.SerializerMethodField()
    classes_count = serializers.SerializerMethodField()

    class Meta:
        model = School
        fields = ['id', 'name', 'school_number', 'district', 'district_name', 'region_name',
                  'phone', 'director_name', 'is_active', 'students_count', 'classes_count', 'created_at']

    def get_students_count(self, obj):
        return obj.students.filter(is_active=True).count()

    def get_classes_count(self, obj):
        return obj.classes.filter(is_active=True).count()


class SchoolDetailSerializer(serializers.ModelSerializer):
    district_name = serializers.CharField(source='district.name', read_only=True)
    region_name = serializers.CharField(source='district.region.name', read_only=True)

    class Meta:
        model = School
        fields = ['id', 'name', 'school_number', 'district', 'district_name', 'region_name',
                  'address', 'phone', 'email', 'director_name', 'latitude', 'longitude',
                  'is_active', 'created_at', 'updated_at']


class ClassSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    students_count = serializers.SerializerMethodField()

    class Meta:
        model = Class
        fields = ['id', 'school', 'school_name', 'name', 'grade', 'section',
                  'academic_year', 'teacher', 'teacher_name', 'is_active',
                  'students_count', 'created_at']
        extra_kwargs = {
            'name': {'required': False}
        }

    def get_teacher_name(self, obj):
        if obj.teacher:
            return f"{obj.teacher.last_name} {obj.teacher.first_name}"
        return None

    def get_students_count(self, obj):
        return obj.students.filter(is_active=True).count()

    def validate(self, attrs):
        # Auto-generate name from grade + section
        if 'grade' in attrs and 'section' in attrs:
            attrs['name'] = f"{attrs['grade']}-{attrs['section']}"
        return attrs
