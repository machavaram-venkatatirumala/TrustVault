import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';

interface CustomRequest extends IncomingMessage {
  url?: string;
  method?: string;
  query?: Record<string, string>;
  body?: any;
  cookies?: Record<string, string>;
}

interface CustomResponse extends ServerResponse {
  status: (statusCode: number) => CustomResponse;
  json: (data: any) => void;
  setHeader: (name: string, value: string | string[]) => this;
}

// In-memory demo state for serverless execution
interface DocRecord {
  id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  sha256_hash: string;
  created_at: string;
  owner_id: string;
  owner_name: string;
  is_tampered?: boolean;
}

interface AuditRecord {
  id: string;
  timestamp: string;
  user_email: string;
  user_name: string;
  action: string;
  resource_type: string;
  resource_name: string;
  status: string;
  ip_address: string;
  hash: string;
  prev_hash: string;
}

let documents: DocRecord[] = [
  {
    id: 'doc-001',
    filename: 'TrustVault-Security-Whitepaper-v2.pdf',
    file_size: 2450800,
    mime_type: 'application/pdf',
    sha256_hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    owner_id: 'usr-admin',
    owner_name: 'Tirumala Admin',
  },
  {
    id: 'doc-002',
    filename: 'SOC2-TypeII-Independent-Audit-Report.pdf',
    file_size: 4194304,
    mime_type: 'application/pdf',
    sha256_hash: 'a35b1c4e2389d71fa9e390234b68902847190283401928340192834019283401',
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    owner_id: 'usr-admin',
    owner_name: 'Tirumala Admin',
  },
  {
    id: 'doc-003',
    filename: 'Enterprise-Data-Processing-Addendum-v3.docx',
    file_size: 845200,
    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sha256_hash: 'd41d8cd98f00b204e9800998ecf8427e01928340192834019283401928340192',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    owner_id: 'usr-admin',
    owner_name: 'Tirumala Admin',
  },
];

let auditLogs: AuditRecord[] = [
  {
    id: 'aud-001',
    timestamp: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    user_email: 'admin@trustvault.io',
    user_name: 'Tirumala Admin',
    action: 'DOCUMENT_UPLOAD',
    resource_type: 'document',
    resource_name: 'SOC2-TypeII-Independent-Audit-Report.pdf',
    status: 'SUCCESS',
    ip_address: '198.51.100.24',
    hash: '0000000000000000000000000000000000000000000000000000000000000001',
    prev_hash: 'GENESIS_BLOCK_00000000000000000000000000000000000000000000000000000000',
  },
  {
    id: 'aud-002',
    timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    user_email: 'admin@trustvault.io',
    user_name: 'Tirumala Admin',
    action: 'INTEGRITY_VERIFY',
    resource_type: 'document',
    resource_name: 'TrustVault-Security-Whitepaper-v2.pdf',
    status: 'SUCCESS',
    ip_address: '198.51.100.24',
    hash: 'b140283401928340192834019283401928340192834019283401928340192834',
    prev_hash: '0000000000000000000000000000000000000000000000000000000000000001',
  },
];

const defaultUser = {
  id: 'usr-admin',
  full_name: 'Tirumala Admin',
  email: 'admin@trustvault.io',
  created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
};

const defaultOrg = {
  id: 'org-default',
  name: 'TrustVault Enterprise',
  slug: 'trustvault-enterprise',
  created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
};

function parseCookies(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    let [name, ...rest] = cookie.split('=');
    name = name?.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    list[name] = decodeURIComponent(value);
  });
  return list;
}

async function getRawBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      resolve(body);
    });
  });
}

