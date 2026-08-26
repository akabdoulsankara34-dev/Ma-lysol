import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppUser, UserRole, UserPermissions } from '../../types';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Key, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  Edit3, 
  Trash2, 
  Share2, 
  AlertTriangle,
  UserX,
  UserCheck,
  Smartphone,
  Eye,
  EyeOff,
  Copy,
  MessageSquare
} from 'lucide-react';

export const TeamAccessManager: React.FC = () => {
  const { 
    business, 
    currentUser, 
    allUsers, 
    addUser, 
    updateUser, 
    updateUserPin, 
    toggleUserStatus, 
    deleteUser 
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState<AppUser | null>(null);
  const [showShareModal, setShowShareModal] = useState<AppUser | null>(null);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // New User Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+226 ');
  const [role, setRole] = useState<UserRole>('cashier');
  const [pin, setPin] = useState('0000');
  const [permissions, setPermissions] = useState<UserPermissions>({
    canAccessPos: true,
    canAccessStock: false,
    canAccessCustomers: true,
    canAccessExpenses: false,
    canAccessReports: false,
    canGiveDiscount: false,
    canManageUsers: false,
  });

  // Change PIN State
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showPinsVisible, setShowPinsVisible] = useState(false);

  const isOwner = currentUser.role === 'owner' || currentUser.role === 'admin';

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'manager') {
      setPermissions({
        canAccessPos: true,
        canAccessStock: true,
        canAccessCustomers: true,
        canAccessExpenses: true,
        canAccessReports: true,
        canGiveDiscount: true,
        canManageUsers: false,
      });
    } else if (newRole === 'cashier') {
      setPermissions({
        canAccessPos: true,
        canAccessStock: false,
        canAccessCustomers: true,
        canAccessExpenses: false,
        canAccessReports: false,
        canGiveDiscount: false,
        canManageUsers: false,
      });
    } else if (newRole === 'stock_manager') {
      setPermissions({
        canAccessPos: false,
        canAccessStock: true,
        canAccessCustomers: false,
        canAccessExpenses: false,
        canAccessReports: false,
        canGiveDiscount: false,
        canManageUsers: false,
      });
    } else if (newRole === 'owner') {
      setPermissions({
        canAccessPos: true,
        canAccessStock: true,
        canAccessCustomers: true,
        canAccessExpenses: true,
        canAccessReports: true,
        canGiveDiscount: true,
        canManageUsers: true,
      });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    await addUser({
      name: name.trim(),
      phone: phone.trim(),
      role,
      pin: pin.trim() || '0000',
      permissions,
    });

    setShowAddModal(false);
    setName('');
    setPhone('+226 ');
    setRole('cashier');
    setPin('0000');
    showSuccessNotification(`Compte créé avec succès pour ${name}`);
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPinModal) return;
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinError('Le code PIN doit comporter exactement 4 chiffres.');
      return;
    }

    await updateUserPin(showPinModal.id, newPin);
    showSuccessNotification(`Code PIN de ${showPinModal.name} mis à jour (${newPin})`);
    setShowPinModal(null);
    setNewPin('');
    setPinError(null);
  };

  const handleToggleStatus = async (user: AppUser) => {
    if (user.id === currentUser.id) {
      alert('Vous ne pouvez pas suspendre votre propre session.');
      return;
    }
    await toggleUserStatus(user.id);
    showSuccessNotification(
      user.active 
        ? `Accès de ${user.name} suspendu.` 
        : `Accès de ${user.name} réactivé !`
    );
  };

  const handleDelete = async (user: AppUser) => {
    if (user.id === currentUser.id) {
      alert('Vous ne pouvez pas supprimer votre propre compte.');
      return;
    }
    if (window.confirm(`Supprimer définitivement l'accès de ${user.name} ?`)) {
      await deleteUser(user.id);
      showSuccessNotification(`Compte de ${user.name} supprimé.`);
    }
  };

  const showSuccessNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case 'owner': return 'Propriétaire';
      case 'manager': return 'Gérant / Manager';
      case 'cashier': return 'Caissier / Vendeur';
      case 'stock_manager': return 'Gestionnaire Stock';
      case 'admin': return 'Administrateur';
      default: return r;
    }
  };

  const getRoleBadgeColor = (r: UserRole) => {
    switch (r) {
      case 'owner': return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'manager': return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'cashier': return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'stock_manager': return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-black text-slate-900">
              Gestion des Accès & Équipe
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            En tant que Propriétaire, gérez vos Caissiers et Gérants, modifiez leurs codes PIN et révoquez leurs accès.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPinsVisible(!showPinsVisible)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            {showPinsVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{showPinsVisible ? 'Masquer PINs' : 'Afficher PINs'}</span>
          </button>

          {isOwner && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition"
            >
              <UserPlus className="h-4 w-4" />
              <span>Nouveau Collaborateur</span>
            </button>
          )}
        </div>
      </div>

      {/* Success alert banner */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Team Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allUsers.map((user) => (
          <div 
            key={user.id}
            className={`bg-white rounded-2xl border p-5 shadow-2xs transition flex flex-col justify-between ${
              !user.active 
                ? 'border-red-200 bg-red-50/30 opacity-75' 
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {/* Top row */}
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`h-11 w-11 rounded-2xl flex items-center justify-center text-sm font-black text-white shadow-xs ${
                    user.role === 'owner' ? 'bg-amber-600' : user.role === 'manager' ? 'bg-purple-600' : user.role === 'cashier' ? 'bg-blue-600' : 'bg-indigo-600'
                  }`}>
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{user.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span>{user.phone}</span>
                    </p>
                  </div>
                </div>

                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getRoleBadgeColor(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>

              {/* Security & PIN info */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 text-slate-600">
                  <Key className="h-3.5 w-3.5 text-blue-600" />
                  <span className="font-medium">Code PIN Caisse :</span>
                  <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-900">
                    {showPinsVisible ? (user.pin || '0000') : '••••'}
                  </span>
                </div>

                <div>
                  {user.active ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Suspendu
                    </span>
                  )}
                </div>
              </div>

              {/* Permissions summary */}
              <div className="mt-3 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span>Accès Caisse POS :</span>
                  <span className={user.permissions?.canAccessPos !== false ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                    {user.permissions?.canAccessPos !== false ? 'Autorisé' : 'Non'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Bénéfices & Rapports :</span>
                  <span className={user.role === 'owner' || user.role === 'manager' ? 'text-purple-700 font-bold' : 'text-slate-400'}>
                    {user.role === 'owner' || user.role === 'manager' ? 'Visible' : 'Masqué (Sécurisé)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions for Owner */}
            {isOwner && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setShowPinModal(user);
                      setNewPin(user.pin || '');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition flex items-center gap-1 text-[11px]"
                    title="Changer le code PIN"
                  >
                    <Key className="h-3 w-3" />
                    <span>Modifier PIN</span>
                  </button>

                  <button
                    onClick={() => setShowShareModal(user)}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                    title="Partager les identifiants d'accès"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleStatus(user)}
                    className={`p-1.5 rounded-lg transition ${
                      user.active 
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' 
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                    title={user.active ? "Suspendre l'accès" : "Réactiver l'accès"}
                  >
                    {user.active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                  </button>

                  {user.id !== currentUser.id && (
                    <button
                      onClick={() => handleDelete(user)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal: Ajouter un Collaborateur */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center space-x-2">
                <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <UserPlus className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Nouveau Collaborateur
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nom Complet du Collaborateur *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aminata Kaboré"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Numéro de Téléphone (WhatsApp) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+226 70 00 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Rôle & Niveau d'Accès *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('cashier')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      role === 'cashier' 
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs' 
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Caissier / Vendeur
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('manager')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      role === 'manager' 
                        ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-xs' 
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Gérant / Manager
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('stock_manager')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      role === 'stock_manager' 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs' 
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Stock
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Code PIN de Caisse (4 chiffres) *
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="Ex: 1234"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-mono text-center text-lg tracking-widest focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Ce code à 4 chiffres permettra au collaborateur d'ouvrir sa caisse.
                </p>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-xs"
                >
                  Créer le Compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Modifier Code PIN */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Key className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Modifier le Code PIN
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Nouveau code PIN à 4 chiffres pour <span className="font-bold text-slate-800">{showPinModal.name}</span>
            </p>

            <form onSubmit={handleSavePin} className="mt-4 space-y-4">
              <input
                type="text"
                maxLength={4}
                autoFocus
                placeholder="4 chiffres (ex: 2026)"
                value={newPin}
                onChange={(e) => {
                  setNewPin(e.target.value.replace(/\D/g, ''));
                  setPinError(null);
                }}
                className="w-40 mx-auto text-center text-2xl font-mono font-bold tracking-widest px-3 py-2 border-2 border-blue-600 rounded-xl focus:outline-none"
              />

              {pinError && (
                <p className="text-xs text-red-600 font-medium">{pinError}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(null)}
                  className="flex-1 py-2 text-xs bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={newPin.length !== 4}
                  className="flex-1 py-2 text-xs bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Partager Identifiants */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Share2 className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Fiche d'Accès Collaborateur
                </h3>
              </div>
              <button
                onClick={() => setShowShareModal(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono text-slate-800 select-all">
              <p className="font-bold text-slate-900">🏪 BIZPILOT BURKINA - ACCÈS CAISSE</p>
              <p>---------------------------------</p>
              <p>Boutique : <span className="font-bold">{business.name}</span></p>
              <p>Code Entreprise : <span className="font-bold text-blue-600">{business.accessCode}</span></p>
              <p>Collaborateur : <span className="font-bold">{showShareModal.name}</span></p>
              <p>Rôle : <span className="font-bold">{getRoleLabel(showShareModal.role)}</span></p>
              <p>Code PIN Personnel : <span className="font-bold text-emerald-600">{showShareModal.pin || '0000'}</span></p>
              <p>---------------------------------</p>
              <p className="text-[11px] text-slate-500 font-sans">
                Conservez ce code confidentiel pour vous connecter à la caisse du magasin.
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  const text = `🏪 BIZPILOT BF - ACCÈS CAISSE\nBoutique : ${business.name}\nCode Entreprise : ${business.accessCode}\nCollaborateur : ${showShareModal.name}\nVotre Code PIN : ${showShareModal.pin || '0000'}\nLien : https://ai.studio/build`;
                  navigator.clipboard.writeText(text);
                  showSuccessNotification('Identifiants copiés dans le presse-papier !');
                  setShowShareModal(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Copy className="h-4 w-4" />
                <span>Copier</span>
              </button>

              <button
                onClick={() => {
                  const text = encodeURIComponent(`🏪 *BIZPILOT BF - VOS ACCÈS CAISSE*\n\nBoutique : *${business.name}*\nCode Entreprise : *${business.accessCode}*\nCollaborateur : *${showShareModal.name}*\nRôle : ${getRoleLabel(showShareModal.role)}\nCode PIN : *${showShareModal.pin || '0000'}*\n\nConnectez-vous sur votre terminal pour démarrer la caisse.`);
                  const phoneClean = showShareModal.phone.replace(/[^0-9]/g, '');
                  window.open(`https://wa.me/${phoneClean}?text=${text}`, '_blank');
                  setShowShareModal(null);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Envoyer WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
