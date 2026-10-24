from flask import Blueprint, jsonify, g
from ..security.authorization import login_required, admin_required
from ..services.security_monitor_service import SecurityMonitorService

security_alerts_bp = Blueprint("security_alerts", __name__)


@security_alerts_bp.route("/security/alerts", methods=["GET"])
@login_required
def list_security_alerts():
    alerts = SecurityMonitorService.evaluate_and_sync_alerts(g.current_org.id)
    return jsonify({"alerts": alerts}), 200


@security_alerts_bp.route("/security/alerts/<alert_id>/acknowledge", methods=["POST"])
@admin_required
def acknowledge_security_alert(alert_id):
    alert = SecurityMonitorService.acknowledge_alert(
        alert_id=alert_id,
        actor=g.current_user,
        organization_id=g.current_org.id,
    )
    return jsonify(alert), 200


@security_alerts_bp.route("/security/alerts/<alert_id>/resolve", methods=["POST"])
@admin_required
def resolve_security_alert(alert_id):
    alert = SecurityMonitorService.resolve_alert(
        alert_id=alert_id,
        actor=g.current_user,
        organization_id=g.current_org.id,
    )
    return jsonify(alert), 200
