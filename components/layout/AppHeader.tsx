import { Menu, ShieldCheck, WifiOff } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { SettingsDrawer } from '@/components/layout/SettingsDrawer';
import { SchoolEvent } from '@/lib/events';

interface Props {
  events: SchoolEvent[];
  isAdmin: boolean;
  loadedFromCache: boolean;
  onLogoutClick: () => void;
}

export function AppHeader({ isAdmin, loadedFromCache, onLogoutClick }: Props) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--app-border-soft)] bg-[#fefefe]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/icons/icon-192x192.png"
              alt=""
              className="h-9 w-9 shrink-0 rounded-2xl border border-[var(--app-border)] bg-[#fefefe] shadow-sm"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight text-[var(--app-text)]">Muralize</h1>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--app-text-muted)]">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--app-surface-soft)] px-2 py-0.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Admin
                  </span>
                ) : (
                  <span>Mural público</span>
                )}
                {loadedFromCache && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                    <WifiOff className="h-3.5 w-3.5" />
                    Offline
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="rounded-full p-2 text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-surface-soft)]"
            title="Abrir menu"
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isDrawerOpen && (
          <SettingsDrawer
            isOpen={isDrawerOpen}
            isAdmin={isAdmin}
            loadedFromCache={loadedFromCache}
            onClose={() => setIsDrawerOpen(false)}
            onLogoutClick={onLogoutClick}
          />
        )}
      </AnimatePresence>
    </>
  );
}
