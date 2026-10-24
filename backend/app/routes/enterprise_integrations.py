from flask import Blueprint, request, jsonify, g
from ..security.authorization import admin_required, login_required
from ..services.enterprise_integration_service import EnterpriseIntegrationService

enterprise_bp = Blueprint("enterprise_integrations", __name__)


# --- OIDC Single Sign-On ---

@enterprise_bp.route("/integrations/oidc", methods=["GET"])
@admin_required
def get_oidc_config():
    config = EnterpriseIntegrationService.get_oidc_config(organization_id=g.current_org.id)
    return jsonify({"oidc": config, **config}), 200


@enterprise_bp.route("/integrations/oidc", methods=["POST"])
@admin_required
def update_oidc_config():
    data = request.get_json() or {}
    result = EnterpriseIntegrationService.update_oidc_config(
        organization_id=g.current_org.id,
        data=data,
        actor=g.current_user,
    )
    return jsonify({"oidc": result, **result}), 200


# --- SCIM 2.0 Provisioning ---

@enterprise_bp.route("/scim/v2/Users", methods=["GET"])
@admin_required
def scim_list_users():
    result = EnterpriseIntegrationService.scim_list_users(organization_id=g.current_org.id)
    return jsonify(result), 200


# --- Tenant Quotas ---

@enterprise_bp.route("/quotas", methods=["GET"])
@login_required
def get_quotas():
    quota = EnterpriseIntegrationService.get_quota(organization_id=g.current_org.id)
    return jsonify(quota), 200


@enterprise_bp.route("/quotas", methods=["PATCH"])
@admin_required
def update_quotas():
    data = request.get_json() or {}
    quota = EnterpriseIntegrationService.update_quota(
        organization_id=g.current_org.id,
        data=data,
        actor=g.current_user,
    )
    return jsonify(quota), 200


# --- Feature Flags ---

@enterprise_bp.route("/feature-flags", methods=["GET"])
@login_required
def list_feature_flags():
    flags = EnterpriseIntegrationService.list_feature_flags(organization_id=g.current_org.id)
    return jsonify({"flags": flags}), 200


@enterprise_bp.route("/feature-flags/<flag_key>", methods=["PATCH"])
@admin_required
def toggle_feature_flag(flag_key):
    data = request.get_json() or {}
    is_enabled = data.get("is_enabled", True)
    flag = EnterpriseIntegrationService.toggle_feature_flag(
        organization_id=g.current_org.id,
        flag_key=flag_key,
        is_enabled=is_enabled,
        actor=g.current_user,
    )
    return jsonify(flag), 200


# --- Disaster Recovery ---

@enterprise_bp.route("/disaster-recovery/backup", methods=["POST"])
@admin_required
def generate_dr_backup():
    result = EnterpriseIntegrationService.generate_dr_backup(
        organization_id=g.current_org.id,
        actor=g.current_user,
    )
    return jsonify(result), 201


# --- Signed Download URLs ---

@enterprise_bp.route("/documents/<document_id>/signed-url", methods=["POST"])
@login_required
def generate_signed_url(document_id):
    data = request.get_json() or {}
    expires_in = int(data.get("expires_in_seconds", 900))
    result = EnterpriseIntegrationService.generate_signed_url(
        document_id=document_id,
        organization_id=g.current_org.id,
        actor=g.current_user,
        expires_in_seconds=expires_in,
    )
    return jsonify(result), 200
