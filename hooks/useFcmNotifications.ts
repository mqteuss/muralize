'use client';

import { useEffect, useState } from 'react';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';
import { app, db } from '@/lib/firebase';

type PushStatus = 'checking' | 'unsupported' | 'missing-key' | 'default' | 'loading' | 'granted' | 'denied' | 'error';

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const TOKEN_CACHE_KEY = 'muralize_fcm_token';

async function hashToken(token: string) {
  if (!crypto?.subtle) return token.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 120);

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

export function useFcmNotifications() {
  const { user } = useAuth();
  const [status, setStatus] = useState<PushStatus>('checking');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkSupport() {
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

      const cachedToken = localStorage.getItem(TOKEN_CACHE_KEY);
      if (cachedToken) setToken(cachedToken);

      if (Notification.permission === 'granted') {
        setStatus('granted');
        return;
      }

      setStatus(Notification.permission === 'denied' ? 'denied' : 'default');
    }

    checkSupport();

    return () => {
      mounted = false;
    };
  }, []);

  async function saveToken(fcmToken: string) {
    const tokenHash = await hashToken(fcmToken);
    localStorage.setItem(TOKEN_CACHE_KEY, fcmToken);
    setToken(fcmToken);

    await setDoc(doc(db, 'notificationSubscriptions', tokenHash), {
      token: fcmToken,
      uid: user?.uid || null,
      email: user?.email || null,
      userAgent: navigator.userAgent.slice(0, 300),
      permission: 'granted',
      updatedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    }, { merge: true });
  }

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

    try {
      const permission = Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission();

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

      try {
        await saveToken(fcmToken);
      } catch (saveError) {
        console.warn('Permissão de push ativa, mas não foi possível salvar o token no Firestore.', saveError);
        localStorage.setItem(TOKEN_CACHE_KEY, fcmToken);
        setToken(fcmToken);
      }

      setStatus('granted');
      return fcmToken;
    } catch (error) {
      console.error('Erro ao ativar push notifications.', error);
      setStatus(Notification.permission === 'granted' ? 'granted' : 'error');
      return null;
    }
  }

  return {
    status,
    token,
    requestPushPermission,
    isEnabled: status === 'granted',
    canRequest: status === 'default' || status === 'error' || status === 'denied',
  };
}
