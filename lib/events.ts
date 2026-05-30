import { supabase } from './supabase';

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  authorId: string;
  createdAt: Date;
  isPublic: boolean;
}

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  author_id: string;
  created_at: string;
  is_public: boolean;
};

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

function normalizeText(value: string, maxLength: number) {
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function mapSchoolEvent(row: EventRow): SchoolEvent | null {
  const date = new Date(row.date);
  const createdAt = new Date(row.created_at);

  if (!row.id || !row.title || Number.isNaN(date.getTime()) || Number.isNaN(createdAt.getTime())) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    date,
    authorId: row.author_id,
    createdAt,
    isPublic: row.is_public,
  };
}

async function fetchPublicEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('id,title,description,date,author_id,created_at,is_public')
    .eq('is_public', true)
    .order('date', { ascending: true });

  if (error) throw error;

  return (data ?? [])
    .map((item) => mapSchoolEvent(item as EventRow))
    .filter((event): event is SchoolEvent => event !== null);
}

export function subscribeToEvents(onUpdate: (events: SchoolEvent[]) => void, onError: (err: Error) => void) {
  let isActive = true;

  fetchPublicEvents()
    .then((events) => {
      if (isActive) onUpdate(events);
    })
    .catch((error) => {
      if (isActive) onError(error instanceof Error ? error : new Error(String(error)));
    });

  const channel = supabase
    .channel('public-events')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'events' },
      () => {
        fetchPublicEvents()
          .then((events) => {
            if (isActive) onUpdate(events);
          })
          .catch((error) => {
            if (isActive) onError(error instanceof Error ? error : new Error(String(error)));
          });
      },
    )
    .subscribe();

  return () => {
    isActive = false;
    supabase.removeChannel(channel);
  };
}

export async function createEvent(id: string, title: string, description: string, date: Date) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  if (!sessionData.session?.user) throw new Error('Você precisa estar logado para criar eventos.');

  const normalizedTitle = normalizeText(title, MAX_TITLE_LENGTH);
  const normalizedDescription = normalizeText(description, MAX_DESCRIPTION_LENGTH);

  if (!normalizedTitle) throw new Error('Informe um título para o evento.');
  if (Number.isNaN(date.getTime())) throw new Error('Informe uma data e hora válidas.');

  const { error } = await supabase.from('events').insert({
    id,
    title: normalizedTitle,
    description: normalizedDescription,
    date: date.toISOString(),
    author_id: sessionData.session.user.id,
    is_public: true,
  });

  if (error) throw error;
}

export async function deleteEvent(id: string) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  if (!sessionData.session?.user) throw new Error('Você precisa estar logado para excluir eventos.');

  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}
