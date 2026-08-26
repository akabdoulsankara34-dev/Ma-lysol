import React, { useState } from 'react';
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
  Share2
} from 'lucide-react';
import { blePrinter } from '../../lib/blePrinter';
import { TeamAccessManager } from './TeamAccessManager';

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
          <Smartphone className="h-4 w-4" />
          <span>Imprimante POS-80 BLE & PWA</span>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom Commercial de la Boutique *</label>
                <input
                  type="text"
                  required
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone Principal (Contact Reçu) *</label>
                <input
                  type="text"
                  required
                  value={bizPhone}
                  onChange={(e) => setBizPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ville & Quartier *</label>
                <input
                  type="text"
                  required
                  value={bizCity}
                  onChange={(e) => setBizCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Secteur d'Activité</label>
                <input
                  type="text"
                  value={bizSector}
                  onChange={(e) => setBizSector(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Numéro IFU (Identifiant Fiscal Unique)</label>
                <input
                  type="text"
                  placeholder="Ex: 00148925K"
                  value={bizIfu}
                  onChange={(e) => setBizIfu(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Devise Principale</label>
                <input
                  type="text"
                  disabled
                  value="FCFA (Franc CFA de l'Afrique de l'Ouest - XOF)"
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Message personnalisé imprimé en bas des reçus</label>
              <input
                type="text"
                value={bizReceiptFooter}
                onChange={(e) => setBizReceiptFooter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Enregistrer les Coordonnées</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. POS-80 BLE Printer & PWA settings */}
      {activeSettingsTab === 'printer' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">Imprimante POS-80 Bluetooth & Application PWA</h2>
            </div>
          </div>

          <div className="p-5 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Bluetooth className="h-4 w-4 text-blue-600" />
                  <p className="font-bold text-slate-900">Imprimante Thermique POS-80 / POS-58 (Bluetooth BLE)</p>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Connectez directement votre smartphone, tablette ou ordinateur à votre imprimante de caisse sans passerelle ni pilote.
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const dev = await blePrinter.connect();
                    alert(`Imprimante connectée avec succès : ${dev.name}`);
                  } catch (e: any) {
                    alert(e.message || 'Erreur de connexion Bluetooth');
                  }
                }}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs transition shrink-0 cursor-pointer"
              >
                <Bluetooth className="h-4 w-4" />
                <span>Tester Connexion BLE</span>
              </button>
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

    </div>
  );
};
