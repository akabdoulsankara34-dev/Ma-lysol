import React, { useState, useEffect } from 'react';
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
  RotateCcw
} from 'lucide-react';
import {
  usbBarcodeScanner,
  UsbScannerSettings,
  LastScanInfo,
} from '../../lib/usbBarcodeScanner';

interface UsbScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UsbScannerModal: React.FC<UsbScannerModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<UsbScannerSettings>(usbBarcodeScanner.getSettings());
  const [testScans, setTestScans] = useState<{ barcode: string; info: LastScanInfo }[]>([]);
  const [activeTab, setActiveTab] = useState<'test' | 'settings' | 'guide'>('test');

  useEffect(() => {
    if (!isOpen) return;

    setSettings(usbBarcodeScanner.getSettings());

    const unsubscribe = usbBarcodeScanner.subscribe((barcode, info) => {
      setTestScans((prev) => [{ barcode, info }, ...prev.slice(0, 9)]);
    });

    return () => {
      unsubscribe();
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Keyboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm sm:text-base">Scanner USB (Émulation Clavier)</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>
                  HID Actif
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Prise en charge native des douchettes et lecteurs code-barres USB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('test')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'test'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Zone de Test & Diagnostics</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Options Clavier & Audio</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'guide'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Guide Scanner</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 max-h-[65vh] overflow-y-auto space-y-4">
          
          {activeTab === 'test' && (
            <div className="space-y-4">
              {/* Ready Banner */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start space-x-3 text-xs text-blue-900">
                <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Votre scanner USB se comporte comme un clavier rapide.</p>
                  <p className="text-blue-800 leading-relaxed text-[11px]">
                    Vous n'avez pas besoin de cliquer dans un champ de texte : dès qu'un article est scanné à la caisse, BizPilot le détecte instantanément grâce à sa cadence de frappe ultra-rapide.
                  </p>
                </div>
              </div>

              {/* Live Scanner Input Simulation / Receiver */}
              <div className="bg-slate-900 rounded-xl p-4 text-white text-center space-y-2 border border-slate-800 shadow-inner">
                <div className="flex items-center justify-center space-x-2 text-xs text-slate-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>EN ATTENTE DE SCAN DOUCHETTE USB...</span>
                </div>
                <p className="text-xs text-slate-300">
                  Pointez votre douchette USB sur n'importe quel code-barres et appuyez sur la gâchette.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => usbBarcodeScanner.simulateScan('618110001001')}
                    className="px-2.5 py-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                  >
                    Simuler EAN-13 (Riz)
                  </button>
                  <button
                    type="button"
                    onClick={() => usbBarcodeScanner.simulateScan('AV-0001')}
                    className="px-2.5 py-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
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
                      className="text-slate-400 hover:text-slate-600 flex items-center space-x-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Effacer</span>
                    </button>
                  )}
                </div>

                {testScans.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
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
                            <span>Cadence Clavier Clé : {item.info.avgIntervalMs} ms/caractère</span>
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

          {activeTab === 'settings' && (
            <div className="space-y-4 text-xs">
              {/* Option: Scanner actif */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">Émulation Clavier USB Active</div>
                  <div className="text-[11px] text-slate-500">
                    Capture automatiquement les flux de codes-barres rapides sur toute la caisse.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => handleUpdateSetting('enabled', e.target.checked)}
                  className="h-4 w-4 rounded-sm text-blue-600 focus:ring-blue-500"
                />
              </div>

              {/* Option: Correction AZERTY */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">Correction Automatique Clavier AZERTY</div>
                  <div className="text-[11px] text-slate-500">
                    Convertit les chiffres accentués (ex: &é"'(-è_çà) en 1234567890 si votre douchette est réglée en QWERTY d'usine.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.azertyAutoFix}
                  onChange={(e) => handleUpdateSetting('azertyAutoFix', e.target.checked)}
                  className="h-4 w-4 rounded-sm text-blue-600 focus:ring-blue-500"
                />
              </div>

              {/* Option: Bip Sonore */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">Signal Sonore de Caisse (Bip)</div>
                  <div className="text-[11px] text-slate-500">
                    Émet un bip aigu lors d'un scan réussi et un son d'alerte si l'article est inconnu ou en rupture.
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleTestBeep}
                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                    title="Tester le son de succès"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleTestErrorBeep}
                    className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition"
                    title="Tester le son d'alerte"
                  >
                    <VolumeX className="h-4 w-4" />
                  </button>
                  <input
                    type="checkbox"
                    checked={settings.enableSound}
                    onChange={(e) => handleUpdateSetting('enableSound', e.target.checked)}
                    className="h-4 w-4 rounded-sm text-blue-600 focus:ring-blue-500 ml-1"
                  />
                </div>
              </div>

              {/* Option: Ajout direct au panier */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">Ajout Direct au Panier (+1 Qté)</div>
                  <div className="text-[11px] text-slate-500">
                    Ajoute immédiatement l'article au panier. Chaque nouveau scan du même article incrémente sa quantité.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoAddToCart}
                  onChange={(e) => handleUpdateSetting('autoAddToCart', e.target.checked)}
                  className="h-4 w-4 rounded-sm text-blue-600 focus:ring-blue-500"
                />
              </div>

              {/* Cadence threshold slider */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Délai Max par Touche ({settings.maxIntervalMs} ms)</span>
                  <span className="text-[11px] text-slate-500">Défaut: 70 ms</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="120"
                  step="5"
                  value={settings.maxIntervalMs}
                  onChange={(e) => handleUpdateSetting('maxIntervalMs', Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-[10.5px] text-slate-500">
                  Permet de distinguer la frappe ultrarapide d'une douchette de la saisie manuelle d'un caissier.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
                  <Keyboard className="h-4 w-4 text-blue-600" />
                  <span>Comment fonctionne une douchette USB Clavier (HID) ?</span>
                </h4>
                <p className="text-slate-600 leading-relaxed text-[11.5px]">
                  Un lecteur de code-barres USB standard est reconnu par l'ordinateur comme un <strong>clavier d'ordinateur</strong> normal. Dès qu'il lit un code-barres, il "tape" les chiffres à une vitesse d'environ 5 à 20 millisecondes par touche, puis envoie la touche <strong>Entrée</strong>.
                </p>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2 text-amber-900">
                <h4 className="font-bold flex items-center space-x-1.5 text-amber-950">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>Astuce importante pour votre lecteur :</span>
                </h4>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800">
                  <li>
                    <strong>Suffixe "Entrée" (CR / LF) :</strong> Vérifiez que votre douchette envoie bien la touche "Entrée" après chaque scan. C'est le réglage d'usine de 99% des douchettes.
                  </li>
                  <li>
                    <strong>Pas besoin de cliquer :</strong> Vous pouvez scanner pendant que vous naviguez sur l'écran de caisse. Le système intercepte automatiquement la douchette sans que vous ayez besoin de sélectionner la barre de recherche.
                  </li>
                  <li>
                    <strong>Articles multiples :</strong> Scannez 3 fois de suite le même paquet pour mettre directement la quantité à 3 dans le panier.
                  </li>
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Émulation Clavier USB opérationnelle</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
