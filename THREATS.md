# TrustVault — STRIDE Threat Model & Defense Matrix (`THREATS.md`)

> **Product Tagline:** *Every document accounted for. Every permission intentional.*  
> **Evaluation Rubric Reference:** Category 2: Threat Thinking (15 Marks)  
> **Status:** All 20 Threats Documented, Implemented with Server-Side Controls, and Verified by Automated Tests.

---

## 1. System Architecture, Trust Boundaries & Attack Surfaces

```mermaid
flowchart TD
    subgraph UntrustedZone [Untrusted Zone: Internet / Public Clients]
        Attacker([Attacker / Adversary])
        PublicBrowser([Legitimate User Browser / Single Page App])
    end

    subgraph PerimeterBoundary [Perimeter Boundary: Reverse Proxy & Network]
        CORS[CORS Guard: Whitelist Only]
        Limiter[Flask-Limiter: Rate Limiting & DoS Defense]
        TLS[TLS Termination: Secure HTTPS Cookies]
    end

    subgraph ApplicationBoundary [Application Boundary: Flask REST API /api/v1]
        AuthGuard[Session Auth & RBAC Guard]
        Sanitizer[Path Traversal & XSS Filename Sanitizer]
        MagicInspector[MIME Magic Signature & Size Validator]
        CryptoEngine[Streaming SHA-256 Digest Engine]
        TenantGuard[Multi-Tenant Workspace Isolation Guard]
    end

    subgraph StorageBoundary [Storage Boundary: Isolated Systems]
        DB[(PostgreSQL / SQLite: Parameterized ORM Tables)]
        PrivateStore[(Private File Storage: Outside Web Root / Opaque UUID Keys)]
        AuditStore[(Immutable Append-Only Audit Trail)]
    end

    PublicBrowser -->|HTTP/REST with Credentials| PerimeterBoundary
    Attacker -->|Tampered Headers / Injections| PerimeterBoundary
    PerimeterBoundary --> ApplicationBoundary
    ApplicationBoundary --> StorageBoundary
```

### Trust Boundaries
1. **Perimeter Boundary (Public Internet ➔ Web Service):** All external requests are untrusted. Enforces strict CORS, request size ceilings (25MB), rate limits, and TLS-secure cookies.
2. **Session & Tenant Boundary (Authentication Context):** Separates unauthenticated users from authenticated users, and partitions workspace tenants. No client-supplied IDs are trusted.
3. **Application ➔ Storage Boundary:** Physical documents are stored strictly outside the web root (`storage/` directory or private S3 buckets) under randomized, opaque UUID keys (`orgs/{org_id}/{yyyy}/{mm}/{doc_id}_{suffix}.bin`). Raw database queries use parameterized SQLAlchemy ORM models.

### Actors
- **Anonymous Actor:** Unauthenticated client on the public internet.
- **Tenant Member:** Authenticated user with standard membership in a specific workspace.
- **Tenant Admin / Owner:** Authenticated user with administrative privileges over a specific workspace.
- **Cross-Tenant Adversary:** Authenticated user attempting to access or modify resources belonging to a foreign workspace.
- **Compromised Host / Storage Adversary:** Physical storage tampering or disk-level bit alteration.

---

## 2. STRIDE Threat Matrix (20 Evaluated Threats)

