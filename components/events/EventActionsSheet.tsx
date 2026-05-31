import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Copy, Edit3, Eye, EyeOff, History, Pin, RotateCcw, Share2, Star, Trash2 } from 'lucide-react';
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

const priorityLabel: Record<SchoolEvent['priority'], string> = {
  normal: 'Normal',
  importante: 'Importante',
  urgente: 'Urgente',
};

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

function InfoPill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'primary' | 'warning' | 'danger' }) {
  const toneClass = {
    neutral: 'bg-[var(--app-surface-soft)] text-[var(--app-text-muted)] ring-[var(--app-border-soft)]',
    primary: 'bg-[var(--app-primary)] text-[var(--app-primary-text)] ring-transparent',
    warning: 'bg-amber-100 text-amber-800 ring-amber-200',
    danger: 'bg-red-100 text-red-700 ring-red-200',
  }[tone];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${toneClass}`}>
      {children}
    </span>
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

  const relativeText = (() => {
    if (event.deletedAt) return 'Na lixeira';
    if (isPast(event.date)) return 'Finalizado';
    if (isToday(event.date)) return 'Hoje';
    if (isTomorrow(event.date)) return 'Amanhã';
    return formatDistanceToNow(event.date, { addSuffix: true, locale: ptBR });
  })();

  const priorityTone = event.priority === 'urgente' ? 'danger' : event.priority === 'importante' ? 'warning' : 'neutral';

  return (
    <BottomSheet title="Detalhes do evento" description="Leia o aviso completo e escolha uma ação." onClose={onClose}>
      <div className="space-y-5 pb-2">
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <InfoPill tone="primary">{relativeText}</InfoPill>

            {event.isPinned && (
              <InfoPill>
                <Pin className="h-3.5 w-3.5" />
                Fixado
              </InfoPill>
            )}

            {event.priority !== 'normal' && (
              <InfoPill tone={priorityTone}>
                <Star className="h-3.5 w-3.5" />
                {priorityLabel[event.priority]}
              </InfoPill>
            )}

            {isAdmin && (
              <InfoPill tone={event.isPublic ? 'neutral' : 'warning'}>
                {event.isPublic ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                {event.isPublic ? 'Público' : 'Rascunho'}
              </InfoPill>
            )}
          </div>

          <div>
            <h2 className="break-words text-2xl font-semibold leading-tight tracking-tight text-[var(--app-text)]">
              {event.title}
            </h2>
            {event.category && (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
                {event.category}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-3xl bg-[var(--app-surface-soft)] p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[var(--app-surface)] p-2 text-[var(--app-text-muted)] ring-1 ring-[var(--app-border-soft)]">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--app-text)]">Data e horário</p>
              <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                {format(event.date, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <p className="text-sm font-semibold text-[var(--app-text)]">Descrição</p>
          <div
            className="max-h-[34dvh] overflow-y-auto rounded-3xl bg-[var(--app-surface-soft)] p-4 text-sm leading-relaxed text-[var(--app-text-muted)] ring-1 ring-[var(--app-border-soft)]"
            style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
          >
            {event.description ? (
              <p className="whitespace-pre-wrap break-words">{event.description}</p>
            ) : (
              <p>Este evento ainda não possui descrição.</p>
            )}
          </div>
        </section>

        {isAdmin && (
          <section className="rounded-3xl bg-[var(--app-surface-soft)] p-4 text-xs leading-relaxed text-[var(--app-text-muted)]">
            <p>
              Criado em {format(event.createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              {event.updatedAt ? ` · Atualizado em ${format(event.updatedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}` : ''}
            </p>
          </section>
        )}

        <section className="space-y-2">
          <p className="text-sm font-semibold text-[var(--app-text)]">Ações</p>

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
        </section>
      </div>
    </BottomSheet>
  );
}
