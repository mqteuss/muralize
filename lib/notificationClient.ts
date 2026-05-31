import { auth } from './firebase';
import type { EventPriority } from './events';

export type EventNotificationType = 'created' | 'published' | 'priority_up' | 'rescheduled';

export interface NotificationEventSnapshot {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  date?: string;
  isPublic?: boolean;
  isPinned?: boolean;
  priority?: EventPriority;
  deletedAt?: string | null;
}

export interface NotifyEventChangeInput {
  eventId: string;
  action: 'created' | 'updated';
  previousEvent?: NotificationEventSnapshot | null;
}

export interface NotifyEventSubscribersInput {
  type: EventNotificationType;
  event: NotificationEventSnapshot & { id: string };
  previousEvent?: NotificationEventSnapshot | null;
  dedupeKey?: string;
}

async function postNotificationPayload(payload: NotifyEventChangeInput | NotifyEventSubscribersInput) {
  const user = auth.currentUser;

  if (!user) {
    console.warn('Notificação não enviada: usuário não autenticado.');
    return null;
  }

  const idToken = await user.getIdToken(true);

  const response = await fetch('/api/notifications/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
    keepalive: true,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    console.error('Falha na API de notificações.', response.status, data);
    throw new Error(`Falha ao enviar notificação: HTTP ${response.status}`);
  }

  return data;
}

export async function notifyEventChange(input: NotifyEventChangeInput) {
  return postNotificationPayload(input);
}

export async function notifyEventSubscribers(input: NotifyEventSubscribersInput) {
  return postNotificationPayload(input);
}
