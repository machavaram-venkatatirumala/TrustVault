from datetime import datetime
from flask import Blueprint, request, jsonify, g
from ..security.authorization import admin_required
from ..models import AuditLog
from ..errors import APIError

audit_bp = Blueprint("audit", __name__)


@audit_bp.route("/audit-events", methods=["GET"])
@admin_required
def list_audit_events():
    action = request.args.get("action")
    outcome = request.args.get("outcome")
    actor_id = request.args.get("actor_id")
    search = request.args.get("search")
    start_date_str = request.args.get("start_date")
    end_date_str = request.args.get("end_date")
    page = int(request.args.get("page", 1))
    per_page = min(int(request.args.get("per_page", 25)), 100)

    query = AuditLog.query.filter_by(organization_id=g.current_org.id)

    if action:
        query = query.filter(AuditLog.action == action)
    if outcome:
        query = query.filter(AuditLog.outcome == outcome)
    if actor_id:
        query = query.filter(AuditLog.actor_user_id == actor_id)

    if start_date_str:
        try:
            start_date = datetime.fromisoformat(start_date_str)
            query = query.filter(AuditLog.created_at >= start_date)
        except Exception:
            pass

    if end_date_str:
        try:
            end_date = datetime.fromisoformat(end_date_str)
            query = query.filter(AuditLog.created_at <= end_date)
        except Exception:
            pass

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            (AuditLog.action.ilike(search_term))
            | (AuditLog.resource_type.ilike(search_term))
            | (AuditLog.metadata_json.ilike(search_term))
        )

    total = query.count()
    events = (
        query.order_by(AuditLog.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return jsonify({
        "events": [e.to_dict() for e in events],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    }), 200


@audit_bp.route("/audit-events/<event_id>", methods=["GET"])
@admin_required
def get_audit_event(event_id):
    event = AuditLog.query.filter_by(
        id=event_id, organization_id=g.current_org.id
    ).first()
    if not event:
        raise APIError("Audit event not found.", status_code=404)
    return jsonify(event.to_dict()), 200


@audit_bp.route("/audit-events/verify-chain", methods=["GET"])
@admin_required
def verify_audit_chain():
    from ..services.audit_service import AuditService
    result = AuditService.verify_chain(organization_id=g.current_org.id)
    return jsonify(result), 200

