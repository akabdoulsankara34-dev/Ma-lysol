import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Store, 
  User, 
  Wifi, 
  WifiOff, 
  Bell, 
  PlusCircle, 
  ChevronDown, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Sparkles,
  ShieldCheck,
  Building2,
  LogOut,
  KeyRound,
  RefreshCw,
  Menu,
  Lock,
  Sun,
  Moon,
  Headphones
} from 'lucide-react';
import { useDigiSolia } from '../digisolia';
import { PWAInstallButton } from './common/PWAInstallButton';

export const Navbar: React.FC = () => {
  const { 
    business, 
    currentUser, 
    allUsers, 
    requestUserSwitch,
    switchUser, 
    logoutBusiness,
    lockUserSession,
    isOnline, 
    isSyncing, 
    forceSyncCloudData,
    pendingSyncCount,
    processOfflineQueue,
    notifications, 
    markNotificationAsRead, 
    clearAllNotifications,
    setActiveTab,
    cart,
    handleLogoClick,
    isPlatformAdminUnlocked,
    lockPlatformAdmin,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen
  } = useApp();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const { theme, toggleTheme } = useDigiSolia();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
        setShowNotifDropdown(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUserDropdown(false);
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const unreadNotifs = notifications.filter(n => !n.read);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-md">Propriétaire</span>;
      case 'manager':
        return <span className="bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-semibold px-2 py-0.5 rounded-md">Gérant</span>;
      case 'cashier':
        return <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-semibold px-2 py-0.5 rounded-md">Caissier</span>;
      case 'stock_manager':
        return <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-semibold px-2 py-0.5 rounded-md">Stock</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-md">{role}</span>;
    }
  };

  return (
    <header ref={headerRef} className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {/* Mobile Hamburger Drawer Trigger */}
            <button
              id="btn-navbar-mobile-menu"
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden p-2 -ml-1 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition cursor-pointer shrink-0"
              aria-label="Ouvrir le menu principal"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo & Store Info (Triple click triggers Super Admin Mode) */}
            <div 
              id="bizpilot-brand-logo"
              onClick={handleLogoClick}
              className="flex items-center space-x-2 sm:space-x-3 cursor-pointer select-none group active:scale-98 transition-transform min-w-0"
              title="BizPilot Burkina Faso (Triple-cliquez pour l'accès Administrateur Plateforme)"
            >
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-blue-600 group-hover:bg-blue-700 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 transition shrink-0">
                <Store className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-lg tracking-tight group-hover:text-blue-600 transition truncate">
                    BizPilot <span className="text-blue-600 font-extrabold">BF</span>
                  </span>
                  <span className="font-mono text-[10px] sm:text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 sm:px-2 py-0.5 rounded-md shrink-0">
                    {business.accessCode}
                  </span>
                  {isPlatformAdminUnlocked && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                      <ShieldCheck className="h-3 w-3" />
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 truncate max-w-[130px] sm:max-w-xs">
                  {business.name} • {business.city.split('(')[0].trim()}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Indicators */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Sync & Connectivity status */}
            <div className="flex items-center">
              {isOnline ? (
                <button 
                  onClick={() => forceSyncCloudData()}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    pendingSyncCount > 0
                      ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                  title={
                    isSyncing 
                      ? "Synchronisation Cloud Firestore en cours..." 
                      : pendingSyncCount > 0 
                        ? `${pendingSyncCount} opération(s) en attente de synchronisation. Cliquez pour synchroniser.`
                        : "Connecté en temps réel. Cliquez pour forcer la synchronisation."
                  }
                >
                  {isSyncing ? (
                    <RefreshCw className="h-3.5 w-3.5 text-emerald-600 animate-spin" />
                  ) : pendingSyncCount > 0 ? (
                    <RefreshCw className="h-3.5 w-3.5 text-amber-600" />
                  ) : (
                    <Wifi className="h-3.5 w-3.5 text-emerald-600" />
                  )}
                  <span className="hidden sm:inline">
                    {isSyncing 
                      ? 'Sync en cours...' 
                      : pendingSyncCount > 0 
                        ? `${pendingSyncCount} à synchroniser` 
                        : 'En ligne (Cloud)'}
                  </span>
                  {pendingSyncCount > 0 && !isSyncing && (
                    <span className="inline-flex sm:hidden items-center justify-center bg-amber-600 text-white rounded-full h-4 w-4 text-[10px]">
                      {pendingSyncCount}
                    </span>
                  )}
                </button>
              ) : (
                <div 
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300 animate-pulse cursor-default"
                  title="Mode hors-ligne actif. Vos ventes, stocks et factures sont enregistrés localement."
                >
                  <WifiOff className="h-3.5 w-3.5 text-amber-700" />
                  <span>
                    Hors-ligne {pendingSyncCount > 0 ? `(${pendingSyncCount} en attente)` : '(Local)'}
                  </span>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                id="btn-notifications"
                onClick={() => {
                  setShowUserDropdown(false);
                  setShowNotifDropdown(!showNotifDropdown);
                }}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors focus:outline-none cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadNotifs.length > 9 ? '9+' : unreadNotifs.length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifDropdown && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-white text-sm">Alertes & Notifications</span>
                    {unreadNotifs.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                      >
                        Tout effacer
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-xs">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                        Toutes les alertes sont à jour. Tout fonctionne normalement !
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            markNotificationAsRead(notif.id);
                            if (notif.linkTab) setActiveTab(notif.linkTab);
                            setShowNotifDropdown(false);
                          }}
                          className={`p-3 text-xs cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-start space-x-3 ${
                            notif.read ? 'opacity-65 bg-white dark:bg-slate-900' : 'bg-slate-50/70 dark:bg-slate-800/40 font-medium'
                          }`}
                        >
                          <div className="shrink-0 mt-0.5">
                            {notif.type === 'danger' && <XCircle className="h-4 w-4 text-red-500" />}
                            {notif.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                            {notif.type === 'info' && <Sparkles className="h-4 w-4 text-blue-500" />}
                            {notif.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-slate-900 dark:text-white font-semibold">{notif.title}</p>
                            <p className="text-slate-600 dark:text-slate-300 mt-0.5">{notif.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick POS CTA for desktop */}
            <button
              id="nav-quick-pos-btn"
              onClick={() => setActiveTab('pos')}
              className="hidden sm:inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3.5 py-2 rounded-lg text-sm font-semibold shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Caisse Vente</span>
              {cart.length > 0 && (
                <span className="ml-1 bg-blue-800 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>

            {/* In-App PWA Install Prompt */}
            <PWAInstallButton variant="navbar" />

            {/* Light / Dark Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Changer de thème"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Quick Session Lock Button */}
            <button
              type="button"
              onClick={lockUserSession}
              title="Verrouiller l'écran (Mot de passe requis)"
              className="hidden sm:flex p-2 rounded-lg text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <Lock className="h-4 w-4" />
            </button>

            {/* Role & User Selector */}
            <div className="relative">
              <button
                id="btn-user-menu"
                onClick={() => {
                  setShowNotifDropdown(false);
                  setShowUserDropdown(!showUserDropdown);
                }}
                className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 transition focus:outline-none cursor-pointer"
              >
                <div className="h-6 w-6 rounded-full bg-slate-800 dark:bg-blue-600 text-white flex items-center justify-center text-xs font-bold uppercase">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="font-semibold text-slate-900 dark:text-white leading-tight">{currentUser.name.split(' ')[0]}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{currentUser.role === 'owner' ? 'Propriétaire' : currentUser.role === 'manager' ? 'Gérant' : currentUser.role === 'cashier' ? 'Caissier' : 'Stock'}</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              </button>

              {/* User Switcher Dropdown */}
              {showUserDropdown && (
                <div className="origin-top-right absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Changer de Profil</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Sélectionnez votre compte :</p>
                  </div>
                  <div className="p-1 space-y-1 max-h-60 overflow-y-auto">
                    {allUsers.map(user => (
                      <button
                        key={user.id}
                        onClick={() => {
                          requestUserSwitch(user.id);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                          currentUser.id === user.id ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-950 dark:text-blue-200 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs text-white ${
                            user.role === 'owner' ? 'bg-amber-600' : user.role === 'manager' ? 'bg-purple-600' : user.role === 'cashier' ? 'bg-blue-600' : 'bg-indigo-600'
                          }`}>
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-400">{user.phone}</p>
                          </div>
                        </div>
                        {getRoleBadge(user.role)}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1 px-1 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        setActiveTab('daf_profile');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 font-semibold transition cursor-pointer"
                    >
                      <User className="h-3.5 w-3.5 text-[#2783C7]" />
                      <span>Mon profil DigiSolia</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        setActiveTab('daf_support');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 font-semibold transition cursor-pointer"
                    >
                      <Headphones className="h-3.5 w-3.5 text-[#163B65] dark:text-[#2783C7]" />
                      <span>Centre d’assistance</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        lockUserSession();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 font-semibold transition cursor-pointer"
                    >
                      <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Verrouiller l'écran</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        logoutBusiness();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 font-medium transition cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Changer d'Entreprise</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Offline / Pending sync banner */}
      {!isOnline && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-1 text-xs text-center flex items-center justify-center gap-2 font-medium shadow-inner">
          <WifiOff className="h-3.5 w-3.5 animate-pulse" />
          <span>Mode Hors-Ligne actif — Vous pouvez continuer vos ventes, stocks et factures normalement. Tout sera synchronisé au retour du réseau.</span>
          {pendingSyncCount > 0 && (
            <span className="bg-amber-700/80 px-2 py-0.5 rounded-full text-[10px] font-semibold">
              {pendingSyncCount} en attente
            </span>
          )}
        </div>
      )}
      {isOnline && pendingSyncCount > 0 && (
        <div className="bg-blue-600 text-white px-4 py-1 text-xs text-center flex items-center justify-center gap-2 font-medium shadow-inner">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          <span>Connexion rétablie — Synchronisation automatique de {pendingSyncCount} opération(s) en cours...</span>
          <button 
            onClick={() => forceSyncCloudData()}
            className="underline text-[11px] font-bold hover:text-blue-100 ml-2"
          >
            Forcer maintenant
          </button>
        </div>
      )}
    </header>
  );
};
