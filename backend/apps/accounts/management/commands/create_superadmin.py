from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.accounts.models import Role, UserRole

User = get_user_model()


class Command(BaseCommand):
    help = 'Superadmin foydalanuvchi yaratish'

    def add_arguments(self, parser):
        parser.add_argument('--phone', default='+998901234567')
        parser.add_argument('--password', default='Admin1234!')
        parser.add_argument('--first_name', default='Super')
        parser.add_argument('--last_name', default='Admin')

    def handle(self, *args, **options):
        phone = options['phone']
        password = options['password']

        if User.objects.filter(phone=phone).exists():
            self.stdout.write(self.style.WARNING(f'Foydalanuvchi allaqachon mavjud: {phone}'))
            user = User.objects.get(phone=phone)
        else:
            user = User.objects.create_superuser(
                phone=phone,
                password=password,
                first_name=options['first_name'],
                last_name=options['last_name'],
            )
            self.stdout.write(self.style.SUCCESS(f'Superadmin yaratildi: {phone}'))

        # Create roles if they don't exist
        role_choices = [
            ('superadmin', 'Super Admin'),
            ('region_director', 'Viloyat Direktori'),
            ('district_director', 'Tuman Direktori'),
            ('school_director', 'Maktab Direktori'),
            ('operator', 'Operator'),
            ('teacher', "O'qituvchi"),
            ('parent', 'Ota-ona'),
        ]
        for role_name, role_desc in role_choices:
            Role.objects.get_or_create(name=role_name, defaults={'description': role_desc})

        sa_role = Role.objects.get(name='superadmin')
        UserRole.objects.get_or_create(user=user, role=sa_role)

        self.stdout.write(self.style.SUCCESS(
            f'\n[OK] Tayyor!\n'
            f'   Telefon: {phone}\n'
            f'   Parol: {password}\n'
            f'   Rollar yaratildi: {len(role_choices)} ta\n'
        ))
