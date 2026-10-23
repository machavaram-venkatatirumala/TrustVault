# TrustVault — Security Engineering Specification

TrustVault is engineered from the ground up to protect confidential organizational assets. This document outlines the security controls, threat mitigations, and defense-in-depth principles implemented across the application.

---

## 1. Threat Model & Security Posture

| Threat Vector | Potential Impact | TrustVault Mitigation Strategy |
| :--- | :--- | :--- |
| **Cross-Tenant Data Leakage** | Organization A reads documents from Organization B | Server-enforced organization scoping on 100% of SQL queries; client-submitted organization IDs are never trusted. |
| **Unauthorized File Download** | Member downloads sensitive document without active permission | Download endpoint performs real-time database permission check evaluating ownership, active grant status, and expiration. |
| **Silent Bit Rot / Storage Tampering** | Storage drive corruption or insider alterations of stored documents | SHA-256 digests calculated on upload and recalculated dynamically on demand using constant-time comparison. |
| **Privilege Escalation** | Regular member grants themselves admin role or accesses audit logs | Role verification decorator `@admin_required` executed server-side prior to route handler invocation. |
| **Path Traversal / Arbitrary File Overwrite** | Malicious filename like `../../etc/passwd` escapes storage boundary | User filenames stripped; files stored under opaque UUID storage keys; path canonicalization prevents traversal. |
| **Malicious File Upload (Web Shell / Executable)** | Attacker uploads executable or script disguised as PDF | Strict file-type allowlist; MIME magic byte header inspection; files stored in private directory outside web server root. |
| **Credential Stuffing & Brute Force** | Automated dictionary attacks against login | Argon2id hashing with high memory cost; Flask-Limiter IP and endpoint rate-limiting (5/min for auth). |
| **Audit Log Tampering** | Rogue actor deletes audit records to conceal illicit activity | No API routes exist to update or delete audit records; audit logs are strictly append-only. |

---

## 2. Authentication & Session Security

### 2.1 Password Hashing with Argon2id
Passwords are never stored in plaintext. TrustVault employs **Argon2id** via `argon2-cffi`, the winner of the Password Hashing Competition (PHC) and OWASP’s top recommendation:
- **Memory Cost (`m`)**: 65,536 KiB (64 MiB)
- **Time Cost (`t`)**: 3 iterations
- **Parallelism (`p`)**: 4 threads
- **Salt**: 16 bytes of cryptographically secure random bytes generated per hash.

### 2.2 Session Management
- **HttpOnly Cookies**: Session cookies cannot be accessed by client-side JavaScript, neutralizing Cross-Site Scripting (XSS) session theft.
- **SameSite Protection**: Set to `Lax` (or `Strict`), defending against Cross-Site Request Forgery (CSRF).
- **Secure Flag**: Activated automatically in production mode over HTTPS.
- **Session Invalidation**: Calling `POST /api/v1/auth/logout` explicitly clears the server-side session dictionary and resets the client cookie.

### 2.3 Rate Limiting
Authentication and sensitive operations are protected by `Flask-Limiter`:
- `/api/v1/auth/login`: 5 requests per minute per IP address.
- `/api/v1/auth/register`: 3 requests per minute per IP address.
- File upload operations: 30 requests per minute per user.

---

## 3. Authorization & Tenant Isolation

### 3.1 Server-Side Enforcement (Never Trust the Client)
TrustVault never relies on client-provided IDs for authorization. Every authenticated request resolves the user and their active organization membership from the server session:
```python
# backend/app/security/authorization.py
@wraps(fn)
def decorated_function(*args, **kwargs):
    user_id = session.get("user_id")
    org_id = session.get("organization_id")
    
    # Verify active organization membership
    membership = OrganizationMembership.query.filter_by(
        user_id=user.id,
        organization_id=org.id,
        status="active"
    ).first()
    if not membership:
        raise APIError("Access denied: inactive organization membership.", status_code=403)
        
    g.current_user = user
    g.current_org = org
    g.current_membership = membership
    return fn(*args, **kwargs)
```

### 3.2 Granular Resource Authorization
Before a document can be viewed or downloaded:
1. Verify `doc.organization_id == g.current_org.id`.
2. If user is document owner -> **Access Granted**.
3. If user is organization administrator -> **Access Granted**.
4. Check for an active grant in `DocumentPermission`:
   - `recipient_user_id == user.id`
   - `revoked_at is NULL`
   - `expires_at is NULL or expires_at > now()`
   - `permission_level == 'download'` (if download is requested)
5. If no active grant matches -> **Access Denied (403 Forbidden)** and security denial event logged in the audit trail.

---

## 4. Secure File Handling & Storage

### 4.1 Opaque Storage Keys
User-supplied filenames are never used as storage paths. Each file is assigned an opaque, non-predictable UUID storage key:
```python
# Format: {org_id}/{yyyy-mm}/{uuid4}.bin
storage_key = f"{org.id}/{datetime.utcnow().strftime('%Y-%m')}/{uuid.uuid4().hex}.bin"
```

### 4.2 Path Traversal Prevention
The local storage driver rigorously verifies that the resolved canonical path remains within the configured private storage root:
```python
# backend/app/storage/local.py
target_path = os.path.abspath(os.path.join(self.base_dir, storage_key))
common = os.path.commonpath([self.base_dir, target_path])
if common != self.base_dir:
    raise SecurityError("Path traversal attempt detected.")
```

### 4.3 Content Type & Magic Byte Sniffing
Client-submitted `Content-Type` headers are treated as untrusted hints. The backend validates file signatures against magic byte tables:
- **PDF**: `%PDF-` (`0x25 0x50 0x44 0x46`)
- **PNG**: `\x89PNG\r\n\x1a\n`
- **JPEG**: `\xFF\xD8\xFF`
- **ZIP / Office XML (docx, xlsx, pptx)**: `PK\x03\x04`

### 4.4 Safe Download Delivery
When streaming documents to clients, headers enforce safe browser handling:
```http
Content-Disposition: attachment; filename="Report.pdf"
X-Content-Type-Options: nosniff
Cache-Control: private, no-cache, no-store, must-revalidate
```

---

## 5. Cryptographic Integrity (SHA-256)

1. **Upload Hashing**: During file upload, the byte stream is fed through Python's `hashlib.sha256()`. The resulting 64-character hexadecimal digest is persisted with the document record.
2. **On-Demand Verification**: When verification is requested:
   - Stored file bytes are re-read from private storage.
   - A fresh SHA-256 digest is generated from the current bytes.
   - The fresh digest is compared against the recorded digest using `hmac.compare_digest` to prevent timing attacks.
3. **Audit Evidence**: Both successful checks and detected mismatches create immediate audit log entries containing expected vs. computed digests.

---

## 6. Audit Trail Immutability & Privacy

1. **System-Generated Only**: Audit records can only be created by server service code; no client API can inject arbitrary audit events.
2. **Read-Only / No Mutation API**: There are no `PUT`, `PATCH`, or `DELETE` endpoints for the `audit_logs` table.
3. **Sanitization of Sensitive Data**: Passwords, session cookies, raw encryption keys, and document payloads are stripped before audit persistence.
4. **Context Attribution**: Each audit event records `actor_user_id`, `actor_name`, `action`, `resource_type`, `resource_id`, `outcome`, `ip_address`, and the unique correlation `request_id`.
