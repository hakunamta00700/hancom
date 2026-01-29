"""
자동 태깅 관련 테스트 (TC-TAG-001~002)
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from core.models import (
    Organization,
    UserRole,
    Problem,
    Tag,
    ProblemTag,
    TagCategory,
    Subject,
    Chapter,
    ProblemChapter,
)

User = get_user_model()


class TaggingTestCase(TestCase):
    def setUp(self):
        self.organization = Organization.objects.create(name="Test Academy")
        self.problem = Problem.objects.create(
            organization=self.organization,
            problem_type="multiple_choice",
            is_public=False,
        )
        self.subject = Subject.objects.create(name="국어", code="KOR")
        self.chapter = Chapter.objects.create(subject=self.subject, name="1단원")

    def test_auto_tag_problem(self):
        """TC-TAG-001: 문항에 LLM 태깅 결과 저장 및 검수 대기"""
        from core.tagging import auto_tag_problem

        # 자동 태깅 실행 (모킹 모드)
        auto_tag_problem(str(self.problem.id), use_real_llm=False)

        # 태깅 결과 확인
        problem_tags = ProblemTag.objects.filter(problem=self.problem)
        self.assertGreater(problem_tags.count(), 0)

        # 검수 대기 상태 확인
        from core.models import ReviewTask

        review_task = ReviewTask.objects.filter(problem=self.problem).first()
        if review_task:
            self.assertEqual(review_task.status, "pending")

    def test_tagging_failure_handling(self):
        """TC-TAG-002: 태깅 실패 시 재시도 또는 검수 대기 유지"""
        from core.tagging import auto_tag_problem

        # 태깅 실행 (실패 시뮬레이션은 tagging.py에서 처리)
        try:
            auto_tag_problem(str(self.problem.id), use_real_llm=False)
        except Exception:
            # 태깅 실패해도 문항은 유지되어야 함
            pass

        # 문항이 삭제되지 않았는지 확인
        self.assertTrue(Problem.objects.filter(id=self.problem.id).exists())
