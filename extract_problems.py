# -*- coding: utf-8 -*-
"""
국어 수능 문제집 페이지 이미지에서 각 문제(문항) 영역을 잘라 개별 이미지로 저장하는 스크립트.

docs/structure.md의 7단계 알고리즘을 따름:
  1) 가로선으로 헤더/푸터 제거 → 본문
  2) 세로선으로 좌/우 열 분할
  3) 세로 간격(주) + contour(보조)로 문제 구간 분할
  4) crop하여 problem_001.png, ... 저장

OpenCV, NumPy, Pillow, scikit-image만 사용. OCR·LLM·텍스트 인식은 사용하지 않음.
"""
from __future__ import annotations

import argparse
from pathlib import Path
from typing import List, Tuple

import cv2
import numpy as np


# --- 비율·상수 (structure.md §6) ---
HEADER_RATIO = 0.05   # 헤더 높이 ~5%
FOOTER_RATIO = 0.05   # 푸터 높이 ~5%
COLUMN_X_RATIO = 0.5  # 단 구분선 x ≈ 50%
MIN_GAP_RATIO = 0.025 # 문제 사이 "큰 간격" 최소: 본문 높이의 2.5%
WHITE_ROW_RATIO = 0.02  # profile < (col_width * 255 * this) 이면 흰 행
LINE_MARGIN = 3       # 가로선/세로선 제외 시 여백 (px)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="국어 수능 문제집 페이지 이미지에서 각 문제 영역을 잘라 개별 이미지로 저장합니다."
    )
    parser.add_argument(
        "input",
        type=Path,
        help="입력 이미지 경로",
    )
    parser.add_argument(
        "-o", "--output",
        type=Path,
        default=None,
        help="출력 디렉터리 (기본: output/<이미지기본이름>/)",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="가로선/세로선/열·문제 박스를 그린 디버그 이미지 저장",
    )
    return parser.parse_args()


def find_header_footer_lines(gray: np.ndarray, debug: bool = False) -> Tuple[int, int]:
    """
    페이지 상·하단의 긴 가로선을 찾아 본문의 y 범위를 반환.
    반환: (y_body_top, y_body_bottom) — body = gray[y_body_top:y_body_bottom, :]
    
    방법: 각 행에서 연속된 검은 픽셀(run)의 최대 길이를 구해,
    페이지 폭의 80% 이상인 행을 "긴 가로선"으로 판단.
    """
    h, w = gray.shape
    
    # 1) 이진화 (검은 픽셀 = 255)
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    # 2) 각 행에서 "연속된 검은 픽셀(run)" 최대 길이 계산
    #    폭의 60% 이상 연속된 검은 run이 있으면 "가로선 행"
    min_run_len = int(w * 0.6)
    line_rows: List[int] = []
    
    for r in range(h):
        row = binary[r, :]
        # run-length 계산: 연속된 255(검은)의 최대 길이
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
        print(f"[DEBUG] 이미지 크기: {w}x{h}, min_run_len: {min_run_len}")
        print(f"[DEBUG] 가로선 행 개수: {len(line_rows)}")
        if line_rows:
            print(f"[DEBUG] 가로선 행 y 범위: {min(line_rows)} ~ {max(line_rows)}")
    
    if len(line_rows) < 2:
        return (int(h * HEADER_RATIO), int(h * (1 - FOOTER_RATIO)))
    
    # 3) 연속된 가로선 행들을 그룹으로 묶기 (5px 이내 연속)
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
    
    if debug:
        print(f"[DEBUG] 가로선 그룹: {groups}")
    
    # 그룹이 없으면 비율 폴백
    if len(groups) == 0:
        return (int(h * HEADER_RATIO), int(h * (1 - FOOTER_RATIO)))
    
    # 4) 상단 15% 영역 그룹 = 헤더 후보, 하단 15% 영역 그룹 = 푸터 후보
    top_zone = int(h * 0.15)
    bot_zone = int(h * 0.85)
    
    top_groups = [(s, e) for (s, e) in groups if e < top_zone]
    bot_groups = [(s, e) for (s, e) in groups if s > bot_zone]
    
    if debug:
        print(f"[DEBUG] top_zone: {top_zone}, bot_zone: {bot_zone}")
        print(f"[DEBUG] top_groups: {top_groups}, bot_groups: {bot_groups}")
    
    # 상단 가로선: 있으면 사용, 없으면 비율 폴백
    if top_groups:
        header_group = max(top_groups, key=lambda g: g[1])
        y_header = header_group[1]
    else:
        y_header = int(h * HEADER_RATIO)
    
    # 하단 가로선: 있으면 사용, 없으면 비율 폴백
    if bot_groups:
        footer_group = min(bot_groups, key=lambda g: g[0])
        y_footer = footer_group[0]
    else:
        y_footer = int(h * (1 - FOOTER_RATIO))
    
    if debug:
        print(f"[DEBUG] y_header: {y_header}, y_footer: {y_footer}")
    
    if y_footer <= y_header:
        return (int(h * HEADER_RATIO), int(h * (1 - FOOTER_RATIO)))
    
    return (y_header, y_footer)


