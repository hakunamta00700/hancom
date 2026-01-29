import os
from rest_framework import serializers
from .models import (
    Organization,
    User,
    Subject,
    Chapter,
    SourceDocument,
    IngestionJob,
    Problem,
    ReviewTask,
    ExamPaper,
    ExamPaperItem,
    Tag,
    Class,
    ClassMember,
    ExamAttempt,
    Answer,
)


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ["id", "name", "domain", "is_active", "created_at", "updated_at"]


class UserSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "name", "role", "organization", "is_active", "created_at", "updated_at"]
        read_only_fields = ["email", "role", "organization", "is_active", "created_at", "updated_at"]


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    name = serializers.CharField(max_length=100)
    organization_name = serializers.CharField(max_length=200)

    def create(self, validated_data):
        organization = Organization.objects.create(name=validated_data["organization_name"])
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            name=validated_data["name"],
            role="admin",
            organization=organization,
            is_staff=True,
        )
        return user


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("현재 비밀번호가 올바르지 않습니다.")
        return value


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(write_only=True, required=True, min_length=8)


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ["id", "name", "code", "display_order", "is_active", "created_at"]


class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ["id", "subject", "name", "code", "parent", "display_order", "is_active", "created_at"]


class SourceDocumentSerializer(serializers.ModelSerializer):
    def validate_file(self, value):
        max_bytes = 50 * 1024 * 1024
        if value.size > max_bytes:
            raise serializers.ValidationError("File size exceeds 50MB limit.")
        ext = os.path.splitext(value.name)[1].lstrip(".").upper()
        if ext not in {"PDF", "PNG", "JPG", "JPEG"}:
            raise serializers.ValidationError("Only PDF, PNG, JPG files are allowed.")
        return value

    class Meta:
        model = SourceDocument
        fields = [
            "id",
            "organization",
            "title",
            "file",
            "file_type",
            "file_size",
            "page_count",
            "source",
            "copyright_info",
            "exam_year",
            "exam_month",
            "exam_round",
            "uploaded_by",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "organization",
            "file_type",
            "file_size",
            "uploaded_by",
            "status",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        request = self.context["request"]
        file_obj = validated_data["file"]
        filename = file_obj.name
        ext = os.path.splitext(filename)[1].lstrip(".").upper()
        validated_data["file_type"] = ext
        validated_data["file_size"] = file_obj.size
        validated_data["organization"] = request.user.organization
        validated_data["uploaded_by"] = request.user
        source_document = super().create(validated_data)
        
        # IngestionJob 생성 및 Celery 태스크 시작
        ingestion_job = IngestionJob.objects.create(source_document=source_document)
        
        # 비동기 추출 작업 시작
        from .tasks import extract_problems_task
        extract_problems_task.delay(str(ingestion_job.id))
        
        return source_document


class IngestionJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = IngestionJob
        fields = [
            "id",
            "source_document",
            "status",
            "progress",
            "pages_processed",
            "problems_extracted",
            "error_message",
            "started_at",
            "completed_at",
            "created_at",
            "updated_at",
        ]


class ProblemSerializer(serializers.ModelSerializer):
    review_task = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()
    
    class Meta:
        model = Problem
        fields = [
            "id",
            "organization",
            "source_document",
            "problem_number",
            "page_number",
            "image_file",
            "text_content",
            "problem_type",
            "difficulty",
            "estimated_time",
            "is_public",
            "reviewed_at",
            "reviewed_by",
            "review_task",
            "tags",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["organization", "created_at", "updated_at"]
    
    def get_review_task(self, obj):
        try:
            task = obj.reviewtask_set.first()
            if task:
                return {
                    "id": str(task.id),
                    "status": task.status,
                    "review_notes": task.review_notes,
                }
        except:
            pass
        return None
    
    def get_tags(self, obj):
        tags = obj.problemtag_set.select_related("tag").all()
        return [
            {
                "id": str(tag.tag.id),
                "name": tag.tag.name,
                "category": tag.tag.category,
                "confidence": tag.confidence,
            }
            for tag in tags
        ]


class ReviewTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewTask
        fields = [
            "id",
            "problem",
            "ingestion_job",
            "status",
            "assigned_to",
            "reviewed_at",
            "review_notes",
            "created_at",
            "updated_at",
        ]


class ExamPaperItemSerializer(serializers.ModelSerializer):
    problem = ProblemSerializer(read_only=True)
    problem_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = ExamPaperItem
        fields = ["id", "exam_paper", "problem", "problem_id", "order_number", "points", "created_at", "updated_at"]
        read_only_fields = ["exam_paper", "created_at", "updated_at"]


class ExamPaperSerializer(serializers.ModelSerializer):
    items = ExamPaperItemSerializer(source="exampaperitem_set", many=True, read_only=True)
    
    class Meta:
        model = ExamPaper
        fields = [
            "id",
            "organization",
            "title",
            "description",
            "subject",
            "total_problems",
            "estimated_time",
            "difficulty_distribution",
            "created_by",
            "pdf_file",
            "is_published",
            "published_at",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["organization", "created_by", "created_at", "updated_at"]


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "category", "display_order", "is_active", "created_at"]


class ClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = Class
        fields = ["id", "organization", "name", "description", "created_by", "created_at", "updated_at"]
        read_only_fields = ["organization", "created_by", "created_at", "updated_at"]


class AnswerSerializer(serializers.ModelSerializer):
    problem = ProblemSerializer(read_only=True)
    
    class Meta:
        model = Answer
        fields = ["id", "exam_attempt", "problem", "answer_text", "selected_choice", "is_correct", "points_earned", "created_at", "updated_at"]
        read_only_fields = ["exam_attempt", "is_correct", "points_earned", "created_at", "updated_at"]


class ExamAttemptSerializer(serializers.ModelSerializer):
    exam_paper = ExamPaperSerializer(read_only=True)
    answers = AnswerSerializer(source="answer_set", many=True, read_only=True)
    
    class Meta:
        model = ExamAttempt
        fields = [
            "id",
            "exam_paper",
            "student",
            "status",
            "started_at",
            "submitted_at",
            "total_score",
            "max_score",
            "answers",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["student", "total_score", "max_score", "created_at", "updated_at"]
