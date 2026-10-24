from datetime import datetime, timedelta
from sqlalchemy import func
from ..extensions import db
from ..errors import APIError
from ..models import SecurityAlert, AuditLog, DocumentPermission, Document, User
from .audit_service import AuditService


class SecurityMonitorService:
    """Detects meaningful security anomalies and monitors incident lifecycle from backend activity."""

    @staticmethod
    def evaluate_and_sync_alerts(organization_id: str) -> list:
        """
        Evaluates real backend audit events and system state against detection thresholds.
        Deduplicates open alerts to avoid alert fatigue.
        """
        now = datetime.utcnow()
        new_alerts = []

        # 1. Detection Rule: Repeated Denied Access Attempts (3+ in 15 mins)
        fifteen_mins_ago = now - timedelta(minutes=15)
        denied_events = (
            AuditLog.query.filter(
                AuditLog.organization_id == organization_id,
                AuditLog.outcome == "denied",
                AuditLog.created_at >= fifteen_mins_ago,
            )
            .order_by(AuditLog.created_at.desc())
            .all()
        )

        if len(denied_events) >= 3:
            existing_open = SecurityAlert.query.filter_by(
                organization_id=organization_id,
                alert_type="brute_force_access_denied",
                status="open",
            ).first()

            if not existing_open:
                alert = SecurityAlert(
                    organization_id=organization_id,
                    alert_type="brute_force_access_denied",
                    severity="warning",
                    title="Repeated Access Denials Detected",
                    description=f"{len(denied_events)} unauthorized access attempts were blocked within the last 15 minutes.",
                    created_at=now,
                )
                alert.evidence = {
                    "count": len(denied_events),
                    "window_minutes": 15,
                    "sample_actions": [e.action for e in denied_events[:5]],
                    "actors": list({e.actor_email or "anonymous" for e in denied_events if e.actor_email}),
                    "ips": list({e.ip_address for e in denied_events if e.ip_address}),
                }
                db.session.add(alert)
                new_alerts.append(alert)

        # 2. Detection Rule: Cryptographic Tamper Mismatch
        one_day_ago = now - timedelta(hours=24)
        mismatch_events = (
            AuditLog.query.filter(
                AuditLog.organization_id == organization_id,
                AuditLog.action.in_(["integrity.verify_mismatch", "tamper.detected"]),
                AuditLog.created_at >= one_day_ago,
            )
            .order_by(AuditLog.created_at.desc())
            .all()
        )

        for ev in mismatch_events:
            existing_mismatch_alert = SecurityAlert.query.filter_by(
                organization_id=organization_id,
                alert_type="tamper_mismatch",
                status="open",
            ).first()

            if not existing_mismatch_alert:
                alert = SecurityAlert(
                    organization_id=organization_id,
                    alert_type="tamper_mismatch",
                    severity="critical",
                    title="Cryptographic Hash Mismatch / Storage Tamper Alert",
                    description=f"A stored document byte stream failed cryptographic verification against its authoritative SHA-256 fingerprint.",
                    created_at=ev.created_at,
                )
                alert.evidence = {
                    "event_id": ev.id,
                    "resource_id": ev.resource_id,
                    "metadata": ev.event_metadata,
                    "detected_at": ev.created_at.isoformat() if ev.created_at else None,
                }
                db.session.add(alert)
                new_alerts.append(alert)
                break

        # 3. Detection Rule: Expiring Share Grants within 48 Hours
        in_48_hours = now + timedelta(hours=48)
        expiring_grants = (
            DocumentPermission.query.filter(
                DocumentPermission.organization_id == organization_id,
                DocumentPermission.revoked_at.is_(None),
                DocumentPermission.expires_at.is_not(None),
                DocumentPermission.expires_at > now,
                DocumentPermission.expires_at <= in_48_hours,
            ).all()
        )

        if expiring_grants:
            existing_expiring = SecurityAlert.query.filter_by(
                organization_id=organization_id,
                alert_type="expiring_grants",
                status="open",
            ).first()

            if not existing_expiring:
                alert = SecurityAlert(
                    organization_id=organization_id,
                    alert_type="expiring_grants",
                    severity="info",
                    title="Time-Bounded Sharing Grants Expiring Soon",
                    description=f"{len(expiring_grants)} sharing permission grants will expire automatically within the next 48 hours.",
                    created_at=now,
                )
                alert.evidence = {
                    "expiring_count": len(expiring_grants),
                    "grants": [
                        {
                            "permission_id": g.id,
                            "recipient": g.recipient_user.email if g.recipient_user else "Unknown",
                            "expires_at": g.expires_at.isoformat() if g.expires_at else None,
                        }
                        for g in expiring_grants[:5]
                    ],
                }
                db.session.add(alert)
                new_alerts.append(alert)

        # 4. Detection Rule: Quarantined Files
        quarantined_docs = Document.query.filter_by(
            organization_id=organization_id,
            scan_status="quarantined",
        ).all()

        if quarantined_docs:
            existing_quarantine_alert = SecurityAlert.query.filter_by(
                organization_id=organization_id,
                alert_type="malware_detected",
                status="open",
            ).first()

            if not existing_quarantine_alert:
                alert = SecurityAlert(
                    organization_id=organization_id,
                    alert_type="malware_detected",
                    severity="critical",
                    title="Malware Threat Quarantined",
                    description=f"{len(quarantined_docs)} document(s) have been quarantined by security scanners and blocked from download.",
                    created_at=now,
                )
                alert.evidence = {
                    "quarantined_files": [d.original_filename for d in quarantined_docs],
                }
                db.session.add(alert)
                new_alerts.append(alert)

        if new_alerts:
            db.session.commit()

        # Return all alerts for this organization
        alerts = (
            SecurityAlert.query.filter_by(organization_id=organization_id)
            .order_by(SecurityAlert.created_at.desc())
            .all()
        )
        return [a.to_dict() for a in alerts]

    @staticmethod
    def acknowledge_alert(alert_id: str, actor: User, organization_id: str) -> dict:
        alert = SecurityAlert.query.filter_by(id=alert_id, organization_id=organization_id).first()
        if not alert:
            raise APIError("Security alert not found.", status_code=404)

        alert.status = "acknowledged"
        db.session.commit()

        AuditService.record(
            organization_id=organization_id,
            actor_user_id=actor.id,
            action="security.alert_acknowledged",
            resource_type="security_alert",
            resource_id=alert.id,
            outcome="success",
            metadata={"alert_type": alert.alert_type, "severity": alert.severity},
        )

        return alert.to_dict()

    @staticmethod
    def resolve_alert(alert_id: str, actor: User, organization_id: str) -> dict:
        alert = SecurityAlert.query.filter_by(id=alert_id, organization_id=organization_id).first()
        if not alert:
            raise APIError("Security alert not found.", status_code=404)

        alert.status = "resolved"
        alert.resolved_at = datetime.utcnow()
        alert.resolved_by = actor.id
        db.session.commit()

        AuditService.record(
            organization_id=organization_id,
            actor_user_id=actor.id,
            action="security.alert_resolved",
            resource_type="security_alert",
            resource_id=alert.id,
            outcome="success",
            metadata={"alert_type": alert.alert_type, "severity": alert.severity},
        )

        return alert.to_dict()
