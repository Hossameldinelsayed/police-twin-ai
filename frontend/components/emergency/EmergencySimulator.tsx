'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Flame,
  ZapOff,
  ShieldAlert,
  Wrench,
  Siren,
  Boxes,
  Users,
  Clock,
  Check,
  Cpu,
  Hand,
  Play,
  RotateCcw,
  AlertTriangle,
  Activity,
  ChevronRight,
  Radio,
  type LucideIcon,
} from 'lucide-react';
import { GlassCard, SeverityBadge, SectionTitle } from '@/components/ui';
import { emergencyScenarios } from '@/lib/data/emergency';
import type { EmergencyScenario } from '@/lib/types';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Static config maps (module scope, deterministic)
// ---------------------------------------------------------------------------

const typeIcon: Record<EmergencyScenario['type'], LucideIcon> = {
  fire: Flame,
  power_outage: ZapOff,
  unauthorized_access: ShieldAlert,
  equipment_failure: Wrench,
};

const typeAccent: Record<
  EmergencyScenario['type'],
  { text: string; border: string; bg: string; glow: string; ring: string; hex: string }
> = {
  fire: {
    text: 'text-red-300',
    border: 'border-red-500/40',
    bg: 'bg-red-500/10',
    glow: 'shadow-glow-red',
    ring: 'ring-red-500/30',
    hex: '#EF4444',
  },
  power_outage: {
    text: 'text-amber-200',
    border: 'border-amber-400/40',
    bg: 'bg-amber-400/10',
    glow: 'shadow-[0_0_30px_-8px_rgba(244,193,82,0.5)]',
    ring: 'ring-amber-400/30',
    hex: '#F4C152',
  },
  unauthorized_access: {
    text: 'text-orange-300',
    border: 'border-orange-500/40',
    bg: 'bg-orange-500/10',
    glow: 'shadow-[0_0_30px_-8px_rgba(249,115,22,0.5)]',
    ring: 'ring-orange-500/30',
    hex: '#F97316',
  },
  equipment_failure: {
    text: 'text-command-300',
    border: 'border-command-500/40',
    bg: 'bg-command-500/10',
    glow: 'shadow-glow',
    ring: 'ring-command-500/30',
    hex: '#06AEDB',
  },
};

const impactMeta: Record<
  'severe' | 'major' | 'moderate' | 'minor',
  { label: string; text: string; border: string; bg: string; dot: string; hex: string }
> = {
  severe: {
    label: 'Severe',
    text: 'text-red-300',
    border: 'border-red-500/30',
    bg: 'bg-red-500/10',
    dot: 'bg-red-400',
    hex: '#EF4444',
  },
  major: {
    label: 'Major',
    text: 'text-orange-300',
    border: 'border-orange-500/30',
    bg: 'bg-orange-500/10',
    dot: 'bg-orange-400',
    hex: '#F97316',
  },
  moderate: {
    label: 'Moderate',
    text: 'text-amber-200',
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/10',
    dot: 'bg-amber-400',
    hex: '#F4C152',
  },
  minor: {
    label: 'Minor',
    text: 'text-slate-300',
    border: 'border-slate-500/30',
    bg: 'bg-slate-500/10',
    dot: 'bg-slate-400',
    hex: '#94A3B8',
  },
};

const STEP_INTERVAL_MS = 750;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

