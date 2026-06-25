'use client';

import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { GlassCard, SectionTitle } from '@/components/ui';
import {
  TrendAreaChart,
  TrendLineChart,
  CategoryBarChart,
  DonutChart,
} from '@/components/charts';
import {
  riskTrend,
  alarmTrend,
  energyTrend,
  assetHealthTrend,
  trendOverview,
  energyBreakdown,
  occupancyHourly,
} from '@/lib/data/telemetry';
import { alarmsByType } from '@/lib/data/alarms';
import { assetCounts, assetCategoryLabels } from '@/lib/data/assets';
import type { AssetCategory } from '@/lib/types';
import { cn, formatKwh, formatNumber } from '@/lib/utils';

type Period = 7 | 30;

// ---- color tokens -----------------------------------------------------------
const C = {
  risk: '#F97316',
  alarms: '#06AEDB',
  energy: '#06AEDB',
  health: '#10B981',
  occupancy: '#8B5CF6',
};

const energyMixColors: Record<string, string> = {
  'HVAC & Cooling': '#06AEDB',
  'IT & Data Center': '#8B5CF6',
  Lighting: '#F4C152',
  'Security & Other': '#64748B',
};

const categoryColors: Record<AssetCategory, string> = {
  HVAC: '#06AEDB',
  UPS: '#F97316',
  Electrical: '#F4C152',
  FireSystem: '#EF4444',
  Camera: '#8B5CF6',
  AccessControl: '#22D3EE',
  Sensor: '#10B981',
  Network: '#64748B',
};

function lastN<T>(arr: T[], n: number): T[] {
  return arr.slice(Math.max(0, arr.length - n));
}

function trendMeta(arr: { value: number }[]) {
  if (arr.length < 2) return { latest: arr[0]?.value ?? 0, delta: 0, pct: 0 };
  const latest = arr[arr.length - 1].value;
  const prev = arr[arr.length - 2].value;
  const delta = latest - prev;
  const pct = prev !== 0 ? (delta / prev) * 100 : 0;
  return { latest, delta, pct };
}

function DeltaChip({
  value,
  positiveIsGood,
  suffix = '',
  format,
}: {
  value: number;
  positiveIsGood: boolean;
  suffix?: string;
  format?: (n: number) => string;
}) {
  const dir = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  const good =
    dir === 'flat' ? true : positiveIsGood ? value > 0 : value < 0;
  const Icon = dir === 'up' ? TrendingUp : dir === 'down' ? TrendingDown : Minus;
  const shown = format ? format(Math.abs(value)) : formatNumber(Math.abs(value), 1);
  return (
    <span
      className={cn(
        'chip',
        dir === 'flat'
          ? 'border-white/10 bg-white/[0.04] text-slate-400'
          : good
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            : 'border-orange-400/30 bg-orange-400/10 text-orange-200',
      )}
    >
      <Icon className="h-3 w-3" />
      {value > 0 ? '+' : value < 0 ? '−' : ''}
      {shown}
      {suffix}
    </span>
  );
}

function ValueChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="chip border-white/10 bg-white/[0.04] text-slate-200">
      {children}
    </span>
  );
}

