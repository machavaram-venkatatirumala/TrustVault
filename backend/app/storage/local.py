import os
import shutil
from pathlib import Path
from typing import BinaryIO
from .base import BaseStorageProvider


class LocalStorageProvider(BaseStorageProvider):
    """Local filesystem storage provider with path isolation."""

    def __init__(self, base_path: Path):
        self.base_path = Path(base_path).resolve()
        self.base_path.mkdir(parents=True, exist_ok=True)

    def _resolve_safe_path(self, key: str) -> Path:
        """Resolves target path and ensures it stays strictly within base_path."""
        if not key or not str(key).strip():
            raise ValueError("Storage key cannot be empty.")

        clean_key = key.lstrip("/\\")
        target = (self.base_path / clean_key).resolve()
        
        # Guard against directory traversal attacks
        try:
            rel = target.relative_to(self.base_path)
            if str(rel) in (".", ""):
                raise ValueError(f"Path traversal detected: {key}")
        except ValueError:
            raise ValueError(f"Path traversal detected: {key}")
            
        return target

    def save(self, key: str, stream: BinaryIO) -> int:
        target_path = self._resolve_safe_path(key)
        target_path.parent.mkdir(parents=True, exist_ok=True)

        bytes_written = 0
        with open(target_path, "wb") as f:
            while True:
                chunk = stream.read(65536)
                if not chunk:
                    break
                f.write(chunk)
                bytes_written += len(chunk)
                
        return bytes_written

    def get_stream(self, key: str) -> BinaryIO:
        target_path = self._resolve_safe_path(key)
        if not target_path.exists() or not target_path.is_file():
            raise FileNotFoundError(f"Storage object not found: {key}")
        return open(target_path, "rb")

    def get_bytes(self, key: str) -> bytes:
        target_path = self._resolve_safe_path(key)
        if not target_path.exists() or not target_path.is_file():
            raise FileNotFoundError(f"Storage object not found: {key}")
        with open(target_path, "rb") as f:
            return f.read()

    def delete(self, key: str) -> bool:
        try:
            target_path = self._resolve_safe_path(key)
            if target_path.exists() and target_path.is_file():
                target_path.unlink()
            return True
        except Exception:
            return False

    def exists(self, key: str) -> bool:
        try:
            target_path = self._resolve_safe_path(key)
            return target_path.exists() and target_path.is_file()
        except Exception:
            return False
