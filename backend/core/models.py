import uuid
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager,
)
from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        return super().save(*args, **kwargs)


class SoftDeleteModel(models.Model):
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True


class Organization(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    domain = models.CharField(max_length=100, unique=True, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class UserRole(models.TextChoices):
    ADMIN = "admin", "Admin"
    OPERATOR = "operator", "Operator"
    TEACHER = "teacher", "Teacher"
    STUDENT = "student", "Student"


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", UserRole.ADMIN)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=100)
    role = models.CharField(
        max_length=20, choices=UserRole.choices, default=UserRole.TEACHER
    )
    organization = models.ForeignKey(
        Organization, on_delete=models.SET_NULL, null=True, blank=True
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    def __str__(self):
        return self.email


class Subject(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True, null=True, blank=True)
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Chapter(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, null=True, blank=True)
    parent = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True)
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class SourceDocumentStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PROCESSING = "processing", "Processing"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"


class SourceDocument(TimeStampedModel, SoftDeleteModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization, on_delete=models.SET_NULL, null=True, blank=True
    )
    title = models.CharField(max_length=500)
    file = models.FileField(upload_to="source_documents/")
    file_type = models.CharField(max_length=20)
    file_size = models.BigIntegerField(null=True, blank=True)
    page_count = models.IntegerField(null=True, blank=True)
    source = models.CharField(max_length=200, null=True, blank=True)
    copyright_info = models.TextField(null=True, blank=True)
    exam_year = models.IntegerField(null=True, blank=True)
    exam_month = models.IntegerField(null=True, blank=True)
    exam_round = models.IntegerField(null=True, blank=True)
    uploaded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True
    )
    status = models.CharField(
        max_length=20,
        choices=SourceDocumentStatus.choices,
        default=SourceDocumentStatus.PENDING,
    )

    def __str__(self):
        return self.title


class IngestionStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PROCESSING = "processing", "Processing"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"


class IngestionJob(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source_document = models.ForeignKey(SourceDocument, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=20, choices=IngestionStatus.choices, default=IngestionStatus.PENDING
    )
    progress = models.IntegerField(default=0)
    pages_processed = models.IntegerField(default=0)
    problems_extracted = models.IntegerField(default=0)
    error_message = models.TextField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)


class ProblemType(models.TextChoices):
    MULTIPLE_CHOICE = "multiple_choice", "Multiple Choice"
    SHORT_ANSWER = "short_answer", "Short Answer"
    ESSAY = "essay", "Essay"
    PASSAGE_BASED = "passage_based", "Passage Based"


class Problem(TimeStampedModel, SoftDeleteModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization, on_delete=models.SET_NULL, null=True, blank=True
    )
    source_document = models.ForeignKey(
        SourceDocument, on_delete=models.SET_NULL, null=True, blank=True
    )
    problem_number = models.IntegerField(null=True, blank=True)
    page_number = models.IntegerField(null=True, blank=True)
    image_file = models.FileField(upload_to="problem_images/", null=True, blank=True)
    text_content = models.JSONField(null=True, blank=True)
    problem_type = models.CharField(
        max_length=30, choices=ProblemType.choices, null=True, blank=True
    )
    difficulty = models.IntegerField(null=True, blank=True)
    estimated_time = models.IntegerField(null=True, blank=True)
    is_public = models.BooleanField(default=False)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_problems",
    )


class Passage(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE)
    content = models.TextField()
    image_file = models.FileField(upload_to="passage_images/", null=True, blank=True)
    display_order = models.IntegerField(default=0)


class Choice(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE)
    number = models.IntegerField()
    text = models.TextField()
    is_correct = models.BooleanField(default=False)
    display_order = models.IntegerField(default=0)


class TagCategory(models.TextChoices):
    SUBJECT = "subject", "Subject"
    CHAPTER = "chapter", "Chapter"
    TYPE = "type", "Type"
    DIFFICULTY = "difficulty", "Difficulty"
    OTHER = "other", "Other"


class Tag(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=20, choices=TagCategory.choices)
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class ProblemTag(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    confidence = models.FloatField(null=True, blank=True)
    tagged_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        unique_together = ("problem", "tag")


class ProblemChapter(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE)
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE)
    is_primary = models.BooleanField(default=False)


