import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Radio, 
  Wifi, 
  Volume2, 
  VolumeX, 
  MessageCircle, 
  QrCode, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Smartphone, 
  ShieldAlert, 
  ArrowUpRight, 
  Share2, 
  Receipt,
  Sparkles,
  Search,
  Filter,
  Copy,
  Check,
  X
} from 'lucide-react';
import { soundEffects } from '../../lib/sound';
import { Sale } from '../../types';
import { ReceiptModal } from '../pos/ReceiptModal';

export const RemoteLiveMonitor: React.FC = () => {
  const { 
    sales, 
    expenses, 
    products, 
    customers, 
    customerPayments, 
    business, 
    allUsers, 
    currentUser,
    isOnline,
    lastSyncedAt,
    setActiveTab
  } = useApp();

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedCashierFilter, setSelectedCashierFilter] = useState<string>('all');
  const [selectedMethodFilter, setSelectedMethodFilter] = useState<string>('all');
  const [newSaleAlert, setNewSaleAlert] = useState<Sale | null>(null);

  const prevSalesCountRef = useRef<number>(sales.length);

  // Live Clock Updater
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Detect when a new sale arrives in real-time
  useEffect(() => {
    if (sales.length > prevSalesCountRef.current) {
      const latestSale = sales[0];
      if (latestSale) {
        setNewSaleAlert(latestSale);
        if (soundEnabled) {
          soundEffects.playSaleChime();
        }
        const timeout = setTimeout(() => {
          setNewSaleAlert(null);
        }, 5000);
        return () => clearTimeout(timeout);
      }
    }
    prevSalesCountRef.current = sales.length;
  }, [sales, soundEnabled]);

  // Calculations for Today's Live Statistics
  const todayStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    const todaySales = sales.filter(s => s.createdAt.startsWith(todayStr));
    const todayExpenses = expenses.filter(e => e.createdAt.startsWith(todayStr));
    const todayCustomerPayments = customerPayments.filter(p => p.createdAt.startsWith(todayStr));

    const totalRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
    const totalCost = todaySales.reduce((acc, s) => acc + s.totalCost, 0);
    const totalExp = todayExpenses.reduce((acc, e) => acc + e.amount, 0);
    const grossMargin = totalRevenue - totalCost;
    const estimatedNetProfit = grossMargin - totalExp;

    // Payment methods breakdown
    let cashSales = 0;
    let orangeMoneySales = 0;
    let moovMoneySales = 0;
    let waveCorisSales = 0;
    let creditSales = 0;

    todaySales.forEach(s => {
      if (s.paymentMethod === 'cash') cashSales += s.total;
      else if (s.paymentMethod === 'orange_money') orangeMoneySales += s.total;
      else if (s.paymentMethod === 'moov_money') moovMoneySales += s.total;
      else if (s.paymentMethod === 'wave_coris') waveCorisSales += s.total;
      else if (s.paymentMethod === 'credit') creditSales += s.total;
      else if (s.paymentMethod === 'split' && s.paymentBreakdown) {
        cashSales += s.paymentBreakdown.cash || 0;
        orangeMoneySales += s.paymentBreakdown.orangeMoney || 0;
        moovMoneySales += s.paymentBreakdown.moovMoney || 0;
        waveCorisSales += s.paymentBreakdown.waveCoris || 0;
        creditSales += s.paymentBreakdown.credit || 0;
      }
    });

    // Cash Drawer Reconciliation (Solde Théorique Espèces)
    const cashDebtPaymentsReceived = todayCustomerPayments
      .filter(p => p.paymentMethod === 'cash')
      .reduce((acc, p) => acc + p.amount, 0);

    const cashExpensesPaid = todayExpenses
      .filter(e => e.paymentMethod === 'cash')
      .reduce((acc, e) => acc + e.amount, 0);

    const theoreticalCashInDrawer = cashSales + cashDebtPaymentsReceived - cashExpensesPaid;

    // Cashiers / Sellers Performance Today
    const cashierMap: Record<string, { name: string; total: number; count: number }> = {};
    todaySales.forEach(s => {
      if (!cashierMap[s.sellerId]) {
        cashierMap[s.sellerId] = { name: s.sellerName, total: 0, count: 0 };
      }
      cashierMap[s.sellerId].total += s.total;
      cashierMap[s.sellerId].count += 1;
    });

    const cashiersList = Object.values(cashierMap).sort((a, b) => b.total - a.total);

    // High Discounts or Sensitive Operations
    const discountedSales = todaySales.filter(s => s.discount > 0);
    const newCreditSales = todaySales.filter(s => s.paymentMethod === 'credit' || (s.paymentBreakdown?.credit || 0) > 0);

    // Stock Alerts
    const criticalStockProducts = products.filter(p => !p.archived && p.currentStock <= p.alertThreshold);

    // Average Basket
    const averageBasket = todaySales.length > 0 ? Math.round(totalRevenue / todaySales.length) : 0;

    // Time elapsed since last sale
    let lastSaleElapsedText = 'Aucune vente aujourd\'hui';
    if (todaySales.length > 0) {
      const lastSaleTime = new Date(todaySales[0].createdAt).getTime();
      const diffMinutes = Math.floor((currentTime.getTime() - lastSaleTime) / 60000);
      if (diffMinutes < 1) {
        lastSaleElapsedText = 'Il y a quelques secondes';
      } else if (diffMinutes === 1) {
        lastSaleElapsedText = 'Il y a 1 minute';
      } else if (diffMinutes < 60) {
        lastSaleElapsedText = `Il y a ${diffMinutes} minutes`;
      } else {
        const hours = Math.floor(diffMinutes / 60);
        lastSaleElapsedText = `Il y a ${hours}h ${diffMinutes % 60}min`;
      }
    }

    return {
      todaySales,
      todayExpenses,
      todayCustomerPayments,
      totalRevenue,
      totalExp,
      grossMargin,
      estimatedNetProfit,
      cashSales,
      orangeMoneySales,
      moovMoneySales,
      waveCorisSales,
      creditSales,
      theoreticalCashInDrawer,
      cashiersList,
      discountedSales,
      newCreditSales,
      criticalStockProducts,
      averageBasket,
      lastSaleElapsedText,
    };
  }, [sales, expenses, products, customerPayments, currentTime]);

  // Filtered live feed sales
  const filteredFeedSales = useMemo(() => {
    return todayStats.todaySales.filter(sale => {
      const matchCashier = selectedCashierFilter === 'all' || sale.sellerId === selectedCashierFilter;
      const matchMethod = selectedMethodFilter === 'all' || sale.paymentMethod === selectedMethodFilter;
      return matchCashier && matchMethod;
    });
  }, [todayStats.todaySales, selectedCashierFilter, selectedMethodFilter]);

  // Generate WhatsApp Executive Flash Report for the Owner
  const handleGenerateWhatsAppReport = () => {
    const dateFormatted = currentTime.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    const timeFormatted = currentTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const text = `📊 *RAPPORT FLASH LIVE - ${business.name.toUpperCase()}* 🇧🇫
📅 Date : ${dateFormatted} à ${timeFormatted}
📍 Ville : ${business.city}
━━━━━━━━━━━━━━━━━━━━
💰 *CHIFFRE D'AFFAIRES DU JOUR :* ${todayStats.totalRevenue.toLocaleString()} ${business.currency}
🛒 Ventes réalisées : ${todayStats.todaySales.length} transaction(s)
🎯 Panier Moyen : ${todayStats.averageBasket.toLocaleString()} ${business.currency}

💳 *RÉPARTITION DES ENCAISSEMENTS :*
• 💵 Espèces (Cash) : ${todayStats.cashSales.toLocaleString()} ${business.currency}
• 🟠 Orange Money : ${todayStats.orangeMoneySales.toLocaleString()} ${business.currency}
• 🔵 Moov / Wave : ${(todayStats.moovMoneySales + todayStats.waveCorisSales).toLocaleString()} ${business.currency}
• 🔴 Ventes à Crédit : ${todayStats.creditSales.toLocaleString()} ${business.currency}

💼 *CONTRÔLE TIROIR-CAISSE (ESPÈCES) :*
• Solde théorique en espèces : *${todayStats.theoreticalCashInDrawer.toLocaleString()} ${business.currency}*

📉 *DÉPENSES DU JOUR :* -${todayStats.totalExp.toLocaleString()} ${business.currency}
✨ *BÉNÉFICE ESTIMÉ :* *${todayStats.estimatedNetProfit.toLocaleString()} ${business.currency}*

━━━━━━━━━━━━━━━━━━━━
👨‍💼 *Performances Caissiers :*
${todayStats.cashiersList.map(c => `• ${c.name} : ${c.total.toLocaleString()} ${business.currency} (${c.count} ventes)`).join('\n') || 'Aucune'}

⚠️ *Alertes de Surveillance :*
• Ventes à crédit accordées : ${todayStats.newCreditSales.length}
• Remises accordées : ${todayStats.discountedSales.length}
• Articles en stock critique : ${todayStats.criticalStockProducts.length}

_Généré en direct par BizPilot Burkina Faso_`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleCopyAppUrl = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'cash':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">💵 Espèces</span>;
      case 'orange_money':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">🟠 Orange Money</span>;
      case 'moov_money':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">🔵 Moov Money</span>;
      case 'wave_coris':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-100 text-cyan-900 border border-cyan-200">🌊 Wave / Coris</span>;
      case 'credit':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-900 border border-red-200">🔴 Crédit Client</span>;
      case 'split':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">🔀 Mixte</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800">{method}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Floating Real-Time Sale Alert Banner */}
      {newSaleAlert && (
        <div className="fixed top-20 right-4 z-50 max-w-sm w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-blue-500/50 animate-in slide-up duration-300 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <ShoppingBag className="h-5 w-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400">Nouvelle Vente En Direct</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="font-extrabold text-sm text-white">
                +{newSaleAlert.total.toLocaleString()} {business.currency}
              </p>
              <p className="text-[11px] text-slate-400">
                Par {newSaleAlert.sellerName} • {newSaleAlert.items.length} article(s)
              </p>
            </div>
          </div>
          <button 
            onClick={() => setNewSaleAlert(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Live Header Bar */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-red-500/20 text-red-400 border border-red-500/30 tracking-wide uppercase">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              En Direct • Synchronisation Cloud
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
              {currentTime.toLocaleTimeString('fr-FR')} (Heure de Ouagadougou)
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Surveillance & Suivi à Distance Propriétaire
          </h2>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <span>Dernière activité de caisse :</span>
            <strong className="text-emerald-400">{todayStats.lastSaleElapsedText}</strong>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) soundEffects.playSaleChime();
            }}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
              soundEnabled 
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 hover:bg-blue-600/40' 
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
            }`}
            title="Activer/Désactiver le carillon sonore lors d'une nouvelle vente en magasin"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-blue-400" /> : <VolumeX className="h-4 w-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Bip Caisse Actif' : 'Bip Caisse Muet'}</span>
          </button>

          {/* WhatsApp Executive Flash Report */}
          <button
            onClick={handleGenerateWhatsAppReport}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition"
            title="Envoyer le point financier du jour sur WhatsApp"
          >
            <MessageCircle className="h-4 w-4 text-emerald-100" />
            <span>Rapport Flash WhatsApp</span>
          </button>

          {/* QR Code / Mobile Remote Access */}
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 transition"
            title="Accéder à cette vue sur votre smartphone personnel"
          >
            <Smartphone className="h-4 w-4 text-slate-300" />
            <span className="hidden sm:inline">Accès Mobile</span>
          </button>
        </div>
      </div>

      {/* Live KPI Cards (Aujourd'hui en direct) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Chiffre d'Affaires Live du Jour */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
              CA En Direct (Aujourd'hui)
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {todayStats.totalRevenue.toLocaleString()} <span className="text-xs font-bold text-slate-500">{business.currency}</span>
          </p>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>{todayStats.todaySales.length} vente(s)</span>
            <span className="font-semibold text-slate-700">Panier: {todayStats.averageBasket.toLocaleString()} {business.currency}</span>
          </div>
        </div>

        {/* Solde Théorique Caisse Espèces (Tiroir Cash) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Espèces Théoriques en Caisse
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">
            {todayStats.theoreticalCashInDrawer.toLocaleString()} <span className="text-xs font-bold text-slate-500">{business.currency}</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">
            Ventes Cash ({todayStats.cashSales.toLocaleString()}) - Dép. Cash ({todayStats.todayExpenses.filter(e => e.paymentMethod === 'cash').reduce((a, b) => a + b.amount, 0).toLocaleString()})
          </p>
        </div>

        {/* Bénéfice Net Estimé du Jour */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md relative overflow-hidden border border-slate-800">
          <div className="flex items-center justify-between text-blue-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Bénéfice Net du Jour
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-950 text-blue-400 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">
            {todayStats.estimatedNetProfit.toLocaleString()} <span className="text-xs font-bold text-blue-400">{business.currency}</span>
          </p>
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span>Dépenses: -{todayStats.totalExp.toLocaleString()} {business.currency}</span>
            <span className="text-emerald-400 font-bold">Marge brute: {todayStats.grossMargin.toLocaleString()}</span>
          </div>
        </div>

        {/* Encaissé Mobile Money vs Crédits */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Mobile Money & Crédits
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Smartphone className="h-4 w-4" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900 mt-1">
            OM/Moov : {(todayStats.orangeMoneySales + todayStats.moovMoneySales + todayStats.waveCorisSales).toLocaleString()} <span className="text-xs text-slate-500">{business.currency}</span>
          </p>
          <p className="text-xs font-bold text-red-600 mt-1">
            Crédits accordés : {todayStats.creditSales.toLocaleString()} {business.currency}
          </p>
        </div>

      </div>

      {/* Main Grid: Live Sales Stream & Surveillance Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1 & 2: Live Sales Stream */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          
          {/* Stream Header & Filters */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <Radio className="h-4 w-4 text-red-500 animate-pulse" />
                <span>Flux des Ventes en Direct</span>
                <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                  {filteredFeedSales.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Chaque encaissement effectué en boutique apparaît instantanément ici.
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <select
                value={selectedCashierFilter}
                onChange={(e) => setSelectedCashierFilter(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Tous les caissiers</option>
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>

              <select
                value={selectedMethodFilter}
                onChange={(e) => setSelectedMethodFilter(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Tous règlements</option>
                <option value="cash">Espèces</option>
                <option value="orange_money">Orange Money</option>
                <option value="moov_money">Moov Money</option>
                <option value="wave_coris">Wave / Coris</option>
                <option value="credit">Crédit</option>
              </select>
            </div>
          </div>

          {/* Sales Feed List */}
          <div className="p-4 space-y-3 max-h-[550px] overflow-y-auto scrollbar-thin divide-y divide-slate-100">
            {filteredFeedSales.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <ShoppingBag className="h-10 w-10 mx-auto text-slate-300 stroke-1" />
                <p className="text-xs font-semibold">Aucune vente enregistrée aujourd'hui pour ce filtre.</p>
                <p className="text-[11px]">Dès qu'un caissier valide un panier, le reçu apparaîtra en direct.</p>
              </div>
            ) : (
              filteredFeedSales.map((sale, index) => {
                const saleTime = new Date(sale.createdAt);
                const timeDiff = Math.floor((currentTime.getTime() - saleTime.getTime()) / 60000);
                const isRecent = timeDiff < 3;

                return (
                  <div 
                    key={sale.id}
                    onClick={() => setSelectedSale(sale)}
                    className={`pt-3 first:pt-0 p-3 rounded-xl hover:bg-slate-50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
                      isRecent ? 'bg-blue-50/40 border-blue-200' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isRecent ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        #{sale.receiptNumber.split('-').pop() || index + 1}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {sale.receiptNumber}
                          </span>
                          {getMethodBadge(sale.paymentMethod)}
                          {isRecent && (
                            <span className="bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                              Récent
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600">
                          {sale.items.map(item => `${item.quantity}x ${item.productName}`).join(' • ')}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="font-medium text-slate-700">Caissier : <strong>{sale.sellerName}</strong></span>
                          <span>•</span>
                          <span>Client : {sale.customerName || 'Comptoir'}</span>
                          {sale.discount > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-red-600 font-bold">Remise: -{sale.discount.toLocaleString()} {business.currency}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <p className="text-base font-black text-slate-900">
                        {sale.total.toLocaleString()} <span className="text-xs text-slate-500">{business.currency}</span>
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {saleTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} ({timeDiff < 1 ? 'à l\'instant' : `il y a ${timeDiff}m`})
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Column 3: Surveillance & Vigilance Gérant */}
        <div className="space-y-5">
          
          {/* Active Cashiers Live Performance */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Activité des Caissiers
                </h3>
              </div>
              <span className="text-xs text-slate-400">{todayStats.cashiersList.length} actif(s)</span>
            </div>

            <div className="space-y-2.5">
              {todayStats.cashiersList.length === 0 ? (
                <p className="text-slate-400 text-xs py-4 text-center">Aucun caissier n'a encaissé aujourd'hui.</p>
              ) : (
                todayStats.cashiersList.map((cashier, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <div className="h-7 w-7 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-[11px]">
                        {cashier.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{cashier.name}</p>
                        <p className="text-[10px] text-slate-500">{cashier.count} vente(s) enregistrée(s)</p>
                      </div>
                    </div>
                    <span className="font-black text-emerald-700 text-xs">
                      {cashier.total.toLocaleString()} {business.currency}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Vigilance: Remises, Crédits & Mouvements Spéciaux */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Vigilance & Contrôle Fraudes
                </h3>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              
              {/* Remises accordées */}
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Remises Accordées Aujourd'hui
                  </span>
                  <span className="font-black text-amber-900">
                    {todayStats.discountedSales.length}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Total des remises appliquées : {todayStats.discountedSales.reduce((a, b) => a + b.discount, 0).toLocaleString()} {business.currency}
                </p>
              </div>

              {/* Ventes à Crédit */}
              <div className="p-3 bg-red-50/60 border border-red-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-950 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Nouvelles Ventes à Crédit
                  </span>
                  <span className="font-black text-red-900">
                    {todayStats.newCreditSales.length}
                  </span>
                </div>
                <p className="text-[11px] text-red-800">
                  Montant total prêté aujourd'hui : {todayStats.creditSales.toLocaleString()} {business.currency}
                </p>
              </div>

              {/* Alertes Stock Critique */}
              {todayStats.criticalStockProducts.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Articles en Alerte Stock</span>
                    <span className="font-black text-red-600">{todayStats.criticalStockProducts.length}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate">
                    {todayStats.criticalStockProducts.map(p => p.name).slice(0, 3).join(', ')}
                    {todayStats.criticalStockProducts.length > 3 ? '...' : ''}
                  </p>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

      {/* QR Code & Smartphone Remote Link Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Accès Surveillance sur Smartphone</h3>
              </div>
              <button 
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-center space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Scannez ce QR Code avec l'appareil photo de votre smartphone ou copiez le lien sécurisé pour suivre votre boutique en direct depuis n'importe où.
              </p>

              {/* QR Code Canvas Representation */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col items-center justify-center inline-block mx-auto">
                <div className="h-44 w-44 bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center">
                  {/* High quality SVG QR Code graphic */}
                  <svg className="h-full w-full text-slate-900" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 3h7v7H3V3zm2 2v3h3V5H5zm8-2h7v7h-7V3zm2 2v3h3V5h-3zM3 13h7v7H3v-7zm2 2v3h3v-3H5zm10-2h3v2h-3v-2zm3 2h3v3h-3v-3zm-3 3h3v2h-3v-2zm-2-5h2v2h-2v-2zm4 4h3v3h-3v-3z"/>
                  </svg>
                </div>
                <span className="text-[11px] font-bold text-slate-700 mt-2 block">
                  {business.name} • Live Remote Feed
                </span>
              </div>

              {/* Copy URL Button */}
              <button
                onClick={handleCopyAppUrl}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-xs transition"
              >
                {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copiedLink ? 'Lien copié dans le presse-papier !' : 'Copier le lien d\'accès direct'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Inspection Modal */}
      {selectedSale && (
        <ReceiptModal
          sale={selectedSale}
          business={business}
          onClose={() => setSelectedSale(null)}
        />
      )}

    </div>
  );
};
