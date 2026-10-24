import re
import secrets
import hashlib
from datetime import datetime, timedelta
from flask import session, current_app
from sqlalchemy.exc import IntegrityError
from ..extensions import db
from ..errors import APIError
from ..models import User, Organization, OrganizationMembership
from ..security.hashing import hash_password, verify_password
from .audit_service import AuditService


class AuthService:
    """Handles authentication, registration, password hashing, and session management."""

    @staticmethod
    def register(
        full_name: str,
        email: str,
        password: str,
        org_name: str = None,
        terms_accepted: bool = False,
        terms_version: str = "1.0",
    ) -> dict:
        full_name = (full_name or "").strip()
        email = (email or "").strip().lower()
        org_name = (org_name or "").strip()

        if not full_name:
            raise APIError("Full name is required.", status_code=400)
        if not email or "@" not in email:
            raise APIError("A valid email address is required.", status_code=400)
        if not password or len(password) < 8:
            raise APIError("Password must be at least 8 characters long.", status_code=400)

        # General-purpose SaaS: If no org_name supplied, create personal workspace automatically
        if not org_name:
            first_name = full_name.split()[0] if full_name else "Personal"
            org_name = f"{first_name}'s Workspace"
            workspace_type = "personal"
        else:
            workspace_type = "shared"

        # Check existing user
        if User.query.filter_by(email=email).first():
            raise APIError("An account with this email address already exists.", status_code=409)

        # Generate unique slug for organization/workspace
        base_slug = re.sub(r"[^a-z0-9]+", "-", org_name.lower()).strip("-")
        if not base_slug:
            base_slug = "workspace"
        slug = base_slug
        counter = 1
        while Organization.query.filter_by(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1

        try:
            # Create organization / workspace
            organization = Organization(name=org_name, slug=slug, workspace_type=workspace_type)
            db.session.add(organization)
            db.session.flush()

            # Create user with Argon2id hash
            hashed_pw = hash_password(password)
            user = User(
                full_name=full_name,
                email=email,
                password_hash=hashed_pw,
                is_active=True,
                terms_version=terms_version if terms_accepted else None,
                terms_accepted_at=datetime.utcnow() if terms_accepted else None,
                last_login_at=datetime.utcnow(),
            )
            db.session.add(user)
            db.session.flush()

            # Assign founding user as Workspace Administrator
            membership = OrganizationMembership(
                organization_id=organization.id,
                user_id=user.id,
                role="admin",
                status="active",
            )
            db.session.add(membership)
            db.session.commit()

            # Establish session
            session.clear()
            session["user_id"] = user.id
            session["active_org_id"] = organization.id
            session.permanent = True

            # Record audit event
            AuditService.record(
                organization_id=organization.id,
                actor_user_id=user.id,
                action="auth.register",
                resource_type="organization",
                resource_id=organization.id,
                outcome="success",
                metadata={"org_name": org_name, "user_email": email, "role": "admin", "workspace_type": workspace_type},
            )

            return {
                "user": user.to_dict(),
                "organization": organization.to_dict(),
                "role": "admin",
            }
        except IntegrityError:
            db.session.rollback()
            raise APIError("An account with this email address already exists.", status_code=409)
        except Exception:
            db.session.rollback()
            raise

    @staticmethod
    def login(email: str, password: str) -> dict:
        email = (email or "").strip().lower()
        if not email or not password:
            raise APIError("Email and password are required.", status_code=400)

        user = User.query.filter_by(email=email).first()
        if not user or not verify_password(user.password_hash, password):
            # Record failed login audit if user exists
            if user:
                membership = OrganizationMembership.query.filter_by(user_id=user.id).first()
                if membership:
                    AuditService.record(
                        organization_id=membership.organization_id,
                        actor_user_id=user.id,
                        action="auth.login_failure",
                        resource_type="session",
                        outcome="denied",
                        metadata={"attempted_email": email, "reason": "invalid_credentials"},
                    )
            raise APIError("Invalid email or password.", status_code=401)

        if not user.is_active:
            raise APIError("This account has been deactivated. Please contact your administrator.", status_code=403)

        # Fetch active membership
        membership = OrganizationMembership.query.filter_by(
            user_id=user.id, status="active"
        ).first()

        if not membership:
            raise APIError("Account has no active organization memberships.", status_code=403)

        user.last_login_at = datetime.utcnow()
        db.session.commit()

        # Session establishment
        session.clear()
        session["user_id"] = user.id
        session["active_org_id"] = membership.organization_id
        session.permanent = True

        AuditService.record(
            organization_id=membership.organization_id,
            actor_user_id=user.id,
            action="auth.login_success",
            resource_type="session",
            outcome="success",
            metadata={"user_email": user.email, "role": membership.role},
        )

        return {
            "user": user.to_dict(),
            "organization": membership.organization.to_dict(),
            "role": membership.role,
        }

    @staticmethod
    def logout(current_user=None, current_org=None) -> dict:
        if current_user and current_org:
            AuditService.record(
                organization_id=current_org.id,
                actor_user_id=current_user.id,
                action="auth.logout",
                resource_type="session",
                outcome="success",
            )
        session.clear()
        return {"message": "Successfully logged out."}

    @staticmethod
    def change_password(user: User, old_password: str, new_password: str, org_id: str) -> dict:
        if not verify_password(user.password_hash, old_password):
            AuditService.record(
                organization_id=org_id,
                actor_user_id=user.id,
                action="auth.change_password",
                resource_type="user",
                resource_id=user.id,
                outcome="denied",
                metadata={"reason": "invalid_current_password"},
            )
            raise APIError("Current password is incorrect.", status_code=400)

        if len(new_password) < 8:
            raise APIError("New password must be at least 8 characters long.", status_code=400)

        user.password_hash = hash_password(new_password)
        db.session.commit()

        AuditService.record(
            organization_id=org_id,
            actor_user_id=user.id,
            action="auth.change_password",
            resource_type="user",
            resource_id=user.id,
            outcome="success",
        )

        return {"message": "Password updated successfully."}

    @staticmethod
    def update_profile(user: User, full_name: str = None, theme_preference: str = None) -> dict:
        if full_name is not None:
            full_name = full_name.strip()
            if not full_name:
                raise APIError("Full name cannot be empty.", status_code=400)
            user.full_name = full_name

        if theme_preference is not None:
            if theme_preference not in ("light", "dark", "system"):
                raise APIError("Invalid theme preference. Must be light, dark, or system.", status_code=400)
            user.theme_preference = theme_preference

        db.session.commit()
        return {"user": user.to_dict()}

    @staticmethod
    def delete_account(user: User, current_org: Organization = None) -> dict:
        user_id = user.id
        org_id = current_org.id if current_org else None

        if org_id:
            AuditService.record(
                organization_id=org_id,
                actor_user_id=user_id,
                action="auth.account_deleted",
                resource_type="user",
                resource_id=user_id,
                outcome="success",
                metadata={"email": user.email},
            )

        session.clear()
        db.session.delete(user)
        db.session.commit()

        return {"message": "Account has been successfully deleted."}

    @staticmethod
    def request_password_reset(email: str) -> dict:
        email = (email or "").strip().lower()
        if not email:
            raise APIError("Email address is required.", status_code=400)

        user = User.query.filter_by(email=email).first()
        raw_token = None

        if user and user.is_active:
            raw_token = secrets.token_urlsafe(32)
            user.reset_token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
            user.reset_token_expires_at = datetime.utcnow() + timedelta(hours=1)
            db.session.commit()

            membership = OrganizationMembership.query.filter_by(
                user_id=user.id, status="active"
            ).first()
            if membership:
                AuditService.record(
                    organization_id=membership.organization_id,
                    actor_user_id=user.id,
                    action="auth.password_reset_requested",
                    resource_type="user",
                    resource_id=user.id,
                    outcome="success",
                    metadata={"email": user.email},
                )

        response = {
            "message": "If an active account with that email exists, password reset instructions have been generated."
        }

        # In development/test environments, surface token for automated and local workflow verification
        if current_app.config.get("ENVIRONMENT") != "production" and raw_token:
            response["dev_reset_token"] = raw_token

        return response

    @staticmethod
    def reset_password(token: str, new_password: str) -> dict:
        token = (token or "").strip()
        if not token:
            raise APIError("Reset token is required.", status_code=400)
        if not new_password or len(new_password) < 8:
            raise APIError("New password must be at least 8 characters long.", status_code=400)

        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        now = datetime.utcnow()
        user = User.query.filter(
            User.reset_token_hash == token_hash,
            User.reset_token_expires_at.isnot(None),
            User.reset_token_expires_at > now,
        ).first()

        if not user:
            raise APIError("Invalid or expired password reset token.", status_code=400)

        user.password_hash = hash_password(new_password)
        user.reset_token_hash = None
        user.reset_token_expires_at = None
        db.session.commit()

        membership = OrganizationMembership.query.filter_by(
            user_id=user.id, status="active"
        ).first()
        if membership:
            AuditService.record(
                organization_id=membership.organization_id,
                actor_user_id=user.id,
                action="auth.password_reset_completed",
                resource_type="user",
                resource_id=user.id,
                outcome="success",
            )

        return {"message": "Password has been successfully reset. You may now sign in."}
