import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, phone, password=None, **extra_fields):
        if not phone:
            raise ValueError('Telefon raqami kiritilishi shart')
        user = self.model(phone=phone, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        return self.create_user(phone, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=15, unique=True, verbose_name='Telefon')
    email = models.EmailField(blank=True, null=True, verbose_name='Email')
    first_name = models.CharField(max_length=100, verbose_name='Ism')
    last_name = models.CharField(max_length=100, verbose_name='Familiya')
    middle_name = models.CharField(max_length=100, blank=True, verbose_name='Otasining ismi')
    is_active = models.BooleanField(default=True, verbose_name='Faol')
    is_staff = models.BooleanField(default=False, verbose_name='Staff')
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = UserManager()

    class Meta:
        verbose_name = 'Foydalanuvchi'
        verbose_name_plural = 'Foydalanuvchilar'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.last_name} {self.first_name} ({self.phone})"

    @property
    def full_name(self):
        return f"{self.last_name} {self.first_name} {self.middle_name}".strip()

    def get_roles(self):
        return self.user_roles.filter(is_active=True).select_related('role')

    def has_role(self, role_name):
        return self.user_roles.filter(role__name=role_name, is_active=True).exists()

    def is_superadmin(self):
        return self.has_role('superadmin') or self.is_superuser


class Role(models.Model):
    ROLE_CHOICES = [
        ('superadmin', 'Super Admin'),
        ('region_director', 'Viloyat Direktori'),
        ('district_director', 'Tuman Direktori'),
        ('school_director', 'Maktab Direktori'),
        ('operator', 'Operator'),
        ('teacher', "O'qituvchi"),
        ('parent', 'Ota-ona'),
    ]
    name = models.CharField(max_length=50, choices=ROLE_CHOICES, unique=True, verbose_name='Nom')
    description = models.TextField(blank=True, verbose_name='Tavsif')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Rol'
        verbose_name_plural = 'Rollar'

    def __str__(self):
        return self.get_name_display()


class UserRole(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_roles', verbose_name='Foydalanuvchi')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, verbose_name='Rol')
    # Scope fields - determines what data user can access
    region = models.ForeignKey('organizations.Region', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Viloyat')
    district = models.ForeignKey('organizations.District', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Tuman')
    school = models.ForeignKey('organizations.School', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Maktab')
    is_active = models.BooleanField(default=True, verbose_name='Faol')
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='assigned_roles', verbose_name="Tayinlagan")
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Foydalanuvchi roli'
        verbose_name_plural = 'Foydalanuvchi rollari'
        unique_together = ['user', 'role', 'region', 'district', 'school']

    def __str__(self):
        return f"{self.user} - {self.role}"


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('create', 'Yaratdi'),
        ('update', "O'zgartirdi"),
        ('delete', "O'chirdi"),
        ('login', 'Kirdi'),
        ('logout', 'Chiqdi'),
        ('view', "Ko'rdi"),
    ]
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100, blank=True)
    object_repr = models.CharField(max_length=200, blank=True)
    changes = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Audit log'
        verbose_name_plural = 'Audit loglar'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} - {self.action} - {self.model_name} - {self.created_at}"
