import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminAuth, adminDb, adminMessaging } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type NotificationAction = 'created' | 'updated';
type Priority = 'normal' | 'importante' | 'urgente';

interface EventSnapshot {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  date?: unknown;
  isPublic?: boolean;
  isPinned?: boolean;
  priority?: Priority;
  deletedAt?: unknown;
}

interface RequestBody {
  eventId?: string;
  action?: NotificationAction;
  previousEvent?: EventSnapshot | null;
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function getBearerToken(request: NextRequest) {
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

function normalizeDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as any).toDate === 'function') {
    return (value as any).toDate();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function formatDate(value: unknown) {
  const date = normalizeDate(value);
  if (!date) return '';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}

function toMillis(value: unknown) {
  return normalizeDate(value)?.getTime() || 0;
}

function normalizePriority(value: unknown): Priority {
  if (value === 'urgente' || value === 'importante' || value === 'normal') return value;
  return 'normal';
}

function buildNotification(action: NotificationAction, event: EventSnapshot, previousEvent?: EventSnapshot | null) {
  if (event.deletedAt) return null;
  if (event.isPublic !== true) return null;

  const title = event.title || 'Novo evento';
  const description = event.description || event.category || 'Confira os detalhes no Muralize.';
  const priority = normalizePriority(event.priority);
  const previousPriority = normalizePriority(previousEvent?.priority);
  const wasPublic = previousEvent?.isPublic === true;
  const dateChanged = Boolean(previousEvent) && toMillis(previousEvent?.date) !== toMillis(event.date);
  const becamePublic = action === 'updated' && previousEvent?.isPublic === false && event.isPublic === true;
  const priorityRaised = action === 'updated'
    && priority !== previousPriority
    && (priority === 'importante' || priority === 'urgente')
    && previousPriority !== 'urgente';

  if (action === 'created') {
    return {
      reason: 'created',
      logId: `created-${event.id}`,
      title: 'Novo evento no Muralize',
      body: `${title}${event.date ? ` • ${formatDate(event.date)}` : ''}`,
    };
  }

  if (becamePublic) {
    return {
      reason: 'published',
      logId: `published-${event.id}-${toMillis(event.date)}`,
      title: 'Evento publicado no Muralize',
      body: `${title}${event.date ? ` • ${formatDate(event.date)}` : ''}`,
    };
  }

  if (priorityRaised) {
    return {
      reason: 'priority',
      logId: `priority-${event.id}-${priority}-${toMillis(event.date)}`,
      title: priority === 'urgente' ? 'Evento urgente no Muralize' : 'Evento importante no Muralize',
      body: `${title}: ${description}`,
    };
  }

  if (wasPublic && dateChanged) {
    return {
      reason: 'rescheduled',
      logId: `rescheduled-${event.id}-${toMillis(event.date)}`,
      title: 'Evento atualizado no Muralize',
      body: `${title} agora está para ${formatDate(event.date)}.`,
    };
  }

  return null;
}

async function assertAdmin(uid: string) {
  const adminDoc = await adminDb.collection('admins').doc(uid).get();
  return adminDoc.exists;
}

async function getSubscriptions() {
  const snapshot = await adminDb
    .collection('notificationSubscriptions')
    .where('permission', '==', 'granted')
    .limit(500)
    .get();

  const subscriptions: { id: string; token: string }[] = [];

  snapshot.forEach(document => {
    const data = document.data();
    if (typeof data.token === 'string' && data.token.length > 20) {
      subscriptions.push({ id: document.id, token: data.token });
    }
  });

  return subscriptions;
}

async function markNotificationLog(logId: string, data: Record<string, unknown>) {
  const ref = adminDb.collection('notificationLogs').doc(logId);
  const existing = await ref.get();

  if (existing.exists) {
    return false;
  }

  await ref.set({
    ...data,
    createdAt: Timestamp.now(),
  });

  return true;
}

export async function GET() {
  return json({ ok: false, message: 'Use POST para enviar notificações de eventos.' }, 405);
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return json({ ok: false, error: 'missing_auth_token' }, 401);
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const admin = await assertAdmin(decodedToken.uid);

    if (!admin) {
      return json({ ok: false, error: 'not_admin' }, 403);
    }

    const body = (await request.json()) as RequestBody;
    const eventId = body.eventId;
    const action = body.action;

    if (!eventId || (action !== 'created' && action !== 'updated')) {
      return json({ ok: false, error: 'invalid_payload' }, 400);
    }

    const eventDocument = await adminDb.collection('events').doc(eventId).get();

    if (!eventDocument.exists) {
      return json({ ok: false, error: 'event_not_found' }, 404);
    }

    const event = { id: eventDocument.id, ...eventDocument.data() } as EventSnapshot;
    const notification = buildNotification(action, event, body.previousEvent);

    if (!notification) {
      return json({ ok: true, skipped: true, reason: 'no_notification_needed' });
    }

    const shouldSend = await markNotificationLog(notification.logId, {
      eventId,
      action,
      reason: notification.reason,
      actorId: decodedToken.uid,
      status: 'started',
    });

    if (!shouldSend) {
      return json({ ok: true, skipped: true, reason: 'duplicate' });
    }

    const subscriptions = await getSubscriptions();

    if (subscriptions.length === 0) {
      await adminDb.collection('notificationLogs').doc(notification.logId).update({
        status: 'no_tokens',
        finishedAt: Timestamp.now(),
      });

      return json({ ok: true, sent: 0, reason: 'no_tokens' });
    }

    const appUrl = process.env.MURALIZE_APP_URL || request.nextUrl.origin;
    const tokens = subscriptions.map(subscription => subscription.token);

    const result = await adminMessaging.sendEachForMulticast({
      tokens,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      webpush: {
        fcmOptions: {
          link: appUrl,
        },
        notification: {
          icon: `${appUrl}/icons/icon-192x192.png`,
          badge: `${appUrl}/icons/icon-96x96.png`,
          tag: notification.logId,
          renotify: false,
          requireInteraction: event.priority === 'urgente',
        },
      },
      data: {
        eventId,
        action,
        reason: notification.reason,
      },
    });

    const invalidCodes = new Set([
      'messaging/registration-token-not-registered',
      'messaging/invalid-registration-token',
      'messaging/invalid-argument',
    ]);

    const deletions: Promise<unknown>[] = [];

    result.responses.forEach((response, index) => {
      if (!response.success && response.error && invalidCodes.has(response.error.code)) {
        deletions.push(adminDb.collection('notificationSubscriptions').doc(subscriptions[index].id).delete());
      }
    });

    await Promise.allSettled(deletions);

    await adminDb.collection('notificationLogs').doc(notification.logId).update({
      status: 'sent',
      successCount: result.successCount,
      failureCount: result.failureCount,
      tokenCount: tokens.length,
      invalidTokenCount: deletions.length,
      finishedAt: Timestamp.now(),
    });

    return json({
      ok: true,
      sent: result.successCount,
      failed: result.failureCount,
      tokens: tokens.length,
      removedInvalidTokens: deletions.length,
    });
  } catch (error) {
    console.error('Erro ao enviar notificação de evento:', error);

    return json({
      ok: false,
      error: 'internal_error',
      message: error instanceof Error ? error.message : String(error),
    }, 500);
  }
}
