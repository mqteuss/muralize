import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminAuth, adminDb, adminMessaging } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type LegacyAction = 'created' | 'updated';
type NotificationType = 'created' | 'published' | 'priority_up' | 'rescheduled';
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

interface LegacyRequestBody {
  eventId?: string;
  action?: LegacyAction;
  previousEvent?: EventSnapshot | null;
}

interface DirectRequestBody {
  type?: NotificationType;
  event?: EventSnapshot & { id?: string };
  previousEvent?: EventSnapshot | null;
  dedupeKey?: string;
}

type RequestBody = LegacyRequestBody & DirectRequestBody;

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
  if (typeof value === 'object' && value !== null && '_seconds' in value) {
    const seconds = Number((value as any)._seconds);
    if (!Number.isNaN(seconds)) return new Date(seconds * 1000);
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

function normalizeEventFromFirestore(id: string, data: Record<string, unknown>): EventSnapshot {
  return {
    id,
    title: typeof data.title === 'string' ? data.title : '',
    description: typeof data.description === 'string' ? data.description : '',
    category: typeof data.category === 'string' ? data.category : '',
    date: data.date,
    isPublic: data.isPublic === true,
    isPinned: data.isPinned === true,
    priority: normalizePriority(data.priority),
    deletedAt: data.deletedAt,
  };
}

function notificationFromType(type: NotificationType, event: EventSnapshot, dedupeKey?: string) {
  if (!event.id) return null;
  if (event.deletedAt) return null;
  if (event.isPublic !== true) return null;

  const title = event.title || 'Novo evento';
  const description = event.description || event.category || 'Confira os detalhes no Muralize.';
  const priority = normalizePriority(event.priority);
  const formattedDate = event.date ? formatDate(event.date) : '';

  if (type === 'created') {
    return {
      reason: 'created',
      logId: dedupeKey || `created-${event.id}`,
      title: 'Novo evento no Muralize',
      body: `${title}${formattedDate ? ` • ${formattedDate}` : ''}`,
    };
  }

  if (type === 'published') {
    return {
      reason: 'published',
      logId: dedupeKey || `published-${event.id}-${toMillis(event.date)}`,
      title: 'Evento publicado no Muralize',
      body: `${title}${formattedDate ? ` • ${formattedDate}` : ''}`,
    };
  }

  if (type === 'priority_up') {
    return {
      reason: 'priority',
      logId: dedupeKey || `priority-${event.id}-${priority}-${toMillis(event.date)}`,
      title: priority === 'urgente' ? 'Evento urgente no Muralize' : 'Evento importante no Muralize',
      body: `${title}: ${description}`,
    };
  }

  if (type === 'rescheduled') {
    return {
      reason: 'rescheduled',
      logId: dedupeKey || `rescheduled-${event.id}-${toMillis(event.date)}`,
      title: 'Evento atualizado no Muralize',
      body: `${title}${formattedDate ? ` agora está para ${formattedDate}.` : ' teve a data alterada.'}`,
    };
  }

  return null;
}

function inferNotificationFromLegacy(action: LegacyAction, event: EventSnapshot, previousEvent?: EventSnapshot | null) {
  if (event.deletedAt) return null;
  if (event.isPublic !== true) return null;

  if (action === 'created') return notificationFromType('created', event);

  const priority = normalizePriority(event.priority);
  const previousPriority = normalizePriority(previousEvent?.priority);
  const wasPublic = previousEvent?.isPublic === true;
  const becamePublic = previousEvent?.isPublic === false && event.isPublic === true;
  const dateChanged = Boolean(previousEvent) && toMillis(previousEvent?.date) !== toMillis(event.date);
  const priorityRaised = priority !== previousPriority
    && (priority === 'importante' || priority === 'urgente')
    && previousPriority !== 'urgente';

  if (becamePublic) return notificationFromType('published', event);
  if (priorityRaised) return notificationFromType('priority_up', event);
  if (wasPublic && dateChanged) return notificationFromType('rescheduled', event);

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

async function createNotificationLog(logId: string, data: Record<string, unknown>) {
  const ref = adminDb.collection('notificationLogs').doc(logId);
  const existing = await ref.get();

  if (existing.exists) return false;

  await ref.set({
    ...data,
    createdAt: Timestamp.now(),
  });

  return true;
}

async function updateNotificationLog(logId: string, data: Record<string, unknown>) {
  await adminDb.collection('notificationLogs').doc(logId).set({
    ...data,
    updatedAt: Timestamp.now(),
  }, { merge: true });
}

export async function GET() {
  return json({ ok: false, message: 'Use POST para enviar notificações de eventos.' }, 405);
}

export async function POST(request: NextRequest) {
  let logId: string | null = null;

  try {
    const token = getBearerToken(request);

    if (!token) return json({ ok: false, error: 'missing_auth_token' }, 401);

    const decodedToken = await adminAuth.verifyIdToken(token);
    const admin = await assertAdmin(decodedToken.uid);

    if (!admin) return json({ ok: false, error: 'not_admin' }, 403);

    const body = (await request.json()) as RequestBody;
    let event: EventSnapshot | null = null;
    let notification: ReturnType<typeof notificationFromType> | null = null;

    if (body.type && body.event?.id) {
      event = body.event;
      notification = notificationFromType(body.type, event, body.dedupeKey);
    } else if (body.eventId && (body.action === 'created' || body.action === 'updated')) {
      const eventDocument = await adminDb.collection('events').doc(body.eventId).get();
      if (!eventDocument.exists) return json({ ok: false, error: 'event_not_found' }, 404);
      event = normalizeEventFromFirestore(eventDocument.id, eventDocument.data());
      notification = inferNotificationFromLegacy(body.action, event, body.previousEvent);
    } else {
      return json({ ok: false, error: 'invalid_payload' }, 400);
    }

    if (!event?.id) return json({ ok: false, error: 'missing_event_id' }, 400);

    if (!notification) {
      return json({ ok: true, skipped: true, reason: 'no_notification_needed' });
    }

    logId = notification.logId;
    const shouldSend = await createNotificationLog(logId, {
      eventId: event.id,
      reason: notification.reason,
      actorId: decodedToken.uid,
      status: 'started',
    });

    if (!shouldSend) return json({ ok: true, skipped: true, reason: 'duplicate' });

    const subscriptions = await getSubscriptions();

    if (subscriptions.length === 0) {
      await updateNotificationLog(logId, {
        status: 'no_tokens',
        finishedAt: Timestamp.now(),
      });
      return json({ ok: true, sent: 0, reason: 'no_tokens' });
    }

    const appUrl = process.env.MURALIZE_APP_URL || request.nextUrl.origin;
    const tokens = subscriptions.map(subscription => subscription.token);
    const priority = normalizePriority(event.priority);

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
          tag: logId,
          renotify: false,
          requireInteraction: priority === 'urgente',
        },
      },
      data: {
        eventId: event.id,
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

    await updateNotificationLog(logId, {
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

    if (logId) {
      await updateNotificationLog(logId, {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        finishedAt: Timestamp.now(),
      }).catch(() => null);
    }

    return json({
      ok: false,
      error: 'internal_error',
      message: error instanceof Error ? error.message : String(error),
    }, 500);
  }
}
