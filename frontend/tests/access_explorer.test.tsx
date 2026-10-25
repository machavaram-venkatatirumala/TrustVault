import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AccessExplorerPage } from '../src/features/access-explorer/AccessExplorerPage';
import { api } from '../src/lib/api';

const mockSuccessToast = vi.fn();
const mockErrorToast = vi.fn();

const mockDocuments = [
  {
    id: 'doc-101',
    original_filename: 'Enterprise_Security_Architecture.pdf',
    classification: 'Confidential',
    size_bytes: 245000,
    created_at: '2026-10-25T10:00:00Z',
    owner_id: 'user-admin',
    owner_name: 'Alice Security Admin',
  },
  {
    id: 'doc-102',
    original_filename: 'Q3_Financial_Audit_Report.xlsx',
    classification: 'Restricted',
    size_bytes: 512000,
    created_at: '2026-10-25T11:00:00Z',
    owner_id: 'user-admin',
    owner_name: 'Alice Security Admin',
  },
];

const mockGraphData = {
  document: {
    id: 'doc-101',
    name: 'Enterprise_Security_Architecture.pdf',
    classification: 'Confidential' as const,
    size_bytes: 245000,
    sha256_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  graph: {
    nodes: [
      {
        id: 'doc:doc-101',
        label: 'Enterprise_Security_Architecture.pdf',
        type: 'document' as const,
        classification: 'Confidential' as const,
        size_bytes: 245000,
        sha256_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        owner_name: 'Alice Security Admin',
      },
      {
        id: 'user:user-admin',
        label: 'Alice Security Admin',
        email: 'alice@trustvault.app',
        type: 'user' as const,
        role: 'Document Owner',
        status: 'active',
      },
      {
        id: 'org:org-1',
        label: 'Enterprise Vault Corp',
        type: 'workspace' as const,
      },
      {
        id: 'user:user-bob',
        label: 'Bob Engineer',
        email: 'bob@trustvault.app',
        type: 'user' as const,
        role: 'admin',
        status: 'active',
      },
      {
        id: 'user:user-charlie',
        label: 'Charlie Auditor',
        email: 'charlie@external.com',
        type: 'collaborator' as const,
        status: 'active',
      },
    ],
    links: [
      {
        source: 'user:user-admin',
        target: 'doc:doc-101',
        relationship: 'ownership',
        permission_level: 'manage',
        inherited: false,
        status: 'active',
        details: 'Full document ownership with unconditional manage rights',
      },
      {
        source: 'org:org-1',
        target: 'doc:doc-101',
        relationship: 'workspace_containment',
        permission_level: 'containment',
        inherited: true,
      },
      {
        source: 'user:user-bob',
        target: 'doc:doc-101',
        relationship: 'workspace_admin_inheritance',
        permission_level: 'manage',
        inherited: true,
        status: 'active',
        details: 'Workspace Administrator privileges grant full document administration',
      },
      {
        source: 'user:user-charlie',
        target: 'doc:doc-101',
        relationship: 'direct_grant',
        permission_level: 'download',
        inherited: false,
        status: 'active',
        details: 'Explicit share grant with download rights',
      },
    ],
  },
  table: [
    {
      user_id: 'user-admin',
      name: 'Alice Security Admin',
      email: 'alice@trustvault.app',
      access_source: 'Ownership',
      is_inherited: false,
      effective_permission: 'manage' as const,
      can_download: true,
      status: 'active' as const,
      grantor: 'Self',
      expiration: 'Never',
      reason: 'Direct owner of this document',
    },
    {
      user_id: 'user-bob',
      name: 'Bob Engineer',
      email: 'bob@trustvault.app',
      access_source: 'Workspace Admin Role',
      is_inherited: true,
      effective_permission: 'manage' as const,
      can_download: true,
      status: 'active' as const,
      grantor: 'Workspace Policy',
      expiration: 'Permanent while Admin',
      reason: 'Inherited full permissions from Workspace Admin role',
    },
    {
      user_id: 'user-charlie',
      name: 'Charlie Auditor',
      email: 'charlie@external.com',
      access_source: 'Direct Grant',
      is_inherited: false,
      effective_permission: 'download' as const,
      can_download: true,
      status: 'active' as const,
      grantor: 'Alice Security Admin',
      expiration: '2026-12-31',
      reason: 'Explicit permission granted with download level',
    },
  ],
  total_authorized_identities: 3,
};

vi.mock('../src/hooks/useToast', () => ({
  useToast: () => ({
    success: mockSuccessToast,
    error: mockErrorToast,
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('../src/lib/api', () => ({
  api: {
    documents: {
      list: vi.fn(),
    },
    accessExplorer: {
      getGraph: vi.fn(),
      getEffectivePermissions: vi.fn(),
    },
  },
}));

describe('Redesigned Access Explorer & Topology Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.documents.list as any).mockResolvedValue({ documents: mockDocuments, total: 2 });
    (api.accessExplorer.getGraph as any).mockResolvedValue(mockGraphData);
  });

  it('renders the page header, title, and authenticated metrics summary strip', async () => {
    render(
      <MemoryRouter initialEntries={['/app/access-explorer?document_id=doc-101']}>
        <AccessExplorerPage />
      </MemoryRouter>
    );

    // Header & Subtitle
    expect(await screen.findByText('Access Explorer & Topology')).toBeInTheDocument();
    expect(
      screen.getByText(/Understand how identities, workspace roles, and policies determine access/i)
    ).toBeInTheDocument();

    // Summary Strip Cards (rendered after data resolves)
    expect(await screen.findByText('Authorized Identities')).toBeInTheDocument();
    expect(screen.getByText('Direct Share Grants')).toBeInTheDocument();
    expect(screen.getByText('Inherited Role Paths')).toBeInTheDocument();
    expect(screen.getByText('Full Manage Authorities')).toBeInTheDocument();
    expect(screen.getByText('SHA-256 Verified')).toBeInTheDocument();

    // Target Document is loaded in graph
    expect(screen.getByText('Relationship Topology')).toBeInTheDocument();
    expect(screen.getByText('Effective Permissions Matrix')).toBeInTheDocument();
  });

  it('allows switching to Effective Permissions Matrix tab and displays table data', async () => {
    render(
      <MemoryRouter initialEntries={['/app/access-explorer?document_id=doc-101']}>
        <AccessExplorerPage />
      </MemoryRouter>
    );

    // Wait for graph load
    expect(await screen.findByText('Authorized Identities')).toBeInTheDocument();

    // Switch tab to Effective Permissions Matrix
    const tableTabBtn = screen.getByText('Effective Permissions Matrix');
    fireEvent.click(tableTabBtn);

    // Check table headers and principal rows
    expect(await screen.findByText('Identity')).toBeInTheDocument();
    expect(screen.getByText('Alice Security Admin')).toBeInTheDocument();
    expect(screen.getByText('Bob Engineer')).toBeInTheDocument();
    expect(screen.getByText('Charlie Auditor')).toBeInTheDocument();

    // Check Origin badges
    expect(screen.getByText('Ownership')).toBeInTheDocument();
    expect(screen.getByText('Workspace Admin Role')).toBeInTheDocument();
    expect(screen.getByText('Direct Grant')).toBeInTheDocument();
  });

  it('filters table rows dynamically when search input changes', async () => {
    render(
      <MemoryRouter initialEntries={['/app/access-explorer?document_id=doc-101']}>
        <AccessExplorerPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Authorized Identities')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Effective Permissions Matrix'));

    const searchInput = await screen.findByPlaceholderText('Search by principal name or email...');
    fireEvent.change(searchInput, { target: { value: 'Charlie' } });

    // Charlie should be present, Bob and Alice should be filtered out
    expect(screen.getByText('Charlie Auditor')).toBeInTheDocument();
    expect(screen.queryByText('Bob Engineer')).not.toBeInTheDocument();
    expect(screen.queryByText('Alice Security Admin')).not.toBeInTheDocument();
  });

  it('allows clicking re-evaluate button to trigger fresh backend fetch', async () => {
    render(
      <MemoryRouter initialEntries={['/app/access-explorer?document_id=doc-101']}>
        <AccessExplorerPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Authorized Identities')).toBeInTheDocument();
    const refreshBtn = screen.getByTitle(/Re-evaluate access paths and permissions/i);
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(api.accessExplorer.getGraph).toHaveBeenCalledTimes(2);
      expect(mockSuccessToast).toHaveBeenCalledWith(
        'Access topology & effective permissions re-evaluated'
      );
    });
  });

  it('renders helpful empty state when no documents exist', async () => {
    (api.documents.list as any).mockResolvedValue({ documents: [], total: 0 });

    render(
      <MemoryRouter initialEntries={['/app/access-explorer']}>
        <AccessExplorerPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('No Documents Available')).toBeInTheDocument();
  });

  it('renders error state with retry button on access denial', async () => {
    (api.accessExplorer.getGraph as any).mockRejectedValue(
      new Error('You are not authorized to view this document.')
    );

    render(
      <MemoryRouter initialEntries={['/app/access-explorer?document_id=doc-101']}>
        <AccessExplorerPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Access Topology Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Retry Evaluation')).toBeInTheDocument();
  });
});
