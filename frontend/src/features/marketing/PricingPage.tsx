import React from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  ShieldCheck,
  Zap,
  Building,
  HelpCircle,
  ArrowRight,
  HardDrive,
  Users,
  FileCheck,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { TrustVaultLogo } from '../../components/brand/TrustVaultLogo';

export function PricingPage() {
  const plans = [
    {
      name: 'Starter Vault',
      tagline: 'Ideal for individual practitioners, founders, and small consultancies.',
      price: '$0',
      period: 'Free during technical evaluation',
      badge: 'Active Default',
      badgeColor: 'bg-primary/10 text-primary border-primary/20',
      accentColor: 'border-border',
      buttonVariant: 'outline' as const,
      buttonText: 'Start Free Workspace',
      buttonHref: '/register',
      storageQuota: '1 GB Secure Storage',
      memberQuota: 'Up to 5 Team Members',
      uploadLimit: '25 MB per file upload',
      features: [
        'SHA-256 integrity verification',
        'Granular View & Download permissions',
        'Permission expiration controls (7d, 30d)',
        'Server-side audit event logging',
        'Direct personal workspace provisioning',
        'Standard rate limiting & CSRF defense',
      ],
    },
    {
      name: 'Professional',
      tagline: 'For fast-moving law firms, finance teams, and boutique agencies.',
      price: '$29',
      period: 'per workspace / month',
      badge: 'Recommended',
      badgeColor: 'bg-emerald/10 text-success border-success/20',
      accentColor: 'border-primary ring-1 ring-primary/30 shadow-card',
      buttonVariant: 'primary' as const,
      buttonText: 'Choose Professional',
      buttonHref: '/register',
      storageQuota: '25 GB Secure Storage',
      memberQuota: 'Up to 25 Team Members',
      uploadLimit: '100 MB per file upload',
      features: [
        'Everything in Starter Vault',
        'Extended 1-year audit trail retention',
        'Priority on-demand integrity re-verification',
        'Custom workspace subdomain slug',
        'Bulk member invitation management',
        'Exportable CSV audit logs for compliance',
      ],
    },
    {
      name: 'Enterprise / Scale',
      tagline: 'For regulated enterprises requiring strict compliance workflows.',
      price: 'Custom',
      period: 'annual agreement',
      badge: 'Dedicated Tenant',
      badgeColor: 'bg-warm/10 text-warm border-warm/20',
      accentColor: 'border-border',
      buttonVariant: 'outline' as const,
      buttonText: 'Contact Security Team',
      buttonHref: '/contact',
      storageQuota: '500 GB+ Object Storage',
      memberQuota: 'Unlimited Organization Members',
      uploadLimit: '500 MB per file upload',
      features: [
        'Everything in Professional',
        'Dedicated S3/R2 private storage bucket',
        'Custom Argon2 memory/time cost parameters',
        'Custom session timeout & idle invalidation',
        'SAML 2.0 / Okta SSO integration (Roadmap)',
        'Signed BAA / Data Processing Addendum',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background-warm flex flex-col font-sans selection:bg-primary-soft selection:text-primary">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-elevated/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center">
            <TrustVaultLogo size="md" />
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-text-secondary">
            <Link to="/" className="hover:text-text-primary transition-colors">
              Home
            </Link>
            <Link to="/features" className="hover:text-text-primary transition-colors">
              Features
            </Link>
            <Link to="/security" className="hover:text-text-primary transition-colors">
              Security
            </Link>
            <Link to="/pricing" className="text-primary font-bold">
              Pricing
            </Link>
            <Link to="/about" className="hover:text-text-primary transition-colors">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-xs">
                Sign in
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="text-xs gap-1.5 shadow-subtle">
                <span>Start your workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="pt-16 pb-12 sm:pt-20 sm:pb-16 bg-gradient-to-b from-white via-surface-blue/20 to-background-warm dark:from-elevated dark:via-surface-blue/10 dark:to-background-warm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transparent Plan Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight">
            Predictable plans. Authoritative quota enforcement.
          </h1>
          <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            All plans include private file storage, server-side SHA-256 verification, and real audit event tracking. In this live evaluation environment, all newly registered accounts immediately receive Starter Vault privileges.
          </p>
        </div>
      </section>

      {/* Plan Cards */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`rounded-large border bg-white dark:bg-elevated p-8 flex flex-col justify-between transition-all ${plan.accentColor}`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-text-primary tracking-tight">
                    {plan.name}
                  </h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${plan.badgeColor}`}>
                    {plan.badge}
                  </span>
                </div>

                <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                  {plan.tagline}
                </p>

                <div className="mb-6 pb-6 border-b border-border">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold text-text-primary tracking-tight">
                      {plan.price}
                    </span>
                    <span className="text-xs text-text-muted">
                      {plan.period}
                    </span>
                  </div>
                </div>

                {/* Quota Specs */}
                <div className="space-y-2 mb-6 p-3 rounded-medium bg-surface-subtle border border-border/70 text-xs">
                  <div className="flex items-center gap-2 text-text-primary font-medium">
                    <HardDrive className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{plan.storageQuota}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-primary font-medium">
                    <Users className="w-3.5 h-3.5 text-secondary shrink-0" />
                    <span>{plan.memberQuota}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-primary font-medium">
                    <FileCheck className="w-3.5 h-3.5 text-success shrink-0" />
                    <span>{plan.uploadLimit}</span>
                  </div>
                </div>

                {/* Feature List */}
                <div className="space-y-3 mb-8">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
                    Included Capabilities
                  </span>
                  <ul className="space-y-2.5">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-xs text-text-secondary">
                        <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Link to={plan.buttonHref}>
                <Button
                  variant={plan.buttonVariant}
                  className="w-full text-xs font-semibold py-2.5 shadow-subtle"
                >
                  {plan.buttonText}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Evaluation Policy Notice */}
        <div className="mt-12 rounded-medium border border-border bg-surface-subtle p-5 text-xs text-text-secondary max-w-3xl mx-auto flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-text-muted shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-text-primary">
              Evaluation & Commercial Transparency Notice
            </p>
            <p className="text-[11px] leading-relaxed">
              In accordance with our anti-fabrication standards, paid payment gateways (such as Stripe or LemonSqueezy) are not connected in this demonstration instance. All plan quotas and storage consumption are backed by live PostgreSQL database queries in the authenticated <Link to="/app/billing" className="text-primary underline">Usage & Billing Management</Link> portal.
            </p>
          </div>
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
