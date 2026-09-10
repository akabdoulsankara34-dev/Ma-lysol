import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import { 
  RotateCcw, 
  Search, 
  Calendar, 
  User, 
  AlertTriangle, 
  FileText, 
  PackageCheck, 
  Receipt, 
  Clock, 
  DollarSign, 
  Filter, 
  CheckCircle2,
  ArrowDownRight,
  ShieldCheck,
  Printer
} from 'lucide-react';
import { ReceiptModal } from '../pos/ReceiptModal';

export const CancelledSalesHistory: React.FC = () => {
  const { sales, business, allUsers } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<Sale | null>(null);

  // Filter only cancelled sales
  const cancelledSales = useMemo(() => {
    return sales.filter(s => s.status === 'cancelled');
  }, [sales]);

  // Apply search and filters
  const filteredCancelledSales = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return cancelledSales.filter(sale => {
      // Search query (receiptNumber, customerName, cancellationReason, items)
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        sale.receiptNumber.toLowerCase().includes(q) ||
        (sale.customerName && sale.customerName.toLowerCase().includes(q)) ||
        (sale.cancellationReason && sale.cancellationReason.toLowerCase().includes(q)) ||
        (sale.cancelledByName && sale.cancelledByName.toLowerCase().includes(q)) ||
        (sale.sellerName && sale.sellerName.toLowerCase().includes(q)) ||
        sale.items.some(it => it.productName.toLowerCase().includes(q));

      if (!matchSearch) return false;

      // User filter
      if (selectedUserFilter !== 'all') {
        const matchUser = sale.cancelledBy === selectedUserFilter || sale.sellerId === selectedUserFilter;
        if (!matchUser) return false;
      }

      // Period filter (based on cancellation date or creation date)
      const cancelDate = new Date(sale.cancelledAt || sale.createdAt);
      if (periodFilter === 'today') {
        const cancelDateStr = (sale.cancelledAt || sale.createdAt).split('T')[0];
        if (cancelDateStr !== todayStr) return false;
      } else if (periodFilter === 'week') {
        if (cancelDate < sevenDaysAgo) return false;
      } else if (periodFilter === 'month') {
        if (cancelDate < thirtyDaysAgo) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.cancelledAt || b.createdAt).getTime() - new Date(a.cancelledAt || a.createdAt).getTime());
  }, [cancelledSales, searchQuery, selectedUserFilter, periodFilter]);

  // Summary Metrics
  const stats = useMemo(() => {
    const totalCount = cancelledSales.length;
    const totalAmount = cancelledSales.reduce((acc, s) => acc + s.total, 0);
    const totalItemsReturned = cancelledSales.reduce((acc, s) => {
      return acc + s.items.reduce((sum, it) => sum + it.quantity, 0);
    }, 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = cancelledSales.filter(s => (s.cancelledAt || s.createdAt).startsWith(todayStr)).length;
    const todayAmount = cancelledSales
      .filter(s => (s.cancelledAt || s.createdAt).startsWith(todayStr))
      .reduce((acc, s) => acc + s.total, 0);

    return {
      totalCount,
      totalAmount,
      totalItemsReturned,
      todayCount,
      todayAmount,
    };
  }, [cancelledSales]);

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'cash':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Espèces</span>;
      case 'orange_money':
        return <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded">Orange Money</span>;
      case 'moov_money':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">Moov Money</span>;
      case 'wave_coris':
        return <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded">Wave</span>;
      case 'credit':
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded">Crédit</span>;
      case 'split':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">Paiement Mixte</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded">{method}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-900 via-red-900 to-slate-900 rounded-2xl p-5 text-white shadow-lg border border-red-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-rose-300">
              <RotateCcw className="h-5 w-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight">
              Registre & Audit des Annulations de Vente
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-rose-200">
            Traçabilité complète des tickets annulés par le personnel de caisse avec justifications, motifs et réintégrations en stock.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-xs font-bold transition border border-white/20 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimer le Registre</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Annulations */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Tickets Annulés (Total)
            </span>
            <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <RotateCcw className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {stats.totalCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Dont <strong className="text-rose-700">{stats.todayCount}</strong> aujourd'hui
          </p>
        </div>

        {/* Montant Total Annulé */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Montant Total Annulé
            </span>
            <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">
            {stats.totalAmount.toLocaleString()} <span className="text-xs font-bold text-slate-500">{business.currency}</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Aujourd'hui : {stats.todayAmount.toLocaleString()} {business.currency}
          </p>
        </div>

        {/* Articles Réintégrés */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Articles Réintégrés
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PackageCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">
            +{stats.totalItemsReturned} <span className="text-xs font-bold text-slate-500">unités</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Retournées automatiquement au stock
          </p>
        </div>

        {/* Audit & Conformité */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Contrôle Caisse
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-900 mt-2">
            100%
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Justification obligatoire requise
          </p>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par N° ticket, caissier, client, motif d'annulation ou article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* User Selector Filter */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="all">Tous les utilisateurs</option>
              {allUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>

            {/* Period Selector Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setPeriodFilter('all')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  periodFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tout
              </button>
              <button
                onClick={() => setPeriodFilter('today')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  periodFilter === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => setPeriodFilter('week')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  periodFilter === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7j
              </button>
              <button
                onClick={() => setPeriodFilter('month')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  periodFilter === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                30j
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredCancelledSales.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              {cancelledSales.length === 0 ? "Aucune annulation de vente enregistrée" : "Aucun résultat pour cette recherche"}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {cancelledSales.length === 0
                ? "Toutes les ventes enregistrées en caisse sont validées. Dès qu'un caissier annule un ticket avec motif, la ligne d'audit apparaîtra ici."
                : "Modifiez vos filtres de recherche ou sélectionnez une autre période pour afficher les annulations correspondantes."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Dates & Horaires</th>
                  <th className="py-3.5 px-4">Intervenants</th>
                  <th className="py-3.5 px-4">Motif & Justification</th>
                  <th className="py-3.5 px-4">Articles Réintégrés</th>
                  <th className="py-3.5 px-4 text-right">Montant Annulé</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCancelledSales.map((sale) => {
                  const saleDate = new Date(sale.createdAt);
                  const cancelDate = sale.cancelledAt ? new Date(sale.cancelledAt) : saleDate;

                  return (
                    <tr key={sale.id} className="hover:bg-rose-50/30 transition">
                      
                      {/* Ticket Number & Payment */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">
                          {sale.receiptNumber}
                        </div>
                        <div className="mt-1">
                          {getMethodBadge(sale.paymentMethod)}
                        </div>
                        {sale.customerName && (
                          <p className="text-[11px] text-slate-500 mt-1">
                            Client : <span className="font-semibold text-slate-700">{sale.customerName}</span>
                          </p>
                        )}
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[11px] space-y-1">
                        <div className="flex items-center space-x-1 text-slate-500">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>Vente : {saleDate.toLocaleDateString('fr-FR')} {saleDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-rose-700 font-semibold">
                          <RotateCcw className="h-3 w-3 text-rose-500" />
                          <span>Annulée : {cancelDate.toLocaleDateString('fr-FR')} {cancelDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>

                      {/* Cashiers / Actors */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[11px] space-y-0.5">
                        <p className="text-slate-500">
                          Vendeur : <span className="font-semibold text-slate-800">{sale.sellerName}</span>
                        </p>
                        <p className="text-rose-700 font-semibold">
                          Annulé par : <span>{sale.cancelledByName || 'Caissier'}</span>
                        </p>
                      </td>

                      {/* Cancellation Justification / Reason */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="bg-rose-50 border border-rose-200 text-rose-900 px-3 py-2 rounded-xl text-xs space-y-1">
                          <div className="flex items-center space-x-1 font-bold text-[11px] text-rose-800">
                            <AlertTriangle className="h-3 w-3 text-rose-600 shrink-0" />
                            <span>Justification Caissier :</span>
                          </div>
                          <p className="text-[11px] leading-relaxed italic">
                            "{sale.cancellationReason || 'Non spécifié'}"
                          </p>
                        </div>
                      </td>

                      {/* Items Returned */}
                      <td className="py-3.5 px-4 text-[11px]">
                        <div className="space-y-1 max-w-xs">
                          {sale.items.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                              <span className="truncate pr-2">{it.productName}</span>
                              <span className="font-bold text-emerald-700 whitespace-nowrap">+{it.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Cancelled Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-black text-sm text-rose-600">
                          -{sale.total.toLocaleString()} {business.currency}
                        </div>
                        <div className="text-[10px] text-slate-400 line-through">
                          {sale.total.toLocaleString()} {business.currency}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedReceiptSale(sale)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center space-x-1.5 transition cursor-pointer"
                          title="Consulter le ticket d'annulation"
                        >
                          <Receipt className="h-3.5 w-3.5 text-slate-600" />
                          <span>Voir Reçu</span>
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reusable Receipt Modal with Cancelled Banner */}
      {selectedReceiptSale && (
        <ReceiptModal
          sale={selectedReceiptSale}
          business={business}
          onClose={() => setSelectedReceiptSale(null)}
        />
      )}

    </div>
  );
};
