import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  Layers,
  Menu,
  Sparkles
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    cart, 
    summary, 
    isMobileDrawerOpen, 
    setIsMobileDrawerOpen,
    activeCashSession
  } = useApp();

  const isOtherActive = !['pos', 'products', 'stock', 'customers'].includes(activeTab);
  const hasAlerts = summary.expiringProductsCount > 0 || !activeCashSession;

  return (
    <nav 
      aria-label="Navigation mobile"
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-40 px-1 py-1.5 safe-area-bottom shadow-2xl"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Caisse / POS */}
        <button
          id="mobile-nav-pos"
          type="button"
          onClick={() => setActiveTab('pos')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
            activeTab === 'pos' 
              ? 'text-blue-400 font-bold bg-blue-950/40' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <ShoppingCart className="h-5 w-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-blue-600 text-white font-extrabold text-[10px] h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-xs animate-in zoom-in-95">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Caisse</span>
        </button>

        {/* Produits / Articles */}
        <button
          id="mobile-nav-products"
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
            activeTab === 'products' 
              ? 'text-blue-400 font-bold bg-blue-950/40' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="h-5 w-5" />
          <span className="text-[10px] mt-1 tracking-tight">Articles</span>
        </button>

        {/* Stock */}
        <button
          id="mobile-nav-stock"
          type="button"
          onClick={() => setActiveTab('stock')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
            activeTab === 'stock' 
              ? 'text-blue-400 font-bold bg-blue-950/40' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Layers className="h-5 w-5" />
            {summary.lowStockCount + summary.outOfStockCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[9px] h-2.5 w-2.5 rounded-full ring-2 ring-slate-900" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Stock</span>
        </button>

        {/* Clients & Crédits */}
        <button
          id="mobile-nav-customers"
          type="button"
          onClick={() => setActiveTab('customers')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
            activeTab === 'customers' 
              ? 'text-blue-400 font-bold bg-blue-950/40' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Users className="h-5 w-5" />
            {summary.totalPendingDebts > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-slate-950 font-bold text-[8px] px-1 rounded-full">
                {summary.totalPendingDebts > 999 ? `${(summary.totalPendingDebts / 1000).toFixed(0)}k` : 'Crédit'}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Crédits</span>
        </button>

        {/* Menu / Plus (Drawer trigger) */}
        <button
          id="mobile-nav-menu"
          type="button"
          onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
            isOtherActive || isMobileDrawerOpen
              ? 'text-blue-400 font-bold bg-blue-950/40' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Menu className="h-5 w-5" />
            {hasAlerts && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white font-bold text-[8px] h-2.5 w-2.5 rounded-full ring-2 ring-slate-900 animate-pulse" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
};
