from flask import Blueprint, jsonify
from ..extensions import db
from ..storage import get_storage

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health_check():
    """Liveness probe endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "TrustVault API",
        "version": "1.0.0",
    }), 200


@health_bp.route("/ready", methods=["GET"])
def readiness_check():
    """Readiness probe checking database and storage dependencies."""
    db_status = "unavailable"
    storage_status = "unavailable"

    # Check database connectivity
    try:
        db.session.execute(db.text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "error"

    # Check storage provider accessibility
    try:
        storage = get_storage()
        if storage is not None:
            storage_status = "ready"
    except Exception:
        storage_status = "error"

    is_ready = db_status == "connected" and storage_status == "ready"
    status_code = 200 if is_ready else 503

    return jsonify({
        "status": "ready" if is_ready else "not_ready",
        "dependencies": {
            "database": db_status,
            "storage": storage_status,
        },
    }), status_code
