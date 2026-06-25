import { LineChart, Gauge, BellRing, Zap, Users } from 'lucide-react';
import {
  KpiCard,
  LiveBadge,
  PageHeader,
  FadeIn,
} from '@/components/ui';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { kpiSummary } from '@/lib/ai';
import { riskCategoryMeta, formatNumber, formatTime, NOW_ISO } from '@/lib/utils';

export default function DashboardPage() {
  const riskMeta = riskCategoryMeta(kpiSummary.riskCategory);
  const highRisk =
    kpiSummary.riskCategory === 'High' || kpiSummary.riskCategory === 'Severe';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Module 07 · Executive Dashboard"
        title="Trends & Analytics"
        subtitle="30-day operational trends across risk, alarms, energy and asset health."
        icon={<LineChart className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <LiveBadge />
            <span className="hidden rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-slate-400 sm:inline-flex">
              Updated · {formatTime(NOW_ISO)} GST
            </span>
          </div>
        }
      />

      {/* KPI summary strip */}
      <FadeIn>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <KpiCard
            index={0}
            icon={<Gauge className="h-5 w-5" />}
            label="Facility Risk"
            value={kpiSummary.riskScore}
            accent={highRisk ? 'red' : 'amber'}
            delta={{
              value: kpiSummary.riskDelta,
              direction: kpiSummary.riskDelta >= 0 ? 'up' : 'down',
              positiveIsGood: false,
              label: ' pts',
            }}
            footer={<span className={riskMeta.text}>{kpiSummary.riskCategory} · 7-day trend</span>}
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
            value={kpiSummary.energyKwh}
            suffix=" kWh"
            accent="command"
            delta={{
              value: kpiSummary.energyDeltaPct,
              direction: kpiSummary.energyDeltaPct >= 0 ? 'up' : 'down',
              positiveIsGood: false,
              label: '%',
            }}
            footer={<span>vs AI-modeled baseline</span>}
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
        </div>
      </FadeIn>

      <DashboardCharts />
    </div>
  );
}
