import React from 'react';
import {
  Bell,
  Cloud,
  CloudOff,
  Database,
  Download,
  Globe,
  Info,
  Moon,
  RefreshCw,
  Settings,
  Sun,
} from 'lucide-react';
import { useDigiSolia } from '../hooks/useDigiSolia';

export const DafSettingsView: React.FC = () => {
  const {
    config,
    host,
    preferences,
    theme,
    setTheme,
    updatePreferences,
    offlineQueue,
    isFlushingQueue,
    lastDafSyncError,
    flushOfflineQueue,
  } = useDigiSolia();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in">
      <header className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs flex items-center gap-3.5">
        <div className="h-11 w-11 rounded-2xl bg-[#163B65] text-white flex items-center justify-center shrink-0">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Paramètres DigiSolia
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Préférences d’affichage, notifications, synchronisation hors connexion et sauvegardes.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Theme & Language */}
        <section className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-5">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Apparence & Langue
          </h2>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Mode d’affichage
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  theme === 'light'
                    ? 'border-[#2783C7] bg-[#F4F7FB] text-[#163B65]'
                    : 'border-[#E1E7EF] dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Sun className="h-4 w-4" />
                <span>Mode clair</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  theme === 'dark'
                    ? 'border-[#2783C7] bg-sky-950/60 text-sky-300'
                    : 'border-[#E1E7EF] dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Moon className="h-4 w-4" />
                <span>Mode sombre</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <Globe className="h-3.5 w-3.5 text-[#2783C7] dark:text-sky-400" />
              <span>Langue de l’interface</span>
            </label>
            <select
              value={preferences.language}
              onChange={(e) =>
                updatePreferences({ language: e.target.value as 'fr' | 'en' })
              }
              className="w-full px-3 py-2.5 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
            >
              <option value="fr">Français (Burkina Faso · Défaut)</option>
              <option value="en" disabled>
                English (Bientôt disponible)
              </option>
            </select>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#2783C7] dark:text-sky-400" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Gestion des notifications
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[#F4F7FB] dark:bg-slate-800/60 border border-[#E1E7EF] dark:border-slate-800 cursor-pointer">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  Notifications DigiSolia
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Recevoir les annonces produit et réponses du support.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.notificationsEnabled}
                onChange={(e) =>
                  updatePreferences({ notificationsEnabled: e.target.checked })
                }
                className="h-4 w-4 accent-[#163B65]"
              />
            </label>

            <label className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[#F4F7FB] dark:bg-slate-800/60 border border-[#E1E7EF] dark:border-slate-800 cursor-pointer">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  Synchronisation automatique hors connexion
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Envoyer automatiquement les avis et tickets dès le retour d’Internet.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.autoSyncOfflineQueue}
                onChange={(e) =>
                  updatePreferences({ autoSyncOfflineQueue: e.target.checked })
                }
                className="h-4 w-4 accent-[#163B65]"
              />
            </label>
          </div>
        </section>

        {/* Sync State */}
        <section className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              {host.isOnline ? (
                <Cloud className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <CloudOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              )}
              <span>État de synchronisation</span>
            </h2>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {host.isOnline ? 'En ligne' : 'Hors ligne'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">File métier en attente</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white daf-tabular">
                {host.pendingBusinessSyncCount}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">File DAF en attente</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white daf-tabular">
                {offlineQueue.length}
              </span>
            </div>
            {lastDafSyncError && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400">
                Dernière erreur : {lastDafSyncError}
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={!host.isOnline || isFlushingQueue || host.isSyncing}
            onClick={async () => {
              await flushOfflineQueue();
              await host.onTriggerBusinessSync?.();
            }}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#163B65] hover:bg-[#102D4F] disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isFlushingQueue || host.isSyncing ? 'animate-spin' : ''}`} />
            <span>Forcer la synchronisation</span>
          </button>
        </section>

        {/* Backups & Version */}
        <section className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-[#2783C7] dark:text-sky-400" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Sauvegardes & Version
            </h2>
          </div>

          {host.onExportBackup ? (
            <button
              type="button"
              onClick={host.onExportBackup}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#F4F7FB] dark:bg-slate-800 hover:bg-[#E1E7EF] dark:hover:bg-slate-700 text-[#163B65] dark:text-white border border-[#E1E7EF] dark:border-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Exporter une sauvegarde locale (JSON)</span>
            </button>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cette application gère ses sauvegardes directement dans le Cloud Firebase.
            </p>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                <span>Application</span>
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {config.appName} v{config.version}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Framework</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {config.frameworkVersion}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
