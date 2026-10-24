import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Plus,
  Search,
  Filter,
  FileText,
  User,
  ShieldCheck,
  Hash,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { api } from '../../lib/api';
import {
  ApprovalWorkflowInstance,
  ApprovalWorkflowTemplate,
  DocumentItem,
  ApprovalStatus,
} from '../../types';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

export function ApprovalsPage() {
  const { user, isAdmin } = useAuth();
  const [workflows, setWorkflows] = useState<ApprovalWorkflowInstance[]>([]);
  const [templates, setTemplates] = useState<ApprovalWorkflowTemplate[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedWorkflow, setSelectedWorkflow] = useState<ApprovalWorkflowInstance | null>(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<'approve' | 'reject' | 'request_changes'>('approve');
  const [decisionComment, setDecisionComment] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  // Submit new workflow modal
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitDocId, setSubmitDocId] = useState('');
  const [submitTemplateId, setSubmitTemplateId] = useState('');
  const [submitNotes, setSubmitNotes] = useState('');
  const [isSubmittingWorkflow, setIsSubmittingWorkflow] = useState(false);

  // Template creation modal
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateRole, setNewTemplateRole] = useState('member');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [wfRes, tplRes, docRes] = await Promise.all([
        api.approvals.list(statusFilter === 'all' ? undefined : statusFilter),
        api.approvals.listTemplates(),
        api.documents.list(),
      ]);
      setWorkflows(wfRes.workflows || []);
      setTemplates(tplRes.templates || []);
      setDocuments(docRes.documents || []);
      if (docRes.documents && docRes.documents.length > 0 && !submitDocId) {
        setSubmitDocId(docRes.documents[0].id);
      }
    } catch (err) {
      console.error('Failed to load approval workflows:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleRenderDecision = async () => {
    if (!selectedWorkflow) return;
    if ((decisionType === 'reject' || decisionType === 'request_changes') && decisionComment.trim().length < 3) {
      setDecisionError('A descriptive comment or reason is required when rejecting or requesting changes.');
      return;
    }

    setIsSubmittingDecision(true);
    setDecisionError(null);
    try {
      await api.approvals.decide(selectedWorkflow.id, decisionType, decisionComment.trim());
      setDecisionModalOpen(false);
      setDecisionComment('');
      setSelectedWorkflow(null);
      await loadData();
    } catch (err: any) {
      setDecisionError(err.message || 'Failed to submit decision.');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleSubmitWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitDocId) return;
    setIsSubmittingWorkflow(true);
    try {
      await api.approvals.submit(
        submitDocId,
        submitTemplateId || undefined,
        submitNotes || undefined
      );
      setSubmitModalOpen(false);
      setSubmitNotes('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit document for approval.');
    } finally {
      setIsSubmittingWorkflow(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;
    try {
      await api.approvals.createTemplate({
        name: newTemplateName.trim(),
        description: newTemplateDesc.trim() || undefined,
        steps: [{ name: 'Formal Compliance Sign-off', role: newTemplateRole }],
      });
      setTemplateModalOpen(false);
      setNewTemplateName('');
      setNewTemplateDesc('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create template.');
    }
  };

  const filteredWorkflows = workflows.filter((wf) => {
    const matchSearch =
      (wf.document_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      wf.submitter_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald/15 text-emerald border-emerald/30';
      case 'rejected':
        return 'bg-coral/15 text-coral border-coral/30';
      case 'changes_requested':
        return 'bg-amber/15 text-amber border-amber/30';
      case 'in_review':
        return 'bg-primary/15 text-primary border-primary/30 animate-pulse';
      case 'submitted':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-medium bg-primary/10 text-primary">
              <ClipboardCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-text-primary tracking-tight">
              Document Approval Workflows
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Configurable, version-aware review workflows with separation of duties and immutable version-hash snapshots.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isAdmin && (
            <button
              onClick={() => setTemplateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-border rounded-medium text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-all shadow-xs"
            >
              <Sliders className="w-3.5 h-3.5 text-text-muted" />
              Templates ({templates.length})
            </button>
          )}
          <button
            onClick={() => setSubmitModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-medium text-xs font-semibold hover:bg-primary-hover transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Submit for Review
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-border rounded-large p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by document or submitter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-border rounded-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-xs text-text-muted">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-border rounded-medium px-2.5 py-1.5 text-text-secondary focus:outline-none"
          >
            <option value="all">All States</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="changes_requested">Changes Requested</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Workflows Table */}
      <div className="bg-white border border-border rounded-large shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
            <p className="text-xs text-text-secondary">Loading review workflows...</p>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="py-16 text-center text-text-muted">
            <ClipboardCheck className="w-8 h-8 mx-auto mb-2 text-text-muted" />
            <p className="text-sm font-semibold text-text-primary">No approval workflows found</p>
            <p className="text-xs text-text-secondary mt-1">
              Submit a document version above to begin a formal review workflow.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-text-muted uppercase text-[10px] tracking-wider font-bold border-b border-border">
                <tr>
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-4">Version Content Hash</th>
                  <th className="py-3 px-4">Submitter</th>
                  <th className="py-3 px-4">Workflow State</th>
                  <th className="py-3 px-4">Separation of Duties</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredWorkflows.map((wf) => {
                  const isSubmitter = wf.submitter_id === user?.id;
                  const canDecide = wf.status === 'in_review' && (!isSubmitter || isAdmin);

                  return (
                    <tr key={wf.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <div>
                            <span className="font-semibold text-text-primary block">
                              {wf.document_name || 'Document'}
                            </span>
                            {wf.template_name && (
                              <span className="text-[10px] text-text-muted">
                                Template: {wf.template_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] bg-surface-subtle border border-border/80 px-2 py-0.5 rounded text-text-secondary" title={wf.version_hash}>
                          {wf.version_hash?.substring(0, 12)}...
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-text-primary">{wf.submitter_name}</div>
                        <div className="text-[10px] text-text-muted">{wf.submitter_email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider',
                            getStatusBadge(wf.status)
                          )}
                        >
                          {wf.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isSubmitter ? (
                          <span className="text-[11px] font-semibold text-amber flex items-center gap-1" title="Submitter cannot approve their own submission">
                            <AlertCircle className="w-3.5 h-3.5" /> Self-Review Blocked
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-emerald flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Eligible Reviewer
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-text-secondary text-[11px]">
                        {new Date(wf.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {wf.status === 'in_review' ? (
                          <button
                            disabled={isSubmitter}
                            onClick={() => {
                              setSelectedWorkflow(wf);
                              setDecisionModalOpen(true);
                            }}
                            className={cn(
                              'px-3 py-1 rounded-medium text-xs font-semibold transition-all',
                              isSubmitter
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-primary text-white hover:bg-primary-hover shadow-xs'
                            )}
                          >
                            Review & Decide
                          </button>
                        ) : (
                          <span className="text-[11px] font-medium text-text-muted">
                            Decided
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Decision Modal */}
      {decisionModalOpen && selectedWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-border rounded-large shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="border-b border-border px-5 py-4 flex items-center justify-between bg-surface-subtle">
              <h3 className="text-sm font-bold text-text-primary">Render Approval Decision</h3>
              <button
                onClick={() => setDecisionModalOpen(false)}
                className="text-text-muted hover:text-text-primary text-lg"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-surface-subtle border border-border/80 rounded-medium space-y-1.5">
                <div className="text-[11px] text-text-muted">Target Document:</div>
                <div className="font-bold text-text-primary">{selectedWorkflow.document_name}</div>
                <div className="text-[10px] text-text-muted font-mono flex items-center gap-1">
                  <Hash className="w-3 h-3 text-primary" />
                  Hash: {selectedWorkflow.version_hash}
                </div>
              </div>

              {decisionError && (
                <div className="p-2.5 rounded-medium bg-coral/10 border border-coral/20 text-coral text-xs">
                  {decisionError}
                </div>
              )}

              <div>
                <label className="font-semibold text-text-primary block mb-2">Decision</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecisionType('approve')}
                    className={cn(
                      'py-2 px-3 rounded-medium border text-xs font-bold transition-all text-center',
                      decisionType === 'approve'
                        ? 'bg-emerald text-white border-emerald shadow-xs'
                        : 'border-border text-text-secondary hover:bg-surface-subtle'
                    )}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionType('request_changes')}
                    className={cn(
                      'py-2 px-3 rounded-medium border text-xs font-bold transition-all text-center',
                      decisionType === 'request_changes'
                        ? 'bg-amber text-white border-amber shadow-xs'
                        : 'border-border text-text-secondary hover:bg-surface-subtle'
                    )}
                  >
                    Req Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionType('reject')}
                    className={cn(
                      'py-2 px-3 rounded-medium border text-xs font-bold transition-all text-center',
                      decisionType === 'reject'
                        ? 'bg-coral text-white border-coral shadow-xs'
                        : 'border-border text-text-secondary hover:bg-surface-subtle'
                    )}
                  >
                    Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-text-primary block mb-1">
                  Review Comment / Feedback {decisionType !== 'approve' && <span className="text-coral">*</span>}
                </label>
                <textarea
                  rows={3}
                  value={decisionComment}
                  onChange={(e) => setDecisionComment(e.target.value)}
                  placeholder={
                    decisionType === 'approve'
                      ? 'Optional approval notes...'
                      : 'Required reason for rejection or change request...'
                  }
                  className="w-full text-xs p-2.5 bg-white border border-border rounded-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setDecisionModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-medium border border-border text-text-secondary hover:bg-surface-subtle text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRenderDecision}
                  disabled={isSubmittingDecision}
                  className="px-4 py-1.5 rounded-medium bg-primary text-white hover:bg-primary-hover text-xs font-semibold shadow-xs"
                >
                  {isSubmittingDecision ? 'Submitting...' : 'Confirm Decision'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Document Modal */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-border rounded-large shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="border-b border-border px-5 py-4 flex items-center justify-between bg-surface-subtle">
              <h3 className="text-sm font-bold text-text-primary">Submit Document for Approval</h3>
              <button
                onClick={() => setSubmitModalOpen(false)}
                className="text-text-muted hover:text-text-primary text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitWorkflow} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-text-primary block mb-1">Select Document</label>
                <select
                  value={submitDocId}
                  onChange={(e) => setSubmitDocId(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-border rounded-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.original_filename} ({doc.classification || 'Internal'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-text-primary block mb-1">
                  Workflow Template (Optional)
                </label>
                <select
                  value={submitTemplateId}
                  onChange={(e) => setSubmitTemplateId(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-border rounded-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Default Sequential Review</option>
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-text-primary block mb-1">Submission Notes</label>
                <textarea
                  rows={3}
                  value={submitNotes}
                  onChange={(e) => setSubmitNotes(e.target.value)}
                  placeholder="Notes for compliance reviewers..."
                  className="w-full text-xs p-2.5 bg-white border border-border rounded-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSubmitModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-medium border border-border text-text-secondary hover:bg-surface-subtle text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWorkflow}
                  className="px-4 py-1.5 rounded-medium bg-primary text-white hover:bg-primary-hover text-xs font-semibold shadow-xs"
                >
                  {isSubmittingWorkflow ? 'Submitting...' : 'Start Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Management Modal */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-border rounded-large shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="border-b border-border px-5 py-4 flex items-center justify-between bg-surface-subtle">
              <h3 className="text-sm font-bold text-text-primary">Create Workflow Template</h3>
              <button
                onClick={() => setTemplateModalOpen(false)}
                className="text-text-muted hover:text-text-primary text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-text-primary block mb-1">Template Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Legal Compliance Review"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-border rounded-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-text-primary block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Standard review step before external contract execution"
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-border rounded-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-text-primary block mb-1">Reviewer Role</label>
                <select
                  value={newTemplateRole}
                  onChange={(e) => setNewTemplateRole(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-border rounded-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="member">Workspace Member</option>
                  <option value="admin">Workspace Admin</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setTemplateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-medium border border-border text-text-secondary hover:bg-surface-subtle text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-medium bg-primary text-white hover:bg-primary-hover text-xs font-semibold shadow-xs"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
