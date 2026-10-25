import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Button } from '../ui/button';
import { TrustVaultLogo } from '../brand/TrustVaultLogo';

interface MarketingHeaderProps {
  activePage?: 'home' | 'features' | 'security' | 'pricing' | 'about';
}

export function MarketingHeader({ activePage }: MarketingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
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
          <Link to="/" className="inline-flex items-center" title="TrustVault Enterprise Home">
            <TrustVaultLogo size="md" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-text-secondary">
          <Link
            to="/"
            className={`transition-colors hover:text-text-primary ${
              activePage === 'home' ? 'text-primary font-bold' : ''
            }`}
          >
            Home
          </Link>
          <Link
            to="/features"
            className={`transition-colors hover:text-text-primary ${
              activePage === 'features' ? 'text-primary font-bold' : ''
            }`}
          >
            Features
          </Link>
          <Link
            to="/security"
            className={`transition-colors hover:text-text-primary ${
              activePage === 'security' ? 'text-primary font-bold' : ''
            }`}
          >
            Security
          </Link>
          <Link
            to="/pricing"
            className={`transition-colors hover:text-text-primary ${
              activePage === 'pricing' ? 'text-primary font-bold' : ''
            }`}
          >
            Pricing
          </Link>
          <Link
            to="/about"
            className={`transition-colors hover:text-text-primary ${
              activePage === 'about' ? 'text-primary font-bold' : ''
            }`}
          >
            About
          </Link>
        </nav>

        {/* CTA Buttons */}
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
          <nav className="flex flex-col space-y-1 text-sm font-semibold text-text-secondary">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-medium hover:bg-surface-subtle hover:text-text-primary transition-colors ${
                activePage === 'home' ? 'bg-primary-soft text-primary font-bold' : ''
              }`}
            >
              Home & Live Demo
            </Link>
            <Link
              to="/features"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-medium hover:bg-surface-subtle hover:text-text-primary transition-colors ${
                activePage === 'features' ? 'bg-primary-soft text-primary font-bold' : ''
              }`}
            >
              Enterprise Features
            </Link>
            <Link
              to="/security"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-medium hover:bg-surface-subtle hover:text-text-primary transition-colors ${
                activePage === 'security' ? 'bg-primary-soft text-primary font-bold' : ''
              }`}
            >
              Security Architecture
            </Link>
            <Link
              to="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-medium hover:bg-surface-subtle hover:text-text-primary transition-colors ${
                activePage === 'pricing' ? 'bg-primary-soft text-primary font-bold' : ''
              }`}
            >
              Pricing & Quotas
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-medium hover:bg-surface-subtle hover:text-text-primary transition-colors ${
                activePage === 'about' ? 'bg-primary-soft text-primary font-bold' : ''
              }`}
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
  );
}
