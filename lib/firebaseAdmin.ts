import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY não foi configurada na Vercel.');
  }

  try {
    const parsed = JSON.parse(raw);

    if (typeof parsed.private_key === 'string') {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }

    return parsed;
  } catch (error) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY precisa ser o JSON inteiro da chave privada do Firebase.');
  }
}

let adminApp: App | null = null;

function getAdminApp() {
  if (adminApp) return adminApp;

  adminApp = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert(getServiceAccount()),
      });

  return adminApp;
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getAdminMessaging() {
  return getMessaging(getAdminApp());
}
