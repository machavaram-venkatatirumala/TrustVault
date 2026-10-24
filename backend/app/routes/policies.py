from flask import Blueprint, request, jsonify, g
from ..security.authorization import admin_required, login_required
from ..services.policy_service import PolicyService

policies_bp = Blueprint("policies", __name__)


@policies_bp.route("/policies", methods=["GET"])
@login_required
def list_policies():
    policies = PolicyService.list_policies(organization_id=g.current_org.id)
    return jsonify({"policies": policies}), 200


@policies_bp.route("/policies", methods=["POST"])
@admin_required
def create_policy():
    data = request.get_json() or {}
    result = PolicyService.create_policy(
        organization_id=g.current_org.id,
        data=data,
        actor=g.current_user,
    )
    return jsonify(result), 201


@policies_bp.route("/policies/<policy_id>/toggle", methods=["PATCH"])
@admin_required
def toggle_policy(policy_id):
    data = request.get_json() or {}
    is_enabled = data.get("is_enabled", True)
    result = PolicyService.toggle_policy(
        policy_id=policy_id,
        organization_id=g.current_org.id,
        is_enabled=is_enabled,
        actor=g.current_user,
    )
    return jsonify(result), 200


@policies_bp.route("/policies/logs", methods=["GET"])
@admin_required
def list_policy_logs():
    limit = int(request.args.get("limit", 50))
    logs = PolicyService.get_execution_logs(organization_id=g.current_org.id, limit=limit)
    return jsonify({"logs": logs}), 200


@policies_bp.route("/policies/simulate", methods=["POST"])
@admin_required
def simulate_policy():
    context = request.get_json() or {}
    result = PolicyService.simulate(
        organization_id=g.current_org.id,
        context=context,
        actor=g.current_user,
    )
    return jsonify(result), 200


@policies_bp.route("/policies/run-maintenance", methods=["POST"])
@admin_required
def run_maintenance():
    result = PolicyService.run_maintenance(organization_id=g.current_org.id)
    return jsonify(result), 200
