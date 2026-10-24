import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SettingsPage } from '../src/features/settings/SettingsPage';
import { api } from '../src/lib/api';

const mockRefetch = vi.fn();
const mockSuccessToast = vi.fn();
const mockErrorToast = vi.fn();

let mockAuthContext = {
  user: { id: 'u1', full_name: 'Admin User', email: 'admin@trustvault.app' },
  organization: {
    id: 'org1',
    name: 'KKR & KSR Institute of Technology and Sciences',
    slug: 'kkr-ksr-institute-of-technology-and-sciences',
    workspace_type: 'shared',
  },
  role: 'admin',
  isAdmin: true,
  updateProfile: vi.fn(),
  deleteAccount: vi.fn(),
  refetch: mockRefetch,
};

vi.mock('../src/hooks/useAuth', () => ({
  useAuth: () => mockAuthContext,
}));

vi.mock('../src/hooks/useToast', () => ({
  useToast: () => ({
    success: mockSuccessToast,
    error: mockErrorToast,
  }),
}));

vi.mock('../src/lib/api', () => ({
  api: {
    organization: {
      update: vi.fn(),
      checkSlug: vi.fn().mockResolvedValue({
        available: true,
        valid: true,
        message: 'Workspace slug is available.',
      }),
    },
    documents: {
      list: vi.fn().mockResolvedValue({ documents: [] }),
    },
    audit: {
      list: vi.fn().mockResolvedValue({ events: [] }),
    },
    auth: {
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
      deleteAccount: vi.fn(),
    },
  },
}));

describe('Workspace Identity Settings (Name and Slug Editing)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.organization.checkSlug as any).mockResolvedValue({
      available: true,
      valid: true,
      message: 'Workspace slug is available.',
    });
    mockAuthContext = {
      user: { id: 'u1', full_name: 'Admin User', email: 'admin@trustvault.app' },
      organization: {
        id: 'org1',
        name: 'KKR & KSR Institute of Technology and Sciences',
        slug: 'kkr-ksr-institute-of-technology-and-sciences',
        workspace_type: 'shared',
      },
      role: 'admin',
      isAdmin: true,
      updateProfile: vi.fn(),
      deleteAccount: vi.fn(),
      refetch: mockRefetch,
    };
  });

  it('renders workspace name and slug in view mode for admin with Edit button', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Workspace Identity')).toBeInTheDocument();
    expect(screen.getByText('KKR & KSR Institute of Technology and Sciences')).toBeInTheDocument();
    expect(screen.getByText('kkr-ksr-institute-of-technology-and-sciences')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit workspace/i })).toBeInTheDocument();
  });

  it('clicking Edit reveals editable inputs, Save Changes, and Cancel buttons', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    const editBtn = screen.getByRole('button', { name: /edit workspace/i });
    fireEvent.click(editBtn);

    expect(screen.getByLabelText(/workspace name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/workspace slug/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('automatically converts spaces and uppercase to lowercase hyphens in slug input', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /edit workspace/i }));
    const slugInput = screen.getByLabelText(/workspace slug/i);

    // Enter uppercase and spaces
    fireEvent.change(slugInput, { target: { value: 'New Campus 2026' } });
    expect(slugInput).toHaveValue('new-campus-2026');

    // Collapse multiple consecutive hyphens
    fireEvent.change(slugInput, { target: { value: 'test---slug' } });
    expect(slugInput).toHaveValue('test-slug');
  });

  it('canceling restores original values and returns to view mode without calling API', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /edit workspace/i }));

    const nameInput = screen.getByLabelText(/workspace name/i);
    const slugInput = screen.getByLabelText(/workspace slug/i);

    fireEvent.change(nameInput, { target: { value: 'Temporary Altered Name' } });
    fireEvent.change(slugInput, { target: { value: 'temporary-slug' } });

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    // View mode restored
    expect(screen.queryByLabelText(/workspace name/i)).not.toBeInTheDocument();
    expect(screen.getByText('KKR & KSR Institute of Technology and Sciences')).toBeInTheDocument();
    expect(screen.getByText('kkr-ksr-institute-of-technology-and-sciences')).toBeInTheDocument();
    expect(api.organization.update).not.toHaveBeenCalled();
  });

  it('displays real-time validation message when slug is taken', async () => {
    (api.organization.checkSlug as any).mockResolvedValue({
      available: false,
      valid: true,
      message: "Workspace slug 'taken-slug' is already taken.",
    });

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /edit workspace/i }));

    const slugInput = screen.getByLabelText(/workspace slug/i);
    fireEvent.change(slugInput, { target: { value: 'taken-slug' } });

    await waitFor(() => {
      expect(screen.getByText("Workspace slug 'taken-slug' is already taken.")).toBeInTheDocument();
    });

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    expect(saveBtn).toBeDisabled();
  });

  it('submits valid updates to backend API and triggers refetch and success toast', async () => {
    (api.organization.update as any).mockResolvedValue({
      organization: {
        id: 'org1',
        name: 'KITS Guntur Security Vault',
        slug: 'kits-guntur-security-vault',
        workspace_type: 'shared',
      },
    });

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /edit workspace/i }));

    const nameInput = screen.getByLabelText(/workspace name/i);
    const slugInput = screen.getByLabelText(/workspace slug/i);

    fireEvent.change(nameInput, { target: { value: 'KITS Guntur Security Vault' } });
    fireEvent.change(slugInput, { target: { value: 'kits-guntur-security-vault' } });

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    await waitFor(() => {
      expect(saveBtn).not.toBeDisabled();
    });

    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.organization.update).toHaveBeenCalledWith({
        name: 'KITS Guntur Security Vault',
        slug: 'kits-guntur-security-vault',
      });
      expect(mockSuccessToast).toHaveBeenCalledWith(
        'Workspace Updated',
        'Workspace name and slug updated successfully.'
      );
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it('handles 409 conflict error when slug is already taken on submit', async () => {
    const conflictError: any = new Error("Workspace slug 'kits-vault' is already taken.");
    conflictError.status = 409;
    (api.organization.update as any).mockRejectedValue(conflictError);

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /edit workspace/i }));

    const slugInput = screen.getByLabelText(/workspace slug/i);
    fireEvent.change(slugInput, { target: { value: 'kits-vault' } });

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    await waitFor(() => {
      expect(saveBtn).not.toBeDisabled();
    });

    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockErrorToast).toHaveBeenCalledWith('Conflict', expect.stringContaining('already taken'));
    });
  });

  it('prevents non-admin members from editing workspace name or slug', () => {
    mockAuthContext = {
      ...mockAuthContext,
      role: 'member',
      isAdmin: false,
    };

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Workspace Identity')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit workspace/i })).not.toBeInTheDocument();
    expect(
      screen.getByText(/only organization administrators are authorized to modify workspace configurations/i)
    ).toBeInTheDocument();
  });
});
