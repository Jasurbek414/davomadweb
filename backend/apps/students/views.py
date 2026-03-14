from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Student, Teacher, Parent, ParentStudentLink
from .serializers import (
    StudentListSerializer, StudentDetailSerializer, StudentCreateSerializer,
    TeacherSerializer, ParentSerializer,
    ParentStudentLinkSerializer, ParentStudentLinkCreateSerializer
)
from apps.accounts.permissions import IsOperatorOrAbove, IsTeacherOrAbove


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.select_related('school', 'class_ref').order_by('last_name')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['school', 'class_ref', 'gender', 'is_active']
    search_fields = ['first_name', 'last_name', 'middle_name', 'student_id']
    ordering_fields = ['last_name', 'created_at', 'student_id']

    def get_serializer_class(self):
        if self.action == 'create':
            return StudentCreateSerializer
        if self.action == 'retrieve':
            return StudentDetailSerializer
        return StudentListSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsOperatorOrAbove()]
        return [IsTeacherOrAbove()]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.is_superuser or user.has_role('superadmin'):
            return qs
        if user.has_role('region_director'):
            region_ids = user.user_roles.filter(role__name='region_director', is_active=True).values_list('region_id', flat=True)
            return qs.filter(school__district__region_id__in=region_ids)
        if user.has_role('district_director'):
            district_ids = user.user_roles.filter(role__name='district_director', is_active=True).values_list('district_id', flat=True)
            return qs.filter(school__district_id__in=district_ids)
        school_ids = user.user_roles.filter(
            role__name__in=['school_director', 'operator', 'teacher'],
            is_active=True, school__isnull=False
        ).values_list('school_id', flat=True)
        if school_ids:
            return qs.filter(school_id__in=school_ids)
        return qs.none()

    @action(detail=True, methods=['get'], url_path='attendance')
    def attendance(self, request, pk=None):
        from apps.attendance.models import AttendanceRecord
        from apps.attendance.serializers import AttendanceRecordSerializer
        student = self.get_object()
        records = AttendanceRecord.objects.filter(student=student).order_by('-date')[:30]
        serializer = AttendanceRecordSerializer(records, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='upload-photo', parser_classes=[MultiPartParser])
    def upload_photo(self, request, pk=None):
        """O'quvchi rasmini yuklash"""
        student = self.get_object()
        photo = request.FILES.get('photo')
        if not photo:
            return Response({'detail': 'Rasm topilmadi'}, status=400)
        # Delete old photo
        if student.photo:
            try:
                import os
                os.remove(student.photo.path)
            except Exception:
                pass
        student.photo = photo
        student.save(update_fields=['photo'])
        # Return updated photo_url
        photo_url = request.build_absolute_uri(student.photo.url)
        return Response({'photo_url': photo_url, 'message': 'Rasm yuklandi'})

    @action(detail=True, methods=['post'], url_path='push-face', permission_classes=[IsOperatorOrAbove])
    def push_face(self, request, pk=None):
        """O'quvchi yuzini maktab qurilmalariga yuklash"""
        from apps.devices.models import Device
        from apps.devices.tasks import push_student_face_to_devices
        student = self.get_object()
        if not student.photo:
            return Response({'detail': "O'quvchining rasmi yo'q"}, status=400)
        devices = Device.objects.filter(school=student.school, is_active=True)
        if not devices.exists():
            return Response({'detail': 'Maktabda faol qurilma topilmadi'}, status=404)
        # Queue Celery task
        push_student_face_to_devices.delay(str(student.id))
        return Response({'message': f"Yuz {devices.count()} ta qurilmaga yuborilmoqda...", 'devices_count': devices.count()})


class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.select_related('school').order_by('last_name')
    serializer_class = TeacherSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['school', 'is_active']
    search_fields = ['first_name', 'last_name', 'employee_id', 'subject']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsOperatorOrAbove()]
        return [IsTeacherOrAbove()]


class ParentViewSet(viewsets.ModelViewSet):
    queryset = Parent.objects.prefetch_related('student_links').order_by('last_name')
    serializer_class = ParentSerializer
    permission_classes = [IsAuthenticated, IsOperatorOrAbove]
    filter_backends = [SearchFilter]
    search_fields = ['first_name', 'last_name', 'phone']


class ParentStudentLinkViewSet(viewsets.ModelViewSet):
    queryset = ParentStudentLink.objects.select_related('parent', 'student').order_by('-created_at')
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['status', 'student__school']
    search_fields = ['parent_phone', 'student__first_name', 'student__last_name']

    def get_serializer_class(self):
        if self.action == 'create':
            return ParentStudentLinkCreateSerializer
        return ParentStudentLinkSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsOperatorOrAbove()]
        return [IsAuthenticated()]
