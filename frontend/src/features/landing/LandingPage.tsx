import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  KeyRound,
  FileCheck,
  Activity,
  ArrowRight,
  Lock,
  Database,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary-soft selection:text-primary">
      {/* Sticky White Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-small bg-primary flex items-center justify-center text-white shadow-subtle">
              <Shield className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="font-bold text-base tracking-tight text-text-primary">TrustVault</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-text-secondary">
            <a href="#product" className="hover:text-text-primary transition-colors">
              Product
            </a>
            <a href="#security" className="hover:text-text-primary transition-colors">
              Security
            </a>
            <a href="#how-it-works" className="hover:text-text-primary transition-colors">
              How It Works
            </a>
            <a href="#architecture" className="hover:text-text-primary transition-colors">
              Architecture
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-xs">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="text-xs gap-1.5">
                <span>Create Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-28 overflow-hidden bg-gradient-to-b from-white via-surface-blue/20 to-background-warm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Value Proposition */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Secure Document Operations</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text-primary tracking-tight leading-[1.1]">
                Every document accounted for. Every permission intentional.
              </h1>

              <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-xl">
                TrustVault provides multi-tenant confidential document management with server-side SHA-256 integrity verification, granular access control, and an administrator-only audit trail.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto text-sm gap-2">
                    <span>Create Your Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm">
                    Live Demo Sign In
                  </Button>
                </Link>
              </div>

              <div className="pt-4 flex items-center gap-6 text-xs text-text-muted">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Argon2id Hashing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>SHA-256 Verification</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Private Storage</span>
                </div>
              </div>
            </div>

            {/* Right Column: Bespoke Product Preview Component */}
            <div className="lg:col-span-6">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                {/* Glow Backdrop */}
                <div className="absolute -inset-2 bg-gradient-to-r from-accent-blue/10 to-accent-periwinkle/20 rounded-large blur-xl opacity-70"></div>

                {/* Simulated Real App Window */}
                <div className="relative rounded-large border border-border bg-white shadow-modal overflow-hidden">
                  {/* Top Bar of Window */}
                  <div className="h-10 border-b border-border bg-surface-subtle/50 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                    </div>
                    <span className="text-[11px] font-mono text-text-muted">
                      trustvault.internal / workspace-preview
                    </span>
                    <Badge variant="success" className="text-[10px] py-0 px-1.5">
                      Encrypted
                    </Badge>
                  </div>

                  {/* Window Content */}
                  <div className="p-4 sm:p-5 space-y-4 bg-background-warm/30">
                    {/* Miniature Document Card */}
                    <div className="p-3.5 rounded-medium border border-border bg-white shadow-card space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-small bg-primary-soft flex items-center justify-center text-primary">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-text-primary">
                              Client Onboarding & Compliance.pdf
                            </p>
                            <p className="text-[11px] text-text-muted">Uploaded by Organization Admin • 2.4 MB</p>
                          </div>
                        </div>
                        <Badge variant="success" className="text-[11px]">
                          SHA-256 Verified
                        </Badge>
                      </div>

                      {/* Hash Preview */}
                      <div className="p-2 rounded-small bg-surface-subtle font-mono text-[10px] text-text-secondary truncate">
                        e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                      </div>

                      {/* Sharing Grants Line */}
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/60">
                        <span className="text-text-muted">Active Access Grant:</span>
                        <span className="font-semibold text-text-primary">Jordan Lee (Download)</span>
                      </div>
                    </div>

                    {/* Miniature Recent Audit Event */}
                    <div className="p-3 rounded-medium border border-border/80 bg-white/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-success/10 text-success flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-text-primary">
                            integrity.verify_success
                          </p>
                          <p className="text-[10px] text-text-muted">Actor: Avery Morgan • 2 minutes ago</p>
                        </div>
                      </div>
                      <Badge variant="neutral" className="text-[10px]">
                        Audit ID #89a1
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Blocks */}
      <section id="product" className="py-16 sm:py-24 bg-white border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Engineered For Due Diligence & Security
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Enterprise control at every layer of the document lifecycle
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-medium border border-border bg-white shadow-card hover:border-border-strong transition-all space-y-3">
              <div className="w-10 h-10 rounded-medium bg-primary-soft text-primary flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-text-primary">Verifiable Integrity</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Server-side SHA-256 calculation at the moment of upload. Instant real-time byte comparison catches any file alteration or tampering.
              </p>
            </div>

            <div className="p-5 rounded-medium border border-border bg-white shadow-card hover:border-border-strong transition-all space-y-3">
              <div className="w-10 h-10 rounded-medium bg-surface-blue text-info flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-text-primary">Granular Access Control</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Grant view or download privileges to verified team members. Revocations take effect immediately on backend download endpoints.
              </p>
            </div>

            <div className="p-5 rounded-medium border border-border bg-white shadow-card hover:border-border-strong transition-all space-y-3">
              <div className="w-10 h-10 rounded-medium bg-amber-50 text-warning flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-text-primary">Administrator Audit Trail</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Every critical event—uploads, downloads, permission grants, and integrity checks—is immutably recorded with actor, outcome, and metadata.
              </p>
            </div>

            <div className="p-5 rounded-medium border border-border bg-white shadow-card hover:border-border-strong transition-all space-y-3">
              <div className="w-10 h-10 rounded-medium bg-emerald-50 text-success flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-text-primary">Private Object Storage</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Documents are never publicly accessible. Stored under opaque randomized keys outside the web root with server-enforced authorization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-background-warm border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">Workflow Simplicity</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              How TrustVault secures your organization
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-6 rounded-medium bg-white border border-border shadow-subtle space-y-3">
              <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h4 className="text-sm font-semibold text-text-primary">Upload & Authoritative Hashing</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Drag and drop confidential documents. The server computes the authoritative SHA-256 digest directly from the raw byte stream and stores the file under an opaque key.
              </p>
            </div>

            <div className="p-6 rounded-medium bg-white border border-border shadow-subtle space-y-3">
              <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h4 className="text-sm font-semibold text-text-primary">Intentional Sharing & Revocation</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Assign view-only or download permissions to colleagues. Revoking a grant takes effect immediately, blocking any subsequent download attempts.
              </p>
            </div>

            <div className="p-6 rounded-medium bg-white border border-border shadow-subtle space-y-3">
              <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h4 className="text-sm font-semibold text-text-primary">Verification & Audit Oversight</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Run real-time integrity verification at any time. Administrators review comprehensive audit logs with structured metadata and request tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Architecture Callout */}
      <section id="architecture" className="py-16 bg-white border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-large border border-border bg-surface-subtle/50 p-6 sm:p-8 space-y-4 text-left">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              <h4 className="text-sm font-bold text-text-primary tracking-tight">
                Architectural Transparency
              </h4>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              TrustVault is built with a strictly typed React + TypeScript frontend, a Python Flask service layer, and PostgreSQL relational data persistence. Passwords are salted and hashed using Argon2id. Multi-tenant boundaries are validated at every route decorator, and private storage keys are decoupled from client-supplied filenames to eliminate path traversal vulnerabilities.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-semibold text-text-primary">TrustVault</span>
            <span>— Secure document sharing with a real audit trail.</span>
          </div>
          <div>
            <span>Forward Deployed Engineer Portfolio Demonstration</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
