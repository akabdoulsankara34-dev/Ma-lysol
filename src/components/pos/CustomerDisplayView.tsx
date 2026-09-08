import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CustomerDisplayState, 
  getInitialDisplayState,
  playPosTone,
  subscribeCustomerDisplay,
  runCustomerDisplaySimulation
} from '../../lib/customerDisplayService';
import { 
  Store, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CreditCard, 
  Smartphone, 
  Banknote, 
  QrCode,
  Tag,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Award,
  Zap,
  Play,
  ExternalLink,
  Tv,
  Check
} from 'lucide-react';

interface CustomerDisplayViewProps {
  isStandaloneWindow?: boolean;
}

export const CustomerDisplayView: React.FC<CustomerDisplayViewProps> = ({ isStandaloneWindow = false }) => {
  const { setActiveTab } = useApp();
  const [displayState, setDisplayState] = useState<CustomerDisplayState>(getInitialDisplayState);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [isLiveConnected, setIsLiveConnected] = useState(true);
  const [lastSignalAgo, setLastSignalAgo] = useState('Connecté');
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationStep, setSimulationStep] = useState<string | null>(null);
  
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  const tableEndRef = useRef<HTMLDivElement>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // Live Digital Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      // Update human-readable ping indicator
      const diffSec = Math.floor((Date.now() - lastUpdateRef.current) / 1000);
      if (diffSec < 2) {
        setLastSignalAgo('Signal immédiat (0s)');
      } else if (diffSec < 60) {
        setLastSignalAgo(`Signal il y a ${diffSec}s`);
      } else {
        setLastSignalAgo(`Signal il y a ${Math.floor(diffSec / 60)}min`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Marketing banner rotator for idle state
  useEffect(() => {
    const bannerTimer = setInterval(() => {
      setActiveBannerIndex(prev => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(bannerTimer);
  }, []);

  // Multi-channel Real-time listener: BroadcastChannel + Storage + CustomEvent + Poller
  useEffect(() => {
    const unsubscribe = subscribeCustomerDisplay((newState: CustomerDisplayState) => {
      lastUpdateRef.current = Date.now();
      setIsLiveConnected(true);
      setLastSignalAgo('Signal immédiat (0s)');

      setDisplayState(prevState => {
        // Play tone on new items or sale if sound enabled
        if (soundEnabledRef.current) {
          if (newState.lastCompletedSale && (!prevState.lastCompletedSale || newState.lastCompletedSale.timestamp !== prevState.lastCompletedSale.timestamp)) {
            playPosTone('success');
          } else if (newState.items.length > prevState.items.length) {
            playPosTone('beep');
          }
        }
        return newState;
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Auto-scroll table when new items are added
  useEffect(() => {
    if (tableEndRef.current) {
      tableEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayState.items]);

  // Fullscreen handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => console.warn('Fullscreen error:', err));
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => console.warn('Exit fullscreen error:', err));
    }
  };

  const handleRunSimulation = () => {
    if (simulationRunning) return;
    setSimulationRunning(true);
    setSimulationStep('Démarrage de la simulation...');
    
    runCustomerDisplaySimulation((step) => {
      setSimulationStep(step);
      if (step === 'Écran de veille') {
        setTimeout(() => {
          setSimulationRunning(false);
          setSimulationStep(null);
        }, 1500);
      }
    });
  };

  const openDedicatedWindow = () => {
    const customerUrl = `${window.location.origin}${window.location.pathname}?display=customer`;
    window.open(customerUrl, 'BizPilotCustomerDisplay', 'width=1024,height=768,menubar=no,toolbar=no,location=no,status=no,resizable=yes');
  };

  const {
    businessName,
    currency,
    phone,
    address,
    slogan,
    items,
    itemCount,
    subtotal,
    discount,
    totalAmount,
    customerName,
    loyaltyPoints,
    loyaltyTier,
    lastScannedItem,
    checkoutState,
    lastCompletedSale
  } = displayState;

  // Determine if a sale was just completed within the last 15 seconds
  const isRecentSaleCompleted = 
    lastCompletedSale && 
    items.length === 0 && 
    (Date.now() - (lastCompletedSale.timestamp || 0) < 15000);

  const isIdle = items.length === 0 && !isRecentSaleCompleted;

  const paymentMethodLabel = (method?: string) => {
    switch (method) {
      case 'cash': return 'Espèces (Cash)';
      case 'orange_money': return 'Orange Money (OM)';
      case 'moov_money': return 'Moov Money';
      case 'wave_coris': return 'Wave / Coris';
      case 'credit': return 'Vente à Crédit';
      case 'split': return 'Paiement Mixte';
      default: return method || 'Espèces';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      
      {/* Test / Control Toolbar when rendered within BizPilot interface */}
      {!isStandaloneWindow && (
        <div className="bg-slate-900 border-b border-indigo-950/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setActiveTab('pos')}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl font-bold border border-slate-700 transition cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Retour à la Caisse (POS)</span>
            </button>
            <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {lastSignalAgo}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleRunSimulation}
              disabled={simulationRunning}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition shadow-xs cursor-pointer ${
                simulationRunning
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
            >
              <Play className={`h-3.5 w-3.5 ${simulationRunning ? 'animate-spin' : ''}`} />
              <span>{simulationRunning ? simulationStep || 'Simulation en cours...' : 'Tester la Démo en Direct'}</span>
            </button>

            <button
              onClick={openDedicatedWindow}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl font-bold transition shadow-xs cursor-pointer"
              title="Ouvrir dans une fenêtre indépendante pour le moniteur client"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Ouvrir Fenêtre Dédiée (2ème Écran)</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. TOP HEADER (Always visible) */}
      <header className="bg-slate-900 border-b border-slate-800/80 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-lg shrink-0">
        {/* Brand & Store Name */}
        <div className="flex items-center space-x-3.5">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-black text-xl border border-blue-400/30">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>{businessName || 'BizPilot Burkina'}</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Afficheur Client
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium truncate max-w-md">
              {slogan || address || 'Bienvenue dans notre boutique'}
            </p>
          </div>
        </div>

        {/* Right Controls: Live Clock, Sound & Fullscreen */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Live Digital Clock */}
          <div className="hidden sm:flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3.5 py-1.5 text-slate-200 shadow-inner">
            <Clock className="h-4 w-4 text-blue-400" />
            <span className="font-mono text-sm font-bold tracking-wider">
              {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            title={soundEnabled ? 'Désactiver les signaux sonores' : 'Activer les signaux sonores'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            title={isFullscreen ? 'Quitter le plein écran' : 'Mettre en plein écran (2ème Écran)'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* 2. MAIN DISPLAY CONTENT AREA */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">

        {/* STATE A: RECENT SALE COMPLETED / THANK YOU SCREEN */}
        {isRecentSaleCompleted && lastCompletedSale && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl border border-emerald-500/30 shadow-2xl animate-in zoom-in-95 duration-300 text-center relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="h-20 w-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mb-5 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="h-12 w-12 animate-bounce" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">
              Merci pour votre achat !
            </h2>
            <p className="text-base sm:text-lg text-slate-300 max-w-lg mb-8 font-medium">
              Votre transaction a été enregistrée avec succès. À très bientôt chez <span className="text-emerald-400 font-bold">{businessName}</span>.
            </p>

            {/* Receipt Summary Card */}
            <div className="w-full max-w-lg bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                <span className="text-sm text-slate-400 font-medium">Ticket de Caisse</span>
                <span className="text-sm font-mono font-bold text-white bg-slate-700/80 px-2.5 py-1 rounded-lg">
                  #{lastCompletedSale.receiptNumber}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-base text-slate-300 font-medium">Montant Total Réglé :</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {lastCompletedSale.totalAmount.toLocaleString()} {currency}
                </span>
              </div>

              {lastCompletedSale.receivedAmount !== undefined && lastCompletedSale.receivedAmount > lastCompletedSale.totalAmount && (
                <div className="flex justify-between items-center py-1 text-sm text-slate-300">
                  <span className="font-medium">Montant Reçu :</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {lastCompletedSale.receivedAmount.toLocaleString()} {currency}
                  </span>
                </div>
              )}

              {lastCompletedSale.changeToReturn !== undefined && lastCompletedSale.changeToReturn > 0 && (
                <div className="flex justify-between items-center py-2 bg-emerald-950/40 border border-emerald-600/30 rounded-xl px-4">
                  <span className="text-sm text-emerald-300 font-bold">Monnaie Rendue :</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    {lastCompletedSale.changeToReturn.toLocaleString()} {currency}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 text-xs text-slate-400">
                <span>Mode : {paymentMethodLabel(lastCompletedSale.paymentMethod)}</span>
                {lastCompletedSale.customerName && (
                  <span>Client : <strong className="text-slate-200">{lastCompletedSale.customerName}</strong></span>
                )}
              </div>
            </div>

            <div className="mt-8 flex items-center gap-2 text-xs text-slate-500 font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Paiement sécurisé et vérifié • Ticket certifié</span>
            </div>
          </div>
        )}

        {/* STATE B: IDLE / WELCOME SCREEN (When cart is empty) */}
        {isIdle && (
          <div className="flex-1 flex flex-col items-center justify-between p-6 sm:p-10 bg-slate-900/60 rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden">
            {/* Ambient Background Gradient */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-inner">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Caisse Ouverte & Disponible</span>
            </div>

            {/* Center Hero Message */}
            <div className="text-center my-auto space-y-4 max-w-2xl z-10">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 mx-auto flex items-center justify-center shadow-xl shadow-blue-500/25 border-2 border-blue-400/30">
                <Store className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
              </div>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                Bienvenue chez <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">{businessName}</span>
              </h2>

              <p className="text-base sm:text-xl text-slate-300 font-medium">
                Veuillez présenter vos articles au comptoir pour l'encaissement.
              </p>

              {/* Dynamic Banner Slider */}
              <div className="pt-4">
                {activeBannerIndex === 0 && (
                  <div className="inline-flex items-center gap-2 bg-slate-800/90 border border-slate-700 text-slate-200 px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-lg animate-in fade-in duration-300">
                    <Banknote className="h-5 w-5 text-emerald-400" />
                    <span>Paiements en Espèces (CFA) acceptés avec rendu de monnaie exact</span>
                  </div>
                )}
                {activeBannerIndex === 1 && (
                  <div className="inline-flex items-center gap-2 bg-slate-800/90 border border-slate-700 text-slate-200 px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-lg animate-in fade-in duration-300">
                    <Smartphone className="h-5 w-5 text-orange-400" />
                    <span>Paiements Mobile Money : Orange Money, Moov Money & Wave</span>
                  </div>
                )}
                {activeBannerIndex === 2 && (
                  <div className="inline-flex items-center gap-2 bg-slate-800/90 border border-slate-700 text-slate-200 px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-lg animate-in fade-in duration-300">
                    <Award className="h-5 w-5 text-amber-400" />
                    <span>Programme Fidélité : Cumulez des points à chaque passage en caisse !</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Payment Badges */}
            <div className="w-full pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-400 font-semibold">
              <div className="flex items-center gap-2 bg-slate-800/50 px-3.5 py-1.5 rounded-xl border border-slate-700/50">
                <Banknote className="h-4 w-4 text-emerald-400" />
                <span>Espèces Cash</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/50 px-3.5 py-1.5 rounded-xl border border-slate-700/50">
                <span className="h-3 w-3 rounded-full bg-orange-500"></span>
                <span>Orange Money</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/50 px-3.5 py-1.5 rounded-xl border border-slate-700/50">
                <span className="h-3 w-3 rounded-full bg-blue-500"></span>
                <span>Moov Money</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/50 px-3.5 py-1.5 rounded-xl border border-slate-700/50">
                <span className="h-3 w-3 rounded-full bg-cyan-400"></span>
                <span>Wave Coris</span>
              </div>
            </div>
          </div>
        )}

        {/* STATE C: ACTIVE TRANSACTION IN REAL TIME (Items in Cart) */}
        {!isIdle && !isRecentSaleCompleted && (
          <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 sm:gap-6 overflow-hidden">
            
            {/* LEFT COLUMN: LIVE ARTICLES STREAM (7 Columns) */}
            <div className="flex-1 lg:col-span-7 flex flex-col bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              
              {/* Last Scanned Item Alert Banner */}
              {lastScannedItem && (
                <div className="bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-blue-900/90 border-b border-blue-500/30 px-5 py-3 flex items-center justify-between shadow-inner animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div className="overflow-hidden">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 block">Dernier article ajouté :</span>
                      <h4 className="text-sm sm:text-base font-bold text-white truncate">
                        {lastScannedItem.name}
                      </h4>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-3">
                    <span className="text-xs text-blue-200 block font-medium">Qté: {lastScannedItem.quantity}</span>
                    <span className="text-sm font-black text-amber-300 font-mono">
                      {lastScannedItem.total.toLocaleString()} {currency}
                    </span>
                  </div>
                </div>
              )}

              {/* Table Header */}
              <div className="px-5 py-3 bg-slate-800/70 border-b border-slate-700/80 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>Panier en cours ({itemCount} article{itemCount > 1 ? 's' : ''})</span>
                <span className="text-slate-300 font-mono">Prix Unitaire • Total</span>
              </div>

              {/* Live Articles List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 sm:p-3 space-y-1">
                {items.map((item, idx) => {
                  const isLastItem = lastScannedItem?.name === item.name;

                  return (
                    <div 
                      key={item.id || `${item.productId}-${idx}`}
                      className={`p-3 rounded-2xl flex items-center justify-between transition-all duration-200 ${
                        isLastItem 
                          ? 'bg-blue-950/40 border border-blue-500/40 shadow-md' 
                          : 'bg-slate-900/40 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center space-x-3 overflow-hidden pr-3">
                        <span className="h-7 w-7 rounded-xl bg-slate-800 text-slate-300 font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-slate-700">
                          {idx + 1}
                        </span>
                        <div className="overflow-hidden">
                          <h4 className="font-extrabold text-sm sm:text-base text-white truncate">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono text-slate-300">
                              {item.unitPrice.toLocaleString()} {currency}
                            </span>
                            {item.unit && (
                              <span className="text-slate-500">• {item.unit}</span>
                            )}
                            {item.discount > 0 && (
                              <span className="text-red-400 font-medium">Remise: -{item.discount.toLocaleString()} {currency}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantity & Line Total */}
                      <div className="text-right shrink-0">
                        <div className="inline-flex items-center justify-center bg-slate-800 border border-slate-700 text-blue-300 font-mono font-black text-sm px-2.5 py-1 rounded-lg mb-1">
                          x {item.quantity}
                        </div>
                        <div className="text-base sm:text-lg font-black text-white font-mono">
                          {item.total.toLocaleString()} <span className="text-xs font-normal text-slate-400">{currency}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={tableEndRef} />
              </div>

              {/* Customer Loyalty Banner if assigned */}
              {customerName && (
                <div className="bg-slate-800/80 border-t border-slate-700 px-4 py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Award className="h-4 w-4 text-amber-400" />
                    <span>Client : <strong className="text-white">{customerName}</strong></span>
                  </div>
                  {loyaltyPoints !== undefined && (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
                      ⭐ {loyaltyPoints} points fidélité
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: BIG TOTAL & CHECKOUT TENDER DISPLAY (5 Columns) */}
            <div className="shrink-0 lg:col-span-5 flex flex-col justify-between space-y-4">
              
              {/* Grand Total Highlight Box */}
              <div className="bg-gradient-to-br from-blue-900/90 via-indigo-950 to-slate-900 rounded-3xl p-6 border-2 border-blue-500/40 shadow-2xl flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                  <ShoppingBag className="h-36 w-36 text-white" />
                </div>

                <div>
                  <span className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-blue-300 flex items-center gap-1.5 mb-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-400 animate-ping"></span>
                    Total Net à Payer
                  </span>

                  {/* Giant Price Text */}
                  <div className="my-2">
                    <span className="text-4xl sm:text-5xl xl:text-6xl font-black text-white font-mono tracking-tight drop-shadow-md">
                      {totalAmount.toLocaleString()}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-blue-300 ml-2 font-mono">
                      {currency}
                    </span>
                  </div>
                </div>

                {/* Subtotals & Discounts Breakdown */}
                <div className="pt-4 mt-4 border-t border-blue-500/30 space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Sous-total ({itemCount} articles) :</span>
                    <span className="font-mono font-bold">{subtotal.toLocaleString()} {currency}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-red-400 font-bold bg-red-950/40 px-3 py-1 rounded-lg border border-red-800/40">
                      <span>Remise accordée :</span>
                      <span className="font-mono">-{discount.toLocaleString()} {currency}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Checkout / Cash Payment & Change Box */}
              {checkoutState?.isCheckingOut ? (
                <div className="bg-slate-900 rounded-3xl p-5 border border-emerald-500/40 shadow-2xl space-y-4 animate-in slide-in-from-bottom-3 duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Banknote className="h-4 w-4" />
                      Encaissement en Cours
                    </span>
                    <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">
                      {paymentMethodLabel(checkoutState.paymentMethod)}
                    </span>
                  </div>

                  {/* Montant Reçu */}
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-slate-300 font-medium">Montant Reçu :</span>
                    <span className="text-xl sm:text-2xl font-black text-white font-mono">
                      {(checkoutState.receivedAmount || totalAmount).toLocaleString()} {currency}
                    </span>
                  </div>

                  {/* MONNAIE À RENDRE (Huge Emerald Display) */}
                  <div className="bg-emerald-950/60 border-2 border-emerald-500 rounded-2xl p-4 text-center shadow-lg">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-300 block mb-1">
                      💰 Monnaie à Vous Rendre
                    </span>
                    <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight animate-pulse">
                      {(checkoutState.changeToReturn || 0).toLocaleString()} <span className="text-lg font-bold">{currency}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/60 rounded-3xl p-4 border border-slate-800 text-center flex flex-col items-center justify-center space-y-2 text-xs text-slate-400">
                  <ShieldCheck className="h-6 w-6 text-blue-400" />
                  <p className="font-medium text-slate-300">
                    Calcul automatique des prix et contrôle immédiat des montants
                  </p>
                  <span className="text-[11px] text-slate-500">
                    Demandez systématiquement votre ticket de caisse après encaissement.
                  </span>
                </div>
              )}

            </div>

          </div>
        )}

      </main>

      {/* 3. BOTTOM TICKER FOOTER */}
      <footer className="bg-slate-900/90 border-t border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-slate-400 font-medium">
        <div className="flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>Afficheur Caisse en direct</span>
          {phone && <span className="hidden sm:inline">• Tél : {phone}</span>}
        </div>
        <div className="flex items-center space-x-2 text-slate-500">
          <span>BizPilot Burkina POS</span>
        </div>
      </footer>

    </div>
  );
};
