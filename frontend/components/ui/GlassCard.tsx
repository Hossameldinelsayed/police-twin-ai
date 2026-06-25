import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Adds a soft accent glow ring. */
  glow?: 'none' | 'command' | 'violet' | 'red';
  hover?: boolean;
  sheen?: boolean;
  padded?: boolean;
}

const glowMap: Record<NonNullable<GlassCardProps['glow']>, string> = {
  none: '',
  command: 'shadow-glow',
  violet: 'shadow-glow-violet',
  red: 'shadow-glow-red',
};

export function GlassCard({
  children,
  className,
  glow = 'none',
  hover = false,
  sheen = false,
  padded = true,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'glass',
        padded && 'p-5',
        hover && 'glass-hover',
        sheen && 'sheen',
        glowMap[glow],
        className,
      )}
    >
      {children}
    </div>
  );
}
