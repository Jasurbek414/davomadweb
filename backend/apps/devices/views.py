from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from .models import Device, DeviceSyncLog, DeviceRawLog
from .serializers import (
    DeviceSerializer, DeviceCreateSerializer,
    DeviceSyncLogSerializer, DeviceRawLogSerializer
)
from apps.accounts.permissions import IsOperatorOrAbove, IsSchoolDirectorOrAbove, IsBotRequest, IsAuthenticatedOrBot


class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.select_related('school').order_by('school', 'name')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['school', 'brand', 'status', 'is_active']
    search_fields = ['name', 'serial_number', 'ip_address', 'location']

    def get_serializer_class(self):
        if self.action == 'create':
            return DeviceCreateSerializer
        return DeviceSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsOperatorOrAbove()]
        return [IsAuthenticatedOrBot()]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if not user.is_authenticated:
            # For Bot hidden behind IsBotRequest, we allow seeing all devices
            return qs
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
        return qs.filter(school_id__in=school_ids)

    @action(detail=True, methods=['get'], url_path='status')
    def device_status(self, request, pk=None):
        device = self.get_object()
        try:
            adapter = device.get_adapter()
            status_info = adapter.get_status()
            # Update device status in DB
            new_status = 'online' if status_info.get('online') else 'offline'
            device.status = new_status
            device.last_seen = timezone.now() if status_info.get('online') else device.last_seen
            device.save(update_fields=['status', 'last_seen'])
            return Response({
                'device_id': device.id,
                'device_name': device.name,
                **status_info
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='sync')
    def sync_students(self, request, pk=None):
        """O'quvchilarni qurilmaga yuklash (Push sync)"""
        from .tasks import push_students_to_device
        device = self.get_object()
        sync_log = DeviceSyncLog.objects.create(
            device=device,
            sync_type='push',
            status='pending',
            initiated_by=request.user
        )
        # Run async via Celery
        push_students_to_device.delay(device.id, sync_log.id)
        return Response({
            'message': 'Sinxronizatsiya boshlandi',
            'sync_log_id': sync_log.id,
        }, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=['post'], url_path='pull-logs')
    def pull_logs(self, request, pk=None):
        """Qurilmadan loglarni olish (Pull sync)"""
        from .tasks import pull_logs_from_device
        device = self.get_object()
        sync_log = DeviceSyncLog.objects.create(
            device=device,
            sync_type='pull',
            status='pending',
            initiated_by=request.user
        )
        pull_logs_from_device.delay(device.id, sync_log.id)
        return Response({
            'message': 'Log olish boshlandi',
            'sync_log_id': sync_log.id,
        }, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=['get'], url_path='sync-logs')
    def sync_logs(self, request, pk=None):
        device = self.get_object()
        logs = DeviceSyncLog.objects.filter(device=device).order_by('-started_at')[:20]
        serializer = DeviceSyncLogSerializer(logs, many=True)
        return Response(serializer.data)


class DeviceSyncLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DeviceSyncLog.objects.select_related('device', 'initiated_by').order_by('-started_at')
    serializer_class = DeviceSyncLogSerializer
    permission_classes = [IsAuthenticated, IsOperatorOrAbove]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['device', 'sync_type', 'status']


class DeviceRawLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DeviceRawLog.objects.select_related('device').order_by('-event_time')
    serializer_class = DeviceRawLogSerializer
    permission_classes = [IsAuthenticated, IsSchoolDirectorOrAbove]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['device', 'processed']
    search_fields = ['employee_no']
