"""
초기 데이터 시드 명령어

사용법:
    python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from core.models import Subject, Chapter, Tag, TagCategory


class Command(BaseCommand):
    help = "초기 데이터(Subject, Chapter, Tag)를 생성합니다."

    def handle(self, *args, **options):
        self.stdout.write("초기 데이터 생성 시작...")

        # 과목 생성
        subjects_data = [
            {"name": "국어", "code": "KOR", "display_order": 1},
            {"name": "수학", "code": "MATH", "display_order": 2},
            {"name": "영어", "code": "ENG", "display_order": 3},
            {"name": "과학", "code": "SCI", "display_order": 4},
            {"name": "사회", "code": "SOC", "display_order": 5},
        ]

        for data in subjects_data:
            subject, created = Subject.objects.get_or_create(
                code=data["code"], defaults=data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"✓ 과목 생성: {subject.name}"))
            else:
                self.stdout.write(f"  과목 이미 존재: {subject.name}")

        # 단원 생성 (국어 예시)
        kor_subject = Subject.objects.get(code="KOR")
        chapters_data = [
            {"subject": kor_subject, "name": "문학", "display_order": 1},
            {"subject": kor_subject, "name": "독서", "display_order": 2},
            {"subject": kor_subject, "name": "문법", "display_order": 3},
            {"subject": kor_subject, "name": "화법과 작문", "display_order": 4},
        ]

        for data in chapters_data:
            chapter, created = Chapter.objects.get_or_create(
                subject=data["subject"], name=data["name"], defaults=data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f"✓ 단원 생성: {data['subject'].name} - {chapter.name}")
                )

        # 태그 생성
        tags_data = [
            # 유형 태그
            {"name": "객관식", "category": TagCategory.TYPE, "display_order": 1},
            {"name": "서술형", "category": TagCategory.TYPE, "display_order": 2},
            {"name": "논술형", "category": TagCategory.TYPE, "display_order": 3},
            {"name": "지문형", "category": TagCategory.TYPE, "display_order": 4},
            # 난이도 태그
            {"name": "1", "category": TagCategory.DIFFICULTY, "display_order": 1},
            {"name": "2", "category": TagCategory.DIFFICULTY, "display_order": 2},
            {"name": "3", "category": TagCategory.DIFFICULTY, "display_order": 3},
            {"name": "4", "category": TagCategory.DIFFICULTY, "display_order": 4},
            {"name": "5", "category": TagCategory.DIFFICULTY, "display_order": 5},
        ]

        for data in tags_data:
            tag, created = Tag.objects.get_or_create(
                name=data["name"], defaults=data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f"✓ 태그 생성: {tag.name} ({tag.category})")
                )

        self.stdout.write(self.style.SUCCESS("\n초기 데이터 생성 완료!"))
