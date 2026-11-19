import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AppWindow,
  BarChart3,
  Bell,
  CheckCircle2,
  ClipboardList,
  Headphones,
  Layers,
  MessageSquare,
  Plus,
  Send,
  ShieldCheck,
  Star,
  UserCog,
  Users,
  LogIn,
} from 'lucide-react';
import { ensureFirebaseAuth } from '../../lib/firebase';
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_PERMISSIONS,
  DIGISOLIA_CATALOG_APPS,
} from '../config/dafConfig';
import { useDigiSolia } from '../hooks/useDigiSolia';
import {
  dafFirebaseService,
  signInAdminWithGoogle,
  subscribeDafAuthState,
} from '../services/firebaseService';
import {
  DigiSoliaAdminLog,
  DigiSoliaAdminRole,
  DigiSoliaAdminUser,
  DigiSoliaAppId,
  DigiSoliaFeedbackItem,
  DigiSoliaNotification,
  DigiSoliaRegisteredApp,
  DigiSoliaSupportTicket,
  DigiSoliaTicketStatus,
} from '../types';
import { getTicketStatusMeta, hasAdminPermission } from '../utils/validation';

type AdminTabKey =
  | 'overview'
  | 'apps'
  | 'users'
  | 'feedback'
  | 'support'
  | 'analytics'
  | 'admins'
  | 'notifications'
  | 'logs';

