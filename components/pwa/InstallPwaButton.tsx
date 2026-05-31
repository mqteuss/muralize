'use client';

import { Download, Info, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { usePwaInstall } from '@/hooks/usePwaInstall';

interface Props {
  variant?: 'pill' | 'row';
}

function InstallGuide({ isIos, isSecureContext, supportsServiceWorker }: { isIos: boolean; isSecureContext: boolean; supportsServiceWorker: boolean }) {
  return (
    <div className="mt-3 rounded-2xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] p-3 text-xs leading-relaxed text-[var(--app-text-muted)]">
      <div className="mb-2 flex items-center gap-2 font-semibold text-[var(--app-text)]">
        <Info className="h-4 w-4" />
        Instalação manual
      </div>
      {!isSecureContext ? (
        <p>O PWA só pode ser instalado em domínio HTTPS. Depois do deploy na Vercel, abra o link seguro do app.</p>
      ) : !supportsServiceWorker ? (
        <p>Este navegador não oferece suporte completo a PWA. Tente Chrome, Edge, Samsung Internet ou Safari no iPhone.</p>
      ) : isIos ? (
        <p>No iPhone/iPad, abra no Safari, toque em compartilhar e escolha “Adicionar à Tela de Início”.</p>
      ) : (
        <p>No Chrome/Edge, abra o menu do navegador e escolha “Instalar app” ou “Adicionar à tela inicial”. No desktop, procure o ícone de instalação na barra de endereço.</p>
      )}
    </div>
  );
}

export function InstallPwaButton({ variant = 'pill' }: Props) {
  const { canInstall, promptInstall, isInstalled, isIos, isSecureContext, supportsServiceWorker } = usePwaInstall();
  const [showGuide, setShowGuide] = useState(false);

  async function handleClick() {
    if (isInstalled) return;

    if (canInstall) {
      const installed = await promptInstall();
      if (!installed) setShowGuide(true);
      return;
    }

    setShowGuide(value => !value);
  }

  const label = isInstalled ? 'App instalado' : canInstall ? 'Instalar Muralize' : 'Como instalar';

  if (variant === 'row') {
    return (
      <div>
        <button
          type="button"
          onClick={handleClick}
          disabled={isInstalled}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--app-surface)] px-4 py-2.5 text-sm font-medium text-[var(--app-text)] ring-1 ring-[var(--app-border-soft)] transition-colors hover:bg-[var(--app-surface-hover)] disabled:cursor-default disabled:opacity-70"
          title={isInstalled ? 'App já instalado' : canInstall ? 'Instalar app' : 'Ver instruções de instalação'}
        >
          <Smartphone className="h-4 w-4" />
          {label}
        </button>
        {showGuide && !isInstalled && <InstallGuide isIos={isIos} isSecureContext={isSecureContext} supportsServiceWorker={supportsServiceWorker} />}
      </div>
    );
  }

  if (isInstalled) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium bg-[#ECE6F0] text-[#1D1B20] hover:bg-[#E2DCE6] rounded-full transition-colors"
      title={canInstall ? 'Instalar app' : 'Ver como instalar'}
      aria-label={canInstall ? 'Instalar Muralize' : 'Ver como instalar Muralize'}
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">{canInstall ? 'Instalar' : 'Instalar?'}</span>
    </button>
  );
}
