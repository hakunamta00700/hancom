from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    HealthView,
    RegisterView,
    MeView,
    PasswordChangeView,
    ForgotPasswordView,
    ResetPasswordView,
    StudentsListView,
    SubjectViewSet,
    ChapterViewSet,
    SourceDocumentViewSet,
    IngestionJobViewSet,
    ProblemViewSet,
    ReviewTaskViewSet,
    ExamPaperViewSet,
    ExamTemplateViewSet,
    ExamPaperConditionViewSet,
    TagViewSet,
    ClassViewSet,
    ExamAttemptViewSet,
)

router = DefaultRouter()
router.register(r"subjects", SubjectViewSet, basename="subjects")
router.register(r"chapters", ChapterViewSet, basename="chapters")
router.register(r"source-documents", SourceDocumentViewSet, basename="source-documents")
router.register(r"ingestion-jobs", IngestionJobViewSet, basename="ingestion-jobs")
router.register(r"problems", ProblemViewSet, basename="problems")
router.register(r"review-tasks", ReviewTaskViewSet, basename="review-tasks")
# review-tasks 엔드포인트는 router에 등록되므로 approve, reject, stats는 자동으로 포함됨
router.register(r"exam-papers", ExamPaperViewSet, basename="exam-papers")
router.register(r"exam-templates", ExamTemplateViewSet, basename="exam-templates")
router.register(r"exam-paper-conditions", ExamPaperConditionViewSet, basename="exam-paper-conditions")
router.register(r"tags", TagViewSet, basename="tags")
router.register(r"classes", ClassViewSet, basename="classes")

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("auth/register/", RegisterView.as_view()),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path(
        "auth/login/", TokenObtainPairView.as_view(), name="token_login"
    ),  # alias for test-cases.md
    path("auth/token/refresh/", TokenRefreshView.as_view()),
    path("auth/me/", MeView.as_view(), name="me"),
    path("auth/password/change/", PasswordChangeView.as_view(), name="password_change"),
    path("auth/forgot-password/", ForgotPasswordView.as_view(), name="forgot_password"),
    path("auth/reset-password/", ResetPasswordView.as_view(), name="reset_password"),
    path("students/", StudentsListView.as_view(), name="students_list"),
    path("", include(router.urls)),
]
