'use client';

import { Bell, BellOff, BellRing } from 'lucide-react';
import { useFcmNotifications } from '@/hooks/useFcmNotifications';

export function PushNotificationButton() {
  const { status, requestPushPermission } = useFcmNotifications();

  if (status === 'unsupported') return null;

  if (status === 'granted') {
    return (
      <div className="p-2 text-[#49454F]" title="Notificações push ativas" aria-label="Notificações push ativas">
        <Bell className="w-5 h-5" />
      </div>
    );
  }

  const disabled = status === 'loading' || status === 'denied' || status === 'missing-key' || status === 'checking';
  const title = status === 'missing-key'
    ? 'Configure NEXT_PUBLIC_FIREBASE_VAPID_KEY para ativar push'
    : status === 'denied'
      ? 'Notificações bloqueadas pelo navegador'
      : 'Ativar notificações push';

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
