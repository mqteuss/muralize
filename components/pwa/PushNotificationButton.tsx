'use client';

import { Bell, BellOff, BellRing } from 'lucide-react';
import { useFcmNotifications } from '@/hooks/useFcmNotifications';

interface Props {
  variant?: 'icon' | 'row';
}

function statusLabel(status: ReturnType<typeof useFcmNotifications>['status']) {
  if (status === 'granted') return 'Notificações ativas';
  if (status === 'denied') return 'Permissão bloqueada';
  if (status === 'missing-key') return 'VAPID Key ausente';
  if (status === 'unsupported') return 'Indisponível neste navegador';
  if (status === 'loading') return 'Ativando...';
  if (status === 'checking') return 'Verificando...';
  if (status === 'error') return 'Tentar ativar novamente';
  return 'Ativar notificações';
}

function statusTitle(status: ReturnType<typeof useFcmNotifications>['status']) {
  if (status === 'missing-key') return 'Configure NEXT_PUBLIC_FIREBASE_VAPID_KEY para ativar push';
  if (status === 'denied') return 'As notificações foram bloqueadas. Libere nas configurações do navegador/site.';
  if (status === 'unsupported') return 'Notificações indisponíveis neste navegador';
  if (status === 'error') return 'Houve uma falha temporária. Toque para tentar novamente.';
  return 'Ativar notificações push';
}

export function PushNotificationButton({ variant = 'icon' }: Props) {
  const { status, requestPushPermission } = useFcmNotifications();

  if (status === 'unsupported' && variant === 'icon') return null;

  const disabled = status === 'loading' || status === 'checking' || status === 'missing-key' || status === 'unsupported';
  const title = statusTitle(status);
  const icon = status === 'loading' || status === 'checking'
    ? <BellRing className="h-4 w-4 animate-pulse" />
    : status === 'granted'
      ? <Bell className="h-4 w-4" />
      : <BellOff className="h-4 w-4" />;

  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={requestPushPermission}
        disabled={disabled || status === 'granted'}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--app-surface)] px-4 py-2.5 text-sm font-medium text-[var(--app-text)] ring-1 ring-[var(--app-border-soft)] transition-colors hover:bg-[var(--app-surface-hover)] disabled:cursor-default disabled:opacity-75 disabled:hover:bg-[var(--app-surface)]"
        title={title}
      >
        {icon}
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
      className="rounded-full p-2 text-[#49454F] transition-colors hover:bg-[#F4EFF4] disabled:opacity-50 disabled:hover:bg-transparent"
      title={title}
      aria-label={title}
    >
      {status === 'loading' || status === 'checking' ? <BellRing className="h-5 w-5 animate-pulse" /> : <BellOff className="h-5 w-5" />}
    </button>
  );
}
