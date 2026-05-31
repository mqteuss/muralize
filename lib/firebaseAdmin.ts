import { cert, getApps, initializeApp } from 'firebase-admin/app';
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

const adminApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(getServiceAccount()),
    });

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminMessaging = getMessaging(adminApp);
