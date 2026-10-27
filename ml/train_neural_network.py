"""Train and evaluate the SomnoGuard company-specific Keras MLP."""

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path

try:
    from ml.export_model_json import CLASSES, FEATURES, export_keras_model
except ImportError:  # Support `python ml/train_neural_network.py ...` as well.
    from export_model_json import CLASSES, FEATURES, export_keras_model


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv", type=Path, help="Anonymized feature-window CSV")
    parser.add_argument("--output-dir", type=Path, default=Path("ml/artifacts"))
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--training-source", default="synthetic-demo")
    args = parser.parse_args()

    import matplotlib.pyplot as plt
    import numpy as np
    import pandas as pd
    import seaborn as sns
    import tensorflow as tf
    from sklearn.metrics import classification_report, confusion_matrix, f1_score
    from sklearn.model_selection import GroupShuffleSplit
    from sklearn.preprocessing import LabelEncoder, StandardScaler
    from sklearn.utils.class_weight import compute_class_weight

    random.seed(42)
    np.random.seed(42)
    tf.random.set_seed(42)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    frame = pd.read_csv(args.csv)
    required = set(FEATURES + ["targetClass", "driverId"])
    missing = sorted(required - set(frame.columns))
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}")
    frame = frame.replace([np.inf, -np.inf], np.nan).dropna(subset=list(required)).copy()
    if frame.empty:
        raise ValueError("No valid rows remain after cleaning")

    encoder = LabelEncoder()
    encoder.fit(CLASSES)
    labels = encoder.transform(frame["targetClass"])
    groups = frame["driverId"].astype(str).to_numpy()
    features = frame[FEATURES].astype(float).to_numpy()

    splitter = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42)
    train_indices, test_indices = next(splitter.split(features, labels, groups=groups))
    scaler = StandardScaler().fit(features[train_indices])
    x_train = scaler.transform(features[train_indices])
    x_test = scaler.transform(features[test_indices])
    y_train = labels[train_indices]
    y_test = labels[test_indices]

    model = tf.keras.Sequential(
        [
            tf.keras.layers.Input(shape=(len(FEATURES),), name="company_features"),
            tf.keras.layers.Dense(32, activation="relu"),
            tf.keras.layers.Dropout(0.20),
            tf.keras.layers.Dense(16, activation="relu"),
            tf.keras.layers.Dense(len(CLASSES), activation="softmax"),
        ],
        name="somnoguard_company_mlp",
    )
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    present_classes = np.unique(y_train)
    weights = compute_class_weight(class_weight="balanced", classes=present_classes, y=y_train)
    class_weights = {int(label): float(weight) for label, weight in zip(present_classes, weights)}
    history = model.fit(
        x_train,
        y_train,
        validation_split=0.2,
        epochs=args.epochs,
        batch_size=32,
        class_weight=class_weights,
        callbacks=[
            tf.keras.callbacks.EarlyStopping(
                monitor="val_loss", patience=12, restore_best_weights=True
            )
        ],
        verbose=1,
    )

    probabilities = model.predict(x_test, verbose=0)
    predictions = probabilities.argmax(axis=1)
    report = classification_report(
        y_test,
        predictions,
        labels=list(range(len(CLASSES))),
        target_names=CLASSES,
        zero_division=0,
        output_dict=True,
    )
    macro_f1 = float(f1_score(y_test, predictions, average="macro", zero_division=0))
    matrix = confusion_matrix(y_test, predictions, labels=list(range(len(CLASSES))))

    model_path = args.output_dir / "somnoguard-company-model.keras"
    model.save(model_path)
    normalization_path = args.output_dir / "normalization.json"
    normalization_path.write_text(
        json.dumps(
            {"features": FEATURES, "mean": scaler.mean_.tolist(), "std": scaler.scale_.tolist()},
            indent=2,
        ),
        encoding="utf-8",
    )
    source_is_synthetic = args.training_source == "synthetic-demo"
    export_keras_model(
        model,
        scaler,
        args.output_dir / "somnoguard-company-model.json",
        {
            "trainingSource": args.training_source,
            "validated": False,
            "warning": (
                "Modelo sintético de demostración, no validado."
                if source_is_synthetic
                else "Modelo entrenado con datos empresariales; aún requiere validación independiente."
            ),
        },
    )

    metrics = {
        "trainingSource": args.training_source,
        "validated": False,
        "trainDrivers": int(len(set(groups[train_indices]))),
        "testDrivers": int(len(set(groups[test_indices]))),
        "testRows": int(len(test_indices)),
        "macroF1": macro_f1,
        "classificationReport": report,
    }
    (args.output_dir / "evaluation.json").write_text(
        json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    figure, axes = plt.subplots(1, 2, figsize=(11, 4))
    axes[0].plot(history.history["loss"], label="train")
    axes[0].plot(history.history["val_loss"], label="validation")
    axes[0].set_title("Pérdida")
    axes[0].legend()
    axes[1].plot(history.history["accuracy"], label="train")
    axes[1].plot(history.history["val_accuracy"], label="validation")
    axes[1].set_title("Accuracy")
    axes[1].legend()
    figure.tight_layout()
    figure.savefig(args.output_dir / "training-curves.png", dpi=160)
    plt.close(figure)

    figure, axis = plt.subplots(figsize=(6, 5))
    sns.heatmap(matrix, annot=True, fmt="d", cmap="Blues", xticklabels=CLASSES, yticklabels=CLASSES, ax=axis)
    axis.set_xlabel("Predicción")
    axis.set_ylabel("Clase real")
    axis.set_title("Matriz de confusión")
    figure.tight_layout()
    figure.savefig(args.output_dir / "confusion-matrix.png", dpi=160)
    plt.close(figure)
    print(json.dumps(metrics, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

