import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StockMovementType } from '../../types';
import { 
  Layers, 
  PlusCircle, 
  MinusCircle, 
  AlertOctagon, 
  ClipboardCheck, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertTriangle,
  History,
  CheckCircle2,
  X
} from 'lucide-react';

export const StockView: React.FC = () => {
  const { products, stockMovements, recordStockMovement, business, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showMovementModal, setShowMovementModal] = useState(false);

  // Form for new stock movement
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [movementType, setMovementType] = useState<StockMovementType>('in_purchase');
  const [movementQty, setMovementQty] = useState<number>(5);
  const [movementReason, setMovementReason] = useState<string>('Livraison marchandise');

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Stock KPIs
  const totalStockValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (!p.archived ? p.currentStock * p.purchasePrice : 0), 0);
  }, [products]);

  const outOfStockProducts = useMemo(() => {
    return products.filter(p => !p.archived && p.currentStock <= 0);
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => !p.archived && p.currentStock > 0 && p.currentStock <= p.alertThreshold);
  }, [products]);

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || movementQty === 0) return;

    // Apply negative sign for outgoing movements
    const signedQty = (movementType === 'out_manual' || movementType === 'damaged_loss')
      ? -Math.abs(movementQty)
      : Math.abs(movementQty);

    await recordStockMovement(
      selectedProductId,
      movementType,
      signedQty,
      movementReason.trim() || 'Mouvement manuel'
    );

    setShowMovementModal(false);
    setMovementReason('');
  };

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return stockMovements.filter(m => {
      if (typeFilter !== 'all' && m.type !== typeFilter) return false;
      const search = searchQuery.toLowerCase();
      return (
        m.productName.toLowerCase().includes(search) ||
        m.reason.toLowerCase().includes(search) ||
        m.userName.toLowerCase().includes(search)
      );
    });
  }, [stockMovements, typeFilter, searchQuery]);

  const getMovementBadge = (type: StockMovementType) => {
    switch (type) {
      case 'in_purchase':
        return <span className="bg-blue-50 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><ArrowDownLeft className="h-3 w-3" /> Entrée Achat</span>;
      case 'sale':
        return <span className="bg-slate-100 text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><ArrowUpRight className="h-3 w-3" /> Vente Caisse</span>;
      case 'out_manual':
        return <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><MinusCircle className="h-3 w-3" /> Sortie Manuelle</span>;
      case 'damaged_loss':
        return <span className="bg-red-50 text-red-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><AlertOctagon className="h-3 w-3" /> Perte / Casse</span>;
      case 'inventory_adjustment':
        return <span className="bg-indigo-50 text-indigo-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><ClipboardCheck className="h-3 w-3" /> Inventaire</span>;
      case 'return_customer':
        return <span className="bg-amber-50 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><ArrowDownLeft className="h-3 w-3" /> Retour Client</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[11px] px-2 py-0.5 rounded-full">{type}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Gestion & Mouvements de Stock
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Suivi en temps réel des entrées, sorties, inventaires et alertes de réapprovisionnement.
          </p>
        </div>

        <button
          id="btn-new-stock-movement"
          onClick={() => setShowMovementModal(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Nouveau Mouvement de Stock</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Stock Value */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Valeur Marchande (Achat)</p>
          <p className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
            {totalStockValue.toLocaleString()} <span className="text-xs font-semibold text-slate-500">{business.currency}</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{products.filter(p => !p.archived).length} articles référencés</p>
        </div>

        {/* In Stock Count */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Articles Disponibles</p>
          <p className="text-lg sm:text-2xl font-black text-blue-700 mt-1">
            {products.filter(p => !p.archived && p.currentStock > p.alertThreshold).length}
          </p>
          <p className="text-[11px] text-blue-600 mt-1">Niveau de stock optimal</p>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Seuil d'Alerte Faible</p>
          <p className="text-lg sm:text-2xl font-black text-amber-900 mt-1">
            {lowStockProducts.length}
          </p>
          <p className="text-[11px] text-amber-700 mt-1">À commander sous peu</p>
        </div>

        {/* Out of Stock Alert */}
        <div className="bg-red-50 p-4 rounded-2xl border border-red-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-red-800">Ruptures Totales</p>
          <p className="text-lg sm:text-2xl font-black text-red-900 mt-1">
            {outOfStockProducts.length}
          </p>
          <p className="text-[11px] text-red-700 mt-1">Urgence de réapprovisionnement</p>
        </div>

      </div>

      {/* Critical Stock Alert Banners if any */}
      {(outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
        <div className="bg-white p-4 rounded-2xl border border-amber-300 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span>Articles nécessitant une attention immédiate</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {outOfStockProducts.map(p => (
              <div key={p.id} className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-red-950">{p.name}</p>
                  <p className="text-[10px] text-red-700 font-mono">Fournisseur: {p.supplier || 'Non défini'}</p>
                </div>
                <span className="bg-red-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded">
                  0 {p.unit}
                </span>
              </div>
            ))}

            {lowStockProducts.map(p => (
              <div key={p.id} className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-amber-950">{p.name}</p>
                  <p className="text-[10px] text-amber-700 font-mono">Seuil d'alerte : {p.alertThreshold} {p.unit}</p>
                </div>
                <span className="bg-amber-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded">
                  {p.currentStock} {p.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Movement Audit Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-3 p-4">
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-slate-700" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Journal des Mouvements de Stock</h3>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-60">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrer par produit ou motif..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous types</option>
              <option value="in_purchase">Entrées Achat</option>
              <option value="sale">Ventes</option>
              <option value="out_manual">Sorties Manuelles</option>
              <option value="damaged_loss">Pertes / Casse</option>
              <option value="inventory_adjustment">Ajustement Inventaire</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-3">Date & Heure</th>
                <th className="py-3 px-3">Article</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Variation</th>
                <th className="py-3 px-3">Ancien → Nouveau</th>
                <th className="py-3 px-3">Motif / Justification</th>
                <th className="py-3 px-3">Opérateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Aucun mouvement de stock enregistré.
                  </td>
                </tr>
              ) : (
                filteredMovements.map(mov => (
                  <tr key={mov.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(mov.createdAt).toLocaleDateString('fr-FR')} {new Date(mov.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {mov.productName}
                    </td>
                    <td className="py-2.5 px-3">
                      {getMovementBadge(mov.type)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`font-black text-xs ${
                        mov.quantity > 0 ? 'text-blue-700' : 'text-red-700'
                      }`}>
                        {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                      {mov.previousStock} → <span className="font-bold text-slate-900">{mov.newStock}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                      {mov.reason}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {mov.userName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* NEW STOCK MOVEMENT MODAL */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base">Enregistrer un Mouvement de Stock</h3>
              <button
                onClick={() => setShowMovementModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="p-5 space-y-4">
              {/* Product selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sélectionner l'article *</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {products.filter(p => !p.archived).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock actuel: {p.currentStock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Movement Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Type d'opération *</label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as StockMovementType)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="in_purchase">➕ Entrée Achat / Approvisionnement fournisseur</option>
                  <option value="out_manual">➖ Sortie manuelle (Usage interne / Don)</option>
                  <option value="damaged_loss">❌ Perte / Casse / Produit avarié</option>
                  <option value="inventory_adjustment">📋 Ajustement après inventaire physique</option>
                  <option value="return_customer">↩️ Retour client en magasin</option>
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantité ({selectedProduct?.unit || 'unités'}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={movementQty}
                  onChange={(e) => setMovementQty(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-blue-300 rounded-xl px-3 py-2 text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Reason / Justification */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motif / Justification *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Facture #834, Bouteille cassée, Comptage inventaire..."
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Calculated Preview */}
              {selectedProduct && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between font-semibold">
                  <span className="text-slate-600">Nouveau stock après validation :</span>
                  <span className="font-extrabold text-blue-800 text-sm">
                    {movementType === 'out_manual' || movementType === 'damaged_loss'
                      ? selectedProduct.currentStock - Number(movementQty)
                      : selectedProduct.currentStock + Number(movementQty)}{' '}
                    {selectedProduct.unit}
                  </span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs"
                >
                  Valider le mouvement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
