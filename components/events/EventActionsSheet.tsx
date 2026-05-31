import { Copy, Edit3, History, RotateCcw, Share2, Trash2 } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SchoolEvent } from '@/lib/events';

interface Props {
  event: SchoolEvent;
  isAdmin: boolean;
  onClose: () => void;
  onDeleteClick: (event: SchoolEvent) => void;
  onEditClick: (event: SchoolEvent) => void;
  onDuplicateClick: (event: SchoolEvent) => void;
  onHistoryClick: (event: SchoolEvent) => void;
  onRestoreClick: (event: SchoolEvent) => void;
  onShareClick: (event: SchoolEvent) => void;
}

function ActionButton({
  icon,
  label,
  description,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-3xl p-4 text-left transition-colors ${
        danger
          ? 'bg-red-600 text-white shadow-sm hover:bg-red-700'
          : 'bg-[var(--app-surface-soft)] text-[var(--app-text)] hover:bg-[var(--app-surface-hover)]'
      }`}
    >
      <span className={danger ? 'text-white' : 'text-[var(--app-text-muted)]'}>{icon}</span>
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className={`mt-0.5 block text-xs leading-relaxed ${danger ? 'text-red-100' : 'text-[var(--app-text-muted)]'}`}>
          {description}
        </span>
      </span>
    </button>
  );
}

export function EventActionsSheet({
  event,
  isAdmin,
  onClose,
  onDeleteClick,
  onEditClick,
  onDuplicateClick,
  onHistoryClick,
  onRestoreClick,
  onShareClick,
}: Props) {
  function run(action: (event: SchoolEvent) => void) {
    action(event);
    onClose();
  }

  return (
    <BottomSheet title="Ações do evento" description={event.title} onClose={onClose}>
      <div className="space-y-2">
        {!event.deletedAt && (
          <ActionButton
            icon={<Share2 className="h-5 w-5" />}
            label="Compartilhar"
            description="Enviar ou copiar este aviso para alunos e responsáveis."
            onClick={() => run(onShareClick)}
          />
        )}

        {isAdmin && !event.deletedAt && (
          <>
            <ActionButton
              icon={<Edit3 className="h-5 w-5" />}
              label="Editar"
              description="Alterar data, descrição, prioridade, fixação ou visibilidade."
              onClick={() => run(onEditClick)}
            />
            <ActionButton
              icon={<Copy className="h-5 w-5" />}
              label="Duplicar como rascunho"
              description="Criar uma cópia privada para reaproveitar depois."
              onClick={() => run(onDuplicateClick)}
            />
          </>
        )}

        {isAdmin && (
          <ActionButton
            icon={<History className="h-5 w-5" />}
            label="Histórico"
            description="Ver registros de criação, edição, restauração e exclusão."
            onClick={() => run(onHistoryClick)}
          />
        )}

        {isAdmin && event.deletedAt && (
          <ActionButton
            icon={<RotateCcw className="h-5 w-5" />}
            label="Restaurar"
            description="Trazer o evento de volta como rascunho para revisão."
            onClick={() => run(onRestoreClick)}
          />
        )}

        {isAdmin && (
          <ActionButton
            icon={<Trash2 className="h-5 w-5" />}
            label={event.deletedAt ? 'Excluir permanentemente' : 'Mover para lixeira'}
            description={event.deletedAt ? 'Remover de vez. Essa ação não pode ser desfeita.' : 'Tirar do mural sem apagar imediatamente.'}
            danger
            onClick={() => run(onDeleteClick)}
          />
        )}
      </div>
    </BottomSheet>
  );
}
