'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BarProps {
  value: number; // 0-100
  max?: number;
  color?: string; // hex override
  trackClassName?: string;
  height?: number;
  delay?: number;
  className?: string;
}

export function HealthBar({
  value,
  max = 100,
  color = '#06AEDB',
  trackClassName,
  height = 8,
  delay = 0,
  className,
}: BarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-white/[0.06]', trackClassName, className)}
      style={{ height }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{
          background: `linear-gradient(90deg, ${color}cc, ${color})`,
          boxShadow: `0 0 12px -2px ${color}aa`,
        }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
