import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Expense, ExpenseCategory, PaymentMethod } from '../../types';
import { 
  Receipt, 
  PlusCircle, 
  Search, 
  Filter, 
  Calendar, 
  Banknote, 
  Zap, 
  Droplet, 
  Truck, 
  Home, 
  PhoneCall, 
  Wrench, 
  Briefcase, 
  HelpCircle,
  X,
  TrendingDown
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { expenses, addExpense, business, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [category, setCategory] = useState<ExpenseCategory>('electricity_sonabel');
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState<number>(5000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('orange_money');
  const [beneficiary, setBeneficiary] = useState('');
  const [notes, setNotes] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Total Expenses Metrics
  const todayTotalExpenses = useMemo(() => {
    return expenses
      .filter(e => e.createdAt.startsWith(todayStr))
      .reduce((acc, e) => acc + e.amount, 0);
  }, [expenses, todayStr]);

  const monthTotalExpenses = useMemo(() => {
    return expenses
      .filter(e => new Date(e.createdAt) >= thirtyDaysAgo)
      .reduce((acc, e) => acc + e.amount, 0);
  }, [expenses, thirtyDaysAgo]);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !beneficiary.trim()) return;

    await addExpense({
      category,
      customCategory: category === 'other' ? customCategory.trim() : undefined,
      amount: Number(amount),
      paymentMethod,
      beneficiary: beneficiary.trim(),
      notes: notes.trim() || undefined,
    });

    setShowAddModal(false);
    setAmount(5000);
    setBeneficiary('');
    setNotes('');
    setCustomCategory('');
  };

  const getCategoryInfo = (cat: ExpenseCategory, custom?: string) => {
    switch (cat) {
      case 'electricity_sonabel':
        return { label: 'Électricité SONABEL', icon: Zap, color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'water_onea':
        return { label: 'Eau ONEA', icon: Droplet, color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'transport':
        return { label: 'Transport / Carburant', icon: Truck, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
      case 'rent':
        return { label: 'Loyer Magasin', icon: Home, color: 'text-purple-600 bg-purple-50 border-purple-200' };
      case 'salaries':
        return { label: 'Salaires & Avances', icon: Briefcase, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
      case 'communication':
        return { label: 'Téléphone & Internet', icon: PhoneCall, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' };
      case 'repairs':
        return { label: 'Réparation & Maintenance', icon: Wrench, color: 'text-orange-600 bg-orange-50 border-orange-200' };
      case 'goods_purchase':
        return { label: 'Fournitures & Emballages', icon: Receipt, color: 'text-rose-600 bg-rose-50 border-rose-200' };
      case 'taxes':
        return { label: 'Impôts & Taxes', icon: Banknote, color: 'text-red-600 bg-red-50 border-red-200' };
      default:
        return { label: custom || 'Divers & Autres', icon: HelpCircle, color: 'text-slate-600 bg-slate-50 border-slate-200' };
    }
  };

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (selectedCategoryFilter !== 'all' && e.category !== selectedCategoryFilter) return false;
      const search = searchQuery.toLowerCase();
      return (
        e.beneficiary.toLowerCase().includes(search) ||
        (e.notes && e.notes.toLowerCase().includes(search)) ||
        e.recordedByName.toLowerCase().includes(search)
      );
    });
  }, [expenses, selectedCategoryFilter, searchQuery]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Dépenses & Sorties de Caisse
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Enregistrement des factures SONABEL, loyer, salaires, transport et frais d'exploitation.
          </p>
        </div>

        <button
          id="btn-add-expense"
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Enregistrer une Dépense</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        
        {/* Today's Expenses */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Dépenses du Jour</p>
          <p className="text-xl sm:text-2xl font-black text-red-600 mt-1">
            -{todayTotalExpenses.toLocaleString()} <span className="text-xs font-semibold text-slate-500">{business.currency}</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Sorties de caisse d'aujourd'hui</p>
        </div>

        {/* 30-Day Total Expenses */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Dépenses des 30 Derniers Jours</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            -{monthTotalExpenses.toLocaleString()} <span className="text-xs font-semibold text-slate-500">{business.currency}</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Charges d'exploitation du mois</p>
        </div>

        {/* Total Operations Count */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Opérations</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {expenses.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Justificatifs comptabilisés</p>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par bénéficiaire ou motif..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Toutes les catégories</option>
            <option value="electricity_sonabel">Électricité SONABEL</option>
            <option value="water_onea">Eau ONEA</option>
            <option value="transport">Transport / Carburant</option>
            <option value="rent">Loyer Magasin</option>
            <option value="salaries">Salaires & Avances</option>
            <option value="communication">Téléphone & Internet</option>
            <option value="repairs">Réparations & Entretien</option>
            <option value="goods_purchase">Fournitures & Emballages</option>
            <option value="taxes">Impôts & Taxes</option>
            <option value="other">Divers & Autres</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-3">Catégorie</th>
                <th className="py-3.5 px-3">Bénéficiaire & Motif</th>
                <th className="py-3.5 px-3">Mode de Paiement</th>
                <th className="py-3.5 px-3">Montant</th>
                <th className="py-3.5 px-4 text-right">Enregistré par</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Aucune dépense trouvée.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(exp => {
                  const catInfo = getCategoryInfo(exp.category, exp.customCategory);
                  const Icon = catInfo.icon;

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/70 transition">
                      
                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(exp.createdAt).toLocaleDateString('fr-FR')}
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${catInfo.color}`}>
                          <Icon className="h-3 w-3" />
                          <span>{catInfo.label}</span>
                        </span>
                      </td>

                      {/* Beneficiary & Notes */}
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">{exp.beneficiary}</p>
                        {exp.notes && <p className="text-[11px] text-slate-400">{exp.notes}</p>}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-3 font-mono text-slate-600 capitalize">
                        {exp.paymentMethod.replace('_', ' ')}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 font-black text-red-600 text-xs sm:text-sm">
                        -{exp.amount.toLocaleString()} {business.currency}
                      </td>

                      {/* Recorded by */}
                      <td className="py-3 px-4 text-right text-slate-500 text-[11px]">
                        {exp.recordedByName}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW EXPENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base">Enregistrer une Sortie de Caisse / Dépense</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie de Dépense *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="electricity_sonabel">⚡ Électricité SONABEL</option>
                  <option value="water_onea">💧 Eau ONEA</option>
                  <option value="transport">🚚 Transport de Marchandises / Carburant</option>
                  <option value="rent">🏠 Loyer Magasin</option>
                  <option value="salaries">💼 Salaires / Avances Employés</option>
                  <option value="communication">📞 Forfait Téléphone & Internet (Orange/Moov)</option>
                  <option value="repairs">🛠️ Réparation & Maintenance</option>
                  <option value="goods_purchase">📦 Emballages / Fournitures</option>
                  <option value="taxes">🏛️ Impôts / Taxes / Patente</option>
                  <option value="other">❓ Autre / Divers</option>
                </select>
              </div>

              {category === 'other' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Préciser la catégorie</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Frais bancaires, Don..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Montant Payé ({business.currency}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-red-300 rounded-xl px-3 py-2 text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bénéficiaire *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: SONABEL, M. Kaboré (Loyer), Chauffeur Tricycle..."
                  value={beneficiary}
                  onChange={(e) => setBeneficiary(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mode de règlement *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="orange_money">Orange Money (OM)</option>
                  <option value="cash">Espèces (Sortie de la Caisse)</option>
                  <option value="moov_money">Moov Money</option>
                  <option value="wave_coris">Wave / Coris</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Commentaire / N° Facture</label>
                <input
                  type="text"
                  placeholder="Ex: Facture SONABEL mois d'août #92348"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs"
                >
                  Valider la Dépense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
