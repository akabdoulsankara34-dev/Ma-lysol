import React, { useState, useEffect } from 'react';
import { 
  X, 
  Unlock, 
  Volume2, 
  VolumeX, 
  Check, 
  AlertCircle, 
  Bluetooth, 
  Usb, 
  Clock, 
  ShieldCheck, 
  Settings, 
  ListOrdered,
  Sparkles,
  Zap,
  Printer,
  HelpCircle,
  Laptop
} from 'lucide-react';
import { cashDrawerService, CashDrawerSettings, CashDrawerLog } from '../../lib/cashDrawerService';
import { blePrinter } from '../../lib/blePrinter';

interface CashDrawerModalProps {
  onClose: () => void;
  operatorName?: string;
}

export const CashDrawerModal: React.FC<CashDrawerModalProps> = ({ onClose, operatorName = 'Caissier' }) => {
  const [settings, setSettings] = useState<CashDrawerSettings>(cashDrawerService.getSettings());
  const [logs, setLogs] = useState<CashDrawerLog[]>([]);
  const [activeTab, setActiveTab] = useState<'control' | 'driver' | 'settings' | 'logs'>('control');
  const [manualReason, setManualReason] = useState('Appoint / Rendu monnaie');
  const [customReason, setCustomReason] = useState('');
  const [isTriggering, setIsTriggering] = useState(false);
  const [lastOpenSuccess, setLastOpenSuccess] = useState<string | null>(null);
  
  // Hardware status
  const [bleDeviceName, setBleDeviceName] = useState<string | null>(blePrinter.getConnectedDeviceName());
  const [isBleConnecting, setIsBleConnecting] = useState(false);
  const [serialConnecting, setSerialConnecting] = useState(false);
  const [isSerialConnected, setIsSerialConnected] = useState(cashDrawerService.isSerialConnected());
  const [usbConnecting, setUsbConnecting] = useState(false);
  const [isUsbConnected, setIsUsbConnected] = useState(cashDrawerService.isUsbConnected());
  const [usbDeviceName, setUsbDeviceName] = useState<string | null>(cashDrawerService.getConnectedUsbName());
  
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setLogs(cashDrawerService.getLogs());
    // Fast pre-warm BLE connection in background
    blePrinter.ensureConnected().then(() => {
      setBleDeviceName(blePrinter.getConnectedDeviceName());
    });
    setIsUsbConnected(cashDrawerService.isUsbConnected());
    setUsbDeviceName(cashDrawerService.getConnectedUsbName());
  }, []);

  const handleToggleAutoOpen = (val: boolean) => {
    const updated = cashDrawerService.saveSettings({ autoOpenOnSaleValidation: val });
    setSettings(updated);
  };

  const handleToggleAutoOpenOnPrint = (val: boolean) => {
    const updated = cashDrawerService.saveSettings({ autoOpenOnPrint: val });
    setSettings(updated);
  };

  const handleToggleOnlyCash = (val: boolean) => {
    const updated = cashDrawerService.saveSettings({ openOnlyOnCashOrSplit: val });
    setSettings(updated);
  };

  const handleToggleSound = (val: boolean) => {
    const updated = cashDrawerService.saveSettings({ soundFeedback: val });
    setSettings(updated);
  };

  const handleManualOpen = async () => {
    setIsTriggering(true);
    setFeedbackMsg(null);
    const finalReason = manualReason === 'Autre motif...' ? (customReason.trim() || 'Ouverture manuelle') : manualReason;

    try {
      const res = await cashDrawerService.triggerDrawer({
        reason: finalReason,
        isManual: true,
        operatorName,
        force: true
      });

      setLastOpenSuccess(new Date().toLocaleTimeString('fr-FR'));
      setLogs(cashDrawerService.getLogs());
      setFeedbackMsg({
        type: 'success',
        text: `Tiroir-caisse déclenché avec succès (${res.hardwareKicked ? 'Signal matériel transmis (USB/Série/BLE)' : 'Simulation sonore active'}) !`
      });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Erreur lors de l\'ouverture du tiroir' });
    } finally {
      setIsTriggering(false);
    }
  };

  const handleConnectBle = async () => {
    setIsBleConnecting(true);
    setFeedbackMsg(null);
    try {
      const res = await blePrinter.connect(true);
      setBleDeviceName(res.name);
      setFeedbackMsg({ type: 'success', text: `Connecté à l'imprimante thermique BLE : ${res.name}` });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setIsBleConnecting(false);
    }
  };

  const handleConnectUsb = async () => {
    setUsbConnecting(true);
    setFeedbackMsg(null);
    try {
      const name = await cashDrawerService.connectUsb();
      setIsUsbConnected(true);
      setUsbDeviceName(name);
      setFeedbackMsg({ type: 'success', text: `Imprimante USB connectée avec succès : ${name}` });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setUsbConnecting(false);
    }
  };

  const handleConnectSerial = async () => {
    setSerialConnecting(true);
    setFeedbackMsg(null);
    try {
      await cashDrawerService.connectSerial();
      setIsSerialConnected(true);
      setFeedbackMsg({ type: 'success', text: 'Imprimante / tiroir USB/Série connecté avec succès.' });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setSerialConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white px-5 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shadow-inner">
              <Unlock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-lg leading-tight">Caisse à Monnaie Automatique</h3>
              <p className="text-xs text-amber-100 font-medium">Contrôle matériel du tiroir-caisse & liaison impression USB</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-black/20 hover:bg-black/30 flex items-center justify-center transition cursor-pointer text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-3 pt-2 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('control')}
            className={`flex items-center space-x-1.5 py-2.5 px-3 font-bold text-xs border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'control' 
                ? 'border-amber-600 text-amber-700 bg-white rounded-t-lg shadow-2xs' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Ouverture & Test</span>
          </button>

          <button
            onClick={() => setActiveTab('driver')}
            className={`flex items-center space-x-1.5 py-2.5 px-3 font-bold text-xs border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'driver' 
                ? 'border-amber-600 text-amber-700 bg-white rounded-t-lg shadow-2xs' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Pilote USB & Reçu</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-1.5 py-2.5 px-3 font-bold text-xs border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'settings' 
                ? 'border-amber-600 text-amber-700 bg-white rounded-t-lg shadow-2xs' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Paramètres Auto</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center space-x-1.5 py-2.5 px-3 font-bold text-xs border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'logs' 
                ? 'border-amber-600 text-amber-700 bg-white rounded-t-lg shadow-2xs' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListOrdered className="h-3.5 w-3.5" />
            <span>Journal ({logs.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {feedbackMsg && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
              feedbackMsg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {feedbackMsg.type === 'success' ? <Check className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* TAB 1: CONTROL & TEST */}
          {activeTab === 'control' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/80 rounded-2xl p-4 text-center">
                <p className="text-xs font-semibold text-amber-900 mb-1">Déclenchement Instantané</p>
                <p className="text-xs text-amber-700 mb-4">
                  Envoie le signal d'ouverture RJ11/ESC/POS au tiroir connecté et joue le carillon de caisse enregistreuse.
                </p>

                <button
                  onClick={handleManualOpen}
                  disabled={isTriggering}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-black py-4 px-6 rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-3 transition transform active:scale-98 cursor-pointer disabled:opacity-50 text-base"
                >
                  <Unlock className={`h-6 w-6 ${isTriggering ? 'animate-bounce' : ''}`} />
                  <span>{isTriggering ? 'Ouverture en cours...' : 'OUVRIR LE TIROIR-CAISSE MAINTENANT'}</span>
                </button>

                {lastOpenSuccess && (
                  <p className="text-[11px] text-emerald-700 font-semibold mt-2.5 flex items-center justify-center gap-1">
                    <Check className="h-3 w-3" /> Dernière ouverture enregistrée à {lastOpenSuccess}
                  </p>
                )}
              </div>

              {/* Manual Opening Reason */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Motif d'ouverture manuelle (Traçabilité caisse) :
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    'Appoint / Rendu monnaie',
                    'Contrôle fond de caisse',
                    'Échange de billets',
                    'Autre motif...'
                  ].map(motif => (
                    <button
                      key={motif}
                      type="button"
                      onClick={() => setManualReason(motif)}
                      className={`text-xs py-1.5 px-2.5 rounded-lg font-medium border text-left transition cursor-pointer ${
                        manualReason === motif 
                          ? 'bg-amber-100/80 border-amber-400 text-amber-900 font-bold' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {motif}
                    </button>
                  ))}
                </div>

                {manualReason === 'Autre motif...' && (
                  <input
                    type="text"
                    placeholder="Précisez la raison de l'ouverture..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                )}
              </div>

              {/* Hardware Connection Quick Cards */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Connexions Matérielles Directes</p>
                
                {/* WebUSB Direct Printer */}
                {cashDrawerService.isUsbSupported() && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center space-x-2.5">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                        isUsbConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                      }`}>
                        <Usb className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-800">Imprimante Thermique USB Directe</p>
                          {isUsbConnected && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">Actif</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {usbDeviceName ? `Connecté : ${usbDeviceName}` : 'Xprinter, POS-80, Epson, etc. (WebUSB)'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleConnectUsb}
                      disabled={usbConnecting}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {usbConnecting ? 'Recherche...' : isUsbConnected ? 'Reconfigurer' : 'Associer USB'}
                    </button>
                  </div>
                )}

                {/* Bluetooth POS Printer */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center space-x-2.5">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      bleDeviceName ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
                    }`}>
                      <Bluetooth className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Imprimante Ticket BLE (POS-80)</p>
                      <p className="text-[11px] text-slate-500">
                        {bleDeviceName ? `Connecté : ${bleDeviceName}` : 'Bluetooth sans fil'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleConnectBle}
                    disabled={isBleConnecting}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
                  >
                    {isBleConnecting ? 'Recherche...' : bleDeviceName ? 'Reconnexion' : 'Connecter'}
                  </button>
                </div>

                {/* USB / Web Serial Port COM */}
                {cashDrawerService.isSerialSupported() && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center space-x-2.5">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                        isSerialConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                      }`}>
                        <Usb className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">Port Série Virtuel (COM / CH340)</p>
                        <p className="text-[11px] text-slate-500">
                          {isSerialConnected ? 'Port COM actif' : 'Convertisseur USB-Série RJ11'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleConnectSerial}
                      disabled={serialConnecting || isSerialConnected}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {serialConnecting ? 'Connexion...' : isSerialConnected ? 'Connecté' : 'Associer COM'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DRIVER USB & PRINT VALIDATION GUIDE */}
          {activeTab === 'driver' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-amber-900">
                  <Printer className="h-5 w-5 text-amber-700 shrink-0" />
                  <p className="font-bold text-sm">Actionner le tiroir via le pilote d'impression USB</p>
                </div>
                <p className="text-amber-800 leading-relaxed text-[11px]">
                  Vous pouvez actionner l'ouverture du tiroir de deux manières simultanées :
                  automatiquement par <strong>BizPilot à chaque validation d'impression</strong>, et nativement par le <strong>pilote Windows de votre imprimante thermique</strong>.
                </p>
              </div>

              {/* Method 1: BizPilot Auto-trigger on Print */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded text-[10px] uppercase">
                      Méthode 1 • BizPilot
                    </span>
                    <p className="font-bold text-slate-900 mt-1">Déclenchement direct à la validation du reçu</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Dès que vous cliquez sur "Imprimer le Reçu" ou sur "POS80", BizPilot envoie instantanément l'impulsion ESC/POS <code>ESC p 0 25 250</code> via USB, Bluetooth ou Port Série.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                    <input 
                      type="checkbox" 
                      checked={settings.autoOpenOnPrint}
                      onChange={(e) => handleToggleAutoOpenOnPrint(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              </div>

              {/* Method 2: Windows USB Driver configuration */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded text-[10px] uppercase">
                    Méthode 2 • Pilote USB Windows (POS-80 / Xprinter / Epson)
                  </span>
                </div>
                <p className="text-slate-700 font-bold">
                  Configuration matérielle du pilote d'imprimante dans Windows :
                </p>
                <div className="space-y-1.5 text-slate-600 text-[11px]">
                  <p className="flex items-start gap-1.5">
                    <span className="font-bold text-slate-800 shrink-0">1.</span>
                    <span>Ouvrez le <strong>Panneau de configuration &gt; Périphériques et imprimantes</strong> (ou Paramètres Windows &gt; Imprimantes).</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="font-bold text-slate-800 shrink-0">2.</span>
                    <span>Faites un <strong>clic droit</strong> sur votre imprimante ticket (ex: <em>POS-80</em>, <em>XP-80</em>, <em>EPSON TM</em>) puis choisissez <strong>Propriétés de l'imprimante</strong>.</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="font-bold text-slate-800 shrink-0">3.</span>
                    <span>Cliquez sur l'onglet <strong>Paramètres du périphérique</strong> (ou <em>Device Settings</em>).</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="font-bold text-slate-800 shrink-0">4.</span>
                    <span>Localisez l'option <strong>Tiroir-caisse</strong> (<em>Cash Drawer</em>) et réglez-la sur : <strong>Ouvrir avant l'impression</strong> (<em>Open Before Printing</em>).</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="font-bold text-slate-800 shrink-0">5.</span>
                    <span>Cliquez sur <strong>Appliquer</strong> puis <strong>OK</strong>.</span>
                  </p>
                </div>
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-[11px] font-medium flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Chaque impression déclenchera alors physiquement l'ouverture du tiroir via le connecteur RJ11 relié à l'imprimante.</span>
                </div>
              </div>

              {/* Instant Test Button */}
              <button
                type="button"
                onClick={handleManualOpen}
                disabled={isTriggering}
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <Zap className="h-4 w-4 text-amber-400" />
                <span>Tester le signal d'ouverture maintenant</span>
              </button>
            </div>
          )}

          {/* TAB 3: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="space-y-3">
                
                {/* Auto Open on Print Validation */}
                <div className="flex items-start justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="pr-3">
                    <p className="text-xs font-bold text-slate-900">Ouverture lors de la validation d'impression (USB / Pilote)</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Déclenche automatiquement l'ouverture physique de la caisse à monnaie au moment d'imprimer le reçu de vente.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input 
                      type="checkbox" 
                      checked={settings.autoOpenOnPrint}
                      onChange={(e) => handleToggleAutoOpenOnPrint(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {/* Auto Open on Sale Completion */}
                <div className="flex items-start justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="pr-3">
                    <p className="text-xs font-bold text-slate-900">Ouverture automatique dès l'encaissement de la vente</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Ouvre le tiroir dès la validation du panier au POS, avant même d'imprimer.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input 
                      type="checkbox" 
                      checked={settings.autoOpenOnSaleValidation}
                      onChange={(e) => handleToggleAutoOpen(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {/* Only on Cash or Split */}
                <div className="flex items-start justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="pr-3">
                    <p className="text-xs font-bold text-slate-900">Restreindre aux paiements Espèces & Mixtes</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Si activé, les paiements 100% Mobile Money (Orange Money, Moov Money) ou Ventes à crédit ne déclenchent pas le tiroir.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input 
                      type="checkbox" 
                      checked={settings.openOnlyOnCashOrSplit}
                      onChange={(e) => handleToggleOnlyCash(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {/* Sound Feedback */}
                <div className="flex items-start justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="pr-3">
                    <p className="text-xs font-bold text-slate-900">Signal sonore de caisse enregistreuse</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Joue le bruit mécanique et le carillon "Cha-Ching" caractéristique lors de chaque ouverture.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input 
                      type="checkbox" 
                      checked={settings.soundFeedback}
                      onChange={(e) => handleToggleSound(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              </div>

              {/* Hardware pin configuration */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-amber-700" />
                  Compatibilité Matérielle ESC/POS & Ports RJ11/RJ12
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Le signal envoyé correspond aux commandes standards ESC/POS (code <code>ESC p 0 25 250</code> et <code>DLE DC4 1 0 5</code>) transmises via le connecteur RJ11/RJ12 de l'imprimante ticket vers le tiroir-caisse.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-200">
                <span>Historique des 50 dernières ouvertures</span>
                <span className="font-mono">{logs.length} entrée(s)</span>
              </div>

              {logs.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Aucune ouverture enregistrée pour l'instant.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <div 
                      key={log.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className={`h-2 w-2 rounded-full ${log.isManual ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          <span className="font-bold text-slate-800">{log.reason}</span>
                          {log.paymentMethod && (
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                              {log.paymentMethod}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Par <span className="font-semibold">{log.operatorName || 'Caissier'}</span>
                        </p>
                      </div>

                      <div className="text-right text-[10px] text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} à {new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            BizPilot Hardware Automation
          </span>
          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-xl transition cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
