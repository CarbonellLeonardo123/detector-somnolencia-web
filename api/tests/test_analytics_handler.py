import json
import unittest

from api.analytics import MAX_BODY_BYTES, process_json_request


class AnalyticsHttpBoundaryTests(unittest.TestCase):
    def test_accepts_valid_json_request(self):
        body = json.dumps(
            {
                "observations": [
                    {"elapsedMinutes": 0, "avgEAR": 0.3, "fatiguePct": 12},
                    {"elapsedMinutes": 1, "avgEAR": 0.25, "fatiguePct": 22},
                ]
            }
        ).encode("utf-8")
        status, payload = process_json_request("application/json; charset=utf-8", body)
        self.assertEqual(status, 200)
        self.assertEqual(payload["metadata"]["sampleSize"], 2)

    def test_rejects_wrong_content_type_invalid_json_and_large_body(self):
        status, _ = process_json_request("text/plain", b"{}")
        self.assertEqual(status, 415)

        status, _ = process_json_request("application/json", b"not-json")
        self.assertEqual(status, 400)

        status, _ = process_json_request("application/json", b"x" * (MAX_BODY_BYTES + 1))
        self.assertEqual(status, 413)


if __name__ == "__main__":
    unittest.main()
