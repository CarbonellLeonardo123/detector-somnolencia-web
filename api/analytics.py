"""Vercel Python Function entry point for SomnoGuard analytics."""

from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler

try:
    from api.analytics_core import PayloadValidationError, analyze_payload
except ImportError:  # Vercel may import the source as a standalone module.
    from analytics_core import PayloadValidationError, analyze_payload


MAX_BODY_BYTES = 1_500_000


def process_json_request(content_type: str, body: bytes) -> tuple[int, dict]:
    """Validate the HTTP boundary and return a status/payload pair for tests and Vercel."""
    normalized_type = (content_type or "").split(";", 1)[0].strip().lower()
    if normalized_type != "application/json":
        return 415, {"error": "Content-Type debe ser application/json."}
    if not body:
        return 400, {"error": "El cuerpo JSON está vacío."}
    if len(body) > MAX_BODY_BYTES:
        return 413, {"error": "El cuerpo excede el límite permitido."}
    try:
        payload = json.loads(body.decode("utf-8"))
        return 200, analyze_payload(payload)
    except UnicodeDecodeError:
        return 400, {"error": "El cuerpo debe usar UTF-8."}
    except json.JSONDecodeError:
        return 400, {"error": "JSON inválido."}
    except PayloadValidationError as error:
        return 400, {"error": str(error)}


class handler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Allow", "POST, OPTIONS")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        self._send_json(
            200,
            {
                "service": "SomnoGuard Academic Analytics",
                "status": "ok",
                "method": "Use POST with aggregated metrics only.",
            },
        )

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self._send_json(400, {"error": "Content-Length inválido."})
            return
        if content_length <= 0:
            self._send_json(400, {"error": "El cuerpo JSON está vacío."})
            return
        if content_length > MAX_BODY_BYTES:
            self._send_json(413, {"error": "El cuerpo excede el límite permitido."})
            return

        try:
            raw_body = self.rfile.read(content_length)
            status, result = process_json_request(
                self.headers.get("Content-Type", ""),
                raw_body,
            )
        except Exception:
            self._send_json(500, {"error": "No se pudo calcular la analítica."})
            return

        self._send_json(status, result)

