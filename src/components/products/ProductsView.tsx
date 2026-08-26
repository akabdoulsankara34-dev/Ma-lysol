import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { BarcodeScanner } from '../BarcodeScanner';
import { 
  Search, 
  Plus, 
  Edit, 
  Archive, 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  Filter, 
  Download, 
  Upload, 
  X, 
  Save, 
  ArrowUpDown,
  DollarSign,
  ScanBarcode
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const { products, addProduct, updateProduct, archiveProduct, business, currentUser, recordStockMovement } = useApp();

  const isOwner = currentUser.role === 'owner' || currentUser.role === 'admin';
  const isStockManager = currentUser.role === 'stock_manager' || isOwner;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'archived'>('all');

  // Modal State for Add / Edit
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('Épicerie');
  const [formUnit, setFormUnit] = useState('Pièce');
  const [formPurchasePrice, setFormPurchasePrice] = useState<number>(0);
  const [formSalePrice, setFormSalePrice] = useState<number>(0);
  const [formWholesalePrice, setFormWholesalePrice] = useState<number>(0);
  const [formSemiWholesalePrice, setFormSemiWholesalePrice] = useState<number>(0);
  const [formCurrentStock, setFormCurrentStock] = useState<number>(0);
  const [formAlertThreshold, setFormAlertThreshold] = useState<number>(5);
  const [formSupplier, setFormSupplier] = useState('');

  // Scanner State
  const [showScanner, setShowScanner] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'search' | 'form'>('search');

  // Quick Restock Modal
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockReason, setRestockReason] = useState<string>('Livraison fournisseur');

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['Tous', ...Array.from(set)];
  }, [products]);

  // Open modal for new
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSku(`ART-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormCategory('Épicerie');
    setFormUnit('Pièce');
    setFormPurchasePrice(500);
    setFormSalePrice(700);
    setFormWholesalePrice(600);
    setFormSemiWholesalePrice(650);
    setFormCurrentStock(10);
    setFormAlertThreshold(5);
    setFormSupplier('');
    setShowModal(true);
  };

  // Open modal for edit
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormCategory(p.category);
    setFormUnit(p.unit);
    setFormPurchasePrice(p.purchasePrice);
    setFormSalePrice(p.salePrice);
    setFormWholesalePrice(p.wholesalePrice || p.salePrice);
    setFormSemiWholesalePrice(p.semiWholesalePrice || p.salePrice);
    setFormCurrentStock(p.currentStock);
    setFormAlertThreshold(p.alertThreshold);
    setFormSupplier(p.supplier || '');
    setShowModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formSalePrice <= 0) return;

    if (editingProduct) {
      await updateProduct(editingProduct.id, {
        name: formName.trim(),
        sku: formSku.trim(),
        category: formCategory,
        unit: formUnit,
        purchasePrice: Number(formPurchasePrice),
        salePrice: Number(formSalePrice),
        wholesalePrice: Number(formWholesalePrice) || undefined,
        semiWholesalePrice: Number(formSemiWholesalePrice) || undefined,
        alertThreshold: Number(formAlertThreshold),
        supplier: formSupplier.trim() || undefined,
      });
    } else {
      await addProduct({
        name: formName.trim(),
        sku: formSku.trim(),
        category: formCategory,
        unit: formUnit,
        purchasePrice: Number(formPurchasePrice),
        salePrice: Number(formSalePrice),
        wholesalePrice: Number(formWholesalePrice) || undefined,
        semiWholesalePrice: Number(formSemiWholesalePrice) || undefined,
        currentStock: Number(formCurrentStock),
        alertThreshold: Number(formAlertThreshold),
        supplier: formSupplier.trim() || undefined,
        archived: false,
      });
    }

    setShowModal(false);
  };

  const handleExecuteRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct || restockQty <= 0) return;
    await recordStockMovement(
      restockProduct.id,
      'in_purchase',
      Number(restockQty),
      restockReason.trim() || 'Approvisionnement'
    );
    setRestockProduct(null);
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Archived filter
      if (statusFilter === 'archived') {
        if (!p.archived) return false;
      } else {
        if (p.archived) return false;
        if (statusFilter === 'in_stock' && p.currentStock <= 0) return false;
        if (statusFilter === 'low_stock' && (p.currentStock <= 0 || p.currentStock > p.alertThreshold)) return false;
        if (statusFilter === 'out_of_stock' && p.currentStock > 0) return false;
      }

      // Category filter
      if (selectedCategory !== 'Tous' && p.category !== selectedCategory) return false;

      // Search
      const search = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search) ||
        (p.supplier && p.supplier.toLowerCase().includes(search))
      );
    });
  }, [products, statusFilter, selectedCategory, searchQuery]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Catalogue & Produits
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gérez vos articles, prix d'achat, prix de vente et seuils d'alerte en {business.currency}.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isStockManager && (
            <button
              id="btn-add-product"
              onClick={handleOpenAdd}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter un Produit</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 flex">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, référence ou fournisseur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-l-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => {
                setScannerTarget('search');
                setShowScanner(true);
              }}
              className="bg-slate-100 hover:bg-slate-200 border border-l-0 border-slate-200 rounded-r-xl px-3 flex items-center justify-center text-slate-600 transition"
              title="Scanner un code-barres"
            >
              <ScanBarcode className="h-4 w-4" />
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="w-full sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tous ({products.filter(p => !p.archived).length})
            </button>
            <button
              onClick={() => setStatusFilter('low_stock')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === 'low_stock' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Faible ({products.filter(p => !p.archived && p.currentStock > 0 && p.currentStock <= p.alertThreshold).length})
            </button>
            <button
              onClick={() => setStatusFilter('out_of_stock')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === 'out_of_stock' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-800 hover:bg-red-100'
              }`}
            >
              Rupture ({products.filter(p => !p.archived && p.currentStock <= 0).length})
            </button>
            <button
              onClick={() => setStatusFilter('archived')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === 'archived' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              Archivés ({products.filter(p => p.archived).length})
            </button>
          </div>

        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Article / Réf</th>
                <th className="py-3.5 px-3">Catégorie</th>
                <th className="py-3.5 px-3">Stock Actuel</th>
                {isOwner && <th className="py-3.5 px-3">Prix Achat</th>}
                <th className="py-3.5 px-3">Prix Vente</th>
                {isOwner && <th className="py-3.5 px-3">Marge Unitaire</th>}
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50 text-slate-400" />
                    <p className="font-semibold text-slate-600">Aucun produit ne correspond aux filtres.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const margin = p.salePrice - p.purchasePrice;
                  const marginPercent = p.purchasePrice > 0 ? Math.round((margin / p.purchasePrice) * 100) : 0;
                  const isOutOfStock = p.currentStock <= 0;
                  const isLowStock = p.currentStock > 0 && p.currentStock <= p.alertThreshold;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      
                      {/* Name & SKU */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-200">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm">{p.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              Réf: {p.sku} • {p.unit}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[11px] font-medium">
                          {p.category}
                        </span>
                      </td>

                      {/* Stock Level */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <span className={`font-extrabold text-xs px-2 py-0.5 rounded-md ${
                            isOutOfStock 
                              ? 'bg-red-100 text-red-800' 
                              : isLowStock 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-emerald-50 text-emerald-800'
                          }`}>
                            {p.currentStock} {p.unit}
                          </span>
                          {isLowStock && (
                            <span className="text-[10px] text-amber-600 font-medium hidden sm:inline">
                              (Seuil: {p.alertThreshold})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Purchase Price (Owner only) */}
                      {isOwner && (
                        <td className="py-3 px-3 font-medium text-slate-500">
                          {p.purchasePrice.toLocaleString()} {business.currency}
                        </td>
                      )}

                      {/* Sale Price */}
                      <td className="py-3 px-3 font-black text-slate-900">
                        {p.salePrice.toLocaleString()} {business.currency}
                      </td>

                      {/* Margin (Owner only) */}
                      {isOwner && (
                        <td className="py-3 px-3">
                          <span className="font-bold text-blue-700">
                            +{margin.toLocaleString()} {business.currency}
                          </span>
                          <span className="text-[10px] text-blue-600 block">
                            ({marginPercent}%)
                          </span>
                        </td>
                      )}

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Quick Restock */}
                        {isStockManager && !p.archived && (
                          <button
                            onClick={() => {
                              setRestockProduct(p);
                              setRestockQty(10);
                            }}
                            className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition"
                            title="Entrée de stock rapide"
                          >
                            + Réappro
                          </button>
                        )}

                        {/* Edit */}
                        {isStockManager && (
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}

                        {/* Archive */}
                        {isOwner && !p.archived && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Voulez-vous archiver le produit "${p.name}" ? Son historique de vente sera préservé.`)) {
                                archiveProduct(p.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Archiver"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base">
                {editingProduct ? 'Modifier le Produit' : 'Ajouter un Nouvel Article'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom de l'article *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sac de Riz Parfumé 25kg"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Référence / Code SKU</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-l-xl px-3 py-2 text-xs text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setScannerTarget('form');
                        setShowScanner(true);
                      }}
                      className="bg-slate-200 hover:bg-slate-300 px-3 border border-l-0 border-slate-300 rounded-r-xl transition flex items-center justify-center text-slate-700"
                    >
                      <ScanBarcode className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Ex: Épicerie, Boissons..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unité</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800"
                  >
                    <option value="Pièce">Pièce</option>
                    <option value="Sac">Sac</option>
                    <option value="Carton">Carton</option>
                    <option value="Bidon">Bidon</option>
                    <option value="Bouteille">Bouteille</option>
                    <option value="Paquet">Paquet</option>
                    <option value="Sachet">Sachet</option>
                    <option value="Kg">Kg</option>
                    <option value="Litre">Litre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prix d'Achat ({business.currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prix Détail ({business.currency}) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-blue-300 rounded-xl px-2.5 py-2 text-xs font-bold text-blue-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prix Demi-Gros ({business.currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={formSemiWholesalePrice}
                    onChange={(e) => setFormSemiWholesalePrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-amber-300 rounded-xl px-2.5 py-2 text-xs font-bold text-amber-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prix Gros ({business.currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={formWholesalePrice}
                    onChange={(e) => setFormWholesalePrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-emerald-300 rounded-xl px-2.5 py-2 text-xs font-bold text-emerald-900"
                  />
                </div>
              </div>

              {/* Initial stock only on creation */}
              {!editingProduct && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                  <div>
                    <label className="block text-xs font-bold text-blue-950 mb-1">Stock Initial</label>
                    <input
                      type="number"
                      min="0"
                      value={formCurrentStock}
                      onChange={(e) => setFormCurrentStock(Number(e.target.value))}
                      className="w-full bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-950 mb-1">Seuil Alerte Faible</label>
                    <input
                      type="number"
                      min="1"
                      value={formAlertThreshold}
                      onChange={(e) => setFormAlertThreshold(Number(e.target.value))}
                      className="w-full bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fournisseur (Facultatif)</label>
                <input
                  type="text"
                  placeholder="Ex: Grossiste Rood-Woko, SN-CITEC..."
                  value={formSupplier}
                  onChange={(e) => setFormSupplier(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs"
                >
                  {editingProduct ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK RESTOCK MODAL */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Entrée de Stock / Réapprovisionnement</h3>
                <p className="text-xs text-blue-300">{restockProduct.name}</p>
              </div>
              <button
                onClick={() => setRestockProduct(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteRestock} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between">
                <span>Stock Actuel :</span>
                <span className="font-bold text-slate-900">{restockProduct.currentStock} {restockProduct.unit}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantité reçue ({restockProduct.unit}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-blue-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motif / Numéro de facture fournisseur
                </label>
                <input
                  type="text"
                  value={restockReason}
                  onChange={(e) => setRestockReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-950 flex justify-between font-semibold">
                <span>Nouveau stock calculé :</span>
                <span className="text-sm font-black">{restockProduct.currentStock + Number(restockQty)} {restockProduct.unit}</span>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Valider l'entrée
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BARCODE SCANNER MODAL */}
      {showScanner && (
        <BarcodeScanner
          onScan={(decodedText) => {
            if (scannerTarget === 'search') {
              setSearchQuery(decodedText);
            } else if (scannerTarget === 'form') {
              setFormSku(decodedText);
            }
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};
