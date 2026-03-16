from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Role, UserRole, AuditLog
from .serializers import (
    UserListSerializer, UserDetailSerializer, UserCreateSerializer,
    ChangePasswordSerializer, AdminSetPasswordSerializer, AdminUpdateUserSerializer,
    RoleSerializer, UserRoleSerializer, UserRoleCreateSerializer, AuditLogSerializer
)
from .permissions import IsSuperAdmin, IsOperatorOrAbove

User = get_user_model()


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]


class LogoutView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Muvaffaqiyatli chiqildi'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'message': 'Chiqishda xatolik'}, status=status.HTTP_400_BAD_REQUEST)


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserDetailSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'old_password': 'Noto\'g\'ri parol'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Parol muvaffaqiyatli o\'zgartirildi'})


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-created_at')
    permission_classes = [IsAuthenticated, IsOperatorOrAbove]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['first_name', 'last_name', 'phone', 'email']
    filterset_fields = ['is_active']
    ordering_fields = ['created_at', 'last_name']

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ['update', 'partial_update']:
            return AdminUpdateUserSerializer
        if self.action == 'retrieve':
            return UserDetailSerializer
        return UserListSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update', 'set_password']:
            return [IsSuperAdmin()]
        return super().get_permissions()

    @action(detail=True, methods=['get', 'post'], url_path='roles')
    def roles(self, request, pk=None):
        user = self.get_object()
        if request.method == 'GET':
            roles = user.user_roles.filter(is_active=True).select_related('role', 'region', 'district', 'school')
            serializer = UserRoleSerializer(roles, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            data = request.data.copy()
            data['user'] = user.id
            serializer = UserRoleCreateSerializer(data=data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            serializer.save(user=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='roles/(?P<role_pk>[^/.]+)')
    def remove_role(self, request, pk=None, role_pk=None):
        user = self.get_object()
        try:
            user_role = user.user_roles.get(id=role_pk)
            user_role.delete()
            return Response({'message': 'Rol olib tashlandi'}, status=status.HTTP_200_OK)
        except UserRole.DoesNotExist:
            return Response({'detail': 'Rol topilmadi'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], url_path='deactivate')
    def deactivate(self, request, pk=None):
        user = self.get_object()
        user.is_active = False
        user.save()
        user.user_roles.update(is_active=False)
        return Response({'message': 'Foydalanuvchi deaktivlashtirildi'})

    @action(detail=True, methods=['post'], url_path='activate')
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save()
        user.user_roles.update(is_active=True)
        return Response({'message': 'Foydalanuvchi aktivlashtirildi'})

    @action(detail=True, methods=['post'], url_path='set-password')
    def set_password(self, request, pk=None):
        """Superadmin istalgan foydalanuvchi parolini o'zgartiradi"""
        user = self.get_object()
        serializer = AdminSetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': f"{user.full_name} paroli muvaffaqiyatli o'zgartirildi"})


class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related('user').order_by('-created_at')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['action', 'model_name', 'user']
    search_fields = ['model_name', 'object_repr', 'user__first_name', 'user__last_name']
    ordering_fields = ['created_at']
