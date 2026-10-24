import React from 'react';
import { LegalLayout } from './LegalLayout';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="Standard operational rules, responsibilities, and acceptable use policies governing your TrustVault account."
      effectiveDate="October 24, 2026"
      version="1.2"
    >
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          1. Acceptance of Terms
        </h2>
        <p>
          By creating an account, accessing, or utilizing the TrustVault software platform (“Service”), you agree to be bound by these Terms of Service (“Terms”). If you are entering into these Terms on behalf of an organization, team, or other legal entity, you represent and warrant that you possess the legal authority to bind that entity. If you do not agree to all provisions within these Terms, you must not access or use the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          2. Eligibility and Account Responsibilities
        </h2>
        <p>
          You must be at least 18 years of age or the legal age of majority in your jurisdiction to establish an account. When registering for TrustVault, you agree to:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-text-secondary">
          <li>Provide accurate, current, and verifiable registration details (full name and email address).</li>
          <li>Promptly maintain and update your account details to ensure continuous accuracy.</li>
          <li>Maintain the confidentiality of your password, authentication sessions, and recovery credentials.</li>
          <li>Accept responsibility for all actions and document operations executed under your account credentials.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          3. Ownership of Uploaded Documents and Content
        </h2>
        <p>
          You retain 100% full ownership, intellectual property rights, and title to all documents, files, and metadata uploaded to your TrustVault workspace. TrustVault claims no ownership interest over your files. By uploading content, you grant TrustVault only the limited technical license necessary to store, calculate cryptographic SHA-256 digests, stream downloads to authorized recipients, and persist metadata as directed by your explicit actions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          4. User Responsibility for Sharing and Access Grants
        </h2>
        <p>
          TrustVault provides fine-grained, server-enforced access controls (view vs. download permissions and revocation). You acknowledge and agree that:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-text-secondary">
          <li>You are solely responsible for verifying the identity of recipients before granting document access.</li>
          <li>While TrustVault strictly enforces server-side permission checks for all requests within the platform, software permissions cannot prevent a recipient from capturing screenshots, photographing screens, or redistributing files they have downloaded to external devices.</li>
          <li>Revocation of an access grant terminates future downloads within TrustVault immediately, but cannot physically delete offline copies previously downloaded by an authorized user.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          5. Cryptographic SHA-256 Verification Scope
        </h2>
        <div className="p-4 rounded-medium bg-surface-subtle border border-border flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-text-primary">Technical Integrity Scope</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              SHA-256 integrity verification detects whether the physical byte stream of a stored file has diverged from the authoritative reference digest calculated during initial upload. It does not certify the legal truthfulness of the document's contents, nor does it guarantee authorship if the original file was manipulated prior to upload.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          6. Acceptable Use and Prohibited Activities
        </h2>
        <p>You agree that you will NOT use the Service to:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-text-secondary">
          <li>Upload malicious code, viruses, trojans, ransomware, or corrupted byte streams intended to disrupt server infrastructure.</li>
          <li>Attempt to circumvent tenant isolation, access other users' private storage keys, or exploit vulnerabilities.</li>
          <li>Store or distribute illegal content, unauthorized proprietary data, or content that infringes upon third-party intellectual property rights.</li>
          <li>Subject the API or authentication endpoints to automated denial-of-service or brute-force attacks in violation of rate limits.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          7. Storage, Retention, and Deletion Behavior
        </h2>
        <p>
          When you delete a document from your repository, the database record is updated to a deleted state, access permissions are severed, and the corresponding private storage object is queued for deletion or immediately wiped from the private storage layer. In the event of account deletion, all personal data and associated workspace records are removed according to our documented data retention schedule.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          8. Limitation of Liability and Disclaimers
        </h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED UNDER APPLICABLE LAW, THE SERVICE IS PROVIDED ON AN “AS IS” AND “AS AVAILABLE” BASIS WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TRUSTVAULT DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR ENTIRELY IMMUNE TO INFRASTRUCTURE HARDWARE FAILURES. IN NO EVENT SHALL TRUSTVAULT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOSS OF DATA, REVENUE, OR BUSINESS OPPORTUNITY.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          9. Modifications to the Service and Terms
        </h2>
        <p>
          We reserve the right to modify these Terms to reflect technical enhancements, security requirements, or statutory changes. When meaningful updates occur, we will increment the document version and revise the Effective Date. Continued use of TrustVault following notice constitutes acceptance of the amended Terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          10. Contact Information
        </h2>
        <p>
          For questions, legal notices, or compliance inquiries regarding these Terms of Service, please reach out through our official <a href="/contact" className="text-primary hover:underline font-medium">Support & Contact Portal</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
