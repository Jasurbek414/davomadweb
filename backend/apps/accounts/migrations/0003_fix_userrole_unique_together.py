from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_initial'),
        ('organizations', '0002_initial'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='userrole',
            unique_together={('user', 'role', 'region', 'district', 'school')},
        ),
    ]
