import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowRight, ArrowLeft, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { TrustVaultLogo } from '../../components/brand/TrustVaultLogo';
import { api, ApiError } from '../../lib/api';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('A valid single-use reset token is required.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.auth.resetPassword({
        token: token.trim(),
        new_password: newPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to reset password. The token may have expired or was already used.');
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
          Set new password
        </h2>
        <p className="mt-2 text-center text-xs text-text-secondary">
          Enter your single-use verification token and choose a secure new password.
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

          {success ? (
            <div className="space-y-6">
              <div className="p-4 rounded-medium bg-surface-green border border-success/20 text-xs text-success-text space-y-2">
                <div className="flex items-center gap-2 font-semibold text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Password Reset Completed</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Your password has been securely updated and hashed using Argon2id. You can now sign in with your new credentials.
                </p>
              </div>

              <Link to="/login">
                <Button className="w-full text-xs font-semibold py-2.5 gap-2 shadow-subtle">
                  <span>Sign In Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="token" className="block text-xs font-semibold text-text-primary">
                  Reset Token
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="token"
                    type="text"
                    required
                    placeholder="e.g. 64-character token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="pl-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="new_password" className="block text-xs font-semibold text-text-primary">
                  New Password (min 8 chars)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="new_password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-9 text-xs"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirm_password" className="block text-xs font-semibold text-text-primary">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="confirm_password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 text-xs"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 text-xs font-semibold py-2.5 shadow-subtle gap-2"
              >
                {isLoading ? (
                  <span>Applying Password...</span>
                ) : (
                  <>
                    <span>Update Password</span>
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
                  <span>Return to login</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
