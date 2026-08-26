import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Store, 
  KeyRound, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Zap,
  Lock,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export const CompanyAccessPortal: React.FC = () => {
  const { 
    authenticateBusiness, 
    allBusinesses, 
    setShowAdminPinModal,
    isOnline
  } = useApp();

  const [accessCode, setAccessCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'enter_code' | 'demo_stores'>('enter_code');
  const [logoClickCount, setLogoClickCount] = useState(0);

  // Discreet admin trigger: 3 clicks on logo opens Admin PIN prompt
  const handleLogoClick = () => {
    const newCount = logoClickCount + 1;
    if (newCount >= 3) {
      setShowAdminPinModal(true);
      setLogoClickCount(0);
    } else {
      setLogoClickCount(newCount);
      setTimeout(() => setLogoClickCount(0), 3000);
    }
  };

  // Filter ONLY Maëlys as the official demo boutique
  const demoBusinesses = allBusinesses.filter(
    b => b.id === 'biz_maelys' || b.accessCode === 'MAELYS' || b.isDemo === true
  );

  const handleLogin = (codeToTest?: string) => {
    const code = (codeToTest || accessCode).trim().toUpperCase();
    if (!code) {
      setErrorMsg("Veuillez saisir le code d'accès de votre entreprise.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      const result = authenticateBusiness(code);
      setIsLoading(false);
      if (!result.success) {
        setErrorMsg(result.message || "Code d'accès entreprise invalide.");
      }
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-blue-600 selection:text-white">
      {/* Top Header Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <div 
          onClick={handleLogoClick}
          className="flex items-center space-x-3 cursor-pointer select-none"
          title="BizPilot BF"
        >
          <div className="h-11 w-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-white text-lg tracking-tight">
                BizPilot <span className="text-blue-500 font-black">BF</span>
              </span>
              <span className="text-[10px] uppercase font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">
                SaaS Multi-Entreprises
              </span>
            </div>
            <p className="text-xs text-slate-400">Système de Caisse & Gestion Commerciale au Faso</p>
          </div>
        </div>

        {/* Connectivity status badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="hidden sm:inline font-medium">
            {isOnline ? 'Cloud Firestore Actif' : 'Mode Hors-ligne'}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-xl w-full mx-auto my-8">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Heading */}
          <div className="text-center mb-8 relative z-10">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white mb-4 shadow-xl shadow-blue-600/30">
              <KeyRound className="h-7 w-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Accès Entreprise
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto">
              Chaque boutique accède à son espace sécurisé et isolé grâce à son code d'accès unique.
            </p>
          </div>

          {/* Tab Selector: Saisie du Code vs Démonstration */}
          <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800 mb-6">
            <button
              onClick={() => { setActiveTab('enter_code'); setErrorMsg(null); }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'enter_code' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Saisir un Code</span>
            </button>
            <button
              onClick={() => { setActiveTab('demo_stores'); setErrorMsg(null); }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'demo_stores' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Boutique Démo (Maëlys)</span>
            </button>
          </div>

          {/* Mode 1: Saisie directe du code d'accès entreprise */}
          {activeTab === 'enter_code' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Code d'Accès Entreprise
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={accessCode}
                    onChange={(e) => {
                      setAccessCode(e.target.value.toUpperCase());
                      if (errorMsg) setErrorMsg(null);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Saisissez votre code (Ex: MAELYS)"
                    className="w-full bg-slate-950/80 border border-slate-700 text-white text-base sm:text-lg font-mono font-bold px-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase tracking-wider placeholder:text-slate-600"
                    autoFocus
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">
                    CODE UNIQUE
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <span>💡</span> Entrez le code attribué à votre boutique pour charger votre catalogue et vos données.
                </p>
              </div>

              {/* Error feedback */}
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Code non reconnu</p>
                    <p className="text-red-300 mt-0.5">{errorMsg}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={() => handleLogin()}
                disabled={isLoading || !accessCode.trim()}
                className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Vérification de l'accès...</span>
                  </>
                ) : (
                  <>
                    <span>Accéder à ma Boutique</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Mode 2: Démonstration officielle (Uniquement Maëlys) */}
          {activeTab === 'demo_stores' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-2">
                Découvrez les fonctionnalités complètes avec la boutique de démonstration officielle :
              </p>
              {demoBusinesses.map((biz) => (
                <div
                  key={biz.id}
                  onClick={() => handleLogin(biz.accessCode)}
                  className="p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-blue-500/30 hover:border-blue-500 cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base group-hover:text-blue-400 transition">
                        {biz.name}
                      </span>
                      <span className="text-[10px] font-mono font-black bg-blue-600 text-white px-2 py-0.5 rounded-md">
                        {biz.accessCode}
                      </span>
                      <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-md">
                        Démo Officielle
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        {biz.city}
                      </span>
                      <span>•</span>
                      <span>Propriétaire : {biz.ownerName || 'sankara eric'}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 pt-0.5">
                      Catalogue prêt, gestion de caisse, stocks, alertes péremption et programme fidélité.
                    </p>
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-blue-600/20 group-hover:bg-blue-600 text-blue-400 group-hover:text-white flex items-center justify-center transition shrink-0">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Clean Footer Notice */}
          <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>{isOnline ? 'Prêt pour synchronisation Firestore Cloud' : 'Mode local hors-ligne'}</span>
            </div>
            <span className="text-slate-400">BizPilot BF v2.5</span>
          </div>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="max-w-xl w-full mx-auto text-center text-xs text-slate-400">
        <p>BizPilot BF • Système de gestion commerciale optimisé pour le Burkina Faso</p>
        <p className="text-[11px] mt-0.5 text-slate-400">Ouagadougou • Bobo-Dioulasso • Koudougou • Partout au Faso</p>
      </div>
    </div>
  );
};
