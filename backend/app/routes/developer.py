from flask import Blueprint, request, jsonify, g
from ..security.authorization import admin_required, login_required
from ..services.developer_service import DeveloperService

developer_bp = Blueprint("developer", __name__)


# --- Developer Scoped API Keys ---

@developer_bp.route("/developer/api-keys", methods=["GET"])
@admin_required
def list_api_keys():
    keys = DeveloperService.list_api_keys(g.current_org.id)
    return jsonify({"api_keys": keys}), 200


@developer_bp.route("/developer/api-keys", methods=["POST"])
@admin_required
def create_api_key():
    data = request.get_json() or {}
    name = data.get("name")
    scopes = data.get("scopes", ["documents:read"])

    result = DeveloperService.create_api_key(
        name=name,
        scopes=scopes,
        actor=g.current_user,
        organization=g.current_org,
    )
    return jsonify(result), 201


@developer_bp.route("/developer/api-keys/<key_id>", methods=["DELETE"])
@admin_required
def revoke_api_key(key_id):
    result = DeveloperService.revoke_api_key(
        key_id=key_id,
        organization_id=g.current_org.id,
        actor=g.current_user,
    )
    return jsonify(result), 200


# --- Webhooks ---

@developer_bp.route("/developer/webhooks", methods=["GET"])
@admin_required
def list_webhooks():
    subs = DeveloperService.list_webhooks(g.current_org.id)
    return jsonify({"webhooks": subs}), 200


@developer_bp.route("/developer/webhooks", methods=["POST"])
@admin_required
def create_webhook():
    data = request.get_json() or {}
    target_url = data.get("target_url")
    events = data.get("events", ["*"])

    result = DeveloperService.create_webhook(
        target_url=target_url,
        events=events,
        organization=g.current_org,
        actor=g.current_user,
    )
    return jsonify(result), 201


@developer_bp.route("/developer/webhooks/<webhook_id>", methods=["DELETE"])
@admin_required
def delete_webhook(webhook_id):
    result = DeveloperService.delete_webhook(
        webhook_id=webhook_id,
        organization_id=g.current_org.id,
        actor=g.current_user,
    )
    return jsonify(result), 200


@developer_bp.route("/developer/webhooks/<webhook_id>/test", methods=["POST"])
@admin_required
def test_webhook(webhook_id):
    result = DeveloperService.test_webhook(
        webhook_id=webhook_id,
        organization_id=g.current_org.id,
        actor=g.current_user,
    )
    return jsonify(result), 200


# --- OpenAPI 3.0 Specification ---

@developer_bp.route("/openapi.json", methods=["GET"])
def get_openapi_spec():
    spec = {
        "openapi": "3.0.3",
        "info": {
            "title": "TrustVault Platform API",
            "version": "1.0.0",
            "description": (
                "Production-oriented REST API for confidential document management, "
                "cryptographic SHA-256 provenance, expiring access grants, and tamper-evident auditing."
            ),
            "contact": {"name": "TrustVault Security Engineering", "email": "security@trustvault.example"},
        },
        "servers": [{"url": "/api/v1", "description": "Current Environment API Gateway"}],
        "paths": {
            "/documents": {
                "get": {
                    "summary": "List authorized documents",
                    "parameters": [
                        {"name": "search", "in": "query", "schema": {"type": "string"}},
                        {"name": "file_type", "in": "query", "schema": {"type": "string"}},
                        {"name": "page", "in": "query", "schema": {"type": "integer", "default": 1}},
                    ],
                    "responses": {"200": {"description": "Filtered document list"}},
                },
                "post": {
                    "summary": "Upload and register document",
                    "requestBody": {
                        "content": {
                            "multipart/form-data": {
                                "schema": {
                                    "type": "object",
                                    "properties": {"file": {"type": "string", "format": "binary"}},
                                }
                            }
                        }
                    },
                    "responses": {"201": {"description": "Document registered and hashed"}},
                },
            },
            "/documents/{id}/verify-integrity": {
                "post": {
                    "summary": "Execute on-demand SHA-256 byte verification",
                    "responses": {"200": {"description": "Integrity check result"}},
                }
            },
            "/audit-events/verify-chain": {
                "get": {
                    "summary": "Cryptographically verify tenant audit hash chain",
                    "responses": {"200": {"description": "Hash chain verification report"}},
                }
            },
            "/security/alerts": {
                "get": {
                    "summary": "Retrieve detected security anomalies and incidents",
                    "responses": {"200": {"description": "Active security alert feed"}},
                }
            },
        },
    }
    return jsonify(spec), 200
