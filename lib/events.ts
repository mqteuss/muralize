import { collection, doc, onSnapshot, query, setDoc, deleteDoc, Timestamp, orderBy, limit, where } from 'firebase/firestore';
import { db, auth } from './firebase';

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  authorId: string;
  createdAt: Date;
  isPublic: boolean;
  category?: string;
}

const EVENTS_PATH = 'events';

export function subscribeToEvents(isAdmin: boolean, onUpdate: (events: SchoolEvent[]) => void, onError: (err: Error) => void) {
  const constraints = [];
  if (!isAdmin) {
    constraints.push(where('isPublic', '==', true));
  }
  constraints.push(orderBy('date', 'asc'));
  constraints.push(limit(50));

  const q = query(collection(db, EVENTS_PATH), ...constraints);

  return onSnapshot(q, (snapshot) => {
    const events: SchoolEvent[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      events.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        category: data.category,
        date: data.date.toDate(),
        authorId: data.authorId,
        createdAt: data.createdAt.toDate(),
        isPublic: data.isPublic,
      });
    });
    onUpdate(events);
  }, (error) => {
    onError(error instanceof Error ? error : new Error(String(error)));
  });
}

export interface CreateSchoolEventInput {
  title: string;
  description?: string;
  date: Date;
  category?: string;
  isPublic?: boolean;
}

export async function createEvent(id: string, event: CreateSchoolEventInput) {
  if (!auth.currentUser) throw new Error('Not authenticated');
  
  const eventDoc = doc(db, EVENTS_PATH, id);
  await setDoc(eventDoc, {
    title: event.title,
    description: event.description || '',
    category: event.category || '',
    date: Timestamp.fromDate(event.date),
    authorId: auth.currentUser.uid,
    createdAt: Timestamp.now(),
    isPublic: event.isPublic !== undefined ? event.isPublic : true,
  });
}

export async function deleteEvent(id: string) {
  if (!auth.currentUser) throw new Error('Not authenticated');
  await deleteDoc(doc(db, EVENTS_PATH, id));
}
