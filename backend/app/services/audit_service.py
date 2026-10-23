from flask import g, request, has_request_context
from ..extensions import db
from ..models import AuditLog


class AuditService:
    """Service responsible for creating immutable security audit records."""

    @staticmethod
    def record(
        organization_id: str,
        action: str,
        resource_type: str,
        resource_id: str = None,
        actor_user_id: str = None,
        outcome: str = "success",
        metadata: dict = None,
    ) -> AuditLog:
        """
        Creates and persists an audit log entry.
        Never logs sensitive data (passwords, tokens, raw file contents).
        """
        clean_metadata = {}
        if metadata:
            # Filter out sensitive keys if inadvertently passed
            forbidden_keys = {"password", "token", "secret", "cookie", "auth"}
            for k, v in metadata.items():
                if not any(fk in k.lower() for fk in forbidden_keys):
                    clean_metadata[k] = v

        request_id = None
        ip_address = None
        user_agent = None

        if has_request_context():
            request_id = getattr(g, "request_id", None)
            ip_address = request.remote_addr
            user_agent = request.user_agent.string if request.user_agent else None
            if not actor_user_id and hasattr(g, "current_user") and g.current_user:
                actor_user_id = g.current_user.id
            if not organization_id and hasattr(g, "current_org") and g.current_org:
                organization_id = g.current_org.id

        log_entry = AuditLog(
            organization_id=organization_id,
            actor_user_id=actor_user_id,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            outcome=outcome,
            request_id=request_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        log_entry.event_metadata = clean_metadata

        db.session.add(log_entry)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return log_entry