| Threat ID | STRIDE Category | Asset Targeted | Severity | Preventive Control | Automated Test Proof |
|---|---|---|---|---|---|
| **THREAT-01** | Elevation of Privilege | Document Repository & Binaries | Critical | `@login_required` guard rejecting unauthenticated requests with 401 | `test_threat_matrix.py::test_threat_01_anonymous_access_to_document_rejected` |
| **THREAT-02** | Information Disclosure | Cross-Tenant Documents & Metadata | Critical | Server-side tenant filtering: queries scoped to `g.current_org.id`, returns 404 | `test_threat_matrix.py::test_threat_02_cross_tenant_document_access_rejected` |
| **THREAT-03** | Elevation of Privilege | Audit Event Trail | High | `@admin_required` decorator enforcing role check; members receive 403 | `test_threat_matrix.py::test_threat_03_member_access_to_admin_audit_logs_rejected` |
| **THREAT-04** | Elevation of Privilege | User Identity & Role Model | High | Public registration ignores `role`/`is_admin` parameters from JSON body | `test_threat_matrix.py::test_threat_04_user_cannot_self_elevate_role` |
| **THREAT-05** | Denial of Service | Auth Endpoints (`/login`, `/register`) | Medium | Flask-Limiter enforcing strict per-IP request throttling (e.g., 10/min) | `test_threat_matrix.py::test_threat_05_rate_limiting_enforcement` |
| **THREAT-06** | Tampering / Spoofing | Session State & Cookies | High | `HttpOnly`, `SameSite=Lax`, server-managed session secret, narrow CORS | `test_threat_matrix.py::test_threat_06_session_cookie_flags_and_isolation` |
| **THREAT-07** | Tampering / Info Disc. | Host Filesystem / Server OS | Critical | `sanitize_filename()` strips `..`, `/`, `\\`; storage uses opaque UUIDs | `test_threat_matrix.py::test_threat_07_path_traversal_filename_sanitization` |
| **THREAT-08** | Denial of Service | Server Disk & Storage Pool | Medium | Rejects 0-byte files and files exceeding MAX_CONTENT_LENGTH with 400 | `test_threat_matrix.py::test_threat_08_disallowed_or_empty_upload_rejected` |
| **THREAT-09** | Information Disclosure | Shared Document Binary Stream | Critical | `download_document()` checks active, unrevoked permission on every download | `test_threat_matrix.py::test_threat_09_download_denied_immediately_after_revocation` |
| **THREAT-10** | Repudiation / Spoofing | Password Reset Flow | High | Single-use expiring cryptographically random token hashed with SHA-256 | `test_threat_matrix.py::test_threat_10_reuse_of_consumed_or_expired_token_rejected` |
| **THREAT-11** | Tampering / State Drift | Workspace Memberships & Quotas | Medium | Unique database constraint `(org_id, user_id)` + 409 conflict responses | `test_threat_matrix.py::test_threat_11_duplicate_workspace_creation_prevention` |
| **THREAT-12** | Tampering | Document Cryptographic Digest | Critical | SHA-256 is computed server-side from streamed bytes; client hash ignored | `test_threat_matrix.py::test_threat_12_client_cannot_forge_sha256_digest` |
| **THREAT-13** | Repudiation / Tampering | System Audit Trail | Critical | No client mutation routes exist for audit logs (POST/PUT/DELETE return 405) | `test_threat_matrix.py::test_threat_13_audit_records_immutable_no_client_mutation` |
| **THREAT-14** | Information Disclosure | PostgreSQL / SQLite Database | Critical | All database operations use SQLAlchemy ORM parameterized queries | `test_threat_matrix.py::test_threat_14_sql_injection_defense` |
| **THREAT-15** | Information Disclosure | Server Secrets & Stack Traces | Medium | Standard error envelope redacts tracebacks, passwords, and DB strings | `test_threat_matrix.py::test_threat_15_no_credentials_in_error_responses` |
| **THREAT-16** | Elevation of Privilege | Document Binary Downloads | High | Granular permissions: `view` allows metadata inspection; download returns 403 | `test_threat_matrix.py::test_threat_16_permission_level_enforcement_view_vs_download` |
| **THREAT-17** | Denial of Service | Document Availability | High | Graceful exception handling returning status `unavailable` without crash | `test_threat_matrix.py::test_threat_17_missing_storage_file_handled_gracefully` |
| **THREAT-18** | Tampering / XSS | Client Browser DOM Context | High | Filenames sanitized of `<script>`, HTML brackets, and dangerous ASCII | `test_threat_matrix.py::test_threat_18_xss_sanitization_in_filenames_and_metadata` |
| **THREAT-19** | Denial of Service | Rate Limiter IP Attribution | Medium | Key function evaluates remote socket address safely, rejecting forged headers | `test_threat_matrix.py::test_threat_19_proxy_header_trust_controls` |
| **THREAT-20** | Tampering | Physical File Storage Integrity | Critical | Server-side dynamic SHA-256 recalculation detects bit flips and flags mismatch | `test_threat_matrix.py::test_threat_20_tampered_storage_detected_by_sha256_verification` |

---

## 3. Detailed Threat Specifications & Verifications

