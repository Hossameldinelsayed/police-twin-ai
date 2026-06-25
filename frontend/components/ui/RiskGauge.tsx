'use client';

import { motion } from 'framer-motion';
import type { RiskCategory } from '@/lib/types';
import { riskCategoryMeta } from '@/lib/utils';

interface RiskGaugeProps {
  score: number; // 0-100
  category: RiskCategory;
  size?: number;
  label?: string;
}

/** Speedometer-style 270° risk gauge with animated arc. */
export function RiskGauge({ score, category, size = 220, label = 'Facility Risk' }: RiskGaugeProps) {
  const meta = riskCategoryMeta(category);
  const stroke = 14;
  const r = (size - stroke) / 2 - 6;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const arcFraction = 0.75; // 270°
  const arcLen = circ * arcFraction;
  const pct = Math.max(0, Math.min(100, score)) / 100;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-[135deg]">
        <defs>
          <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={meta.hex} stopOpacity="0.9" />
            <stop offset="100%" stopColor={meta.hex} stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circ}`}
        />
        {/* Value arc */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="url(#riskGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circ}`}
          initial={{ strokeDashoffset: arcLen }}
          animate={{ strokeDashoffset: arcLen * (1 - pct) }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 8px ${meta.hex}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="section-label">{label}</span>
        <span className="data-num text-5xl font-bold tracking-tight" style={{ color: meta.hex }}>
          {score}
        </span>
        <span className={`mt-1 text-sm font-semibold ${meta.text}`}>{category}</span>
        <span className="mt-0.5 text-[10px] uppercase tracking-widest text-slate-500">/ 100</span>
      </div>
    </div>
  );
}
