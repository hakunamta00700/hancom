from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from . import models

# PasswordResetToken도 admin에 등록
admin.site.register(models.PasswordResetToken)


@admin.register(models.Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ["name", "domain", "is_active", "created_at"]
    list_filter = ["is_active", "created_at"]
    search_fields = ["name", "domain"]


@admin.register(models.User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        "email",
        "name",
        "role",
        "organization",
        "is_active",
        "is_staff",
        "created_at",
    ]
    list_filter = ["role", "is_active", "is_staff", "organization", "created_at"]
    search_fields = ["email", "name"]
    fieldsets = BaseUserAdmin.fieldsets + (
        ("추가 정보", {"fields": ("role", "organization")}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("추가 정보", {"fields": ("role", "organization")}),
    )


@admin.register(models.Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "display_order", "is_active", "created_at"]
    list_filter = ["is_active", "created_at"]
    search_fields = ["name", "code"]
    ordering = ["display_order", "name"]


@admin.register(models.Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ["name", "subject", "parent", "display_order", "is_active"]
    list_filter = ["subject", "is_active", "created_at"]
    search_fields = ["name", "code"]
    ordering = ["subject", "display_order", "name"]


@admin.register(models.SourceDocument)
class SourceDocumentAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "organization",
        "file_type",
        "status",
        "uploaded_by",
        "created_at",
    ]
    list_filter = ["status", "file_type", "organization", "created_at"]
    search_fields = ["title", "source"]
    readonly_fields = [
        "file_type",
        "file_size",
        "uploaded_by",
        "created_at",
        "updated_at",
    ]


@admin.register(models.IngestionJob)
class IngestionJobAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "source_document",
        "status",
        "progress",
        "pages_processed",
        "problems_extracted",
        "created_at",
    ]
    list_filter = ["status", "created_at"]
    search_fields = ["source_document__title"]
    readonly_fields = ["created_at", "updated_at", "started_at", "completed_at"]


@admin.register(models.Problem)
class ProblemAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "problem_number",
        "organization",
        "problem_type",
        "difficulty",
        "is_public",
        "reviewed_at",
    ]
    list_filter = [
        "problem_type",
        "difficulty",
        "is_public",
        "organization",
        "created_at",
    ]
    search_fields = ["text_content"]
    readonly_fields = ["created_at", "updated_at", "reviewed_at"]


@admin.register(models.Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "display_order", "is_active"]
    list_filter = ["category", "is_active"]
    search_fields = ["name"]
    ordering = ["category", "display_order", "name"]


@admin.register(models.ReviewTask)
class ReviewTaskAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "problem",
        "status",
        "assigned_to",
        "reviewed_at",
        "created_at",
    ]
    list_filter = ["status", "created_at"]
    search_fields = ["problem__text_content", "review_notes"]


@admin.register(models.ExamPaper)
class ExamPaperAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "organization",
        "subject",
        "total_problems",
        "is_published",
        "created_by",
        "created_at",
    ]
    list_filter = ["is_published", "organization", "subject", "created_at"]
    search_fields = ["title", "description"]


@admin.register(models.AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = [
        "action_type",
        "user",
        "organization",
        "resource_type",
        "created_at",
    ]
    list_filter = ["action_type", "resource_type", "created_at"]
    search_fields = ["action_type", "user__email"]
    readonly_fields = ["created_at", "updated_at"]
    date_hierarchy = "created_at"


# 간단한 모델들은 기본 등록
admin.site.register(models.Passage)
admin.site.register(models.Choice)
admin.site.register(models.ProblemTag)
admin.site.register(models.ProblemChapter)
admin.site.register(models.ExamPaperItem)
admin.site.register(models.ReviewHistory)
admin.site.register(models.Class)
admin.site.register(models.ClassMember)
admin.site.register(models.ExamAttempt)
admin.site.register(models.Answer)
