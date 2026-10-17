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
  Barcode
} from 'lucide-react';
import {
  usbBarcodeScanner,
  UsbScannerSettings,
  LastScanInfo,
  RawKeyStrokeEvent,
} from '../../lib/usbBarcodeScanner';
import { useApp } from '../../context/AppContext';

interface UsbScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UsbScannerModal: React.FC<UsbScannerModalProps> = ({ isOpen, onClose }) => {
  const { products, business } = useApp();
  const [settings, setSettings] = useState<UsbScannerSettings>(usbBarcodeScanner.getSettings());
  const [testScans, setTestScans] = useState<{ barcode: string; info: LastScanInfo }[]>([]);
  const [activeTab, setActiveTab] = useState<'diagnostic' | 'test' | 'settings' | 'guide'>('diagnostic');
  const [isWindowFocused, setIsWindowFocused] = useState<boolean>(true);
  
  // Real-time keystroke live monitor
  const [recentKeyStrokes, setRecentKeyStrokes] = useState<RawKeyStrokeEvent[]>([]);
  const [currentBufferDisplay, setCurrentBufferDisplay] = useState<string>('');
  const testInputRef = useRef<HTMLInputElement>(null);

  // Monitor window focus
  useEffect(() => {
    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
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
    });

    const unsubscribeRaw = usbBarcodeScanner.subscribeRawKeys((rawEvent) => {
      setRecentKeyStrokes((prev) => [rawEvent, ...prev.slice(0, 7)]);
      setCurrentBufferDisplay(rawEvent.currentBuffer);
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

  const findProductForCode = (code: string, alternatives: string[] = []) => {
    const cClean = code.trim().toLowerCase();
    const searchKeys = [cClean, ...alternatives.map(a => a.toLowerCase().trim())];

    return products.find(p => {
      if (p.archived) return false;
      const pSku = p.sku.toLowerCase().trim();
      const pBar = p.barcode ? p.barcode.toLowerCase().trim() : '';
      return searchKeys.some(k => k === pSku || k === pBar || k === pSku.replace(/[-\s._]/g, '') || (pBar && k === pBar.replace(/[-\s._]/g, '')));
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-md">
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
                Diagnostic en direct & prise en charge de toutes les marques de douchettes
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
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Diagnostic & Détection Directe</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('test')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'test'
                ? 'border-blue-600 text-blue-600'
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
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Réglages Clavier & Vitesse</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'guide'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Dépannage & Guide</span>
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
                    <div className="text-emerald-700 text-[11px]">Écoute globale sur toute l'application</div>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  isWindowFocused 
                    ? 'bg-blue-50 border-blue-200 text-blue-900' 
                    : 'bg-amber-50 border-amber-300 text-amber-900'
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
                      onClick={() => {
                        window.focus();
                        testInputRef.current?.focus();
                        setIsWindowFocused(true);
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Activer
                    </button>
                  )}
                </div>
              </div>

              {/* Dedicated Focusable Test Field */}
              <div className="bg-slate-900 rounded-2xl p-4 text-white space-y-3 border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-slate-300 font-mono">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
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
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 flex items-center justify-between text-xs text-amber-900">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                          <span>Ce code est bien reçu par le scanner, mais n'est pas encore associé à un produit.</span>
                        </div>
                        <span className="text-[10px] font-bold bg-amber-200 px-2 py-0.5 rounded text-amber-800">
                          Non répertorié
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: HISTORIQUE ET SIMULATION */}
          {activeTab === 'test' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-xs text-slate-800">Tester avec des articles réels du catalogue :</div>
                <div className="flex flex-wrap gap-2">
                  {products.slice(0, 4).map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => usbBarcodeScanner.simulateScan(p.barcode || p.sku)}
                      className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 rounded-xl transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                    >
                      <Package className="h-3.5 w-3.5 text-blue-600" />
                      <span>{p.name.slice(0, 16)}</span>
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

          {/* TAB 3: RÉGLAGES */}
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
                    Valide automatiquement le scan dès qu'une pause de 120ms suit une série de frappes rapides (très utile si votre lecteur n'envoie pas la touche Entrée).
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
                  <span className="font-bold text-slate-800">Sensibilité / Délai Max ({settings.maxIntervalMs} ms)</span>
                  <span className="text-[11px] font-bold text-blue-600">Recommandé: 100 ms</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="160"
                  step="5"
                  value={settings.maxIntervalMs}
                  onChange={(e) => handleUpdateSetting('maxIntervalMs', Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Très strict (40ms)</span>
                  <span>Standard (100ms)</span>
                  <span>Très tolérant (160ms)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
                  <Keyboard className="h-4 w-4 text-blue-600" />
                  <span>Comment fonctionne une douchette USB ?</span>
                </h4>
                <p className="text-slate-600 leading-relaxed text-[11.5px]">
                  Un lecteur de code-barres USB standard est reconnu par Windows/Mac/Linux comme un <strong>clavier externe ultra-rapide</strong>. Quand vous tirez sur un code-barres, il tape les chiffres à toute vitesse (environ 10 à 30 millisecondes par chiffre). BizPilot reconnaît cette cadence surhumaine et ajoute l'article en caisse.
                </p>
              </div>

              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-2 text-amber-900">
                <h4 className="font-bold flex items-center space-x-1.5 text-amber-950">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>Points de vérification si le scanner ne réagit pas :</span>
                </h4>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800">
                  <li>
                    <strong>Focus de la fenêtre :</strong> Dans le navigateur, si vous avez cliqué sur une autre application ou fenêtre, cliquez une fois au milieu de l'écran pour redonner le focus à BizPilot.
                  </li>
                  <li>
                    <strong>Prise USB ou Port :</strong> Testez en branchant directement sur le port USB de l'ordinateur plutôt que sur une rallonge ou un hub sans alimentation.
                  </li>
                  <li>
                    <strong>Test dans le Bloc-notes (Notepad) :</strong> Ouvrez le Bloc-notes sur votre ordinateur et scannez un code. Si le numéro s'écrit dans le Bloc-notes, votre scanner fonctionne parfaitement et BizPilot l'interceptera !
                  </li>
                </ul>
              </div>
            </div>
          )}

        </div>

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
