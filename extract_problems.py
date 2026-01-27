# -*- coding: utf-8 -*-
"""
국어 수능 문제집 PDF에서 각 문제(문항) 영역을 잘라 개별 이미지로 저장하는 스크립트.

OCR(EasyOCR)을 사용하여 문제 번호(1., 2., 13. 등)를 감지하고 문제 구간을 분할.
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import List, Optional, Tuple

import click
import cv2
import easyocr
import fitz  # PyMuPDF
import numpy as np


# --- 비율·상수 ---
HEADER_RATIO = 0.05
FOOTER_RATIO = 0.05
COLUMN_X_RATIO = 0.5
LINE_MARGIN = 3

# OCR Reader (lazy init)
_ocr_reader: Optional[easyocr.Reader] = None


def get_ocr_reader() -> easyocr.Reader:
    """OCR Reader를 lazy하게 초기화."""
    global _ocr_reader
    if _ocr_reader is None:
        click.echo("OCR 모델 로딩 중...")
        _ocr_reader = easyocr.Reader(['ko', 'en'], gpu=False, verbose=False)
    return _ocr_reader


def parse_range(range_str: str, max_page: int) -> List[int]:
    """
    페이지 범위 문자열을 파싱하여 페이지 번호 리스트 반환.
    
    예시:
    - "all" -> [1, 2, ..., max_page]
    - "1-10" -> [1, 2, ..., 10]
    - "5-5" -> [5]
    - "3" -> [3]
    """
    range_str = range_str.strip().lower()
    
    if range_str == "all":
        return list(range(1, max_page + 1))
    
    # "N-M" 형식
    match = re.match(r'^(\d+)-(\d+)$', range_str)
    if match:
        start, end = int(match.group(1)), int(match.group(2))
        start = max(1, min(start, max_page))
        end = max(1, min(end, max_page))
        if start > end:
            start, end = end, start
        return list(range(start, end + 1))
    
    # 단일 숫자 "N" 형식
    match = re.match(r'^(\d+)$', range_str)
    if match:
        page = int(match.group(1))
        page = max(1, min(page, max_page))
        return [page]
    
    raise click.BadParameter(f"잘못된 범위 형식: {range_str} (예: 'all', '1-10', '5')")


def find_header_footer_lines(gray: np.ndarray, debug: bool = False) -> Tuple[int, int]:
    """페이지 상·하단의 긴 가로선을 찾아 본문의 y 범위를 반환."""
    h, w = gray.shape
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    min_run_len = int(w * 0.6)
    line_rows: List[int] = []
    
    for r in range(h):
        row = binary[r, :]
        max_run = 0
        current_run = 0
        for px in row:
            if px == 255:
                current_run += 1
                max_run = max(max_run, current_run)
            else:
                current_run = 0
        if max_run >= min_run_len:
            line_rows.append(r)
    
    if debug:
        click.echo(f"[DEBUG] 이미지 크기: {w}x{h}, 가로선 행: {len(line_rows)}개")
    
    if len(line_rows) < 2:
        return (int(h * HEADER_RATIO), int(h * (1 - FOOTER_RATIO)))
    
    # 연속된 가로선 행들을 그룹으로 묶기
    groups: List[Tuple[int, int]] = []
    start = line_rows[0]
    end = line_rows[0]
    for r in line_rows[1:]:
        if r - end <= 5:
            end = r
        else:
            groups.append((start, end))
            start = r
            end = r
    groups.append((start, end))
    
    if not groups:
        return (int(h * HEADER_RATIO), int(h * (1 - FOOTER_RATIO)))
    
    top_zone = int(h * 0.20)
    bot_zone = int(h * 0.85)
    
    top_groups = [(s, e) for (s, e) in groups if e < top_zone]
    bot_groups = [(s, e) for (s, e) in groups if s > bot_zone]
    
    y_header = max(top_groups, key=lambda g: g[1])[1] if top_groups else int(h * HEADER_RATIO)
    y_footer = min(bot_groups, key=lambda g: g[0])[0] if bot_groups else int(h * (1 - FOOTER_RATIO))
    
    if debug:
        click.echo(f"[DEBUG] y_header: {y_header}, y_footer: {y_footer}")
    
    if y_footer <= y_header:
        return (int(h * HEADER_RATIO), int(h * (1 - FOOTER_RATIO)))
    
    return (y_header, y_footer)


def find_column_divider(gray_body: np.ndarray) -> int:
    """본문에서 단 구분 세로선의 x 위치를 반환."""
    h, w = gray_body.shape
    edges = cv2.Canny(gray_body, 50, 150)
    min_len = int(h * 0.3)
    lines = cv2.HoughLinesP(
        edges, 1, np.pi / 180, threshold=50,
        minLineLength=min_len, maxLineGap=10,
    )
    if lines is None:
        return int(w * COLUMN_X_RATIO)

    target_x = w * COLUMN_X_RATIO
    vert = []
    for L in lines.reshape(-1, 4):
        x1, y1, x2, y2 = L
        dx, dy = x2 - x1, y2 - y1
        if abs(dy) < 1e-6:
            continue
        if abs(dx) / (abs(dy) + 1e-6) < 0.1 and abs(dy) > 0.3 * h:
            x = (x1 + x2) / 2
            if 0.2 * w <= x <= 0.8 * w:
                vert.append((x, abs(dy)))

    if not vert:
        return int(w * COLUMN_X_RATIO)
    best = min(vert, key=lambda v: abs(v[0] - target_x))
    return int(best[0])


def find_problem_numbers_with_ocr(
    img: np.ndarray,
    x_left: int,
    x_right: int,
    y_body_top: int,
    y_body_bottom: int,
    debug: bool = False,
) -> List[Tuple[int, int, str]]:
    """
    OCR을 사용하여 문제 번호(1., 2., 13. 등)를 감지.
    
    반환: [(y_top, y_bottom, 번호텍스트), ...] - img 전체 좌표 기준
    """
    reader = get_ocr_reader()
    
    # 열 영역만 추출 (본문 영역 내에서만)
    col_img = img[y_body_top:y_body_bottom, x_left:x_right]
    if col_img.size == 0:
        return []
    
    col_height, col_width = col_img.shape[:2]
    
    # OCR 실행
    results = reader.readtext(col_img, detail=1)
    
    # 문제 번호 패턴:
    # 1) "숫자." 또는 "숫자" 만 있는 경우
    # 2) "숫자. 문장..." 으로 시작하는 경우
    problem_pattern_exact = re.compile(r'^(\d{1,2})\.?\s*$')
    problem_pattern_start = re.compile(r'^(\d{1,2})\.\s+\S')
    
    problem_numbers: List[Tuple[int, int, str]] = []
    
    for (bbox, text, conf) in results:
        # bbox: [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
        text = text.strip()
        
        # 패턴 매칭: 정확한 매칭 또는 시작 부분 매칭
        match = problem_pattern_exact.match(text)
        if not match:
            match = problem_pattern_start.match(text)
        
        if match and conf > 0.1:  # confidence threshold 낮춤
            num = int(match.group(1))
            if 1 <= num <= 99:
                # bbox에서 좌표 추출
                ys = [pt[1] for pt in bbox]
                xs = [pt[0] for pt in bbox]
                
                y_top_local = int(min(ys))
                y_bottom_local = int(max(ys))
                x_min = int(min(xs))
                
                # 전체 이미지 좌표로 변환
                y_top = y_top_local + y_body_top
                y_bottom = y_bottom_local + y_body_top
                
                # 페이지 하단(푸터 근처)은 제외 - 페이지 번호 오인식 방지
                if y_bottom_local > col_height * 0.95:
                    if debug:
                        click.echo(f"[DEBUG] 하단 제외: '{text}' at y={y_top}")
                    continue
                
                # 열의 왼쪽 25% 이내에서 시작하는 것만 문제 번호로 인정
                if x_min < col_width * 0.25:
                    problem_numbers.append((y_top, y_bottom, text))
                    if debug:
                        click.echo(f"[DEBUG] 문제 번호 감지: '{text}' at y={y_top}~{y_bottom}, x={x_min}")
    
    # y 위치로 정렬
    problem_numbers.sort(key=lambda p: p[0])
    return problem_numbers


def split_problems_in_column_with_ocr(
    img: np.ndarray,
    gray_body: np.ndarray,
    x_left: int,
    x_right: int,
    y_body_top: int,
    y_body_bottom: int,
    debug: bool = False,
) -> List[Tuple[int, int, int, int]]:
    """
    OCR로 문제 번호를 감지하여 열 내 문제 구간을 분할.
    
    반환: [(x_left, x_right, y_top, y_bottom), ...] - body 좌표 기준
    """
    col_h = gray_body.shape[0]
    
    # OCR로 문제 번호 찾기
    problem_numbers = find_problem_numbers_with_ocr(
        img, x_left, x_right, y_body_top, y_body_bottom, debug=debug
    )
    
    if not problem_numbers:
        if debug:
            click.echo(f"[DEBUG] 문제 번호를 찾지 못함, 전체를 하나의 블록으로")
        return [(x_left, x_right, 0, col_h)]
    
    # 문제 구간 생성
    blocks: List[Tuple[int, int, int, int]] = []
    
    for i, (y_top, y_bottom, text) in enumerate(problem_numbers):
        # 현재 문제의 시작: 문제 번호 위치
        start_y = y_top - y_body_top
        
        # 다음 문제의 시작 또는 열 끝
        if i + 1 < len(problem_numbers):
            end_y = problem_numbers[i + 1][0] - y_body_top
        else:
            end_y = col_h
        
        # 유효성 검사
        start_y = max(0, start_y)
        end_y = min(col_h, end_y)
        
        if end_y - start_y >= 20:  # 최소 20px 이상
            blocks.append((x_left, x_right, start_y, end_y))
    
    return blocks if blocks else [(x_left, x_right, 0, col_h)]


def pdf_page_to_image(page: fitz.Page, dpi: int = 150) -> np.ndarray:
    """PDF 페이지를 OpenCV BGR 이미지로 변환."""
    zoom = dpi / 72.0
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat)
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
    return cv2.cvtColor(img, cv2.COLOR_RGB2BGR)


def process_page_image(
    img: np.ndarray,
    page_out_dir: Path,
    debug: bool = False,
) -> int:
    """한 페이지 이미지에서 문제들을 추출하여 저장."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h_full, w_full = img.shape[:2]

    # 1) 헤더·푸터 제거
    y_header_line, y_footer_line = find_header_footer_lines(gray, debug=debug)
    y_body_top = y_header_line + LINE_MARGIN
    y_body_bottom = y_footer_line
    gray_body = gray[y_body_top:y_body_bottom, :]
    body_h, body_w = gray_body.shape[:2]

    # 2) 열 분할
    x_div = find_column_divider(gray_body)
    x_left_start = LINE_MARGIN
    x_left_end = max(x_left_start, x_div - LINE_MARGIN)
    x_right_start = min(body_w - LINE_MARGIN, x_div + LINE_MARGIN)
    x_right_end = body_w - LINE_MARGIN

    # 3) OCR로 문제 구간 분할
    left_blocks = split_problems_in_column_with_ocr(
        img, gray_body, x_left_start, x_left_end, y_body_top, y_body_bottom, debug=debug
    )
    right_blocks = split_problems_in_column_with_ocr(
        img, gray_body, x_right_start, x_right_end, y_body_top, y_body_bottom, debug=debug
    )
    all_blocks: List[Tuple[int, int, int, int]] = left_blocks + right_blocks

    # 4) 출력 디렉터리 생성
    page_out_dir.mkdir(parents=True, exist_ok=True)

    # 5) crop 및 저장
    for idx, (x0, x1, y0, y1) in enumerate(all_blocks, start=1):
        crop = img[y_body_top + y0 : y_body_top + y1, x0:x1]
        if crop.size == 0:
            continue
        out_path = page_out_dir / f"{idx}.png"
        cv2.imwrite(str(out_path), crop)

    # 6) 디버그 이미지
    if debug:
        dbg = img.copy()
        cv2.line(dbg, (0, y_header_line), (w_full, y_header_line), (0, 255, 0), 2)
        cv2.line(dbg, (0, y_footer_line), (w_full, y_footer_line), (0, 255, 0), 2)
        cv2.line(dbg, (x_div, y_header_line), (x_div, y_footer_line), (255, 0, 0), 2)
        for (x0, x1, y0, y1) in all_blocks:
            ya, yb = y_body_top + y0, y_body_top + y1
            x2 = min(x1 - 1, w_full - 1)
            y2 = min(yb - 1, h_full - 1)
            if x2 >= x0 and y2 >= ya:
                cv2.rectangle(dbg, (x0, ya), (x2, y2), (0, 0, 255), 2)
        cv2.imwrite(str(page_out_dir / "debug.png"), dbg)

    return len(all_blocks)


