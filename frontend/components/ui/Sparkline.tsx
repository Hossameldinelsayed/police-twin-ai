'use client';

import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';
import type { TrendPoint } from '@/lib/types';

interface SparklineProps {
  data: TrendPoint[];
  color?: string;
  height?: number;
}

export function Sparkline({ data, color = '#06AEDB', height = 44 }: SparklineProps) {
  const id = `spark-${color.replace('#', '')}`;
  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${id})`}
            isAnimationActive
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
