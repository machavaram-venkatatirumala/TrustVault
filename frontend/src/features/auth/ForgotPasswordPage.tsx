import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { TrustVaultLogo } from '../../components/brand/TrustVaultLogo';
import { api, ApiError } from '../../lib/api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your registered account email.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.auth.forgotPassword({ email: email.trim().toLowerCase() });
      setSubmitted(true);
      if (res.dev_reset_token) {
        setDevToken(res.dev_reset_token);
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while requesting password reset.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-warm flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-primary-soft selection:text-primary">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/">
            <TrustVaultLogo size="lg" />
          </Link>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-text-primary">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-xs text-text-secondary">
          Enter your email and we'll generate an expiring single-use reset token.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-elevated py-8 px-6 shadow-card sm:rounded-large border border-border">
          {error && (
            <div className="mb-6 p-3 rounded-medium bg-danger-bg border border-danger/20 flex items-start gap-2.5 text-xs text-danger">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {submitted ? (
            <div className="space-y-6">
              <div className="p-4 rounded-medium bg-surface-green border border-success/20 text-xs text-success-text space-y-2">
                <div className="flex items-center gap-2 font-semibold text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Password Reset Initiated</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  If an account exists for <strong>{email}</strong>, a secure reset link has been dispatched. Tokens expire within 15 minutes.
                </p>
              </div>

              {devToken && (
                <div className="p-3.5 rounded-medium bg-surface-gold border border-warm/30 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-warm block">
                    Evaluation Environment Helper
                  </span>
                  <p className="text-[11px] text-text-secondary leading-tight">
                    Since external SMTP is not connected in this local evaluation instance, your generated reset token is:
                  </p>
                  <div className="p-2 rounded bg-white dark:bg-elevated border border-border font-mono text-[11px] text-text-primary break-all select-all">
                    {devToken}
                  </div>
                  <Link to={`/reset-password?token=${devToken}`}>
                    <Button size="sm" className="w-full mt-2 text-xs gap-1.5">
                      <span>Proceed to Complete Reset</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              )}

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-semibold text-text-primary">
                  Account Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-xs"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full text-xs font-semibold py-2.5 shadow-subtle gap-2"
              >
                {isLoading ? (
                  <span>Generating Token...</span>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to login</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
