import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Sale } from '../../types';
import { CheckoutModal } from './CheckoutModal';
import { ReceiptModal } from './ReceiptModal';
import { BarcodeScanner } from '../BarcodeScanner';
import { 
  broadcastCustomerDisplay, 
  CustomerDisplayItem 
} from '../../lib/customerDisplayService';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  CreditCard, 
  Tag, 
  Percent, 
  AlertTriangle,
  Receipt,
  Package,
  Layers,
  History,
  ScanBarcode,
  Zap,
  Banknote,
  Monitor,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Tv,
  Unlock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cashDrawerService } from '../../lib/cashDrawerService';
import { CashDrawerModal } from './CashDrawerModal';

export const PosView: React.FC = () => {
  const { 
    products, 
    cart, 
    addToCart, 
    updateCartQuantity, 
    updateCartItemDiscount, 
    updateCartItemPriceType,
    removeFromCart, 
    clearCart,
    business,
    sales,
    currentUser,
    completeSale,
    setActiveTab
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  const [showRecentSalesModal, setShowRecentSalesModal] = useState(false);
  const [showDisplayGuideModal, setShowDisplayGuideModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [viewReceiptFromHistory, setViewReceiptFromHistory] = useState<Sale | null>(null);
  const [isQuickCheckingOut, setIsQuickCheckingOut] = useState(false);
  const [showCashDrawerModal, setShowCashDrawerModal] = useState(false);
  const [drawerToast, setDrawerToast] = useState<{ reason: string; timestamp: number; hardwareKicked: boolean } | null>(null);

  // Listen for Cash Drawer Opening events (auto or manual)
  useEffect(() => {
    const handleDrawerOpen = (e: any) => {
      if (e.detail) {
        setDrawerToast({
          reason: e.detail.reason || 'Tiroir-caisse ouvert',
          timestamp: e.detail.timestamp || Date.now(),
          hardwareKicked: Boolean(e.detail.hardwareKicked)
        });
        setTimeout(() => setDrawerToast(null), 4000);
      }
    };

    window.addEventListener('bizpilot:cash-drawer-opened', handleDrawerOpen);
    return () => {
      window.removeEventListener('bizpilot:cash-drawer-opened', handleDrawerOpen);
    };
  }, []);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (!p.archived && p.category) set.add(p.category);
    });
    return ['Tous', ...Array.from(set)];
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (p.archived) return false;
      const matchesCategory = selectedCategory === 'Tous' || p.category === selectedCategory;
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        p.name.toLowerCase().includes(searchLower) ||
        p.sku.toLowerCase().includes(searchLower) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchLower)) ||
        p.category.toLowerCase().includes(searchLower);
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      return acc + (item.unitPrice * item.quantity) - (item.discount || 0);
    }, 0);
  }, [cart]);

  const totalAmount = Math.max(0, subtotal - overallDiscount);
  const totalItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Real-Time Broadcast to 2nd Screen (Customer Display)
  useEffect(() => {
    const displayItems: CustomerDisplayItem[] = cart.map(item => ({
      id: `${item.product.id}_${item.priceType || 'retail'}`,
      productId: item.product.id,
      name: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      total: (item.unitPrice * item.quantity) - (item.discount || 0),
      unit: item.product.unit,
      priceType: item.priceType
    }));

    const lastItem = cart.length > 0 ? cart[cart.length - 1] : null;

    broadcastCustomerDisplay({
      businessName: business.name,
      currency: business.currency,
      phone: business.phone,
      address: `${business.city}, ${business.sector}`,
      slogan: business.receiptFooter || 'Gestion Commerciale & Point de Vente',
      cashierName: currentUser.name,
      items: displayItems,
      itemCount: totalItemCount,
      subtotal: subtotal,
      discount: overallDiscount,
      totalAmount: totalAmount,
      lastScannedItem: lastItem ? {
        name: lastItem.product.name,
        quantity: lastItem.quantity,
        unitPrice: lastItem.unitPrice,
        total: (lastItem.unitPrice * lastItem.quantity) - (lastItem.discount || 0),
        timestamp: Date.now()
      } : null
    });
  }, [cart, overallDiscount, subtotal, totalAmount, totalItemCount, business, currentUser]);

  const handleSaleSuccess = (sale: Sale, tenderReceived?: number, tenderChange?: number) => {
    setShowCheckoutModal(false);
    setOverallDiscount(0);
    setLastCompletedSale(sale);

    // Broadcast completed sale for 2nd screen celebratory display & change confirmation
    broadcastCustomerDisplay({
      items: [],
      itemCount: 0,
      subtotal: 0,
      discount: 0,
      totalAmount: 0,
      lastScannedItem: null,
      checkoutState: null,
      lastCompletedSale: {
        receiptNumber: sale.receiptNumber,
        totalAmount: sale.total,
        receivedAmount: tenderReceived,
        changeToReturn: tenderChange,
        paymentMethod: sale.paymentMethod,
        itemCount: sale.items.reduce((acc, it) => acc + it.quantity, 0),
        customerName: sale.customerName,
        date: sale.createdAt,
        timestamp: Date.now()
      }
    });

    // Automatically trigger Cash Drawer Opening upon receipt validation
    cashDrawerService.triggerDrawer({
      reason: `Validation Reçu N° ${sale.receiptNumber}`,
      paymentMethod: sale.paymentMethod,
      saleId: sale.id,
      operatorName: currentUser?.name || 'Caissier'
    }).catch(err => {
      console.warn('Auto cash drawer trigger error:', err);
    });
  };

  const handleQuickCashSale = async () => {
    if (cart.length === 0 || isQuickCheckingOut) return;
    setIsQuickCheckingOut(true);
    try {
      const sale = await completeSale(
        'cash',
        undefined,
        'Client Comptoir',
        overallDiscount
      );
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#16a34a', '#22c55e', '#10b981']
        });
      } catch (e) {
        // ignore
      }
      handleSaleSuccess(sale, totalAmount, 0);
    } catch (err: any) {
      console.error('Quick cash sale error:', err);
    } finally {
      setIsQuickCheckingOut(false);
    }
  };

  const openCustomerDisplayWindow = () => {
    const customerUrl = `${window.location.origin}${window.location.pathname}?display=customer`;
    const win = window.open(
      customerUrl,
      'BizPilotCustomerDisplay',
      'width=1024,height=768,menubar=no,toolbar=no,location=no,status=no,resizable=yes'
    );
    if (!win) {
      setShowDisplayGuideModal(true);
    }
  };

  const copyDisplayUrl = () => {
    const customerUrl = `${window.location.origin}${window.location.pathname}?display=customer`;
    navigator.clipboard.writeText(customerUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // --------------------------------------------------------
  // GLOBAL BARCODE SCANNER LISTENER (For Physical Scanners)
  // --------------------------------------------------------
  useEffect(() => {
    let barcodeBuffer = '';
    let barcodeTimer: ReturnType<typeof setTimeout> | null = null;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Ignore if typing in an input/textarea
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      ) {
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        barcodeBuffer += e.key;
        if (barcodeTimer) clearTimeout(barcodeTimer);
        barcodeTimer = setTimeout(() => {
          barcodeBuffer = '';
        }, 50); // Scanners type very fast
      } 
      else if (e.key === 'Enter' && barcodeBuffer.length > 2) {
        const scannedCode = barcodeBuffer.trim().toLowerCase();
        barcodeBuffer = '';
        if (barcodeTimer) clearTimeout(barcodeTimer);
        
        const exactSkuMatch = products.find(
          p => !p.archived && (p.sku.toLowerCase() === scannedCode || p.barcode?.toLowerCase() === scannedCode)
        );
        
        if (exactSkuMatch && exactSkuMatch.currentStock > 0) {
          addToCart(exactSkuMatch, 1);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      if (barcodeTimer) clearTimeout(barcodeTimer);
    };
  }, [products, addToCart]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden bg-slate-50">
      
      {/* LEFT COLUMN: Product Catalog & Search */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-3 sm:p-5 border-r border-slate-200">
        
        {/* Top Controls: Search Bar, Customer Display & Recent Sales Button */}
        <div className="flex items-center space-x-2 sm:space-x-3 mb-3 shrink-0">
          <div className="relative flex-1 flex">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="input-search-product"
                type="text"
                placeholder="Rechercher un article (ex: Riz, Sucre, Huile, Savon...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim() !== '') {
                    const searchLower = searchQuery.trim().toLowerCase();
                    const exactSkuMatch = products.find(
                      p => !p.archived && (p.sku.toLowerCase() === searchLower || p.barcode?.toLowerCase() === searchLower)
                    );
                    
                    if (exactSkuMatch && exactSkuMatch.currentStock > 0) {
                      addToCart(exactSkuMatch, 1);
                      setSearchQuery('');
                    } else if (filteredProducts.length === 1 && filteredProducts[0].currentStock > 0) {
                      addToCart(filteredProducts[0], 1);
                      setSearchQuery('');
                    }
                  }
                }}
                className="w-full bg-white border border-slate-200 rounded-l-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Effacer
                </button>
              )}
            </div>
            <button
              onClick={() => setShowScanner(true)}
              className="bg-white hover:bg-slate-50 border border-l-0 border-slate-200 rounded-r-xl px-3 flex items-center justify-center text-slate-600 transition shadow-xs"
              title="Scanner un code-barres"
            >
              <ScanBarcode className="h-4 w-4" />
            </button>
          </div>

          {/* Cash Drawer Quick Trigger & Config */}
          <button
            id="btn-cash-drawer-trigger"
            onClick={() => setShowCashDrawerModal(true)}
            className={`flex items-center space-x-1.5 border px-3 py-2 rounded-xl text-xs font-bold shadow-xs transition shrink-0 cursor-pointer ${
              drawerToast 
                ? 'bg-amber-500 text-white border-amber-600 animate-pulse' 
                : 'bg-amber-50 border-amber-300 hover:bg-amber-100 text-amber-900'
            }`}
            title="Gestion et ouverture automatique du tiroir-caisse"
          >
            <Unlock className="h-4 w-4 text-amber-600" />
            <span className="hidden sm:inline">Tiroir Caisse</span>
          </button>

          {/* 2nd Screen / Customer Display Quick Button */}
          <button
            id="btn-customer-display-trigger"
            onClick={openCustomerDisplayWindow}
            className="flex items-center space-x-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-xl text-xs font-bold shadow-xs transition shrink-0 cursor-pointer"
            title="Ouvrir l'Afficheur Client (2ème Écran pour caisse double écran)"
          >
            <Tv className="h-4 w-4 text-blue-600 animate-pulse" />
            <span className="hidden md:inline">2ème Écran Client</span>
          </button>

          <button
            id="btn-recent-sales"
            onClick={() => setShowRecentSalesModal(true)}
            className="flex items-center space-x-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold shadow-xs transition shrink-0 cursor-pointer"
            title="Historique des ventes du jour"
          >
            <History className="h-4 w-4 text-slate-500" />
            <span className="hidden sm:inline">Dernières Ventes</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 mb-2 shrink-0 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center">
              <Package className="h-10 w-10 mb-2 opacity-50 text-slate-400" />
              <p className="text-sm font-medium text-slate-600">Aucun produit trouvé</p>
              <p className="text-xs text-slate-400 mt-1">Essayez un autre mot-clé ou modifiez la catégorie.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5 pb-20 lg:pb-6">
              {filteredProducts.map(product => {
                const inCart = cart.find(item => item.product.id === product.id);
                const isOutOfStock = product.currentStock <= 0;
                const isLowStock = product.currentStock > 0 && product.currentStock <= product.alertThreshold;

                return (
                  <div
                    key={product.id}
                    id={`pos-product-${product.id}`}
                    onClick={() => {
                      if (!isOutOfStock) addToCart(product, 1);
                    }}
                    className={`bg-white rounded-xl border p-3 flex flex-col justify-between cursor-pointer transition select-none relative group hover:shadow-md ${
                      inCart 
                        ? 'border-blue-500 ring-2 ring-blue-500/20' 
                        : 'border-slate-200 hover:border-slate-300'
                    } ${isOutOfStock ? 'opacity-55 cursor-not-allowed bg-slate-50' : ''}`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {product.sku || product.unit}
                        </span>
                        {isOutOfStock ? (
                          <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                            Rupture
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                            Faible ({product.currentStock})
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">
                            Stock: {product.currentStock}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-tight">
                        {product.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{product.category}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {product.salePrice.toLocaleString()} <span className="text-[10px] font-medium text-slate-500">{business.currency}</span>
                      </span>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        className={`h-7 w-7 rounded-lg flex items-center justify-center transition ${
                          inCart 
                            ? 'bg-blue-600 text-white font-bold text-xs' 
                            : 'bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white'
                        }`}
                      >
                        {inCart ? inCart.quantity : <Plus className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Cart & Checkout Panel */}
      <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col shrink-0 h-auto lg:h-full shadow-lg lg:shadow-none">
        
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Panier en cours
            </h3>
            {totalItemCount > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">
                {totalItemCount} article{totalItemCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-red-600 hover:text-red-700 font-semibold transition"
            >
              Vider
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-64 lg:max-h-none">
          {cart.length === 0 ? (
            <div className="h-48 lg:h-64 flex flex-col items-center justify-center text-slate-400 text-center p-4">
              <ShoppingBag className="h-10 w-10 mb-2 opacity-30 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Le panier est vide</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                Cliquez sur un article du catalogue à gauche pour l'ajouter à la commande.
              </p>
            </div>
          ) : (
            cart.map(item => {
              const itemTotal = (item.unitPrice * item.quantity) - (item.discount || 0);
              return (
                <div
                  key={item.product.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col space-y-1.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-xs text-slate-900 leading-tight">{item.product.name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <select
                          value={item.priceType || 'retail'}
                          onChange={(e) => updateCartItemPriceType(item.product.id, e.target.value as any)}
                          className="text-[10px] bg-white border border-slate-300 rounded px-1 py-0.5 text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="retail">Détail</option>
                          <option value="semi-wholesale">Demi-Gros</option>
                          <option value="wholesale">Gros</option>
                        </select>
                        <p className="text-[10px] text-slate-500">
                          {item.unitPrice.toLocaleString()} {business.currency} / {item.product.unit}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-red-600 p-1 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {/* Quantity controls */}
                    <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="h-6 w-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="h-6 w-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <span className="font-bold text-xs text-slate-900">
                      {itemTotal.toLocaleString()} {business.currency}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Calculation & Checkout Trigger */}
        {cart.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
            
            {/* Global Discount input */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Remise Globale (FCFA) :</span>
              <input
                type="number"
                min="0"
                value={overallDiscount || ''}
                onChange={(e) => setOverallDiscount(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-right text-xs font-bold text-blue-700"
              />
            </div>

            {/* Subtotal & Total */}
            <div className="space-y-1 pt-1 border-t border-slate-200">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Sous-total :</span>
                <span>{subtotal.toLocaleString()} {business.currency}</span>
              </div>
              {overallDiscount > 0 && (
                <div className="flex justify-between text-xs text-blue-700 font-semibold">
                  <span>Remise déduite :</span>
                  <span>-{overallDiscount.toLocaleString()} {business.currency}</span>
                </div>
              )}
              <div className="flex justify-between text-sm sm:text-base font-black text-slate-950 pt-1">
                <span>TOTAL À PAYER :</span>
                <span className="text-blue-700">{totalAmount.toLocaleString()} {business.currency}</span>
              </div>
            </div>

            {/* Fast Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                id="btn-quick-cash-checkout"
                type="button"
                disabled={isQuickCheckingOut}
                onClick={handleQuickCashSale}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white py-3 px-3 rounded-xl font-black text-xs sm:text-sm shadow-md flex items-center justify-center space-x-1.5 transition cursor-pointer"
                title="Valider la vente immédiatement en espèces pour Client Comptoir"
              >
                <Zap className="h-4 w-4 fill-amber-300 text-amber-300" />
                <span>{isQuickCheckingOut ? 'Validation...' : '⚡ Espèces Direct (1 Clic)'}</span>
              </button>

              <button
                id="btn-open-pos-checkout"
                type="button"
                onClick={() => setShowCheckoutModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 px-3 rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center justify-center space-x-1.5 transition cursor-pointer"
                title="Choisir Orange Money, Moov, Wave, Crédit ou Client"
              >
                <CreditCard className="h-4 w-4" />
                <span>Paiements & Options</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Checkout Payment Modal */}
      {showCheckoutModal && (
        <CheckoutModal
          totalAmount={totalAmount}
          subtotal={subtotal}
          discount={overallDiscount}
          onSuccess={handleSaleSuccess}
          onClose={() => setShowCheckoutModal(false)}
        />
      )}

      {/* Receipt Modal */}
      {lastCompletedSale && (
        <ReceiptModal
          sale={lastCompletedSale}
          business={business}
          onClose={() => setLastCompletedSale(null)}
        />
      )}

      {/* Receipt from History Modal */}
      {viewReceiptFromHistory && (
        <ReceiptModal
          sale={viewReceiptFromHistory}
          business={business}
          onClose={() => setViewReceiptFromHistory(null)}
        />
      )}

      {/* Recent Sales History Modal */}
      {showRecentSalesModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm sm:text-base">Historique des Ventes Récentes</h3>
                <p className="text-xs text-slate-400">Tickets enregistrés dans le système</p>
              </div>
              <button
                onClick={() => setShowRecentSalesModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto divide-y divide-slate-100">
              {sales.length === 0 ? (
                <p className="text-center text-slate-400 text-xs py-8">Aucune vente enregistrée.</p>
              ) : (
                sales.slice(0, 15).map(sale => (
                  <div key={sale.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{sale.receiptNumber}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase">
                          {sale.paymentMethod}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {new Date(sale.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • Par {sale.sellerName}
                        {sale.customerName && ` • Client: ${sale.customerName}`}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="font-extrabold text-slate-900">
                        {sale.total.toLocaleString()} {business.currency}
                      </span>
                      <button
                        onClick={() => {
                          setViewReceiptFromHistory(sale);
                        }}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold flex items-center space-x-1"
                        title="Voir / Imprimer le reçu"
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        <span>Reçu</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* BARCODE SCANNER MODAL */}
      {showScanner && (
        <BarcodeScanner
          onScan={(decodedText) => {
            const searchLower = decodedText.trim().toLowerCase();
            const exactSkuMatch = products.find(
              p => !p.archived && (p.sku.toLowerCase() === searchLower || p.barcode?.toLowerCase() === searchLower)
            );
            
            if (exactSkuMatch && exactSkuMatch.currentStock > 0) {
              addToCart(exactSkuMatch, 1);
              setShowScanner(false);
            } else {
              setSearchQuery(decodedText);
              setShowScanner(false);
            }
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* CUSTOMER DISPLAY / 2ND SCREEN GUIDE MODAL */}
      {showDisplayGuideModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
                  <Tv className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Afficheur Client (2ème Écran)</h3>
                  <p className="text-xs text-blue-200">Affichage en temps réel pour caisse double écran</p>
                </div>
              </div>
              <button
                onClick={() => setShowDisplayGuideModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm text-slate-600">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
                <p className="font-semibold mb-1 flex items-center gap-1.5 text-blue-800">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  Synchronisation Instantanée (0ms)
                </p>
                <p className="text-xs text-blue-700">
                  Dès que vous ajoutez, modifiez ou supprimez un article dans le catalogue, le 2ème écran affiche automatiquement les articles, le montant total, et la monnaie à rendre au client.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const customerUrl = `${window.location.origin}${window.location.pathname}?display=customer`;
                    window.open(customerUrl, 'BizPilotCustomerDisplay', 'width=1024,height=768');
                    setShowDisplayGuideModal(false);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition shadow-md cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Ouvrir la Fenêtre de l'Écran Client</span>
                </button>

                <button
                  onClick={copyDisplayUrl}
                  className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2.5 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  {copiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-500" />}
                  <span>{copiedLink ? 'Lien de l\'écran client copié !' : 'Copier le lien pour une tablette ou autre écran'}</span>
                </button>

                <button
                  onClick={() => {
                    setShowDisplayGuideModal(false);
                    setActiveTab('customer_display');
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <Tv className="h-4 w-4 text-indigo-600" />
                  <span>Tester & Prévisualiser dans BizPilot</span>
                </button>
              </div>

              {/* Guide steps */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Comment positionner le 2ème écran :</h4>
                <ol className="list-decimal pl-4 space-y-1.5 text-xs text-slate-500">
                  <li>Cliquez sur <strong>"Ouvrir la Fenêtre de l'Écran Client"</strong> ci-dessus.</li>
                  <li>Glissez la nouvelle fenêtre ouverte vers votre deuxième moniteur ou écran orienté client.</li>
                  <li>Appuyez sur la touche <strong>F11</strong> (ou le bouton Plein Écran) pour masquer les barres du navigateur.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cash Drawer Notification Banner */}
      {drawerToast && (
        <div className="fixed top-18 right-5 z-50 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-amber-300">
          <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Unlock className="h-5 w-5 text-white animate-bounce" />
          </div>
          <div>
            <p className="font-black text-xs sm:text-sm leading-tight flex items-center gap-1.5">
              Caisse à Monnaie Ouverte 💵
            </p>
            <p className="text-[11px] text-amber-100 font-medium">{drawerToast.reason}</p>
          </div>
        </div>
      )}

      {/* Cash Drawer Control & Configuration Modal */}
      {showCashDrawerModal && (
        <CashDrawerModal 
          onClose={() => setShowCashDrawerModal(false)} 
          operatorName={currentUser?.name}
        />
      )}
    </div>
  );
};
