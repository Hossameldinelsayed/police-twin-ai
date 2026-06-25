import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type {
  AssetStatus,
  RiskCategory,
  Severity,
} from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Fixed reference clock so the demo is deterministic (no SSR hydration drift).
export const NOW_ISO = '2026-06-24T14:30:00.000Z';
export const NOW = new Date(NOW_ISO);

/** Deterministic seeded PRNG (mulberry32). Same seed -> same stream. */
export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function round(n: number, dp = 0) {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}

export function formatNumber(n: number, dp = 0) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

export function formatKwh(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)} MWh`;
  return `${formatNumber(n)} kWh`;
}

export function formatCurrency(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${formatNumber(n)}`;
}

/** Human relative time vs the fixed NOW. */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = NOW.getTime() - then;
  const min = Math.round(diffMs / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function isoMinusHours(hours: number): string {
  return new Date(NOW.getTime() - hours * 3600_000).toISOString();
}

export function isoPlusDays(days: number): string {
  return new Date(NOW.getTime() + days * 86_400_000).toISOString();
}

export function isoMinusDays(days: number): string {
  return new Date(NOW.getTime() - days * 86_400_000).toISOString();
}

// ----------------------------- Style maps -----------------------------------

export const severityMeta: Record<
  Severity,
  { label: string; text: string; bg: string; border: string; dot: string }
> = {
  critical: {
    label: 'Critical',
    text: 'text-red-300',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    dot: 'bg-red-500',
  },
  high: {
    label: 'High',
    text: 'text-orange-300',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    dot: 'bg-orange-500',
  },
  medium: {
    label: 'Medium',
    text: 'text-amber-200',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/30',
    dot: 'bg-amber-400',
  },
  low: {
    label: 'Low',
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
};

export const assetStatusMeta: Record<
  AssetStatus,
  { label: string; text: string; bg: string; border: string; dot: string; hex: string }
> = {
  operational: {
    label: 'Operational',
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-500',
    hex: '#10B981',
  },
  warning: {
    label: 'Warning',
    text: 'text-amber-200',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/30',
    dot: 'bg-amber-400',
    hex: '#F4C152',
  },
  critical: {
    label: 'Critical',
    text: 'text-red-300',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    dot: 'bg-red-500',
    hex: '#EF4444',
  },
  offline: {
    label: 'Offline',
    text: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    dot: 'bg-slate-500',
    hex: '#64748B',
  },
};

export function riskCategoryMeta(category: RiskCategory) {
  switch (category) {
    case 'Low':
      return { hex: '#10B981', text: 'text-emerald-300', glow: 'shadow-[0_0_30px_-6px_rgba(16,185,129,0.5)]' };
    case 'Guarded':
      return { hex: '#3BC9A0', text: 'text-teal-300', glow: 'shadow-[0_0_30px_-6px_rgba(59,201,160,0.5)]' };
    case 'Elevated':
      return { hex: '#F4C152', text: 'text-amber-200', glow: 'shadow-[0_0_30px_-6px_rgba(244,193,82,0.5)]' };
    case 'High':
      return { hex: '#F97316', text: 'text-orange-300', glow: 'shadow-[0_0_30px_-6px_rgba(249,115,22,0.55)]' };
    case 'Severe':
      return { hex: '#EF4444', text: 'text-red-300', glow: 'shadow-[0_0_34px_-6px_rgba(239,68,68,0.6)]' };
  }
}

export function riskCategoryFromScore(score: number): RiskCategory {
  if (score < 22) return 'Low';
  if (score < 40) return 'Guarded';
  if (score < 58) return 'Elevated';
  if (score < 78) return 'High';
  return 'Severe';
}

export function healthColor(pct: number): string {
  if (pct >= 80) return '#10B981';
  if (pct >= 60) return '#F4C152';
  if (pct >= 40) return '#F97316';
  return '#EF4444';
}