export const DigiSoliaAdminView: React.FC = () => {
  const { user, host } = useDigiSolia();

  const [activeTab, setActiveTab] = useState<AdminTabKey>('overview');
  const [selectedAppFilter, setSelectedAppFilter] = useState<string>('all');
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState<string>('all');

  const [apps, setApps] = useState<DigiSoliaRegisteredApp[]>([]);
  const [directoryUsers, setDirectoryUsers] = useState<Record<string, any>[]>([]);
  const [administrators, setAdministrators] = useState<DigiSoliaAdminUser[]>([]);
  const [allNotifications, setAllNotifications] = useState<DigiSoliaNotification[]>([]);
  const [adminLogs, setAdminLogs] = useState<DigiSoliaAdminLog[]>([]);
  const [feedbackByApp, setFeedbackByApp] = useState<Record<string, DigiSoliaFeedbackItem[]>>({});
  const [supportByApp, setSupportByApp] = useState<Record<string, DigiSoliaSupportTicket[]>>({});

  // Role simulation or active admin session
  const [activeAdminRole, setActiveAdminRole] = useState<DigiSoliaAdminRole>('super_admin');
  const [adminNotice, setAdminNotice] = useState<string | null>(null);
  const [firebaseAuthEmail, setFirebaseAuthEmail] = useState<string | null>(null);
  const [isFirebaseAnonymous, setIsFirebaseAnonymous] = useState<boolean>(true);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState<boolean>(false);

  // Forms state
  const [newAppId, setNewAppId] = useState('');
  const [newAppName, setNewAppName] = useState('');
  const [newAppCategory, setNewAppCategory] = useState('Gestion & PME');
  const [newAppVersion, setNewAppVersion] = useState('1.0.0');

  const [responseDrafts, setResponseDrafts] = useState<Record<string, string>>({});

  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<DigiSoliaAdminRole>('support_agent');

  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifAppId, setNotifAppId] = useState<string>('all');
  const [notifType, setNotifType] = useState<DigiSoliaNotification['type']>('info');

  const actor = useMemo(
    () => ({
      id: user.userId,
      name: user.fullName,
      role: activeAdminRole,
    }),
    [activeAdminRole, user.fullName, user.userId]
  );

  // Track Firebase Auth state (Anonymous vs Verified Google Admin)
  useEffect(() => {
    return subscribeDafAuthState((fbUser) => {
      setFirebaseAuthEmail(fbUser?.email || null);
      setIsFirebaseAnonymous(!fbUser || fbUser.isAnonymous || !fbUser.email);
    });
  }, []);

  // Subscribe to global DAF admin collections after Firebase Auth is ready
  useEffect(() => {
    if (!host.isOnline) return;
    let cancelled = false;
    let unsubApps: (() => void) | undefined;
    let unsubUsers: (() => void) | undefined;
    let unsubAdmins: (() => void) | undefined;
    let unsubNotifs: (() => void) | undefined;
    let unsubLogs: (() => void) | undefined;

    (async () => {
      await ensureFirebaseAuth();
      if (cancelled) return;
      await dafFirebaseService.ensureAppCatalogRegistered(host.appId).catch(() => null);
      if (cancelled) return;

      unsubApps = dafFirebaseService.subscribeRegisteredApps(setApps);
      unsubUsers = dafFirebaseService.subscribeDirectoryUsers(setDirectoryUsers);
      unsubAdmins = dafFirebaseService.subscribeAdministrators(setAdministrators);
      unsubNotifs = dafFirebaseService.subscribeAllNotifications(setAllNotifications);
      unsubLogs = dafFirebaseService.subscribeAdminLogs(setAdminLogs);
    })();

    return () => {
      cancelled = true;
      unsubApps?.();
      unsubUsers?.();
      unsubAdmins?.();
      unsubNotifs?.();
      unsubLogs?.();
    };
  }, [host.appId, host.isOnline, firebaseAuthEmail]);

  // Subscribe to feedback & support subcollections across all catalog / registered apps
  const trackedAppIds = useMemo(() => {
    const ids = new Set<string>(DIGISOLIA_CATALOG_APPS.map((a) => a.appId));
    apps.forEach((a) => ids.add(a.appId));
    return Array.from(ids);
  }, [apps]);

  useEffect(() => {
    if (!host.isOnline || trackedAppIds.length === 0) return;
    let cancelled = false;
    const unsubs: (() => void)[] = [];

    (async () => {
      await ensureFirebaseAuth();
      if (cancelled) return;
      for (const appId of trackedAppIds) {
        unsubs.push(
          dafFirebaseService.subscribeAppFeedback(appId, (items) => {
            setFeedbackByApp((prev) => ({ ...prev, [appId]: items }));
          })
        );
        unsubs.push(
          dafFirebaseService.subscribeAppSupport(appId, (items) => {
            setSupportByApp((prev) => ({ ...prev, [appId]: items }));
          })
        );
      }
    })();

    return () => {
      cancelled = true;
      unsubs.forEach((u) => u());
    };
  }, [host.isOnline, trackedAppIds]);

  const allFeedback = useMemo(() => {
    const list = Object.values(feedbackByApp).flat();
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [feedbackByApp]);

  const allSupport = useMemo(() => {
    const list = Object.values(supportByApp).flat();
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [supportByApp]);

  const filteredFeedback = useMemo(() => {
    return allFeedback.filter((item) => {
      if (selectedAppFilter !== 'all' && item.appId !== selectedAppFilter) return false;
      if (feedbackCategoryFilter !== 'all' && item.category !== feedbackCategoryFilter) return false;
      return true;
    });
  }, [allFeedback, selectedAppFilter, feedbackCategoryFilter]);

  const filteredSupport = useMemo(() => {
    return allSupport.filter(
      (item) => selectedAppFilter === 'all' || item.appId === selectedAppFilter
    );
  }, [allSupport, selectedAppFilter]);

  const usersCountByApp = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const u of directoryUsers) {
      const appKey = u.appId || 'digisolia-pos';
      counts[appKey] = (counts[appKey] || 0) + 1;
    }
    return counts;
  }, [directoryUsers]);

  const satisfactionStats = useMemo(() => {
    const rated = allFeedback.filter((f) => typeof f.rating === 'number' && f.rating > 0);
    const avg =
      rated.length > 0
        ? rated.reduce((sum, f) => sum + (f.rating || 0), 0) / rated.length
        : 0;
    const dist = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: rated.filter((f) => f.rating === star).length,
    }));
    const resolvedFeedback = allFeedback.filter((f) => f.status === 'resolu').length;
    const resolvedSupport = allSupport.filter((s) => s.status === 'resolu').length;
    const totalTickets = allFeedback.length + allSupport.length;
    const resolutionRate =
      totalTickets > 0
        ? Math.round(((resolvedFeedback + resolvedSupport) / totalTickets) * 100)
        : 100;

    return { avg, ratedCount: rated.length, dist, resolutionRate };
  }, [allFeedback, allSupport]);

  const showTempNotice = (msg: string) => {
    setAdminNotice(msg);
    setTimeout(() => setAdminNotice(null), 4000);
  };

  const handleUpdateFeedback = async (
    item: DigiSoliaFeedbackItem,
    nextStatus: DigiSoliaTicketStatus
  ) => {
    if (!hasAdminPermission(activeAdminRole, 'canRespondSupportAndFeedback')) {
      showTempNotice('Action refusée : votre rôle actif ne permet pas la modification des statuts.');
      return;
    }
    try {
      await dafFirebaseService.updateFeedbackStatus(
        item.appId,
        item.id,
        nextStatus,
        responseDrafts[item.id] || item.adminResponse || '',
        actor
      );
      showTempNotice(`Avis mis à jour -> ${getTicketStatusMeta(nextStatus).label}`);
    } catch (err) {
      showTempNotice(err instanceof Error ? err.message : 'Erreur de mise à jour Firestore');
    }
  };

  const handleUpdateSupport = async (
    ticket: DigiSoliaSupportTicket,
    nextStatus: DigiSoliaTicketStatus
  ) => {
    if (!hasAdminPermission(activeAdminRole, 'canRespondSupportAndFeedback')) {
      showTempNotice('Action refusée : autorisation insuffisante.');
      return;
    }
    try {
      await dafFirebaseService.updateSupportTicketStatus(
        ticket.appId,
        ticket.id,
        nextStatus,
        responseDrafts[ticket.id] || ticket.adminResponse || '',
        actor
      );
      showTempNotice(`Ticket support mis à jour -> ${getTicketStatusMeta(nextStatus).label}`);
    } catch (err) {
      showTempNotice(err instanceof Error ? err.message : 'Erreur de mise à jour Firestore');
    }
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAdminPermission(activeAdminRole, 'canManageApps')) {
      showTempNotice('Autorisation requise : Super administrateur ou Administrateur d’application.');
      return;
    }
    const cleanId = newAppId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!cleanId || !newAppName.trim()) return;

    const appPayload: DigiSoliaRegisteredApp = {
      id: cleanId,
      appId: cleanId,
      name: newAppName.trim(),
      shortName: newAppName.trim(),
      description: `Application métier enregistrée dans DigiSolia App Framework`,
      version: newAppVersion.trim() || '1.0.0',
      status: 'active',
      category: newAppCategory.trim() || 'Gestion',
      usersCount: 0,
      lastUpdatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    try {
      await dafFirebaseService.upsertRegisteredApp(appPayload, actor);
      setNewAppId('');
      setNewAppName('');
      showTempNotice(`Application "${appPayload.name}" enregistrée dans Firestore.`);
    } catch (err) {
      showTempNotice(
        err instanceof Error ? err.message : 'Erreur Firestore : authentification Super-Admin requise.'
      );
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAdminPermission(activeAdminRole, 'canManageAdmins')) {
      showTempNotice('Seul un Super administrateur peut ajouter des administrateurs.');
      return;
    }
    if (!newAdminName.trim() || !newAdminEmail.trim()) return;
    const newAdm: DigiSoliaAdminUser = {
      id: `adm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: newAdminName.trim(),
      email: newAdminEmail.trim().toLowerCase(),
      role: newAdminRole,
      assignedApps: ['*'],
      active: true,
      createdAt: new Date().toISOString(),
    };
    try {
      await dafFirebaseService.upsertAdministrator(newAdm, actor);
      setNewAdminName('');
      setNewAdminEmail('');
      showTempNotice(`Administrateur ${newAdm.name} (${ADMIN_ROLE_LABELS[newAdm.role]}) ajouté.`);
    } catch (err) {
      showTempNotice(
        err instanceof Error ? err.message : 'Erreur Firestore : authentification Super-Admin requise.'
      );
    }
  };

  const handlePublishNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAdminPermission(activeAdminRole, 'canBroadcastNotifications')) {
      showTempNotice('Votre rôle ne permet pas la diffusion de notifications.');
      return;
    }
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    try {
      await dafFirebaseService.publishNotification(
        {
          appId: notifAppId as DigiSoliaAppId | 'all',
          title: notifTitle.trim(),
          message: notifMessage.trim(),
          type: notifType,
          targetAudience: 'all',
          createdBy: actor.id,
          createdByName: actor.name,
        },
        actor
      );
      setNotifTitle('');
      setNotifMessage('');
      showTempNotice('Notification diffusée aux utilisateurs.');
    } catch (err) {
      showTempNotice(
        err instanceof Error ? err.message : 'Erreur Firestore : authentification Super-Admin requise.'
      );
    }
  };

  const handleConnectGoogleAdmin = async () => {
    setIsConnectingGoogle(true);
    try {
      const fbUser = await signInAdminWithGoogle();
      if (fbUser.email) {
        await dafFirebaseService
          .bootstrapCurrentAuthAsSuperAdmin(fbUser.displayName || 'Super Admin', fbUser.email)
          .catch(() => null);
      }
      showTempNotice(`Connecté en tant que ${fbUser.email || 'Administrateur Google'}.`);
    } catch (err) {
      showTempNotice(
        err instanceof Error ? err.message : 'Connexion Google annulée ou bloquée par le navigateur.'
      );
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const navTabs: { id: AdminTabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Vue générale', icon: Activity },
    { id: 'apps', label: `Applications (${apps.length || DIGISOLIA_CATALOG_APPS.length})`, icon: AppWindow },
    { id: 'users', label: `Utilisateurs (${directoryUsers.length})`, icon: Users },
    { id: 'feedback', label: `Avis & Réclamations (${allFeedback.length})`, icon: MessageSquare },
    { id: 'support', label: `Assistance (${allSupport.length})`, icon: Headphones },
    { id: 'analytics', label: 'Satisfaction', icon: BarChart3 },
    { id: 'admins', label: 'Admins & Rôles', icon: UserCog },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'logs', label: 'Journal d’audit', icon: ClipboardList },
  ];

  const displayApps = apps.length > 0 ? apps : (DIGISOLIA_CATALOG_APPS as DigiSoliaRegisteredApp[]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in">
      {/* Header Banner */}
      <header
        className="rounded-3xl p-6 sm:p-7 text-white shadow-md border border-[#1E4C80]"
        style={{ background: 'linear-gradient(135deg, #163B65 0%, #2783C7 100%)' }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-sky-200">
                Panneau centralisé multi-produits
              </p>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                DIGISOLIA ADMIN
              </h1>
              <p className="text-xs text-slate-100/90 mt-0.5">
                Supervision de DigiSolia POS, PROF PLANNING, DigiSolia Hôtel et des futures applications.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="text-xs bg-slate-950/30 border border-white/15 rounded-xl px-3 py-2">
              <span className="text-sky-200 block text-[10px] uppercase font-bold">
                Rôle d’aperçu RBAC
              </span>
              <select
                value={activeAdminRole}
                onChange={(e) => setActiveAdminRole(e.target.value as DigiSoliaAdminRole)}
                className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
              >
                {Object.entries(ADMIN_ROLE_LABELS).map(([roleKey, roleLabel]) => (
                  <option key={roleKey} value={roleKey} className="text-slate-900">
                    {roleLabel}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={selectedAppFilter}
              onChange={(e) => setSelectedAppFilter(e.target.value)}
              className="bg-white text-[#163B65] font-bold text-xs px-3 py-2.5 rounded-xl cursor-pointer"
              aria-label="Filtrer par application"
            >
              <option value="all">Toutes les applications</option>
              {displayApps.map((app) => (
                <option key={app.appId} value={app.appId}>
                  {app.name}
                </option>
              ))}
            </select>

            {isFirebaseAnonymous ? (
              <button
                type="button"
                disabled={isConnectingGoogle}
                onClick={handleConnectGoogleAdmin}
                className="inline-flex items-center gap-2 bg-white text-[#163B65] hover:bg-sky-50 font-bold text-xs px-3.5 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>{isConnectingGoogle ? 'Connexion...' : 'Connexion Google Admin'}</span>
              </button>
            ) : (
              <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-100 border border-emerald-400/30 px-3 py-2 rounded-xl">
                Auth : {firebaseAuthEmail}
              </span>
            )}
          </div>
        </div>

        {adminNotice && (
          <div className="mt-4 p-3 rounded-xl bg-slate-950/40 border border-white/20 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-sky-300 shrink-0" />
            <span>{adminNotice}</span>
          </div>
        )}
      </header>

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-[#163B65] text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#F4F7FB] dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
              <p className="text-xs font-bold uppercase text-slate-400">Applications</p>
              <p className="text-2xl font-black text-[#163B65] dark:text-white mt-1 daf-tabular">
                {displayApps.length}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Produits enregistrés dans l’écosystème
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
              <p className="text-xs font-bold uppercase text-slate-400">Utilisateurs</p>
              <p className="text-2xl font-black text-[#2783C7] dark:text-sky-400 mt-1 daf-tabular">
                {directoryUsers.length}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Comptes synchronisés tous produits confondus
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
              <p className="text-xs font-bold uppercase text-slate-400">Satisfaction moyenne</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 daf-tabular">
                {satisfactionStats.avg > 0 ? `${satisfactionStats.avg.toFixed(1)}/5` : '—'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Sur {satisfactionStats.ratedCount} évaluation(s)
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
              <p className="text-xs font-bold uppercase text-slate-400">Demandes en attente</p>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 daf-tabular">
                {allFeedback.filter((f) => f.status === 'en_attente').length +
                  allSupport.filter((s) => s.status === 'en_attente').length}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Taux de résolution : {satisfactionStats.resolutionRate}%
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Répartition des utilisateurs par application
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {displayApps.map((app) => {
                const count = usersCountByApp[app.appId] ?? app.usersCount ?? 0;
                const fbCount = (feedbackByApp[app.appId] || []).length;
                const supCount = (supportByApp[app.appId] || []).length;
                return (
                  <div
                    key={app.appId}
                    className="p-4 rounded-xl bg-[#F4F7FB] dark:bg-slate-800/60 border border-[#E1E7EF] dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {app.name}
                      </h3>
                      <span className="font-mono text-[11px] text-[#2783C7] dark:text-sky-400">
                        {app.appId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      <strong className="daf-tabular">{count}</strong> utilisateur(s) ·{' '}
                      <strong className="daf-tabular">{fbCount}</strong> avis ·{' '}
                      <strong className="daf-tabular">{supCount}</strong> ticket(s)
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. APPS REGISTRY */}
      {activeTab === 'apps' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-3">
            {displayApps.map((app) => (
              <div
                key={app.appId}
                className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#2783C7]" />
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {app.name}
                    </h3>
                    <span className="font-mono text-[11px] text-slate-500">v{app.version}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {app.description}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    ID : <span className="font-mono">{app.appId}</span> · Utilisateurs :{' '}
                    <strong className="daf-tabular">{usersCountByApp[app.appId] ?? app.usersCount ?? 0}</strong>
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-lg shrink-0">
                  {app.status === 'active' ? 'Active' : app.status}
                </span>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleCreateApp}
            className="lg:col-span-5 bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4 h-fit"
          >
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Enregistrer une nouvelle application
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Identifiant unique (`appId`)
                </label>
                <input
                  type="text"
                  required
                  value={newAppId}
                  onChange={(e) => setNewAppId(e.target.value)}
                  placeholder="ex: digisolia-pharma"
                  className="w-full px-3 py-2 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nom commercial
                </label>
                <input
                  type="text"
                  required
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  placeholder="ex: DigiSolia Pharmacie"
                  className="w-full px-3 py-2 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Catégorie
                  </label>
                  <input
                    type="text"
                    value={newAppCategory}
                    onChange={(e) => setNewAppCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    value={newAppVersion}
                    onChange={(e) => setNewAppVersion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#163B65] hover:bg-[#102D4F] text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter au catalogue DigiSolia</span>
            </button>
          </form>
        </div>
      )}

      {/* 3. USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs overflow-x-auto">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">
            Utilisateurs par application ({directoryUsers.length})
          </h2>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E1E7EF] dark:border-slate-800 text-slate-500 uppercase">
                <th className="pb-3 pr-4">Nom</th>
                <th className="pb-3 pr-4">Application</th>
                <th className="pb-3 pr-4">Contact</th>
                <th className="pb-3 pr-4">Rôle</th>
                <th className="pb-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {directoryUsers
                .filter(
                  (u) =>
                    selectedAppFilter === 'all' ||
                    (u.appId || 'digisolia-pos') === selectedAppFilter
                )
                .map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 pr-4 font-bold text-slate-900 dark:text-white">
                      {u.name || 'Utilisateur'}
                    </td>
                    <td className="py-3 pr-4 font-mono text-[#2783C7] dark:text-sky-400">
                      {u.appId || 'digisolia-pos'}
                    </td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                      {u.email || u.phone || '—'}
                    </td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{u.role}</td>
                    <td className="py-3">
                      <span
                        className={`font-bold ${
                          u.active !== false
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {u.active !== false ? 'Actif' : 'Suspendu'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. FEEDBACK / SUGGESTIONS / COMPLAINTS */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'Tous les retours' },
              { id: 'avis', label: 'Avis' },
              { id: 'suggestion', label: 'Suggestions' },
              { id: 'bug', label: 'Bugs' },
              { id: 'reclamation', label: 'Réclamations' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFeedbackCategoryFilter(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  feedbackCategoryFilter === cat.id
                    ? 'bg-[#2783C7] text-white'
                    : 'bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {filteredFeedback.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500">
              Aucun avis, suggestion ou réclamation correspondant aux filtres.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFeedback.map((item) => {
                const statusMeta = getTicketStatusMeta(item.status);
                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-[#163B65] dark:text-sky-400">
                          {item.appId} · {item.category.toUpperCase()} · {item.userName}
                          {item.rating ? ` · ${item.rating}/5 ★` : ''}
                        </p>
                        {item.subject && (
                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                            {item.subject}
                          </h3>
                        )}
                        <p className="text-[11px] text-slate-400 daf-tabular">
                          {new Date(item.createdAt).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${statusMeta.toneClass}`}
                      >
                        {statusMeta.label}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      {item.message}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <input
                        type="text"
                        placeholder="Réponse officielle DigiSolia..."
                        value={responseDrafts[item.id] ?? item.adminResponse ?? ''}
                        onChange={(e) =>
                          setResponseDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        className="flex-1 px-3 py-2 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-[#F4F7FB] dark:bg-slate-800 text-xs"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {(['en_cours', 'resolu', 'rejete'] as DigiSoliaTicketStatus[]).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleUpdateFeedback(item, st)}
                            className="px-3 py-2 rounded-xl bg-[#163B65] hover:bg-[#102D4F] text-white text-xs font-bold transition cursor-pointer whitespace-nowrap"
                          >
                            {getTicketStatusMeta(st).label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. SUPPORT TICKETS */}
      {activeTab === 'support' && (
        <div className="space-y-3">
          {filteredSupport.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500">
              Aucune demande d’assistance enregistrée.
            </div>
          ) : (
            filteredSupport.map((ticket) => {
              const statusMeta = getTicketStatusMeta(ticket.status);
              return (
                <div
                  key={ticket.id}
                  className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-[#2783C7] dark:text-sky-400">
                        {ticket.appId} · {ticket.issueType} · Priorité {ticket.priority} · {ticket.userName}
                      </p>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {ticket.subject}
                      </h3>
                      <p className="text-[11px] text-slate-400 daf-tabular">
                        {new Date(ticket.createdAt).toLocaleString('fr-FR')} · {ticket.userPhone || ticket.userEmail || 'Sans contact'}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${statusMeta.toneClass}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {ticket.message}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder="Réponse technique à l’utilisateur..."
                      value={responseDrafts[ticket.id] ?? ticket.adminResponse ?? ''}
                      onChange={(e) =>
                        setResponseDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                      }
                      className="flex-1 px-3 py-2 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-[#F4F7FB] dark:bg-slate-800 text-xs"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {(['en_cours', 'resolu', 'rejete'] as DigiSoliaTicketStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleUpdateSupport(ticket, st)}
                          className="px-3 py-2 rounded-xl bg-[#163B65] hover:bg-[#102D4F] text-white text-xs font-bold transition cursor-pointer whitespace-nowrap"
                        >
                          {getTicketStatusMeta(st).label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 6. SATISFACTION ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-5">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Statistiques de satisfaction utilisateurs
          </h2>
          <div className="space-y-3 max-w-xl">
            {satisfactionStats.dist.map((row) => {
              const pct =
                satisfactionStats.ratedCount > 0
                  ? Math.round((row.count / satisfactionStats.ratedCount) * 100)
                  : 0;
              return (
                <div key={row.star} className="flex items-center gap-3 text-xs">
                  <span className="w-16 font-bold flex items-center gap-1 daf-tabular">
                    {row.star} <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="flex-1 h-2.5 bg-[#F4F7FB] dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2783C7] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-20 text-right font-mono text-slate-500 daf-tabular">
                    {row.count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. ADMINS & RBAC ROLES */}
      {activeTab === 'admins' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-3">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Administrateurs enregistrés ({administrators.length})
              </h2>
              {administrators.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Aucun administrateur secondaire enregistré dans la collection `administrators`.
                </p>
              ) : (
                <div className="space-y-2">
                  {administrators.map((adm) => (
                    <div
                      key={adm.id}
                      className="p-3.5 rounded-xl bg-[#F4F7FB] dark:bg-slate-800/60 border border-[#E1E7EF] dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{adm.name}</p>
                        <p className="text-slate-500">{adm.email}</p>
                      </div>
                      <span className="font-bold text-[#163B65] dark:text-sky-400">
                        {ADMIN_ROLE_LABELS[adm.role]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs overflow-x-auto">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3">
                Matrice des rôles et permissions
              </h3>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E1E7EF] dark:border-slate-800 text-slate-500">
                    <th className="pb-2">Rôle</th>
                    <th className="pb-2">Apps</th>
                    <th className="pb-2">Support / Avis</th>
                    <th className="pb-2">Notifications</th>
                    <th className="pb-2">Admins</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(Object.keys(ADMIN_ROLE_PERMISSIONS) as DigiSoliaAdminRole[]).map((role) => {
                    const perms = ADMIN_ROLE_PERMISSIONS[role];
                    return (
                      <tr key={role}>
                        <td className="py-2 font-bold">{ADMIN_ROLE_LABELS[role]}</td>
                        <td className="py-2">{perms.canManageApps ? 'Oui' : 'Non'}</td>
                        <td className="py-2">
                          {perms.canRespondSupportAndFeedback ? 'Oui' : 'Non'}
                        </td>
                        <td className="py-2">{perms.canBroadcastNotifications ? 'Oui' : 'Non'}</td>
                        <td className="py-2">{perms.canManageAdmins ? 'Oui' : 'Non'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <form
            onSubmit={handleCreateAdmin}
            className="lg:col-span-5 bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4 h-fit"
          >
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Ajouter un administrateur
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Nom complet</label>
                <input
                  type="text"
                  required
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Ex : Aminata Ouédraogo"
                  className="w-full px-3 py-2 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Adresse e-mail</label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="agent@digisolia.bf"
                  className="w-full px-3 py-2 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Rôle attribué</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as DigiSoliaAdminRole)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {Object.entries(ADMIN_ROLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#163B65] hover:bg-[#102D4F] text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Créer l’administrateur</span>
            </button>
          </form>
        </div>
      )}

      {/* 8. NOTIFICATIONS BROADCAST */}
      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handlePublishNotification}
            className="lg:col-span-5 bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4 h-fit"
          >
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Diffuser une notification aux utilisateurs
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Application cible</label>
                <select
                  value={notifAppId}
                  onChange={(e) => setNotifAppId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="all">Toutes les applications DigiSolia</option>
                  {displayApps.map((app) => (
                    <option key={app.appId} value={app.appId}>
                      {app.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Type</label>
                <select
                  value={notifType}
                  onChange={(e) =>
                    setNotifType(e.target.value as DigiSoliaNotification['type'])
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="info">Information</option>
                  <option value="success">Nouveauté / Succès</option>
                  <option value="warning">Maintenance / Attention</option>
                  <option value="urgent">Alerte urgente</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Titre</label>
                <input
                  type="text"
                  required
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="Ex : Mise à jour v2.5 disponible"
                  className="w-full px-3 py-2 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Message</label>
                <textarea
                  rows={3}
                  required
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="Rédigez votre message destiné aux utilisateurs..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#163B65] hover:bg-[#102D4F] text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>Publier la notification</span>
            </button>
          </form>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Historique des notifications publiées ({allNotifications.length})
            </h2>
            {allNotifications.length === 0 ? (
              <p className="text-xs text-slate-500">Aucune notification diffusée.</p>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto">
                {allNotifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3.5 rounded-xl bg-[#F4F7FB] dark:bg-slate-800/60 border border-[#E1E7EF] dark:border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 dark:text-white">{n.title}</strong>
                      <span className="font-mono text-[11px] text-[#2783C7]">{n.appId}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">{n.message}</p>
                    <p className="text-[11px] text-slate-400">
                      Par {n.createdByName} · {new Date(n.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs overflow-x-auto">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">
            Journal des opérations administratives ({adminLogs.length})
          </h2>
          {adminLogs.length === 0 ? (
            <p className="text-xs text-slate-500">Aucune opération journalisée pour le moment.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E1E7EF] dark:border-slate-800 text-slate-500 uppercase">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Opérateur</th>
                  <th className="pb-3 pr-4">Action</th>
                  <th className="pb-3">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {adminLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2.5 pr-4 font-mono text-slate-500 daf-tabular">
                      {new Date(log.createdAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-2.5 pr-4 font-semibold">
                      {log.actorName} ({ADMIN_ROLE_LABELS[log.actorRole]})
                    </td>
                    <td className="py-2.5 pr-4 font-bold text-[#163B65] dark:text-sky-400">
                      {log.action}
                    </td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-300">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
