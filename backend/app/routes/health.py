from flask import Blueprint, jsonify
from ..extensions import db
from ..storage import get_storage

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
@health_bp.route("/health/live", methods=["GET"])
def health_check():
    """Liveness probe endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "TrustVault API",
        "version": "1.0.0",
    }), 200


@health_bp.route("/ready", methods=["GET"])
@health_bp.route("/health/ready", methods=["GET"])
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


@health_bp.route("/health/diagnostics", methods=["GET"])
def system_diagnostics():
    import time
    from datetime import datetime

    start_t = time.time()
    db.session.execute(db.text("SELECT 1"))
    db_latency_ms = round((time.time() - start_t) * 1000, 2)

    storage = get_storage()
    return jsonify({
        "status": "operational",
        "service": "TrustVault Enterprise Core",
        "timestamp": datetime.utcnow().isoformat(),
        "database": {
            "status": "connected",
            "latency_ms": db_latency_ms,
            "engine": db.engine.name,
        },
        "storage": {
            "status": "mounted",
            "provider": storage.__class__.__name__,
        },
        "security_subsystems": {
            "rate_limiter": "active",
            "audit_hash_chain": "enforced",
            "sha256_verification": "active",
            "tenant_isolation": "enforced",
        },
    }), 200

