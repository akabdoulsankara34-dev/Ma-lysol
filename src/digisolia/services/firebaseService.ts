import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  GoogleAuthProvider,
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
} from 'firebase/auth';
import { auth, db, ensureFirebaseAuth, sanitizeForFirestore } from '../../lib/firebase';
import { DIGISOLIA_CATALOG_APPS } from '../config/dafConfig';
import {
  DigiSoliaAdminLog,
  DigiSoliaAdminRole,
  DigiSoliaAdminUser,
  DigiSoliaAppId,
  DigiSoliaFeedbackItem,
  DigiSoliaNotification,
  DigiSoliaRegisteredApp,
  DigiSoliaSupportTicket,
  DigiSoliaTicketStatus,
  DigiSoliaUserProfile,
} from '../types';

export enum DafOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface DafFirestoreErrorInfo {
  error: string;
  operationType: DafOperationType;
  path: string | null;
  authInfo: {
    userId: string | null;
    email: string | null;
    emailVerified: boolean | null;
    isAnonymous: boolean | null;
    tenantId: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleDafFirestoreError(
  error: unknown,
  operationType: DafOperationType,
  path: string | null,
  silent = true
): DafFirestoreErrorInfo {
  const user = auth.currentUser;
  const errInfo: DafFirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: user?.uid || null,
      email: user?.email || null,
      emailVerified: user?.emailVerified ?? null,
      isAnonymous: user?.isAnonymous ?? null,
      tenantId: user?.tenantId || null,
      providerInfo:
        user?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  if (silent) {
    console.warn('DAF Firestore notice:', JSON.stringify(errInfo));
  } else {
    console.error('DAF Firestore error:', JSON.stringify(errInfo));
  }
  return errInfo;
}

export async function testDafConnection(): Promise<boolean> {
  try {
    await ensureFirebaseAuth();
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      return false;
    }
    // Permission error on test doc still proves network connectivity to Firestore
    return true;
  }
}

export function subscribeDafAuthState(cb: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, cb);
}

