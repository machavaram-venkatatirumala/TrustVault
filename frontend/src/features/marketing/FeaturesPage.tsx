import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  FileCheck,
  Database,
  Users,
  Eye,
  Download,
  Activity,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  Server,
  Fingerprint,
  Sparkles,
  Layers,
  FileText,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { TrustVaultLogo } from '../../components/brand/TrustVaultLogo';
import { MarketingHeader } from '../../components/layout/MarketingHeader';

export function FeaturesPage() {
  const featureList = [
    {
      icon: Lock,
      color: 'text-primary bg-primary-soft border-primary/20',
      badge: 'Confidentiality',
      badgeColor: 'bg-primary/10 text-primary border-primary/20',
      title: 'Private Document Vault',
      description:
        'Documents are stored in a protected storage directory outside the web server root. Files are referenced via randomized UUID storage keys with strict server-side authorization checks on every read.',
      highlights: [
        'Strictly zero public static file URLs',
        'Automatic MIME sniffing & magic bytes validation',
        'Path traversal defense with filename sanitization',
      ],
    },
    {
      icon: Fingerprint,
      color: 'text-success bg-surface-green border-success/20',
      badge: 'Integrity',
      badgeColor: 'bg-success/10 text-success border-success/20',
      title: 'SHA-256 Cryptographic Verification',
      description:
        'Upon upload, the server streams file bytes and calculates an immutable SHA-256 digest. Anyone with authorized access can trigger an on-demand integrity check to verify against the stored hash.',
      highlights: [
        'Dynamic byte stream hash re-computation',
        'Explicit mismatch detection & audit alerts',
        'Tamper simulation endpoint for QA verification',
      ],
    },
    {
      icon: KeyRound,
      color: 'text-secondary bg-surface-teal border-secondary/20',
      badge: 'Authorization',
      badgeColor: 'bg-secondary/10 text-secondary border-secondary/20',
      title: 'Granular Document Sharing',
      description:
        'Grant access to specific workspace members with fine-grained View vs. Download permission levels. Set automatic expiration timestamps or instantly revoke access with immediate backend enforcement.',
      highlights: [
        'Separate View and Download permission boundaries',
        'Configurable expiration dates (e.g. 7d, 30d)',
        'Immediate revocation without caching loopholes',
      ],
    },
    {
      icon: Activity,
      color: 'text-terracotta bg-surface-coral border-terracotta/20',
      badge: 'Accountability',
      badgeColor: 'bg-terracotta/10 text-terracotta border-terracotta/20',
      title: 'Tamper-Resistant Audit Trail',
      description:
        'Every sensitive action—logins, uploads, downloads, integrity checks, permission grants, and revocations—generates a server-side audit event with client IP, timestamp, and request correlation ID.',
      highlights: [
        'Server-generated timestamps and correlation IDs',
        'Immutable append-only database records',
        'Exportable audit records for administrative review',
      ],
    },
    {
      icon: Users,
      color: 'text-lavender bg-surface-lavender border-lavender/20',
      badge: 'Multi-Tenancy',
      badgeColor: 'bg-lavender/10 text-lavender border-lavender/20',
      title: 'Tenant Isolation & Role Management',
      description:
        'Strict organization-scoped boundaries ensure that User A in Workspace 1 can never view or modify resources in Workspace 2. Role-based controls separate Workspace Admins from Members.',
      highlights: [
        'Enforced organization foreign key scoping on all queries',
        'Prevention of cross-tenant IDOR attacks',
        'Role-scoped administration and invitation flows',
      ],
    },
    {
      icon: Server,
      color: 'text-warm bg-surface-gold border-warm/20',
      badge: 'Infrastructure',
      badgeColor: 'bg-warm/10 text-warm border-warm/20',
      title: 'Enterprise Security Architecture',
      description:
        'Engineered with defense-in-depth: Argon2id password hashing, HTTP-only SameSite cookies, CSRF defenses, rate limiting on sensitive endpoints, and strict Content Security Policies.',
      highlights: [
        'Argon2id key derivation function for credentials',
        'Endpoint rate limiting preventing brute-force attacks',
        'Zero secrets or sensitive data stored in browser localStorage',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background-warm flex flex-col font-sans selection:bg-primary-soft selection:text-primary">
      <MarketingHeader activePage="features" />

      {/* Hero Banner */}
      <section className="pt-16 pb-12 sm:pt-20 sm:pb-16 bg-gradient-to-b from-white via-surface-blue/20 to-background-warm dark:from-elevated dark:via-surface-blue/10 dark:to-background-warm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>Core Product Capabilities</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight">
            Comprehensive security engineered for sensitive document exchange
          </h1>
          <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Every feature in TrustVault is backed by authoritative server-side enforcement. Explore how our zero-trust architecture protects your files at rest, in transit, and during collaboration.
          </p>
        </div>
      </section>

      {/* Feature Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureList.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-large border border-border bg-white dark:bg-elevated p-6 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-medium flex items-center justify-center border ${item.color}`}>
                      <Icon className="w-5 h-5 stroke-[2]" />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-text-primary tracking-tight mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-border/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-2">
                    Key Technical Guarantees
                  </span>
                  <ul className="space-y-1.5">
                    {item.highlights.map((h, hIdx) => (
                      <li key={hIdx} className="flex items-start gap-2 text-xs text-text-secondary">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Card */}
        <div className="mt-16 rounded-large border border-border bg-gradient-to-r from-primary-soft via-surface-teal to-surface-blue p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-subtle">
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">
              Ready to verify document integrity in your workspace?
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary max-w-xl">
              Create an account in 30 seconds. No credit card required. Personal workspaces provision automatically with full audit capabilities.
            </p>
          </div>
          <Link to="/register" className="shrink-0">
            <Button size="lg" className="gap-2 shadow-subtle">
              <span>Start your workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white dark:bg-elevated py-8 text-xs text-text-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/features" className="hover:text-text-primary">Features</Link>
            <Link to="/security" className="hover:text-text-primary">Security</Link>
            <Link to="/pricing" className="hover:text-text-primary">Pricing</Link>
            <Link to="/about" className="hover:text-text-primary">About</Link>
            <Link to="/contact" className="hover:text-text-primary">Contact</Link>
          </div>
          <p>© 2026 TrustVault. Verifiable document management SaaS.</p>
        </div>
      </footer>
    </div>
  );
}
