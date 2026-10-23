from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

# Argon2id password hasher with secure enterprise defaults
_hasher = PasswordHasher(
    time_cost=3,
    memory_cost=65536,  # 64 MB
    parallelism=4,
    hash_len=32,
    salt_len=16,
)


def hash_password(password: str) -> str:
    """Hashes a password with Argon2id."""
    if not password or len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    return _hasher.hash(password)


def verify_password(hash_str: str, password: str) -> bool:
    """Verifies a plain password against an Argon2id hash."""
    if not hash_str or not password:
        return False
    try:
        return _hasher.verify(hash_str, password)
    except VerifyMismatchError:
        return False
    except Exception:
        return False


def check_needs_rehash(hash_str: str) -> bool:
    """Checks if hash needs rehashing to upgraded parameters."""
    return _hasher.check_needs_rehash(hash_str)
