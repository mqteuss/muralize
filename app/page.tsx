'use client';

import type { FormEvent, ReactNode } from 'react';
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createEvent, deleteEvent, SchoolEvent, subscribeToEvents } from '@/lib/events';
import { useNotifications } from '@/hooks/useNotifications';
import { ADMIN_EMAIL, FILTERS, FilterType } from '@/lib/constants';
import {
  format,
  formatDistanceToNow,
  isPast,
  isThisMonth,
  isThisWeek,
  isToday,
  isTomorrow,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle,
  Bell,
  BellOff,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Loader2,
  LogIn,
  LogOut,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

const modalTransition = { duration: 0.18, ease: [0.22, 1, 0.36, 1] } as const;

type ToastState = {
  type: 'success' | 'error';
  message: string;
} | null;

function getRelativeTimeText(date: Date) {
  if (isPast(date)) return 'Finalizado';
  if (isToday(date)) return 'Hoje';
  if (isTomorrow(date)) return 'Amanhã';
  return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
}

function isValidDateTime(date: string, time: string) {
  if (!date || !time) return false;
  return !Number.isNaN(new Date(`${date}T${time}`).getTime());
}

export default function Home() {
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const { permission, requestPermission } = useNotifications(events);

  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [eventToDelete, setEventToDelete] = useState<SchoolEvent | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [notificationsSupported, setNotificationsSupported] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const showToast = useCallback((nextToast: NonNullable<ToastState>) => {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const closeCreateModal = useCallback(() => {
    if (isSaving) return;
    setIsCreateModalOpen(false);
  }, [isSaving]);

  const resetCreateForm = useCallback(() => {
    setNewTitle('');
    setNewDesc('');
    setNewDate('');
    setNewTime('');
  }, []);

  useEffect(() => {
    setNotificationsSupported(typeof window !== 'undefined' && 'Notification' in window);
  }, []);

  useEffect(() => {
    setEventsLoading(true);
    setEventsError(null);

    const unsubscribe = subscribeToEvents(
      (data) => {
        setEvents(data);
        setEventsLoading(false);
      },
      (error) => {
        console.error(error);
        setEventsError('Não foi possível carregar os eventos agora.');
        setEventsLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setEventToDelete(null);
      setIsLogoutModalOpen(false);
      setIsCreateModalOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = deferredSearchQuery.trim().toLowerCase();

    return events.filter((eventItem) => {
      const matchesSearch = !normalizedSearch
        || eventItem.title.toLowerCase().includes(normalizedSearch)
        || eventItem.description.toLowerCase().includes(normalizedSearch);

      if (!matchesSearch) return false;
      if (filterType === 'today') return isToday(eventItem.date);
      if (filterType === 'week') return isThisWeek(eventItem.date, { locale: ptBR });
      if (filterType === 'month') return isThisMonth(eventItem.date);
      return true;
    });
  }, [deferredSearchQuery, events, filterType]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAdmin) {
      showToast({ type: 'error', message: 'Apenas o administrador pode criar eventos.' });
      return;
    }

    if (!newTitle.trim() || !isValidDateTime(newDate, newTime)) {
      showToast({ type: 'error', message: 'Preencha título, data e hora corretamente.' });
      return;
    }

    setIsSaving(true);

    try {
      await createEvent(crypto.randomUUID(), newTitle, newDesc, new Date(`${newDate}T${newTime}`));
      closeCreateModal();
      resetCreateForm();
      showToast({ type: 'success', message: 'Evento publicado no mural.' });
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', message: 'Não foi possível salvar o evento.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!eventToDelete || !isAdmin) return;

    setIsDeleting(true);

    try {
      await deleteEvent(eventToDelete.id);
      setEventToDelete(null);
      showToast({ type: 'success', message: 'Evento excluído.' });
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', message: 'Não foi possível excluir o evento.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await signOut();
      setIsLogoutModalOpen(false);
      showToast({ type: 'success', message: 'Você saiu da conta.' });
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', message: 'Não foi possível sair agora.' });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fefefe] pb-28 text-[#1D1B20]">
      <header className="sticky top-0 z-20 border-b border-[#e5e5e9] bg-[#fefefe]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-[#F4EFF4]">
              <Calendar className="h-5 w-5 text-[#49454F]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight text-[#1D1B20]">Mural da Escola</h1>
              <p className="hidden text-xs text-[#49454F] sm:block">Avisos e datas importantes</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {notificationsSupported && permission !== 'granted' && (
              <button
                type="button"
                onClick={requestPermission}
                className="rounded-full p-2 text-[#49454F] transition-colors hover:bg-[#F4EFF4] focus:outline-none focus:ring-2 focus:ring-[#1D1B20]/20"
                aria-label="Ativar notificações"
                title="Ativar notificações"
              >
                <BellOff className="h-5 w-5" aria-hidden="true" />
              </button>
            )}

            {permission === 'granted' && (
              <div className="rounded-full p-2 text-[#49454F]" aria-label="Notificações ativas" title="Notificações ativas">
                <Bell className="h-5 w-5" aria-hidden="true" />
              </div>
            )}

            {authLoading ? (
              <div className="h-9 w-20 animate-pulse rounded-full bg-[#F4EFF4]" />
            ) : user ? (
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#49454F] transition-colors hover:bg-[#F4EFF4] focus:outline-none focus:ring-2 focus:ring-[#1D1B20]/20 sm:px-4"
                aria-label="Sair da conta"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={signIn}
                className="inline-flex items-center gap-2 rounded-full bg-[#ECE6F0] px-3 py-2 text-sm font-medium text-[#1D1B20] transition-colors hover:bg-[#E2DCE6] focus:outline-none focus:ring-2 focus:ring-[#1D1B20]/20 sm:px-4"
                aria-label="Entrar com Google"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span>Entrar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-8">
        <section className="mb-8 rounded-[32px] border border-[#CAC4D0]/50 bg-[#F4EFF4]/65 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium text-[#6750A4]">Mural digital</p>
              <h2 className="text-2xl font-semibold tracking-tight text-[#1D1B20] sm:text-3xl">Dias importantes da escola</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#49454F]">
                Consulte provas, reuniões, entregas e avisos. O login é necessário apenas para administrar os eventos.
              </p>
            </div>

            {!user && (
              <button
                type="button"
                onClick={signIn}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1D1B20] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#313033] focus:outline-none focus:ring-2 focus:ring-[#1D1B20]/20 sm:w-auto"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Entrar como admin
              </button>
            )}
          </div>
        </section>

        <section className="mb-8 flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Próximos eventos</h2>
              <p className="text-sm text-[#49454F]">{events.length} evento{events.length === 1 ? '' : 's'} publicado{events.length === 1 ? '' : 's'}</p>
            </div>

            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#49454F]" aria-hidden="true" />
              <input
                type="search"
                placeholder="Buscar eventos..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-full bg-[#F4EFF4] py-2.5 pl-9 pr-4 text-sm text-[#1D1B20] outline-none transition-shadow placeholder:text-[#49454F] focus:ring-2 focus:ring-[#1D1B20]/20"
                aria-label="Buscar eventos"
              />
            </div>
          </div>

          <div className="flex w-full max-w-full gap-2 overflow-x-auto rounded-full bg-[#F4EFF4] p-1 sm:w-fit" style={{ scrollbarWidth: 'none' }}>
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setFilterType(filter.id)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#1D1B20]/20 ${
                  filterType === filter.id
                    ? 'bg-[#1D1B20] text-white shadow-sm'
                    : 'text-[#49454F] hover:bg-[#E6E0E9]'
                }`}
                aria-pressed={filterType === filter.id}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        {eventsError && (
          <div className="mb-5 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {eventsError}
          </div>
        )}

        {eventsLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-[156px] rounded-3xl border border-[#CAC4D0]/30 bg-[#fefefe] p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="h-5 w-1/2 animate-pulse rounded-md bg-[#E6E0E9]" />
                  <div className="h-6 w-20 shrink-0 animate-pulse rounded-full bg-[#E6E0E9]" />
                </div>
                <div className="mb-3 h-4 w-3/4 animate-pulse rounded-md bg-[#E6E0E9]" />
                <div className="h-4 w-1/3 animate-pulse rounded-md bg-[#E6E0E9]" />
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-[32px] border border-[#CAC4D0]/40 bg-[#F4EFF4] px-6 py-16 text-center">
            <CalendarPlus className="mx-auto mb-3 h-9 w-9 text-[#49454F] opacity-80" aria-hidden="true" />
            <p className="font-medium text-[#49454F]">Nenhum evento encontrado</p>
            <p className="mt-1 text-sm text-[#49454F]/80">
              {events.length === 0
                ? isAdmin
                  ? 'Toque em + para adicionar o primeiro evento.'
                  : 'Ainda não há eventos publicados.'
                : 'Tente buscar com outras palavras ou alterar o filtro.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <AnimatePresence initial={false} mode="popLayout">
              {filteredEvents.map((eventItem) => (
                <motion.article
                  key={eventItem.id}
                  layout="position"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={modalTransition}
                  className="group flex min-h-[156px] flex-col justify-between rounded-3xl border border-[#CAC4D0]/80 bg-[#fefefe] p-5 shadow-sm transition-colors hover:bg-[#F4EFF4]/70"
                >
                  <div>
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h3 className="line-clamp-2 text-base font-semibold text-[#1D1B20]">{eventItem.title}</h3>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${isPast(eventItem.date) ? 'bg-[#E6E0E9] text-[#49454F]' : 'bg-[#1D1B20] text-[#fefefe]'}`}>
                        {getRelativeTimeText(eventItem.date)}
                      </span>
                    </div>

                    {eventItem.description && (
                      <p className="mb-4 line-clamp-2 text-sm leading-6 text-[#49454F]">{eventItem.description}</p>
                    )}

                    <div className="flex items-center gap-2 text-sm text-[#49454F]">
                      <Calendar className="h-4 w-4 opacity-70" aria-hidden="true" />
                      <time dateTime={eventItem.date.toISOString()}>
                        {format(eventItem.date, "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                      </time>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="mt-4 flex justify-end border-t border-[#CAC4D0]/50 pt-4 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => setEventToDelete(eventItem)}
                        className="rounded-full p-2 text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                        aria-label={`Excluir evento ${eventItem.title}`}
                        title="Excluir evento"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="fixed right-5 z-30 rounded-2xl bg-[#1D1B20] p-4 text-white shadow-lg transition-all hover:bg-[#313033] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#1D1B20]/20 sm:right-8 lg:right-12"
            style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
            aria-label="Criar novo evento"
            title="Novo evento"
          >
            <Plus className="h-6 w-6" aria-hidden="true" />
          </button>
        )}
      </main>

      <AnimatePresence>
        {isCreateModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={modalTransition}
              onClick={closeCreateModal}
              className="fixed inset-0 z-40 bg-[#1D1B20]/40 backdrop-blur-sm"
            />
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-event-title"
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 28, scale: 0.98 }}
              transition={modalTransition}
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[32px] bg-[#fefefe] shadow-2xl sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px]"
            >
              <div className="flex items-center justify-between border-b border-[#e5e5e9] px-6 py-4">
                <h3 id="create-event-title" className="text-lg font-semibold text-[#1D1B20]">Novo evento</h3>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded-full p-2 text-[#49454F] transition-colors hover:bg-[#F4EFF4] focus:outline-none focus:ring-2 focus:ring-[#1D1B20]/20"
                  aria-label="Fechar modal de novo evento"
                  disabled={isSaving}
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="flex flex-col gap-4 overflow-y-auto p-6">
                <div>
                  <label htmlFor="event-title" className="mb-1 block px-1 text-xs font-medium text-[#49454F]">Título</label>
                  <input
                    id="event-title"
                    type="text"
                    required
                    maxLength={100}
                    value={newTitle}
                    onChange={(event) => setNewTitle(event.target.value)}
                    className="w-full rounded-t-lg border-b-2 border-transparent bg-[#F4EFF4] px-4 py-3 text-sm outline-none transition-colors focus:border-[#1D1B20]"
                    placeholder="Ex: Feira de Ciências"
                    disabled={isSaving}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="event-date" className="mb-1 block px-1 text-xs font-medium text-[#49454F]">Data</label>
                    <input
                      id="event-date"
                      type="date"
                      required
                      value={newDate}
                      onChange={(event) => setNewDate(event.target.value)}
                      className="w-full rounded-t-lg border-b-2 border-transparent bg-[#F4EFF4] px-4 py-3 text-sm outline-none transition-colors focus:border-[#1D1B20]"
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label htmlFor="event-time" className="mb-1 block px-1 text-xs font-medium text-[#49454F]">Hora</label>
                    <input
                      id="event-time"
                      type="time"
                      required
                      value={newTime}
                      onChange={(event) => setNewTime(event.target.value)}
                      className="w-full rounded-t-lg border-b-2 border-transparent bg-[#F4EFF4] px-4 py-3 text-sm outline-none transition-colors focus:border-[#1D1B20]"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="event-description" className="mb-1 block px-1 text-xs font-medium text-[#49454F]">Descrição opcional</label>
                  <textarea
                    id="event-description"
                    maxLength={500}
                    value={newDesc}
                    onChange={(event) => setNewDesc(event.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-t-lg border-b-2 border-transparent bg-[#F4EFF4] px-4 py-3 text-sm outline-none transition-colors focus:border-[#1D1B20]"
                    placeholder="Detalhes do aviso, prova ou reunião..."
                    disabled={isSaving}
                  />
                  <p className="mt-1 px-1 text-xs text-[#49454F]/70">{newDesc.length}/500</p>
                </div>

                <div className="mt-2 flex justify-end gap-2 pb-[env(safe-area-inset-bottom)]">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="rounded-full px-5 py-2.5 text-sm font-medium text-[#49454F] transition-colors hover:bg-[#F4EFF4] focus:outline-none focus:ring-2 focus:ring-[#1D1B20]/20"
                    disabled={isSaving}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex min-w-24 items-center justify-center gap-2 rounded-full bg-[#1D1B20] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#313033] focus:outline-none focus:ring-2 focus:ring-[#1D1B20]/20 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={isSaving}
                  >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    Salvar
                  </button>
                </div>
              </form>
            </motion.section>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {eventToDelete && (
          <ConfirmDialog
            title="Excluir evento?"
            description={`Tem certeza que deseja excluir “${eventToDelete.title}”? Esta ação não pode ser desfeita.`}
            icon={<AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />}
            confirmLabel="Excluir"
            danger
            loading={isDeleting}
            onCancel={() => setEventToDelete(null)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLogoutModalOpen && (
          <ConfirmDialog
            title="Sair da conta?"
            description="Você ainda poderá ver o mural, mas precisará entrar novamente para administrar eventos."
            icon={<LogOut className="h-6 w-6 text-red-600" aria-hidden="true" />}
            confirmLabel="Sair"
            danger
            loading={isSigningOut}
            onCancel={() => setIsLogoutModalOpen(false)}
            onConfirm={handleSignOut}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={modalTransition}
            className="fixed left-4 right-4 top-20 z-[60] mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-[#CAC4D0]/40 bg-[#fefefe] px-4 py-3 text-sm shadow-xl sm:left-auto sm:right-6 sm:mx-0"
            role="status"
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
            )}
            <span className="text-[#1D1B20]">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConfirmDialog({
  title,
  description,
  icon,
  confirmLabel,
  danger = false,
  loading = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={modalTransition}
        onClick={loading ? undefined : onCancel}
        className="fixed inset-0 z-40 bg-[#1D1B20]/40 backdrop-blur-sm"
      />
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={modalTransition}
        className="fixed inset-x-4 bottom-4 z-50 overflow-hidden rounded-[28px] bg-[#fefefe] p-6 text-center shadow-2xl sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2"
      >
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-red-100">{icon}</div>
        <h3 id="confirm-dialog-title" className="mb-2 text-lg font-semibold text-[#1D1B20]">{title}</h3>
        <p className="mb-6 text-sm leading-6 text-[#49454F]">{description}</p>
        <div className="flex w-full gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-full bg-[#F4EFF4] px-5 py-2.5 text-sm font-medium text-[#49454F] transition-colors hover:bg-[#E6E0E9] focus:outline-none focus:ring-2 focus:ring-[#1D1B20]/20 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70 ${
              danger ? 'bg-red-600 hover:bg-red-700 focus:ring-red-200' : 'bg-[#1D1B20] hover:bg-[#313033] focus:ring-[#1D1B20]/20'
            }`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </motion.section>
    </>
  );
}
