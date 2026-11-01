"""Extract privacy-conscious OpenCV quality metrics from an authorized video."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path


def analyze_video(input_path: Path, output_csv: Path, sample_every: int = 15, frames_dir: Path | None = None):
    try:
        import cv2
    except ImportError as error:
        raise RuntimeError("Install opencv-python-headless from ml/requirements.txt") from error

    if not input_path.is_file():
        raise FileNotFoundError(f"Video not found: {input_path}")
    capture = cv2.VideoCapture(str(input_path))
    if not capture.isOpened():
        raise RuntimeError(f"OpenCV could not open: {input_path}")

    output_csv.parent.mkdir(parents=True, exist_ok=True)
    if frames_dir:
        frames_dir.mkdir(parents=True, exist_ok=True)
    fps = capture.get(cv2.CAP_PROP_FPS) or 0
    rows = []
    frame_index = 0
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    try:
        while True:
            ok, frame = capture.read()
            if not ok:
                break
            if frame_index % max(1, sample_every) == 0:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                normalized = clahe.apply(gray)
                rows.append(
                    {
                        "frameIndex": frame_index,
                        "timestampSeconds": round(frame_index / fps, 3) if fps else 0,
                        "width": int(frame.shape[1]),
                        "height": int(frame.shape[0]),
                        "brightnessMean": round(float(gray.mean()), 4),
                        "contrastStd": round(float(gray.std()), 4),
                        "sharpnessLaplacianVariance": round(float(cv2.Laplacian(gray, cv2.CV_64F).var()), 4),
                        "normalizedBrightnessMean": round(float(normalized.mean()), 4),
                        "dataSource": "authorized-video",
                    }
                )
                if frames_dir:
                    cv2.imwrite(str(frames_dir / f"frame-{frame_index:06d}.jpg"), normalized)
            frame_index += 1
    finally:
        capture.release()

    fieldnames = list(rows[0]) if rows else [
        "frameIndex", "timestampSeconds", "width", "height", "brightnessMean",
        "contrastStd", "sharpnessLaplacianVariance", "normalizedBrightnessMean", "dataSource",
    ]
    with output_csv.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Authorized source video")
    parser.add_argument("--output", type=Path, default=Path("ml/reports/opencv-video-metrics.csv"))
    parser.add_argument("--sample-every", type=int, default=15)
    parser.add_argument(
        "--frames-dir",
        type=Path,
        help="Optional. Export normalized frames only when consent and storage policy allow it.",
    )
    args = parser.parse_args()
    rows = analyze_video(args.input, args.output, args.sample_every, args.frames_dir)
    print(f"OpenCV analyzed {len(rows)} sampled frames; metrics saved at {args.output}")


if __name__ == "__main__":
    main()

