import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { api } from '../../lib/api';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login, refetch } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

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
    </div>
  );
}
