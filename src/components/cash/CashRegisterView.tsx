import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Vault, 
  PlusCircle, 
  MinusCircle, 
  Lock, 
  Unlock, 
  Printer, 
  Receipt, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  DollarSign, 
  ArrowDownRight, 
  ArrowUpRight, 
  Calendar,
  User,
  Smartphone,
  CreditCard,
  Building2,
  FileText
} from 'lucide-react';
import { CashSession } from '../../types';

export const CashRegisterView: React.FC = () => {
  const { 
    business, 
    currentUser, 
    activeCashSession, 
    cashSessions, 
    openCashSession, 
    closeCashSession, 
    recordCashMovement 
  } = useApp();

  const [initialFloatInput, setInitialFloatInput] = useState<number>(10000);
  const [openingNotes, setOpeningNotes] = useState('');
  const [showOpenModal, setShowOpenModal] = useState(false);

  const [actualCashCounted, setActualCashCounted] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);

  const [movementType, setMovementType] = useState<'cash_in' | 'cash_out'>('cash_in');
  const [movementAmount, setMovementAmount] = useState<number>(5000);
  const [movementReason, setMovementReason] = useState('');
  const [showMovementModal, setShowMovementModal] = useState(false);

  const [selectedSessionForReceipt, setSelectedSessionForReceipt] = useState<CashSession | null>(null);

  const isOwnerOrManager = currentUser.role === 'owner' || currentUser.role === 'manager';

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await openCashSession(initialFloatInput, openingNotes);
      setShowOpenModal(false);
      setOpeningNotes('');
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'ouverture de caisse');
    }
  };

  const handleCloseSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const closed = await closeCashSession(actualCashCounted, closingNotes);
      setShowCloseModal(false);
      setSelectedSessionForReceipt(closed);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la clôture de caisse');
    }
  };

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementReason.trim()) {
      alert('Veuillez préciser le motif de l\'opération');
      return;
    }
    try {
      await recordCashMovement(movementType, movementAmount, movementReason);
      setShowMovementModal(false);
      setMovementReason('');
      setMovementAmount(5000);
    } catch (err: any) {
      alert(err.message || 'Erreur lors du mouvement de caisse');
    }
  };

  const handlePrintSessionZ = (session: CashSession) => {
    setSelectedSessionForReceipt(session);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <Vault className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Gestion de Caisse & Clôture Z</h1>
              <p className="text-sm text-slate-500">
                Suivi billetterie, entrées/sorties d'espèces, écarts et impression du rapport Z
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeCashSession ? (
            <>
              <button
                id="btn-cash-movement"
                onClick={() => setShowMovementModal(true)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 text-slate-600" />
                Entrée / Sortie Espèces
              </button>
              <button
                id="btn-close-cash-session"
                onClick={() => {
                  setActualCashCounted(activeCashSession.expectedCashInDrawer);
                  setShowCloseModal(true);
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl text-sm transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                Clôturer la Caisse (Rapport Z)
              </button>
            </>
          ) : (
            <button
              id="btn-open-cash-session"
              onClick={() => setShowOpenModal(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              Ouvrir la Caisse du Jour
            </button>
          )}
        </div>
      </div>

      {/* Active Session Status Card */}
      {activeCashSession ? (
        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-6 mb-6">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
                    Session En Cours
                  </span>
                  <span className="text-xs text-slate-300">
                    Ouverte à {new Date(activeCashSession.openedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  Caissier(e) : {activeCashSession.userName}
                </h2>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 font-medium">Espèces Théoriques en Tiroir</div>
              <div className="text-3xl font-black text-emerald-400">
                {activeCashSession.expectedCashInDrawer.toLocaleString()} {business.currency}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="text-xs text-slate-300 mb-1 flex items-center gap-1.5">
                <Vault className="w-3.5 h-3.5 text-slate-400" /> Fond Initial
              </div>
              <div className="text-lg font-bold text-white">
                {activeCashSession.initialFloat.toLocaleString()} <span className="text-xs font-normal text-slate-400">{business.currency}</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="text-xs text-emerald-300 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Ventes Espèces
              </div>
              <div className="text-lg font-bold text-emerald-400">
                +{activeCashSession.totalCashSales.toLocaleString()} <span className="text-xs font-normal text-slate-400">{business.currency}</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="text-xs text-amber-300 mb-1 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" /> Orange Money
              </div>
              <div className="text-lg font-bold text-amber-400">
                {activeCashSession.totalOrangeMoneySales.toLocaleString()} <span className="text-xs font-normal text-slate-400">{business.currency}</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="text-xs text-blue-300 mb-1 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" /> Moov Money
              </div>
              <div className="text-lg font-bold text-blue-400">
                {activeCashSession.totalMoovMoneySales.toLocaleString()} <span className="text-xs font-normal text-slate-400">{business.currency}</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="text-xs text-teal-300 mb-1 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> Wave / Coris
              </div>
              <div className="text-lg font-bold text-teal-400">
                {activeCashSession.totalWaveSales.toLocaleString()} <span className="text-xs font-normal text-slate-400">{business.currency}</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="text-xs text-rose-300 mb-1 flex items-center gap-1.5">
                <ArrowDownRight className="w-3.5 h-3.5" /> Sorties Caisse
              </div>
              <div className="text-lg font-bold text-rose-400">
                -{activeCashSession.totalCashOut.toLocaleString()} <span className="text-xs font-normal text-slate-400">{business.currency}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">Aucune Caisse Active Actuellement</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto mt-1 mb-4">
            Pour sécuriser les encaissements, suivre la billetterie et obtenir un rapport Z certifié en fin de journée, ouvrez la session de caisse.
          </p>
          <button
            onClick={() => setShowOpenModal(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <Unlock className="w-4 h-4" />
            Ouvrir la Caisse Maintenant
          </button>
        </div>
      )}

      {/* Historical Sessions & Z-Reports */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-slate-700" />
            <h3 className="text-lg font-bold text-slate-900">Historique des Sessions & Rapports Z</h3>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {cashSessions.length} session(s)
          </span>
        </div>

        {cashSessions.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">
            Aucun historique de clôture de caisse pour le moment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date & Heures</th>
                  <th className="py-3 px-4">Caissier</th>
                  <th className="py-3 px-4 text-right">Fond Initial</th>
                  <th className="py-3 px-4 text-right">Ventes Espèces</th>
                  <th className="py-3 px-4 text-right">Total Mobile Money</th>
                  <th className="py-3 px-4 text-right">Compté / Théorique</th>
                  <th className="py-3 px-4 text-center">Écart (Discrepancy)</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cashSessions.map((session) => {
                  const mobileTotal = session.totalOrangeMoneySales + session.totalMoovMoneySales + session.totalWaveSales;
                  const discrepancy = session.discrepancy || 0;
                  return (
                    <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">
                          {new Date(session.openedAt).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(session.openedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          {session.closedAt && ` - ${new Date(session.closedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {session.userName}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium">
                        {session.initialFloat.toLocaleString()} {business.currency}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-emerald-600">
                        {session.totalCashSales.toLocaleString()} {business.currency}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-blue-600">
                        {mobileTotal.toLocaleString()} {business.currency}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {session.status === 'closed' ? (
                          <div>
                            <span className="font-bold text-slate-900">{session.actualCashCounted?.toLocaleString()}</span>
                            <span className="text-xs text-slate-400 block">/ {session.expectedCashInDrawer.toLocaleString()} {business.currency}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-medium">{session.expectedCashInDrawer.toLocaleString()} {business.currency}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {session.status === 'closed' ? (
                          discrepancy === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Parfait (0)
                            </span>
                          ) : discrepancy > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              +{discrepancy.toLocaleString()} (Excédent)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                              {discrepancy.toLocaleString()} (Manquant)
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {session.status === 'open' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            En cours
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            Clôturée
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handlePrintSessionZ(session)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Imprimer le Ticket Z"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Ouvrir Caisse */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
                <Vault className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Ouverture de Session Caisse</h3>
                <p className="text-xs text-slate-500">Comptabilisez le fond de caisse initial</p>
              </div>
            </div>

            <form onSubmit={handleOpenSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fond de Caisse Initial ({business.currency}) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={initialFloatInput}
                  onChange={(e) => setInitialFloatInput(Number(e.target.value))}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold text-lg text-slate-900"
                />
                <p className="text-xs text-slate-400 mt-1">Montant physique en pièces et billets au démarrage.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes / Observations (optionnel)
                </label>
                <textarea
                  rows={2}
                  value={openingNotes}
                  onChange={(e) => setOpeningNotes(e.target.value)}
                  placeholder="Ex: Fond remis par le gérant..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-xs cursor-pointer"
                >
                  Valider l'Ouverture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Clôture Caisse (Rapport Z) */}
      {showCloseModal && activeCashSession && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-50 text-rose-700 rounded-2xl">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Clôture de Caisse & Rapport Z</h3>
                <p className="text-xs text-slate-500">Comptez les espèces réelles dans le tiroir-caisse</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl space-y-2 mb-4 text-xs text-slate-700 border border-slate-200">
              <div className="flex justify-between">
                <span>Fond Initial :</span>
                <span className="font-semibold">{activeCashSession.initialFloat.toLocaleString()} {business.currency}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>+ Total Ventes Espèces :</span>
                <span>+{activeCashSession.totalCashSales.toLocaleString()} {business.currency}</span>
              </div>
              <div className="flex justify-between text-blue-700">
                <span>+ Entrées manuelles :</span>
                <span>+{activeCashSession.totalCashIn.toLocaleString()} {business.currency}</span>
              </div>
              <div className="flex justify-between text-rose-700">
                <span>- Sorties manuelles / Dépenses :</span>
                <span>-{activeCashSession.totalCashOut.toLocaleString()} {business.currency}</span>
              </div>
              <div className="border-t border-slate-300 pt-2 flex justify-between text-sm font-bold text-slate-900">
                <span>Espèces Théoriques Attendues :</span>
                <span>{activeCashSession.expectedCashInDrawer.toLocaleString()} {business.currency}</span>
              </div>
            </div>

            <form onSubmit={handleCloseSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Espèces Réelles Comptées (Billet + Pièces) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={actualCashCounted}
                  onChange={(e) => setActualCashCounted(Number(e.target.value))}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 font-bold text-xl text-slate-900"
                />
                <div className="mt-2 text-xs">
                  {actualCashCounted - activeCashSession.expectedCashInDrawer === 0 ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Aucun écart. Caisse parfaitement équilibrée.
                    </span>
                  ) : actualCashCounted - activeCashSession.expectedCashInDrawer > 0 ? (
                    <span className="text-blue-600 font-bold">
                      Excédent de +{(actualCashCounted - activeCashSession.expectedCashInDrawer).toLocaleString()} {business.currency}
                    </span>
                  ) : (
                    <span className="text-rose-600 font-bold">
                      Manquant de {(actualCashCounted - activeCashSession.expectedCashInDrawer).toLocaleString()} {business.currency}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Justification / Notes de Clôture
                </label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Ex: Écart de 100 F dû à rendu de monnaie..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-xs cursor-pointer"
                >
                  Confirmer la Clôture & Générer Ticket Z
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Mouvement Espèces (Entrée / Sortie) */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-2xl ${movementType === 'cash_in' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {movementType === 'cash_in' ? <PlusCircle className="w-6 h-6" /> : <MinusCircle className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Mouvement Exceptionnel de Caisse</h3>
                <p className="text-xs text-slate-500">Enregistrez un apport ou un retrait d'espèces</p>
              </div>
            </div>

            <form onSubmit={handleMovement} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMovementType('cash_in')}
                  className={`py-2.5 px-3 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    movementType === 'cash_in' 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" /> Entrée d'Espèces
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType('cash_out')}
                  className={`py-2.5 px-3 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    movementType === 'cash_out' 
                      ? 'bg-rose-600 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" /> Sortie d'Espèces
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Montant ({business.currency}) *
                </label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(Number(e.target.value))}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motif / Justification *
                </label>
                <input
                  type="text"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder="Ex: Achat fournitures bureau, monnaie appoint..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-xs cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Impression Ticket Z (Visible lors de la sélection & Impression) */}
      {selectedSessionForReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:p-0 print:static print:bg-white">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 print:border-none print:shadow-none print:w-full">
            {/* Header Ticket */}
            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <h2 className="font-black text-lg text-slate-900 uppercase tracking-wide">{business.name}</h2>
              <p className="text-xs text-slate-500">{business.address || 'Ouagadougou, Burkina Faso'}</p>
              <p className="text-xs text-slate-500">Tél: {business.phone}</p>
              <div className="mt-2 inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded-md">
                RAPPORT Z - CLÔTURE DE CAISSE
              </div>
            </div>

            {/* Corps Ticket */}
            <div className="py-4 space-y-2 text-xs text-slate-700 border-b border-dashed border-slate-300 font-mono">
              <div className="flex justify-between">
                <span>Caissier(e) :</span>
                <span className="font-semibold">{selectedSessionForReceipt.userName}</span>
              </div>
              <div className="flex justify-between">
                <span>Ouvert le :</span>
                <span>{new Date(selectedSessionForReceipt.openedAt).toLocaleDateString('fr-FR')} {new Date(selectedSessionForReceipt.openedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {selectedSessionForReceipt.closedAt && (
                <div className="flex justify-between">
                  <span>Clôturé le :</span>
                  <span>{new Date(selectedSessionForReceipt.closedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}

              <div className="border-t border-slate-200 my-2 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Fond Initial :</span>
                  <span>{selectedSessionForReceipt.initialFloat.toLocaleString()} {business.currency}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Ventes Espèces :</span>
                  <span>+{selectedSessionForReceipt.totalCashSales.toLocaleString()} {business.currency}</span>
                </div>
                <div className="flex justify-between text-amber-700">
                  <span>Orange Money :</span>
                  <span>{selectedSessionForReceipt.totalOrangeMoneySales.toLocaleString()} {business.currency}</span>
                </div>
                <div className="flex justify-between text-blue-700">
                  <span>Moov Money :</span>
                  <span>{selectedSessionForReceipt.totalMoovMoneySales.toLocaleString()} {business.currency}</span>
                </div>
                <div className="flex justify-between text-teal-700">
                  <span>Wave / Coris :</span>
                  <span>{selectedSessionForReceipt.totalWaveSales.toLocaleString()} {business.currency}</span>
                </div>
                <div className="flex justify-between text-purple-700">
                  <span>Crédits accordés :</span>
                  <span>{selectedSessionForReceipt.totalCreditSales.toLocaleString()} {business.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Entrées Caisse :</span>
                  <span>+{selectedSessionForReceipt.totalCashIn.toLocaleString()} {business.currency}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Sorties Caisse :</span>
                  <span>-{selectedSessionForReceipt.totalCashOut.toLocaleString()} {business.currency}</span>
                </div>
              </div>

              <div className="border-t-2 border-slate-900 pt-2 space-y-1 text-sm font-bold">
                <div className="flex justify-between">
                  <span>Espèces Théoriques :</span>
                  <span>{selectedSessionForReceipt.expectedCashInDrawer.toLocaleString()} {business.currency}</span>
                </div>
                {selectedSessionForReceipt.actualCashCounted !== undefined && (
                  <>
                    <div className="flex justify-between text-slate-900">
                      <span>Espèces Comptées :</span>
                      <span>{selectedSessionForReceipt.actualCashCounted.toLocaleString()} {business.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Écart de Caisse :</span>
                      <span className={(selectedSessionForReceipt.discrepancy || 0) < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                        {(selectedSessionForReceipt.discrepancy || 0).toLocaleString()} {business.currency}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {selectedSessionForReceipt.closingNotes && (
              <p className="text-[11px] text-slate-500 py-2 italic">
                Notes : {selectedSessionForReceipt.closingNotes}
              </p>
            )}

            <div className="text-center pt-4 print:hidden flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedSessionForReceipt(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Fermer
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Imprimer Ticket Z
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
