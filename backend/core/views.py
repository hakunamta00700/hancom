import secrets
from datetime import timedelta
from django.utils import timezone
from django.db import connection
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import permissions, viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError
from rest_framework.decorators import action
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
    User,
    PasswordResetToken,
)
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    PasswordChangeSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    SubjectSerializer,
    ChapterSerializer,
    SourceDocumentSerializer,
    IngestionJobSerializer,
    ProblemSerializer,
    ReviewTaskSerializer,
    ExamPaperSerializer,
    TagSerializer,
)


class HealthView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        status_dict = {"status": "ok"}
        checks = {}

        # DB 연결 확인
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            checks["database"] = "ok"
        except Exception as e:
            checks["database"] = f"error: {str(e)}"
            status_dict["status"] = "degraded"

        # Redis 연결 확인
        try:
            cache.set("health_check", "ok", 1)
            cache.get("health_check")
            checks["redis"] = "ok"
        except Exception as e:
            checks["redis"] = f"error: {str(e)}"
            status_dict["status"] = "degraded"

        status_dict["checks"] = checks
        status_code = 200 if status_dict["status"] == "ok" else 503
        return Response(status_dict, status=status_code)


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

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class PasswordChangeView(APIView):
    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response({"detail": "비밀번호가 변경되었습니다."})


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            # 보안상 이메일 존재 여부를 노출하지 않음
            return Response(
                {"detail": "이메일로 재설정 링크를 전송했습니다."},
                status=status.HTTP_200_OK,
            )

        # 기존 토큰 무효화
        PasswordResetToken.objects.filter(user=user, used=False).update(used=True)

        # 새 토큰 생성
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(hours=24)
        PasswordResetToken.objects.create(user=user, token=token, expires_at=expires_at)

        # 이메일 발송 (개발 환경에서는 콘솔 출력)
        reset_url = (
            f"{request.scheme}://{request.get_host()}/reset-password?token={token}"
        )
        if settings.DEBUG:
            print(f"[개발용] 비밀번호 재설정 링크: {reset_url}")
        else:
            send_mail(
                subject="비밀번호 재설정",
                message=f"비밀번호 재설정 링크: {reset_url}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )

        return Response({"detail": "이메일로 재설정 링크를 전송했습니다."})


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token_str = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]

        try:
            reset_token = PasswordResetToken.objects.get(
                token=token_str, used=False, expires_at__gt=timezone.now()
            )
        except PasswordResetToken.DoesNotExist:
            raise ValidationError({"token": "유효하지 않거나 만료된 토큰입니다."})

        user = reset_token.user
        user.set_password(new_password)
        user.save()

        reset_token.used = True
        reset_token.save()

        return Response({"detail": "비밀번호가 재설정되었습니다."})


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
        return SourceDocument.objects.filter(
            organization=user.organization, deleted_at__isnull=True
        )

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
        queryset = IngestionJob.objects.filter(
            source_document__organization=user.organization
        )

        # 상태 필터링 지원
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.select_related("source_document")

    @action(detail=True, methods=["post"])
    def retry(self, request, pk=None):
        """실패한 작업 재시도"""
        job = self.get_object()
        if job.status != "failed":
            return Response(
                {"detail": "실패한 작업만 재시도할 수 있습니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .tasks import retry_ingestion_job

        retry_ingestion_job.delay(str(job.id))

        return Response({"detail": "재시도 작업이 등록되었습니다."})


class ProblemViewSet(viewsets.ModelViewSet):
    serializer_class = ProblemSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Problem.objects.filter(
            organization=user.organization, deleted_at__isnull=True
        ).select_related("reviewed_by", "source_document").prefetch_related("problemtag_set__tag")
        
        # 교사/학생은 공개 문항만
        if user.role not in {"admin", "operator"}:
            queryset = queryset.filter(is_public=True)
        
        # 검색 필터링
        subject_id = self.request.query_params.get("subject_id")
        if subject_id:
            queryset = queryset.filter(problemtag_set__tag__category="subject", problemtag_set__tag__id=subject_id).distinct()
        
        difficulty_min = self.request.query_params.get("difficulty_min")
        if difficulty_min:
            try:
                queryset = queryset.filter(difficulty__gte=int(difficulty_min))
            except ValueError:
                pass
        
        difficulty_max = self.request.query_params.get("difficulty_max")
        if difficulty_max:
            try:
                queryset = queryset.filter(difficulty__lte=int(difficulty_max))
            except ValueError:
                pass
        
        problem_type = self.request.query_params.get("problem_type")
        if problem_type:
            queryset = queryset.filter(problem_type=problem_type)
        
        keyword = self.request.query_params.get("keyword")
        if keyword:
            # text_content JSON 필드에서 키워드 검색
            queryset = queryset.filter(text_content__icontains=keyword)
        
        # 정렬
        ordering = self.request.query_params.get("ordering", "-created_at")
        if ordering:
            queryset = queryset.order_by(ordering)
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            if self.request.user.role not in {"admin", "operator"}:
                raise PermissionDenied("Insufficient permissions")
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        """삭제된 문항 복구"""
        problem = self.get_object()
        if not problem.deleted_at:
            return Response(
                {"detail": "삭제된 문항이 아닙니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        problem.deleted_at = None
        problem.save()

        # AuditLog 기록
        from .models import AuditLog

        AuditLog.objects.create(
            user=request.user,
            organization=request.user.organization,
            action_type="problem_restored",
            resource_type="problem",
            resource_id=problem.id,
            ip_address=self._get_client_ip(request),
        )

        return Response({"detail": "문항이 복구되었습니다."})

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0]
        return request.META.get("REMOTE_ADDR", "")


class ReviewTaskViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewTaskSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = ReviewTask.objects.filter(
            problem__organization=user.organization
        ).select_related("problem", "assigned_to")

        # 상태 필터링
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    def get_permissions(self):
        if self.request.user.role not in {"admin", "operator"}:
            raise PermissionDenied("Insufficient permissions")
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """문항 승인"""
        task = self.get_object()
        problem = task.problem

        # 문제 공개 처리
        problem.is_public = True
        problem.reviewed_at = timezone.now()
        problem.reviewed_by = request.user
        problem.save()

        # ReviewTask 완료
        task.status = "approved"
        task.reviewed_at = timezone.now()
        task.assigned_to = request.user
        task.save()

        # ReviewHistory 기록
        from .models import ReviewHistory

        ReviewHistory.objects.create(
            problem=problem,
            review_task=task,
            changed_field="status",
            old_value="pending",
            new_value="approved",
            changed_by=request.user,
        )

        # AuditLog 기록
        from .models import AuditLog

        AuditLog.objects.create(
            user=request.user,
            organization=request.user.organization,
            action_type="problem_approved",
            resource_type="problem",
            resource_id=problem.id,
            ip_address=self._get_client_ip(request),
        )

        return Response({"detail": "문항이 승인되었습니다."})

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """문항 반려"""
        task = self.get_object()
        problem = task.problem

        reason = request.data.get("reason", "")

        # ReviewTask 반려
        task.status = "rejected"
        task.reviewed_at = timezone.now()
        task.review_notes = reason
        task.assigned_to = request.user
        task.save()

        # ReviewHistory 기록
        from .models import ReviewHistory

        ReviewHistory.objects.create(
            problem=problem,
            review_task=task,
            changed_field="status",
            old_value="pending",
            new_value="rejected",
            changed_by=request.user,
        )

        # AuditLog 기록
        from .models import AuditLog

        AuditLog.objects.create(
            user=request.user,
            organization=request.user.organization,
            action_type="problem_rejected",
            resource_type="problem",
            resource_id=problem.id,
            details={"reason": reason},
            ip_address=self._get_client_ip(request),
        )

        return Response({"detail": "문항이 반려되었습니다."})

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0]
        return request.META.get("REMOTE_ADDR", "")

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """검수 통계"""
        from django.db.models import Count, Q
        from .models import ReviewTask

        user = request.user
        queryset = ReviewTask.objects.filter(problem__organization=user.organization)

        stats = {
            "total": queryset.count(),
            "pending": queryset.filter(status="pending").count(),
            "in_progress": queryset.filter(status="in_progress").count(),
            "approved": queryset.filter(status="approved").count(),
            "rejected": queryset.filter(status="rejected").count(),
        }

        return Response(stats)


class ExamPaperViewSet(viewsets.ModelViewSet):
    serializer_class = ExamPaperSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = ExamPaper.objects.filter(organization=user.organization, deleted_at__isnull=True).prefetch_related("exampaperitem_set__problem")
        
        # 학생은 배포된 시험지만
        if user.role == "student":
            queryset = queryset.filter(is_published=True)
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization, created_by=self.request.user)

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            if self.request.user.role == "student":
                raise PermissionDenied("Insufficient permissions")
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=["post"])
    def recommend(self, request):
        """문항 자동 추천"""
        from .models import Problem
        
        subject_id = request.data.get("subject_id")
        difficulty_min = request.data.get("difficulty_min", 1)
        difficulty_max = request.data.get("difficulty_max", 5)
        total_count = request.data.get("total_count", 10)
        
        queryset = Problem.objects.filter(
            organization=request.user.organization,
            is_public=True,
            deleted_at__isnull=True,
            difficulty__gte=difficulty_min,
            difficulty__lte=difficulty_max,
        )
        
        if subject_id:
            queryset = queryset.filter(problemtag_set__tag__category="subject", problemtag_set__tag__id=subject_id).distinct()
        
        # 랜덤 추천 (실제로는 더 정교한 알고리즘 필요)
        import random
        problems = list(queryset[:total_count * 2])
        recommended = random.sample(problems, min(total_count, len(problems)))
        
        serializer = ProblemSerializer(recommended, many=True)
        return Response({
            "results": serializer.data,
            "insufficient": len(recommended) < total_count,
        })

    @action(detail=True, methods=["get"])
    def preview(self, request, pk=None):
        """시험지 미리보기"""
        exam_paper = self.get_object()
        serializer = self.get_serializer(exam_paper)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def add_item(self, request, pk=None):
        """문항 추가"""
        from .models import ExamPaperItem
        
        exam_paper = self.get_object()
        problem_id = request.data.get("problem_id")
        order_number = request.data.get("order_number")
        points = request.data.get("points", 1)
        
        if not problem_id or order_number is None:
            return Response(
                {"detail": "problem_id와 order_number가 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # 중복 확인
        if ExamPaperItem.objects.filter(exam_paper=exam_paper, problem_id=problem_id).exists():
            return Response(
                {"detail": "이미 추가된 문항입니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        item = ExamPaperItem.objects.create(
            exam_paper=exam_paper,
            problem_id=problem_id,
            order_number=order_number,
            points=points,
        )
        
        # total_problems 업데이트
        exam_paper.total_problems = exam_paper.exampaperitem_set.count()
        exam_paper.save()
        
        from .serializers import ExamPaperItemSerializer
        serializer = ExamPaperItemSerializer(item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post", "delete"])
    def remove_item(self, request, pk=None):
        """문항 제거"""
        from .models import ExamPaperItem
        
        exam_paper = self.get_object()
        # DELETE와 POST 모두 지원 (DELETE는 body 파싱 문제로 POST도 허용)
        item_id = request.data.get("item_id")
        
        if not item_id:
            return Response(
                {"detail": "item_id가 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        try:
            item = ExamPaperItem.objects.get(exam_paper=exam_paper, id=item_id)
            item.delete()
            
            # total_problems 업데이트
            exam_paper.total_problems = exam_paper.exampaperitem_set.count()
            exam_paper.save()
            
            return Response({"detail": "문항이 제거되었습니다."})
        except ExamPaperItem.DoesNotExist:
            return Response(
                {"detail": "문항을 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(detail=True, methods=["post"])
    def generate_pdf(self, request, pk=None):
        """PDF 생성"""
        exam_paper = self.get_object()
        
        # PDF 생성 태스크 시작
        from .tasks import generate_exam_pdf_task
        generate_exam_pdf_task.delay(str(exam_paper.id))
        
        return Response({"detail": "PDF 생성이 시작되었습니다."})

    @action(detail=True, methods=["get"])
    def pdf(self, request, pk=None):
        """PDF 다운로드"""
        exam_paper = self.get_object()
        
        if not exam_paper.pdf_file:
            return Response(
                {"detail": "PDF가 아직 생성되지 않았습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        from django.http import FileResponse
        return FileResponse(exam_paper.pdf_file.open(), as_attachment=True, filename=f"{exam_paper.title}.pdf")


class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    queryset = Tag.objects.all()
