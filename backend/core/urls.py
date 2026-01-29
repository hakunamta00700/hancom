from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    HealthView,
    RegisterView,
    MeView,
    SubjectViewSet,
    ChapterViewSet,
    SourceDocumentViewSet,
    IngestionJobViewSet,
    ProblemViewSet,
    ReviewTaskViewSet,
    ExamPaperViewSet,
    TagViewSet,
)

router = DefaultRouter()
router.register(r"subjects", SubjectViewSet, basename="subjects")
router.register(r"chapters", ChapterViewSet, basename="chapters")
router.register(r"source-documents", SourceDocumentViewSet, basename="source-documents")
router.register(r"ingestion-jobs", IngestionJobViewSet, basename="ingestion-jobs")
router.register(r"problems", ProblemViewSet, basename="problems")
router.register(r"review-tasks", ReviewTaskViewSet, basename="review-tasks")
router.register(r"exam-papers", ExamPaperViewSet, basename="exam-papers")
router.register(r"tags", TagViewSet, basename="tags")

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("auth/register/", RegisterView.as_view()),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/login/", TokenObtainPairView.as_view(), name="token_login"),  # alias for test-cases.md
    path("auth/token/refresh/", TokenRefreshView.as_view()),
    path("auth/me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]
