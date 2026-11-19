import React, { useState } from 'react';
import { Check, Copy, Download, Share2, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'dark-portal';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'navbar' }) => {
  const { isInstallable, isInstalled, isIOS, isInIframe, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Already running in standalone installed PWA mode: suppress install button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuideModal(false);
      }
      return;
    }
    setShowGuideModal(true);
  };

  const handleCopyAppUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      // Clipboard restricted
    }
  };

  const buttonClass =
    variant === 'dark-portal'
      ? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer bg-blue-600/20 hover:bg-blue-600/35 text-blue-200 border-blue-500/40'
      : isInstallable
      ? 'inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-[#163B65] hover:bg-[#1E4C80] text-white shadow-xs transition cursor-pointer shrink-0'
      : 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-[#163B65] dark:text-sky-200 border border-sky-200 dark:border-sky-800 transition cursor-pointer shrink-0';

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={buttonClass}
        title={
          isInstallable
            ? "Installer l'application BizPilot BF sur cet appareil"
            : "Instructions d'installation en application (PWA)"
        }
      >
        <Download className="h-3.5 w-3.5 shrink-0" />
        <span className={variant === 'navbar' ? 'hidden md:inline' : 'inline'}>
          {isInstallable ? "Installer l'App" : isIOS ? 'Installer (iOS)' : 'App PWA'}
        </span>
      </button>

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#163B65] text-white flex items-center justify-center shrink-0">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Installer BizPilot BF (PWA)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Fonctionne hors-ligne comme une application native
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-700 dark:text-slate-300">
              {isIOS ? (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white">
                    Sur iPhone / iPad (Safari) :
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-[#2783C7] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span>
                      Appuyez sur le bouton <strong className="inline-flex items-center gap-1"><Share2 className="h-3 w-3" /> Partager</strong> dans la barre Safari.
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-[#2783C7] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span>
                      Faites défiler et sélectionnez <strong>« Sur l&apos;écran d&apos;accueil »</strong>.
                    </span>
                  </p>
                </div>
              ) : isInIframe ? (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 space-y-2.5">
                  <p className="font-bold text-amber-900 dark:text-amber-200">
                    Ouverture directe requise pour l&apos;installation
                  </p>
                  <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                    L&apos;application est actuellement affichée dans un cadre d&apos;aperçu. Pour que Chrome, Edge ou Android autorise l&apos;installation directe sur votre bureau ou écran d&apos;accueil, ouvrez le lien directement dans un nouvel onglet :
                  </p>
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700 rounded-lg p-2">
                    <code className="text-[11px] font-mono text-slate-700 dark:text-slate-200 truncate flex-1">
                      {typeof window !== 'undefined' ? window.location.origin : ''}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyAppUrl}
                      className="px-2.5 py-1 rounded-md bg-[#163B65] text-white font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedUrl ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedUrl ? 'Copié' : 'Copier'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white">
                    Sur Chrome, Edge ou Android :
                  </p>
                  <p>
                    1. Ouvrez le menu du navigateur (<strong>⋮</strong> en haut à droite).
                  </p>
                  <p>
                    2. Sélectionnez <strong>« Installer BizPilot BF »</strong> ou <strong>« Ajouter à l&apos;écran d&apos;accueil »</strong>.
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-5 w-full rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 transition cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
};
