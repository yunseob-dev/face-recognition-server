"""
LFW 데이터셋에서 CSV에 명시된 인물 폴더만 선별하여 복사하는 스크립트.
data_for_face_reco.csv에 있는 이름(이미지 2장 이상)만 대상으로 합니다.

사용법:
    python scripts/copy_lfw_selected.py
    python scripts/copy_lfw_selected.py --csv ./data/people.csv --source ./archive/lfw --dest ./lfw_selected

환경 변수: CSV_PATH, SOURCE_DIR, DEST_DIR 로도 지정 가능.
"""

import argparse
import csv
import os
import shutil
from pathlib import Path


def get_paths(args: argparse.Namespace) -> tuple[Path, Path, Path]:
    csv_path = (
        Path(args.csv)
        if args.csv
        else Path(os.environ.get("CSV_PATH", "./data_for_face_reco.csv"))
    )
    source_dir = (
        Path(args.source)
        if args.source
        else Path(os.environ.get("SOURCE_DIR", "./archive/lfw-deepfunneled/lfw-deepfunneled"))
    )
    dest_dir = (
        Path(args.dest)
        if args.dest
        else Path(os.environ.get("DEST_DIR", "./lfw_selected"))
    )
    return csv_path, source_dir, dest_dir


def main():
    parser = argparse.ArgumentParser(
        description="LFW 데이터셋에서 CSV에 명시된 인물 폴더만 선별 복사"
    )
    parser.add_argument(
        "--csv",
        default=None,
        help="대상 인물 목록 CSV 경로 (기본: env CSV_PATH 또는 ./data_for_face_reco.csv)",
    )
    parser.add_argument(
        "--source",
        default=None,
        help="LFW 소스 디렉터리 (기본: env SOURCE_DIR 또는 ./archive/lfw-deepfunneled/lfw-deepfunneled)",
    )
    parser.add_argument(
        "--dest",
        default=None,
        help="복사 대상 디렉터리 (기본: env DEST_DIR 또는 ./lfw_selected)",
    )
    args = parser.parse_args()

    CSV_PATH, SOURCE_DIR, DEST_DIR = get_paths(args)

    if not CSV_PATH.exists():
        print(f"오류: CSV 파일을 찾을 수 없습니다: {CSV_PATH}")
        return

    # CSV에서 인물 이름 읽기
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        names = [row["name"] for row in reader]

    print(f"CSV에서 {len(names)}명 로드 완료")

    # 대상 디렉토리 생성
    DEST_DIR.mkdir(parents=True, exist_ok=True)

    success = 0
    not_found = 0
    failed = 0

    for name in names:
        src = SOURCE_DIR / name
        dst = DEST_DIR / name

        if not src.exists():
            print(f"  [누락] {name} - 소스 폴더 없음")
            not_found += 1
            continue

        if dst.exists():
            print(f"  [건너뜀] {name} - 이미 존재")
            success += 1
            continue

        try:
            shutil.copytree(src, dst)
            success += 1
        except Exception as e:
            print(f"  [실패] {name} - {e}")
            failed += 1

    print(f"\n완료: 성공 {success} / 누락 {not_found} / 실패 {failed} (총 {len(names)}명)")


if __name__ == "__main__":
    main()
