import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  icon,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-4">
        {icon && (
          <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-command-500/25 bg-command-500/10 text-command-300 shadow-glow">
            {icon}
          </div>
        )}
        <div>
          {eyebrow && (
            <div className="section-label mb-1 text-command-300/80">{eyebrow}</div>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({
  title,
  hint,
  className,
  right,
}: {
  title: string;
  hint?: string;
  className?: string;
  right?: ReactNode;
}) {
  return (
    <div className={cn('mb-4 flex items-center justify-between gap-3', className)}>
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-slate-100">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
      {right}
    </div>
  );
}
