import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Avoir, AvoirStatus } from '../../types';
import { 
  Ticket, 
  Search, 
  Plus, 
  Printer, 
  Copy, 
  Check, 
  CheckCircle2, 
  Clock, 
  Banknote, 
  AlertCircle, 
  User, 
  Phone, 
  FileText,
  X,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  Bluetooth,
  Download,
  ExternalLink
} from 'lucide-react';
import { printAvoirEscPos } from '../../lib/blePrinter';
import { printAvoir, downloadAvoir, openAvoirInNewTab } from '../../lib/receiptPrinter';

export const AvoirsView: React.FC = () => {
  const { 
    avoirs, 
    business, 
    currentUser, 
    activeCashSession, 
    createAvoir, 
    refundAvoirInCash,
    customers 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<AvoirStatus | 'all'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState<Avoir | null>(null);
  const [showRefundModal, setShowRefundModal] = useState<Avoir | null>(null);
  const [refundNotes, setRefundNotes] = useState('');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  // Print execution state
  const [isPrintingEscPos, setIsPrintingEscPos] = useState(false);
  const [printFeedback, setPrintFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Avoir form
  const [newMontant, setNewMontant] = useState<string>('');
  const [newClientNom, setNewClientNom] = useState('');
  const [newClientTel, setNewClientTel] = useState('');
  const [newVenteRef, setNewVenteRef] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Filtered avoirs
  const filteredAvoirs = useMemo(() => {
    return avoirs.filter(a => {
      const matchesStatus = selectedStatus === 'all' || a.statut === selectedStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = 
        !q ||
        a.numero.toLowerCase().includes(q) ||
        (a.clientNom && a.clientNom.toLowerCase().includes(q)) ||
        (a.clientTel && a.clientTel.includes(q)) ||
        (a.venteReceiptNumber && a.venteReceiptNumber.toLowerCase().includes(q)) ||
        (a.venteUtilisationReceiptNumber && a.venteUtilisationReceiptNumber.toLowerCase().includes(q)) ||
        (a.notes && a.notes.toLowerCase().includes(q));

      return matchesStatus && matchesQuery;
    });
  }, [avoirs, selectedStatus, searchQuery]);

  // Key metrics
  const totalActifs = useMemo(() => {
    return avoirs.filter(a => a.statut === 'actif').reduce((sum, a) => sum + a.montant, 0);
  }, [avoirs]);

  const countActifs = useMemo(() => {
    return avoirs.filter(a => a.statut === 'actif').length;
  }, [avoirs]);

  const totalUtilises = useMemo(() => {
    return avoirs.filter(a => a.statut === 'utilise').reduce((sum, a) => sum + a.montant, 0);
  }, [avoirs]);

  const countUtilises = useMemo(() => {
    return avoirs.filter(a => a.statut === 'utilise').length;
  }, [avoirs]);

  const totalRembourses = useMemo(() => {
    return avoirs.filter(a => a.statut === 'rembourse').reduce((sum, a) => sum + a.montant, 0);
  }, [avoirs]);

  const countRembourses = useMemo(() => {
    return avoirs.filter(a => a.statut === 'rembourse').length;
  }, [avoirs]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateAvoir = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const amountNum = parseFloat(newMontant);
    if (isNaN(amountNum) || amountNum <= 0) {
      setCreateError('Veuillez saisir un montant valide supérieur à 0.');
      return;
    }

    setIsSubmittingNew(true);
    try {
      const created = await createAvoir({
        venteId: newVenteRef.trim() || `manual_${Date.now()}`,
        venteReceiptNumber: newVenteRef.trim() || undefined,
        montant: amountNum,
        clientNom: newClientNom.trim() || undefined,
        clientTel: newClientTel.trim() || undefined,
        notes: newNotes.trim() || 'Avoir émis manuellement',
      });

      setShowCreateModal(false);
      setNewMontant('');
      setNewClientNom('');
      setNewClientTel('');
      setNewVenteRef('');
      setNewNotes('');
      // Offer immediate print ticket
      setShowPrintModal(created);
    } catch (err: any) {
      setCreateError(err.message || 'Erreur lors de la création de l\'avoir.');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleConfirmRefund = async () => {
    if (!showRefundModal) return;
    setIsProcessingRefund(true);
    try {
      await refundAvoirInCash(showRefundModal.id, refundNotes.trim() || undefined);
      setShowRefundModal(null);
      setRefundNotes('');
    } catch (err: any) {
      alert(err.message || 'Erreur lors du remboursement.');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const handlePrintEscPos = async (avoirToPrint: Avoir) => {
    setIsPrintingEscPos(true);
    setPrintFeedback(null);
    try {
      const res = await printAvoirEscPos(avoirToPrint, business);
      if (res.success) {
        setPrintFeedback({
          type: 'success',
          message: `Ticket N° ${avoirToPrint.numero} imprimé avec succès sur ${res.deviceName || 'l\'imprimante POS-80'} !`,
        });
      } else {
        setPrintFeedback({
          type: 'error',
          message: res.error || 'Erreur lors de l\'impression ESC/POS.',
        });
      }
    } catch (err: any) {
      setPrintFeedback({
        type: 'error',
        message: err.message || 'Impossible de communiquer avec l\'imprimante Bluetooth.',
      });
    } finally {
      setIsPrintingEscPos(false);
    }
  };

  const handlePrintSystem = async (avoirToPrint: Avoir) => {
    try {
      await printAvoir(avoirToPrint, business);
    } catch {
      window.print();
    }
  };

  const handleDownload = (avoirToPrint: Avoir) => {
    downloadAvoir(avoirToPrint, business);
  };

  const handleOpenTab = (avoirToPrint: Avoir) => {
    openAvoirInNewTab(avoirToPrint, business);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header with Title and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <Ticket className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Avoirs & Bons d'Achat
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Gestion des avoirs clients (monnaie manquante, retours, remboursements en espèces)
              </p>
            </div>
          </div>
        </div>

        <button
          id="btn-new-avoir"
          onClick={() => {
            setCreateError(null);
            setShowCreateModal(true);
          }}
          className="inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-xs transition"
        >
          <Plus className="h-4 w-4" />
          <span>Émettre un Avoir</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Actifs */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Avoirs Actifs (À valoir)
            </span>
            <div className="mt-1 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-slate-900">
                {totalActifs.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-500">{business.currency}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {countActifs} bon{countActifs > 1 ? 's' : ''} en circulation
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Utilisés */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Avoirs Utilisés
            </span>
            <div className="mt-1 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-slate-900">
                {totalUtilises.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-500">{business.currency}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {countUtilises} bon{countUtilises > 1 ? 's' : ''} déduit{countUtilises > 1 ? 's' : ''} sur vente
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        {/* Remboursés en Espèces */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Remboursés en Espèces
            </span>
            <div className="mt-1 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-slate-900">
                {totalRembourses.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-500">{business.currency}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {countRembourses} avoir{countRembourses > 1 ? 's' : ''} décaissé{countRembourses > 1 ? 's' : ''}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Banknote className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-search-avoir"
            type="text"
            placeholder="Rechercher (ex: AV-0001, Nom client, Tél...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedStatus === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tous ({avoirs.length})
          </button>
          <button
            onClick={() => setSelectedStatus('actif')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedStatus === 'actif'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Actifs ({countActifs})
          </button>
          <button
            onClick={() => setSelectedStatus('utilise')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedStatus === 'utilise'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Utilisés ({countUtilises})
          </button>
          <button
            onClick={() => setSelectedStatus('rembourse')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedStatus === 'rembourse'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Remboursés ({countRembourses})
          </button>
        </div>
      </div>

      {/* Avoirs List Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredAvoirs.length === 0 ? (
          <div className="p-12 text-center">
            <Ticket className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <h3 className="font-bold text-slate-800 text-sm">Aucun avoir trouvé</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedStatus !== 'all'
                ? 'Aucun résultat ne correspond à vos critères de recherche.'
                : 'Aucun avoir n\'a encore été créé. Vous pouvez en émettre un manuellement ou directement depuis la caisse.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAvoirs.map((avoir) => {
              const isActif = avoir.statut === 'actif';
              const isUtilise = avoir.statut === 'utilise';
              const isRembourse = avoir.statut === 'rembourse';

              return (
                <div 
                  key={avoir.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Code, Client, and Meta */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-black font-mono text-sm sm:text-base text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                        {avoir.numero}
                      </span>

                      {/* Status badge */}
                      {isActif && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                          Actif (Valide)
                        </span>
                      )}
                      {isUtilise && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                          Utilisé
                        </span>
                      )}
                      {isRembourse && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          Remboursé en espèces
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => copyToClipboard(avoir.numero, avoir.id)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                        title="Copier le code pour l'encaissement"
                      >
                        {copiedId === avoir.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      {avoir.clientNom && (
                        <span className="flex items-center space-x-1 font-semibold text-slate-800">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span>{avoir.clientNom}</span>
                          {avoir.clientTel && <span className="text-slate-400 font-normal">({avoir.clientTel})</span>}
                        </span>
                      )}

                      <span className="text-slate-400">
                        Créé le {new Date(avoir.dateCreation).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>

                      {avoir.caissierNom && (
                        <span className="text-slate-500">
                          par {avoir.caissierNom}
                        </span>
                      )}

                      {avoir.venteReceiptNumber && (
                        <span className="text-slate-500">
                          • Vente origine #{avoir.venteReceiptNumber}
                        </span>
                      )}
                    </div>

                    {/* Sub text / notes / usage info */}
                    {avoir.notes && (
                      <p className="text-xs text-slate-500 italic">
                        "{avoir.notes}"
                      </p>
                    )}

                    {isUtilise && avoir.venteUtilisationReceiptNumber && (
                      <p className="text-xs text-blue-700 font-medium">
                        Déduit sur la vente ticket #{avoir.venteUtilisationReceiptNumber}
                        {avoir.dateUtilisation && ` le ${new Date(avoir.dateUtilisation).toLocaleDateString('fr-FR')}`}
                      </p>
                    )}

                    {isRembourse && (
                      <p className="text-xs text-amber-700 font-medium">
                        Espèces rendues au client
                        {avoir.rembourseParNom && ` par ${avoir.rembourseParNom}`}
                        {avoir.dateRemboursement && ` le ${new Date(avoir.dateRemboursement).toLocaleDateString('fr-FR')}`}
                      </p>
                    )}
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center justify-between md:justify-end space-x-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <div className="text-lg sm:text-xl font-black text-slate-900">
                        {avoir.montant.toLocaleString()} {business.currency}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {isActif ? 'Crédit disponible' : isUtilise ? 'Consommé' : 'Décaissé'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Print Ticket Button */}
                      <button
                        onClick={() => setShowPrintModal(avoir)}
                        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
                        title="Imprimer le ticket d'avoir"
                      >
                        <Printer className="h-4 w-4" />
                      </button>

                      {/* Cash Refund Button (only if active) */}
                      {isActif && (
                        <button
                          onClick={() => {
                            setShowRefundModal(avoir);
                            setRefundNotes('');
                          }}
                          className="flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                          title="Rembourser cet avoir en espèces"
                        >
                          <Banknote className="h-3.5 w-3.5 text-amber-600" />
                          <span>Rembourser espèces</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE AVOIR MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Ticket className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-base">Émettre un Avoir Client</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAvoir} className="p-5 space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Montant */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Montant de l'Avoir ({business.currency}) *
                </label>
                <div className="relative">
                  <input
                    id="input-new-avoir-montant"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="ex: 500, 1000, 2500..."
                    value={newMontant}
                    onChange={(e) => setNewMontant(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {business.currency}
                  </span>
                </div>
              </div>

              {/* Client Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nom du Client (Optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Nom du client"
                    value={newClientNom}
                    onChange={(e) => setNewClientNom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Téléphone (Optionnel)
                  </label>
                  <input
                    type="tel"
                    placeholder="ex: 70000000"
                    value={newClientTel}
                    onChange={(e) => setNewClientTel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Vente de référence */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  N° Ticket Vente d'origine (Optionnel)
                </label>
                <input
                  type="text"
                  placeholder="ex: 1042 ou VTE-001"
                  value={newVenteRef}
                  onChange={(e) => setNewVenteRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Motif / Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motif / Raison de l'avoir
                </label>
                <input
                  type="text"
                  placeholder="ex: Monnaie manquante pièce 500F, Retour marchandise..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50"
                >
                  {isSubmittingNew ? 'Création en cours...' : 'Valider et Générer Avoir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REFUND IN CASH CONFIRMATION MODAL */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 bg-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Banknote className="h-5 w-5" />
                <h3 className="font-bold text-base">Remboursement Avoir en Espèces</h3>
              </div>
              <button
                onClick={() => setShowRefundModal(null)}
                className="p-1 rounded-full text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                Vous allez décaisser <strong>{showRefundModal.montant.toLocaleString()} {business.currency}</strong> en espèces pour l'avoir <strong>{showRefundModal.numero}</strong>.
                {activeCashSession && activeCashSession.status === 'open' ? (
                  <p className="mt-1 text-emerald-800 font-semibold">
                    ✓ Une sortie de caisse automatique sera enregistrée sur la session en cours.
                  </p>
                ) : (
                  <p className="mt-1 text-amber-800">
                    ℹ Aucune session de caisse ouverte actuellement.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Note / Motif du remboursement
                </label>
                <input
                  type="text"
                  placeholder="ex: Client a demandé le remboursement en liquide"
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRefund}
                  disabled={isProcessingRefund}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition disabled:opacity-50"
                >
                  {isProcessingRefund ? 'Traitement...' : 'Confirmer le remboursement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT THERMAL TICKET MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-none print:w-full">
            
            <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider">Ticket d'Avoir Client</span>
              <button
                onClick={() => setShowPrintModal(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Thermal Ticket Content */}
            <div className="p-6 font-mono text-xs text-slate-900 space-y-4 bg-white">
              <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
                <h2 className="font-black text-sm uppercase tracking-wider">{business.name}</h2>
                <p className="text-[11px] text-slate-600">{business.sector}, {business.city}</p>
                {business.phone && <p className="text-[11px] text-slate-600">Tél: {business.phone}</p>}
                {business.ifu && <p className="text-[10px] text-slate-500">IFU: {business.ifu}</p>}
              </div>

              <div className="text-center py-2 border-b border-dashed border-slate-300 space-y-1">
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 font-black text-sm rounded-lg">
                  BON D'AVOIR
                </span>
                <div className="text-base font-black tracking-widest mt-1">{showPrintModal.numero}</div>
                <div className="text-[10px] text-slate-500">
                  {new Date(showPrintModal.dateCreation).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
                {showPrintModal.clientNom && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bénéficiaire :</span>
                    <span className="font-bold">{showPrintModal.clientNom}</span>
                  </div>
                )}
                {showPrintModal.clientTel && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Téléphone :</span>
                    <span className="font-bold">{showPrintModal.clientTel}</span>
                  </div>
                )}
                {showPrintModal.venteReceiptNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Réf. Vente :</span>
                    <span className="font-bold">#{showPrintModal.venteReceiptNumber}</span>
                  </div>
                )}
                {showPrintModal.caissierNom && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Caissier :</span>
                    <span>{showPrintModal.caissierNom}</span>
                  </div>
                )}
              </div>

              <div className="text-center py-2 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Valeur de l'Avoir</div>
                <div className="text-xl font-black text-emerald-700">
                  {showPrintModal.montant.toLocaleString()} {business.currency}
                </div>
              </div>

              {showPrintModal.notes && (
                <div className="text-[10px] text-slate-500 text-center italic">
                  Motif : {showPrintModal.notes}
                </div>
              )}

              {/* Mention Obligatoire Réglementaire */}
              <div className="text-center py-2.5 px-3 bg-amber-50/80 rounded-xl border border-amber-200/90 text-amber-950 space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                  *** MENTION OBLIGATOIRE ***
                </div>
                <div className="text-[11px] font-black text-amber-950">
                  À FAIRE VALOIR SUR UN PROCHAIN ACHAT
                </div>
                <div className="text-[9.5px] leading-tight text-amber-800">
                  Présentation obligatoire de ce ticket original en caisse lors du règlement. Non remboursable en espèces sauf accord de la direction. Valable dans tous nos points de vente.
                </div>
              </div>

              {/* Barcode representation */}
              <div className="text-center pt-1 border-t border-dashed border-slate-300 space-y-0.5">
                <div className="font-mono text-sm tracking-widest text-slate-800 font-bold">||| | | |||| | || |||</div>
                <div className="text-[10px] font-mono font-bold text-slate-600">* {showPrintModal.numero} *</div>
              </div>
            </div>

            {/* Print Status Feedback */}
            {printFeedback && (
              <div className={`px-4 py-2 text-xs flex items-center gap-2 border-t ${
                printFeedback.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                {printFeedback.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                )}
                <span className="font-medium text-[11px]">{printFeedback.message}</span>
              </div>
            )}

            {/* Print Action Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2 print:hidden">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isPrintingEscPos}
                  onClick={() => handlePrintEscPos(showPrintModal)}
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition shadow-xs disabled:opacity-50 cursor-pointer"
                  title="Impression thermique directe via ESC/POS Bluetooth (POS-80 / POS-58)"
                >
                  <Bluetooth className={`h-4 w-4 shrink-0 ${isPrintingEscPos ? 'animate-spin' : ''}`} />
                  <span className="truncate">{isPrintingEscPos ? 'Envoi POS...' : 'Ticket ESC/POS'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrintSystem(showPrintModal)}
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white transition shadow-xs cursor-pointer"
                  title="Impression via pilote thermique USB ou boîte de dialogue système"
                >
                  <Printer className="h-4 w-4 shrink-0" />
                  <span className="truncate">Pilote / USB</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleDownload(showPrintModal)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
                    title="Télécharger le ticket au format HTML"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>HTML</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenTab(showPrintModal)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
                    title="Ouvrir le ticket dans un nouvel onglet"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Onglet</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowPrintModal(null);
                    setPrintFeedback(null);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
