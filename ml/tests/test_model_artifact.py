import json
import unittest
from pathlib import Path

from ml.generate_demo_dataset import generate_rows


class ModelArtifactTests(unittest.TestCase):
    def test_demo_artifact_is_explicitly_unvalidated_and_synthetic(self):
        artifact_path = Path(__file__).parents[2] / "public" / "models" / "somnoguard-demo-model.json"
        artifact = json.loads(artifact_path.read_text(encoding="utf-8"))

        self.assertEqual(artifact["trainingSource"], "synthetic-demo")
        self.assertFalse(artifact["validated"])
        self.assertEqual(artifact["classes"], ["normal", "atencion", "peligro"])
        self.assertEqual(len(artifact["features"]), len(artifact["normalization"]["mean"]))
        self.assertEqual(len(artifact["features"]), len(artifact["normalization"]["std"]))
        self.assertTrue(artifact["layers"])

    def test_demo_dataset_is_deterministic_and_contains_no_pii(self):
        first = generate_rows(driver_count=3, windows_per_driver=6, seed=42)
        second = generate_rows(driver_count=3, windows_per_driver=6, seed=42)
        self.assertEqual(first, second)
        self.assertEqual(len(first), 18)
        self.assertTrue({row["targetClass"] for row in first}.issubset({"normal", "atencion", "peligro"}))
        self.assertTrue(all(row["dataSource"] == "synthetic-demo" for row in first))
        self.assertTrue(all("email" not in row and "name" not in row for row in first))


if __name__ == "__main__":
    unittest.main()
