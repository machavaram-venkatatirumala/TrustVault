from datetime import datetime
from flask import Blueprint, request, jsonify, g
from ..security.authorization import admin_required
from ..services.evidence_service import EvidenceService

evidence_bp = Blueprint("evidence", __name__)


@evidence_bp.route("/evidence", methods=["GET"])
@admin_required
def list_evidence_packages():
    packages = EvidenceService.list_packages(organization_id=g.current_org.id)
    return jsonify({"packages": packages}), 200


@evidence_bp.route("/evidence/generate", methods=["POST"])
@admin_required
def generate_evidence_package():
    data = request.get_json() or {}
    name = data.get("name")
    categories = data.get("categories")
    date_from_str = data.get("date_from")
    date_to_str = data.get("date_to")

    date_from = None
    date_to = None
    if date_from_str:
        try:
            date_from = datetime.fromisoformat(date_from_str.replace("Z", "+00:00"))
        except:
            pass
    if date_to_str:
        try:
            date_to = datetime.fromisoformat(date_to_str.replace("Z", "+00:00"))
        except:
            pass

    package = EvidenceService.generate_package(
        organization_id=g.current_org.id,
        name=name,
        categories=categories,
        actor=g.current_user,
        date_from=date_from,
        date_to=date_to,
    )
    return jsonify(package), 201


@evidence_bp.route("/evidence/<package_id>", methods=["GET"])
@admin_required
def get_evidence_package(package_id):
    package = EvidenceService.get_package_download(
        package_id=package_id,
        organization_id=g.current_org.id,
    )
    return jsonify({"package": package}), 200


@evidence_bp.route("/evidence/<package_id>/download", methods=["GET"])
@admin_required
def download_evidence_package(package_id):
    package = EvidenceService.get_package_download(
        package_id=package_id,
        organization_id=g.current_org.id,
    )
    return jsonify(package), 200
