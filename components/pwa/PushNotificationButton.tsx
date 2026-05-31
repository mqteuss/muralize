'use client';

import { Bell, BellOff, BellRing, RefreshCw } from 'lucide-react';
import { useFcmNotifications } from '@/hooks/useFcmNotifications';

interface Props {
  variant?: 'icon' | 'row';
}

function statusLabel(status: ReturnType<typeof useFcmNotifications>['status']) {
  if (status === 'granted') return 'Notificações ativas';
  if (status === 'denied') return 'Permissão bloqueada';
  if (status === 'missing-key') return 'VAPID Key ausente';
  if (status === 'unsupported') return 'Indisponível neste navegador';
  if (status === 'loading') return 'Sincronizando...';
  if (status === 'checking') return 'Verificando...';
  if (status === 'error') return 'Tentar sincronizar';
  return 'Ativar notificações';
}

function statusTitle(status: ReturnType<typeof useFcmNotifications>['status'], errorMessage?: string) {
  if (errorMessage) return errorMessage;
  if (status === 'missing-key') return 'Configure NEXT_PUBLIC_FIREBASE_VAPID_KEY na Vercel e faça redeploy.';
  if (status === 'denied') return 'As notificações foram bloqueadas. Libere nas configurações do navegador/site.';
  if (status === 'unsupported') return 'Notificações indisponíveis neste navegador.';
  if (status === 'granted') return 'Toque para sincronizar novamente o token no Firestore.';
  if (status === 'error') return 'Houve uma falha. Toque para tentar sincronizar novamente.';
  return 'Ativar notificações push.';
}

export function PushNotificationButton({ variant = 'icon' }: Props) {
  const { status, requestPushPermission, errorMessage, lastSyncedAt } = useFcmNotifications();

  if (status === 'unsupported' && variant === 'icon') return null;

  const disabled = status === 'loading' || status === 'checking' || status === 'missing-key' || status === 'unsupported';
  const title = statusTitle(status, errorMessage);
  const isBusy = status === 'loading' || status === 'checking';
  const icon = isBusy
    ? <BellRing className="h-4 w-4 animate-pulse" />
    : status === 'granted'
      ? <Bell className="h-4 w-4" />
      : status === 'error'
        ? <RefreshCw className="h-4 w-4" />
        : <BellOff className="h-4 w-4" />;

  if (variant === 'row') {
    return (
      <div className="w-full space-y-1.5">
        <button
          type="button"
          onClick={requestPushPermission}
          disabled={disabled}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--app-surface)] px-4 py-2.5 text-sm font-medium text-[var(--app-text)] ring-1 ring-[var(--app-border-soft)] transition-colors hover:bg-[var(--app-surface-hover)] disabled:cursor-default disabled:opacity-75 disabled:hover:bg-[var(--app-surface)]"
          title={title}
        >
          {icon}
          {status === 'granted' ? 'Sincronizar notificações' : statusLabel(status)}
        </button>

        {status === 'granted' && lastSyncedAt && (
          <p className="text-center text-[11px] text-[var(--app-text-muted)]">
            Token sincronizado neste dispositivo.
          </p>
        )}

        {errorMessage && (
          <p className="text-center text-[11px] text-red-600">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }

  if (status === 'granted') {
    return (
      <button
        type="button"
        onClick={requestPushPermission}
        className="rounded-full p-2 text-[#49454F] transition-colors hover:bg-[#F4EFF4]"
        title="Sincronizar notificações push"
        aria-label="Sincronizar notificações push"
      >
        <Bell className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={requestPushPermission}
      disabled={disabled}
      className="rounded-full p-2 text-[#49454F] transition-colors hover:bg-[#F4EFF4] disabled:opacity-50 disabled:hover:bg-transparent"
      title={title}
      aria-label={title}
    >
      {isBusy ? <BellRing className="h-5 w-5 animate-pulse" /> : <BellOff className="h-5 w-5" />}
    </button>
  );
}
