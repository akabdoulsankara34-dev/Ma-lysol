import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, setLogLevel } from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Suppress benign internal connection warnings and timeouts in sandboxed iframe / dev environments
try {
  setLogLevel('silent');
} catch {
  // Ignored
}

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

// Initialize Firebase App instance
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

let lastFirebaseAuthError: string | null = null;
let pendingAuthPromise: Promise<FirebaseUser | null> | null = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    lastFirebaseAuthError = null;
  }
});

export function getLastFirebaseAuthError(): string | null {
  return lastFirebaseAuthError;
}

export const ensureFirebaseAuth = async (): Promise<FirebaseUser | null> => {
  if (auth.currentUser) {
    lastFirebaseAuthError = null;
    return auth.currentUser;
  }

  if (pendingAuthPromise) {
    return pendingAuthPromise;
  }

  pendingAuthPromise = (async () => {
    try {
      const cred = await signInAnonymously(auth);
      lastFirebaseAuthError = null;
      return cred.user;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      lastFirebaseAuthError = msg;
      console.warn('Anonymous auth note (proceeding with Firestore):', msg);
      return auth.currentUser;
    } finally {
      pendingAuthPromise = null;
    }
  })();

  return pendingAuthPromise;
};

// Attempt non-blocking auth immediately
ensureFirebaseAuth().catch(() => null);

// Initialize Firestore with specific database ID as required by Firebase skill
export const db = getFirestore(app, firebaseConfigJson.firestoreDatabaseId || '(default)');

/**
 * Deeply strips `undefined` properties from objects and arrays.
 * Firestore strictly forbids `undefined` values in setDoc, addDoc, updateDoc,
 * which is the #1 cause of silent or aborted cloud synchronization across devices.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }

  if (typeof data === 'object' && !(data instanceof Date)) {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeForFirestore(value);
      }
    }
    return sanitized as T;
  }

  return data;
}
