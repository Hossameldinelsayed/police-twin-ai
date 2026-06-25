import { ShieldHalf } from 'lucide-react';
import { NOW } from '@/lib/utils';

export function Footer() {
  const year = NOW.getFullYear();
  return (
    <footer className="mt-10 border-t border-white/[0.06] pt-5">
      <div className="flex flex-col items-center justify-between gap-3 text-xs text-slate-600 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-command-500/20 bg-command-500/10 text-command-300">
            <ShieldHalf className="h-3.5 w-3.5" />
          </span>
          <span className="font-medium tracking-tight text-slate-400">
            POLICE<span className="text-command-400/80"> TWIN</span> AI
          </span>
          <span className="text-slate-700">·</span>
          <span className="tracking-tight">© {year}</span>
        </div>
        <div className="text-slate-600">
          Executive demonstration build · all data &amp; AI are simulated
        </div>
      </div>
    </footer>
  );
}
