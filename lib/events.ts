import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { notifyEventChange, type NotificationEventSnapshot } from './notificationClient';

export type EventPriority = 'normal' | 'importante' | 'urgente';
export type EventHistoryAction = 'created' | 'updated' | 'duplicated' | 'deleted' | 'restored' | 'permanently_deleted';

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  authorId: string;
  createdAt: Date;
  updatedAt?: Date;
  updatedBy?: string;
  isPublic: boolean;
  isPinned: boolean;
  priority: EventPriority;
  category?: string;
  deletedAt?: Date;
  deletedBy?: string;
  duplicatedFrom?: string;
}

export interface CreateSchoolEventInput {
  title: string;
  description?: string;
  date: Date;
  category?: string;
  isPublic?: boolean;
  isPinned?: boolean;
  priority?: EventPriority;
}

export type UpdateSchoolEventInput = CreateSchoolEventInput;

export interface EventHistoryItem {
  id: string;
  eventId: string;
  action: EventHistoryAction;
  actorId: string;
  at: Date;
  title: string;
  snapshot?: Partial<SchoolEvent>;
}

const EVENTS_PATH = 'events';
const HISTORY_PATH = 'eventHistory';
const MAX_EVENTS = 200;
const MAX_HISTORY = 50;

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date();
}

function normalizePriority(value: unknown): EventPriority {
  if (value === 'urgente' || value === 'importante' || value === 'normal') return value;
  return 'normal';
}

export function sortEvents(events: SchoolEvent[]) {
  const priorityWeight: Record<EventPriority, number> = {
    urgente: 3,
    importante: 2,
    normal: 1,
  };

  return [...events].sort((a, b) => {
    if (a.deletedAt && !b.deletedAt) return 1;
    if (!a.deletedAt && b.deletedAt) return -1;
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
    return a.date.getTime() - b.date.getTime();
  });
}

function mapEvent(id: string, data: Record<string, any>): SchoolEvent {
  return {
    id,
    title: data.title ?? '',
    description: data.description ?? '',
    category: data.category ?? '',
    date: toDate(data.date),
    authorId: data.authorId ?? '',
    createdAt: toDate(data.createdAt),
    updatedAt: data.updatedAt ? toDate(data.updatedAt) : undefined,
    updatedBy: data.updatedBy ?? undefined,
    isPublic: data.isPublic !== false,
    isPinned: data.isPinned === true,
    priority: normalizePriority(data.priority),
    deletedAt: data.deletedAt ? toDate(data.deletedAt) : undefined,
    deletedBy: data.deletedBy ?? undefined,
    duplicatedFrom: data.duplicatedFrom ?? undefined,
  };
}

export function subscribeToEvents(
  isAdmin: boolean,
  onUpdate: (events: SchoolEvent[]) => void,
  onError: (err: Error) => void,
) {
  const constraints = isAdmin
    ? [limit(MAX_EVENTS)]
    : [where('isPublic', '==', true), limit(MAX_EVENTS)];

  const eventsQuery = query(collection(db, EVENTS_PATH), ...constraints);

  return onSnapshot(
    eventsQuery,
    snapshot => {
      const events: SchoolEvent[] = [];

      snapshot.forEach(document => {
        const event = mapEvent(document.id, document.data());
        if (!isAdmin && event.deletedAt) return;
        events.push(event);
      });

      onUpdate(sortEvents(events));
    },
    error => {
      onError(error instanceof Error ? error : new Error(String(error)));
    },
  );
}

function requireCurrentUser() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user;
}

function sanitizeEventInput(event: CreateSchoolEventInput) {
  return {
    title: event.title.trim(),
    description: event.description?.trim() || '',
    category: event.category?.trim() || '',
    date: Timestamp.fromDate(event.date),
    isPublic: event.isPublic !== false,
    isPinned: event.isPinned === true,
    priority: event.priority || 'normal',
  };
}

function eventSnapshot(event: Partial<SchoolEvent>) {
  return {
    title: event.title || '',
    description: event.description || '',
    category: event.category || '',
    date: event.date instanceof Date ? Timestamp.fromDate(event.date) : event.date || null,
    isPublic: event.isPublic !== false,
    isPinned: event.isPinned === true,
    priority: event.priority || 'normal',
    deletedAt: event.deletedAt instanceof Date ? Timestamp.fromDate(event.deletedAt) : event.deletedAt || null,
  };
}

function notificationSnapshot(event?: Partial<SchoolEvent> | null): NotificationEventSnapshot | null {
  if (!event) return null;

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    category: event.category,
    date: event.date instanceof Date ? event.date.toISOString() : undefined,
    isPublic: event.isPublic,
    isPinned: event.isPinned,
    priority: event.priority,
    deletedAt: event.deletedAt instanceof Date ? event.deletedAt.toISOString() : null,
  };
}

