from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Region, District, School, Class
from .serializers import (
    RegionSerializer, DistrictSerializer,
    SchoolListSerializer, SchoolDetailSerializer, ClassSerializer
)
from apps.accounts.permissions import IsSuperAdmin, IsOperatorOrAbove, IsSchoolDirectorOrAbove


class RegionViewSet(viewsets.ModelViewSet):
    queryset = Region.objects.all().order_by('name')
    serializer_class = RegionSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'code']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSuperAdmin()]
        return [IsAuthenticated()]


class DistrictViewSet(viewsets.ModelViewSet):
    queryset = District.objects.select_related('region').order_by('name')
    serializer_class = DistrictSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['region', 'is_active']
    search_fields = ['name', 'code']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSuperAdmin()]
        return [IsAuthenticated()]


class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.select_related('district', 'district__region').order_by('name')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['district', 'district__region', 'is_active']
    search_fields = ['name', 'school_number', 'director_name']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SchoolDetailSerializer
        return SchoolListSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSchoolDirectorOrAbove()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.is_superuser or user.has_role('superadmin'):
            return qs
        if user.has_role('region_director'):
            region_ids = user.user_roles.filter(role__name='region_director', is_active=True).values_list('region_id', flat=True)
            return qs.filter(district__region_id__in=region_ids)
        if user.has_role('district_director'):
            district_ids = user.user_roles.filter(role__name='district_director', is_active=True).values_list('district_id', flat=True)
            return qs.filter(district_id__in=district_ids)
        if any(user.has_role(r) for r in ['school_director', 'operator', 'teacher']):
            school_ids = user.user_roles.filter(
                role__name__in=['school_director', 'operator', 'teacher'],
                is_active=True
            ).values_list('school_id', flat=True)
            return qs.filter(id__in=school_ids)
        return qs.none()


class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.select_related('school', 'teacher').order_by('grade', 'section')
    serializer_class = ClassSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['school', 'grade', 'academic_year', 'is_active']
    search_fields = ['name']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsOperatorOrAbove()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.is_superuser or user.has_role('superadmin'):
            return qs
        # Filter by school access
        school_ids = user.user_roles.filter(
            role__name__in=['school_director', 'operator', 'teacher'],
            is_active=True, school__isnull=False
        ).values_list('school_id', flat=True)
        if school_ids:
            return qs.filter(school_id__in=school_ids)
        return qs
