from datetime import datetime
from ..extensions import db
from ..models import (
    Document,
    User,
    DocumentPermission,
    OrganizationMembership,
    Organization,
)
from ..errors.handlers import APIError


class AccessExplorerService:
    """Computes authorized relationship graphs, inheritance paths, and effective permissions."""

    @staticmethod
    def get_document_access_graph(document_id: str, organization_id: str, actor: User, is_admin: bool = False) -> dict:
        """
        Calculates all identities that can access a document, the origin of access
        (direct vs. inherited via workspace role), and effective permission level.
        """
        document = Document.query.filter_by(
            id=document_id, organization_id=organization_id, status="active"
        ).first()
        if not document:
            raise APIError("Document not found or access denied.", status_code=404)

        if not is_admin and document.owner_id != actor.id:
            active_perm = DocumentPermission.query.filter_by(
                document_id=document.id,
                recipient_user_id=actor.id,
                revoked_at=None,
            ).first()
            if not (active_perm and active_perm.is_active):
                raise APIError("You are not authorized to view this document's access graph.", status_code=403)

        now = datetime.utcnow()
        nodes = []
        links = []
        table_rows = []

        # Central Document Node
        nodes.append({
            "id": f"doc:{document.id}",
            "label": document.original_filename,
            "type": "document",
            "classification": getattr(document, "classification", "Internal") or "Internal",
            "size_bytes": document.size_bytes,
            "sha256_hash": document.sha256_hash,
            "owner_name": document.owner.full_name if document.owner else "Unknown",
        })

        # 1. Owner Node & Link
        if document.owner:
            owner_id = f"user:{document.owner.id}"
            nodes.append({
                "id": owner_id,
                "label": document.owner.full_name,
                "email": document.owner.email,
                "type": "user",
                "role": "Document Owner",
            })
            links.append({
                "source": owner_id,
                "target": f"doc:{document.id}",
                "relationship": "ownership",
                "permission_level": "manage",
                "inherited": False,
                "details": "Full document ownership with unconditional manage rights",
            })
            table_rows.append({
                "user_id": document.owner.id,
                "name": document.owner.full_name,
                "email": document.owner.email,
                "access_source": "Ownership",
                "is_inherited": False,
                "effective_permission": "manage",
                "can_download": True,
                "status": "active",
                "grantor": "Self",
                "expiration": "Never",
                "reason": "Direct owner of this document",
            })

        # 2. Workspace Members & Admins (Inherited access)
        memberships = OrganizationMembership.query.filter_by(
            organization_id=organization_id, status="active"
        ).all()

        ws_node_id = f"org:{organization_id}"
        nodes.append({
            "id": ws_node_id,
            "label": document.organization.name if document.organization else "Workspace",
            "type": "workspace",
        })
        links.append({
            "source": ws_node_id,
            "target": f"doc:{document.id}",
            "relationship": "workspace_containment",
            "permission_level": "containment",
            "inherited": True,
        })

        for m in memberships:
            # Skip owner as they are already accounted for with higher direct rights
            if m.user_id == document.owner_id:
                continue

            user_node_id = f"user:{m.user_id}"
            user_label = m.user.full_name if m.user else "Member"
            user_email = m.user.email if m.user else ""

            # Only add node if not existing
            if not any(n["id"] == user_node_id for n in nodes):
                nodes.append({
                    "id": user_node_id,
                    "label": user_label,
                    "email": user_email,
                    "type": "user",
                    "role": m.role,
                })

            if m.role == "admin":
                # Admins have inherited manage permissions
                links.append({
                    "source": user_node_id,
                    "target": f"doc:{document.id}",
                    "relationship": "workspace_admin_inheritance",
                    "permission_level": "manage",
                    "inherited": True,
                    "details": "Workspace Administrator privileges grant full document administration",
                })
                table_rows.append({
                    "user_id": m.user_id,
                    "name": user_label,
                    "email": user_email,
                    "access_source": "Workspace Admin Role",
                    "is_inherited": True,
                    "effective_permission": "manage",
                    "can_download": True,
                    "status": "active",
                    "grantor": "Workspace Policy",
                    "expiration": "Permanent while Admin",
                    "reason": "Inherited full permissions from Workspace Admin role",
                })

        # 3. Direct Document Permissions / Share Grants
        direct_perms = DocumentPermission.query.filter_by(
            document_id=document.id
        ).all()

        for p in direct_perms:
            is_revoked = p.revoked_at is not None
            is_expired = p.expires_at is not None and p.expires_at < now
            status_label = "revoked" if is_revoked else ("expired" if is_expired else "active")

            recip_user = p.recipient_user
            recip_email = recip_user.email if recip_user else ""
            recip_label = recip_user.full_name if recip_user else (recip_email or "Collaborator")
            recipient_node_id = f"user:{p.recipient_user_id}" if p.recipient_user_id else f"perm:{p.id}"
            can_dl = p.permission_level in ("download", "edit", "manage", "admin")
            grantor_name = p.grantor.full_name if p.grantor else "System"

            # Add node
            if not any(n["id"] == recipient_node_id for n in nodes):
                nodes.append({
                    "id": recipient_node_id,
                    "label": recip_label,
                    "email": recip_email,
                    "type": "user" if p.recipient_user_id else "collaborator",
                    "status": status_label,
                })

            links.append({
                "source": recipient_node_id,
                "target": f"doc:{document.id}",
                "relationship": "direct_grant",
                "permission_level": p.permission_level,
                "can_download": can_dl,
                "inherited": False,
                "status": status_label,
                "details": f"Explicit share grant with {p.permission_level} rights",
            })

            # Check if this user was already in table_rows (e.g. from workspace role)
            existing_row = next((r for r in table_rows if recip_email and r.get("email") == recip_email), None)
            if existing_row:
                # Merge / resolve overlapping grant
                existing_row["direct_permission"] = p.permission_level
                existing_row["direct_grant_id"] = p.id
                existing_row["grantor"] = grantor_name
                existing_row["expiration"] = p.expires_at.strftime("%Y-%m-%d") if p.expires_at else "Never"
            else:
                table_rows.append({
                    "user_id": p.recipient_user_id or p.id,
                    "name": recip_label,
                    "email": recip_email,
                    "access_source": "Direct Grant",
                    "is_inherited": False,
                    "effective_permission": "denied" if (is_revoked or is_expired) else p.permission_level,
                    "can_download": can_dl if not (is_revoked or is_expired) else False,
                    "status": status_label,
                    "grantor": grantor_name,
                    "expiration": p.expires_at.strftime("%Y-%m-%d %H:%M UTC") if p.expires_at else "Never",
                    "reason": f"Explicit permission granted with {p.permission_level} level" if not is_revoked and not is_expired else f"Grant is {status_label}",
                })

        return {
            "document": {
                "id": document.id,
                "name": document.original_filename,
                "classification": getattr(document, "classification", "Internal") or "Internal",
                "size_bytes": document.size_bytes,
                "sha256_hash": document.sha256_hash,
            },
            "graph": {
                "nodes": nodes,
                "links": links,
            },
            "table": table_rows,
            "total_authorized_identities": len([r for r in table_rows if r["status"] == "active"]),
        }
