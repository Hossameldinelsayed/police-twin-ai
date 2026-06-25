import {
  Gauge,
  Cpu,
  ShieldAlert,
  Zap,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  ListChecks,
  BookOpenCheck,
  LineChart,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  GlassCard,
  RiskGauge,
  HealthBar,
  LiveBadge,
  PageHeader,
  SectionTitle,
  SeverityBadge,
  FadeIn,
} from '@/components/ui';
import { DonutChart, TrendLineChart } from '@/components/charts';
import { RiskSimulator } from '@/components/risk/RiskSimulator';
import { riskAssessment } from '@/lib/ai';
import { riskTrend } from '@/lib/data/telemetry';
import type { RiskFactor } from '@/lib/types';
import { cn, riskCategoryMeta, formatDate, NOW_ISO } from '@/lib/utils';

const domainMeta: Record<RiskFactor['domain'], { color: string; icon: LucideIcon }> = {
  equipment: { color: '#06AEDB', icon: Cpu },
  security: { color: '#EF4444', icon: ShieldAlert },
  energy: { color: '#F4C152', icon: Zap },
  occupancy: { color: '#8B5CF6', icon: Users },
};

const trendIcon = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus } as const;
const trendColor = {
  up: 'text-red-300',
  down: 'text-emerald-300',
  flat: 'text-slate-400',
} as const;

const sevRank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const methodology: { domain: RiskFactor['domain']; weight: string; how: string }[] = [
  {
    domain: 'equipment',
    weight: '40%',
    how: 'Weighted count of critical/offline/warning assets plus near-term predicted failures (≤14d).',
  },
  {
    domain: 'security',
    weight: '30%',
    how: 'Severity-weighted active access/security/network alarms plus surveillance coverage gaps.',
  },
  {
    domain: 'energy',
    weight: '16%',
    how: 'Deviation from the AI energy baseline plus active environmental/anomaly alarms.',
  },
  {
    domain: 'occupancy',
    weight: '14%',
    how: 'After-hours presence anomalies in critical zones plus over-capacity floor pressure.',
  },
];

