'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { format, isPast, isThisMonth, isThisWeek, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/components/AuthProvider';
import { useAdmin } from '@/hooks/useAdmin';
import {
  createEvent,
  deleteEvent,
  duplicateEvent,
  EventHistoryItem,
  getEventHistory,
  permanentlyDeleteEvent,
  restoreEvent,
  SchoolEvent,
  subscribeToEvents,
  updateEvent,
} from '@/lib/events';
import { getCachedEventsMeta, loadCachedEvents, saveCachedEvents } from '@/lib/eventCache';
import { AppHeader } from '@/components/layout/AppHeader';
import { EventCard } from '@/components/events/EventCard';
import { EventFilters, EventFilterType } from '@/components/events/EventFilters';
import { EventSearch } from '@/components/events/EventSearch';
import { EventFormModal, EventFormPayload } from '@/components/events/EventFormModal';
import { EventHistoryModal } from '@/components/events/EventHistoryModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { StatCard } from '@/components/ui/StatCard';

export default function Home() {
  const { signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedFromCache, setLoadedFromCache] = useState(false);
  const [cacheSavedAt, setCacheSavedAt] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<EventFilterType>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [layoutView, setLayoutView] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<SchoolEvent | null>(null);
  const [historyEvent, setHistoryEvent] = useState<SchoolEvent | null>(null);
  const [historyItems, setHistoryItems] = useState<EventHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [firebaseError, setFirebaseError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!isAdmin && (filterType === 'hidden' || filterType === 'trash')) setFilterType('all');
  }, [filterType, isAdmin]);

  useEffect(() => {
    if (adminLoading) return;

    const cachedEvents = loadCachedEvents({ includeDeleted: isAdmin, includePrivate: isAdmin });
    const cacheMeta = getCachedEventsMeta();

    if (cachedEvents.length > 0) {
      setEvents(cachedEvents);
      setLoadedFromCache(true);
      setCacheSavedAt(cacheMeta?.savedAt || null);
      setLoading(false);
    } else {
      setLoading(true);
    }

    setFirebaseError('');

    const unsubscribe = subscribeToEvents(
      isAdmin,
      data => {
        setEvents(data);
        saveCachedEvents(data);
        setLoadedFromCache(false);
        setCacheSavedAt(new Date());
        setLoading(false);
        setFirebaseError('');
      },
      err => {
        console.error(err);
        const fallback = loadCachedEvents({ includeDeleted: isAdmin, includePrivate: isAdmin });
        if (fallback.length > 0) {
          setEvents(fallback);
          setLoadedFromCache(true);
          setCacheSavedAt(getCachedEventsMeta()?.savedAt || null);
          setFirebaseError('Sem conexão com o Firebase. Mostrando os últimos eventos salvos neste dispositivo.');
        } else {
          setFirebaseError('Não foi possível carregar os eventos. Verifique as regras, índices ou conexão do Firestore.');
        }
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [adminLoading, isAdmin]);

  const eventStats = useMemo(() => {
    const activeEvents = events.filter(event => !event.deletedAt);
    const upcoming = activeEvents.filter(event => !isPast(event.date)).length;
    const today = activeEvents.filter(event => isToday(event.date)).length;
    const week = activeEvents.filter(event => !isPast(event.date) && isThisWeek(event.date, { locale: ptBR })).length;
    const hidden = activeEvents.filter(event => !event.isPublic).length;
    const pinned = activeEvents.filter(event => event.isPinned).length;
    const trash = events.filter(event => event.deletedAt).length;
    const past = activeEvents.filter(event => isPast(event.date)).length;

    return { upcoming, today, week, hidden, pinned, trash, past };
  }, [events]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    let result = events.filter(event => {
      const matchesSearch =
        !normalizedSearch ||
        event.title.toLowerCase().includes(normalizedSearch) ||
        event.description?.toLowerCase().includes(normalizedSearch) ||
        event.category?.toLowerCase().includes(normalizedSearch) ||
        event.priority?.toLowerCase().includes(normalizedSearch);

      if (!matchesSearch) return false;
      if (filterType === 'trash') return Boolean(event.deletedAt);
      if (event.deletedAt) return false;
      if (filterType === 'hidden') return !event.isPublic;
      if (filterType === 'past') return isPast(event.date);
      if (filterType !== 'all' && isPast(event.date)) return false;
      if (filterType === 'today') return isToday(event.date);
      if (filterType === 'week') return isThisWeek(event.date, { locale: ptBR });
      if (filterType === 'month') return isThisMonth(event.date);
      return !isPast(event.date);
    });

    if (sortOrder === 'desc') result = [...result].reverse();
    return result;
  }, [events, filterType, searchQuery, sortOrder]);

  function showSuccess(message: string) {
    setSuccessMsg(message);
    window.setTimeout(() => setSuccessMsg(''), 3000);
  }

  function openCreateModal() {
    setEditingEvent(null);
    setErrorMsg('');
    setIsModalOpen(true);
  }

  function openEditModal(event: SchoolEvent) {
    setEditingEvent(event);
    setErrorMsg('');
    setIsModalOpen(true);
  }

  async function handleSubmit(payload: EventFormPayload) {
    setIsSaving(true);
    setErrorMsg('');

    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, payload);
        showSuccess('Evento atualizado com sucesso!');
      } else {
        const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        await createEvent(id, payload);
        showSuccess('Evento criado com sucesso!');
      }

      setEditingEvent(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      setErrorMsg(editingEvent ? 'Não foi possível atualizar o evento.' : 'Não foi possível criar o evento.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDuplicateEvent(event: SchoolEvent) {
    try {
      await duplicateEvent(event);
      setFilterType('hidden');
      showSuccess('Evento duplicado como rascunho.');
    } catch (error) {
      console.error(error);
      setFirebaseError('Não foi possível duplicar o evento.');
    }
  }

  async function handleRestoreEvent(event: SchoolEvent) {
    try {
      await restoreEvent(event.id, event.title);
      showSuccess('Evento restaurado como rascunho. Revise antes de publicar.');
    } catch (error) {
      console.error(error);
      setFirebaseError('Não foi possível restaurar o evento.');
    }
  }

  async function handleHistoryEvent(event: SchoolEvent) {
    setHistoryEvent(event);
    setHistoryItems([]);
    setHistoryLoading(true);

    try {
      const items = await getEventHistory(event.id);
      setHistoryItems(items);
    } catch (error) {
      console.error(error);
      setFirebaseError('Não foi possível carregar o histórico do evento.');
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleShareEvent(event: SchoolEvent) {
    const eventUrl = typeof window !== 'undefined' ? `${window.location.origin}/?event=${event.id}` : '';
    const shareText = [
      `📌 ${event.title}`,
      `📅 ${format(event.date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      event.category ? `🏷️ ${event.category}` : '',
      event.priority !== 'normal' ? `⭐ ${event.priority}` : '',
      event.description ? `📝 ${event.description}` : '',
      eventUrl,
    ].filter(Boolean).join('\n');

    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text: shareText, url: eventUrl });
        return;
      }

      await navigator.clipboard.writeText(shareText);
      showSuccess('Evento copiado para compartilhar.');
    } catch (error) {
      console.error(error);
      setFirebaseError('Não foi possível compartilhar o evento neste navegador.');
    }
  }

  async function confirmDelete() {
    if (!eventToDelete) return;

    try {
      if (eventToDelete.deletedAt) {
        await permanentlyDeleteEvent(eventToDelete.id, eventToDelete.title);
        showSuccess('Evento excluído permanentemente.');
      } else {
        await deleteEvent(eventToDelete.id, eventToDelete.title);
        showSuccess('Evento movido para a lixeira.');
      }
      setEventToDelete(null);
    } catch (error) {
      console.error(error);
      setFirebaseError('Não foi possível excluir o evento. Verifique sua permissão de administrador.');
    }
  }

  async function confirmLogout() {
    await signOut();
    setIsLogoutModalOpen(false);
  }

  return (
    <div className="min-h-screen pb-24 relative">
      <AppHeader events={events} onLogoutClick={() => setIsLogoutModalOpen(true)} />

      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-md"
          >
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-4xl mx-auto px-4 pt-8">
        <div className="flex flex-col gap-4 mb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-medium tracking-tight">Mural de Eventos</h2>
              {isAdmin && (
                <p className="text-sm text-[#49454F] mt-1">Modo admin ativo: criar, editar, fixar, duplicar, restaurar e acompanhar histórico.</p>
              )}
              {loadedFromCache && (
                <p className="text-xs text-[#49454F] mt-1">
                  Mostrando cache offline{cacheSavedAt ? ` de ${format(cacheSavedAt, "dd/MM 'às' HH:mm")}` : ''}.
                </p>
              )}
            </div>
            <EventSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Próximos" value={eventStats.upcoming} />
            <StatCard label="Hoje" value={eventStats.today} />
            <StatCard label="Fixados" value={eventStats.pinned} />
            <StatCard label={isAdmin ? 'Lixeira' : 'Finalizados'} value={isAdmin ? eventStats.trash : eventStats.past} />
          </div>

          {firebaseError && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{firebaseError}</p>
            </div>
          )}

          <EventFilters
            filterType={filterType}
            setFilterType={setFilterType}
            filteredCount={filteredEvents.length}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            layoutView={layoutView}
            setLayoutView={setLayoutView}
            showHiddenFilter={isAdmin}
          />
        </div>

        {loading || adminLoading ? (
          <div className="grid gap-4 mt-8 md:grid-cols-2">
            {[1, 2, 3, 4].map(item => <SkeletonCard key={item} />)}
          </div>
        ) : filteredEvents.length === 0 ? (
          <EmptyState isAdmin={isAdmin && filterType !== 'trash'} onActionClick={openCreateModal} />
        ) : (
          <div className={`mt-8 grid gap-4 ${layoutView === 'grid' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
            <AnimatePresence mode="popLayout">
              {filteredEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  isAdmin={isAdmin}
                  onDeleteClick={setEventToDelete}
                  onEditClick={openEditModal}
                  onDuplicateClick={handleDuplicateEvent}
                  onHistoryClick={handleHistoryEvent}
                  onRestoreClick={handleRestoreEvent}
                  onShareClick={handleShareEvent}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {isAdmin && filterType !== 'trash' && <FloatingActionButton onClick={openCreateModal} />}
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <EventFormModal
            event={editingEvent}
            isSaving={isSaving}
            errorMsg={errorMsg}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleSubmit}
          />
        )}

        {historyEvent && (
          <EventHistoryModal
            event={historyEvent}
            items={historyItems}
            loading={historyLoading}
            onClose={() => setHistoryEvent(null)}
          />
        )}

        {eventToDelete && (
          <ConfirmModal
            title={eventToDelete.deletedAt ? 'Excluir permanentemente?' : 'Mover para lixeira?'}
            description={eventToDelete.deletedAt
              ? `“${eventToDelete.title}” será excluído permanentemente. Essa ação não pode ser desfeita.`
              : `“${eventToDelete.title}” sairá do mural, mas poderá ser restaurado pela lixeira.`}
            confirmLabel={eventToDelete.deletedAt ? 'Excluir de vez' : 'Mover'}
            onCancel={() => setEventToDelete(null)}
            onConfirm={confirmDelete}
            danger
          />
        )}

        {isLogoutModalOpen && (
          <ConfirmModal
            title="Sair da conta?"
            description="Você precisará fazer login novamente para administrar o mural."
            confirmLabel="Sair"
            onCancel={() => setIsLogoutModalOpen(false)}
            onConfirm={confirmLogout}
          />
        )}
      </AnimatePresence>

      <style jsx global>{`
        .field {
          width: 100%;
          border-radius: 16px;
          background: #F4EFF4;
          padding: 12px 14px;
          outline: none;
          border: 1px solid transparent;
          color: #1D1B20;
        }
        .field:focus {
          border-color: #1D1B20;
        }
        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #49454F;
        }
      `}</style>
    </div>
  );
}
