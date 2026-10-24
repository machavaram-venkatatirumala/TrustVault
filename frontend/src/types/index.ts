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
  last_verified_at?: string | null;
  last_verification_status: VerificationStatus;
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
