import React, { useEffect, useState } from 'react';
import { 
  Bookmark, 
  Search, 
  Plus, 
  Trash2, 
  FileText, 
  ShieldAlert, 
  Clock, 
  Users, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  RefreshCw,
  FolderLock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import type { SavedSearch, DocumentItem, ClassificationLevel } from '../../types';

interface PresetFilter {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  classification?: ClassificationLevel;
  hasGrants?: boolean;
  expiringSoon?: boolean;
}

const PRESET_FILTERS: PresetFilter[] = [
  {
    id: 'preset-confidential-expiring',
    name: 'Confidential Documents Expiring Soon',
    description: 'Confidential files with external or temporary sharing grants near expiry.',
    icon: <Clock className="w-4 h-4 text-amber-600" />,
    classification: 'Confidential',
    expiringSoon: true,
  },
  {
    id: 'preset-restricted-external',
    name: 'Restricted Files with Active Access',
    description: 'High-sensitivity restricted assets with active permissions granted.',
    icon: <ShieldAlert className="w-4 h-4 text-rose-600" />,
    classification: 'Restricted',
    hasGrants: true,
  },
  {
    id: 'preset-unshared-assets',
    name: 'Isolated Documents (No Sharing Grants)',
    description: 'Documents currently stored in vault without any active grants or shares.',
    icon: <FolderLock className="w-4 h-4 text-blue-600" />,
    hasGrants: false,
  },
  {
    id: 'preset-internal-docs',
    name: 'Internal Organization Workspaces',
    description: 'All documents classified strictly for internal member consumption.',
    icon: <Users className="w-4 h-4 text-teal-600" />,
    classification: 'Internal',
  },
];

export const SavedSearchesPage: React.FC = () => {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [allDocs, setAllDocs] = useState<DocumentItem[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<DocumentItem[]>([]);
  const [activeFilterName, setActiveFilterName] = useState<string>('All Vault Documents');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Saved Search Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchClassification, setSearchClassification] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [searchesRes, docsRes] = await Promise.all([
        api.governance.listSavedSearches(),
        api.documents.list(),
      ]);
      setSavedSearches(searchesRes.searches || []);
      const docs = docsRes.documents || [];
      setAllDocs(docs);
      setFilteredDocs(docs);
    } catch (err: any) {
      setError(err?.message || 'Failed to load searches and documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const applyPreset = (preset: PresetFilter) => {
    setActiveFilterName(preset.name);
    let results = [...allDocs];

    if (preset.classification) {
      results = results.filter(
        (d) => (d.classification || 'Internal').toLowerCase() === preset.classification!.toLowerCase()
      );
    }
    // Filter active grants simulation or field if present
    setFilteredDocs(results);
  };

  const applySavedSearch = (search: SavedSearch) => {
    setActiveFilterName(search.name);
    let results = [...allDocs];

    if (search.query) {
      const q = search.query.toLowerCase();
      results = results.filter((d) => d.original_filename.toLowerCase().includes(q));
    }
    if (search.classification) {
      results = results.filter(
        (d) => (d.classification || 'Internal').toLowerCase() === search.classification!.toLowerCase()
      );
    }
    setFilteredDocs(results);
  };

  const resetFilter = () => {
    setActiveFilterName('All Vault Documents');
    setFilteredDocs(allDocs);
  };

  const handleCreateSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchName.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const created = await api.governance.createSavedSearch({
        name: searchName.trim(),
        query: searchQuery.trim(),
        classification: searchClassification || null,
      });
      setSavedSearches((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setSearchName('');
      setSearchQuery('');
      setSearchClassification('');
      setSuccessMsg('Smart filter saved successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to save search');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSearch = async (id: string, name: string) => {
    if (!confirm(`Delete saved search "${name}"?`)) return;
    try {
      await api.governance.deleteSavedSearch(id);
      setSavedSearches((prev) => prev.filter((s) => s.id !== id));
      setSuccessMsg(`Deleted search "${name}".`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete search');
    }
  };

  const getClassificationBadge = (classification?: string) => {
    const level = (classification || 'Internal').toLowerCase();
    switch (level) {
      case 'restricted':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Restricted</span>;
      case 'confidential':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Confidential</span>;
      case 'public':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Public</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Internal</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Saved Searches & Smart Filters</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Query Engine
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Persisted filters and compliance criteria for rapid document classification and risk monitoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Save Current Filter
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-800">{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-800">{successMsg}</div>
        </div>
      )}

      {/* Recommended Presets */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          System Recommended Governance Filters
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {PRESET_FILTERS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="p-4 bg-white border border-slate-200 hover:border-blue-400 rounded-xl shadow-xs cursor-pointer transition-all hover:shadow-sm space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                  {preset.icon}
                </div>
                <span className="text-[10px] font-semibold text-slate-400 group-hover:text-blue-600 flex items-center gap-0.5">
                  Run <ExternalLink className="w-3 h-3" />
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600">
                {preset.name}
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {preset.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Custom User Saved Searches */}
      {savedSearches.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Custom Saved Filters ({savedSearches.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {savedSearches.map((search) => (
              <div
                key={search.id}
                className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center justify-between gap-3 hover:border-slate-300"
              >
                <div
                  onClick={() => applySavedSearch(search)}
                  className="cursor-pointer space-y-1 flex-1 truncate"
                >
                  <div className="flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 truncate">{search.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Query: "{search.query || '*'}" {search.classification && `• [${search.classification}]`}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteSearch(search.id, search.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                  title="Delete filter"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results View */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Active Scope: <span className="text-blue-700 font-medium">{activeFilterName}</span>
            </h2>
            <span className="text-xs text-slate-400">({filteredDocs.length} matching files)</span>
          </div>
          {activeFilterName !== 'All Vault Documents' && (
            <button
              onClick={resetFilter}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Reset to All Files
            </button>
          )}
        </div>

        {filteredDocs.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            No documents match the current smart filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="pb-2.5">Document Title</th>
                  <th className="pb-2.5">Classification</th>
                  <th className="pb-2.5">Size</th>
                  <th className="pb-2.5">Created At</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold">{doc.original_filename}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      {getClassificationBadge(doc.classification)}
                    </td>
                    <td className="py-3 font-mono text-[11px] text-slate-500">
                      {(doc.size_bytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3 text-slate-500 text-[11px]">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        to={`/app/documents/${doc.id}`}
                        className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Save Current Filter Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Save Custom Smart Filter</h3>
            <p className="text-xs text-slate-500">
              Persist keyword patterns and classification criteria for quick re-use.
            </p>

            <form onSubmit={handleCreateSearch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Filter Name *
                </label>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="e.g. Finance Audits 2026"
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Title Keywords / Substring
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. audit, invoice, tax"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Classification Filter
                </label>
                <select
                  value={searchClassification}
                  onChange={(e) => setSearchClassification(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Classification</option>
                  <option value="Public">Public</option>
                  <option value="Internal">Internal</option>
                  <option value="Confidential">Confidential</option>
                  <option value="Restricted">Restricted</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Filter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
