'use client';

import { useCallback, useEffect, useState } from 'react';
import { SchoolEvent } from '@/lib/events';
import { differenceInMinutes, isPast } from 'date-fns';

const STORAGE_KEY = 'mural-escola:notificacoes-enviadas:v1';
const ONE_HOUR_WINDOW_START = 1;
const ONE_HOUR_WINDOW_END = 60;
const ONE_DAY_WINDOW_START = 60 * 23;
const ONE_DAY_WINDOW_END = 60 * 24;

function getSentNotificationKeys() {
  if (typeof window === 'undefined') return new Set<string>();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set<string>();
  }
}

function saveSentNotificationKeys(keys: Set<string>) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...keys].slice(-500)));
  } catch {
    // Ignore localStorage errors. Notifications should not break the app.
  }
}

export function useNotifications(events: SchoolEvent[]) {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const result = await Notification.requestPermission();
    setPermission(result);
  }, []);

  const showNotification = useCallback((title: string, body: string) => {
    if (permission !== 'granted' || typeof window === 'undefined' || !('Notification' in window)) return;

    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `mural-escola-${title}-${body}`,
    });
  }, [permission]);

  useEffect(() => {
    if (permission !== 'granted' || events.length === 0) return;

    const checkEvents = () => {
      const sentKeys = getSentNotificationKeys();
      const now = new Date();

      events.forEach((event) => {
        if (isPast(event.date)) return;

        const diff = differenceInMinutes(event.date, now);
        const oneHourKey = `${event.id}:1h`;
        const oneDayKey = `${event.id}:1d`;

        if (diff >= ONE_HOUR_WINDOW_START && diff <= ONE_HOUR_WINDOW_END && !sentKeys.has(oneHourKey)) {
          showNotification(event.title, 'Começa em até 1 hora.');
          sentKeys.add(oneHourKey);
        }

        if (diff >= ONE_DAY_WINDOW_START && diff <= ONE_DAY_WINDOW_END && !sentKeys.has(oneDayKey)) {
          showNotification(event.title, 'Está marcado para amanhã.');
          sentKeys.add(oneDayKey);
        }
      });

      saveSentNotificationKeys(sentKeys);
    };

    checkEvents();
    const interval = window.setInterval(checkEvents, 60_000);

    return () => window.clearInterval(interval);
  }, [events, permission, showNotification]);

  return { permission, requestPermission, showNotification };
}
