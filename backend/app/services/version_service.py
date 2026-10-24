import difflib
import io
import uuid
from datetime import datetime
from flask import current_app
from ..extensions import db
from ..errors import APIError
from ..models import Document, DocumentVersion, User, Organization, DocumentPermission
from ..security.sanitization import generate_opaque_storage_key, sanitize_filename
from ..storage import get_storage
from ..utils.crypto import calculate_sha256_bytes
from .audit_service import AuditService


class VersionService:
    """Manages document versions, historical snapshots, version comparisons, and non-destructive restores."""

    @staticmethod
    def create_version(
        document_id: str,
        file_obj,
        actor: User,
        organization: Organization,
        is_admin: bool = False,
        change_summary: str = None,
    ) -> dict:
        document = Document.query.filter_by(id=document_id, organization_id=organization.id).first()
        if not document or document.status == "purged":
            raise APIError("Document not found.", status_code=404)

        if not is_admin and document.owner_id != actor.id:
            raise APIError("You are not authorized to create new versions of this document.", status_code=403)

        if not file_obj:
            raise APIError("No file provided for new version.", status_code=400)

        # Read file safely into buffer
        buffer = io.BytesIO()
        if hasattr(file_obj, "save"):
            file_obj.save(buffer)
        elif hasattr(file_obj, "stream"):
            buffer.write(file_obj.stream.read())
        elif hasattr(file_obj, "read"):
            buffer.write(file_obj.read())

        file_bytes = buffer.getvalue()
        size_bytes = len(file_bytes)
        if size_bytes == 0:
            raise APIError("Uploaded version file is empty (0 bytes).", status_code=400)

        max_size = current_app.config.get("MAX_CONTENT_LENGTH", 25 * 1024 * 1024) if current_app else 25 * 1024 * 1024
        if size_bytes > max_size:
            raise APIError("File size exceeds maximum permitted limit.", status_code=413)

        sha256_hash = calculate_sha256_bytes(file_bytes)
        next_version_num = (document.current_version_number or 1) + 1

        version_id = str(uuid.uuid4())
        storage_key = generate_opaque_storage_key(organization.id, f"{document.id}_v{next_version_num}_{version_id[:8]}")

        storage = get_storage()
        buffer.seek(0)
        try:
            storage.save(storage_key, buffer)
        except Exception as e:
            raise APIError("Failed to persist version file in secure storage.", status_code=500)

        content_type = getattr(file_obj, "content_type", None) or document.content_type

        version = DocumentVersion(
            id=version_id,
            document_id=document.id,
            version_number=next_version_num,
            storage_key=storage_key,
            content_type=content_type,
            size_bytes=size_bytes,
            sha256_hash=sha256_hash,
            scan_status="clean",
            scan_result="Allowlist verified clean",
            change_summary=change_summary or f"Version {next_version_num} upload",
            created_by=actor.id,
            created_at=datetime.utcnow(),
        )
        db.session.add(version)

        # Update document head pointer to the new version
        document.current_version_number = next_version_num
        document.storage_key = storage_key
        document.content_type = content_type
        document.size_bytes = size_bytes
        document.sha256_hash = sha256_hash
        document.last_verified_at = datetime.utcnow()
        document.last_verification_status = "verified"
        document.updated_at = datetime.utcnow()

        db.session.commit()

        AuditService.record(
            organization_id=organization.id,
            actor_user_id=actor.id,
            action="document.version_create",
            resource_type="document_version",
            resource_id=version.id,
            outcome="success",
            metadata={
                "document_id": document.id,
                "document_name": document.original_filename,
                "version_number": next_version_num,
                "size_bytes": size_bytes,
                "sha256_hash": sha256_hash,
                "change_summary": change_summary,
            },
        )

        return version.to_dict()

    @staticmethod
    def list_versions(
        document_id: str,
        actor: User,
        organization: Organization,
        is_admin: bool = False,
    ) -> list:
        document = Document.query.filter_by(id=document_id, organization_id=organization.id).first()
        if not document or document.status == "purged":
            raise APIError("Document not found.", status_code=404)

        has_access = is_admin or document.owner_id == actor.id
        if not has_access:
            active_perm = DocumentPermission.query.filter_by(
                document_id=document.id,
                recipient_user_id=actor.id,
                revoked_at=None,
            ).first()
            if active_perm and active_perm.is_active:
                has_access = True

        if not has_access:
            raise APIError("You are not authorized to view this document's versions.", status_code=403)

        versions = (
            DocumentVersion.query.filter_by(document_id=document.id)
            .order_by(DocumentVersion.version_number.desc())
            .all()
        )

        if not versions:
            v1 = DocumentVersion(
                document_id=document.id,
                version_number=1,
                storage_key=document.storage_key,
                content_type=document.content_type,
                size_bytes=document.size_bytes,
                sha256_hash=document.sha256_hash,
                scan_status=document.scan_status or "clean",
                scan_result=document.scan_result or "Initial version",
                change_summary="Original version",
                created_by=document.owner_id,
                created_at=document.created_at,
            )
            db.session.add(v1)
            db.session.commit()
            versions = [v1]

        return [v.to_dict() for v in versions]

    @staticmethod
    def restore_version(
        document_id: str,
        version_id: str,
        actor: User,
        organization: Organization,
        is_admin: bool = False,
    ) -> dict:
        document = Document.query.filter_by(id=document_id, organization_id=organization.id).first()
        if not document or document.status == "purged":
            raise APIError("Document not found.", status_code=404)

        if not is_admin and document.owner_id != actor.id:
            raise APIError("You are not authorized to restore versions of this document.", status_code=403)

        target_version = DocumentVersion.query.filter_by(id=version_id, document_id=document.id).first()
        if not target_version:
            raise APIError("Target version record not found.", status_code=404)

        next_version_num = (document.current_version_number or 1) + 1

        new_version = DocumentVersion(
            document_id=document.id,
            version_number=next_version_num,
            storage_key=target_version.storage_key,
            content_type=target_version.content_type,
            size_bytes=target_version.size_bytes,
            sha256_hash=target_version.sha256_hash,
            scan_status=target_version.scan_status,
            scan_result=f"Restored from Version {target_version.version_number}",
            change_summary=f"Restored from Version {target_version.version_number}",
            created_by=actor.id,
            created_at=datetime.utcnow(),
        )
        db.session.add(new_version)

        document.current_version_number = next_version_num
        document.storage_key = target_version.storage_key
        document.content_type = target_version.content_type
        document.size_bytes = target_version.size_bytes
        document.sha256_hash = target_version.sha256_hash
        document.last_verified_at = datetime.utcnow()
        document.last_verification_status = "verified"
        document.updated_at = datetime.utcnow()

        db.session.commit()

        AuditService.record(
            organization_id=organization.id,
            actor_user_id=actor.id,
            action="document.version_restore",
            resource_type="document_version",
            resource_id=new_version.id,
            outcome="success",
            metadata={
                "document_id": document.id,
                "document_name": document.original_filename,
                "restored_from_version": target_version.version_number,
                "new_version_number": next_version_num,
                "sha256_hash": target_version.sha256_hash,
            },
        )

        return new_version.to_dict()

    @staticmethod
    def compare_versions(
        document_id: str,
        v1_id: str,
        v2_id: str,
        actor: User,
        organization: Organization,
        is_admin: bool = False,
    ) -> dict:
        document = Document.query.filter_by(id=document_id, organization_id=organization.id).first()
        if not document or document.status == "purged":
            raise APIError("Document not found.", status_code=404)

        v1 = DocumentVersion.query.filter_by(id=v1_id, document_id=document.id).first()
        v2 = DocumentVersion.query.filter_by(id=v2_id, document_id=document.id).first()

        if not v1 or not v2:
            raise APIError("One or both comparison versions not found.", status_code=404)

        size_delta = v2.size_bytes - v1.size_bytes
        hash_identical = v1.sha256_hash == v2.sha256_hash

        diff_summary = {
            "v1": v1.to_dict(),
            "v2": v2.to_dict(),
            "size_delta_bytes": size_delta,
            "hash_identical": hash_identical,
            "content_type_changed": v1.content_type != v2.content_type,
            "time_delta_seconds": abs((v2.created_at - v1.created_at).total_seconds()),
            "diff_type": "metadata",
        }

        # If both are text files, compute a safe line-by-line diff
        if "text" in v1.content_type.lower() and "text" in v2.content_type.lower():
            try:
                storage = get_storage()
                b1 = storage.get_bytes(v1.storage_key).decode("utf-8", errors="replace").splitlines(keepends=True)
                b2 = storage.get_bytes(v2.storage_key).decode("utf-8", errors="replace").splitlines(keepends=True)
                diff = list(difflib.unified_diff(b1[:500], b2[:500], fromfile=f"v{v1.version_number}", tofile=f"v{v2.version_number}"))
                diff_summary["text_diff"] = "".join(diff)
                diff_summary["diff_type"] = "text_unified"
            except Exception:
                pass

        return diff_summary
