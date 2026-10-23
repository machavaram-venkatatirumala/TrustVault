from datetime import datetime
from ..extensions import db
from ..errors import APIError
from ..models import OrganizationMembership, User, DocumentPermission
from ..security.hashing import hash_password
from .audit_service import AuditService


class MemberService:
    """Manages organization members, role changes, and member access status."""

    @staticmethod
    def list_members(organization_id: str) -> list:
        memberships = (
            OrganizationMembership.query.filter_by(organization_id=organization_id)
            .order_by(OrganizationMembership.joined_at.asc())
            .all()
        )
        return [m.to_dict() for m in memberships]

    @staticmethod
    def update_role(
        member_id: str,
        new_role: str,
        actor: User,
        organization_id: str,
    ) -> dict:
        if new_role not in ("admin", "member"):
            raise APIError("Role must be 'admin' or 'member'.", status_code=400)

        membership = OrganizationMembership.query.filter_by(
            id=member_id, organization_id=organization_id
        ).first()

        if not membership:
            raise APIError("Organization member not found.", status_code=404)

        if membership.role == new_role:
            return membership.to_dict()

        # Prevent demoting the last active administrator
        if membership.role == "admin" and new_role != "admin":
            admin_count = OrganizationMembership.query.filter_by(
                organization_id=organization_id, role="admin", status="active"
            ).count()
            if admin_count <= 1:
                raise APIError("Cannot demote the sole remaining administrator.", status_code=400)

        old_role = membership.role
        membership.role = new_role
        db.session.commit()

        AuditService.record(
            organization_id=organization_id,
            actor_user_id=actor.id,
            action="member.role_change",
            resource_type="user",
            resource_id=membership.user_id,
            outcome="success",
            metadata={
                "member_email": membership.user.email if membership.user else None,
                "old_role": old_role,
                "new_role": new_role,
            },
        )

        return membership.to_dict()

    @staticmethod
    def deactivate_member(
        member_id: str,
        actor: User,
        organization_id: str,
    ) -> dict:
        membership = OrganizationMembership.query.filter_by(
            id=member_id, organization_id=organization_id
        ).first()

        if not membership:
            raise APIError("Organization member not found.", status_code=404)

        if membership.user_id == actor.id:
            raise APIError("Administrators cannot deactivate their own account.", status_code=400)

        if membership.role == "admin":
            admin_count = OrganizationMembership.query.filter_by(
                organization_id=organization_id, role="admin", status="active"
            ).count()
            if admin_count <= 1:
                raise APIError("Cannot deactivate the sole remaining administrator.", status_code=400)

        membership.status = "suspended"

        # Revoke all active permissions granted to this member
        now = datetime.utcnow()
        DocumentPermission.query.filter_by(
            recipient_user_id=membership.user_id,
            organization_id=organization_id,
            revoked_at=None,
        ).update({"revoked_at": now})

        db.session.commit()

        AuditService.record(
            organization_id=organization_id,
            actor_user_id=actor.id,
            action="member.deactivate",
            resource_type="user",
            resource_id=membership.user_id,
            outcome="success",
            metadata={"member_email": membership.user.email if membership.user else None},
        )

        return {"message": "Member suspended and access revoked successfully.", "id": member_id}

    @staticmethod
    def invite_or_add_member(
        organization_id: str,
        email: str,
        full_name: str,
        role: str,
        password: str,
        actor: User,
    ) -> dict:
        email = (email or "").strip().lower()
        full_name = (full_name or "").strip()
        role = role if role in ("admin", "member") else "member"

        if not email or "@" not in email:
            raise APIError("Valid email required.", status_code=400)
        if not full_name:
            raise APIError("Full name required.", status_code=400)
        if not password or len(password) < 8:
            raise APIError("Initial password must be at least 8 characters long.", status_code=400)

        # Check if user already exists
        user = User.query.filter_by(email=email).first()
        if user:
            # Check if already a member of this organization
            existing_mem = OrganizationMembership.query.filter_by(
                organization_id=organization_id, user_id=user.id
            ).first()
            if existing_mem:
                if existing_mem.status == "suspended":
                    existing_mem.status = "active"
                    existing_mem.role = role
                    db.session.commit()
                    return existing_mem.to_dict()
                raise APIError("User is already a member of this organization.", status_code=409)
        else:
            user = User(
                full_name=full_name,
                email=email,
                password_hash=hash_password(password),
                is_active=True,
            )
            db.session.add(user)
            db.session.flush()

        membership = OrganizationMembership(
            organization_id=organization_id,
            user_id=user.id,
            role=role,
            status="active",
        )
        db.session.add(membership)
        db.session.commit()

        AuditService.record(
            organization_id=organization_id,
            actor_user_id=actor.id,
            action="member.invite",
            resource_type="user",
            resource_id=user.id,
            outcome="success",
            metadata={"member_email": email, "role": role},
        )

        return membership.to_dict()
