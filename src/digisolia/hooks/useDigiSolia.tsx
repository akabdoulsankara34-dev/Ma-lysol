import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DIGISOLIA_APP_CONFIG } from '../config/dafConfig';
import { dafFirebaseService } from '../services/firebaseService';
import { offlineQueueService } from '../services/offlineQueueService';
import {
  DigiSoliaAdminRole,
  DigiSoliaAppConfig,
  DigiSoliaFeedbackCategory,
  DigiSoliaFeedbackItem,
  DigiSoliaHostAdapter,
  DigiSoliaNotification,
  DigiSoliaOfflineQueueItem,
  DigiSoliaSupportTicket,
  DigiSoliaThemeMode,
  DigiSoliaUserPreferences,
  DigiSoliaUserProfile,
} from '../types';
import {
  checkAntiSpamGuard,
  computePayloadFingerprint,
  recordAntiSpamSubmission,
  sanitizeMultilineText,
  sanitizeTextInput,
  validateFeedbackForm,
  validateSupportForm,
} from '../utils/validation';

interface SubmitFeedbackInput {
  category: DigiSoliaFeedbackCategory;
  rating: number | null;
  subject?: string;
  message: string;
}

interface SubmitSupportInput {
  issueType: DigiSoliaSupportTicket['issueType'];
  priority: DigiSoliaSupportTicket['priority'];
  subject: string;
  message: string;
  userEmail?: string;
  userPhone?: string;
}

interface SubmitResult {
  success: boolean;
  offlineQueued?: boolean;
  message: string;
  errors?: Record<string, string>;
}

interface DigiSoliaContextValue {
  config: DigiSoliaAppConfig;
  host: DigiSoliaHostAdapter;
  user: DigiSoliaUserProfile;
  preferences: DigiSoliaUserPreferences;
  theme: DigiSoliaThemeMode;
  setTheme: (theme: DigiSoliaThemeMode) => void;
  toggleTheme: () => void;
  updatePreferences: (partial: Partial<DigiSoliaUserPreferences>) => void;
  hasSeenPresentation: boolean;
  completePresentation: () => void;
  feedbackItems: DigiSoliaFeedbackItem[];
  supportTickets: DigiSoliaSupportTicket[];
  notifications: DigiSoliaNotification[];
  unreadNotificationsCount: number;
  readNotificationIds: string[];
  markNotificationRead: (id: string) => void;
  offlineQueue: DigiSoliaOfflineQueueItem[];
  isFlushingQueue: boolean;
  lastDafSyncError: string | null;
  flushOfflineQueue: () => Promise<void>;
  submitFeedback: (input: SubmitFeedbackInput) => Promise<SubmitResult>;
  submitSupportTicket: (input: SubmitSupportInput) => Promise<SubmitResult>;
  updatePersonalProfile: (updates: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  }) => Promise<{ success: boolean; message: string }>;
  currentAdminRole: DigiSoliaAdminRole | null;
}

const READ_NOTIFS_KEY = 'daf_read_notifications_v1';
const LOCAL_PROFILE_OVERRIDE_KEY = 'daf_profile_override_v1_';

const DigiSoliaContext = createContext<DigiSoliaContextValue | undefined>(undefined);

interface DigiSoliaProviderProps {
  adapter: DigiSoliaHostAdapter;
  config?: DigiSoliaAppConfig;
  children: React.ReactNode;
}

