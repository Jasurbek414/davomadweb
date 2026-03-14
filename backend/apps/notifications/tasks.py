"""
Notification tasks - Telegram bot orqali xabar yuborish
"""
import logging
import asyncio
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task
def send_telegram_notification(telegram_id: int, student_name: str, event_type: str,
                                check_in: str = None, school_name: str = ''):
    """Ota-onaga Telegram orqali davomad xabari yuborish"""
    from django.conf import settings
    from django.utils import timezone as tz
    import requests

    token = settings.PARENT_BOT_TOKEN
    if not token:
        logger.warning("PARENT_BOT_TOKEN not configured")
        return

    emoji_map = {
        'present': '✅', 'late': '⏰', 'absent': '❌', 'check_in': '✅', 'check_out': '🏠'
    }
    event_text_map = {
        'present': 'maktabga keldi',
        'late': 'kech keldi',
        'absent': 'kelmadi',
        'check_in': 'maktabga keldi',
        'check_out': 'maktabdan chiqdi',
    }
    emoji = emoji_map.get(event_type, '📢')
    event_text = event_text_map.get(event_type, event_type)

    text = f"{emoji} <b>{student_name}</b> {event_text}"
    if check_in:
        text += f"\n🕐 Vaqt: {check_in}"
    if school_name:
        text += f"\n🏫 {school_name}"

    title = f"{emoji} {student_name} {event_text}"

    # Try to find recipient User
    recipient = None
    try:
        from .models import TelegramAccount
        tg_account = TelegramAccount.objects.filter(telegram_id=telegram_id, is_active=True).first()
        if tg_account and tg_account.user:
            recipient = tg_account.user
    except Exception:
        pass

    # Save Notification record for audit/history
    try:
        from .models import Notification
        notif = Notification.objects.create(
            recipient=recipient,
            telegram_id=telegram_id,
            notification_type=event_type if event_type in ('check_in', 'check_out', 'absent', 'late') else 'system',
            title=title[:200],
            message=text,
            data={'student_name': student_name, 'event_type': event_type, 'check_in': check_in, 'school_name': school_name},
            status='pending',
        )
    except Exception as e:
        logger.warning(f"Failed to save Notification record: {e}")
        notif = None

    try:
        resp = requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={'chat_id': telegram_id, 'text': text, 'parse_mode': 'HTML'},
            timeout=10
        )
        if resp.status_code == 200:
            logger.info(f"Telegram notification sent to {telegram_id}")
            if notif:
                notif.status = 'sent'
                notif.sent_at = tz.now()
                notif.save(update_fields=['status', 'sent_at'])
            return True
        else:
            logger.error(f"Telegram send failed: {resp.text}")
            if notif:
                notif.status = 'failed'
                notif.save(update_fields=['status'])
            return False
    except Exception as e:
        logger.error(f"Telegram notification error: {e}")
        if notif:
            notif.status = 'failed'
            notif.save(update_fields=['status'])
        return False


@shared_task
def send_management_notification(date_str: str, stats: dict):
    """Boshqaruvchilar botiga kunlik hisobot yuborish"""
    from django.conf import settings
    import requests

    token = settings.MANAGEMENT_BOT_TOKEN
    if not token:
        return

    text = (
        f"📊 <b>Kunlik Davomad Hisoboti</b>\n"
        f"📅 {date_str}\n\n"
        f"✅ Keldi: {stats.get('present', 0)} ta\n"
        f"⏰ Kech keldi: {stats.get('late', 0)} ta\n"
        f"❌ Kelmadi: {stats.get('absent', 0)} ta\n"
        f"📈 Jami: {stats.get('total', 0)} ta"
    )

    chat_id = getattr(settings, 'MANAGEMENT_CHAT_ID', None)
    if not chat_id:
        logger.warning("MANAGEMENT_CHAT_ID not configured, skipping management notification")
        return

    try:
        resp = requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML'},
            timeout=10
        )
        if resp.status_code == 200:
            logger.info(f"Management daily report sent: {stats}")
        else:
            logger.error(f"Management report send failed: {resp.text}")
    except Exception as e:
        logger.error(f"Management notification error: {e}")
