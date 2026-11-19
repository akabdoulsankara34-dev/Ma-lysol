import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { NavigationTab } from '../../types';
import { DigiSoliaProvider } from '../hooks/useDigiSolia';
import { DigiSoliaHostAdapter } from '../types';

interface PosDigiSoliaBridgeProps {
  children: React.ReactNode;
}

export const PosDigiSoliaBridge: React.FC<PosDigiSoliaBridgeProps> = ({ children }) => {
  const {
    currentUser,
    business,
    isOnline,
    isSyncing,
    pendingSyncCount,
    lastSyncedAt,
    setActiveTab,
    forceSyncCloudData,
    lockUserSession,
    logoutBusiness,
    isPlatformAdminUnlocked,
    products,
    sales,
    customers,
    expenses,
    stockMovements,
  } = useApp();

  const adapter = useMemo<DigiSoliaHostAdapter>(() => {
    const parts = (currentUser.name || 'Utilisateur').trim().split(/\s+/);
    const firstName = parts[0] || 'Utilisateur';
    const lastName = parts.slice(1).join(' ');

    const roleLabel =
      currentUser.role === 'owner'
        ? 'Propriétaire'
        : currentUser.role === 'manager'
          ? 'Gérant'
          : currentUser.role === 'cashier'
            ? 'Caissier'
            : currentUser.role === 'stock_manager'
              ? 'Gestionnaire Stock'
              : 'Administrateur';

    return {
      appId: 'digisolia-pos',
      user: {
        userId: currentUser.id,
        firstName,
        lastName,
        fullName: currentUser.name,
        email: '',
        phone: currentUser.phone,
        roleLabel,
        businessName: business.name,
        businessId: business.id,
        createdAt: currentUser.createdAt,
        lastActiveAt: new Date().toISOString(),
        appId: 'digisolia-pos',
      },
      isOnline,
      isSyncing,
      pendingBusinessSyncCount: pendingSyncCount,
      lastSyncedAt,
      shortcuts: [
        {
          id: 'sc-pos',
          label: 'Caisse & Vente',
          description: 'Encaisser rapidement ou lancer une Vente Express.',
          tabId: 'pos',
          accent: 'primary',
        },
        ...(currentUser.role === 'owner' ||
        currentUser.role === 'admin' ||
        currentUser.role === 'manager' ||
        currentUser.role === 'stock_manager'
          ? [
              {
                id: 'sc-stock',
                label: 'Gestion des Stocks',
                description: 'Contrôler les seuils critiques et ajustements (+/-).',
                tabId: 'stock',
                accent: 'secondary' as const,
              },
            ]
          : [
              {
                id: 'sc-cash',
                label: 'Clôture Caisse (Z)',
                description: 'Ouvrir, suivre et clôturer votre session de caisse.',
                tabId: 'cash_register',
                accent: 'secondary' as const,
              },
            ]),
        ...(currentUser.role === 'owner' ||
        currentUser.role === 'admin' ||
        currentUser.role === 'manager'
          ? [
              {
                id: 'sc-dashboard',
                label: 'Tableau de Bord Métier',
                description: 'Suivre le chiffre d’affaires, bénéfices et dépenses.',
                tabId: 'dashboard',
                accent: 'emerald' as const,
              },
            ]
          : [
              {
                id: 'sc-products',
                label: 'Catalogue Articles',
                description: 'Consulter les articles, prix et codes-barres.',
                tabId: 'products',
                accent: 'emerald' as const,
              },
            ]),
        {
          id: 'sc-customers',
          label: 'Clients & Crédits',
          description: 'Gérer les comptes clients, fidélité et recouvrements.',
          tabId: 'customers',
          accent: 'amber',
        },
      ],
      usefulTips: [
        'Astuce caisse : utilisez le bouton « Vente Express » pour encaisser vos articles populaires en un clic sans passer par le panier complet.',
        'Mode hors connexion : vos encaissements et tickets d’assistance restent enregistrés localement même en cas de coupure réseau.',
        'Économie de papier : vous pouvez valider chaque vente sans imprimer ou configurer ce choix dans Paramètres > Imprimante.',
      ],
      activeSessionSummary: `Connecté (${business.accessCode})`,
      canAccessAdmin: isPlatformAdminUnlocked,
      onNavigate: (tabId: string) => {
        setActiveTab(tabId as NavigationTab);
      },
      onTriggerBusinessSync: async () => {
        await forceSyncCloudData();
      },
      onExportBackup: () => {
        const backupData = {
          exportDate: new Date().toISOString(),
          business,
          products,
          sales,
          customers,
          expenses,
          stockMovements,
        };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `digisolia_pos_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      },
      onLockSession: lockUserSession,
      onLogout: logoutBusiness,
    };
  }, [
    business,
    currentUser,
    customers,
    expenses,
    forceSyncCloudData,
    isOnline,
    isPlatformAdminUnlocked,
    isSyncing,
    lastSyncedAt,
    lockUserSession,
    logoutBusiness,
    pendingSyncCount,
    products,
    sales,
    setActiveTab,
    stockMovements,
  ]);

  return <DigiSoliaProvider adapter={adapter}>{children}</DigiSoliaProvider>;
};
