import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';
import { CommandPalette } from '@/components/command/CommandPalette';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="app-backdrop" />
      <div className="app-grid" />
      <Sidebar />
      <div className="lg:pl-[264px]">
        <Topbar />
        <main className="mx-auto w-full max-w-[1600px] px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
          {children}
          <Footer />
        </main>
      </div>
      <MobileNav />
      <CommandPalette />
    </div>
  );
}
