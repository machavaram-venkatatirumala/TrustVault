from flask import current_app
from .base import BaseStorageProvider
from .local import LocalStorageProvider
from .s3 import S3StorageProvider

_storage_instance: BaseStorageProvider = None


def get_storage() -> BaseStorageProvider:
    """Returns the configured storage provider singleton."""
    global _storage_instance
    if _storage_instance is not None:
        return _storage_instance

    provider = current_app.config.get("STORAGE_PROVIDER", "local").lower()
    if provider == "s3":
        _storage_instance = S3StorageProvider(
            bucket_name=current_app.config.get("S3_BUCKET_NAME"),
            endpoint_url=current_app.config.get("S3_ENDPOINT_URL"),
            access_key=current_app.config.get("S3_ACCESS_KEY_ID"),
            secret_key=current_app.config.get("S3_SECRET_ACCESS_KEY"),
            region=current_app.config.get("S3_REGION", "us-east-1"),
        )
    else:
        _storage_instance = LocalStorageProvider(
            base_path=current_app.config["LOCAL_STORAGE_PATH"]
        )

    return _storage_instance


def reset_storage():
    """Resets the singleton, useful for testing."""
    global _storage_instance
    _storage_instance = None
