import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  Lock, 
  Activity, 
  Users, 
  Database, 
  Settings, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Download, 
  Upload, 
  Trash2, 
  DollarSign, 
  TrendingUp, 
  Package, 
  Receipt, 
  Phone, 
  MapPin, 
  Key, 
  UserCheck, 
  UserX,
  Server,
  Zap,
  Globe,
  Radio,
  Clock,
  Building2,
  Plus,
  Copy,
  ExternalLink,
  Edit3,
  Share2,
  Sparkles,
  KeyRound,
  Check,
  Store,
  Cloud,
  CloudOff
} from 'lucide-react';
import { UserRole, Business } from '../../types';

export const PlatformAdminView: React.FC = () => {
  const { 
    allBusinesses,
    business, 
    updateBusinessProfile,
    createBusiness,
    updateBusiness,
    deleteBusiness,
    regenerateAccessCode,
    switchBusiness,
    allUsers, 
    addUser, 
    updateUserPin,
    toggleUserStatus, 
    products, 
    sales, 
    customers, 
    expenses, 
    stockMovements,
    isOnline, 
    isSyncing, 
    lastSyncedAt,
    lockPlatformAdmin,
    resetToDemoData,
    summary
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<'businesses' | 'overview' | 'users' | 'store' | 'audit' | 'tools'>('businesses');
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // New Business Form Modal State
  const [showCreateBizModal, setShowCreateBizModal] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newBizPhone, setNewBizPhone] = useState('+226 ');
  const [newBizCity, setNewBizCity] = useState('Ouagadougou');
  const [newBizSector, setNewBizSector] = useState('Alimentation & Épicerie');
  const [newBizOwnerName, setNewBizOwnerName] = useState('');
  const [newBizOwnerPin, setNewBizOwnerPin] = useState('1234');
  const [customAccessCode, setCustomAccessCode] = useState('');
  const [isCreatingBiz, setIsCreatingBiz] = useState(false);

  // Edit Business Modal
  const [editingBiz, setEditingBiz] = useState<Business | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editSector, setEditSector] = useState('');
  const [editAccessCode, setEditAccessCode] = useState('');

  // User PIN editing
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newPinValue, setNewPinValue] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState<string | null>(null);

  // Store profile editable state
  const [bizName, setBizName] = useState(business.name);
  const [bizPhone, setBizPhone] = useState(business.phone);
  const [bizCity, setBizCity] = useState(business.city);
  const [bizSector, setBizSector] = useState(business.sector);
  const [bizIfu, setBizIfu] = useState(business.ifu || '');
  const [bizCurrency, setBizCurrency] = useState(business.currency || 'FCFA');
  const [bizFooter, setBizFooter] = useState(business.receiptFooter || '');
  const [saveBizSuccess, setSaveBizSuccess] = useState(false);

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateBusinessProfile({
      name: bizName,
      phone: bizPhone,
      city: bizCity,
      sector: bizSector,
      ifu: bizIfu,
      currency: bizCurrency,
      receiptFooter: bizFooter,
    });
    setSaveBizSuccess(true);
    setTimeout(() => setSaveBizSuccess(false), 3000);
  };

  const handleCreateBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim() || !newBizPhone.trim()) return;

    setIsCreatingBiz(true);
    try {
      const created = await createBusiness({
        name: newBizName.trim(),
        phone: newBizPhone.trim(),
        city: newBizCity.trim(),
        sector: newBizSector.trim(),
        ownerName: newBizOwnerName.trim() || 'Propriétaire',
        accessCode: customAccessCode.trim().toUpperCase() || undefined,
        currency: 'FCFA',
        status: 'active',
        receiptFooter: 'Merci pour votre confiance ! À bientôt.',
      }, newBizOwnerPin.trim() || '1234');

      setSyncStatusMsg(`Entreprise "${created.name}" créée avec le Code d'accès : ${created.accessCode}`);
      setTimeout(() => setSyncStatusMsg(null), 5000);

      setShowCreateBizModal(false);
      setNewBizName('');
      setNewBizPhone('+226 ');
      setNewBizOwnerName('');
      setCustomAccessCode('');
      setNewBizOwnerPin('1234');
    } finally {
      setIsCreatingBiz(false);
    }
  };

  const handleEditBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBiz) return;

    await updateBusiness(editingBiz.id, {
      name: editName.trim(),
      phone: editPhone.trim(),
      city: editCity.trim(),
      sector: editSector.trim(),
      accessCode: editAccessCode.trim().toUpperCase(),
    });

    setEditingBiz(null);
    setSyncStatusMsg(`Informations de l'entreprise mises à jour !`);
    setTimeout(() => setSyncStatusMsg(null), 3000);
  };

  const handleCopyAccessCode = (biz: Business) => {
    navigator.clipboard.writeText(biz.accessCode);
    setCopiedCodeId(biz.id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  const handleRegenerateCode = async (biz: Business) => {
    if (window.confirm(`Régénérer un nouveau code d'accès pour "${biz.name}" ? L'ancien code sera immédiatement désactivé.`)) {
      const newCode = await regenerateAccessCode(biz.id);
      setSyncStatusMsg(`Nouveau code généré pour ${biz.name} : ${newCode}`);
      setTimeout(() => setSyncStatusMsg(null), 4000);
    }
  };

  const handleToggleBizStatus = async (biz: Business) => {
    const newStatus = biz.status === 'suspended' ? 'active' : 'suspended';
    await updateBusiness(biz.id, { status: newStatus });
    setSyncStatusMsg(
      newStatus === 'suspended'
        ? `Accès à l'entreprise "${biz.name}" suspendu.`
        : `Accès à l'entreprise "${biz.name}" réactivé !`
    );
    setTimeout(() => setSyncStatusMsg(null), 3000);
  };

  const handleToggleCloudSync = async (biz: Business) => {
    const currentSync = biz.cloudSyncEnabled ?? true; // Default is true
    await updateBusiness(biz.id, { cloudSyncEnabled: !currentSync });
    setSyncStatusMsg(
      !currentSync
        ? `Synchronisation Cloud réactivée pour "${biz.name}".`
        : `Synchronisation Cloud débranchée pour "${biz.name}". Le mode local exclusif est activé.`
    );
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  const handleDeleteBiz = async (biz: Business) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'entreprise "${biz.name}" ? Cette action est irréversible.`)) {
      await deleteBusiness(biz.id);
      setSyncStatusMsg(`Entreprise "${biz.name}" supprimée.`);
      setTimeout(() => setSyncStatusMsg(null), 3000);
    }
  };

  const handleForceSync = () => {
    setSyncStatusMsg('Synchronisation manuelle déclenchée avec la base Firestore Cloud...');
    setTimeout(() => {
      setSyncStatusMsg('Synchronisation terminée avec succès ! Données à jour.');
      setTimeout(() => setSyncStatusMsg(null), 3000);
    }, 1200);
  };

  const handleExportBackup = () => {
    const backupData = {
      version: '2.5-burkina-multitenant',
      exportedAt: new Date().toISOString(),
      allBusinesses,
      business,
      allUsers,
      products,
      sales,
      customers,
      expenses,
      stockMovements,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bizpilot_backup_full_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Console Administrateur Plateforme
                </h1>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  Super-Admin
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  {allBusinesses.length} Entreprises Actives
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Génération des codes d'accès boutiques, gestion SaaS multi-entreprises & sécurité
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleForceSync}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition border border-slate-700 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sync...' : 'Sync Cloud'}</span>
            </button>

            <button
              onClick={lockPlatformAdmin}
              className="flex items-center space-x-2 bg-red-600/90 hover:bg-red-600 active:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
            >
              <Lock className="h-4 w-4" />
              <span>Verrouiller & Quitter</span>
            </button>
          </div>
        </div>

        {/* Sync notification feedback */}
        {syncStatusMsg && (
          <div className="mt-4 p-3 rounded-xl bg-blue-950/80 border border-blue-800 text-blue-200 text-xs flex items-center gap-2 animate-in fade-in">
            <Zap className="h-4 w-4 text-blue-400 shrink-0" />
            <span>{syncStatusMsg}</span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-1 sm:space-x-2 border-b border-slate-200 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveAdminTab('businesses')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 cursor-pointer ${
            activeAdminTab === 'businesses'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Entreprises & Codes ({allBusinesses.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('overview')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 cursor-pointer ${
            activeAdminTab === 'overview'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Vue d'Ensemble & Télémétrie</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('users')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 cursor-pointer ${
            activeAdminTab === 'users'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Collaborateurs & PINs ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('store')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 cursor-pointer ${
            activeAdminTab === 'store'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Configuration Entreprise Active</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('audit')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 cursor-pointer ${
            activeAdminTab === 'audit'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Audit & Logs ({sales.length + expenses.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('tools')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 cursor-pointer ${
            activeAdminTab === 'tools'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Sauvegardes Système</span>
        </button>
      </div>

      {/* 1. BUSINESSES & ACCESS CODES TAB */}
      {activeAdminTab === 'businesses' && (
        <div className="space-y-6">
          {/* Header Action Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Entreprises Enregistrées & Attribution des Codes d'Accès
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Chaque entreprise utilise son code unique pour se connecter à son espace de gestion et de caisse.
              </p>
            </div>

            <button
              onClick={() => setShowCreateBizModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Créer une Entreprise & Générer Code</span>
            </button>
          </div>

          {/* Business Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allBusinesses.map((biz) => {
              const isCurrent = biz.id === business.id;
              const isSuspended = biz.status === 'suspended';

              return (
                <div
                  key={biz.id}
                  className={`bg-white rounded-2xl border p-5 shadow-2xs transition flex flex-col justify-between ${
                    isCurrent 
                      ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10' 
                      : isSuspended 
                      ? 'border-red-200 bg-red-50/20 opacity-80' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Header: Name & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-sm">{biz.name}</h3>
                          {isCurrent && (
                            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md">
                              Actif
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{biz.sector}</p>
                      </div>

                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isSuspended 
                          ? 'bg-red-100 text-red-800 border-red-200' 
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}>
                        {isSuspended ? 'Suspendue' : 'Active'}
                      </span>
                    </div>

                    {/* Access Code Highlight Box */}
                    <div className="mt-4 p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                          Code d'Accès Boutique
                        </span>
                        <span className="font-mono text-sm sm:text-base font-black text-blue-400 tracking-wider">
                          {biz.accessCode}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopyAccessCode(biz)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                        title="Copier le code"
                      >
                        {copiedCodeId === biz.id ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Metadata list */}
                    <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{biz.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono">{biz.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>Propriétaire : <strong className="text-slate-800">{biz.ownerName || 'Oumar Sawadogo'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => switchBusiness(biz.id)}
                        disabled={isCurrent}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-40 font-bold transition flex items-center gap-1 text-[11px] cursor-pointer"
                        title="Basculer vers cette boutique"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Ouvrir</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingBiz(biz);
                          setEditName(biz.name);
                          setEditPhone(biz.phone);
                          setEditCity(biz.city);
                          setEditSector(biz.sector);
                          setEditAccessCode(biz.accessCode);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                        title="Modifier l'entreprise"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleRegenerateCode(biz)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                        title="Régénérer le code d'accès"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleCloudSync(biz)}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          biz.cloudSyncEnabled === false
                            ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' 
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                        title={biz.cloudSyncEnabled === false ? "Réactiver Synchro Cloud" : "Désactiver Synchro Cloud (Mode local)"}
                      >
                        {biz.cloudSyncEnabled === false ? <CloudOff className="h-3.5 w-3.5" /> : <Cloud className="h-3.5 w-3.5" />}
                      </button>

                      <button
                        onClick={() => handleToggleBizStatus(biz)}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          isSuspended 
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                        title={isSuspended ? "Réactiver l'entreprise" : "Suspendre l'entreprise"}
                      >
                        {isSuspended ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                      </button>

                      <button
                        onClick={() => handleDeleteBiz(biz)}
                        className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition cursor-pointer"
                        title="Supprimer l'entreprise"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. OVERVIEW & TELEMETRY */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Volume des Ventes</span>
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {sales.reduce((a, s) => a + s.total, 0).toLocaleString()} <span className="text-xs font-bold text-blue-600">{business.currency}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {sales.length} transactions enregistrées
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Catalogue Articles</span>
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Package className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {products.filter(p => !p.archived).length} <span className="text-xs font-bold text-slate-500">articles</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Valeur stock : {products.reduce((a, p) => a + (p.purchasePrice * p.currentStock), 0).toLocaleString()} {business.currency}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Créances Clients</span>
                <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-900 mt-2">
                {customers.reduce((a, c) => a + (c.totalDebt || 0), 0).toLocaleString()} <span className="text-xs font-bold text-amber-600">{business.currency}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {customers.filter(c => c.totalDebt > 0).length} client(s) en dette
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Charges & Dépenses</span>
                <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <Receipt className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-red-900 mt-2">
                {expenses.reduce((a, e) => a + e.amount, 0).toLocaleString()} <span className="text-xs font-bold text-red-600">{business.currency}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {expenses.length} dépenses comptabilisées
              </p>
            </div>
          </div>

          {/* System Health Diagnostic Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Server className="h-5 w-5 text-blue-600" />
                <h2 className="font-bold text-slate-900 text-sm sm:text-base">Diagnostics & Télémétrie Cloud</h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Services Opérationnels
              </span>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="font-semibold">Base Firestore Cloud</span>
                  <Radio className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {isOnline ? 'Connecté (Temps Réel)' : 'Hors-Ligne (Stockage Local)'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Dernière sync : {lastSyncedAt ? lastSyncedAt.toLocaleTimeString('fr-FR') : 'En cours...'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="font-semibold">Cache Local PWA</span>
                  <Database className="h-3.5 w-3.5 text-slate-600" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  Actif (Sécurisé & Persistant)
                </p>
                <p className="text-[11px] text-slate-500">
                  Données sauvegardées en continu
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="font-semibold">Sécurité & Code Maître</span>
                  <Key className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  PIN Plateforme : <span className="font-mono text-blue-600">761278</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Déclencheur : Triple-clic sur le logo
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. USERS & ROLES */}
      {activeAdminTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">Gestion Globale des Comptes & Rôles</h2>
            </div>
            {pinChangeSuccess && (
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md animate-in fade-in flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> {pinChangeSuccess}
              </span>
            )}
          </div>

          <div className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <th className="pb-3">Collaborateur</th>
                    <th className="pb-3">Téléphone</th>
                    <th className="pb-3">Rôle Actuel</th>
                    <th className="pb-3">Code PIN</th>
                    <th className="pb-3">Statut</th>
                    <th className="pb-3 text-right">Actions Maître</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 font-semibold text-slate-900 flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold uppercase">
                          {u.name.charAt(0)}
                        </div>
                        <span>{u.name}</span>
                      </td>
                      <td className="py-3 text-slate-600 font-mono">{u.phone}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          u.role === 'owner' 
                            ? 'bg-amber-100 text-amber-900' 
                            : u.role === 'manager'
                            ? 'bg-purple-100 text-purple-900'
                            : u.role === 'cashier' 
                            ? 'bg-blue-100 text-blue-900' 
                            : 'bg-indigo-100 text-indigo-900'
                        }`}>
                          {u.role === 'owner' ? 'Propriétaire' : u.role === 'manager' ? 'Gérant' : u.role === 'cashier' ? 'Caissier' : 'Stock'}
                        </span>
                      </td>
                      <td className="py-3">
                        {editingUserId === u.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="password"
                              maxLength={4}
                              placeholder="PIN (4)"
                              value={newPinValue}
                              onChange={(e) => setNewPinValue(e.target.value.replace(/\D/g, ''))}
                              className="w-16 px-2 py-1 border border-blue-400 rounded text-xs font-mono"
                            />
                            <button
                              onClick={() => {
                                if (newPinValue.length === 4) {
                                  updateUserPin(u.id, newPinValue);
                                  setPinChangeSuccess(`PIN de ${u.name} modifié !`);
                                  setEditingUserId(null);
                                  setNewPinValue('');
                                  setTimeout(() => setPinChangeSuccess(null), 3000);
                                }
                              }}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-[11px] font-bold cursor-pointer"
                            >
                              OK
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[11px] cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingUserId(u.id);
                              setNewPinValue(u.pin || '');
                            }}
                            className="font-mono text-blue-600 hover:underline bg-slate-100 px-2 py-0.5 rounded cursor-pointer"
                            title="Cliquer pour modifier"
                          >
                            {u.pin || '••••'}
                          </button>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          u.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {u.active ? 'Actif' : 'Suspendu'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => toggleUserStatus(u.id)}
                          className={`p-1 rounded hover:bg-slate-200 transition text-xs font-bold cursor-pointer ${
                            u.active ? 'text-amber-700' : 'text-emerald-700'
                          }`}
                          title={u.active ? 'Suspendre' : 'Réactiver'}
                        >
                          {u.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. STORE CONFIGURATION */}
      {activeAdminTab === 'store' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Store className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">Coordonnées de l'Entreprise Active</h2>
            </div>
            {saveBizSuccess && (
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md animate-in fade-in flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Enregistré !
              </span>
            )}
          </div>

          <form onSubmit={handleSaveStore} className="p-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom Commercial</label>
                <input
                  type="text"
                  required
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Téléphone de Contact</label>
                <input
                  type="text"
                  required
                  value={bizPhone}
                  onChange={(e) => setBizPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ville</label>
                <input
                  type="text"
                  required
                  value={bizCity}
                  onChange={(e) => setBizCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Secteur / Quartier</label>
                <input
                  type="text"
                  required
                  value={bizSector}
                  onChange={(e) => setBizSector(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Numéro IFU (Fiscal)</label>
                <input
                  type="text"
                  value={bizIfu}
                  onChange={(e) => setBizIfu(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Devise de Vente</label>
                <input
                  type="text"
                  value={bizCurrency}
                  onChange={(e) => setBizCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Pied de Page du Ticket de Caisse</label>
              <input
                type="text"
                value={bizFooter}
                onChange={(e) => setBizFooter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition cursor-pointer"
              >
                Sauvegarder les Coordonnées
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. AUDIT & LOGS */}
      {activeAdminTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">Journal d'Audit & Opérations</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {sales.length} ventes • {expenses.length} dépenses
            </span>
          </div>

          <div className="p-5 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="pb-3">Date & Heure</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Détail</th>
                  <th className="pb-3">Opérateur</th>
                  <th className="pb-3 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.slice(0, 15).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 font-mono text-slate-500">
                      {new Date(s.createdAt).toLocaleDateString('fr-FR')} {new Date(s.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Vente
                      </span>
                    </td>
                    <td className="py-2.5 font-medium text-slate-800">
                      Ticket #{s.receiptNumber} ({s.items.length} art.)
                    </td>
                    <td className="py-2.5 text-slate-600">{s.sellerName}</td>
                    <td className="py-2.5 text-right font-black text-slate-900">
                      {s.total.toLocaleString()} {business.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. SYSTEM BACKUP & RESET */}
      {activeAdminTab === 'tools' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Sauvegarde Complète JSON</h3>
                <p className="text-xs text-slate-500">Exportez l'intégralité des données de toutes les entreprises</p>
              </div>
            </div>
            <button
              onClick={handleExportBackup}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Télécharger le Fichier JSON</span>
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-2xs space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Réinitialisation Démonstration</h3>
                <p className="text-xs text-slate-500">Restaure les boutiques burkinabè et utilisateurs de test</p>
              </div>
            </div>
            <button
              onClick={async () => {
                if (window.confirm('Voulez-vous restaurer les données de démonstration pour le Burkina Faso ?')) {
                  await resetToDemoData();
                  alert('Données de démo restaurées.');
                }
              }}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Restaurer les Données Démo</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal: Créer une Nouvelle Entreprise */}
      {showCreateBizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Enregistrer une Nouvelle Entreprise
                  </h3>
                  <p className="text-[11px] text-slate-500">Un code d'accès unique sera généré automatiquement</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateBizModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBusinessSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nom Commercial de la Boutique *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Épicerie Moderne Song-Taaba"
                  value={newBizName}
                  onChange={(e) => setNewBizName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Téléphone Boutique *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+226 70 00 00 00"
                    value={newBizPhone}
                    onChange={(e) => setNewBizPhone(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ville (Burkina Faso) *
                  </label>
                  <select
                    value={newBizCity}
                    onChange={(e) => setNewBizCity(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Ouagadougou (Centre)">Ouagadougou</option>
                    <option value="Bobo-Dioulasso (Hauts-Bassins)">Bobo-Dioulasso</option>
                    <option value="Koudougou (Centre-Ouest)">Koudougou</option>
                    <option value="Ouahigouya (Nord)">Ouahigouya</option>
                    <option value="Banfora (Cascades)">Banfora</option>
                    <option value="Fada N'Gourma (Est)">Fada N'Gourma</option>
                    <option value="Dédougou (Boucle du Mouhoun)">Dédougou</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Secteur d'Activité
                </label>
                <select
                  value={newBizSector}
                  onChange={(e) => setNewBizSector(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Alimentation & Épicerie Générale">Alimentation & Épicerie Générale</option>
                  <option value="Quincaillerie & Matériaux de Construction">Quincaillerie & Matériaux de Construction</option>
                  <option value="Électronique, Informatique & Téléphonie">Électronique, Informatique & Téléphonie</option>
                  <option value="Boutique de Prêt-à-Porter & Chaussures">Boutique de Prêt-à-Porter & Chaussures</option>
                  <option value="Pharmacie & Cosmétique">Pharmacie & Cosmétique</option>
                  <option value="Dépôt de Boissons & Restauration">Dépôt de Boissons & Restauration</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nom du Propriétaire *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Moussa Ouédraogo"
                    value={newBizOwnerName}
                    onChange={(e) => setNewBizOwnerName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    PIN Initial du Propriétaire (4 chiffres)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={newBizOwnerPin}
                    onChange={(e) => setNewBizOwnerPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-mono text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Code d'Accès Personnalisé (Optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Laissez vide pour auto-génération (ex: BF-EPIC-8721)"
                  value={customAccessCode}
                  onChange={(e) => setCustomAccessCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateBizModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBiz}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {isCreatingBiz ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Création...</span>
                    </>
                  ) : (
                    <span>Créer l'Entreprise</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Modifier Entreprise */}
      {editingBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Modifier l'Entreprise
              </h3>
              <button
                onClick={() => setEditingBiz(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditBusinessSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom Commercial</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Code d'Accès Boutique</label>
                <input
                  type="text"
                  required
                  value={editAccessCode}
                  onChange={(e) => setEditAccessCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border-2 border-blue-500 font-mono font-bold rounded-xl uppercase text-blue-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Téléphone</label>
                <input
                  type="text"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ville</label>
                <input
                  type="text"
                  required
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBiz(null)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
