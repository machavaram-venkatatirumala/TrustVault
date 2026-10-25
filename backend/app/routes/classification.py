from flask import Blueprint, request, jsonify, g
from ..security.authorization import login_required
from ..services.classification_service import ClassificationService

classification_bp = Blueprint("classification", __name__)


@classification_bp.route("/documents/<document_id>/classification", methods=["GET"])
@login_required
def get_classification(document_id):
    from ..models import Document, DocumentPermission
    is_admin = g.current_membership.role == "admin"
    document = Document.query.filter_by(
        id=document_id, organization_id=g.current_org.id, status="active"
    ).first()
    if not document:
        return jsonify({"error": {"message": "Document not found."}}), 404

    if not is_admin and document.owner_id != g.current_user.id:
        active_perm = DocumentPermission.query.filter_by(
            document_id=document.id,
            recipient_user_id=g.current_user.id,
            revoked_at=None,
        ).first()
        if not (active_perm and active_perm.is_active):
            return jsonify({"error": {"message": "Access denied."}}), 403

    return jsonify({
        "document_id": document.id,
        "classification": getattr(document, "classification", "Internal") or "Internal",
    }), 200


@classification_bp.route("/documents/<document_id>/classification", methods=["PATCH"])
@login_required
def update_classification(document_id):
    data = request.get_json() or {}
    new_classification = data.get("classification")
    reason = data.get("reason")
    is_admin = g.current_membership.role == "admin"

    result = ClassificationService.update_classification(
        document_id=document_id,
        organization_id=g.current_org.id,
        new_classification=new_classification,
        actor=g.current_user,
        reason=reason,
        is_admin=is_admin,
    )
    return jsonify(result), 200


@classification_bp.route("/documents/<document_id>/classification/history", methods=["GET"])
@login_required
def get_classification_history(document_id):
    is_admin = g.current_membership.role == "admin"
    history = ClassificationService.get_history(
        document_id=document_id,
        organization_id=g.current_org.id,
        actor=g.current_user,
        is_admin=is_admin,
    )
    return jsonify({"history": history}), 200
