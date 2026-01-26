# -*- coding: utf-8 -*-
"""
음운 학습 활동지를 한글(HWP)로 자동 생성하는 스크립트.

[구조 - 이미지 기준]
1. 문제 문장 (본문), ⓐ는 네모 박스
2. 1행 2열 외곽 표: 왼쪽=(ㄱ), 오른쪽=(ㄴ) 수평 배치
   - (ㄱ): 제목 + ○ 불릿 3줄 (각 항목 뒤 줄바꿈)
   - (ㄴ): 제목 + 빈 줄 2개 + 3행 2열 중첩표 (1행 2셀 병합 → "눈", 2·3행 내용)
3. 표 밖: "(ㄱ)과 (ㄴ)을 함께 고려할 때 ⓐ 는 사실을 알 수 있다." (ⓐ 네모) + ①~⑤
   - 각 선택지 뒤 줄바꿈, ⑤ 뒤 빈 줄 2개
"""
import win32com.client as win32

hwp = win32.gencache.EnsureDispatch("HWPFrame.HwpObject")
hwp.XHwpWindows.Item(0).Visible = True
hwp.HAction.Run("FileNew")


def insert_text(txt: str) -> None:
    hwp.HAction.GetDefault("InsertText", hwp.HParameterSet.HInsertText.HSet)
    hwp.HParameterSet.HInsertText.Text = txt
    hwp.HAction.Execute("InsertText", hwp.HParameterSet.HInsertText.HSet)


def create_table(
    rows: int,
    cols: int,
    width_mm: float = 160,
    height_mm: float | None = None,
    treat_as_char: int = 0,
) -> None:
    hwp.HAction.GetDefault("TableCreate", hwp.HParameterSet.HTableCreation.HSet)
    hwp.HParameterSet.HTableCreation.Rows = rows
    hwp.HParameterSet.HTableCreation.Cols = cols
    hwp.HParameterSet.HTableCreation.WidthType = 2
    hwp.HParameterSet.HTableCreation.WidthValue = hwp.MiliToHwpUnit(float(width_mm))
    hwp.HParameterSet.HTableCreation.TableProperties.Width = hwp.MiliToHwpUnit(
        float(width_mm)
    )
    hwp.HParameterSet.HTableCreation.CreateItemArray("ColWidth", cols)
    for i in range(cols):
        hwp.HParameterSet.HTableCreation.ColWidth.SetItem(
            i, hwp.MiliToHwpUnit(width_mm / cols)
        )
    if height_mm is not None:
        hwp.HParameterSet.HTableCreation.HeightType = 1
        hwp.HParameterSet.HTableCreation.HeightValue = hwp.MiliToHwpUnit(
            float(height_mm)
        )
        hwp.HParameterSet.HTableCreation.CreateItemArray("RowHeight", rows)
        for i in range(rows):
            hwp.HParameterSet.HTableCreation.RowHeight.SetItem(
                i, hwp.MiliToHwpUnit(height_mm / rows)
            )
    if treat_as_char:
        hwp.HParameterSet.HTableCreation.TableProperties.TreatAsChar = 1
    hwp.HAction.Execute("TableCreate", hwp.HParameterSet.HTableCreation.HSet)


def insert_box_char(char: str) -> None:
    """ⓐ 등 한 글자를 네모 박스(1×1 표)로 삽입. 글자처럼 인라인 배치."""
    create_table(1, 1, width_mm=5, height_mm=5, treat_as_char=1)
    insert_text(char)
    hwp.HAction.Run("CloseEx")


def table_right_cell() -> None:
    hwp.HAction.Run("TableRightCell")


def table_lower_cell() -> None:
    hwp.HAction.Run("TableLowerCell")


def table_left_cell() -> None:
    hwp.HAction.Run("TableLeftCell")


