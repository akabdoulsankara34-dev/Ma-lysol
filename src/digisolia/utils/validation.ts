import {
  DigiSoliaAdminRole,
  DigiSoliaFeedbackCategory,
  DigiSoliaTicketStatus,
} from '../types';
import { ADMIN_ROLE_PERMISSIONS } from '../config/dafConfig';

const COOLDOWN_STORAGE_KEY = 'daf_submission_cooldown_v1';
const FINGERPRINT_STORAGE_KEY = 'daf_recent_fingerprints_v1';
const DEFAULT_COOLDOWN_MS = 30_000; // 30 secondes anti-spam entre deux soumissions
const MAX_SUBMISSIONS_PER_HOUR = 8;

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function sanitizeTextInput(value: string, maxLength = 2000): string {
  return value
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function sanitizeMultilineText(value: string, maxLength = 2000): string {
  return value
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

export function isValidEmail(email: string): boolean {
  if (!email.trim()) return true; // Optionnel si non requis
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  if (!phone.trim()) return true;
  const cleaned = phone.replace(/[\s()-]/g, '');
  return /^\+?[0-9]{7,15}$/.test(cleaned);
}

export function computePayloadFingerprint(parts: (string | number | undefined | null)[]): string {
  const raw = parts
    .map((p) => String(p ?? '').trim().toLowerCase())
    .join('|');
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 33) ^ raw.charCodeAt(i);
  }
  return `fp_${(hash >>> 0).toString(16)}`;
}

export function validateFeedbackForm(input: {
  category: DigiSoliaFeedbackCategory;
  rating: number | null;
  message: string;
  userEmail?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  const msg = sanitizeMultilineText(input.message);

  if (input.category === 'avis' && (input.rating === null || input.rating < 1 || input.rating > 5)) {
    errors.rating = 'Veuillez sélectionner une note de 1 à 5 étoiles.';
  }

  if (msg.length < 10) {
    errors.message = 'Votre message doit contenir au moins 10 caractères.';
  } else if (msg.length > 2000) {
    errors.message = 'Votre message ne peut pas dépasser 2000 caractères.';
  }

  if (input.userEmail && !isValidEmail(input.userEmail)) {
    errors.userEmail = 'Adresse e-mail invalide.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateSupportForm(input: {
  subject: string;
  message: string;
  userEmail?: string;
  userPhone?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  const subject = sanitizeTextInput(input.subject, 160);
  const message = sanitizeMultilineText(input.message, 2500);

  if (subject.length < 4) {
    errors.subject = 'Indiquez un objet clair (minimum 4 caractères).';
  }
  if (message.length < 15) {
    errors.message = 'Décrivez votre demande ou incident technique (minimum 15 caractères).';
  }
  if (input.userEmail && !isValidEmail(input.userEmail)) {
    errors.userEmail = 'Adresse e-mail invalide.';
  }
  if (input.userPhone && !isValidPhone(input.userPhone)) {
    errors.userPhone = 'Numéro de téléphone invalide.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function checkAntiSpamGuard(
  scope: 'feedback' | 'support',
  fingerprint: string,
  cooldownMs = DEFAULT_COOLDOWN_MS
): { allowed: boolean; reason?: string; retryAfterSeconds?: number } {
  try {
    const now = Date.now();
    const rawCooldown = localStorage.getItem(COOLDOWN_STORAGE_KEY);
    const cooldownData: Record<string, number[]> = rawCooldown ? JSON.parse(rawCooldown) : {};
    const timestamps = (cooldownData[scope] || []).filter((ts) => now - ts < 3_600_000);

    const lastTs = timestamps[timestamps.length - 1];
    if (lastTs && now - lastTs < cooldownMs) {
      const waitSec = Math.ceil((cooldownMs - (now - lastTs)) / 1000);
      return {
        allowed: false,
        retryAfterSeconds: waitSec,
        reason: `Protection anti-spam active : merci de patienter ${waitSec} seconde(s) avant un nouvel envoi.`,
      };
    }

    if (timestamps.length >= MAX_SUBMISSIONS_PER_HOUR) {
      return {
        allowed: false,
        retryAfterSeconds: 300,
        reason: 'Limite horaire atteinte pour éviter les envois abusifs. Réessayez un peu plus tard.',
      };
    }

    const rawFps = localStorage.getItem(FINGERPRINT_STORAGE_KEY);
    const fps: { fp: string; ts: number }[] = rawFps ? JSON.parse(rawFps) : [];
    const recentDup = fps.find((entry) => entry.fp === fingerprint && now - entry.ts < 600_000);
    if (recentDup) {
      return {
        allowed: false,
        reason: 'Ce message a déjà été enregistré récemment (prévention des doublons).',
      };
    }

    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

export function recordAntiSpamSubmission(scope: 'feedback' | 'support', fingerprint: string): void {
  try {
    const now = Date.now();
    const rawCooldown = localStorage.getItem(COOLDOWN_STORAGE_KEY);
    const cooldownData: Record<string, number[]> = rawCooldown ? JSON.parse(rawCooldown) : {};
    const timestamps = (cooldownData[scope] || []).filter((ts) => now - ts < 3_600_000);
    timestamps.push(now);
    cooldownData[scope] = timestamps;
    localStorage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify(cooldownData));

    const rawFps = localStorage.getItem(FINGERPRINT_STORAGE_KEY);
    const fps: { fp: string; ts: number }[] = rawFps ? JSON.parse(rawFps) : [];
    const filtered = fps.filter((entry) => now - entry.ts < 86_400_000);
    filtered.push({ fp: fingerprint, ts: now });
    localStorage.setItem(FINGERPRINT_STORAGE_KEY, JSON.stringify(filtered.slice(-50)));
  } catch {
    // Non bloquant
  }
}

export function getTicketStatusMeta(status: DigiSoliaTicketStatus): {
  label: string;
  toneClass: string;
} {
  switch (status) {
    case 'en_attente':
      return {
        label: 'En attente',
        toneClass: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
      };
    case 'en_cours':
      return {
        label: 'En cours de traitement',
        toneClass: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60',
      };
    case 'resolu':
      return {
        label: 'Résolu',
        toneClass: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
      };
    case 'rejete':
      return {
        label: 'Rejeté',
        toneClass: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60',
      };
  }
}

export function hasAdminPermission(
  role: DigiSoliaAdminRole | null | undefined,
  permission: keyof (typeof ADMIN_ROLE_PERMISSIONS)['super_admin']
): boolean {
  if (!role) return false;
  return Boolean(ADMIN_ROLE_PERMISSIONS[role]?.[permission]);
}
