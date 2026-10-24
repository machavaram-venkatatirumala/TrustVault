import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Cpu,
  Lock,
  ArrowRight,
  Sparkles,
  GitBranch,
  Layers,
  Award,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { TrustVaultLogo } from '../../components/brand/TrustVaultLogo';

export function AboutPage() {
  const principles = [
    {
      num: '01',
      title: 'Backend-Enforced Security',
      desc: 'Security must be strictly enforced on the server. The UI provides usability feedback, but the backend validates every permission, MIME type, and organization boundary independently.',
    },
    {
      num: '02',
      title: 'Strict Multi-Tenant Isolation',
      desc: 'Organizations are completely isolated. Queries always filter through verified organization memberships to prevent cross-tenant enumeration and IDOR attacks.',
    },
    {
      num: '03',
      title: 'Cryptographic Integrity Verification',
      desc: 'Document authenticity is verified by streaming actual file bytes from storage and calculating a real SHA-256 digest, rather than comparing user-supplied metadata.',
    },
    {
      num: '04',
      title: 'Authoritative Server Audit Trails',
      desc: 'Audit logs are generated exclusively by trusted server-side services. Standard users cannot edit, modify, or forge audit records.',
    },
    {
      num: '05',
      title: 'Immediate Permission Revocation',
      desc: 'Revoking a permission immediately terminates the recipient’s ability to download or view the document. No caching loopholes or delayed revocation windows.',
    },
    {
      num: '06',
      title: 'Zero Fake Data Policy',
      desc: 'All counters, metrics, charts, and activity feeds reflect actual database records. No fabricated user activity or simulated security states.',
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
            <Link to="/pricing" className="hover:text-text-primary transition-colors">
              Pricing
            </Link>
            <Link to="/about" className="text-primary font-bold">
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
            <Cpu className="w-3.5 h-3.5" />
            <span>Mission & Engineering Philosophy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight">
            Every document accounted for. Every permission intentional.
          </h1>
          <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            TrustVault was created to solve a persistent organizational crisis: sensitive corporate files scattered across cloud shares with lost ownership, unrevoked links, and zero tamper-verification.
          </p>
        </div>
      </section>

      {/* Narrative Section */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              The Core Problem
            </span>
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">
              Traditional cloud sharing sacrifices control for convenience
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              When finance teams distribute earnings models, legal teams share deal agreements, or engineering teams circulate architectural blueprints, they often rely on public static URLs or opaque links.
            </p>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Once shared, there is rarely any proof that the file remained unaltered, no way to verify if past collaborators still retain download ability, and no immutable trail of who accessed what and when.
            </p>
          </div>

          <div className="rounded-large border border-border bg-white dark:bg-elevated p-6 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-text-primary">The TrustVault Solution</h3>
            <ul className="space-y-3 text-xs text-text-secondary">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span><strong>Private Storage:</strong> Files are stored outside the public directory with opaque UUID storage keys.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span><strong>Cryptographic Verification:</strong> Server computes SHA-256 on byte streams with on-demand mismatch detection.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span><strong>Controlled Sharing:</strong> Specific View vs. Download permission levels with instantaneous revocation.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span><strong>Tamper-Resistant Auditing:</strong> Append-only server-generated event log with correlation IDs.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Engineering Principles */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Core Principles
            </span>
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">
              How TrustVault is engineered
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {principles.map((p, idx) => (
              <div
                key={idx}
                className="rounded-medium border border-border bg-white dark:bg-elevated p-6 shadow-subtle space-y-3"
              >
                <span className="text-2xl font-black text-primary/30 block">
                  {p.num}
                </span>
                <h4 className="text-sm font-bold text-text-primary">{p.title}</h4>
                <p className="text-xs text-text-secondary leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Campus Evaluation Context */}
        <div className="rounded-large border border-border/80 bg-surface-subtle p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-text-primary">
              Forward Deployed Engineer (FDE) Portfolio Scope
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            TrustVault was developed as a complete end-to-end full-stack SaaS demonstration to prove practical capabilities in application security, database isolation, threat modeling, AI-assisted engineering oversight, and production-ready system design.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/security">
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>Review Threat Model (STRIDE)</span>
              </Button>
            </Link>
            <Link to="/features">
              <Button variant="ghost" size="sm" className="text-xs gap-1.5">
                <span>View Full Features</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
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