export default function RiskEnginePage() {
  const { score, category, trendDelta, summary, confidence, factors, recommendations } =
    riskAssessment;
  const meta = riskCategoryMeta(category);

  const donutData = factors.map((f) => ({
    name: f.label,
    value: f.contribution,
    color: domainMeta[f.domain].color,
  }));

  const sortedFactors = [...factors].sort((a, b) => b.contribution - a.contribution);
  const sortedRecs = [...recommendations].sort(
    (a, b) => sevRank[a.priority] - sevRank[b.priority],
  );

  const DeltaIcon = trendDelta > 0 ? ArrowUpRight : trendDelta < 0 ? ArrowDownRight : Minus;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Module 04 · AI Risk Engine"
        title="Facility Risk Intelligence"
        subtitle="Explainable, weighted risk scoring across equipment, security, energy and occupancy — every point traceable to a live signal."
        icon={<Gauge className="h-5 w-5" />}
        actions={<LiveBadge />}
      />

      {/* Hero: gauge + summary | contribution donut */}
      <div className="grid grid-cols-12 gap-4">
        <GlassCard className="col-span-12 lg:col-span-7" glow="red" hover>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <div className="shrink-0">
              <RiskGauge score={score} category={category} size={240} />
            </div>
            <div className="flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="section-label text-cognition-300/90 inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> AI Assessment
                </span>
                <span className="chip border-cognition-500/30 bg-cognition-500/10 text-cognition-300">
                  {Math.round(confidence * 100)}% confidence
                </span>
                <span
                  className={cn(
                    'chip border-white/[0.06] bg-white/[0.03]',
                    trendDelta > 0 ? 'text-red-300' : trendDelta < 0 ? 'text-emerald-300' : 'text-slate-300',
                  )}
                >
                  <DeltaIcon className="h-3 w-3" />
                  {trendDelta > 0 ? '+' : ''}
                  {trendDelta} pts · 7d
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-200">{summary}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/5 pt-4 text-xs">
                <span className="text-slate-500">
                  Category{' '}
                  <span className={cn('font-semibold', meta.text)}>{category}</span>
                </span>
                <span className="text-slate-500">
                  Domains elevated{' '}
                  <span className="data-num font-semibold text-slate-300">
                    {factors.filter((f) => f.score > 40).length}/4
                  </span>
                </span>
                <span className="text-slate-500">
                  Generated{' '}
                  <span className="text-slate-300">{formatDate(NOW_ISO)}</span>
                </span>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 lg:col-span-5" hover>
          <SectionTitle
            title="Contribution Mix"
            hint="Weighted points each domain adds to the index"
          />
          <DonutChart
            data={donutData}
            height={230}
            centerValue={String(score)}
            centerLabel="Risk"
            unit=" pts"
          />
        </GlassCard>
      </div>

      {/* Factor breakdown */}
      <div>
        <SectionTitle
          title="Domain Factor Breakdown"
          hint="Each sub-score is computed from auditable live signals"
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sortedFactors.map((f, i) => {
            const dm = domainMeta[f.domain];
            const Icon = dm.icon;
            const TIcon = trendIcon[f.trend];
            return (
              <FadeIn key={f.domain} delay={i * 0.06}>
                <GlassCard hover className="h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${dm.color}1a`, color: dm.color }}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-slate-100">{f.label}</div>
                        <div className="text-[11px] uppercase tracking-wider text-slate-500">
                          {Math.round(f.weight * 100)}% weight · {f.contribution} pts contributed
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="data-num text-3xl font-bold leading-none"
                        style={{ color: dm.color }}
                      >
                        {f.score}
                      </div>
                      <div
                        className={cn(
                          'mt-1 inline-flex items-center gap-0.5 text-[11px] font-medium',
                          trendColor[f.trend],
                        )}
                      >
                        <TIcon className="h-3 w-3" />
                        {f.trend === 'up' ? 'rising' : f.trend === 'down' ? 'easing' : 'stable'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <HealthBar value={f.score} color={dm.color} height={7} delay={i * 0.06} />
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-slate-400">{f.detail}</p>

                  <div className="mt-3 border-t border-white/5 pt-3">
                    <div className="section-label mb-2 text-slate-500">Evidence signals</div>
                    <ul className="space-y-1.5">
                      {f.signals.map((s, si) => (
                        <li key={si} className="flex items-start gap-2 text-xs text-slate-300">
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: dm.color }}
                          />
                          <span className="leading-relaxed">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </GlassCard>
              </FadeIn>
            );
          })}
        </div>
      </div>

      {/* Recommendations + Methodology */}
      <div className="grid grid-cols-12 gap-4">
        <GlassCard className="col-span-12 lg:col-span-7" hover>
          <SectionTitle
            title="Prioritized Mitigations"
            hint="AI-ranked actions with modeled point impact"
            right={
              <span className="chip border-cognition-500/30 bg-cognition-500/10 text-cognition-300">
                <ListChecks className="h-3 w-3" /> {sortedRecs.length} actions
              </span>
            }
          />
          <div className="space-y-2.5">
            {sortedRecs.map((rec) => {
              const dm = domainMeta[rec.domain];
              return (
                <div
                  key={rec.id}
                  className="group flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] p-3.5 transition-colors hover:border-white/[0.1] hover:bg-white/[0.03]"
                >
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${dm.color}1a`, color: dm.color }}
                  >
                    <dm.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityBadge severity={rec.priority} />
                      <span className="text-sm font-semibold text-slate-100">{rec.action}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">{rec.rationale}</p>
                  </div>
                  <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                    <ArrowDownRight className="h-3.5 w-3.5" />
                    {rec.impact}
                  </span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 lg:col-span-5" hover>
          <SectionTitle title="Scoring Methodology" hint="Deterministic & auditable" />
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-command-500/20 bg-command-500/[0.06] p-3">
            <BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0 text-command-300" />
            <p className="text-xs leading-relaxed text-slate-300">
              The composite index is a fixed weighted blend of four domain sub-scores —{' '}
              <span className="data-num text-slate-200">
                overall = Σ (score<sub>i</sub> × weight<sub>i</sub>)
              </span>
              . No randomness: identical signals always yield the identical score, so every
              assessment is reproducible and audit-traceable.
            </p>
          </div>
          <div className="space-y-2">
            {methodology.map((m) => {
              const dm = domainMeta[m.domain];
              return (
                <div
                  key={m.domain}
                  className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] p-3"
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${dm.color}1a`, color: dm.color }}
                  >
                    <dm.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize text-slate-200">
                        {m.domain}
                      </span>
                      <span
                        className="data-num text-xs font-semibold"
                        style={{ color: dm.color }}
                      >
                        {m.weight}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{m.how}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3 text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
            Sub-scores clamped 0–100 · category thresholds: Low &lt;22 · Guarded &lt;40 · Elevated
            &lt;58 · High &lt;78 · Severe ≥78
          </div>
        </GlassCard>
      </div>

      {/* 30-day trend */}
      <GlassCard hover>
        <SectionTitle
          title="30-Day Risk Index Trend"
          hint="Composite score history"
          right={
            <span className="chip border-orange-400/30 bg-orange-400/10 text-orange-200">
              <LineChart className="h-3 w-3" /> {trendDelta > 0 ? '+' : ''}
              {trendDelta} pts this week
            </span>
          }
        />
        <TrendLineChart
          data={riskTrend}
          xKey="date"
          height={240}
          yDomain={[0, 100]}
          series={[{ key: 'value', label: 'Risk Index', color: '#F97316' }]}
        />
      </GlassCard>

      {/* What-If simulator */}
      <GlassCard glow="violet" hover>
        <RiskSimulator factors={factors} baseline={score} />
      </GlassCard>
    </div>
  );
}
