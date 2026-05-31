import { ArrowDownUp, LayoutGrid, List } from 'lucide-react';

export type EventFilterType = 'all' | 'today' | 'week' | 'month' | 'past' | 'hidden' | 'trash';

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

export function EventFilters({
  filterType, setFilterType, filteredCount,
  sortOrder, setSortOrder, layoutView, setLayoutView, showHiddenFilter = false
}: Props) {
  const filters: { id: EventFilterType; label: string }[] = [
    { id: 'all', label: 'Próximos' },
    { id: 'today', label: 'Hoje' },
    { id: 'week', label: 'Esta Semana' },
    { id: 'month', label: 'Este Mês' },
    ...(showHiddenFilter ? [
      { id: 'hidden' as EventFilterType, label: 'Rascunhos' },
      { id: 'trash' as EventFilterType, label: 'Lixeira' },
    ] : []),
    { id: 'past', label: 'Finalizados' }
  ];

  return (
    <div className="flex items-center justify-between gap-4 bg-[#F4EFF4] p-2 rounded-2xl">
      <div className="flex gap-2 w-fit max-w-full overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {filters.map(filter => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setFilterType(filter.id)}
            className={`px-4 py-1.5 flex items-center gap-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              filterType === filter.id 
                ? 'bg-[#1D1B20] text-white shadow-sm' 
                : 'text-[#49454F] hover:bg-[#E6E0E9]'
            }`}
          >
            {filter.label}
            {filterType === filter.id && (
              <span className="bg-[#fefefe]/20 px-1.5 py-0.5 rounded-full text-xs font-bold leading-none">
                {filteredCount}
              </span>
            )}
          </button>
        ))}
      </div>
      
      <div className="flex items-center gap-1 border-l border-[#CAC4D0] pl-3 ml-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="p-2 text-[#49454F] hover:bg-[#E6E0E9] rounded-full transition-colors flex items-center justify-center"
          title={sortOrder === 'asc' ? 'Mais próximos primeiro' : 'Mais distantes primeiro'}
          aria-label="Alternar ordem"
        >
          <ArrowDownUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setLayoutView(layoutView === 'grid' ? 'list' : 'grid')}
          className="p-2 text-[#49454F] hover:bg-[#E6E0E9] rounded-full transition-colors flex items-center justify-center"
          title={layoutView === 'grid' ? 'Ver como lista' : 'Ver como grid'}
          aria-label="Alternar layout"
        >
          {layoutView === 'grid' ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
