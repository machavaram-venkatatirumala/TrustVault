# TrustVault — Privacy, Data Handling & Retention Policy (`privacy-and-data-handling.md`)

> **Product Principle:** Privacy by Default. Every permission intentional.  
> **Regulatory Reference:** Draft policy aligning with GDPR principles and India's Digital Personal Data Protection (DPDP) Act.

---

## 1. Principles of Data Processing

1. **Lawfulness, Fairness & Transparency:** TrustVault processes user data strictly to provide secure document storage, cryptographic verification, and intentional sharing workflows.
2. **Purpose Limitation:** User data, document metadata, and file byte streams are never scraped, mined for advertising, or shared with third parties without explicit user direction.
3. **Data Minimization:** Registration collects only essential authentication details: Full Name, Email Address, and Password. No unnecessary enterprise demographic fields are requested.
4. **Accuracy:** Document integrity is cryptographically verified via server-side SHA-256 digests. Users can update their profile information and workspace names at any time.
5. **Storage Limitation & Deletion:** Documents and user accounts are subject to clear retention and hard-deletion policies upon authorized request.
6. **Integrity & Confidentiality (Security):** Passwords hashed with Argon2id; files stored under opaque UUID storage keys outside the public web root; transport protected via TLS.

---

## 2. Categories of Data Processed

| Category | Examples | Purpose | Storage Location | Retention |
| :--- | :--- | :--- | :--- | :--- |
| **Identity Data** | Full Name, Email Address | Account authentication, session management, and notifications | PostgreSQL `users` table | Duration of account lifecycle |
| **Authentication Data** | Argon2id Password Hash, Reset Tokens | Secure login and recovery | PostgreSQL `users` table | Permanent until updated / 1h expiry for tokens |
| **Workspace Data** | Workspace Name, Membership Role | Access control and collaboration | PostgreSQL `organizations` and `organization_memberships` | Duration of workspace lifecycle |
| **Document Metadata** | Filename, MIME type, Size, SHA-256 Digest | Document organization and integrity tracking | PostgreSQL `documents` table | Deleted upon document purge |
| **File Byte Streams** | Raw uploaded file contents | Secure storage and authorized downloads | Private Storage (`storage/` or private S3 bucket) | Purged upon document deletion |
| **Sharing Permissions** | Recipient ID, Permission Level, Expiration | Access governance | PostgreSQL `document_permissions` table | Retained until revoked or expired |
| **Operational Audit Logs** | Event action, actor ID, resource ID, outcome, IP, User-Agent | Security compliance and forensic history | PostgreSQL `audit_logs` table | Default 90 days for tenant audits |

---

## 3. Account Deletion & Data Purge Workflow

TrustVault provides an authorized, self-service account deletion workflow directly inside **Settings > Danger Zone**:

1. **Authentication:** User must be authenticated and confirm deletion through a confirmation dialog.
2. **Ownership Cascade:**
   - If the user is the sole owner of a Personal Workspace, the workspace and all owned document records are flagged for deletion.
   - Physical storage objects corresponding to the owned documents are removed from private storage.
   - User account status is updated to `is_active = False` or hard-deleted.
3. **Audit Immutability:** Historical audit entries record `auth.account_deleted` with the actor ID. Personal identifiers are anonymized in compliance with legal retention requirements.

---

## 4. Data Portability & Export

In accordance with Article 20 of GDPR (Right to Data Portability), workspace administrators can export their data directly from **Settings > Workspace Data Export**:
- **Document Metadata:** Exportable as structured JSON or CSV including filename, file size, content type, SHA-256 digest, upload timestamp, and verification status.
- **Audit Logs:** Exportable as structured JSON or CSV including full event timestamps, actions, outcomes, and resource identifiers.

---

## 5. Cookie & Browser Storage Policy

TrustVault adheres to strict cookie privacy:
- **Essential Cookies Only:** Uses HttpOnly, Secure, SameSite=Lax session cookies strictly required for authentication and CSRF protection.
- **Zero Third-Party Trackers:** No Google Analytics, advertising pixels, or third-party behavioral trackers are embedded in the application.
- **Cookie Consent:** A transparent, non-intrusive `CookieConsent` banner is rendered for first-time visitors with an accessible preferences modal that can be reopened from the footer at any time.
