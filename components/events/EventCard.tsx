import { SchoolEvent } from '@/lib/events';
import { format, isPast, isToday, isTomorrow, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  event: SchoolEvent;
  isAdmin: boolean;
  onDeleteClick: (event: SchoolEvent) => void;
}

export function EventCard({ event, isAdmin, onDeleteClick }: Props) {
  const getRelativeTimeText = (date: Date) => {
    if (isPast(date)) return 'Finalizado';
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group flex flex-col justify-between p-5 rounded-3xl border border-[#CAC4D0] bg-[#fefefe] hover:bg-[#F4EFF4] transition-colors relative"
    >
      <div className="pr-10">
        <div className="flex items-start justify-between mb-2 gap-4">
          <h3 className="font-semibold text-base text-[#1D1B20] leading-snug break-words">{event.title}</h3>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 ${isPast(event.date) ? 'bg-[#E6E0E9] text-[#49454F]' : 'bg-[#1D1B20] text-[#fefefe]'}`}>
            {getRelativeTimeText(event.date)}
          </span>
        </div>
        {event.category && (
          <span className="inline-block text-[10px] uppercase font-bold text-[#49454F] bg-[#E6E0E9] px-2 py-0.5 rounded mb-2">
            {event.category}
          </span>
        )}
        {event.description && (
          <p className="text-sm text-[#49454F] mb-4 break-words">
            {event.description}
          </p>
        )}
        <div className="flex items-center gap-2 text-sm text-[#49454F]">
          <Calendar className="w-4 h-4 opacity-70" />
          <span>{format(event.date, "dd 'de' MMMM, HH:mm", { locale: ptBR })}</span>
        </div>
      </div>
      
      {isAdmin && (
        <div className="absolute top-5 right-5 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onDeleteClick(event)}
            className="text-red-600 hover:bg-red-100 p-2 rounded-full transition-colors focus:opacity-100"
            title="Excluir evento"
            aria-label="Excluir evento"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
