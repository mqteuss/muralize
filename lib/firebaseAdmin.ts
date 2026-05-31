import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

interface AdminServiceAccount {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

function normalizePrivateKey(value?: string) {
  return value?.replace(/\\n/g, '\n');
}

function readServiceAccountFromJson(raw: string): AdminServiceAccount {
  const parsed = JSON.parse(raw);

  const projectId = parsed.projectId || parsed.project_id;
  const clientEmail = parsed.clientEmail || parsed.client_email;
  const privateKey = normalizePrivateKey(parsed.privateKey || parsed.private_key);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY não contém project_id, client_email ou private_key válidos.');
  }

  return { projectId, clientEmail, privateKey };
}

function readServiceAccount(): AdminServiceAccount {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (rawJson?.trim()) {
    return readServiceAccountFromJson(rawJson);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin não configurado. Defina FIREBASE_SERVICE_ACCOUNT_KEY ou FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY.',
    );
  }

  return { projectId, clientEmail, privateKey };
}

let adminApp: App | null = null;

export function getAdminApp() {
  if (adminApp) return adminApp;

  if (getApps().length > 0) {
    adminApp = getApps()[0]!;
    return adminApp;
  }

  const serviceAccount = readServiceAccount();

  adminApp = initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.projectId,
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
