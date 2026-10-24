import json
from datetime import datetime
from flask import g, request, has_request_context
from ..extensions import db
from ..models import AuditLog
from ..models.audit_log import compute_canonical_hash


class AuditService:
    """Service responsible for creating and verifying immutable, hash-chained security audit records."""

    GENESIS_HASH = "0" * 64

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
        Creates and persists a cryptographically hash-chained audit log entry.
        Never logs sensitive data (passwords, tokens, raw file contents).
        """
        clean_metadata = {}
        if metadata:
            forbidden_keys = {"password", "token", "secret", "cookie", "auth"}
            for k, v in metadata.items():
                if not any(fk in str(k).lower() for fk in forbidden_keys):
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

        now = datetime.utcnow().replace(microsecond=0)
        now_iso = now.strftime("%Y-%m-%dT%H:%M:%SZ")

        # Find the last recorded audit event for this tenant to link the hash chain
        last_event = (
            AuditLog.query.filter_by(organization_id=organization_id)
            .order_by(AuditLog.sequence_number.desc(), AuditLog.created_at.desc())
            .first()
        )

        if last_event and last_event.sequence_number is not None:
            seq = last_event.sequence_number + 1
            prev_hash = last_event.event_hash or AuditService.GENESIS_HASH
        else:
            seq = 1
            prev_hash = AuditService.GENESIS_HASH

        metadata_str = json.dumps(clean_metadata, sort_keys=True) if clean_metadata else None

        event_hash = compute_canonical_hash(
            sequence_number=seq,
            organization_id=organization_id,
            created_at_iso=now_iso,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            outcome=outcome,
            metadata_json=metadata_str,
            prev_event_hash=prev_hash,
        )

        log_entry = AuditLog(
            organization_id=organization_id,
            actor_user_id=actor_user_id,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            outcome=outcome,
            sequence_number=seq,
            prev_event_hash=prev_hash,
            event_hash=event_hash,
            metadata_json=metadata_str,
            request_id=request_id,
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=now,
        )

        db.session.add(log_entry)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        # Check and trigger outbound webhooks if configured
        try:
            from .developer_service import DeveloperService
            DeveloperService.dispatch_webhooks_for_event(
                organization_id=organization_id,
                event_type=action,
                payload=log_entry.to_dict(),
            )
        except Exception:
            pass

        return log_entry

    @staticmethod
    def verify_chain(organization_id: str) -> dict:
        """
        Cryptographically verifies the full audit trail hash chain for an organization.
        Validates:
        1. Sequence continuity (no gaps or duplicate sequences).
        2. Cryptographic hash validity (recalculated hash matches stored event_hash).
        3. Backward hash linkage (prev_event_hash matches predecessor event_hash).
        """
        events = (
            AuditLog.query.filter_by(organization_id=organization_id)
            .order_by(AuditLog.sequence_number.asc(), AuditLog.created_at.asc())
            .all()
        )

        if not events:
            return {
                "chain_valid": True,
                "total_events": 0,
                "verified_at": datetime.utcnow().isoformat(),
                "head_hash": None,
                "genesis_hash": None,
                "details": "Audit trail is empty. Ready to record cryptographic events.",
            }

        expected_prev_hash = AuditService.GENESIS_HASH

        for i, event in enumerate(events):
            # Check sequence continuity if sequence number is populated
            if event.sequence_number is not None:
                expected_seq = i + 1
                if event.sequence_number != expected_seq:
                    return {
                        "chain_valid": False,
                        "broken_sequence": event.sequence_number,
                        "expected_sequence": expected_seq,
                        "event_id": event.id,
                        "error_type": "sequence_gap",
                        "error_message": f"Sequence gap detected: expected #{expected_seq}, found #{event.sequence_number}.",
                        "total_events": len(events),
                        "verified_at": datetime.utcnow().isoformat(),
                    }

            # Check backward link
            if event.prev_event_hash and event.prev_event_hash != expected_prev_hash:
                return {
                    "chain_valid": False,
                    "broken_sequence": event.sequence_number,
                    "event_id": event.id,
                    "error_type": "broken_link",
                    "error_message": f"Hash chain broken at event #{event.sequence_number}. Predecessor hash does not match prior event.",
                    "expected_prev_hash": expected_prev_hash,
                    "actual_prev_hash": event.prev_event_hash,
                    "total_events": len(events),
                    "verified_at": datetime.utcnow().isoformat(),
                }

            # Recompute canonical hash
            created_iso = event.created_at.strftime("%Y-%m-%dT%H:%M:%SZ") if event.created_at else ""
            recomputed = compute_canonical_hash(
                sequence_number=event.sequence_number or (i + 1),
                organization_id=event.organization_id,
                created_at_iso=created_iso,
                action=event.action,
                resource_type=event.resource_type,
                resource_id=event.resource_id,
                outcome=event.outcome,
                metadata_json=event.metadata_json,
                prev_event_hash=event.prev_event_hash or AuditService.GENESIS_HASH,
            )

            if event.event_hash and event.event_hash != recomputed:
                return {
                    "chain_valid": False,
                    "broken_sequence": event.sequence_number,
                    "event_id": event.id,
                    "error_type": "tampered_payload",
                    "error_message": f"Cryptographic integrity violation at event #{event.sequence_number} ({event.action}). Recalculated hash does not match stored event hash.",
                    "expected_hash": event.event_hash,
                    "recomputed_hash": recomputed,
                    "total_events": len(events),
                    "verified_at": datetime.utcnow().isoformat(),
                }

            expected_prev_hash = event.event_hash or expected_prev_hash

        return {
            "chain_valid": True,
            "total_events": len(events),
            "head_hash": events[-1].event_hash,
            "genesis_hash": events[0].event_hash,
            "verified_at": datetime.utcnow().isoformat(),
            "limitations_notice": (
                "Tamper-evident hash chaining detects unauthorized deletions, reorderings, and modifications "
                "by application users. Privileged attackers with direct database write access could rewrite the chain "
                "unless periodically anchored to external immutable checkpoints."
            ),
        }
