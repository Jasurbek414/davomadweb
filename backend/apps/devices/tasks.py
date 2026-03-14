"""
Celery tasks for device sync operations
"""
import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=2)
def push_students_to_device(self, device_id: int, sync_log_id: int):
    """O'quvchilarni qurilmaga yuklash"""
    from .models import Device, DeviceSyncLog
    from apps.students.models import Student

    try:
        device = Device.objects.select_related('school').get(id=device_id)
        sync_log = DeviceSyncLog.objects.get(id=sync_log_id)
        sync_log.status = 'running'
        sync_log.save(update_fields=['status'])

        # Notify WebSocket clients
        _notify_ws(device.school_id, 'sync_started', {
            'device_id': device_id,
            'sync_log_id': sync_log_id,
            'type': 'push'
        })

        students = Student.objects.filter(school=device.school, is_active=True)
        total = students.count()
        sync_log.total_records = total
        sync_log.save(update_fields=['total_records'])

        adapter = device.get_adapter()
        if not adapter.connect():
            raise Exception(f"Qurilmaga ulanib bo'lmadi: {device.ip_address}")

        success_count = 0
        fail_count = 0

        for student in students:
            try:
                user_data = {
                    'employee_no': student.student_id,
                    'name': student.full_name,
                }
                ok = adapter.add_user(user_data)
                if ok and student.photo:
                    try:
                        with open(student.photo.path, 'rb') as f:
                            adapter.upload_face(student.student_id, f.read())
                    except Exception as e:
                        logger.warning(f"Face upload failed for {student.student_id}: {e}")
                if ok:
                    success_count += 1
                else:
                    fail_count += 1
            except Exception as e:
                fail_count += 1
                logger.error(f"Push user {student.student_id} error: {e}")

        adapter.disconnect()

        sync_log.status = 'success' if fail_count == 0 else 'failed'
        sync_log.synced_records = success_count
        sync_log.failed_records = fail_count
        sync_log.completed_at = timezone.now()
        sync_log.save()

        device.status = 'online'
        device.last_seen = timezone.now()
        device.save(update_fields=['status', 'last_seen'])

        _notify_ws(device.school_id, 'sync_completed', {
            'device_id': device_id,
            'sync_log_id': sync_log_id,
            'success': success_count,
            'failed': fail_count,
        })

        return {'success': success_count, 'failed': fail_count}

    except Exception as e:
        logger.error(f"push_students_to_device error: {e}")
        try:
            sync_log = DeviceSyncLog.objects.get(id=sync_log_id)
            sync_log.status = 'failed'
            sync_log.error_message = str(e)
            sync_log.completed_at = timezone.now()
            sync_log.save()
        except Exception:
            pass
        raise self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=2)
def pull_logs_from_device(self, device_id: int, sync_log_id: int):
    """Qurilmadan loglarni olish va qayta ishlash"""
    from .models import Device, DeviceSyncLog, DeviceRawLog
    from datetime import datetime, timedelta

    try:
        device = Device.objects.get(id=device_id)
        sync_log = DeviceSyncLog.objects.get(id=sync_log_id)
        sync_log.status = 'running'
        sync_log.save(update_fields=['status'])

        adapter = device.get_adapter()
        if not adapter.connect():
            raise Exception(f"Qurilmaga ulanib bo'lmadi: {device.ip_address}")

        # Get logs from last 24 hours
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=24)
        raw_logs = adapter.get_raw_logs(start_time, end_time)
        adapter.disconnect()

        new_count = 0
        for log in raw_logs:
            try:
                event_time = log.get('event_time')
                if isinstance(event_time, str):
                    # Parse various datetime formats
                    for fmt in ['%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S']:
                        try:
                            event_time = datetime.strptime(event_time[:19], fmt)
                            break
                        except ValueError:
                            continue

                _, created = DeviceRawLog.objects.get_or_create(
                    device=device,
                    employee_no=str(log.get('employee_no', '')),
                    event_time=event_time,
                    defaults={
                        'event_type': log.get('event_type', 0),
                        'raw_data': log.get('raw_data', {}),
                    }
                )
                if created:
                    new_count += 1
            except Exception as e:
                logger.warning(f"Raw log parse error: {e} - {log}")

        sync_log.status = 'success'
        sync_log.total_records = len(raw_logs)
        sync_log.synced_records = new_count
        sync_log.completed_at = timezone.now()
        sync_log.save()

        # Process the new logs into attendance records
        if new_count > 0:
            process_raw_logs.delay(device_id)

        return {'total': len(raw_logs), 'new': new_count}

    except Exception as e:
        logger.error(f"pull_logs_from_device error: {e}")
        try:
            sync_log = DeviceSyncLog.objects.get(id=sync_log_id)
            sync_log.status = 'failed'
            sync_log.error_message = str(e)
            sync_log.completed_at = timezone.now()
            sync_log.save()
        except Exception:
            pass
        raise self.retry(exc=e, countdown=60)


