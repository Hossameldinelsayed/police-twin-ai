import {
  Flame,
  ShieldAlert,
  Wrench,
  Zap,
  DoorOpen,
  Wind,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import type { Alarm, AlarmType } from '@/lib/types';
import { floorName } from '@/lib/data/facility';
import { relativeTime, severityMeta, cn } from '@/lib/utils';

const typeIcon: Record<AlarmType, LucideIcon> = {
  fire: Flame,
  security: ShieldAlert,
  maintenance: Wrench,
  power: Zap,
  access: DoorOpen,
  environmental: Wind,
  network: Wifi,
};

export function AlarmFeed({
  alarms,
  limit,
  className,
}: {
  alarms: Alarm[];
  limit?: number;
  className?: string;
}) {
  const list = limit ? alarms.slice(0, limit) : alarms;
  return (
    <div className={cn('space-y-2', className)}>
      {list.map((a) => {
        const Icon = typeIcon[a.type];
        const m = severityMeta[a.severity];
        return (
          <div
            key={a.id}
            className="group flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] p-3 transition-colors hover:border-white/10 hover:bg-white/[0.03]"
          >
            <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border', m.bg, m.border, m.text)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-slate-100">{a.title}</p>
                <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', m.dot)} />
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-400">{a.message}</p>
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500">
                <span className={cn('font-medium', m.text)}>{m.label}</span>
                <span className="text-slate-600">•</span>
                <span>{floorName(a.floorId)}</span>
                <span className="text-slate-600">•</span>
                <span className="data-num">{relativeTime(a.timestamp)}</span>
                {a.status !== 'active' && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="capitalize text-slate-500">{a.status}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {list.length === 0 && (
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-6 text-center text-sm text-slate-500">
          No alarms to display.
        </div>
      )}
    </div>
  );
}
