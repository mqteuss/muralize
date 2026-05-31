import { Bell, BookOpenCheck, CheckCircle2, LogIn, LogOut, Moon, Smartphone, Sun, UserRound, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { InstallPwaButton } from '@/components/pwa/InstallPwaButton';
import { PushNotificationButton } from '@/components/pwa/PushNotificationButton';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  isOpen: boolean;
  isAdmin: boolean;
  loadedFromCache: boolean;
  onClose: () => void;
  onLogoutClick: () => void;
  onOpenOnboarding: () => void;
}

function SettingsRow({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-[var(--app-surface-soft)] p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-[var(--app-surface)] p-2 text-[var(--app-text-muted)]">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--app-text)]">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--app-text-muted)]">{description}</p>
          {children && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </div>
  );
}

export function SettingsDrawer({ isOpen, isAdmin, loadedFromCache, onClose, onLogoutClick, onOpenOnboarding }: Props) {
  const { user, loading: authLoading, signIn } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOpen) return null;

  const isDark = resolvedTheme === 'dark';

  return (
    <SideDrawer title="Menu" description="Configurações rápidas do Muralize." onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-3xl bg-[var(--app-surface-soft)] p-4">
          <img src="/icons/icon-192x192.png" alt="Muralize" className="h-12 w-12 rounded-2xl bg-[#fefefe]" />
          <div className="min-w-0">
            <p className="font-semibold text-[var(--app-text)]">Muralize</p>
            <p className="text-xs text-[var(--app-text-muted)]">
              {isAdmin ? 'Admin ativo' : user ? 'Conta conectada' : 'Visualização pública'}
            </p>
          </div>
        </div>

        <SettingsRow
          icon={<UserRound className="h-5 w-5" />}
          title={user ? 'Conta conectada' : 'Acesso administrativo'}
          description={user ? user.email || 'Usuário autenticado.' : 'Entre para criar e administrar eventos.'}
        >
          {authLoading ? null : user ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogoutClick();
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--app-primary)] px-4 py-2.5 text-sm font-medium text-[var(--app-primary-text)] transition-colors hover:bg-[var(--app-primary-hover)]"
            >
              <LogOut className="h-4 w-4" />
              Sair da conta
            </button>
          ) : (
            <button
              type="button"
              onClick={signIn}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--app-primary)] px-4 py-2.5 text-sm font-medium text-[var(--app-primary-text)] transition-colors hover:bg-[var(--app-primary-hover)]"
            >
              <LogIn className="h-4 w-4" />
              Entrar como admin
            </button>
          )}
        </SettingsRow>

        <SettingsRow
          icon={isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          title="Aparência"
          description={isDark ? 'Tema escuro ativo.' : 'Tema claro ativo.'}
        >
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--app-surface)] px-4 py-2.5 text-sm font-medium text-[var(--app-text)] ring-1 ring-[var(--app-border-soft)] transition-colors hover:bg-[var(--app-surface-hover)]"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
          </button>
        </SettingsRow>

        <SettingsRow
          icon={<BookOpenCheck className="h-5 w-5" />}
          title="Tutorial rápido"
          description="Veja novamente as boas-vindas, os filtros, notificações e instalação do app."
        >
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenOnboarding();
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--app-surface)] px-4 py-2.5 text-sm font-medium text-[var(--app-text)] ring-1 ring-[var(--app-border-soft)] transition-colors hover:bg-[var(--app-surface-hover)]"
          >
            <BookOpenCheck className="h-4 w-4" />
            Ver tutorial novamente
          </button>
        </SettingsRow>

        <SettingsRow
          icon={<Smartphone className="h-5 w-5" />}
          title="Instalar app"
          description="Use o Muralize como aplicativo no celular ou computador."
        >
          <InstallPwaButton variant="row" />
        </SettingsRow>

        <SettingsRow
          icon={<Bell className="h-5 w-5" />}
          title="Notificações"
          description="Permita avisos do mural quando novas notificações forem enviadas."
        >
          <PushNotificationButton variant="row" />
        </SettingsRow>

        <SettingsRow
          icon={isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
          title="Conexão e cache"
          description={loadedFromCache ? 'Exibindo dados salvos offline neste dispositivo.' : 'Sincronização online ativa quando o Firebase responde.'}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--app-surface)] px-3 py-2 text-xs font-medium text-[var(--app-text-muted)] ring-1 ring-[var(--app-border-soft)]">
            <CheckCircle2 className="h-4 w-4" />
            {isOnline ? 'Online' : 'Offline'} · {loadedFromCache ? 'Cache local' : 'Dados atualizados'}
          </div>
        </SettingsRow>
      </div>
    </SideDrawer>
  );
}
