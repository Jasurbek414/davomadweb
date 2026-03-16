from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import Role, UserRole, AuditLog

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        data['user'] = UserDetailSerializer(user).data
        return data


class UserListSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'phone', 'email', 'first_name', 'last_name', 'middle_name',
                  'full_name', 'is_active', 'is_superuser', 'roles', 'last_login', 'created_at']

    def get_roles(self, obj):
        return [{'role': ur.role.name, 'role_display': ur.role.get_name_display()} for ur in obj.get_roles()]


class UserDetailSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'phone', 'email', 'first_name', 'last_name', 'middle_name',
                  'full_name', 'is_active', 'is_staff', 'is_superuser',
                  'roles', 'last_login', 'date_joined', 'created_at', 'updated_at']
        read_only_fields = ['id', 'is_staff', 'is_superuser', 'last_login', 'date_joined', 'created_at', 'updated_at']

    def get_roles(self, obj):
        roles = []
        for ur in obj.get_roles():
            role_data = {
                'id': ur.id,
                'role': ur.role.name,
                'role_display': ur.role.get_name_display(),
            }
            if ur.region:
                role_data['region'] = {'id': ur.region.id, 'name': ur.region.name}
            if ur.district:
                role_data['district'] = {'id': ur.district.id, 'name': ur.district.name}
            if ur.school:
                role_data['school'] = {'id': ur.school.id, 'name': ur.school.name}
            roles.append(role_data)
        return roles


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['phone', 'email', 'first_name', 'last_name', 'middle_name', 'password', 'password_confirm']

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password_confirm': "Parollar mos kelmadi"})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': "Parollar mos kelmadi"})
        return attrs


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description']


class UserRoleSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)
    role_display = serializers.CharField(source='role.get_name_display', read_only=True)
    region_name = serializers.SerializerMethodField()
    district_name = serializers.SerializerMethodField()
    school_name = serializers.SerializerMethodField()

    class Meta:
        model = UserRole
        fields = ['id', 'user', 'role', 'role_name', 'role_display',
                  'region', 'region_name', 'district', 'district_name',
                  'school', 'school_name', 'is_active', 'assigned_at']
        read_only_fields = ['id', 'assigned_at']

    def get_region_name(self, obj):
        return obj.region.name if obj.region else None

    def get_district_name(self, obj):
        return obj.district.name if obj.district else None

    def get_school_name(self, obj):
        return obj.school.name if obj.school else None


class UserRoleCreateSerializer(serializers.ModelSerializer):
    role = serializers.SlugRelatedField(slug_field='name', queryset=Role.objects.all())
    
    class Meta:
        model = UserRole
        fields = ['role', 'region', 'district', 'school']

    def create(self, validated_data):
        request = self.context['request']
        validated_data['assigned_by'] = request.user
        return super().create(validated_data)


class AdminSetPasswordSerializer(serializers.Serializer):
    """Superadmin tomonidan istalgan foydalanuvchi parolini o'zgartirish"""
    new_password = serializers.CharField(required=True, min_length=8)
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': "Parollar mos kelmadi"})
        return attrs


class AdminUpdateUserSerializer(serializers.ModelSerializer):
    """Superadmin tomonidan foydalanuvchi ma'lumotlarini to'liq tahrirlash"""
    class Meta:
        model = User
        fields = ['phone', 'email', 'first_name', 'last_name', 'middle_name', 'is_active']


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'user_name', 'action', 'action_display',
                  'model_name', 'object_id', 'object_repr', 'changes',
                  'ip_address', 'created_at']
