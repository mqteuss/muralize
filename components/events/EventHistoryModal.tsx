import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, X } from 'lucide-react';
import { BaseModal } from '@/components/ui/BaseModal';
import { EventHistoryItem, SchoolEvent } from '@/lib/events';

interface Props {
  event: SchoolEvent;
  items: EventHistoryItem[];
  loading: boolean;
  onClose: () => void;
}

const actionLabel: Record<EventHistoryItem['action'], string> = {
  created: 'Criado',
  updated: 'Atualizado',
  duplicated: 'Duplicado',
  deleted: 'Movido para lixeira',
  restored: 'Restaurado',
  permanently_deleted: 'Excluído permanentemente',
};

export function EventHistoryModal({ event, items, loading, onClose }: Props) {
  return (
    <BaseModal onClose={onClose}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold">Histórico</h3>
          <p className="text-sm text-[#49454F] mt-1 line-clamp-1">{event.title}</p>
        </div>
        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-[#F4EFF4]" aria-label="Fechar">
          <X className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(item => (
            <div key={item} className="h-16 rounded-2xl bg-[#F4EFF4] animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-[#F4EFF4] p-4 text-sm text-[#49454F]">
          Nenhuma alteração registrada ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="rounded-2xl border border-[#E6E0E9] bg-[#fefefe] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#1D1B20]">{actionLabel[item.action] || item.action}</p>
                <span className="text-xs text-[#49454F] whitespace-nowrap">
                  {format(item.at, "dd/MM HH:mm", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#49454F] mt-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Responsável: {item.actorId.slice(0, 8)}...</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </BaseModal>
  );
}
