import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from './firebase';

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  authorId: string;
  createdAt: Date;
  updatedAt?: Date;
  isPublic: boolean;
  category?: string;
}

export interface CreateSchoolEventInput {
  title: string;
  description?: string;
  date: Date;
  category?: string;
  isPublic?: boolean;
}

export type UpdateSchoolEventInput = CreateSchoolEventInput;

const EVENTS_PATH = 'events';
const MAX_EVENTS = 100;

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date();
}

export function subscribeToEvents(
  isAdmin: boolean,
  onUpdate: (events: SchoolEvent[]) => void,
  onError: (err: Error) => void,
) {
  const constraints = [];

  if (!isAdmin) {
    constraints.push(where('isPublic', '==', true));
  }

  constraints.push(orderBy('date', 'asc'));
  constraints.push(limit(MAX_EVENTS));

  const eventsQuery = query(collection(db, EVENTS_PATH), ...constraints);

  return onSnapshot(
    eventsQuery,
    snapshot => {
      const events: SchoolEvent[] = [];

      snapshot.forEach(document => {
        const data = document.data();

        events.push({
          id: document.id,
          title: data.title ?? '',
          description: data.description ?? '',
          category: data.category ?? '',
          date: toDate(data.date),
          authorId: data.authorId ?? '',
          createdAt: toDate(data.createdAt),
          updatedAt: data.updatedAt ? toDate(data.updatedAt) : undefined,
          isPublic: data.isPublic !== false,
        });
      });

      onUpdate(events);
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
  };
}

export async function createEvent(id: string, event: CreateSchoolEventInput) {
  const user = requireCurrentUser();
  const eventDocument = doc(db, EVENTS_PATH, id);

  await setDoc(eventDocument, {
    ...sanitizeEventInput(event),
    authorId: user.uid,
    createdAt: Timestamp.now(),
  });
}

export async function updateEvent(id: string, event: UpdateSchoolEventInput) {
  requireCurrentUser();
  const eventDocument = doc(db, EVENTS_PATH, id);

  await updateDoc(eventDocument, {
    ...sanitizeEventInput(event),
    updatedAt: Timestamp.now(),
  });
}

export async function deleteEvent(id: string) {
  requireCurrentUser();
  await deleteDoc(doc(db, EVENTS_PATH, id));
}
