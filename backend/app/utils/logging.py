import logging
import uuid
from flask import g, request, has_request_context


class RequestIdFilter(logging.Filter):
    """Injects request_id and client_ip into log records when inside a request context."""

    def filter(self, record):
        if has_request_context():
            record.request_id = getattr(g, "request_id", "-")
            record.ip = request.remote_addr or "-"
        else:
            record.request_id = "-"
            record.ip = "-"
        return True


def setup_logging(app):
    """Sets up application-wide structured logging."""
    log_level = logging.DEBUG if app.debug else logging.INFO
    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [req:%(request_id)s] %(name)s: %(message)s"
    )

    handler = logging.StreamHandler()
    handler.setLevel(log_level)
    handler.setFormatter(formatter)
    handler.addFilter(RequestIdFilter())

    app.logger.handlers.clear()
    app.logger.addHandler(handler)
    app.logger.setLevel(log_level)
    app.logger.propagate = False

    @app.before_request
    def set_request_context():
        g.request_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:8])

    @app.after_request
    def append_request_headers(response):
        response.headers["X-Request-ID"] = getattr(g, "request_id", "")
        # Standard enterprise security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response
