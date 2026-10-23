import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  label: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary-soft',
  className,
}: MetricCardProps) {
  return (
    <Card className={cn('p-5 hover:border-border-strong transition-all', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mt-1.5 font-sans">
            {value}
          </p>
        </div>
        <div className={cn('w-10 h-10 rounded-medium flex items-center justify-center shrink-0', iconBg, iconColor)}>
          <Icon className="w-5 h-5 stroke-[1.8]" />
        </div>
      </div>
      <p className="mt-3 text-xs text-text-secondary leading-normal">{description}</p>
    </Card>
  );
}
