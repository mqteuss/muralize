'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { isPast, isThisMonth, isThisWeek, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/components/AuthProvider';
import { useAdmin } from '@/hooks/useAdmin';
import { createEvent, deleteEvent, SchoolEvent, subscribeToEvents } from '@/lib/events';
import { AppHeader } from '@/components/layout/AppHeader';
import { EventCard } from '@/components/events/EventCard';
import { EventFilters, EventFilterType } from '@/components/events/EventFilters';
import { EventSearch } from '@/components/events/EventSearch';
import { EmptyState } from '@/components/ui/EmptyState';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { SkeletonCard } from '@/components/ui/SkeletonCard';

export default function Home() {
  const { signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<EventFilterType>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [layoutView, setLayoutView] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<SchoolEvent | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [form, setForm] = useState({ title: '', description: '', category: '', date: '', time: '' });

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToEvents(
      isAdmin,
      data => {
        setEvents(data);
        setLoading(false);
      },
      err => {
        console.error(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    let result = events.filter(event => {
      const matchesSearch =
        event.title.toLowerCase().includes(normalizedSearch) ||
        event.description?.toLowerCase().includes(normalizedSearch) ||
        event.category?.toLowerCase().includes(normalizedSearch);

      if (!matchesSearch) return false;
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

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.date || !form.time) return;

    setIsSaving(true);
    setErrorMsg('');

    try {
      await createEvent(crypto.randomUUID(), {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        date: new Date(`${form.date}T${form.time}`),
        isPublic: true,
      });

      setForm({ title: '', description: '', category: '', date: '', time: '' });
      setIsModalOpen(false);
      setSuccessMsg('Evento criado com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error(error);
      setErrorMsg('Não foi possível criar o evento. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!eventToDelete) return;

    try {
      await deleteEvent(eventToDelete.id);
      setEventToDelete(null);
      setSuccessMsg('Evento excluído com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error(error);
      setErrorMsg('Não foi possível excluir o evento.');
    }
  }

  async function confirmLogout() {
    await signOut();
    setIsLogoutModalOpen(false);
  }

  return (
    <div className="min-h-screen pb-24 relative">
      <AppHeader events={events} onLogoutClick={() => setIsLogoutModalOpen(true)} />

      {successMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-md">
          {successMsg}
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 pt-8">
        <div className="flex flex-col gap-4 mb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-medium tracking-tight">Mural de Eventos</h2>
            <EventSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          </div>

          <EventFilters
            filterType={filterType}
            setFilterType={setFilterType}
            filteredCount={filteredEvents.length}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            layoutView={layoutView}
            setLayoutView={setLayoutView}
          />
        </div>

        {loading ? (
          <div className="grid gap-4 mt-8 md:grid-cols-2">
            {[1, 2, 3, 4].map(item => <SkeletonCard key={item} />)}
          </div>
        ) : filteredEvents.length === 0 ? (
          <EmptyState isAdmin={isAdmin} onActionClick={() => setIsModalOpen(true)} />
        ) : (
          <div className={`mt-8 grid gap-4 ${layoutView === 'grid' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
            <AnimatePresence mode="popLayout">
              {filteredEvents.map(event => (
                <EventCard key={event.id} event={event} isAdmin={isAdmin} onDeleteClick={setEventToDelete} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {isAdmin && <FloatingActionButton onClick={() => setIsModalOpen(true)} />}
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <Modal onClose={() => setIsModalOpen(false)}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Novo evento</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-[#F4EFF4]" aria-label="Fechar">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <input className="field" placeholder="Título" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <input className="field" placeholder="Categoria" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              <textarea className="field min-h-24" placeholder="Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input className="field" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                <input className="field" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
              </div>
              {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
              <button disabled={isSaving} className="w-full py-3 rounded-full bg-[#1D1B20] text-white font-medium disabled:opacity-60">
                {isSaving ? 'Salvando...' : 'Criar evento'}
              </button>
            </form>
          </Modal>
        )}

        {eventToDelete && (
          <ConfirmModal
            title="Excluir evento?"
            description={`Você está prestes a excluir “${eventToDelete.title}”.`}
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
        }
        .field:focus {
          border-color: #1D1B20;
        }
      `}</style>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-[#1D1B20]/40 backdrop-blur-sm z-40" />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 20 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md bg-white rounded-[28px] shadow-2xl z-50 p-6">
        {children}
      </motion.div>
    </>
  );
}

function ConfirmModal({ title, description, confirmLabel, onCancel, onConfirm, danger }: { title: string; description: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void; danger?: boolean }) {
  return (
    <Modal onClose={onCancel}>
      <div className="flex items-center gap-3 mb-3">
        <AlertTriangle className={danger ? 'text-red-600' : 'text-[#49454F]'} />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-[#49454F] mb-6">{description}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="px-5 py-2.5 rounded-full bg-[#F4EFF4] font-medium">Cancelar</button>
        <button onClick={onConfirm} className={`px-5 py-2.5 rounded-full text-white font-medium ${danger ? 'bg-red-600' : 'bg-[#1D1B20]'}`}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}
