# Generated manually

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0002_passwordresettoken'),
    ]

    operations = [
        migrations.CreateModel(
            name='Class',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True, null=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ('organization', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.organization')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='ExamAttempt',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('status', models.CharField(choices=[('in_progress', 'In Progress'), ('submitted', 'Submitted'), ('graded', 'Graded')], default='in_progress', max_length=20)),
                ('started_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('submitted_at', models.DateTimeField(blank=True, null=True)),
                ('total_score', models.IntegerField(blank=True, null=True)),
                ('max_score', models.IntegerField(blank=True, null=True)),
                ('exam_paper', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.exampaper')),
                ('student', models.ForeignKey(limit_choices_to={'role': 'student'}, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('exam_paper', 'student')},
            },
        ),
        migrations.CreateModel(
            name='ClassMember',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('class_group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.class')),
                ('student', models.ForeignKey(limit_choices_to={'role': 'student'}, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('class_group', 'student')},
            },
        ),
        migrations.CreateModel(
            name='Answer',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('answer_text', models.TextField(blank=True, null=True)),
                ('selected_choice', models.IntegerField(blank=True, null=True)),
                ('is_correct', models.BooleanField(blank=True, null=True)),
                ('points_earned', models.IntegerField(default=0)),
                ('exam_attempt', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.examattempt')),
                ('problem', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.problem')),
            ],
            options={
                'unique_together': {('exam_attempt', 'problem')},
            },
        ),
        migrations.AddIndex(
            model_name='examattempt',
            index=models.Index(fields=['exam_paper'], name='core_examat_exam_pa_idx'),
        ),
        migrations.AddIndex(
            model_name='examattempt',
            index=models.Index(fields=['student'], name='core_examat_student_idx'),
        ),
        migrations.AddIndex(
            model_name='examattempt',
            index=models.Index(fields=['status'], name='core_examat_status_idx'),
        ),
        migrations.AddIndex(
            model_name='class',
            index=models.Index(fields=['organization'], name='core_class_organiz_idx'),
        ),
        migrations.AddIndex(
            model_name='answer',
            index=models.Index(fields=['exam_attempt'], name='core_answer_exam_at_idx'),
        ),
        migrations.AddIndex(
            model_name='answer',
            index=models.Index(fields=['problem'], name='core_answer_problem_idx'),
        ),
    ]
