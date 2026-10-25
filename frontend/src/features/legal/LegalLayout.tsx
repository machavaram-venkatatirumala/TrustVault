import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TrustVaultLogo } from '../../components/brand/TrustVaultLogo';
import { Button } from '../../components/ui/button';

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  effectiveDate: string;
  version?: string;
  children: React.ReactNode;
}

export function LegalLayout({
  title,
  subtitle,
  effectiveDate,
  version = '1.2',
  children,
}: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background-warm flex flex-col font-sans selection:bg-primary-soft selection:text-primary">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="inline-flex items-center">
              <TrustVaultLogo size="sm" />
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-xs gap-1.5 px-2 sm:px-3">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Home</span>
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="text-xs px-2.5 sm:px-3">
                <span className="hidden sm:inline">Create Account</span>
                <span className="sm:hidden">Sign Up</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12">
        {/* Header Block */}
        <div className="mb-10 pb-6 border-b border-border">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <span>TrustVault Legal & Governance</span>
            <span>•</span>
            <span>Version {version}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed">
            {subtitle}
          </p>
          <div className="mt-4 text-xs text-text-muted">
            Effective Date: <span className="font-medium text-text-primary">{effectiveDate}</span>
          </div>
        </div>

        {/* Document Body */}
        <div className="prose max-w-none text-xs sm:text-sm text-text-secondary leading-relaxed space-y-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-white dark:bg-elevated py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <TrustVaultLogo variant="symbol" size="sm" />
            <span className="font-semibold text-text-primary">TrustVault</span>
            <span>— Transparent document security.</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/terms" className="hover:text-text-primary transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-text-primary transition-colors">Privacy Policy</Link>
            <Link to="/cookies" className="hover:text-text-primary transition-colors">Cookie Policy</Link>
            <Link to="/security" className="hover:text-text-primary transition-colors">Security Architecture</Link>
            <Link to="/contact" className="hover:text-text-primary transition-colors">Support & Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
