'use client';

import { useMemo, useState } from 'react';
import { ArrowDownUp, ArrowDown, ArrowUp, Filter, Search } from 'lucide-react';
import { HealthBar, StatusBadge } from '@/components/ui';
import { assets, assetCategoryLabels } from '@/lib/data/assets';
import { floorName } from '@/lib/data/facility';
import {
  cn,
  healthColor,
  assetStatusMeta,
} from '@/lib/utils';
import type { AssetCategory, AssetStatus } from '@/lib/types';

type SortKey = 'health' | 'days' | 'tag';
type SortDir = 'asc' | 'desc';

const CATEGORY_OPTIONS: ('all' | AssetCategory)[] = [
  'all',
  ...(Object.keys(assetCategoryLabels) as AssetCategory[]),
];

const STATUS_OPTIONS: ('all' | AssetStatus)[] = [
  'all',
  'operational',
  'warning',
  'critical',
  'offline',
];

const SHORT_CATEGORY: Record<AssetCategory, string> = {
  HVAC: 'HVAC',
  UPS: 'UPS',
  Electrical: 'Electrical',
  FireSystem: 'Fire/Life Safety',
  Camera: 'Camera',
  AccessControl: 'Access Control',
  Sensor: 'Sensor',
  Network: 'Network',
};

/** Big sentinel so null predicted-failure values sort to the end. */
const NO_FAILURE = 1_000_000;

export function AssetHealthTable({ className }: { className?: string }) {
  const [category, setCategory] = useState<'all' | AssetCategory>('all');
  const [status, setStatus] = useState<'all' | AssetStatus>('all');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('health');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = assets.filter((a) => {
      if (category !== 'all' && a.category !== category) return false;
      if (status !== 'all' && a.status !== status) return false;
      if (q) {
        const hay = `${a.tag} ${a.name} ${a.model} ${a.manufacturer}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    return filtered.slice().sort((a, b) => {
      if (sortKey === 'health') {
        if (a.healthPct !== b.healthPct) return (a.healthPct - b.healthPct) * dir;
        return a.tag.localeCompare(b.tag);
      }
      if (sortKey === 'days') {
        const da = a.predictedFailureDays ?? NO_FAILURE;
        const db = b.predictedFailureDays ?? NO_FAILURE;
        if (da !== db) return (da - db) * dir;
        return a.tag.localeCompare(b.tag);
      }
      // tag
      return a.tag.localeCompare(b.tag) * dir;
    });
  }, [category, status, query, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      // sensible defaults: health asc (worst first), days asc (soonest first)
      setSortDir(key === 'tag' ? 'asc' : 'asc');
    }
  }

  const SortIcon = ({ active }: { active: boolean }) => {
    if (!active) return <ArrowDownUp className="h-3 w-3 text-slate-600" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-command-300" />
    ) : (
      <ArrowDown className="h-3 w-3 text-command-300" />
    );
  };

  const selectCls =
    'focus-ring rounded-lg border border-white/[0.06] bg-ink-850/60 px-3 py-1.5 text-xs text-slate-200 outline-none transition-colors hover:border-white/[0.12]';

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </span>
          <select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => setCategory(e.target.value as 'all' | AssetCategory)}
            className={selectCls}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c} className="bg-ink-900 text-slate-200">
                {c === 'all' ? 'All categories' : SHORT_CATEGORY[c]}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'all' | AssetStatus)}
            className={selectCls}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s} className="bg-ink-900 text-slate-200">
                {s === 'all' ? 'All statuses' : assetStatusMeta[s].label}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tag or name…"
              className="focus-ring w-48 rounded-lg border border-white/[0.06] bg-ink-850/60 py-1.5 pl-8 pr-3 text-xs text-slate-200 outline-none transition-colors placeholder:text-slate-600 hover:border-white/[0.12]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Sort</span>
          <button
            type="button"
            onClick={() => toggleSort('health')}
            className={cn(
              'chip transition-colors',
              sortKey === 'health'
                ? 'border-command-500/30 bg-command-500/10 text-command-200'
                : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:text-slate-200',
            )}
          >
            Health <SortIcon active={sortKey === 'health'} />
          </button>
          <button
            type="button"
            onClick={() => toggleSort('days')}
            className={cn(
              'chip transition-colors',
              sortKey === 'days'
                ? 'border-command-500/30 bg-command-500/10 text-command-200'
                : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:text-slate-200',
            )}
          >
            To failure <SortIcon active={sortKey === 'days'} />
          </button>
          <span className="hidden text-xs text-slate-500 sm:inline">
            <span className="data-num font-semibold text-slate-300">{rows.length}</span>
            <span className="text-slate-600"> / {assets.length}</span> assets
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.05]">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.015] text-[11px] uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2.5 font-medium">Tag</th>
              <th className="px-3 py-2.5 font-medium">Asset</th>
              <th className="px-3 py-2.5 font-medium">Category</th>
              <th className="px-3 py-2.5 font-medium">Floor</th>
              <th className="px-3 py-2.5 font-medium">
                <button
                  type="button"
                  onClick={() => toggleSort('health')}
                  className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-slate-300"
                >
                  Health <SortIcon active={sortKey === 'health'} />
                </button>
              </th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 text-right font-medium">
                <button
                  type="button"
                  onClick={() => toggleSort('days')}
                  className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-slate-300"
                >
                  To failure <SortIcon active={sortKey === 'days'} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const accent =
                a.status === 'critical'
                  ? 'bg-red-500/[0.04] hover:bg-red-500/[0.07]'
                  : a.status === 'offline'
                    ? 'bg-slate-500/[0.04] hover:bg-slate-500/[0.06]'
                    : 'hover:bg-white/[0.025]';
              const days = a.predictedFailureDays;
              return (
                <tr
                  key={a.id}
                  className={cn(
                    'border-b border-white/[0.04] text-sm transition-colors last:border-0',
                    accent,
                  )}
                >
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="data-num text-xs text-slate-400">{a.tag}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-slate-100">{a.name}</div>
                    <div className="text-[11px] text-slate-600">
                      {a.manufacturer} {a.model}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-400">
                    {SHORT_CATEGORY[a.category]}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-400">
                    {floorName(a.floorId)}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-24">
                        <HealthBar value={a.healthPct} color={healthColor(a.healthPct)} height={6} />
                      </div>
                      <span
                        className="data-num w-9 text-right text-xs font-semibold"
                        style={{ color: healthColor(a.healthPct) }}
                      >
                        {a.healthPct}%
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right">
                    <span
                      className={cn(
                        'data-num text-sm font-semibold',
                        days === null
                          ? 'text-slate-600'
                          : days <= 0
                            ? 'text-slate-400'
                            : days <= 7
                              ? 'text-red-300'
                              : days <= 21
                                ? 'text-amber-200'
                                : 'text-slate-300',
                      )}
                    >
                      {days === null ? '—' : days <= 0 ? 'Offline' : `${days}d`}
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-12 text-center">
                  <div className="text-sm text-slate-400">No assets match these filters</div>
                  <button
                    type="button"
                    onClick={() => {
                      setCategory('all');
                      setStatus('all');
                      setQuery('');
                    }}
                    className="mt-2 text-xs font-medium text-command-300 hover:text-command-200"
                  >
                    Reset filters
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
