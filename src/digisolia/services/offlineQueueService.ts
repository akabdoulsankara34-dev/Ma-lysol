import {
  DigiSoliaAppId,
  DigiSoliaFeedbackItem,
  DigiSoliaOfflineQueueItem,
  DigiSoliaSupportTicket,
  DigiSoliaThemeMode,
  DigiSoliaUserPreferences,
} from '../types';

const QUEUE_KEY_PREFIX = 'daf_offline_queue_v1_';
const CACHE_KEY_PREFIX = 'daf_cache_v1_';
const PREFS_KEY = 'daf_user_preferences_v1';
const PRESENTATION_SEEN_PREFIX = 'daf_presentation_seen_v1_';

export interface DafLocalCache {
  feedback: DigiSoliaFeedbackItem[];
  support: DigiSoliaSupportTicket[];
  lastCachedAt: string;
}

const DEFAULT_PREFERENCES: DigiSoliaUserPreferences = {
  theme: 'light',
  language: 'fr',
  notificationsEnabled: true,
  soundAlertsEnabled: true,
  autoSyncOfflineQueue: true,
};

export const offlineQueueService = {
  getQueue(appId: DigiSoliaAppId): DigiSoliaOfflineQueueItem[] {
    try {
      const raw = localStorage.getItem(`${QUEUE_KEY_PREFIX}${appId}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveQueue(appId: DigiSoliaAppId, queue: DigiSoliaOfflineQueueItem[]): void {
    try {
      localStorage.setItem(`${QUEUE_KEY_PREFIX}${appId}`, JSON.stringify(queue));
    } catch {
      // Storage quota fallback
    }
  },

  enqueue(
    appId: DigiSoliaAppId,
    item: Omit<DigiSoliaOfflineQueueItem, 'id' | 'createdAt' | 'retryCount'>
  ): { queued: boolean; duplicate: boolean; item?: DigiSoliaOfflineQueueItem } {
    const existing = this.getQueue(appId);
    const dup = existing.find(
      (q) => q.type === item.type && q.fingerprint === item.fingerprint
    );
    if (dup) {
      return { queued: false, duplicate: true };
    }

    const newItem: DigiSoliaOfflineQueueItem = {
      ...item,
      id: `daf_q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    this.saveQueue(appId, [...existing, newItem]);
    return { queued: true, duplicate: false, item: newItem };
  },

  removeQueueItem(appId: DigiSoliaAppId, queueId: string): void {
    const remaining = this.getQueue(appId).filter((q) => q.id !== queueId);
    this.saveQueue(appId, remaining);
  },

  markQueueError(appId: DigiSoliaAppId, queueId: string, errorMessage: string): void {
    const updated = this.getQueue(appId).map((q) =>
      q.id === queueId
        ? { ...q, retryCount: q.retryCount + 1, lastError: errorMessage }
        : q
    );
    this.saveQueue(appId, updated);
  },

  getCache(appId: DigiSoliaAppId): DafLocalCache {
    try {
      const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}${appId}`);
      if (!raw) {
        return { feedback: [], support: [], lastCachedAt: '' };
      }
      const parsed = JSON.parse(raw);
      return {
        feedback: Array.isArray(parsed?.feedback) ? parsed.feedback : [],
        support: Array.isArray(parsed?.support) ? parsed.support : [],
        lastCachedAt: parsed?.lastCachedAt || '',
      };
    } catch {
      return { feedback: [], support: [], lastCachedAt: '' };
    }
  },

  saveCache(appId: DigiSoliaAppId, partial: Partial<DafLocalCache>): void {
    try {
      const current = this.getCache(appId);
      const next: DafLocalCache = {
        feedback: partial.feedback ?? current.feedback,
        support: partial.support ?? current.support,
        lastCachedAt: new Date().toISOString(),
      };
      localStorage.setItem(`${CACHE_KEY_PREFIX}${appId}`, JSON.stringify(next));
    } catch {
      // Non-blocking
    }
  },

  getPreferences(): DigiSoliaUserPreferences {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return DEFAULT_PREFERENCES;
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  },

  savePreferences(prefs: DigiSoliaUserPreferences): void {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // Non-blocking
    }
  },

  applyThemeToDom(theme: DigiSoliaThemeMode): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  },

  hasSeenPresentation(appId: DigiSoliaAppId): boolean {
    try {
      return localStorage.getItem(`${PRESENTATION_SEEN_PREFIX}${appId}`) === 'true';
    } catch {
      return false;
    }
  },

  markPresentationSeen(appId: DigiSoliaAppId): void {
    try {
      localStorage.setItem(`${PRESENTATION_SEEN_PREFIX}${appId}`, 'true');
    } catch {
      // Non-blocking
    }
  },
};
