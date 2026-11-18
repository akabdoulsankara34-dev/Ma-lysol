# ARCHITECTURE — DIGISOLIA APP FRAMEWORK (DAF)

## 1. Vue d'ensemble
Le **DigiSolia App Framework (DAF)** est un socle modulaire conçu pour fournir une identité visuelle unifiée, des services utilisateurs transversaux, une couche Firebase cloisonnée par produit et un panneau d'administration centralisé (**DIGISOLIA ADMIN**) à l'ensemble des applications de **DigiSolia** :
- `digisolia-pos` (DigiSolia POS / BizPilot BF)
- `prof-planning` (PROF PLANNING)
- `digisolia-hotel` (DigiSolia Hôtel)
- Toute future application DigiSolia.

## 2. Arborescence modulaire (`src/digisolia/`)
```
src/digisolia/
├── admin/
│   └── DigiSoliaAdminView.tsx       # Console centralisée multi-produits (12 fonctionnalités + RBAC)
├── components/
│   ├── DigiSoliaLogo.tsx            # Logo provisoire remplaçable
│   ├── PresentationView.tsx         # Module A : Page de présentation (1ère utilisation + menu)
│   ├── DafHomeView.tsx              # Module B : Accueil Framework (distinct du tableau métier)
│   ├── SupportCenterView.tsx        # Module C : Centre d'assistance (WhatsApp, Tél, Email, FAQ, Guide, Tickets)
│   ├── FeedbackView.tsx             # Module D : Avis, notes 1-5★, suggestions, bugs, réclamations
│   ├── UserProfileView.tsx          # Module E : Profil utilisateur et gestion de session
│   ├── DafSettingsView.tsx          # Module F : Préférences, mode clair/sombre, synchro, sauvegarde
│   └── AboutView.tsx                # Module G : À propos, mission, vision, CGU, confidentialité
├── config/
│   └── dafConfig.ts                 # Fichier central de configuration (appId, contacts, couleurs, modules, FAQ)
├── docs/
│   ├── ARCHITECTURE_DAF.md
│   └── GUIDE_INTEGRATION.md
├── features/
│   └── PosDigiSoliaBridge.tsx       # Adaptateur non destructif vers DigiSolia POS
├── hooks/
│   └── useDigiSolia.tsx             # Provider React et hook useDigiSolia()
├── services/
│   ├── firebaseService.ts           # Couche Firestore cloisonnée par appId (réutilise l'instance existante)
│   └── offlineQueueService.ts       # Cache local et file d'attente hors connexion avec déduplication
├── styles/
│   └── theme.css                    # Variables CSS DigiSolia (#163B65, #2783C7, #F4F7FB, #E1E7EF) + mode sombre
├── types/
│   └── index.ts                     # Contrats TypeScript complets
├── utils/
│   └── validation.ts                # Validation de formulaires, anti-spam, empreintes anti-doublon et RBAC
└── index.ts                         # Point d'entrée public du framework
```

## 3. Organisation Cloud Firestore
- `apps/{appId}` : Catalogue et métadonnées de chaque application DigiSolia.
- `apps/{appId}/feedback/{feedbackId}` : Avis, notes, suggestions, bugs et réclamations isolés par `appId`.
- `apps/{appId}/support/{ticketId}` : Tickets d'assistance technique isolés par `appId`.
- `users/{userId}` : Annuaire multi-applications (fusion non destructive avec les données existantes).
- `administrators/{adminId}` : Comptes d'administration et rôles RBAC (`super_admin`, `app_admin`, `support_agent`, `stats_reader`).
- `notifications/{notifId}` : Annonces ciblées par `appId` ou globales (`all`).
- `admin_logs/{logId}` : Journal d'audit immuable des opérations d'administration.

## 4. Résilience hors connexion
- Chaque soumission d'avis ou de ticket hors ligne est stockée dans `localStorage` sous la clé isolée `daf_offline_queue_v1_<appId>` avec empreinte anti-doublon (`fingerprint`).
- Dès que `adapter.isOnline` redevient `true`, `flushOfflineQueue()` synchronise automatiquement les éléments en attente vers Firestore sans écraser les mécanismes locaux métier déjà existants.
