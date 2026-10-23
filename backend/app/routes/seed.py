import io
import uuid
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, current_app
from ..extensions import db
from ..models import User, Organization, OrganizationMembership, Document, DocumentPermission, AuditLog
from ..security.hashing import hash_password
from ..security.sanitization import generate_opaque_storage_key
from ..storage import get_storage
from ..utils.crypto import calculate_sha256_bytes

seed_bp = Blueprint("seed", __name__)


@seed_bp.route("/seed", methods=["POST"])
def seed_database():
    """
    Development-only seed endpoint that sets up 'Northstar Advisory'
    with realistic users, authentic files, calculated SHA-256 digests,
    permission grants, and complete audit trail.
    """
    if not current_app.debug and not current_app.testing and current_app.config.get("FLASK_ENV") == "production":
        return jsonify({"error": "Seed endpoint is disabled in production."}), 403

    storage = get_storage()

    # 1. Create or retrieve Northstar Advisory organization
    org = Organization.query.filter_by(slug="northstar-advisory").first()
    if not org:
        org = Organization(id=str(uuid.uuid4()), name="Northstar Advisory", slug="northstar-advisory")
        db.session.add(org)
        db.session.flush()

    default_pw = "Password123!"
    hashed_pw = hash_password(default_pw)

    # 2. Seed Users
    users_data = [
        {"name": "Avery Morgan", "email": "avery.morgan@northstar.example", "role": "admin"},
        {"name": "Jordan Lee", "email": "jordan.lee@northstar.example", "role": "member"},
        {"name": "Taylor Brooks", "email": "taylor.brooks@northstar.example", "role": "member"},
    ]

    user_map = {}
    for ud in users_data:
        user = User.query.filter_by(email=ud["email"]).first()
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                full_name=ud["name"],
                email=ud["email"],
                password_hash=hashed_pw,
                is_active=True,
                last_login_at=datetime.utcnow() - timedelta(hours=2),
            )
            db.session.add(user)
            db.session.flush()

        # Add or update membership
        membership = OrganizationMembership.query.filter_by(
            organization_id=org.id, user_id=user.id
        ).first()
        if not membership:
            membership = OrganizationMembership(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                user_id=user.id,
                role=ud["role"],
                status="active",
                joined_at=datetime.utcnow() - timedelta(days=14),
            )
            db.session.add(membership)

        user_map[ud["email"]] = user

    admin_user = user_map["avery.morgan@northstar.example"]
    member_user = user_map["jordan.lee@northstar.example"]
    member_user2 = user_map["taylor.brooks@northstar.example"]

    # 3. Seed Realistic Documents
    sample_files = [
        {
            "filename": "Client Proposal.pdf",
            "content": b"%PDF-1.4\n1 0 obj\n<< /Title (Northstar Advisory Client Proposal) /Author (Avery Morgan) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\nConfidential Client Strategic Advisory & Governance Proposal 2026",
            "type": "application/pdf",
            "days_ago": 6,
        },
        {
            "filename": "Financial Summary.xlsx",
            "content": b"PK\x03\x04\x14\x00\x00\x00\x08\x00Northstar Q3 Financial Statements, Cash Flow, and Projections [CONFIDENTIAL ENTERPRISE AUDIT]",
            "type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "days_ago": 4,
        },
        {
            "filename": "Project Brief.docx",
            "content": b"PK\x03\x04\x14\x00\x00\x00\x08\x00Enterprise Infrastructure Security Hardening Project Brief and Milestones",
            "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "days_ago": 3,
        },
        {
            "filename": "Vendor Security Assessment.pdf",
            "content": b"%PDF-1.4\n1 0 obj\n<< /Title (Vendor Security Assessment) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\nSOC2 Type II and ISO 27001 Vendor Audit Findings & Remediation Plan",
            "type": "application/pdf",
            "days_ago": 2,
        },
        {
            "filename": "Compliance Review.xlsx",
            "content": b"PK\x03\x04\x14\x00\x00\x00\x08\x00Regulatory Compliance Checklist, GDPR Records of Processing, RLS Verification Log",
            "type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "days_ago": 1,
        },
    ]

    seeded_docs = []
    for f in sample_files:
        existing_doc = Document.query.filter_by(
            organization_id=org.id, original_filename=f["filename"], status="active"
        ).first()

        if not existing_doc:
            doc_id = str(uuid.uuid4())
            file_bytes = f["content"]
            sha256 = calculate_sha256_bytes(file_bytes)
            storage_key = generate_opaque_storage_key(org.id, doc_id)

            # Save in storage
            storage.save(storage_key, io.BytesIO(file_bytes))

            created_time = datetime.utcnow() - timedelta(days=f["days_ago"])
            doc = Document(
                id=doc_id,
                organization_id=org.id,
                owner_id=admin_user.id,
                original_filename=f["filename"],
                storage_key=storage_key,
                content_type=f["type"],
                size_bytes=len(file_bytes),
                sha256_hash=sha256,
                status="active",
                last_verified_at=created_time + timedelta(hours=1),
                last_verification_status="verified",
                created_at=created_time,
                updated_at=created_time,
            )
            db.session.add(doc)
            db.session.flush()
            seeded_docs.append(doc)

            # Record upload audit log
            db.session.add(
                AuditLog(
                    organization_id=org.id,
                    actor_user_id=admin_user.id,
                    action="document.upload",
                    resource_type="document",
                    resource_id=doc.id,
                    outcome="success",
                    metadata_json=f'{{"filename": "{f["filename"]}", "size_bytes": {len(file_bytes)}, "sha256": "{sha256}"}}',
                    created_at=created_time,
                )
            )

    db.session.commit()

    # 4. Seed Permissions
    all_docs = Document.query.filter_by(organization_id=org.id, status="active").all()
    if len(all_docs) >= 2:
        # Grant Jordan view on doc 0
        p1 = DocumentPermission.query.filter_by(
            document_id=all_docs[0].id, recipient_user_id=member_user.id
        ).first()
        if not p1:
            p1 = DocumentPermission(
                document_id=all_docs[0].id,
                organization_id=org.id,
                granted_by=admin_user.id,
                recipient_user_id=member_user.id,
                permission_level="view",
                created_at=datetime.utcnow() - timedelta(days=3),
            )
            db.session.add(p1)
            db.session.add(
                AuditLog(
                    organization_id=org.id,
                    actor_user_id=admin_user.id,
                    action="permission.grant",
                    resource_type="permission",
                    resource_id=p1.id,
                    outcome="success",
                    metadata_json=f'{{"document_name": "{all_docs[0].original_filename}", "recipient": "{member_user.email}", "permission_level": "view"}}',
                    created_at=datetime.utcnow() - timedelta(days=3),
                )
            )

        # Grant Taylor download on doc 1
        p2 = DocumentPermission.query.filter_by(
            document_id=all_docs[1].id, recipient_user_id=member_user2.id
        ).first()
        if not p2:
            p2 = DocumentPermission(
                document_id=all_docs[1].id,
                organization_id=org.id,
                granted_by=admin_user.id,
                recipient_user_id=member_user2.id,
                permission_level="download",
                created_at=datetime.utcnow() - timedelta(days=2),
            )
            db.session.add(p2)
            db.session.add(
                AuditLog(
                    organization_id=org.id,
                    actor_user_id=admin_user.id,
                    action="permission.grant",
                    resource_type="permission",
                    resource_id=p2.id,
                    outcome="success",
                    metadata_json=f'{{"document_name": "{all_docs[1].original_filename}", "recipient": "{member_user2.email}", "permission_level": "download"}}',
                    created_at=datetime.utcnow() - timedelta(days=2),
                )
            )

    db.session.commit()

    return jsonify({
        "message": "Demo data successfully seeded for Northstar Advisory.",
        "organization": org.to_dict(),
        "credentials": {
            "admin": {"email": "avery.morgan@northstar.example", "password": default_pw, "role": "admin"},
            "member_1": {"email": "jordan.lee@northstar.example", "password": default_pw, "role": "member"},
            "member_2": {"email": "taylor.brooks@northstar.example", "password": default_pw, "role": "member"},
        },
        "document_count": len(all_docs),
    }), 200
