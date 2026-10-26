import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Keyboard,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Settings,
  HelpCircle,
  Zap,
  RotateCcw,
  Package,
  Activity,
  MousePointer,
  Sparkles,
  Barcode,
  Sliders,
  QrCode,
  Link2,
  Search,
  ExternalLink
} from 'lucide-react';
import {
  usbBarcodeScanner,
  UsbScannerSettings,
  LastScanInfo,
  RawKeyStrokeEvent,
  isProductBarcodeMatch,
  stripAimAndControlChars,
} from '../../lib/usbBarcodeScanner';
import { useApp } from '../../context/AppContext';
import { generateCode128Svg } from '../../lib/barcodeGenerator';
import { Product } from '../../types';

interface UsbScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UsbScannerModal: React.FC<UsbScannerModalProps> = ({ isOpen, onClose }) => {
  const { products, business, updateProduct, addToCart } = useApp();
  const [settings, setSettings] = useState<UsbScannerSettings>(usbBarcodeScanner.getSettings());
  const [testScans, setTestScans] = useState<{ barcode: string; info: LastScanInfo }[]>([]);
  const [activeTab, setActiveTab] = useState<'diagnostic' | 'codes' | 'test' | 'settings' | 'guide'>('diagnostic');
  const [isWindowFocused, setIsWindowFocused] = useState<boolean>(true);
  
  // Real-time keystroke live monitor
  const [recentKeyStrokes, setRecentKeyStrokes] = useState<RawKeyStrokeEvent[]>([]);
  const [currentBufferDisplay, setCurrentBufferDisplay] = useState<string>('');
  const [lastPulseTimestamp, setLastPulseTimestamp] = useState<number>(0);
  const testInputRef = useRef<HTMLInputElement>(null);

  // Link barcode to product modal state
  const [linkingBarcode, setLinkingBarcode] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState<string>('');
  const [linkSuccessMsg, setLinkSuccessMsg] = useState<string | null>(null);

