'use client';

import { Download, Smartphone } from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';

interface Props {
  variant?: 'pill' | 'row';
}

export function InstallPwaButton({ variant = 'pill' }: Props) {
  const { canInstall, promptInstall, isInstalled } = usePwaInstall();

  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={promptInstall}
        disabled={!canInstall}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--app-surface)] px-4 py-2.5 text-sm font-medium text-[var(--app-text)] ring-1 ring-[var(--app-border-soft)] transition-colors hover:bg-[var(--app-surface-hover)] disabled:cursor-not-allowed disabled:opacity-55"
        title={isInstalled ? 'App já instalado' : canInstall ? 'Instalar app' : 'Instalação indisponível neste navegador'}
      >
        <Smartphone className="h-4 w-4" />
        {isInstalled ? 'App instalado' : canInstall ? 'Instalar Muralize' : 'Instalação indisponível'}
      </button>
    );
  }

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
