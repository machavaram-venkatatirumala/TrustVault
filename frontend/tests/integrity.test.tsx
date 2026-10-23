import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { IntegrityBadge } from '../src/components/documents/IntegrityBadge';

describe('IntegrityBadge', () => {
  it('renders verified state with green badge and verified label', () => {
    render(<IntegrityBadge status="verified" />);
    expect(screen.getByText('SHA-256 Verified')).toBeInTheDocument();
  });

  it('renders mismatch state with danger indicator', () => {
    render(<IntegrityBadge status="mismatch" />);
    expect(screen.getByText('Digest Mismatch')).toBeInTheDocument();
  });

  it('renders unverified state', () => {
    render(<IntegrityBadge status="unverified" />);
    expect(screen.getByText('Unverified')).toBeInTheDocument();
  });

  it('renders unavailable state when file is missing', () => {
    render(<IntegrityBadge status="unavailable" />);
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });
});
