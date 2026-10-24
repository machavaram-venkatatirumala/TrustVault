import React from 'react';
import { LucideIcon, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  label: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  to?: string;
  trendText?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary-soft',
  to,
  trendText = 'Not enough historical data',
  className,
}: MetricCardProps) {
  const content = (
    <Card
      className={cn(
        'p-5 transition-all duration-200 border-border bg-white shadow-card group relative overflow-hidden',
        to && 'hover:shadow-card-hover hover:border-border-strong cursor-pointer',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">{label}</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight mt-1.5 font-sans">
            {value}
          </p>
        </div>
        <div
          className={cn(
            'w-11 h-11 rounded-medium flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-2xs',
            iconBg,
            iconColor
          )}
        >
          <Icon className="w-5 h-5 stroke-[2]" />
        </div>
      </div>

      <div className="mt-3.5 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
        <span className="text-text-secondary truncate">{description}</span>
        {to && (
          <ArrowUpRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors shrink-0 ml-1.5 opacity-60 group-hover:opacity-100" />
        )}
      </div>

      {trendText && (
        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-text-muted/40" />
          <span>{trendText}</span>
        </div>
      )}
    </Card>
  );

  if (to) {
    return <Link to={to} className="block">{content}</Link>;
  }

  return content;
}
