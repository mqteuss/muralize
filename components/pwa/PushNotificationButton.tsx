'use client';

import { Bell, BellOff, BellRing } from 'lucide-react';
import { useFcmNotifications } from '@/hooks/useFcmNotifications';

interface Props {
  variant?: 'icon' | 'row';
}

function statusLabel(status: ReturnType<typeof useFcmNotifications>['status']) {
  if (status === 'granted') return 'Notificações ativas';
  if (status === 'denied') return 'Bloqueadas pelo navegador';
  if (status === 'missing-key') return 'VAPID Key ausente';
  if (status === 'unsupported') return 'Indisponível neste navegador';
  if (status === 'loading' || status === 'checking') return 'Verificando...';
  return 'Ativar notificações';
}

export function PushNotificationButton({ variant = 'icon' }: Props) {
  const { status, requestPushPermission } = useFcmNotifications();

  if (status === 'unsupported' && variant === 'icon') return null;

  const disabled = status === 'loading' || status === 'denied' || status === 'missing-key' || status === 'checking' || status === 'unsupported';
  const title = status === 'missing-key'
    ? 'Configure NEXT_PUBLIC_FIREBASE_VAPID_KEY para ativar push'
    : status === 'denied'
      ? 'Notificações bloqueadas pelo navegador'
      : status === 'unsupported'
        ? 'Notificações indisponíveis neste navegador'
        : 'Ativar notificações push';

  if (variant === 'row') {
    if (status === 'granted') {
      return (
        <div className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--app-surface)] px-4 py-2.5 text-sm font-medium text-[var(--app-text)] ring-1 ring-[var(--app-border-soft)]">
          <Bell className="h-4 w-4" />
          {statusLabel(status)}
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={requestPushPermission}
        disabled={disabled}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--app-surface)] px-4 py-2.5 text-sm font-medium text-[var(--app-text)] ring-1 ring-[var(--app-border-soft)] transition-colors hover:bg-[var(--app-surface-hover)] disabled:cursor-not-allowed disabled:opacity-55"
        title={title}
      >
        {status === 'loading' || status === 'checking' ? <BellRing className="h-4 w-4 animate-pulse" /> : <BellOff className="h-4 w-4" />}
        {statusLabel(status)}
      </button>
    );
  }

  if (status === 'granted') {
    return (
      <div className="p-2 text-[#49454F]" title="Notificações push ativas" aria-label="Notificações push ativas">
        <Bell className="w-5 h-5" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={requestPushPermission}
      disabled={disabled}
      className="p-2 text-[#49454F] hover:bg-[#F4EFF4] rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
      title={title}
      aria-label={title}
    >
      {status === 'loading' ? <BellRing className="w-5 h-5 animate-pulse" /> : <BellOff className="w-5 h-5" />}
    </button>
  );
}
