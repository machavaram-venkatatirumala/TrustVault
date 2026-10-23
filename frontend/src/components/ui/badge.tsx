import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'champagne';
}

export function Badge({ className, variant = 'neutral', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-primary-soft text-primary border border-primary/20',
    success: 'bg-[#E8F6F0] text-success border border-success/20',
    warning: 'bg-[#FFF5E3] text-warning border border-warning/20',
    danger: 'bg-[#FCECEF] text-danger border border-danger/20',
    info: 'bg-[#EAF2FF] text-info border border-info/20',
    neutral: 'bg-surface-subtle text-text-secondary border border-border',
    champagne: 'bg-[#FAF5EB] text-[#8C6D3B] border border-[#E9DCBF]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium tracking-tight',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
