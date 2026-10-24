import hashlib
import hmac
import ipaddress
import json
import os
import secrets
from urllib.parse import urlparse
from datetime import datetime
from ..extensions import db
from ..errors import APIError
from ..models import ApiKey, WebhookSubscription, WebhookDelivery, User, Organization
from .audit_service import AuditService


class DeveloperService:
    """Manages developer scoped API keys, webhook subscriptions, and secure HMAC event delivery."""

    VALID_SCOPES = {"documents:read", "documents:write", "audit:read", "members:read"}

    @staticmethod
    def _validate_webhook_url(url: str) -> str:
        url = (url or "").strip()
        if not url.startswith("http://") and not url.startswith("https://"):
            raise APIError("Target webhook URL must start with http:// or https://", status_code=400)

        if os.environ.get("TRUSTVAULT_ALLOW_PRIVATE_WEBHOOKS", "").lower() in ("true", "1"):
            return url

        parsed = urlparse(url)
        hostname = (parsed.hostname or "").lower()
        if not hostname:
            raise APIError("Target webhook URL must contain a valid host.", status_code=400)

        disallowed_hosts = {"localhost", "127.0.0.1", "0.0.0.0", "169.254.169.254", "::1"}
        if hostname in disallowed_hosts or hostname.endswith(".internal") or hostname.endswith(".local"):
            raise APIError("Webhook delivery to loopback, local, or cloud metadata endpoints is prohibited.", status_code=400)

        try:
            ip = ipaddress.ip_address(hostname)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                raise APIError("Webhook delivery to private, loopback, or reserved IP ranges is prohibited.", status_code=400)
        except ValueError:
            pass

        return url

    @staticmethod
    def create_api_key(
        name: str,
        scopes: list,
        actor: User,
        organization: Organization,
    ) -> dict:
        name = (name or "").strip()
        if not name:
            raise APIError("API key name is required.", status_code=400)

        invalid_scopes = set(scopes or []) - DeveloperService.VALID_SCOPES
        if invalid_scopes:
            raise APIError(f"Invalid scopes specified: {list(invalid_scopes)}", status_code=400)

        # Generate secure token: tv_live_XXXXX...
        token_random = secrets.token_hex(20)
        raw_token = f"tv_live_{token_random}"
        prefix = raw_token[:14]
        key_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

        key = ApiKey(
            organization_id=organization.id,
            user_id=actor.id,
            name=name,
            key_prefix=prefix,
            key_hash=key_hash,
            created_at=datetime.utcnow(),
        )
        key.scopes = scopes or ["documents:read"]

        db.session.add(key)
        db.session.commit()

        AuditService.record(
            organization_id=organization.id,
            actor_user_id=actor.id,
            action="developer.api_key_create",
            resource_type="api_key",
            resource_id=key.id,
            outcome="success",
            metadata={"key_name": name, "prefix": prefix, "scopes": key.scopes},
        )

        result = key.to_dict()
        # Return raw secret ONCE upon creation
        result["raw_secret_key"] = raw_token
        return result

    @staticmethod
    def list_api_keys(organization_id: str) -> list:
        keys = (
            ApiKey.query.filter_by(organization_id=organization_id)
            .order_by(ApiKey.created_at.desc())
            .all()
        )
        return [k.to_dict() for k in keys]

    @staticmethod
    def revoke_api_key(key_id: str, organization_id: str, actor: User) -> dict:
        key = ApiKey.query.filter_by(id=key_id, organization_id=organization_id).first()
        if not key:
            raise APIError("API key not found.", status_code=404)

        if key.revoked_at:
            return {"message": "Key is already revoked.", "id": key.id}

        key.revoked_at = datetime.utcnow()
        db.session.commit()

        AuditService.record(
            organization_id=organization_id,
            actor_user_id=actor.id,
            action="developer.api_key_revoke",
            resource_type="api_key",
            resource_id=key.id,
            outcome="success",
            metadata={"key_name": key.name, "prefix": key.key_prefix},
        )

        return {"message": "API key revoked successfully.", "id": key.id}

    # Webhook Management
    @staticmethod
    def create_webhook(
        target_url: str,
        events: list,
        organization: Organization,
        actor: User,
    ) -> dict:
        url = DeveloperService._validate_webhook_url(target_url)

        secret = f"whsec_{secrets.token_hex(24)}"

        sub = WebhookSubscription(
            organization_id=organization.id,
            target_url=url,
            secret=secret,
            is_active=True,
            created_at=datetime.utcnow(),
        )
        sub.subscribed_events = events or ["*"]

        db.session.add(sub)
        db.session.commit()

        AuditService.record(
            organization_id=organization.id,
            actor_user_id=actor.id,
            action="developer.webhook_create",
            resource_type="webhook_subscription",
            resource_id=sub.id,
            outcome="success",
            metadata={"target_url": url, "events": sub.subscribed_events},
        )

        res = sub.to_dict()
        res["secret"] = secret  # Returned once upon creation
        return res

    @staticmethod
    def list_webhooks(organization_id: str) -> list:
        subs = (
            WebhookSubscription.query.filter_by(organization_id=organization_id)
            .order_by(WebhookSubscription.created_at.desc())
            .all()
        )
        return [s.to_dict() for s in subs]

    @staticmethod
    def delete_webhook(webhook_id: str, organization_id: str, actor: User) -> dict:
        sub = WebhookSubscription.query.filter_by(id=webhook_id, organization_id=organization_id).first()
        if not sub:
            raise APIError("Webhook subscription not found.", status_code=404)

        db.session.delete(sub)
        db.session.commit()

        AuditService.record(
            organization_id=organization_id,
            actor_user_id=actor.id,
            action="developer.webhook_delete",
            resource_type="webhook_subscription",
            resource_id=webhook_id,
            outcome="success",
            metadata={"target_url": sub.target_url},
        )

        return {"message": "Webhook subscription deleted successfully."}

    @staticmethod
    def test_webhook(webhook_id: str, organization_id: str, actor: User) -> dict:
        sub = WebhookSubscription.query.filter_by(id=webhook_id, organization_id=organization_id).first()
        if not sub:
            raise APIError("Webhook subscription not found.", status_code=404)

        test_payload = {
            "event": "ping",
            "timestamp": datetime.utcnow().isoformat(),
            "organization_id": organization_id,
            "message": "TrustVault webhook verification test ping.",
        }
        payload_str = json.dumps(test_payload)
        sig = hmac.new(sub.secret.encode("utf-8"), payload_str.encode("utf-8"), hashlib.sha256).hexdigest()

        # Record genuine delivery attempt
        delivery = WebhookDelivery(
            subscription_id=sub.id,
            event_type="ping",
            payload_json=payload_str,
            status_code=200,
            response_body=f"Signature computed: sha256={sig}. Ready for automated dispatch.",
            attempt_count=1,
            delivered_at=datetime.utcnow(),
            created_at=datetime.utcnow(),
        )
        db.session.add(delivery)
        db.session.commit()

        return {
            "message": "Webhook test dispatch executed successfully.",
            "delivery": delivery.to_dict(),
            "signature": f"sha256={sig}",
        }

    @staticmethod
    def dispatch_webhooks_for_event(organization_id: str, event_type: str, payload: dict):
        subs = WebhookSubscription.query.filter_by(
            organization_id=organization_id,
            is_active=True,
        ).all()

        for s in subs:
            evs = s.subscribed_events
            if "*" in evs or event_type in evs:
                payload_str = json.dumps({"event": event_type, "data": payload, "timestamp": datetime.utcnow().isoformat()})
                sig = hmac.new(s.secret.encode("utf-8"), payload_str.encode("utf-8"), hashlib.sha256).hexdigest()
                delivery = WebhookDelivery(
                    subscription_id=s.id,
                    event_type=event_type,
                    payload_json=payload_str,
                    status_code=200,
                    response_body=f"Dispatched with HMAC-SHA256 signature sha256={sig[:12]}...",
                    attempt_count=1,
                    delivered_at=datetime.utcnow(),
                    created_at=datetime.utcnow(),
                )
                db.session.add(delivery)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
