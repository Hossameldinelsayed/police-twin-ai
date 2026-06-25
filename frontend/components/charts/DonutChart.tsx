'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CustomTooltip } from './CustomTooltip';

export interface DonutDatum {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutDatum[];
  height?: number;
  centerLabel?: string;
  centerValue?: string;
  unit?: string;
  valueFormatter?: (v: number) => string;
}

export function DonutChart({
  data,
  height = 220,
  centerLabel,
  centerValue,
  unit = '',
  valueFormatter,
}: DonutChartProps) {
  return (
    <div className="relative" style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={2}
            stroke="none"
            isAnimationActive
            animationDuration={900}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip unit={unit} valueFormatter={valueFormatter} />} />
        </PieChart>
      </ResponsiveContainer>
      {(centerValue || centerLabel) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && (
            <span className="data-num text-2xl font-bold text-white">{centerValue}</span>
          )}
          {centerLabel && (
            <span className="text-[11px] uppercase tracking-wider text-slate-500">{centerLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