export const DigiSoliaProvider: React.FC<DigiSoliaProviderProps> = ({
  adapter,
  config = DIGISOLIA_APP_CONFIG,
  children,
}) => {
  const appId = adapter.appId || config.appId;

  const [preferences, setPreferences] = useState<DigiSoliaUserPreferences>(() => {
    const loaded = offlineQueueService.getPreferences();
    offlineQueueService.applyThemeToDom(loaded.theme);
    return loaded;
  });

  const [hasSeenPresentation, setHasSeenPresentation] = useState<boolean>(() =>
    offlineQueueService.hasSeenPresentation(appId)
  );

  const [profileOverride, setProfileOverride] = useState<Partial<DigiSoliaUserProfile>>(() => {
    try {
      const raw = localStorage.getItem(`${LOCAL_PROFILE_OVERRIDE_KEY}${adapter.user.userId}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const mergedUser = useMemo<DigiSoliaUserProfile>(() => {
    const firstName = profileOverride.firstName ?? adapter.user.firstName;
    const lastName = profileOverride.lastName ?? adapter.user.lastName;
    return {
      ...adapter.user,
      ...profileOverride,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim() || adapter.user.fullName,
    };
  }, [adapter.user, profileOverride]);

  const [remoteFeedback, setRemoteFeedback] = useState<DigiSoliaFeedbackItem[]>(() =>
    offlineQueueService.getCache(appId).feedback
  );
  const [remoteSupport, setRemoteSupport] = useState<DigiSoliaSupportTicket[]>(() =>
    offlineQueueService.getCache(appId).support
  );
  const [notifications, setNotifications] = useState<DigiSoliaNotification[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<DigiSoliaOfflineQueueItem[]>(() =>
    offlineQueueService.getQueue(appId)
  );
  const [isFlushingQueue, setIsFlushingQueue] = useState(false);
  const [lastDafSyncError, setLastDafSyncError] = useState<string | null>(null);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(READ_NOTIFS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Apply theme whenever preference changes
  useEffect(() => {
    offlineQueueService.applyThemeToDom(preferences.theme);
    offlineQueueService.savePreferences(preferences);
  }, [preferences]);

  // Register app catalog & user directory presence non-destructively when online
  useEffect(() => {
    if (!adapter.isOnline) return;
    dafFirebaseService.ensureAppCatalogRegistered(appId).catch(() => null);
    dafFirebaseService.syncUserDirectoryProfile(mergedUser).catch(() => null);
  }, [adapter.isOnline, appId, mergedUser.userId]);

  // Subscribe to app-scoped feedback, support & notifications
  useEffect(() => {
    if (!adapter.isOnline) return;
    const unsubFeedback = dafFirebaseService.subscribeAppFeedback(appId, (items) => {
      setRemoteFeedback(items);
      offlineQueueService.saveCache(appId, { feedback: items });
    });
    const unsubSupport = dafFirebaseService.subscribeAppSupport(appId, (items) => {
      setRemoteSupport(items);
      offlineQueueService.saveCache(appId, { support: items });
    });
    const unsubNotifs = dafFirebaseService.subscribeNotifications(appId, (items) => {
      setNotifications(items);
    });

    return () => {
      unsubFeedback();
      unsubSupport();
      unsubNotifs();
    };
  }, [adapter.isOnline, appId]);

  const flushOfflineQueue = useCallback(async () => {
    const queue = offlineQueueService.getQueue(appId);
    if (!adapter.isOnline || queue.length === 0 || isFlushingQueue) return;

    setIsFlushingQueue(true);
    setLastDafSyncError(null);

    try {
      for (const item of queue) {
        try {
          if (item.type === 'feedback') {
            await dafFirebaseService.submitFeedback({
              ...(item.payload as DigiSoliaFeedbackItem),
              syncedFromOffline: true,
            });
          } else if (item.type === 'support') {
            await dafFirebaseService.submitSupportTicket({
              ...(item.payload as DigiSoliaSupportTicket),
              syncedFromOffline: true,
            });
          } else if (item.type === 'profile_update') {
            await dafFirebaseService.updatePersonalProfile(
              item.payload.userId,
              item.payload.updates
            );
          }
          offlineQueueService.removeQueueItem(appId, item.id);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Erreur de synchronisation';
          offlineQueueService.markQueueError(appId, item.id, msg);
          setLastDafSyncError(msg);
        }
      }
    } finally {
      setOfflineQueue(offlineQueueService.getQueue(appId));
      setIsFlushingQueue(false);
    }
  }, [adapter.isOnline, appId, isFlushingQueue]);

  // Auto-flush queue when internet returns
  useEffect(() => {
    if (adapter.isOnline && preferences.autoSyncOfflineQueue && offlineQueue.length > 0) {
      flushOfflineQueue();
    }
  }, [adapter.isOnline, preferences.autoSyncOfflineQueue, offlineQueue.length, flushOfflineQueue]);

  // Combine live remote items + locally queued pending items (deduplicated)
  const feedbackItems = useMemo(() => {
    const queuedFeedback = offlineQueue
      .filter((q) => q.type === 'feedback')
      .map((q) => q.payload as DigiSoliaFeedbackItem)
      .filter((qf) => !remoteFeedback.some((rf) => rf.id === qf.id || rf.clientFingerprint === qf.clientFingerprint));
    return [...queuedFeedback, ...remoteFeedback];
  }, [offlineQueue, remoteFeedback]);

  const supportTickets = useMemo(() => {
    const queuedSupport = offlineQueue
      .filter((q) => q.type === 'support')
      .map((q) => q.payload as DigiSoliaSupportTicket)
      .filter((qs) => !remoteSupport.some((rs) => rs.id === qs.id || rs.clientFingerprint === qs.clientFingerprint));
    return [...queuedSupport, ...remoteSupport];
  }, [offlineQueue, remoteSupport]);

  const setTheme = useCallback((theme: DigiSoliaThemeMode) => {
    setPreferences((prev) => ({ ...prev, theme }));
  }, []);

  const toggleTheme = useCallback(() => {
    setPreferences((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  }, []);

  const updatePreferences = useCallback((partial: Partial<DigiSoliaUserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...partial }));
  }, []);

  const completePresentation = useCallback(() => {
    offlineQueueService.markPresentationSeen(appId);
    setHasSeenPresentation(true);
  }, [appId]);

  const markNotificationRead = useCallback((id: string) => {
    setReadNotificationIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(READ_NOTIFS_KEY, JSON.stringify(next.slice(-100)));
      } catch {
        // Non-blocking
      }
      return next;
    });
  }, []);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !readNotificationIds.includes(n.id)).length;
  }, [notifications, readNotificationIds]);

  const submitFeedback = useCallback(
    async (input: SubmitFeedbackInput): Promise<SubmitResult> => {
      const validation = validateFeedbackForm({
        category: input.category,
        rating: input.rating,
        message: input.message,
        userEmail: mergedUser.email,
      });

      if (!validation.valid) {
        return {
          success: false,
          message: 'Merci de corriger les champs signalés.',
          errors: validation.errors,
        };
      }

      const cleanMessage = sanitizeMultilineText(input.message, 2000);
      const cleanSubject = input.subject ? sanitizeTextInput(input.subject, 140) : undefined;
      const fingerprint = computePayloadFingerprint([
        appId,
        mergedUser.userId,
        input.category,
        input.rating,
        cleanMessage,
      ]);

      const spamCheck = checkAntiSpamGuard('feedback', fingerprint);
      if (!spamCheck.allowed) {
        return {
          success: false,
          message: spamCheck.reason || 'Soumission bloquée par la protection anti-spam.',
        };
      }

      const feedbackDoc: DigiSoliaFeedbackItem = {
        id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        appId,
        userId: mergedUser.userId,
        userName: mergedUser.fullName,
        userEmail: mergedUser.email || undefined,
        userPhone: mergedUser.phone || undefined,
        businessId: mergedUser.businessId,
        businessName: mergedUser.businessName,
        category: input.category,
        rating: input.rating,
        subject: cleanSubject,
        message: cleanMessage,
        status: 'en_attente',
        clientFingerprint: fingerprint,
        createdAt: new Date().toISOString(),
      };

      recordAntiSpamSubmission('feedback', fingerprint);

      if (!adapter.isOnline) {
        offlineQueueService.enqueue(appId, {
          type: 'feedback',
          appId,
          payload: feedbackDoc,
          fingerprint,
        });
        setOfflineQueue(offlineQueueService.getQueue(appId));
        return {
          success: true,
          offlineQueued: true,
          message: 'Hors connexion : votre avis a été enregistré localement et sera envoyé automatiquement dès le retour d’Internet.',
        };
      }

      try {
        await dafFirebaseService.submitFeedback(feedbackDoc);
        return {
          success: true,
          offlineQueued: false,
          message: 'Merci ! Votre retour a bien été transmis à l’équipe DigiSolia.',
        };
      } catch (err) {
        offlineQueueService.enqueue(appId, {
          type: 'feedback',
          appId,
          payload: feedbackDoc,
          fingerprint,
        });
        setOfflineQueue(offlineQueueService.getQueue(appId));
        const msg = err instanceof Error ? err.message : 'Erreur réseau';
        setLastDafSyncError(msg);
        return {
          success: true,
          offlineQueued: true,
          message: 'Connexion instable : votre avis a été placé en file d’attente sécurisée pour synchronisation automatique.',
        };
      }
    },
    [adapter.isOnline, appId, mergedUser]
  );

  const submitSupportTicket = useCallback(
    async (input: SubmitSupportInput): Promise<SubmitResult> => {
      const validation = validateSupportForm({
        subject: input.subject,
        message: input.message,
        userEmail: input.userEmail || mergedUser.email,
        userPhone: input.userPhone || mergedUser.phone,
      });

      if (!validation.valid) {
        return {
          success: false,
          message: 'Veuillez vérifier les informations saisies.',
          errors: validation.errors,
        };
      }

      const cleanSubject = sanitizeTextInput(input.subject, 160);
      const cleanMessage = sanitizeMultilineText(input.message, 2500);
      const fingerprint = computePayloadFingerprint([
        appId,
        mergedUser.userId,
        input.issueType,
        cleanSubject,
        cleanMessage,
      ]);

      const spamCheck = checkAntiSpamGuard('support', fingerprint);
      if (!spamCheck.allowed) {
        return {
          success: false,
          message: spamCheck.reason || 'Veuillez patienter avant d’envoyer une nouvelle demande.',
        };
      }

      const ticket: DigiSoliaSupportTicket = {
        id: `sup_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        appId,
        userId: mergedUser.userId,
        userName: mergedUser.fullName,
        userEmail: input.userEmail || mergedUser.email || undefined,
        userPhone: input.userPhone || mergedUser.phone || undefined,
        businessId: mergedUser.businessId,
        businessName: mergedUser.businessName,
        issueType: input.issueType,
        priority: input.priority,
        subject: cleanSubject,
        message: cleanMessage,
        deviceInfo:
          typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 140) : 'Web',
        appVersion: config.version,
        status: 'en_attente',
        clientFingerprint: fingerprint,
        createdAt: new Date().toISOString(),
      };

      recordAntiSpamSubmission('support', fingerprint);

      if (!adapter.isOnline) {
        offlineQueueService.enqueue(appId, {
          type: 'support',
          appId,
          payload: ticket,
          fingerprint,
        });
        setOfflineQueue(offlineQueueService.getQueue(appId));
        return {
          success: true,
          offlineQueued: true,
          message: 'Hors connexion : votre ticket d’assistance a été sauvegardé localement et sera transmis automatiquement dès le retour d’Internet.',
        };
      }

      try {
        await dafFirebaseService.submitSupportTicket(ticket);
        return {
          success: true,
          offlineQueued: false,
          message: 'Demande d’assistance enregistrée. Notre équipe technique vous répondra dans les plus brefs délais.',
        };
      } catch (err) {
        offlineQueueService.enqueue(appId, {
          type: 'support',
          appId,
          payload: ticket,
          fingerprint,
        });
        setOfflineQueue(offlineQueueService.getQueue(appId));
        const msg = err instanceof Error ? err.message : 'Erreur réseau';
        setLastDafSyncError(msg);
        return {
          success: true,
          offlineQueued: true,
          message: 'Réseau indisponible : votre ticket est conservé localement et sera envoyé dès la reconnexion.',
        };
      }
    },
    [adapter.isOnline, appId, config.version, mergedUser]
  );

  const updatePersonalProfile = useCallback(
    async (updates: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    }): Promise<{ success: boolean; message: string }> => {
      const cleanFirst = sanitizeTextInput(updates.firstName, 60);
      const cleanLast = sanitizeTextInput(updates.lastName, 60);
      const cleanEmail = sanitizeTextInput(updates.email, 120);
      const cleanPhone = updates.phone ? sanitizeTextInput(updates.phone, 24) : '';

      if (!cleanFirst) {
        return { success: false, message: 'Le prénom est obligatoire.' };
      }

      const nextOverride: Partial<DigiSoliaUserProfile> = {
        firstName: cleanFirst,
        lastName: cleanLast,
        fullName: `${cleanFirst} ${cleanLast}`.trim(),
        email: cleanEmail,
        phone: cleanPhone,
      };
      setProfileOverride(nextOverride);

      try {
        localStorage.setItem(
          `${LOCAL_PROFILE_OVERRIDE_KEY}${mergedUser.userId}`,
          JSON.stringify(nextOverride)
        );
      } catch {
        // Non-blocking
      }

      if (!adapter.isOnline) {
        offlineQueueService.enqueue(appId, {
          type: 'profile_update',
          appId,
          payload: {
            userId: mergedUser.userId,
            updates: {
              firstName: cleanFirst,
              lastName: cleanLast,
              email: cleanEmail,
              phone: cleanPhone,
            },
          },
          fingerprint: computePayloadFingerprint([
            'profile',
            mergedUser.userId,
            cleanFirst,
            cleanLast,
            cleanEmail,
            cleanPhone,
          ]),
        });
        setOfflineQueue(offlineQueueService.getQueue(appId));
        return {
          success: true,
          message: 'Profil enregistré localement (synchronisation prévue au retour d’Internet).',
        };
      }

      try {
        await dafFirebaseService.updatePersonalProfile(mergedUser.userId, {
          firstName: cleanFirst,
          lastName: cleanLast,
          email: cleanEmail,
          phone: cleanPhone,
        });
        return { success: true, message: 'Profil utilisateur mis à jour avec succès.' };
      } catch {
        return {
          success: true,
          message: 'Profil sauvegardé localement. La synchronisation Cloud reprendra automatiquement.',
        };
      }
    },
    [adapter.isOnline, appId, mergedUser.userId]
  );

  const currentAdminRole: DigiSoliaAdminRole | null = adapter.canAccessAdmin
    ? 'super_admin'
    : null;

  const value: DigiSoliaContextValue = {
    config,
    host: adapter,
    user: mergedUser,
    preferences,
    theme: preferences.theme,
    setTheme,
    toggleTheme,
    updatePreferences,
    hasSeenPresentation,
    completePresentation,
    feedbackItems,
    supportTickets,
    notifications,
    unreadNotificationsCount,
    readNotificationIds,
    markNotificationRead,
    offlineQueue,
    isFlushingQueue,
    lastDafSyncError,
    flushOfflineQueue,
    submitFeedback,
    submitSupportTicket,
    updatePersonalProfile,
    currentAdminRole,
  };

  return <DigiSoliaContext.Provider value={value}>{children}</DigiSoliaContext.Provider>;
};

export function useDigiSolia(): DigiSoliaContextValue {
  const ctx = useContext(DigiSoliaContext);
  if (!ctx) {
    throw new Error('useDigiSolia doit être utilisé à l’intérieur de DigiSoliaProvider.');
  }
  return ctx;
}
