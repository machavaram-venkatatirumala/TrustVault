import io
from flask import Blueprint, request, jsonify, g, send_file
from ..security.authorization import login_required
from ..services.document_service import DocumentService
from ..storage import get_storage
from ..errors import APIError

documents_bp = Blueprint("documents", __name__)


@documents_bp.route("/documents", methods=["GET"])
@login_required
def list_documents():
    search = request.args.get("search")
    file_type = request.args.get("file_type")
    owner_filter = request.args.get("owner_id")
    page = int(request.args.get("page", 1))
    per_page = min(int(request.args.get("per_page", 20)), 100)

    is_admin = g.current_membership.role == "admin"
    result = DocumentService.list_documents(
        organization_id=g.current_org.id,
        user_id=g.current_user.id,
        is_admin=is_admin,
        search=search,
        file_type=file_type,
        owner_filter=owner_filter,
        page=page,
        per_page=per_page,
    )
    return jsonify(result), 200


@documents_bp.route("/documents", methods=["POST"])
@login_required
def upload_document():
    if "file" not in request.files:
        raise APIError("No file part provided in request.", status_code=400)

    file_obj = request.files["file"]
    idempotency_key = request.headers.get("X-Idempotency-Key") or request.form.get("idempotency_key")
    result = DocumentService.upload_document(
        file_obj=file_obj,
        user=g.current_user,
        organization=g.current_org,
        idempotency_key=idempotency_key,
    )
    return jsonify(result), 201


@documents_bp.route("/documents/<document_id>", methods=["GET"])
@login_required
def get_document(document_id):
    is_admin = g.current_membership.role == "admin"
    doc = DocumentService.get_document(
        document_id=document_id,
        user=g.current_user,
        organization=g.current_org,
        is_admin=is_admin,
    )
    return jsonify(doc.to_dict(include_permissions=True)), 200


@documents_bp.route("/documents/<document_id>", methods=["PATCH"])
@login_required
def rename_document(document_id):
    data = request.get_json() or {}
    new_filename = data.get("filename") or data.get("original_filename")
    if not new_filename:
        raise APIError("New filename is required.", status_code=400)

    is_admin = g.current_membership.role == "admin"
    result = DocumentService.rename_document(
        document_id=document_id,
        new_filename=new_filename,
        user=g.current_user,
        organization=g.current_org,
        is_admin=is_admin,
    )
    return jsonify(result), 200


@documents_bp.route("/documents/<document_id>/download", methods=["GET"])
@login_required
def download_document(document_id):
    is_admin = g.current_membership.role == "admin"
    stream, filename, content_type = DocumentService.download_document(
        document_id=document_id,
        user=g.current_user,
        organization=g.current_org,
        is_admin=is_admin,
    )

    return send_file(
        stream,
        mimetype=content_type,
        as_attachment=True,
        download_name=filename,
    )


@documents_bp.route("/documents/<document_id>/verify-integrity", methods=["POST"])
@login_required
def verify_integrity(document_id):
    is_admin = g.current_membership.role == "admin"
    result = DocumentService.verify_integrity(
        document_id=document_id,
        user=g.current_user,
        organization=g.current_org,
        is_admin=is_admin,
    )
    return jsonify(result), 200


@documents_bp.route("/documents/<document_id>", methods=["DELETE"])
@login_required
def delete_document(document_id):
    is_admin = g.current_membership.role == "admin"
    result = DocumentService.delete_document(
        document_id=document_id,
        user=g.current_user,
        organization=g.current_org,
        is_admin=is_admin,
    )
    return jsonify(result), 200


@documents_bp.route("/documents/<document_id>/simulate-tamper", methods=["POST"])
@login_required
def simulate_tamper(document_id):
    """
    Demo / Interview Tool: Intentionally alters 1 byte in the stored private file
    so the user can immediately demonstrate the SHA-256 mismatch detection in action!
    """
    is_admin = g.current_membership.role == "admin"
    doc = DocumentService.get_document(
        document_id=document_id,
        user=g.current_user,
        organization=g.current_org,
        is_admin=is_admin,
    )

    storage = get_storage()
    if not storage.exists(doc.storage_key):
        raise APIError("Storage object not found.", status_code=404)

    # Read bytes and alter byte at position 0
    raw_bytes = bytearray(storage.get_bytes(doc.storage_key))
    if len(raw_bytes) > 0:
        raw_bytes[0] ^= 0xFF  # Flip bits
        storage.save(doc.storage_key, io.BytesIO(raw_bytes))

    return jsonify({
        "message": "File byte altered in storage. Run integrity verification to observe cryptographic mismatch.",
        "document_id": doc.id,
    }), 200
