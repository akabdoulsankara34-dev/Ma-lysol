import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Headphones,
  Mail,
  MessageCircle,
  Phone,
  Send,
  Wrench,
} from 'lucide-react';
import { useDigiSolia } from '../hooks/useDigiSolia';
import { DigiSoliaSupportTicket } from '../types';
import { getTicketStatusMeta } from '../utils/validation';

export const SupportCenterView: React.FC = () => {
  const { config, user, host, supportTickets, submitSupportTicket } = useDigiSolia();

  const [issueType, setIssueType] = useState<DigiSoliaSupportTicket['issueType']>('assistance');
  const [priority, setPriority] = useState<DigiSoliaSupportTicket['priority']>('normale');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [userPhone, setUserPhone] = useState(user.phone || '');
  const [userEmail, setUserEmail] = useState(user.email || '');

  useEffect(() => {
    setUserPhone(user.phone || '');
    setUserEmail(user.email || '');
  }, [user.userId, user.phone, user.email]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [openFaqId, setOpenFaqId] = useState<string | null>(config.faq[0]?.id || null);

  const whatsappMessage = encodeURIComponent(
    `Bonjour DigiSolia, j'ai besoin d'assistance sur ${config.appName} (v${config.version}) — Utilisateur: ${user.fullName}`
  );
  const whatsappHref = `https://wa.me/${config.contacts.whatsappNumber}?text=${whatsappMessage}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackBanner(null);
    setFieldErrors({});

    const res = await submitSupportTicket({
      issueType,
      priority,
      subject,
      message,
      userEmail,
      userPhone,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setFieldErrors(res.errors || {});
      setFeedbackBanner({ type: 'error', text: res.message });
      return;
    }

    setFeedbackBanner({ type: 'success', text: res.message });
    setSubject('');
    setMessage('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-[#163B65] text-white flex items-center justify-center shrink-0">
            <Headphones className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Centre d’assistance DigiSolia
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Support direct, guide d’utilisation, questions fréquentes et signalement d’incidents techniques · {config.contacts.supportHours}
            </p>
          </div>
        </div>

        {!host.isOnline && (
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-xl shrink-0">
            Mode hors connexion · Les demandes sont enregistrées localement
          </span>
        )}
      </header>

      {/* Direct Channels from Central Config */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 hover:border-emerald-500 rounded-2xl p-5 shadow-2xs transition flex items-start gap-3.5"
        >
          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              WhatsApp Support
            </p>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">
              {config.contacts.whatsappDisplay}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Discussion directe avec un conseiller DigiSolia
            </p>
          </div>
        </a>

        <a
          href={`tel:${config.contacts.phoneNumber.replace(/\s+/g, '')}`}
          className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 hover:border-[#2783C7] rounded-2xl p-5 shadow-2xs transition flex items-start gap-3.5"
        >
          <div className="h-10 w-10 rounded-xl bg-[#F4F7FB] dark:bg-slate-800 text-[#163B65] dark:text-sky-400 flex items-center justify-center shrink-0">
            <Phone className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-[#163B65] dark:text-sky-400">
              Appel téléphonique
            </p>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">
              {config.contacts.phoneNumber}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Ligne d’assistance urgente Burkina Faso
            </p>
          </div>
        </a>

        <a
          href={`mailto:${config.contacts.email}?subject=${encodeURIComponent(`[${config.appName}] Demande d'assistance`)}`}
          className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 hover:border-[#2783C7] rounded-2xl p-5 shadow-2xs transition flex items-start gap-3.5"
        >
          <div className="h-10 w-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-[#2783C7] dark:text-sky-400 flex items-center justify-center shrink-0">
            <Mail className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-[#2783C7] dark:text-sky-400">
              Courrier électronique
            </p>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 truncate">
              {config.contacts.email}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Réponse structurée et suivi par e-mail
            </p>
          </div>
        </a>
      </section>

      {/* Support Request Form + User Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4"
        >
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Wrench className="h-5 w-5 text-[#2783C7] dark:text-sky-400" />
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Ouvrir une demande d’assistance ou signaler un incident
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Formulaire connecté à Firebase avec sauvegarde hors connexion.
              </p>
            </div>
          </div>

          {feedbackBanner && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                feedbackBanner.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              {feedbackBanner.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <span>{feedbackBanner.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Type de demande
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as DigiSoliaSupportTicket['issueType'])}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="assistance">Assistance à l’utilisation</option>
                <option value="technique">Difficulté technique / Bug</option>
                <option value="compte">Accès, compte ou mot de passe</option>
                <option value="facturation">Abonnement & facturation</option>
                <option value="autre">Autre demande</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Niveau d’urgence
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as DigiSoliaSupportTicket['priority'])}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="normale">Normale</option>
                <option value="urgente">Urgente (blocage activité)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Téléphone de rappel (facultatif)
              </label>
              <input
                type="tel"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="+226 70 00 00 00"
                className="w-full px-3 py-2.5 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
              {fieldErrors.userPhone && (
                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.userPhone}</p>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Adresse e-mail (facultatif)
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="contact@entreprise.bf"
                className="w-full px-3 py-2.5 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              {fieldErrors.userEmail && (
                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.userEmail}</p>
              )}
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Objet de la demande <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex : Impossible d’imprimer en Bluetooth sur tablette"
              className="w-full px-3 py-2.5 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            {fieldErrors.subject && (
              <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.subject}</p>
            )}
          </div>

          <div className="text-xs">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Description détaillée <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Décrivez les étapes qui produisent la difficulté et le message affiché à l’écran..."
              className="w-full px-3 py-2.5 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-y"
            />
            {fieldErrors.message && (
              <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 bg-[#163B65] hover:bg-[#102D4F] disabled:opacity-60 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition cursor-pointer whitespace-nowrap"
          >
            <Send className="h-4 w-4" />
            <span>{isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande d’assistance'}</span>
          </button>
        </form>

        {/* User Guide */}
        <aside className="lg:col-span-5 bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <BookOpen className="h-5 w-5 text-[#163B65] dark:text-sky-400" />
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Guide d’utilisation rapide
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Prise en main de {config.shortName}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {config.userGuide.map((step) => (
              <div
                key={step.id}
                className="p-3.5 rounded-xl bg-[#F4F7FB] dark:bg-slate-800/70 border border-[#E1E7EF] dark:border-slate-800 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    {step.title}
                  </h3>
                  <span className="text-[11px] font-semibold text-[#2783C7] dark:text-sky-400 shrink-0">
                    {step.moduleTag}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Interactive FAQ + Ticket History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Questions fréquentes (FAQ)
          </h2>
          <div className="space-y-2.5">
            {config.faq.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="border border-[#E1E7EF] dark:border-slate-800 rounded-xl overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-[#F4F7FB] dark:bg-slate-800/60 hover:bg-[#E1E7EF]/60 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <div>
                      <span className="text-[11px] font-semibold text-[#2783C7] dark:text-sky-400 block">
                        {faq.category}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {faq.question}
                      </span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 border-t border-[#E1E7EF] dark:border-slate-800">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Historique de mes demandes ({supportTickets.length})
            </h2>
          </div>

          {supportTickets.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-8 text-center">
              Aucune demande d’assistance enregistrée pour le moment.
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {supportTickets.slice(0, 10).map((ticket) => {
                const statusMeta = getTicketStatusMeta(ticket.status);
                return (
                  <div
                    key={ticket.id}
                    className="p-3.5 rounded-xl border border-[#E1E7EF] dark:border-slate-800 bg-[#F4F7FB]/50 dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {ticket.subject}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 daf-tabular">
                          {new Date(ticket.createdAt).toLocaleString('fr-FR')} · {ticket.issueType}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border shrink-0 ${statusMeta.toneClass}`}
                      >
                        {statusMeta.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {ticket.message}
                    </p>
                    {ticket.adminResponse && (
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-[#2783C7]/30 text-xs text-slate-700 dark:text-slate-200">
                        <strong className="text-[#163B65] dark:text-sky-400">Réponse DigiSolia :</strong>{' '}
                        {ticket.adminResponse}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
