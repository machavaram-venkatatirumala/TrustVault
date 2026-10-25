import hashlib
import hmac
import os
import time
from datetime import datetime
from functools import wraps
from flask import g, session, request, current_app
from ..errors import APIError
from ..models import User, OrganizationMembership, Organization, ApiKey
from ..extensions import db


def get_current_user():
    """Retrieves authenticated user from session, API key bearer token, or signed URL parameters."""
    # 1. Session-based authentication
    user_id = session.get("user_id")
    if user_id:
        user = User.query.filter_by(id=user_id, is_active=True).first()
        if user:
            return user

    # 2. Bearer API key authentication
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        if token.startswith("tv_live_"):
            token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
            api_key = ApiKey.query.filter_by(key_hash=token_hash, revoked_at=None).first()
            if api_key and api_key.user and api_key.user.is_active:
                api_key.last_used_at = datetime.utcnow()
                try:
                    db.session.commit()
                except Exception:
                    db.session.rollback()
                g.current_api_key = api_key
                g.auth_org_id = api_key.organization_id
                return api_key.user

    # 3. Signed URL authentication for document download
    sig = request.args.get("sig")
    expires = request.args.get("expires")
    uid = request.args.get("uid")
    if sig and expires and uid:
        try:
            expires_int = int(expires)
            if expires_int >= int(time.time()):
                doc_id = (request.view_args or {}).get("document_id")
                if not doc_id:
                    parts = request.path.strip("/").split("/")
                    if len(parts) >= 2 and parts[-1] == "download":
                        doc_id = parts[-2]

                if doc_id:
                    secret_key = (current_app.config.get("SECRET_KEY") if current_app else None) or os.environ.get(
                        "SECRET_KEY", "trustvault_secret_signing_key_2026"
                    )
                    expected_sig = hmac.new(
                        secret_key.encode("utf-8"),
                        f"{doc_id}:{expires_int}:{uid}".encode("utf-8"),
                        hashlib.sha256,
                    ).hexdigest()
                    if hmac.compare_digest(sig, expected_sig):
                        user = User.query.filter_by(id=uid, is_active=True).first()
                        if user:
                            return user
        except Exception:
            pass

    return None


def login_required(f):
    """Decorator enforcing that the request is authenticated."""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            raise APIError("Authentication required. Please sign in.", status_code=401)

        # Retrieve active organization membership
        active_org_id = getattr(g, "auth_org_id", None) or session.get("active_org_id")
        membership = None
        
        if active_org_id:
            membership = OrganizationMembership.query.filter_by(
                user_id=user.id, organization_id=active_org_id, status="active"
            ).first()

        if not membership:
            # Fall back to first active membership
            membership = OrganizationMembership.query.filter_by(
                user_id=user.id, status="active"
            ).first()

        if not membership:
            raise APIError("User is not associated with an active organization.", status_code=403)

        # Populate request context
        g.current_user = user
        g.current_membership = membership
        g.current_org = membership.organization
        session["active_org_id"] = membership.organization_id

        return f(*args, **kwargs)

    return decorated_function


def admin_required(f):
    """Decorator enforcing that the authenticated user has an 'admin' role in current organization."""

    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if not g.current_membership or g.current_membership.role != "admin":
            raise APIError("Administrative privileges required for this operation.", status_code=403)
        return f(*args, **kwargs)

    return decorated_function


def verify_tenant_access(resource):
    """Ensures that the resource belongs to the currently active organization."""
    if not hasattr(resource, "organization_id"):
        return True
    if resource.organization_id != g.current_org.id:
        raise APIError("Access denied. Resource does not belong to your organization.", status_code=403)
    return True
