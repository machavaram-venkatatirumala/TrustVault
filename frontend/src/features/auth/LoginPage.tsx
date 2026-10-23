import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Sparkles, ArrowRight, KeyRound } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { api } from '../../lib/api';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [resetToken, setResetToken] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

  const { login, refetch } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setForgotMessage('');
    try {
      const res = await api.auth.forgotPassword({ email: forgotEmail });
      setForgotMessage(res.message);
      if (res.dev_reset_token) {
        setResetToken(res.dev_reset_token);
      }
      setForgotStep('reset');
    } catch (err: any) {
      error('Request Failed', err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken || !newResetPassword) return;
    setForgotLoading(true);
    try {
      const res = await api.auth.resetPassword({ token: resetToken, new_password: newResetPassword });
      success('Password Reset', res.message);
      setForgotOpen(false);
      setForgotStep('request');
      setResetToken('');
      setNewResetPassword('');
      setEmail(forgotEmail);
    } catch (err: any) {
      error('Reset Failed', err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      success('Welcome back', 'Signed in successfully.');
      navigate('/app');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setErrorMessage('');
  };

  const handleAutoSeedAndLogin = async (demoEmail: string) => {
    setLoading(true);
    try {
      await api.seed.seedDemo();
      await login({ email: demoEmail, password: 'Password123!' });
      success('Demo Workspace Ready', `Signed in as ${demoEmail}`);
      navigate('/app');
    } catch (err: any) {
      error('Demo Init Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-warm flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-small bg-primary flex items-center justify-center text-white shadow-subtle">
            <Shield className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="font-bold text-xl tracking-tight text-text-primary">TrustVault</span>
        </Link>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
          Sign in to your organization
        </h2>
        <p className="mt-1 text-xs text-text-secondary">
          Enter your credentials to access the secure document vault.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-card rounded-large border border-border sm:px-8 space-y-6">
          {errorMessage && (
            <div className="p-3 rounded-small bg-danger-bg border border-danger/30 text-danger text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              required
              autoComplete="email"
              placeholder="name@company.example"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 hover:text-text-primary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <div className="flex items-center justify-end -mt-1 mb-1">
              <button
                type="button"
                onClick={() => {
                  setForgotOpen(true);
                  setForgotEmail(email);
                  setForgotStep('request');
                  setForgotMessage('');
                }}
                className="text-xs text-primary hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" size="md" loading={loading} className="w-full text-xs font-semibold">
              Sign In
            </Button>
          </form>

          {/* Quick Demo Accounts Helper for Interview */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-accent-champagne" />
                Demo Credentials (1-Click)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleAutoSeedAndLogin('avery.morgan@northstar.example')}
                className="p-2 rounded-small border border-border bg-surface-subtle/50 text-left hover:border-primary/40 hover:bg-primary-soft/20 transition-colors"
              >
                <p className="font-semibold text-text-primary text-xs">Avery Morgan</p>
                <p className="text-[10px] text-primary font-medium">Admin Persona</p>
              </button>
              <button
                type="button"
                onClick={() => handleAutoSeedAndLogin('jordan.lee@northstar.example')}
                className="p-2 rounded-small border border-border bg-surface-subtle/50 text-left hover:border-primary/40 hover:bg-primary-soft/20 transition-colors"
              >
                <p className="font-semibold text-text-primary text-xs">Jordan Lee</p>
                <p className="text-[10px] text-text-secondary font-medium">Member Persona</p>
              </button>
            </div>
          </div>

          <div className="text-center pt-1">
            <p className="text-xs text-text-secondary">
              Don't have an organization yet?{' '}
              <Link to="/register" className="text-primary hover:underline font-semibold">
                Create a workspace
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot / Reset Password Dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-md">
          {forgotStep === 'request' ? (
            <form onSubmit={handleRequestReset}>
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  Enter your registered work email to receive password reset authorization.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-3">
                <Input
                  label="Work Email"
                  type="email"
                  required
                  placeholder="name@company.example"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  autoFocus
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForgotOpen(false)}
                  disabled={forgotLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={forgotLoading} disabled={!forgotEmail}>
                  Send Reset Link
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={handleCompleteReset}>
              <DialogHeader>
                <DialogTitle>Set New Password</DialogTitle>
                <DialogDescription>
                  {forgotMessage || 'Enter the verification token and choose a new secure password.'}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-3">
                <Input
                  label="Reset Token"
                  type="text"
                  required
                  placeholder="Paste token or use auto-filled dev token"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                />

                <Input
                  label="New Password"
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  value={newResetPassword}
                  onChange={(e) => setNewResetPassword(e.target.value)}
                  autoFocus
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForgotStep('request')}
                  disabled={forgotLoading}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  loading={forgotLoading}
                  disabled={!resetToken || newResetPassword.length < 8}
                >
                  Confirm Reset
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
