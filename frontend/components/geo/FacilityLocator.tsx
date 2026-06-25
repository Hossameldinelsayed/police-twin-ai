import { MapPin, Navigation, Radio } from 'lucide-react';
import { building } from '@/lib/data/facility';

// Self-contained "tactical" geo-locator — pure SVG, no external map tiles,
// no API keys, works fully offline. On-brand for a command center.

interface SitePin {
  id: string;
  label: string;
  x: number; // % within the map area
  y: number;
  primary?: boolean;
  status: 'online' | 'standby';
}

const sites: SitePin[] = [
  { id: 'hq', label: building.code, x: 50, y: 48, primary: true, status: 'online' },
  { id: 's1', label: 'District Stn 4', x: 26, y: 30, status: 'online' },
  { id: 's2', label: 'Patrol Hub 2', x: 74, y: 64, status: 'online' },
  { id: 's3', label: 'Checkpoint 9', x: 70, y: 24, status: 'standby' },
];

export function FacilityLocator() {
  return (
    <div className="glass glass-hover relative overflow-hidden p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-100">Facility Locator</h2>
          <p className="mt-0.5 text-xs text-slate-500">{building.address}</p>
        </div>
        <span className="chip border-command-500/30 bg-command-500/10 text-command-300">
          <Navigation className="h-3 w-3" /> 25.2048° N, 55.2708° E
        </span>
      </div>

      <div className="relative h-[260px] w-full overflow-hidden rounded-xl border border-white/[0.06] bg-ink-950">
        {/* Map grid + roads */}
        <svg viewBox="0 0 400 260" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="mapgrid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M28 0H0V28" fill="none" stroke="rgba(255,255,255,0.045)" strokeWidth="1" />
            </pattern>
            <radialGradient id="mapglow" cx="50%" cy="48%" r="55%">
              <stop offset="0%" stopColor="rgba(6,174,219,0.16)" />
              <stop offset="100%" stopColor="rgba(6,174,219,0)" />
            </radialGradient>
          </defs>
          <rect width="400" height="260" fill="url(#mapgrid)" />
          <rect width="400" height="260" fill="url(#mapglow)" />
          {/* stylized arterial roads */}
          <g stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" strokeLinecap="round">
            <path d="M-10 70 L180 90 L420 60" />
            <path d="M40 -10 L120 130 L90 280" />
            <path d="M-10 200 L200 170 L420 210" />
            <path d="M300 -10 L260 140 L320 280" />
          </g>
          <g stroke="rgba(6,174,219,0.18)" strokeWidth="1.5" fill="none">
            <path d="M-10 70 L180 90 L420 60" />
            <path d="M-10 200 L200 170 L420 210" />
          </g>
          {/* concentric range rings around HQ */}
          <g stroke="rgba(6,174,219,0.22)" fill="none">
            <circle cx="200" cy="125" r="46" strokeDasharray="2 5" />
            <circle cx="200" cy="125" r="84" strokeDasharray="2 6" opacity="0.6" />
            <circle cx="200" cy="125" r="120" strokeDasharray="2 7" opacity="0.35" />
          </g>
        </svg>

        {/* Radar sweep */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2">
          <div
            className="h-full w-full animate-sweep rounded-full"
            style={{
              background:
                'conic-gradient(from 0deg, rgba(6,174,219,0.22), rgba(6,174,219,0) 60deg)',
              maskImage: 'radial-gradient(circle, #000 60%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(circle, #000 60%, transparent 70%)',
            }}
          />
        </div>

        {/* Site markers */}
        {sites.map((s) => (
          <div
            key={s.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
          >
            {s.primary ? (
              <div className="relative flex flex-col items-center">
                <span className="absolute h-8 w-8 animate-pulse-ring rounded-full bg-command-400/40" />
                <span className="relative flex h-6 w-6 items-center justify-center rounded-full border border-command-300/60 bg-command-500/30 shadow-glow">
                  <MapPin className="h-3.5 w-3.5 text-command-100" />
                </span>
                <span className="mt-1 whitespace-nowrap rounded-md border border-command-500/30 bg-ink-950/80 px-1.5 py-0.5 text-[10px] font-medium text-command-200 backdrop-blur-sm">
                  {s.label}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    s.status === 'online' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                  style={{ boxShadow: '0 0 8px currentColor' }}
                />
                <span className="mt-1 whitespace-nowrap rounded bg-ink-950/70 px-1 py-0.5 text-[9px] text-slate-400 backdrop-blur-sm">
                  {s.label}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-xs">
        <span className="flex items-center gap-1.5 text-slate-500">
          <Radio className="h-3.5 w-3.5 text-emerald-300" />
          {sites.filter((s) => s.status === 'online').length} sites online · {sites.length} in network
        </span>
        <span className="text-slate-600">Smart City mesh · Sector 7</span>
      </div>
    </div>
  );
}
