from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model

User = get_user_model()


@receiver(post_save, sender=User)
def user_saved(sender, instance, created, **kwargs):
    if created:
        pass  # Additional setup on user creation
