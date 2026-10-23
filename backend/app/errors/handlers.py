from flask import jsonify, request
import logging

logger = logging.getLogger(__name__)


class APIError(Exception):
    """Custom application error with specific HTTP status code."""

    def __init__(self, message: str, status_code: int = 400, details: dict = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}


def register_error_handlers(app):
    """Registers standard RESTful JSON error handlers for the application."""

    @app.errorhandler(APIError)
    def handle_api_error(error):
        response = {
            "error": {
                "message": error.message,
                "status": error.status_code,
                "details": error.details,
            }
        }
        return jsonify(response), error.status_code

    @app.errorhandler(400)
    def handle_bad_request(error):
        return (
            jsonify({"error": {"message": getattr(error, "description", "Bad request"), "status": 400}}),
            400,
        )

    @app.errorhandler(401)
    def handle_unauthorized(error):
        return (
            jsonify({"error": {"message": getattr(error, "description", "Authentication required"), "status": 401}}),
            401,
        )

    @app.errorhandler(403)
    def handle_forbidden(error):
        return (
            jsonify({"error": {"message": getattr(error, "description", "Access denied"), "status": 403}}),
            403,
        )

    @app.errorhandler(404)
    def handle_not_found(error):
        return (
            jsonify({"error": {"message": getattr(error, "description", "Resource not found"), "status": 404}}),
            404,
        )

    @app.errorhandler(413)
    def handle_file_too_large(error):
        return (
            jsonify({"error": {"message": "Uploaded file exceeds maximum permitted size", "status": 413}}),
            413,
        )

    @app.errorhandler(429)
    def handle_rate_limit(error):
        return (
            jsonify({"error": {"message": "Too many requests. Please try again later.", "status": 429}}),
            429,
        )

    @app.errorhandler(500)
    def handle_server_error(error):
        logger.error(f"Internal server error: {error}", exc_info=True)
        return (
            jsonify({"error": {"message": "An internal server error occurred", "status": 500}}),
            500,
        )
