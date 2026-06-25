import {
  Wrench,
  AlertTriangle,
  Activity,
  HeartPulse,
  ShieldCheck,
  Clock,
  Gauge,
  Lightbulb,
  Timer,
  CircleDollarSign,
  CalendarDays,
  User,
  Cpu,
} from 'lucide-react';
import {
  GlassCard,
  KpiCard,
  HealthBar,
  StatusBadge,
  SeverityBadge,
  LiveBadge,
  PageHeader,
  SectionTitle,
  FadeIn,
} from '@/components/ui';
import { CategoryBarChart } from '@/components/charts';
import { AssetHealthTable } from '@/components/maintenance/AssetHealthTable';
import { predictiveInsights, predictiveSummary } from '@/lib/ai';
import { maintenanceEvents } from '@/lib/data/maintenance';
import { assets, assetCounts } from '@/lib/data/assets';
import type { MaintenanceEvent, MaintenanceKind, MaintenanceStatus } from '@/lib/types';
import {
  cn,
  healthColor,
  formatNumber,
  formatDate,
  formatCurrency,
} from '@/lib/utils';

// ---------------------------------------------------------------------------
// Derived, deterministic view data
// ---------------------------------------------------------------------------

const priorityInsights = predictiveInsights.slice(0, 5);

// Health distribution bands across the full asset fleet.
const healthBands = [
  { name: 'Critical', range: '0–40', min: 0, max: 40, color: '#EF4444' },
  { name: 'Poor', range: '40–60', min: 40, max: 60, color: '#F97316' },
  { name: 'Fair', range: '60–80', min: 60, max: 80, color: '#F4C152' },
  { name: 'Good', range: '80–100', min: 80, max: 101, color: '#10B981' },
];

const healthDistribution = healthBands.map((b) => ({
  band: b.name,
  count: assets.filter((a) => a.healthPct >= b.min && a.healthPct < b.max).length,
  color: b.color,
}));

const bandColorByName: Record<string, string> = Object.fromEntries(
  healthDistribution.map((d) => [d.band, d.color]),
);

// Status breakdown for the small legend under the chart.
const statusBreakdown: { label: string; key: string; count: number; dot: string }[] = [
  { label: 'Operational', key: 'operational', count: assetCounts.online - assetCounts.warning - assetCounts.critical, dot: 'bg-emerald-500' },
  { label: 'Warning', key: 'warning', count: assetCounts.warning, dot: 'bg-amber-400' },
  { label: 'Critical', key: 'critical', count: assetCounts.critical, dot: 'bg-red-500' },
  { label: 'Offline', key: 'offline', count: assetCounts.offline, dot: 'bg-slate-500' },
];

// Work orders sorted: overdue → in_progress → scheduled → completed, then by date.
const statusOrder: Record<MaintenanceStatus, number> = {
  overdue: 0,
  in_progress: 1,
  scheduled: 2,
  completed: 3,
};

const sortedWorkOrders = maintenanceEvents
  .slice()
  .sort((a, b) => {
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
  });

const openWorkOrders = maintenanceEvents.filter((m) => m.status !== 'completed').length;
const overdueWorkOrders = maintenanceEvents.filter((m) => m.status === 'overdue').length;

const kindMeta: Record<MaintenanceKind, { label: string; cls: string }> = {
  predictive: { label: 'Predictive', cls: 'border-cognition-500/30 bg-cognition-500/10 text-cognition-300' },
  preventive: { label: 'Preventive', cls: 'border-command-500/30 bg-command-500/10 text-command-200' },
  corrective: { label: 'Corrective', cls: 'border-orange-400/30 bg-orange-400/10 text-orange-200' },
};

