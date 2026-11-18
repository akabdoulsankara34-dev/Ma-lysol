export type DigiSoliaAppId = 'digisolia-pos' | 'prof-planning' | 'digisolia-hotel' | (string & {});

export type DigiSoliaModuleKey =
  | 'presentation'
  | 'dashboard'
  | 'support'
  | 'feedback'
  | 'profile'
  | 'settings'
  | 'about'
  | 'admin';

export type DigiSoliaFeedbackCategory = 'avis' | 'suggestion' | 'bug' | 'reclamation';

export type DigiSoliaTicketStatus = 'en_attente' | 'en_cours' | 'resolu' | 'rejete';

export type DigiSoliaAdminRole =
  | 'super_admin'
  | 'app_admin'
  | 'support_agent'
  | 'stats_reader';

export type DigiSoliaThemeMode = 'light' | 'dark';

export interface DigiSoliaFaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface DigiSoliaGuideStep {
  id: string;
  title: string;
  description: string;
  moduleTag: string;
}

export interface DigiSoliaAppFeature {
  id: string;
  title: string;
  description: string;
  benefit: string;
}

export interface DigiSoliaContactConfig {
  whatsappNumber: string; // Format international sans + (ex: 22670000000)
  whatsappDisplay: string;
  phoneNumber: string;
  email: string;
  website: string;
  address: string;
  city: string;
  country: string;
  supportHours: string;
}

export interface DigiSoliaThemeColors {
  primary: string;
  secondary: string;
  white: string;
  background: string;
  border: string;
}

export interface DigiSoliaAppConfig {
  appId: DigiSoliaAppId;
  appName: string;
  shortName: string;
  brandName: string;
  tagline: string;
  description: string;
  version: string;
  frameworkVersion: string;
  publisherName: string;
  publisherLegalInfo: string;
  logoText: string;
  logoUrl?: string;
  colors: DigiSoliaThemeColors;
  contacts: DigiSoliaContactConfig;
  enabledModules: Record<DigiSoliaModuleKey, boolean>;
  features: DigiSoliaAppFeature[];
  benefits: string[];
  faq: DigiSoliaFaqItem[];
  userGuide: DigiSoliaGuideStep[];
}

export interface DigiSoliaRegisteredApp {
  id: string;
  appId: DigiSoliaAppId;
  name: string;
  shortName: string;
  description: string;
  version: string;
  status: 'active' | 'maintenance' | 'beta';
  category: string;
  usersCount: number;
  activeBusinessesCount?: number;
  lastUpdatedAt: string;
  createdAt: string;
}

export interface DigiSoliaFeedbackItem {
  id: string;
  appId: DigiSoliaAppId;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  businessId?: string;
  businessName?: string;
  category: DigiSoliaFeedbackCategory;
  rating: number | null; // 1 à 5
  subject?: string;
  message: string;
  status: DigiSoliaTicketStatus;
  adminResponse?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  clientFingerprint: string;
  createdAt: string;
  syncedFromOffline?: boolean;
}

export interface DigiSoliaSupportTicket {
  id: string;
  appId: DigiSoliaAppId;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  businessId?: string;
  businessName?: string;
  issueType: 'assistance' | 'technique' | 'compte' | 'facturation' | 'autre';
  priority: 'normale' | 'urgente';
  subject: string;
  message: string;
  deviceInfo?: string;
  appVersion: string;
  status: DigiSoliaTicketStatus;
  adminResponse?: string;
  assignedTo?: string;
  reviewedAt?: string;
  clientFingerprint: string;
  createdAt: string;
  syncedFromOffline?: boolean;
}

export interface DigiSoliaAdminUser {
  id: string;
  uid?: string;
  name: string;
  email: string;
  phone?: string;
  role: DigiSoliaAdminRole;
  assignedApps: DigiSoliaAppId[]; // ['*'] ou liste spécifique
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface DigiSoliaNotification {
  id: string;
  appId: DigiSoliaAppId | 'all';
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  targetAudience: 'all' | 'admins' | 'owners';
  createdBy: string;
  createdByName: string;
  createdAt: string;
  readBy?: string[];
}

export interface DigiSoliaAdminLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: DigiSoliaAdminRole;
  action: string;
  targetType: 'app' | 'user' | 'feedback' | 'support' | 'admin' | 'notification' | 'system';
  targetId: string;
  details: string;
  appId?: string;
  createdAt: string;
}

export interface DigiSoliaUserProfile {
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  roleLabel: string;
  businessName?: string;
  businessId?: string;
  createdAt: string;
  lastActiveAt: string;
  appId: DigiSoliaAppId;
}

export interface DigiSoliaUserPreferences {
  theme: DigiSoliaThemeMode;
  language: 'fr' | 'en';
  notificationsEnabled: boolean;
  soundAlertsEnabled: boolean;
  autoSyncOfflineQueue: boolean;
}

export interface DigiSoliaOfflineQueueItem {
  id: string;
  type: 'feedback' | 'support' | 'profile_update' | 'notification_read';
  appId: DigiSoliaAppId;
  payload: Record<string, any>;
  fingerprint: string;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

export interface DigiSoliaShortcut {
  id: string;
  label: string;
  description: string;
  tabId: string;
  accent?: 'primary' | 'secondary' | 'emerald' | 'amber';
}

export interface DigiSoliaHostAdapter {
  appId: DigiSoliaAppId;
  user: DigiSoliaUserProfile;
  isOnline: boolean;
  isSyncing: boolean;
  pendingBusinessSyncCount: number;
  lastSyncedAt: Date | null;
  shortcuts: DigiSoliaShortcut[];
  usefulTips: string[];
  activeSessionSummary?: string;
  onNavigate: (tabId: string) => void;
  onTriggerBusinessSync?: () => Promise<void> | void;
  onExportBackup?: () => void;
  onLockSession?: () => void;
  onLogout?: () => void;
  canAccessAdmin?: boolean;
}
