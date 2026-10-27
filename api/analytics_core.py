"""Stateless analytics for SomnoGuard.

The Vercel runtime uses NumPy, Pandas and scikit-learn when available.  A
deterministic standard-library implementation remains available so the same
contract can be tested on development computers without scientific packages.
No Firebase credentials or personally identifiable information are accepted.
"""

from __future__ import annotations

import json
import math
import statistics as py_statistics
from collections import defaultdict
from pathlib import Path
from typing import Any, Iterable

try:  # Optional in the local test environment; required by requirements.txt.
    import numpy as np
    import pandas as pd
except ImportError:  # pragma: no cover - exercised indirectly in this workspace
    np = None
    pd = None

try:
    from sklearn.cluster import KMeans
    from sklearn.metrics import silhouette_score
    from sklearn.preprocessing import StandardScaler
except ImportError:  # pragma: no cover - exercised indirectly in this workspace
    KMeans = None
    StandardScaler = None
    silhouette_score = None


MAX_SESSIONS = 200
MAX_OBSERVATIONS = 2000
MIN_CLUSTERS = 2
MAX_CLUSTERS = 6

FORBIDDEN_KEYS = {
    "apikey",
    "authorization",
    "credential",
    "credentials",
    "displayname",
    "driverid",
    "email",
    "frame",
    "frames",
    "image",
    "images",
    "name",
    "password",
    "phone",
    "photo",
    "photourl",
    "profile",
    "secret",
    "token",
    "uid",
    "userid",
    "video",
    "videos",
}


class PayloadValidationError(ValueError):
    """Raised when analytics input is unsafe or outside the public contract."""


def _normalized_key(key: Any) -> str:
    return "".join(character for character in str(key).lower() if character.isalnum())


