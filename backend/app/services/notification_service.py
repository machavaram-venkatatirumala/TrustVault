from datetime import datetime
from ..extensions import db
from ..models import Notification


class NotificationService:
    @staticmethod
    def create_notification(
        user_id: str,
        organization_id: str,
        title: str,
        message: str,
        notification_type: str = "general",
        link: str = None,
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            organization_id=organization_id,
            title=title,
            message=message,
            notification_type=notification_type,
            link=link,
            is_read=False,
            created_at=datetime.utcnow(),
        )
        db.session.add(notification)
        db.session.commit()
        return notification

    @staticmethod
    def list_notifications(user_id: str, organization_id: str, limit: int = 30) -> dict:
        unread_count = Notification.query.filter_by(
            user_id=user_id, organization_id=organization_id, is_read=False
        ).count()

        notifications = (
            Notification.query.filter_by(user_id=user_id, organization_id=organization_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
            .all()
        )

        return {
            "unread_count": unread_count,
            "notifications": [n.to_dict() for n in notifications],
        }

    @staticmethod
    def mark_as_read(notification_id: str, user_id: str) -> bool:
        notification = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
        if notification:
            notification.is_read = True
            db.session.commit()
            return True
        return False

    @staticmethod
    def mark_all_as_read(user_id: str, organization_id: str) -> int:
        count = Notification.query.filter_by(
            user_id=user_id, organization_id=organization_id, is_read=False
        ).update({"is_read": True})
        db.session.commit()
        return count