@shared_task
def process_raw_logs(device_id: int = None):
    """Xom loglarni AttendanceRecord ga aylantirish"""
    from .models import DeviceRawLog
    from apps.attendance.tasks import create_attendance_from_log

    qs = DeviceRawLog.objects.filter(processed=False)
    if device_id:
        qs = qs.filter(device_id=device_id)

    count = 0
    for log in qs.select_related('device', 'device__school'):
        try:
            create_attendance_from_log(log)
            count += 1
        except Exception as e:
            logger.error(f"Process log {log.id} error: {e}")

    return {'processed': count}


@shared_task
def check_all_devices_status():
    """Barcha qurilmalar holatini tekshirish (Celery beat)"""
    from .models import Device
    from django.utils import timezone

    devices = Device.objects.filter(is_active=True)
    for device in devices:
        try:
            adapter = device.get_adapter()
            status_info = adapter.get_status()
            new_status = 'online' if status_info.get('online') else 'offline'
            if device.status != new_status:
                device.status = new_status
                device.last_seen = timezone.now() if status_info.get('online') else device.last_seen
                device.save(update_fields=['status', 'last_seen'])
        except Exception as e:
            logger.error(f"Check device {device.id} error: {e}")


@shared_task
def push_student_face_to_devices(student_id: str):
    """Bitta o'quvchi yuzini maktabdagi barcha qurilmalarga yuklash"""
    from apps.students.models import Student
    from .models import Device

    try:
        student = Student.objects.select_related('school').get(id=student_id, is_active=True)
        if not student.photo:
            logger.warning(f"Student {student_id} has no photo")
            return {'error': 'no_photo'}

        devices = Device.objects.filter(school=student.school, is_active=True)
        results = []

        for device in devices:
            try:
                adapter = device.get_adapter()
                if not adapter.connect():
                    results.append({'device': device.name, 'status': 'connection_failed'})
                    continue

                # First ensure user exists on device
                user_data = {'employee_no': student.student_id, 'name': student.full_name}
                adapter.add_user(user_data)

                # Upload face
                with open(student.photo.path, 'rb') as f:
                    ok = adapter.upload_face(student.student_id, f.read())

                adapter.disconnect()
                results.append({'device': device.name, 'status': 'success' if ok else 'failed'})
            except Exception as e:
                logger.error(f"Face push to {device.name}: {e}")
                results.append({'device': device.name, 'status': 'error', 'error': str(e)})

        return {'student': student.full_name, 'results': results}
    except Student.DoesNotExist:
        logger.error(f"Student {student_id} not found")
        return {'error': 'not_found'}


def _notify_ws(school_id, event_type, data):
    """WebSocket orqali xabar yuborish"""
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"school_{school_id}",
            {'type': 'device_event', 'event': event_type, 'data': data}
        )
    except Exception as e:
        logger.warning(f"WebSocket notify error: {e}")
