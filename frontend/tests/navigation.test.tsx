import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../src/components/layout/Sidebar';

let mockAuthState = {
  user: { full_name: 'Jordan Lee', email: 'jordan@example.com' },
  organization: { name: 'Acme Security Corp' },
  role: 'member',
  isAdmin: false,
  logout: vi.fn(),
};

vi.mock('../src/hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

describe('Sidebar Navigation & RBAC Visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hides admin-only navigation links for member role', () => {
    mockAuthState = {
      user: { full_name: 'Jordan Lee', email: 'jordan@example.com' },
      organization: { name: 'Acme Security Corp' },
      role: 'member',
      isAdmin: false,
      logout: vi.fn(),
    };

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    // Standard items should be present
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Shared with me')).toBeInTheDocument();
    expect(screen.getByText('Access Permissions')).toBeInTheDocument();

    // Admin items must NOT be in the document
    expect(screen.queryByText('Audit Center')).not.toBeInTheDocument();
    expect(screen.queryByText('Members')).not.toBeInTheDocument();
  });

  it('shows admin-only navigation links for administrator role', () => {
    mockAuthState = {
      user: { full_name: 'Jane Doe', email: 'jane@example.com' },
      organization: { name: 'Acme Security Corp' },
      role: 'admin',
      isAdmin: true,
      logout: vi.fn(),
    };

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Audit Center')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
  });
});
