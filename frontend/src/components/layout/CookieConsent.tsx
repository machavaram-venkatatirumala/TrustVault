import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ShieldCheck, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';

const COOKIE_CONSENT_KEY = 'trustvault_cookie_consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [preferencesEnabled, setPreferencesEnabled] = useState(true);

  useEffect(() => {
    // Check if user has already made a selection
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
      // Delay display slightly for calm entrance
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleReopen = () => {
      setModalOpen(true);
    };
    window.addEventListener('open-cookie-preferences', handleReopen);
    return () => window.removeEventListener('open-cookie-preferences', handleReopen);
  }, []);

  const saveConsent = (allowPreferences: boolean) => {
    const consent = {
      essential: true,
      preferences: allowPreferences,
      analytics: false,
      timestamp: new Date().toISOString(),
      version: '1.2',
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    setVisible(false);
    setModalOpen(false);
  };

  if (!visible && !modalOpen) return null;

  return (
    <>
      {/* Bottom Floating Banner */}
      {visible && !modalOpen && (
        <aside
          role="region"
          aria-label="Cookie preferences notification"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-4 rounded-medium bg-white dark:bg-elevated border border-border shadow-card animate-in fade-in slide-in-from-bottom-3 duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-small bg-primary-soft text-primary shrink-0 mt-0.5">
              <Cookie className="w-4 h-4" />
            </div>
            <div className="space-y-1.5 flex-1 text-xs">
              <div className="font-semibold text-text-primary flex items-center justify-between">
                <span>Cookie Privacy Preferences</span>
                <button
                  onClick={() => setVisible(false)}
                  className="p-1 text-text-muted hover:text-text-primary"
                  aria-label="Dismiss banner"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-text-secondary leading-relaxed">
                TrustVault uses essential session cookies for secure authentication and local storage for interface theme preferences. We do not use third-party advertising trackers. Read our{' '}
                <Link to="/cookies" className="text-primary hover:underline font-medium">
                  Cookie Policy
                </Link>
                .
              </p>
              <div className="flex items-center gap-2 pt-2">
                <Button size="sm" onClick={() => saveConsent(true)} className="text-xs h-7 px-3">
                  Accept All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => saveConsent(false)}
                  className="text-xs h-7 px-3"
                >
                  Reject Optional
                </Button>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="text-[11px] text-primary hover:underline font-medium ml-1"
                >
                  Customize
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Preferences Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="w-4 h-4 text-primary" />
              <span>Cookie & Storage Preferences</span>
            </DialogTitle>
            <DialogDescription>
              Select which categories of cookies and local storage items you permit TrustVault to utilize.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4 text-xs">
            {/* Category 1: Strictly Necessary */}
            <div className="p-3.5 rounded-medium bg-surface-subtle border border-border flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text-primary">Essential System Cookies</span>
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-semibold">
                    Always Active
                  </span>
                </div>
                <p className="text-text-secondary leading-relaxed text-[11px]">
                  Required to authenticate user sessions, maintain CSRF security, and route protected API operations. Cannot be deactivated.
                </p>
              </div>
              <input
                type="checkbox"
                checked={true}
                disabled
                className="mt-1 w-4 h-4 text-primary rounded border-border opacity-70 cursor-not-allowed"
              />
            </div>

            {/* Category 2: Interface Preferences */}
            <div className="p-3.5 rounded-medium bg-white dark:bg-elevated border border-border flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text-primary">Interface Theme Preferences</span>
                </div>
                <p className="text-text-secondary leading-relaxed text-[11px]">
                  Permits saving your chosen visual theme (Light, Dark, or System) in local storage to prevent screen flicker upon page load.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferencesEnabled}
                onChange={(e) => setPreferencesEnabled(e.target.checked)}
                className="mt-1 w-4 h-4 text-primary rounded border-border cursor-pointer focus:ring-primary"
              />
            </div>

            {/* Category 3: Analytics & Advertising */}
            <div className="p-3.5 rounded-medium bg-surface-subtle border border-border flex items-start justify-between gap-4 opacity-75">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text-primary">Third-Party Tracking & Advertising</span>
                  <span className="px-1.5 py-0.5 rounded bg-text-muted/10 text-text-muted text-[10px] font-medium">
                    Not Used
                  </span>
                </div>
                <p className="text-text-secondary leading-relaxed text-[11px]">
                  TrustVault employs zero external ad trackers, marketing pixels, or surveillance frameworks.
                </p>
              </div>
              <input
                type="checkbox"
                checked={false}
                disabled
                className="mt-1 w-4 h-4 rounded border-border cursor-not-allowed opacity-40"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => saveConsent(false)}>
              Reject Optional
            </Button>
            <Button size="sm" onClick={() => saveConsent(preferencesEnabled)}>
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
