from datetime import datetime
from flask import Blueprint, request, jsonify, g
from ..security.authorization import login_required
from ..services.permission_service import PermissionService
from ..errors import APIError

permissions_bp = Blueprint("permissions", __name__)


@permissions_bp.route("/documents/<document_id>/permissions", methods=["GET"])
@login_required
def list_permissions(document_id):
    is_admin = g.current_membership.role == "admin"
    permissions = PermissionService.list_document_permissions(
        document_id=document_id,
        actor=g.current_user,
        organization=g.current_org,
        is_admin=is_admin,
    )
    return jsonify({"permissions": permissions}), 200


@permissions_bp.route("/documents/<document_id>/permissions", methods=["POST"])
@login_required
def grant_permission(document_id):
    data = request.get_json() or {}
    recipient_user_id = data.get("recipient_user_id")
    permission_level = data.get("permission_level", "view")
    expires_at_str = data.get("expires_at")

    if not recipient_user_id:
        raise APIError("Recipient user ID is required.", status_code=400)

    expires_at = None
    if expires_at_str:
        try:
            expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
        except Exception:
            raise APIError("Invalid ISO date format for expires_at.", status_code=400)

    is_admin = g.current_membership.role == "admin"
    result = PermissionService.grant_permission(
        document_id=document_id,
        recipient_user_id=recipient_user_id,
        permission_level=permission_level,
        expires_at=expires_at,
        actor=g.current_user,
        organization=g.current_org,
        is_admin=is_admin,
    )
    return jsonify(result), 201


@permissions_bp.route("/permissions/<permission_id>", methods=["DELETE"])
@login_required
def revoke_permission(permission_id):
    is_admin = g.current_membership.role == "admin"
    result = PermissionService.revoke_permission(
        permission_id=permission_id,
        actor=g.current_user,
        organization=g.current_org,
        is_admin=is_admin,
    )
    return jsonify(result), 200


@permissions_bp.route("/shared-with-me", methods=["GET"])
@login_required
def shared_with_me():
    shared_docs = PermissionService.list_shared_with_me(
        user_id=g.current_user.id,
        organization_id=g.current_org.id,
    )
    return jsonify({"documents": shared_docs}), 200
