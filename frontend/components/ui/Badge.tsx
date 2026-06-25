import { cn } from '@/lib/utils';
import { severityMeta, assetStatusMeta } from '@/lib/utils';
import type { AssetStatus, Severity } from '@/lib/types';
import type { ReactNode } from 'react';

export function Pill({
  children,
  className,
  dot,
}: {
  children: ReactNode;
  className?: string;
  dot?: string;
}) {
  return (
    <span className={cn('chip', className)}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />}
      {children}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const m = severityMeta[severity];
  return (
    <Pill className={cn(m.bg, m.border, m.text)} dot={m.dot}>
      {m.label}
    </Pill>
  );
}

export function StatusBadge({ status }: { status: AssetStatus }) {
  const m = assetStatusMeta[status];
  return (
    <Pill className={cn(m.bg, m.border, m.text)} dot={m.dot}>
      {m.label}
    </Pill>
  );
}

export function LiveBadge({ label = 'LIVE' }: { label?: string }) {
  return (
    <span className="chip border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      {label}
    </span>
  );
}
