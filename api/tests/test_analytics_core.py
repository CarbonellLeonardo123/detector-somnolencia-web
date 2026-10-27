import math
import unittest

from api.analytics_core import PayloadValidationError, analyze_payload, validate_payload


def build_observations(count=12):
    observations = []
    for index in range(count):
        elapsed = index * 0.5
        fatigue = 12 + 4 * elapsed
        observations.append(
            {
                "sessionId": "academic-session",
                "elapsedMinutes": elapsed,
                "avgEAR": 0.31 - index * 0.004,
                "minEAR": 0.25 - index * 0.003,
                "perclos": 0.03 + index * 0.008,
                "blinkRate": 13 + index * 0.3,
                "microsleeps": 1 if index > 9 else 0,
                "alerts": 1 if index > 9 else 0,
                "fatiguePct": fatigue,
                "facePresenceRatio": 0.97,
            }
        )
    return observations


class ValidationTests(unittest.TestCase):
    def test_rejects_pii_and_raw_media_fields(self):
        for forbidden in ("email", "displayName", "userId", "driverId", "video", "frame"):
            with self.subTest(forbidden=forbidden):
                payload = {"observations": build_observations(3)}
                payload[forbidden] = "not-allowed"
                with self.assertRaises(PayloadValidationError):
                    validate_payload(payload)

    def test_rejects_non_finite_numbers_and_invalid_cluster_count(self):
        payload = {"observations": build_observations(3)}
        payload["observations"][0]["avgEAR"] = math.inf
        with self.assertRaises(PayloadValidationError):
            validate_payload(payload)

        with self.assertRaises(PayloadValidationError):
            validate_payload({"observations": build_observations(3), "clusterCount": 9})

    def test_rejects_more_than_two_thousand_windows(self):
        with self.assertRaises(PayloadValidationError):
            validate_payload({"observations": build_observations(2001)})


class AnalysisTests(unittest.TestCase):
    def test_returns_required_academic_sections_with_finite_values(self):
        result = analyze_payload(
            {
                "dataMode": "synthetic-demo",
                "forecastMinutes": 5,
                "clusterCount": 3,
                "observations": build_observations(),
            }
        )

        self.assertEqual(result["metadata"]["sampleSize"], 12)
        self.assertIn("NumPy", result["metadata"]["declaredLibraries"])
        self.assertIn("Pandas", result["metadata"]["declaredLibraries"])
        self.assertIn("statistics", result)
        self.assertIn("simpleRegression", result)
        self.assertIn("multipleRegression", result)
        self.assertIn("linearAlgebra", result)
        self.assertIn("segmentation", result)
        self.assertIn("neuralNetwork", result)
        self.assertAlmostEqual(result["simpleRegression"]["slope"], 4.0, places=6)
        self.assertAlmostEqual(result["simpleRegression"]["intercept"], 12.0, places=6)
        self.assertAlmostEqual(result["simpleRegression"]["r2"], 1.0, places=6)

        def assert_finite_tree(value):
            if isinstance(value, dict):
                for child in value.values():
                    assert_finite_tree(child)
            elif isinstance(value, list):
                for child in value:
                    assert_finite_tree(child)
            elif isinstance(value, float):
                self.assertTrue(math.isfinite(value))

        assert_finite_tree(result)

    def test_normalizes_sessions_with_old_and_new_timeline_fields(self):
        payload = {
            "sessions": [
                {
                    "sessionId": "old",
                    "timeline": [
                        {
                            "timestamp": 100,
                            "avgEAR": 0.28,
                            "fatiguePct": 25,
                            "blinkRate": 14,
                            "attentionScore": 75,
                        },
                        {
                            "timestamp": 130,
                            "avgEAR": 0.25,
                            "fatiguePct": 42,
                            "blinkRate": 17,
                            "attentionScore": 58,
                        },
                    ],
                },
                {
                    "sessionId": "new",
                    "timeline": [
                        {
                            "elapsedSeconds": 30,
                            "avgEAR": 0.27,
                            "minEAR": 0.20,
                            "perclosPct": 12,
                            "fatigueMean": 35,
                            "avgBlinkRate": 15,
                            "facePresenceRatio": 0.95,
                        }
                    ],
                },
            ]
        }
        result = analyze_payload(payload)
        self.assertEqual(result["metadata"]["sampleSize"], 3)
        self.assertGreaterEqual(result["statistics"]["fatigue"]["mean"], 0)

    def test_kmeans_is_deterministic(self):
        payload = {"observations": build_observations(15), "clusterCount": 3}
        first = analyze_payload(payload)["segmentation"]
        second = analyze_payload(payload)["segmentation"]
        self.assertEqual(first, second)

    def test_neural_probabilities_sum_to_one(self):
        result = analyze_payload({"observations": build_observations()})
        probabilities = result["neuralNetwork"]["probabilities"]
        self.assertAlmostEqual(sum(probabilities.values()), 1.0, places=6)
        self.assertFalse(result["neuralNetwork"]["validated"])


if __name__ == "__main__":
    unittest.main()