export function DashboardCharts() {
  const [period, setPeriod] = useState<Period>(30);

  const risk = useMemo(() => lastN(riskTrend, period), [period]);
  const alarm = useMemo(() => lastN(alarmTrend, period), [period]);
  const energy = useMemo(() => lastN(energyTrend, period), [period]);
  const health = useMemo(() => lastN(assetHealthTrend, period), [period]);
  const overview = useMemo(() => lastN(trendOverview, period), [period]);

  const riskM = trendMeta(risk);
  const alarmM = trendMeta(alarm);
  const energyM = trendMeta(energy);
  const healthM = trendMeta(health);

  const xInterval = period === 30 ? 4 : 1;

  const energyTotal = energyBreakdown.reduce((s, r) => s + r.kwh, 0);
  const energyDonut = energyBreakdown.map((r) => ({
    name: r.category,
    value: r.kwh,
    color: energyMixColors[r.category] ?? '#64748B',
  }));

  const byTypeData = useMemo(
    () =>
      alarmsByType()
        .map((t) => ({
          type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
          count: t.count,
          active: t.active,
        }))
        .sort((a, b) => b.count - a.count),
    [],
  );

  const assetDonut = useMemo(
    () =>
      (Object.entries(assetCounts.byCategory) as [AssetCategory, number][])
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, v]) => ({
          name: assetCategoryLabels[cat],
          value: v,
          color: categoryColors[cat],
        })),
    [],
  );

  return (
    <div className="space-y-6">
      {/* Period toggle */}
      <div className="flex items-center justify-between">
        <span className="section-label text-slate-500">Operational Trends</span>
        <div className="inline-flex items-center rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
          {([7, 30] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                'focus-ring rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                period === p
                  ? 'bg-command-500/15 text-command-200 shadow-glow'
                  : 'text-slate-400 hover:text-slate-200',
              )}
            >
              Last {p} days
            </button>
          ))}
        </div>
      </div>

      {/* 2x2 primary trends */}
      <div className="grid grid-cols-12 gap-4">
        <GlassCard className="col-span-12 lg:col-span-6" hover>
          <SectionTitle
            title="Facility Risk Index"
            hint={`${period}-day composite risk score`}
            right={
              <div className="flex items-center gap-2">
                <ValueChip>
                  <span className="data-num">{Math.round(riskM.latest)}</span> / 100
                </ValueChip>
                <DeltaChip
                  value={riskM.delta}
                  positiveIsGood={false}
                  format={(n) => Math.round(n).toString()}
                />
              </div>
            }
          />
          <TrendLineChart
            data={risk}
            xKey="date"
            height={220}
            yDomain={[0, 100]}
            series={[{ key: 'value', label: 'Risk Index', color: C.risk }]}
          />
        </GlassCard>

        <GlassCard className="col-span-12 lg:col-span-6" hover>
          <SectionTitle
            title="Alarm Volume"
            hint={`Daily alarms raised over ${period} days`}
            right={
              <div className="flex items-center gap-2">
                <ValueChip>
                  <span className="data-num">{alarmM.latest}</span> today
                </ValueChip>
                <DeltaChip
                  value={alarmM.delta}
                  positiveIsGood={false}
                  format={(n) => Math.round(n).toString()}
                />
              </div>
            }
          />
          <CategoryBarChart
            data={alarm}
            xKey="date"
            barKey="value"
            barLabel="Alarms"
            color={C.alarms}
            height={220}
          />
        </GlassCard>

        <GlassCard className="col-span-12 lg:col-span-6" hover>
          <SectionTitle
            title="Energy Consumption"
            hint={`Daily draw in MWh over ${period} days`}
            right={
              <div className="flex items-center gap-2">
                <ValueChip>
                  <span className="data-num">{formatNumber(energyM.latest, 1)}</span> MWh
                </ValueChip>
                <DeltaChip value={energyM.pct} positiveIsGood={false} suffix="%" />
              </div>
            }
          />
          <TrendAreaChart
            data={energy}
            xKey="date"
            height={220}
            unit=" MWh"
            xInterval={xInterval}
            series={[{ key: 'value', label: 'Energy (MWh)', color: C.energy }]}
          />
        </GlassCard>

        <GlassCard className="col-span-12 lg:col-span-6" hover>
          <SectionTitle
            title="Average Asset Health"
            hint={`Fleet health trend over ${period} days`}
            right={
              <div className="flex items-center gap-2">
                <ValueChip>
                  <span className="data-num">{formatNumber(healthM.latest, 1)}</span>%
                </ValueChip>
                <DeltaChip value={healthM.delta} positiveIsGood suffix=" pts" />
              </div>
            }
          />
          <TrendLineChart
            data={health}
            xKey="date"
            height={220}
            yDomain={[70, 100]}
            series={[{ key: 'value', label: 'Avg Health %', color: C.health }]}
          />
        </GlassCard>
      </div>

      {/* Combined overview — full width */}
      <GlassCard className="col-span-12" hover>
        <SectionTitle
          title="Risk vs Asset Health — Correlated View"
          hint="Rising risk tracks declining fleet health"
          right={
            <div className="hidden items-center gap-3 sm:flex">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: C.risk }} />
                Risk Index
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: C.health }} />
                Avg Health %
              </span>
            </div>
          }
        />
        <TrendAreaChart
          data={overview}
          xKey="label"
          height={300}
          xInterval={xInterval}
          series={[
            { key: 'risk', label: 'Risk Index', color: C.risk },
            { key: 'health', label: 'Avg Health %', color: C.health },
          ]}
        />
      </GlassCard>

      {/* Distribution row */}
      <div className="grid grid-cols-12 gap-4">
        <GlassCard className="col-span-12 lg:col-span-4" hover>
          <SectionTitle
            title="Energy Mix"
            hint="24h consumption by system"
            right={<ValueChip>{energyBreakdown.length} systems</ValueChip>}
          />
          <DonutChart
            data={energyDonut}
            height={240}
            centerLabel="total 24h"
            centerValue={formatKwh(energyTotal)}
            unit=" kWh"
            valueFormatter={(v) => formatNumber(v)}
          />
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-white/5 pt-3">
            {energyBreakdown.map((r) => (
              <div key={r.category} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-300">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: energyMixColors[r.category] ?? '#64748B' }}
                  />
                  <span className="truncate">{r.category}</span>
                </span>
                <span className="data-num shrink-0 text-slate-400">{r.pctOfTotal}%</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 lg:col-span-4" hover>
          <SectionTitle
            title="Alarms by Type"
            hint="Last 24h across all sources"
            right={
              <ValueChip>
                <span className="data-num">
                  {byTypeData.reduce((s, t) => s + t.count, 0)}
                </span>{' '}
                total
              </ValueChip>
            }
          />
          <CategoryBarChart
            data={byTypeData}
            xKey="type"
            barKey="count"
            barLabel="Alarms"
            layout="vertical"
            color="#06AEDB"
            colorByValue={(v) => (v >= 3 ? '#F97316' : v >= 2 ? '#F4C152' : '#06AEDB')}
            height={240}
          />
        </GlassCard>

        <GlassCard className="col-span-12 lg:col-span-4" hover>
          <SectionTitle
            title="Assets by Category"
            hint={`${assetCounts.total} monitored assets`}
            right={
              <ValueChip>
                <span className="data-num">{assetCounts.online}</span> online
              </ValueChip>
            }
          />
          <DonutChart
            data={assetDonut}
            height={240}
            centerLabel="assets"
            centerValue={String(assetCounts.total)}
          />
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-white/5 pt-3">
            {assetDonut.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-300">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="truncate">{d.name}</span>
                </span>
                <span className="data-num shrink-0 text-slate-400">{d.value}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* 24h occupancy — full width */}
      <GlassCard className="col-span-12" hover>
        <SectionTitle
          title="Building Occupancy — 24 Hour Profile"
          hint="People on-site by hour, building-wide"
          right={
            <ValueChip>
              peak{' '}
              <span className="data-num">
                {formatNumber(Math.max(...occupancyHourly.map((o) => o.value)))}
              </span>
            </ValueChip>
          }
        />
        <TrendAreaChart
          data={occupancyHourly}
          xKey="date"
          height={220}
          unit=" people"
          xInterval={2}
          valueFormatter={(v) => formatNumber(v)}
          series={[{ key: 'value', label: 'Occupancy', color: C.occupancy }]}
        />
      </GlassCard>
    </div>
  );
}
