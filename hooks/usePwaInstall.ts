'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;

  const navigatorStandalone = 'standalone' in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  const displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;

  return navigatorStandalone || displayModeStandalone;
}

export function usePwaInstall() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(isStandaloneMode());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallEvent(null);
    };

    const displayModeMedia = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => setIsInstalled(isStandaloneMode());

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    displayModeMedia.addEventListener?.('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      displayModeMedia.removeEventListener?.('change', handleDisplayModeChange);
    };
  }, []);

  const canInstall = useMemo(() => Boolean(installEvent) && !isInstalled, [installEvent, isInstalled]);

  const promptInstall = useCallback(async () => {
    if (!installEvent) return false;

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);

    return choice.outcome === 'accepted';
  }, [installEvent]);

  return { canInstall, isInstalled, promptInstall };
}
