'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, WifiOff } from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';

export function PwaRegistrar() {
  usePwaInstall();

  const [isOnline, setIsOnline] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let reloading = false;

    const handleControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    const registerWorker = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(registration => {
          if (registration.waiting) {
            setWaitingWorker(registration.waiting);
            setUpdateAvailable(true);
          }

          registration.addEventListener('updatefound', () => {
            const worker = registration.installing;
            if (!worker) return;

            worker.addEventListener('statechange', () => {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(worker);
                setUpdateAvailable(true);
              }
            });
          });
        })
        .catch(error => {
          console.warn('Service worker registration failed', error);
        });
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    if (document.readyState === 'complete') {
      registerWorker();
    } else {
      window.addEventListener('load', registerWorker, { once: true });
    }

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      window.removeEventListener('load', registerWorker);
    };
  }, []);

  function applyUpdate() {
    if (!waitingWorker) return;
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  }

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 right-4 z-50 flex flex-col items-start gap-2 sm:right-auto">
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-[#1D1B20] px-4 py-2 text-sm font-medium text-white shadow-lg"
          >
            <WifiOff className="h-4 w-4" />
            Offline
          </motion.div>
        )}

        {updateAvailable && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            onClick={applyUpdate}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-[#ECE6F0] px-4 py-2 text-sm font-medium text-[#1D1B20] shadow-lg hover:bg-[#E2DCE6]"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar app
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
