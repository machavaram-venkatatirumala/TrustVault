import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { TermsPage } from '../src/features/legal/TermsPage';
import { PrivacyPage } from '../src/features/legal/PrivacyPage';
import { CookiesPage } from '../src/features/legal/CookiesPage';
import { SecurityPage } from '../src/features/legal/SecurityPage';
import { ContactPage } from '../src/features/legal/ContactPage';
import { ThemeProvider, useTheme } from '../src/lib/theme';
import { ThemeToggle } from '../src/components/ui/ThemeToggle';
import { CookieConsent } from '../src/components/layout/CookieConsent';

function ThemeTestComponent() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={() => setTheme('dark')} data-testid="set-dark">Set Dark</button>
      <button onClick={() => setTheme('light')} data-testid="set-light">Set Light</button>
      <ThemeToggle />
    </div>
  );
}

describe('Legal & Policy Pages', () => {
  it('renders Terms of Service with required sections', () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /terms of service/i })).toBeInTheDocument();
    expect(screen.getByText(/acceptance of terms/i)).toBeInTheDocument();
    expect(screen.getByText(/ownership of uploaded documents/i)).toBeInTheDocument();
    expect(screen.getByText(/october 24, 2026/i)).toBeInTheDocument();
  });

  it('renders Privacy Policy with data transparency sections', () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /privacy policy/i })).toBeInTheDocument();
    expect(screen.getByText(/information we collect/i)).toBeInTheDocument();
    expect(screen.getByText(/storage architecture and isolation/i)).toBeInTheDocument();
  });

  it('renders Cookie Policy with essential session cookie breakdown', () => {
    render(
      <MemoryRouter>
        <CookiesPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /cookie policy/i })).toBeInTheDocument();
    expect(screen.getByText('trustvault_session')).toBeInTheDocument();
    expect(screen.getByText(/zero third-party advertising/i)).toBeInTheDocument();
  });

  it('renders Security Architecture page', () => {
    render(
      <MemoryRouter>
        <SecurityPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /security architecture & controls/i })).toBeInTheDocument();
    expect(screen.getByText(/argon2id password hashing/i)).toBeInTheDocument();
    expect(screen.getByText(/streaming sha-256 verification/i)).toBeInTheDocument();
  });

  it('renders Contact and Support page with working inquiry inputs', () => {
    render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /support & inquiries/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
  });
});

describe('Theme System', () => {
  it('initializes and switches themes cleanly', () => {
    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    );

    const themeDisplay = screen.getByTestId('current-theme');
    expect(themeDisplay.textContent).toMatch(/light|dark|system/);

    fireEvent.click(screen.getByTestId('set-dark'));
    expect(themeDisplay.textContent).toBe('dark');

    fireEvent.click(screen.getByTestId('set-light'));
    expect(themeDisplay.textContent).toBe('light');
  });
});
