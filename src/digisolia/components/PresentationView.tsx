import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Headphones,
  Layers,
  ShieldCheck,
  Sparkles,
  WifiOff,
  Zap,
} from 'lucide-react';
import { useDigiSolia } from '../hooks/useDigiSolia';
import { DigiSoliaLogo } from './DigiSoliaLogo';

interface PresentationViewProps {
  onStart?: () => void;
  isFirstRunModal?: boolean;
}

export const PresentationView: React.FC<PresentationViewProps> = ({
  onStart,
  isFirstRunModal = false,
}) => {
  const { config, host, completePresentation, user } = useDigiSolia();

  const handleCommencer = () => {
    completePresentation();
    if (onStart) {
      onStart();
    } else {
      host.onNavigate('daf_home');
    }
  };

  const featureIcons = [Zap, Layers, WifiOff, ShieldCheck];

  return (
    <div
      className={`${
        isFirstRunModal
          ? 'min-h-screen bg-[#F4F7FB] dark:bg-slate-950 flex items-center justify-center p-4 sm:p-8'
          : 'p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in'
      }`}
    >
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* Hero Card */}
        <section
          className="rounded-3xl text-white p-6 sm:p-10 shadow-lg border border-[#1E4C80] relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #163B65 0%, #1F5B94 58%, #2783C7 100%)',
          }}
        >
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="space-y-5 max-w-2xl">
              <DigiSoliaLogo
                size="lg"
                inverted
                logoUrl={config.logoUrl}
                subtitle={config.appName}
              />

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-sky-200">
                  Présentation du produit · Version {config.version}
                </p>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  {config.appName}
                </h1>
                <p className="text-sm sm:text-base text-slate-100/90 leading-relaxed">
                  {config.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCommencer}
                  className="inline-flex items-center justify-center gap-2 bg-white text-[#163B65] hover:bg-sky-50 active:scale-98 font-bold text-sm px-6 py-3 rounded-xl shadow-md transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Commencer</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    completePresentation();
                    host.onNavigate('daf_support');
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/25 font-semibold text-sm px-5 py-3 rounded-xl transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Headphones className="h-4 w-4" />
                  <span>Centre d’assistance</span>
                </button>
              </div>
            </div>

            {/* Version & Publisher Summary Panel */}
            <div className="bg-slate-950/30 backdrop-blur-xs border border-white/15 rounded-2xl p-5 lg:w-72 shrink-0 space-y-4">
              <div className="flex items-center gap-2 text-sky-200 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="h-4 w-4" />
                <span>Écosystème DigiSolia</span>
              </div>
              <dl className="space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <dt className="text-slate-300">Application</dt>
                  <dd className="font-bold text-white">{config.shortName}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <dt className="text-slate-300">Version</dt>
                  <dd className="font-mono font-bold text-sky-200 daf-tabular">v{config.version}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <dt className="text-slate-300">Socle DAF</dt>
                  <dd className="font-mono text-white">{config.frameworkVersion}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-300">Session active</dt>
                  <dd className="font-semibold text-white truncate max-w-[130px]">{user.fullName}</dd>
                </div>
              </dl>
              <p className="text-[11px] text-slate-200/80 leading-relaxed pt-1 border-t border-white/10">
                Édité par <strong className="text-white">{config.publisherName}</strong> — {config.contacts.city}, {config.contacts.country}.
              </p>
            </div>
          </div>
        </section>

        {/* Functionalities Grid */}
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Fonctionnalités principales
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Des outils conçus pour la performance quotidienne sur le terrain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.features.map((feat, idx) => {
              const Icon = featureIcons[idx % featureIcons.length];
              return (
                <article
                  key={feat.id}
                  className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#F4F7FB] dark:bg-slate-800 text-[#163B65] dark:text-sky-400 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                      {feat.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {feat.description}
                  </p>
                  <p className="text-xs font-semibold text-[#2783C7] dark:text-sky-400 pt-1">
                    Avantage : {feat.benefit}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        {/* User Benefits & Publisher Footer */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Avantages pour vos utilisateurs
            </h2>
            <ul className="space-y-2.5">
              {config.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-[#2783C7] dark:text-sky-400 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Informations éditeur
              </p>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {config.publisherName}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {config.publisherLegalInfo}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono pt-1">
                {config.contacts.email} · {config.contacts.phoneNumber}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCommencer}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#163B65] hover:bg-[#102D4F] text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-xl transition cursor-pointer whitespace-nowrap"
            >
              <span>Accéder à l’application</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