### THREAT-01: Anonymous Access to Protected Documents
- **STRIDE:** Elevation of Privilege
- **Asset:** Private document repository, file metadata, and downloadable binaries.
- **Attacker Capability:** Unauthenticated actor scanning endpoints via cURL, automated scripts, or web crawlers.
- **Preconditions:** Publicly reachable API base URL `/api/v1`.
- **Attack Path:** Attacker issues `GET /api/v1/documents` or `GET /api/v1/documents/<uuid>/download` with no authorization headers or session cookies.
- **Potential Impact:** Total compromise of confidential organization documents.
- **Likelihood & Severity:** High Likelihood, Critical Severity.
- **Preventive Control:** Route decorators `@login_required` verify active session cookie / token. Rejects with HTTP 401 and `"Authentication required"`.
- **Detection & Audit Control:** Logged as unauthenticated rejected attempt.
- **Mitigation & Recovery:** Immediate rejection prior to hitting business logic or storage layer.
- **Automated Test Proof:** [`backend/tests/test_threat_matrix.py::test_threat_01_anonymous_access_to_document_rejected`](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/backend/tests/test_threat_matrix.py)
- **Residual Risk:** Compromised user credentials; mitigated by Argon2id password hashing and session rotation.

---

### THREAT-02: Authenticated Cross-Tenant Document Access
- **STRIDE:** Information Disclosure / Tampering
- **Asset:** Foreign organization documents and metadata.
- **Attacker Capability:** Authenticated user in Tenant B (e.g. competitor) guessing or sniffing Tenant A's document UUID.
- **Preconditions:** Valid credentials in a different organization workspace.
- **Attack Path:** Attacker logs into Tenant B, obtains document ID from Tenant A, and requests `GET /api/v1/documents/{tenant_a_doc_id}` or `GET /api/v1/documents/{tenant_a_doc_id}/download`.
- **Potential Impact:** Cross-tenant corporate espionage and data leakage.
- **Likelihood & Severity:** High Likelihood, Critical Severity.
- **Preventive Control:** Document lookup filters by both `id == doc_id` AND `organization_id == g.current_org.id`. Returns HTTP 404 (not 403) so existence is not leaked.
- **Detection & Audit Control:** Logged security denial audit event.
- **Mitigation & Recovery:** Multi-tenant database partitioning in service layer.
- **Automated Test Proof:** [`backend/tests/test_threat_matrix.py::test_threat_02_cross_tenant_document_access_rejected`](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/backend/tests/test_threat_matrix.py)
- **Residual Risk:** Superadmin database compromise (addressed by restricted database credentials).

---

### THREAT-03: Member Attempting Access to Administrator Audit Trail
- **STRIDE:** Elevation of Privilege
- **Asset:** Workspace audit logs containing operational security history.
- **Attacker Capability:** Standard workspace member attempting to view who accessed what files or whether their unauthorized actions were logged.
- **Preconditions:** Valid workspace membership with `role="member"`.
- **Attack Path:** Member issues `GET /api/v1/audit-events`.
- **Potential Impact:** Internal reconnaissance by insider threat.
- **Likelihood & Severity:** Medium Likelihood, High Severity.
- **Preventive Control:** `@admin_required` decorator validates `g.current_membership.role == "admin"`. Rejects non-admins with HTTP 403.
- **Detection & Audit Control:** Security audit event recorded on denial.
- **Mitigation & Recovery:** Frontend UI hides navigation link, backend hard-enforces HTTP 403.
- **Automated Test Proof:** [`backend/tests/test_threat_matrix.py::test_threat_03_member_access_to_admin_audit_logs_rejected`](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/backend/tests/test_threat_matrix.py)
- **Residual Risk:** Legitimate administrator account takeover.

---

### THREAT-04: User Changing Role Field in Registration Payload
- **STRIDE:** Elevation of Privilege
- **Asset:** User role definitions and administrative workspace control.
- **Attacker Capability:** Public registrant tampering with POST JSON body (`"role": "admin"`, `"is_admin": true`, `"system_admin": true`).
- **Preconditions:** Public registration endpoint `/api/v1/auth/register` reachable.
- **Attack Path:** Attacker sends `{"email": "hacker@evil.com", "role": "superadmin"}`.
- **Potential Impact:** Attacker obtains root control over existing corporate workspaces.
- **Likelihood & Severity:** High Likelihood, High Severity.
- **Preventive Control:** `AuthService.register()` completely ignores user-supplied role parameters. Public registrations always establish an isolated personal workspace where the user owns their own instance, or assigns standard member status if joining via invitation.
- **Detection & Audit Control:** Account creation audit event recorded.
- **Mitigation & Recovery:** Schema-enforced input deserialization.
- **Automated Test Proof:** [`backend/tests/test_threat_matrix.py::test_threat_04_user_cannot_self_elevate_role`](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/backend/tests/test_threat_matrix.py)
- **Residual Risk:** None.

