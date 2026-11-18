import assert from 'node:assert/strict';
import {
  checkAntiSpamGuard,
  computePayloadFingerprint,
  getTicketStatusMeta,
  hasAdminPermission,
  recordAntiSpamSubmission,
  sanitizeTextInput,
  validateFeedbackForm,
  validateSupportForm,
} from '../utils/validation';
import { offlineQueueService } from '../services/offlineQueueService';

// Mock localStorage pour l'exécution Node
const memoryStorage = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => memoryStorage.get(key) ?? null,
  setItem: (key: string, value: string) => memoryStorage.set(key, String(value)),
  removeItem: (key: string) => memoryStorage.delete(key),
  clear: () => memoryStorage.clear(),
};

function runTests() {
  // 1. Validation Avis & Notes
  const badFeedback = validateFeedbackForm({
    category: 'avis',
    rating: 0,
    message: 'Court',
  });
  assert.equal(badFeedback.valid, false);
  assert.ok(badFeedback.errors.rating);
  assert.ok(badFeedback.errors.message);

  const goodFeedback = validateFeedbackForm({
    category: 'suggestion',
    rating: 5,
    message: 'Ajouter un export mensuel détaillé par mode de paiement.',
  });
  assert.equal(goodFeedback.valid, true);

  // 2. Validation Centre d'assistance
  const badSupport = validateSupportForm({
    subject: 'Bug',
    message: 'Aide',
    userEmail: 'invalide',
  });
  assert.equal(badSupport.valid, false);
  assert.ok(badSupport.errors.subject);
  assert.ok(badSupport.errors.message);
  assert.ok(badSupport.errors.userEmail);

  // 3. Sanitisation XSS basique
  assert.equal(sanitizeTextInput('  <script>Bonjour</script>  '), 'scriptBonjour/script');

  // 4. Protection anti-spam & prévention des doublons
  const fp = computePayloadFingerprint(['digisolia-pos', 'usr_1', 'avis', 5, 'Super application']);
  const firstCheck = checkAntiSpamGuard('feedback', fp, 10_000);
  assert.equal(firstCheck.allowed, true);

  recordAntiSpamSubmission('feedback', fp);
  const secondCheck = checkAntiSpamGuard('feedback', fp, 10_000);
  assert.equal(secondCheck.allowed, false);

  // 5. File d'attente hors connexion & déduplication
  const q1 = offlineQueueService.enqueue('digisolia-pos', {
    type: 'feedback',
    appId: 'digisolia-pos',
    payload: { id: 'fb_1', message: 'Test hors ligne' },
    fingerprint: 'fp_unique_1',
  });
  assert.equal(q1.queued, true);
  assert.equal(q1.duplicate, false);

  const qDup = offlineQueueService.enqueue('digisolia-pos', {
    type: 'feedback',
    appId: 'digisolia-pos',
    payload: { id: 'fb_2', message: 'Test hors ligne' },
    fingerprint: 'fp_unique_1',
  });
  assert.equal(qDup.queued, false);
  assert.equal(qDup.duplicate, true);
  assert.equal(offlineQueueService.getQueue('digisolia-pos').length, 1);

  // 6. Contrôle d'accès RBAC & libellés de statut
  assert.equal(hasAdminPermission('super_admin', 'canManageAdmins'), true);
  assert.equal(hasAdminPermission('support_agent', 'canManageAdmins'), false);
  assert.equal(hasAdminPermission('support_agent', 'canRespondSupportAndFeedback'), true);
  assert.equal(hasAdminPermission('stats_reader', 'canRespondSupportAndFeedback'), false);
  assert.equal(getTicketStatusMeta('en_cours').label, 'En cours de traitement');

  console.log('Tous les tests unitaires DigiSolia App Framework ont réussi (6/6).');
}

runTests();
