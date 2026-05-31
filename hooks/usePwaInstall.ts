'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type InstallSnapshot = {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  isIos: boolean;
  isSecureContext: boolean;
  supportsServiceWorker: boolean;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let listenersStarted = false;
let installedState = false;
const subscribers = new Set<() => void>();

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;

  const navigatorStandalone = 'standalone' in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  const displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;

  return navigatorStandalone || displayModeStandalone;
}

function isIosDevice() {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function getSnapshot(): InstallSnapshot {
  if (typeof window === 'undefined') {
    return {
      deferredPrompt: null,
      isInstalled: false,
      isIos: false,
      isSecureContext: false,
      supportsServiceWorker: false,
    };
  }

  installedState = installedState || isStandaloneMode();

  return {
    deferredPrompt,
    isInstalled: installedState,
    isIos: isIosDevice(),
    isSecureContext: window.isSecureContext,
    supportsServiceWorker: 'serviceWorker' in navigator,
  };
}

function notifySubscribers() {
  subscribers.forEach(listener => listener());
}

export function initPwaInstallListeners() {
  if (typeof window === 'undefined' || listenersStarted) return;

  listenersStarted = true;
  installedState = isStandaloneMode();

  const handleBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notifySubscribers();
  };

  const handleInstalled = () => {
    installedState = true;
    deferredPrompt = null;
    notifySubscribers();
  };

  const displayModeMedia = window.matchMedia('(display-mode: standalone)');
  const handleDisplayModeChange = () => {
    installedState = isStandaloneMode();
    notifySubscribers();
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleInstalled);
  displayModeMedia.addEventListener?.('change', handleDisplayModeChange);
}

export function usePwaInstall() {
  const [snapshot, setSnapshot] = useState<InstallSnapshot>(() => getSnapshot());

  useEffect(() => {
    initPwaInstallListeners();

    const updateSnapshot = () => setSnapshot(getSnapshot());
    subscribers.add(updateSnapshot);
    updateSnapshot();

    return () => {
      subscribers.delete(updateSnapshot);
    };
  }, []);

  const canInstall = useMemo(() => Boolean(snapshot.deferredPrompt) && !snapshot.isInstalled, [snapshot.deferredPrompt, snapshot.isInstalled]);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt || snapshot.isInstalled) return false;

    const promptEvent = deferredPrompt;
    deferredPrompt = null;
    notifySubscribers();

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;

      if (choice.outcome === 'accepted') {
        installedState = true;
        notifySubscribers();
        return true;
      }

      return false;
    } catch (error) {
      console.warn('PWA install prompt failed', error);
      notifySubscribers();
      return false;
    }
  }, [snapshot.isInstalled]);

  return {
    canInstall,
    isInstalled: snapshot.isInstalled,
    isIos: snapshot.isIos,
    isSecureContext: snapshot.isSecureContext,
    supportsServiceWorker: snapshot.supportsServiceWorker,
    promptInstall,
  };
}
