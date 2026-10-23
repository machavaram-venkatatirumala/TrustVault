from functools import wraps
from flask import g, session, request
from ..errors import APIError
from ..models import User, OrganizationMembership, Organization


def get_current_user():
    """Retrieves authenticated user from session or request context."""
    user_id = session.get("user_id")
    if not user_id:
        return None
    return User.query.filter_by(id=user_id, is_active=True).first()


def login_required(f):
    """Decorator enforcing that the request is authenticated."""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            raise APIError("Authentication required. Please sign in.", status_code=401)

        # Retrieve active organization membership
        active_org_id = session.get("active_org_id")
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
