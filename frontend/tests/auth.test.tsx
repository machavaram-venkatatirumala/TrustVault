import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../src/features/auth/LoginPage';

const mockLogin = vi.fn();
const mockRefetch = vi.fn();
const mockSuccessToast = vi.fn();
const mockErrorToast = vi.fn();

vi.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    refetch: mockRefetch,
    user: null,
    loading: false,
  }),
}));

vi.mock('../src/hooks/useToast', () => ({
  useToast: () => ({
    success: mockSuccessToast,
    error: mockErrorToast,
  }),
}));

vi.mock('../src/lib/api', () => ({
  api: {
    seed: {
      seedDemo: vi.fn().mockResolvedValue({ message: 'Seeded' }),
    },
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with fields and buttons', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /sign in to your organization/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
  });

  it('validates empty inputs on submit', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const form = screen.getByRole('button', { name: /^sign in$/i }).closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    expect(await screen.findByText(/please provide both email and password/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('submits form with user credentials', async () => {
    mockLogin.mockResolvedValueOnce({ user: { id: 'u1' } });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'avery.morgan@northstar.example' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••••••'), {
      target: { value: 'Password123!' },
    });

    const form = screen.getByRole('button', { name: /^sign in$/i }).closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'avery.morgan@northstar.example',
        password: 'Password123!',
      });
    });
  });

  it('quick fill button populates and logs in admin persona credentials', async () => {
    mockLogin.mockResolvedValueOnce({ user: { id: 'u1' } });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const adminQuickFill = screen.getByText('Avery Morgan').closest('button');
    expect(adminQuickFill).not.toBeNull();
    if (adminQuickFill) {
      fireEvent.click(adminQuickFill);
    }

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'avery.morgan@northstar.example',
        password: 'Password123!',
      });
    });
  });
});
