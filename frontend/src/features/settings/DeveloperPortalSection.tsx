import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import {
  Code,
  Key,
  Webhook,
  Plus,
  Trash2,
  Copy,
  Check,
  Send,
  ExternalLink,
  ShieldAlert,
  Clock,
  History,
  FileCode2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { ApiKeyItem, WebhookSubscriptionItem, WebhookDeliveryItem } from '../../types';

const AVAILABLE_SCOPES = [
  { id: 'documents:read', label: 'documents:read', desc: 'List documents and inspect metadata & hashes' },
  { id: 'documents:write', label: 'documents:write', desc: 'Upload documents and create replacement versions' },
  { id: 'audit:read', label: 'audit:read', desc: 'Verify sequential hash chain and read security logs' },
  { id: 'shares:manage', label: 'shares:manage', desc: 'Create, inspect, and revoke secure document share links' },
];

const AVAILABLE_EVENTS = [
  { id: 'document.upload', label: 'document.upload', desc: 'Fires when a new document is stored' },
  { id: 'document.version_created', label: 'document.version_created', desc: 'Fires when a new version is uploaded' },
  { id: 'document.download', label: 'document.download', desc: 'Fires on successful document download' },
  { id: 'document.delete', label: 'document.delete', desc: 'Fires when a document is soft-deleted or purged' },
  { id: 'share.grant', label: 'share.grant', desc: 'Fires when access permissions are shared' },
  { id: 'share.revoke', label: 'share.revoke', desc: 'Fires when access is immediately revoked' },
  { id: 'integrity.verify_mismatch', label: 'integrity.verify_mismatch', desc: 'Fires on cryptographic hash or chain failure' },
];

export function DeveloperPortalSection() {
  const { success, error } = useToast();

  // API Keys State
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [createKeyModalOpen, setCreateKeyModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['documents:read', 'documents:write']);
  const [generatingKey, setGeneratingKey] = useState(false);

  // New Key Secret Reveal Modal
  const [revealKeyModalOpen, setRevealKeyModalOpen] = useState(false);
  const [newRawKey, setNewRawKey] = useState('');
  const [keyCopied, setKeyCopied] = useState(false);

  // Webhooks State
  const [webhooks, setWebhooks] = useState<WebhookSubscriptionItem[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(true);
  const [createWebhookModalOpen, setCreateWebhookModalOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'document.upload',
    'integrity.verify_mismatch',
  ]);
  const [creatingWebhook, setCreatingWebhook] = useState(false);

  // Webhook Deliveries Modal
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [activeWebhook, setActiveWebhook] = useState<WebhookSubscriptionItem | null>(null);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);

  // Fetch API Keys
  const fetchKeys = async () => {
    try {
      setLoadingKeys(true);
      const res = await api.developer.apiKeys.list();
      setApiKeys(res.api_keys || []);
    } catch (err: any) {
      error('Failed to Load API Keys', err.message);
    } finally {
      setLoadingKeys(false);
    }
  };

  // Fetch Webhooks
  const fetchWebhooks = async () => {
    try {
      setLoadingWebhooks(true);
      const res = await api.developer.webhooks.list();
      setWebhooks(res.webhooks || []);
    } catch (err: any) {
      error('Failed to Load Webhooks', err.message);
    } finally {
      setLoadingWebhooks(false);
    }
  };

  useEffect(() => {
    fetchKeys();
    fetchWebhooks();
  }, []);

  // Handle Create API Key
  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    if (selectedScopes.length === 0) {
      error('Scope Required', 'Select at least one API scope.');
      return;
    }

    setGeneratingKey(true);
    try {
      const res = await api.developer.apiKeys.create({
        name: keyName.trim(),
        scopes: selectedScopes,
      });
      const rawSecret = (res as any).raw_secret_key || (res as any).raw_token || '';
      setNewRawKey(rawSecret);
      setCreateKeyModalOpen(false);
      setKeyName('');
      setSelectedScopes(['documents:read', 'documents:write']);
      setRevealKeyModalOpen(true);
      fetchKeys();
      success('API Key Generated', 'Store your key secret safely.');
    } catch (err: any) {
      error('Key Generation Failed', err.message);
    } finally {
      setGeneratingKey(false);
    }
  };

  // Handle Revoke API Key
  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to permanently revoke this API key? All applications using it will lose access immediately.')) {
      return;
    }
    try {
      await api.developer.apiKeys.revoke(id);
      success('API Key Revoked', 'The key has been invalidated on the server.');
      fetchKeys();
    } catch (err: any) {
      error('Revocation Failed', err.message);
    }
  };

  // Handle Create Webhook
  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl.trim()) return;
    if (selectedEvents.length === 0) {
      error('Event Required', 'Select at least one subscribed event.');
      return;
    }

    setCreatingWebhook(true);
    try {
      await api.developer.webhooks.create({
        target_url: webhookUrl.trim(),
        events: selectedEvents,
      });
      setCreateWebhookModalOpen(false);
      setWebhookUrl('');
      setSelectedEvents(['document.upload', 'integrity.verify_mismatch']);
      fetchWebhooks();
      success('Webhook Registered', 'Signed payload notifications are now enabled.');
    } catch (err: any) {
      error('Webhook Creation Failed', err.message);
    } finally {
      setCreatingWebhook(false);
    }
  };

  // Handle Delete Webhook
  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook subscription?')) return;
    try {
      await api.developer.webhooks.delete(id);
      success('Webhook Deleted', 'Subscription removed.');
      fetchWebhooks();
    } catch (err: any) {
      error('Deletion Failed', err.message);
    }
  };

  // Handle Test Ping Webhook
  const handleTestPing = async (id: string) => {
    setTestingWebhookId(id);
    try {
      const res = await api.developer.webhooks.test(id);
      const statusCode = res.delivery?.status_code;
      const ok = res.delivery?.success;
      success(
        'Webhook Ping Dispatched',
        `Status code: ${statusCode || 'Pending'} — Result: ${ok ? 'Delivered' : 'Failed'}`
      );
      fetchWebhooks();
    } catch (err: any) {
      error('Test Delivery Failed', err.message);
    } finally {
      setTestingWebhookId(null);
    }
  };

  const copySecretToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2500);
    success('Copied to Clipboard', 'Secret stored in your clipboard.');
  };

  return (
    <div className="space-y-6">
      {/* Developer API & Scoped Credentials Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-text-primary">
                <div className="w-8 h-8 rounded-small bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Code className="w-4 h-4" />
                </div>
                <span>Developer API & Scoped Access Keys</span>
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary leading-relaxed pl-10.5">
                Generate cryptographically hashed machine credentials (<code className="font-mono text-[11px] text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/20">tv_live_...</code>) with bounded permission scopes.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
              <a
                href="/api/v1/openapi.json"
                target="_blank"
                rel="noreferrer"
                className="h-9 px-3.5 inline-flex items-center justify-center gap-2 rounded-small text-xs font-medium border border-border bg-white hover:bg-surface-subtle text-text-primary hover:border-border-strong shadow-subtle whitespace-nowrap transition-all"
              >
                <FileCode2 className="w-4 h-4 text-primary shrink-0" />
                <span>OpenAPI 3.0 Spec</span>
                <ExternalLink className="w-3 h-3 text-text-muted shrink-0 ml-0.5" />
              </a>
              <Button
                size="sm"
                className="h-9 px-4 text-xs font-semibold whitespace-nowrap gap-1.5 shadow-subtle shrink-0"
                onClick={() => setCreateKeyModalOpen(true)}
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Generate API Key</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingKeys ? (
            <div className="p-8 text-center text-xs text-text-muted flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Loading credentials...</span>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="p-6 text-center rounded-medium bg-surface-subtle border border-border/80 space-y-2">
              <Key className="w-8 h-8 text-text-muted mx-auto" />
              <p className="text-xs font-semibold text-text-primary">No API Keys Generated</p>
              <p className="text-[11px] text-text-muted max-w-sm mx-auto">
                Create an API key to securely automate document ingestion, hash verification, or permission management.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-medium">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle border-b border-border text-text-muted font-semibold">
                  <tr>
                    <th className="py-2.5 px-3.5">Key Name & Prefix</th>
                    <th className="py-2.5 px-3.5">Permission Scopes</th>
                    <th className="py-2.5 px-3.5">Created</th>
                    <th className="py-2.5 px-3.5">Last Used</th>
                    <th className="py-2.5 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {apiKeys.map((k) => (
                    <tr key={k.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-text-primary">{k.name}</div>
                        <div className="font-mono text-[11px] text-primary mt-0.5">{k.key_prefix}••••••••</div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="flex flex-wrap gap-1">
                          {k.scopes.map((s) => (
                            <Badge key={s} variant="neutral" className="text-[10px] font-mono px-1.5 py-0.5">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-text-muted">
                        {new Date(k.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3.5 text-text-muted font-mono text-[11px]">
                        {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never used'}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeKey(k.id)}
                          className="text-xs text-danger border-danger/30 hover:bg-danger-bg px-2.5 py-1 h-auto"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          <span>Revoke</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhooks Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-text-primary">
                <div className="w-8 h-8 rounded-small bg-teal/10 flex items-center justify-center text-teal shrink-0">
                  <Webhook className="w-4 h-4" />
                </div>
                <span>Real-Time Webhook Subscriptions</span>
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary leading-relaxed pl-10.5">
                Deliver tamper-evident HMAC-SHA256 signed events (<code className="font-mono text-[11px] text-teal bg-teal/5 px-1.5 py-0.5 rounded border border-teal/20">X-TrustVault-Signature</code>) directly to your external systems.
              </CardDescription>
            </div>
            <div className="shrink-0 self-start sm:self-center">
              <Button
                size="sm"
                variant="outline"
                className="h-9 px-4 text-xs font-semibold whitespace-nowrap gap-1.5 border-teal/40 text-teal hover:bg-teal/10 shadow-subtle shrink-0"
                onClick={() => setCreateWebhookModalOpen(true)}
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Add Webhook</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingWebhooks ? (
            <div className="p-8 text-center text-xs text-text-muted flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-teal border-t-transparent rounded-full animate-spin" />
              <span>Loading webhook endpoints...</span>
            </div>
          ) : webhooks.length === 0 ? (
            <div className="p-6 text-center rounded-medium bg-surface-subtle border border-border/80 space-y-2">
              <Webhook className="w-8 h-8 text-text-muted mx-auto" />
              <p className="text-xs font-semibold text-text-primary">No Webhook Subscriptions</p>
              <p className="text-[11px] text-text-muted max-w-sm mx-auto">
                Subscribe to document uploads, access revocations, or integrity mismatch alarms to power downstream SIEMs and automation.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-medium">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle border-b border-border text-text-muted font-semibold">
                  <tr>
                    <th className="py-2.5 px-3.5">Endpoint URL</th>
                    <th className="py-2.5 px-3.5">Events</th>
                    <th className="py-2.5 px-3.5">Signing Secret</th>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {webhooks.map((w) => (
                    <tr key={w.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="font-mono text-xs font-medium text-text-primary break-all max-w-xs">
                          {w.target_url}
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="flex flex-wrap gap-1">
                          {w.events.map((ev) => (
                            <Badge key={ev} variant="neutral" className="text-[10px] font-mono px-1.5 py-0.5">
                              {ev}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-[11px] text-text-muted">
                        {w.secret_preview}••••••••
                      </td>
                      <td className="py-3 px-3.5">
                        <Badge variant="success" className="text-[10px]">
                          Active
                        </Badge>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestPing(w.id)}
                            loading={testingWebhookId === w.id}
                            className="text-[11px] px-2 py-1 h-auto text-teal border-teal/30 hover:bg-teal/10"
                            title="Send sample signed payload"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            <span>Ping</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActiveWebhook(w);
                              setDeliveryModalOpen(true);
                            }}
                            className="text-[11px] px-2 py-1 h-auto text-text-secondary hover:bg-surface-subtle"
                            title="Inspect past delivery status"
                          >
                            <History className="w-3 h-3 mr-1" />
                            <span>Logs</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteWebhook(w.id)}
                            className="text-[11px] px-2 py-1 h-auto text-danger border-danger/30 hover:bg-danger-bg"
                            title="Delete subscription"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Generate API Key */}
      <Dialog open={createKeyModalOpen} onOpenChange={setCreateKeyModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              <span>Generate Scoped API Key</span>
            </DialogTitle>
            <DialogDescription>
              Assign a recognizable name and grant strictly least-privilege scopes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateKey} className="space-y-4 py-2">
            <Input
              label="Key Name / Purpose"
              placeholder="e.g. CI/CD Compliance Pipeline, Cloud SIEM Connector"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-2">
                Permission Scopes
              </label>
              <div className="space-y-2">
                {AVAILABLE_SCOPES.map((sc) => {
                  const checked = selectedScopes.includes(sc.id);
                  return (
                    <label
                      key={sc.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-small border cursor-pointer transition-colors ${
                        checked ? 'bg-primary/5 border-primary/40' : 'bg-surface-subtle border-border'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedScopes([...selectedScopes, sc.id]);
                          } else {
                            setSelectedScopes(selectedScopes.filter((s) => s !== sc.id));
                          }
                        }}
                        className="mt-0.5 rounded text-primary"
                      />
                      <div className="text-xs">
                        <span className="font-mono font-semibold text-text-primary">{sc.label}</span>
                        <p className="text-[11px] text-text-muted mt-0.5">{sc.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateKeyModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={generatingKey}>
                Generate Key Secret
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Reveal Raw Key Secret (One-Time) */}
      <Dialog open={revealKeyModalOpen} onOpenChange={setRevealKeyModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald">
              <Key className="w-5 h-5" />
              <span>API Key Created Successfully</span>
            </DialogTitle>
            <DialogDescription>
              Copy this token now. It will never be displayed again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3.5 rounded-medium bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">One-time Secret Display</p>
                <p className="text-[11px] text-amber-800/90 leading-relaxed mt-0.5">
                  TrustVault stores only an irreversible SHA-256 hash of this key. If you lose this secret, you must revoke it and generate a replacement.
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text-primary">
                Bearer Secret Token
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={newRawKey}
                  className="w-full p-2.5 font-mono text-xs bg-surface-subtle border border-border rounded-small text-text-primary focus:outline-none selection:bg-primary/20"
                />
                <Button
                  size="sm"
                  onClick={() => copySecretToClipboard(newRawKey)}
                  className="shrink-0 gap-1.5"
                >
                  {keyCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{keyCopied ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </div>

            <div className="p-3 bg-surface-subtle rounded-small border border-border text-[11px] text-text-muted font-mono">
              <div className="text-text-primary font-semibold mb-1">Example Request:</div>
              curl -H &quot;Authorization: Bearer {newRawKey ? newRawKey.slice(0, 16) : 'tv_live_...'}...&quot; \ <br />
              &nbsp;&nbsp;https://api.trustvault.internal/api/v1/documents
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" onClick={() => setRevealKeyModalOpen(false)}>
              I Have Stored This Key Safely
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Create Webhook Subscription */}
      <Dialog open={createWebhookModalOpen} onOpenChange={setCreateWebhookModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Webhook className="w-4 h-4 text-teal" />
              <span>Create Webhook Subscription</span>
            </DialogTitle>
            <DialogDescription>
              Receive cryptographically signed HTTP POST notifications with HMAC-SHA256 signatures.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateWebhook} className="space-y-4 py-2">
            <Input
              label="Target Endpoint URL"
              placeholder="https://api.yourdomain.com/webhooks/trustvault"
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-2">
                Subscribed Event Topics
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {AVAILABLE_EVENTS.map((ev) => {
                  const checked = selectedEvents.includes(ev.id);
                  return (
                    <label
                      key={ev.id}
                      className={`flex items-start gap-2.5 p-2 rounded-small border cursor-pointer transition-colors ${
                        checked ? 'bg-teal/5 border-teal/40' : 'bg-surface-subtle border-border'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEvents([...selectedEvents, ev.id]);
                          } else {
                            setSelectedEvents(selectedEvents.filter((item) => item !== ev.id));
                          }
                        }}
                        className="mt-0.5 rounded text-teal"
                      />
                      <div className="text-xs">
                        <span className="font-mono font-semibold text-text-primary">{ev.label}</span>
                        <p className="text-[11px] text-text-muted">{ev.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateWebhookModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={creatingWebhook} className="bg-teal hover:bg-teal/90 text-white">
                Register Webhook
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Webhook Delivery History */}
      <Dialog open={deliveryModalOpen} onOpenChange={setDeliveryModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <span>Webhook Delivery History & Dispatch Logs</span>
            </DialogTitle>
            <DialogDescription>
              Inspection history showing payload dispatch attempts and remote server responses.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 overflow-y-auto flex-1 space-y-3">
            {!activeWebhook?.recent_deliveries || activeWebhook.recent_deliveries.length === 0 ? (
              <div className="p-6 text-center rounded-medium bg-surface-subtle border border-border text-xs text-text-muted">
                No delivery attempts recorded for this subscription yet. Click &ldquo;Ping&rdquo; to test connectivity.
              </div>
            ) : (
              <div className="space-y-2">
                {activeWebhook.recent_deliveries.map((del: WebhookDeliveryItem) => (
                  <div
                    key={del.id}
                    className="p-3 rounded-small border border-border bg-surface-subtle space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-mono">
                        <Badge
                          variant={del.success ? 'success' : 'danger'}
                          className="text-[10px]"
                        >
                          {del.status_code ? `${del.status_code} HTTP` : del.success ? 'Delivered' : 'Failed'}
                        </Badge>
                        <span className="font-semibold text-text-primary">{del.event_type}</span>
                      </div>
                      <span className="text-[11px] text-text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(del.delivered_at).toLocaleString()}
                      </span>
                    </div>
                    {del.payload_preview && (
                      <div className="text-[11px] text-text-muted font-mono bg-white p-1.5 rounded border border-border">
                        Payload: {del.payload_preview}
                      </div>
                    )}
                    {del.response_body_preview && (
                      <div className="text-[11px] text-text-muted font-mono bg-white p-1.5 rounded border border-border">
                        Response: {del.response_body_preview}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setDeliveryModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
