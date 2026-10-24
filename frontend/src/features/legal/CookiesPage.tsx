import React from 'react';
import { LegalLayout } from './LegalLayout';
import { Cookie, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';

export function CookiesPage() {
  const reopenCookieSettings = () => {
    window.dispatchEvent(new CustomEvent('open-cookie-preferences'));
  };

  return (
    <LegalLayout
      title="Cookie Policy"
      subtitle="Comprehensive breakdown of cookies, local storage items, and privacy preferences utilized by TrustVault."
      effectiveDate="October 24, 2026"
      version="1.2"
    >
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          1. What Are Cookies and Local Storage?
        </h2>
        <p>
          Cookies are small data files placed on your browser by a website. Local storage is browser-based storage used to preserve interface preferences between page reloads. TrustVault uses cookies strictly for critical system operations and user experience customization.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          2. Essential Authentication and Security Cookies
        </h2>
        <p>
          These cookies are strictly required for the core security and functioning of the platform. They cannot be disabled without breaking application functionality:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border border-border text-xs rounded-medium overflow-hidden">
            <thead className="bg-surface-subtle font-semibold text-text-primary border-b border-border">
              <tr>
                <th className="p-3">Cookie Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Security Attributes</th>
                <th className="p-3">Purpose & Lifespan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="bg-white dark:bg-elevated">
                <td className="p-3 font-mono font-medium text-primary">trustvault_session</td>
                <td className="p-3">First-party Session</td>
                <td className="p-3">HttpOnly, SameSite=Lax</td>
                <td className="p-3 text-text-secondary">Stores encrypted session token for authentication. Expires upon logout or 24h inactivity.</td>
              </tr>
              <tr className="bg-white dark:bg-elevated">
                <td className="p-3 font-mono font-medium text-primary">csrf_token</td>
                <td className="p-3">Security Token</td>
                <td className="p-3">SameSite=Strict</td>
                <td className="p-3 text-text-secondary">Protects state-changing requests against Cross-Site Request Forgery (CSRF).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          3. Local Interface Preferences
        </h2>
        <p>
          We use browser local storage exclusively to preserve your chosen interface settings without requiring server-side tracking:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border border-border text-xs rounded-medium overflow-hidden">
            <thead className="bg-surface-subtle font-semibold text-text-primary border-b border-border">
              <tr>
                <th className="p-3">Storage Key</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Values</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="bg-white">
                <td className="p-3 font-mono font-medium text-primary">trustvault_cookie_consent</td>
                <td className="p-3 text-text-secondary">Records your cookie preference choices and timestamp.</td>
                <td className="p-3 font-mono text-text-muted">JSON with consent status</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          4. Zero Third-Party Advertising and Tracking
        </h2>
        <div className="p-4 rounded-medium bg-surface-subtle border border-border space-y-2">
          <div className="flex items-center gap-2 text-success font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Honest Privacy Guarantee</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            TrustVault contains <strong>ZERO</strong> third-party advertising cookies, cross-site behavioral trackers, retargeting pixels, or surveillance scripts. We do not partner with ad networks or data brokers.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          5. Managing Your Preferences
        </h2>
        <p>
          You can modify your consent settings at any time using our interactive preference dialog or clear cookies via your browser settings:
        </p>
        <div className="pt-1">
          <button
            onClick={reopenCookieSettings}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-small bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors shadow-subtle"
          >
            <Cookie className="w-4 h-4" />
            <span>Open Cookie Preferences Dialog</span>
          </button>
        </div>
      </section>
    </LegalLayout>
  );
}
