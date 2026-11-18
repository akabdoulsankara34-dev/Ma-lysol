import { DigiSoliaAdminRole, DigiSoliaAppConfig, DigiSoliaRegisteredApp } from '../types';

export const DIGISOLIA_COLORS = {
  primary: '#163B65',
  secondary: '#2783C7',
  white: '#FFFFFF',
  background: '#F4F7FB',
  border: '#E1E7EF',
} as const;

export const DIGISOLIA_CONTACTS = {
  whatsappNumber: '22676127800',
  whatsappDisplay: '+226 76 12 78 00',
  phoneNumber: '+226 76 12 78 00',
  email: 'support@digisolia.bf',
  website: 'https://digisolia.bf',
  address: 'Secteur 15, Avenue Kwamé Nkrumah, Ouagadougou',
  city: 'Ouagadougou',
  country: 'Burkina Faso',
  supportHours: 'Lun – Sam · 08h00 à 19h00 (GMT)',
} as const;

export const DIGISOLIA_CATALOG_APPS: Omit<DigiSoliaRegisteredApp, 'usersCount' | 'lastUpdatedAt' | 'createdAt'>[] = [
  {
    id: 'digisolia-pos',
    appId: 'digisolia-pos',
    name: 'DigiSolia POS',
    shortName: 'POS & Commerce',
    description: 'Caisse tactile, gestion commerciale, stocks, facturation, avoirs et suivi multi-boutiques pour PME.',
    version: '2.5.0',
    status: 'active',
    category: 'Commerce & Caisse',
  },
  {
    id: 'prof-planning',
    appId: 'prof-planning',
    name: 'PROF PLANNING',
    shortName: 'Emplois du temps',
    description: 'Planification intelligente des emplois du temps des enseignants, salles et volumes horaires.',
    version: '1.4.0',
    status: 'active',
    category: 'Éducation & Établissements',
  },
  {
    id: 'digisolia-hotel',
    appId: 'digisolia-hotel',
    name: 'DigiSolia Hôtel',
    shortName: 'Hôtellerie',
    description: 'Gestion des chambres, réservations, séjours, facturation client et entretien pour hôtels et auberges.',
    version: '1.2.0',
    status: 'active',
    category: 'Hôtellerie & Tourisme',
  },
];

