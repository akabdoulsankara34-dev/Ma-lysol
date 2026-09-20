import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { AppUser, UserRole } from '../../types';
import { 
  Store, 
  KeyRound, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  ArrowLeft,
  User,
  ShoppingCart,
  Layers,
  Crown,
  UserCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  MapPin,
  Building2
} from 'lucide-react';

export const UserLoginPortal: React.FC = () => {
  const { 
    business, 
    allUsers, 
    loginUser, 
    logoutBusiness, 
    isOnline,
    setShowAdminPinModal
  } = useApp();

  // Scoped users for this business
  const storeUsers = allUsers.filter(u => u.businessId === business.id);

  // Fallback if somehow no users exist yet
  const availableUsers: AppUser[] = storeUsers.length > 0 ? storeUsers : [
    {
      id: `usr_${business.id}_owner`,
      businessId: business.id,
      name: business.ownerName || 'Propriétaire',
      phone: business.phone,
      role: 'owner',
      pin: '1234',
      active: true,
      createdAt: new Date().toISOString()
    }
  ];

  // Selected user state
  const [selectedUserId, setSelectedUserId] = useState<string>(
    availableUsers[0]?.id || ''
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  const selectedUser = availableUsers.find(u => u.id === selectedUserId) || availableUsers[0];

  // Focus password input whenever selected user changes
  useEffect(() => {
    setPassword('');
    setErrorMsg(null);
    inputRef.current?.focus();
  }, [selectedUserId]);

  // Triple click logo to open platform admin
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

  const handleLogin = (pwdToTest?: string) => {
    const pwd = (pwdToTest !== undefined ? pwdToTest : password).trim();
    if (!pwd) {
      setErrorMsg("Veuillez saisir votre mot de passe reçu du propriétaire.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (!selectedUser) {
      setErrorMsg("Veuillez sélectionner un collaborateur.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      const result = loginUser(selectedUser.id, pwd);
      setIsLoading(false);
      if (!result.success) {
        setErrorMsg(result.message || "Mot de passe incorrect.");
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPassword('');
        inputRef.current?.focus();
      }
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'C') {
      setPassword('');
      setErrorMsg(null);
    } else if (val === '⌫') {
      setPassword(prev => prev.slice(0, -1));
      setErrorMsg(null);
    } else {
      const next = password + val;
      setPassword(next);
      setErrorMsg(null);
      // If 4 digits entered and expected pin is 4 digits, attempt auto-login
      if (next.length === 4 && (!selectedUser.pin || selectedUser.pin.length === 4)) {
        handleLogin(next);
      }
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return {
          label: 'Propriétaire',
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
          icon: Crown,
          desc: 'Direction générale, trésorerie, rapports et gestion de l\'équipe',
          color: 'from-amber-500 to-yellow-600'
        };
      case 'manager':
        return {
          label: 'Gérant / Manager',
          badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
          icon: UserCheck,
          desc: 'Supervision de la boutique, inventaires et gestion quotidienne',
          color: 'from-purple-500 to-indigo-600'
        };
      case 'stock_manager':
        return {
          label: 'Gérant de Stock',
          badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
          icon: Layers,
          desc: 'Articles, stocks, entrées/sorties, DLC et étiquettes code-barres',
          color: 'from-indigo-500 to-blue-600'
        };
      case 'cashier':
      default:
        return {
          label: 'Caissière / Vendeur',
          badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
          icon: ShoppingCart,
          desc: 'Encaissement tactile, tickets de caisse, avoirs et clôtures Z',
          color: 'from-blue-500 to-cyan-600'
        };
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
                Étape 2 : Collaborateur
              </span>
            </div>
            <p className="text-xs text-slate-400">Accès Sécurisé par Profil & Mot de passe</p>
          </div>
        </div>

        {/* Action button: Change store + Connectivity status */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={logoutBusiness}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition cursor-pointer"
            title="Changer de boutique"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Changer de Boutique</span>
            <span className="sm:hidden">Retour</span>
          </button>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="hidden md:inline font-medium">
              {isOnline ? 'En ligne' : 'Hors-ligne'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl w-full mx-auto my-6">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Boutique Identity Banner */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h2 className="text-base sm:text-lg font-bold text-white truncate">
                    {business.name}
                  </h2>
                  <span className="shrink-0 font-mono text-[11px] font-extrabold bg-blue-600 text-white px-2 py-0.5 rounded-md">
                    {business.accessCode}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                  <span>{business.city} • {business.sector}</span>
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Code Entreprise Validé
              </span>
            </div>
          </div>

          {/* Title & Prompt */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white mb-3 shadow-lg shadow-blue-600/25">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Connexion Collaborateur
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg mx-auto">
              Que vous soyez le <span className="text-amber-400 font-semibold">propriétaire</span>, la <span className="text-indigo-400 font-semibold">gérante de stock</span> ou la <span className="text-blue-400 font-semibold">caissière</span>, saisissez votre mot de passe reçu du propriétaire pour ouvrir votre interface.
            </p>
          </div>

          {/* User Selector Grid */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              1. Sélectionnez votre compte :
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {availableUsers.map((u) => {
                const roleMeta = getRoleBadge(u.role);
                const RoleIcon = roleMeta.icon;
                const isSelected = u.id === selectedUserId;

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setSelectedUserId(u.id);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10' 
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300'
                    } ${!u.active ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className={`h-9 w-9 rounded-xl bg-linear-to-tr ${roleMeta.color} text-white flex items-center justify-center font-bold text-sm shadow-md`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${roleMeta.badgeClass}`}>
                        {roleMeta.label}
                      </span>
                    </div>

                    <div>
                      <p className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {u.name}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {u.phone}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 line-clamp-1">
                      {roleMeta.desc}
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Password / PIN Saisie Section */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  2. Mot de passe de {selectedUser.name} :
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Saisissez le mot de passe / code PIN fourni par le propriétaire.
                </p>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${getRoleBadge(selectedUser.role).badgeClass}`}>
                {getRoleBadge(selectedUser.role).label}
              </span>
            </div>

            {/* Input with Show/Hide toggle */}
            <div className="relative mb-3">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Entrez votre mot de passe ou code PIN..."
                className={`w-full bg-slate-900 border text-white text-lg font-mono font-bold px-4 py-3.5 pr-20 rounded-xl focus:outline-none focus:ring-2 tracking-wider placeholder:text-slate-600 transition ${
                  errorMsg 
                    ? 'border-red-500 focus:ring-red-500/50' 
                    : 'border-slate-700 focus:ring-blue-500 focus:border-transparent'
                } ${shake ? 'animate-shake' : ''}`}
                autoFocus
              />

              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                  title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                {password.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPassword('');
                      inputRef.current?.focus();
                    }}
                    className="text-xs text-slate-500 hover:text-slate-300 font-bold px-1"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="flex items-center space-x-2 text-red-400 text-xs bg-red-950/40 border border-red-900/60 p-3 rounded-xl mb-4 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Touch On-Screen Numeric Keypad for POS Displays */}
            <div className="mb-4">
              <p className="text-[11px] text-slate-500 mb-2 text-center sm:text-left">
                Pavé numérique tactile ou saisie directe au clavier :
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleKeypadPress(k)}
                    className={`h-11 sm:h-12 rounded-xl font-bold text-base transition flex items-center justify-center cursor-pointer select-none ${
                      k === 'C' || k === '⌫'
                        ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs active:bg-slate-600'
                        : 'bg-slate-900 hover:bg-blue-600 hover:text-white active:bg-blue-700 text-slate-200 border border-slate-800'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              disabled={isLoading || !password.trim()}
              onClick={() => handleLogin()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold py-3.5 px-6 rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/25 active:scale-98 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Ouvrir mon interface ({getRoleBadge(selectedUser.role).label})</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Demo Helpers for Quick Testing */}
            {(business.isDemo || business.id === 'biz_maelys') && (
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <p className="text-[11px] text-slate-400 mb-2 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>Codes démo rapides (cliquez pour tester) :</span>
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {availableUsers.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setSelectedUserId(u.id);
                        setPassword(u.pin || '0000');
                        handleLogin(u.pin || '0000');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-[11px] transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="font-semibold">{u.name.split(' ')[0]}</span>
                      <span className="font-mono text-blue-400 bg-slate-900 px-1 rounded font-bold">
                        {u.pin || '0000'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto text-center text-xs text-slate-500 py-2">
        <p>BizPilot BF • Sécurité & Isolation Multi-Entreprises au Faso • Conforme OHADA</p>
      </div>
    </div>
  );
};
