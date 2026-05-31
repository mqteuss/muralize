import { SchoolEvent } from '@/lib/events';
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Eye, EyeOff, MoreVertical, Pin, Star } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  event: SchoolEvent;
  isAdmin: boolean;
  onActionsClick: (event: SchoolEvent) => void;
}

const priorityLabel: Record<SchoolEvent['priority'], string> = {
  normal: 'Normal',
  importante: 'Importante',
  urgente: 'Urgente',
};

export function EventCard({ event, isAdmin, onActionsClick }: Props) {
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
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative flex flex-col justify-between rounded-3xl border p-5 transition-colors ${
        event.deletedAt
          ? 'border-red-200 bg-red-50/50 hover:bg-red-50'
          : event.isPinned
            ? 'border-[#B9AFE9] bg-[#FBF9FF] hover:bg-[#F4EFF4]'
            : 'border-[#CAC4D0] bg-[#fefefe] hover:bg-[#F4EFF4]'
      }`}
    >
      <button
        type="button"
        onClick={() => onActionsClick(event)}
        className="absolute right-4 top-4 rounded-full p-2 text-[#49454F] transition-colors hover:bg-[#E6E0E9]"
        title="Ações do evento"
        aria-label="Ações do evento"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      <div className="pr-12">
        <div className="mb-2 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-2">
            {event.isPinned && <Pin className="mt-0.5 h-4 w-4 shrink-0 text-[#6750A4]" />}
            <h3 className="break-words text-base font-semibold leading-snug text-[#1D1B20]">{event.title}</h3>
          </div>
          <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${isPast(event.date) || event.deletedAt ? 'bg-[#E6E0E9] text-[#49454F]' : 'bg-[#1D1B20] text-[#fefefe]'}`}>
            {getRelativeTimeText(event.date)}
          </span>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          {event.category && (
            <span className="inline-block rounded bg-[#E6E0E9] px-2 py-0.5 text-[10px] font-bold uppercase text-[#49454F]">
              {event.category}
            </span>
          )}

          {event.priority !== 'normal' && (
            <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${priorityClass}`}>
              <Star className="h-3 w-3" />
              {priorityLabel[event.priority]}
            </span>
          )}

          {isAdmin && (
            <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${event.isPublic ? 'bg-[#E6E0E9] text-[#49454F]' : 'bg-amber-100 text-amber-800'}`}>
              {event.isPublic ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              {event.isPublic ? 'Público' : 'Rascunho'}
            </span>
          )}
        </div>

        {event.description && (
          <p className="mb-4 line-clamp-3 break-words text-sm text-[#49454F]">
            {event.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-sm text-[#49454F]">
          <Calendar className="h-4 w-4 opacity-70" />
          <span>{format(event.date, "dd 'de' MMMM, HH:mm", { locale: ptBR })}</span>
        </div>
      </div>
    </motion.article>
  );
}
