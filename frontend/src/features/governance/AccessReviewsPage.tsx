import React, { useEffect, useState } from 'react';
import { 
  ClipboardCheck, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ShieldAlert, 
  Search, 
  RefreshCw,
  Clock,
  UserCheck,
  ChevronRight,
  FileText
} from 'lucide-react';
import { api } from '../../lib/api';
import type { AccessReviewCampaign, AccessReviewItem } from '../../types';

export const AccessReviewsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<AccessReviewCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected Campaign for Item Review
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [campaignItems, setCampaignItems] = useState<AccessReviewItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Decision Modal State
  const [decidingItem, setDecidingItem] = useState<AccessReviewItem | null>(null);
  const [decisionAction, setDecisionAction] = useState<'confirmed' | 'revoked'>('confirmed');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Create Campaign Modal State
  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.governance.listAccessReviews();
      setCampaigns(res.campaigns || []);
      if (res.campaigns?.length > 0 && !selectedCampaignId) {
        setSelectedCampaignId(res.campaigns[0].id);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load access review campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchItems = async (campaignId: string) => {
    try {
      setIsLoadingItems(true);
      const res = await api.governance.getAccessReviewItems(campaignId);
      setCampaignItems(res.items || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load campaign review items');
    } finally {
      setIsLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaignId) {
      fetchItems(selectedCampaignId);
    } else {
      setCampaignItems([]);
    }
  }, [selectedCampaignId]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      setIsSubmittingCreate(true);
      setError(null);
      const created = await api.governance.createAccessReview({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        due_date: newDueDate || undefined,
      });
      setCampaigns((prev) => [created, ...prev]);
      setSelectedCampaignId(created.id);
      setIsCreatingModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewDueDate('');
      setSuccessMsg('Access review campaign initiated with active sharing grants.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to create access review campaign');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleItemDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignId || !decidingItem) return;
    try {
      setIsSubmittingDecision(true);
      setError(null);
      await api.governance.decideAccessReviewItem(
        selectedCampaignId,
        decidingItem.id,
        decisionAction,
        decisionNotes.trim() || undefined
      );

      // Update local state
      setCampaignItems((prev) =>
        prev.map((item) =>
          item.id === decidingItem.id
            ? { ...item, decision: decisionAction, notes: decisionNotes, decided_at: new Date().toISOString() }
            : item
        )
      );

      // Refresh campaigns to update progress counters
      const updatedCampaigns = await api.governance.listAccessReviews();
      setCampaigns(updatedCampaigns.campaigns || []);

      setDecidingItem(null);
      setDecisionNotes('');
      setSuccessMsg(`Access grant successfully ${decisionAction === 'confirmed' ? 'certified' : 'flagged for revocation'}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to record review decision');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Access Review Campaigns</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Audit Governance
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Conduct periodic recertification of document sharing grants and external collaborator permissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchCampaigns();
              if (selectedCampaignId) fetchItems(selectedCampaignId);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsCreatingModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Campaign
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

      {/* Main Grid: Campaigns List + Item Review Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Campaigns List */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Active & Past Campaigns ({campaigns.length})
          </h2>

          {campaigns.length === 0 && !isLoading && (
            <div className="p-6 bg-white border border-slate-200 rounded-xl text-center text-sm text-slate-500">
              No review campaigns created yet. Click "New Campaign" to launch a recertification cycle.
            </div>
          )}

          <div className="space-y-2">
            {campaigns.map((camp) => {
              const isSelected = camp.id === selectedCampaignId;
              const progressPct = camp.total_items > 0 
                ? Math.round((camp.completed_items / camp.total_items) * 100) 
                : 100;

              return (
                <div
                  key={camp.id}
                  onClick={() => setSelectedCampaignId(camp.id)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-blue-50/50 border-blue-500 shadow-sm ring-1 ring-blue-500' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 text-sm">{camp.title}</h3>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      camp.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {camp.status}
                    </span>
                  </div>
                  {camp.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{camp.description}</p>
                  )}

                  {/* Progress bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Progress</span>
                      <span className="font-medium text-slate-700">
                        {camp.completed_items} / {camp.total_items} ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Reviewer: {camp.reviewer_name}</span>
                    {camp.due_date && <span>Due: {new Date(camp.due_date).toLocaleDateString()}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Review Items for Selected Campaign */}
        <div className="lg:col-span-2 space-y-4">
          {selectedCampaign ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{selectedCampaign.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Certify legitimate business needs or flag outdated access for immediate administrative revocation.
                  </p>
                </div>
                <div className="text-xs text-slate-500 shrink-0">
                  Total Grants: <strong className="text-slate-800">{campaignItems.length}</strong>
                </div>
              </div>

              {isLoadingItems ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                  Loading grants for recertification...
                </div>
              ) : campaignItems.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  No grants require review in this campaign.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                        <th className="pb-2.5">Document</th>
                        <th className="pb-2.5">Recipient</th>
                        <th className="pb-2.5">Permission</th>
                        <th className="pb-2.5">Status / Decision</th>
                        <th className="pb-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {campaignItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-3 font-medium text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate max-w-[150px]">{item.document_name}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="font-medium text-slate-800">{item.recipient_name}</div>
                            <div className="text-[11px] text-slate-400">{item.recipient_email}</div>
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded font-semibold text-[11px] bg-slate-100 text-slate-700">
                              {item.permission_level}
                            </span>
                          </td>
                          <td className="py-3">
                            {item.decision === 'confirmed' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                Confirmed
                              </span>
                            ) : item.decision === 'revoked' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="w-3 h-3" />
                                Flagged Revoke
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3" />
                                Pending Review
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                setDecidingItem(item);
                                setDecisionAction('confirmed');
                                setDecisionNotes(item.notes || '');
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 bg-white border border-slate-200 rounded-xl text-center text-sm text-slate-500">
              Select or create a campaign to inspect and recertify sharing grants.
            </div>
          )}
        </div>
      </div>

      {/* Review Decision Modal */}
      {decidingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Recertify Document Access Grant</h3>
            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div><strong>Document:</strong> {decidingItem.document_name}</div>
              <div><strong>Recipient:</strong> {decidingItem.recipient_name} ({decidingItem.recipient_email})</div>
              <div><strong>Permission:</strong> {decidingItem.permission_level}</div>
            </div>

            <form onSubmit={handleItemDecisionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Certification Decision
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecisionAction('confirmed')}
                    className={`p-2.5 text-xs font-semibold rounded-lg border text-center transition-all ${
                      decisionAction === 'confirmed'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Confirm Access
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionAction('revoked')}
                    className={`p-2.5 text-xs font-semibold rounded-lg border text-center transition-all ${
                      decisionAction === 'revoked'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 ring-1 ring-rose-500'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Revoke Access
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Audit Justification / Notes
                </label>
                <textarea
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="e.g., Active vendor contract valid through Q4; confirmed by PM."
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDecidingItem(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDecision}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmittingDecision ? 'Submitting...' : 'Record Certification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {isCreatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Launch New Access Review Campaign</h3>
            <p className="text-xs text-slate-500">
              Automatically captures all active sharing grants across your workspace for recertification.
            </p>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Q4 SOC 2 External Sharing Recertification"
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Scope, audit requirements, or regulatory background..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Recertification Deadline
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmittingCreate ? 'Initiating...' : 'Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