function notifyEventSafely(input: Parameters<typeof notifyEventChange>[0]) {
  notifyEventChange(input).catch(error => {
    console.warn('Falha ao solicitar envio de notificação.', error);
  });
}

async function writeHistory(eventId: string, action: EventHistoryAction, title: string, snapshot?: Partial<SchoolEvent>) {
  const user = requireCurrentUser();

  await addDoc(collection(db, HISTORY_PATH), {
    eventId,
    action,
    actorId: user.uid,
    at: Timestamp.now(),
    title,
    snapshot: snapshot ? eventSnapshot(snapshot) : null,
  });
}

export async function createEvent(id: string, event: CreateSchoolEventInput) {
  const user = requireCurrentUser();
  const eventDocument = doc(db, EVENTS_PATH, id);
  const sanitized = sanitizeEventInput(event);

  await setDoc(eventDocument, {
    ...sanitized,
    authorId: user.uid,
    createdAt: Timestamp.now(),
  });

  writeHistory(id, 'created', sanitized.title, {
    ...event,
    isPublic: sanitized.isPublic,
    isPinned: sanitized.isPinned,
    priority: sanitized.priority,
  }).catch(error => console.warn('Falha ao registrar histórico de criação.', error));

  notifyEventSafely({ eventId: id, action: 'created' });
}

export async function updateEvent(id: string, event: UpdateSchoolEventInput) {
  const user = requireCurrentUser();
  const eventDocument = doc(db, EVENTS_PATH, id);
  const beforeSnapshot = await getDoc(eventDocument);
  const previousEvent = beforeSnapshot.exists() ? mapEvent(beforeSnapshot.id, beforeSnapshot.data()) : null;
  const sanitized = sanitizeEventInput(event);

  await updateDoc(eventDocument, {
    ...sanitized,
    updatedAt: Timestamp.now(),
    updatedBy: user.uid,
  });

  writeHistory(id, 'updated', sanitized.title, {
    ...event,
    isPublic: sanitized.isPublic,
    isPinned: sanitized.isPinned,
    priority: sanitized.priority,
  }).catch(error => console.warn('Falha ao registrar histórico de atualização.', error));

  notifyEventSafely({
    eventId: id,
    action: 'updated',
    previousEvent: notificationSnapshot(previousEvent),
  });
}

export async function duplicateEvent(event: SchoolEvent) {
  const user = requireCurrentUser();
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const eventDocument = doc(db, EVENTS_PATH, id);
  const title = `${event.title} (cópia)`;

  await setDoc(eventDocument, {
    title,
    description: event.description || '',
    category: event.category || '',
    date: Timestamp.fromDate(event.date),
    authorId: user.uid,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    updatedBy: user.uid,
    isPublic: false,
    isPinned: false,
    priority: event.priority || 'normal',
    duplicatedFrom: event.id,
  });

  writeHistory(id, 'duplicated', title, { ...event, title, isPublic: false, isPinned: false })
    .catch(error => console.warn('Falha ao registrar histórico de duplicação.', error));
  return id;
}

export async function deleteEvent(id: string, title = 'Evento') {
  const user = requireCurrentUser();

  await updateDoc(doc(db, EVENTS_PATH, id), {
    deletedAt: Timestamp.now(),
    deletedBy: user.uid,
    isPublic: false,
    updatedAt: Timestamp.now(),
    updatedBy: user.uid,
  });

  writeHistory(id, 'deleted', title).catch(error => console.warn('Falha ao registrar histórico de exclusão.', error));
}

export async function restoreEvent(id: string, title = 'Evento') {
  const user = requireCurrentUser();

  await updateDoc(doc(db, EVENTS_PATH, id), {
    deletedAt: deleteField(),
    deletedBy: deleteField(),
    updatedAt: Timestamp.now(),
    updatedBy: user.uid,
  });

  writeHistory(id, 'restored', title).catch(error => console.warn('Falha ao registrar histórico de restauração.', error));
}

export async function permanentlyDeleteEvent(id: string, title = 'Evento') {
  writeHistory(id, 'permanently_deleted', title).catch(error => console.warn('Falha ao registrar histórico de exclusão permanente.', error));
  await deleteDoc(doc(db, EVENTS_PATH, id));
}

export async function getEventHistory(eventId: string) {
  const historyQuery = query(
    collection(db, HISTORY_PATH),
    where('eventId', '==', eventId),
    limit(MAX_HISTORY),
  );
  const snapshot = await getDocs(historyQuery);
  const items: EventHistoryItem[] = [];

  snapshot.forEach(document => {
    const data = document.data();
    items.push({
      id: document.id,
      eventId: data.eventId,
      action: data.action,
      actorId: data.actorId,
      at: toDate(data.at),
      title: data.title || 'Evento',
      snapshot: data.snapshot || undefined,
    });
  });

  return items.sort((a, b) => b.at.getTime() - a.at.getTime());
}
