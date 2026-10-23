import React from 'react';
import { Menu, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { api } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

interface TopbarProps {
  onOpenMobileNav: () => void;
  title?: string;
}

export function Topbar({ onOpenMobileNav, title }: TopbarProps) {
  const { user, role, refetch, login } = useAuth();
  const { success, error } = useToast();
  const [isSeeding, setIsSeeding] = React.useState(false);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      const res = await api.seed.seedDemo();
      success('Demo Seeded', res.message);
      refetch();
    } catch (err: any) {
      error('Seed Error', err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleQuickSwitch = async (email: string) => {
    try {
      await login({ email, password: 'Password123!' });
      success('Switched User', `Now signed in as ${email}`);
    } catch (err: any) {
      error('Switch Failed', 'Please seed demo data first.');
    }
  };

  return (
    <header className="h-16 border-b border-border bg-white flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-small text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && (
          <h1 className="text-base sm:text-lg font-semibold text-text-primary tracking-tight">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        {/* Quick Demo Switcher for Technical Interview Demonstration */}
        <div className="hidden md:flex items-center gap-2 border border-border/80 rounded-small p-1 bg-surface-subtle/40">
          <span className="text-[11px] font-semibold text-text-muted px-1.5 uppercase tracking-wider">
            Demo Persona:
          </span>
          <button
            onClick={() => handleQuickSwitch('avery.morgan@northstar.example')}
            className={`text-xs px-2 py-1 rounded-small font-medium transition-colors ${
              user?.email === 'avery.morgan@northstar.example'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-white'
            }`}
          >
            Avery (Admin)
          </button>
          <button
            onClick={() => handleQuickSwitch('jordan.lee@northstar.example')}
            className={`text-xs px-2 py-1 rounded-small font-medium transition-colors ${
              user?.email === 'jordan.lee@northstar.example'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-white'
            }`}
          >
            Jordan (Member)
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSeedDemo}
          loading={isSeeding}
          className="text-xs gap-1.5"
          title="Seed realistic development demo data (Northstar Advisory)"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent-champagne" />
          <span className="hidden sm:inline">Reset / Seed Demo</span>
        </Button>

        <Badge variant={role === 'admin' ? 'default' : 'neutral'} className="capitalize hidden sm:inline-flex">
          <ShieldCheck className="w-3 h-3 mr-1" />
          {role}
        </Badge>
      </div>
    </header>
  );
}
