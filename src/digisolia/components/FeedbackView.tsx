import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  MessageSquarePlus,
  Send,
  Star,
} from 'lucide-react';
import { useDigiSolia } from '../hooks/useDigiSolia';
import { DigiSoliaFeedbackCategory } from '../types';
import { getTicketStatusMeta } from '../utils/validation';

const CATEGORY_OPTIONS: {
  id: DigiSoliaFeedbackCategory;
  label: string;
  hint: string;
}[] = [
  { id: 'avis', label: 'Avis & Note', hint: 'Évaluez votre expérience globale' },
  { id: 'suggestion', label: 'Suggestion', hint: 'Proposez une amélioration utile' },
  { id: 'bug', label: 'Signaler un bug', hint: 'Signalez une anomalie constatée' },
  { id: 'reclamation', label: 'Réclamation', hint: 'Déposez une réclamation formelle' },
];

export const FeedbackView: React.FC = () => {
  const { config, host, feedbackItems, submitFeedback } = useDigiSolia();

  const [category, setCategory] = useState<DigiSoliaFeedbackCategory>('avis');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setBanner(null);
    setFieldErrors({});

    const res = await submitFeedback({
      category,
      rating: category === 'avis' || rating > 0 ? rating : null,
      subject,
      message,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setFieldErrors(res.errors || {});
      setBanner({ type: 'error', text: res.message });
      return;
    }

    setBanner({ type: 'success', text: res.message });
    setSubject('');
    setMessage('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in">
      <header className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-[#2783C7] text-white flex items-center justify-center shrink-0">
            <MessageSquarePlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Avis, suggestions et réclamations
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Partagez votre note et vos retours sur {config.appName}. Chaque demande est suivie par l’équipe DigiSolia.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          App ID : {config.appId}
        </span>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-6 bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5"
        >
          {banner && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                banner.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              {banner.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <span>{banner.text}</span>
            </div>
          )}

          {/* Category */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Catégorie de retour
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {CATEGORY_OPTIONS.map((opt) => {
                const active = category === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCategory(opt.id)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      active
                        ? 'border-[#2783C7] bg-[#F4F7FB] dark:bg-sky-950/40 text-[#163B65] dark:text-sky-300'
                        : 'border-[#E1E7EF] dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <p className="text-xs font-bold">{opt.label}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {opt.hint}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Star Rating */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Note de satisfaction (1 à 5 étoiles)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
                    className="p-1.5 rounded-lg hover:bg-[#F4F7FB] dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Star
                      className={`h-7 w-7 transition ${
                        filled
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="ml-2 text-xs font-bold text-slate-700 dark:text-slate-300 daf-tabular">
                {rating}/5
              </span>
            </div>
            {fieldErrors.rating && (
              <p className="text-[11px] text-rose-600">{fieldErrors.rating}</p>
            )}
          </div>

          <div className="text-xs space-y-1.5">
            <label className="block font-bold text-slate-700 dark:text-slate-300">
              Titre ou résumé (facultatif)
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex : Très rapide en caisse ou idée d’export mensuel"
              className="w-full px-3 py-2.5 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="text-xs space-y-1.5">
            <label className="block font-bold text-slate-700 dark:text-slate-300">
              Votre commentaire / message <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Expliquez votre avis, suggestion, anomalie ou réclamation (minimum 10 caractères)..."
              className="w-full px-3 py-2.5 rounded-xl border border-[#E1E7EF] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-y"
            />
            {fieldErrors.message && (
              <p className="text-[11px] text-rose-600">{fieldErrors.message}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {host.isOnline
                ? 'Enregistrement direct dans Firebase avec suivi de statut.'
                : 'Hors connexion : sauvegarde locale et envoi automatique à la reconnexion.'}
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-[#163B65] hover:bg-[#102D4F] disabled:opacity-60 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? 'Envoi...' : 'Soumettre mon retour'}</span>
            </button>
          </div>
        </form>

        {/* History & Status Tracking */}
        <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Suivi des avis et demandes ({feedbackItems.length})
            </h2>
          </div>

          {feedbackItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
              Aucun avis soumis pour cette application pour le moment. Soyez le premier à partager votre retour.
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {feedbackItems.map((item) => {
                const statusMeta = getTicketStatusMeta(item.status);
                const catLabel =
                  CATEGORY_OPTIONS.find((c) => c.id === item.category)?.label || item.category;

                return (
                  <article
                    key={item.id}
                    className="p-4 rounded-xl border border-[#E1E7EF] dark:border-slate-800 bg-[#F4F7FB]/60 dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[#163B65] dark:text-sky-400">
                            {catLabel}
                          </span>
                          {item.rating && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-600 dark:text-amber-400 daf-tabular">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              {item.rating}/5
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 daf-tabular">
                            · {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {item.subject && (
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {item.subject}
                          </h3>
                        )}
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border shrink-0 ${statusMeta.toneClass}`}
                      >
                        {statusMeta.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {item.message}
                    </p>

                    {item.adminResponse && (
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-[#2783C7]/30 text-xs text-slate-700 dark:text-slate-200">
                        <strong className="text-[#163B65] dark:text-sky-400">
                          Réponse équipe DigiSolia :
                        </strong>{' '}
                        {item.adminResponse}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
