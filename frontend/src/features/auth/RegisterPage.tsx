import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { TrustVaultLogo } from '../../components/brand/TrustVaultLogo';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { register } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage('Full name, email address, and password are required.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage('Please accept the Terms of Service and acknowledge the Privacy Policy to proceed.');
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        terms_accepted: true,
        terms_version: '1.2',
      });
      success('Workspace Ready', `Welcome to TrustVault! Your personal secure workspace has been established.`);
      navigate('/app');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-warm flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block mb-3">
          <TrustVaultLogo size="lg" animated={true} />
        </Link>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
          Create your secure workspace
        </h2>
        <p className="mt-1 text-xs text-text-secondary max-w-sm mx-auto">
          Private file storage, verifiable SHA-256 integrity, and intentional sharing for individuals and teams.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-elevated py-8 px-6 shadow-card rounded-large border border-border sm:px-8 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-small bg-danger-bg border border-danger/30 text-danger text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              required
              autoFocus
              autoComplete="name"
              placeholder="e.g. Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <Input
              label="Email Address"
              type="email"
              required
              autoComplete="email"
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password (min 8 characters)"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
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
                  {showPassword ? <EyeOff className="w-4 h-4 text-text-muted" /> : <Eye className="w-4 h-4 text-text-muted" />}
                </button>
              }
            />

            <Input
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="terms"
                type="checkbox"
                required
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary border-border"
              />
              <label htmlFor="terms" className="text-xs text-text-secondary leading-normal">
                I accept the{' '}
                <Link to="/terms" target="_blank" className="text-primary hover:underline font-medium">
                  Terms of Service (v1.2)
                </Link>{' '}
                and acknowledge the{' '}
                <Link to="/privacy" target="_blank" className="text-primary hover:underline font-medium">
                  Privacy Policy
                </Link>
                .
              </label>
            </div>

            <div className="p-3 rounded-small bg-surface-subtle border border-border/80 text-[11px] text-text-secondary flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <span>
                Passwords are never stored in plaintext. Hashed and salted using modern Argon2id with 64MB memory resistance.
              </span>
            </div>

            <Button type="submit" size="md" loading={loading} className="w-full text-xs font-semibold gap-1.5">
              <span>Create Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </form>

          <div className="text-center pt-1 border-t border-border/60">
            <p className="text-xs text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
