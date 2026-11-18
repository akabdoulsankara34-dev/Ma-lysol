import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, StockMovementType } from '../../types';
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
  X,
  Star,
  Sliders,
  FileText,
  Printer,
  TrendingDown,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  Package,
  Flame,
  Check,
  Edit2,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  Calendar,
  DollarSign,
  Clock,
  Trash2
} from 'lucide-react';

export const StockView: React.FC = () => {
  const { 
    products, 
    stockMovements, 
    recordStockMovement, 
    updateProduct, 
    batchUpdateProducts, 
    business, 
    currentUser 
  } = useApp();

  // Sub-navigation view: 'inventory' (Etat des stocks avec indicateurs visuels) ou 'movements' (Journal)
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'movements'>('inventory');

  // Inventory Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'popular_low' | 'out' | 'healthy'>('all');
  const [sortOption, setSortOption] = useState<'deficit' | 'popular_first' | 'stock_asc' | 'stock_desc' | 'name_asc'>('deficit');

  // Movement Log Filters
  const [movementSearch, setMovementSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modals state
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showBatchThresholdModal, setShowBatchThresholdModal] = useState(false);
  const [showOrderSheetModal, setShowOrderSheetModal] = useState(false);

  // Quick Inline Threshold Editor
  const [editingThresholdProductId, setEditingThresholdProductId] = useState<string | null>(null);
  const [tempThresholdValue, setTempThresholdValue] = useState<number>(5);

  // Form for stock movement (+ / - / =)
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [movementType, setMovementType] = useState<StockMovementType>('in_purchase');
  const [movementQty, setMovementQty] = useState<number>(5);
  const [movementReason, setMovementReason] = useState<string>('Approvisionnement fournisseur');
  const [movementMode, setMovementMode] = useState<'in' | 'out' | 'inventory'>('in');
  const [lossReasonType, setLossReasonType] = useState<'broken' | 'expired' | 'damaged' | 'missing' | 'internal'>('broken');
  const [recordLossAsExpense, setRecordLossAsExpense] = useState<boolean>(true);
  const [movementNewPrice, setMovementNewPrice] = useState<number | ''>('');
  const [movementNewExpiry, setMovementNewExpiry] = useState<string>('');
  const [movementBatchNumber, setMovementBatchNumber] = useState<string>('');
  const [movementSupplier, setMovementSupplier] = useState<string>('');
  const [inventoryCount, setInventoryCount] = useState<number>(0);

  // Batch threshold settings modal state
  const [batchTarget, setBatchTarget] = useState<'all' | 'popular' | 'category'>('popular');
  const [batchCategory, setBatchCategory] = useState<string>('');
  const [batchThresholdValue, setBatchThresholdValue] = useState<number>(10);
  const [batchSuccessToast, setBatchSuccessToast] = useState<string | null>(null);

  // Extract categories for filters
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Stock KPIs
  const totalStockValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (!p.archived ? p.currentStock * p.purchasePrice : 0), 0);
  }, [products]);

  const activeProducts = useMemo(() => {
    return products.filter(p => !p.archived);
  }, [products]);

  // Out of stock
  const outOfStockProducts = useMemo(() => {
    return activeProducts.filter(p => p.currentStock <= 0);
  }, [activeProducts]);

  // Low stock (falling at or below minimum threshold, but > 0)
  const lowStockProducts = useMemo(() => {
    return activeProducts.filter(p => p.currentStock > 0 && p.currentStock <= p.alertThreshold);
  }, [activeProducts]);

  // All products needing replenishment (out of stock or low stock)
  const allNeedingRestock = useMemo(() => {
    return activeProducts.filter(p => p.currentStock <= p.alertThreshold);
  }, [activeProducts]);

  // Popular products falling at or below threshold (URGENT to prevent stockout on bestsellers)
  const popularProductsInAlert = useMemo(() => {
    return activeProducts.filter(p => !!p.isPopular && p.currentStock <= p.alertThreshold);
  }, [activeProducts]);

  // Optimal / Healthy stock products
  const healthyStockProducts = useMemo(() => {
    return activeProducts.filter(p => p.currentStock > p.alertThreshold * 1.5);
  }, [activeProducts]);

  // Filtered & Sorted Inventory
  const filteredInventory = useMemo(() => {
    return activeProducts.filter(p => {
      // Status filter
      if (statusFilter === 'low' && (p.currentStock <= 0 || p.currentStock > p.alertThreshold)) return false;
      if (statusFilter === 'popular_low' && (!p.isPopular || p.currentStock > p.alertThreshold)) return false;
      if (statusFilter === 'out' && p.currentStock > 0) return false;
      if (statusFilter === 'healthy' && p.currentStock <= p.alertThreshold) return false;

      // Category filter
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesBarcode = p.barcode ? p.barcode.toLowerCase().includes(q) : false;
        const matchesSupplier = p.supplier ? p.supplier.toLowerCase().includes(q) : false;
        const matchesCat = p.category ? p.category.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesSku && !matchesBarcode && !matchesSupplier && !matchesCat) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortOption === 'deficit') {
        // Largest deficit below minimum threshold first
        const deficitA = Math.max(0, a.alertThreshold - a.currentStock);
        const deficitB = Math.max(0, b.alertThreshold - b.currentStock);
        if (deficitA !== deficitB) return deficitB - deficitA;
        // Prioritize popular items if deficit is same
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
        return a.currentStock - b.currentStock;
      }
      if (sortOption === 'popular_first') {
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
        return a.currentStock - b.currentStock;
      }
      if (sortOption === 'stock_asc') {
        return a.currentStock - b.currentStock;
      }
      if (sortOption === 'stock_desc') {
        return b.currentStock - a.currentStock;
      }
      if (sortOption === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [activeProducts, statusFilter, categoryFilter, searchQuery, sortOption]);

  // Filtered movements for Audit Log
  const filteredMovements = useMemo(() => {
    return stockMovements.filter(m => {
      if (typeFilter !== 'all' && m.type !== typeFilter) return false;
      if (movementSearch.trim()) {
        const search = movementSearch.toLowerCase().trim();
        return (
          m.productName.toLowerCase().includes(search) ||
          m.reason.toLowerCase().includes(search) ||
          m.userName.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [stockMovements, typeFilter, movementSearch]);

  // Open Quick Restock Modal (+)
  const handleOpenRestockModal = (product: Product) => {
    setSelectedProductId(product.id);
    setMovementMode('in');
    setMovementType('in_purchase');
    // Suggest quantity to bring stock comfortably up to 2.5x the threshold
    const targetBuffer = product.alertThreshold * 2.5;
    const recommendedQty = Math.max(5, Math.ceil(targetBuffer - product.currentStock));
    setMovementQty(recommendedQty);
    setMovementReason(`Réapprovisionnement fournisseur`);
    setMovementNewPrice(product.purchasePrice || '');
    setMovementNewExpiry(product.expiryDate || '');
    setMovementBatchNumber(product.batchNumber || '');
    setMovementSupplier(product.supplier || '');
    setShowMovementModal(true);
  };

  // Open Quick Loss / Damaged / Expired Modal (-)
  const handleOpenLossModal = (product: Product, defaultLoss: 'broken' | 'expired' = 'broken') => {
    setSelectedProductId(product.id);
    setMovementMode('out');
    setLossReasonType(defaultLoss);
    setMovementType(defaultLoss === 'expired' ? 'expired_loss' : 'damaged_loss');
    setMovementQty(1);
    setMovementReason(defaultLoss === 'expired' ? 'Produit périmé (date de péremption dépassée)' : 'Produit cassé / abîmé en rayon');
    setRecordLossAsExpense(true);
    setShowMovementModal(true);
  };

  // Toggle Popular status
  const handleTogglePopular = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateProduct(product.id, {
      isPopular: !product.isPopular
    });
  };

  // Save inline threshold edit
  const handleSaveInlineThreshold = async (product: Product) => {
    if (tempThresholdValue < 1) return;
    await updateProduct(product.id, {
      alertThreshold: Number(tempThresholdValue)
    });
    setEditingThresholdProductId(null);
  };

  // Save new stock movement (+ / - / =)
  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    let targetType: StockMovementType = movementType;
    let qty = Math.abs(movementQty);
    let reason = movementReason.trim();

    if (movementMode === 'in') {
      targetType = movementType === 'return_customer' ? 'return_customer' : 'in_purchase';
      if (!reason) reason = 'Arrivage marchandise / Réapprovisionnement';
    } else if (movementMode === 'out') {
      if (lossReasonType === 'expired') {
        targetType = 'expired_loss';
        if (!reason) reason = 'Produit périmé / DLC dépassée';
      } else if (lossReasonType === 'broken') {
        targetType = 'damaged_loss';
        if (!reason) reason = 'Produit cassé / abîmé';
      } else if (lossReasonType === 'damaged') {
        targetType = 'damaged_loss';
        if (!reason) reason = 'Produit avarié / défectueux';
      } else if (lossReasonType === 'missing') {
        targetType = 'out_manual';
        if (!reason) reason = "Perte / Écart d'inventaire négatif";
      } else {
        targetType = 'out_manual';
        if (!reason) reason = 'Consommation interne boutique';
      }
    } else if (movementMode === 'inventory') {
      targetType = 'inventory_adjustment';
      qty = Math.max(0, inventoryCount);
      if (!reason) reason = 'Ajustement inventaire physique';
    }

    if (movementMode !== 'inventory' && qty <= 0) return;

    await recordStockMovement(
      selectedProductId,
      targetType,
      qty,
      reason,
      {
        newPurchasePrice: movementMode === 'in' && typeof movementNewPrice === 'number' && movementNewPrice > 0 ? movementNewPrice : undefined,
        newExpiryDate: movementMode === 'in' && movementNewExpiry ? movementNewExpiry : undefined,
        batchNumber: movementMode === 'in' && movementBatchNumber ? movementBatchNumber : undefined,
        supplier: movementMode === 'in' && movementSupplier ? movementSupplier : undefined,
        recordAsExpense: movementMode === 'out' ? recordLossAsExpense : false
      }
    );

    const toastLabel = movementMode === 'in' 
      ? `+${qty} ${prod.unit} approvisionné(s)`
      : movementMode === 'out'
      ? `-${qty} ${prod.unit} déstocké(s) (${reason})`
      : `Stock réaligné à ${qty} ${prod.unit}`;

    setBatchSuccessToast(`Opération effectuée : ${prod.name} (${toastLabel})`);
    setTimeout(() => setBatchSuccessToast(null), 4000);

    setShowMovementModal(false);
    setMovementReason('');
  };

  // Batch threshold update
  const handleApplyBatchThreshold = async () => {
    if (batchThresholdValue < 1) return;

    let targetProducts: Product[] = [];
    if (batchTarget === 'all') {
      targetProducts = activeProducts;
    } else if (batchTarget === 'popular') {
      targetProducts = activeProducts.filter(p => !!p.isPopular);
    } else if (batchTarget === 'category' && batchCategory) {
      targetProducts = activeProducts.filter(p => p.category === batchCategory);
    }

    if (targetProducts.length === 0) return;

    const updates = targetProducts.map(p => ({
      id: p.id,
      updates: { alertThreshold: Number(batchThresholdValue) }
    }));

    await batchUpdateProducts(updates);
    setShowBatchThresholdModal(false);
    setBatchSuccessToast(`Seuil minimum de ${batchThresholdValue} appliqué avec succès à ${updates.length} article(s).`);
    setTimeout(() => setBatchSuccessToast(null), 4000);
  };

  // Movement badge renderer
  const getMovementBadge = (type: StockMovementType) => {
    switch (type) {
      case 'in_purchase':
        return <span className="bg-blue-50 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><ArrowDownLeft className="h-3 w-3" /> Entrée Achat</span>;
      case 'sale':
        return <span className="bg-slate-100 text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><ArrowUpRight className="h-3 w-3" /> Vente Caisse</span>;
      case 'out_manual':
        return <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><MinusCircle className="h-3 w-3" /> Sortie Manuelle</span>;
      case 'damaged_loss':
        return <span className="bg-red-50 text-red-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><AlertOctagon className="h-3 w-3" /> Produit Cassé / Avarié</span>;
      case 'expired_loss':
        return <span className="bg-rose-50 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Produit Périmé</span>;
      case 'inventory_adjustment':
        return <span className="bg-indigo-50 text-indigo-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><ClipboardCheck className="h-3 w-3" /> Inventaire</span>;
      case 'return_customer':
        return <span className="bg-amber-50 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><ArrowDownLeft className="h-3 w-3" /> Retour Client</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[11px] px-2 py-0.5 rounded-full">{type}</span>;
    }
  };

  // Calculate visual gauge percentage and status details
  const getStockHealthDetails = (product: Product) => {
    const stock = product.currentStock;
    const threshold = Math.max(1, product.alertThreshold);
    const deficit = threshold - stock;
    const capacityCeiling = Math.max(threshold * 2.5, stock * 1.2, 10);
    const percentage = Math.min(100, Math.round((stock / capacityCeiling) * 100));
    const thresholdPercentage = Math.min(95, Math.round((threshold / capacityCeiling) * 100));

    if (stock <= 0) {
      return {
        status: 'out',
        label: 'Rupture Totale',
        badgeBg: 'bg-red-100 text-red-800 border-red-300',
        gaugeColor: 'bg-red-600',
        textColor: 'text-red-700',
        icon: <AlertOctagon className="h-3.5 w-3.5 text-red-600 shrink-0" />,
        isCritical: true,
        deficit,
        percentage: 0,
        thresholdPercentage,
      };
    }

    if (stock <= threshold) {
      return {
        status: 'low',
        label: `Sous Seuil Min (${stock}/${threshold})`,
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
        gaugeColor: 'bg-amber-500',
        textColor: 'text-amber-800',
        icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />,
        isCritical: true,
        deficit,
        percentage: Math.max(8, percentage),
        thresholdPercentage,
      };
    }

    if (stock <= threshold * 1.5) {
      return {
        status: 'warning_near',
        label: `Seuil Proche (${stock} ${product.unit})`,
        badgeBg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        gaugeColor: 'bg-yellow-400',
        textColor: 'text-yellow-700',
        icon: <TrendingDown className="h-3.5 w-3.5 text-yellow-600 shrink-0" />,
        isCritical: false,
        deficit: 0,
        percentage,
        thresholdPercentage,
      };
    }

    return {
      status: 'healthy',
      label: `Stock Optimal (${stock} ${product.unit})`,
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      gaugeColor: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />,
      isCritical: false,
      deficit: 0,
      percentage,
      thresholdPercentage,
    };
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Toast notification for batch actions */}
      {batchSuccessToast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{batchSuccessToast}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Gestion & Contrôle des Stocks
            </h1>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wide">
              {business.name}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Indicateurs visuels de seuil minimum, protection contre les ruptures des produits populaires et réapprovisionnement.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Batch threshold button */}
          <button
            id="btn-batch-thresholds"
            type="button"
            onClick={() => setShowBatchThresholdModal(true)}
            className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-xl font-bold text-xs shadow-2xs transition cursor-pointer"
            title="Ajuster les seuils d'alerte minimum en masse pour la boutique"
          >
            <Sliders className="h-3.5 w-3.5 text-slate-500" />
            <span>Ajuster les Seuils</span>
          </button>

          {/* Supplier order sheet button */}
          <button
            id="btn-order-sheet"
            type="button"
            onClick={() => setShowOrderSheetModal(true)}
            className="flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 border border-amber-300 px-3 py-2 rounded-xl font-bold text-xs shadow-2xs transition cursor-pointer"
            title="Générer et imprimer le bon de commande pour tous les articles sous le seuil"
          >
            <FileText className="h-3.5 w-3.5 text-amber-700" />
            <span>Bon de Réappro ({allNeedingRestock.length})</span>
          </button>

          {/* Approvisionnement (+) button */}
          <button
            id="btn-new-stock-in"
            type="button"
            onClick={() => {
              if (products.length > 0) setSelectedProductId(products[0].id);
              setMovementMode('in');
              setMovementType('in_purchase');
              setMovementQty(10);
              setMovementReason('Arrivage marchandise / Réapprovisionnement');
              if (products.length > 0) {
                setMovementNewPrice(products[0].purchasePrice || '');
                setMovementSupplier(products[0].supplier || '');
              }
              setShowMovementModal(true);
            }}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition cursor-pointer"
            title="Enregistrer un arrivage ou une entrée de stock (+)"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Approvisionner (+)</span>
          </button>

          {/* Déstockage Casse / Périmé (-) button */}
          <button
            id="btn-new-stock-out-loss"
            type="button"
            onClick={() => {
              if (products.length > 0) setSelectedProductId(products[0].id);
              setMovementMode('out');
              setLossReasonType('broken');
              setMovementType('damaged_loss');
              setMovementQty(1);
              setMovementReason('Produit cassé / abîmé');
              setRecordLossAsExpense(true);
              setShowMovementModal(true);
            }}
            className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition cursor-pointer"
            title="Déclarer un produit cassé, avarié ou périmé (-)"
          >
            <MinusCircle className="h-4 w-4" />
            <span>Casse / Périmé (-)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (5 cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total Stock Value */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">Valeur Marchande (Achat)</p>
          <p className="text-base sm:text-xl font-black text-slate-900 mt-1 truncate">
            {totalStockValue.toLocaleString()} <span className="text-[11px] font-semibold text-slate-500">{business.currency}</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1">{activeProducts.length} articles référencés</p>
        </div>

        {/* Optimal stock */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-700">Stock Optimal</p>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-base sm:text-xl font-black text-emerald-700 mt-1">
            {healthyStockProducts.length}
          </p>
          <p className="text-[10px] text-emerald-600 mt-1">&gt; 150% du seuil de sécurité</p>
        </div>

        {/* Low Stock Warning */}
        <div 
          onClick={() => {
            setActiveSubTab('inventory');
            setStatusFilter('low');
          }}
          className="bg-amber-50 hover:bg-amber-100/80 p-3.5 sm:p-4 rounded-2xl border border-amber-300 shadow-2xs transition cursor-pointer group"
          title="Cliquer pour afficher les articles sous le seuil d'alerte"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-900">Sous le Seuil Min</p>
            <AlertTriangle className="h-4 w-4 text-amber-600 group-hover:scale-110 transition" />
          </div>
          <p className="text-base sm:text-xl font-black text-amber-900 mt-1">
            {lowStockProducts.length} <span className="text-xs font-normal text-amber-700">article(s)</span>
          </p>
          <p className="text-[10px] text-amber-800 font-semibold mt-1 flex items-center gap-1">
            <span>À commander sous peu</span>
            <span className="text-[9px] underline">Filtrer →</span>
          </p>
        </div>

        {/* Total Out of Stock */}
        <div 
          onClick={() => {
            setActiveSubTab('inventory');
            setStatusFilter('out');
          }}
          className="bg-red-50 hover:bg-red-100/80 p-3.5 sm:p-4 rounded-2xl border border-red-300 shadow-2xs transition cursor-pointer group"
          title="Cliquer pour afficher les ruptures totales"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-red-900">Ruptures Totales</p>
            <AlertOctagon className="h-4 w-4 text-red-600 group-hover:scale-110 transition" />
          </div>
          <p className="text-base sm:text-xl font-black text-red-900 mt-1">
            {outOfStockProducts.length} <span className="text-xs font-normal text-red-700">article(s)</span>
          </p>
          <p className="text-[10px] text-red-800 font-semibold mt-1 flex items-center gap-1">
            <span>Stock épuisé (0)</span>
            <span className="text-[9px] underline">Filtrer →</span>
          </p>
        </div>

        {/* Popular Products in Risk */}
        <div 
          onClick={() => {
            setActiveSubTab('inventory');
            setStatusFilter('popular_low');
          }}
          className={`p-3.5 sm:p-4 rounded-2xl border shadow-2xs transition cursor-pointer group ${
            popularProductsInAlert.length > 0 
              ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-orange-500 animate-pulse' 
              : 'bg-white border-slate-200'
          }`}
          title="Cliquer pour afficher les produits populaires menacés de rupture"
        >
          <div className="flex items-center justify-between">
            <p className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${
              popularProductsInAlert.length > 0 ? 'text-amber-100' : 'text-slate-600'
            }`}>
              ⭐ Populaires en Alerte
            </p>
            <Flame className={`h-4 w-4 ${popularProductsInAlert.length > 0 ? 'text-yellow-200' : 'text-amber-500'}`} />
          </div>
          <p className={`text-base sm:text-xl font-black mt-1 ${
            popularProductsInAlert.length > 0 ? 'text-white' : 'text-slate-900'
          }`}>
            {popularProductsInAlert.length} <span className="text-xs font-normal opacity-90">produits phares</span>
          </p>
          <p className={`text-[10px] mt-1 font-bold ${
            popularProductsInAlert.length > 0 ? 'text-amber-100' : 'text-slate-400'
          }`}>
            {popularProductsInAlert.length > 0 ? '🔥 Risque de ventes perdues !' : 'Tous les populaires approvisionnés'}
          </p>
        </div>

      </div>

      {/* Prominent Visual Warning Banner when popular products or any items fall below threshold */}
      {allNeedingRestock.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 rounded-2xl border-2 border-amber-400/80 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Alerte Réapprovisionnement : {allNeedingRestock.length} article(s) sous le seuil minimum défini
                  </h3>
                  {popularProductsInAlert.length > 0 && (
                    <span className="bg-red-600 text-white font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-full animate-bounce">
                      {popularProductsInAlert.length} Populaire(s) en Danger
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                  {popularProductsInAlert.length > 0 ? (
                    <>
                      <strong className="text-amber-900">Attention critique :</strong> Vos articles les plus vendus tombent sous le seuil de sécurité. Assurez-vous de passer commande rapidement afin que la boutique ne soit jamais à court de produits populaires.
                    </>
                  ) : (
                    <>
                      Certains articles ont atteint ou dépassé leur seuil d'alerte personnalisé. Lancez un réapprovisionnement pour garantir la disponibilité en rayon.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Quick action buttons in banner */}
            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              {popularProductsInAlert.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubTab('inventory');
                    setStatusFilter('popular_low');
                  }}
                  className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow-2xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Flame className="h-3.5 w-3.5" />
                  <span>Voir les populaires ({popularProductsInAlert.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowOrderSheetModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-2xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5 text-amber-400" />
                <span>Bon de commande</span>
              </button>
            </div>

          </div>

          {/* Quick pills preview of critical items */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-300/40">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Articles prioritaires :</span>
            {allNeedingRestock.slice(0, 6).map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleOpenRestockModal(p)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition flex items-center space-x-1.5 cursor-pointer ${
                  p.isPopular 
                    ? 'bg-amber-100 hover:bg-amber-200 border-amber-400 text-amber-950 font-bold' 
                    : p.currentStock <= 0 
                    ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-900' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
                title="Cliquer pour réapprovisionner immédiatement"
              >
                {p.isPopular && <span className="text-amber-600">⭐</span>}
                <span>{p.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                  p.currentStock <= 0 ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {p.currentStock}/{p.alertThreshold}
                </span>
                <span className="text-blue-600 text-[10px] font-bold">+ Réappro</span>
              </button>
            ))}
            {allNeedingRestock.length > 6 && (
              <button
                type="button"
                onClick={() => {
                  setActiveSubTab('inventory');
                  setStatusFilter('low');
                }}
                className="text-[11px] font-bold text-blue-700 hover:underline px-2 py-1"
              >
                +{allNeedingRestock.length - 6} autres articles...
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tabs: Navigation between 'État des Stocks & Seuils' and 'Journal des Mouvements' */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('inventory')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer ${
            activeSubTab === 'inventory'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Suivi des Stocks & Indicateurs de Seuil</span>
          {allNeedingRestock.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeSubTab === 'inventory' ? 'bg-white text-blue-700' : 'bg-amber-100 text-amber-800'
            }`}>
              {allNeedingRestock.length} alerte(s)
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('movements')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer ${
            activeSubTab === 'movements'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Journal Historique des Mouvements</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeSubTab === 'movements' ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {stockMovements.length}
          </span>
        </button>
      </div>

      {/* SUB-TAB 1: INVENTORY & THRESHOLD MONITORING TABLE */}
      {activeSubTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-4 sm:p-5">
          
          {/* Controls: Search, Category, Status Pills & Sorting */}
          <div className="space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, SKU, code-barres ou fournisseur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Category & Sort controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Category selector */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">Rayon :</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les rayons</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Sort selector */}
                <div className="flex items-center space-x-1.5">
                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="deficit">Déficit sous seuil (Plus urgent)</option>
                    <option value="popular_first">⭐ Populaires en priorité</option>
                    <option value="stock_asc">Stock le plus bas d'abord</option>
                    <option value="stock_desc">Stock le plus élevé d'abord</option>
                    <option value="name_asc">Nom du produit (A-Z)</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Quick Filter Pill Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Filtrer par statut :</span>
              
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`text-xs px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tous ({activeProducts.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('popular_low')}
                className={`text-xs px-3 py-1 rounded-xl font-bold transition flex items-center space-x-1 cursor-pointer ${
                  statusFilter === 'popular_low'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                    : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                }`}
              >
                <Flame className="h-3 w-3" />
                <span>⭐ Populaires en alerte ({popularProductsInAlert.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('low')}
                className={`text-xs px-3 py-1 rounded-xl font-bold transition flex items-center space-x-1 cursor-pointer ${
                  statusFilter === 'low'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <AlertTriangle className="h-3 w-3" />
                <span>Sous le seuil ({lowStockProducts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('out')}
                className={`text-xs px-3 py-1 rounded-xl font-bold transition flex items-center space-x-1 cursor-pointer ${
                  statusFilter === 'out'
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'bg-red-50 text-red-800 hover:bg-red-100'
                }`}
              >
                <AlertOctagon className="h-3 w-3" />
                <span>Ruptures totales ({outOfStockProducts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('healthy')}
                className={`text-xs px-3 py-1 rounded-xl font-bold transition flex items-center space-x-1 cursor-pointer ${
                  statusFilter === 'healthy'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>Stock optimal ({healthyStockProducts.length})</span>
              </button>
            </div>
          </div>

          {/* THE VISUAL INDICATOR INVENTORY TABLE */}
          <div className="overflow-x-auto pt-1">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-3.5">Article & Popularité</th>
                  <th className="py-3 px-3.5">Rayon / Catégorie</th>
                  <th className="py-3 px-3.5 min-w-[220px]">Indicateur Visuel & Jauge de Stock</th>
                  <th className="py-3 px-3.5">Seuil Min Défini</th>
                  <th className="py-3 px-3.5">Fournisseur & Prix</th>
                  <th className="py-3 px-3.5 text-right">Ajustement Stock (+ / -)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 space-y-2">
                      <Package className="h-8 w-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-sm text-slate-600">Aucun article ne correspond à vos filtres.</p>
                      <p className="text-xs text-slate-400">Essayez de réinitialiser la recherche ou les filtres de statut.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setCategoryFilter('all');
                          setStatusFilter('all');
                        }}
                        className="text-xs font-bold text-blue-600 hover:underline pt-2"
                      >
                        Réinitialiser tous les filtres
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map(product => {
                    const health = getStockHealthDetails(product);
                    const isUnderThreshold = product.currentStock <= product.alertThreshold;
                    const isEditingThreshold = editingThresholdProductId === product.id;

                    return (
                      <tr 
                        key={product.id} 
                        className={`transition ${
                          product.currentStock <= 0 
                            ? 'bg-red-50/40 hover:bg-red-50/70' 
                            : product.isPopular && isUnderThreshold
                            ? 'bg-amber-50/50 hover:bg-amber-50/80'
                            : isUnderThreshold
                            ? 'bg-amber-50/25 hover:bg-amber-50/50'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        
                        {/* Article & Popularity Star Toggle */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-start space-x-2.5">
                            {/* Popular star toggle */}
                            <button
                              type="button"
                              onClick={(e) => handleTogglePopular(product, e)}
                              className={`p-1 rounded-lg transition shrink-0 cursor-pointer mt-0.5 ${
                                product.isPopular
                                  ? 'text-amber-500 hover:text-amber-600 bg-amber-50 hover:bg-amber-100 shadow-2xs'
                                  : 'text-slate-300 hover:text-amber-400 hover:bg-slate-100'
                              }`}
                              title={
                                product.isPopular 
                                  ? 'Produit Populaire Phare (Cliquer pour désactiver)' 
                                  : 'Marquer comme Produit Populaire (Assure que la boutique ne tombe jamais en rupture)'
                              }
                            >
                              <span className="text-base leading-none">⭐</span>
                            </button>

                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                  {product.name}
                                </p>
                                {product.isPopular && (
                                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shadow-2xs flex items-center gap-0.5">
                                    <Flame className="h-2.5 w-2.5" />
                                    <span>Populaire</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center space-x-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                                <span>Réf: {product.sku}</span>
                                <span>•</span>
                                <span>Unité: {product.unit}</span>
                                {product.barcode && (
                                  <>
                                    <span>•</span>
                                    <span>CB: {product.barcode}</span>
                                  </>
                                )}
                              </div>

                              {/* Special banner warning if a popular product is falling below threshold */}
                              {product.isPopular && isUnderThreshold && (
                                <div className="mt-1.5 inline-flex items-center space-x-1 bg-red-600 text-white px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider animate-pulse">
                                  <AlertOctagon className="h-3 w-3" />
                                  <span>Produit Phare sous le seuil ! Réapprovisionner d'urgence</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Rayon / Category */}
                        <td className="py-3 px-3.5">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                            {product.category}
                          </span>
                        </td>

                        {/* INDICATEUR VISUEL & JAUGE DE STOCK */}
                        <td className="py-3 px-3.5">
                          <div className="space-y-1.5">
                            
                            {/* Visual Status Badge */}
                            <div className="flex items-center justify-between gap-2">
                              <div className={`inline-flex items-center space-x-1.5 px-2.5 py-0.8 rounded-lg border text-[11px] font-black shadow-2xs ${health.badgeBg}`}>
                                {health.status === 'out' && (
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                                  </span>
                                )}
                                {health.status === 'low' && (
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
                                  </span>
                                )}
                                {health.icon}
                                <span>{health.label}</span>
                              </div>

                              {/* Deficit Pill if under threshold */}
                              {health.deficit > 0 && (
                                <span className="bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                  Manque: -{health.deficit} {product.unit}
                                </span>
                              )}
                            </div>

                            {/* Visual Gauge Progress Bar with Threshold Marker Notch */}
                            <div className="space-y-0.5">
                              <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                
                                {/* Current Stock Fill */}
                                <div 
                                  className={`h-full transition-all duration-300 rounded-full ${health.gaugeColor}`}
                                  style={{ width: `${health.percentage}%` }}
                                />

                                {/* Visual User-Defined Minimum Threshold Notch Line */}
                                <div 
                                  className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
                                  style={{ left: `${health.thresholdPercentage}%` }}
                                  title={`Seuil d'alerte défini : ${product.alertThreshold} ${product.unit}`}
                                />
                              </div>

                              {/* Bar legend under the gauge */}
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                <span className={health.textColor}>
                                  Stock: <strong>{product.currentStock} {product.unit}</strong>
                                </span>
                                <span className="text-slate-600 flex items-center gap-1 font-semibold">
                                  <span className="inline-block w-1.5 h-1.5 bg-slate-900 rounded-full"></span>
                                  Seuil: <strong>{product.alertThreshold} {product.unit}</strong>
                                </span>
                              </div>
                            </div>

                          </div>
                        </td>

                        {/* SEUIL MINIMUM DÉFINI (USER-DEFINED THRESHOLD) & QUICK EDIT */}
                        <td className="py-3 px-3.5">
                          {isEditingThreshold ? (
                            <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-blue-400 shadow-sm animate-in fade-in zoom-in-95">
                              <input
                                type="number"
                                min="1"
                                autoFocus
                                value={tempThresholdValue}
                                onChange={(e) => setTempThresholdValue(Math.max(1, Number(e.target.value)))}
                                className="w-14 bg-slate-50 border border-slate-300 rounded-lg px-1.5 py-1 text-xs font-black text-slate-900 text-center"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveInlineThreshold(product)}
                                className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                                title="Valider le nouveau seuil minimum"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingThresholdProductId(null)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
                                title="Annuler"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingThresholdProductId(product.id);
                                setTempThresholdValue(product.alertThreshold);
                              }}
                              className="group flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 transition cursor-pointer"
                              title="Cliquer pour ajuster le seuil minimum d'alerte pour cet article"
                            >
                              <div className="text-left">
                                <span className="text-xs font-black text-slate-900 block group-hover:text-blue-700">
                                  {product.alertThreshold} {product.unit}
                                </span>
                                <span className="text-[9px] text-slate-400 block group-hover:text-blue-600">
                                  Seuil minimum
                                </span>
                              </div>
                              <Edit2 className="h-3 w-3 text-slate-400 group-hover:text-blue-600 shrink-0" />
                            </button>
                          )}
                        </td>

                        {/* Fournisseur & Prix */}
                        <td className="py-3 px-3.5 text-slate-600">
                          <p className="font-semibold text-slate-800 text-xs truncate max-w-[140px]">
                            {product.supplier || 'Non renseigné'}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Achat: {product.purchasePrice.toLocaleString()} {business.currency}
                          </p>
                          <p className="text-[10px] text-slate-600 font-mono">
                            Vente: {product.salePrice.toLocaleString()} {business.currency}
                          </p>
                        </td>

                        {/* ACTIONS RAPIDES : APPRO (+) & CASSE / PÉRIMÉ (-) */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Bouton Appro (+) */}
                            <button
                              type="button"
                              onClick={() => handleOpenRestockModal(product)}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-2xs cursor-pointer ${
                                isUnderThreshold
                                  ? product.isPopular
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                              title="Enregistrer un approvisionnement ou arrivage (+)"
                            >
                              <PlusCircle className="h-3.5 w-3.5" />
                              <span>Appro (+)</span>
                            </button>

                            {/* Bouton Casse / Périmé (-) */}
                            <button
                              type="button"
                              onClick={() => handleOpenLossModal(product, 'broken')}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition flex items-center space-x-1 shadow-2xs cursor-pointer"
                              title="Déclarer un produit cassé, avarié ou périmé (-)"
                            >
                              <MinusCircle className="h-3.5 w-3.5 text-rose-600" />
                              <span>Casse / Périmé (-)</span>
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

          {/* Footer Info on Visual Indicators */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-800">Légende des Indicateurs Visuels :</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                🔴 Rupture Totale
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                🟠 Sous Seuil Min
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                🟢 Optimal
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              💡 Cliquez sur l'étoile ⭐ pour protéger un article phare et éviter toute rupture client.
            </p>
          </div>

        </div>
      )}

      {/* SUB-TAB 2: STOCK MOVEMENT AUDIT LOG */}
      {activeSubTab === 'movements' && (
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
                  value={movementSearch}
                  onChange={(e) => setMovementSearch(e.target.value)}
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
                <option value="sale">Ventes Caisse</option>
                <option value="out_manual">Sorties Manuelles</option>
                <option value="damaged_loss">Produits Cassés / Avariés</option>
                <option value="expired_loss">Produits Périmés</option>
                <option value="inventory_adjustment">Ajustement Inventaire</option>
                <option value="return_customer">Retour Client</option>
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
      )}

      {/* MODAL 1: BATCH THRESHOLD CONFIGURATOR */}
      {showBatchThresholdModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sliders className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base">Ajuster les Seuils Minimum d'Alerte</h3>
              </div>
              <button
                onClick={() => setShowBatchThresholdModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Définissez rapidement le seuil de sécurité en-dessous duquel les articles déclenchent l'indicateur visuel d'alerte pour ne jamais tomber en rupture.
              </p>

              {/* Target selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cible de la mise à jour *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBatchTarget('popular')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center ${
                      batchTarget === 'popular'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ⭐ Produits Phares
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchTarget('all')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center ${
                      batchTarget === 'all'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Tous les articles
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBatchTarget('category');
                      if (!batchCategory && categories[0]) setBatchCategory(categories[0]);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center ${
                      batchTarget === 'category'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Par Rayon
                  </button>
                </div>
              </div>

              {/* Category picker if target is category */}
              {batchTarget === 'category' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Choisir le rayon concerné</label>
                  <select
                    value={batchCategory}
                    onChange={(e) => setBatchCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Threshold value input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nouveau seuil d'alerte minimum (unités) *
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setBatchThresholdValue(prev => Math.max(1, prev - 1))}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 transition"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    required
                    value={batchThresholdValue}
                    onChange={(e) => setBatchThresholdValue(Math.max(1, Number(e.target.value)))}
                    className="flex-1 bg-slate-50 border border-amber-300 rounded-xl px-3 py-2 text-center text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setBatchThresholdValue(prev => prev + 1)}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 transition"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-bold">Raccourcis :</span>
                  {[3, 5, 10, 15, 20].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBatchThresholdValue(val)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        batchThresholdValue === val 
                          ? 'bg-amber-500 text-white border-amber-500' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary note */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <p className="font-semibold">
                  Conseil d'expert pour commerce :
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Pour les produits populaires à rotation rapide, un seuil minimum de <strong>8 à 15 unités</strong> permet d'absorber les délais de livraison des grossistes sans rupture.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBatchThresholdModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleApplyBatchThreshold}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs"
                >
                  Appliquer le seuil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REPLENISHMENT PURCHASE ORDER SHEET */}
      {showOrderSheetModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Bon de Réapprovisionnement & Commande</h3>
                  <p className="text-[11px] text-slate-400">Articles sous le seuil d'alerte défini • {business.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Imprimer</span>
                </button>
                <button
                  onClick={() => setShowOrderSheetModal(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Table */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between text-xs bg-amber-50 p-3 rounded-xl border border-amber-200">
                <div className="text-amber-950">
                  <p className="font-bold">Total articles à réapprovisionner : {allNeedingRestock.length}</p>
                  <p className="text-[11px] text-amber-800">
                    Dont <strong>{popularProductsInAlert.length} produit(s) populaire(s)</strong> à forte rotation client.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Budget Achat Estimé</p>
                  <p className="text-sm sm:text-base font-black text-slate-900">
                    {allNeedingRestock.reduce((acc, p) => {
                      const deficit = Math.max(1, (p.alertThreshold * 2) - p.currentStock);
                      return acc + (deficit * p.purchasePrice);
                    }, 0).toLocaleString()} {business.currency}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-600 text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Article</th>
                      <th className="py-2.5 px-3">Fournisseur</th>
                      <th className="py-2.5 px-3">Stock Actuel</th>
                      <th className="py-2.5 px-3">Seuil Min</th>
                      <th className="py-2.5 px-3 text-right">Qté Suggérée</th>
                      <th className="py-2.5 px-3 text-right">Coût Est.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allNeedingRestock.map(p => {
                      const targetQty = Math.max(1, (p.alertThreshold * 2) - p.currentStock);
                      const cost = targetQty * p.purchasePrice;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              {p.isPopular && <span className="text-amber-500">⭐</span>}
                              <span>{p.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">Réf: {p.sku}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 text-xs">
                            {p.supplier || 'Non défini'}
                          </td>
                          <td className="py-2.5 px-3 font-black">
                            <span className={p.currentStock <= 0 ? 'text-red-700' : 'text-amber-700'}>
                              {p.currentStock} {p.unit}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 font-semibold">
                            {p.alertThreshold} {p.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-blue-700">
                            +{targetQty} {p.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {cost.toLocaleString()} {business.currency}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
              <span className="text-xs text-slate-500">
                Généré le {new Date().toLocaleDateString('fr-FR')} • BizPilot Burkina
              </span>
              <button
                type="button"
                onClick={() => setShowOrderSheetModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: ENHANCED STOCK ADJUSTMENT (+ / - / =) MODAL */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            
            {/* Dynamic Modal Header depending on Mode */}
            <div className={`p-4 text-white flex items-center justify-between shrink-0 transition-colors ${
              movementMode === 'in'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
                : movementMode === 'out'
                ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700'
                : 'bg-gradient-to-r from-indigo-600 to-blue-700'
            }`}>
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
                  {movementMode === 'in' && <PlusCircle className="h-5 w-5 text-white" />}
                  {movementMode === 'out' && <MinusCircle className="h-5 w-5 text-white" />}
                  {movementMode === 'inventory' && <ClipboardCheck className="h-5 w-5 text-white" />}
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base leading-tight">
                    {movementMode === 'in' && 'Approvisionnement de Stock (Entrée +)'}
                    {movementMode === 'out' && 'Déstockage : Produit Cassé ou Périmé (-)'}
                    {movementMode === 'inventory' && 'Régularisation / Inventaire Réel (=)'}
                  </h3>
                  <p className="text-[11px] text-white/80 font-medium">
                    {movementMode === 'in' && 'Réception fournisseur ou entrée manuelle de marchandise'}
                    {movementMode === 'out' && 'Décharge de stock pour perte, casse matérielle ou péremption'}
                    {movementMode === 'inventory' && 'Ajustement du stock informatique sur comptage physique'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMovementModal(false)}
                className="text-white/80 hover:text-white p-1 hover:bg-white/20 rounded-xl transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="p-2 bg-slate-100 border-b border-slate-200 grid grid-cols-3 gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setMovementMode('in');
                  setMovementType('in_purchase');
                  if (!movementReason || movementReason.includes('cassé') || movementReason.includes('périmé') || movementReason.includes('inventaire')) {
                    setMovementReason('Arrivage marchandise / Réapprovisionnement');
                  }
                }}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer ${
                  movementMode === 'in'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                <PlusCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Appro (+)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMovementMode('out');
                  setLossReasonType('broken');
                  setMovementType('damaged_loss');
                  setMovementReason('Produit cassé / abîmé en rayon');
                }}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer ${
                  movementMode === 'out'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                <MinusCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Casse / Périmé (-)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMovementMode('inventory');
                  setMovementType('inventory_adjustment');
                  setInventoryCount(selectedProduct?.currentStock || 0);
                  setMovementReason('Ajustement inventaire physique');
                }}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer ${
                  movementMode === 'inventory'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                <ClipboardCheck className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Inventaire (=)</span>
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveMovement} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              
              {/* Product selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Article concerné *
                </label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedProductId(id);
                    const p = products.find(prod => prod.id === id);
                    if (p) {
                      setMovementNewPrice(p.purchasePrice || '');
                      setMovementNewExpiry(p.expiryDate || '');
                      setMovementBatchNumber(p.batchNumber || '');
                      setMovementSupplier(p.supplier || '');
                      if (movementMode === 'inventory') setInventoryCount(p.currentStock);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {activeProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.isPopular ? '⭐ ' : ''}{p.name} (Stock: {p.currentStock} {p.unit} • Achat: {p.purchasePrice.toLocaleString()} {business.currency})
                    </option>
                  ))}
                </select>

                {/* Product quick summary pill */}
                {selectedProduct && (
                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900">{selectedProduct.name}</span>
                      <span className="text-slate-400 font-mono ml-1.5">Réf: {selectedProduct.sku}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span>Stock actuel : <strong className={selectedProduct.currentStock <= selectedProduct.alertThreshold ? 'text-amber-700' : 'text-slate-900'}>{selectedProduct.currentStock} {selectedProduct.unit}</strong></span>
                      <span>•</span>
                      <span>Prix Achat : <strong>{selectedProduct.purchasePrice.toLocaleString()} {business.currency}</strong></span>
                    </div>
                  </div>
                )}
              </div>

              {/* -------------------- MODE 1 : APPROVISIONNEMENT (+) -------------------- */}
              {movementMode === 'in' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  
                  {/* Quantity received */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Quantité livrée / reçue ({selectedProduct?.unit || 'unités'}) *
                      </label>
                      <span className="text-[10px] text-slate-500">Ajout au stock</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        required
                        value={movementQty}
                        onChange={(e) => setMovementQty(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-slate-50 border border-emerald-400 rounded-xl px-3 py-2 text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    {/* Quick increment pills */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-400 font-bold">Raccourcis :</span>
                      {[5, 10, 20, 50, 100].map(q => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setMovementQty(q)}
                          className="px-2 py-0.5 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-800 text-[10px] font-bold text-slate-600 transition cursor-pointer"
                        >
                          +{q}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional Purchase Price Update */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Prix d'achat unitaire ({business.currency})
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder={selectedProduct?.purchasePrice?.toString() || '0'}
                        value={movementNewPrice}
                        onChange={(e) => setMovementNewPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800"
                      />
                      <span className="text-[10px] text-slate-400">Actualise le prix de revient si modifié</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Fournisseur / Distributeur
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Grossiste Ouaga, SODIBO..."
                        value={movementSupplier}
                        onChange={(e) => setMovementSupplier(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Expiry Date (DLC) & Batch number for new goods */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Date d'expiration / DLC (Facultatif)
                      </label>
                      <input
                        type="date"
                        value={movementNewExpiry}
                        onChange={(e) => setMovementNewExpiry(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        N° Lot arrivage (Facultatif)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: LOT-2026-B4"
                        value={movementBatchNumber}
                        onChange={(e) => setMovementBatchNumber(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Justification note */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Motif ou N° Bon de Livraison / Facture *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Facture BL #492, Réapprovisionnement seuil..."
                      value={movementReason}
                      onChange={(e) => setMovementReason(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Calculated Preview Card */}
                  {selectedProduct && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1 text-emerald-950">
                      <div className="flex justify-between font-bold">
                        <span>Stock après approvisionnement :</span>
                        <span className="text-sm font-black text-emerald-700">
                          {selectedProduct.currentStock + Number(movementQty)} {selectedProduct.unit} (+{movementQty})
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-emerald-800 pt-1 border-t border-emerald-200/60 font-mono">
                        <span>Coût d'achat de l'arrivage :</span>
                        <span className="font-bold">
                          {(Number(movementQty) * (typeof movementNewPrice === 'number' && movementNewPrice > 0 ? movementNewPrice : selectedProduct.purchasePrice)).toLocaleString()} {business.currency}
                        </span>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* -------------------- MODE 2 : DÉSTOCKAGE CASSE OU PÉRIMÉ (-) -------------------- */}
              {movementMode === 'out' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  
                  {/* Loss Reason Type Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Type de déstockage / Motif de la sortie *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {/* 1. Broken / Damaged */}
                      <button
                        type="button"
                        onClick={() => {
                          setLossReasonType('broken');
                          setMovementType('damaged_loss');
                          setMovementReason('Produit cassé / abîmé en rayon');
                        }}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                          lossReasonType === 'broken'
                            ? 'bg-rose-50 border-rose-500 text-rose-950 shadow-xs ring-2 ring-rose-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 font-bold text-xs text-rose-700">
                          <AlertOctagon className="h-4 w-4 shrink-0" />
                          <span>Produit Cassé</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Chute, choc ou détruit</p>
                      </button>

                      {/* 2. Expired */}
                      <button
                        type="button"
                        onClick={() => {
                          setLossReasonType('expired');
                          setMovementType('expired_loss');
                          setMovementReason('Produit périmé (date de péremption dépassée)');
                        }}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                          lossReasonType === 'expired'
                            ? 'bg-rose-50 border-rose-500 text-rose-950 shadow-xs ring-2 ring-rose-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 font-bold text-xs text-rose-700">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>Produit Périmé</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">DLC / DLUO dépassée</p>
                      </button>

                      {/* 3. Avarié / Défectueux */}
                      <button
                        type="button"
                        onClick={() => {
                          setLossReasonType('damaged');
                          setMovementType('damaged_loss');
                          setMovementReason('Produit avarié / défaut de fabrication');
                        }}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                          lossReasonType === 'damaged'
                            ? 'bg-rose-50 border-rose-500 text-rose-950 shadow-xs ring-2 ring-rose-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 font-bold text-xs text-amber-700">
                          <ShieldAlert className="h-4 w-4 shrink-0" />
                          <span>Avarié / Défaut</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Altéré ou non conforme</p>
                      </button>

                      {/* 4. Perte / Vol */}
                      <button
                        type="button"
                        onClick={() => {
                          setLossReasonType('missing');
                          setMovementType('out_manual');
                          setMovementReason("Perte constatée / Écart d'inventaire négatif");
                        }}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                          lossReasonType === 'missing'
                            ? 'bg-rose-50 border-rose-500 text-rose-950 shadow-xs ring-2 ring-rose-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 font-bold text-xs text-slate-800">
                          <Search className="h-4 w-4 shrink-0" />
                          <span>Perte / Vol</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Manquant inexpliqué</p>
                      </button>

                      {/* 5. Usage interne / Don */}
                      <button
                        type="button"
                        onClick={() => {
                          setLossReasonType('internal');
                          setMovementType('out_manual');
                          setMovementReason('Consommation interne boutique / Dégustation');
                        }}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                          lossReasonType === 'internal'
                            ? 'bg-rose-50 border-rose-500 text-rose-950 shadow-xs ring-2 ring-rose-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 font-bold text-xs text-slate-800">
                          <Package className="h-4 w-4 shrink-0" />
                          <span>Usage Interne</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Test ou consommation</p>
                      </button>
                    </div>
                  </div>

                  {/* Quantity to remove */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Quantité à déstocker ({selectedProduct?.unit || 'unités'}) *
                      </label>
                      {selectedProduct && (
                        <span className="text-[11px] font-bold text-slate-500">
                          Max disponible : {selectedProduct.currentStock} {selectedProduct.unit}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      min="1"
                      max={selectedProduct ? Math.max(1, selectedProduct.currentStock) : undefined}
                      required
                      value={movementQty}
                      onChange={(e) => setMovementQty(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-50 border border-rose-400 rounded-xl px-3 py-2 text-base font-black text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    {selectedProduct && movementQty > selectedProduct.currentStock && (
                      <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Attention : la quantité saisie dépasse le stock disponible en magasin !
                      </p>
                    )}
                  </div>

                  {/* Reason text */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Détails / Circonstances de la perte *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 2 bouteilles tombées de l'étagère, yaourt périmé le 05/11..."
                      value={movementReason}
                      onChange={(e) => setMovementReason(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  {/* Financial Loss Impact Card */}
                  {selectedProduct && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2 text-rose-950">
                      <div className="flex justify-between font-bold">
                        <span>Stock restant après déstockage :</span>
                        <span className="text-sm font-black text-rose-800">
                          {Math.max(0, selectedProduct.currentStock - Number(movementQty))} {selectedProduct.unit} (-{movementQty})
                        </span>
                      </div>
                      <div className="flex justify-between font-mono pt-1.5 border-t border-rose-200 text-[11px]">
                        <span className="font-bold text-rose-900">Perte financière réelle (Prix d'achat) :</span>
                        <span className="font-black text-rose-700 text-sm">
                          {(Number(movementQty) * selectedProduct.purchasePrice).toLocaleString()} {business.currency}
                        </span>
                      </div>

                      {/* Checkbox to record loss into expenses */}
                      <div className="pt-2 border-t border-rose-200/80">
                        <label className="flex items-start space-x-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={recordLossAsExpense}
                            onChange={(e) => setRecordLossAsExpense(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                          />
                          <span className="text-[11px] font-semibold text-rose-900 leading-tight">
                            Enregistrer également cette perte de <strong>{(Number(movementQty) * selectedProduct.purchasePrice).toLocaleString()} {business.currency}</strong> dans le journal des Dépenses de la boutique (catégorie Pertes & Rebuts)
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* -------------------- MODE 3 : INVENTAIRE PHYSIQUE (=) -------------------- */}
              {movementMode === 'inventory' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Stock physique réel compté en rayon *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={inventoryCount}
                      onChange={(e) => setInventoryCount(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-50 border border-indigo-400 rounded-xl px-3 py-2 text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Motif de la régularisation *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Inventaire mensuel, Recalibrage fin de journée..."
                      value={movementReason}
                      onChange={(e) => setMovementReason(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {selectedProduct && (
                    <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-1.5 text-indigo-950">
                      <div className="flex justify-between font-semibold">
                        <span>Stock informatique actuel :</span>
                        <span className="font-bold">{selectedProduct.currentStock} {selectedProduct.unit}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Stock physique constaté :</span>
                        <span className="font-black text-indigo-700">{inventoryCount} {selectedProduct.unit}</span>
                      </div>
                      <div className="flex justify-between font-mono font-bold pt-1.5 border-t border-indigo-200">
                        <span>Écart d'inventaire :</span>
                        <span className={inventoryCount >= selectedProduct.currentStock ? 'text-emerald-700' : 'text-rose-700'}>
                          {inventoryCount >= selectedProduct.currentStock ? '+' : ''}{inventoryCount - selectedProduct.currentStock} {selectedProduct.unit} ({inventoryCount >= selectedProduct.currentStock ? 'Surplus' : 'Déficit'})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className={`px-5 py-2.5 text-white text-xs sm:text-sm font-black rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer ${
                    movementMode === 'in'
                      ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                      : movementMode === 'out'
                      ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
                      : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                  }`}
                >
                  {movementMode === 'in' && <PlusCircle className="h-4 w-4" />}
                  {movementMode === 'out' && <MinusCircle className="h-4 w-4" />}
                  {movementMode === 'inventory' && <ClipboardCheck className="h-4 w-4" />}
                  <span>
                    {movementMode === 'in' && 'Valider l\'Entrée (+)'}
                    {movementMode === 'out' && 'Valider la Perte / Déstockage (-)'}
                    {movementMode === 'inventory' && 'Régulariser l\'Inventaire (=)'}
                  </span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
