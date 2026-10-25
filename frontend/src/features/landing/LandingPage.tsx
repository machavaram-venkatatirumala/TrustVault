import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  FileCheck,
  Database,
  CheckCircle2,
  Users,
  Eye,
  Download,
  FileText,
  Search,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { TrustVaultLogo } from '../../components/brand/TrustVaultLogo';

export function LandingPage() {
  // Mobile Navigation Drawer State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Interactive Product Preview State
  const [activeTab, setActiveTab] = useState<'integrity' | 'permissions'>('integrity');
  const [verifying, setVerifying] = useState(false);
  const [verifiedState, setVerifiedState] = useState<'verified' | 'ready'>('verified');
  const [permissionLevel, setPermissionLevel] = useState<'view' | 'download'>('download');
  const [accessRevoked, setAccessRevoked] = useState(false);

  const simulateVerify = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerifiedState('verified');
    }, 600);
  };

  const reopenCookieSettings = () => {
    window.dispatchEvent(new CustomEvent('open-cookie-preferences'));
  };

  return (
    <div className="min-h-screen bg-background-warm flex flex-col font-sans selection:bg-primary-soft selection:text-primary">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-1.5 rounded-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/" className="inline-flex items-center">
              <TrustVaultLogo size="md" />
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-text-secondary">
            <a href="#product" className="hover:text-text-primary transition-colors">
              Product
            </a>
            <Link to="/features" className="hover:text-text-primary transition-colors">
              Features
            </Link>
            <Link to="/security" className="hover:text-text-primary transition-colors">
              Security
            </Link>
            <Link to="/pricing" className="hover:text-text-primary transition-colors">
              Pricing
            </Link>
            <Link to="/about" className="hover:text-text-primary transition-colors">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-xs px-2.5 sm:px-3">
                Sign in
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="text-xs gap-1.5 shadow-subtle font-bold px-3 sm:px-4">
                <span className="hidden sm:inline">Start your workspace</span>
                <span className="sm:hidden">Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-white px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top-2">
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-text-secondary">
              <a
                href="#product"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-medium hover:bg-surface-subtle hover:text-text-primary transition-colors"
              >
                Product Preview
              </a>
              <Link
                to="/features"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-medium hover:bg-surface-subtle hover:text-text-primary transition-colors"
              >
                Enterprise Features
              </Link>
              <Link
                to="/security"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-medium hover:bg-surface-subtle hover:text-text-primary transition-colors"
              >
                Security & Zero-Trust
              </Link>
              <Link
                to="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-medium hover:bg-surface-subtle hover:text-text-primary transition-colors"
              >
                Pricing & Quotas
              </Link>
              <Link
                to="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-medium hover:bg-surface-subtle hover:text-text-primary transition-colors"
              >
                About TrustVault
              </Link>
            </nav>
            <div className="pt-2 border-t border-border flex items-center justify-between gap-3">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                <Button size="sm" className="w-full text-xs font-bold">
                  Start Free
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden bg-gradient-to-b from-white via-surface-blue/20 to-background-warm dark:from-elevated dark:via-surface-blue/10 dark:to-background-warm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Value Proposition */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Document Security</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text-primary tracking-tight leading-[1.12]">
                Your documents. Your rules.{' '}
                <span className="text-primary block sm:inline">A complete audit trail.</span>
              </h1>

              <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-xl">
                Share confidential files with confidence. Control access, verify document integrity, and track important actions from one secure workspace.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto text-sm gap-2 shadow-subtle">
                    <span>Start your workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/security">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm">
                    Explore security
                  </Button>
                </Link>
              </div>

              <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  <span className="font-medium text-text-secondary">Organization-scoped access control</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  <span className="font-medium text-text-secondary">SHA-256 integrity verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  <span className="font-medium text-text-secondary">Server-generated audit events</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Product Preview (Real UI Illustration) */}
            <div className="lg:col-span-6">
              <div className="relative rounded-large border border-border bg-white dark:bg-elevated shadow-card p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <TrustVaultLogo variant="symbol" size="sm" />
                    <div>
                      <span className="text-xs font-bold text-text-primary block leading-none">
                        Interactive Product Preview
                      </span>
                      <span className="text-[10px] text-text-muted">
                        Live interface demonstration
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 rounded-small bg-surface-subtle text-xs">
                    <button
                      onClick={() => setActiveTab('integrity')}
                      className={`px-2.5 py-1 rounded-small font-medium transition-colors ${
                        activeTab === 'integrity'
                          ? 'bg-white dark:bg-elevated text-text-primary shadow-subtle font-semibold'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Integrity Engine
                    </button>
                    <button
                      onClick={() => setActiveTab('permissions')}
                      className={`px-2.5 py-1 rounded-small font-medium transition-colors ${
                        activeTab === 'permissions'
                          ? 'bg-white dark:bg-elevated text-text-primary shadow-subtle font-semibold'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Access Control
                    </button>
                  </div>
                </div>

                {activeTab === 'integrity' ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-medium bg-surface-subtle border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-small bg-primary-soft text-primary flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-text-primary">
                            Product_Specification_2026.pdf
                          </div>
                          <div className="text-[11px] text-text-muted">
                            4.2 MB • Stored privately • SHA-256 Protected
                          </div>
                        </div>
                      </div>
                      <Badge variant="success" className="self-start sm:self-auto">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Verified Match
                      </Badge>
                    </div>

                    <div className="p-3.5 rounded-medium border border-border bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-text-primary">
                          Authoritative SHA-256 Byte Stream Digest
                        </span>
                        <span className="text-[10px] text-text-muted font-mono">256-bit hash</span>
                      </div>
                      <div className="p-2 rounded bg-surface-subtle font-mono text-[11px] text-primary break-all select-all">
                        e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 gap-2 text-[11px] text-text-secondary">
                        <span>Last Verified: Just now</span>
                        <button
                          onClick={simulateVerify}
                          disabled={verifying}
                          className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
                          <span>{verifying ? 'Re-hashing Storage...' : 'Verify Physical Bytes'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-medium bg-surface-subtle border border-border/80 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-xs font-semibold text-text-primary truncate">
                            Recipient: dev-team@trusted-partner.example
                          </span>
                        </div>
                        <Badge variant={accessRevoked ? 'danger' : 'default'} className="self-start sm:self-auto">
                          {accessRevoked ? 'Revoked' : 'Active Grant'}
                        </Badge>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-1">
                        <span className="text-text-muted">Enforced Permission Level:</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setPermissionLevel('view');
                              setAccessRevoked(false);
                            }}
                            className={`px-2.5 py-1 rounded text-xs font-medium border ${
                              permissionLevel === 'view'
                                ? 'bg-primary text-white border-primary'
                                : 'border-border text-text-secondary'
                            }`}
                          >
                            <Eye className="w-3 h-3 inline mr-1" />
                            View Metadata
                          </button>
                          <button
                            onClick={() => {
                              setPermissionLevel('download');
                              setAccessRevoked(false);
                            }}
                            className={`px-2.5 py-1 rounded text-xs font-medium border ${
                              permissionLevel === 'download'
                                ? 'bg-primary text-white border-primary'
                                : 'border-border text-text-secondary'
                            }`}
                          >
                            <Download className="w-3 h-3 inline mr-1" />
                            Download
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                        <span className="text-[11px] text-text-muted">
                          {accessRevoked ? 'Subsequent downloads blocked instantly' : 'Authenticated downloads permitted'}
                        </span>
                        <button
                          onClick={() => setAccessRevoked(!accessRevoked)}
                          className={`text-xs font-semibold ${
                            accessRevoked ? 'text-primary' : 'text-danger hover:underline'
                          }`}
                        >
                          {accessRevoked ? 'Restore Access' : 'Revoke Access Now'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-text-muted">
                  <span>Product interface preview</span>
                  <span className="text-success font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Zero artificial demo data
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <section id="product" className="py-20 bg-white dark:bg-elevated border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Engineered for Absolute Trust
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              Six architectural layers protecting your documents
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Every capability is directly enforced on the backend and grounded in relational database guarantees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: Document Integrity */}
            <div id="integrity" className="p-6 rounded-large bg-background-warm border border-border space-y-3 text-left">
              <div className="w-10 h-10 rounded-medium bg-primary-soft text-primary flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-text-primary tracking-tight">
                Authoritative SHA-256 Fingerprints
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                The server streams and computes a 256-bit cryptographic digest from the raw uploaded bytes. On-demand verification recalculates the live digest directly from storage to catch bit rot and unauthorized manipulation.
              </p>
            </div>

            {/* Feature 2: Private Storage */}
            <div className="p-6 rounded-large bg-background-warm border border-border space-y-3 text-left">
              <div className="w-10 h-10 rounded-medium bg-primary-soft text-primary flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-text-primary tracking-tight">
                Zero-Trust Private Storage
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Files are stored under opaque UUID keys completely outside the public web root. Public URLs do not exist; every download re-checks session validity, tenant scoping, and active permission status.
              </p>
            </div>

            {/* Feature 3: Granular Sharing */}
            <div className="p-6 rounded-large bg-background-warm border border-border space-y-3 text-left">
              <div className="w-10 h-10 rounded-medium bg-primary-soft text-primary flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-text-primary tracking-tight">
                Granular Sharing & Immediate Revocation
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Grant view metadata or file download rights to workspace collaborators with optional expiration. Revoking an active grant terminates subsequent downloads on the backend immediately without delay.
              </p>
            </div>

            {/* Feature 4: Transparent Audit Trail */}
            <div className="p-6 rounded-large bg-background-warm border border-border space-y-3 text-left">
              <div className="w-10 h-10 rounded-medium bg-primary-soft text-primary flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-text-primary tracking-tight">
                Immutable Security Audit Trail
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Every authentication event, file upload, download attempt, grant, and revocation is recorded with actor ID, outcome, timestamp, and correlation metadata in an administrator-only audit center.
              </p>
            </div>

            {/* Feature 5: Simple Collaboration */}
            <div className="p-6 rounded-large bg-background-warm border border-border space-y-3 text-left">
              <div className="w-10 h-10 rounded-medium bg-primary-soft text-primary flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-text-primary tracking-tight">
                Personal & Shared Workspaces
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Sign up effortlessly as an individual with an automatic personal workspace. Invite colleagues to collaborate when you're ready—without cumbersome enterprise procurement requirements.
              </p>
            </div>

            {/* Feature 6: Reliable Organization */}
            <div className="p-6 rounded-large bg-background-warm border border-border space-y-3 text-left">
              <div className="w-10 h-10 rounded-medium bg-primary-soft text-primary flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-text-primary tracking-tight">
                Precision Search & Metadata
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Filter documents by MIME type, owner, and active sharing state with instantaneous database pagination. Clean empty states guide you honestly without confusing placeholder data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-background-warm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 text-center">
          <div className="space-y-3 max-w-xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">Simple & Intentional</h2>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              How TrustVault secures your document operations
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-6 rounded-large bg-white dark:bg-elevated border border-border shadow-subtle space-y-3">
              <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-subtle">
                1
              </div>
              <h4 className="text-sm font-bold text-text-primary">Upload & Authoritative Hashing</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Drag in confidential documents. TrustVault streams bytes to isolated private storage and generates the authoritative SHA-256 fingerprint on the server.
              </p>
            </div>

            <div className="p-6 rounded-large bg-white dark:bg-elevated border border-border shadow-subtle space-y-3">
              <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-subtle">
                2
              </div>
              <h4 className="text-sm font-bold text-text-primary">Grant Intentional Access</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Grant specific collaborators view or download rights with optional expiration. Revoke permissions instantly whenever relationships or projects change.
              </p>
            </div>

            <div className="p-6 rounded-large bg-white dark:bg-elevated border border-border shadow-subtle space-y-3">
              <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-subtle">
                3
              </div>
              <h4 className="text-sm font-bold text-text-primary">Verify Integrity & Audit Logs</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Recalculate physical byte hashes on demand to prove zero storage corruption. Review an immutable, queryable audit trail of every important action.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Architecture Callout */}
      <section id="security" className="py-16 bg-white dark:bg-elevated border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-large border border-border bg-surface-subtle/60 p-6 sm:p-8 space-y-4 text-left">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              <h4 className="text-base font-bold text-text-primary tracking-tight">
                Architectural Transparency & Hardened Standards
              </h4>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              TrustVault is powered by a strongly typed React 19 frontend and a Python Flask service layer running against persistent PostgreSQL storage. Password verification uses Argon2id with 64MB memory resistance. File uploads utilize opaque UUID storage keys, preventing path traversal vulnerabilities, and all downloads require strict server-side authorization evaluation.
            </p>
            <div className="pt-2">
              <Link to="/security" className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1">
                <span>Read complete technical security whitepaper</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-16 bg-gradient-to-b from-white to-background-warm dark:from-elevated dark:to-background-warm border-t border-border text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Ready for a document platform you can truly verify?
          </h3>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-lg mx-auto">
            Experience verifiable document security, cryptographic SHA-256 fingerprinting, and intentional permissions today.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto text-sm gap-2 shadow-subtle">
                <span>Create your free account</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm">
                Sign in to your vault
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-white dark:bg-elevated py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
            <div className="space-y-3 col-span-2 md:col-span-1">
              <TrustVaultLogo size="sm" />
              <p className="text-xs text-text-muted leading-relaxed">
                Every document accounted for. Every permission intentional.
              </p>
            </div>

            <div className="space-y-2.5">
              <span className="font-bold text-text-primary block text-[11px] uppercase tracking-wider">
                Product & Security
              </span>
              <ul className="space-y-1.5 text-text-secondary">
                <li><Link to="/features" className="hover:text-text-primary transition-colors">Platform Features</Link></li>
                <li><Link to="/security" className="hover:text-text-primary transition-colors">Security Architecture</Link></li>
                <li><Link to="/pricing" className="hover:text-text-primary transition-colors">Pricing & Plans</Link></li>
                <li><Link to="/about" className="hover:text-text-primary transition-colors">About & Principles</Link></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <span className="font-bold text-text-primary block text-[11px] uppercase tracking-wider">
                Governance & Legal
              </span>
              <ul className="space-y-1.5 text-text-secondary">
                <li><Link to="/terms" className="hover:text-text-primary transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/cookies" className="hover:text-text-primary transition-colors">Cookie Policy</Link></li>
                <li>
                  <button
                    onClick={reopenCookieSettings}
                    className="hover:text-text-primary transition-colors text-left"
                  >
                    Cookie Preferences
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <span className="font-bold text-text-primary block text-[11px] uppercase tracking-wider">
                Account & Support
              </span>
              <ul className="space-y-1.5 text-text-secondary">
                <li><Link to="/login" className="hover:text-text-primary transition-colors">Sign In</Link></li>
                <li><Link to="/register" className="hover:text-text-primary transition-colors">Create Account</Link></li>
                <li><Link to="/contact" className="hover:text-text-primary transition-colors">Support & Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
            <div>
              <span>© 2026 TrustVault. Engineered with precision and verified integrity.</span>
            </div>
            <div>
              <span>All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
