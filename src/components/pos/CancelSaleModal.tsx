import React, { useState } from 'react';
import { Sale, Business } from '../../types';
import { 
  AlertTriangle, 
  RotateCcw, 
  X, 
  CheckCircle2, 
  PackageCheck, 
  FileText,
  User,
  Clock
} from 'lucide-react';

interface CancelSaleModalProps {
  sale: Sale;
  business: Business;
  onClose: () => void;
  onConfirmCancel: (saleId: string, reason: string) => Promise<void>;
}

const COMMON_REASONS = [
  'Erreur de saisie caisse / mauvais article',
  'Le client a changé d’avis avant de partir',
  'Article défectueux / endommagé',
  'Erreur de moyen de paiement / Transaction rejetée',
  'Double enregistrement du ticket',
  'Retour client au comptoir',
];

export const CancelSaleModal: React.FC<CancelSaleModalProps> = ({
  sale,
  business,
  onClose,
  onConfirmCancel,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanReason = reason.trim();
    if (!cleanReason) {
      setError("Veuillez indiquer le motif ou la justification de l'annulation.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirmCancel(sale.id, cleanReason);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'annulation de la vente.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg leading-tight">
                Annuler la Vente
              </h3>
              <p className="text-xs text-rose-100 mt-0.5">
                Ticket N° <span className="font-bold underline">{sale.receiptNumber}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          
          {/* Sale Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center space-x-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>{new Date(sale.createdAt).toLocaleDateString('fr-FR')} à {new Date(sale.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </span>
              <span className="text-slate-500 flex items-center space-x-1">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span>Vendeur : {sale.sellerName}</span>
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 font-bold text-sm">
              <span className="text-slate-700">Montant du ticket :</span>
              <span className="text-rose-600 text-base font-black">
                {sale.total.toLocaleString()} {business.currency}
              </span>
            </div>

            {/* Articles re-credited badge */}
            <div className="pt-2 border-t border-slate-200/60">
              <div className="flex items-center space-x-1.5 text-slate-700 font-semibold mb-1.5">
                <PackageCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Articles réintégrés dans le stock ({sale.items.reduce((acc, i) => acc + i.quantity, 0)}) :</span>
              </div>
              <div className="max-h-24 overflow-y-auto divide-y divide-slate-100 bg-white rounded-lg border border-slate-200 p-2">
                {sale.items.map((it, idx) => (
                  <div key={idx} className="py-1 flex items-center justify-between text-[11px] text-slate-600">
                    <span className="truncate pr-2">{it.productName}</span>
                    <span className="font-bold text-emerald-700 shrink-0">+{it.quantity} en stock</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Warning notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start space-x-2.5 text-xs text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              L'annulation réintègre immédiatement les quantités vendues dans l'inventaire, 
              déduit le montant de la caisse ou du crédit client, et archive la trace dans le tableau de bord.
            </p>
          </div>

          {/* Reason selection & input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Motif de l'annulation (obligatoire) :
            </label>
            
            {/* Quick Reason Chips */}
            <div className="flex flex-wrap gap-1.5">
              {COMMON_REASONS.map((r, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setReason(r)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition text-left cursor-pointer ${
                    reason === r
                      ? 'bg-rose-50 border-rose-400 text-rose-800 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Custom Reason Textarea */}
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Saisissez ou complétez la justification de l'annulation..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
            />
          </div>

          {/* Error display */}
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white py-2.5 rounded-xl font-black text-xs shadow-md flex items-center justify-center space-x-1.5 transition cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>{isSubmitting ? 'Annulation en cours...' : 'Confirmer l’Annulation'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
