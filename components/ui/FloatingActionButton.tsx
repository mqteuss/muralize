import { Plus } from 'lucide-react';

interface Props {
  onClick: () => void;
}

export function FloatingActionButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 lg:bottom-12 lg:right-12 p-4 bg-[#1D1B20] text-white rounded-2xl shadow-lg hover:bg-[#313033] hover:shadow-xl transition-all"
      title="Novo Evento"
      aria-label="Novo Evento"
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}
