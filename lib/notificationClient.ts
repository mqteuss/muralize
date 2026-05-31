import { auth } from './firebase';
import type { EventPriority } from './events';

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

export async function notifyEventChange(input: NotifyEventChangeInput) {
  const user = auth.currentUser;

  if (!user) {
    console.warn('Notificação não enviada: usuário não autenticado.');
    return null;
  }

  const idToken = await user.getIdToken();

  const response = await fetch('/api/notifications/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(input),
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = await response.text().catch(() => null);
  }

  if (!response.ok) {
    console.error('Falha na API de notificações.', response.status, data);
    throw new Error(`Falha ao enviar notificação: HTTP ${response.status}`);
  }

  return data;
}