def _walk_and_validate(value: Any, path: str = "payload") -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            normalized = _normalized_key(key)
            if normalized in FORBIDDEN_KEYS:
                raise PayloadValidationError(f"El campo '{key}' no está permitido en {path}.")
            _walk_and_validate(child, f"{path}.{key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            _walk_and_validate(child, f"{path}[{index}]")
    elif isinstance(value, bool) or value is None or isinstance(value, str):
        return
    elif isinstance(value, (int, float)):
        if not math.isfinite(float(value)):
            raise PayloadValidationError(f"Se encontró un número no finito en {path}.")
    else:
        raise PayloadValidationError(f"Tipo de dato no permitido en {path}.")


def validate_payload(payload: Any) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise PayloadValidationError("El cuerpo debe ser un objeto JSON.")

    _walk_and_validate(payload)

    sessions = payload.get("sessions", [])
    observations = payload.get("observations", [])
    if not isinstance(sessions, list) or not isinstance(observations, list):
        raise PayloadValidationError("sessions y observations deben ser listas.")
    if len(sessions) > MAX_SESSIONS:
        raise PayloadValidationError(f"El máximo es {MAX_SESSIONS} sesiones.")

    timeline_count = 0
    for index, session in enumerate(sessions):
        if not isinstance(session, dict):
            raise PayloadValidationError(f"sessions[{index}] debe ser un objeto.")
        timeline = session.get("timeline", session.get("windows", []))
        if not isinstance(timeline, list):
            raise PayloadValidationError(f"sessions[{index}].timeline debe ser una lista.")
        timeline_count += len(timeline)

    total_observations = timeline_count + len(observations)
    if total_observations > MAX_OBSERVATIONS:
        raise PayloadValidationError(f"El máximo es {MAX_OBSERVATIONS} ventanas.")

    cluster_count = payload.get("clusterCount", 3)
    if isinstance(cluster_count, bool) or not isinstance(cluster_count, int):
        raise PayloadValidationError("clusterCount debe ser entero.")
    if not MIN_CLUSTERS <= cluster_count <= MAX_CLUSTERS:
        raise PayloadValidationError(
            f"clusterCount debe estar entre {MIN_CLUSTERS} y {MAX_CLUSTERS}."
        )

    forecast_minutes = payload.get("forecastMinutes", 5)
    if isinstance(forecast_minutes, bool) or not isinstance(forecast_minutes, (int, float)):
        raise PayloadValidationError("forecastMinutes debe ser numérico.")
    if not 0 < float(forecast_minutes) <= 60:
        raise PayloadValidationError("forecastMinutes debe estar entre 0 y 60.")

    return payload


def _first(mapping: dict[str, Any], keys: Iterable[str], default: Any = 0) -> Any:
    for key in keys:
        if key in mapping and mapping[key] is not None:
            return mapping[key]
    return default


def _number(value: Any, default: float = 0.0) -> float:
    if isinstance(value, bool):
        return default
    try:
        converted = float(value)
    except (TypeError, ValueError):
        return default
    return converted if math.isfinite(converted) else default


def _bounded(value: float, lower: float, upper: float, field: str) -> float:
    if value < lower or value > upper:
        raise PayloadValidationError(
            f"{field}={value} está fuera del rango permitido [{lower}, {upper}]."
        )
    return value


def _timestamp_seconds(value: Any) -> float | None:
    timestamp = _number(value, -1)
    if timestamp < 0:
        return None
    if timestamp > 10_000_000_000:
        timestamp /= 1000
    return timestamp


def _normalize_observation(
    raw: dict[str, Any],
    session_id: str,
    index: int,
    first_timestamp: float | None,
    session_metrics: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise PayloadValidationError("Cada ventana debe ser un objeto JSON.")
    session_metrics = session_metrics or {}

    timestamp = _timestamp_seconds(raw.get("timestamp"))
    if "elapsedMinutes" in raw:
        elapsed_minutes = _number(raw["elapsedMinutes"])
    elif "elapsedSeconds" in raw:
        elapsed_minutes = _number(raw["elapsedSeconds"]) / 60
    elif timestamp is not None and first_timestamp is not None:
        elapsed_minutes = max(0, timestamp - first_timestamp) / 60
    else:
        elapsed_minutes = index * 0.5

    avg_ear = _number(_first(raw, ("avgEAR", "earMean"), session_metrics.get("avgEAR", 0)))
    min_ear = _number(_first(raw, ("minEAR", "earMin"), avg_ear))
    perclos = _number(_first(raw, ("perclos", "closedEyeRatio", "perclosPct"), 0))
    if "perclosPct" in raw and "perclos" not in raw and "closedEyeRatio" not in raw:
        perclos /= 100

    fatigue = _number(
        _first(
            raw,
            ("fatiguePct", "fatigueMean", "avgFatigue", "avgFatiguePercentage"),
            session_metrics.get("avgFatiguePercentage", 0),
        )
    )
    blink_rate = _number(_first(raw, ("blinkRate", "avgBlinkRate", "blinkRateMean"), 0))
    microsleeps = _number(
        _first(raw, ("microsleeps", "microsleepsDelta", "microsleepCount"), 0)
    )
    alerts = _number(_first(raw, ("alerts", "alertsDelta", "totalAlerts"), 0))
    face_presence = _number(_first(raw, ("facePresenceRatio",), 1))

    return {
        "sessionId": str(session_id),
        "windowIndex": index,
        "elapsedMinutes": _bounded(elapsed_minutes, 0, 24 * 60, "elapsedMinutes"),
        "avgEAR": _bounded(avg_ear, 0, 2, "avgEAR"),
        "minEAR": _bounded(min_ear, 0, 2, "minEAR"),
        "perclos": _bounded(perclos, 0, 1, "perclos"),
        "blinkRate": _bounded(blink_rate, 0, 240, "blinkRate"),
        "microsleeps": _bounded(microsleeps, 0, 10_000, "microsleeps"),
        "alerts": _bounded(alerts, 0, 10_000, "alerts"),
        "fatiguePct": _bounded(fatigue, 0, 100, "fatiguePct"),
        "facePresenceRatio": _bounded(face_presence, 0, 1, "facePresenceRatio"),
    }


def _normalise_payload(payload: dict[str, Any]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []

    for session_index, session in enumerate(payload.get("sessions", [])):
        timeline = session.get("timeline", session.get("windows", []))
        metrics = session.get("metrics", {}) if isinstance(session.get("metrics", {}), dict) else {}
        session_id = str(session.get("sessionId", session.get("id", f"session-{session_index}")))
        timestamps = [_timestamp_seconds(item.get("timestamp")) for item in timeline if isinstance(item, dict)]
        first_timestamp = next((value for value in timestamps if value is not None), None)
        for window_index, raw in enumerate(timeline):
            normalized.append(
                _normalize_observation(raw, session_id, window_index, first_timestamp, metrics)
            )

    direct_groups: dict[str, int] = defaultdict(int)
    direct_first_timestamp: dict[str, float | None] = {}
    for raw in payload.get("observations", []):
        if not isinstance(raw, dict):
            raise PayloadValidationError("Cada observación debe ser un objeto.")
        session_id = str(raw.get("sessionId", "direct-observations"))
        index = direct_groups[session_id]
        direct_groups[session_id] += 1
        if session_id not in direct_first_timestamp:
            direct_first_timestamp[session_id] = _timestamp_seconds(raw.get("timestamp"))
        normalized.append(
            _normalize_observation(
                raw,
                session_id,
                index,
                direct_first_timestamp[session_id],
            )
        )

    return normalized


def _clean(value: float, digits: int = 8) -> float:
    if not math.isfinite(float(value)):
        return 0.0
    rounded = round(float(value), digits)
    return 0.0 if rounded == -0.0 else rounded


def _series_summary(values: list[float]) -> dict[str, float]:
    if not values:
        return {"mean": 0.0, "median": 0.0, "variance": 0.0, "stdDev": 0.0}
    if pd is not None:
        series = pd.Series(values, dtype="float64")
        variance = float(series.var(ddof=1)) if len(values) > 1 else 0.0
        std_dev = float(series.std(ddof=1)) if len(values) > 1 else 0.0
        mean = float(series.mean())
        median = float(series.median())
    else:
        mean = py_statistics.fmean(values)
        median = py_statistics.median(values)
        variance = py_statistics.variance(values) if len(values) > 1 else 0.0
        std_dev = math.sqrt(variance)
    return {
        "mean": _clean(mean),
        "median": _clean(median),
        "variance": _clean(variance),
        "stdDev": _clean(std_dev),
    }


def _regression_metrics(actual: list[float], predicted: list[float]) -> dict[str, float]:
    if not actual:
        return {"r2": 0.0, "mae": 0.0, "rmse": 0.0}
    errors = [expected - estimate for expected, estimate in zip(actual, predicted)]
    mae = sum(abs(error) for error in errors) / len(errors)
    rmse = math.sqrt(sum(error * error for error in errors) / len(errors))
    mean_actual = sum(actual) / len(actual)
    total = sum((value - mean_actual) ** 2 for value in actual)
    residual = sum(error * error for error in errors)
    r2 = 1 - residual / total if total > 1e-12 else 0.0
    return {"r2": _clean(r2), "mae": _clean(mae), "rmse": _clean(rmse)}


def _simple_regression(observations: list[dict[str, Any]], forecast_minutes: float) -> dict[str, Any]:
    if len(observations) < 2:
        return {
            "status": "insufficient-data",
            "sampleSize": len(observations),
            "slope": 0.0,
            "intercept": observations[0]["fatiguePct"] if observations else 0.0,
            "r2": 0.0,
            "mae": 0.0,
            "rmse": 0.0,
            "forecastMinutes": _clean(forecast_minutes),
            "forecastFatiguePct": observations[0]["fatiguePct"] if observations else 0.0,
        }

    x_values = [row["elapsedMinutes"] for row in observations]
    y_values = [row["fatiguePct"] for row in observations]
    mean_x = sum(x_values) / len(x_values)
    mean_y = sum(y_values) / len(y_values)
    denominator = sum((value - mean_x) ** 2 for value in x_values)
    if denominator <= 1e-12:
        slope = 0.0
        intercept = mean_y
        status = "insufficient-time-variation"
    else:
        slope = sum(
            (x_value - mean_x) * (y_value - mean_y)
            for x_value, y_value in zip(x_values, y_values)
        ) / denominator
        intercept = mean_y - slope * mean_x
        status = "ok"
    predicted = [intercept + slope * value for value in x_values]
    metrics = _regression_metrics(y_values, predicted)
    forecast_at = max(x_values) + forecast_minutes
    forecast = max(0, min(100, intercept + slope * forecast_at))
    return {
        "status": status,
        "sampleSize": len(observations),
        "slope": _clean(slope),
        "intercept": _clean(intercept),
        **metrics,
        "forecastMinutes": _clean(forecast_minutes),
        "forecastAtElapsedMinute": _clean(forecast_at),
        "forecastFatiguePct": _clean(forecast),
        "formula": "fatiga = intercepto + pendiente × minutos",
    }


def _transpose(matrix: list[list[float]]) -> list[list[float]]:
    return [list(column) for column in zip(*matrix)]


def _matmul(left: list[list[float]], right: list[list[float]]) -> list[list[float]]:
    return [
        [sum(a * b for a, b in zip(row, column)) for column in zip(*right)]
        for row in left
    ]


def _solve(matrix: list[list[float]], vector: list[float]) -> list[float]:
    size = len(vector)
    augmented = [row[:] + [vector[index]] for index, row in enumerate(matrix)]
    for column in range(size):
        pivot = max(range(column, size), key=lambda row: abs(augmented[row][column]))
        augmented[column], augmented[pivot] = augmented[pivot], augmented[column]
        pivot_value = augmented[column][column]
        if abs(pivot_value) < 1e-12:
            pivot_value = 1e-12
            augmented[column][column] = pivot_value
        for entry in range(column, size + 1):
            augmented[column][entry] /= pivot_value
        for row in range(size):
            if row == column:
                continue
            factor = augmented[row][column]
            for entry in range(column, size + 1):
                augmented[row][entry] -= factor * augmented[column][entry]
    return [augmented[index][-1] for index in range(size)]


MULTIPLE_FEATURES = [
    "elapsedMinutes",
    "avgEAR",
    "minEAR",
    "perclos",
    "blinkRate",
    "microsleeps",
    "facePresenceRatio",
]


def _future_window_pairs(
    observations: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[float]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for observation in observations:
        grouped[observation["sessionId"]].append(observation)
    feature_rows: list[dict[str, Any]] = []
    targets: list[float] = []
    for session_rows in grouped.values():
        ordered = sorted(
            session_rows,
            key=lambda row: (row["elapsedMinutes"], row["windowIndex"]),
        )
        for current, following in zip(ordered, ordered[1:]):
            feature_rows.append(current)
            targets.append(following["fatiguePct"])
    return feature_rows, targets


def _multiple_regression(observations: list[dict[str, Any]]) -> tuple[dict[str, Any], dict[str, Any]]:
    feature_rows, target = _future_window_pairs(observations)
    if not feature_rows:
        empty = {
            "status": "insufficient-data",
            "sampleSize": 0,
            "features": MULTIPLE_FEATURES,
            "intercept": 0.0,
            "coefficients": {feature: 0.0 for feature in MULTIPLE_FEATURES},
            "r2": 0.0,
            "mae": 0.0,
            "rmse": 0.0,
        }
        algebra = {
            "formula": "β = pinv(XᵀX)Xᵀy; ŷ = Xβ",
            "designMatrixShape": [0, len(MULTIPLE_FEATURES) + 1],
            "coefficientVectorShape": [len(MULTIPLE_FEATURES) + 1],
            "predictionVectorShape": [0],
        }
        return empty, algebra

    design = [[1.0] + [row[feature] for feature in MULTIPLE_FEATURES] for row in feature_rows]

    if np is not None:
        x_matrix = np.asarray(design, dtype=float)
        y_vector = np.asarray(target, dtype=float)
        coefficients = np.linalg.pinv(x_matrix.T @ x_matrix) @ x_matrix.T @ y_vector
        predicted = x_matrix @ coefficients
        coefficient_values = coefficients.tolist()
        predicted_values = predicted.tolist()
        solver = "NumPy pseudoinverse"
    else:
        transpose = _transpose(design)
        normal_matrix = _matmul(transpose, design)
        ridge = 1e-8
        for index in range(1, len(normal_matrix)):
            normal_matrix[index][index] += ridge
        target_column = [[value] for value in target]
        normal_vector = [row[0] for row in _matmul(transpose, target_column)]
        coefficient_values = _solve(normal_matrix, normal_vector)
        predicted_values = [
            sum(value * coefficient for value, coefficient in zip(row, coefficient_values))
            for row in design
        ]
        solver = "Python regularized normal equations fallback"

    metrics = _regression_metrics(target, predicted_values)
    response = {
        "status": "ok" if len(feature_rows) >= len(MULTIPLE_FEATURES) + 1 else "exploratory-small-sample",
        "sampleSize": len(feature_rows),
        "target": "fatiguePct de la ventana siguiente",
        "features": MULTIPLE_FEATURES,
        "intercept": _clean(coefficient_values[0]),
        "coefficients": {
            feature: _clean(coefficient_values[index + 1])
            for index, feature in enumerate(MULTIPLE_FEATURES)
        },
        **metrics,
        "solver": solver,
    }
    algebra = {
        "formula": "β = pinv(XᵀX)Xᵀy; ŷ = Xβ",
        "designMatrixShape": [len(design), len(design[0])],
        "coefficientVectorShape": [len(coefficient_values)],
        "predictionVectorShape": [len(predicted_values)],
        "featureVector": ["intercept", *MULTIPLE_FEATURES],
    }
    return response, algebra


CLUSTER_FEATURES = ["fatiguePct", "avgEAR", "perclos", "blinkRate", "microsleeps"]


def _standardize(rows: list[list[float]]) -> tuple[list[list[float]], list[float], list[float]]:
    columns = list(zip(*rows))
    means = [sum(column) / len(column) for column in columns]
    stds = []
    for column, mean in zip(columns, means):
        variance = sum((value - mean) ** 2 for value in column) / len(column)
        stds.append(math.sqrt(variance) or 1.0)
    standardized = [
        [(value - means[index]) / stds[index] for index, value in enumerate(row)]
        for row in rows
    ]
    return standardized, means, stds


def _distance(left: list[float], right: list[float]) -> float:
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(left, right)))


def _fallback_kmeans(rows: list[list[float]], k: int) -> tuple[list[int], list[list[float]], float]:
    ordered = sorted(range(len(rows)), key=lambda index: tuple(rows[index]))
    seeds = [ordered[round(position * (len(rows) - 1) / max(1, k - 1))] for position in range(k)]
    centers = [rows[index][:] for index in seeds]
    labels = [0] * len(rows)
    for _ in range(100):
        updated_labels = [
            min(range(k), key=lambda cluster: (_distance(row, centers[cluster]), cluster))
            for row in rows
        ]
        new_centers: list[list[float]] = []
        for cluster in range(k):
            members = [row for row, label in zip(rows, updated_labels) if label == cluster]
            if not members:
                new_centers.append(centers[cluster][:])
            else:
                new_centers.append(
                    [sum(column) / len(column) for column in zip(*members)]
                )
        if updated_labels == labels and new_centers == centers:
            labels = updated_labels
            centers = new_centers
            break
        labels = updated_labels
        centers = new_centers
    inertia = sum(_distance(row, centers[label]) ** 2 for row, label in zip(rows, labels))
    return labels, centers, inertia


def _fallback_silhouette(rows: list[list[float]], labels: list[int]) -> float:
    unique = sorted(set(labels))
    if len(unique) < 2 or len(rows) <= len(unique):
        return 0.0
    scores = []
    for index, row in enumerate(rows):
        same = [
            _distance(row, other)
            for other_index, other in enumerate(rows)
            if labels[other_index] == labels[index] and other_index != index
        ]
        a_value = sum(same) / len(same) if same else 0.0
        other_means = []
        for cluster in unique:
            if cluster == labels[index]:
                continue
            distances = [
                _distance(row, other)
                for other, label in zip(rows, labels)
                if label == cluster
            ]
            if distances:
                other_means.append(sum(distances) / len(distances))
        b_value = min(other_means) if other_means else 0.0
        denominator = max(a_value, b_value)
        scores.append((b_value - a_value) / denominator if denominator else 0.0)
    return sum(scores) / len(scores)


def _segmentation(observations: list[dict[str, Any]], requested_k: int) -> dict[str, Any]:
    if len(observations) < 2:
        return {
            "status": "insufficient-data",
            "clusterCount": 0,
            "sampleSize": len(observations),
            "features": CLUSTER_FEATURES,
            "silhouetteScore": 0.0,
            "inertia": 0.0,
            "clusters": [],
            "assignments": [],
        }
    k = min(requested_k, len(observations))
    raw_rows = [[row[feature] for feature in CLUSTER_FEATURES] for row in observations]

    if KMeans is not None and StandardScaler is not None:
        scaler = StandardScaler()
        standardized_array = scaler.fit_transform(raw_rows)
        model = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = model.fit_predict(standardized_array).tolist()
        standardized = standardized_array.tolist()
        inertia = float(model.inertia_)
        silhouette = (
            float(silhouette_score(standardized_array, labels))
            if silhouette_score is not None and len(observations) > k and len(set(labels)) > 1
            else 0.0
        )
        engine = "scikit-learn KMeans"
    else:
        standardized, _, _ = _standardize(raw_rows)
        labels, _, inertia = _fallback_kmeans(standardized, k)
        silhouette = _fallback_silhouette(standardized, labels)
        engine = "Python deterministic KMeans fallback"

    clusters = []
    for cluster in range(k):
        members = [row for row, label in zip(raw_rows, labels) if label == cluster]
        centroid = {
            feature: _clean(sum(column) / len(column))
            for feature, column in zip(CLUSTER_FEATURES, zip(*members))
        } if members else {feature: 0.0 for feature in CLUSTER_FEATURES}
        clusters.append(
            {
                "id": cluster,
                "count": len(members),
                "centroid": centroid,
                "riskScore": _clean(
                    centroid["fatiguePct"]
                    + centroid["perclos"] * 100
                    + centroid["microsleeps"] * 10
                ),
            }
        )

    risk_order = sorted(clusters, key=lambda cluster: (cluster["riskScore"], cluster["id"]))
    descriptions = ["menor exposición", "exposición intermedia", "mayor exposición"]
    for rank, cluster in enumerate(risk_order):
        description_index = round(rank * 2 / max(1, len(risk_order) - 1))
        cluster["profile"] = descriptions[description_index]

    return {
        "status": "ok",
        "clusterCount": k,
        "sampleSize": len(observations),
        "features": CLUSTER_FEATURES,
        "silhouetteScore": _clean(silhouette),
        "inertia": _clean(inertia),
        "engine": engine,
        "clusters": sorted(clusters, key=lambda cluster: cluster["id"]),
        "assignments": labels,
        "interpretationNote": "Los perfiles se nombran después de calcular los centroides.",
    }


def _artifact_path() -> Path:
    return Path(__file__).resolve().parents[1] / "public" / "models" / "somnoguard-demo-model.json"


def _softmax(values: list[float]) -> list[float]:
    maximum = max(values)
    exponents = [math.exp(value - maximum) for value in values]
    total = sum(exponents)
    return [value / total for value in exponents]


def _network_inference(observations: list[dict[str, Any]]) -> dict[str, Any]:
    artifact = json.loads(_artifact_path().read_text(encoding="utf-8"))
    features = artifact["features"]
    aggregate = {
        feature: sum(row.get(feature, 0.0) for row in observations) / len(observations)
        if observations
        else 0.0
        for feature in features
    }
    means = artifact["normalization"]["mean"]
    stds = artifact["normalization"]["std"]
    activations = [
        (aggregate[feature] - means[index]) / (stds[index] or 1.0)
        for index, feature in enumerate(features)
    ]
    for layer in artifact["layers"]:
        weights = layer["weights"]
        biases = layer["bias"]
        values = [
            sum(weight * activation for weight, activation in zip(row, activations)) + biases[index]
            for index, row in enumerate(weights)
        ]
        if layer.get("activation") == "relu":
            activations = [max(0.0, value) for value in values]
        elif layer.get("activation") == "softmax":
            activations = _softmax(values)
        else:
            activations = values
    probabilities = {
        class_name: _clean(probability)
        for class_name, probability in zip(artifact["classes"], activations)
    }
    total = sum(probabilities.values())
    if total:
        final_class = artifact["classes"][-1]
        probabilities[final_class] = _clean(
            probabilities[final_class] + (1.0 - total)
        )
    predicted_class = max(probabilities, key=probabilities.get)
    return {
        "status": "academic-demo-model",
        "modelName": artifact["modelName"],
        "architecture": artifact["architecture"],
        "trainingSource": artifact["trainingSource"],
        "validated": bool(artifact["validated"]),
        "predictedClass": predicted_class,
        "probabilities": probabilities,
        "warning": artifact["warning"],
    }


def analyze_payload(payload: Any) -> dict[str, Any]:
    validated = validate_payload(payload)
    observations = _normalise_payload(validated)
    forecast_minutes = float(validated.get("forecastMinutes", 5))
    cluster_count = int(validated.get("clusterCount", 3))

    fatigue_values = [row["fatiguePct"] for row in observations]
    ear_values = [row["avgEAR"] for row in observations]
    perclos_values = [row["perclos"] for row in observations]
    statistics = {
        "fatigue": _series_summary(fatigue_values),
        "ear": _series_summary(ear_values),
        "perclos": _series_summary(perclos_values),
        "probabilityFatigueAbove60": _clean(
            sum(value >= 60 for value in fatigue_values) / len(fatigue_values)
            if fatigue_values else 0
        ),
        "probabilityMicrosleep": _clean(
            sum(row["microsleeps"] > 0 for row in observations) / len(observations)
            if observations else 0
        ),
        "probabilityAlert": _clean(
            sum(row["alerts"] > 0 for row in observations) / len(observations)
            if observations else 0
        ),
    }
    multiple, linear_algebra = _multiple_regression(observations)

    available_libraries = ["Python standard library"]
    if np is not None:
        available_libraries.append("NumPy")
    if pd is not None:
        available_libraries.append("Pandas")
    if KMeans is not None:
        available_libraries.append("scikit-learn")

    warnings = [
        "Resultado académico: no es diagnóstico médico ni garantía de seguridad.",
        "El índice de fatiga existente es heurístico y no una probabilidad clínica calibrada.",
    ]
    if not observations:
        warnings.append("No se recibieron ventanas; los resultados están marcados como insuficientes.")
    if np is None or pd is None or KMeans is None:
        warnings.append(
            "Entorno local sin dependencias científicas: se usó el fallback matemático determinista."
        )
    if validated.get("dataMode") == "synthetic-demo":
        warnings.append("Los datos son sintéticos y solo sirven para demostración académica.")

    return {
        "metadata": {
            "engine": "Python analytics",
            "availableLibraries": available_libraries,
            "libraries": available_libraries,
            "declaredLibraries": ["NumPy", "Pandas", "scikit-learn"],
            "dataMode": validated.get("dataMode", "real"),
            "sampleSize": len(observations),
            "sessionCount": len({row["sessionId"] for row in observations}),
            "schemaVersion": 2,
        },
        "statistics": statistics,
        "simpleRegression": _simple_regression(observations, forecast_minutes),
        "multipleRegression": multiple,
        "linearAlgebra": linear_algebra,
        "segmentation": _segmentation(observations, cluster_count),
        "neuralNetwork": _network_inference(observations),
        "warnings": warnings,
    }

