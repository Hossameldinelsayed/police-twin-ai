'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from '@/lib/nav';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-ink-950/85 backdrop-blur-2xl lg:hidden">
      <div className="flex items-stretch justify-between overflow-x-auto px-2 py-1.5">
        {navItems.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-[64px] flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors',
                active ? 'text-command-300' : 'text-slate-500',
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.short}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
