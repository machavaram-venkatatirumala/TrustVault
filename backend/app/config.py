import os
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root if present
root_dir = Path(__file__).resolve().parent.parent.parent
env_path = root_dir / ".env"
if env_path.exists():
    load_dotenv(env_path)


class Config:
    """Base application configuration."""

    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "t")
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-trustvault-secure-app-2026")

    # Base Directories
    BASE_DIR = Path(__file__).resolve().parent.parent
    PROJECT_ROOT = BASE_DIR.parent
    INSTANCE_DIR = BASE_DIR / "instance"
    INSTANCE_DIR.mkdir(parents=True, exist_ok=True)

    # Database
    # Default to instance sqlite if DATABASE_URL not set or for instant testability
    # Handles both postgresql:// and postgres:// URI formats for compatibility
    db_url = os.getenv("DATABASE_URL", f"sqlite:///{INSTANCE_DIR}/trustvault.db")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URI = db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
    } if not db_url.startswith("sqlite") else {}

    # Storage Configuration
    STORAGE_PROVIDER = os.getenv("STORAGE_PROVIDER", "local")  # 'local' or 's3'
    LOCAL_STORAGE_PATH = Path(os.getenv("LOCAL_STORAGE_PATH", str(PROJECT_ROOT / "storage"))).resolve()
    LOCAL_STORAGE_PATH.mkdir(parents=True, exist_ok=True)
    MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "25"))
    MAX_CONTENT_LENGTH = MAX_UPLOAD_SIZE_MB * 1024 * 1024

    # Allowed document mime types
    ALLOWED_MIME_TYPES = {
        "application/pdf": [".pdf"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
        "application/msword": [".doc"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
        "application/vnd.ms-excel": [".xls"],
        "text/plain": [".txt"],
        "text/csv": [".csv"],
        "application/json": [".json"],
        "image/png": [".png"],
        "image/jpeg": [".jpg", ".jpeg"],
    }

    # S3 Storage Configuration
    S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL")
    S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "trustvault-private-documents")
    S3_ACCESS_KEY_ID = os.getenv("S3_ACCESS_KEY_ID")
    S3_SECRET_ACCESS_KEY = os.getenv("S3_SECRET_ACCESS_KEY")
    S3_REGION = os.getenv("S3_REGION", "us-east-1")

    # Security & Session Settings
    SESSION_COOKIE_NAME = os.getenv("SESSION_COOKIE_NAME", "trustvault_session")
    SESSION_COOKIE_HTTPONLY = os.getenv("SESSION_COOKIE_HTTPONLY", "True").lower() in ("true", "1")
    SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "False").lower() in ("true", "1")
    SESSION_COOKIE_SAMESITE = os.getenv("SESSION_COOKIE_SAMESITE", "Lax")
    PERMANENT_SESSION_LIFETIME = timedelta(
        seconds=int(os.getenv("PERMANENT_SESSION_LIFETIME_SECONDS", "86400"))
    )

    # CORS
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
        if origin.strip()
    ]

    # Rate Limiting
    RATELIMIT_DEFAULT = os.getenv("RATELIMIT_DEFAULT", "120 per minute")
    RATELIMIT_AUTH = os.getenv("RATELIMIT_AUTH", "10 per minute")
    RATELIMIT_STORAGE_URI = "memory://"


class TestingConfig(Config):
    TESTING = True
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    STORAGE_PROVIDER = "local"
    SESSION_COOKIE_SECURE = False
    RATELIMIT_ENABLED = False
