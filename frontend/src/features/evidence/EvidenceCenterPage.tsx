import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Download,
  Plus,
  ShieldCheck,
  Hash,
  Clock,
  User,
  CheckCircle2,
  Calendar,
  Layers,
  FileCode,
  Copy,
  Check,
  RefreshCw,
  Info,
} from 'lucide-react';
import { api } from '../../lib/api';
import { EvidencePackage } from '../../types';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

export function EvidenceCenterPage() {
  const { user, isAdmin } = useAuth();
  const [packages, setPackages] = useState<EvidencePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [packageName, setPackageName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'audit_trail',
    'permissions',
    'policies',
    'approvals',
    'integrity',
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const categoriesList = [
    { id: 'audit_trail', label: 'Append-Only Audit Trail Records', desc: 'Tamper-evident system activity and state transition log' },
    { id: 'permissions', label: 'Sharing Grants & Access Histories', desc: 'Complete direct and inherited document access grants' },
    { id: 'policies', label: 'Security Policy Configurations & Logs', desc: 'Active guardrails, execution decisions, and policy versions' },
    { id: 'approvals', label: 'Approval Workflows & Version Hashes', desc: 'Reviewer decisions bound to immutable version hashes' },
    { id: 'integrity', label: 'Cryptographic Storage Verification', desc: 'SHA-256 document content verification results' },
  ];

  const loadPackages = async () => {
    setIsLoading(true);
    try {
      const res = await api.evidence.list();
      setPackages(res.packages || []);
    } catch (err) {
      console.error('Failed to load evidence packages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const handleToggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageName.trim() || selectedCategories.length === 0) return;

    setIsGenerating(true);
    try {
      await api.evidence.generate({
        name: packageName.trim(),
        categories: selectedCategories,
        date_from: dateFrom ? `${dateFrom}T00:00:00Z` : undefined,
        date_to: dateTo ? `${dateTo}T23:59:59Z` : undefined,
      });
      setGenerateModalOpen(false);
      setPackageName('');
      await loadPackages();
    } catch (err: any) {
      alert(err.message || 'Failed to generate evidence package.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPackage = async (pkg: EvidencePackage) => {
    try {
      const data = await api.evidence.download(pkg.id);
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TrustVault_Evidence_${pkg.id}_${pkg.name.replace(/\s+/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Download failed.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-medium bg-primary/10 text-primary">
              <FileCheck2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-text-primary tracking-tight">
              Compliance Evidence Center
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Export verifiable compliance evidence bundles containing audit events, permission histories, approval hashes, and deterministic SHA-256 manifests.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setGenerateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-medium text-xs font-semibold hover:bg-primary-hover transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Generate Evidence Package
          </button>
        )}
      </div>

      {/* Integrity Disclosure Alert */}
      <div className="p-4 bg-surface-subtle border border-border rounded-large text-xs space-y-2">
        <div className="flex items-center gap-2 text-text-primary font-bold">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Cryptographic Manifest & Provenance Transparency</span>
        </div>
        <p className="text-text-secondary leading-relaxed">
          Each evidence export bundle contains an immutable master manifest with individual SHA-256 hashes of every included artifact. The manifest deterministically certifies internal state and record provenance at the exact moment of export. It contains zero simulated records or mock metrics.
        </p>
      </div>

      {/* Packages List */}
      <div className="bg-white border border-border rounded-large shadow-xs overflow-hidden">
        <div className="border-b border-border px-5 py-3.5 flex items-center justify-between bg-surface-subtle/50">
          <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Generated Evidence Packages ({packages.length})
          </h2>
          <button onClick={loadPackages} className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1">
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
            <p className="text-xs text-text-secondary">Loading evidence packages...</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="py-16 text-center text-text-muted">
            <FileCheck2 className="w-8 h-8 mx-auto mb-2 text-text-muted" />
            <p className="text-sm font-semibold text-text-primary">No evidence packages generated yet</p>
            <p className="text-xs text-text-secondary mt-1">
              Click &quot;Generate Evidence Package&quot; to produce an audit export bundle.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {packages.map((pkg) => (
              <div key={pkg.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-subtle/30 transition-colors">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    <FileCode className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-text-primary">{pkg.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald/10 text-emerald border border-emerald/20 uppercase tracking-wider">
                      {pkg.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-text-muted pt-0.5">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-text-muted" />
                      {pkg.requested_by_name} ({pkg.requested_by_email})
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-text-muted" />
                      {new Date(pkg.created_at).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-text-muted" />
                      {pkg.total_records} Verified Records
                    </span>
                  </div>

                  {/* Manifest Hash */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] font-semibold text-text-muted">Manifest SHA-256:</span>
                    <span className="font-mono text-[10px] bg-surface-subtle border border-border px-2 py-0.5 rounded text-text-secondary">
                      {pkg.sha256_manifest_hash}
                    </span>
                    <button
                      onClick={() => copyToClipboard(pkg.sha256_manifest_hash)}
                      className="p-1 text-text-muted hover:text-text-primary transition-colors"
                      title="Copy SHA-256 Hash"
                    >
                      {copiedHash === pkg.sha256_manifest_hash ? (
                        <Check className="w-3.5 h-3.5 text-emerald" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadPackage(pkg)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-medium text-xs font-semibold hover:bg-primary-hover transition-all shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download JSON Bundle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Modal */}
      {generateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-border rounded-large shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="border-b border-border px-5 py-4 flex items-center justify-between bg-surface-subtle">
              <h3 className="text-sm font-bold text-text-primary">Generate Verifiable Evidence Package</h3>
              <button
                onClick={() => setGenerateModalOpen(false)}
                className="text-text-muted hover:text-text-primary text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleGenerate} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-text-primary block mb-1">Package Name / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Security & Compliance Audit Evidence"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-border rounded-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-text-primary block mb-1">Date From (Optional)</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-border rounded-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-semibold text-text-primary block mb-1">Date To (Optional)</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-border rounded-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-text-primary block mb-2">Included Evidence Categories</label>
                <div className="space-y-2">
                  {categoriesList.map((cat) => {
                    const isChecked = selectedCategories.includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        className={cn(
                          'flex items-start gap-2.5 p-2.5 rounded-medium border cursor-pointer transition-all',
                          isChecked ? 'bg-primary/5 border-primary/30' : 'bg-surface-subtle border-border'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleCategory(cat.id)}
                          className="mt-0.5 rounded text-primary focus:ring-primary"
                        />
                        <div>
                          <div className="font-bold text-text-primary text-[11px]">{cat.label}</div>
                          <div className="text-[10px] text-text-secondary">{cat.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setGenerateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-medium border border-border text-text-secondary hover:bg-surface-subtle text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || selectedCategories.length === 0}
                  className="px-4 py-1.5 rounded-medium bg-primary text-white hover:bg-primary-hover text-xs font-semibold shadow-xs"
                >
                  {isGenerating ? 'Computing Manifest...' : 'Generate Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
