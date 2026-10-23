import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Building2, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { register } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName || !email || !orgName || !password) {
      setErrorMessage('All fields are required.');
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

    setLoading(true);
    try {
      await register({
        full_name: fullName,
        email,
        password,
        org_name: orgName,
      });
      success('Organization Created', `Welcome to TrustVault! You are administrator of ${orgName}.`);
      navigate('/app');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
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
          Create your enterprise workspace
        </h2>
        <p className="mt-1 text-xs text-text-secondary">
          You will become the founding administrator of your organization.
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
              label="Organization Name"
              type="text"
              required
              placeholder="e.g. Northstar Advisory"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />

            <Input
              label="Your Full Name"
              type="text"
              required
              placeholder="e.g. Avery Morgan"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

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
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

            <div className="p-3 rounded-small bg-surface-subtle border border-border/80 text-[11px] text-text-secondary flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <span>
                Passwords are salted and cryptographically hashed with Argon2id. We never store plain passwords.
              </span>
            </div>

            <Button type="submit" size="md" loading={loading} className="w-full text-xs font-semibold">
              Create Organization & Admin Account
            </Button>
          </form>

          <div className="text-center pt-1">
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
