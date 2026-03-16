from django.db import models


class Region(models.Model):
    name = models.CharField(max_length=100, verbose_name='Viloyat nomi')
    code = models.CharField(max_length=10, unique=True, null=True, blank=True, verbose_name='Kod')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Viloyat'
        verbose_name_plural = 'Viloyatlar'
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def districts_count(self):
        return self.districts.filter(is_active=True).count()

    @property
    def schools_count(self):
        return School.objects.filter(district__region=self, is_active=True).count()


class District(models.Model):
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name='districts', verbose_name='Viloyat')
    name = models.CharField(max_length=100, verbose_name='Tuman nomi')
    code = models.CharField(max_length=10, null=True, blank=True, verbose_name='Kod')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Tuman'
        verbose_name_plural = 'Tumanlar'
        ordering = ['name']
        unique_together = ['region', 'code']

    def __str__(self):
        return f"{self.name} ({self.region.name})"

    @property
    def schools_count(self):
        return self.schools.filter(is_active=True).count()


class School(models.Model):
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name='schools', verbose_name='Tuman')
    name = models.CharField(max_length=200, verbose_name='Maktab nomi')
    school_number = models.CharField(max_length=20, blank=True, verbose_name='Maktab raqami')
    address = models.TextField(blank=True, verbose_name='Manzil')
    phone = models.CharField(max_length=15, blank=True, verbose_name='Telefon')
    email = models.EmailField(blank=True, verbose_name='Email')
    director_name = models.CharField(max_length=200, blank=True, verbose_name='Direktor')
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Maktab'
        verbose_name_plural = 'Maktablar'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.district.name})"

    @property
    def region(self):
        return self.district.region

    @property
    def students_count(self):
        return self.students.filter(is_active=True).count()

    @property
    def classes_count(self):
        return self.classes.filter(is_active=True).count()


class Class(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='classes', verbose_name='Maktab')
    name = models.CharField(max_length=20, blank=True, verbose_name='Sinf nomi')
    grade = models.IntegerField(verbose_name='Sinf raqami')  # 1-11
    section = models.CharField(max_length=5, verbose_name="Bo'lim")  # A, B, C
    academic_year = models.CharField(max_length=10, default='2024-2025', verbose_name='O\'quv yili')  # "2024-2025"
    teacher = models.ForeignKey(
        'students.Teacher', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='classes', verbose_name='Sinf rahbari'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Sinf'
        verbose_name_plural = 'Sinflar'
        ordering = ['grade', 'section']
        unique_together = ['school', 'grade', 'section', 'academic_year']

    def __str__(self):
        return f"{self.grade}-{self.section} ({self.school.name})"

    def save(self, *args, **kwargs):
        if not self.name:
            self.name = f"{self.grade}-{self.section}"
        super().save(*args, **kwargs)

    @property
    def students_count(self):
        return self.students.filter(is_active=True).count()
