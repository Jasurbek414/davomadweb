from django.contrib import admin
from .models import Region, District, School, Class


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'code']


@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ['name', 'region', 'code', 'is_active']
    list_filter = ['region', 'is_active']
    search_fields = ['name', 'code']


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ['name', 'school_number', 'district', 'director_name', 'is_active', 'created_at']
    list_filter = ['district__region', 'is_active']
    search_fields = ['name', 'school_number', 'director_name']
    raw_id_fields = ['district']


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ['name', 'school', 'grade', 'section', 'academic_year', 'is_active']
    list_filter = ['grade', 'academic_year', 'is_active']
    search_fields = ['name', 'school__name']
