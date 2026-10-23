from flask import Blueprint, request, jsonify, g
from ..security.authorization import login_required, admin_required
from ..services.member_service import MemberService
from ..errors import APIError

members_bp = Blueprint("members", __name__)


@members_bp.route("/members", methods=["GET"])
@login_required
def list_members():
    members = MemberService.list_members(organization_id=g.current_org.id)
    return jsonify({"members": members}), 200


@members_bp.route("/members/invite", methods=["POST"])
@admin_required
def invite_member():
    data = request.get_json() or {}
    email = data.get("email")
    full_name = data.get("full_name")
    role = data.get("role", "member")
    password = data.get("password")

    result = MemberService.invite_or_add_member(
        organization_id=g.current_org.id,
        email=email,
        full_name=full_name,
        role=role,
        password=password,
        actor=g.current_user,
    )
    return jsonify(result), 201


@members_bp.route("/members/<member_id>", methods=["PATCH"])
@admin_required
def update_member(member_id):
    data = request.get_json() or {}
    new_role = data.get("role")
    if not new_role:
        raise APIError("Role is required.", status_code=400)

    result = MemberService.update_role(
        member_id=member_id,
        new_role=new_role,
        actor=g.current_user,
        organization_id=g.current_org.id,
    )
    return jsonify(result), 200


@members_bp.route("/members/<member_id>", methods=["DELETE"])
@admin_required
def deactivate_member(member_id):
    result = MemberService.deactivate_member(
        member_id=member_id,
        actor=g.current_user,
        organization_id=g.current_org.id,
    )
    return jsonify(result), 200
