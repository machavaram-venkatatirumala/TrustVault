# TrustVault — Secure Document Sharing with a Real Audit Trail

> **“Every document accounted for. Every permission intentional.”**

[![Backend Tests](https://img.shields.io/badge/backend%20tests-26%20passed-207B61?style=flat-square)](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/backend/tests)
[![Frontend Tests](https://img.shields.io/badge/frontend%20tests-10%20passed-207B61?style=flat-square)](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/frontend/tests)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3155D9?style=flat-square)](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/frontend/tsconfig.json)
[![Security](https://img.shields.io/badge/Auth-Argon2id%20%7C%20RBAC-34486B?style=flat-square)](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/docs/security.md)
[![Theme](https://img.shields.io/badge/Theme-Atelier%20Cobalt%20(Light)-6687F5?style=flat-square)](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/frontend/src/index.css)

TrustVault is a production-minded enterprise web application designed for organizations that manage confidential files, enforce strict role-based access control (RBAC), verify cryptographic file integrity (SHA-256), and maintain an immutable, tamper-evident audit trail of every important action.

Built from scratch with a **Forward Deployed Engineer (FDE)** mindset, TrustVault demonstrates complete full-stack architecture, relational database modeling, zero-trust security controls, private storage isolation, and an elegant enterprise SaaS design system.

---

## 🏛️ System Architecture Highlights

```
                               ┌─────────────────────────────────────────┐
                               │       Browser Client (React 19)         │
                               │  Vite • Tailwind CSS v4 • Radix UI      │
                               │  TanStack Query • Recharts • Motion     │
                               └────────────────────┬────────────────────┘
                                                    │
                                         HTTP / JSON / HttpOnly Cookies
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │           Flask 3.0 API Server          │
                               │  Argon2id • RBAC Guards • Rate Limiting │
                               │  SHA-256 Stream Engine • Audit Service  │
                               └────────┬──────────────────────┬─────────┘
                                        │                      │
                   ┌────────────────────┴─────┐       ┌────────┴──────────────┐
                   │  PostgreSQL 16 Database  │       │ Private File Storage  │
                   │  Organizations & Members │       │ Local Isolated Dir /  │
                   │  Documents & Permissions │       │ S3 Private Bucket     │
                   │  Immutable Audit Logs    │       │ (Opaque UUID Keys)    │
                   └──────────────────────────┘       └───────────────────────┘
```

- **Zero-Trust File Access**: Documents are stored in private storage outside the web root. File downloads require server-side evaluation of ownership, organization scoping, active grants, and expiration timestamps.
- **Cryptographic File Integrity**: SHA-256 digests are calculated on the server from the uploaded byte stream. On-demand verification recalculates the live digest from storage bytes and runs timing-safe comparisons to catch bit rot and storage manipulation.
- **Immutable Audit Logging**: Every authentication event, upload, download, permission grant, revocation, and verification attempt is persisted in a queryable audit center.
- **Enterprise Light Design (Atelier Cobalt)**: Clean, high-contrast, professional palette (`#3155D9` cobalt primary, `#FAF9F6` warm background, `#20283B` ink text) adhering to strict enterprise aesthetics.

---

## 🚀 Technical Interview Demonstration Script

The application is built strictly against real PostgreSQL/SQLite databases and private storage without artificial mocks, pre-seeded accounts, or fabricated data:

### Step 1: Create a Real Organization Workspace
- Navigate to `http://localhost:5173/register`.
- Enter your real organization name (e.g. `Acme Security Inc`), full name, email, and password.
- TrustVault validates the input, normalizes the email, establishes the tenant organization, hashes the password using Argon2id, assigns you as the founding **Organization Administrator**, and establishes an authenticated session.

### Step 2: Observe Genuine Empty Workspace Telemetry
- Upon landing on the **Overview Dashboard**, observe that metrics reflect genuine database reality:
  - Total Documents: `0`
  - Active Members: `1` (yourself)
  - Shared Documents: `0`
  - Active Grants: `0`
- The **Activity Chart** displays a clean empty state: *"No activity recorded in the past 7 days"* with an invitation to begin uploading documents.

### Step 3: Upload a Document & Inspect Authoritative SHA-256
- Click **Upload Document** and drag in a confidential file (PDF, DOCX, XLSX, PNG, etc.).
- TrustVault enforces duplicate protection: repeated clicks or network retries with `X-Idempotency-Key` return the existing document without creating duplicate rows or orphaned storage files.
- The server computes the authoritative SHA-256 byte stream hash, stores the file under an opaque UUID storage key, and updates the dashboard metrics immediately.

### Step 4: Invite a Teammate & Verify Duplicate Prevention
- Open **Members** (accessible only to administrators).
- Click **Invite Member** and enroll a teammate. If the email is already in the organization, duplicate creation is rejected.
- Open an incognito browser window, log in as the invited member, and observe that administrator links (**Audit Center** and **Members**) are strictly concealed.

### Step 5: Grant and Revoke Access with Instant Audit Trail
- As the administrator, click **Manage Access** on any document and grant `view` or `download` permissions to the teammate.
- The grant request is idempotent: repeating it with identical policy updates or reuses the active grant rather than generating duplicate records.
- As the member, refresh **Shared with me** to view and download the authorized document.
- Revoke access from the administrator panel: subsequent member requests are immediately rejected with HTTP `403 Forbidden`.

### Step 6: Demonstrate Cryptographic Tamper Detection
- Open **Documents** and inspect the document's cryptographic integrity drawer.
- Click **Simulate Storage Tamper**: This intentionally inverts bits in the physical storage object on disk while leaving database metadata untouched.
- Click **Verify Cryptographic Integrity**:
  - The backend re-hashes physical file bytes from disk, detects the byte divergence via constant-time comparison, flags **Digest Mismatch**, and writes an `integrity.verify_mismatch` security audit event.

### Step 7: Review the Immutable Audit Center
- Open **Audit Center** to review real, persisted audit logs:
  - Timestamp, actor name, action, resource, outcome, and metadata payload.
  - Filter by action (`document.upload`, `permission.grant`, `permission.revoke`, `integrity.verify_mismatch`) or outcome (`success`, `failure`, `denied`).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript (Strict), Vite 8, Tailwind CSS v4 (Atelier Cobalt), Radix UI primitives, Lucide React, React Router v7, TanStack Query v5, Recharts, Framer Motion, date-fns |
| **Backend** | Python 3.13, Flask 3.0, Flask-SQLAlchemy 3.1, Flask-Migrate, Flask-Limiter, Argon2id (`argon2-cffi`), PostgreSQL 16 (with SQLite dev fallback), Pytest |
| **Storage** | Local private filesystem outside web root (Development) / S3-compatible cloud storage (Production) |
| **DevOps** | Docker Compose (PostgreSQL 16), Alembic migrations, Vitest & React Testing Library |

---

## 💻 Local Development Setup (Windows PowerShell)

### Prerequisites
- **Python 3.12+**
- **Node.js 20+** and **npm**
- **Docker Desktop** (optional, for local PostgreSQL container; SQLite fallback works out of the box)

---

### Terminal 1: Backend Setup & Launch

```powershell
# 1. Navigate to backend
cd "d:\Documents\Tirumala - Projects\TrustVault"

# 2. Activate virtual environment
.\backend\venv\Scripts\Activate.ps1

# 3. Set Python path
$env:PYTHONPATH = "backend"

# 4. Optional: Start PostgreSQL via Docker Compose
# docker compose up -d postgres

# 5. Run backend WSGI development server
.\backend\venv\Scripts\python.exe backend/wsgi.py
```
*Backend runs on `http://127.0.0.1:5000` with CORS proxy support.*

---

### Terminal 2: Frontend Setup & Launch

```powershell
# 1. Navigate to frontend
cd "d:\Documents\Tirumala - Projects\TrustVault\frontend"

# 2. Install dependencies (if not already installed)
npm install

# 3. Start Vite development server
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🧪 Automated Testing

### Backend Test Suite (Pytest)
Executes 16 comprehensive integration tests covering user registration, Argon2id hashing, session invalidation, RBAC enforcement, cross-tenant isolation, file upload validation, SHA-256 integrity verification, tamper detection, permission revocation, and audit trail generation:

```powershell
$env:PYTHONPATH = "backend"
.\backend\venv\Scripts\python.exe -m pytest .\backend\tests -v
```

**Output:**
```text
tests/test_audit.py::test_audit_log_generation_and_admin_query PASSED
tests/test_audit.py::test_member_cannot_read_audit_events PASSED
tests/test_auth.py::test_user_registration PASSED
tests/test_auth.py::test_duplicate_email_rejection PASSED
tests/test_auth.py::test_user_login_and_session PASSED
tests/test_auth.py::test_invalid_login_credentials PASSED
tests/test_auth.py::test_logout_invalidates_session PASSED
tests/test_auth.py::test_unauthenticated_api_rejection PASSED
tests/test_documents.py::test_document_upload PASSED
tests/test_documents.py::test_document_download_authorized PASSED
tests/test_documents.py::test_document_deletion PASSED
tests/test_integrity.py::test_sha256_integrity_verification_workflow PASSED
tests/test_permissions.py::test_grant_and_revoke_permission_workflow PASSED
tests/test_tenant_isolation.py::test_cross_tenant_document_access_rejected PASSED
tests/test_tenant_isolation.py::test_cross_tenant_permission_grant_rejected PASSED
tests/test_tenant_isolation.py::test_dashboard_metrics_tenant_isolation PASSED

====================== 16 passed in 2.96s =======================
```

---

### Frontend Test Suite (Vitest)
Executes unit and component tests verifying `IntegrityBadge` states, `LoginPage` validation, and `Sidebar` RBAC visibility:

```powershell
cd frontend
npm run test
```

**Output:**
```text
 ✓ tests/integrity.test.tsx (4 tests)
 ✓ tests/navigation.test.tsx (2 tests)
 ✓ tests/auth.test.tsx (4 tests)

 Test Files  3 passed (3)
      Tests  10 passed (10)
```

---

### Production Build Verification
Verifies strict TypeScript checks and creates minified production bundles:

```powershell
cd frontend
npm run build
```

**Output:**
```text
✓ built in 768ms
dist/index.html                     1.06 kB
dist/assets/index-Dchupme5.css     45.85 kB
dist/assets/index-C3G2W_Tc.js   1,113.07 kB
```

---

## 📚 Technical Documentation

- **[System Architecture](docs/architecture.md)**: Deep dive into the component hierarchy, service layer, relational schema, and verification sequences.
- **[Security Engineering Specification](docs/security.md)**: Threat model, OWASP Top 10 defenses, Argon2id parameters, path traversal safeguards, and MIME sniffing rules.
- **[REST API Reference](docs/api.md)**: Complete endpoint contracts, payload schemas, query parameters, and error shapes for `/api/v1`.
- **[Production Deployment Guide](docs/deployment.md)**: Gunicorn WSGI clustering, Dockerfile containerization, Nginx reverse proxy configuration, and PostgreSQL backup/restore strategies.
- **[Build Progress Log](BUILD_PROGRESS.md)**: Comprehensive checklist tracking all phases of implementation and quality gates.

---

## 🛡️ Real Data & Duplicate Prevention Guarantees

- **Zero Mock / Demo Policy**: No hardcoded arrays, fabricated charts, synthetic audit logs, or demo seed routes exist in the runtime application.
- **Normalization**: User emails are normalized (lowercase and whitespace-stripped) at both registration and login with database-level uniqueness enforcement.
- **Upload Idempotency**: Document uploads support client-provided `X-Idempotency-Key` headers and automatic 10-second double-click deduplication to prevent duplicate records or orphaned files.
- **Permission Deduplication**: Repeated permission grants for the same recipient and document are idempotent and reuse the active policy rather than duplicating rows.
- **Authentic Empty States**: An empty database renders clean informative empty states across all screens rather than falling back to placeholders.
