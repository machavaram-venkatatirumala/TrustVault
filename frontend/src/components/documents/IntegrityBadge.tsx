import React from 'react';
import { ShieldCheck, AlertTriangle, HelpCircle, XCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { VerificationStatus } from '../../types';

interface IntegrityBadgeProps {
  status: VerificationStatus;
  className?: string;
  onClick?: () => void;
}

export function IntegrityBadge({ status, className, onClick }: IntegrityBadgeProps) {
  const configs = {
    verified: {
      variant: 'success' as const,
      icon: ShieldCheck,
      label: 'SHA-256 Verified',
      tooltip: 'Cryptographic digest verified against stored bytes',
    },
    mismatch: {
      variant: 'danger' as const,
      icon: XCircle,
      label: 'Digest Mismatch',
      tooltip: 'Warning: Stored file bytes do not match original recorded digest!',
    },
    unavailable: {
      variant: 'warning' as const,
      icon: AlertTriangle,
      label: 'Unavailable',
      tooltip: 'Storage object could not be read for verification',
    },
    unverified: {
      variant: 'neutral' as const,
      icon: HelpCircle,
      label: 'Unverified',
      tooltip: 'Not yet verified against current storage bytes',
    },
  };

  const config = configs[status] || configs.unverified;
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={`cursor-pointer select-none transition-transform active:scale-95 ${className || ''}`}
      onClick={onClick}
      title={config.tooltip}
    >
      <Icon className="w-3.5 h-3.5 shrink-0 stroke-[2]" />
      <span>{config.label}</span>
    </Badge>
  );
}
