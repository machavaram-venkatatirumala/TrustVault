from datetime import datetime
from sqlalchemy import or_

from ..extensions import db
from ..errors import APIError
from ..models import Document, DocumentPermission, OrganizationMembership, User, Organization
from .audit_service import AuditService


class PermissionService:
    """Manages document sharing grants, revocations, and recipient access boundaries."""

    @staticmethod
    def grant_permission(
        document_id: str,
        recipient_user_id: str,
        permission_level: str,
        expires_at: datetime = None,
        actor: User = None,
        organization: Organization = None,
        is_admin: bool = False,
    ) -> dict:
        document = Document.query.filter_by(id=document_id, status="active").first()
        if not document or document.organization_id != organization.id:
            raise APIError("Document not found.", status_code=404)

        if not is_admin and document.owner_id != actor.id:
            raise APIError("You are not authorized to share this document.", status_code=403)

        if permission_level not in ("view", "download"):
            raise APIError("Permission level must be either 'view' or 'download'.", status_code=400)

        if document.owner_id == recipient_user_id:
            raise APIError("Document owner already has full access to this document.", status_code=400)

        # Validate recipient belongs to the same organization and is active
        recipient_membership = OrganizationMembership.query.filter_by(
            organization_id=organization.id,
            user_id=recipient_user_id,
            status="active",
        ).first()

        if not recipient_membership:
            raise APIError("Recipient user is not an active member of this organization.", status_code=400)

        recipient_user = db.session.get(User, recipient_user_id)

        # Invalidate or reuse any existing active grant for this document & recipient
        now = datetime.utcnow()
        existing = DocumentPermission.query.filter(
            DocumentPermission.document_id == document.id,
            DocumentPermission.recipient_user_id == recipient_user_id,
            DocumentPermission.revoked_at.is_(None),
        ).first()

        if existing and existing.is_active:
            if existing.permission_level == permission_level and existing.expires_at == expires_at:
                return existing.to_dict()
            existing.revoked_at = now
            db.session.flush()

        permission = DocumentPermission(
            document_id=document.id,
            organization_id=organization.id,
            granted_by=actor.id,
            recipient_user_id=recipient_user_id,
            permission_level=permission_level,
            created_at=now,
            expires_at=expires_at,
            revoked_at=None,
        )
        db.session.add(permission)
        db.session.commit()

        AuditService.record(
            organization_id=organization.id,
            actor_user_id=actor.id,
            action="permission.grant",
            resource_type="permission",
            resource_id=permission.id,
            outcome="success",
            metadata={
                "document_id": document.id,
                "document_name": document.original_filename,
                "recipient_id": recipient_user_id,
                "recipient_email": recipient_user.email if recipient_user else None,
                "permission_level": permission_level,
                "expires_at": expires_at.isoformat() if expires_at else None,
            },
        )

        return permission.to_dict()

    @staticmethod
    def revoke_permission(
        permission_id: str,
        actor: User,
        organization: Organization,
        is_admin: bool = False,
    ) -> dict:
        permission = db.session.get(DocumentPermission, permission_id)
        if not permission or permission.organization_id != organization.id:
            raise APIError("Permission record not found.", status_code=404)

        document = permission.document
        if not is_admin and document.owner_id != actor.id and permission.granted_by != actor.id:
            raise APIError("You are not authorized to revoke this permission.", status_code=403)

        if permission.revoked_at:
            return {"message": "Permission has already been revoked.", "id": permission.id}

        permission.revoked_at = datetime.utcnow()
        db.session.commit()

        AuditService.record(
            organization_id=organization.id,
            actor_user_id=actor.id,
            action="permission.revoke",
            resource_type="permission",
            resource_id=permission.id,
            outcome="success",
            metadata={
                "document_id": document.id,
                "document_name": document.original_filename if document else None,
                "recipient_id": permission.recipient_user_id,
            },
        )

        return {"message": "Access permission revoked successfully.", "id": permission.id}

    @staticmethod
    def list_document_permissions(
        document_id: str,
        actor: User,
        organization: Organization,
        is_admin: bool = False,
    ) -> list:
        document = Document.query.filter_by(id=document_id, status="active").first()
        if not document or document.organization_id != organization.id:
            raise APIError("Document not found.", status_code=404)

        if not is_admin and document.owner_id != actor.id:
            raise APIError("You are not authorized to view permission grants for this document.", status_code=403)

        permissions = (
            DocumentPermission.query.filter_by(document_id=document.id)
            .order_by(DocumentPermission.created_at.desc())
            .all()
        )
        return [p.to_dict() for p in permissions]

    @staticmethod
    def list_shared_with_me(user_id: str, organization_id: str) -> list:
        now = datetime.utcnow()
        active_permissions = (
            DocumentPermission.query.join(Document)
            .filter(
                DocumentPermission.organization_id == organization_id,
                DocumentPermission.recipient_user_id == user_id,
                DocumentPermission.revoked_at.is_(None),
                Document.status == "active",
                or_(
                    DocumentPermission.expires_at.is_(None),
                    DocumentPermission.expires_at > now,
                ),
            )
            .order_by(DocumentPermission.created_at.desc())
            .all()
        )

        results = []
        for p in active_permissions:
            doc = p.document
            results.append({
                "permission_id": p.id,
                "document_id": doc.id,
                "document_name": doc.original_filename,
                "content_type": doc.content_type,
                "size_bytes": doc.size_bytes,
                "sha256_hash": doc.sha256_hash,
                "owner_name": doc.owner.full_name if doc.owner else "Unknown",
                "owner_email": doc.owner.email if doc.owner else None,
                "permission_level": p.permission_level,
                "shared_at": p.created_at.isoformat() if p.created_at else None,
                "expires_at": p.expires_at.isoformat() if p.expires_at else None,
                "can_download": p.permission_level == "download",
            })
        return results
