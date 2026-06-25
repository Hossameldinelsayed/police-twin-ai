import Link from 'next/link';
import {
  Gauge,
  BellRing,
  Zap,
  Users,
  ShieldCheck,
  ShieldAlert,
  Wrench,
  Brain,
  ArrowRight,
  Boxes,
  Activity,
  TrendingUp,
  Video,
  DoorClosed,
  Flame,
  Radio,
  Network,
  Building2,
} from 'lucide-react';
import {
  GlassCard,
  KpiCard,
  RiskGauge,
  HealthBar,
  LiveBadge,
  PageHeader,
  SectionTitle,
  FadeIn,
} from '@/components/ui';
import { TrendAreaChart } from '@/components/charts';
import { AlarmFeed } from '@/components/panels/AlarmFeed';
import { FacilityLocator } from '@/components/geo/FacilityLocator';
import { kpiSummary, riskAssessment, predictiveInsights, predictiveSummary } from '@/lib/ai';
import { activeAlarms } from '@/lib/data/alarms';
import {
  energyReadings,
  currentPowerKw,
  energyTodayKwh,
  energyDeltaPct,
  occupancyByFloor,
} from '@/lib/data/telemetry';
import { floors } from '@/lib/data/facility';
import { assetCounts } from '@/lib/data/assets';
import { navItems } from '@/lib/nav';
import {
  formatNumber,
  formatKwh,
  formatTime,
  riskCategoryMeta,
  healthColor,
  NOW_ISO,
  cn,
} from '@/lib/utils';

const domainColor: Record<string, string> = {
  equipment: '#06AEDB',
  security: '#EF4444',
  energy: '#F4C152',
  occupancy: '#8B5CF6',
};

