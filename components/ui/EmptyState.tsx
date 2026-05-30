import { CalendarPlus } from 'lucide-react';

interface Props {
  isAdmin?: boolean;
  onActionClick?: () => void;
}

export function EmptyState({ isAdmin, onActionClick }: Props) {
  return (
    <div className="text-center py-16 bg-[#F4EFF4] rounded-3xl border border-[#CAC4D0]/40 mt-8">
      <CalendarPlus className="w-8 h-8 text-[#49454F] mx-auto mb-3 opacity-80" />
      <p className="text-[#49454F] font-medium">Nenhum evento encontrado</p>
      <p className="text-sm text-[#49454F] opacity-80 mt-1 mb-4">
        {isAdmin ? 'Clique no botão abaixo para adicionar o primeiro.' : 'Refaça sua busca ou altere o filtro.'}
      </p>
      {isAdmin && onActionClick && (
        <button
          onClick={onActionClick}
          className="px-5 py-2.5 text-sm font-medium bg-[#1D1B20] text-white hover:bg-[#313033] rounded-full transition-colors"
        >
          Criar Primeiro Evento
        </button>
      )}
    </div>
  );
}
