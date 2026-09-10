import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingCart, 
  Package, 
  Layers, 
  Users, 
  Receipt, 
  TrendingUp, 
  Settings, 
  ShieldCheck,
  Vault,
  CalendarClock,
  FileSpreadsheet,
  Barcode,
  FileText,
  Tv,
  X,
  Store,
  User,
  LogOut,
  Wifi,
  WifiOff,
  RefreshCw,
  KeyRound,
  ChevronRight
} from 'lucide-react';
import { NavigationTab } from '../types';

export const MobileDrawer: React.FC = () => {
  const { 
    isMobileDrawerOpen, 
    setIsMobileDrawerOpen, 
    activeTab, 
    setActiveTab, 
    business, 
    currentUser, 
    summary, 
    cart, 
    isPlatformAdminUnlocked, 
    activeCashSession,
    requestUserSwitch,
    logoutBusiness,
    isOnline,
    isSyncing,
    pendingSyncCount,
    forceSyncCloudData
  } = useApp();

  if (!isMobileDrawerOpen) return null;

  const isOwner = currentUser.role === 'owner' || currentUser.role === 'admin';
  const isStockManager = currentUser.role === 'stock_manager' || isOwner;

  interface DrawerItem {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | null;
    badgeColor?: string;
    allowed: boolean;
  }

  interface NavSection {
    sectionTitle: string;
    items: DrawerItem[];
  }

  const sections: NavSection[] = [
    {
      sectionTitle: 'Caisse & Vente',
      items: [
        {
          id: 'pos',
          label: 'Caisse & Vente',
          icon: ShoppingCart,
          badge: cart.length > 0 ? `${cart.reduce((a, b) => a + b.quantity, 0)}` : null,
          badgeColor: 'bg-blue-600 text-white',
          allowed: true,
        },
        {
          id: 'cash_register',
          label: 'Clôture Caisse (Z)',
          icon: Vault,
          badge: activeCashSession ? 'Ouverte' : null,
          badgeColor: 'bg-emerald-500 text-slate-950 font-bold',
          allowed: true,
        },
        {
          id: 'customer_display',
          label: '2ème Écran Client',
          icon: Tv,
          badge: 'Live',
          badgeColor: 'bg-indigo-500 text-white font-bold',
          allowed: true,
        },
      ],
    },
    {
      sectionTitle: 'Articles & Stock',
      items: [
        {
          id: 'products',
          label: 'Catalogue Articles',
          icon: Package,
          badge: null,
          allowed: true,
        },
        {
          id: 'stock',
          label: 'Gestion des Stocks',
          icon: Layers,
          badge: summary.lowStockCount + summary.outOfStockCount > 0 ? `${summary.lowStockCount + summary.outOfStockCount}` : null,
          badgeColor: 'bg-red-500 text-white',
          allowed: isStockManager,
        },
        {
          id: 'expiry',
          label: 'DLC & Péremptions',
          icon: CalendarClock,
          badge: summary.expiringProductsCount > 0 ? `${summary.expiringProductsCount}` : null,
          badgeColor: 'bg-amber-500 text-slate-950 font-bold',
          allowed: isStockManager,
        },
        {
          id: 'labels',
          label: 'Étiquettes Code-barres',
          icon: Barcode,
          badge: null,
          allowed: isStockManager,
        },
      ],
    },
    {
      sectionTitle: 'Facturation & Clients',
      items: [
        {
          id: 'invoices',
          label: 'Facturation Client',
          icon: FileText,
          badge: null,
          allowed: true,
        },
        {
          id: 'proformas',
          label: 'Devis & Proformas',
          icon: FileSpreadsheet,
          badge: null,
          allowed: true,
        },
        {
          id: 'customers',
          label: 'Clients & Crédits',
          icon: Users,
          badge: summary.totalPendingDebts > 0 ? `${(summary.totalPendingDebts / 1000).toFixed(0)}k` : null,
          badgeColor: 'bg-amber-500 text-slate-950 font-bold',
          allowed: true,
        },
      ],
    },
    {
      sectionTitle: 'Finances & Supervision',
      items: [
        {
          id: 'expenses',
          label: 'Dépenses & Charges',
          icon: Receipt,
          badge: null,
          allowed: true,
        },
        {
          id: 'dashboard',
          label: 'Tableau de Bord',
          icon: TrendingUp,
          badge: 'Live',
          badgeColor: 'bg-red-600 text-white font-black',
          allowed: isOwner,
        },
      ],
    },
    {
      sectionTitle: 'Paramètres & Système',
      items: [
        {
          id: 'settings',
          label: 'Paramètres & Équipe',
          icon: Settings,
          badge: null,
          allowed: isOwner,
        },
        {
          id: 'admin',
          label: 'Admin Plateforme',
          icon: ShieldCheck,
          badge: 'Maître',
          badgeColor: 'bg-blue-500 text-white font-bold',
          allowed: isPlatformAdminUnlocked,
        },
      ],
    },
  ];

  const handleSelectTab = (tab: NavigationTab) => {
    setActiveTab(tab);
    setIsMobileDrawerOpen(false);
  };

  const roleName = 
    currentUser.role === 'owner' ? 'Propriétaire' :
    currentUser.role === 'manager' ? 'Gérant' :
    currentUser.role === 'cashier' ? 'Caissier' :
    currentUser.role === 'stock_manager' ? 'Stock' : currentUser.role;

  return (
    <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-200">
      {/* Dimmed backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={() => setIsMobileDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 left-0 max-w-[85%] w-80 bg-slate-900 text-slate-200 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250 border-r border-slate-800">
        
        {/* Header: Business & Close Button */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Store className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <h3 className="font-bold text-white text-base tracking-tight truncate">
                  BizPilot <span className="text-blue-500 font-black">BF</span>
                </h3>
                <span className="font-mono text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded shrink-0">
                  {business.accessCode}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                {business.name} • {business.city.split('(')[0].trim()}
              </p>
            </div>
          </div>

          <button
            id="btn-close-mobile-drawer"
            type="button"
            onClick={() => setIsMobileDrawerOpen(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer shrink-0"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Active User Profile Banner */}
        <div className="p-3.5 mx-3 mt-3 bg-slate-800/80 border border-slate-700/60 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs uppercase shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-blue-400 font-semibold">{roleName}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsMobileDrawerOpen(false);
              requestUserSwitch(currentUser.id);
            }}
            className="flex items-center space-x-1 text-[11px] font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1.5 rounded-lg transition shrink-0 cursor-pointer"
            title="Changer de profil ou saisir code PIN"
          >
            <KeyRound className="h-3.5 w-3.5 text-slate-400" />
            <span>PIN</span>
          </button>
        </div>

        {/* Scrollable Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {sections.map((sec, idx) => {
            const allowedItems = sec.items.filter(item => item.allowed);
            if (allowedItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  {sec.sectionTitle}
                </p>
                <div className="space-y-0.5">
                  {allowedItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        id={`mobile-drawer-tab-${item.id}`}
                        type="button"
                        onClick={() => handleSelectTab(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {item.badge && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.badgeColor || 'bg-slate-700 text-slate-200'}`}>
                              {item.badge}
                            </span>
                          )}
                          {!isActive && <ChevronRight className="h-3.5 w-3.5 text-slate-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: Sync Status & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2 safe-area-bottom">
          {/* Sync status indicator */}
          <div className="flex items-center justify-between px-2 text-xs">
            <div className="flex items-center space-x-2 text-slate-400">
              {isOnline ? (
                <span className="flex items-center space-x-1 text-emerald-400 text-[11px] font-medium">
                  {isSyncing ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                  ) : (
                    <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                  <span>{isSyncing ? 'Synchronisation...' : pendingSyncCount > 0 ? `${pendingSyncCount} en attente` : 'En ligne (Cloud)'}</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-amber-400 text-[11px] font-medium">
                  <WifiOff className="h-3.5 w-3.5 text-amber-400" />
                  <span>Hors-ligne (Local)</span>
                </span>
              )}
            </div>

            {isOnline && (
              <button
                type="button"
                onClick={() => forceSyncCloudData()}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-bold underline cursor-pointer"
              >
                Sync
              </button>
            )}
          </div>

          {/* Business Logout */}
          <button
            type="button"
            onClick={() => {
              setIsMobileDrawerOpen(false);
              logoutBusiness();
            }}
            className="w-full flex items-center justify-center space-x-2 bg-slate-800/80 hover:bg-red-900/30 text-slate-300 hover:text-red-300 py-2.5 px-3 rounded-xl text-xs font-bold transition border border-slate-700/60 hover:border-red-800/50 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Déconnexion Entreprise</span>
          </button>
        </div>

      </div>
    </div>
  );
};