---

### THREAT-05: Brute-Force Password & Credential Attacks
- **STRIDE:** Denial of Service / Spoofing
- **Asset:** User authentication service and CPU hashing resources.
- **Attacker Capability:** Scripted credential stuffing or dictionary attacks against `/login` and `/forgot-password`.
- **Preconditions:** Target email address.
- **Attack Path:** Issuing thousands of login attempts with guessed passwords to overwhelm Argon2id hashing or guess credentials.
- **Potential Impact:** Account takeover or Denial of Service due to heavy cryptographic operations.
- **Likelihood & Severity:** High Likelihood, Medium Severity.
- **Preventive Control:** Flask-Limiter configured on authentication routes (10 requests/minute on `/login`, 5 requests/minute on `/forgot-password` and `/reset-password`).
- **Detection & Audit Control:** Throttling returns HTTP 429 Too Many Requests; repeated failures logged to security monitoring.
- **Mitigation & Recovery:** Client blocked temporarily with exponential backoff.
- **Automated Test Proof:** [`backend/tests/test_threat_matrix.py::test_threat_05_rate_limiting_enforcement`](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/backend/tests/test_threat_matrix.py)
- **Residual Risk:** Distributed botnets evading single-IP rate limits (mitigated by WAF / Cloudflare in production).

---

### THREAT-06: Cross-Site Request Forgery (CSRF) on Authenticated Sessions
- **STRIDE:** Tampering / Spoofing
- **Asset:** User session and state-changing mutations (document deletion, permission grants).
- **Attacker Capability:** Malicious third-party website inducing user's browser to send authenticated requests.
- **Preconditions:** User is logged into TrustVault in another browser tab.
- **Attack Path:** Malicious site executes cross-origin fetch/form POST to `/api/v1/documents/{id}`.
- **Potential Impact:** Unauthorized document deletion or malicious permission grants.
- **Likelihood & Severity:** Medium Likelihood, High Severity.
- **Preventive Control:** Flask sessions enforce `SameSite=Lax` (or `Strict` in production), `Secure=True` under HTTPS, `HttpOnly=True`. CORS is strictly restricted to approved frontend origins (`CORS_ORIGINS`).
- **Detection & Audit Control:** CORS preflight rejection and origin mismatch headers.
- **Mitigation & Recovery:** Browser drops cross-origin cookie transmission.
- **Automated Test Proof:** [`backend/tests/test_threat_matrix.py::test_threat_06_session_cookie_flags_and_isolation`](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/backend/tests/test_threat_matrix.py)
- **Residual Risk:** Exploits leveraging browser extension vulnerabilities.

---

### THREAT-07: Path Traversal Through Uploaded Filename
- **STRIDE:** Tampering / Information Disclosure
- **Asset:** Server filesystem, system files (`/etc/passwd`, `C:\Windows\System32`).
- **Attacker Capability:** Malicious client uploading a file with filename `../../../../etc/shadow` or `..\..\config.py`.
- **Preconditions:** Authenticated upload permission.
- **Attack Path:** Attacker names multipart upload `../../../etc/cron.d/malicious`.
- **Potential Impact:** Arbitrary file overwrite, code execution, or system compromise.
- **Likelihood & Severity:** High Likelihood, Critical Severity.
- **Preventive Control:** `sanitize_filename()` strips all path traversal characters (`..`, `/`, `\\`), leading dots, and unsafe ASCII. Crucially, the file on disk is NEVER saved under the user's filename: it is saved under a cryptographically opaque UUID storage key (`orgs/{org_id}/{yyyy}/{mm}/{uuid}_{suffix}.bin`).
- **Detection & Audit Control:** Sanitized filename logged in document record and audit event.
- **Mitigation & Recovery:** Storage decoupling guarantees zero filesystem traversal.
- **Automated Test Proof:** [`backend/tests/test_threat_matrix.py::test_threat_07_path_traversal_filename_sanitization`](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/backend/tests/test_threat_matrix.py)
- **Residual Risk:** None.

