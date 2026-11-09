import React, { useState, useMemo } from 'react';
import { 
  Zap, 
  X, 
  Star, 
  Search, 
  Check, 
  ShoppingBag, 
  Sparkles, 
  AlertTriangle, 
  Smartphone, 
  Coins, 
  User,
  Plus,
  Minus,
  Printer
} from 'lucide-react';
import { Product, PaymentMethod, Business, Sale } from '../../types';

interface ExpressSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  business: Business;
  onExecuteSale: (product: Product, quantity: number, paymentMethod: PaymentMethod, customerName: string, shouldPrint?: boolean) => Promise<Sale>;
}

export const ExpressSaleModal: React.FC<ExpressSaleModalProps> = ({
  isOpen,
  onClose,
  products,
  business,
  onExecuteSale
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerName, setCustomerName] = useState('Client Comptoir');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoPrint, setAutoPrint] = useState<boolean>(() => {
    return localStorage.getItem('bizpilot_autoprint_receipt') !== 'false';
  });

  // Filter available products: prioritize popular items first, then others
  const availableProducts = useMemo(() => {
    return products.filter(p => !p.archived);
  }, [products]);

  const popularProducts = useMemo(() => {
    return availableProducts.filter(p => p.isPopular);
  }, [availableProducts]);

  const displayedProducts = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) {
      // If no search, show popular products first, then others
      return [...popularProducts, ...availableProducts.filter(p => !p.isPopular)];
    }
    return availableProducts.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q)
    );
  }, [availableProducts, popularProducts, searchFilter]);

  if (!isOpen) return null;

  const currentTotal = selectedProduct ? selectedProduct.salePrice * quantity : 0;
  const isOutOfStock = selectedProduct ? selectedProduct.currentStock < quantity : false;

  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setQuantity(1);
    setErrorMsg(null);
  };

  const handleConfirmSale = async (prod?: Product, forcePrint?: boolean) => {
    const targetProduct = prod || selectedProduct;
    if (!targetProduct) {
      setErrorMsg('Veuillez sélectionner un article.');
      return;
    }
    if (targetProduct.currentStock <= 0) {
      setErrorMsg(`Article en rupture de stock : ${targetProduct.name}`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const shouldPrint = forcePrint !== undefined ? forcePrint : autoPrint;
      await onExecuteSale(
        targetProduct,
        quantity,
        paymentMethod,
        customerName.trim() || 'Client Comptoir',
        shouldPrint
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la vente express');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center space-x-2.5">
            <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
              <Zap className="h-5 w-5 fill-white text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-base sm:text-lg tracking-tight">
                  Vente Express en 1 Clic
                </h3>
                <span className="bg-white/25 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                  ⚡ Rapide
                </span>
              </div>
              <p className="text-xs text-amber-100 font-medium">
                Validation immédiate d'un article populaire sans manipuler le panier
              </p>
            </div>
          </div>

          <button
            id="btn-close-express-sale-modal"
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Select Popular Articles Ribbon */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                Articles Phares Populaires (1 Clic)
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {popularProducts.length} article(s) phare(s)
              </span>
            </div>

            {popularProducts.length === 0 ? (
              <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-2xl text-xs text-amber-800 flex items-center justify-between gap-2">
                <span>Aucun article marqué avec l'étoile ★. Vous pouvez choisir n'importe quel article ci-dessous.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {popularProducts.map(p => {
                  const isSelected = selectedProduct?.id === p.id;
                  const isStockOut = p.currentStock <= 0;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isStockOut}
                      onClick={() => handleSelectProduct(p)}
                      className={`p-3 rounded-2xl text-left border transition relative flex flex-col justify-between cursor-pointer select-none ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400 shadow-xs'
                          : isStockOut
                          ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                          : 'border-slate-200 bg-white hover:border-amber-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                            {p.sku}
                          </span>
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                        </div>
                        <p className="font-bold text-xs text-slate-900 line-clamp-2 leading-tight">
                          {p.name}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="font-black text-amber-700 text-xs sm:text-sm">
                          {p.salePrice.toLocaleString('fr-FR')} {business.currency}
                        </span>
                        {isStockOut ? (
                          <span className="text-[9px] font-bold text-rose-600">0</span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            {p.currentStock} {p.unit}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Search other articles if needed */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Ou rechercher parmi tous les articles du catalogue..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {searchFilter && (
              <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white">
                {displayedProducts.length === 0 ? (
                  <p className="p-3 text-center text-xs text-slate-400">Aucun article trouvé pour cette recherche.</p>
                ) : (
                  displayedProducts.map(p => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      className={`p-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-amber-50/50 transition ${
                        selectedProduct?.id === p.id ? 'bg-amber-50 font-bold' : ''
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          {p.isPopular && <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />}
                          <span className="truncate text-slate-900 font-semibold">{p.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{p.category} • Ref: {p.sku}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-amber-700">
                          {p.salePrice.toLocaleString('fr-FR')} {business.currency}
                        </span>
                        <span className="block text-[10px] text-slate-400">Stock: {p.currentStock}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected Product Action Card & Parameters */}
          {selectedProduct ? (
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3.5 shadow-md border border-slate-800">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-800/60">
                      Article Sélectionné
                    </span>
                    {selectedProduct.isPopular && (
                      <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                        ★ Populaire
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm sm:text-base font-extrabold text-white mt-1">
                    {selectedProduct.name}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Prix unitaire : {selectedProduct.salePrice.toLocaleString('fr-FR')} {business.currency} • Stock dispo : {selectedProduct.currentStock} {selectedProduct.unit}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-400 block font-medium">Total à payer</span>
                  <span className="text-lg sm:text-xl font-black text-amber-400">
                    {currentTotal.toLocaleString('fr-FR')} <span className="text-xs font-bold text-white">{business.currency}</span>
                  </span>
                </div>
              </div>

              {/* Quantity Selector & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                {/* Quantity */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Quantité
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white flex items-center justify-center font-bold text-base transition cursor-pointer"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={selectedProduct.currentStock}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="w-16 h-9 text-center bg-slate-800 border border-slate-700 rounded-xl text-white font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      disabled={quantity >= selectedProduct.currentStock}
                      onClick={() => setQuantity(prev => prev + 1)}
                      className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-40 text-white flex items-center justify-center font-bold text-base transition cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-slate-400">{selectedProduct.unit}</span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Mode d'Encaissement
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`py-2 px-1.5 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center transition cursor-pointer border ${
                        paymentMethod === 'cash'
                          ? 'bg-emerald-600 border-emerald-400 text-white shadow-xs'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Coins className="h-3.5 w-3.5 mb-0.5" />
                      <span>Espèces</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('orange_money')}
                      className={`py-2 px-1.5 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center transition cursor-pointer border ${
                        paymentMethod === 'orange_money'
                          ? 'bg-amber-600 border-amber-400 text-white shadow-xs'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Smartphone className="h-3.5 w-3.5 mb-0.5" />
                      <span>OM</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('moov_money')}
                      className={`py-2 px-1.5 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center transition cursor-pointer border ${
                        paymentMethod === 'moov_money'
                          ? 'bg-blue-600 border-blue-400 text-white shadow-xs'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Smartphone className="h-3.5 w-3.5 mb-0.5" />
                      <span>Moov/Wave</span>
                    </button>
                  </div>
                </div>
              </div>
              {/* Option d'impression du ticket */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Printer className="h-4 w-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-700">Imprimer le reçu après validation</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPrint}
                    onChange={(e) => {
                      setAutoPrint(e.target.checked);
                      localStorage.setItem('bizpilot_autoprint_receipt', String(e.target.checked));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-600"></div>
                  <span className="ml-2 text-[11px] font-bold text-slate-600">
                    {autoPrint ? 'Oui' : 'Non'}
                  </span>
                </label>
              </div>

            </div>
          ) : (
            <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400">
              <ShoppingBag className="h-8 w-8 mx-auto text-slate-300 mb-1.5" />
              <p className="text-xs font-semibold text-slate-600">
                Cliquez sur un article populaire ci-dessus pour préparer la vente express
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                La décharge de stock et le reçu seront générés instantanément.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-white transition cursor-pointer text-center order-3 sm:order-1"
          >
            Annuler
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2 flex-wrap sm:flex-nowrap">
            {/* Valider sans imprimer */}
            <button
              type="button"
              id="btn-confirm-express-sale-no-print"
              disabled={!selectedProduct || isOutOfStock || isSubmitting}
              onClick={() => handleConfirmSale(undefined, false)}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-white hover:bg-emerald-50 active:bg-emerald-100 text-slate-800 border-2 border-emerald-500/60 hover:border-emerald-600 disabled:opacity-50 text-xs sm:text-sm font-black rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
              title="Valider la vente express sans lancer d'impression"
            >
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Valider sans imprimer</span>
            </button>

            {/* Valider & Imprimer */}
            <button
              id="btn-confirm-express-sale"
              type="button"
              disabled={!selectedProduct || isOutOfStock || isSubmitting}
              onClick={() => handleConfirmSale(undefined, true)}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:from-amber-700 active:to-orange-800 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-black shadow-md flex items-center justify-center space-x-2 transition cursor-pointer"
              title="Valider et imprimer le ticket thermique"
            >
              <Printer className="h-4 w-4 shrink-0" />
              <span>
                {isSubmitting 
                  ? 'En cours...' 
                  : selectedProduct 
                  ? `Encaisser & Imprimer (${currentTotal.toLocaleString('fr-FR')} ${business.currency})` 
                  : 'Sélectionnez un article'}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
