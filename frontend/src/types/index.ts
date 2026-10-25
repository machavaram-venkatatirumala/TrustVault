export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  theme_preference?: 'light' | 'dark' | 'system';
  terms_version?: string | null;
  terms_accepted_at?: string | null;
  created_at: string;
  last_login_at?: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  workspace_type?: 'personal' | 'shared';
  created_at: string;
  updated_at: string;
}

export interface OrganizationMembership {
  id: string;
  organization_id: string;
  organization_name?: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  role: UserRole;
  status: 'active' | 'suspended';
  joined_at: string;
}

export type VerificationStatus = 'verified' | 'mismatch' | 'unavailable' | 'unverified';

export interface DocumentPermissionItem {
  id: string;
  document_id: string;
  document_name?: string;
  organization_id: string;
  granted_by: string;
  grantor_name?: string;
  recipient_user_id: string;
  recipient_name?: string;
  recipient_email?: string;
  permission_level: 'view' | 'download';
  created_at: string;
  expires_at?: string | null;
  revoked_at?: string | null;
  is_active: boolean;
}

export interface DocumentItem {
  id: string;
  organization_id: string;
  owner_id: string;
  owner_name?: string;
  owner_email?: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  sha256_hash: string;
  status: 'active' | 'deleted';
  current_version_number?: number;
  scan_status?: 'clean' | 'pending' | 'quarantined' | 'skipped';
  scan_result?: string | null;
  deleted_at?: string | null;
  last_verified_at?: string | null;
  last_verification_status: VerificationStatus;
  classification?: 'Public' | 'Internal' | 'Confidential' | 'Restricted';
  created_at: string;
  updated_at: string;
  permissions?: DocumentPermissionItem[];
}

export interface SharedDocumentItem {
  permission_id: string;
  document_id: string;
  document_name: string;
  content_type: string;
  size_bytes: number;
  sha256_hash: string;
  owner_name: string;
  owner_email?: string;
  permission_level: 'view' | 'download';
  shared_at: string;
  expires_at?: string | null;
  can_download: boolean;
}

export interface AuditLogItem {
  id: string;
  organization_id: string;
  sequence_number?: number;
  prev_event_hash?: string | null;
  event_hash?: string | null;
  actor_user_id?: string | null;
  actor_name: string;
  actor_email?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  outcome: 'success' | 'denied' | 'failure';
  metadata: Record<string, any>;
  request_id?: string | null;
  ip_address?: string | null;
  created_at: string;
}

export interface DocumentVersionItem {
  id: string;
  document_id: string;
  version_number: number;
  storage_key: string;
  content_type: string;
  size_bytes: number;
  sha256_hash: string;
  scan_status: 'clean' | 'pending' | 'quarantined' | 'skipped';
  scan_result?: string | null;
  change_summary?: string | null;
  created_by: string;
  creator_name?: string;
  creator_email?: string | null;
  created_at: string;
}

export interface VersionDiffResult {
  base_version: number;
  target_version: number;
  hash_identical: boolean;
  size_delta_bytes: number;
  is_text_comparable: boolean;
  unified_diff?: string | null;
  base_info: {
    id: string;
    filename: string;
    sha256_hash: string;
    size_bytes: number;
  };
  target_info: {
    id: string;
    filename: string;
    sha256_hash: string;
    size_bytes: number;
  };
}

export interface AuditChainVerificationResult {
  chain_valid: boolean;
  total_events: number;
  head_hash?: string | null;
  genesis_hash?: string | null;
  verified_at: string;
  broken_sequence?: number | null;
  expected_sequence?: number | null;
  error_type?: string | null;
  error_message?: string | null;
  limitations_notice?: string;
  details?: string;
}

export interface SecurityAlertItem {
  id: string;
  organization_id: string;
  alert_type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  evidence: Record<string, any>;
  status: 'open' | 'acknowledged' | 'resolved';
  resolved_by?: string | null;
  resolved_at?: string | null;
  resolution_notes?: string | null;
  created_at: string;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  last_used_at?: string | null;
  revoked_at?: string | null;
  is_active: boolean;
  created_at: string;
  raw_token?: string;
}

