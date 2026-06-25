'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CustomTooltip } from './CustomTooltip';
import type { SeriesDef } from './TrendAreaChart';

interface TrendLineChartProps {
  data: any[];
  xKey: string;
  series: SeriesDef[];
  height?: number;
  unit?: string;
  valueFormatter?: (v: number) => string;
  yDomain?: [number | 'auto', number | 'auto'];
}

export function TrendLineChart({
  data,
  xKey,
  series,
  height = 240,
  unit = '',
  valueFormatter,
  yDomain,
}: TrendLineChartProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey={xKey}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#6b7a93', fontSize: 11 }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#6b7a93', fontSize: 11 }}
            width={44}
            domain={yDomain ?? ['auto', 'auto']}
          />
          <Tooltip
            content={<CustomTooltip unit={unit} valueFormatter={valueFormatter} />}
            cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
          />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive
              animationDuration={1100}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
