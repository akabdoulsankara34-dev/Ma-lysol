import React from 'react';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Cloud,
  CloudOff,
  Headphones,
  Info,
  Lightbulb,
  MessageSquarePlus,
  RefreshCw,
  Settings,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useDigiSolia } from '../hooks/useDigiSolia';
import { DigiSoliaLogo } from './DigiSoliaLogo';

export const DafHomeView: React.FC = () => {
  const {
    config,
    host,
    user,
    notifications,
    unreadNotificationsCount,
    readNotificationIds,
    markNotificationRead,
    offlineQueue,
    isFlushingQueue,
    flushOfflineQueue,
  } = useDigiSolia();

  const totalPendingSync = host.pendingBusinessSyncCount + offlineQueue.length;

  const shortcutToneClass = (accent?: string) => {
    switch (accent) {
      case 'emerald':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
      case 'amber':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
      case 'secondary':
        return 'bg-sky-50 dark:bg-sky-950/40 text-[#2783C7] dark:text-sky-300 border-sky-200 dark:border-sky-800/60';
      default:
        return 'bg-[#F4F7FB] dark:bg-slate-800 text-[#163B65] dark:text-sky-300 border-[#E1E7EF] dark:border-slate-700';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in">
      {/* Welcome Banner */}
      <section
        className="rounded-3xl p-6 sm:p-8 text-white shadow-md border border-[#1E4C80]"
        style={{
          background: 'linear-gradient(135deg, #163B65 0%, #2783C7 100%)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <DigiSoliaLogo size="sm" inverted subtitle={config.appName} />
            <div className="space-y-1">
              <p className="text-xs font-medium text-sky-100">
                Bonjour et bienvenue, {user.fullName}
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Espace d’accueil DigiSolia
              </h1>
              <p className="text-xs sm:text-sm text-slate-100/90 max-w-2xl">
                {user.businessName ? `${user.businessName} · ` : ''}
                {user.roleLabel} · Accédez rapidement à vos outils métier, au support technique et à l’état de synchronisation.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => host.onNavigate('daf_support')}
              className="inline-flex items-center gap-2 bg-white text-[#163B65] hover:bg-sky-50 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Headphones className="h-4 w-4" />
              <span>Centre d’assistance</span>
            </button>

            <button
              type="button"
              onClick={() => host.onNavigate('daf_feedback')}
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/25 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <MessageSquarePlus className="h-4 w-4" />
              <span>Donner mon avis</span>
            </button>
          </div>
        </div>
      </section>

      {/* Sync Status + Notifications Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sync Status Card */}
        <div className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                État de synchronisation
              </p>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                {host.isOnline ? (
                  <>
                    <Cloud className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Connecté au Cloud</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Mode Hors Connexion</span>
                  </>
                )}
              </h2>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-lg border daf-tabular ${
                totalPendingSync > 0
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              }`}
            >
              {totalPendingSync > 0 ? `${totalPendingSync} en attente` : 'À jour'}
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span>Opérations métier en attente</span>
              <span className="font-mono font-bold daf-tabular">{host.pendingBusinessSyncCount}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span>Demandes & avis en file locale</span>
              <span className="font-mono font-bold daf-tabular">{offlineQueue.length}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span>Dernière synchronisation</span>
              <span className="font-mono daf-tabular">
                {host.lastSyncedAt ? host.lastSyncedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Local actif'}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={!host.isOnline || host.isSyncing || isFlushingQueue}
            onClick={async () => {
              await flushOfflineQueue();
              await host.onTriggerBusinessSync?.();
            }}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#F4F7FB] dark:bg-slate-800 hover:bg-[#E1E7EF] dark:hover:bg-slate-700 disabled:opacity-50 text-[#163B65] dark:text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-[#E1E7EF] dark:border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${host.isSyncing || isFlushingQueue ? 'animate-spin' : ''}`} />
            <span>{host.isSyncing || isFlushingQueue ? 'Synchronisation...' : 'Synchroniser maintenant'}</span>
          </button>
        </div>

        {/* Notifications Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-[#F4F7FB] dark:bg-slate-800 text-[#163B65] dark:text-sky-400 flex items-center justify-center">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Notifications & Annonces DigiSolia
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {unreadNotificationsCount > 0
                    ? `${unreadNotificationsCount} notification(s) non lue(s)`
                    : 'Toutes vos communications sont à jour'}
                </p>
              </div>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="rounded-xl bg-[#F4F7FB] dark:bg-slate-800/60 border border-[#E1E7EF] dark:border-slate-800 p-5 text-center space-y-1.5">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Aucune annonce en attente pour {config.appName}.
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Les alertes de mise à jour, maintenances et réponses de l’équipe s’afficheront ici.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {notifications.slice(0, 6).map((notif) => {
                const isRead = readNotificationIds.includes(notif.id);
                return (
                  <div
                    key={notif.id}
                    onClick={() => markNotificationRead(notif.id)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer ${
                      isRead
                        ? 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/70 dark:border-slate-800 opacity-80'
                        : 'bg-[#F4F7FB] dark:bg-slate-800 border-[#2783C7]/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {notif.title}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 shrink-0 daf-tabular">
                        {new Date(notif.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Shortcuts to Business Modules */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              Raccourcis vers vos activités ({config.shortName})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Votre tableau de bord métier reste inchangé et accessible en un clic.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {host.shortcuts.map((shortcut) => (
            <button
              key={shortcut.id}
              type="button"
              onClick={() => host.onNavigate(shortcut.tabId)}
              className="text-left bg-white dark:bg-slate-900 hover:border-[#2783C7] dark:hover:border-sky-500 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-4 shadow-2xs transition group cursor-pointer flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <span
                  className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${shortcutToneClass(
                    shortcut.accent
                  )}`}
                >
                  Métier
                </span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#2783C7] dark:group-hover:text-sky-400 transition">
                  {shortcut.label}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {shortcut.description}
                </p>
              </div>
              <div className="inline-flex items-center gap-1 text-xs font-bold text-[#163B65] dark:text-sky-400">
                <span>Ouvrir</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Useful Info + Quick Access to DAF Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-[#163B65] dark:text-sky-400">
            <Lightbulb className="h-4 w-4" />
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              Informations utiles & Bonnes pratiques
            </h2>
          </div>
          <ul className="space-y-2.5">
            {host.usefulTips.map((tip, idx) => (
              <li
                key={idx}
                className="p-3 rounded-xl bg-[#F4F7FB] dark:bg-slate-800/70 border border-[#E1E7EF] dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
              >
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-3">
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
            Services transversaux DigiSolia
          </h2>
          <div className="space-y-2">
            {[
              { id: 'daf_profile', label: 'Mon profil utilisateur', icon: User },
              { id: 'daf_settings', label: 'Paramètres & Thème', icon: Settings },
              { id: 'daf_support', label: 'Centre d’assistance', icon: Headphones },
              { id: 'daf_about', label: 'À propos de DigiSolia', icon: Info },
              ...(host.canAccessAdmin
                ? [{ id: 'daf_admin', label: 'DigiSolia Admin', icon: ShieldCheck }]
                : []),
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => host.onNavigate(item.id)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#F4F7FB] dark:bg-slate-800 hover:bg-[#E1E7EF] dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-[#2783C7] dark:text-sky-400" />
                    <span>{item.label}</span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
