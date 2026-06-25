import {
  Bot,
  Gauge,
  BellRing,
  Wrench,
  Zap,
  Users,
  ShieldQuestion,
  BarChart3,
  ListChecks,
  Activity,
} from 'lucide-react';
import { GlassCard, PageHeader, LiveBadge, FadeIn } from '@/components/ui';
import { CopilotChat } from '@/components/copilot/CopilotChat';
import { riskAssessment, predictiveSummary } from '@/lib/ai';
import { activeAlarms, criticalAlarms } from '@/lib/data/alarms';
import { energyDeltaPct, occupancyPct, occupancyTotal } from '@/lib/data/telemetry';
import { riskCategoryMeta, formatNumber, cn } from '@/lib/utils';

const capabilities = [
  {
    icon: ShieldQuestion,
    title: 'Explain risk drivers',
    desc: 'Why the composite score moved, factor by factor.',
  },
  {
    icon: BellRing,
    title: 'Triage active alarms',
    desc: 'Prioritised by severity, location and source.',
  },
  {
    icon: Wrench,
    title: 'Predict maintenance',
    desc: 'Assets nearing failure and cost-of-inaction.',
  },
  {
    icon: BarChart3,
    title: 'Analyse telemetry',
    desc: 'Energy, occupancy and 24h event timelines.',
  },
  {
    icon: ListChecks,
    title: 'Recommend actions',
    desc: 'Prioritised steps to reduce facility risk.',
  },
];

export default function CopilotPage() {
  const riskMeta = riskCategoryMeta(riskAssessment.category);

  const contextStats: {
    icon: typeof Gauge;
    label: string;
    value: string;
    accent: string;
    detail: string;
  }[] = [
    {
      icon: Gauge,
      label: 'Facility Risk',
      value: `${riskAssessment.score}`,
      accent: riskMeta.text,
      detail: `${riskAssessment.category} | +${riskAssessment.trendDelta} pts/7d`,
    },
    {
      icon: BellRing,
      label: 'Active Alarms',
      value: `${activeAlarms.length}`,
      accent: 'text-orange-300',
      detail: `${criticalAlarms.length} critical / high`,
    },
    {
      icon: Wrench,
      label: 'Failures < 7 days',
      value: `${predictiveSummary.within7Days}`,
      accent: 'text-amber-200',
      detail: `${predictiveSummary.atRisk} assets at risk`,
    },
    {
      icon: Zap,
      label: 'Energy vs Baseline',
      value: `${energyDeltaPct >= 0 ? '+' : ''}${energyDeltaPct}%`,
      accent: energyDeltaPct >= 0 ? 'text-amber-200' : 'text-emerald-300',
      detail: 'HVAC plant overdraw',
    },
    {
      icon: Users,
      label: 'Occupancy',
      value: `${occupancyPct}%`,
      accent: 'text-cognition-300',
      detail: `${formatNumber(occupancyTotal)} people on site`,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Module 03 | AI Facility Copilot"
        title="Facility Copilot"
        subtitle="Conversational intelligence grounded on the live state of Central Command HQ - query risk, alarms, energy, occupancy and predictive maintenance in natural language."
        icon={<Bot className="h-5 w-5" />}
        actions={<LiveBadge />}
      />

      <div className="grid grid-cols-12 gap-4">
        {/* Chat */}
        <FadeIn className="col-span-12 lg:col-span-8">
          <CopilotChat />
        </FadeIn>

        {/* Live context rail */}
        <FadeIn delay={0.08} className="col-span-12 space-y-4 lg:col-span-4">
          <GlassCard glow="violet">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="section-label text-cognition-300/80">Grounding</div>
                <h2 className="mt-1 text-sm font-semibold tracking-tight text-white">Live Context</h2>
              </div>
              <span className="chip border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                <Activity className="h-3 w-3" /> Synced
              </span>
            </div>

            <p className="mb-4 text-xs leading-relaxed text-slate-500">
              Every answer is computed against this real-time snapshot - no stale data, no guesswork.
            </p>

            <div className="space-y-2">
              {contextStats.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-slate-400">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] uppercase tracking-wider text-slate-500">{s.label}</div>
                      <div className="truncate text-xs text-slate-500">{s.detail}</div>
                    </div>
                    <div className={cn('data-num shrink-0 text-lg font-semibold', s.accent)}>{s.value}</div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Capabilities */}
          <GlassCard>
            <div className="mb-3">
              <div className="section-label text-command-300/80">Capabilities</div>
              <h2 className="mt-1 text-sm font-semibold tracking-tight text-white">What I can do</h2>
            </div>
            <div className="space-y-1">
              {capabilities.map((c) => {
                const Icon = c.icon;
                return (
                  <div
                    key={c.title}
                    className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-white/[0.02]"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cognition-500/20 bg-cognition-500/[0.08] text-cognition-300">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-100">{c.title}</div>
                      <div className="mt-0.5 text-xs leading-relaxed text-slate-500">{c.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3 text-xs text-slate-500">
              <span className="chip border-cognition-500/25 bg-cognition-500/[0.08] text-cognition-200">
                {Math.round(riskAssessment.confidence * 100)}% model confidence
              </span>
              <span>grounded | auditable | cited</span>
            </div>
          </GlassCard>
        </FadeIn>
      </div>
    </div>
  );
}
