'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldHalf, Activity } from 'lucide-react';
import { navItems } from '@/lib/nav';
import { building } from '@/lib/data/facility';
import { kpiSummary } from '@/lib/ai';
import { riskCategoryMeta, cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const meta = riskCategoryMeta(kpiSummary.riskCategory);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-white/[0.06] bg-ink-950/60 backdrop-blur-2xl lg:flex">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-command-500/30 bg-command-500/10 shadow-glow">
          <ShieldHalf className="h-5 w-5 text-command-300" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-ink-950" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight text-white">
            POLICE<span className="text-command-400"> TWIN</span> AI
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
            Command Platform
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        <div className="px-2 pb-2 pt-1 section-label">Modules</div>
        {navItems.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                active
                  ? 'bg-command-500/10 text-white'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100',
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-command-400"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <Icon
                className={cn(
                  'h-[18px] w-[18px] shrink-0',
                  active ? 'text-command-300' : 'text-slate-500 group-hover:text-slate-300',
                )}
              />
              <span className="flex-1 font-medium">{item.label}</span>
              <span className="text-[10px] font-mono text-slate-600">{item.module}</span>
            </Link>
          );
        })}
      </nav>

      {/* Facility status footer */}
      <div className="m-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="flex items-center justify-between">
          <span className="section-label">Facility</span>
          <span className="chip border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
            <Activity className="h-3 w-3" /> {building.status}
          </span>
        </div>
        <div className="mt-2 text-xs font-medium text-slate-200">{building.name}</div>
        <div className="text-[11px] text-slate-500">{building.code}</div>
        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5">
          <span className="text-[11px] text-slate-500">Risk index</span>
          <span className="data-num text-sm font-semibold" style={{ color: meta.hex }}>
            {kpiSummary.riskScore} | {kpiSummary.riskCategory}
          </span>
        </div>
      </div>
    </aside>
  );
}
