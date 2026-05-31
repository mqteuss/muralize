import { Bell, BellOff, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { InstallPwaButton } from '@/components/pwa/InstallPwaButton';
import { useNotifications } from '@/hooks/useNotifications';
import { SchoolEvent } from '@/lib/events';

interface Props {
  events: SchoolEvent[];
  onLogoutClick: () => void;
}

export function AppHeader({ events, onLogoutClick }: Props) {
  const { user, loading: authLoading, signIn } = useAuth();
  const { permission, requestPermission } = useNotifications(events);

  return (
    <header className="sticky top-0 z-10 bg-[#fefefe]/80 backdrop-blur-md border-b border-[#e5e5e9]">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src="/icons/icon-192x192.png"
            alt=""
            className="w-8 h-8 rounded-xl border border-[#E6E0E9] bg-[#fefefe] shadow-sm shrink-0"
            aria-hidden="true"
          />
          <h1 className="text-lg font-medium tracking-tight text-[#1D1B20] truncate">Muralize</h1>
        </div>

        <div className="flex items-center gap-2">
          <InstallPwaButton />

          {user && permission !== 'granted' && typeof window !== 'undefined' && 'Notification' in window && (
            <button
              type="button"
              onClick={requestPermission}
              className="p-2 text-[#49454F] hover:bg-[#F4EFF4] rounded-full transition-colors"
              title="Ativar Notificações"
              aria-label="Ativar Notificações"
            >
              <BellOff className="w-5 h-5" />
            </button>
          )}

          {user && permission === 'granted' && (
            <div className="p-2 text-[#49454F]" title="Notificações ativas" aria-label="Notificações ativas">
              <Bell className="w-5 h-5" />
            </div>
          )}

          {authLoading ? null : user ? (
            <button
              type="button"
              onClick={onLogoutClick}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#49454F] hover:bg-[#F4EFF4] rounded-full transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={signIn}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#ECE6F0] text-[#1D1B20] hover:bg-[#E2DCE6] rounded-full transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Admin
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
