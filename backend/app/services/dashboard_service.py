from datetime import datetime, timedelta
from sqlalchemy import func, distinct, or_

from ..extensions import db
from ..models import Document, DocumentPermission, OrganizationMembership, AuditLog


class DashboardService:
    """Computes real database metrics and aggregated time-series telemetry for dashboards."""

    @staticmethod
    def get_summary_metrics(organization_id: str) -> dict:
        now = datetime.utcnow()
        twenty_four_hours_ago = now - timedelta(hours=24)

        total_documents = Document.query.filter_by(
            organization_id=organization_id, status="active"
        ).count()

        active_members = OrganizationMembership.query.filter_by(
            organization_id=organization_id, status="active"
        ).count()

        # Active permissions count
        active_permissions = DocumentPermission.query.filter(
            DocumentPermission.organization_id == organization_id,
            DocumentPermission.revoked_at.is_(None),
            or_(
                DocumentPermission.expires_at.is_(None),
                DocumentPermission.expires_at > now,
            ),
        ).count()

        # Shared documents count (distinct documents that have active grants)
        shared_documents = (
            db.session.query(func.count(distinct(DocumentPermission.document_id)))
            .filter(
                DocumentPermission.organization_id == organization_id,
                DocumentPermission.revoked_at.is_(None),
                or_(
                    DocumentPermission.expires_at.is_(None),
                    DocumentPermission.expires_at > now,
                ),
            )
            .scalar()
            or 0
        )

        recent_security_events = AuditLog.query.filter(
            AuditLog.organization_id == organization_id,
            AuditLog.created_at >= twenty_four_hours_ago,
        ).count()

        # Integrity metrics
        verified_count = Document.query.filter_by(
            organization_id=organization_id,
            status="active",
            last_verification_status="verified",
        ).count()

        mismatch_count = Document.query.filter_by(
            organization_id=organization_id,
            status="active",
            last_verification_status="mismatch",
        ).count()

        total_storage_bytes = (
            db.session.query(func.coalesce(func.sum(Document.size_bytes), 0))
            .filter(
                Document.organization_id == organization_id,
                Document.status == "active",
            )
            .scalar()
            or 0
        )

        return {
            "total_documents": total_documents,
            "active_members": active_members,
            "shared_documents": shared_documents,
            "active_permissions": active_permissions,
            "recent_security_events": recent_security_events,
            "verified_count": verified_count,
            "mismatch_count": mismatch_count,
            "total_storage_bytes": int(total_storage_bytes),
            "storage_quota_bytes": 1024 * 1024 * 1024,  # 1 GB Starter limit
            "max_members": 5,
            "max_upload_size_bytes": 25 * 1024 * 1024,  # 25 MB limit
            "plan_name": "Starter Vault",
        }

    @staticmethod
    def get_activity_series(organization_id: str, days: int = 7) -> list:
        """Returns daily event counts over the last `days` for time-series charts."""
        now = datetime.utcnow().date()
        date_map = {}

        # Initialize date bins
        for i in range(days - 1, -1, -1):
            d = now - timedelta(days=i)
            date_str = d.strftime("%b %d")
            date_map[d.strftime("%Y-%m-%d")] = {
                "date": date_str,
                "uploads": 0,
                "shares": 0,
                "verifications": 0,
                "downloads": 0,
            }

        start_date = datetime.combine(now - timedelta(days=days), datetime.min.time())
        events = (
            AuditLog.query.filter(
                AuditLog.organization_id == organization_id,
                AuditLog.created_at >= start_date,
            )
            .all()
        )

        for event in events:
            day_key = event.created_at.strftime("%Y-%m-%d")
            if day_key in date_map:
                action = event.action
                if "upload" in action:
                    date_map[day_key]["uploads"] += 1
                elif "grant" in action or "share" in action:
                    date_map[day_key]["shares"] += 1
                elif "verify" in action:
                    date_map[day_key]["verifications"] += 1
                elif "download" in action:
                    date_map[day_key]["downloads"] += 1

        return list(date_map.values())