export async function signInAdminWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export const dafFirebaseService = {
  async ensureAppCatalogRegistered(activeAppId: DigiSoliaAppId, activeUsersCount = 1): Promise<void> {
    try {
      await ensureFirebaseAuth();
      const now = new Date().toISOString();
      const existingSnap = await getDocs(collection(db, 'apps')).catch(() => null);
      const existingIds = new Set(existingSnap?.docs.map((d) => d.id) || []);

      const batch = writeBatch(db);
      let hasWrites = false;

      for (const catalogApp of DIGISOLIA_CATALOG_APPS) {
        if (!existingIds.has(catalogApp.appId)) {
          const payload: DigiSoliaRegisteredApp = {
            ...catalogApp,
            usersCount: catalogApp.appId === activeAppId ? Math.max(1, activeUsersCount) : 0,
            lastUpdatedAt: now,
            createdAt: now,
          };
          batch.set(doc(db, 'apps', catalogApp.appId), sanitizeForFirestore(payload));
          hasWrites = true;
        }
      }

      if (hasWrites) {
        await batch.commit();
      }
    } catch (err) {
      handleDafFirestoreError(err, DafOperationType.WRITE, 'apps');
    }
  },

  async syncUserDirectoryProfile(profile: DigiSoliaUserProfile): Promise<void> {
    try {
      await ensureFirebaseAuth();
      const userRef = doc(db, 'users', profile.userId);
      const existing = await getDoc(userRef).catch(() => null);
      if (existing && existing.exists()) {
        await updateDoc(
          userRef,
          sanitizeForFirestore({
            email: profile.email || existing.data()?.email || '',
            appId: profile.appId,
            lastActiveAt: new Date().toISOString(),
          })
        );
      } else {
        await setDoc(
          userRef,
          sanitizeForFirestore({
            id: profile.userId,
            name: profile.fullName,
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            phone: profile.phone || '',
            role: profile.roleLabel || 'user',
            businessId: profile.businessId || 'digisolia',
            businessName: profile.businessName || '',
            appId: profile.appId,
            active: true,
            createdAt: profile.createdAt || new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
          }),
          { merge: true }
        );
      }
    } catch (err) {
      handleDafFirestoreError(err, DafOperationType.WRITE, `users/${profile.userId}`);
    }
  },

  async updatePersonalProfile(
    userId: string,
    updates: { firstName: string; lastName: string; email: string; phone?: string }
  ): Promise<void> {
    await ensureFirebaseAuth();
    const fullName = `${updates.firstName} ${updates.lastName}`.trim();
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      sanitizeForFirestore({
        id: userId,
        name: fullName,
        firstName: updates.firstName,
        lastName: updates.lastName,
        email: updates.email,
        phone: updates.phone || '',
        lastActiveAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  },

  async submitFeedback(item: DigiSoliaFeedbackItem): Promise<void> {
    await ensureFirebaseAuth();
    const ref = doc(db, 'apps', item.appId, 'feedback', item.id);
    await setDoc(ref, sanitizeForFirestore(item));
  },

  async submitSupportTicket(ticket: DigiSoliaSupportTicket): Promise<void> {
    await ensureFirebaseAuth();
    const ref = doc(db, 'apps', ticket.appId, 'support', ticket.id);
    await setDoc(ref, sanitizeForFirestore(ticket));
  },

  async updateFeedbackStatus(
    appId: DigiSoliaAppId,
    feedbackId: string,
    status: DigiSoliaTicketStatus,
    adminResponse: string,
    actor: { id: string; name: string; role: DigiSoliaAdminRole }
  ): Promise<void> {
    await ensureFirebaseAuth();
    const ref = doc(db, 'apps', appId, 'feedback', feedbackId);
    await updateDoc(
      ref,
      sanitizeForFirestore({
        status,
        adminResponse: adminResponse.trim() || undefined,
        reviewedBy: actor.name,
        reviewedAt: new Date().toISOString(),
      })
    );
    await this.recordAdminLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: `Statut avis mis à jour (${status})`,
      targetType: 'feedback',
      targetId: feedbackId,
      appId,
      details: adminResponse ? `Réponse: ${adminResponse.slice(0, 120)}` : `Statut -> ${status}`,
    });
  },

  async updateSupportTicketStatus(
    appId: DigiSoliaAppId,
    ticketId: string,
    status: DigiSoliaTicketStatus,
    adminResponse: string,
    actor: { id: string; name: string; role: DigiSoliaAdminRole }
  ): Promise<void> {
    await ensureFirebaseAuth();
    const ref = doc(db, 'apps', appId, 'support', ticketId);
    await updateDoc(
      ref,
      sanitizeForFirestore({
        status,
        adminResponse: adminResponse.trim() || undefined,
        assignedTo: actor.name,
        reviewedAt: new Date().toISOString(),
      })
    );
    await this.recordAdminLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: `Ticket support mis à jour (${status})`,
      targetType: 'support',
      targetId: ticketId,
      appId,
      details: adminResponse ? `Réponse: ${adminResponse.slice(0, 120)}` : `Statut -> ${status}`,
    });
  },

  async upsertRegisteredApp(
    appData: DigiSoliaRegisteredApp,
    actor: { id: string; name: string; role: DigiSoliaAdminRole }
  ): Promise<void> {
    await ensureFirebaseAuth();
    await setDoc(
      doc(db, 'apps', appData.appId),
      sanitizeForFirestore({
        ...appData,
        lastUpdatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
    await this.recordAdminLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'Application mise à jour / enregistrée',
      targetType: 'app',
      targetId: appData.appId,
      appId: appData.appId,
      details: `${appData.name} v${appData.version} (${appData.status})`,
    });
  },

  async upsertAdministrator(
    admin: DigiSoliaAdminUser,
    actor: { id: string; name: string; role: DigiSoliaAdminRole }
  ): Promise<void> {
    await ensureFirebaseAuth();
    await setDoc(doc(db, 'administrators', admin.id), sanitizeForFirestore(admin), { merge: true });
    await this.recordAdminLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'Administrateur enregistré / modifié',
      targetType: 'admin',
      targetId: admin.id,
      details: `${admin.name} (${admin.role})`,
    });
  },

  async bootstrapCurrentAuthAsSuperAdmin(name: string, email: string): Promise<DigiSoliaAdminUser | null> {
    const user = await ensureFirebaseAuth();
    if (!user) return null;
    const adminDoc: DigiSoliaAdminUser = {
      id: user.uid,
      uid: user.uid,
      name: name || 'Super Administrateur DigiSolia',
      email: email || 'admin@digisolia.bf',
      role: 'super_admin',
      assignedApps: ['*'],
      active: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'administrators', user.uid), sanitizeForFirestore(adminDoc), { merge: true });
    return adminDoc;
  },

  async publishNotification(
    notif: Omit<DigiSoliaNotification, 'id' | 'createdAt'>,
    actor: { id: string; name: string; role: DigiSoliaAdminRole }
  ): Promise<void> {
    await ensureFirebaseAuth();
    const id = `daf_notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const payload: DigiSoliaNotification = {
      ...notif,
      id,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'notifications', id), sanitizeForFirestore(payload));
    await this.recordAdminLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'Notification diffusée',
      targetType: 'notification',
      targetId: id,
      appId: notif.appId,
      details: `${notif.title} -> ${notif.appId}`,
    });
  },

  async recordAdminLog(entry: Omit<DigiSoliaAdminLog, 'id' | 'createdAt'>): Promise<void> {
    try {
      await ensureFirebaseAuth();
      const id = `daf_log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const log: DigiSoliaAdminLog = {
        ...entry,
        id,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'admin_logs', id), sanitizeForFirestore(log));
    } catch (err) {
      handleDafFirestoreError(err, DafOperationType.CREATE, 'admin_logs');
    }
  },

  subscribeRegisteredApps(onChange: (apps: DigiSoliaRegisteredApp[]) => void): () => void {
    const q = query(collection(db, 'apps'), orderBy('name', 'asc'));
    return onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DigiSoliaRegisteredApp));
        onChange(rows);
      },
      (err) => handleDafFirestoreError(err, DafOperationType.LIST, 'apps')
    );
  },

  subscribeAppFeedback(
    appId: DigiSoliaAppId,
    onChange: (items: DigiSoliaFeedbackItem[]) => void
  ): () => void {
    const q = query(
      collection(db, 'apps', appId, 'feedback'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DigiSoliaFeedbackItem));
        onChange(rows);
      },
      (err) => handleDafFirestoreError(err, DafOperationType.LIST, `apps/${appId}/feedback`)
    );
  },

  subscribeAppSupport(
    appId: DigiSoliaAppId,
    onChange: (items: DigiSoliaSupportTicket[]) => void
  ): () => void {
    const q = query(
      collection(db, 'apps', appId, 'support'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DigiSoliaSupportTicket));
        onChange(rows);
      },
      (err) => handleDafFirestoreError(err, DafOperationType.LIST, `apps/${appId}/support`)
    );
  },

  subscribeNotifications(
    appId: DigiSoliaAppId,
    onChange: (items: DigiSoliaNotification[]) => void
  ): () => void {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as DigiSoliaNotification))
          .filter((n) => n.appId === 'all' || n.appId === appId);
        onChange(rows);
      },
      (err) => handleDafFirestoreError(err, DafOperationType.LIST, 'notifications')
    );
  },

  subscribeAllNotifications(onChange: (items: DigiSoliaNotification[]) => void): () => void {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() } as DigiSoliaNotification)));
      },
      (err) => handleDafFirestoreError(err, DafOperationType.LIST, 'notifications')
    );
  },

  subscribeAdministrators(onChange: (admins: DigiSoliaAdminUser[]) => void): () => void {
    const q = query(collection(db, 'administrators'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() } as DigiSoliaAdminUser)));
      },
      (err) => handleDafFirestoreError(err, DafOperationType.LIST, 'administrators')
    );
  },

  subscribeAdminLogs(onChange: (logs: DigiSoliaAdminLog[]) => void): () => void {
    const q = query(collection(db, 'admin_logs'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() } as DigiSoliaAdminLog)).slice(0, 100));
      },
      (err) => handleDafFirestoreError(err, DafOperationType.LIST, 'admin_logs')
    );
  },

  subscribeDirectoryUsers(onChange: (users: Record<string, any>[]) => void): () => void {
    const q = query(collection(db, 'users'));
    return onSnapshot(
      q,
      (snap) => {
        onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => handleDafFirestoreError(err, DafOperationType.LIST, 'users')
    );
  },
};
