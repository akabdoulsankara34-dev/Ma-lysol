import React, { useState } from 'react';
import {
  Building2,
  Compass,
  FileCheck,
  Globe,
  Mail,
  MapPin,
  Phone,
  Shield,
  Target,
} from 'lucide-react';
import { useDigiSolia } from '../hooks/useDigiSolia';
import { DigiSoliaLogo } from './DigiSoliaLogo';

export const AboutView: React.FC = () => {
  const { config } = useDigiSolia();
  const [legalTab, setLegalTab] = useState<'cgu' | 'privacy'>('cgu');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in">
      {/* Brand Header */}
      <section className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <DigiSoliaLogo size="lg" logoUrl={config.logoUrl} />
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 daf-tabular">
            {config.appName} v{config.version} · {config.frameworkVersion}
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
          <strong>{config.publisherName}</strong> est une entreprise burkinabè spécialisée dans la conception
          de logiciels professionnels de gestion commerciale, éducative et hôtelière adaptés aux réalités
          économiques et techniques d’Afrique de l’Ouest.
        </p>
      </section>

      {/* Mission & Vision */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <article className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2 text-[#163B65] dark:text-sky-400">
            <Target className="h-5 w-5" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Notre Mission
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Doter les commerces, établissements scolaires, hôtels et PME de solutions numériques fiables,
            intuitives et opérationnelles même hors connexion, afin de sécuriser leurs revenus et simplifier
            leur gestion quotidienne.
          </p>
        </article>

        <article className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2 text-[#2783C7] dark:text-sky-400">
            <Compass className="h-5 w-5" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Notre Vision
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Bâtir au Burkina Faso et dans la sous-région un écosystème unifié d’applications métiers
            connectées, souveraines et centrées sur la réussite des entrepreneurs et gestionnaires locaux.
          </p>
        </article>
      </section>

      {/* Official Contact Info */}
      <section className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="h-4 w-4 text-[#163B65] dark:text-sky-400" />
          <span>Coordonnées officielles</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-[#F4F7FB] dark:bg-slate-800/60 space-y-1">
            <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-semibold">
              <MapPin className="h-3.5 w-3.5" /> Adresse
            </p>
            <p className="font-bold text-slate-900 dark:text-white">{config.contacts.address}</p>
            <p className="text-slate-500 dark:text-slate-400">
              {config.contacts.city}, {config.contacts.country}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F4F7FB] dark:bg-slate-800/60 space-y-1">
            <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-semibold">
              <Phone className="h-3.5 w-3.5" /> Téléphone
            </p>
            <p className="font-mono font-bold text-slate-900 dark:text-white">
              {config.contacts.phoneNumber}
            </p>
            <p className="text-slate-500 dark:text-slate-400">{config.contacts.supportHours}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F4F7FB] dark:bg-slate-800/60 space-y-1">
            <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-semibold">
              <Mail className="h-3.5 w-3.5" /> E-mail officiel
            </p>
            <p className="font-bold text-slate-900 dark:text-white truncate">
              {config.contacts.email}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F4F7FB] dark:bg-slate-800/60 space-y-1">
            <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-semibold">
              <Globe className="h-3.5 w-3.5" /> Site web
            </p>
            <p className="font-bold text-[#2783C7] dark:text-sky-400">{config.contacts.website}</p>
          </div>
        </div>
      </section>

      {/* CGU & Privacy Policy */}
      <section className="bg-white dark:bg-slate-900 border border-[#E1E7EF] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setLegalTab('cgu')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              legalTab === 'cgu'
                ? 'bg-[#163B65] text-white'
                : 'bg-[#F4F7FB] dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <FileCheck className="h-3.5 w-3.5" />
            <span>Conditions d’utilisation</span>
          </button>

          <button
            type="button"
            onClick={() => setLegalTab('privacy')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              legalTab === 'privacy'
                ? 'bg-[#163B65] text-white'
                : 'bg-[#F4F7FB] dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Politique de confidentialité</span>
          </button>
        </div>

        {legalTab === 'cgu' ? (
          <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              <strong>1. Objet :</strong> Les présentes conditions régissent l’utilisation des applications
              de l’écosystème DigiSolia ({config.appName}, PROF PLANNING, DigiSolia Hôtel).
            </p>
            <p>
              <strong>2. Accès et responsabilité :</strong> Chaque établissement est responsable de la
              confidentialité de ses codes d’accès et codes PIN collaborateurs.
            </p>
            <p>
              <strong>3. Disponibilité et sauvegardes :</strong> Le mode hors connexion assure la continuité
              de service sur votre terminal. Il est recommandé de vérifier régulièrement l’état de
              synchronisation Cloud et d’effectuer une sauvegarde JSON périodique.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              <strong>1. Données collectées :</strong> DigiSolia collecte uniquement les données nécessaires
              au fonctionnement métier de votre application, au traitement des demandes d’assistance et
              à l’amélioration de la qualité de service (avis et suggestions).
            </p>
            <p>
              <strong>2. Cloisonnement strict :</strong> Les données de chaque produit et de chaque
              entreprise sont isolées par identifiant unique (`appId` et `businessId`). Aucune donnée
              commerciale n’est vendue ni partagée à des tiers.
            </p>
            <p>
              <strong>3. Vos droits :</strong> Pour toute demande d’exportation ou de suppression de
              données, contactez le support officiel à l’adresse {config.contacts.email}.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
