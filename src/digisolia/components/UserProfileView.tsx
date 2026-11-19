import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Phone,
  Save,
  Shield,
  User,
} from 'lucide-react';
import { useDigiSolia } from '../hooks/useDigiSolia';

export const UserProfileView: React.FC = () => {
  const { user, host, config, updatePersonalProfile } = useDigiSolia();

  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setStatusMsg(null);
  }, [user.userId, user.firstName, user.lastName, user.email, user.phone]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    const res = await updatePersonalProfile({ firstName, lastName, email, phone });
    setSaving(false);
    setStatusMsg({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in">
      <header className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-[#163B65] text-white font-extrabold text-xl flex items-center justify-center shrink-0">
            {(user.firstName || user.fullName || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {user.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {user.roleLabel} {user.businessName ? `· ${user.businessName}` : ''} · {config.appName}
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          ID : {user.userId}
        </span>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Personal Info Form */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <User className="h-4 w-4 text-[#2783C7] dark:text-sky-400" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Informations personnelles
            </h2>
          </div>

          {statusMsg && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{statusMsg.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Prénom <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nom
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Adresse e-mail
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="utilisateur@entreprise.bf"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Téléphone (facultatif)
              </label>
              <div className="relative">
                <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+226 70 00 00 00"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#163B65] hover:bg-[#102D4F] disabled:opacity-60 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer le profil'}</span>
            </button>
          </div>
        </form>

        {/* Account Metadata & Session Management */}
        <aside className="lg:col-span-5 bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Shield className="h-4 w-4 text-[#163B65] dark:text-sky-400" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Compte & Gestion de session
            </h2>
          </div>

          <dl className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <dt className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Date de création</span>
              </dt>
              <dd className="font-semibold text-slate-900 dark:text-white daf-tabular">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '—'}
              </dd>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <dt className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5" />
                <span>Rôle dans l’application</span>
              </dt>
              <dd className="font-bold text-[#163B65] dark:text-sky-400">{user.roleLabel}</dd>
            </div>

            <div className="flex items-center justify-between py-2">
              <dt className="text-slate-500 dark:text-slate-400">État de session</dt>
              <dd className="font-semibold text-emerald-700 dark:text-emerald-400">
                {host.activeSessionSummary || 'Session active sécurisée'}
              </dd>
            </div>
          </dl>

          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            {host.onLockSession && (
              <button
                type="button"
                onClick={host.onLockSession}
                className="w-full inline-flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
              >
                <Lock className="h-4 w-4" />
                <span>Verrouiller la session</span>
              </button>
            )}

            {host.onLogout && (
              <button
                type="button"
                onClick={host.onLogout}
                className="w-full inline-flex items-center justify-center gap-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Déconnexion de l’espace</span>
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
