'use client';

import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AnimatedNumber } from './AnimatedNumber';

type Accent = 'command' | 'violet' | 'emerald' | 'amber' | 'orange' | 'red' | 'slate';

const accentMap: Record<Accent, { text: string; bar: string; ring: string; glow: string }> = {
  command: { text: 'text-command-300', bar: 'from-command-400 to-command-600', ring: 'border-command-500/25 bg-command-500/10', glow: 'group-hover:shadow-glow' },
  violet: { text: 'text-cognition-300', bar: 'from-cognition-400 to-cognition-600', ring: 'border-cognition-500/25 bg-cognition-500/10', glow: 'group-hover:shadow-glow-violet' },
  emerald: { text: 'text-emerald-300', bar: 'from-emerald-400 to-emerald-600', ring: 'border-emerald-500/25 bg-emerald-500/10', glow: '' },
  amber: { text: 'text-amber-200', bar: 'from-amber-300 to-amber-500', ring: 'border-amber-400/25 bg-amber-400/10', glow: '' },
  orange: { text: 'text-orange-300', bar: 'from-orange-300 to-orange-500', ring: 'border-orange-400/25 bg-orange-400/10', glow: '' },
  red: { text: 'text-red-300', bar: 'from-red-400 to-red-600', ring: 'border-red-500/25 bg-red-500/10', glow: 'group-hover:shadow-glow-red' },
  slate: { text: 'text-slate-300', bar: 'from-slate-400 to-slate-600', ring: 'border-slate-500/25 bg-slate-500/10', glow: '' },
};

export interface KpiCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  accent?: Accent;
  delta?: { value: number; direction: 'up' | 'down' | 'flat'; positiveIsGood?: boolean; label?: string };
  footer?: ReactNode;
  valueText?: string; // overrides numeric display (e.g. a category label)
  index?: number;
}

export function KpiCard({
  icon,
  label,
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  accent = 'command',
  delta,
  footer,
  valueText,
  index = 0,
}: KpiCardProps) {
  const a = accentMap[accent];

  const deltaGood =
    delta &&
    ((delta.direction === 'up' && delta.positiveIsGood) ||
      (delta.direction === 'down' && !delta.positiveIsGood));
  const deltaColor =
    delta?.direction === 'flat'
      ? 'text-slate-400'
      : deltaGood
        ? 'text-emerald-300'
        : 'text-red-300';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className={cn('group glass sheen relative overflow-hidden p-5 transition-shadow duration-300', a.glow)}
    >
      <div className={cn('absolute inset-x-0 top-0 h-px bg-gradient-to-r opacity-70', a.bar)} />
      <div className="flex items-start justify-between">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl border',
            a.ring,
            a.text,
          )}
        >
          {icon}
        </div>
        {delta && (
          <div className={cn('flex items-center gap-1 text-xs font-medium', deltaColor)}>
            {delta.direction === 'up' ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : delta.direction === 'down' ? (
              <ArrowDownRight className="h-3.5 w-3.5" />
            ) : (
              <Minus className="h-3.5 w-3.5" />
            )}
            <span className="data-num">
              {delta.value > 0 ? '+' : ''}
              {delta.value}
              {delta.label ?? ''}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="section-label">{label}</div>
        <div className="mt-1 flex items-baseline gap-1.5">
          {valueText ? (
            <span className={cn('text-3xl font-semibold tracking-tight text-white')}>
              {valueText}
            </span>
          ) : (
            <span className="data-num text-3xl font-semibold tracking-tight text-white">
              <AnimatedNumber value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
            </span>
          )}
        </div>
      </div>

      {footer && <div className="mt-3 border-t border-white/5 pt-3 text-xs text-slate-400">{footer}</div>}
    </motion.div>
  );
}