export interface WebhookSubscriptionItem {
  id: string;
  target_url: string;
  events: string[];
  is_active: boolean;
  secret_preview: string;
  raw_secret?: string;
  created_at: string;
  recent_deliveries?: WebhookDeliveryItem[];
}

export interface WebhookDeliveryItem {
  id: string;
  event_type: string;
  payload_preview: string;
  status_code?: number | null;
  success: boolean;
  response_body_preview?: string | null;
  delivered_at: string;
}

export interface SystemDiagnostics {
  status: string;
  service: string;
  timestamp: string;
  request_id?: string;
  database: {
    status: string;
    dialect: string;
    latency_ms?: number;
  };
  storage: {
    status: string;
    provider: string;
    writable: boolean;
  };
  security_subsystems: {
    hash_chaining: string;
    malware_scanner: string;
    webhook_dispatcher: string;
  };
  environment: {
    mode: string;
  };
}

export interface StorageTypeDetail {
  count: number;
  bytes: number;
  label: string;
}

export interface DashboardMetrics {
  total_documents: number;
  active_members: number;
  shared_documents: number;
  active_permissions: number;
  recent_security_events: number;
  verified_count: number;
  mismatch_count: number;
  total_storage_bytes?: number;
  storage_quota_bytes?: number;
  remaining_storage_bytes?: number;
  storage_by_type?: Record<string, StorageTypeDetail>;
  max_members?: number;
  max_upload_size_bytes?: number;
  plan_name?: string;
}

export interface ActivityPoint {
  date: string;
  uploads: number;
  shares: number;
  verifications: number;
  downloads: number;
}

export interface IntegrityVerificationResult {
  verified: boolean;
  status: VerificationStatus;
  message: string;
  expected_hash: string;
  computed_hash?: string | null;
  verified_at: string;
}

export interface NotificationItem {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: 'share' | 'security' | 'invitation' | 'revocation' | 'general';
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'document' | 'member' | 'audit';
  url: string;
}

export interface SearchResponse {
  query: string;
  documents: SearchResultItem[];
  members: SearchResultItem[];
  audit: SearchResultItem[];
}

export interface SharingOverviewResponse {
  active_shares: DocumentPermissionItem[];
  expired_shares: DocumentPermissionItem[];
  revoked_shares: DocumentPermissionItem[];
  pending_invitations: Array<{
    id: string;
    organization_id: string;
    user_id: string;
    user_email: string;
    user_name: string;
    role: string;
    status: string;
    joined_at: string;
  }>;
  counts: {
    active: number;
    expired: number;
    revoked: number;
    pending: number;
    total: number;
  };
}

export type ClassificationLevel = 'Public' | 'Internal' | 'Confidential' | 'Restricted';

export interface ClassificationHistoryItem {
  id: string;
  document_id: string;
  old_classification: ClassificationLevel | null;
  new_classification: ClassificationLevel;
  changed_by_name: string;
  changed_by_email: string;
  reason?: string | null;
  created_at: string;
}

export type ApprovalStatus = 'draft' | 'submitted' | 'in_review' | 'changes_requested' | 'approved' | 'rejected' | 'canceled';

export interface ApprovalStep {
  name: string;
  role?: string;
  reviewer_id?: string;
}

export interface ApprovalWorkflowTemplate {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  steps: ApprovalStep[];
  is_active: boolean;
  created_at: string;
}

export interface ApprovalDecisionItem {
  id: string;
  step_index: number;
  reviewer_name: string;
  reviewer_email: string;
  decision: 'approve' | 'reject' | 'request_changes';
  comment?: string | null;
  version_hash_snapshot: string;
  decision_at: string;
}

