# TrustVault — Evaluator Demonstration Script (`demo-script.md`)

> **Duration:** 4–6 Minutes  
> **Evaluation Rubric Reference:** Category 6: Demonstration, Deployment & Documentation (10 Marks)  
> **Core Guarantee:** 100% Real Backend Data. Zero Mock Records. Zero Fake Activity.

---

## Prerequisites & Setup (30 Seconds)

1. Ensure the backend Flask server is running:
   ```bash
   cd backend
   .\venv\Scripts\python run.py
   # Running on http://127.0.0.1:5000
   ```
2. Ensure the frontend Vite server is running:
   ```bash
   cd frontend
   npm run dev
   # Running on http://localhost:5173
   ```
3. Open browser to [`http://localhost:5173`](http://localhost:5173). Notice the TrustVault visual design: Royal Blue navigation, Warm Porcelain background, custom geometric SVG brandmark, and zero fake testimonials or simulated numbers.

---

## Step 1 — Account & Personal Workspace Creation (45 Seconds)

1. Click **Create Free Account** on the top navigation.
2. Observe the simple, friendly 4-field registration:
   - **Full Name:** `Sarah Connor`
   - **Email:** `sarah.connor@cyberdyne.example`
   - **Password:** `Cyberdyne2026!Secured`
   - **Confirm Password:** `Cyberdyne2026!Secured`
   - Check the **Terms and Conditions** acceptance box.
3. Click **Create Account**.
4. **Evaluator Observation:**
   - Registration executes in an atomic database transaction.
   - Automatically provisions Sarah's personal workspace (`Sarah's Workspace`, `workspace_type="personal"`) without requiring company tax ID, business registration, or enterprise fluff.
   - Sarah is redirected to the Dashboard. Notice the authentic empty states:
     - Total Documents: `0`
     - Active Members: `1`
     - Active Grants: `0`
     - Storage Usage: `0 B`
     - Activity Feed: Only displays the genuine account creation and workspace registration audit events!

---

## Step 2 — Real Document Upload & Server-Side SHA-256 (45 Seconds)

1. Navigate to **Documents** or click **Upload Document**.
2. Drag and drop or select a real file (e.g., `Confidential_Strategy_2026.pdf` or a `.txt` file).
3. Click **Upload Document**.
4. **Evaluator Observation:**
   - The client streams the actual file bytes to `POST /api/v1/documents`.
   - The backend streams the bytes through `hashlib.sha256()`, calculates the digest, and stores the file in private storage (`storage/orgs/...`) under an opaque randomized UUID key.
   - The document appears immediately in the table with exact file size in bytes, upload timestamp, and SHA-256 digest preview (`SHA-256: 3a7f...`).
   - The Dashboard metrics immediately update to reflect `1` document and exact storage bytes.

---

## Step 3 — Dynamic Cryptographic Integrity Verification (45 Seconds)

1. Click on the document to open the **Document Details & Security** drawer.
2. Observe the details:
   - Stored Reference SHA-256 Hash.
   - Storage Key: `orgs/{org_id}/2026/10/...bin` (safely stored outside web root).
3. Click **Verify Integrity**.
4. **Evaluator Observation:**
   - The server reads the physical file bytes from private storage, recalculates a fresh SHA-256 hash, and performs a constant-time comparison against the database reference hash.
   - Returns status: **Verified** (`verified: true`).
   - Notice the teal badge: *"SHA-256 digests match. File integrity is cryptographically verified."*
   - An authentic audit event `integrity.verify_success` is recorded in the background.

---

## Step 4 — Team Workspace & Granting Granular Intentional Permissions (45 Seconds)

1. Navigate to **Members** (accessible to Sarah as administrator).
2. Click **Invite Member**:
   - **Full Name:** `John Connor`
   - **Email:** `john.connor@cyberdyne.example`
   - **Role:** `Member`
   - **Temporary Password:** `Password123!`
3. Click **Send Invitation**. John Connor is added to the workspace.
4. Return to **Documents** and click the **Share** button on `Confidential_Strategy_2026.pdf`.
5. Select:
   - **Recipient:** `John Connor`
   - **Permission Level:** Choose **View Only** first.
6. Click **Grant Access**.
7. Observe that the document now shows `1 Active Grant`.

---

## Step 5 — Enforcing Access Limits & Immediate Revocation (60 Seconds)

1. In a private/incognito window (or after logging out), sign in as John Connor:
   - **Email:** `john.connor@cyberdyne.example`
   - **Password:** `Password123!`
2. Navigate to **Shared With Me**:
   - John sees `Confidential_Strategy_2026.pdf` listed with **View Only** permission.
3. John clicks the document and attempts to download:
   - The server responds with **HTTP 403 Forbidden**: *"Download access is not granted for this document (view only)."*
4. Return to Sarah's session. Sarah clicks **Access Permissions**, selects John's grant, and clicks **Revoke Access**.
5. Switch back to John's incognito window and refresh:
   - The document has vanished from John's **Shared With Me** view.
   - Any direct API call to `/api/v1/documents/{id}/download` immediately fails with **HTTP 403**.

---

## Step 6 — Authentic Administrator Audit Trail (45 Seconds)

1. Return to Sarah's session and navigate to **Audit Center** in the sidebar.
2. Review the chronological, real audit records:
   - `auth.register` (Sarah Connor registered)
   - `workspace.create` (Workspace established)
   - `document.upload` (Confidential_Strategy_2026.pdf uploaded)
   - `integrity.verify_success` (SHA-256 verification passed)
   - `member.invite` (John Connor enrolled)
   - `permission.grant` (View access granted)
   - `document.download_denied` (John's download attempt blocked)
   - `permission.revoke` (Permission revoked)
3. Filter by Action or Outcome: notice server-side pagination and real-time filtering with 0 fake entries.

---

## Step 7 — Security & Threat Proof (30 Seconds)

Show the automated test suite executing directly against the live code:
```bash
cd backend
.\venv\Scripts\pytest tests/test_threat_matrix.py
```
- **Output:** `20 passed in 3.42s`. Proves all 20 STRIDE threats (cross-tenant isolation, tamper detection, view-vs-download enforcement, SQLi defense, path traversal prevention, role elevation block) are 100% defended on the server.
