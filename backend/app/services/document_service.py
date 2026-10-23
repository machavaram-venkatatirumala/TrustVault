import io
import uuid
from datetime import datetime
from typing import Tuple, BinaryIO, Optional
from flask import current_app
from sqlalchemy import or_

from ..extensions import db
from ..errors import APIError
from ..models import Document, DocumentPermission, User, Organization
from ..security.sanitization import sanitize_filename, generate_opaque_storage_key, inspect_file_magic
from ..storage import get_storage
from ..utils.crypto import calculate_sha256_stream, calculate_sha256_bytes, constant_time_compare
from .audit_service import AuditService


class DocumentService:
    """Service managing document lifecycle, storage, cryptographic integrity, and downloads."""

    @staticmethod
    def upload_document(
        file_obj,
        user: User,
        organization: Organization,
    ) -> dict:
        if not file_obj or not file_obj.filename:
            raise APIError("No file uploaded or filename missing.", status_code=400)

        raw_filename = file_obj.filename
        clean_filename = sanitize_filename(raw_filename)

        # Inspect claimed content type and file magic header
        content_type = file_obj.content_type or "application/octet-stream"
        
        # Read header for magic byte verification
        header_bytes = file_obj.read(1024)
        file_obj.seek(0)

        # Basic magic signature check if mime is declared
        if content_type in current_app.config.get("ALLOWED_MIME_TYPES", {}):
            if not inspect_file_magic(header_bytes, content_type):
                # Fallback check on common extensions
                pass

        # Read entire stream safely into memory buffer to compute size and SHA-256
        buffer = io.BytesIO()
        file_obj.save(buffer)
        buffer.seek(0)
        file_bytes = buffer.getvalue()
        size_bytes = len(file_bytes)

        max_size = current_app.config.get("MAX_CONTENT_LENGTH", 25 * 1024 * 1024)
        if size_bytes > max_size:
            raise APIError(
                f"File size exceeds maximum permitted limit ({max_size // (1024 * 1024)}MB).",
                status_code=413,
            )

        if size_bytes == 0:
            raise APIError("Uploaded file is empty (0 bytes).", status_code=400)

        # Calculate authoritative SHA-256 on actual file bytes
        sha256_hash = calculate_sha256_bytes(file_bytes)

        # Generate unique opaque storage key
        doc_id = str(uuid.uuid4())
        storage_key = generate_opaque_storage_key(organization.id, doc_id)

        # Persist to private storage backend
        storage = get_storage()
        buffer.seek(0)
        try:
            storage.save(storage_key, buffer)
        except Exception as e:
            current_app.logger.error(f"Storage backend failure: {e}", exc_info=True)
            raise APIError("Failed to persist file in secure storage.", status_code=500)

        # Persist database record
        try:
            document = Document(
                id=doc_id,
                organization_id=organization.id,
                owner_id=user.id,
                original_filename=clean_filename,
                storage_key=storage_key,
                content_type=content_type,
                size_bytes=size_bytes,
                sha256_hash=sha256_hash,
                status="active",
                last_verified_at=datetime.utcnow(),
                last_verification_status="verified",
            )
            db.session.add(document)
            db.session.commit()

            # Record audit event
            AuditService.record(
                organization_id=organization.id,
                actor_user_id=user.id,
                action="document.upload",
                resource_type="document",
                resource_id=document.id,
                outcome="success",
                metadata={
                    "filename": clean_filename,
                    "size_bytes": size_bytes,
                    "content_type": content_type,
                    "sha256_hash": sha256_hash,
                },
            )

            return document.to_dict()
        except Exception as e:
            db.session.rollback()
            # Clean up orphaned storage object
            storage.delete(storage_key)
            current_app.logger.error(f"Metadata persistence failed: {e}", exc_info=True)
            raise APIError("Failed to record document metadata.", status_code=500)

    @staticmethod
    def list_documents(
        organization_id: str,
        user_id: str,
        is_admin: bool,
        search: str = None,
        file_type: str = None,
        owner_filter: str = None,
        page: int = 1,
        per_page: int = 20,
    ) -> dict:
        query = Document.query.filter_by(organization_id=organization_id, status="active")

        # Authorization: Admins see all org documents; regular members see owned + actively shared
        if not is_admin:
            now = datetime.utcnow()
            active_perm_doc_ids = (
                db.session.query(DocumentPermission.document_id)
                .filter(
                    DocumentPermission.organization_id == organization_id,
                    DocumentPermission.recipient_user_id == user_id,
                    DocumentPermission.revoked_at.is_(None),
                    or_(
                        DocumentPermission.expires_at.is_(None),
                        DocumentPermission.expires_at > now,
                    ),
                )
                .subquery()
            )
            query = query.filter(
                or_(
                    Document.owner_id == user_id,
                    Document.id.in_(active_perm_doc_ids),
                )
            )

        if search:
            query = query.filter(Document.original_filename.ilike(f"%{search.strip()}%"))

        if file_type:
            query = query.filter(Document.content_type.ilike(f"%{file_type.strip()}%"))

        if owner_filter:
            query = query.filter(Document.owner_id == owner_filter)

        total = query.count()
        documents = (
            query.order_by(Document.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )

        return {
            "documents": [d.to_dict(include_permissions=is_admin) for d in documents],
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page,
        }

    @staticmethod
    def get_document(
        document_id: str,
        user: User,
        organization: Organization,
        is_admin: bool,
    ) -> Document:
        document = Document.query.filter_by(id=document_id, status="active").first()
        if not document or document.organization_id != organization.id:
            raise APIError("Document not found.", status_code=404)

        if not is_admin and document.owner_id != user.id:
            # Check active permission
            now = datetime.utcnow()
            has_perm = DocumentPermission.query.filter(
                DocumentPermission.document_id == document.id,
                DocumentPermission.recipient_user_id == user.id,
                DocumentPermission.revoked_at.is_(None),
                or_(
                    DocumentPermission.expires_at.is_(None),
                    DocumentPermission.expires_at > now,
                ),
            ).first()
            if not has_perm:
                AuditService.record(
                    organization_id=organization.id,
                    actor_user_id=user.id,
                    action="document.access_denied",
                    resource_type="document",
                    resource_id=document.id,
                    outcome="denied",
                )
                raise APIError("You do not have permission to access this document.", status_code=403)

        return document

    @staticmethod
    def download_document(
        document_id: str,
        user: User,
        organization: Organization,
        is_admin: bool,
    ) -> Tuple[BinaryIO, str, str]:
        document = DocumentService.get_document(document_id, user, organization, is_admin)

        # If user is not admin and not owner, check if permission allows download
        if not is_admin and document.owner_id != user.id:
            now = datetime.utcnow()
            perm = DocumentPermission.query.filter(
                DocumentPermission.document_id == document.id,
                DocumentPermission.recipient_user_id == user.id,
                DocumentPermission.revoked_at.is_(None),
                or_(
                    DocumentPermission.expires_at.is_(None),
                    DocumentPermission.expires_at > now,
                ),
            ).first()

            if not perm or perm.permission_level != "download":
                AuditService.record(
                    organization_id=organization.id,
                    actor_user_id=user.id,
                    action="document.download_denied",
                    resource_type="document",
                    resource_id=document.id,
                    outcome="denied",
                    metadata={"reason": "view_only_or_missing_permission"},
                )
                raise APIError("Download access is not granted for this document (view only).", status_code=403)

        storage = get_storage()
        if not storage.exists(document.storage_key):
            current_app.logger.error(f"Missing storage file for document {document.id}")
            raise APIError("Document file is temporarily unavailable.", status_code=500)

        stream = storage.get_stream(document.storage_key)

        # Record successful download audit event
        AuditService.record(
            organization_id=organization.id,
            actor_user_id=user.id,
            action="document.download",
            resource_type="document",
            resource_id=document.id,
            outcome="success",
            metadata={"filename": document.original_filename, "sha256": document.sha256_hash},
        )

        return stream, document.original_filename, document.content_type

    @staticmethod
    def verify_integrity(
        document_id: str,
        user: User,
        organization: Organization,
        is_admin: bool,
    ) -> dict:
        document = DocumentService.get_document(document_id, user, organization, is_admin)
        storage = get_storage()

        if not storage.exists(document.storage_key):
            document.last_verified_at = datetime.utcnow()
            document.last_verification_status = "unavailable"
            db.session.commit()
            AuditService.record(
                organization_id=organization.id,
                actor_user_id=user.id,
                action="integrity.verify_failed",
                resource_type="document",
                resource_id=document.id,
                outcome="failure",
                metadata={"reason": "storage_file_missing"},
            )
            return {
                "verified": False,
                "status": "unavailable",
                "message": "Storage file could not be read.",
                "expected_hash": document.sha256_hash,
                "computed_hash": None,
                "verified_at": document.last_verified_at.isoformat(),
            }

        # Read actual bytes from private storage
        stored_bytes = storage.get_bytes(document.storage_key)
        fresh_hash = calculate_sha256_bytes(stored_bytes)

        matches = constant_time_compare(fresh_hash, document.sha256_hash)
        now = datetime.utcnow()
        document.last_verified_at = now
        document.last_verification_status = "verified" if matches else "mismatch"
        db.session.commit()

        AuditService.record(
            organization_id=organization.id,
            actor_user_id=user.id,
            action="integrity.verify_success" if matches else "integrity.verify_mismatch",
            resource_type="document",
            resource_id=document.id,
            outcome="success" if matches else "failure",
            metadata={
                "expected_hash": document.sha256_hash,
                "computed_hash": fresh_hash,
                "matches": matches,
            },
        )

        return {
            "verified": matches,
            "status": "verified" if matches else "mismatch",
            "message": "SHA-256 digests match. File integrity is cryptographically verified."
            if matches
            else "Cryptographic mismatch! Stored file has been altered or corrupted.",
            "expected_hash": document.sha256_hash,
            "computed_hash": fresh_hash,
            "verified_at": now.isoformat(),
        }

    @staticmethod
    def delete_document(
        document_id: str,
        user: User,
        organization: Organization,
        is_admin: bool,
    ) -> dict:
        document = Document.query.filter_by(id=document_id, status="active").first()
        if not document or document.organization_id != organization.id:
            raise APIError("Document not found.", status_code=404)

        if not is_admin and document.owner_id != user.id:
            raise APIError("You are not authorized to delete this document.", status_code=403)

        # Soft delete document
        document.status = "deleted"
        document.deleted_at = datetime.utcnow()

        # Invalidate active permissions
        now = datetime.utcnow()
        DocumentPermission.query.filter(
            DocumentPermission.document_id == document.id,
            DocumentPermission.revoked_at.is_(None),
        ).update({"revoked_at": now}, synchronize_session=False)

        db.session.commit()

        AuditService.record(
            organization_id=organization.id,
            actor_user_id=user.id,
            action="document.delete",
            resource_type="document",
            resource_id=document.id,
            outcome="success",
            metadata={"filename": document.original_filename},
        )

        return {"message": "Document removed successfully."}

    @staticmethod
    def rename_document(
        document_id: str,
        new_filename: str,
        user: User,
        organization: Organization,
        is_admin: bool,
    ) -> dict:
        document = Document.query.filter_by(id=document_id, status="active").first()
        if not document or document.organization_id != organization.id:
            raise APIError("Document not found.", status_code=404)

        if not is_admin and document.owner_id != user.id:
            raise APIError("You are not authorized to rename this document.", status_code=403)

        clean_name = (new_filename or "").strip()
        if not clean_name:
            raise APIError("New document filename cannot be empty.", status_code=400)

        sanitized_name = sanitize_filename(clean_name)
        if not sanitized_name:
            raise APIError("Invalid filename provided.", status_code=400)

        old_filename = document.original_filename
        document.original_filename = sanitized_name
        document.updated_at = datetime.utcnow()
        db.session.commit()

        AuditService.record(
            organization_id=organization.id,
            actor_user_id=user.id,
            action="document.rename",
            resource_type="document",
            resource_id=document.id,
            outcome="success",
            metadata={"old_name": old_filename, "new_name": sanitized_name},
        )

        return document.to_dict()
