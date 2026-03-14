"""
Attendance processing tasks
"""
import logging
from celery import shared_task
from django.utils import timezone
from django.conf import settings

logger = logging.getLogger(__name__)


def create_attendance_from_log(raw_log):
    """
    DeviceRawLog dan AttendanceRecord yaratish yoki yangilash.
    Bu markaziy davomad mantiq funksiyasi.
    """
    from .models import AttendanceRecord
    from apps.students.models import Student
    from datetime import datetime, time

    if raw_log.processed:
        return None

    # Find student by employee_no (student_id)
    student = Student.objects.filter(
        student_id=raw_log.employee_no,
        is_active=True
    ).first()

    if not student:
        # Try by phone mapping
        from apps.students.models import Parent
        parent = Parent.objects.filter(phone=raw_log.employee_no).first()
        if parent and parent.student_links.filter(status='active').exists():
            student = parent.student_links.filter(status='active').first().student

    if not student:
        logger.warning(f"Student not found for employee_no: {raw_log.employee_no}")
        raw_log.processed = True
        raw_log.save(update_fields=['processed'])
        return None

    event_date = raw_log.event_time.date()
    event_time = raw_log.event_time

    # Get or create attendance record
    record, created = AttendanceRecord.objects.get_or_create(
        student=student,
        date=event_date,
        defaults={
            'check_in': event_time,
            'check_in_device': raw_log.device,
            'raw_log': raw_log,
        }
    )

    if not created:
        # Update existing record
        if record.check_in is None or event_time < record.check_in:
            record.check_in = event_time
            record.check_in_device = raw_log.device
        elif record.check_out is None or event_time > record.check_out:
            record.check_out = event_time
            record.check_out_device = raw_log.device

    # Calculate status
    school_start = _parse_school_time(settings.SCHOOL_START_TIME)
    late_threshold = settings.SCHOOL_LATE_THRESHOLD_MINUTES

    check_in_time = record.check_in.time() if record.check_in else None
    if check_in_time:
        if check_in_time <= school_start:
            record.status = 'present'
            record.late_minutes = 0
        else:
            from datetime import datetime as dt
            start_dt = dt.combine(event_date, school_start)
            actual_dt = dt.combine(event_date, check_in_time)
            late_mins = int((actual_dt - start_dt).total_seconds() / 60)
            record.late_minutes = late_mins
            record.status = 'late'

    record.save()
    raw_log.processed = True
    raw_log.save(update_fields=['processed'])

    # Send notification to parent
    _send_parent_notification(student, record)

    return record


@shared_task
def mark_absent_students():
    """Kun oxirida kelmagan o'quvchilarni 'absent' qilish"""
    from .models import AttendanceRecord
    from apps.students.models import Student
    from datetime import date

    today = date.today()
    # Get student IDs that already have a record today
    existing_ids = set(
        AttendanceRecord.objects.filter(date=today).values_list('student_id', flat=True)
    )
    # Bulk create absent records for students without a record today
    students_to_mark = Student.objects.filter(is_active=True).exclude(id__in=existing_ids)
    records = [
        AttendanceRecord(student=s, date=today, status='absent')
        for s in students_to_mark
    ]
    AttendanceRecord.objects.bulk_create(records, ignore_conflicts=True)
    marked = len(records)
    logger.info(f"Marked {marked} students as absent for {today}")
    return {'marked': marked}


@shared_task
def send_daily_summary():
    """Kunlik davomad xulosasini yuborish"""
    from apps.notifications.tasks import send_management_notification
    from .models import AttendanceRecord
    from datetime import date
    from django.db.models import Count

    today = date.today()
    from django.db.models import Q
    stats = AttendanceRecord.objects.filter(date=today).aggregate(
        present=Count('id', filter=Q(status='present')),
        late=Count('id', filter=Q(status='late')),
        absent=Count('id', filter=Q(status='absent')),
    )
    send_management_notification.delay(today.isoformat(), stats)


def _parse_school_time(time_str):
    """'08:00' -> time object"""
    from datetime import time
    parts = time_str.split(':')
    return time(int(parts[0]), int(parts[1]))


def _send_parent_notification(student, attendance_record):
    """Ota-onaga xabar yuborish"""
    try:
        from apps.notifications.tasks import send_telegram_notification
        active_links = student.parent_links.filter(status='active').select_related('parent')
        for link in active_links:
            if link.parent and link.parent.telegram_id:
                send_telegram_notification.delay(
                    telegram_id=link.parent.telegram_id,
                    student_name=student.full_name,
                    event_type=attendance_record.status,
                    check_in=attendance_record.check_in.strftime('%H:%M') if attendance_record.check_in else None,
                    school_name=student.school.name,
                )
    except Exception as e:
        logger.error(f"Parent notification error: {e}")
