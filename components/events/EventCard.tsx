import { SchoolEvent } from '@/lib/events';
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Copy, Eye, EyeOff, History, Pencil, Pin, RotateCcw, Share2, Star, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  event: SchoolEvent;
  isAdmin: boolean;
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

export function EventCard({
  event,
  isAdmin,
  onDeleteClick,
  onEditClick,
  onDuplicateClick,
  onHistoryClick,
  onRestoreClick,
  onShareClick,
}: Props) {
  const getRelativeTimeText = (date: Date) => {
    if (event.deletedAt) return 'Na lixeira';
    if (isPast(date)) return 'Finalizado';
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  const priorityClass = event.priority === 'urgente'
    ? 'text-red-700 bg-red-100'
    : event.priority === 'importante'
      ? 'text-amber-800 bg-amber-100'
      : 'text-[#49454F] bg-[#E6E0E9]';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group flex flex-col justify-between p-5 rounded-3xl border transition-colors relative ${
        event.deletedAt
          ? 'border-red-200 bg-red-50/50 hover:bg-red-50'
          : event.isPinned
            ? 'border-[#B9AFE9] bg-[#FBF9FF] hover:bg-[#F4EFF4]'
            : 'border-[#CAC4D0] bg-[#fefefe] hover:bg-[#F4EFF4]'
      }`}
    >
      <div className={isAdmin ? 'pr-24' : 'pr-10'}>
        <div className="flex items-start justify-between mb-2 gap-4">
          <div className="flex items-start gap-2 min-w-0">
            {event.isPinned && <Pin className="w-4 h-4 text-[#6750A4] mt-0.5 shrink-0" />}
            <h3 className="font-semibold text-base text-[#1D1B20] leading-snug break-words">{event.title}</h3>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 ${isPast(event.date) || event.deletedAt ? 'bg-[#E6E0E9] text-[#49454F]' : 'bg-[#1D1B20] text-[#fefefe]'}`}>
            {getRelativeTimeText(event.date)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          {event.category && (
            <span className="inline-block text-[10px] uppercase font-bold text-[#49454F] bg-[#E6E0E9] px-2 py-0.5 rounded">
              {event.category}
            </span>
          )}

          {event.priority !== 'normal' && (
            <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded ${priorityClass}`}>
              <Star className="w-3 h-3" />
              {priorityLabel[event.priority]}
            </span>
          )}

          {isAdmin && (
            <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded ${event.isPublic ? 'text-[#49454F] bg-[#E6E0E9]' : 'text-amber-800 bg-amber-100'}`}>
              {event.isPublic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              {event.isPublic ? 'Público' : 'Rascunho'}
            </span>
          )}
        </div>

        {event.description && (
          <p className="text-sm text-[#49454F] mb-4 break-words line-clamp-3">
            {event.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-sm text-[#49454F]">
          <Calendar className="w-4 h-4 opacity-70" />
          <span>{format(event.date, "dd 'de' MMMM, HH:mm", { locale: ptBR })}</span>
        </div>
      </div>

      <div className="absolute top-5 right-5 flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
        {!event.deletedAt && (
          <button
            type="button"
            onClick={() => onShareClick(event)}
            className="text-[#49454F] hover:bg-[#E6E0E9] p-2 rounded-full transition-colors focus:opacity-100"
            title="Compartilhar evento"
            aria-label="Compartilhar evento"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}

        {isAdmin && !event.deletedAt && (
          <>
            <button
              type="button"
              onClick={() => onEditClick(event)}
              className="text-[#49454F] hover:bg-[#E6E0E9] p-2 rounded-full transition-colors focus:opacity-100"
              title="Editar evento"
              aria-label="Editar evento"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDuplicateClick(event)}
              className="text-[#49454F] hover:bg-[#E6E0E9] p-2 rounded-full transition-colors focus:opacity-100"
              title="Duplicar evento"
              aria-label="Duplicar evento"
            >
              <Copy className="w-4 h-4" />
            </button>
          </>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={() => onHistoryClick(event)}
            className="text-[#49454F] hover:bg-[#E6E0E9] p-2 rounded-full transition-colors focus:opacity-100"
            title="Histórico do evento"
            aria-label="Histórico do evento"
          >
            <History className="w-4 h-4" />
          </button>
        )}

        {isAdmin && event.deletedAt && (
          <button
            type="button"
            onClick={() => onRestoreClick(event)}
            className="text-green-700 hover:bg-green-100 p-2 rounded-full transition-colors focus:opacity-100"
            title="Restaurar evento"
            aria-label="Restaurar evento"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={() => onDeleteClick(event)}
            className="text-red-600 hover:bg-red-100 p-2 rounded-full transition-colors focus:opacity-100"
            title={event.deletedAt ? 'Excluir permanentemente' : 'Mover para lixeira'}
            aria-label={event.deletedAt ? 'Excluir permanentemente' : 'Mover para lixeira'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