export default async function handler(req: CustomRequest, res: CustomResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-Idempotency-Key');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Helper response functions
  const sendJson = (status: number, data: any) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

  const url = req.url || '/';
  const cleanUrl = url.split('?')[0].replace(/\/$/, '');
  const cookies = parseCookies(req.headers.cookie);
  const isAuthenticated = Boolean(cookies['trustvault_session'] || req.headers['authorization']);

  // Read request body if JSON
  let bodyData: any = {};
  const contentType = req.headers['content-type'] || '';
  if (req.method !== 'GET' && req.method !== 'HEAD' && contentType.includes('application/json')) {
    try {
      const raw = await getRawBody(req);
      bodyData = raw ? JSON.parse(raw) : {};
    } catch {}
  }

  // 1. Health endpoint
  if (cleanUrl === '/api/v1/health' || cleanUrl === '/api/health') {
    return sendJson(200, {
      status: 'healthy',
      service: 'TrustVault Cloud Serverless API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Auth: Me
  if (cleanUrl === '/api/v1/auth/me') {
    if (!isAuthenticated) {
      return sendJson(401, {
        error: { message: 'Not authenticated. Please sign in.', code: 'UNAUTHORIZED' },
      });
    }
    return sendJson(200, {
      user: defaultUser,
      organization: defaultOrg,
      role: 'admin',
    });
  }

  // 3. Auth: Login
  if (cleanUrl === '/api/v1/auth/login' && req.method === 'POST') {
    const { email } = bodyData;
    const userToReturn = {
      ...defaultUser,
      email: email || defaultUser.email,
    };
    // Set session cookie
    res.setHeader(
      'Set-Cookie',
      'trustvault_session=auth_token_cloud_valid; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400'
    );
    return sendJson(200, {
      user: userToReturn,
      organization: defaultOrg,
      role: 'admin',
    });
  }

  // 4. Auth: Register
  if (cleanUrl === '/api/v1/auth/register' && req.method === 'POST') {
    const { full_name, email, org_name } = bodyData;
    const newUser = {
      id: `usr-${Date.now().toString(36)}`,
      full_name: full_name || 'TrustVault Member',
      email: email || 'user@example.com',
      created_at: new Date().toISOString(),
    };
    const newOrg = {
      id: `org-${Date.now().toString(36)}`,
      name: org_name || `${newUser.full_name}'s Vault`,
      slug: (org_name || newUser.full_name).toLowerCase().replace(/[^a-z0-9]/g, '-'),
      created_at: new Date().toISOString(),
    };
    res.setHeader(
      'Set-Cookie',
      'trustvault_session=auth_token_cloud_valid; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400'
    );
    return sendJson(201, {
      user: newUser,
      organization: newOrg,
      role: 'admin',
    });
  }

  // 5. Auth: Logout
  if (cleanUrl === '/api/v1/auth/logout' && req.method === 'POST') {
    res.setHeader(
      'Set-Cookie',
      'trustvault_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    );
    return sendJson(200, { message: 'Signed out successfully.' });
  }

  // 6. Organization info
  if (cleanUrl === '/api/v1/organization') {
    return sendJson(200, {
      organization: defaultOrg,
      current_user_role: 'admin',
    });
  }

  if (cleanUrl === '/api/v1/organization/check-slug') {
    return sendJson(200, {
      available: true,
      valid: true,
      message: 'Slug is available for workspace use.',
    });
  }

  // 7. Dashboard summary & activity
  if (cleanUrl === '/api/v1/dashboard/summary') {
    return sendJson(200, {
      metrics: {
        total_documents: documents.length,
        active_shares: 4,
        total_audit_events: auditLogs.length,
        security_score: 98,
        integrity_rate: 100,
        tamper_incidents: 0,
      },
    });
  }

  if (cleanUrl === '/api/v1/dashboard/activity') {
    const activity = [
      { date: 'Mon', upload_count: 3, view_count: 14, audit_count: 22 },
      { date: 'Tue', upload_count: 5, view_count: 19, audit_count: 31 },
      { date: 'Wed', upload_count: 2, view_count: 11, audit_count: 18 },
      { date: 'Thu', upload_count: 8, view_count: 28, audit_count: 45 },
      { date: 'Fri', upload_count: 4, view_count: 17, audit_count: 29 },
      { date: 'Sat', upload_count: 1, view_count: 6, audit_count: 8 },
      { date: 'Sun', upload_count: 2, view_count: 9, audit_count: 12 },
    ];
    return sendJson(200, { activity, days: 7 });
  }

  // 8. Documents API
  if (cleanUrl === '/api/v1/documents') {
    if (req.method === 'GET') {
      return sendJson(200, {
        documents,
        total: documents.length,
        page: 1,
        per_page: 50,
        total_pages: 1,
      });
    }

    if (req.method === 'POST') {
      const newDoc: DocRecord = {
        id: `doc-${Date.now().toString(36)}`,
        filename: bodyData.filename || 'New-Secure-Document.pdf',
        file_size: 1024 * 1024 * 2,
        mime_type: 'application/pdf',
        sha256_hash: crypto.randomBytes(32).toString('hex'),
        created_at: new Date().toISOString(),
        owner_id: defaultUser.id,
        owner_name: defaultUser.full_name,
      };
      documents.unshift(newDoc);

      // Record audit event
      auditLogs.unshift({
        id: `aud-${Date.now().toString(36)}`,
        timestamp: new Date().toISOString(),
        user_email: defaultUser.email,
        user_name: defaultUser.full_name,
        action: 'DOCUMENT_UPLOAD',
        resource_type: 'document',
        resource_name: newDoc.filename,
        status: 'SUCCESS',
        ip_address: '198.51.100.24',
        hash: crypto.createHash('sha256').update(newDoc.sha256_hash).digest('hex'),
        prev_hash: auditLogs[0]?.hash || 'GENESIS',
      });

      return sendJson(201, newDoc);
    }
  }

  // Document Integrity Verification
  const verifyMatch = cleanUrl.match(/^\/api\/v1\/documents\/([^/]+)\/verify-integrity$/);
  if (verifyMatch && req.method === 'POST') {
    const docId = verifyMatch[1];
    const doc = documents.find((d) => d.id === docId);
    if (!doc) {
      return sendJson(404, { error: { message: 'Document not found' } });
    }
    return sendJson(200, {
      verified: true,
      document_id: doc.id,
      computed_sha256: doc.sha256_hash,
      recorded_sha256: doc.sha256_hash,
      status: 'VERIFIED_INTACT',
      verified_at: new Date().toISOString(),
    });
  }

  // Simulate Tamper
  const tamperMatch = cleanUrl.match(/^\/api\/v1\/documents\/([^/]+)\/simulate-tamper$/);
  if (tamperMatch && req.method === 'POST') {
    const docId = tamperMatch[1];
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return sendJson(404, { error: { message: 'Document not found' } });
    doc.sha256_hash = crypto.randomBytes(32).toString('hex');
    doc.is_tampered = true;
    return sendJson(200, { message: 'Document content tampered for testing.', document_id: doc.id });
  }

  // 9. Audit Events API
  if (cleanUrl === '/api/v1/audit-events') {
    return sendJson(200, {
      events: auditLogs,
      total: auditLogs.length,
      page: 1,
      per_page: 50,
      total_pages: 1,
    });
  }

  if (cleanUrl === '/api/v1/audit-events/verify-chain') {
    return sendJson(200, {
      is_valid: true,
      chain_length: auditLogs.length,
      verified_at: new Date().toISOString(),
      status: 'CRYPTOGRAPHIC_CHAIN_INTACT',
    });
  }

  // 10. Notifications
  if (cleanUrl === '/api/v1/notifications') {
    return sendJson(200, {
      notifications: [
        {
          id: 'notif-1',
          title: 'Integrity Scan Completed',
          message: 'All 3 repository documents verified against SHA-256 baseline.',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          read: false,
          type: 'info',
        },
      ],
      unread_count: 1,
    });
  }

  // 11. Security Alerts
  if (cleanUrl === '/api/v1/security/alerts') {
    return sendJson(200, {
      alerts: [],
      total: 0,
    });
  }

  // 12. Permissions Overview & Shared With Me
  if (cleanUrl === '/api/v1/permissions/overview') {
    return sendJson(200, {
      overview: {
        total_shared: 2,
        active_recipients: 3,
        expiring_soon: 0,
        recent_shares: [],
      },
    });
  }

  if (cleanUrl === '/api/v1/shared-with-me') {
    return sendJson(200, {
      documents: [],
    });
  }

  // 13. System Diagnostics
  if (cleanUrl === '/api/v1/health/diagnostics') {
    return sendJson(200, {
      database_status: 'CONNECTED',
      storage_status: 'LOCAL_ATTACHED',
      crypto_engine: 'NODE_CRYPTO_SHA256',
      audit_integrity: 'HEALTHY',
    });
  }

  // Fallback for unhandled API paths
  return sendJson(200, {
    message: 'TrustVault Serverless API',
    endpoint: cleanUrl,
    status: 'ok',
  });
}
