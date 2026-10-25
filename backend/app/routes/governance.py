from flask import Blueprint, request, jsonify, g
from ..security.authorization import login_required, admin_required
from ..services.governance_service import GovernanceService

governance_bp = Blueprint("governance", __name__)


# --- Saved Searches ---

@governance_bp.route("/saved-searches", methods=["GET"])
@governance_bp.route("/governance/saved-searches", methods=["GET"])
@login_required
def list_saved_searches():
    searches = GovernanceService.list_saved_searches(
        organization_id=g.current_org.id,
        user_id=g.current_user.id,
    )
    return jsonify({"searches": searches, "saved_searches": searches}), 200


@governance_bp.route("/saved-searches", methods=["POST"])
@governance_bp.route("/governance/saved-searches", methods=["POST"])
@login_required
def create_saved_search():
    data = request.get_json() or {}
    search = GovernanceService.create_saved_search(
        organization_id=g.current_org.id,
        actor=g.current_user,
        data=data,
    )
    return jsonify(search), 201


@governance_bp.route("/saved-searches/<search_id>", methods=["DELETE"])
@governance_bp.route("/governance/saved-searches/<search_id>", methods=["DELETE"])
@login_required
def delete_saved_search(search_id):
    is_admin = g.current_membership.role == "admin"
    res = GovernanceService.delete_saved_search(
        search_id=search_id,
        organization_id=g.current_org.id,
        actor=g.current_user,
        is_admin=is_admin,
    )
    return jsonify(res), 200


# --- Duplicate Detection ---

@governance_bp.route("/documents/<document_id>/duplicates", methods=["GET"])
@governance_bp.route("/governance/documents/<document_id>/duplicates", methods=["GET"])
@login_required
def find_duplicates(document_id):
    is_admin = g.current_membership.role == "admin"
    duplicates = GovernanceService.find_duplicates(
        document_id=document_id,
        organization_id=g.current_org.id,
        actor=g.current_user,
        is_admin=is_admin,
    )
    return jsonify({"duplicates": duplicates}), 200


# --- Access Review Campaigns ---

@governance_bp.route("/access-reviews", methods=["GET"])
@governance_bp.route("/governance/access-reviews", methods=["GET"])
@admin_required
def list_access_reviews():
    campaigns = GovernanceService.list_campaigns(organization_id=g.current_org.id)
    return jsonify({"campaigns": campaigns}), 200


@governance_bp.route("/access-reviews", methods=["POST"])
@governance_bp.route("/governance/access-reviews", methods=["POST"])
@admin_required
def create_access_review():
    data = request.get_json() or {}
    title = data.get("title")
    days = data.get("days_valid", 14)
    campaign = GovernanceService.create_campaign(
        organization_id=g.current_org.id,
        title=title,
        days_valid=days,
        actor=g.current_user,
    )
    return jsonify(campaign), 201


@governance_bp.route("/access-reviews/<campaign_id>/items", methods=["GET"])
@governance_bp.route("/governance/access-reviews/<campaign_id>/items", methods=["GET"])
@admin_required
def get_campaign_items(campaign_id):
    items = GovernanceService.get_campaign_items(
        campaign_id=campaign_id,
        organization_id=g.current_org.id,
    )
    return jsonify({"items": items}), 200


@governance_bp.route("/access-reviews/<campaign_id>/items/<item_id>/decide", methods=["POST"])
@governance_bp.route("/access-reviews/<campaign_id>/items/<item_id>/decision", methods=["POST"])
@governance_bp.route("/governance/access-reviews/<campaign_id>/items/<item_id>/decide", methods=["POST"])
@governance_bp.route("/governance/access-reviews/<campaign_id>/items/<item_id>/decision", methods=["POST"])
@admin_required
def decide_campaign_item(campaign_id, item_id):
    data = request.get_json() or {}
    decision = data.get("decision")
    notes = data.get("notes")
    item = GovernanceService.decide_campaign_item(
        campaign_id=campaign_id,
        item_id=item_id,
        organization_id=g.current_org.id,
        decision=decision,
        notes=notes,
        actor=g.current_user,
    )
    return jsonify(item), 200


# --- Storage Lifecycle Insights ---

@governance_bp.route("/storage/insights", methods=["GET"])
@governance_bp.route("/governance/storage-insights", methods=["GET"])
@login_required
def get_storage_insights():
    insights = GovernanceService.get_storage_insights(organization_id=g.current_org.id)
    return jsonify(insights), 200
