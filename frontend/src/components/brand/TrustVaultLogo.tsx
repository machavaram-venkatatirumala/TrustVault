import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface LogoProps {
  variant?: 'horizontal' | 'symbol' | 'monochrome';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
  themeContext?: 'light' | 'dark' | 'auto';
}

export function TrustVaultSymbol({
  size = 32,
  animated = false,
  className = '',
}: {
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const isAnimated = animated && !shouldReduceMotion;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="TrustVault geometric vault symbol"
    >
      <defs>
        {/* Subtle dimensional gradients for TrustVault permanent light appearance */}
        <linearGradient id="tv-vault-grad" x1="6" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3155D9" />
          <stop offset="100%" stopColor="#223FA8" />
        </linearGradient>
        <linearGradient id="tv-facet-grad" x1="24" y1="4" x2="34" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#0F766E" />
        </linearGradient>
      </defs>

      {/* Outer Hexagonal Shield / Vault Boundary */}
      <motion.path
        d="M20 3L34 10V22C34 29.5 28 35.5 20 38C12 35.5 6 29.5 6 22V10L20 3Z"
        fill="url(#tv-vault-grad)"
        initial={isAnimated ? { pathLength: 0, opacity: 0 } : false}
        animate={isAnimated ? { pathLength: 1, opacity: 1 } : false}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />

      {/* Folded Document Corner / Precision Facet */}
      <motion.path
        d="M24 4L34 14H26C24.8954 14 24 13.1046 24 12V4Z"
        fill="url(#tv-facet-grad)"
        opacity="0.9"
        initial={isAnimated ? { scale: 0, opacity: 0 } : false}
        animate={isAnimated ? { scale: 1, opacity: 0.9 } : false}
        transition={{ duration: 0.4, delay: 0.25 }}
      />

      {/* Central Verified "T" Core (Document Vault + Check Mark) */}
      <motion.path
        d="M13 14H27V17H21.5V28H18.5V17H13V14Z"
        fill="#FFFFFF"
        initial={isAnimated ? { opacity: 0, y: -2 } : false}
        animate={isAnimated ? { opacity: 1, y: 0 } : false}
        transition={{ duration: 0.4, delay: 0.35 }}
      />

      {/* Verification Checkmark Integrated at lower right */}
      <motion.path
        d="M21 23.5L24.5 27L30 19"
        stroke="#E8BE70"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={isAnimated ? { pathLength: 0, opacity: 0 } : false}
        animate={isAnimated ? { pathLength: 1, opacity: 1 } : false}
        transition={{ duration: 0.4, delay: 0.55 }}
      />
    </svg>
  );
}

export function TrustVaultLogo({
  variant = 'horizontal',
  size = 'md',
  animated = false,
  className = '',
}: LogoProps) {
  const shouldReduceMotion = useReducedMotion();
  const isAnimated = animated && !shouldReduceMotion;

  const sizeMap = {
    sm: { symbol: 24, text: 'text-sm', mark: 'text-[11px]' },
    md: { symbol: 32, text: 'text-base font-bold', mark: 'text-xs' },
    lg: { symbol: 40, text: 'text-xl font-bold', mark: 'text-sm' },
    xl: { symbol: 48, text: 'text-2xl font-bold', mark: 'text-base' },
  };

  const currentSize = sizeMap[size];

  if (variant === 'symbol') {
    return <TrustVaultSymbol size={currentSize.symbol} animated={animated} className={className} />;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <TrustVaultSymbol size={currentSize.symbol} animated={animated} />
      <motion.div
        className="flex flex-col text-left leading-none"
        initial={isAnimated ? { opacity: 0, x: -6 } : false}
        animate={isAnimated ? { opacity: 1, x: 0 } : false}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <span className={`tracking-tight text-text-primary ${currentSize.text} font-bold`}>
          Trust<span className="text-primary font-extrabold">Vault</span>
        </span>
        {size !== 'sm' && (
          <span className="text-[9px] uppercase tracking-wider text-text-muted font-medium mt-0.5">
            Verified Document Cloud
          </span>
        )}
      </motion.div>
    </div>
  );
}

export function AppLoadingMark({ message = 'Verifying security context...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-4">
      <div className="relative flex items-center justify-center">
        <TrustVaultSymbol size={44} animated={false} />
        <span className="absolute -inset-2 rounded-full border border-primary/30 animate-ping opacity-30" />
      </div>
      <span className="text-xs font-medium text-text-secondary animate-pulse">{message}</span>
    </div>
  );
}
