import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer, CustomerPayment, PaymentMethod } from '../../types';
import { 
  Users, 
  UserPlus, 
  Phone, 
  MessageCircle, 
  CreditCard, 
  AlertCircle, 
  Calendar, 
  CheckCircle2, 
  Search, 
  DollarSign, 
  History,
  X,
  Send,
  UserCheck,
  Award,
  Sparkles,
  Gift,
  Plus,
  Minus
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { 
    customers, 
    customerPayments, 
    addCustomer, 
    updateCustomer, 
    recordCustomerPayment, 
    addLoyaltyPoints,
    business, 
    currentUser,
    sales
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDebtOnly, setFilterDebtOnly] = useState(false);
  const [filterLoyaltyOnly, setFilterLoyaltyOnly] = useState(false);

  // Modals
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [repayCustomer, setRepayCustomer] = useState<Customer | null>(null);
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [repayMethod, setRepayMethod] = useState<PaymentMethod>('orange_money');
  const [repayNotes, setRepayNotes] = useState<string>('');

  // Loyalty Modal
  const [loyaltyCustomer, setLoyaltyCustomer] = useState<Customer | null>(null);
  const [pointsAdjustment, setPointsAdjustment] = useState<number>(50);

  // WhatsApp Reminder Modal
  const [whatsappCustomer, setWhatsappCustomer] = useState<Customer | null>(null);
  const [customMessage, setCustomMessage] = useState<string>('');

  // Customer Detail Drawer
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<Customer | null>(null);

  // Form for New Customer
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+226 ');
  const [address, setAddress] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Total Debt metric
  const totalDebts = useMemo(() => {
    return customers.reduce((acc, c) => acc + (c.totalDebt || 0), 0);
  }, [customers]);

  const totalLoyaltyPoints = useMemo(() => {
    return customers.reduce((acc, c) => acc + (c.loyaltyPoints || 0), 0);
  }, [customers]);

  const debtorCustomers = useMemo(() => {
    return customers.filter(c => (c.totalDebt || 0) > 0);
  }, [customers]);

  const overdueCustomers = useMemo(() => {
    return customers.filter(c => (c.totalDebt || 0) > 0 && c.dueDate && c.dueDate < todayStr);
  }, [customers, todayStr]);

  // Filtered List
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (filterDebtOnly && c.totalDebt <= 0) return false;
      if (filterLoyaltyOnly && (c.loyaltyPoints || 0) <= 0) return false;
      const search = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(search) ||
        c.phone.toLowerCase().includes(search) ||
        (c.address && c.address.toLowerCase().includes(search))
      );
    });
  }, [customers, filterDebtOnly, filterLoyaltyOnly, searchQuery]);

  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    await addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
    });

    setShowAddCustomerModal(false);
    setName('');
    setPhone('+226 ');
    setAddress('');
    setDueDate('');
    setNotes('');
  };

  const handleRecordRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayCustomer || repayAmount <= 0) return;

    await recordCustomerPayment(
      repayCustomer.id,
      Number(repayAmount),
      repayMethod,
      repayNotes.trim() || undefined
    );

    setRepayCustomer(null);
    setRepayAmount(0);
    setRepayNotes('');
  };

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loyaltyCustomer) return;

    await addLoyaltyPoints(loyaltyCustomer.id, pointsAdjustment);
    setLoyaltyCustomer(null);
    setPointsAdjustment(50);
  };

  // Open WhatsApp message modal with prefilled template
  const handleOpenWhatsAppModal = (c: Customer) => {
    setWhatsappCustomer(c);
    const dueDateText = c.dueDate ? ` avant le ${new Date(c.dueDate).toLocaleDateString('fr-FR')}` : '';
    const text = `Bonjour ${c.name},\n\nVotre solde restant auprès de *${business.name}* est de *${c.totalDebt.toLocaleString()} ${business.currency}*${dueDateText}.\n\nMerci de bien vouloir passer régulariser ou effectuer votre paiement via Orange Money / Moov Money au : *${business.phone}*.\n\nBonne journée à vous !`;
    setCustomMessage(text);
  };

  const handleSendWhatsApp = () => {
    if (!whatsappCustomer) return;
    const cleanPhone = whatsappCustomer.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customMessage)}`;
    window.open(url, '_blank');
    setWhatsappCustomer(null);
  };

  const getTier = (points: number = 0) => {
    if (points >= 500) return { name: 'VIP Platine', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
    if (points >= 200) return { name: 'Or', color: 'bg-amber-100 text-amber-900 border-amber-300' };
    if (points >= 50) return { name: 'Argent', color: 'bg-slate-200 text-slate-800 border-slate-300' };
    return { name: 'Bronze', color: 'bg-orange-50 text-orange-800 border-orange-200' };
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Clients, Crédits & Programme Fidélité
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Suivi des créances, relances WhatsApp en 1 clic et points de fidélité récompensant les meilleurs acheteurs.
          </p>
        </div>

        <button
          id="btn-add-customer"
          onClick={() => setShowAddCustomerModal(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Nouveau Client</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Pending Debt */}
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900">Total Créances à Recouvrer</p>
          <p className="text-xl sm:text-2xl font-black text-amber-950 mt-1">
            {totalDebts.toLocaleString()} <span className="text-xs font-semibold text-amber-800">{business.currency}</span>
          </p>
          <p className="text-[11px] text-amber-700 mt-1">{debtorCustomers.length} client(s) débiteur(s)</p>
        </div>

        {/* Overdue Debts */}
        <div className="bg-red-50 p-4 rounded-2xl border border-red-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-red-900">Échéances Dépassées</p>
          <p className="text-xl sm:text-2xl font-black text-red-950 mt-1">
            {overdueCustomers.length} client(s)
          </p>
          <p className="text-[11px] text-red-700 mt-1">Rappels WhatsApp recommandés</p>
        </div>

        {/* Total Loyalty Points */}
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">Cagnotte Points Fidélité</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-950 mt-1">
            {totalLoyaltyPoints.toLocaleString()} <span className="text-xs font-semibold text-emerald-800">Pts</span>
          </p>
          <p className="text-[11px] text-emerald-700 mt-1">1 pt = 1000 FCFA d'achat</p>
        </div>

        {/* Total Customers */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Répertoire Clients</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {customers.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Clients enregistrés</p>
        </div>

      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone ou quartier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => {
              setFilterDebtOnly(!filterDebtOnly);
              setFilterLoyaltyOnly(false);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              filterDebtOnly 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Dettes ({debtorCustomers.length})</span>
          </button>

          <button
            onClick={() => {
              setFilterLoyaltyOnly(!filterLoyaltyOnly);
              setFilterDebtOnly(false);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              filterLoyaltyOnly 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Fidélité &gt; 0</span>
          </button>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-3">Téléphone</th>
                <th className="py-3.5 px-3 text-center">Fidélité & Rang</th>
                <th className="py-3.5 px-3">Solde Dû (Crédit)</th>
                <th className="py-3.5 px-3">Échéance</th>
                <th className="py-3.5 px-4 text-right">Actions Rapides</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Aucun client trouvé.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => {
                  const hasDebt = c.totalDebt > 0;
                  const isOverdue = hasDebt && c.dueDate && c.dueDate < todayStr;
                  const points = c.loyaltyPoints || 0;
                  const tier = getTier(points);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                            isOverdue ? 'bg-red-600' : hasDebt ? 'bg-amber-600' : 'bg-blue-600'
                          }`}>
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm">{c.name}</p>
                            {c.address && <p className="text-[10px] text-slate-400 truncate max-w-xs">{c.address}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {c.phone}
                      </td>

                      {/* Loyalty Tier */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${tier.color}`}>
                            {tier.name}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">
                            {points} <span className="text-[10px] text-slate-400 font-normal">pts</span>
                          </span>
                        </div>
                      </td>

                      {/* Debt Amount */}
                      <td className="py-3 px-3">
                        {hasDebt ? (
                          <span className={`font-black text-xs px-2 py-0.5 rounded-md ${
                            isOverdue ? 'bg-red-100 text-red-900' : 'bg-amber-100 text-amber-900'
                          }`}>
                            {c.totalDebt.toLocaleString()} {business.currency}
                          </span>
                        ) : (
                          <span className="text-blue-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> À jour (0)
                          </span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-3">
                        {c.dueDate ? (
                          <span className={`text-[11px] font-medium font-mono ${
                            isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'
                          }`}>
                            {new Date(c.dueDate).toLocaleDateString('fr-FR')} {isOverdue && '(Retard !)'}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Adjust Loyalty Points */}
                        <button
                          onClick={() => setLoyaltyCustomer(c)}
                          className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition cursor-pointer"
                          title="Gérer les points de fidélité"
                        >
                          <Award className="h-4 w-4" />
                        </button>

                        {/* Record Repayment */}
                        {hasDebt && (
                          <button
                            onClick={() => {
                              setRepayCustomer(c);
                              setRepayAmount(c.totalDebt);
                            }}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                            title="Enregistrer un remboursement"
                          >
                            Régulariser
                          </button>
                        )}

                        {/* Send WhatsApp Reminder */}
                        {hasDebt && (
                          <button
                            onClick={() => handleOpenWhatsAppModal(c)}
                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition cursor-pointer"
                            title="Rappel WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </button>
                        )}

                        {/* Customer Details */}
                        <button
                          onClick={() => setSelectedCustomerDetail(c)}
                          className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs transition cursor-pointer"
                          title="Historique du client"
                        >
                          <History className="h-4 w-4" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL GESTION POINTS FIDÉLITÉ */}
      {loyaltyCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base">Points Fidélité : {loyaltyCustomer.name}</h3>
              </div>
              <button
                onClick={() => setLoyaltyCustomer(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustPoints} className="p-5 space-y-4">
              <div className="bg-emerald-50 p-4 rounded-2xl text-center border border-emerald-200">
                <div className="text-xs text-emerald-800 font-semibold">Solde de Points Actuel</div>
                <div className="text-3xl font-black text-emerald-900 mt-1">
                  {(loyaltyCustomer.loyaltyPoints || 0).toLocaleString()} <span className="text-sm font-normal">Pts</span>
                </div>
                <div className="text-xs text-emerald-700 mt-1">
                  Rang : {getTier(loyaltyCustomer.loyaltyPoints || 0).name}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ajustement de points (Positif = gain, Négatif = utilisation)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[20, 50, 100, -50].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPointsAdjustment(val)}
                      className={`py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                        pointsAdjustment === val
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {val > 0 ? `+${val}` : val}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={pointsAdjustment}
                  onChange={(e) => setPointsAdjustment(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-center text-sm"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl flex justify-between text-xs text-slate-700">
                <span>Nouveau Solde Prévu :</span>
                <span className="font-black text-slate-900">
                  {Math.max(0, (loyaltyCustomer.loyaltyPoints || 0) + pointsAdjustment)} Pts
                </span>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setLoyaltyCustomer(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Valider l'Ajustement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base">Ajouter un Client</h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom Complet du Client *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mme Traoré Fatou"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Numéro de Téléphone *</label>
                <input
                  type="tel"
                  required
                  placeholder="+226 70 00 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adresse / Quartier</label>
                <input
                  type="text"
                  placeholder="Ex: Ouaga 2000, Secteur 15"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date d'échéance crédit par défaut</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note particulière</label>
                <input
                  type="text"
                  placeholder="Ex: Client régulier, boutique voisine..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Enregistrer le Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD REPAYMENT MODAL */}
      {repayCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm sm:text-base">Règlement de Créance</h3>
                <p className="text-xs text-slate-400">Client: {repayCustomer.name}</p>
              </div>
              <button
                onClick={() => setRepayCustomer(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordRepayment} className="p-5 space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center text-xs">
                <span className="font-semibold text-amber-900">Montant total restant dû :</span>
                <span className="font-black text-sm text-amber-950">
                  {repayCustomer.totalDebt.toLocaleString()} {business.currency}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Montant Remboursé ({business.currency}) *</label>
                <input
                  type="number"
                  min="1"
                  max={repayCustomer.totalDebt}
                  required
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Canal d'Encaissement *</label>
                <select
                  value={repayMethod}
                  onChange={(e) => setRepayMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="orange_money">Orange Money (OM)</option>
                  <option value="cash">Espèces (Cash en magasin)</option>
                  <option value="moov_money">Moov Money</option>
                  <option value="wave_coris">Wave / Coris Money</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note ou référence de transfert</label>
                <input
                  type="text"
                  placeholder="Ex: Réf OM #736291 ou Reçu manuel"
                  value={repayNotes}
                  onChange={(e) => setRepayNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-950 flex justify-between font-semibold">
                <span>Nouveau solde après règlement :</span>
                <span className="text-sm font-black text-blue-900">
                  {Math.max(0, repayCustomer.totalDebt - Number(repayAmount)).toLocaleString()} {business.currency}
                </span>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRepayCustomer(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Enregistrer l'Encaissement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WHATSAPP REMINDER MODAL */}
      {whatsappCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base">Relance WhatsApp</h3>
              </div>
              <button
                onClick={() => setWhatsappCustomer(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600">
                Message pré-rempli pour <span className="font-bold text-slate-900">{whatsappCustomer.name}</span> ({whatsappCustomer.phone}) :
              </p>

              <textarea
                rows={6}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setWhatsappCustomer(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs flex items-center space-x-2 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>Ouvrir WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER DETAIL MODAL */}
      {selectedCustomerDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">{selectedCustomerDetail.name}</h3>
                <p className="text-xs text-slate-400">{selectedCustomerDetail.phone} • {selectedCustomerDetail.address || 'Ouagadougou'}</p>
              </div>
              <button
                onClick={() => setSelectedCustomerDetail(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              
              {/* Solde & Points */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-amber-800 font-semibold text-xs">Solde Dû Actuel :</p>
                  <p className="text-xl font-black text-amber-950">{selectedCustomerDetail.totalDebt.toLocaleString()} {business.currency}</p>
                  {selectedCustomerDetail.dueDate && (
                    <p className="text-[10px] text-amber-700 mt-1">Échéance: {selectedCustomerDetail.dueDate}</p>
                  )}
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-emerald-800 font-semibold text-xs">Points de Fidélité :</p>
                  <p className="text-xl font-black text-emerald-950">{(selectedCustomerDetail.loyaltyPoints || 0).toLocaleString()} Pts</p>
                  <p className="text-[10px] text-emerald-700 mt-1">Niveau : {getTier(selectedCustomerDetail.loyaltyPoints || 0).name}</p>
                </div>
              </div>

              {/* Historique des remboursements du client */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Historique des Règlements Reçus</h4>
                {customerPayments.filter(p => p.customerId === selectedCustomerDetail.id).length === 0 ? (
                  <p className="text-slate-400 text-xs italic py-2">Aucun remboursement enregistré pour ce client.</p>
                ) : (
                  <div className="space-y-1.5">
                    {customerPayments
                      .filter(p => p.customerId === selectedCustomerDetail.id)
                      .map(pay => (
                        <div key={pay.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                          <div>
                            <p className="font-bold text-emerald-800">+{pay.amount.toLocaleString()} {business.currency}</p>
                            <p className="text-[10px] text-slate-500">
                              {new Date(pay.createdAt).toLocaleDateString('fr-FR')} • Mode: {pay.paymentMethod}
                            </p>
                          </div>
                          <span className="text-[10px] text-slate-400">Reçu par {pay.recordedByName}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Achats à crédit de ce client */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Achats à Crédit Liés</h4>
                {sales.filter(s => s.customerId === selectedCustomerDetail.id && s.paymentMethod === 'credit').length === 0 ? (
                  <p className="text-slate-400 text-xs italic py-2">Aucun ticket de crédit récent.</p>
                ) : (
                  <div className="space-y-1.5">
                    {sales
                      .filter(s => s.customerId === selectedCustomerDetail.id && s.paymentMethod === 'credit')
                      .map(sale => (
                        <div key={sale.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                          <div>
                            <p className="font-bold text-slate-900">Ticket {sale.receiptNumber} — {sale.total.toLocaleString()} {business.currency}</p>
                            <p className="text-[10px] text-slate-500">
                              {new Date(sale.createdAt).toLocaleDateString('fr-FR')} • {sale.items.length} article(s)
                            </p>
                          </div>
                          <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-semibold">Crédit</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