def merge_cells_to_right() -> None:
    """현재 셀과 오른쪽 셀을 블록으로 선택 후 합치기."""
    hwp.HAction.Run("TableCellBlock")   # 셀 블록(현재 셀 선택)
    hwp.HAction.Run("MoveSelRight")     # 블록을 오른쪽 셀까지 확장
    hwp.HAction.Run("TableMergeCell")  # 셀 합치기


def align_center() -> None:
    hwp.HAction.Run("ParagraphShapeAlignCenter")


# --- 1. 문제 문장 (ⓐ는 네모 박스, 뒤에 빈 줄 2개) ---
insert_text("1. 다음은 '음운'에 대한 학습 활동지 중 일부이다. ")
insert_box_char("ⓐ")
insert_text("에 들어갈 내용으로 적절한 것은?(50%)\n\n")

# --- 2. 외곽 표: 1행 2열 (왼쪽=ㄱ, 오른쪽=ㄴ) ---
create_table(1, 2, width_mm=170)

# --- (ㄱ) 왼쪽 셀: 제목 2줄(바꾸어/만들어 보자), 첫 ○는 "만들어 보자."와 같은 줄 ---
insert_text("(ㄱ) '발'의 초성, 중성, 종성을 다른 음운으로 바꾸어\n")
insert_text("여러 단어를 만들어 보자.○ 초성을 바꾼 경우 (달, 살)\n")
insert_text("○ 중성을 바꾼 경우 (볼, 불)\n")
insert_text("○ 종성을 바꾼 경우 (밥, 방)\n")

# --- (ㄴ) 오른쪽 셀로 이동 ---
table_right_cell()

# --- (ㄴ) 제목 ---
insert_text(
    "(ㄴ) 다음 단어를 길게 발음할 때와 짧게 발음할 때의 차이를 이용해 문장을 만들어 보자.\n\n"
)

# --- (ㄴ) 안쪽 3행 2열 표 (외곽 오른쪽 열 폭에 맞춤) ---
create_table(3, 2, width_mm=85)

# 1행: 두 셀 병합 후 "눈" 가운데 정렬
merge_cells_to_right()
insert_text("눈")
align_center()

# 2행: 길게 발음 / 짧게 발음
table_lower_cell()
insert_text("길게 발음할 때")
table_right_cell()
insert_text("짧게 발음할 때")

# 3행: 눈이 펑펑 / 아이 눈이 (아래→왼쪽 순서)
table_lower_cell()   # (2,1)
insert_text("아이 눈이 초롱초롱하다.")
table_left_cell()    # (2,0)
insert_text("눈이 펑펑 내린다.")

# --- 표 밖으로 (중첩표 → 외곽 셀 → 본문) ---
hwp.HAction.Run("CloseEx")
hwp.HAction.Run("CloseEx")

# --- 3. 본문: 빈칸 문장(ⓐ 네모) + 객관식 (각 뒤 줄바꿈, ⑤ 뒤 빈 줄 2개) ---
insert_text("\n(ㄱ)과 (ㄴ)을 함께 고려할 때 ")
insert_box_char("ⓐ")
insert_text(" 는 사실을 알 수 있다.\n")
insert_text("① 음운은 문자로 표기할 수 있다.\n")
insert_text("② 음운은 단어의 뜻을 구별해 준다.\n")
insert_text("③ 음운은 일정한 조건에서 변화한다.\n")
insert_text("④ 음운은 어떤 위치든 나타날 수 있다.\n")
insert_text("⑤ 음운은 감정의 차이를 표현할 수 있다.\n\n")

# --- 4. 문서 맨 아래 고립된 ⓐ 박스 (원본 레이아웃) ---
insert_box_char("ⓐ")

# --- 저장 ---
hwp.HAction.GetDefault("FileSaveAs", hwp.HParameterSet.HFileSaveAs.HSet)
hwp.HParameterSet.HFileSaveAs.HSet.SetItem(
    "FileName", "음운_문제_자동생성_폭조정.hwp"
)
hwp.HAction.Execute("FileSaveAs", hwp.HParameterSet.HFileSaveAs.HSet)
