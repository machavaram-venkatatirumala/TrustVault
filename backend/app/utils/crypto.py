import hashlib
import hmac
from typing import BinaryIO


def calculate_sha256_bytes(data: bytes) -> str:
    """Computes the SHA-256 hexadecimal digest of raw bytes."""
    hasher = hashlib.sha256()
    hasher.update(data)
    return hasher.hexdigest().lower()


def calculate_sha256_stream(stream: BinaryIO, chunk_size: int = 65536) -> str:
    """Computes the SHA-256 hexadecimal digest from a readable binary stream."""
    hasher = hashlib.sha256()
    position = stream.tell() if hasattr(stream, "tell") else None
    
    while True:
        chunk = stream.read(chunk_size)
        if not chunk:
            break
        hasher.update(chunk)
        
    if position is not None and hasattr(stream, "seek"):
        stream.seek(position)
        
    return hasher.hexdigest().lower()


def constant_time_compare(val1: str, val2: str) -> bool:
    """Performs constant-time comparison of two hex hashes to prevent timing attacks."""
    if not val1 or not val2:
        return False
    return hmac.compare_digest(val1.lower(), val2.lower())
