from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ParentStudentLink, Parent


@receiver(post_save, sender=Parent)
def link_parent_to_pending_students(sender, instance, created, **kwargs):
    """When a new parent registers via bot, auto-link to pending students"""
    if instance.phone:
        pending_links = ParentStudentLink.objects.filter(
            parent_phone=instance.phone,
            status='pending',
            parent__isnull=True
        )
        if pending_links.exists():
            from django.utils import timezone
            pending_links.update(
                parent=instance,
                status='active',
                activated_at=timezone.now()
            )
