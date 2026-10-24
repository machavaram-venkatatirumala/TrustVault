import React from 'react';
import { LegalLayout } from './LegalLayout';
import { Shield, KeyRound, FileCheck, Database, Lock, CheckCircle2, Cpu } from 'lucide-react';

export function SecurityPage() {
  return (
    <LegalLayout
      title="Security Architecture & Controls"
      subtitle="A transparent, technical breakdown of TrustVault's zero-trust storage engine, cryptographic hashing, and authorization guards."
      effectiveDate="October 24, 2026"
      version="1.2"
    >
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          1. Security Guarantees & Architectural Philosophy
        </h2>
        <p>
          TrustVault is built with a zero-trust model: <strong>no request is trusted based on network proximity or client-side claims.</strong> Every file interaction must satisfy active authentication, tenant boundary validation, and role-based permissions at the backend controller level.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          2. Core Security Controls
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-medium bg-white dark:bg-elevated border border-border space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <KeyRound className="w-4 h-4" />
              <span>Argon2id Password Hashing</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Passwords are salted and hashed utilizing the state-of-the-art Argon2id algorithm (the winner of the Password Hashing Competition). Configured with 64MB memory cost, 3 iterations, and 4 parallel threads to provide extreme resistance against GPU- and ASIC-assisted brute-force attacks.
            </p>
          </div>

          <div className="p-4 rounded-medium bg-white dark:bg-elevated border border-border space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <FileCheck className="w-4 h-4" />
              <span>Streaming SHA-256 Verification</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Authoritative file digests are computed on the server directly from the raw byte stream during upload. On-demand verification pulls the stored object bytes from private storage and re-computes the hash in real-time, executing timing-safe constant comparisons to catch storage corruption or silent bit flips.
            </p>
          </div>

          <div className="p-4 rounded-medium bg-white dark:bg-elevated border border-border space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Lock className="w-4 h-4" />
              <span>Private Storage Isolation</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Documents are never written to the public web root. Instead, they reside in private filesystem directories or secure private object buckets under randomized UUID storage keys decoupled from user-supplied filenames, completely eliminating path traversal vulnerabilities.
            </p>
          </div>

          <div className="p-4 rounded-medium bg-white dark:bg-elevated border border-border space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Database className="w-4 h-4" />
              <span>Immutable Audit Trail</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Every significant event—including uploads, downloads, permission grants, revocations, and verification checks—generates an append-only audit event recording the actor, action, resource, outcome, correlation ID, and sanitized metadata for total operational transparency.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          3. Immediate Permission Revocation
        </h2>
        <p>
          Unlike architectures relying solely on unrevocable signed URLs with prolonged expiration windows, TrustVault routes download requests through authenticated backend download controllers. When an administrator or document owner revokes access:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-text-secondary">
          <li>The database immediately flags the permission grant as revoked with a timestamp.</li>
          <li>Subsequent download requests from the revoked user fail instantly with HTTP 403 Forbidden.</li>
          <li>A security audit log event is recorded capturing the unauthorized attempt.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          4. Session Management & Rate Limiting
        </h2>
        <p>
          Sessions are established with secure HTTP-only cookies protected against client-side script interception (XSS). Authentication routes enforce server-side rate limits (10 attempts per minute) to deter credential stuffing and brute-force attacks.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
          5. Vulnerability Reporting
        </h2>
        <p>
          We welcome responsible disclosure from security researchers. If you identify a potential vulnerability, please report it immediately to our security team via the <a href="/contact" className="text-primary hover:underline font-medium">Security Contact Portal</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