@click.command()
@click.argument('input_file', type=click.Path(exists=True, path_type=Path))
@click.option('-o', '--output', type=click.Path(path_type=Path), default=None,
              help='출력 디렉터리 (기본: output/)')
@click.option('--range', 'page_range', default='all',
              help="페이지 범위 (예: 'all', '1-10', '5')")
@click.option('--debug', is_flag=True, help='디버그 이미지 저장')
@click.option('--dpi', default=150, help='PDF → 이미지 변환 해상도 (기본: 150)')
def main(input_file: Path, output: Optional[Path], page_range: str, debug: bool, dpi: int):
    """
    국어 수능 문제집 PDF에서 각 문제 영역을 잘라 개별 이미지로 저장합니다.
    
    OCR을 사용하여 문제 번호(1., 2., 13. 등)를 감지합니다.
    
    \b
    예시:
      python extract_problems.py input.pdf -o output/
      python extract_problems.py input.pdf --range 1-5 --debug
      python extract_problems.py input.pdf --range 3
    """
    if not input_file.is_file():
        raise click.ClickException(f"파일을 찾을 수 없습니다: {input_file}")

    # 출력 디렉터리
    out_dir = output if output else Path("output")

    # PDF 열기
    try:
        doc = fitz.open(str(input_file))
    except Exception as e:
        raise click.ClickException(f"PDF를 열 수 없습니다: {input_file}\n{e}")

    page_count = len(doc)
    click.echo(f"PDF: {input_file} ({page_count}페이지)")

    # 페이지 범위 파싱
    try:
        pages = parse_range(page_range, page_count)
    except click.BadParameter as e:
        doc.close()
        raise click.ClickException(str(e))
    
    click.echo(f"처리할 페이지: {pages[0]}~{pages[-1]} ({len(pages)}페이지)")

    total_problems = 0

    for page_num in pages:
        page = doc[page_num - 1]  # 0-indexed
        img = pdf_page_to_image(page, dpi=dpi)
        
        page_out_dir = out_dir / f"page{page_num}"
        
        if debug:
            click.echo(f"\n=== 페이지 {page_num} ===")
        
        count = process_page_image(img, page_out_dir, debug=debug)
        total_problems += count
        click.echo(f"페이지 {page_num}: {count}개 문제 추출 → {page_out_dir}")

    doc.close()
    click.echo(f"\n총 {total_problems}개 문제 추출 완료 → {out_dir}")


if __name__ == "__main__":
    main()
