import React from 'react';
import { LegalLayout } from './LegalLayout';
import { Lock, FileCheck, EyeOff, Shield } from 'lucide-react';

export function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="Clear and honest transparency on how your identity, document metadata, file bytes, and audit trails are handled."
      effectiveDate="October 24, 2026"
      version="1.2"
    >
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          1. Information We Collect
        </h2>
        <p>
          TrustVault is built on principles of minimal data collection. We collect only what is strictly required to provide secure document storage, identity verification, and authentic audit trails:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 rounded-medium bg-white dark:bg-elevated border border-border">
            <h4 className="font-semibold text-text-primary mb-1">Account & Identity Data</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Your full name, normalized email address, Argon2id cryptographically salted password hash, and timestamps of your recent account activity.
            </p>
          </div>
          <div className="p-3.5 rounded-medium bg-white dark:bg-elevated border border-border">
            <h4 className="font-semibold text-text-primary mb-1">Document Metadata & Hashes</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Original filenames, file size in bytes, MIME content types, and server-calculated SHA-256 cryptographic digests.
            </p>
          </div>
          <div className="p-3.5 rounded-medium bg-white dark:bg-elevated border border-border">
            <h4 className="font-semibold text-text-primary mb-1">Encapsulated File Bytes</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              The binary contents of documents you upload, stored in isolated private storage outside the web root under randomized UUID keys.
            </p>
          </div>
          <div className="p-3.5 rounded-medium bg-white dark:bg-elevated border border-border">
            <h4 className="font-semibold text-text-primary mb-1">Audit & Security Events</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Immutable logs of authentication outcomes, document uploads, downloads, permission grants, revocations, and integrity checks.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          2. How We Use Your Data
        </h2>
        <p>We process your data exclusively for the following operational purposes:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-text-secondary">
          <li><strong>Authentication & Authorization:</strong> Verifying your identity and enforcing role-based permissions before permitting document access.</li>
          <li><strong>Integrity Assurance:</strong> Computing and validating SHA-256 digests against storage bytes to alert you of tampering or storage degradation.</li>
          <li><strong>Access Governance:</strong> Enforcing sharing rules, expiration deadlines, and immediate revocation for protected files.</li>
          <li><strong>Audit Trail Integrity:</strong> Maintaining an accurate log of security events for workspace oversight and compliance review.</li>
        </ul>
        <p className="font-semibold text-text-primary">
          We do NOT sell, rent, monetize, or train machine learning models on your private documents.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          3. Storage Architecture and Isolation
        </h2>
        <p>
          All uploaded files are written to private, access-controlled storage (isolated local storage directories or private S3 buckets). Files are never given public URLs. Every download request must pass authenticated server-side evaluation of:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-text-secondary">
          <li>Active user session validity</li>
          <li>Workspace tenancy membership</li>
          <li>Direct document ownership OR an unexpired, unrevoked permission grant</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          4. Data Retention and Account Deletion
        </h2>
        <p>
          You have full control over your data lifecycle:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-text-secondary">
          <li><strong>Document Deletion:</strong> Removing a document marks it as deleted in the database and purges or decouples the physical file object from active storage.</li>
          <li><strong>Account Deletion:</strong> You may permanently delete your account directly through Settings. All personal profile records, memberships, and unshared personal files are expunged from the primary relational database.</li>
          <li><strong>Audit Log Retention:</strong> Anonymized security audit logs recording historical access may be retained for a documented period solely to preserve workspace audit integrity for other team members.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          5. Your Privacy Rights
        </h2>
        <p>
          Regardless of your physical location, TrustVault guarantees your right to:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-text-secondary">
          <li>Inspect and export all metadata associated with your account and documents.</li>
          <li>Rectify outdated or inaccurate profile details (e.g., full name, theme preference).</li>
          <li>Revoke document access grants granted to other users at any moment with immediate effect.</li>
          <li>Request complete deletion of your account and private files.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          6. Contacting the Privacy Officer
        </h2>
        <p>
          If you have questions, data subject requests, or privacy compliance concerns, please contact us through our <a href="/contact" className="text-primary hover:underline font-medium">Support & Inquiries Page</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
