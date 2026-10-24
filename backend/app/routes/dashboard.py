from flask import Blueprint, jsonify, request, g
from ..security.authorization import login_required
from ..services.dashboard_service import DashboardService

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/dashboard/summary", methods=["GET"])
@login_required
def get_summary():
    metrics = DashboardService.get_summary_metrics(organization_id=g.current_org.id)
    return jsonify({"metrics": metrics}), 200


@dashboard_bp.route("/dashboard/activity", methods=["GET"])
@login_required
def get_activity():
    days = 7
    days_arg = request.args.get("days")
    if days_arg:
        try:
            days = max(1, min(int(days_arg), 90))
        except (ValueError, TypeError):
            days = 7
    activity = DashboardService.get_activity_series(organization_id=g.current_org.id, days=days)
    return jsonify({"activity": activity, "days": days}), 200
