import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc, Timestamp, where } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  authorId: string;
  createdAt: Date;
  isPublic: boolean;
}

const EVENTS_PATH = 'events';
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

function normalizeText(value: string, maxLength: number) {
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function mapSchoolEvent(id: string, data: Record<string, unknown>): SchoolEvent | null {
  const title = typeof data.title === 'string' ? data.title : '';
  const description = typeof data.description === 'string' ? data.description : '';
  const date = data.date instanceof Timestamp ? data.date.toDate() : null;
  const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null;
  const authorId = typeof data.authorId === 'string' ? data.authorId : '';
  const isPublic = typeof data.isPublic === 'boolean' ? data.isPublic : false;

  if (!title || !date || !createdAt || !authorId) return null;

  return {
    id,
    title,
    description,
    date,
    authorId,
    createdAt,
    isPublic,
  };
}

export function subscribeToEvents(onUpdate: (events: SchoolEvent[]) => void, onError: (err: Error) => void) {
  const eventsQuery = query(
    collection(db, EVENTS_PATH),
    where('isPublic', '==', true),
    orderBy('date', 'asc'),
  );

  return onSnapshot(eventsQuery, (snapshot) => {
    const events = snapshot.docs
      .map((item) => mapSchoolEvent(item.id, item.data()))
      .filter((event): event is SchoolEvent => event !== null);

    onUpdate(events);
  }, (error) => {
    onError(error instanceof Error ? error : new Error(String(error)));
  });
}

export async function createEvent(id: string, title: string, description: string, date: Date) {
  if (!auth.currentUser) throw new Error('Você precisa estar logado para criar eventos.');

  const normalizedTitle = normalizeText(title, MAX_TITLE_LENGTH);
  const normalizedDescription = normalizeText(description, MAX_DESCRIPTION_LENGTH);

  if (!normalizedTitle) throw new Error('Informe um título para o evento.');
  if (Number.isNaN(date.getTime())) throw new Error('Informe uma data e hora válidas.');

  await setDoc(doc(db, EVENTS_PATH, id), {
    title: normalizedTitle,
    description: normalizedDescription,
    date: Timestamp.fromDate(date),
    authorId: auth.currentUser.uid,
    createdAt: Timestamp.now(),
    isPublic: true,
  });
}

export async function deleteEvent(id: string) {
  if (!auth.currentUser) throw new Error('Você precisa estar logado para excluir eventos.');
  await deleteDoc(doc(db, EVENTS_PATH, id));
}