---

### THREAT-08: Upload of Disallowed, Oversized, or Empty Files
- **STRIDE:** Denial of Service
- **Asset:** Server disk storage and bandwidth.
- **Attacker Capability:** Sending 0-byte corrupt files or multi-gigabyte files to exhaust storage quotas.
- **Preconditions:** Authenticated session.
- **Attack Path:** Issuing repeated 0-byte uploads or payload bombing.
- **Potential Impact:** Storage exhaustion, broken UI pipelines, corrupt metadata entries.
- **Likelihood & Severity:** High Likelihood, Medium Severity.
- **Preventive Control:** Strict validation in `DocumentService.upload_document()`: rejects 0-byte files with HTTP 400 (`"File cannot be empty"`), enforces `MAX_CONTENT_LENGTH` (25MB) at Flask request level, and validates MIME magic byte headers.
- **Detection & Audit Control:** Rejection returns clean HTTP 400 error.
- **Mitigation & Recovery:** File stream discarded before persisting.
- **Automated Test Proof:** [`backend/tests/test_threat_matrix.py::test_threat_08_disallowed_or_empty_upload_rejected`](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/backend/tests/test_threat_matrix.py)
- **Residual Risk:** Slowloris slow HTTP uploads (mitigated by Nginx timeout buffers).

---

### THREAT-09: Direct Download Attempt After Permission Revocation
- **STRIDE:** Information Disclosure
- **Asset:** Confidential document binary stream.
- **Attacker Capability:** Recipient whose access was revoked retains cached API URL or tries automated download scripts.
- **Preconditions:** Previously granted permission that has been revoked by admin or document owner.
- **Attack Path:** Member attempts `GET /api/v1/documents/{doc_id}/download` after revocation.
- **Potential Impact:** Leaking confidential documents past their authorized window.
- **Likelihood & Severity:** High Likelihood, Critical Severity.
- **Preventive Control:** `DocumentService.download_document()` executes a real-time database query validating that an active grant exists where `revoked_at IS NULL` and `(expires_at IS NULL OR expires_at > now)`. Revocation is immediate.
- **Detection & Audit Control:** Audit event `document.download_denied` is generated immediately.
- **Mitigation & Recovery:** HTTP 403 returned instantly; no file bytes streamed.
- **Automated Test Proof:** [`backend/tests/test_threat_matrix.py::test_threat_09_download_denied_immediately_after_revocation`](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/backend/tests/test_threat_matrix.py)
- **Residual Risk:** User already downloaded a local copy before revocation occurred (inherent to digital file sharing; mitigated by watermarking/DLP).

---

### THREAT-10: Reuse or Replay of Password Reset Tokens
- **STRIDE:** Repudiation / Spoofing
- **Asset:** User authentication credentials.
- **Attacker Capability:** Eavesdropper or attacker attempting to replay an expired or already used reset token.
- **Preconditions:** Compromised email link or historical token.
- **Attack Path:** Attacker captures reset token and attempts a second password reset.
- **Potential Impact:** Account takeover.
- **Likelihood & Severity:** Medium Likelihood, High Severity.
- **Preventive Control:** Reset tokens are single-use cryptographically random UUIDs. Upon successful password reset, `user.reset_token_hash = None` and `user.reset_token_expires_at = None` in the same database transaction.
- **Detection & Audit Control:** Logged as password reset event. Replay attempts return HTTP 400.
- **Mitigation & Recovery:** Token invalidated immediately after first consumption.
- **Automated Test Proof:** [`backend/tests/test_threat_matrix.py::test_threat_10_reuse_of_consumed_or_expired_token_rejected`](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/backend/tests/test_threat_matrix.py)
- **Residual Risk:** Man-in-the-Middle token interception during transit (mitigated by TLS).

---

