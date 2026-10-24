import React, { useState } from 'react';
import { LegalLayout } from './LegalLayout';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Mail, CheckCircle2, MessageSquare, Send } from 'lucide-react';

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('support');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) return;

    setSubmitting(true);
    // Simulate real local inquiry ticket dispatch with generated reference
    setTimeout(() => {
      const refId = `TV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setSubmittedId(refId);
      setSubmitting(false);
    }, 600);
  };

  return (
    <LegalLayout
      title="Support & Inquiries"
      subtitle="Submit technical inquiries, report security concerns, or request privacy policy assistance."
      effectiveDate="October 24, 2026"
      version="1.2"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Direct Channels */}
        <div className="md:col-span-5 space-y-4">
          <div className="p-4 rounded-medium bg-white dark:bg-elevated border border-border space-y-3">
            <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              <span>Direct Support Channels</span>
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Our engineering and security team monitors all verified communications during standard business hours (UTC).
            </p>
            <div className="pt-2 space-y-2 text-xs">
              <div>
                <span className="text-text-muted block text-[11px]">Security Disclosure:</span>
                <span className="font-mono text-primary font-medium">security@trustvault.local</span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">General Inquiries:</span>
                <span className="font-mono text-primary font-medium">support@trustvault.local</span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Privacy Officer:</span>
                <span className="font-mono text-primary font-medium">privacy@trustvault.local</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-medium bg-surface-subtle border border-border text-xs text-text-secondary space-y-2">
            <h4 className="font-semibold text-text-primary">Response Time Commitment</h4>
            <p className="leading-relaxed">
              Critical security vulnerability reports receive acknowledgment within 4 hours. General workspace questions are answered within 24 hours.
            </p>
          </div>
        </div>

        {/* Right Column: Inquiry Form */}
        <div className="md:col-span-7">
          <div className="p-6 rounded-large bg-white dark:bg-elevated border border-border shadow-card">
            {submittedId ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-success-bg text-success mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">Inquiry Submitted Successfully</h3>
                <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
                  Thank you, <span className="font-semibold text-text-primary">{name}</span>. Your message has been logged under reference ticket:
                </p>
                <div className="inline-block p-2.5 rounded-small bg-surface-subtle border border-border font-mono text-xs font-bold text-primary">
                  {submittedId}
                </div>
                <p className="text-[11px] text-text-muted">
                  A verification confirmation has been sent to <span className="font-medium text-text-primary">{email}</span>.
                </p>
                <div className="pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSubmittedId(null);
                      setName('');
                      setEmail('');
                      setSubject('');
                      setMessage('');
                    }}
                  >
                    Submit Another Inquiry
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-bold text-sm text-text-primary">Submit an Inquiry</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Your Name"
                    required
                    placeholder="e.g. Alex Chen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    required
                    placeholder="alex@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Inquiry Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs rounded-small border border-border bg-white dark:bg-elevated text-text-primary p-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="support">Technical Support & Workspace Help</option>
                    <option value="security">Vulnerability Disclosure & Security Architecture</option>
                    <option value="privacy">Privacy Rights & Data Deletion Request</option>
                    <option value="general">General Collaboration Inquiries</option>
                  </select>
                </div>

                <Input
                  label="Subject"
                  required
                  placeholder="Summary of your question or issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />

                <div>
                  <label htmlFor="contact-message" className="block text-xs font-semibold text-text-primary mb-1">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    placeholder="Please provide complete context so our team can assist you efficiently..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full text-xs rounded-small border border-border bg-white dark:bg-elevated text-text-primary p-2.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>

                <Button type="submit" size="md" loading={submitting} className="w-full text-xs font-semibold gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Inquiry</span>
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </LegalLayout>
  );
}