def find_column_divider(gray_body: np.ndarray) -> int:
    """
    본문에서 단 구분 세로선의 x 위치를 반환.
    실패 시 폭의 50% (COLUMN_X_RATIO) 폴백.
    """
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
    # 수직선: |Δx| 작고 |Δy| 큼
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
    # 50%에 가장 가까운 세로선
    best = min(vert, key=lambda v: abs(v[0] - target_x))
    return int(best[0])


def _find_blocks_by_gaps(
    profile: np.ndarray,
    col_h: int,
    col_w: int,
    min_gap: int,
    thresh: float,
) -> List[Tuple[int, int]]:
    """세로 투영에서 흰 band(간격)를 찾아, 그 사이를 블록 (y_top, y_bottom) 리스트로 반환."""
    white = (profile < thresh).astype(np.uint8)
    # runs of white
    runs: List[Tuple[int, int]] = []
    i = 0
    while i < col_h:
        if white[i]:
            start = i
            while i < col_h and white[i]:
                i += 1
            end = i
            if end - start >= min_gap:
                runs.append((start, end))
        else:
            i += 1

    runs = sorted(runs, key=lambda r: r[0])
    blocks: List[Tuple[int, int]] = []
    y_prev = 0
    for (s, e) in runs:
        if s > y_prev:
            blocks.append((y_prev, s))
        y_prev = e
    if y_prev < col_h:
        blocks.append((y_prev, col_h))
    return blocks


def _extend_blocks_with_contours(
    blocks: List[Tuple[int, int]],
    contours: List[Tuple[int, int, int, int]],
) -> None:
    """contour bbox (x,y,w,h)의 y_max로 해당 블록의 y_bottom 확장. in-place."""
    for (bx, by, bw, bh) in contours:
        cy_center = by + bh / 2
        cy_max = by + bh
        for i, (yt, yb) in enumerate(blocks):
            if yt <= cy_center <= yb and cy_max > yb:
                blocks[i] = (yt, int(cy_max))
                break


