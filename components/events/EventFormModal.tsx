import { FormEvent, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Eye, EyeOff, Pin, Star, X } from 'lucide-react';
import { BaseModal } from '@/components/ui/BaseModal';
import { EventPriority, SchoolEvent } from '@/lib/events';

const CATEGORY_OPTIONS = ['Aviso', 'Prova', 'Reunião', 'Entrega', 'Evento', 'Plantão', 'Outro'];
const PRIORITY_OPTIONS: { value: EventPriority; label: string; description: string }[] = [
  { value: 'normal', label: 'Normal', description: 'Evento comum do mural.' },
  { value: 'importante', label: 'Importante', description: 'Recebe destaque visual.' },
  { value: 'urgente', label: 'Urgente', description: 'Aparece com destaque máximo.' },
];

export interface EventFormPayload {
  title: string;
  description: string;
  category: string;
  date: Date;
  isPublic: boolean;
  isPinned: boolean;
  priority: EventPriority;
}

interface EventFormState {
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  isPublic: boolean;
  isPinned: boolean;
  priority: EventPriority;
}

interface Props {
  event?: SchoolEvent | null;
  isSaving: boolean;
  errorMsg: string;
  onClose: () => void;
  onSubmit: (payload: EventFormPayload) => Promise<void>;
}

const emptyForm: EventFormState = {
  title: '',
  description: '',
  category: 'Aviso',
  date: '',
  time: '',
  isPublic: true,
  isPinned: false,
  priority: 'normal',
};

export function EventFormModal({ event, isSaving, errorMsg, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<EventFormState>(emptyForm);
  const [localError, setLocalError] = useState('');
  const isEditing = Boolean(event);

  useEffect(() => {
    if (!event) {
      setForm(emptyForm);
      setLocalError('');
      return;
    }

    setLocalError('');
    setForm({
      title: event.title,
      description: event.description || '',
      category: event.category || 'Aviso',
      date: format(event.date, 'yyyy-MM-dd'),
      time: format(event.date, 'HH:mm'),
      isPublic: event.isPublic,
      isPinned: event.isPinned,
      priority: event.priority || 'normal',
    });
  }, [event]);

  function validateForm() {
    if (form.title.trim().length < 3) return 'O título precisa ter pelo menos 3 caracteres.';
    if (form.title.trim().length > 100) return 'O título pode ter no máximo 100 caracteres.';
    if (form.description.trim().length > 500) return 'A descrição pode ter no máximo 500 caracteres.';
    if (!form.date || !form.time) return 'Informe a data e o horário do evento.';

    const selectedDate = new Date(`${form.date}T${form.time}`);
    if (Number.isNaN(selectedDate.getTime())) return 'Data ou horário inválido.';

    return '';
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setLocalError(validationMessage);
      return;
    }

    setLocalError('');
    await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      date: new Date(`${form.date}T${form.time}`),
      isPublic: form.isPublic,
      isPinned: form.isPinned,
      priority: form.priority,
    });
  }

  return (
    <BaseModal onClose={onClose}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold">{isEditing ? 'Editar evento' : 'Novo evento'}</h3>
          <p className="text-sm text-[#49454F] mt-1">Mantenha a informação curta e clara para os alunos.</p>
        </div>
        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-[#F4EFF4]" aria-label="Fechar">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="form-label">
          Título
          <input className="field mt-1" placeholder="Ex: Prova de matemática" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="form-label">
            Categoria
            <select className="field mt-1" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORY_OPTIONS.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>

          <label className="form-label">
            Prioridade
            <select className="field mt-1" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as EventPriority })}>
              {PRIORITY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="form-label">
          Descrição
          <textarea className="field min-h-24 mt-1" placeholder="Detalhes rápidos sobre o evento" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="form-label">
            Data
            <input className="field mt-1" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </label>
          <label className="form-label">
            Horário
            <input className="field mt-1" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
          </label>
        </div>

        <button
          type="button"
          onClick={() => setForm({ ...form, isPinned: !form.isPinned })}
          className="w-full flex items-start gap-3 text-left rounded-2xl bg-[#F4EFF4] hover:bg-[#E6E0E9] transition-colors p-4"
        >
          <Pin className={`w-5 h-5 mt-0.5 ${form.isPinned ? 'text-[#6750A4]' : 'text-[#49454F]'}`} />
          <span>
            <span className="block text-sm font-medium text-[#1D1B20]">
              {form.isPinned ? 'Evento fixado no topo' : 'Evento não fixado'}
            </span>
            <span className="block text-xs text-[#49454F] mt-0.5">
              Eventos fixados aparecem antes dos demais no mural.
            </span>
          </span>
        </button>

        <div className="rounded-2xl bg-[#F4EFF4] p-4">
          <div className="flex items-start gap-3">
            <Star className="w-5 h-5 text-[#49454F] mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#1D1B20]">Destaque: {PRIORITY_OPTIONS.find(option => option.value === form.priority)?.label}</p>
              <p className="text-xs text-[#49454F] mt-0.5">{PRIORITY_OPTIONS.find(option => option.value === form.priority)?.description}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setForm({ ...form, isPublic: !form.isPublic })}
          className="w-full flex items-start gap-3 text-left rounded-2xl bg-[#F4EFF4] hover:bg-[#E6E0E9] transition-colors p-4"
        >
          {form.isPublic ? <Eye className="w-5 h-5 text-[#49454F] mt-0.5" /> : <EyeOff className="w-5 h-5 text-amber-700 mt-0.5" />}
          <span>
            <span className="block text-sm font-medium text-[#1D1B20]">
              {form.isPublic ? 'Visível para todos' : 'Rascunho privado'}
            </span>
            <span className="block text-xs text-[#49454F] mt-0.5">
              {form.isPublic ? 'Alunos e visitantes conseguem ver este evento.' : 'Somente administradores conseguem ver este evento.'}
            </span>
          </span>
        </button>

        {(errorMsg || localError) && <p className="text-sm text-red-600">{errorMsg || localError}</p>}

        <button disabled={isSaving} className="w-full py-3 rounded-full bg-[#1D1B20] text-white font-medium disabled:opacity-60">
          {isSaving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar evento'}
        </button>
      </form>
    </BaseModal>
  );
}
