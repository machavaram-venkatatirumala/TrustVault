import os
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"
import shutil
import tempfile
from pathlib import Path
import pytest

from app import create_app
from app.config import TestingConfig
from app.extensions import db
from app.models import User, Organization, OrganizationMembership, Document
from app.security.hashing import hash_password
from app.storage import reset_storage


@pytest.fixture
def app():
    """Creates an isolated application instance for testing."""
    temp_storage = tempfile.mkdtemp()
    
    class CustomTestingConfig(TestingConfig):
        LOCAL_STORAGE_PATH = Path(temp_storage)
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
        TESTING = True

    app = create_app(CustomTestingConfig)

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

    reset_storage()
    if os.path.exists(temp_storage):
        shutil.rmtree(temp_storage, ignore_errors=True)


@pytest.fixture
def client(app):
    """Test HTTP client."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Test CLI runner."""
    return app.test_cli_runner()


@pytest.fixture
def test_setup(app):
    """Creates a default organization, admin user, and member user for testing."""
    with app.app_context():
        org = Organization(name="Acme Corp", slug="acme-corp")
        db.session.add(org)
        db.session.flush()

        pw_hash = hash_password("Password123!")
        
        admin = User(
            full_name="Alice Admin",
            email="alice@acme.example",
            password_hash=pw_hash,
            is_active=True,
        )
        db.session.add(admin)
        db.session.flush()

        admin_membership = OrganizationMembership(
            organization_id=org.id,
            user_id=admin.id,
            role="admin",
            status="active",
        )
        db.session.add(admin_membership)

        member = User(
            full_name="Bob Member",
            email="bob@acme.example",
            password_hash=pw_hash,
            is_active=True,
        )
        db.session.add(member)
        db.session.flush()

        member_membership = OrganizationMembership(
            organization_id=org.id,
            user_id=member.id,
            role="member",
            status="active",
        )
        db.session.add(member_membership)

        # Other organization for tenant isolation tests
        other_org = Organization(name="Other Corp", slug="other-corp")
        db.session.add(other_org)
        db.session.flush()

        other_user = User(
            full_name="Charlie Other",
            email="charlie@other.example",
            password_hash=pw_hash,
            is_active=True,
        )
        db.session.add(other_user)
        db.session.flush()

        other_membership = OrganizationMembership(
            organization_id=other_org.id,
            user_id=other_user.id,
            role="admin",
            status="active",
        )
        db.session.add(other_membership)

        db.session.commit()

        return {
            "org_id": org.id,
            "admin_id": admin.id,
            "admin_email": admin.email,
            "member_id": member.id,
            "member_email": member.email,
            "other_org_id": other_org.id,
            "other_user_id": other_user.id,
            "password": "Password123!",
        }
