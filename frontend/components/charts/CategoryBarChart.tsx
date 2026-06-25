'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CustomTooltip } from './CustomTooltip';

interface CategoryBarChartProps {
  data: any[];
  xKey: string;
  barKey: string;
  barLabel: string;
  color?: string;
  colorByValue?: (v: number) => string;
  /** Per-bar colors aligned to `data` order (serializable; works from server components). */
  colors?: string[];
  height?: number;
  unit?: string;
  layout?: 'horizontal' | 'vertical';
  valueFormatter?: (v: number) => string;
}

export function CategoryBarChart({
  data,
  xKey,
  barKey,
  barLabel,
  color = '#06AEDB',
  colorByValue,
  colors,
  height = 240,
  unit = '',
  layout = 'horizontal',
  valueFormatter,
}: CategoryBarChartProps) {
  const vertical = layout === 'vertical';
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout={layout}
          margin={{ top: 8, right: 12, left: vertical ? 8 : -12, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={!vertical} vertical={vertical} />
          {vertical ? (
            <>
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: '#6b7a93', fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey={xKey}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#9fb0c7', fontSize: 11 }}
                width={120}
              />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={{ fill: '#6b7a93', fontSize: 11 }} minTickGap={8} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6b7a93', fontSize: 11 }} width={44} />
            </>
          )}
          <Tooltip
            content={<CustomTooltip unit={unit} valueFormatter={valueFormatter} />}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Bar dataKey={barKey} name={barLabel} radius={vertical ? [0, 6, 6, 0] : [6, 6, 0, 0]} isAnimationActive animationDuration={900}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={colors?.[i] ?? (colorByValue ? colorByValue(Number(d[barKey])) : color)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
