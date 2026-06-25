'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bot, Bell, ShieldHalf, ChevronRight, Search } from 'lucide-react';
import { navItems } from '@/lib/nav';
import { activeAlarms } from '@/lib/data/alarms';
import { kpiSummary } from '@/lib/ai';
import { riskCategoryMeta } from '@/lib/utils';

export function Topbar() {
  const pathname = usePathname();
  const [clock, setClock] = useState('');
  const current = navItems.find((n) =>
    n.href === '/' ? pathname === '/' : pathname.startsWith(n.href),
  );
  const meta = riskCategoryMeta(kpiSummary.riskCategory);

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Dubai',
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-950/55 backdrop-blur-2xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left: brand (mobile) + breadcrumb */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-command-500/30 bg-command-500/10">
              <ShieldHalf className="h-4 w-4 text-command-300" />
            </div>
            <span className="text-sm font-semibold text-white">PT | AI</span>
          </div>
          <div className="hidden items-center gap-2 text-sm text-slate-400 sm:flex">
            <span className="text-slate-500">Platform</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            <span className="font-medium text-slate-200">{current?.label ?? 'Overview'}</span>
          </div>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('cmdk:open'))}
            className="hidden items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-slate-500 transition-colors hover:border-white/15 hover:text-slate-300 md:flex"
            aria-label="Open command palette"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="text-xs">Search…</span>
            <span className="chip border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-slate-500">⌘K</span>
          </button>

          <div className="hidden items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 md:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span className="data-num text-xs text-slate-300">{clock || '--:--:--'}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-600">GST</span>
          </div>

          <div
            className="hidden items-center gap-2 rounded-lg border px-3 py-1.5 sm:flex"
            style={{ borderColor: `${meta.hex}44`, background: `${meta.hex}14` }}
          >
            <span className="text-[10px] uppercase tracking-wider text-slate-400">Risk</span>
            <span className="data-num text-xs font-semibold" style={{ color: meta.hex }}>
              {kpiSummary.riskScore} | {kpiSummary.riskCategory}
            </span>
          </div>

          <button
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-slate-300 transition-colors hover:border-white/15 hover:text-white"
            aria-label="Alerts"
          >
            <Bell className="h-[18px] w-[18px]" />
            {activeAlarms.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {activeAlarms.length}
              </span>
            )}
          </button>

          <Link
            href="/copilot"
            className="flex items-center gap-2 rounded-lg border border-cognition-500/30 bg-cognition-500/10 px-3 py-2 text-sm font-medium text-cognition-300 transition-all hover:bg-cognition-500/20 hover:shadow-glow-violet"
          >
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">Ask Copilot</span>
          </Link>

          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-command-500/30 to-cognition-500/30 text-xs font-semibold text-white">
            OC
          </div>
        </div>
      </div>
    </header>
  );
}
