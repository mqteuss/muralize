'use client';

import { auth } from './firebase';
import type { EventPriority } from './events';

export type EventNotificationType = 'created' | 'published' | 'priority_up' | 'rescheduled';

export interface EventNotificationPayload {
  id: string;
  title: string;
  description?: string;
  category?: string;
  date: string;
  isPublic: boolean;
  isPinned: boolean;
  priority: EventPriority;
}

interface NotifyEventSubscribersInput {
  type: EventNotificationType;
  event: EventNotificationPayload;
  dedupeKey: string;
}

export async function notifyEventSubscribers(input: NotifyEventSubscribersInput) {
  const user = auth.currentUser;

  if (!user) return { skipped: true, reason: 'not-authenticated' };
  if (!input.event.isPublic) return { skipped: true, reason: 'not-public' };

  const idToken = await user.getIdToken();

  const response = await fetch('/api/notifications/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => 'Falha ao enviar notificação.');
    throw new Error(message || 'Falha ao enviar notificação.');
  }

  return response.json();
}
