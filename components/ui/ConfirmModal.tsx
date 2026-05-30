import { AlertTriangle } from 'lucide-react';
import { BaseModal } from './BaseModal';

interface Props {
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  danger?: boolean;
}

export function ConfirmModal({ title, description, confirmLabel, onCancel, onConfirm, danger }: Props) {
  return (
    <BaseModal onClose={onCancel}>
      <div className="flex items-center gap-3 mb-3">
        <AlertTriangle className={danger ? 'text-red-600' : 'text-[#49454F]'} />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-[#49454F] mb-6">{description}</p>
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-full bg-[#F4EFF4] font-medium">
          Cancelar
        </button>
        <button type="button" onClick={onConfirm} className={`px-5 py-2.5 rounded-full text-white font-medium ${danger ? 'bg-red-600' : 'bg-[#1D1B20]'}`}>
          {confirmLabel}
        </button>
      </div>
    </BaseModal>
  );
}
