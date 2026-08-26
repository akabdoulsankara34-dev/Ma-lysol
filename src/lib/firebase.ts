import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';

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

// Authenticate anonymously in background to ensure stable, authorized Firestore session
let currentAuthUser: FirebaseUser | null = null;
onAuthStateChanged(auth, (user) => {
  currentAuthUser = user;
});

export const ensureFirebaseAuth = async (): Promise<FirebaseUser | null> => {
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    console.warn('Anonymous auth note (proceeding with Firestore):', err);
    return null;
  }
};

// Attempt non-blocking auth immediately
ensureFirebaseAuth().catch(() => null);

// Initialize Firestore with specific database ID and offline persistent cache
let firestoreDb;
try {
  const databaseId = firebaseConfigJson.firestoreDatabaseId || '(default)';
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  }, databaseId);
} catch (e) {
  console.warn('Persistent cache initialization notice or DB already initialized:', e);
  firestoreDb = getFirestore(app, firebaseConfigJson.firestoreDatabaseId || '(default)');
}

export const db = firestoreDb;

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
      .filter(item => item !== undefined)
      .map(item => sanitizeForFirestore(item)) as unknown as T;
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

