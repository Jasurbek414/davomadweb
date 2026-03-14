import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


def student_photo_path(instance, filename):
    ext = filename.split('.')[-1]
    return f"students/{instance.school.id}/{instance.id}.{ext}"


def teacher_photo_path(instance, filename):
    ext = filename.split('.')[-1]
    return f"teachers/{instance.school.id}/{instance.id}.{ext}"


class Student(models.Model):
    GENDER_CHOICES = [('M', 'Erkak'), ('F', 'Ayol')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey('organizations.School', on_delete=models.CASCADE, related_name='students')
    class_ref = models.ForeignKey('organizations.Class', on_delete=models.SET_NULL, null=True, related_name='students', verbose_name='Sinf')
    first_name = models.CharField(max_length=100, verbose_name='Ism')
    last_name = models.CharField(max_length=100, verbose_name='Familiya')
    middle_name = models.CharField(max_length=100, blank=True, verbose_name='Otasining ismi')
    birth_date = models.DateField(verbose_name="Tug'ilgan sana")
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, verbose_name='Jinsi')
    student_id = models.CharField(max_length=20, unique=True, verbose_name="O'quvchi ID")
    photo = models.ImageField(upload_to=student_photo_path, null=True, blank=True, verbose_name='Rasm')
    is_active = models.BooleanField(default=True, verbose_name='Faol')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "O'quvchi"
        verbose_name_plural = "O'quvchilar"
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.last_name} {self.first_name} ({self.student_id})"

    @property
    def full_name(self):
        return f"{self.last_name} {self.first_name} {self.middle_name}".strip()

    def save(self, *args, **kwargs):
        if not self.student_id:
            # Auto-generate student_id
            import random
            self.student_id = f"S{random.randint(100000, 999999)}"
        super().save(*args, **kwargs)


class Teacher(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='teacher_profile')
    school = models.ForeignKey('organizations.School', on_delete=models.CASCADE, related_name='teachers')
    first_name = models.CharField(max_length=100, verbose_name='Ism')
    last_name = models.CharField(max_length=100, verbose_name='Familiya')
    middle_name = models.CharField(max_length=100, blank=True, verbose_name='Otasining ismi')
    phone = models.CharField(max_length=15, blank=True, verbose_name='Telefon')
    subject = models.CharField(max_length=100, verbose_name='Fan')
    employee_id = models.CharField(max_length=20, unique=True, verbose_name='Xodim ID')
    photo = models.ImageField(upload_to=teacher_photo_path, null=True, blank=True, verbose_name='Rasm')
    is_active = models.BooleanField(default=True, verbose_name='Faol')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "O'qituvchi"
        verbose_name_plural = "O'qituvchilar"
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.last_name} {self.first_name} ({self.school.name})"

    @property
    def full_name(self):
        return f"{self.last_name} {self.first_name} {self.middle_name}".strip()

    def save(self, *args, **kwargs):
        if not self.employee_id:
            import random
            self.employee_id = f"T{random.randint(100000, 999999)}"
        super().save(*args, **kwargs)


class Parent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='parent_profile')
    first_name = models.CharField(max_length=100, verbose_name='Ism')
    last_name = models.CharField(max_length=100, verbose_name='Familiya')
    phone = models.CharField(max_length=15, unique=True, verbose_name='Telefon')
    telegram_id = models.BigIntegerField(null=True, blank=True, unique=True, verbose_name='Telegram ID')
    is_registered = models.BooleanField(default=False, verbose_name="Bot'ga ro'yxatdan o'tgan")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Ota-ona'
        verbose_name_plural = 'Ota-onalar'
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.last_name} {self.first_name} ({self.phone})"

    @property
    def full_name(self):
        return f"{self.last_name} {self.first_name}".strip()


class ParentStudentLink(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Kutilmoqda'),
        ('active', 'Faol'),
        ('rejected', 'Rad etildi'),
    ]
    RELATIONSHIP_CHOICES = [
        ('father', 'Ota'),
        ('mother', 'Ona'),
        ('guardian', 'Vasiy'),
        ('other', 'Boshqa'),
    ]

    parent = models.ForeignKey(Parent, on_delete=models.CASCADE, null=True, blank=True, related_name='student_links')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='parent_links')
    parent_phone = models.CharField(max_length=15, verbose_name='Ota-ona telefoni')
    relationship = models.CharField(max_length=20, choices=RELATIONSHIP_CHOICES, default='father')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    activated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Ota-ona - O\'quvchi bog\'liq'
        verbose_name_plural = "Ota-ona - O'quvchi bog'liqlari"
        unique_together = ['student', 'parent_phone']

    def __str__(self):
        return f"{self.parent_phone} -> {self.student}"
