import json
from datetime import datetime, timedelta
from ..extensions import db
from ..models import (
    SavedSearch,
    AccessReviewCampaign,
    AccessReviewItem,
    Document,
    DocumentPermission,
    User,
)
from ..errors.handlers import APIError
from .audit_service import AuditService


class GovernanceService:
    """Document intelligence, smart saved filters, periodic access review campaigns, and storage insights."""

    # --- Saved Searches & Smart Filters ---

    @staticmethod
    def list_saved_searches(organization_id: str, user_id: str) -> list:
        searches = (
            SavedSearch.query.filter(
                SavedSearch.organization_id == organization_id,
                (SavedSearch.user_id == user_id) | (SavedSearch.is_shared == True),
            )
            .order_by(SavedSearch.created_at.desc())
            .all()
        )
        return [s.to_dict() for s in searches]

    @staticmethod
    def create_saved_search(organization_id: str, actor: User, data: dict) -> dict:
        criteria = dict(data.get("criteria") or {})
        if "query" in data and "query" not in criteria:
            criteria["query"] = data.get("query")
        if "classification" in data and "classification" not in criteria:
            criteria["classification"] = data.get("classification")

        search = SavedSearch(
            organization_id=organization_id,
            user_id=actor.id,
            name=data.get("name", "Untitled Filter"),
            description=data.get("description"),
            filter_criteria_json=json.dumps(criteria),
            is_shared=data.get("is_shared", False),
            created_at=datetime.utcnow(),
        )
        db.session.add(search)
        db.session.commit()
        return search.to_dict()

    @staticmethod
    def delete_saved_search(search_id: str, organization_id: str, actor: User, is_admin: bool = False) -> dict:
        search = SavedSearch.query.filter_by(id=search_id, organization_id=organization_id).first()
        if not search:
            raise APIError("Saved search not found.", status_code=404)
        if not is_admin and search.user_id != actor.id:
            raise APIError("You are not authorized to delete this saved search.", status_code=403)
        db.session.delete(search)
        db.session.commit()
        return {"message": "Saved search deleted."}

    # --- Duplicate Content Detection ---

    @staticmethod
    def find_duplicates(document_id: str, organization_id: str, actor: User = None, is_admin: bool = False) -> list:
        """
        Finds identical content by SHA-256 within the same organization tenant.
        Zero cross-tenant leakage. Enforces document authorization.
        """
        doc = Document.query.filter_by(id=document_id, organization_id=organization_id).first()
        if not doc or doc.status == "purged":
            raise APIError("Document not found.", status_code=404)

        if actor and not is_admin and doc.owner_id != actor.id:
            active_perm = DocumentPermission.query.filter_by(
                document_id=doc.id,
                recipient_user_id=actor.id,
                revoked_at=None,
            ).first()
            if not (active_perm and active_perm.is_active):
                raise APIError("You are not authorized to view duplicates for this document.", status_code=403)

        matching = (
            Document.query.filter(
                Document.organization_id == organization_id,
                Document.sha256_hash == doc.sha256_hash,
                Document.id != doc.id,
                Document.status == "active",
            ).all()
        )
        return [m.to_dict() for m in matching]

    # --- Access Review Campaigns ---

    @staticmethod
    def list_campaigns(organization_id: str) -> list:
        campaigns = (
            AccessReviewCampaign.query.filter_by(organization_id=organization_id)
            .order_by(AccessReviewCampaign.created_at.desc())
            .all()
        )
        return [c.to_dict() for c in campaigns]

    @staticmethod
    def create_campaign(organization_id: str, title: str, days_valid: int, actor: User) -> dict:
        deadline = datetime.utcnow() + timedelta(days=days_valid or 14)
        campaign = AccessReviewCampaign(
            organization_id=organization_id,
            title=title.strip() if title else f"Quarterly Access Review {datetime.utcnow().strftime('%Y-Q%m')}",
            reviewer_id=actor.id,
            deadline=deadline,
            status="active",
            created_at=datetime.utcnow(),
        )
        db.session.add(campaign)
        db.session.flush()

        # Populate with currently active permissions in this organization
        active_perms = (
            DocumentPermission.query.join(Document)
            .filter(
                Document.organization_id == organization_id,
                DocumentPermission.revoked_at == None,
            )
            .all()
        )

        for p in active_perms:
            item = AccessReviewItem(
                campaign_id=campaign.id,
                permission_id=p.id,
            )
            db.session.add(item)

        db.session.commit()

        AuditService.record(
            organization_id=organization_id,
            actor_user_id=actor.id,
            action="access_review.campaign_created",
            resource_type="access_review_campaign",
            resource_id=campaign.id,
            outcome="success",
            metadata={"title": campaign.title, "items_count": len(active_perms)},
        )

        return campaign.to_dict()

    @staticmethod
    def get_campaign_items(campaign_id: str, organization_id: str) -> list:
        campaign = AccessReviewCampaign.query.filter_by(id=campaign_id, organization_id=organization_id).first()
        if not campaign:
            raise APIError("Campaign not found.", status_code=404)
        items = AccessReviewItem.query.filter_by(campaign_id=campaign.id).all()
        return [i.to_dict() for i in items]

    @staticmethod
    def get_campaign(campaign_id: str, organization_id: str) -> dict:
        campaign = AccessReviewCampaign.query.filter_by(id=campaign_id, organization_id=organization_id).first()
        if not campaign:
            raise APIError("Campaign not found.", status_code=404)
        return campaign.to_dict()

    @staticmethod
    def decide_campaign_item(campaign_id: str, item_id: str, organization_id: str, decision: str, notes: str, actor: User) -> dict:
        campaign = AccessReviewCampaign.query.filter_by(id=campaign_id, organization_id=organization_id).first()
        if not campaign:
            raise APIError("Campaign not found or access denied.", status_code=404)
        item = AccessReviewItem.query.filter_by(id=item_id, campaign_id=campaign.id).first()
        if not item:
            raise APIError("Review item not found.", status_code=404)

        norm_decision = (decision or "").strip().lower()
        if norm_decision in ("remove", "revoked", "revoke"):
            item.decision = "revoked"
        elif norm_decision in ("confirm", "confirmed"):
            item.decision = "confirmed"
        else:
            item.decision = decision

        item.notes = notes
        item.decided_at = datetime.utcnow()

        # If decision is revoked / remove, revoke the permission immediately!
        if norm_decision in ("remove", "revoked", "revoke") and item.permission:
            item.permission.revoked_at = datetime.utcnow()
            AuditService.record(
                organization_id=organization_id,
                actor_user_id=actor.id,
                action="permission.revoked_via_review",
                resource_type="permission",
                resource_id=item.permission_id,
                outcome="success",
                metadata={"campaign_id": campaign_id, "notes": notes},
            )

        db.session.commit()
        return item.to_dict()

    # --- Storage Lifecycle Insights ---

    @staticmethod
    def get_storage_insights(organization_id: str) -> dict:
        docs = Document.query.filter_by(organization_id=organization_id, status="active").all()
        total_bytes = sum(d.size_bytes for d in docs)
        largest = sorted(docs, key=lambda d: d.size_bytes, reverse=True)[:5]

        # Stale: not accessed/verified in > 30 days
        month_ago = datetime.utcnow() - timedelta(days=30)
        stale = [d for d in docs if (d.last_verified_at or d.created_at) < month_ago]

        # Documents without active sharing grants
        unshared = [d for d in docs if not any(not p.revoked_at for p in d.permissions)]

        # Classification breakdown
        classification_stats = {}
        for d in docs:
            cls = getattr(d, "classification", "Internal") or "Internal"
            classification_stats[cls] = classification_stats.get(cls, 0) + 1

        return {
            "total_documents": len(docs),
            "total_bytes": total_bytes,
            "largest_documents": [
                {"id": d.id, "name": d.original_filename, "size_bytes": d.size_bytes, "classification": getattr(d, "classification", "Internal")}
                for d in largest
            ],
            "stale_count": len(stale),
            "unshared_count": len(unshared),
            "classification_breakdown": classification_stats,
        }
