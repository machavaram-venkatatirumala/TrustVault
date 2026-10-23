from flask import Blueprint, request, jsonify, g
from ..extensions import db
from ..security.authorization import login_required, admin_required
from ..services.audit_service import AuditService
from ..errors import APIError

org_bp = Blueprint("organization", __name__)


@org_bp.route("/organization", methods=["GET"])
@login_required
def get_organization():
    return jsonify({
        "organization": g.current_org.to_dict(),
        "current_user_role": g.current_membership.role,
    }), 200


@org_bp.route("/organization", methods=["PATCH"])
@admin_required
def update_organization():
    data = request.get_json() or {}
    name = data.get("name", "").strip()

    if not name:
        raise APIError("Organization name cannot be empty.", status_code=400)

    old_name = g.current_org.name
    g.current_org.name = name
    db.session.commit()

    AuditService.record(
        organization_id=g.current_org.id,
        actor_user_id=g.current_user.id,
        action="organization.update",
        resource_type="organization",
        resource_id=g.current_org.id,
        outcome="success",
        metadata={"old_name": old_name, "new_name": name},
    )

    return jsonify({"organization": g.current_org.to_dict()}), 200
