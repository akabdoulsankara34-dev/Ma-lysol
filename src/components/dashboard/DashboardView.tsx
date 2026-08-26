import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  AlertTriangle, 
  CreditCard, 
  PieChart, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Receipt,
  Layers,
  Award,
  Radio,
  BarChart3
} from 'lucide-react';
import { RemoteLiveMonitor } from './RemoteLiveMonitor';

export const DashboardView: React.FC = () => {
  const { 
    sales, 
    expenses, 
    products, 
    customers, 
    business, 
    allUsers, 
    currentUser, 
    summary,
    setActiveTab
  } = useApp();

  const [viewMode, setViewMode] = useState<'live' | 'analytics'>('live');
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');

  // Filter dates
  const filteredData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    let cutoffDate = new Date();
    if (period === 'today') {
      cutoffDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      cutoffDate.setDate(cutoffDate.getDate() - 7);
    } else if (period === 'month') {
      cutoffDate.setDate(cutoffDate.getDate() - 30);
    } else {
      cutoffDate = new Date(0); // all
    }

    const filteredSales = sales.filter(s => {
      if (period === 'today') return s.createdAt.startsWith(todayStr);
      return new Date(s.createdAt) >= cutoffDate;
    });

    const filteredExpenses = expenses.filter(e => {
      if (period === 'today') return e.createdAt.startsWith(todayStr);
      return new Date(e.createdAt) >= cutoffDate;
    });

    const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
    const totalCostOfGoods = filteredSales.reduce((acc, s) => acc + s.totalCost, 0);
    const totalExp = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
    const grossMargin = totalRevenue - totalCostOfGoods;
    const estimatedNetProfit = grossMargin - totalExp;

    // Payment method breakdown
    const paymentMap: Record<string, number> = {
      cash: 0,
      orange_money: 0,
      moov_money: 0,
      wave_coris: 0,
      credit: 0,
      split: 0,
    };
    filteredSales.forEach(s => {
      paymentMap[s.paymentMethod] = (paymentMap[s.paymentMethod] || 0) + s.total;
    });

    // Top selling products
    const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    filteredSales.forEach(s => {
      s.items.forEach(item => {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
        }
        productSalesMap[item.productId].qty += item.quantity;
        productSalesMap[item.productId].revenue += item.subtotal;
      });
    });
    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Sales by seller
    const sellerSalesMap: Record<string, { name: string; total: number; count: number }> = {};
    filteredSales.forEach(s => {
      if (!sellerSalesMap[s.sellerId]) {
        sellerSalesMap[s.sellerId] = { name: s.sellerName, total: 0, count: 0 };
      }
      sellerSalesMap[s.sellerId].total += s.total;
      sellerSalesMap[s.sellerId].count += 1;
    });
    const sellersPerformance = Object.values(sellerSalesMap).sort((a, b) => b.total - a.total);

    return {
      filteredSales,
      filteredExpenses,
      totalRevenue,
      totalCostOfGoods,
      totalExp,
      grossMargin,
      estimatedNetProfit,
      paymentMap,
      topProducts,
      sellersPerformance,
    };
  }, [sales, expenses, period]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Header: View Mode Switcher & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Tableau de Bord & Supervision</span>
            <span className="text-xs font-semibold bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
              {business.currency}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Suivi des ventes en direct, chiffre d'affaires, marge brute et contrôle de caisse à distance.
          </p>
        </div>

        {/* View Mode Toggle: Live Monitor vs Analytical Reports */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-2xs self-start md:self-auto">
          <button
            onClick={() => setViewMode('live')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              viewMode === 'live'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Radio className={`h-3.5 w-3.5 ${viewMode === 'live' ? 'text-red-400 animate-pulse' : 'text-slate-500'}`} />
            <span>Suivi Live Direct</span>
          </button>

          <button
            onClick={() => setViewMode('analytics')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              viewMode === 'analytics'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Bilan Analytique</span>
          </button>
        </div>
      </div>

      {/* Render Live Monitor or Analytical Dashboard */}
      {viewMode === 'live' ? (
        <RemoteLiveMonitor />
      ) : (
        <div className="space-y-6">
          {/* Period Selector Bar for Analytics */}
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-700">Période d'analyse :</span>
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setPeriod('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  period === 'today' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => setPeriod('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  period === 'week' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                7 Jours
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  period === 'month' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                30 Jours
              </button>
              <button
                onClick={() => setPeriod('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  period === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                Tout
              </button>
            </div>
          </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Chiffre d'affaires */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Chiffre d'Affaires</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {filteredData.totalRevenue.toLocaleString()} <span className="text-xs font-bold text-slate-500">{business.currency}</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            {filteredData.filteredSales.length} transaction(s) de vente
          </p>
        </div>

        {/* Bénéfice Estimé (Formule officielle du CDC) */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md relative overflow-hidden border border-slate-800">
          <div className="flex items-center justify-between text-blue-400">
            <span className="text-xs font-bold uppercase tracking-wider">Bénéfice Net Estimé</span>
            <div className="h-8 w-8 rounded-lg bg-blue-950 text-blue-400 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">
            {filteredData.estimatedNetProfit.toLocaleString()} <span className="text-xs font-bold text-blue-400">{business.currency}</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-mono leading-tight">
            CA ({filteredData.totalRevenue.toLocaleString()}) - Coût ({filteredData.totalCostOfGoods.toLocaleString()}) - Dépenses ({filteredData.totalExp.toLocaleString()})
          </p>
        </div>

        {/* Dépenses Totales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Dépenses Exploitation</span>
            <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-600 mt-2">
            -{filteredData.totalExp.toLocaleString()} <span className="text-xs font-bold text-slate-500">{business.currency}</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            {filteredData.filteredExpenses.length} justificatif(s) enregistré(s)
          </p>
        </div>

        {/* Crédits Clients en Attente */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Créances en Attente</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-900 mt-2">
            {summary.totalPendingDebts.toLocaleString()} <span className="text-xs font-bold text-slate-500">{business.currency}</span>
          </p>
          <button
            onClick={() => setActiveTab('customers')}
            className="text-[11px] text-amber-700 hover:text-amber-800 font-bold mt-1 inline-flex items-center gap-1"
          >
            <span>Voir le carnet de relance</span>
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>

      </div>

      {/* Breakdown Section: Payment Methods & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Payment Methods Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-slate-700" />
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Répartition des Encaissements
              </h3>
            </div>
            <span className="text-xs text-slate-400">Total : {filteredData.totalRevenue.toLocaleString()} {business.currency}</span>
          </div>

          <div className="space-y-3">
            {/* Espèces (Cash) */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-800 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Espèces (Cash)
                </span>
                <span className="font-bold text-slate-900">
                  {(filteredData.paymentMap.cash || 0).toLocaleString()} {business.currency} (
                  {filteredData.totalRevenue > 0 ? Math.round(((filteredData.paymentMap.cash || 0) / filteredData.totalRevenue) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${filteredData.totalRevenue > 0 ? ((filteredData.paymentMap.cash || 0) / filteredData.totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Orange Money */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-800 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Orange Money (OM)
                </span>
                <span className="font-bold text-slate-900">
                  {(filteredData.paymentMap.orange_money || 0).toLocaleString()} {business.currency} (
                  {filteredData.totalRevenue > 0 ? Math.round(((filteredData.paymentMap.orange_money || 0) / filteredData.totalRevenue) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                  style={{ width: `${filteredData.totalRevenue > 0 ? ((filteredData.paymentMap.orange_money || 0) / filteredData.totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Moov Money & Wave */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-800 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  Moov Money & Wave
                </span>
                <span className="font-bold text-slate-900">
                  {((filteredData.paymentMap.moov_money || 0) + (filteredData.paymentMap.wave_coris || 0)).toLocaleString()} {business.currency} (
                  {filteredData.totalRevenue > 0 ? Math.round((((filteredData.paymentMap.moov_money || 0) + (filteredData.paymentMap.wave_coris || 0)) / filteredData.totalRevenue) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                  style={{ width: `${filteredData.totalRevenue > 0 ? (((filteredData.paymentMap.moov_money || 0) + (filteredData.paymentMap.wave_coris || 0)) / filteredData.totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Ventes à Crédit */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-800 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  Ventes à Crédit (En cours)
                </span>
                <span className="font-bold text-slate-900">
                  {(filteredData.paymentMap.credit || 0).toLocaleString()} {business.currency} (
                  {filteredData.totalRevenue > 0 ? Math.round(((filteredData.paymentMap.credit || 0) / filteredData.totalRevenue) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full transition-all duration-500" 
                  style={{ width: `${filteredData.totalRevenue > 0 ? ((filteredData.paymentMap.credit || 0) / filteredData.totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 Products Sold */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-amber-600" />
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Top Articles les Plus Vendus
              </h3>
            </div>
            <span className="text-xs text-slate-400">Par quantité</span>
          </div>

          <div className="space-y-3">
            {filteredData.topProducts.length === 0 ? (
              <p className="text-slate-400 text-xs py-6 text-center">Aucune vente sur la période sélectionnée.</p>
            ) : (
              filteredData.topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                  <div className="flex items-center space-x-2.5">
                    <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-700 font-extrabold flex items-center justify-center text-[10px]">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-slate-900">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-emerald-800">{p.qty} vendus</span>
                    <span className="text-[10px] text-slate-400 block font-mono">{p.revenue.toLocaleString()} {business.currency}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Sellers & Cashiers Performance */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm sm:text-base text-slate-900">
            Performance par Vendeur / Caissier
          </h3>
          <span className="text-xs text-slate-500">{filteredData.sellersPerformance.length} collaborateur(s)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredData.sellersPerformance.map((seller, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs">
                  {seller.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-xs sm:text-sm">{seller.name}</p>
                  <p className="text-[10px] text-slate-500">{seller.count} vente(s) validée(s)</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-emerald-700 text-xs sm:text-sm">{seller.total.toLocaleString()} {business.currency}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )}

</div>
);
};