def split_problems_in_column(
    gray_body: np.ndarray,
    x_left: int,
    x_right: int,
) -> List[Tuple[int, int, int, int]]:
    """
    한 열 [x_left, x_right) 안에서 문제 구간을 나눔.
    반환: [(x_left, x_right, y_top, y_bottom), ...] (body 좌표, y는 body 내)
    """
    col = gray_body[:, x_left:x_right]
    if col.size == 0:
        return []
    col_h, col_w = col.shape

    _, binary = cv2.threshold(col, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    profile = np.sum(binary, axis=1)
    thresh = (col_w * 255) * WHITE_ROW_RATIO
    min_gap = max(2, int(col_h * MIN_GAP_RATIO))

    blocks = _find_blocks_by_gaps(profile, col_h, col_w, min_gap, thresh)
    if not blocks:
        return [(x_left, x_right, 0, col_h)]

    # contour로 y_max 확장: 사각형에 가까운 큰 contour만
    cnts, _ = cv2.findContours(
        binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE,
    )
    boxes: List[Tuple[int, int, int, int]] = []
    col_area = col_h * col_w
    for c in cnts:
        x, y, w, h = cv2.boundingRect(c)
        if w < 3 or h < 3:
            continue
        area = w * h
        if area < 0.005 * col_area or area > 0.6 * col_area:
            continue
        asp = w / (h + 1e-6)
        if 0.2 <= asp <= 5:
            boxes.append((x, y, w, h))

    _extend_blocks_with_contours(blocks, boxes)

    out: List[Tuple[int, int, int, int]] = []
    for (yt, yb) in blocks:
        if yb - yt < 5:
            continue
        out.append((x_left, x_right, yt, yb))
    return out if out else [(x_left, x_right, 0, col_h)]


def main() -> None:
    args = parse_args()
    inp = args.input
    if not inp.is_file():
        raise SystemExit(f"파일을 찾을 수 없습니다: {inp}")

    img = cv2.imread(str(inp))
    if img is None:
        raise SystemExit(f"이미지를 읽을 수 없습니다: {inp}")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h_full, w_full = img.shape[:2]

    # 1) 헤더·푸터 제거 (가로선 위치 검출)
    y_header_line, y_footer_line = find_header_footer_lines(gray, debug=args.debug)
    # 가로선 바로 아래부터 본문 시작 (가로선 제외)
    y_body_top = y_header_line + LINE_MARGIN
    y_body_bottom = y_footer_line
    body = img[y_body_top:y_body_bottom, :]
    gray_body = gray[y_body_top:y_body_bottom, :]
    body_h, body_w = body.shape[:2]

    # 2) 열 분할 (세로선 위치 검출)
    x_div = find_column_divider(gray_body)
    # 좌열: 왼쪽 가장자리 ~ 세로선 왼쪽, 우열: 세로선 오른쪽 ~ 오른쪽 가장자리
    # 페이지 양쪽 끝과 중앙 세로선 모두 제외
    x_left_start = LINE_MARGIN
    x_left_end = max(x_left_start, x_div - LINE_MARGIN)
    x_right_start = min(body_w - LINE_MARGIN, x_div + LINE_MARGIN)
    x_right_end = body_w - LINE_MARGIN

    # 3) 문제 구간 (가장자리 및 세로선 제외한 영역에서)
    left_blocks = split_problems_in_column(gray_body, x_left_start, x_left_end)
    right_blocks = split_problems_in_column(gray_body, x_right_start, x_right_end)
    all_blocks: List[Tuple[int, int, int, int]] = left_blocks + right_blocks

    # 4) 출력 디렉터리
    out_dir = args.output
    if out_dir is None:
        out_dir = Path("output") / inp.stem
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # 5) crop 및 저장 (body 좌표 → 원본 y는 +y_body_top)
    for idx, (x0, x1, y0, y1) in enumerate(all_blocks, start=1):
        # body[y0:y1, x0:x1] → 원본에서는 [y_body_top+y0 : y_body_top+y1, x0:x1]
        crop = img[y_body_top + y0 : y_body_top + y1, x0:x1]
        if crop.size == 0:
            continue
        out_path = out_dir / f"problem_{idx:03d}.png"
        # BGR → RGB for PIL if we want; cv2.imwrite expects BGR
        cv2.imwrite(str(out_path), crop)

    print(f"저장: {out_dir} (총 {len(all_blocks)}개)")

    # 6) 디버그
    if args.debug:
        dbg = img.copy()
        # 가로선 (검출된 위치 - 녹색)
        cv2.line(dbg, (0, y_header_line), (w_full, y_header_line), (0, 255, 0), 2)
        cv2.line(dbg, (0, y_footer_line), (w_full, y_footer_line), (0, 255, 0), 2)
        # 세로선 (검출된 위치 - 파란색)
        cv2.line(dbg, (x_div, y_header_line), (x_div, y_footer_line), (255, 0, 0), 2)
        # 블록 (crop과 동일: [y0:y1, x0:x1]는 y1,x1 exclusive → rect pt2를 (x1-1, yb-1)로)
        for (x0, x1, y0, y1) in all_blocks:
            ya, yb = y_body_top + y0, y_body_top + y1
            # cv2.rectangle pt2 inclusive; crop [a:b] exclusive → 끝을 (x1-1, yb-1)로 맞춤
            x2 = min(x1 - 1, w_full - 1)
            y2 = min(yb - 1, h_full - 1)
            if x2 >= x0 and y2 >= ya:
                cv2.rectangle(dbg, (x0, ya), (x2, y2), (0, 0, 255), 2)
        cv2.imwrite(str(out_dir / "debug_blocks.png"), dbg)


if __name__ == "__main__":
    main()
