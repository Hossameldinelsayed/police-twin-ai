'use client';

import type { TooltipProps } from 'recharts';

export function CustomTooltip({
  active,
  payload,
  label,
  unit = '',
  valueFormatter,
}: TooltipProps<number, string> & {
  unit?: string;
  valueFormatter?: (v: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-ink-850/95 px-3 py-2 shadow-glass backdrop-blur-xl">
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey as string} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color as string }}
            />
            <span className="text-slate-400">{entry.name}</span>
            <span className="data-num ml-auto font-semibold text-slate-100">
              {valueFormatter
                ? valueFormatter(entry.value as number)
                : `${(entry.value as number).toLocaleString('en-US')}${unit}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
