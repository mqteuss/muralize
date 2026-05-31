import { LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { InstallPwaButton } from '@/components/pwa/InstallPwaButton';
import { PushNotificationButton } from '@/components/pwa/PushNotificationButton';
import { SchoolEvent } from '@/lib/events';

interface Props {
  events: SchoolEvent[];
  onLogoutClick: () => void;
}

export function AppHeader({ onLogoutClick }: Props) {
  const { user, loading: authLoading, signIn } = useAuth();

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
          <PushNotificationButton />

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
