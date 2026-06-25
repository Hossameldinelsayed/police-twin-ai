'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CustomTooltip } from './CustomTooltip';

export interface SeriesDef {
  key: string;
  label: string;
  color: string;
}

interface TrendAreaChartProps {
  // Recharts data is structurally loose; accept any row-shaped array.
  data: any[];
  xKey: string;
  series: SeriesDef[];
  height?: number;
  stacked?: boolean;
  unit?: string;
  valueFormatter?: (v: number) => string;
  showGrid?: boolean;
  xInterval?: number;
}

export function TrendAreaChart({
  data,
  xKey,
  series,
  height = 240,
  stacked = false,
  unit = '',
  valueFormatter,
  showGrid = true,
  xInterval,
}: TrendAreaChartProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`area-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          )}
          <XAxis
            dataKey={xKey}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#6b7a93', fontSize: 11 }}
            interval={xInterval ?? 'preserveStartEnd'}
            minTickGap={20}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#6b7a93', fontSize: 11 }}
            width={44}
          />
          <Tooltip
            content={<CustomTooltip unit={unit} valueFormatter={valueFormatter} />}
            cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
          />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stackId={stacked ? 'stack' : undefined}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#area-${s.key})`}
              isAnimationActive
              animationDuration={1000}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
