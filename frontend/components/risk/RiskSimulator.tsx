'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  SlidersHorizontal,
  RotateCcw,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  Cpu,
  ShieldAlert,
  Zap,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { RiskFactor } from '@/lib/types';
import { cn, riskCategoryFromScore, riskCategoryMeta, round } from '@/lib/utils';

// Same weights as the production risk engine - keep in lockstep.
const WEIGHTS: Record<RiskFactor['domain'], number> = {
  equipment: 0.4,
  security: 0.3,
  energy: 0.16,
  occupancy: 0.14,
};

const DOMAIN_META: Record<
  RiskFactor['domain'],
  { color: string; icon: LucideIcon }
> = {
  equipment: { color: '#06AEDB', icon: Cpu },
  security: { color: '#EF4444', icon: ShieldAlert },
  energy: { color: '#F4C152', icon: Zap },
  occupancy: { color: '#8B5CF6', icon: Users },
};

interface RiskSimulatorProps {
  factors: RiskFactor[];
  baseline: number;
}

function computeScore(values: Record<RiskFactor['domain'], number>): number {
  return round(
    (Object.keys(WEIGHTS) as RiskFactor['domain'][]).reduce(
      (sum, domain) => sum + values[domain] * WEIGHTS[domain],
      0,
    ),
    0,
  );
}

/**
 * A score number that smoothly re-animates toward the live computed value on
 * every change. AnimatedNumber only fires once on scroll-in, so we tween here.
 */
function LiveScore({ value, color }: { value: number; color: string }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const start = performance.now();
    const dur = 420;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const next = from + (to - from) * ease(t);
      setDisplay(next);
      fromRef.current = next;
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span className="data-num text-6xl font-bold tracking-tight tabular-nums" style={{ color }}>
      {Math.round(display)}
    </span>
  );
}

export function RiskSimulator({ factors, baseline }: RiskSimulatorProps) {
  const initial = useMemo(() => {
    const map = {} as Record<RiskFactor['domain'], number>;
    factors.forEach((f) => {
      map[f.domain] = f.score;
    });
    return map;
  }, [factors]);

  const [values, setValues] = useState<Record<RiskFactor['domain'], number>>(initial);

  const score = computeScore(values);
  const category = riskCategoryFromScore(score);
  const meta = riskCategoryMeta(category);
  const delta = score - baseline;
  const dirty = (Object.keys(initial) as RiskFactor['domain'][]).some(
    (d) => values[d] !== initial[d],
  );

  const setDomain = (domain: RiskFactor['domain'], v: number) =>
    setValues((prev) => ({ ...prev, [domain]: v }));

  const reset = () => setValues(initial);

  const TrendIcon = delta < 0 ? ArrowDownRight : delta > 0 ? ArrowUpRight : Minus;
  const trendColor =
    delta < 0 ? 'text-emerald-300' : delta > 0 ? 'text-red-300' : 'text-slate-400';

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cognition-500/30 bg-cognition-500/10 text-cognition-300 shadow-glow-violet">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">What-If Risk Simulator</h3>
            <p className="text-xs text-slate-500">
              Drag domain sub-scores to model how mitigations shift the composite index.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={!dirty}
          className={cn(
            'focus-ring inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
            dirty
              ? 'border-command-500/30 bg-command-500/10 text-command-200 hover:bg-command-500/20'
              : 'cursor-not-allowed border-white/[0.06] bg-white/[0.02] text-slate-600',
          )}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset to live
        </button>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Sliders */}
        <div className="col-span-12 space-y-5 lg:col-span-7">
          {factors.map((f) => {
            const dm = DOMAIN_META[f.domain];
            const Icon = dm.icon;
            const v = values[f.domain];
            const moved = v !== initial[f.domain];
            return (
              <div key={f.domain}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${dm.color}1a`, color: dm.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-slate-200">{f.label}</span>
                    <span className="text-[11px] text-slate-600">
 | {Math.round(WEIGHTS[f.domain] * 100)}% weight
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    {moved && (
                      <span className="data-num text-[11px] text-slate-600 line-through">
                        {initial[f.domain]}
                      </span>
                    )}
                    <span
                      className="data-num text-sm font-semibold tabular-nums"
                      style={{ color: dm.color }}
                    >
                      {v}
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={v}
                  onChange={(e) => setDomain(f.domain, Number(e.target.value))}
                  aria-label={`${f.label} sub-score`}
                  className="risk-slider w-full"
                  style={
                    {
                      '--track': dm.color,
                      background: `linear-gradient(to right, ${dm.color} 0%, ${dm.color} ${v}%, rgba(255,255,255,0.08) ${v}%, rgba(255,255,255,0.08) 100%)`,
                    } as React.CSSProperties
                  }
                />
                <div className="mt-1.5 flex justify-between text-[10px] uppercase tracking-wider text-slate-600">
                  <span>Mitigated</span>
                  <span>
                    Contributes{' '}
                    <span className="data-num text-slate-500">
                      {round(v * WEIGHTS[f.domain], 1)}
                    </span>{' '}
                    pts
                  </span>
                  <span>Critical</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live result */}
        <div className="col-span-12 lg:col-span-5">
          <div
            className="relative h-full overflow-hidden rounded-2xl border p-6"
            style={{
              borderColor: `${meta.hex}3a`,
              background: `radial-gradient(120% 120% at 50% 0%, ${meta.hex}14 0%, transparent 60%)`,
            }}
          >
            <div
              className="pointer-events-none absolute -inset-px rounded-2xl opacity-60 transition-opacity"
              style={{ boxShadow: `inset 0 0 60px -28px ${meta.hex}` }}
            />
            <div className="relative flex h-full flex-col items-center justify-center text-center">
              <span className="section-label text-slate-400">Simulated Risk Index</span>
              <div className="mt-1">
                <LiveScore value={score} color={meta.hex} />
                <span className="data-num ml-1 text-lg text-slate-600">/100</span>
              </div>
              <span
                className={cn('mt-1 text-sm font-semibold', meta.text)}
              >
                {category}
              </span>

              <div className="mt-5 flex items-center gap-2">
                <motion.span
                  key={delta}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-semibold',
                    delta < 0
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : delta > 0
                        ? 'border-red-500/30 bg-red-500/10'
                        : 'border-white/[0.06] bg-white/[0.03]',
                    trendColor,
                  )}
                >
                  <TrendIcon className="h-4 w-4" />
                  {delta > 0 ? '+' : ''}
                  {delta} pts
                </motion.span>
                <span className="text-xs text-slate-500">vs live {baseline}</span>
              </div>

              <p className="mt-5 max-w-[15rem] text-xs leading-relaxed text-slate-500">
                {delta < 0
                  ? 'Modeled mitigations reduce composite exposure. Apply via the recommendations above.'
                  : delta > 0
                    ? 'Simulated conditions worsen the index relative to the live assessment.'
                    : 'Sliders match the live assessment. Drag to model interventions.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .risk-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 9999px;
          outline: none;
          cursor: pointer;
        }
        .risk-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: #0b1220;
          border: 3px solid var(--track);
          box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.35), 0 0 12px -2px var(--track);
          transition: transform 0.12s ease;
        }
        .risk-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .risk-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: #0b1220;
          border: 3px solid var(--track);
          box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.35), 0 0 12px -2px var(--track);
        }
        .risk-slider::-moz-range-track {
          height: 6px;
          border-radius: 9999px;
        }
      `}</style>
    </div>
  );
}