export const DIGISOLIA_APP_CONFIG: DigiSoliaAppConfig = {
  appId: 'digisolia-pos',
  appName: 'DigiSolia POS',
  shortName: 'DigiSolia POS',
  brandName: 'DIGISOLIA',
  tagline: 'La technologie au service de vos activités.',
  description:
    'Solution professionnelle de caisse, gestion des stocks, suivi des crédits clients, facturation et pilotage financier conçue pour les commerces et entreprises au Burkina Faso.',
  version: '2.5.0',
  frameworkVersion: 'DAF 1.0.0',
  publisherName: 'DigiSolia SARL',
  publisherLegalInfo: 'Entreprise de solutions numériques · Ouagadougou, Burkina Faso · Écosystème DigiSolia App Framework',
  logoText: 'DIGISOLIA',
  colors: { ...DIGISOLIA_COLORS },
  contacts: { ...DIGISOLIA_CONTACTS },
  enabledModules: {
    presentation: true,
    dashboard: true,
    support: true,
    feedback: true,
    profile: true,
    settings: true,
    about: true,
    admin: true,
  },
  features: [
    {
      id: 'pos-speed',
      title: 'Encaissement rapide & Vente Express',
      description: 'Caisse compatible lecteur code-barres USB, caméra mobile, imprimante thermique Bluetooth et paiement mixte (Espèces, Orange Money, Moov Money, Wave).',
      benefit: 'Réduit le temps d’attente en caisse même aux heures d’affluence.',
    },
    {
      id: 'stock-control',
      title: 'Maîtrise des stocks & Péremptions',
      description: 'Alertes automatiques sur articles populaires, suivi des pertes/casses, DLC et mouvements de stock détaillés.',
      benefit: 'Évite les ruptures sur vos meilleures ventes et limite le gaspillage.',
    },
    {
      id: 'offline-cloud',
      title: 'Continuité hors connexion & Cloud',
      description: 'Travaillez sans interruption en cas de coupure Internet avec file d’attente locale et synchronisation automatique dès le retour du réseau.',
      benefit: 'Votre activité ne s’arrête jamais, même en zone à faible connectivité.',
    },
    {
      id: 'credits-avoirs',
      title: 'Clients, Crédits, Avoirs & Devis',
      description: 'Suivez les créances clients, émettez des proformas, factures et bons d’avoir traçables en quelques clics.',
      benefit: 'Sécurise votre trésorerie et fidélise votre clientèle professionnelle.',
    },
  ],
  benefits: [
    'Interface claire en français adaptée aux téléphones Android, tablettes et ordinateurs.',
    'Fonctionnement garanti sans Internet avec sauvegarde locale et synchronisation Cloud sécurisée.',
    'Séparation stricte des droits par rôle (Propriétaire, Gérant, Caissier, Stock).',
    'Support client réactif directement accessible par WhatsApp, téléphone ou ticket intégré.',
  ],
  faq: [
    {
      id: 'faq-offline',
      category: 'Hors connexion',
      question: 'Puis-je continuer à vendre ou enregistrer des demandes sans Internet ?',
      answer:
        'Oui. Vos ventes, mouvements de stock, avis et demandes d’assistance sont enregistrés localement sur votre appareil et envoyés automatiquement vers le Cloud dès que la connexion Internet revient.',
    },
    {
      id: 'faq-printer',
      category: 'Matériel & Caisse',
      question: 'Puis-je valider une vente sans imprimer de ticket ?',
      answer:
        'Oui. Vous disposez du bouton « Valider sans imprimer » dans le panier et d’un réglage par défaut dans Paramètres > Imprimante pour économiser le papier thermique.',
    },
    {
      id: 'faq-backup',
      category: 'Sécurité',
      question: 'Comment sauvegarder manuellement les données de ma boutique ?',
      answer:
        'Rendez-vous dans Paramètres DigiSolia ou Paramètres & Équipe > Sauvegarde pour exporter un fichier JSON complet de votre activité à tout moment.',
    },
    {
      id: 'faq-support',
      category: 'Assistance',
      question: 'Quel est le délai de réponse du Centre d’assistance DigiSolia ?',
      answer:
        'Les tickets techniques envoyés depuis le Centre d’assistance sont pris en charge sous 2 à 24 heures ouvrées. Pour une urgence en caisse, privilégiez le contact WhatsApp ou l’appel direct.',
    },
  ],
  userGuide: [
    {
      id: 'guide-1',
      moduleTag: 'Caisse & Vente',
      title: '1. Ouvrir la caisse et encaisser',
      description: 'Scannez ou touchez un article (ou utilisez Vente Express pour vos produits phares), choisissez le mode de paiement et validez avec ou sans ticket.',
    },
    {
      id: 'guide-2',
      moduleTag: 'Stocks & Alertes',
      title: '2. Surveiller les seuils critiques',
      description: 'Définissez un seuil d’alerte sur vos articles populaires et ajustez vos entrées/pertes (+ ou -) depuis la rubrique Gestion des Stocks.',
    },
    {
      id: 'guide-3',
      moduleTag: 'Synchronisation',
      title: '3. Vérifier l’état de synchronisation',
      description: 'L’indicateur en haut de l’écran ou sur l’Accueil DigiSolia affiche le statut connecté/hors ligne ainsi que les éléments en attente d’envoi.',
    },
    {
      id: 'guide-4',
      moduleTag: 'Support & Avis',
      title: '4. Contacter l’équipe DigiSolia',
      description: 'Utilisez « Centre d’assistance » pour signaler un problème technique et « Donner mon avis » pour noter l’application ou proposer une amélioration.',
    },
  ],
};

export const ADMIN_ROLE_LABELS: Record<DigiSoliaAdminRole, string> = {
  super_admin: 'Super administrateur',
  app_admin: 'Administrateur d’application',
  support_agent: 'Agent de support',
  stats_reader: 'Lecteur des statistiques',
};

export const ADMIN_ROLE_PERMISSIONS: Record<
  DigiSoliaAdminRole,
  {
    canManageApps: boolean;
    canManageUsers: boolean;
    canManageAdmins: boolean;
    canRespondSupportAndFeedback: boolean;
    canBroadcastNotifications: boolean;
    canViewStats: boolean;
    canViewAuditLogs: boolean;
  }
> = {
  super_admin: {
    canManageApps: true,
    canManageUsers: true,
    canManageAdmins: true,
    canRespondSupportAndFeedback: true,
    canBroadcastNotifications: true,
    canViewStats: true,
    canViewAuditLogs: true,
  },
  app_admin: {
    canManageApps: true,
    canManageUsers: true,
    canManageAdmins: false,
    canRespondSupportAndFeedback: true,
    canBroadcastNotifications: true,
    canViewStats: true,
    canViewAuditLogs: true,
  },
  support_agent: {
    canManageApps: false,
    canManageUsers: false,
    canManageAdmins: false,
    canRespondSupportAndFeedback: true,
    canBroadcastNotifications: false,
    canViewStats: true,
    canViewAuditLogs: false,
  },
  stats_reader: {
    canManageApps: false,
    canManageUsers: false,
    canManageAdmins: false,
    canRespondSupportAndFeedback: false,
    canBroadcastNotifications: false,
    canViewStats: true,
    canViewAuditLogs: false,
  },
};
