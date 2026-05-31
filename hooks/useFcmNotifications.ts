'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';
import { app, db } from '@/lib/firebase';

type PushStatus = 'checking' | 'unsupported' | 'missing-key' | 'default' | 'loading' | 'granted' | 'denied' | 'error';

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const TOKEN_CACHE_KEY = 'muralize_fcm_token';
const LAST_SYNC_CACHE_KEY = 'muralize_fcm_last_sync';

async function hashToken(token: string) {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return token.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 120);
  }

  const data = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function isPushSupported() {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  return isSupported().catch(() => false);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Não foi possível ativar as notificações.';
}

export function useFcmNotifications() {
  const { user } = useAuth();
  const [status, setStatus] = useState<PushStatus>('checking');
  const [token, setToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const syncInFlightRef = useRef(false);

  const saveToken = useCallback(async (fcmToken: string) => {
    const tokenHash = await hashToken(fcmToken);
    const now = Timestamp.now();

    const payload: Record<string, unknown> = {
      token: fcmToken,
      userAgent: navigator.userAgent.slice(0, 300),
      permission: 'granted',
      updatedAt: now,
      createdAt: now,
    };

    if (user?.uid) payload.uid = user.uid;
    if (user?.email) payload.email = user.email;

    await setDoc(doc(db, 'notificationSubscriptions', tokenHash), payload, { merge: true });

    const syncDate = new Date().toISOString();
    localStorage.setItem(TOKEN_CACHE_KEY, fcmToken);
    localStorage.setItem(LAST_SYNC_CACHE_KEY, syncDate);
    setToken(fcmToken);
    setLastSyncedAt(syncDate);
  }, [user?.email, user?.uid]);

  const syncToken = useCallback(async () => {
    if (syncInFlightRef.current) return token;
    syncInFlightRef.current = true;

    try {
      if (!vapidKey) {
        setStatus('missing-key');
        return null;
      }

      const supported = await isPushSupported();
      if (!supported) {
        setStatus('unsupported');
        return null;
      }

      if (Notification.permission !== 'granted') {
        setStatus(Notification.permission === 'denied' ? 'denied' : 'default');
        return null;
      }

      setErrorMessage('');

      const registration = await navigator.serviceWorker.ready;
      const messaging = getMessaging(app);
      const fcmToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!fcmToken) {
        setStatus('error');
        setErrorMessage('O Firebase não retornou um token de notificação para este navegador.');
        return null;
      }

      await saveToken(fcmToken);
      setStatus('granted');
      return fcmToken;
    } catch (error) {
      console.error('Erro ao sincronizar push notifications.', error);
      setErrorMessage(getErrorMessage(error));
      setStatus(Notification.permission === 'granted' ? 'error' : 'default');
      return null;
    } finally {
      syncInFlightRef.current = false;
    }
  }, [saveToken, token]);

  useEffect(() => {
    let mounted = true;

    async function checkSupportAndSync() {
      const cachedToken = localStorage.getItem(TOKEN_CACHE_KEY);
      const cachedSync = localStorage.getItem(LAST_SYNC_CACHE_KEY);

      if (cachedToken && mounted) setToken(cachedToken);
      if (cachedSync && mounted) setLastSyncedAt(cachedSync);

      const supported = await isPushSupported();
      if (!mounted) return;

      if (!supported) {
        setStatus('unsupported');
        return;
      }

      if (!vapidKey) {
        setStatus('missing-key');
        return;
      }

      if (Notification.permission === 'denied') {
        setStatus('denied');
        return;
      }

      if (Notification.permission === 'granted') {
        setStatus('loading');
        await syncToken();
        return;
      }

      setStatus('default');
    }

    checkSupportAndSync();

    return () => {
      mounted = false;
    };
  }, [syncToken]);

  async function requestPushPermission() {
    if (!vapidKey) {
      setStatus('missing-key');
      return null;
    }

    const supported = await isPushSupported();
    if (!supported) {
      setStatus('unsupported');
      return null;
    }

    if (Notification.permission === 'denied') {
      setStatus('denied');
      return null;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const permission = Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission();

      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'default');
        return null;
      }

      return await syncToken();
    } catch (error) {
      console.error('Erro ao ativar push notifications.', error);
      setErrorMessage(getErrorMessage(error));
      setStatus(Notification.permission === 'granted' ? 'error' : 'default');
      return null;
    }
  }

  return {
    status,
    token,
    errorMessage,
    lastSyncedAt,
    requestPushPermission,
    syncToken,
    isEnabled: status === 'granted',
    canRequest: status === 'default' || status === 'error' || status === 'granted',
  };
}
