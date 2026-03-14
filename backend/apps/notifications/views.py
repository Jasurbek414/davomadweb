from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone

from .models import TelegramAccount, Notification
from .serializers import TelegramAccountSerializer, NotificationSerializer
from apps.accounts.permissions import IsBotRequest


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['patch'], url_path='read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.status = 'read'
        notification.save(update_fields=['is_read', 'status'])
        return Response({'message': "O'qildi"})

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True, status='read')
        return Response({'message': 'Barcha bildirishnomalar o\'qildi'})


class TelegramLinkParentView(generics.GenericAPIView):
    """Bot dan ota-onani bog'lash"""
    permission_classes = [IsBotRequest]

    def post(self, request):
        phone = request.data.get('phone', '').strip()
        telegram_id = request.data.get('telegram_id')
        username = request.data.get('username', '')
        first_name = request.data.get('first_name', '')

        if not phone or not telegram_id:
            return Response({'detail': 'Telefon va Telegram ID kerak'}, status=status.HTTP_400_BAD_REQUEST)

        # Normalize phone
        if not phone.startswith('+'):
            phone = '+' + phone

        from apps.students.models import Parent, ParentStudentLink

        # Create or update parent
        parent, created = Parent.objects.update_or_create(
            phone=phone,
            defaults={
                'telegram_id': telegram_id,
                'first_name': first_name,
                'last_name': '',
                'is_registered': True,
            }
        )

        # Activate pending links
        from django.utils import timezone as tz
        pending_links = ParentStudentLink.objects.filter(
            parent_phone=phone, status='pending', parent__isnull=True
        )
        if pending_links.exists():
            pending_links.update(parent=parent, status='active', activated_at=tz.now())

        # Get children
        active_links = parent.student_links.filter(status='active').select_related('student', 'student__class_ref')
        children = [{
            'name': link.student.full_name,
            'class': link.student.class_ref.name if link.student.class_ref else '',
            'student_id': link.student.student_id,
        } for link in active_links]

        return Response({
            'message': 'Muvaffaqiyatli bog\'landi',
            'parent_id': str(parent.id),
            'children': children,
        })


class TelegramAttendanceHistoryView(generics.GenericAPIView):
    """Bot uchun o'quvchi davomad tarixi (oxirgi 7 kun)"""
    permission_classes = [IsBotRequest]

    def get(self, request):
        telegram_id = request.headers.get('X-Telegram-ID')
        student_id = request.query_params.get('student_id')
        if not telegram_id:
            return Response({'detail': 'Telegram ID kerak'}, status=status.HTTP_400_BAD_REQUEST)

        from apps.students.models import Parent
        from apps.attendance.models import AttendanceRecord
        from datetime import date, timedelta

        parent = Parent.objects.filter(telegram_id=int(telegram_id)).first()
        if not parent:
            return Response({'history': []})

        # Verify student belongs to this parent
        link = parent.student_links.filter(status='active', student_id=student_id).select_related('student').first()
        if not link:
            return Response({'detail': 'O\'quvchi topilmadi'}, status=status.HTTP_404_NOT_FOUND)

        today = date.today()
        start = today - timedelta(days=6)
        records = AttendanceRecord.objects.filter(
            student=link.student, date__gte=start
        ).order_by('-date')

        status_map = {'present': '✅ Keldi', 'late': '⏰ Kech keldi', 'absent': '❌ Kelmadi', 'excused': '📋 Sababli'}
        history = []
        for r in records:
            history.append({
                'date': r.date.strftime('%d.%m.%Y'),
                'status': status_map.get(r.status, r.status),
                'check_in': r.check_in.strftime('%H:%M') if r.check_in else None,
                'check_out': r.check_out.strftime('%H:%M') if r.check_out else None,
            })

        return Response({'student': link.student.full_name, 'history': history})


class TelegramMyChildrenView(generics.GenericAPIView):
    """Bot uchun farzandlar ro'yxati"""
    permission_classes = [IsBotRequest]

    def get(self, request):
        telegram_id = request.headers.get('X-Telegram-ID')
        if not telegram_id:
            return Response({'detail': 'Telegram ID kerak'}, status=status.HTTP_400_BAD_REQUEST)

        from apps.students.models import Parent
        from apps.attendance.models import AttendanceRecord
        from datetime import date

        parent = Parent.objects.filter(telegram_id=int(telegram_id)).first()
        if not parent:
            return Response({'children': []})

        today = date.today()
        children = []
        for link in parent.student_links.filter(status='active').select_related('student', 'student__class_ref', 'student__school'):
            student = link.student
            today_record = AttendanceRecord.objects.filter(student=student, date=today).first()
            status_display = {
                'present': 'Keldi',
                'late': 'Kech keldi',
                'absent': 'Kelmadi',
                'excused': 'Sababli',
            }
            today_status = today_record.status if today_record else 'absent'
            children.append({
                'id': str(student.id),
                'name': student.full_name,
                'class': student.class_ref.name if student.class_ref else '',
                'school': student.school.name,
                'today_status': today_status,
                'today_status_uz': status_display.get(today_status, 'Ma\'lumot yo\'q'),
                'check_in': today_record.check_in.strftime('%H:%M') if today_record and today_record.check_in else None,
                'check_out': today_record.check_out.strftime('%H:%M') if today_record and today_record.check_out else None,
            })

        return Response({'children': children})
