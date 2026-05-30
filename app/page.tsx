'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { isPast, isThisMonth, isThisWeek, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/components/AuthProvider';
import { useAdmin } from '@/hooks/useAdmin';
import { createEvent, deleteEvent, SchoolEvent, subscribeToEvents, updateEvent } from '@/lib/events';
import { AppHeader } from '@/components/layout/AppHeader';
import { EventCard } from '@/components/events/EventCard';
import { EventFilters, EventFilterType } from '@/components/events/EventFilters';
import { EventSearch } from '@/components/events/EventSearch';
import { EventFormModal, EventFormPayload } from '@/components/events/EventFormModal';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<EventFilterType>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [layoutView, setLayoutView] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<SchoolEvent | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [firebaseError, setFirebaseError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!isAdmin && filterType === 'hidden') setFilterType('all');
  }, [filterType, isAdmin]);

  useEffect(() => {
    if (adminLoading) return;

    setLoading(true);
    setFirebaseError('');

    const unsubscribe = subscribeToEvents(
      isAdmin,
      data => {
        setEvents(data);
        setLoading(false);
        setFirebaseError('');
      },
      err => {
        console.error(err);
        setFirebaseError('Não foi possível carregar os eventos. Verifique as regras e índices do Firestore.');
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [adminLoading, isAdmin]);

  const eventStats = useMemo(() => {
    const upcoming = events.filter(event => !isPast(event.date)).length;
    const today = events.filter(event => isToday(event.date)).length;
    const week = events.filter(event => !isPast(event.date) && isThisWeek(event.date, { locale: ptBR })).length;
    const hidden = events.filter(event => !event.isPublic).length;
    const past = events.filter(event => isPast(event.date)).length;

    return { upcoming, today, week, hidden, past };
  }, [events]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    let result = events.filter(event => {
      const matchesSearch =
        !normalizedSearch ||
        event.title.toLowerCase().includes(normalizedSearch) ||
        event.description?.toLowerCase().includes(normalizedSearch) ||
        event.category?.toLowerCase().includes(normalizedSearch);

      if (!matchesSearch) return false;
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

  async function confirmDelete() {
    if (!eventToDelete) return;

    try {
      await deleteEvent(eventToDelete.id);
      setEventToDelete(null);
      showSuccess('Evento excluído com sucesso!');
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
                <p className="text-sm text-[#49454F] mt-1">Modo admin ativo: você pode criar, editar, ocultar e excluir eventos.</p>
              )}
            </div>
            <EventSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Próximos" value={eventStats.upcoming} />
            <StatCard label="Hoje" value={eventStats.today} />
            <StatCard label="Semana" value={eventStats.week} />
            <StatCard label={isAdmin ? 'Rascunhos' : 'Finalizados'} value={isAdmin ? eventStats.hidden : eventStats.past} />
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
          <EmptyState isAdmin={isAdmin} onActionClick={openCreateModal} />
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
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {isAdmin && <FloatingActionButton onClick={openCreateModal} />}
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

        {eventToDelete && (
          <ConfirmModal
            title="Excluir evento?"
            description={`Você está prestes a excluir “${eventToDelete.title}”. Essa ação não pode ser desfeita.`}
            confirmLabel="Excluir"
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