type SimStatus = 'idle' | 'running' | 'complete';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmergencySimulator() {
  const [selectedId, setSelectedId] = useState<string>(emergencyScenarios[0].id);
  const [status, setStatus] = useState<SimStatus>('idle');
  // activeStep = number of steps that have been activated (0..length)
  const [activeStep, setActiveStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scenario =
    emergencyScenarios.find((s) => s.id === selectedId) ?? emergencyScenarios[0];
  const accent = typeAccent[scenario.type];
  const steps = scenario.responsePlan;
  const totalSteps = steps.length;

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Reset whenever the scenario changes
  useEffect(() => {
    clearTimer();
    setStatus('idle');
    setActiveStep(0);
    return clearTimer;
  }, [selectedId]);

  // Clean up on unmount
  useEffect(() => clearTimer, []);

  const runSimulation = () => {
    clearTimer();
    setStatus('running');
    setActiveStep(0);
    timerRef.current = setInterval(() => {
      setActiveStep((prev) => {
        const next = prev + 1;
        if (next >= totalSteps) {
          clearTimer();
          setStatus('complete');
          return totalSteps;
        }
        return next;
      });
    }, STEP_INTERVAL_MS);
  };

  const resetSimulation = () => {
    clearTimer();
    setStatus('idle');
    setActiveStep(0);
  };

  const progressPct =
    totalSteps === 0 ? 0 : Math.round((activeStep / totalSteps) * 100);
  const elapsedMinutes = activeStep > 0 ? steps[activeStep - 1].etaMinutes : 0;
  const automatedCount = steps.filter((s) => s.automated).length;

  return (
    <div className="space-y-6">
      {/* ---------------- Scenario selector ---------------- */}
      <div>
        <SectionTitle
          title="Crisis Scenario Library"
          hint="Pre-modeled drills · select to load the response playbook"
          right={
            <span className="chip border-white/[0.08] bg-white/[0.03] text-slate-400">
              <Radio className="h-3 w-3" /> {emergencyScenarios.length} scenarios
            </span>
          }
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {emergencyScenarios.map((s) => {
            const Icon = typeIcon[s.type];
            const a = typeAccent[s.type];
            const selected = s.id === selectedId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedId(s.id)}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 focus-ring',
                  selected
                    ? cn('glass-strong', a.border, a.glow, 'ring-1', a.ring)
                    : 'glass border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]',
                )}
              >
                {selected && (
                  <span
                    className="pointer-events-none absolute inset-0 opacity-60"
                    style={{
                      background: `radial-gradient(120% 80% at 0% 0%, ${a.hex}1a, transparent 60%)`,
                    }}
                  />
                )}
                <div className="relative flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors',
                      selected
                        ? cn(a.border, a.bg, a.text)
                        : 'border-white/[0.08] bg-white/[0.03] text-slate-400 group-hover:text-slate-200',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <SeverityBadge severity={s.severity} />
                </div>
                <div className="relative mt-3">
                  <div
                    className={cn(
                      'text-sm font-semibold leading-snug',
                      selected ? 'text-white' : 'text-slate-200',
                    )}
                  >
                    {s.name}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {s.description}
                  </p>
                </div>
                <div className="relative mt-3 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider">
                  <span className={cn(selected ? a.text : 'text-slate-600')}>
                    {selected ? 'Loaded' : 'Select drill'}
                  </span>
                  <ChevronRight
                    className={cn(
                      'h-3 w-3 transition-transform group-hover:translate-x-0.5',
                      selected ? a.text : 'text-slate-600',
                    )}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------- Detail area ---------------- */}
      <AnimatePresence mode="wait">
        <motion.div
          key={scenario.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="space-y-4"
        >
          {/* Command header / simulation control bar */}
          <GlassCard className="relative overflow-hidden" glow={scenario.type === 'fire' ? 'red' : 'command'}>
            <span
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                background: `linear-gradient(110deg, ${accent.hex}14, transparent 55%)`,
              }}
            />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border',
                    accent.border,
                    accent.bg,
                    accent.text,
                  )}
                >
                  {status === 'running' && (
                    <span
                      className="absolute inset-0 animate-pulse-ring rounded-xl"
                      style={{ boxShadow: `0 0 0 0 ${accent.hex}` }}
                    />
                  )}
                  <Siren className="h-6 w-6" />
                </div>
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="section-label text-slate-500">Active Drill</span>
                    {status === 'running' && (
                      <span className="chip border-red-500/30 bg-red-500/10 text-red-300">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400" />
                        </span>
                        SIMULATION LIVE
                      </span>
                    )}
                    {status === 'complete' && (
                      <span className="chip border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                        <Check className="h-3 w-3" /> RESOLVED
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-white">{scenario.name}</h2>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {status !== 'idle' && (
                  <button
                    type="button"
                    onClick={resetSimulation}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:border-white/[0.15] hover:bg-white/[0.05] focus-ring"
                  >
                    <RotateCcw className="h-4 w-4" /> Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={runSimulation}
                  disabled={status === 'running'}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all focus-ring',
                    status === 'running'
                      ? 'cursor-not-allowed border-white/[0.06] bg-white/[0.02] text-slate-500'
                      : 'border-red-500/40 bg-red-500/15 text-red-200 hover:bg-red-500/25 hover:shadow-glow-red',
                  )}
                >
                  <Play className="h-4 w-4" />
                  {status === 'running'
                    ? 'Running…'
                    : status === 'complete'
                      ? 'Re-run Drill'
                      : 'Run Simulation'}
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative mt-5">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Response progress ·{' '}
                  <span className="data-num text-slate-300">
                    {Math.min(activeStep, totalSteps)}/{totalSteps}
                  </span>{' '}
                  steps
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="h-3 w-3" />
                  <span className="data-num">T+{elapsedMinutes}m elapsed</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background:
                      status === 'complete'
                        ? 'linear-gradient(90deg,#10B981,#34D399)'
                        : `linear-gradient(90deg, ${accent.hex}, ${accent.hex}aa)`,
                  }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <AnimatePresence>
                {status === 'complete' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-200"
                  >
                    <Check className="h-4 w-4 shrink-0" />
                    <span>
                      Response complete — all {totalSteps} steps executed. Estimated recovery{' '}
                      <span className="data-num font-semibold text-emerald-100">
                        {formatDuration(scenario.estimatedRecoveryMinutes)}
                      </span>
                      .
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>

          {/* Summary stat tiles */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Severity"
              accentText={accent.text}
              valueNode={<SeverityBadge severity={scenario.severity} />}
            />
            <StatTile
              icon={<Clock className="h-4 w-4" />}
              label="Est. Recovery"
              accentText="text-command-300"
              value={formatDuration(scenario.estimatedRecoveryMinutes)}
            />
            <StatTile
              icon={<Boxes className="h-4 w-4" />}
              label="Affected Assets"
              accentText="text-amber-200"
              value={String(scenario.affectedAssets)}
            />
            <StatTile
              icon={<Users className="h-4 w-4" />}
              label="Affected Occupants"
              accentText="text-cognition-300"
              value={scenario.affectedOccupants.toLocaleString()}
            />
          </div>

          {/* Trigger narrative callout */}
          <div
            className={cn(
              'relative overflow-hidden rounded-2xl border px-5 py-4',
              accent.border,
              accent.bg,
            )}
          >
            <span
              className="pointer-events-none absolute inset-y-0 left-0 w-1"
              style={{ background: accent.hex }}
            />
            <div className="flex items-start gap-3 pl-2">
              <Activity className={cn('mt-0.5 h-4 w-4 shrink-0', accent.text)} />
              <div>
                <div className="section-label mb-1 text-slate-400">Trigger Narrative</div>
                <p className="text-sm leading-relaxed text-slate-200">
                  {scenario.triggerNarrative}
                </p>
              </div>
            </div>
          </div>

          {/* Two-column: Playbook + (zones, cascade) */}
          <div className="grid grid-cols-12 gap-4">
            {/* Response playbook timeline */}
            <GlassCard className="col-span-12 lg:col-span-7" hover>
              <SectionTitle
                title="Response Playbook"
                hint={`${totalSteps} orchestrated steps · ${automatedCount} automated`}
                right={
                  <div className="flex items-center gap-2">
                    <span className="chip border-command-500/25 bg-command-500/10 text-command-300">
                      <Cpu className="h-3 w-3" /> {automatedCount} auto
                    </span>
                    <span className="chip border-white/[0.08] bg-white/[0.03] text-slate-400">
                      <Hand className="h-3 w-3" /> {totalSteps - automatedCount} manual
                    </span>
                  </div>
                }
              />
              <ol className="relative space-y-2.5">
                {/* spine */}
                <span className="pointer-events-none absolute bottom-3 left-[18px] top-3 w-px bg-white/[0.06]" />
                {steps.map((step, i) => {
                  const isActive = status !== 'idle' && i < activeStep;
                  const isCurrent =
                    status === 'running' && i === activeStep - 1;
                  return (
                    <TimelineStep
                      key={step.order}
                      step={step}
                      index={i}
                      isActive={isActive}
                      isCurrent={isCurrent}
                      accentHex={accent.hex}
                    />
                  );
                })}
              </ol>
            </GlassCard>

            {/* Right column: zones + cascade */}
            <div className="col-span-12 space-y-4 lg:col-span-5">
              {/* Impacted zones */}
              <GlassCard hover>
                <SectionTitle
                  title="Impacted Zones"
                  hint={`${scenario.impactedZones.length} zones in blast radius`}
                />
                <div className="space-y-2.5">
                  {scenario.impactedZones.map((z) => {
                    const m = impactMeta[z.impact];
                    return (
                      <div
                        key={z.zoneId}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] px-3.5 py-2.5"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn('h-2 w-2 shrink-0 rounded-full', m.dot)} />
                            <span className="truncate text-sm font-medium text-slate-100">
                              {z.zoneName}
                            </span>
                          </div>
                          <div className="mt-0.5 pl-4 text-xs text-slate-500">
                            {z.floorName}
                          </div>
                        </div>
                        <span
                          className={cn(
                            'chip shrink-0',
                            m.border,
                            m.bg,
                            m.text,
                          )}
                        >
                          {m.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>

              {/* Cascade risks */}
              <GlassCard hover>
                <SectionTitle
                  title="Cascade Risks"
                  hint="Secondary failures to pre-empt"
                  right={
                    <span className="chip border-amber-400/30 bg-amber-400/10 text-amber-200">
                      <AlertTriangle className="h-3 w-3" /> {scenario.cascadeRisks.length}
                    </span>
                  }
                />
                <ul className="space-y-2">
                  {scenario.cascadeRisks.map((risk, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 rounded-xl border border-amber-400/15 bg-amber-400/[0.04] px-3.5 py-2.5"
                    >
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300/80" />
                      <span className="text-sm leading-relaxed text-slate-300">{risk}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatTile({
  icon,
  label,
  value,
  valueNode,
  accentText,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
  accentText: string;
}) {
  return (
    <GlassCard padded={false} className="p-4" hover>
      <div className="flex items-center gap-2 text-slate-500">
        <span className={cn(accentText)}>{icon}</span>
        <span className="text-[11px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-2">
        {valueNode ?? (
          <span className={cn('data-num text-2xl font-semibold', accentText)}>{value}</span>
        )}
      </div>
    </GlassCard>
  );
}

function TimelineStep({
  step,
  index,
  isActive,
  isCurrent,
  accentHex,
}: {
  step: EmergencyScenario['responsePlan'][number];
  index: number;
  isActive: boolean;
  isCurrent: boolean;
  accentHex: string;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: 'easeOut' }}
      className={cn(
        'relative flex gap-3 rounded-xl border px-3 py-3 transition-all duration-300',
        isCurrent
          ? 'border-white/[0.12] bg-white/[0.04]'
          : isActive
            ? 'border-white/[0.06] bg-white/[0.02]'
            : 'border-transparent bg-transparent',
      )}
      style={
        isCurrent
          ? { boxShadow: `0 0 24px -10px ${accentHex}` }
          : undefined
      }
    >
      {/* Node marker */}
      <div className="relative z-10 shrink-0">
        <motion.div
          animate={
            isCurrent
              ? { scale: [1, 1.12, 1] }
              : { scale: 1 }
          }
          transition={{ duration: 0.7, repeat: isCurrent ? Infinity : 0 }}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-300',
            isActive
              ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
              : 'border-white/[0.1] bg-ink-850 text-slate-500',
          )}
          style={
            isCurrent
              ? { borderColor: accentHex, color: accentHex, boxShadow: `0 0 0 4px ${accentHex}22` }
              : undefined
          }
        >
          {isActive ? (
            <Check className="h-4 w-4" />
          ) : (
            <span className="data-num">{step.order}</span>
          )}
        </motion.div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-sm font-semibold',
                isActive ? 'text-white' : 'text-slate-300',
              )}
            >
              {step.actor}
            </span>
            <span className="data-num text-[11px] text-slate-500">T+{step.etaMinutes}m</span>
          </div>
          <span
            className={cn(
              'chip',
              step.automated
                ? 'border-command-500/30 bg-command-500/10 text-command-300'
                : 'border-slate-500/30 bg-slate-500/10 text-slate-400',
            )}
          >
            {step.automated ? (
              <>
                <Cpu className="h-3 w-3" /> AUTO
              </>
            ) : (
              <>
                <Hand className="h-3 w-3" /> MANUAL
              </>
            )}
          </span>
        </div>
        <p
          className={cn(
            'mt-1 text-sm leading-relaxed transition-colors',
            isActive ? 'text-slate-300' : 'text-slate-500',
          )}
        >
          {step.action}
        </p>
      </div>
    </motion.li>
  );
}
