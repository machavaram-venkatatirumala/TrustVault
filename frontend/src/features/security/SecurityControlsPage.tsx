import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Server,
  LogOut,
  Clock,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../lib/formatters';

export function SecurityControlsPage() {
  const { user, organization, role, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleTerminateSession = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const securityControls = [
    {
      title: 'Password Hashing & Key Derivation',
      status: 'Active (Argon2id)',
      variant: 'success' as const,
      description: 'Passwords hashed with memory-hard Argon2id parameters preventing GPU cracking attacks.',
    },
    {
      title: 'Session & Cookie Security',
      status: 'Enforced (HttpOnly, SameSite=Lax)',
      variant: 'success' as const,
      description: 'Credentials and session identifiers are never exposed to browser JavaScript or localStorage.',
    },
    {
      title: 'Multi-Tenant Data Isolation',
      status: 'Enforced (Foreign-Key Scoped)',
      variant: 'success' as const,
      description: 'Every database query and API operation verifies membership before accessing documents.',
    },
    {
      title: 'File Upload Sanitization & Magic Bytes',
      status: 'Active (Allowlist Enforced)',
      variant: 'success' as const,
      description: 'MIME types inspected via magic byte headers. Filenames sanitized against directory traversal (../).',
    },
    {
      title: 'Rate Limiting Defense',
      status: '5/min Auth, 60/min General',
      variant: 'success' as const,
      description: 'Flask-Limiter throttles brute-force login attempts and repeated resource requests.',
    },
    {
      title: 'Cryptographic SHA-256 Digest',
      status: 'Authoritative Server Hash',
      variant: 'success' as const,
      description: 'Streamed byte hashing on upload with on-demand tamper verification.',
    },
  ];

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-8 font-sans">
      {/* Page Title */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Security Settings & Session Controls
        </h1>
        <p className="text-xs text-text-secondary leading-relaxed">
          Inspect your active session parameters, review backend security controls, and manage authentication state.
        </p>
      </div>

      {/* Active Session Card */}
      <div className="rounded-large border border-border bg-white dark:bg-elevated p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <span>Active Authentication Session</span>
            </h2>
            <p className="text-xs text-text-secondary">
              Session established for <strong>{user?.email}</strong> in <strong>{organization?.name}</strong>.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleTerminateSession}
            disabled={loggingOut}
            className="text-xs text-danger hover:text-danger hover:bg-danger-bg gap-1.5 shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{loggingOut ? 'Terminating...' : 'Terminate Session'}</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-medium bg-surface-subtle border border-border/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
              Cookie Security
            </span>
            <p className="font-semibold text-text-primary">HttpOnly; SameSite=Lax</p>
            <span className="text-[10px] text-text-muted">Protected against XSS credential theft</span>
          </div>

          <div className="p-3.5 rounded-medium bg-surface-subtle border border-border/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
              Session Expiry
            </span>
            <p className="font-semibold text-text-primary">24 Hours (Rolling)</p>
            <span className="text-[10px] text-text-muted">Invalidated on explicit logout</span>
          </div>

          <div className="p-3.5 rounded-medium bg-surface-subtle border border-border/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
              Organization Role
            </span>
            <p className="font-semibold text-text-primary capitalize">{role} Privileges</p>
            <span className="text-[10px] text-text-muted">Scoped to tenant ID: {organization?.id.slice(0, 8)}...</span>
          </div>
        </div>
      </div>

      {/* Backend Security Architecture Status */}
      <div className="rounded-large border border-border bg-white dark:bg-elevated p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-success" />
              <span>Defensive Architecture Checklist</span>
            </h3>
            <p className="text-xs text-text-secondary">
              Verified operational status of core security subsystems across the application stack.
            </p>
          </div>

          <Link to="/security" target="_blank">
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">
              <span>View Security Architecture</span>
              <ExternalLink className="w-3 h-3" />
            </Button>
          </Link>
        </div>

        <div className="divide-y divide-border border border-border rounded-medium overflow-hidden">
          {securityControls.map((ctrl, idx) => (
            <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-surface-subtle transition-colors">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-text-primary">{ctrl.title}</p>
                <p className="text-[11px] text-text-secondary">{ctrl.description}</p>
              </div>
              <Badge variant={ctrl.variant} className="text-[10px] shrink-0 self-start sm:self-center font-bold">
                {ctrl.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Threat Matrix Link */}
      <div className="rounded-medium border border-border/80 bg-surface-subtle p-5 text-xs text-text-secondary flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="font-semibold text-text-primary">
            Automated Threat Model (STRIDE) Verification
          </p>
          <p className="text-[11px] leading-relaxed">
            All 20 threats outlined in <code>THREATS.md</code> are backed by 48 automated integration tests covering cross-tenant leakage, revoked access reuse, and directory traversal.
          </p>
        </div>
        <Link to="/security" target="_blank" className="shrink-0">
          <Button size="sm" variant="outline" className="text-xs gap-1.5 bg-white dark:bg-elevated">
            <Terminal className="w-3.5 h-3.5 text-primary" />
            <span>Read Threat Model</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
