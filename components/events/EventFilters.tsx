import { SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { EventFilterSheet } from './EventFilterSheet';

export type EventFilterType = 'all' | 'today' | 'week' | 'month' | 'past' | 'hidden' | 'trash' | 'pinned' | 'urgent';

interface Props {
  filterType: EventFilterType;
  setFilterType: (filter: EventFilterType) => void;
  filteredCount: number;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  layoutView: 'grid' | 'list';
  setLayoutView: (view: 'grid' | 'list') => void;
  showHiddenFilter?: boolean;
}

const filterLabels: Record<EventFilterType, string> = {
  all: 'Próximos',
  today: 'Hoje',
  week: 'Semana',
  month: 'Mês',
  past: 'Finalizados',
  hidden: 'Rascunhos',
  trash: 'Lixeira',
  pinned: 'Fixados',
  urgent: 'Urgentes',
};

export function EventFilters({
  filterType,
  setFilterType,
  filteredCount,
  sortOrder,
  setSortOrder,
  layoutView,
  setLayoutView,
  showHiddenFilter = false,
}: Props) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const quickFilters = useMemo(() => {
    const items: { id: EventFilterType; label: string }[] = [
      { id: 'all', label: 'Próximos' },
      { id: 'today', label: 'Hoje' },
      { id: 'week', label: 'Semana' },
      { id: 'pinned', label: 'Fixados' },
    ];

    if (filterType && !items.some(item => item.id === filterType)) {
      items.push({ id: filterType, label: filterLabels[filterType] });
    }

    return items;
  }, [filterType]);

  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--app-surface-soft)] p-2">
        <div className="flex max-w-full gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {quickFilters.map(filter => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setFilterType(filter.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filterType === filter.id
                  ? 'bg-[var(--app-primary)] text-[var(--app-primary-text)] shadow-sm'
                  : 'text-[var(--app-text-muted)] hover:bg-[var(--app-surface-hover)]'
              }`}
            >
              {filter.label}
              {filterType === filter.id && (
                <span className="rounded-full bg-[#fefefe]/20 px-1.5 py-0.5 text-xs font-bold leading-none">
                  {filteredCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsSheetOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--app-surface)] px-3 py-2 text-sm font-medium text-[var(--app-text)] ring-1 ring-[var(--app-border-soft)] transition-colors hover:bg-[var(--app-surface-hover)]"
          aria-label="Abrir filtros"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filtros</span>
        </button>
      </div>

      <AnimatePresence>
        {isSheetOpen && (
          <EventFilterSheet
            filterType={filterType}
            setFilterType={setFilterType}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            layoutView={layoutView}
            setLayoutView={setLayoutView}
            showHiddenFilter={showHiddenFilter}
            onClose={() => setIsSheetOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
