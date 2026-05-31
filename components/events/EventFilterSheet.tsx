import { ArrowDownUp, CalendarClock, CalendarDays, CalendarRange, EyeOff, LayoutGrid, List, Pin, Star, Trash2 } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { EventFilterType } from './EventFilters';

interface Props {
  filterType: EventFilterType;
  setFilterType: (filter: EventFilterType) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  layoutView: 'grid' | 'list';
  setLayoutView: (view: 'grid' | 'list') => void;
  showHiddenFilter?: boolean;
  onClose: () => void;
}

const allFilters: { id: EventFilterType; label: string; description: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
  { id: 'all', label: 'Próximos', description: 'Eventos futuros visíveis no mural.', icon: <CalendarClock className="h-5 w-5" /> },
  { id: 'today', label: 'Hoje', description: 'Tudo que acontece hoje.', icon: <CalendarDays className="h-5 w-5" /> },
  { id: 'week', label: 'Esta semana', description: 'Eventos futuros desta semana.', icon: <CalendarRange className="h-5 w-5" /> },
  { id: 'month', label: 'Este mês', description: 'Eventos futuros do mês atual.', icon: <CalendarRange className="h-5 w-5" /> },
  { id: 'pinned', label: 'Fixados', description: 'Eventos destacados no topo do mural.', icon: <Pin className="h-5 w-5" /> },
  { id: 'urgent', label: 'Urgentes', description: 'Eventos marcados com prioridade urgente.', icon: <Star className="h-5 w-5" /> },
  { id: 'hidden', label: 'Rascunhos', description: 'Eventos privados visíveis só para admin.', icon: <EyeOff className="h-5 w-5" />, adminOnly: true },
  { id: 'trash', label: 'Lixeira', description: 'Eventos removidos que ainda podem ser restaurados.', icon: <Trash2 className="h-5 w-5" />, adminOnly: true },
  { id: 'past', label: 'Finalizados', description: 'Eventos que já passaram.', icon: <CalendarClock className="h-5 w-5" /> },
];

export function EventFilterSheet({
  filterType,
  setFilterType,
  sortOrder,
  setSortOrder,
  layoutView,
  setLayoutView,
  showHiddenFilter = false,
  onClose,
}: Props) {
  const filters = allFilters.filter(filter => !filter.adminOnly || showHiddenFilter);

  function selectFilter(filter: EventFilterType) {
    setFilterType(filter);
    onClose();
  }

  return (
    <BottomSheet title="Filtros e visualização" description="Organize o mural do jeito mais rápido para consultar." onClose={onClose}>
      <div className="space-y-5 pb-3">
        <div className="space-y-2">
          {filters.map(filter => {
            const active = filterType === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => selectFilter(filter.id)}
                className={`flex w-full items-start gap-3 rounded-3xl p-4 text-left transition-colors ${
                  active
                    ? 'bg-[var(--app-primary)] text-[var(--app-primary-text)]'
                    : 'bg-[var(--app-surface-soft)] text-[var(--app-text)] hover:bg-[var(--app-surface-hover)]'
                }`}
              >
                <span className={active ? 'text-[var(--app-primary-text)]' : 'text-[var(--app-text-muted)]'}>{filter.icon}</span>
                <span>
                  <span className="block text-sm font-semibold">{filter.label}</span>
                  <span className={`mt-0.5 block text-xs leading-relaxed ${active ? 'opacity-80' : 'text-[var(--app-text-muted)]'}`}>
                    {filter.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="rounded-3xl bg-[var(--app-surface-soft)] p-4 text-left transition-colors hover:bg-[var(--app-surface-hover)]"
          >
            <ArrowDownUp className="mb-3 h-5 w-5 text-[var(--app-text-muted)]" />
            <span className="block text-sm font-semibold text-[var(--app-text)]">Ordem</span>
            <span className="mt-0.5 block text-xs text-[var(--app-text-muted)]">
              {sortOrder === 'asc' ? 'Mais próximos primeiro' : 'Mais distantes primeiro'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setLayoutView(layoutView === 'grid' ? 'list' : 'grid')}
            className="rounded-3xl bg-[var(--app-surface-soft)] p-4 text-left transition-colors hover:bg-[var(--app-surface-hover)]"
          >
            {layoutView === 'grid' ? <LayoutGrid className="mb-3 h-5 w-5 text-[var(--app-text-muted)]" /> : <List className="mb-3 h-5 w-5 text-[var(--app-text-muted)]" />}
            <span className="block text-sm font-semibold text-[var(--app-text)]">Visualização</span>
            <span className="mt-0.5 block text-xs text-[var(--app-text-muted)]">
              {layoutView === 'grid' ? 'Cards em grade' : 'Lista vertical'}
            </span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