class ExamTemplate(TimeStampedModel):
    """시험지 템플릿"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization, on_delete=models.SET_NULL, null=True, blank=True
    )
    name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    is_default = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True
    )
    # 템플릿 설정 (JSON)
    settings = models.JSONField(default=dict, help_text="템플릿 설정 (페이지 크기, 여백, 폰트 등)")
    
    class Meta:
        unique_together = ("organization", "name")


class ExamPaper(TimeStampedModel, SoftDeleteModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization, on_delete=models.SET_NULL, null=True, blank=True
    )
    title = models.CharField(max_length=500)
    description = models.TextField(null=True, blank=True)
    subject = models.ForeignKey(
        Subject, on_delete=models.SET_NULL, null=True, blank=True
    )
    template = models.ForeignKey(
        ExamTemplate, on_delete=models.SET_NULL, null=True, blank=True
    )
    total_problems = models.IntegerField()
    estimated_time = models.IntegerField(null=True, blank=True)
    difficulty_distribution = models.JSONField(null=True, blank=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True
    )
    pdf_file = models.FileField(upload_to="exam_papers/", null=True, blank=True)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)


class ExamPaperItem(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    exam_paper = models.ForeignKey(ExamPaper, on_delete=models.CASCADE)
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE)
    order_number = models.IntegerField()
    points = models.IntegerField(default=1)

    class Meta:
        unique_together = ("exam_paper", "order_number")


class ReviewStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    IN_PROGRESS = "in_progress", "In Progress"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"


class ReviewTask(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE)
    ingestion_job = models.ForeignKey(
        IngestionJob, on_delete=models.SET_NULL, null=True, blank=True
    )
    status = models.CharField(
        max_length=20, choices=ReviewStatus.choices, default=ReviewStatus.PENDING
    )
    assigned_to = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(null=True, blank=True)


class ReviewHistory(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE)
    review_task = models.ForeignKey(
        ReviewTask, on_delete=models.SET_NULL, null=True, blank=True
    )
    changed_field = models.CharField(max_length=100)
    old_value = models.TextField(null=True, blank=True)
    new_value = models.TextField(null=True, blank=True)
    changed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True
    )


class AuditLog(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    organization = models.ForeignKey(
        Organization, on_delete=models.SET_NULL, null=True, blank=True
    )
    action_type = models.CharField(max_length=50)
    resource_type = models.CharField(max_length=50, null=True, blank=True)
    resource_id = models.UUIDField(null=True, blank=True)
    details = models.JSONField(null=True, blank=True)
    ip_address = models.CharField(max_length=45, null=True, blank=True)
    user_agent = models.CharField(max_length=500, null=True, blank=True)


class PasswordResetToken(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["token"]),
            models.Index(fields=["expires_at"]),
        ]


class Class(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True
    )

    def __str__(self):
        return self.name


class ClassMember(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_group = models.ForeignKey(Class, on_delete=models.CASCADE, related_name="members")
    student = models.ForeignKey(
        User, on_delete=models.CASCADE, limit_choices_to={"role": UserRole.STUDENT}
    )

    class Meta:
        unique_together = ("class_group", "student")

    def __str__(self):
        return f"{self.class_group.name} - {self.student.name}"


class ExamAttemptStatus(models.TextChoices):
    IN_PROGRESS = "in_progress", "In Progress"
    SUBMITTED = "submitted", "Submitted"
    GRADED = "graded", "Graded"


class ExamAttempt(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    exam_paper = models.ForeignKey(ExamPaper, on_delete=models.CASCADE)
    student = models.ForeignKey(
        User, on_delete=models.CASCADE, limit_choices_to={"role": UserRole.STUDENT}
    )
    status = models.CharField(
        max_length=20,
        choices=ExamAttemptStatus.choices,
        default=ExamAttemptStatus.IN_PROGRESS,
    )
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    total_score = models.IntegerField(null=True, blank=True)
    max_score = models.IntegerField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["exam_paper"]),
        ]


class Answer(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    exam_attempt = models.ForeignKey(ExamAttempt, on_delete=models.CASCADE, related_name="answer_set")
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE)
    answer_text = models.TextField(null=True, blank=True)
    selected_choice = models.IntegerField(null=True, blank=True)
    is_correct = models.BooleanField(null=True, blank=True)
    points_earned = models.IntegerField(default=0)

    class Meta:
        unique_together = ("exam_attempt", "problem")