  // Monitor window focus
  useEffect(() => {
    const unsubscribe = usbBarcodeScanner.onFocusChange((focused) => {
      setIsWindowFocused(focused);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Subscribe to raw keystrokes & completed scans
  useEffect(() => {
    if (!isOpen) return;

    setSettings(usbBarcodeScanner.getSettings());
    if (testInputRef.current) {
      testInputRef.current.focus();
    }

    const unsubscribeScan = usbBarcodeScanner.subscribe((barcode, info) => {
      setTestScans((prev) => [{ barcode, info }, ...prev.slice(0, 9)]);
      setCurrentBufferDisplay('');
      setLastPulseTimestamp(Date.now());
    });

    const unsubscribeRaw = usbBarcodeScanner.subscribeRawKeys((rawEvent) => {
      setRecentKeyStrokes((prev) => [rawEvent, ...prev.slice(0, 7)]);
      setCurrentBufferDisplay(rawEvent.currentBuffer);
      setLastPulseTimestamp(Date.now());
    });

    return () => {
      unsubscribeScan();
      unsubscribeRaw();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateSetting = (key: keyof UsbScannerSettings, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    usbBarcodeScanner.saveSettings({ [key]: value });
  };

  const handleTestBeep = () => {
    usbBarcodeScanner.playBeep();
  };

  const handleTestErrorBeep = () => {
    usbBarcodeScanner.playError();
  };

  const handleActivateFocus = () => {
    usbBarcodeScanner.focusApplication();
    setIsWindowFocused(true);
    testInputRef.current?.focus();
  };

  const findProductForCode = (code: string, alternatives: string[] = []) => {
    return products.find(p => !p.archived && isProductBarcodeMatch(p, code, { alternatives } as any));
  };

  const handleAssignBarcodeToProduct = async (product: Product, barcode: string) => {
    try {
      const cleanBarcode = stripAimAndControlChars(barcode).trim();
      await updateProduct(product.id, { barcode: cleanBarcode });
      setLinkSuccessMsg(`✅ Code "${cleanBarcode}" lié avec succès à "${product.name}" !`);
      setTimeout(() => {
        setLinkingBarcode(null);
        setLinkSuccessMsg(null);
      }, 2000);
    } catch (err) {
      console.error('Erreur liaison code-barres:', err);
    }
  };

  const filteredProductsToLink = products
    .filter(p => !p.archived)
    .filter(p => {
      if (!productSearch.trim()) return true;
      const term = productSearch.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        (p.barcode && p.barcode.toLowerCase().includes(term))
      );
    })
    .slice(0, 15);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2.5 rounded-xl shadow-md transition-all duration-300 ${
              Date.now() - lastPulseTimestamp < 1500 ? 'bg-emerald-500 scale-110 ring-4 ring-emerald-400/40' : 'bg-blue-600'
            }`}>
              <Keyboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm sm:text-base">Scanner USB (Douchette Barcode HID)</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                  Écouteur USB Actif
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Diagnostic en direct & prise en charge de toutes les marques de douchettes (Netum, Inateck, Tera, etc.)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-1 text-xs font-bold shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('diagnostic')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'diagnostic'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Diagnostic & Détection Directe</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('codes')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'codes'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="h-3.5 w-3.5 text-indigo-600" />
            <span className="font-extrabold text-indigo-700">Codes de Réglage Douchette</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-indigo-100 text-indigo-800">Scannable</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('test')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'test'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Historique & Simulation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Réglages & Vitesse</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'guide'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Guide Pas-à-Pas</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: DIAGNOSTIC DIRECT */}
          {activeTab === 'diagnostic' && (
            <div className="space-y-4">

              {/* Status Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3 text-xs">
                  <div className="p-2 bg-emerald-600 text-white rounded-lg">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-900">Intercepteur Matériel Prêt</div>
                    <div className="text-emerald-700 text-[11px]">Écoute globale sur toute l'application (Délai : {settings.maxIntervalMs}ms)</div>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                  isWindowFocused 
                    ? 'bg-blue-50 border-blue-200 text-blue-900' 
                    : 'bg-amber-100 border-amber-400 text-amber-950 shadow-md ring-2 ring-amber-300'
                }`}>
                  <div className="flex items-center space-x-2.5">
                    <MousePointer className={`h-4 w-4 ${isWindowFocused ? 'text-blue-600' : 'text-amber-600 animate-bounce'}`} />
                    <div>
                      <div className="font-bold">
                        {isWindowFocused ? 'Fenêtre Active (Focus OK)' : 'Attention : Cliquez ici !'}
                      </div>
                      <div className="text-[11px] opacity-80">
                        {isWindowFocused ? 'Prêt à recevoir les signaux du scanner' : 'Le navigateur a perdu le focus'}
                      </div>
                    </div>
                  </div>
                  {!isWindowFocused && (
                    <button
                      type="button"
                      onClick={handleActivateFocus}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs animate-pulse"
                    >
                      Activer le focus
                    </button>
                  )}
                </div>
              </div>

              {/* Dedicated Focusable Test Field */}
              <div className="bg-slate-900 rounded-2xl p-4 text-white space-y-3 border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-slate-300 font-mono">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      Date.now() - lastPulseTimestamp < 1500 ? 'bg-emerald-400 ring-4 ring-emerald-400/50' : 'bg-emerald-400 animate-ping'
                    }`}></span>
                    <span className="font-bold text-emerald-400">ZONE D'ÉCOUTE ET DE SCAN DIRECT :</span>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                    Mode Clavier Émulation HID
                  </span>
                </div>

                <div className="relative">
                  <input
                    ref={testInputRef}
                    type="text"
                    placeholder="Pointez votre douchette USB sur un code-barres et appuyez sur la gâchette..."
                    className="w-full bg-slate-800/90 border-2 border-emerald-500/70 focus:border-emerald-400 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 font-mono"
                    onFocus={() => setIsWindowFocused(true)}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1.5 text-emerald-400 text-xs font-mono">
                    <Barcode className="h-4 w-4" />
                    <span className="hidden sm:inline">Prêt</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  💡 <strong>Comment tester ?</strong> Ne touchez à rien et appuyez simplement sur la gâchette de votre lecteur USB. Si vous êtes sur un ordinateur portable, assurez-vous que la prise USB est bien enfichée.
                </p>

                {/* Real-time Keystroke visualizer */}
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono flex items-center space-x-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                      <span>Tampon instantané :</span>
                    </span>
                    <span className="font-mono font-bold text-amber-300">
                      {currentBufferDisplay ? `[ ${currentBufferDisplay} ]` : '(En attente du premier coup de scanner)'}
                    </span>
                  </div>

                  {/* Keystrokes timeline */}
                  <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
                    {recentKeyStrokes.length === 0 ? (
                      <span className="text-[10px] text-slate-500 italic">
                        Dès que vous appuierez sur la gâchette, les impulsions milliseconde par milliseconde apparaîtront ici.
                      </span>
                    ) : (
                      recentKeyStrokes.slice(0, 8).map((ks, i) => (
                        <div
                          key={i}
                          className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg flex flex-col items-center shrink-0 font-mono text-[10px]"
                        >
                          <span className="font-black text-emerald-400 text-xs">{ks.key}</span>
                          <span className="text-slate-400 text-[9px]">{ks.intervalMs}ms</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Latest Diagnostic Result */}
              {testScans.length > 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-2.5 animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span className="font-extrabold text-sm text-emerald-950">
                        Signal Douchette Reçu avec Succès !
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold">
                      Terminaison : {testScans[0].info.terminator.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                      <span className="text-slate-400 text-[10px] block">Code Brut (Raw)</span>
                      <span className="font-black text-slate-800 truncate block">{testScans[0].info.raw}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                      <span className="text-slate-400 text-[10px] block">Code Décodé</span>
                      <span className="font-black text-emerald-700 truncate block">{testScans[0].barcode}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                      <span className="text-slate-400 text-[10px] block">Vitesse Moyenne</span>
                      <span className="font-black text-blue-600 block">{testScans[0].info.avgIntervalMs} ms / touche</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                      <span className="text-slate-400 text-[10px] block">Durée Totale</span>
                      <span className="font-black text-slate-700 block">{testScans[0].info.durationMs} ms ({testScans[0].info.charCount} car.)</span>
                    </div>
                  </div>

                  {/* Matching Article In Catalog */}
                  {(() => {
                    const matched = findProductForCode(testScans[0].barcode, testScans[0].info.alternatives);
                    return matched ? (
                      <div className="p-3 bg-white rounded-xl border border-emerald-300 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2.5">
                          <Package className="h-4 w-4 text-emerald-600" />
                          <div>
                            <span className="font-bold text-slate-900">{matched.name}</span>
                            <span className="text-slate-500 text-[11px] ml-2">
                              (Prix : {matched.salePrice.toLocaleString('fr-FR')} {business.currency} • Stock : {matched.currentStock} {matched.unit})
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Article Trouvé dans la base
                        </span>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-900">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                          <div>
                            <span className="font-bold">Code non attribué :</span>
                            <span className="text-slate-600 text-[11px] ml-1">
                              Ce code est bien reçu par le scanner, mais aucun article ne le porte encore.
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setLinkingBarcode(testScans[0].barcode);
                            setProductSearch('');
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center space-x-1.5 shrink-0 shadow-xs cursor-pointer"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                          <span>Lier à un article existant</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: CODES DE RÉGLAGE DOUCHETTE MATÉRIEL (NETUM / UNIVERSEL) */}
          {activeTab === 'codes' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                    <QrCode className="h-4 w-4" />
                  </div>
                  <h4 className="font-extrabold text-indigo-950 text-sm">
                    Codes-barres Officiels de Configuration & Réparation Douchette
                  </h4>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Si votre douchette USB s'allume mais <strong>n'écrit rien sur l'ordinateur</strong>, elle a probablement été basculée par erreur en mode <em>Port Série Virtuel (VCOM)</em> ou a perdu son suffixe <em>Entrée (CR)</em>. 
                  <strong> Pointez la douchette directement sur ces codes affichés sur votre écran pour la réparer instantanément :</strong>
                </p>
              </div>

              {/* Barcode Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Mode Clavier USB HID */}
                <div className="p-4 bg-white border-2 border-indigo-300 rounded-2xl shadow-xs space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-md text-[10px] font-black uppercase">
                        Étape 1 (Indispensable)
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Netum / Tera / Universel</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-xs">
                      1. Activer le Mode Clavier USB (USB HID Keyboard)
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Force le scanner à se comporter comme un clavier USB standard afin que le navigateur web et BizPilot puissent recevoir les codes.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                    <div 
                      className="w-full max-w-[240px] py-1"
                      dangerouslySetInnerHTML={{ 
                        __html: generateCode128Svg('USB-HID-KB', { height: 60, fontSize: 10 }) 
                      }} 
                    />
                    <span className="text-[10px] font-mono font-bold text-indigo-600 mt-1">
                      Scannez ce code sur l'écran
                    </span>
                  </div>
                </div>

                {/* 2. Ajouter Touche Entrée (CR / Enter Suffix) */}
                <div className="p-4 bg-white border-2 border-indigo-300 rounded-2xl shadow-xs space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-black uppercase">
                        Étape 2 (Recommandé)
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Suffixe Validation</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-xs">
                      2. Ajouter la Touche Entrée (Suffixe Enter / CR+LF)
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Configure la douchette pour qu'elle valide immédiatement après avoir lu le code, permettant l'ajout instantané en caisse.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                    <div 
                      className="w-full max-w-[240px] py-1"
                      dangerouslySetInnerHTML={{ 
                        __html: generateCode128Svg('ENTER-SUFFIX', { height: 60, fontSize: 10 }) 
                      }} 
                    />
                    <span className="text-[10px] font-mono font-bold text-emerald-600 mt-1">
                      Scannez ce code sur l'écran
                    </span>
                  </div>
                </div>

                {/* 3. Mode Clavier Français AZERTY */}
                <div className="p-4 bg-white border-2 border-blue-300 rounded-2xl shadow-xs space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-2 py-0.5 bg-blue-600 text-white rounded-md text-[10px] font-black uppercase">
                        Configuration Clavier
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">AZERTY Français</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-xs">
                      3. Mode Clavier Français (AZERTY)
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Configure la douchette pour qu'elle émette les chiffres directement sans nécessiter la touche Shift sous Windows français.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                    <div 
                      className="w-full max-w-[240px] py-1"
                      dangerouslySetInnerHTML={{ 
                        __html: generateCode128Svg('FRENCH-KB', { height: 60, fontSize: 10 }) 
                      }} 
                    />
                    <span className="text-[10px] font-mono font-bold text-blue-600 mt-1">
                      Scannez pour mode AZERTY
                    </span>
                  </div>
                </div>

                {/* 4. Réinitialisation Usine */}
                <div className="p-4 bg-white border border-slate-300 rounded-2xl shadow-xs space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-2 py-0.5 bg-rose-600 text-white rounded-md text-[10px] font-black uppercase">
                        Secours
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Reset</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-xs">
                      4. Réinitialisation Paramètres d'Usine (Factory Reset)
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Restaure la douchette à ses réglages d'origine si elle a été déréglée ou si un mauvais code a été scanné.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                    <div 
                      className="w-full max-w-[240px] py-1"
                      dangerouslySetInnerHTML={{ 
                        __html: generateCode128Svg('FACTORY-RESET', { height: 60, fontSize: 10 }) 
                      }} 
                    />
                    <span className="text-[10px] font-mono font-bold text-rose-600 mt-1">
                      Scannez ce code sur l'écran
                    </span>
                  </div>
                </div>

                {/* 5. Test Direct Modèle W572 */}
                <div className="p-4 bg-white border-2 border-emerald-400 rounded-2xl shadow-xs space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-black uppercase">
                        Test Modèle
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Code 128</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-xs">
                      5. Test Modèle : W572
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Scannez ce code modèle directement sur l'écran pour vérifier la compatibilité immédiate avec les références alphanumériques.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                    <div 
                      className="w-full max-w-[240px] py-1"
                      dangerouslySetInnerHTML={{ 
                        __html: generateCode128Svg('W572', { height: 60, fontSize: 10 }) 
                      }} 
                    />
                    <span className="text-[10px] font-mono font-bold text-emerald-600 mt-1">
                      W572 (Modèle Boutique)
                    </span>
                  </div>
                </div>

                {/* 6. Test Direct Modèle M255 */}
                <div className="p-4 bg-white border-2 border-emerald-400 rounded-2xl shadow-xs space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-black uppercase">
                        Test Modèle
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Code 128</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-xs">
                      6. Test Modèle : M255
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Scannez ce code modèle pour tester la détection de la lettre M et des chiffres sur clavier AZERTY ou QWERTY.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                    <div 
                      className="w-full max-w-[240px] py-1"
                      dangerouslySetInnerHTML={{ 
                        __html: generateCode128Svg('M255', { height: 60, fontSize: 10 }) 
                      }} 
                    />
                    <span className="text-[10px] font-mono font-bold text-emerald-600 mt-1">
                      M255 (Modèle Boutique)
                    </span>
                  </div>
                </div>

                {/* 7. Test Immédiat Article Réel EAN-13 */}
                <div className="p-4 bg-white border-2 border-emerald-400 rounded-2xl shadow-xs space-y-2.5 flex flex-col justify-between md:col-span-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-black uppercase">
                        Test Direct EAN-13
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Article Démo</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-xs">
                      7. Test Immédiat : Robe Soie Koko Dunda (618110001001)
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Scannez ce code EAN-13 réel. S'il s'affiche en vert dans l'onglet Diagnostic, votre douchette fonctionne à 100% sans aucun pilote supplémentaire !
                    </p>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                    <div 
                      className="w-full max-w-[280px] py-1"
                      dangerouslySetInnerHTML={{ 
                        __html: generateCode128Svg('618110001001', { height: 60, fontSize: 10 }) 
                      }} 
                    />
                    <span className="text-[10px] font-mono font-bold text-emerald-600 mt-1">
                      618110001001 (Robe Koko Dunda)
                    </span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: HISTORIQUE ET SIMULATION */}
          {activeTab === 'test' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-xs text-slate-800">Tester avec des articles réels du catalogue :</div>
                <div className="flex flex-wrap gap-2">
                  {products.slice(0, 5).map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => usbBarcodeScanner.simulateScan(p.barcode || p.sku)}
                      className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 rounded-xl transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                    >
                      <Package className="h-3.5 w-3.5 text-blue-600" />
                      <span>{p.name.slice(0, 18)}</span>
                      <span className="text-[10px] font-mono text-slate-400">({p.barcode || p.sku})</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => usbBarcodeScanner.simulateScan('AV-0001')}
                    className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-emerald-800 rounded-xl transition shadow-2xs cursor-pointer"
                  >
                    Simuler Bon d'Avoir
                  </button>
                </div>
              </div>

              {/* Scans Log */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Dernières lectures détectées ({testScans.length})</span>
                  {testScans.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTestScans([])}
                      className="text-slate-400 hover:text-slate-600 flex items-center space-x-1 cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Effacer</span>
                    </button>
                  )}
                </div>

                {testScans.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Aucun code scanné pour le moment. Scannez un article pour voir les statistiques de transmission.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {testScans.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                            {item.barcode}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Vitesse : {item.info.avgIntervalMs} ms/touche ({item.info.terminator})</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{item.info.charCount} caractères en {item.info.durationMs} ms</span>
                          {item.info.raw !== item.barcode && (
                            <span className="text-amber-600 font-medium">
                              Converti depuis AZERTY : <code className="font-mono">{item.info.raw}</code>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: RÉGLAGES */}
          {activeTab === 'settings' && (
            <div className="space-y-4 text-xs">
              {/* Option: Scanner actif */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">Émulation Clavier USB Active</div>
                  <div className="text-[11px] text-slate-500">
                    Capture automatiquement les codes-barres sur toute l'application.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => handleUpdateSetting('enabled', e.target.checked)}
                  className="h-4 w-4 rounded-sm text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Option: Auto-validation sans touche Entrée */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">Prise en charge des Douchettes Sans Touche Entrée</div>
                  <div className="text-[11px] text-slate-500">
                    Valide automatiquement le scan dès qu'une pause de {settings.suffixTimeoutMs}ms suit une série de frappes rapides (très utile si votre lecteur n'envoie pas la touche Entrée).
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoSubmitOnTimeout}
                  onChange={(e) => handleUpdateSetting('autoSubmitOnTimeout', e.target.checked)}
                  className="h-4 w-4 rounded-sm text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Option: Correction AZERTY */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">Correction Automatique Clavier AZERTY (Français)</div>
                  <div className="text-[11px] text-slate-500">
                    Convertit les caractères accentués (ex: &é"'(-è_çà) en 1234567890 si la douchette envoie les codes sans touche Majuscule.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.azertyAutoFix}
                  onChange={(e) => handleUpdateSetting('azertyAutoFix', e.target.checked)}
                  className="h-4 w-4 rounded-sm text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Option: Bip Sonore */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">Signal Sonore de Caisse (Bip)</div>
                  <div className="text-[11px] text-slate-500">
                    Émet un bip aigu de caisse lors du scan et une alerte si l'article est absent ou en rupture.
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleTestBeep}
                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                    title="Tester le son de succès"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleTestErrorBeep}
                    className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition cursor-pointer"
                    title="Tester le son d'alerte"
                  >
                    <VolumeX className="h-4 w-4" />
                  </button>
                  <input
                    type="checkbox"
                    checked={settings.enableSound}
                    onChange={(e) => handleUpdateSetting('enableSound', e.target.checked)}
                    className="h-4 w-4 rounded-sm text-blue-600 focus:ring-blue-500 ml-1 cursor-pointer"
                  />
                </div>
              </div>

              {/* Option: Ajout direct au panier */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">Ajout Direct au Panier (+1 Qté)</div>
                  <div className="text-[11px] text-slate-500">
                    Ajoute automatiquement le produit au panier lors du scan sans confirmation manuelle.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoAddToCart}
                  onChange={(e) => handleUpdateSetting('autoAddToCart', e.target.checked)}
                  className="h-4 w-4 rounded-sm text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Cadence threshold slider */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Tolérance Délai Max par Touche ({settings.maxIntervalMs} ms)</span>
                  <span className="text-[11px] font-bold text-blue-600">Recommandé: 180 ms</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="250"
                  step="10"
                  value={settings.maxIntervalMs}
                  onChange={(e) => handleUpdateSetting('maxIntervalMs', Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Très rapide (50ms)</span>
                  <span>Standard (180ms)</span>
                  <span>Haute tolérance (250ms)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
                  <Keyboard className="h-4 w-4 text-blue-600" />
                  <span>Comment fonctionne une douchette USB ?</span>
                </h4>
                <p className="text-slate-600 leading-relaxed text-[11.5px]">
                  Un lecteur de code-barres USB standard est reconnu par Windows/Mac/Linux comme un <strong>clavier externe ultra-rapide</strong>. Quand vous tirez sur un code-barres, il tape les caractères à toute vitesse (environ 10 à 60 millisecondes par chiffre). BizPilot reconnaît cette cadence surhumaine et ajoute l'article en caisse.
                </p>
              </div>

              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-2 text-amber-900">
                <h4 className="font-bold flex items-center space-x-1.5 text-amber-950">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>Points de vérification si le scanner ne réagit pas :</span>
                </h4>
                <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-amber-800">
                  <li>
                    <strong>Focus de la fenêtre :</strong> Dans le navigateur, si vous avez cliqué sur une autre application ou fenêtre, cliquez une fois au milieu de l'écran pour redonner le focus à BizPilot.
                  </li>
                  <li>
                    <strong>Mode Port Série Virtuel vs Clavier :</strong> Si la douchette émet un bip mais n'écrit rien du tout, rendez-vous dans l'onglet <strong>« Codes de Réglage Douchette »</strong> ci-dessus et scannez le code <em>« Mode Clavier USB (USB HID) »</em>.
                  </li>
                  <li>
                    <strong>Test dans le Bloc-notes (Notepad) :</strong> Ouvrez le Bloc-notes de Windows ou un traitement de texte et scannez un code. Si le numéro s'écrit dans le Bloc-notes, votre matériel fonctionne parfaitement et BizPilot l'interceptera !
                  </li>
                  <li>
                    <strong>Prise USB ou Port :</strong> Branchez directement sur le port USB de l'ordinateur plutôt que sur une rallonge ou un concentrateur sans alimentation.
                  </li>
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* Modal: Link Scanned Barcode to Existing Product */}
        {linkingBarcode && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 animate-in fade-in duration-100">
            <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                    <Link2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Attribuer le code-barres</h4>
                    <p className="text-[11px] font-mono text-blue-600 font-bold">Code : {linkingBarcode}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLinkingBarcode(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {linkSuccessMsg ? (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 font-bold text-center text-xs animate-in zoom-in-95">
                  {linkSuccessMsg}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Rechercher par modèle ou nom (ex: W572, M255, Robe...)"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1.5 divide-y divide-slate-100">
                    {filteredProductsToLink.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        Aucun article trouvé.
                      </div>
                    ) : (
                      filteredProductsToLink.map((p) => (
                        <div
                          key={p.id}
                          className="pt-1.5 flex items-center justify-between hover:bg-slate-50 p-2 rounded-xl transition"
                        >
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{p.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Réf: {p.sku} • Stock: {p.currentStock} {p.unit}
                              {p.barcode && <span className="ml-1 text-amber-600">(Actuel: {p.barcode})</span>}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAssignBarcodeToProduct(p, linkingBarcode)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
                          >
                            Attribuer
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Émulation Clavier USB opérationnelle</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
