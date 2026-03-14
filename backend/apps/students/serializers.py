from rest_framework import serializers
from .models import Student, Teacher, Parent, ParentStudentLink


class StudentListSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_ref.name', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    full_name = serializers.CharField(read_only=True)
    parent_link_status = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()
    has_photo = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = ['id', 'first_name', 'last_name', 'middle_name', 'full_name',
                  'school', 'school_name', 'class_ref', 'class_name',
                  'student_id', 'birth_date', 'gender', 'photo_url', 'has_photo',
                  'is_active', 'parent_link_status', 'created_at']

    def get_parent_link_status(self, obj):
        links = obj.parent_links.all()
        if links.filter(status='active').exists():
            return 'active'
        if links.filter(status='pending').exists():
            return 'pending'
        return 'none'

    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
        return None

    def get_has_photo(self, obj):
        return bool(obj.photo)


class StudentDetailSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_ref.name', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    full_name = serializers.CharField(read_only=True)
    parent_links = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = ['id', 'first_name', 'last_name', 'middle_name', 'full_name',
                  'school', 'school_name', 'class_ref', 'class_name',
                  'student_id', 'birth_date', 'gender', 'photo',
                  'is_active', 'parent_links', 'created_at', 'updated_at']

    def get_parent_links(self, obj):
        links = obj.parent_links.select_related('parent').all()
        return ParentStudentLinkSerializer(links, many=True).data


class StudentCreateSerializer(serializers.ModelSerializer):
    parent_phone = serializers.CharField(required=False, allow_blank=True)
    relationship = serializers.ChoiceField(
        choices=ParentStudentLink.RELATIONSHIP_CHOICES,
        required=False, default='father'
    )

    class Meta:
        model = Student
        fields = ['first_name', 'last_name', 'middle_name', 'school',
                  'class_ref', 'birth_date', 'gender', 'photo',
                  'parent_phone', 'relationship']

    def create(self, validated_data):
        parent_phone = validated_data.pop('parent_phone', None)
        relationship = validated_data.pop('relationship', 'father')
        student = Student.objects.create(**validated_data)
        if parent_phone:
            # Create pending parent link
            parent = Parent.objects.filter(phone=parent_phone).first()
            ParentStudentLink.objects.create(
                parent=parent,
                student=student,
                parent_phone=parent_phone,
                relationship=relationship,
                status='active' if parent else 'pending'
            )
        return student


class TeacherSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Teacher
        fields = ['id', 'first_name', 'last_name', 'middle_name', 'full_name',
                  'school', 'school_name', 'phone', 'subject', 'employee_id',
                  'photo', 'is_active', 'created_at']
        read_only_fields = ['id', 'employee_id', 'created_at']


class ParentSerializer(serializers.ModelSerializer):
    students = serializers.SerializerMethodField()

    class Meta:
        model = Parent
        fields = ['id', 'first_name', 'last_name', 'phone', 'telegram_id',
                  'is_registered', 'students', 'created_at']

    def get_students(self, obj):
        links = obj.student_links.filter(status='active').select_related('student', 'student__class_ref')
        return [{
            'id': str(link.student.id),
            'name': link.student.full_name,
            'class': link.student.class_ref.name if link.student.class_ref else '',
            'student_id': link.student.student_id,
            'relationship': link.relationship,
        } for link in links]


class ParentStudentLinkSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    parent_name = serializers.SerializerMethodField()

    class Meta:
        model = ParentStudentLink
        fields = ['id', 'parent', 'parent_name', 'student', 'student_name',
                  'parent_phone', 'relationship', 'status', 'created_at', 'activated_at']

    def get_parent_name(self, obj):
        if obj.parent:
            return obj.parent.full_name
        return None


class ParentStudentLinkCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParentStudentLink
        fields = ['student', 'parent_phone', 'relationship']

    def create(self, validated_data):
        phone = validated_data['parent_phone']
        parent = Parent.objects.filter(phone=phone).first()
        validated_data['parent'] = parent
        validated_data['status'] = 'active' if parent else 'pending'
        return super().create(validated_data)
