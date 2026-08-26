import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer, PaymentMethod, Sale } from '../../types';
import { 
  X, 
  Banknote, 
  Smartphone, 
  CreditCard, 
  Split, 
  AlertCircle, 
  Check, 
  Coins,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CheckoutModalProps {
  totalAmount: number;
  subtotal: number;
  discount: number;
  selectedCustomerId?: string;
  onSuccess: (sale: Sale) => void;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  totalAmount,
  subtotal,
  discount,
  selectedCustomerId,
  onSuccess,
  onClose,
}) => {
  const { business, customers, addCustomer, completeSale } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerId, setCustomerId] = useState<string>(selectedCustomerId || '');
  const [receivedAmount, setReceivedAmount] = useState<number>(totalAmount);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Split payment state
  const [splitCash, setSplitCash] = useState<number>(Math.floor(totalAmount / 2));
  const [splitMobile, setSplitMobile] = useState<number>(totalAmount - Math.floor(totalAmount / 2));
  const [splitMobileType, setSplitMobileType] = useState<'orangeMoney' | 'moovMoney' | 'waveCoris'>('orangeMoney');

  // New quick customer state
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  const selectedCustomer = customers.find(c => c.id === customerId);

  // Change computation for cash
  const changeToReturn = Math.max(0, receivedAmount - totalAmount);

  // Rapid tender buttons for West African CFA Francs
  const tenderShortcuts = [
    totalAmount,
    Math.ceil(totalAmount / 1000) * 1000,
    Math.ceil(totalAmount / 2000) * 2000,
    Math.ceil(totalAmount / 5000) * 5000,
    Math.ceil(totalAmount / 10000) * 10000,
    20000
  ].filter((v, idx, self) => v >= totalAmount && self.indexOf(v) === idx).slice(0, 4);

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) return;
    try {
      const created = await addCustomer({
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
      });
      setCustomerId(created.id);
      setShowAddCustomer(false);
      setNewCustName('');
      setNewCustPhone('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleValidate = async () => {
    setErrorMessage(null);

    // Validation for credit sale
    if (paymentMethod === 'credit') {
      if (!customerId || customerId === 'cust_comptoir') {
        setErrorMessage('Veuillez sélectionner un client identifié avec un numéro de téléphone pour accorder un crédit.');
        return;
      }
    }

    if (paymentMethod === 'split') {
      if (splitCash + splitMobile !== totalAmount) {
        setErrorMessage(`Le total ventilé (${(splitCash + splitMobile).toLocaleString()} ${business.currency}) doit être exactement égal au montant total (${totalAmount.toLocaleString()} ${business.currency}).`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const splitDetails = paymentMethod === 'split' ? {
        cash: splitCash,
        [splitMobileType]: splitMobile,
      } : undefined;

      const sale = await completeSale(
        paymentMethod,
        customerId || undefined,
        selectedCustomer?.name,
        discount,
        splitDetails,
        notes.trim() || undefined
      );

      // Trigger celebratory confetti burst
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#2563eb', '#0284c7', '#3b82f6']
        });
      } catch (e) {
        // ignore in non-canvas environments
      }

      onSuccess(sale);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la validation de la vente');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base sm:text-lg">Finaliser l'Encaissement</h3>
            <p className="text-xs text-slate-300">
              Total à payer : <span className="font-extrabold text-blue-400 text-sm">{totalAmount.toLocaleString()} {business.currency}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Payment Method Selector Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Mode de Paiement
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* Espèces / Cash */}
              <button
                type="button"
                id="pm-cash"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                  paymentMethod === 'cash'
                    ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Banknote className={`h-5 w-5 ${paymentMethod === 'cash' ? 'text-blue-600' : 'text-slate-500'}`} />
                <span className="text-xs mt-2">Espèces (Cash)</span>
              </button>

              {/* Orange Money */}
              <button
                type="button"
                id="pm-om"
                onClick={() => setPaymentMethod('orange_money')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                  paymentMethod === 'orange_money'
                    ? 'border-orange-600 bg-orange-50 text-orange-950 ring-2 ring-orange-500/20 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="h-5 w-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">
                  OM
                </div>
                <span className="text-xs mt-2">Orange Money</span>
              </button>

              {/* Moov Money */}
              <button
                type="button"
                id="pm-moov"
                onClick={() => setPaymentMethod('moov_money')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                  paymentMethod === 'moov_money'
                    ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="h-5 w-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
                  MV
                </div>
                <span className="text-xs mt-2">Moov Money</span>
              </button>

              {/* Wave / Coris */}
              <button
                type="button"
                id="pm-wave"
                onClick={() => setPaymentMethod('wave_coris')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                  paymentMethod === 'wave_coris'
                    ? 'border-cyan-600 bg-cyan-50 text-cyan-950 ring-2 ring-cyan-500/20 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Smartphone className={`h-5 w-5 ${paymentMethod === 'wave_coris' ? 'text-cyan-600' : 'text-slate-500'}`} />
                <span className="text-xs mt-2">Wave / Coris</span>
              </button>

              {/* Vente à Crédit */}
              <button
                type="button"
                id="pm-credit"
                onClick={() => setPaymentMethod('credit')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                  paymentMethod === 'credit'
                    ? 'border-red-600 bg-red-50 text-red-950 ring-2 ring-red-500/20 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <CreditCard className={`h-5 w-5 ${paymentMethod === 'credit' ? 'text-red-600' : 'text-slate-500'}`} />
                <span className="text-xs mt-2">Vente à Crédit</span>
              </button>

              {/* Paiement Mixte */}
              <button
                type="button"
                id="pm-split"
                onClick={() => setPaymentMethod('split')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                  paymentMethod === 'split'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Split className={`h-5 w-5 ${paymentMethod === 'split' ? 'text-indigo-600' : 'text-slate-500'}`} />
                <span className="text-xs mt-2">Paiement Mixte</span>
              </button>
            </div>
          </div>

          {/* Conditional Sub-panel based on chosen Payment Method */}
          {paymentMethod === 'cash' && (
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-blue-950">Montant Reçu en Espèces :</label>
                <span className="text-xs text-blue-700">Calcul du rendu monnaie</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="input-received-cash"
                  type="number"
                  value={receivedAmount || ''}
                  onChange={(e) => setReceivedAmount(Number(e.target.value))}
                  className="w-full bg-white border border-blue-300 rounded-lg px-3 py-2 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="font-bold text-xs text-slate-700 shrink-0">{business.currency}</span>
              </div>

              {/* Rapid tender shortcuts */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tenderShortcuts.map((val, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setReceivedAmount(val)}
                    className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-blue-50 border border-blue-200 rounded-md text-blue-900 transition shadow-2xs"
                  >
                    {val.toLocaleString()} {business.currency}
                  </button>
                ))}
              </div>

              {/* Rendu Monnaie / Change */}
              <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-xs">
                <span className="font-medium text-blue-950">Monnaie à rendre au client :</span>
                <span className={`text-sm font-extrabold px-2 py-0.5 rounded ${
                  changeToReturn > 0 ? 'bg-amber-100 text-amber-900 font-mono' : 'text-slate-600'
                }`}>
                  {changeToReturn.toLocaleString()} {business.currency}
                </span>
              </div>
            </div>
          )}

          {paymentMethod === 'split' && (
            <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-3 text-xs">
              <p className="font-semibold text-indigo-950">Ventilation du paiement :</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-indigo-900 font-medium mb-1">Montant Espèces (Cash) :</label>
                  <input
                    type="number"
                    value={splitCash}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSplitCash(val);
                      setSplitMobile(Math.max(0, totalAmount - val));
                    }}
                    className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-indigo-900 font-medium mb-1">Mobile Money :</label>
                  <input
                    type="number"
                    value={splitMobile}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSplitMobile(val);
                      setSplitCash(Math.max(0, totalAmount - val));
                    }}
                    className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-600">Opérateur Mobile :</span>
                <select
                  value={splitMobileType}
                  onChange={(e) => setSplitMobileType(e.target.value as any)}
                  className="bg-white border border-indigo-300 rounded px-2 py-1 text-xs"
                >
                  <option value="orangeMoney">Orange Money (OM)</option>
                  <option value="moovMoney">Moov Money</option>
                  <option value="waveCoris">Wave / Coris</option>
                </select>
              </div>
            </div>
          )}

          {/* Customer Selection Box */}
          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Client (Facultatif ou Obligatoire pour Crédit)
              </label>
              <button
                type="button"
                onClick={() => setShowAddCustomer(!showAddCustomer)}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Nouveau Client</span>
              </button>
            </div>

            {showAddCustomer && (
              <form onSubmit={handleQuickAddCustomer} className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-3 space-y-2">
                <p className="text-xs font-bold text-slate-800">Ajout rapide de client :</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nom du client (ex: M. Kaboré)"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Tél: +226 70..."
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomer(false)}
                    className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-200 rounded"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700"
                  >
                    Enregistrer & Sélectionner
                  </button>
                </div>
              </form>
            )}

            <select
              id="select-customer-pos"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Client Comptoir (Anonyme)</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) {c.totalDebt > 0 ? `— Dette en cours : ${c.totalDebt.toLocaleString()} ${business.currency}` : ''}
                </option>
              ))}
            </select>

            {selectedCustomer && selectedCustomer.totalDebt > 0 && (
              <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between">
                <div>
                  <p className="font-semibold">⚠️ Attention : Client avec dette active</p>
                  <p className="text-[11px] text-amber-700">Solde dû actuel : {selectedCustomer.totalDebt.toLocaleString()} {business.currency}</p>
                </div>
                {selectedCustomer.dueDate && (
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono">
                    Échéance: {selectedCustomer.dueDate}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Notes / Reference */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Note ou Référence transaction (Facultatif)
            </label>
            <input
              type="text"
              placeholder="Ex: Réf Orange Money #928374..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            Retour au panier
          </button>

          <button
            type="button"
            id="btn-confirm-pos-sale"
            disabled={isSubmitting}
            onClick={handleValidate}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs flex items-center space-x-2 transition"
          >
            <Check className="h-4 w-4" />
            <span>{isSubmitting ? 'Validation...' : `Encaisser ${totalAmount.toLocaleString()} ${business.currency}`}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
