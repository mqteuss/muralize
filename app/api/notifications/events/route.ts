import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb, getAdminMessaging } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type EventNotificationType = 'created' | 'published' | 'priority_up' | 'rescheduled';
type EventPriority = 'normal' | 'importante' | 'urgente';

interface EventPayload {
  id: string;
  title: string;
  description?: string;
  category?: string;
  date: string;
  isPublic: boolean;
  isPinned: boolean;
  priority: EventPriority;
}

interface RequestBody {
  type: EventNotificationType;
  event: EventPayload;
  dedupeKey: string;
}

const VALID_TYPES = new Set<EventNotificationType>(['created', 'published', 'priority_up', 'rescheduled']);
const VALID_PRIORITIES = new Set<EventPriority>(['normal', 'importante', 'urgente']);
const INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

function json(status: number, payload: Record<string, unknown>) {
  return NextResponse.json(payload, { status });
}

function sanitizeDocumentId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 180);
}

function normalizeEventPayload(value: unknown): EventPayload | null {
  const event = value as Partial<EventPayload> | null;

  if (!event || typeof event !== 'object') return null;
  if (typeof event.id !== 'string' || event.id.length < 1 || event.id.length > 128) return null;
  if (typeof event.title !== 'string' || event.title.trim().length < 1 || event.title.length > 120) return null;
  if (typeof event.date !== 'string' || Number.isNaN(new Date(event.date).getTime())) return null;
  if (event.isPublic !== true) return null;
  if (typeof event.isPinned !== 'boolean') return null;
  if (!VALID_PRIORITIES.has(event.priority as EventPriority)) return null;

  return {
    id: event.id,
    title: event.title.trim(),
    description: typeof event.description === 'string' ? event.description.slice(0, 500) : '',
    category: typeof event.category === 'string' ? event.category.slice(0, 50) : '',
    date: event.date,
    isPublic: true,
    isPinned: event.isPinned,
    priority: event.priority as EventPriority,
  };
}

function notificationCopy(type: EventNotificationType, event: EventPayload) {
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(event.date));

  if (type === 'published') {
    return {
      title: 'Evento publicado no Muralize',
      body: `${event.title} agora está visível no mural.`,
    };
  }

  if (type === 'priority_up') {
    return {
      title: event.priority === 'urgente' ? 'Aviso urgente no Muralize' : 'Aviso importante no Muralize',
      body: `${event.title} foi marcado como ${event.priority}.`,
    };
  }

  if (type === 'rescheduled') {
    return {
      title: 'Evento atualizado no Muralize',
      body: `${event.title} agora está agendado para ${formattedDate}.`,
    };
  }

  return {
    title: 'Novo evento no Muralize',
    body: `${event.title} foi adicionado ao mural para ${formattedDate}.`,
  };
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';

  if (!token) return null;

  const decoded = await getAdminAuth().verifyIdToken(token);
  const adminDocument = await getAdminDb().collection('admins').doc(decoded.uid).get();

  if (!adminDocument.exists) return null;
  return decoded;
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyAdmin(request);

    if (!decoded) {
      return json(403, { error: 'Apenas administradores podem disparar notificações.' });
    }

    const body = await request.json() as Partial<RequestBody>;

    if (!VALID_TYPES.has(body.type as EventNotificationType)) {
      return json(400, { error: 'Tipo de notificação inválido.' });
    }

    if (typeof body.dedupeKey !== 'string' || body.dedupeKey.length < 3) {
      return json(400, { error: 'Chave de deduplicação inválida.' });
    }

    const event = normalizeEventPayload(body.event);
    if (!event) {
      return json(400, { error: 'Evento inválido ou privado.' });
    }

    const db = getAdminDb();
    const dedupeDocument = db.collection('notificationLogs').doc(sanitizeDocumentId(body.dedupeKey));

    try {
      await dedupeDocument.create({
        type: body.type,
        eventId: event.id,
        eventTitle: event.title,
        actorId: decoded.uid,
        createdAt: FieldValue.serverTimestamp(),
        status: 'started',
      });
    } catch (error: any) {
      const code = String(error?.code || error?.message || '').toLowerCase();
      if (code.includes('already-exists') || code === '6') {
        return json(200, { ok: true, deduped: true, sent: 0, failed: 0, invalidTokensRemoved: 0 });
      }
      throw error;
    }

    const subscriptions = await db
      .collection('notificationSubscriptions')
      .where('permission', '==', 'granted')
      .get();

    const subscriptionDocs = subscriptions.docs
      .map(document => ({ id: document.id, token: document.get('token') }))
      .filter(subscription => typeof subscription.token === 'string' && subscription.token.length > 20) as { id: string; token: string }[];

    if (subscriptionDocs.length === 0) {
      await dedupeDocument.update({ status: 'no_tokens', finishedAt: FieldValue.serverTimestamp() });
      return json(200, { ok: true, sent: 0, failed: 0, invalidTokensRemoved: 0 });
    }

    const appUrl = process.env.MURALIZE_APP_URL || process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const eventUrl = `${appUrl.replace(/\/$/, '')}/?event=${encodeURIComponent(event.id)}`;
    const copy = notificationCopy(body.type as EventNotificationType, event);
    const messaging = getAdminMessaging();

    let sent = 0;
    let failed = 0;
    const invalidSubscriptionIds: string[] = [];

    for (const group of chunk(subscriptionDocs, 500)) {
      const response = await messaging.sendEachForMulticast({
        tokens: group.map(subscription => subscription.token),
        notification: {
          title: copy.title,
          body: copy.body,
        },
        data: {
          url: eventUrl,
          eventId: event.id,
          type: body.type as string,
          title: copy.title,
          body: copy.body,
          priority: event.priority,
          tag: `muralize-${body.type}-${event.id}`,
        },
        webpush: {
          fcmOptions: {
            link: eventUrl,
          },
          notification: {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: `muralize-${body.type}-${event.id}`,
            renotify: true,
          },
        },
      });

      sent += response.successCount;
      failed += response.failureCount;

      response.responses.forEach((item, index) => {
        const code = item.error?.code;
        if (code && INVALID_TOKEN_CODES.has(code)) {
          invalidSubscriptionIds.push(group[index].id);
        }
      });
    }

    if (invalidSubscriptionIds.length > 0) {
      await Promise.allSettled(
        invalidSubscriptionIds.map(id => db.collection('notificationSubscriptions').doc(id).delete()),
      );
    }

    await dedupeDocument.update({
      status: 'sent',
      sent,
      failed,
      invalidTokensRemoved: invalidSubscriptionIds.length,
      finishedAt: FieldValue.serverTimestamp(),
    });

    return json(200, {
      ok: true,
      sent,
      failed,
      invalidTokensRemoved: invalidSubscriptionIds.length,
    });
  } catch (error: any) {
    console.error('Falha ao enviar notificações de evento.', error);
    return json(500, {
      error: 'Falha ao enviar notificações.',
      details: error?.message || String(error),
    });
  }
}
