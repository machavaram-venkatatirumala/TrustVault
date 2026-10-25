from flask import Blueprint, request, jsonify, g
from ..security.authorization import login_required
from ..services.access_explorer_service import AccessExplorerService
from ..models import Document, DocumentPermission

access_explorer_bp = Blueprint("access_explorer", __name__)


def _resolve_default_doc_id():
    is_admin = g.current_membership.role == "admin"
    if is_admin:
        doc = Document.query.filter_by(organization_id=g.current_org.id, status="active").first()
        return doc.id if doc else None
    
    # Non-admin: only select documents the user owns or has permission to
    own_doc = Document.query.filter_by(organization_id=g.current_org.id, owner_id=g.current_user.id, status="active").first()
    if own_doc:
        return own_doc.id

    perm = DocumentPermission.query.filter_by(recipient_user_id=g.current_user.id, organization_id=g.current_org.id, revoked_at=None).first()
    if perm and perm.is_active and perm.document and perm.document.status == "active":
        return perm.document_id

    return None


@access_explorer_bp.route("/documents/<document_id>/access-graph", methods=["GET"])
@login_required
def get_document_access_graph(document_id):
    is_admin = g.current_membership.role == "admin"
    result = AccessExplorerService.get_document_access_graph(
        document_id=document_id,
        organization_id=g.current_org.id,
        actor=g.current_user,
        is_admin=is_admin,
    )
    result["nodes"] = result["graph"]["nodes"]
    result["links"] = result["graph"]["links"]
    return jsonify(result), 200


@access_explorer_bp.route("/access-explorer/graph", methods=["GET"])
@login_required
def get_access_graph():
    is_admin = g.current_membership.role == "admin"
    document_id = request.args.get("document_id")
    if not document_id:
        document_id = _resolve_default_doc_id()
        if not document_id:
            return jsonify({"graph": {"nodes": [], "links": []}, "nodes": [], "links": [], "table": []}), 200

    result = AccessExplorerService.get_document_access_graph(
        document_id=document_id,
        organization_id=g.current_org.id,
        actor=g.current_user,
        is_admin=is_admin,
    )
    result["nodes"] = result["graph"]["nodes"]
    result["links"] = result["graph"]["links"]
    return jsonify(result), 200


@access_explorer_bp.route("/access-explorer/effective-permissions", methods=["GET"])
@login_required
def get_effective_permissions():
    is_admin = g.current_membership.role == "admin"
    document_id = request.args.get("document_id")
    if not document_id:
        document_id = _resolve_default_doc_id()
        if not document_id:
            return jsonify({"records": [], "total": 0}), 200

    result = AccessExplorerService.get_document_access_graph(
        document_id=document_id,
        organization_id=g.current_org.id,
        actor=g.current_user,
        is_admin=is_admin,
    )
    return jsonify({"records": result["table"], "total": len(result["table"])}), 200