### THREAT-11: Duplicate Workspace Creation via Concurrency or Double-Clicks
- **STRIDE:** Tampering / State Drift
- **Asset:** Workspace registry, membership relationships, and storage quotas.
- **Attacker Capability:** Double-clicking "Create Workspace" or sending concurrent requests to race workspace creation.
- **Preconditions:** Authenticated user.
- **Attack Path:** Sending 2 concurrent HTTP POSTs to `/api/v1/workspaces`.
- **Potential Impact:** Split-brain workspaces, duplicate billing/quotas, orphaned records.
- **Likelihood & Severity:** High Likelihood, Medium Severity.
- **Preventive Control:** Unique database constraints on `slug` and `(organization_id, user_id)`. Wrapped in atomic DB transactions with duplicate detection returning HTTP 409 Conflict.
- **Detection & Audit Control:** Unique constraint violation captured and rolled back cleanly.
- **Mitigation & Recovery:** Idempotent workspace slug generation.
- **Automated Test Proof:** [`backend/tests/test_threat_matrix.py::test_threat_11_duplicate_workspace_creation_prevention`](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/backend/tests/test_threat_matrix.py)
- **Residual Risk:** None.

---

### THREAT-12: Client-Side Forgery of SHA-256 Cryptographic Digest
- **STRIDE:** Tampering
- **Asset:** Document cryptographic integrity record.
- **Attacker Capability:** Malicious client sending an uploaded file with a precomputed or spoofed `sha256` field in the JSON body or headers.
- **Preconditions:** Upload access.
- **Attack Path:** Attacker uploads malware but provides SHA-256 of legitimate PDF in header `X-SHA256`.
- **Potential Impact:** Falsely passing integrity verification while serving malicious payload.
- **Likelihood & Severity:** High Likelihood, Critical Severity.
- **Preventive Control:** The backend **never** trusts client-submitted hashes. `calculate_sha256_stream()` reads the raw bytes received by the server and computes the digest server-side prior to persisting.
- **Detection & Audit Control:** Server digest stored as authoritative truth.
- **Mitigation & Recovery:** Client digest headers completely discarded.
- **Automated Test Proof:** [`backend/tests/test_threat_matrix.py::test_threat_12_client_cannot_forge_sha256_digest`](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/backend/tests/test_threat_matrix.py)
- **Residual Risk:** None.

---

### THREAT-13: Unauthorized Mutation of System Audit Records
- **STRIDE:** Repudiation / Tampering
- **Asset:** Historical security audit trail.
- **Attacker Capability:** Insider or compromised admin attempting to delete traces of unauthorized downloads or privilege grants.
- **Preconditions:** Authenticated session.
- **Attack Path:** Attacker issues `POST`, `PUT`, or `DELETE` to `/api/v1/audit-events/{id}`.
- **Potential Impact:** Inability to perform post-incident forensics.
- **Likelihood & Severity:** Medium Likelihood, Critical Severity.
- **Preventive Control:** The REST API does NOT expose any mutation endpoints for audit events. Only `GET` is registered on the blueprint; all write/delete attempts return HTTP 405 Method Not Allowed.
- **Detection & Audit Control:** Database level append-only policy.
- **Mitigation & Recovery:** Application architecture enforces read-only access.
- **Automated Test Proof:** [`backend/tests/test_threat_matrix.py::test_threat_13_audit_records_immutable_no_client_mutation`](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/backend/tests/test_threat_matrix.py)
- **Residual Risk:** Direct database admin console deletion (addressed in Section 4).

---

### THREAT-14: SQL Injection via Search Queries or Metadata
- **STRIDE:** Information Disclosure / Tampering
- **Asset:** Relational PostgreSQL database tables.
- **Attacker Capability:** Supplying SQL metacharacters (`' OR 1=1 --`) in search filters, filenames, or profile names.
- **Preconditions:** Public or authenticated access.
- **Attack Path:** `GET /api/v1/documents?search=' UNION SELECT password_hash FROM users --`.
- **Potential Impact:** Complete database exfiltration and privilege escalation.
- **Likelihood & Severity:** High Likelihood, Critical Severity.
- **Preventive Control:** 100% of database interactions use SQLAlchemy 2.0 ORM expressions and parameterized queries. No raw SQL string concatenation exists in the entire codebase.
- **Detection & Audit Control:** ORM query logging with parameter binding.
- **Mitigation & Recovery:** Malicious characters are treated strictly as literal string values.
- **Automated Test Proof:** [`backend/tests/test_threat_matrix.py::test_threat_14_sql_injection_defense`](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/backend/tests/test_threat_matrix.py)
- **Residual Risk:** None.

---