export default function CommandCenterPage() {
  const riskMeta = riskCategoryMeta(kpiSummary.riskCategory);
  const topRec = riskAssessment.recommendations[0];
  const topAssets = predictiveInsights.slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Module 01 | Executive Command Center"
        title="Situational Overview"
        subtitle="Real-time facility intelligence across security, energy, occupancy and infrastructure for Central Command HQ."
        icon={<Gauge className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <LiveBadge />
            <span className="hidden rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-slate-400 sm:inline-flex">
              Synced | {formatTime(NOW_ISO)} GST
            </span>
          </div>
        }
      />

      {/* AI insight banner */}
      <FadeIn>
        <div className="glass sheen relative overflow-hidden p-5 shadow-glow-violet">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cognition-500/[0.08] via-transparent to-command-500/[0.06]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cognition-500/30 bg-cognition-500/10 text-cognition-300 shadow-glow-violet">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="section-label text-cognition-300/90">AI Situation Brief</span>
                  <span className="chip border-cognition-500/30 bg-cognition-500/10 text-cognition-300">
                    {Math.round(riskAssessment.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="max-w-3xl text-sm leading-relaxed text-slate-200">
                  {riskAssessment.summary}
                </p>
                {topRec && (
                  <p className="mt-2 text-sm text-slate-400">
                    <span className="font-medium text-amber-200">Priority action:</span>{' '}
                    {topRec.action} <span className="text-slate-500">({topRec.impact})</span>
                  </p>
                )}
              </div>
            </div>
            <Link
              href="/copilot"
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-cognition-500/30 bg-cognition-500/10 px-4 py-2.5 text-sm font-medium text-cognition-200 transition-all hover:bg-cognition-500/20 hover:shadow-glow-violet lg:self-center"
            >
              Ask the Copilot <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </FadeIn>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          index={0}
          icon={<Gauge className="h-5 w-5" />}
          label="Facility Risk"
          value={kpiSummary.riskScore}
          accent={kpiSummary.riskCategory === 'High' || kpiSummary.riskCategory === 'Severe' ? 'red' : 'amber'}
          delta={{ value: kpiSummary.riskDelta, direction: 'up', positiveIsGood: false, label: ' pts' }}
          footer={<span className={riskMeta.text}>{kpiSummary.riskCategory} | 7-day trend</span>}
        />
        <KpiCard
          index={1}
          icon={<BellRing className="h-5 w-5" />}
          label="Active Alarms"
          value={kpiSummary.activeAlarms}
          accent="orange"
          footer={
            <span className="text-red-300">
              {kpiSummary.criticalAlarms} critical / high priority
            </span>
          }
        />
        <KpiCard
          index={2}
          icon={<Zap className="h-5 w-5" />}
          label="Energy Today"
          value={energyTodayKwh}
          suffix=" kWh"
          accent="command"
          delta={{ value: energyDeltaPct, direction: energyDeltaPct >= 0 ? 'up' : 'down', positiveIsGood: false, label: '%' }}
          footer={<span>Live draw {formatNumber(currentPowerKw)} kW</span>}
        />
        <KpiCard
          index={3}
          icon={<Users className="h-5 w-5" />}
          label="Occupancy"
          value={kpiSummary.occupancyPct}
          suffix="%"
          accent="violet"
          footer={
            <span>
              {formatNumber(kpiSummary.occupancyCount)} / {formatNumber(kpiSummary.occupancyCapacity)} capacity
            </span>
          }
        />
        <KpiCard
          index={4}
          icon={kpiSummary.securityStatus === 'secure' ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
          label="Security Status"
          value={0}
          valueText={kpiSummary.securityStatus === 'secure' ? 'Secure' : kpiSummary.securityStatus === 'elevated' ? 'Elevated' : 'Breach'}
          accent={kpiSummary.securityStatus === 'secure' ? 'emerald' : kpiSummary.securityStatus === 'elevated' ? 'amber' : 'red'}
          footer={<span>{kpiSummary.securityDetail}</span>}
        />
        <KpiCard
          index={5}
          icon={<Wrench className="h-5 w-5" />}
          label="Maintenance"
          value={kpiSummary.maintenanceAlerts}
          accent="amber"
          footer={
            <span className={kpiSummary.maintenanceOverdue > 0 ? 'text-red-300' : ''}>
              {kpiSummary.maintenanceOverdue} overdue | {predictiveSummary.within7Days} predicted &lt;7d
            </span>
          }
        />
      </div>

      {/* Risk + Energy + Alarms */}
      <div className="grid grid-cols-12 gap-4">
        {/* Risk overview */}
        <GlassCard className="col-span-12 lg:col-span-4" hover>
          <SectionTitle
            title="AI Risk Breakdown"
            hint="Weighted composite across 4 domains"
            right={
              <Link href="/risk-engine" className="text-xs font-medium text-command-300 hover:text-command-200">
                Details
              </Link>
            }
          />
          <div className="flex flex-col items-center gap-5">
            <RiskGauge score={riskAssessment.score} category={riskAssessment.category} size={200} />
            <div className="w-full space-y-3">
              {riskAssessment.factors.map((f) => (
                <div key={f.domain}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-300">{f.label}</span>
                    <span className="data-num text-slate-400">
                      {f.score} <span className="text-slate-600"> | {f.contribution}pt</span>
                    </span>
                  </div>
                  <HealthBar value={f.score} color={domainColor[f.domain]} height={6} />
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Energy & environment */}
        <GlassCard className="col-span-12 lg:col-span-5" hover>
          <SectionTitle
            title="Energy & Environment"
            hint="24h consumption vs AI baseline"
            right={
              <span className="chip border-amber-400/30 bg-amber-400/10 text-amber-200">
                <TrendingUp className="h-3 w-3" /> {energyDeltaPct >= 0 ? '+' : ''}
                {energyDeltaPct}% vs baseline
              </span>
            }
          />
          <TrendAreaChart
            data={energyReadings}
            xKey="timestamp"
            height={210}
            unit=" kWh"
            series={[
              { key: 'kwh', label: 'Actual', color: '#06AEDB' },
              { key: 'baseline', label: 'AI Baseline', color: '#64748B' },
            ]}
          />
          <div className="mt-3 grid grid-cols-3 gap-3 border-t border-white/5 pt-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Live Draw</div>
              <div className="data-num mt-0.5 text-lg font-semibold text-white">
                {formatNumber(currentPowerKw)} <span className="text-sm text-slate-500">kW</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Today</div>
              <div className="data-num mt-0.5 text-lg font-semibold text-white">{formatKwh(energyTodayKwh)}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Anomaly</div>
              <div className="mt-0.5 text-lg font-semibold text-amber-200">HVAC plant</div>
            </div>
          </div>
        </GlassCard>

        {/* Active alarms */}
        <GlassCard className="col-span-12 lg:col-span-3" hover>
          <SectionTitle
            title="Active Alarms"
            hint={`${activeAlarms.length} requiring attention`}
            right={
              <Link href="/emergency" className="text-xs font-medium text-command-300 hover:text-command-200">
                Respond
              </Link>
            }
          />
          <div className="max-h-[360px] overflow-y-auto pr-1">
            <AlarmFeed alarms={activeAlarms} limit={6} />
          </div>
        </GlassCard>
      </div>

      {/* Predictive + Occupancy */}
      <div className="grid grid-cols-12 gap-4">
        <GlassCard className="col-span-12 lg:col-span-8" hover>
          <SectionTitle
            title="Predictive Maintenance - Priority Assets"
            hint={`${predictiveSummary.within7Days} predicted failures within 7 days`}
            right={
              <Link href="/predictive-maintenance" className="text-xs font-medium text-command-300 hover:text-command-200">
                All assets
              </Link>
            }
          />
          <div className="space-y-2">
            {topAssets.map((p) => (
              <div
                key={p.assetId}
                className="grid grid-cols-12 items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] p-3"
              >
                <div className="col-span-12 sm:col-span-5">
                  <div className="flex items-center gap-2">
                    <span className="data-num text-xs text-slate-500">{p.assetTag}</span>
                    <span className="truncate text-sm font-medium text-slate-100">{p.assetName}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">{p.floorName}</div>
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Health</span>
                    <span className="data-num font-semibold" style={{ color: healthColor(p.healthPct) }}>
                      {p.healthPct}%
                    </span>
                  </div>
                  <HealthBar value={p.healthPct} color={healthColor(p.healthPct)} height={6} />
                </div>
                <div className="col-span-6 sm:col-span-2 text-center">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500">To failure</div>
                  <div
                    className={cn(
                      'data-num text-sm font-semibold',
                      p.predictedFailureDays !== null && p.predictedFailureDays <= 7 ? 'text-red-300' : 'text-slate-200',
                    )}
                  >
                    {p.predictedFailureDays === null
                      ? '-'
                      : p.predictedFailureDays <= 0
                        ? 'Offline'
                        : `${p.predictedFailureDays}d`}
                  </div>
                </div>
                <div className="col-span-12 sm:col-span-2 sm:text-right">
                  <span
                    className={cn(
                      'chip',
                      p.status === 'critical'
                        ? 'border-red-500/30 bg-red-500/10 text-red-300'
                        : p.status === 'offline'
                          ? 'border-slate-500/30 bg-slate-500/10 text-slate-400'
                          : 'border-amber-400/30 bg-amber-400/10 text-amber-200',
                    )}
                  >
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-xs">
            <span className="text-slate-500">
              Avg fleet health <span className="data-num font-semibold text-slate-300">{predictiveSummary.avgHealth}%</span>
            </span>
            <span className="text-emerald-300">
              ${formatNumber(predictiveSummary.totalCostAvoided)} downtime exposure mitigated
            </span>
          </div>
        </GlassCard>

        {/* Occupancy by floor */}
        <GlassCard className="col-span-12 lg:col-span-4" hover>
          <SectionTitle title="Occupancy by Floor" hint={`${kpiSummary.occupancyPct}% building utilization`} />
          <div className="space-y-3">
            {occupancyByFloor
              .slice()
              .reverse()
              .map((o) => {
                const floor = floors.find((f) => f.id === o.floorId)!;
                const pct = Math.round((o.count / o.capacity) * 100);
                return (
                  <div key={o.floorId}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-slate-300">{floor.name}</span>
                      <span className="data-num text-slate-400">
                        {o.count}/{o.capacity} | {pct}%
                      </span>
                    </div>
                    <HealthBar
                      value={pct}
                      color={pct > 85 ? '#F97316' : '#8B5CF6'}
                      height={6}
                    />
                  </div>
                );
              })}
          </div>
        </GlassCard>
      </div>

      {/* Facility locator + connected systems */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8">
          <FacilityLocator />
        </div>
        <GlassCard className="col-span-12 lg:col-span-4" hover>
          <SectionTitle title="Connected Systems" hint="Live integration health" />
          <div className="space-y-1.5">
            {(
              [
                { icon: Building2, name: 'Building Management (BMS)', metric: `${assetCounts.byCategory.HVAC} HVAC units`, status: 'warning' },
                { icon: Video, name: 'Surveillance (VMS)', metric: `${assetCounts.byCategory.Camera} cameras`, status: 'degraded' },
                { icon: DoorClosed, name: 'Access Control (ACS)', metric: `${assetCounts.byCategory.AccessControl} readers`, status: 'warning' },
                { icon: Flame, name: 'Fire & Life Safety', metric: `${assetCounts.byCategory.FireSystem} panels`, status: 'online' },
                { icon: Zap, name: 'Power Management', metric: `${assetCounts.byCategory.UPS + assetCounts.byCategory.Electrical} assets`, status: 'critical' },
                { icon: Radio, name: 'IoT Sensor Mesh', metric: `${assetCounts.byCategory.Sensor} sensors`, status: 'online' },
                { icon: Network, name: 'Network Fabric', metric: `${assetCounts.byCategory.Network} nodes`, status: 'online' },
              ] as const
            ).map((s) => {
              const Icon = s.icon;
              const dot =
                s.status === 'online'
                  ? 'bg-emerald-400'
                  : s.status === 'warning'
                    ? 'bg-amber-400'
                    : s.status === 'degraded'
                      ? 'bg-orange-400'
                      : 'bg-red-500';
              return (
                <div
                  key={s.name}
                  className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.012] px-3 py-2"
                >
                  <Icon className="h-4 w-4 shrink-0 text-slate-500" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-slate-200">{s.name}</div>
                    <div className="text-[11px] text-slate-500">{s.metric}</div>
                  </div>
                  <span className="flex items-center gap-1.5">
                    <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">{s.status}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Module launchpad */}
      <div>
        <SectionTitle title="Platform Modules" hint="Jump to any capability" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {navItems
            .filter((n) => n.href !== '/')
            .map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group glass glass-hover sheen flex flex-col gap-3 p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-command-500/25 bg-command-500/10 text-command-300 transition-colors group-hover:border-command-400/40">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-100">{item.label}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{item.description}</div>
                  </div>
                  <div className="mt-auto flex items-center gap-1 text-xs font-medium text-command-300 opacity-0 transition-opacity group-hover:opacity-100">
                    Open <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
              );
            })}
        </div>
      </div>

      {/* Digital twin teaser */}
      <Link href="/digital-twin">
        <GlassCard className="relative overflow-hidden" hover>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-command-500/[0.06] to-transparent" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-command-500/25 bg-command-500/10 text-command-300 shadow-glow">
                <Boxes className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-white">Open the Interactive Digital Twin</h3>
                  <span className="chip border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                    <Activity className="h-3 w-3" /> {kpiSummary.assetsOnline}/{kpiSummary.assetsTotal} assets live
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  Explore the 3D facility model - floors, cameras, access control, HVAC and live asset status.
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-command-300" />
          </div>
        </GlassCard>
      </Link>
    </div>
  );
}
