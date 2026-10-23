from flask import Blueprint, jsonify, g
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
    activity = DashboardService.get_activity_series(organization_id=g.current_org.id, days=7)
    return jsonify({"activity": activity}), 200
