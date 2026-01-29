"""
자동 태깅 로직 (Mock + Real LLM 옵션)
"""

import os
from typing import Dict, List, Optional
from .models import Problem, Tag, ProblemTag, ProblemChapter, Chapter, TagCategory


def mock_tag_problem(problem: Problem) -> Dict:
    """Mock 태깅: 기본 규칙 기반"""
    tags = []

    # 난이도 태그 (랜덤)
    import random

    difficulty_tag, _ = Tag.objects.get_or_create(
        name=str(random.randint(1, 5)),
        defaults={
            "category": TagCategory.DIFFICULTY,
            "display_order": random.randint(1, 5),
        },
    )
    tags.append({"tag": difficulty_tag, "confidence": 0.7})

    # 유형 태그
    type_tag, _ = Tag.objects.get_or_create(
        name="객관식", defaults={"category": TagCategory.TYPE, "display_order": 1}
    )
    tags.append({"tag": type_tag, "confidence": 0.8})

    return {"tags": tags, "chapters": []}


def real_llm_tag_problem(problem: Problem) -> Dict:
    """Real LLM 태깅: OpenAI/Claude API 호출"""
    # TODO: 실제 LLM API 통합
    # 현재는 mock 반환
    return mock_tag_problem(problem)


def auto_tag_problem(problem_id: str, use_real_llm: bool = False):
    """문항 자동 태깅"""
    from .models import Problem

    problem = Problem.objects.get(id=problem_id)

    if use_real_llm:
        result = real_llm_tag_problem(problem)
    else:
        result = mock_tag_problem(problem)

    # 태그 적용
    for item in result["tags"]:
        ProblemTag.objects.update_or_create(
            problem=problem,
            tag=item["tag"],
            defaults={"confidence": item.get("confidence", 0.5)},
        )

    # 단원 연결 (나중에 구현)
    # for chapter_id in result.get("chapters", []):
    #     ProblemChapter.objects.get_or_create(problem=problem, chapter_id=chapter_id)

    return result
