import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { 
  Settings, 
  Store, 
  Users, 
  Database, 
  ShieldCheck, 
  Save, 
  Plus, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Lock,
  Phone,
  MapPin,
  FileText,
  Smartphone,
  Bluetooth,
  WifiOff,
  KeyRound,
  Copy,
  Check,
  Building2,
  Share2,
  Unlock,
  Zap,
  AlertCircle,
  Usb,
  Printer,
  Laptop,
  Keyboard,
  ScanBarcode,
  Sliders,
  ExternalLink,
  Barcode,
  Play,
  Search,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { blePrinter } from '../../lib/blePrinter';
import { cashDrawerService } from '../../lib/cashDrawerService';
import { usbBarcodeScanner, normalizeBarcode } from '../../lib/usbBarcodeScanner';
import { TeamAccessManager } from './TeamAccessManager';
import { UsbScannerModal } from '../pos/UsbScannerModal';
import { CashDrawerModal } from '../pos/CashDrawerModal';
import { BarcodeScanner } from '../BarcodeScanner';

export const SettingsView: React.FC = () => {
  const { 
    business, 
    updateBusinessProfile, 
    allUsers, 
    resetToDemoData,
    products,
    sales,
    customers,
    expenses,
    stockMovements,
    logoutBusiness
  } = useApp();

  const [activeSettingsTab, setActiveSettingsTab] = useState<'team' | 'store' | 'printer' | 'backup'>('team');

  // Business Profile Form State
  const [bizName, setBizName] = useState(business.name);
  const [bizPhone, setBizPhone] = useState(business.phone);
  const [bizCity, setBizCity] = useState(business.city);
  const [bizSector, setBizSector] = useState(business.sector);
  const [bizIfu, setBizIfu] = useState(business.ifu || '');
  const [bizReceiptFooter, setBizReceiptFooter] = useState(business.receiptFooter || '');
  const [bizSaved, setBizSaved] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Cash Drawer & Hardware Modals State
  const [drawerSettings, setDrawerSettings] = useState(cashDrawerService.getSettings());
  const [isTestingDrawer, setIsTestingDrawer] = useState(false);
  const [drawerTestMsg, setDrawerTestMsg] = useState<string | null>(null);
  const [showUsbScannerModal, setShowUsbScannerModal] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [showCashDrawerModal, setShowCashDrawerModal] = useState(false);
  const [testScanInput, setTestScanInput] = useState('');
  const [lastScannedResult, setLastScannedResult] = useState<{
    code: string;
    found: boolean;
    productName?: string;
    productSku?: string;
    productPrice?: number;
    timestamp: number;
  } | null>(null);

  // BLE Printer State
  const [bleDeviceName, setBleDeviceName] = useState<string | null>(blePrinter.getConnectedDeviceName());
  const [bleTesting, setBleTesting] = useState(false);
  const [bleMsg, setBleMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    blePrinter.ensureConnected().then(() => {
      setBleDeviceName(blePrinter.getConnectedDeviceName());
    });
  }, []);

  // Live test scan resolver
  const handleTestBarcode = (rawCode: string) => {
    const cleanCode = (rawCode || '').trim();
    if (!cleanCode) return;

    const searchLower = cleanCode.toLowerCase();
    const alts = [searchLower, normalizeBarcode(searchLower).toLowerCase(), searchLower.replace(/[-\s._]/g, '')];
    const match = products.find(p => !p.archived && (
      alts.includes(p.sku.toLowerCase().trim()) ||
      (p.barcode && alts.includes(p.barcode.toLowerCase().trim())) ||
      alts.includes(p.sku.toLowerCase().replace(/[-\s._]/g, '')) ||
      (p.barcode && alts.includes(p.barcode.toLowerCase().replace(/[-\s._]/g, '')))
    ));

    if (match) {
      usbBarcodeScanner.playBeep();
      setLastScannedResult({
        code: cleanCode,
        found: true,
        productName: match.name,
        productSku: match.sku,
        productPrice: match.salePrice,
        timestamp: Date.now()
      });
    } else {
      usbBarcodeScanner.playError();
      setLastScannedResult({
        code: cleanCode,
        found: false,
        timestamp: Date.now()
      });
    }
  };

  // Background USB douchette listener on hardware tab for instant feedback
  useEffect(() => {
    if (activeSettingsTab !== 'printer') return;
    const unsubscribe = usbBarcodeScanner.subscribe((code) => {
      setTestScanInput(code);
      handleTestBarcode(code);
    });
    return () => unsubscribe();
  }, [activeSettingsTab, products]);

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateBusinessProfile({
      name: bizName.trim(),
      phone: bizPhone.trim(),
      city: bizCity.trim(),
      sector: bizSector.trim(),
      ifu: bizIfu.trim() || undefined,
      receiptFooter: bizReceiptFooter.trim() || undefined,
    });
    setBizSaved(true);
    setTimeout(() => setBizSaved(false), 3000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(business.accessCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleExportData = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      business,
      products,
      sales,
      customers,
      expenses,
      stockMovements,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `bizpilot_backup_${business.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleResetData = async () => {
    if (window.confirm('Voulez-vous réinitialiser les données avec le jeu de démonstration complet pour le commerce burkinabè ?')) {
      await resetToDemoData();
      alert('Données de démonstration restaurées avec succès.');
      window.location.reload();
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-16 animate-in fade-in">
      
      {/* Top Store Info & Access Code Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {business.name}
            </h1>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Boutique Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            {business.sector} • {business.city} • Tél : {business.phone}
          </p>
        </div>

        {/* Access Code Display for Owner */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-slate-950/80 border border-slate-700/80 p-3 rounded-2xl flex items-center gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Code d'Accès Boutique
              </span>
              <span className="font-mono text-sm sm:text-base font-black text-blue-400 tracking-wider">
                {business.accessCode}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Copier le code"
            >
              {copiedCode ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <button
            onClick={logoutBusiness}
            className="px-3.5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition cursor-pointer"
            title="Changer de boutique"
          >
            Changer de Boutique
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveSettingsTab('team')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 cursor-pointer ${
            activeSettingsTab === 'team'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Accès Équipe & Caissiers ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveSettingsTab('store')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 cursor-pointer ${
            activeSettingsTab === 'store'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Store className="h-4 w-4" />
          <span>Coordonnées & Reçus</span>
        </button>

        <button
          onClick={() => setActiveSettingsTab('printer')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 cursor-pointer ${
            activeSettingsTab === 'printer'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Matériel Caisse & Périphériques</span>
        </button>

        <button
          onClick={() => setActiveSettingsTab('backup')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 cursor-pointer ${
            activeSettingsTab === 'backup'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Sauvegardes</span>
        </button>
      </div>

      {/* 1. Team and Permissions Manager */}
      {activeSettingsTab === 'team' && (
        <TeamAccessManager />
      )}

      {/* 2. Store Profile & Receipt Settings */}
      {activeSettingsTab === 'store' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center space-x-2">
              <Store className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">Informations Commerciales & Reçus</h2>
            </div>
            {bizSaved && (
              <span className="text-xs text-blue-700 font-bold flex items-center gap-1 bg-blue-100 px-2 py-0.5 rounded-md animate-in fade-in">
                <CheckCircle2 className="h-3.5 w-3.5" /> Enregistré !
              </span>
            )}
          </div>

          <form onSubmit={handleSaveBusiness} className="p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nom du Commerce
                </label>
                <div className="relative">
                  <Building2 className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Téléphone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={bizPhone}
                    onChange={(e) => setBizPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ville / Quartier
                </label>
                <div className="relative">
                  <MapPin className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={bizCity}
                    onChange={(e) => setBizCity(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Secteur d'Activité
                </label>
                <input
                  type="text"
                  required
                  value={bizSector}
                  onChange={(e) => setBizSector(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Numéro IFU (Identifiant Fiscal Unique)
                </label>
                <div className="relative">
                  <FileText className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ex: 00194832Z"
                    value={bizIfu}
                    onChange={(e) => setBizIfu(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Devise du Commerce
                </label>
                <input
                  type="text"
                  disabled
                  value={business.currency}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Pied de Page du Reçu de Caisse
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Les marchandises vendues ne sont ni reprises ni échangées. Merci !"
                value={bizReceiptFooter}
                onChange={(e) => setBizReceiptFooter(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Enregistrer les Coordonnées</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. HARDWARE & PERIPHERALS: USB Scanner, Camera Scanner, Cash Drawer & BLE Printer */}
      {activeSettingsTab === 'printer' && (
        <div className="space-y-5">
          
          {/* Informative Header Banner */}
          <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-2xl flex items-start space-x-3 text-xs text-blue-950">
            <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-blue-950">
                Gestion Centralisée du Matériel Propriétaire
              </h3>
              <p className="mt-0.5 text-blue-800 leading-relaxed">
                Le <strong>scanner caméra</strong>, la <strong>douchette USB</strong> et le <strong>tiroir-caisse</strong> sont configurés ici afin de libérer 100% de la largeur de la barre de recherche en caisse. La douchette USB continue de lire automatiquement vos codes-barres en tâche de fond.
              </p>
            </div>
          </div>

          {/* CARD 1: USB Barcode Scanner (Douchette USB) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Keyboard className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="font-bold text-slate-900 text-sm sm:text-base">Douchette Code-Barres USB & Sans-Fil (Émulation Clavier)</h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Prête & Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Fonctionne automatiquement sans pilote : branchez en USB et scannez n'importe où dans l'application.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowUsbScannerModal(true)}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
              >
                <Sliders className="h-4 w-4" />
                <span>Diagnostics & Réglages Douchette</span>
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <Barcode className="h-4 w-4 text-indigo-600" />
                    <span>Zone de Test Direct Douchette USB</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Bipez avec votre douchette ou tapez un code</span>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Scannez un code avec la douchette pour tester la lecture..."
                      value={testScanInput}
                      onChange={(e) => setTestScanInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && testScanInput.trim()) {
                          handleTestBarcode(testScanInput);
                        }
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestBarcode(testScanInput)}
                    disabled={!testScanInput.trim()}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition disabled:opacity-40 cursor-pointer"
                  >
                    Vérifier
                  </button>
                </div>

                {lastScannedResult && (
                  <div className={`p-3 rounded-xl border flex items-center justify-between animate-in fade-in ${
                    lastScannedResult.found 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${lastScannedResult.found ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'}`}>
                        {lastScannedResult.found ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      </div>
                      <div>
                        {lastScannedResult.found ? (
                          <>
                            <p className="font-bold text-xs">{lastScannedResult.productName}</p>
                            <p className="text-[10px] text-emerald-700 font-mono">
                              Réf: {lastScannedResult.productSku} • Prix: {lastScannedResult.productPrice?.toLocaleString('fr-FR')} {business.currency} • Code: {lastScannedResult.code}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-bold text-xs">Code non attribué : {lastScannedResult.code}</p>
                            <p className="text-[10px] text-amber-700">Ce code-barres n'est pas encore associé à un article du catalogue.</p>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-[9px] font-mono opacity-70">Bip reçu</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CARD 2: Camera Barcode Scanner (Appareil photo / Webcam) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <ScanBarcode className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="font-bold text-slate-900 text-sm sm:text-base">Scanner Code-Barres Caméra (Smartphone & Tablette)</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      Optique
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Permet de scanner les codes-barres avec l'appareil photo si vous n'avez pas de douchette USB.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCameraScanner(true)}
                className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
              >
                <ScanBarcode className="h-4 w-4" />
                <span>Lancer le Scanner Caméra</span>
              </button>
            </div>
          </div>

          {/* CARD 3: Automatic Cash Drawer Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/70">
              <div className="flex items-center space-x-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center">
                  <Unlock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm sm:text-base">Caisse à Monnaie Automatique (Tiroir-Caisse)</h2>
                  <p className="text-[11px] text-amber-800 font-medium">Déclenchement automatique de l'ouverture et pilotage d'éjection électromagnétique</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowCashDrawerModal(true)}
                  className="px-3 py-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Panneau Avancé & Journal
                </button>
                <button
                  type="button"
                  disabled={isTestingDrawer}
                  onClick={async () => {
                    setIsTestingDrawer(true);
                    setDrawerTestMsg(null);
                    try {
                      const res = await cashDrawerService.triggerDrawer({
                        reason: 'Test ouverture depuis Paramètres Propriétaire',
                        isManual: true,
                        operatorName: 'Propriétaire',
                        force: true
                      });
                      setDrawerTestMsg(res.hardwareKicked ? 'Signal matériel envoyé au tiroir !' : 'Tiroir déclenché (simulation sonore active) !');
                      setTimeout(() => setDrawerTestMsg(null), 4000);
                    } catch (e: any) {
                      setDrawerTestMsg(`Erreur : ${e.message}`);
                    } finally {
                      setIsTestingDrawer(false);
                    }
                  }}
                  className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Zap className="h-4 w-4" />
                  <span>{isTestingDrawer ? 'Ouverture...' : 'Tester le Tiroir'}</span>
                </button>
              </div>
            </div>

            {drawerTestMsg && (
              <div className="px-5 py-2.5 bg-amber-100 text-amber-900 font-bold text-xs border-b border-amber-200 flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>{drawerTestMsg}</span>
              </div>
            )}

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* Auto Open on Print Validation */}
                <div className="p-3.5 bg-amber-50/60 border border-amber-300/80 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                      <Printer className="h-3.5 w-3.5 text-amber-700" />
                      <span>Validation Impression (USB)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Actionner le tiroir dès que le caissier valide ou lance l'impression du reçu.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={drawerSettings.autoOpenOnPrint}
                      onChange={(e) => {
                        const up = cashDrawerService.saveSettings({ autoOpenOnPrint: e.target.checked });
                        setDrawerSettings(up);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[6px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                    <span className="ml-2.5 text-[11px] font-bold text-slate-700">
                      {drawerSettings.autoOpenOnPrint ? 'Activée' : 'Désactivée'}
                    </span>
                  </label>
                </div>

                {/* Auto Open on Sale Completion */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Encaissement Panier</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Déclencher l'ouverture dès qu'une vente est validée au POS.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={drawerSettings.autoOpenOnSaleValidation}
                      onChange={(e) => {
                        const up = cashDrawerService.saveSettings({ autoOpenOnSaleValidation: e.target.checked });
                        setDrawerSettings(up);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[6px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                    <span className="ml-2.5 text-[11px] font-bold text-slate-700">
                      {drawerSettings.autoOpenOnSaleValidation ? 'Activée' : 'Désactivée'}
                    </span>
                  </label>
                </div>

                {/* Restrict to Cash */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Filtre Espèces / Mixte</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      N'ouvrir que si le règlement comporte des espèces.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={drawerSettings.openOnlyOnCashOrSplit}
                      onChange={(e) => {
                        const up = cashDrawerService.saveSettings({ openOnlyOnCashOrSplit: e.target.checked });
                        setDrawerSettings(up);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[6px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                    <span className="ml-2.5 text-[11px] font-bold text-slate-700">
                      {drawerSettings.openOnlyOnCashOrSplit ? 'Espèces' : 'Tous paiements'}
                    </span>
                  </label>
                </div>

                {/* Sound */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Bruit de Caisse</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Bruitage mécanique et carillon "Cha-Ching".
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={drawerSettings.soundFeedback}
                      onChange={(e) => {
                        const up = cashDrawerService.saveSettings({ soundFeedback: e.target.checked });
                        setDrawerSettings(up);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[6px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                    <span className="ml-2.5 text-[11px] font-bold text-slate-700">
                      {drawerSettings.soundFeedback ? 'Actif' : 'Muet'}
                    </span>
                  </label>
                </div>

              </div>

              {/* Windows USB Driver Configuration Instructions */}
              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2 text-slate-700">
                <div className="flex items-center space-x-2 text-blue-900 font-bold">
                  <Laptop className="h-4 w-4 text-blue-700" />
                  <span>Configuration du Pilote d'Impression USB (Windows / POS-80 / Epson / Xprinter) :</span>
                </div>
                <p className="text-[11px] text-blue-950 leading-relaxed">
                  Pour que votre pilote d'imprimante USB ouvre également la caisse à monnaie de façon 100% matérielle sur chaque ticket :
                  Ouvrez <strong>Propriétés de l'imprimante &gt; Paramètres du périphérique</strong> (Device Settings) &gt; Définissez <strong>Tiroir-caisse (Cash Drawer)</strong> sur <strong>Ouvrir avant l'impression</strong>.
                </p>
              </div>

              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <p>
                  <strong>Branchement physique :</strong> Reliez le câble RJ11/RJ12 du tiroir-caisse directement au port <em>DK (Drawer Kick)</em> de votre imprimante thermique POS (Bluetooth ou USB). BizPilot transmet automatiquement les impulsions ESC/POS <code>ESC p 0 25 250</code> pour déverrouiller la serrure électromagnétique.
                </p>
              </div>
            </div>
          </div>

          {/* CARD 4: POS-80 BLE Printer Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5 text-blue-600" />
                <h2 className="font-bold text-slate-900 text-sm sm:text-base">Imprimante POS-80 Bluetooth & Application PWA</h2>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Bluetooth className="h-4 w-4 text-blue-600" />
                      <p className="font-bold text-slate-900">Imprimante Thermique POS-80 / POS-58 (Couplage Ultra-Rapide)</p>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Connectez directement votre smartphone, tablette ou PC. Profils de scanning ciblés et cache GATT pour une reconnexion sous les 300 ms.
                    </p>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        blePrinter.isConnected()
                          ? 'bg-emerald-100 text-emerald-800'
                          : blePrinter.hasPairedPrinter()
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          blePrinter.isConnected() ? 'bg-emerald-500 animate-pulse' : blePrinter.hasPairedPrinter() ? 'bg-blue-500' : 'bg-slate-400'
                        }`} />
                        {blePrinter.isConnected()
                          ? `Connectée : ${blePrinter.getConnectedDeviceName()}`
                          : blePrinter.hasPairedPrinter()
                            ? `Couplée en cache : ${blePrinter.getLastPairedDeviceName()}`
                            : 'Aucune imprimante couplée'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ⚡ Cache GATT & Scanning filtré actif
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button
                      disabled={bleTesting}
                      onClick={async () => {
                        setBleTesting(true);
                        setBleMsg(null);
                        try {
                          const dev = await blePrinter.connect(true);
                          setBleDeviceName(dev.name);
                          setBleMsg({ type: 'success', text: `Imprimante couplée et connectée avec succès : ${dev.name}` });
                        } catch (e: any) {
                          setBleMsg({ type: 'error', text: e.message || 'Erreur de couplage Bluetooth' });
                        } finally {
                          setBleTesting(false);
                        }
                      }}
                      className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3 py-2 rounded-xl font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                    >
                      <Bluetooth className="h-4 w-4" />
                      <span>{blePrinter.hasPairedPrinter() ? 'Re-coupler Imprimante' : 'Coupler Imprimante (Rapide)'}</span>
                    </button>

                    {blePrinter.hasPairedPrinter() && (
                      <>
                        <button
                          disabled={bleTesting}
                          onClick={async () => {
                            setBleTesting(true);
                            setBleMsg(null);
                            try {
                              const dev = await blePrinter.connect(false);
                              setBleDeviceName(dev.name);
                              setBleMsg({ type: 'success', text: `Reconnexion instantanée réussie (<0.3s) à ${dev.name}` });
                            } catch (e: any) {
                              setBleMsg({ type: 'error', text: e.message || 'Échec de reconnexion' });
                            } finally {
                              setBleTesting(false);
                            }
                          }}
                          className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 px-3 py-2 rounded-xl font-bold text-xs transition cursor-pointer"
                          title="Tester la reconnexion automatique sans scanner"
                        >
                          Tester Reconnexion
                        </button>

                        <button
                          onClick={() => {
                            blePrinter.clearSavedPrinter();
                            setBleDeviceName(null);
                            setBleMsg({ type: 'success', text: 'Imprimante oubliée du cache.' });
                          }}
                          className="text-red-600 hover:text-red-800 text-[11px] font-semibold underline px-1 py-1 cursor-pointer"
                          title="Effacer le périphérique mémorisé pour réinitialiser le couplage"
                        >
                          Oublier
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {bleMsg && (
                  <div className={`p-2.5 rounded-lg text-xs font-medium border ${
                    bleMsg.type === 'success' 
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                      : 'bg-rose-100 text-rose-900 border-rose-300'
                  }`}>
                    {bleMsg.text}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <WifiOff className="h-4 w-4 text-emerald-600" />
                    <p className="font-bold text-slate-900">Fonctionnement 100% Hors-Ligne & Installation PWA</p>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    BizPilot enregistre chaque vente localement sur votre appareil. Même sans connexion Internet, vos encaissements et stocks restent actifs.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> PWA Prêt (Ajouter à l'écran d'accueil)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Backup & Restoration */}
      {activeSettingsTab === 'backup' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">Sauvegarde & Restauration des Données</h2>
            </div>
          </div>

          <div className="p-5 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <p className="font-bold text-slate-900">Exporter les données de la boutique</p>
                <p className="text-slate-500 text-[11px]">Téléchargez une copie JSON complète (produits, ventes, clients, dépenses).</p>
              </div>
              <button
                onClick={handleExportData}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-black text-white px-3.5 py-2 rounded-xl font-semibold text-xs transition shrink-0 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Exporter Sauvegarde JSON</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <div>
                <p className="font-bold text-amber-950">Données de Démonstration (Ouagadougou)</p>
                <p className="text-amber-800 text-[11px]">Recharger le catalogue type, l'historique de ventes et les créances burkinabè.</p>
              </div>
              <button
                onClick={handleResetData}
                className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs transition shrink-0 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Recharger Démo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS ACCESSIBLE FROM OWNER SETTINGS */}
      {showUsbScannerModal && (
        <UsbScannerModal
          isOpen={showUsbScannerModal}
          onClose={() => setShowUsbScannerModal(false)}
        />
      )}

      {showCashDrawerModal && (
        <CashDrawerModal
          onClose={() => setShowCashDrawerModal(false)}
          operatorName="Propriétaire"
        />
      )}

      {showCameraScanner && (
        <BarcodeScanner
          onScan={(code) => {
            handleTestBarcode(code);
            setShowCameraScanner(false);
          }}
          onClose={() => setShowCameraScanner(false)}
        />
      )}

    </div>
  );
};
