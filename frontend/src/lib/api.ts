import {
  User,
  Organization,
  OrganizationMembership,
  UserRole,
  DocumentItem,
  SharedDocumentItem,
  DocumentPermissionItem,
  AuditLogItem,
  DashboardMetrics,
  ActivityPoint,
  IntegrityVerificationResult,
  NotificationItem,
  SearchResponse,
  SharingOverviewResponse,
  DocumentVersionItem,
  VersionDiffResult,
  AuditChainVerificationResult,
  SecurityAlertItem,
  ApiKeyItem,
  WebhookSubscriptionItem,
  WebhookDeliveryItem,
  SystemDiagnostics,
  ClassificationLevel,
  ClassificationHistoryItem,
  AccessExplorerData,
  EffectivePermissionRecord,
  ApprovalWorkflowInstance,
  ApprovalWorkflowTemplate,
  SecurityPolicy,
  PolicyExecutionLog,
  EvidencePackage,
  SavedSearch,
  AccessReviewCampaign,
  AccessReviewItem,
  OIDCConfig,
  TenantQuota,
  FeatureFlag,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiError extends Error {
  status: number;
  details?: Record<string, any>;

  constructor(message: string, status: number, details?: Record<string, any>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Ensures session cookie is sent and received
    });
  } catch (netErr: any) {
    throw new ApiError(
      'Unable to connect to backend server. Please verify that the backend API is running.',
      503,
      { originalError: netErr?.message }
    );
  }

  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    let details: Record<string, any> | undefined;

    if (response.status === 502) {
      errorMsg = 'Backend server is unreachable (502 Bad Gateway). Please verify that the backend API server is running.';
    } else if (response.status === 503) {
      errorMsg = 'Backend service is temporarily unavailable (503 Service Unavailable).';
    } else if (response.status === 504) {
      errorMsg = 'Gateway timed out waiting for backend response (504 Gateway Timeout).';
    }

    try {
      const errJson = await response.json();
      if (errJson?.error?.message) {
        errorMsg = errJson.error.message;
        details = errJson.error.details;
      }
    } catch {
      // Non-JSON response (e.g. proxy HTML error page)
    }
    throw new ApiError(errorMsg, response.status, details);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  // Guard against HTML response when expecting JSON (e.g., SPA rewrites when API backend is unconfigured)
  if (contentType.includes('text/html')) {
    throw new ApiError(
      'Received an HTML response instead of JSON. If deployed on Vercel, please ensure VITE_API_BASE_URL points to your backend API.',
      502
    );
  }

  return response.json();
}

