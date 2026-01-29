# Generated manually based on models.py

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Organization',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('name', models.CharField(max_length=200)),
                ('domain', models.CharField(blank=True, max_length=100, null=True, unique=True)),
                ('is_active', models.BooleanField(default=True)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Subject',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('name', models.CharField(max_length=100, unique=True)),
                ('code', models.CharField(blank=True, max_length=20, null=True, unique=True)),
                ('display_order', models.IntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Tag',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('name', models.CharField(max_length=100, unique=True)),
                ('category', models.CharField(choices=[('subject', 'Subject'), ('chapter', 'Chapter'), ('type', 'Type'), ('difficulty', 'Difficulty'), ('other', 'Other')], max_length=20)),
                ('display_order', models.IntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('name', models.CharField(max_length=100)),
                ('role', models.CharField(choices=[('admin', 'Admin'), ('operator', 'Operator'), ('teacher', 'Teacher'), ('student', 'Student')], default='teacher', max_length=20)),
                ('is_active', models.BooleanField(default=True)),
                ('is_staff', models.BooleanField(default=False)),
                ('organization', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='core.organization')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='SourceDocument',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('deleted_at', models.DateTimeField(blank=True, null=True)),
                ('title', models.CharField(max_length=500)),
                ('file', models.FileField(upload_to='source_documents/')),
                ('file_type', models.CharField(max_length=20)),
                ('file_size', models.BigIntegerField(blank=True, null=True)),
                ('page_count', models.IntegerField(blank=True, null=True)),
                ('source', models.CharField(blank=True, max_length=200, null=True)),
                ('copyright_info', models.TextField(blank=True, null=True)),
                ('exam_year', models.IntegerField(blank=True, null=True)),
                ('exam_month', models.IntegerField(blank=True, null=True)),
                ('exam_round', models.IntegerField(blank=True, null=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('processing', 'Processing'), ('completed', 'Completed'), ('failed', 'Failed')], default='pending', max_length=20)),
                ('organization', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='core.organization')),
                ('uploaded_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='IngestionJob',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('processing', 'Processing'), ('completed', 'Completed'), ('failed', 'Failed')], default='pending', max_length=20)),
                ('progress', models.IntegerField(default=0)),
                ('pages_processed', models.IntegerField(default=0)),
                ('problems_extracted', models.IntegerField(default=0)),
                ('error_message', models.TextField(blank=True, null=True)),
                ('started_at', models.DateTimeField(blank=True, null=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('source_document', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.sourcedocument')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Problem',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('deleted_at', models.DateTimeField(blank=True, null=True)),
                ('problem_number', models.IntegerField(blank=True, null=True)),
                ('page_number', models.IntegerField(blank=True, null=True)),
                ('image_file', models.FileField(blank=True, null=True, upload_to='problem_images/')),
                ('text_content', models.JSONField(blank=True, null=True)),
                ('problem_type', models.CharField(blank=True, choices=[('multiple_choice', 'Multiple Choice'), ('short_answer', 'Short Answer'), ('essay', 'Essay'), ('passage_based', 'Passage Based')], max_length=30, null=True)),
                ('difficulty', models.IntegerField(blank=True, null=True)),
                ('estimated_time', models.IntegerField(blank=True, null=True)),
                ('is_public', models.BooleanField(default=False)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('organization', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='core.organization')),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_problems', to=settings.AUTH_USER_MODEL)),
                ('source_document', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='core.sourcedocument')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Chapter',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('name', models.CharField(max_length=200)),
                ('code', models.CharField(blank=True, max_length=50, null=True)),
                ('display_order', models.IntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='core.chapter')),
                ('subject', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.subject')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='ExamPaper',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('deleted_at', models.DateTimeField(blank=True, null=True)),
                ('title', models.CharField(max_length=500)),
                ('description', models.TextField(blank=True, null=True)),
                ('total_problems', models.IntegerField()),
                ('estimated_time', models.IntegerField(blank=True, null=True)),
                ('difficulty_distribution', models.JSONField(blank=True, null=True)),
                ('pdf_file', models.FileField(blank=True, null=True, upload_to='exam_papers/')),
                ('is_published', models.BooleanField(default=False)),
                ('published_at', models.DateTimeField(blank=True, null=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ('organization', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='core.organization')),
                ('subject', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='core.subject')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='ReviewTask',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('in_progress', 'In Progress'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending', max_length=20)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('review_notes', models.TextField(blank=True, null=True)),
                ('assigned_to', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ('ingestion_job', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='core.ingestionjob')),
                ('problem', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.problem')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='ReviewHistory',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('changed_field', models.CharField(max_length=100)),
                ('old_value', models.TextField(blank=True, null=True)),
                ('new_value', models.TextField(blank=True, null=True)),
                ('changed_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ('problem', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.problem')),
                ('review_task', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='core.reviewtask')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='ProblemTag',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('confidence', models.FloatField(blank=True, null=True)),
                ('problem', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.problem')),
                ('tag', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.tag')),
                ('tagged_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('problem', 'tag')},
            },
        ),
        migrations.CreateModel(
            name='ProblemChapter',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('is_primary', models.BooleanField(default=False)),
                ('chapter', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.chapter')),
                ('problem', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.problem')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Passage',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('content', models.TextField()),
                ('image_file', models.FileField(blank=True, null=True, upload_to='passage_images/')),
                ('display_order', models.IntegerField(default=0)),
                ('problem', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.problem')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='ExamPaperItem',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('order_number', models.IntegerField()),
                ('points', models.IntegerField(default=1)),
                ('exam_paper', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.exampaper')),
                ('problem', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.problem')),
            ],
            options={
                'unique_together': {('exam_paper', 'order_number')},
            },
        ),
        migrations.CreateModel(
            name='Choice',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('number', models.IntegerField()),
                ('text', models.TextField()),
                ('is_correct', models.BooleanField(default=False)),
                ('display_order', models.IntegerField(default=0)),
                ('problem', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.problem')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='AuditLog',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('action_type', models.CharField(max_length=50)),
                ('resource_type', models.CharField(blank=True, max_length=50, null=True)),
                ('resource_id', models.UUIDField(blank=True, null=True)),
                ('details', models.JSONField(blank=True, null=True)),
                ('ip_address', models.CharField(blank=True, max_length=45, null=True)),
                ('user_agent', models.CharField(blank=True, max_length=500, null=True)),
                ('organization', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='core.organization')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.AddIndex(
            model_name='problem',
            index=models.Index(fields=['organization'], name='core_proble_organiz_idx'),
        ),
        migrations.AddIndex(
            model_name='problem',
            index=models.Index(fields=['is_public'], name='core_proble_is_publ_idx'),
        ),
        migrations.AddIndex(
            model_name='problem',
            index=models.Index(fields=['difficulty'], name='core_proble_difficu_idx'),
        ),
        migrations.AddIndex(
            model_name='problem',
            index=models.Index(fields=['problem_type'], name='core_proble_problem_idx'),
        ),
        migrations.AddIndex(
            model_name='problem',
            index=models.Index(fields=['created_at'], name='core_proble_created_idx'),
        ),
        migrations.AddIndex(
            model_name='ingestionjob',
            index=models.Index(fields=['source_document'], name='core_ingest_source__idx'),
        ),
        migrations.AddIndex(
            model_name='ingestionjob',
            index=models.Index(fields=['status'], name='core_ingest_status_idx'),
        ),
        migrations.AddIndex(
            model_name='sourcedocument',
            index=models.Index(fields=['organization'], name='core_source_organiz_idx'),
        ),
        migrations.AddIndex(
            model_name='sourcedocument',
            index=models.Index(fields=['status'], name='core_source_status_idx'),
        ),
        migrations.AddIndex(
            model_name='sourcedocument',
            index=models.Index(fields=['uploaded_by'], name='core_source_uploaded_idx'),
        ),
        migrations.AddIndex(
            model_name='reviewtask',
            index=models.Index(fields=['problem'], name='core_review_problem_idx'),
        ),
        migrations.AddIndex(
            model_name='reviewtask',
            index=models.Index(fields=['status'], name='core_review_status_idx'),
        ),
        migrations.AddIndex(
            model_name='reviewtask',
            index=models.Index(fields=['assigned_to'], name='core_review_assigned_idx'),
        ),
        migrations.AddIndex(
            model_name='reviewhistory',
            index=models.Index(fields=['problem'], name='core_review_problem_idx'),
        ),
        migrations.AddIndex(
            model_name='reviewhistory',
            index=models.Index(fields=['changed_by'], name='core_review_changed_idx'),
        ),
        migrations.AddIndex(
            model_name='exampaper',
            index=models.Index(fields=['organization'], name='core_exampa_organiz_idx'),
        ),
        migrations.AddIndex(
            model_name='exampaper',
            index=models.Index(fields=['created_by'], name='core_exampa_created_idx'),
        ),
        migrations.AddIndex(
            model_name='exampaper',
            index=models.Index(fields=['subject'], name='core_exampa_subject_idx'),
        ),
        migrations.AddIndex(
            model_name='exampaper',
            index=models.Index(fields=['is_published'], name='core_exampa_is_publ_idx'),
        ),
        migrations.AddIndex(
            model_name='exampaperitem',
            index=models.Index(fields=['exam_paper'], name='core_exampap_exam_pa_idx'),
        ),
        migrations.AddIndex(
            model_name='exampaperitem',
            index=models.Index(fields=['problem'], name='core_exampap_problem_idx'),
        ),
        migrations.AddIndex(
            model_name='problemtag',
            index=models.Index(fields=['problem'], name='core_proble_problem_idx'),
        ),
        migrations.AddIndex(
            model_name='problemtag',
            index=models.Index(fields=['tag'], name='core_proble_tag_id_idx'),
        ),
        migrations.AddIndex(
            model_name='problemchapter',
            index=models.Index(fields=['problem'], name='core_proble_problem_idx'),
        ),
        migrations.AddIndex(
            model_name='problemchapter',
            index=models.Index(fields=['chapter'], name='core_proble_chapter_idx'),
        ),
        migrations.AddIndex(
            model_name='chapter',
            index=models.Index(fields=['subject'], name='core_chapte_subject_idx'),
        ),
        migrations.AddIndex(
            model_name='chapter',
            index=models.Index(fields=['parent'], name='core_chapte_parent_idx'),
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['user'], name='core_auditl_user_id_idx'),
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['organization'], name='core_auditl_organiz_idx'),
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['action_type'], name='core_auditl_action__idx'),
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['created_at'], name='core_auditl_created_idx'),
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['resource_type', 'resource_id'], name='core_auditl_resourc_idx'),
        ),
        migrations.AddIndex(
            model_name='tag',
            index=models.Index(fields=['category'], name='core_tag_category_idx'),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['email'], name='core_user_email_idx'),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['organization'], name='core_user_organiz_idx'),
        ),
        migrations.AddIndex(
            model_name='organization',
            index=models.Index(fields=['domain'], name='core_organiz_domain_idx'),
        ),
        migrations.AddIndex(
            model_name='subject',
            index=models.Index(fields=['code'], name='core_subject_code_idx'),
        ),
        migrations.AddIndex(
            model_name='choice',
            index=models.Index(fields=['problem'], name='core_choice_problem_idx'),
        ),
        migrations.AddIndex(
            model_name='choice',
            index=models.Index(fields=['number'], name='core_choice_number_idx'),
        ),
        migrations.AddIndex(
            model_name='passage',
            index=models.Index(fields=['problem'], name='core_passage_problem_idx'),
        ),
    ]
