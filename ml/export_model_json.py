"""Export Keras Dense weights to non-executable JSON for NumPy/web inference."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


FEATURES = [
    "avgEAR",
    "minEAR",
    "perclos",
    "blinkRate",
    "microsleeps",
    "elapsedMinutes",
    "facePresenceRatio",
]
CLASSES = ["normal", "atencion", "peligro"]


def export_keras_model(model, scaler, output_path: Path, metadata: dict | None = None) -> dict:
    layers = []
    for layer in model.layers:
        parameters = layer.get_weights()
        if len(parameters) != 2:
            continue
        weights, bias = parameters
        layers.append(
            {
                "activation": getattr(layer.activation, "__name__", "linear"),
                "weights": weights.T.astype(float).tolist(),
                "bias": bias.astype(float).tolist(),
            }
        )
    metadata = metadata or {}
    artifact = {
        "schemaVersion": 1,
        "modelName": metadata.get("modelName", "SomnoGuard custom company MLP"),
        "architecture": "Input(7) → Dense(32, ReLU) → Dropout(0.20) → Dense(16, ReLU) → Dense(3, Softmax)",
        "trainingSource": metadata.get("trainingSource", "unknown"),
        "validated": bool(metadata.get("validated", False)),
        "features": FEATURES,
        "classes": CLASSES,
        "normalization": {
            "mean": scaler.mean_.astype(float).tolist(),
            "std": scaler.scale_.astype(float).tolist(),
        },
        "layers": layers,
        "warning": metadata.get(
            "warning",
            "Modelo académico; requiere validación independiente antes de cualquier uso operativo.",
        ),
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(artifact, ensure_ascii=False, indent=2), encoding="utf-8")
    return artifact


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("model", type=Path, help="Saved .keras model")
    parser.add_argument("normalization", type=Path, help="JSON containing mean and std arrays")
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    import numpy as np
    import tensorflow as tf

    normalization = json.loads(args.normalization.read_text(encoding="utf-8"))
    scaler = type("ExportScaler", (), {})()
    scaler.mean_ = np.asarray(normalization["mean"], dtype=float)
    scaler.scale_ = np.asarray(normalization["std"], dtype=float)
    model = tf.keras.models.load_model(args.model)
    export_keras_model(model, scaler, args.output)
    print(f"Safe JSON artifact written to {args.output}")


if __name__ == "__main__":
    main()