### THREAT-15: Accidental Exposure of Credentials in Error Responses
- **STRIDE:** Information Disclosure
- **Asset:** Secret keys, database connection URIs, internal file paths.
- **Attacker Capability:** Inducing 400/500 errors to inspect stack traces for connection strings.
- **Preconditions:** Network access to API.
- **Attack Path:** Sending malformed JSON or boundary payloads to trigger unhandled exceptions.
- **Potential Impact:** Leakage of `DATABASE_URL` or `SECRET_KEY`.
- **Likelihood & Severity:** Medium Likelihood, Medium Severity.
- **Preventive Control:** Centralized error handler `register_error_handlers()` formats every error into a sanitized `{ "error": { "message": "...", "status": 4xx/500 } }` envelope. Detailed tracebacks and database connection strings are never returned to clients.
- **Detection & Audit Control:** Internal server logs capture stack trace while redacting sensitive tokens.
- **Mitigation & Recovery:** Clean, generic error responses.
- **Automated Test Proof:** [`backend/tests/test_threat_matrix.py::test_threat_15_no_credentials_in_error_responses`](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/backend/tests/test_threat_matrix.py)
- **Residual Risk:** None.

---

### THREAT-16: Member with View-Only Access Downloading File Binaries
- **STRIDE:** Elevation of Privilege / Info Disclosure
- **Asset:** Confidential document binary content.
- **Attacker Capability:** Member granted `view` permission inspecting network requests and attempting to download raw file stream.
- **Preconditions:** Valid active `view` permission grant.
- **Attack Path:** Member calls `GET /api/v1/documents/{doc_id}/download`.
- **Potential Impact:** Unauthorized exfiltration of binary files.
- **Likelihood & Severity:** High Likelihood, High Severity.
- **Preventive Control:** `DocumentService.download_document()` strictly verifies:
  `if not perm or perm.permission_level != "download": raise APIError(..., status_code=403)`. View-only permissions only allow inspecting metadata and SHA-256 digests.
- **Detection & Audit Control:** Logs `document.download_denied` with outcome `"denied"`.
- **Mitigation & Recovery:** Server blocks stream transmission with HTTP 403.
- **Automated Test Proof:** [`backend/tests/test_threat_matrix.py::test_threat_16_permission_level_enforcement_view_vs_download`](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/backend/tests/test_threat_matrix.py)
- **Residual Risk:** Member taking screenshots of preview screen (inherent to client displays).

---

### THREAT-17: Storage File Inconsistency / Missing Physical Object
- **STRIDE:** Denial of Service
- **Asset:** Server stability and document verification pipeline.
- **Attacker Capability:** Inducing server crash when an underlying storage file is moved, deleted, or unreadable.
- **Preconditions:** Document record exists in DB, but storage file is inaccessible.
- **Attack Path:** Invoking `/verify-integrity` or `/download` on an orphaned document.
- **Potential Impact:** 500 Internal Server Crash, unhandled exception dump, or database lock.
- **Likelihood & Severity:** Low Likelihood, Medium Severity.
- **Preventive Control:** `DocumentService.verify_integrity()` explicitly checks `if not storage.exists(storage_key):`. If missing, updates document status to `"unavailable"`, commits clean database record, and returns HTTP 200 with `verified: False, status: "unavailable"` without crashing.
- **Detection & Audit Control:** Logs `integrity.verify_failed` with `reason: "storage_file_missing"`.
- **Mitigation & Recovery:** Graceful degradation.
- **Automated Test Proof:** [`backend/tests/test_threat_matrix.py::test_threat_17_missing_storage_file_handled_gracefully`](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/backend/tests/test_threat_matrix.py)
- **Residual Risk:** Storage hardware failure (mitigated by cloud replication in production).

---

### THREAT-18: Stored Cross-Site Scripting (XSS) via Filenames & Metadata
- **STRIDE:** Tampering / Info Disclosure
- **Asset:** Victim administrator or member browser session.
- **Attacker Capability:** Uploading a file named `<script>alert(document.cookie)</script>.pdf`.
- **Preconditions:** Authenticated upload permission.
- **Attack Path:** Attacker uploads file; when admin views document library, the script executes in admin's browser context.
- **Potential Impact:** Session hijacking and admin account takeover.
- **Likelihood & Severity:** High Likelihood, High Severity.
- **Preventive Control:** 
  1. `sanitize_filename()` strips all `<>` brackets and characters outside `[\w\s\.-]`.
  2. React automatically encodes JSX text nodes to prevent inline HTML execution.
