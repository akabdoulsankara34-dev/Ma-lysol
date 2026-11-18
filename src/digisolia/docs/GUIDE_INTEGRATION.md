# GUIDE D'INTÉGRATION — DIGISOLIA APP FRAMEWORK (DAF)

Ce guide explique comment intégrer le socle `src/digisolia/` dans une application React existante (**PROF PLANNING**, **DigiSolia Hôtel**, ou un futur produit) sans modifier son code métier ni sa base de données existante.

## Étape 1 : Copier le dossier `src/digisolia/`
Copiez intégralement le dossier `src/digisolia/` dans le répertoire `src/` de l'application cible.

## Étape 2 : Importer le thème dans `src/index.css`
Juste après `@import "tailwindcss";`, ajoutez :
```css
@custom-variant dark (&:where(.dark, .dark *));
@import "./digisolia/styles/theme.css";
```

## Étape 3 : Configurer `src/digisolia/config/dafConfig.ts`
Modifiez l'objet `DIGISOLIA_APP_CONFIG` avec les informations propres au produit :
- `appId`: `'prof-planning'` ou `'digisolia-hotel'`
- `appName`: `'PROF PLANNING'` ou `'DigiSolia Hôtel'`
- `version`: version courante du produit
- `description`, `features`, `benefits`, `faq`, `userGuide`
- `enabledModules`: activez ou désactivez chaque module (`true` / `false`).

## Étape 4 : Connecter l'instance Firebase existante
Dans `src/digisolia/services/firebaseService.ts`, vérifiez l'import :
```ts
import { auth, db, ensureFirebaseAuth, sanitizeForFirestore } from '../../lib/firebase';
```
Le framework réutilise toujours l'instance Firebase déjà initialisée par l'application hôte afin d'éviter tout doublon de connexion.

## Étape 5 : Créer un adaptateur `DigiSoliaHostAdapter`
Créez un composant pont (exemple : `src/digisolia/features/HotelDigiSoliaBridge.tsx`) qui fournit à `<DigiSoliaProvider adapter={adapter}>` :
- l'utilisateur connecté (`userId`, `firstName`, `lastName`, `email`, `roleLabel`, `createdAt`),
- l'état réseau (`isOnline`, `isSyncing`, `pendingBusinessSyncCount`, `lastSyncedAt`),
- les raccourcis métier (`shortcuts`),
- la fonction de navigation (`onNavigate(tabId)`),
- les callbacks optionnels (`onExportBackup`, `onLockSession`, `onLogout`).

## Étape 6 : Brancher les routes dans le menu existant
Ajoutez les onglets suivants sans toucher au tableau de bord métier existant :
- `daf_home` -> `<DafHomeView />`
- `daf_presentation` -> `<PresentationView />`
- `daf_support` -> `<SupportCenterView />`
- `daf_feedback` -> `<FeedbackView />`
- `daf_profile` -> `<UserProfileView />`
- `daf_settings` -> `<DafSettingsView />`
- `daf_about` -> `<AboutView />`
- `daf_admin` -> `<DigiSoliaAdminView />` (réservé aux administrateurs autorisés)
