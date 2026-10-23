from .health import health_bp
from .auth import auth_bp
from .organization import org_bp
from .documents import documents_bp
from .permissions import permissions_bp
from .audit import audit_bp
from .members import members_bp
from .dashboard import dashboard_bp
from .seed import seed_bp

__all__ = [
    "health_bp",
    "auth_bp",
    "org_bp",
    "documents_bp",
    "permissions_bp",
    "audit_bp",
    "members_bp",
    "dashboard_bp",
    "seed_bp",
]
