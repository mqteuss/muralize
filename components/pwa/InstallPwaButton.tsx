'use client';

import { Download } from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';

export function InstallPwaButton() {
  const { canInstall, promptInstall } = usePwaInstall();

  if (!canInstall) return null;

  return (
    <button
      type="button"
      onClick={promptInstall}
      className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium bg-[#ECE6F0] text-[#1D1B20] hover:bg-[#E2DCE6] rounded-full transition-colors"
      title="Instalar app"
      aria-label="Instalar Muralize"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Instalar</span>
    </button>
  );
}
