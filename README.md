# TrustVault — Secure Document Sharing with a Real Audit Trail

> **“Every document accounted for. Every permission intentional.”**

[![Backend Tests](https://img.shields.io/badge/backend%20tests-16%20passed-207B61?style=flat-square)](file:///d:/Documents/Tirumala%20-%20Projects/TrustVault/backend/tests)
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

The application includes built-in features to make live technical interview demonstrations effortless without fake data:

### Step 1: Initialize Demo Data (1-Click)
- Navigate to `http://localhost:5173/login`.
- Under **Demo Credentials (1-Click)**, click **Avery Morgan (Admin Persona)**.
- TrustVault triggers `POST /api/v1/seed`, initializing the fictional **Northstar Advisory** workspace with 3 realistic members, 5 pre-uploaded documents with SHA-256 digests, active grants, and audit events.

### Step 2: Explain Dashboard Telemetry
- Show the Overview Dashboard: Total documents (5), Active members (3), Shared documents (2), and recent security events.
- Highlight the **7-Day Activity Chart** powered by Recharts, showing database-aggregated event trends.

### Step 3: Upload a Document & Inspect SHA-256 Digest
- Click **Upload Document** and drag in a confidential file (PDF, DOCX, XLSX, PNG).
- Observe the server calculating the SHA-256 hash from raw file bytes, assigning an opaque UUID storage key, and displaying the verified status badge.

### Step 4: Grant Access to a Member
- Click **Share** on any document. Select **Jordan Lee (Member)**.
- Set permission to **View Only** or **Download Allowed**. Optionally add an expiration date.
- Submit the grant; observe the immediate audit log recording the permission event.

### Step 5: Switch Personas Live & Verify RBAC
- In the Topbar, click the **Demo Persona Switcher** and select **Jordan Lee (Member)**.
- Notice the application shell immediately adapts:
  - **Audit Center** and **Members** navigation links disappear from the sidebar.
  - Attempting to visit `/app/audit` directly results in a 403 Forbidden rejection.
  - Navigate to **Shared with Me** to access the granted document.

### Step 6: Revoke Access & Observe Instant Enforcement
- Switch back to **Avery Morgan (Admin)** via the Topbar switcher.
- Open **Access Permissions**, locate Jordan's grant, and click **Revoke Access**.
- Switch back to **Jordan Lee** and attempt to download the document.
- TrustVault denies the request with HTTP `403 Forbidden` and records an unauthorized access denial in the audit log.

### Step 7: Demonstrate Cryptographic Tamper Detection
- As **Avery Morgan**, open **Documents** and click on any document row to view details.
- Click **Simulate Storage Tamper**: This flips bits in the physical storage object on disk while leaving database metadata untouched.
- Click **Verify Cryptographic Integrity**:
  - The backend reads the physical file bytes from disk, re-computes the SHA-256 digest, compares it in constant time against the database digest, and flags **Digest Mismatch**!
  - The audit log immediately records an `integrity.verify_mismatch` security alert.

### Step 8: Review the Audit Center
- Open **Audit Center** to show the complete investigation trail:
  - Timestamp, actor name, action, resource, outcome, and metadata payload.
  - Filter by action (`document.upload`, `permission.revoke`, `integrity.verify_mismatch`) or outcome (`success`, `failure`, `denied`).

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

## 👥 Seeded Demo Accounts

| Name | Role | Email | Password |
| :--- | :--- | :--- | :--- |
| **Avery Morgan** | Organization Admin | `avery.morgan@northstar.example` | `Password123!` |
| **Jordan Lee** | Organization Member | `jordan.lee@northstar.example` | `Password123!` |
| **Taylor Brooks** | Organization Member | `taylor.brooks@northstar.example` | `Password123!` |

*(Can be re-seeded at any time by calling `POST /api/v1/seed` or clicking the demo persona switcher)*
