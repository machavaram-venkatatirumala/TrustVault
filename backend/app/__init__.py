from flask import Flask
from .config import Config
from .extensions import db, migrate, cors, limiter
from .errors import register_error_handlers
from .utils.logging import setup_logging
from .routes import (
    health_bp,
    auth_bp,
    org_bp,
    documents_bp,
    permissions_bp,
    audit_bp,
    members_bp,
    dashboard_bp,
)


def create_app(config_class=Config):
    """Application factory for TrustVault."""
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Initialize CORS with narrow origins and credentials enabled
    cors.init_app(
        app,
        origins=app.config.get("CORS_ORIGINS", []),
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
        methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    )
    
    limiter.init_app(app)

    # Setup structured logging and security headers
    setup_logging(app)

    # Register error handlers
    register_error_handlers(app)

    # Register blueprints under /api/v1
    api_prefix = "/api/v1"
    app.register_blueprint(health_bp, url_prefix=api_prefix)
    app.register_blueprint(auth_bp, url_prefix=api_prefix)
    app.register_blueprint(org_bp, url_prefix=api_prefix)
    app.register_blueprint(documents_bp, url_prefix=api_prefix)
    app.register_blueprint(permissions_bp, url_prefix=api_prefix)
    app.register_blueprint(audit_bp, url_prefix=api_prefix)
    app.register_blueprint(members_bp, url_prefix=api_prefix)
    app.register_blueprint(dashboard_bp, url_prefix=api_prefix)

    # Auto-create tables on startup in development/testing mode
    with app.app_context():
        db.create_all()

    return app