const mxStatusMeta: Record<MaintenanceStatus, { label: string; cls: string }> = {
  overdue: { label: 'Overdue', cls: 'border-red-500/30 bg-red-500/10 text-red-300' },
  in_progress: { label: 'In progress', cls: 'border-amber-400/30 bg-amber-400/10 text-amber-200' },
  scheduled: { label: 'Scheduled', cls: 'border-white/10 bg-white/[0.04] text-slate-300' },
  completed: { label: 'Completed', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
};

function daysLabel(days: number | null) {
  if (days === null) return '—';
  if (days <= 0) return 'Offline';
  return `${days}d`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PredictiveMaintenancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Module 05 · Predictive Maintenance"
        title="Predictive Maintenance"
        subtitle="AI-driven asset health, failure forecasting and work-order orchestration across the facility fleet — catching faults before they become outages."
        icon={<Wrench className="h-5 w-5" />}
        actions={<LiveBadge />}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard
          index={0}
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Assets at Risk"
          value={predictiveSummary.atRisk}
          accent="amber"
          footer={
            <span className="text-slate-400">
              {predictiveSummary.critical} in critical state
            </span>
          }
        />
        <KpiCard
          index={1}
          icon={<Clock className="h-5 w-5" />}
          label="Predicted Failures < 7d"
          value={predictiveSummary.within7Days}
          accent="red"
          footer={<span className="text-red-300">Immediate intervention window</span>}
        />
        <KpiCard
          index={2}
          icon={<HeartPulse className="h-5 w-5" />}
          label="Avg Fleet Health"
          value={predictiveSummary.avgHealth}
          suffix="%"
          accent="emerald"
          footer={
            <span className="text-slate-400">
              Across {assetCounts.total} monitored assets
            </span>
          }
        />
        <KpiCard
          index={3}
          icon={<ShieldCheck className="h-5 w-5" />}
          label="Downtime Exposure Mitigated"
          value={predictiveSummary.totalCostAvoided}
          prefix="$"
          accent="command"
          footer={<span className="text-emerald-300">Cost avoided by acting early</span>}
        />
      </div>

      {/* Priority predictions + Health distribution */}
      <div className="grid grid-cols-12 gap-4">
        {/* Priority predictions */}
        <GlassCard className="col-span-12 lg:col-span-7" hover>
          <SectionTitle
            title="Priority Predictions"
            hint="Highest-urgency assets ranked by predicted failure window"
            right={
              <span className="chip border-cognition-500/30 bg-cognition-500/10 text-cognition-300">
                <Cpu className="h-3 w-3" /> AI ranked
              </span>
            }
          />
          <div className="space-y-3">
            {priorityInsights.map((p) => {
              const days = p.predictedFailureDays;
              const imminent = days !== null && days <= 7;
              return (
                <div
                  key={p.assetId}
                  className={cn(
                    'rounded-xl border bg-white/[0.015] p-4 transition-colors hover:bg-white/[0.03]',
                    imminent ? 'border-red-500/20' : 'border-white/[0.05]',
                  )}
                >
                  {/* Header row */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="data-num text-xs text-slate-500">{p.assetTag}</span>
                        <span className="truncate text-sm font-semibold text-slate-100">
                          {p.assetName}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">{p.floorName}</div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>

                  {/* Metrics row */}
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="sm:col-span-2">
                      <div className="mb-1 flex items-center justify-between text-[11px]">
                        <span className="uppercase tracking-wider text-slate-500">Health</span>
                        <span
                          className="data-num font-semibold"
                          style={{ color: healthColor(p.healthPct) }}
                        >
                          {p.healthPct}%
                        </span>
                      </div>
                      <HealthBar value={p.healthPct} color={healthColor(p.healthPct)} height={6} />
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-slate-500">
                        To failure
                      </div>
                      <div
                        className={cn(
                          'data-num mt-0.5 text-base font-semibold',
                          imminent ? 'text-red-300' : 'text-slate-200',
                        )}
                      >
                        {daysLabel(days)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-slate-500">
                        Failure prob.
                      </div>
                      <div className="data-num mt-0.5 text-base font-semibold text-slate-200">
                        {Math.round(p.failureProbability * 100)}%
                      </div>
                    </div>
                  </div>

                  {/* Recommendation callout */}
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] p-2.5">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                    <p className="text-xs leading-relaxed text-amber-100/90">{p.recommendation}</p>
                  </div>

                  {/* Driver signals */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {p.driverSignals.map((s) => (
                      <span
                        key={s}
                        className="chip border-white/[0.06] bg-white/[0.03] text-[11px] text-slate-400"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Footer impact */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-white/[0.05] pt-2.5 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Timer className="h-3.5 w-3.5" />
                      Est. downtime{' '}
                      <span className="data-num font-semibold text-slate-300">
                        {p.estimatedDowntimeHours}h
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <CircleDollarSign className="h-3.5 w-3.5" />
                      Exposure mitigated{' '}
                      <span className="data-num font-semibold text-emerald-300">
                        ${formatNumber(p.costAvoided)}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Health distribution */}
        <GlassCard className="col-span-12 lg:col-span-5" hover>
          <SectionTitle
            title="Health Distribution"
            hint={`Fleet of ${assetCounts.total} assets bucketed by health band`}
            right={
              <span className="chip border-white/[0.06] bg-white/[0.02] text-slate-400">
                <Gauge className="h-3 w-3" /> {predictiveSummary.avgHealth}% avg
              </span>
            }
          />
          <CategoryBarChart
            data={healthDistribution}
            xKey="band"
            barKey="count"
            barLabel="Assets"
            colors={healthDistribution.map((d) => d.color)}
            height={220}
            unit=" assets"
          />
          {/* Band legend */}
          <div className="mt-2 grid grid-cols-2 gap-2">
            {healthDistribution.map((d) => (
              <div
                key={d.band}
                className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.015] px-2.5 py-1.5"
              >
                <span className="flex items-center gap-2 text-xs text-slate-400">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: bandColorByName[d.band] }}
                  />
                  {d.band}
                </span>
                <span className="data-num text-xs font-semibold text-slate-200">{d.count}</span>
              </div>
            ))}
          </div>

          {/* Status breakdown */}
          <div className="mt-4 border-t border-white/[0.05] pt-3">
            <div className="section-label mb-2 text-slate-500">Operational Status</div>
            <div className="space-y-1.5">
              {statusBreakdown.map((s) => (
                <div key={s.key} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-400">
                    <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
                    {s.label}
                  </span>
                  <span className="data-num font-semibold text-slate-200">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Full fleet table */}
      <FadeIn>
        <GlassCard>
          <SectionTitle
            title="Asset Fleet Health"
            hint="Filter, search and sort the complete monitored asset inventory"
            right={
              <span className="chip border-white/[0.06] bg-white/[0.02] text-slate-400">
                <Activity className="h-3 w-3" /> {assetCounts.online}/{assetCounts.total} online
              </span>
            }
          />
          <AssetHealthTable />
        </GlassCard>
      </FadeIn>

      {/* Work orders */}
      <GlassCard>
        <SectionTitle
          title="Work Orders"
          hint={`${openWorkOrders} open · ${overdueWorkOrders} overdue · ${maintenanceEvents.length} total`}
          right={
            overdueWorkOrders > 0 ? (
              <span className="chip border-red-500/30 bg-red-500/10 text-red-300">
                <AlertTriangle className="h-3 w-3" /> {overdueWorkOrders} overdue
              </span>
            ) : undefined
          }
        />
        <div className="space-y-2.5">
          {sortedWorkOrders.map((wo: MaintenanceEvent) => {
            const km = kindMeta[wo.kind];
            const sm = mxStatusMeta[wo.status];
            const completed = wo.status === 'completed';
            return (
              <div
                key={wo.id}
                className={cn(
                  'rounded-xl border p-3.5 transition-colors hover:bg-white/[0.025]',
                  wo.status === 'overdue'
                    ? 'border-red-500/20 bg-red-500/[0.04]'
                    : 'border-white/[0.05] bg-white/[0.015]',
                  completed && 'opacity-70',
                )}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  {/* Left: badges + title */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('chip', km.cls)}>{km.label}</span>
                      <span className={cn('chip', sm.cls)}>{sm.label}</span>
                      <SeverityBadge severity={wo.priority} />
                    </div>
                    <div
                      className={cn(
                        'mt-1.5 text-sm font-medium text-slate-100',
                        completed && 'line-through decoration-slate-600',
                      )}
                    >
                      {wo.title}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      <span className="text-slate-400">{wo.assetName}</span> · {wo.description}
                    </div>
                  </div>

                  {/* Right: meta */}
                  <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1.5 text-xs lg:justify-end">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span
                        className={cn(
                          wo.status === 'overdue' ? 'text-red-300' : 'text-slate-300',
                        )}
                      >
                        {formatDate(wo.scheduledDate)}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <User className="h-3.5 w-3.5" />
                      <span className="text-slate-300">{wo.technician ?? 'Unassigned'}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Timer className="h-3.5 w-3.5" />
                      <span className="data-num text-slate-300">{wo.estimatedHours}h</span>
                    </span>
                    <span className="data-num min-w-[64px] text-right font-semibold text-slate-200">
                      {formatCurrency(wo.costEstimate)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
