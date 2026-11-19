import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, setLogLevel } from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
let anonymousAuthDisabled = false;
let pendingAuthPromise: Promise<FirebaseUser | null> | null = null;

// Complete any pending mobile redirect sign-in on startup
const redirectCheckPromise = getRedirectResult(auth)
  .then((cred) => {
    if (cred?.user) {
      lastFirebaseAuthError = null;
    }
    return cred?.user || null;
  })
  .catch((err) => {
    const msg = err instanceof Error ? err.message : String(err);
    lastFirebaseAuthError = msg;
    return null;
  });

onAuthStateChanged(auth, (user) => {
  if (user) {
    lastFirebaseAuthError = null;
  }
});

export function getLastFirebaseAuthError(): string | null {
  return lastFirebaseAuthError;
}

export function isAnonymousAuthDisabled(): boolean {
  return anonymousAuthDisabled;
}

export const ensureFirebaseAuth = async (): Promise<FirebaseUser | null> => {
  await redirectCheckPromise.catch(() => null);

  if (auth.currentUser) {
    lastFirebaseAuthError = null;
    return auth.currentUser;
  }

  if (anonymousAuthDisabled) {
    return null;
  }

  if (pendingAuthPromise) {
    return pendingAuthPromise;
  }

  pendingAuthPromise = (async () => {
    try {
      const cred = await signInAnonymously(auth);
      lastFirebaseAuthError = null;
      return cred.user;
    } catch (err: any) {
      const code = err?.code || '';
      const msg = err instanceof Error ? err.message : String(err);
      if (
        code === 'auth/admin-restricted-operation' ||
        code === 'auth/operation-not-allowed' ||
        msg.includes('ADMIN_ONLY_OPERATION') ||
        msg.includes('admin-restricted-operation')
      ) {
        anonymousAuthDisabled = true;
        lastFirebaseAuthError = 'Connexion Google Administrateur requise pour la synchronisation Cloud multi-appareils.';
      } else {
        lastFirebaseAuthError = msg;
      }
      return auth.currentUser;
    } finally {
      pendingAuthPromise = null;
    }
  })();

  return pendingAuthPromise;
};

export async function signInWithGoogleSmart(): Promise<{ user: FirebaseUser | null; redirected?: boolean }> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const cred = await signInWithPopup(auth, provider);
    lastFirebaseAuthError = null;
    return { user: cred.user };
  } catch (err: any) {
    const code = err?.code || '';
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    const canFallbackToRedirect =
      typeof window !== 'undefined' &&
      window.self === window.top &&
      (code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment');

    if (canFallbackToRedirect) {
      await signInWithRedirect(auth, provider);
      return { user: null, redirected: true };
    }

    if (code === 'auth/unauthorized-domain') {
      const msg = `Domaine non autorisé dans Firebase Auth (${host}). Ajoutez ce domaine dans Firebase Console > Authentication > Settings > Authorized domains.`;
      lastFirebaseAuthError = msg;
      throw new Error(msg);
    }

    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      const msg = 'Fenêtre de connexion Google fermée avant la fin. Réessayez ou utilisez le transfert par lien/code entre appareils.';
      lastFirebaseAuthError = msg;
      throw new Error(msg);
    }

    const msg = err instanceof Error ? err.message : String(err);
    lastFirebaseAuthError = msg;
    throw err;
  }
}

// Attempt non-blocking auth check immediately
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
