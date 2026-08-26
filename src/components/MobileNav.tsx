import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  Receipt, 
  TrendingUp, 
  Layers 
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, cart, summary } = useApp();
  const isOwner = currentUser.role === 'owner' || currentUser.role === 'admin';

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-40 px-2 py-1 safe-area-bottom shadow-lg">
      <div className="flex items-center justify-around">
        {/* Caisse / POS */}
        <button
          id="mobile-nav-pos"
          onClick={() => setActiveTab('pos')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all relative ${
            activeTab === 'pos' ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <ShoppingCart className="h-5 w-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-blue-600 text-white font-extrabold text-[10px] h-4 w-4 rounded-full flex items-center justify-center">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5">Caisse</span>
        </button>

        {/* Produits */}
        <button
          id="mobile-nav-products"
          onClick={() => setActiveTab('products')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all ${
            activeTab === 'products' ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Articles</span>
        </button>

        {/* Stock */}
        <button
          id="mobile-nav-stock"
          onClick={() => setActiveTab('stock')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all relative ${
            activeTab === 'stock' ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Layers className="h-5 w-5" />
            {summary.lowStockCount + summary.outOfStockCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[9px] h-3 w-3 rounded-full flex items-center justify-center" />
            )}
          </div>
          <span className="text-[10px] mt-0.5">Stock</span>
        </button>

        {/* Clients & Crédits */}
        <button
          id="mobile-nav-customers"
          onClick={() => setActiveTab('customers')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all relative ${
            activeTab === 'customers' ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Users className="h-5 w-5" />
            {summary.totalPendingDebts > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-amber-500 text-slate-950 font-bold text-[9px] px-1 rounded-full">
                Crédit
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5">Crédits</span>
        </button>

        {/* Dépenses */}
        <button
          id="mobile-nav-expenses"
          onClick={() => setActiveTab('expenses')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all ${
            activeTab === 'expenses' ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Dépenses</span>
        </button>

        {/* Dashboard (Owner only) */}
        {isOwner && (
          <button
            id="mobile-nav-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all relative ${
              activeTab === 'dashboard' ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <TrendingUp className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white font-black text-[8px] px-1 py-0.2 rounded-full uppercase">
                Live
              </span>
            </div>
            <span className="text-[10px] mt-0.5">Direct</span>
          </button>
        )}
      </div>
    </div>
  );
};
