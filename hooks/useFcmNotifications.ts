'use client';

import { useEffect, useState } from 'react';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';
import { app, db } from '@/lib/firebase';

type PushStatus = 'checking' | 'unsupported' | 'missing-key' | 'default' | 'loading' | 'granted' | 'denied' | 'error';

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

async function hashToken(token: string) {
  if (!crypto?.subtle) return token.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 120);

  const data = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function useFcmNotifications() {
  const { user } = useAuth();
  const [status, setStatus] = useState<PushStatus>('checking');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkSupport() {
      if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
        if (mounted) setStatus('unsupported');
        return;
      }

      const supported = await isSupported().catch(() => false);
      if (!mounted) return;

      if (!supported) {
        setStatus('unsupported');
        return;
      }

      if (!vapidKey) {
        setStatus('missing-key');
        return;
      }

      setStatus(Notification.permission === 'granted' ? 'granted' : Notification.permission === 'denied' ? 'denied' : 'default');
    }

    checkSupport();

    return () => {
      mounted = false;
    };
  }, []);

  async function requestPushPermission() {
    if (!vapidKey) {
      setStatus('missing-key');
      return null;
    }

    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported');
      return null;
    }

    setStatus('loading');

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'default');
        return null;
      }

      const registration = await navigator.serviceWorker.ready;
      const messaging = getMessaging(app);
      const fcmToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!fcmToken) {
        setStatus('error');
        return null;
      }

      const tokenHash = await hashToken(fcmToken);
      await setDoc(doc(db, 'notificationSubscriptions', tokenHash), {
        token: fcmToken,
        uid: user?.uid || null,
        email: user?.email || null,
        userAgent: navigator.userAgent.slice(0, 300),
        permission: 'granted',
        updatedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
      }, { merge: true });

      setToken(fcmToken);
      setStatus('granted');
      return fcmToken;
    } catch (error) {
      console.error('Erro ao ativar push notifications.', error);
      setStatus('error');
      return null;
    }
  }

  return {
    status,
    token,
    requestPushPermission,
    isEnabled: status === 'granted',
    canRequest: status === 'default' || status === 'error',
  };
}
