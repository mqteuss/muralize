'use client';
import { useEffect, useState, useRef } from 'react';
import { SchoolEvent } from '@/lib/events';
import { differenceInMinutes, isPast } from 'date-fns';

export function useNotifications(events: SchoolEvent[]) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const checkedEventsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      try {
        const stored = localStorage.getItem('notified_events');
        if (stored) {
          checkedEventsRef.current = new Set(JSON.parse(stored));
        }
      } catch (e) {
        // Ignore error
      }
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  useEffect(() => {
    if (permission !== 'granted' || events.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      let hasChanges = false;
      const notifiedSet = checkedEventsRef.current;

      events.forEach(event => {
        if (isPast(event.date)) return;

        const diff = differenceInMinutes(event.date, now);
        const eventId60 = `${event.id}_60`;
        const eventId1440 = `${event.id}_1440`;

        if (diff <= 60 && diff > 55 && !notifiedSet.has(eventId60)) {
          showNotification(event.title, 'Começa em 1 hora!');
          notifiedSet.add(eventId60);
          hasChanges = true;
        } else if (diff <= 1440 && diff > 1435 && !notifiedSet.has(eventId1440)) {
          showNotification(event.title, 'Começa amanhã!');
          notifiedSet.add(eventId1440);
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        try {
          localStorage.setItem('notified_events', JSON.stringify(Array.from(notifiedSet)));
        } catch (e) {
          // Ignore
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [events, permission]);

  const showNotification = (title: string, body: string) => {
    if (permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  return { permission, requestPermission, showNotification };
}
