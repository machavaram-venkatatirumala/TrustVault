from flask import Blueprint, request, jsonify, g
from ..security.authorization import login_required
from ..services.classification_service import ClassificationService

classification_bp = Blueprint("classification", __name__)


@classification_bp.route("/documents/<document_id>/classification", methods=["GET"])
@login_required
def get_classification(document_id):
    from ..models import Document
    document = Document.query.filter_by(
        id=document_id, organization_id=g.current_org.id, status="active"
    ).first()
    if not document:
        return jsonify({"error": {"message": "Document not found."}}), 404
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

    result = ClassificationService.update_classification(
        document_id=document_id,
        organization_id=g.current_org.id,
        new_classification=new_classification,
        actor=g.current_user,
        reason=reason,
    )
    return jsonify(result), 200


@classification_bp.route("/documents/<document_id>/classification/history", methods=["GET"])
@login_required
def get_classification_history(document_id):
    history = ClassificationService.get_history(
        document_id=document_id,
        organization_id=g.current_org.id,
    )
    return jsonify({"history": history}), 200
