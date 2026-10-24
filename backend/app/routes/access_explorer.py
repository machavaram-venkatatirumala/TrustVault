from flask import Blueprint, request, jsonify, g
from ..security.authorization import login_required
from ..services.access_explorer_service import AccessExplorerService
from ..models import Document

access_explorer_bp = Blueprint("access_explorer", __name__)


@access_explorer_bp.route("/documents/<document_id>/access-graph", methods=["GET"])
@login_required
def get_document_access_graph(document_id):
    result = AccessExplorerService.get_document_access_graph(
        document_id=document_id,
        organization_id=g.current_org.id,
        actor=g.current_user,
    )
    result["nodes"] = result["graph"]["nodes"]
    result["links"] = result["graph"]["links"]
    return jsonify(result), 200


@access_explorer_bp.route("/access-explorer/graph", methods=["GET"])
@login_required
def get_access_graph():
    document_id = request.args.get("document_id")
    if not document_id:
        doc = Document.query.filter_by(organization_id=g.current_org.id, status="active").first()
        if doc:
            document_id = doc.id
        else:
            return jsonify({"graph": {"nodes": [], "links": []}, "nodes": [], "links": [], "table": []}), 200

    result = AccessExplorerService.get_document_access_graph(
        document_id=document_id,
        organization_id=g.current_org.id,
        actor=g.current_user,
    )
    result["nodes"] = result["graph"]["nodes"]
    result["links"] = result["graph"]["links"]
    return jsonify(result), 200


@access_explorer_bp.route("/access-explorer/effective-permissions", methods=["GET"])
@login_required
def get_effective_permissions():
    document_id = request.args.get("document_id")
    if not document_id:
        doc = Document.query.filter_by(organization_id=g.current_org.id, status="active").first()
        if doc:
            document_id = doc.id
        else:
            return jsonify({"records": [], "total": 0}), 200

    result = AccessExplorerService.get_document_access_graph(
        document_id=document_id,
        organization_id=g.current_org.id,
        actor=g.current_user,
    )
    return jsonify({"records": result["table"], "total": len(result["table"])}), 200
