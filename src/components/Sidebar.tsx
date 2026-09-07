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
  AlertCircle,
  ShieldCheck,
  Vault,
  CalendarClock,
  FileSpreadsheet,
  Barcode,
  FileText,
  Tv
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, summary, cart, isPlatformAdminUnlocked, activeCashSession } = useApp();

  const isOwner = currentUser.role === 'owner' || currentUser.role === 'admin';
  const isStockManager = currentUser.role === 'stock_manager' || isOwner;

  const navItems = [
    {
      id: 'pos' as const,
      label: 'Caisse & Vente',
      icon: ShoppingCart,
      badge: cart.length > 0 ? `${cart.reduce((a, b) => a + b.quantity, 0)}` : null,
      badgeColor: 'bg-blue-600 text-white',
      allowed: true,
    },
    {
      id: 'customer_display' as const,
      label: '2ème Écran Client',
      icon: Tv,
      badge: 'Live',
      badgeColor: 'bg-indigo-500 text-white font-bold text-[10px]',
      allowed: true,
    },
    {
      id: 'cash_register' as const,
      label: 'Clôture Caisse (Z)',
      icon: Vault,
      badge: activeCashSession ? 'Ouverte' : null,
      badgeColor: 'bg-emerald-500 text-slate-950 font-bold text-[10px]',
      allowed: true,
    },
    {
      id: 'products' as const,
      label: 'Catalogue Articles',
      icon: Package,
      badge: null,
      allowed: true,
    },
    {
      id: 'stock' as const,
      label: 'Gestion des Stocks',
      icon: Layers,
      badge: summary.lowStockCount + summary.outOfStockCount > 0 ? `${summary.lowStockCount + summary.outOfStockCount}` : null,
      badgeColor: 'bg-red-500 text-white',
      allowed: isStockManager,
    },
    {
      id: 'expiry' as const,
      label: 'DLC & Péremptions',
      icon: CalendarClock,
      badge: summary.expiringProductsCount > 0 ? `${summary.expiringProductsCount}` : null,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
      allowed: isStockManager,
    },
    {
      id: 'proformas' as const,
      label: 'Devis & Proforma',
      icon: FileSpreadsheet,
      badge: null,
      allowed: true,
    },
    {
      id: 'invoices' as const,
      label: 'Facturation Client',
      icon: FileText,
      badge: null,
      allowed: true,
    },
    {
      id: 'labels' as const,
      label: 'Étiquettes Code-barres',
      icon: Barcode,
      badge: null,
      allowed: isStockManager,
    },
    {
      id: 'customers' as const,
      label: 'Clients & Fidélité',
      icon: Users,
      badge: summary.totalPendingDebts > 0 ? `${(summary.totalPendingDebts / 1000).toFixed(0)}k` : null,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
      allowed: true,
    },
    {
      id: 'expenses' as const,
      label: 'Dépenses & Charges',
      icon: Receipt,
      badge: null,
      allowed: true,
    },
    {
      id: 'dashboard' as const,
      label: 'Tableau de Bord',
      icon: TrendingUp,
      badge: 'Live',
      badgeColor: 'bg-red-600 text-white font-black text-[10px] uppercase tracking-wider',
      allowed: isOwner,
    },
    {
      id: 'settings' as const,
      label: 'Paramètres & Équipe',
      icon: Settings,
      badge: null,
      allowed: isOwner,
    },
    {
      id: 'admin' as const,
      label: 'Admin Plateforme',
      icon: ShieldCheck,
      badge: 'Maître',
      badgeColor: 'bg-blue-500 text-white font-bold',
      allowed: isPlatformAdminUnlocked,
    },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <p className="px-3 text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">
          Navigation Principale
        </p>

        {navItems.filter(item => item.allowed).map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-link-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${item.badgeColor || 'bg-slate-700 text-slate-200'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Low stock alert box at bottom of sidebar */}
      {(summary.lowStockCount > 0 || summary.outOfStockCount > 0) && (
        <div className="mt-4">
          <div 
            onClick={() => setActiveTab('stock')}
            className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl cursor-pointer hover:bg-red-900/40 transition"
          >
            <div className="flex items-center space-x-2 text-red-400 font-semibold text-xs mb-1">
              <AlertCircle className="h-4 w-4" />
              <span>Alerte Réapprovisionnement</span>
            </div>
            <p className="text-[11px] text-red-200/80">
              {summary.outOfStockCount > 0 ? `${summary.outOfStockCount} rupture(s)` : ''}
              {summary.outOfStockCount > 0 && summary.lowStockCount > 0 ? ' et ' : ''}
              {summary.lowStockCount > 0 ? `${summary.lowStockCount} stock(s) faible(s)` : ''}.
            </p>
          </div>
        </div>
      )}

      {/* System Status footer in sidebar */}
      <div className="mt-auto pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between px-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            <span>Multi-Tenant Cloud</span>
          </div>
          <span className="text-slate-500 font-mono text-[11px]">v2.5</span>
        </div>
      </div>
    </aside>
  );
};
