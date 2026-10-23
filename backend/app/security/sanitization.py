import os
import re
import uuid
from datetime import datetime
from typing import Tuple


# Magic signatures for allowed file formats
MAGIC_SIGNATURES = {
    "application/pdf": [b"%PDF"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [b"PK\x03\x04"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [b"PK\x03\x04"],
    "image/png": [b"\x89PNG\r\n\x1a\n"],
    "image/jpeg": [b"\xff\xd8\xff"],
    "text/plain": [],  # Validated as UTF-8 or ASCII decodable
    "text/csv": [],
    "application/json": [],
}


def sanitize_filename(filename: str) -> str:
    """
    Sanitizes a user-supplied filename:
    - Strips directory components and path traversal markers (../, ..\\)
    - Replaces unsafe characters with underscores
    - Truncates base name to safe length
    """
    if not filename:
        return "unnamed_document.bin"

    # Extract base filename and prevent path traversal
    base_name = os.path.basename(filename.strip().replace("\\", "/"))
    base_name = re.sub(r"^\.+", "", base_name)  # remove leading dots
    
    # Split name and ext
    name_part, ext_part = os.path.splitext(base_name)
    ext_part = ext_part.lower().strip()
    
    # Keep only alphanumeric, hyphens, underscores, dots, spaces in name
    clean_name = re.sub(r"[^\w\s\.-]", "_", name_part).strip()
    clean_name = re.sub(r"\s+", " ", clean_name)
    
    if not clean_name:
        clean_name = "document"

    # Truncate
    clean_name = clean_name[:120]
    return f"{clean_name}{ext_part}"


def generate_opaque_storage_key(org_id: str, document_id: str) -> str:
    """
    Generates an opaque, path-safe storage key.
    Organized as: orgs/{org_id}/{yyyy}/{mm}/{document_id}.bin
    """
    now = datetime.utcnow()
    year = now.strftime("%Y")
    month = now.strftime("%m")
    unique_suffix = uuid.uuid4().hex[:12]
    return f"orgs/{org_id}/{year}/{month}/{document_id}_{unique_suffix}.bin"


def inspect_file_magic(header_bytes: bytes, claimed_mime: str) -> bool:
    """Validates that initial header bytes match claimed MIME magic signatures."""
    if claimed_mime not in MAGIC_SIGNATURES:
        return False
        
    signatures = MAGIC_SIGNATURES[claimed_mime]
    if not signatures:
        # Text/CSV/JSON: verify no null bytes in the header
        return b"\x00" not in header_bytes[:512]

    return any(header_bytes.startswith(sig) for sig in signatures)
