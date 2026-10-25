from flask import Blueprint, request, jsonify, g
from ..security.authorization import login_required
from ..services.approval_service import ApprovalService

approvals_bp = Blueprint("approvals", __name__)


@approvals_bp.route("/approvals", methods=["GET"])
@login_required
def list_approvals():
    status = request.args.get("status")
    workflows = ApprovalService.list_workflows(
        organization_id=g.current_org.id,
        status=status,
    )
    return jsonify({"workflows": workflows}), 200


@approvals_bp.route("/approvals/submit", methods=["POST"])
@login_required
def submit_for_approval():
    data = request.get_json() or {}
    document_id = data.get("document_id")
    template_id = data.get("template_id")
    notes = data.get("notes")
    is_admin = g.current_membership.role == "admin"

    result = ApprovalService.submit_for_approval(
        document_id=document_id,
        organization_id=g.current_org.id,
        actor=g.current_user,
        template_id=template_id,
        submission_notes=notes,
        is_admin=is_admin,
    )
    return jsonify({"workflow": result, **result}), 201


@approvals_bp.route("/approvals/templates", methods=["GET"])
@login_required
def list_approval_templates():
    templates = ApprovalService.list_templates(organization_id=g.current_org.id)
    return jsonify({"templates": templates}), 200


@approvals_bp.route("/approvals/templates", methods=["POST"])
@login_required
def create_approval_template():
    data = request.get_json() or {}
    result = ApprovalService.create_template(
        organization_id=g.current_org.id,
        data=data,
        actor=g.current_user,
    )
    return jsonify(result), 201


@approvals_bp.route("/approvals/<workflow_id>/decide", methods=["POST"])
@approvals_bp.route("/approvals/<workflow_id>/decision", methods=["POST"])
@login_required
def decide_approval(workflow_id):
    data = request.get_json() or {}
    decision = data.get("decision")
    comment = data.get("comment")

    result = ApprovalService.render_decision(
        workflow_id=workflow_id,
        organization_id=g.current_org.id,
        actor=g.current_user,
        decision=decision,
        comment=comment,
    )
    return jsonify({"workflow": result, **result}), 200


@approvals_bp.route("/approvals/<workflow_id>/cancel", methods=["POST"])
@login_required
def cancel_approval(workflow_id):
    is_admin = g.current_membership.role == "admin"
    result = ApprovalService.cancel_workflow(
        workflow_id=workflow_id,
        organization_id=g.current_org.id,
        actor=g.current_user,
        is_admin=is_admin,
    )
    return jsonify(result), 200
