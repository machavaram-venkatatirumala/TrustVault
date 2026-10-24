import re
from flask import Blueprint, request, jsonify, g
from sqlalchemy.exc import IntegrityError
from ..extensions import db
from ..models import Organization
from ..security.authorization import login_required, admin_required
from ..services.audit_service import AuditService
from ..errors import APIError

org_bp = Blueprint("organization", __name__)

SLUG_REGEX = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


def validate_slug_format(slug: str):
    """Validates that slug contains only lowercase alphanumeric characters and single hyphens."""
    if not slug:
        raise APIError("Workspace slug cannot be empty.", status_code=400)
    if len(slug) < 3 or len(slug) > 120:
        raise APIError("Workspace slug must be between 3 and 120 characters long.", status_code=400)
    if not SLUG_REGEX.match(slug):
        raise APIError(
            "Workspace slug must contain only lowercase letters, numbers, and hyphens without leading, trailing, or consecutive hyphens.",
            status_code=400,
        )


@org_bp.route("/organization", methods=["GET"])
@login_required
def get_organization():
    return jsonify({
        "organization": g.current_org.to_dict(),
        "current_user_role": g.current_membership.role,
    }), 200


@org_bp.route("/organization/check-slug", methods=["GET"])
@login_required
def check_slug():
    slug = request.args.get("slug", "").strip()
    if not slug:
        return jsonify({
            "available": False,
            "valid": False,
            "message": "Slug query parameter is required.",
        }), 400

    if len(slug) < 3 or len(slug) > 120 or not SLUG_REGEX.match(slug):
        return jsonify({
            "available": False,
            "valid": False,
            "message": "Slug must contain only lowercase letters, numbers, and hyphens without leading, trailing, or consecutive hyphens (3-120 chars).",
        }), 200

    if slug == g.current_org.slug:
        return jsonify({
            "available": True,
            "valid": True,
            "message": "Current workspace slug.",
        }), 200

    conflict = Organization.query.filter(
        Organization.slug == slug,
        Organization.id != g.current_org.id,
    ).first()

    if conflict:
        return jsonify({
            "available": False,
            "valid": True,
            "message": f"Workspace slug '{slug}' is already taken.",
        }), 200

    return jsonify({
        "available": True,
        "valid": True,
        "message": f"Workspace slug '{slug}' is available.",
    }), 200


@org_bp.route("/organization", methods=["PATCH"])
@admin_required
def update_organization():
    data = request.get_json() or {}
    name = data.get("name", "").strip() if "name" in data else None
    slug = data.get("slug", "").strip() if "slug" in data else None
    workspace_type = data.get("workspace_type", "").strip() if "workspace_type" in data else None

    if name is not None and not name:
        raise APIError("Workspace name cannot be empty.", status_code=400)

    if slug is not None:
        validate_slug_format(slug)
        if slug != g.current_org.slug:
            existing = Organization.query.filter(
                Organization.slug == slug,
                Organization.id != g.current_org.id,
            ).first()
            if existing:
                raise APIError(f"Workspace slug '{slug}' is already taken by another organization.", status_code=409)

    old_metadata = {
        "old_name": g.current_org.name,
        "old_slug": g.current_org.slug,
        "old_type": g.current_org.workspace_type,
    }

    if name:
        g.current_org.name = name
    if slug:
        g.current_org.slug = slug
    if workspace_type:
        if workspace_type not in ("personal", "shared"):
            raise APIError("Workspace type must be 'personal' or 'shared'.", status_code=400)
        g.current_org.workspace_type = workspace_type

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        raise APIError(f"Workspace slug '{slug}' violates uniqueness constraints.", status_code=409)

    AuditService.record(
        organization_id=g.current_org.id,
        actor_user_id=g.current_user.id,
        action="organization.update",
        resource_type="organization",
        resource_id=g.current_org.id,
        outcome="success",
        metadata={
            **old_metadata,
            "new_name": g.current_org.name,
            "new_slug": g.current_org.slug,
            "new_type": g.current_org.workspace_type,
        },
    )

    return jsonify({"organization": g.current_org.to_dict()}), 200