export interface ApprovalWorkflowInstance {
  id: string;
  organization_id: string;
  document_id: string;
  document_name?: string;
  document_version_id?: string | null;
  version_hash: string;
  template_id?: string | null;
  template_name?: string | null;
  status: ApprovalStatus;
  submitter_id: string;
  submitter_name: string;
  submitter_email: string;
  current_step_index: number;
  submission_notes?: string | null;
  created_at: string;
  updated_at: string;
  decisions?: ApprovalDecisionItem[];
}

export type PolicyType =
  | 'auto_expire_external'
  | 'require_approval_sensitive'
  | 'prevent_public_restricted'
  | 'elevated_justification'
  | 'storage_quota'
  | 'download_restriction';

export interface SecurityPolicy {
  id: string;
  organization_id: string;
  name: string;
  policy_type: PolicyType;
  description?: string | null;
  config: Record<string, any>;
  is_enabled: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface PolicyExecutionLog {
  id: string;
  policy_id: string;
  policy_name: string;
  action: string;
  decision: 'allow' | 'deny' | 'require_approval' | 'require_justification';
  reason?: string | null;
  resource_id?: string | null;
  actor_name: string;
  actor_email: string;
  executed_at: string;
}

export interface EvidencePackage {
  id: string;
  organization_id: string;
  name: string;
  requested_by_name: string;
  requested_by_email: string;
  date_from?: string | null;
  date_to?: string | null;
  categories: string[];
  manifest?: Record<string, any>;
  sha256_manifest_hash: string;
  status: 'generating' | 'ready' | 'failed';
  total_records: number;
  created_at: string;
}

export interface AccessGraphNode {
  id: string;
  label: string;
  type: 'document' | 'user' | 'role' | 'policy' | 'workspace' | 'collaborator';
  email?: string;
  role?: string;
  status?: string;
  classification?: ClassificationLevel;
  size_bytes?: number;
  sha256_hash?: string;
  owner_name?: string;
}

export interface AccessGraphLink {
  source: string;
  target: string;
  relationship: string;
  permission_level?: string;
  inherited?: boolean;
  status?: string;
  details?: string;
}

export interface EffectivePermissionRecord {
  user_id: string;
  name: string;
  email: string;
  access_source: string;
  is_inherited: boolean;
  effective_permission: 'view' | 'download' | 'manage' | 'denied';
  can_download: boolean;
  status: 'active' | 'revoked' | 'expired';
  grantor?: string;
  expiration?: string;
  reason?: string;
}

export interface AccessExplorerData {
  document: {
    id: string;
    name: string;
    classification: ClassificationLevel;
    size_bytes: number;
    sha256_hash: string;
  };
  graph: {
    nodes: AccessGraphNode[];
    links: AccessGraphLink[];
  };
  table: EffectivePermissionRecord[];
  total_authorized_identities: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  description?: string | null;
  query: string;
  classification?: ClassificationLevel | null;
  has_active_grants?: boolean | null;
  is_expiring_soon?: boolean | null;
  created_at: string;
}

export interface AccessReviewCampaign {
  id: string;
  title: string;
  description?: string | null;
  status: 'active' | 'completed' | 'canceled';
  due_date?: string | null;
  reviewer_name: string;
  total_items: number;
  completed_items: number;
  created_at: string;
}

export interface AccessReviewItem {
  id: string;
  campaign_id: string;
  permission_id: string;
  document_name: string;
  recipient_name: string;
  recipient_email: string;
  permission_level: string;
  granted_at: string;
  expires_at?: string | null;
  decision: 'pending' | 'confirmed' | 'revoked';
  decided_at?: string | null;
  notes?: string | null;
}

export interface OIDCConfig {
  is_configured: boolean;
  is_enabled: boolean;
  issuer_url: string;
  client_id: string;
  redirect_uri: string;
  updated_at?: string | null;
}

export interface TenantQuota {
  max_storage_bytes: number;
  max_upload_size_bytes: number;
  max_members: number;
  used_storage_bytes: number;
  active_members_count: number;
  storage_usage_percent: number;
  remaining_storage_bytes: number;
}

export interface FeatureFlag {
  id: string;
  flag_key: string;
  is_enabled: boolean;
  description?: string | null;
  updated_at?: string | null;
}


