'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, CornerDownLeft, ArrowUp, ArrowDown, Command } from 'lucide-react';
import { navItems } from '@/lib/nav';
import { cn } from '@/lib/utils';

interface CommandEntry {
  id: string;
  label: string;
  hint: string;
  href: string;
  group: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const entries = useMemo<CommandEntry[]>(() => {
    const modules: CommandEntry[] = navItems.map((n) => ({
      id: `nav-${n.href}`,
      label: n.label,
      hint: n.description,
      href: n.href,
      group: 'Modules',
      icon: n.icon,
      keywords: n.short,
    }));
    const actions: CommandEntry[] = [
      { id: 'act-copilot', label: 'Ask the AI Copilot', hint: 'Open conversational facility intelligence', href: '/copilot', group: 'Actions', icon: navItems[2].icon, keywords: 'chat ai assistant question' },
      { id: 'act-risk', label: 'Run Risk What-If Simulator', hint: 'Model mitigations on the risk index', href: '/risk-engine', group: 'Actions', icon: navItems[3].icon, keywords: 'simulate scenario score' },
      { id: 'act-emergency', label: 'Launch Emergency Drill', hint: 'Simulate a crisis response playbook', href: '/emergency', group: 'Actions', icon: navItems[5].icon, keywords: 'fire outage breach drill' },
      { id: 'act-twin', label: 'Open 3D Digital Twin', hint: 'Explore the live facility model', href: '/digital-twin', group: 'Actions', icon: navItems[1].icon, keywords: '3d model floors assets' },
    ];
    return [...modules, ...actions];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      `${e.label} ${e.hint} ${e.keywords ?? ''} ${e.group}`.toLowerCase().includes(q),
    );
  }, [entries, query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    function onTrigger() {
      setOpen(true);
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('cmdk:open', onTrigger);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('cmdk:open', onTrigger);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      // focus after mount
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  function select(entry: CommandEntry | undefined) {
    if (!entry) return;
    setOpen(false);
    router.push(entry.href);
  }

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      select(filtered[active]);
    }
  }

  let lastGroup = '';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="glass-strong relative z-10 w-full max-w-xl overflow-hidden p-0 shadow-glow"
            onKeyDown={onListKey}
          >
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search modules and actions…"
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none"
              />
              <span className="chip border-white/10 bg-white/[0.03] text-[10px] text-slate-500">ESC</span>
            </div>

            <div className="max-h-[52vh] overflow-y-auto p-2">
              {filtered.length === 0 && (
                <div className="px-3 py-8 text-center text-sm text-slate-500">No matches found.</div>
              )}
              {filtered.map((entry, i) => {
                const showGroup = entry.group !== lastGroup;
                lastGroup = entry.group;
                const Icon = entry.icon;
                const isActive = i === active;
                return (
                  <div key={entry.id}>
                    {showGroup && (
                      <div className="px-3 pb-1 pt-2 section-label">{entry.group}</div>
                    )}
                    <button
                      onMouseEnter={() => setActive(i)}
                      onClick={() => select(entry)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                        isActive ? 'bg-command-500/15' : 'hover:bg-white/[0.03]',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                          isActive
                            ? 'border-command-500/40 bg-command-500/15 text-command-200'
                            : 'border-white/[0.06] bg-white/[0.02] text-slate-400',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-slate-100">{entry.label}</span>
                        <span className="block truncate text-xs text-slate-500">{entry.hint}</span>
                      </span>
                      {isActive && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-command-300" />}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2.5 text-[11px] text-slate-600">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <ArrowUp className="h-3 w-3" />
                  <ArrowDown className="h-3 w-3" /> navigate
                </span>
                <span className="flex items-center gap-1">
                  <CornerDownLeft className="h-3 w-3" /> open
                </span>
              </div>
              <span className="flex items-center gap-1">
                <Command className="h-3 w-3" /> POLICE TWIN AI
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
