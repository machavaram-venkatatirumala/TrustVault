from flask import Blueprint, request, jsonify, g
from ..extensions import limiter
from ..security.authorization import login_required
from ..services.auth_service import AuthService
from ..errors import APIError

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/auth/register", methods=["POST"])
@limiter.limit("10 per minute")
def register():
    data = request.get_json() or {}
    full_name = data.get("full_name")
    email = data.get("email")
    password = data.get("password")
    org_name = data.get("org_name")

    result = AuthService.register(
        full_name=full_name,
        email=email,
        password=password,
        org_name=org_name,
    )
    return jsonify(result), 201


@auth_bp.route("/auth/login", methods=["POST"])
@limiter.limit("10 per minute")
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    result = AuthService.login(email=email, password=password)
    return jsonify(result), 200


@auth_bp.route("/auth/logout", methods=["POST"])
def logout():
    current_user = getattr(g, "current_user", None)
    current_org = getattr(g, "current_org", None)
    result = AuthService.logout(current_user=current_user, current_org=current_org)
    return jsonify(result), 200


@auth_bp.route("/auth/me", methods=["GET"])
@login_required
def get_me():
    return jsonify({
        "user": g.current_user.to_dict(),
        "organization": g.current_org.to_dict(),
        "role": g.current_membership.role,
    }), 200


@auth_bp.route("/auth/change-password", methods=["POST"])
@login_required
def change_password():
    data = request.get_json() or {}
    old_password = data.get("old_password")
    new_password = data.get("new_password")

    if not old_password or not new_password:
        raise APIError("Current password and new password are required.", status_code=400)

    result = AuthService.change_password(
        user=g.current_user,
        old_password=old_password,
        new_password=new_password,
        org_id=g.current_org.id,
    )
    return jsonify(result), 200
