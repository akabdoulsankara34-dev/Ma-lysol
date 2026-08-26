import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CalendarClock, 
  AlertTriangle, 
  CheckCircle2, 
  Percent, 
  Trash2, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Package, 
  Clock, 
  ShieldAlert, 
  Boxes,
  Zap,
  Tag
} from 'lucide-react';
import { Product } from '../../types';

export const ExpiryManagementView: React.FC = () => {
  const { products, business, applyExpiryDiscount, declareDamagedLoss, updateProduct } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'expired' | 'urgent' | 'valid' | 'none'>('all');
  const [selectedProductForDiscount, setSelectedProductForDiscount] = useState<Product | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(25);
  const [selectedProductForLoss, setSelectedProductForLoss] = useState<Product | null>(null);
  const [lossQuantity, setLossQuantity] = useState<number>(1);
  const [lossReason, setLossReason] = useState<string>('Périmé');

  const today = new Date();

  // Compute status and days left for all products
  const productsWithExpiry = useMemo(() => {
    return products
      .filter(p => !p.archived)
      .map(p => {
        if (!p.expiryDate) {
          return { ...p, daysLeft: null, expiryStatus: 'none' as const };
        }
        const exp = new Date(p.expiryDate);
        const diffTime = exp.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let expiryStatus: 'expired' | 'urgent' | 'valid' = 'valid';
        if (diffDays < 0) expiryStatus = 'expired';
        else if (diffDays <= 30) expiryStatus = 'urgent';

        return {
          ...p,
          daysLeft: diffDays,
          expiryStatus,
        };
      });
  }, [products]);

  // Filtered list
  const filteredProducts = useMemo(() => {
    return productsWithExpiry.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.batchNumber && p.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (filterStatus === 'expired') return p.expiryStatus === 'expired';
      if (filterStatus === 'urgent') return p.expiryStatus === 'urgent';
      if (filterStatus === 'valid') return p.expiryStatus === 'valid';
      if (filterStatus === 'none') return p.expiryStatus === 'none';
      return true;
    });
  }, [productsWithExpiry, searchTerm, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const expiredCount = productsWithExpiry.filter(p => p.expiryStatus === 'expired').length;
    const urgentCount = productsWithExpiry.filter(p => p.expiryStatus === 'urgent').length;
    const validCount = productsWithExpiry.filter(p => p.expiryStatus === 'valid').length;
    
    // Value at risk (cost of products expired or expiring in <= 30 days)
    const valueAtRisk = productsWithExpiry
      .filter(p => p.expiryStatus === 'expired' || p.expiryStatus === 'urgent')
      .reduce((sum, p) => sum + (p.purchasePrice * p.currentStock), 0);

    return { expiredCount, urgentCount, validCount, valueAtRisk };
  }, [productsWithExpiry]);

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForDiscount) return;
    try {
      await applyExpiryDiscount(selectedProductForDiscount.id, discountPercent);
      setSelectedProductForDiscount(null);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'application de la remise');
    }
  };

  const handleDeclareLoss = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForLoss) return;
    try {
      await declareDamagedLoss(selectedProductForLoss.id, lossQuantity, lossReason);
      setSelectedProductForLoss(null);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la déclaration de perte');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
            <CalendarClock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestion des DLC & Péremptions</h1>
            <p className="text-sm text-slate-500">
              Surveillance des dates limites, gestion des lots et actions anti-gaspillage
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Produits Périmés</div>
            <div className="text-2xl font-black text-rose-600">{stats.expiredCount}</div>
            <div className="text-[11px] text-rose-500 font-medium">À retirer immédiatement</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">DLC &lt; 30 Jours</div>
            <div className="text-2xl font-black text-amber-600">{stats.urgentCount}</div>
            <div className="text-[11px] text-amber-600 font-medium">Cible déstockage rapide</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">DLC Conformes</div>
            <div className="text-2xl font-black text-emerald-600">{stats.validCount}</div>
            <div className="text-[11px] text-slate-400 font-medium">Validité supérieure à 30j</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Valeur à Risque</div>
            <div className="text-2xl font-black text-slate-900">{stats.valueAtRisk.toLocaleString()} <span className="text-xs font-normal text-slate-500">{business.currency}</span></div>
            <div className="text-[11px] text-slate-500 font-medium">Coût d'achat total menacé</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher article, lot..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filterStatus === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tous ({productsWithExpiry.length})
          </button>
          <button
            onClick={() => setFilterStatus('expired')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filterStatus === 'expired' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Périmés ({stats.expiredCount})
          </button>
          <button
            onClick={() => setFilterStatus('urgent')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filterStatus === 'urgent' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Urgent &lt;30j ({stats.urgentCount})
          </button>
          <button
            onClick={() => setFilterStatus('valid')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filterStatus === 'valid' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Valides ({stats.validCount})
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Article & Catégorie</th>
                <th className="py-3.5 px-4">Numéro de Lot</th>
                <th className="py-3.5 px-4">Date de Péremption (DLC)</th>
                <th className="py-3.5 px-4 text-center">Statut & Échéance</th>
                <th className="py-3.5 px-4 text-right">Stock Actuel</th>
                <th className="py-3.5 px-4 text-right">Prix de Vente</th>
                <th className="py-3.5 px-4 text-right">Actions Déstockage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Aucun produit trouvé selon les filtres actuels.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{product.name}</div>
                        <div className="text-xs text-slate-400">{product.category}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-medium text-slate-700">
                        {product.batchNumber || <span className="text-slate-400 font-sans italic">Non spécifié</span>}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {product.expiryDate ? (
                          <div className="flex items-center gap-1.5">
                            <CalendarClock className="w-4 h-4 text-slate-400" />
                            {new Date(product.expiryDate).toLocaleDateString('fr-FR')}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Pas de DLC</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {product.expiryStatus === 'expired' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3.5 h-3.5" /> Périmé ({Math.abs(product.daysLeft || 0)}j)
                          </span>
                        ) : product.expiryStatus === 'urgent' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3.5 h-3.5" /> Reste {product.daysLeft} jours
                          </span>
                        ) : product.expiryStatus === 'valid' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Conforme ({product.daysLeft}j)
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Non périssable</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {product.currentStock} <span className="text-xs font-normal text-slate-400">{product.unit}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {product.discountPrice ? (
                          <div>
                            <span className="line-through text-xs text-slate-400 block">{product.salePrice.toLocaleString()}</span>
                            <span className="font-bold text-rose-600">{product.discountPrice.toLocaleString()} {business.currency}</span>
                          </div>
                        ) : (
                          <span className="font-medium text-slate-900">{product.salePrice.toLocaleString()} {business.currency}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            id={`btn-discount-${product.id}`}
                            onClick={() => setSelectedProductForDiscount(product)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Appliquer Remise Anti-Gaspillage"
                          >
                            <Percent className="w-3 h-3" /> Remise Promo
                          </button>
                          <button
                            id={`btn-loss-${product.id}`}
                            onClick={() => {
                              setSelectedProductForLoss(product);
                              setLossQuantity(product.currentStock);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Déclarer Perte / Retrait"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Remise Anti-Gaspillage */}
      {selectedProductForDiscount && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl">
                <Percent className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Remise Déstockage Anti-Gaspillage</h3>
                <p className="text-xs text-slate-500">{selectedProductForDiscount.name}</p>
              </div>
            </div>

            <form onSubmit={handleApplyDiscount} className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl space-y-1 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Prix d'Achat :</span>
                  <span className="font-semibold">{selectedProductForDiscount.purchasePrice.toLocaleString()} {business.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Prix de Vente Normal :</span>
                  <span className="font-semibold">{selectedProductForDiscount.salePrice.toLocaleString()} {business.currency}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Pourcentage de Remise Rapide
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[10, 20, 30, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDiscountPercent(pct)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                        discountPercent === pct 
                          ? 'bg-amber-600 text-white border-amber-600' 
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      -{pct}%
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-center text-slate-900"
                />
              </div>

              <div className="bg-amber-50/70 p-3 rounded-xl text-center">
                <div className="text-xs text-amber-800">Nouveau Prix de Vente Remisé :</div>
                <div className="text-xl font-black text-amber-900">
                  {Math.round(selectedProductForDiscount.salePrice * (1 - discountPercent / 100)).toLocaleString()} {business.currency}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProductForDiscount(null)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-xs cursor-pointer"
                >
                  Appliquer la Promo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Déclaration de Perte / Retrait Stock */}
      {selectedProductForLoss && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-50 text-rose-700 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Sortie de Stock : Perte / Péremption</h3>
                <p className="text-xs text-slate-500">{selectedProductForLoss.name}</p>
              </div>
            </div>

            <form onSubmit={handleDeclareLoss} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantité à déduire du stock (Max: {selectedProductForLoss.currentStock}) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedProductForLoss.currentStock}
                  value={lossQuantity}
                  onChange={(e) => setLossQuantity(Number(e.target.value))}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motif de la Perte *
                </label>
                <select
                  value={lossReason}
                  onChange={(e) => setLossReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Périmé (DLC Dépassée)">Périmé (DLC Dépassée)</option>
                  <option value="Abîmé / Cassé lors de la manutention">Abîmé / Cassé</option>
                  <option value="Défaut emballage / Fuite">Défaut emballage / Fuite</option>
                  <option value="Autre perte">Autre perte</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProductForLoss(null)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-xs cursor-pointer"
                >
                  Confirmer le Retrait
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
