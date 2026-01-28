from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import (
    Subject,
    Chapter,
    SourceDocument,
    IngestionJob,
    Problem,
    ReviewTask,
    ExamPaper,
    Tag,
)
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    SubjectSerializer,
    ChapterSerializer,
    SourceDocumentSerializer,
    IngestionJobSerializer,
    ProblemSerializer,
    ReviewTaskSerializer,
    ExamPaperSerializer,
    TagSerializer,
)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data)


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class SubjectViewSet(viewsets.ModelViewSet):
    serializer_class = SubjectSerializer
    queryset = Subject.objects.all()

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]


class ChapterViewSet(viewsets.ModelViewSet):
    serializer_class = ChapterSerializer
    queryset = Chapter.objects.all()

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]


class SourceDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = SourceDocumentSerializer

    def get_queryset(self):
        user = self.request.user
        return SourceDocument.objects.filter(organization=user.organization, deleted_at__isnull=True)

    def get_permissions(self):
        if self.action in {"list", "retrieve", "create"}:
            return [permissions.IsAuthenticated()]
        if self.request.user.role not in {"admin", "operator"}:
            raise PermissionDenied("Insufficient permissions")
        return [permissions.IsAuthenticated()]


class IngestionJobViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = IngestionJobSerializer

    def get_queryset(self):
        user = self.request.user
        return IngestionJob.objects.filter(source_document__organization=user.organization)


class ProblemViewSet(viewsets.ModelViewSet):
    serializer_class = ProblemSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Problem.objects.filter(organization=user.organization, deleted_at__isnull=True)
        if user.role not in {"admin", "operator"}:
            queryset = queryset.filter(is_public=True)
        return queryset

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            if self.request.user.role not in {"admin", "operator"}:
                raise PermissionDenied("Insufficient permissions")
        return [permissions.IsAuthenticated()]


class ReviewTaskViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewTaskSerializer

    def get_queryset(self):
        user = self.request.user
        return ReviewTask.objects.filter(problem__organization=user.organization)

    def get_permissions(self):
        if self.request.user.role not in {"admin", "operator"}:
            raise PermissionDenied("Insufficient permissions")
        return [permissions.IsAuthenticated()]


class ExamPaperViewSet(viewsets.ModelViewSet):
    serializer_class = ExamPaperSerializer

    def get_queryset(self):
        user = self.request.user
        return ExamPaper.objects.filter(organization=user.organization, deleted_at__isnull=True)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization, created_by=self.request.user)

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            if self.request.user.role == "student":
                raise PermissionDenied("Insufficient permissions")
        return [permissions.IsAuthenticated()]


class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    queryset = Tag.objects.all()