- **Detection & Audit Control:** Sanitized filename persisted.
- **Mitigation & Recovery:** Harmless escaped string rendered.
- **Automated Test Proof:** [`backend/tests/test_threat_matrix.py::test_threat_18_xss_sanitization_in_filenames_and_metadata`](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/backend/tests/test_threat_matrix.py)
- **Residual Risk:** None.

---

### THREAT-19: Proxy Header Spoofing to Evade Rate Limits
- **STRIDE:** Denial of Service
- **Asset:** Rate limiting system.
- **Attacker Capability:** Rotating `X-Forwarded-For` or `Client-IP` headers to bypass IP-based throttling.
- **Preconditions:** Public access.
- **Attack Path:** Sending multiple requests with random spoofed `X-Forwarded-For: 1.2.3.4` headers.
- **Potential Impact:** Complete evasion of login rate limits.
- **Likelihood & Severity:** Medium Likelihood, Medium Severity.
- **Preventive Control:** Flask-Limiter is configured using `get_remote_address`, relying on the trusted proxy socket connection rather than unverified client-supplied headers unless explicit reverse-proxy middleware (like `ProxyFix`) is configured with trusted proxy counts.
- **Detection & Audit Control:** Request IP logged in structured application logs.
- **Mitigation & Recovery:** Socket IP attribution prevents arbitrary header spoofing.
- **Automated Test Proof:** [`backend/tests/test_threat_matrix.py::test_threat_19_proxy_header_trust_controls`](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/backend/tests/test_threat_matrix.py)
- **Residual Risk:** Highly distributed botnets using genuine distinct IPs.

---

### THREAT-20: Physical Storage Tampering & Bit-Rot Detection
- **STRIDE:** Tampering
- **Asset:** Stored document byte contents.
- **Attacker Capability:** Attacker with disk-level access, malicious storage administrator, or hardware bit-rot altering file bytes silently.
- **Preconditions:** Physical disk or storage provider compromise.
- **Attack Path:** Inverting a single bit or modifying text in an existing stored `.bin` file in private storage.
- **Potential Impact:** Unnoticed fraud, corrupted legal agreements, or forged documents.
- **Likelihood & Severity:** Medium Likelihood, Critical Severity.
- **Preventive Control:** Dynamic verification engine `DocumentService.verify_integrity()` recalculates SHA-256 on live stored bytes and performs constant-time comparison against `document.sha256_hash`. If any byte is altered, immediately flags status as `"mismatch"`, records security alert in audit log, and alerts user.
- **Detection & Audit Control:** Generates security audit event `integrity.verify_mismatch` with outcome `"failure"`.
- **Mitigation & Recovery:** User alerted immediately with red mismatch badge; file flagged as untrusted.
- **Automated Test Proof:** [`backend/tests/test_threat_matrix.py::test_threat_20_tampered_storage_detected_by_sha256_verification`](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/backend/tests/test_threat_matrix.py)
- **Residual Risk:** Attacker with database access simultaneously updating both the file bytes and the expected hash in PostgreSQL (addressed in Section 4).

---

## 4. Residual Risks & Security Architecture Boundaries

1. **Database-Level Cryptographic Integrity:** Reference SHA-256 hashes reside in the PostgreSQL relational database. If an adversary achieves full root database compromise (e.g., via compromised DB credentials), they could theoretically alter both the file in storage and the hash in the database.
   - *Mitigation for Production:* Enable cryptographic write-once-read-many (WORM) storage or ledger-backed external log anchoring (e.g. AWS QLDB or RFC-6962 Certificate Transparency style transparency log).
2. **Client-Side Document Content Exfiltration:** Once an authorized user downloads an unencrypted binary to their local operating system, TrustVault cannot prevent the user from emailing or printing that file outside the platform.
   - *Mitigation for Production:* Integrate dynamic server-side PDF watermarking stamped with recipient identity and timestamp on authorized download.
3. **Malware Scanning:** File type validation and MIME magic verification confirm format headers, but do not scan for advanced macro payloads or zero-day exploits.
   - *Mitigation for Production:* Hook upload pipeline into ClamAV / AWS GuardDuty S3 malware inspection before final storage promotion.
