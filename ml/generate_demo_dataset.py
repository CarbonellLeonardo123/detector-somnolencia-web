"""Generate a deterministic, explicitly synthetic SomnoGuard teaching dataset."""

from __future__ import annotations

import argparse
import csv
import math
import random
from pathlib import Path


FIELDS = [
    "driverId",
    "sessionId",
    "windowIndex",
    "elapsedMinutes",
    "avgEAR",
    "minEAR",
    "perclos",
    "blinkRate",
    "microsleeps",
    "facePresenceRatio",
    "fatiguePct",
    "targetClass",
    "dataSource",
]


def _target_class(fatigue: float, microsleeps: int) -> str:
    if microsleeps > 0 or fatigue >= 70:
        return "peligro"
    if fatigue >= 38:
        return "atencion"
    return "normal"


def generate_rows(driver_count: int = 18, windows_per_driver: int = 40, seed: int = 42):
    """Return synthetic feature windows; never represent them as real drivers."""
    generator = random.Random(seed)
    rows = []
    for driver_index in range(driver_count):
        baseline_ear = generator.uniform(0.265, 0.34)
        susceptibility = generator.uniform(0.55, 1.45)
        baseline_blinks = generator.uniform(11, 19)
        for window_index in range(windows_per_driver):
            elapsed = window_index * 0.5
            progression = (window_index / max(1, windows_per_driver - 1)) ** 1.4
            wave = math.sin(window_index / 4 + driver_index) * 0.015
            perclos = min(
                0.85,
                max(0.01, 0.025 + progression * 0.48 * susceptibility + wave + generator.gauss(0, 0.018)),
            )
            avg_ear = min(
                0.48,
                max(0.08, baseline_ear - progression * 0.105 * susceptibility - perclos * 0.035 + generator.gauss(0, 0.008)),
            )
            min_ear = min(avg_ear, max(0.04, avg_ear - generator.uniform(0.025, 0.115) - perclos * 0.06))
            blink_rate = min(
                55,
                max(2, baseline_blinks + progression * 11 * susceptibility + generator.gauss(0, 2.2)),
            )
            microsleep_probability = max(0, perclos - 0.34) * 0.75
            microsleeps = 1 if generator.random() < microsleep_probability else 0
            face_presence = min(1, max(0.65, generator.gauss(0.96, 0.035)))
            fatigue = min(
                100,
                max(
                    0,
                    8
                    + progression * 50 * susceptibility
                    + perclos * 42
                    + microsleeps * 19
                    + max(0, 0.24 - avg_ear) * 95
                    + generator.gauss(0, 3.0),
                ),
            )
            rows.append(
                {
                    "driverId": f"demo-driver-{driver_index + 1:02d}",
                    "sessionId": f"demo-session-{driver_index + 1:02d}",
                    "windowIndex": window_index,
                    "elapsedMinutes": round(elapsed, 3),
                    "avgEAR": round(avg_ear, 4),
                    "minEAR": round(min_ear, 4),
                    "perclos": round(perclos, 4),
                    "blinkRate": round(blink_rate, 3),
                    "microsleeps": microsleeps,
                    "facePresenceRatio": round(face_presence, 4),
                    "fatiguePct": round(fatigue, 3),
                    "targetClass": _target_class(fatigue, microsleeps),
                    "dataSource": "synthetic-demo",
                }
            )
    return rows


def write_csv(rows, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("ml/data/somnoguard-demo.csv"))
    parser.add_argument("--drivers", type=int, default=18)
    parser.add_argument("--windows", type=int, default=40)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    rows = generate_rows(args.drivers, args.windows, args.seed)
    write_csv(rows, args.output)
    print(f"Created {len(rows)} synthetic-demo rows at {args.output}")


if __name__ == "__main__":
    main()