export const api = {
  auth: {
    register: (data: {
      full_name: string;
      email: string;
      password: string;
      org_name?: string;
      terms_accepted?: boolean;
      terms_version?: string;
    }) =>
      request<{ user: User; organization: Organization; role: UserRole }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: (data: { email: string; password: string }) =>
      request<{ user: User; organization: Organization; role: UserRole }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    logout: () =>
      request<{ message: string }>('/auth/logout', {
        method: 'POST',
      }),

    me: () =>
      request<{ user: User; organization: Organization; role: UserRole }>('/auth/me'),

    updateProfile: (data: { full_name?: string; theme_preference?: 'light' | 'dark' | 'system' }) =>
      request<{ user: User }>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    deleteAccount: () =>
      request<{ message: string }>('/auth/account', {
        method: 'DELETE',
      }),

    changePassword: (data: { old_password: string; new_password: string }) =>
      request<{ message: string }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    forgotPassword: (data: { email: string }) =>
      request<{ message: string; dev_reset_token?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    resetPassword: (data: { token: string; new_password: string }) =>
      request<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  organization: {
    get: () =>
      request<{ organization: Organization; current_user_role: UserRole }>('/organization'),

    update: (data: { name?: string; slug?: string; workspace_type?: string }) =>
      request<{ organization: Organization }>('/organization', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    checkSlug: (slug: string) =>
      request<{ available: boolean; valid: boolean; message: string }>(
        `/organization/check-slug?slug=${encodeURIComponent(slug)}`
      ),
  },

  dashboard: {
    getSummary: () =>
      request<{ metrics: DashboardMetrics }>('/dashboard/summary'),

    getActivity: (days: number = 7) =>
      request<{ activity: ActivityPoint[]; days: number }>(`/dashboard/activity?days=${days}`),
  },

  documents: {
    list: (params?: { search?: string; file_type?: string; owner_id?: string; page?: number; per_page?: number }) => {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.file_type) query.set('file_type', params.file_type);
      if (params?.owner_id) query.set('owner_id', params.owner_id);
      if (params?.page) query.set('page', params.page.toString());
      if (params?.per_page) query.set('per_page', params.per_page.toString());
      return request<{
        documents: DocumentItem[];
        total: number;
        page: number;
        per_page: number;
        total_pages: number;
      }>(`/documents?${query.toString()}`);
    },

    get: (id: string) =>
      request<DocumentItem>(`/documents/${id}`),

    upload: (file: File, idempotencyKey?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      const headers: Record<string, string> = {};
      if (idempotencyKey) {
        headers['X-Idempotency-Key'] = idempotencyKey;
      }
      return request<DocumentItem>('/documents', {
        method: 'POST',
        body: formData,
        headers,
      });
    },

    delete: (id: string) =>
      request<{ message: string }>(`/documents/${id}`, {
        method: 'DELETE',
      }),

    rename: (id: string, filename: string) =>
      request<DocumentItem>(`/documents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ filename }),
      }),

    download: async (id: string, filename: string) => {
      const url = `${API_BASE}/documents/${id}/download`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        let errorMsg = `Download failed (${response.status})`;
        try {
          const err = await response.json();
          if (err?.error?.message) errorMsg = err.error.message;
        } catch {}
        throw new ApiError(errorMsg, response.status);
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    },

    verifyIntegrity: (id: string) =>
      request<IntegrityVerificationResult>(`/documents/${id}/verify-integrity`, {
        method: 'POST',
      }),

    simulateTamper: (id: string) =>
      request<{ message: string; document_id: string }>(`/documents/${id}/simulate-tamper`, {
        method: 'POST',
      }),

    // Document Recovery & Retention (Trash)
    trash: {
      list: () => request<{ trash: DocumentItem[]; total: number }>('/documents/trash'),
      restore: (id: string) =>
        request<{ message: string; document: DocumentItem }>(`/documents/${id}/restore`, {
          method: 'POST',
        }),
      purge: (id: string) =>
        request<{ message: string }>(`/documents/${id}/purge`, {
          method: 'DELETE',
        }),
    },

    // Document Versioning & Comparison Lifecycle
    versions: {
      list: (docId: string) =>
        request<{ versions: DocumentVersionItem[]; total: number; current_version_number: number }>(
          `/documents/${docId}/versions`
        ),
      create: (docId: string, file: File, changeSummary?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        if (changeSummary) formData.append('change_summary', changeSummary);
        return request<DocumentVersionItem>(`/documents/${docId}/versions`, {
          method: 'POST',
          body: formData,
        });
      },
      restore: (docId: string, versionId: string) =>
        request<DocumentVersionItem>(`/documents/${docId}/versions/${versionId}/restore`, {
          method: 'POST',
        }),
      compare: (docId: string, v1Id: string, v2Id: string) =>
        request<VersionDiffResult>(`/documents/${docId}/versions/compare?v1=${v1Id}&v2=${v2Id}`),
    },
  },

  permissions: {
    listForDoc: (docId: string) =>
      request<{ permissions: DocumentPermissionItem[] }>(`/documents/${docId}/permissions`),

    grant: (docId: string, data: { recipient_user_id: string; permission_level: 'view' | 'download'; expires_at?: string | null }) =>
      request<DocumentPermissionItem>(`/documents/${docId}/permissions`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    revoke: (permissionId: string) =>
      request<{ message: string }>(`/permissions/${permissionId}`, {
        method: 'DELETE',
      }),

    sharedWithMe: () =>
      request<{ documents: SharedDocumentItem[] }>('/shared-with-me'),

    getOverview: () =>
      request<SharingOverviewResponse>('/permissions/overview'),
  },

  audit: {
    list: (params?: { action?: string; outcome?: string; search?: string; page?: number; per_page?: number }) => {
      const query = new URLSearchParams();
      if (params?.action) query.set('action', params.action);
      if (params?.outcome) query.set('outcome', params.outcome);
      if (params?.search) query.set('search', params.search);
      if (params?.page) query.set('page', params.page.toString());
      if (params?.per_page) query.set('per_page', params.per_page.toString());
      return request<{
        events: AuditLogItem[];
        total: number;
        page: number;
        per_page: number;
        total_pages: number;
      }>(`/audit-events?${query.toString()}`);
    },

    get: (id: string) =>
      request<AuditLogItem>(`/audit-events/${id}`),

    verifyChain: () =>
      request<AuditChainVerificationResult>('/audit-events/verify-chain'),
  },

  security: {
    alerts: {
      list: (status?: string) =>
        request<{ alerts: SecurityAlertItem[]; total: number }>(
          `/security/alerts${status ? `?status=${status}` : ''}`
        ),
      acknowledge: (alertId: string) =>
        request<SecurityAlertItem>(`/security/alerts/${alertId}/acknowledge`, {
          method: 'POST',
        }),
      resolve: (alertId: string, notes?: string) =>
        request<SecurityAlertItem>(`/security/alerts/${alertId}/resolve`, {
          method: 'POST',
          body: JSON.stringify({ notes }),
        }),
    },
  },

  developer: {
    apiKeys: {
      list: () => request<{ api_keys: ApiKeyItem[] }>('/developer/api-keys'),
      create: (data: { name: string; scopes?: string[] }) =>
        request<ApiKeyItem>('/developer/api-keys', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      revoke: (keyId: string) =>
        request<{ message: string }>(`/developer/api-keys/${keyId}`, {
          method: 'DELETE',
        }),
    },
    webhooks: {
      list: () => request<{ webhooks: WebhookSubscriptionItem[] }>('/developer/webhooks'),
      create: (data: { target_url: string; events?: string[] }) =>
        request<WebhookSubscriptionItem>('/developer/webhooks', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<{ message: string }>(`/developer/webhooks/${id}`, {
          method: 'DELETE',
        }),
      test: (id: string) =>
        request<{ message: string; delivery: WebhookDeliveryItem }>(`/developer/webhooks/${id}/test`, {
          method: 'POST',
        }),
    },
  },

  observability: {
    getDiagnostics: () => request<SystemDiagnostics>('/health/diagnostics'),
  },

  members: {
    list: () =>
      request<{ members: OrganizationMembership[] }>('/members'),

    invite: (data: { email: string; full_name: string; role: UserRole; password?: string }) =>
      request<OrganizationMembership>('/members/invite', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateRole: (id: string, role: UserRole) =>
      request<OrganizationMembership>(`/members/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),

    deactivate: (id: string) =>
      request<{ message: string }>(`/members/${id}`, {
        method: 'DELETE',
      }),
  },

  notifications: {
    list: () =>
      request<{ notifications: NotificationItem[]; unread_count: number }>('/notifications'),

    markRead: (id: string) =>
      request<{ message: string }>(`/notifications/${id}/read`, {
        method: 'PATCH',
      }),

    markAllRead: () =>
      request<{ message: string; updated_count: number }>('/notifications/read-all', {
        method: 'POST',
      }),
  },

  search: {
    global: (query: string) =>
      request<SearchResponse>(`/search?q=${encodeURIComponent(query)}`),
  },

  classification: {
    get: (docId: string) =>
      request<{ classification: ClassificationLevel }>(`/documents/${docId}/classification`),
    update: (docId: string, classification: ClassificationLevel, reason?: string) =>
      request<{ message: string; classification: ClassificationLevel }>(`/documents/${docId}/classification`, {
        method: 'PATCH',
        body: JSON.stringify({ classification, reason }),
      }),
    history: (docId: string) =>
      request<{ history: ClassificationHistoryItem[] }>(`/documents/${docId}/classification/history`),
  },

  accessExplorer: {
    getGraph: (docId?: string) =>
      request<AccessExplorerData>(`/access-explorer/graph${docId ? `?document_id=${docId}` : ''}`),
    getEffectivePermissions: (docId?: string) =>
      request<{ records: EffectivePermissionRecord[]; total: number }>(`/access-explorer/effective-permissions${docId ? `?document_id=${docId}` : ''}`),
  },

  approvals: {
    list: (status?: string) =>
      request<{ workflows: ApprovalWorkflowInstance[] }>(`/approvals${status ? `?status=${status}` : ''}`),
    submit: (document_id: string, template_id?: string, notes?: string) =>
      request<{ workflow: ApprovalWorkflowInstance }>('/approvals/submit', {
        method: 'POST',
        body: JSON.stringify({ document_id, template_id, notes }),
      }),
    decide: (workflow_id: string, decision: 'approve' | 'reject' | 'request_changes', comment?: string) =>
      request<{ workflow: ApprovalWorkflowInstance }>(`/approvals/${workflow_id}/decide`, {
        method: 'POST',
        body: JSON.stringify({ decision, comment }),
      }),
    cancel: (workflow_id: string) =>
      request<{ message: string; workflow: ApprovalWorkflowInstance }>(`/approvals/${workflow_id}/cancel`, {
        method: 'POST',
      }),
    listTemplates: () =>
      request<{ templates: ApprovalWorkflowTemplate[] }>('/approvals/templates'),
    createTemplate: (data: { name: string; description?: string; steps: any[] }) =>
      request<{ template: ApprovalWorkflowTemplate }>('/approvals/templates', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  policies: {
    list: () =>
      request<{ policies: SecurityPolicy[] }>('/policies'),
    create: (data: Partial<SecurityPolicy>) =>
      request<SecurityPolicy>('/policies', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    toggle: (id: string, is_enabled: boolean) =>
      request<SecurityPolicy>(`/policies/${id}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ is_enabled }),
      }),
    getLogs: (limit?: number) =>
      request<{ logs: PolicyExecutionLog[] }>(`/policies/logs${limit ? `?limit=${limit}` : ''}`),
    simulate: (context: Record<string, any>) =>
      request<{ decision: string; reason: string; policy_name: string }>('/policies/simulate', {
        method: 'POST',
        body: JSON.stringify(context),
      }),
    runMaintenance: () =>
      request<{ revoked_count: number; message: string; timestamp: string }>('/policies/run-maintenance', {
        method: 'POST',
      }),
  },

  evidence: {
    list: () =>
      request<{ packages: EvidencePackage[] }>('/evidence'),
    generate: (data: { name: string; categories?: string[]; date_from?: string; date_to?: string }) =>
      request<EvidencePackage>('/evidence/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    get: (id: string) =>
      request<{ package: EvidencePackage }>(`/evidence/${id}`),
    download: (id: string) =>
      request<any>(`/evidence/${id}/download`),
  },

  governance: {
    listSavedSearches: () =>
      request<{ searches: SavedSearch[] }>('/governance/saved-searches'),
    createSavedSearch: (data: any) =>
      request<SavedSearch>('/governance/saved-searches', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deleteSavedSearch: (id: string) =>
      request<{ message: string }>(`/governance/saved-searches/${id}`, {
        method: 'DELETE',
      }),
    storageInsights: () =>
      request<any>('/governance/storage-insights'),
    findDuplicates: (docId: string) =>
      request<any>(`/governance/documents/${docId}/duplicates`),
    listAccessReviews: () =>
      request<{ campaigns: AccessReviewCampaign[] }>('/governance/access-reviews'),
    createAccessReview: (data: any) =>
      request<AccessReviewCampaign>('/governance/access-reviews', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getAccessReviewItems: (campaignId: string) =>
      request<{ campaign: AccessReviewCampaign; items: AccessReviewItem[] }>(`/governance/access-reviews/${campaignId}/items`),
    decideAccessReviewItem: (campaignId: string, itemId: string, decision: 'confirmed' | 'revoked', notes?: string) =>
      request<any>(`/governance/access-reviews/${campaignId}/items/${itemId}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision, notes }),
      }),
  },

  enterprise: {
    getOIDC: () =>
      request<{ oidc: OIDCConfig } & OIDCConfig>('/integrations/oidc'),
    updateOIDC: (data: Partial<OIDCConfig> & { client_secret?: string }) =>
      request<any>('/integrations/oidc', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getSCIMUsers: () =>
      request<any>('/scim/v2/Users'),
    getQuotas: () =>
      request<TenantQuota>('/quotas'),
    updateQuotas: (data: Partial<TenantQuota>) =>
      request<TenantQuota>('/quotas', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    getFeatureFlags: () =>
      request<{ flags: FeatureFlag[] }>('/feature-flags'),
    toggleFeatureFlag: (flag_key: string, is_enabled: boolean) =>
      request<FeatureFlag>(`/feature-flags/${flag_key}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_enabled }),
      }),
    generateDRBackup: () =>
      request<any>('/disaster-recovery/backup', {
        method: 'POST',
      }),
    generateSignedUrl: (docId: string, expiresInSeconds?: number) =>
      request<{ signed_url: string; expires_at: string; expires_in_seconds: number }>(`/documents/${docId}/signed-url`, {
        method: 'POST',
        body: JSON.stringify({ expires_in_seconds: expiresInSeconds }),
      }),
  },
};
