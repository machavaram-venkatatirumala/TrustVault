# TrustVault — REST API Reference (`/api/v1`)

All endpoints are versioned under `/api/v1`. All JSON responses follow consistent HTTP status codes and standardized error shapes.

---

## Standard Error Format

When an API request fails, the server responds with a descriptive JSON object:
```json
{
  "error": {
    "message": "Access denied: insufficient permission to download this document.",
    "status": 403,
    "details": null
  }
}
```

---

## 1. System Health

### `GET /api/v1/health`
Liveness probe verifying that the web process is running.
- **Auth**: None
- **Response `200 OK`**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-23T16:15:00.000000"
  }
  ```

### `GET /api/v1/ready`
Readiness probe verifying database connectivity.
- **Auth**: None
- **Response `200 OK`**:
  ```json
  {
    "status": "ready",
    "database": "connected",
    "storage": "available"
  }
  ```

---

## 2. Authentication

### `POST /api/v1/auth/register`
Creates a new tenant organization and initial administrator user.
- **Rate Limit**: 3 requests / minute
- **Request Body**:
  ```json
  {
    "full_name": "Jane Doe",
    "email": "jane@acme.example",
    "password": "Password123!",
    "org_name": "Acme Corp"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "user": {
      "id": "uuid",
      "full_name": "Jane Doe",
      "email": "jane@acme.example"
    },
    "organization": {
      "id": "uuid",
      "name": "Acme Corp",
      "slug": "acme-corp"
    },
    "role": "admin"
  }
  ```

### `POST /api/v1/auth/login`
Authenticates user and establishes an `HttpOnly` session cookie.
- **Rate Limit**: 5 requests / minute
- **Request Body**:
  ```json
  {
    "email": "jane@acme.example",
    "password": "Password123!"
  }
  ```
- **Response `200 OK`**: Returns user profile and sets session cookie.

### `POST /api/v1/auth/logout`
Terminates current session and clears session cookie.
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  { "message": "Successfully logged out." }
  ```

### `GET /api/v1/auth/me`
Fetches authenticated user identity and active tenant context.
- **Auth**: Required
- **Response `200 OK`**: Returns user, organization, and role.

---

## 3. Documents

### `GET /api/v1/documents`
Lists documents visible to the current user (all documents if admin; owned or explicitly shared if member).
- **Auth**: Required
- **Query Parameters**:
  - `search` (string): Filename search query.
  - `file_type` (string): Filter by MIME type.
  - `owner_id` (uuid): Filter by owner user ID.
  - `page` (integer, default `1`): Page number.
  - `per_page` (integer, default `20`): Page size.
- **Response `200 OK`**:
  ```json
  {
    "documents": [
      {
        "id": "uuid",
        "original_filename": "Q3_Report.pdf",
        "content_type": "application/pdf",
        "size_bytes": 1048576,
        "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "owner_name": "Jane Doe",
        "last_verification_status": "verified",
        "last_verified_at": "2026-10-23T16:00:00",
        "created_at": "2026-10-23T15:30:00"
      }
    ],
    "total": 1,
    "page": 1,
    "per_page": 20,
    "total_pages": 1
  }
  ```

### `POST /api/v1/documents`
Uploads a new confidential document to private storage. Computes SHA-256 byte stream hash and records audit event.
- **Auth**: Required
- **Content-Type**: `multipart/form-data`
- **Body**: `file`: Binary file payload (max 25MB).
- **Response `201 Created`**: Returns created document metadata.

### `GET /api/v1/documents/<id>/download`
Streams authorized file payload with safe attachment headers.
- **Auth**: Required (Owner, Admin, or active `download` grant).
- **Response `200 OK`**: Binary byte stream with `Content-Disposition: attachment; filename="..."`.

### `POST /api/v1/documents/<id>/verify-integrity`
Reads file bytes from private storage, recalculates SHA-256 digest, compares in constant time, updates database status, and writes audit event.
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  {
    "verified": true,
    "status": "verified",
    "message": "SHA-256 digests match. File integrity is cryptographically verified.",
    "expected_hash": "e3b0c4...",
    "computed_hash": "e3b0c4...",
    "verified_at": "2026-10-23T16:15:00"
  }
  ```

### `POST /api/v1/documents/<id>/simulate-tamper`
**Interview / Demo Endpoint**: Flips 1 bit in physical storage to demonstrate mismatch detection.
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  {
    "message": "Storage file intentionally tampered (1 byte inverted). Run verify-integrity to observe mismatch detection.",
    "document_id": "uuid"
  }
  ```

---

## 4. Permissions & Sharing

### `POST /api/v1/documents/<id>/permissions`
Grants document access to an organization member.
- **Auth**: Required (Owner or Admin)
- **Request Body**:
  ```json
  {
    "recipient_user_id": "uuid",
    "permission_level": "download",
    "expires_at": "2026-11-01T00:00:00Z"
  }
  ```
- **Response `201 Created`**: Returns permission record.

### `DELETE /api/v1/permissions/<permission_id>`
Revokes an existing permission grant immediately.
- **Auth**: Required (Grantor, Owner, or Admin)
- **Response `200 OK`**:
  ```json
  {
    "message": "Permission successfully revoked.",
    "permission_id": "uuid"
  }
  ```

### `GET /api/v1/shared-with-me`
Lists active documents shared with the authenticated user.
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  {
    "shared_documents": [
      {
        "permission_id": "uuid",
        "document_id": "uuid",
        "document_name": "Architecture.pdf",
        "permission_level": "download",
        "can_download": true,
        "grantor_name": "Avery Morgan",
        "created_at": "2026-10-23T12:00:00"
      }
    ]
  }
  ```

---

## 5. Audit Center (Admin Only)

### `GET /api/v1/audit-events`
Lists immutable organization audit logs with rich filtering.
- **Auth**: Admin Required
- **Query Parameters**:
  - `action`: Filter by action (e.g. `document.upload`, `permission.revoke`, `integrity.verify_mismatch`).
  - `outcome`: `success`, `denied`, or `failure`.
  - `search`: Search action, resource, or metadata.
  - `start_date`, `end_date`: ISO 8601 timestamps.
  - `page`, `per_page`: Pagination controls.
- **Response `200 OK`**:
  ```json
  {
    "events": [
      {
        "id": "uuid",
        "actor_name": "Avery Morgan",
        "actor_email": "avery@northstar.example",
        "action": "document.upload",
        "resource_type": "document",
        "resource_id": "uuid",
        "outcome": "success",
        "metadata": {
          "filename": "Review.pdf",
          "sha256": "6bf8dae..."
        },
        "created_at": "2026-10-23T16:10:00"
      }
    ],
    "total": 1,
    "page": 1,
    "per_page": 25,
    "total_pages": 1
  }
  ```

---

## 6. Development Seeding

### `POST /api/v1/seed`
Populates development fixtures for **Northstar Advisory**.
- **Auth**: None (Development only)
- **Response `200 OK`**: Returns test credentials and organization ID.
