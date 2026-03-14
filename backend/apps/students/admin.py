from django.contrib import admin
from .models import Student, Teacher, Parent, ParentStudentLink


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['last_name', 'first_name', 'student_id', 'school', 'class_ref', 'gender', 'is_active']
    list_filter = ['school', 'class_ref', 'gender', 'is_active']
    search_fields = ['first_name', 'last_name', 'student_id']
    raw_id_fields = ['school', 'class_ref']


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ['last_name', 'first_name', 'employee_id', 'school', 'subject', 'is_active']
    list_filter = ['school', 'is_active']
    search_fields = ['first_name', 'last_name', 'employee_id', 'subject']


@admin.register(Parent)
class ParentAdmin(admin.ModelAdmin):
    list_display = ['last_name', 'first_name', 'phone', 'telegram_id', 'is_registered', 'created_at']
    list_filter = ['is_registered']
    search_fields = ['first_name', 'last_name', 'phone']


@admin.register(ParentStudentLink)
class ParentStudentLinkAdmin(admin.ModelAdmin):
    list_display = ['parent_phone', 'student', 'relationship', 'status', 'created_at']
    list_filter = ['status', 'relationship']
    search_fields = ['parent_phone', 'student__first_name', 'student__last_name']
