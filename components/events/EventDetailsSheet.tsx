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

function DetailAction({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
        danger
          ? 'bg-red-600 text-white hover:bg-red-700'
          : 'bg-[var(--app-surface-soft)] text-[var(--app-text)] hover:bg-[var(--app-surface-hover)] ring-1 ring-[var(--app-border-soft)]'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function InfoPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--app-surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--app-text-muted)] ring-1 ring-[var(--app-border-soft)]">
      {children}
    </span>
  );
}

export function EventDetailsSheet({
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
  const relativeText = (() => {
    if (event.deletedAt) return 'Na lixeira';
    if (isPast(event.date)) return 'Finalizado';
    if (isToday(event.date)) return 'Hoje';
    if (isTomorrow(event.date)) return 'Amanhã';
    return formatDistanceToNow(event.date, { addSuffix: true, locale: ptBR });
  })();

  const priorityClass = event.priority === 'urgente'
    ? 'bg-red-100 text-red-700 ring-red-200'
    : event.priority === 'importante'
      ? 'bg-amber-100 text-amber-800 ring-amber-200'
      : 'bg-[var(--app-surface-soft)] text-[var(--app-text-muted)] ring-[var(--app-border-soft)]';

  function run(action: (event: SchoolEvent) => void) {
    action(event);
    onClose();
  }

  return (
    <BottomSheet title="Detalhes do evento" description="Veja a descrição completa e as ações disponíveis." onClose={onClose}>
      <div className="space-y-5 pb-2">
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--app-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--app-primary-text)]">
              {relativeText}
            </span>
            {event.isPinned && (
              <InfoPill>
                <Pin className="h-3.5 w-3.5" />
                Fixado
              </InfoPill>
            )}
            {event.priority !== 'normal' && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${priorityClass}`}>
                <Star className="h-3.5 w-3.5" />
                {priorityLabel[event.priority]}
              </span>
            )}
            {isAdmin && (
              <InfoPill>
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
          <div className="max-h-[34dvh] overflow-y-auto rounded-3xl bg-[var(--app-surface-soft)] p-4 text-sm leading-relaxed text-[var(--app-text-muted)] ring-1 ring-[var(--app-border-soft)]" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
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

        <section className="space-y-3">
          <p className="text-sm font-semibold text-[var(--app-text)]">Ações</p>
          <div className="flex flex-wrap gap-2">
            {!event.deletedAt && (
              <DetailAction
                icon={<Share2 className="h-4 w-4" />}
                label="Compartilhar"
                onClick={() => run(onShareClick)}
              />
            )}

            {isAdmin && !event.deletedAt && (
              <>
                <DetailAction
                  icon={<Edit3 className="h-4 w-4" />}
                  label="Editar"
                  onClick={() => run(onEditClick)}
                />
                <DetailAction
                  icon={<Copy className="h-4 w-4" />}
                  label="Duplicar"
                  onClick={() => run(onDuplicateClick)}
                />
              </>
            )}

            {isAdmin && (
              <DetailAction
                icon={<History className="h-4 w-4" />}
                label="Histórico"
                onClick={() => run(onHistoryClick)}
              />
            )}

            {isAdmin && event.deletedAt && (
              <DetailAction
                icon={<RotateCcw className="h-4 w-4" />}
                label="Restaurar"
                onClick={() => run(onRestoreClick)}
              />
            )}

            {isAdmin && (
              <DetailAction
                icon={<Trash2 className="h-4 w-4" />}
                label={event.deletedAt ? 'Excluir de vez' : 'Mover para lixeira'}
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
