import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  Lock, 
  X, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  KeyRound,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const AdminPinModal: React.FC = () => {
  const { showAdminPinModal, setShowAdminPinModal, unlockPlatformAdmin } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAdminPinModal) {
      setPin('');
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [showAdminPinModal]);

  if (!showAdminPinModal) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length !== 6) {
      setError('Veuillez saisir le code PIN complet à 6 chiffres.');
      triggerShake();
      return;
    }

    const success = unlockPlatformAdmin(pin);
    if (!success) {
      setError('Code PIN Administrateur incorrect. Accès refusé.');
      triggerShake();
      setPin('');
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleDigitClick = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(null);
      if (nextPin.length === 6) {
        const success = unlockPlatformAdmin(nextPin);
        if (!success) {
          setError('Code PIN Administrateur incorrect.');
          triggerShake();
          setTimeout(() => setPin(''), 300);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className={`bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative transition-transform ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={() => setShowAdminPinModal(false)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Espace Administrateur
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Accès restreint à la gestion de la plateforme
              </p>
            </div>
          </div>
        </div>

        {/* Content & PIN Input Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center">
              <p className="text-xs text-slate-600 mb-4">
                Saisissez le code PIN maître à 6 chiffres pour déverrouiller la console de gestion globale :
              </p>

              {/* Hidden input for direct typing/keyboard accessibility */}
              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setPin(val);
                  setError(null);
                  if (val.length === 6) {
                    const success = unlockPlatformAdmin(val);
                    if (!success) {
                      setError('Code PIN incorrect.');
                      triggerShake();
                    }
                  }
                }}
                onKeyDown={handleKeyDown}
                className="opacity-0 absolute -z-10 w-1 h-1"
                autoFocus
              />

              {/* Visual 6-Digit PIN Display */}
              <div 
                onClick={() => inputRef.current?.focus()}
                className="flex items-center justify-center gap-2.5 cursor-pointer py-2"
              >
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const digit = pin[index];
                  const isFilled = digit !== undefined;
                  const isCurrent = index === pin.length;

                  return (
                    <div
                      key={index}
                      className={`h-12 w-11 sm:h-14 sm:w-12 rounded-xl border-2 flex items-center justify-center font-mono text-xl font-bold transition-all ${
                        isFilled
                          ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                          : isCurrent
                          ? 'border-blue-400 bg-slate-50 ring-2 ring-blue-100'
                          : 'border-slate-200 bg-slate-50/60 text-slate-400'
                      }`}
                    >
                      {isFilled ? (showPin ? digit : '●') : ''}
                    </div>
                  );
                })}
              </div>

              {/* Show/Hide PIN toggle */}
              <div className="flex items-center justify-center mt-2">
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-700 transition"
                >
                  {showPin ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>Masquer les chiffres</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      <span>Afficher les chiffres</span>
                    </>
                  )}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center space-x-2 text-xs font-semibold text-red-700 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Virtual Keypad for Mobile & Touchscreens */}
            <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDigitClick(d)}
                  className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-blue-600 active:text-white font-bold text-slate-800 text-lg transition shadow-2xs flex items-center justify-center"
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 font-semibold text-slate-600 text-xs transition flex items-center justify-center"
              >
                Effacer
              </button>
              <button
                type="button"
                onClick={() => handleDigitClick('0')}
                className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-blue-600 active:text-white font-bold text-slate-800 text-lg transition shadow-2xs flex items-center justify-center"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 font-semibold text-slate-700 text-sm transition flex items-center justify-center"
                aria-label="Supprimer"
              >
                ⌫
              </button>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAdminPinModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={pin.length !== 6}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2"
              >
                <KeyRound className="h-4 w-4" />
                <span>Déverrouiller</span>
              </button>
            </div>
          </form>

          {/* Quick Info Box */}
          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              Protection sécurisée PIN maître
            </span>
            <span className="font-mono text-slate-400 font-bold">BizPilot SuperAdmin</span>
          </div>
        </div>
      </div>
    </div>
  );
};
