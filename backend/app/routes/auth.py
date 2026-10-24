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
    terms_accepted = bool(data.get("terms_accepted", False))
    terms_version = data.get("terms_version", "1.0")

    result = AuthService.register(
        full_name=full_name,
        email=email,
        password=password,
        org_name=org_name,
        terms_accepted=terms_accepted,
        terms_version=terms_version,
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


@auth_bp.route("/auth/profile", methods=["PATCH"])
@login_required
def update_profile():
    data = request.get_json() or {}
    full_name = data.get("full_name")
    theme_preference = data.get("theme_preference")

    result = AuthService.update_profile(
        user=g.current_user,
        full_name=full_name,
        theme_preference=theme_preference,
    )
    return jsonify(result), 200


@auth_bp.route("/auth/account", methods=["DELETE"])
@login_required
def delete_account():
    result = AuthService.delete_account(
        user=g.current_user,
        current_org=g.current_org,
    )
    return jsonify(result), 200


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


@auth_bp.route("/auth/forgot-password", methods=["POST"])
@limiter.limit("5 per minute")
def forgot_password():
    data = request.get_json() or {}
    email = data.get("email")
    result = AuthService.request_password_reset(email=email)
    return jsonify(result), 200


@auth_bp.route("/auth/reset-password", methods=["POST"])
@limiter.limit("5 per minute")
def reset_password():
    data = request.get_json() or {}
    token = data.get("token")
    new_password = data.get("new_password")
    result = AuthService.reset_password(token=token, new_password=new_password)
    return jsonify(result), 200
