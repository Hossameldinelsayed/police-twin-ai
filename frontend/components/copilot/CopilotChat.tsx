'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Send, User, Sparkles, ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import type { CopilotResponse } from '@/lib/types';
import { copilotRespond, suggestedQuestions } from '@/lib/ai';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Rich text - split on **bold** markdown and wrap odd segments.
// ---------------------------------------------------------------------------
function renderRich(text: string): ReactNode[] {
  return text.split('**').map((seg, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-white">
        {seg}
      </strong>
    ) : (
      <span key={i}>{seg}</span>
    ),
  );
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  response?: CopilotResponse;
  text?: string;
}

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text:
    "I'm your **AI Facility Copilot**, grounded on the live state of Central Command HQ - risk model, alarms, telemetry and predictive maintenance. Ask me anything, or start with one of these:",
};

// ---------------------------------------------------------------------------
// Assistant response body
// ---------------------------------------------------------------------------
function ResponseBody({
  response,
  onFollowUp,
}: {
  response: CopilotResponse;
  onFollowUp: (q: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-slate-200">{renderRich(response.answer)}</p>

      {response.bullets.length > 0 && (
        <ul className="space-y-1.5">
          {response.bullets.map((b, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-300">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-cognition-400/70" />
              <span>{renderRich(b)}</span>
            </li>
          ))}
        </ul>
      )}

      {response.citations.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {response.citations.map((c, i) => (
            <span
              key={i}
              className="chip border-white/[0.08] bg-white/[0.03] text-slate-400"
            >
              <span className="text-slate-500">{c.label}</span>
              <span className="data-num font-semibold text-slate-200">{c.value}</span>
            </span>
          ))}
        </div>
      )}

      {response.followUps.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {response.followUps.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onFollowUp(q)}
              className="focus-ring group inline-flex items-center gap-1.5 rounded-full border border-cognition-500/25 bg-cognition-500/[0.08] px-3 py-1.5 text-xs font-medium text-cognition-200 transition-all hover:border-cognition-400/50 hover:bg-cognition-500/[0.16]"
            >
              {q}
              <ArrowUpRight className="h-3 w-3 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Typing indicator - three pulsing dots
// ---------------------------------------------------------------------------
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-cognition-300"
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
      <span className="ml-1 text-xs text-slate-500">Copilot is analysing live state…</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Avatars
// ---------------------------------------------------------------------------
function Avatar({ role }: { role: 'user' | 'assistant' }) {
  if (role === 'assistant') {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cognition-500/30 bg-cognition-500/10 text-cognition-300 shadow-glow-violet">
        <Bot className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </div>
    );
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300">
      <User className="h-[18px] w-[18px]" strokeWidth={1.75} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
let _seq = 0;
function nextId() {
  _seq += 1;
  return `m${_seq}`;
}

export function CopilotChat({ className }: { className?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll to newest.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, thinking]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function submit(raw: string) {
    const query = raw.trim();
    if (!query || thinking) return;

    const userMsg: ChatMessage = { id: nextId(), role: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    // Deterministic-ish latency between 600-900ms (no Math.random at module scope).
    const delay = 600 + (query.length % 4) * 75;
    timerRef.current = setTimeout(() => {
      const response = copilotRespond(query);
      setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', response }]);
      setThinking(false);
    }, delay);
  }

  const showWelcomeChips = messages.length === 1;

  return (
    <div className={cn('glass flex h-[640px] flex-col overflow-hidden p-0', className)}>
      {/* Header strip */}
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-white/[0.015] px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-cognition-500/30 bg-cognition-500/10 text-cognition-300 shadow-glow-violet">
            <Sparkles className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-white">AI Facility Copilot</h2>
              <span className="chip border-cognition-500/30 bg-cognition-500/10 text-cognition-200">
                <Bot className="h-3 w-3" /> GPT-grade reasoning
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">Grounded on live facility state</p>
          </div>
        </div>
        <span className="chip border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          Active
        </span>
      </div>

      {/* Thread */}
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className={cn('flex gap-3', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
            >
              <Avatar role={m.role} />
              <div
                className={cn(
                  'min-w-0 max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[80%]',
                  m.role === 'user'
                    ? 'rounded-tr-sm border border-command-500/25 bg-command-500/[0.10] text-slate-100'
                    : 'rounded-tl-sm border border-white/[0.06] bg-white/[0.025]',
                )}
              >
                {m.role === 'user' ? (
                  <p className="text-sm leading-relaxed">{m.text}</p>
                ) : m.response ? (
                  <ResponseBody response={m.response} onFollowUp={submit} />
                ) : (
                  <p className="text-sm leading-relaxed text-slate-200">{renderRich(m.text ?? '')}</p>
                )}

                {/* Welcome suggestion chips */}
                {m.id === 'welcome' && showWelcomeChips && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {suggestedQuestions.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => submit(q)}
                        className="focus-ring group inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-cognition-400/40 hover:bg-cognition-500/[0.12] hover:text-cognition-100"
                      >
                        {q}
                        <ArrowUpRight className="h-3 w-3 opacity-40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {thinking && (
            <motion.div
              key="typing"
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex gap-3"
            >
              <Avatar role="assistant" />
              <div className="rounded-2xl rounded-tl-sm border border-white/[0.06] bg-white/[0.025] px-4 py-3">
                <TypingIndicator />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-white/[0.06] bg-white/[0.015] px-4 py-3.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about risk, alarms, energy, maintenance…"
              className="focus-ring w-full rounded-xl border border-white/[0.08] bg-ink-900/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            className="focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cognition-500/30 bg-cognition-500/[0.14] text-cognition-200 transition-all hover:bg-cognition-500/[0.24] hover:shadow-glow-violet disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-cognition-500/[0.14] disabled:hover:shadow-none"
            aria-label="Send message"
          >
            <Send className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
        </form>
        <p className="mt-2 px-1 text-[11px] text-slate-600">
          Responses are generated from live facility telemetry | {suggestedQuestions.length} suggested prompts available
        </p>
      </div>
    </div>
  );
}
