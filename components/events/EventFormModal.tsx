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
    <BaseModal onClose={onClose} scrollable={false}>
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4 sm:px-6 sm:pb-6 sm:pt-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-[var(--app-text)]">{isEditing ? 'Editar evento' : 'Novo evento'}</h3>
              <p className="mt-1 text-sm text-[var(--app-text-muted)]">Mantenha a informação curta e clara para os alunos.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              onPointerDown={event => event.stopPropagation()}
              className="rounded-full p-2 text-[var(--app-text-muted)] hover:bg-[var(--app-surface-soft)]"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <label className="form-label">
              Título
              <input className="field mt-1" placeholder="Ex: Prova de matemática" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              <textarea className="field mt-1 min-h-24" placeholder="Detalhes rápidos sobre o evento" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
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
              className="flex w-full items-start gap-3 rounded-2xl bg-[var(--app-surface-soft)] p-4 text-left transition-colors hover:bg-[var(--app-surface-hover)]"
            >
              <Pin className={`mt-0.5 h-5 w-5 ${form.isPinned ? 'text-[var(--app-accent-strong)]' : 'text-[var(--app-text-muted)]'}`} />
              <span>
                <span className="block text-sm font-medium text-[var(--app-text)]">
                  {form.isPinned ? 'Evento fixado no topo' : 'Evento não fixado'}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--app-text-muted)]">
                  Eventos fixados aparecem antes dos demais no mural.
                </span>
              </span>
            </button>

            <div className="rounded-2xl bg-[var(--app-surface-soft)] p-4">
              <div className="flex items-start gap-3">
                <Star className="mt-0.5 h-5 w-5 text-[var(--app-text-muted)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--app-text)]">Destaque: {PRIORITY_OPTIONS.find(option => option.value === form.priority)?.label}</p>
                  <p className="mt-0.5 text-xs text-[var(--app-text-muted)]">{PRIORITY_OPTIONS.find(option => option.value === form.priority)?.description}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setForm({ ...form, isPublic: !form.isPublic })}
              className="flex w-full items-start gap-3 rounded-2xl bg-[var(--app-surface-soft)] p-4 text-left transition-colors hover:bg-[var(--app-surface-hover)]"
            >
              {form.isPublic ? <Eye className="mt-0.5 h-5 w-5 text-[var(--app-text-muted)]" /> : <EyeOff className="mt-0.5 h-5 w-5 text-amber-700" />}
              <span>
                <span className="block text-sm font-medium text-[var(--app-text)]">
                  {form.isPublic ? 'Visível para todos' : 'Rascunho privado'}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--app-text-muted)]">
                  {form.isPublic ? 'Alunos e visitantes conseguem ver este evento.' : 'Somente administradores conseguem ver este evento.'}
                </span>
              </span>
            </button>

            {(errorMsg || localError) && <p className="text-sm text-red-600">{errorMsg || localError}</p>}
          </div>
        </div>

        <div className="shrink-0 border-t border-[var(--app-border-soft)] bg-[var(--app-surface)] px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 sm:pb-5">
          <button
            disabled={isSaving}
            className="w-full rounded-full bg-[var(--app-primary)] py-3 font-medium text-[var(--app-primary-text)] shadow-sm transition-transform active:scale-[0.99] disabled:opacity-60"
          >
            {isSaving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar evento'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
