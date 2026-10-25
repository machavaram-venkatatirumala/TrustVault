from datetime import datetime
from flask import Blueprint, request, jsonify, g
from sqlalchemy import or_
from ..security.authorization import login_required
from ..models import Document, OrganizationMembership, AuditLog, DocumentPermission, User

search_bp = Blueprint("search", __name__)


@search_bp.route("/search", methods=["GET"])
@login_required
def global_search():
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify({"documents": [], "members": [], "audit": []}), 200

    search_term = f"%{q}%"
    org_id = g.current_org.id
    user_id = g.current_user.id
    is_admin = g.current_membership.role == "admin"

    # 1. Search authorized documents
    doc_query = Document.query.filter(
        Document.organization_id == org_id,
        Document.status == "active",
        Document.original_filename.ilike(search_term),
    )
    if not is_admin:
        now = datetime.utcnow()
        # Non-admins see documents they own or have permission to
        doc_query = doc_query.filter(
            or_(
                Document.owner_id == user_id,
                Document.id.in_(
                    DocumentPermission.query.with_entities(DocumentPermission.document_id).filter(
                        DocumentPermission.recipient_user_id == user_id,
                        DocumentPermission.organization_id == org_id,
                        DocumentPermission.revoked_at.is_(None),
                        or_(
                            DocumentPermission.expires_at.is_(None),
                            DocumentPermission.expires_at > now,
                        ),
                    )
                ),
            )
        )
    matched_docs = doc_query.limit(8).all()
    documents_res = [
        {
            "id": d.id,
            "title": d.original_filename,
            "subtitle": f"{round(d.size_bytes / 1024, 1)} KB • {d.content_type}",
            "type": "document",
            "url": f"/app/documents/{d.id}",
        }
        for d in matched_docs
    ]

    # 2. Search members (admin only)
    members_res = []
    if is_admin:
        members = (
            OrganizationMembership.query.join(User, OrganizationMembership.user_id == User.id)
            .filter(
                OrganizationMembership.organization_id == org_id,
                OrganizationMembership.status == "active",
                or_(
                    User.full_name.ilike(search_term),
                    User.email.ilike(search_term),
                ),
            )
            .limit(5)
            .all()
        )
        members_res = [
            {
                "id": m.id,
                "title": m.user.full_name,
                "subtitle": f"{m.user.email} • {m.role}",
                "type": "member",
                "url": "/app/members",
            }
            for m in members
        ]

    # 3. Search audit events (admin only)
    audit_res = []
    if is_admin:
        events = (
            AuditLog.query.filter(
                AuditLog.organization_id == org_id,
                or_(
                    AuditLog.action.ilike(search_term),
                    AuditLog.resource_type.ilike(search_term),
                    AuditLog.metadata_json.ilike(search_term),
                ),
            )
            .order_by(AuditLog.created_at.desc())
            .limit(5)
            .all()
        )
        audit_res = [
            {
                "id": e.id,
                "title": e.action.replace("_", " ").title(),
                "subtitle": f"{e.outcome.upper()} • {e.created_at.strftime('%b %d, %H:%M')}",
                "type": "audit",
                "url": "/app/audit",
            }
            for e in events
        ]

    return jsonify({
        "query": q,
        "documents": documents_res,
        "members": members_res,
        "audit": audit_res,
    }), 200
