from flask import Blueprint, jsonify, g
from ..security.authorization import login_required
from ..services.notification_service import NotificationService
from ..errors import APIError

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.route("/notifications", methods=["GET"])
@login_required
def get_notifications():
    result = NotificationService.list_notifications(
        user_id=g.current_user.id,
        organization_id=g.current_org.id,
    )
    return jsonify(result), 200


@notifications_bp.route("/notifications/<notification_id>/read", methods=["PATCH"])
@login_required
def mark_read(notification_id):
    success = NotificationService.mark_as_read(
        notification_id=notification_id,
        user_id=g.current_user.id,
    )
    if not success:
        raise APIError("Notification not found.", status_code=404)
    return jsonify({"message": "Marked as read."}), 200


@notifications_bp.route("/notifications/read-all", methods=["POST"])
@login_required
def mark_all_read():
    count = NotificationService.mark_all_as_read(
        user_id=g.current_user.id,
        organization_id=g.current_org.id,
    )
    return jsonify({"message": "All notifications marked as read.", "updated_count": count}), 200
