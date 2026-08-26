import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { AppUser } from '../../types';
import { 
  KeyRound, 
  Lock, 
  X, 
  User, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight,
  UserX
} from 'lucide-react';

interface StaffPinModalProps {
  userToSwitch: AppUser | null;
  onClose: () => void;
  onSuccess: (user: AppUser) => void;
}

export const StaffPinModal: React.FC<StaffPinModalProps> = ({ userToSwitch, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userToSwitch) {
      setPin('');
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [userToSwitch]);

  if (!userToSwitch) return null;

  if (!userToSwitch.active) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
        <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-red-200">
          <div className="h-14 w-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
            <UserX className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Compte Suspendu</h3>
          <p className="text-xs text-slate-600 mt-2">
            L'accès de <span className="font-bold text-slate-900">{userToSwitch.name}</span> a été suspendu par le propriétaire de l'entreprise.
          </p>
          <button
            onClick={onClose}
            className="mt-5 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  const handleVerify = (pinToTest?: string) => {
    const p = pinToTest || pin;
    const expectedPin = userToSwitch.pin || '0000';
    if (p === expectedPin) {
      onSuccess(userToSwitch);
      onClose();
    } else {
      setError('Code PIN incorrect. Veuillez réessayer.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin('');
    }
  };

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      setError(null);
      if (next.length === 4) {
        handleVerify(next);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className={`bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 ${shake ? 'animate-shake' : ''}`}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Code PIN Collaborateur</h3>
              <p className="text-[11px] text-slate-500">{userToSwitch.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* PIN Indicators */}
        <div className="text-center py-2">
          <p className="text-xs text-slate-500 mb-3">Saisissez votre code PIN à 4 chiffres :</p>
          <div className="flex justify-center gap-3 mb-2">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-mono font-bold transition ${
                  pin.length > idx 
                    ? 'border-blue-600 bg-blue-50 text-blue-900' 
                    : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                {pin.length > idx ? '•' : ''}
              </div>
            ))}
          </div>
          {error && <p className="text-xs text-red-600 font-bold mt-2 animate-in fade-in">{error}</p>}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                if (k === 'C') setPin('');
                else if (k === '⌫') setPin(p => p.slice(0, -1));
                else handleDigit(k);
              }}
              className={`h-12 rounded-xl font-bold text-base transition flex items-center justify-center ${
                k === 'C' || k === '⌫'
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs'
                  : 'bg-slate-50 hover:bg-blue-50 hover:text-blue-600 active:bg-blue-100 text-slate-800 border border-slate-200/80 shadow-2xs'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
