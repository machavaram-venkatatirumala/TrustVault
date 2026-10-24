import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme, Theme } from '../../lib/theme';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getIcon = () => {
    if (theme === 'system') return <Laptop className="w-4 h-4 text-text-secondary" />;
    if (resolvedTheme === 'dark') return <Moon className="w-4 h-4 text-accent-champagne" />;
    return <Sun className="w-4 h-4 text-warning" />;
  };

  const getLabel = () => {
    if (theme === 'system') return 'System';
    if (theme === 'dark') return 'Dark';
    return 'Light';
  };

  return (
    <button
      onClick={cycleTheme}
      type="button"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-small text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors border border-border/80 ${className}`}
      title={`Current theme: ${getLabel()} (click to cycle)`}
      aria-label={`Toggle theme, current is ${getLabel()}`}
    >
      {getIcon()}
      {showLabel && <span>{getLabel()}</span>}
    </button>
  );
}
