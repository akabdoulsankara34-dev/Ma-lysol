import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  X, 
  Trash2, 
  Radio,
  ShoppingBag,
  Zap,
  Play,
  Send,
  ExternalLink,
  RefreshCw,
  Lock
} from 'lucide-react';
import { Product } from '../../types';
import { 
  parseVoiceCommand, 
  isSpeechRecognitionSupported, 
  speakFeedback,
  VoiceCommandResult 
} from '../../lib/voiceCommandService';
import { soundEffects } from '../../lib/sound';

interface VoiceCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddToCart: (product: Product, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  voiceTtsEnabled: boolean;
  setVoiceTtsEnabled: (enabled: boolean) => void;
  continuousMode: boolean;
  setContinuousMode: (continuous: boolean) => void;
}

export interface VoiceLogItem {
  id: string;
  timestamp: string;
  transcript: string;
  success: boolean;
  message: string;
  product?: Product | null;
  quantity?: number;
}

export const VoiceCommandModal: React.FC<VoiceCommandModalProps> = ({
  isOpen,
  onClose,
  products,
  onAddToCart,
  onRemoveFromCart,
  onClearCart,
  onCheckout,
  voiceTtsEnabled,
  setVoiceTtsEnabled,
  continuousMode,
  setContinuousMode
}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastResult, setLastResult] = useState<VoiceCommandResult | null>(null);
  const [voiceLogs, setVoiceLogs] = useState<VoiceLogItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState<boolean>(false);
  const [manualInput, setManualInput] = useState('');
  const [showExamples, setShowExamples] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const restartTimerRef = useRef<any>(null);
  const latestTranscriptRef = useRef<string>('');
  const lastExecutedTextRef = useRef<string>('');
  const isContinuousActiveRef = useRef<boolean>(continuousMode);
  isContinuousActiveRef.current = continuousMode;

  const handleExecuteVoiceCommand = useCallback((transcript: string) => {
    const trimmed = (transcript || '').trim();
    if (!trimmed) return;

    // Prevent duplicate rapid execution of the exact same spoken snippet
    if (trimmed.toLowerCase() === lastExecutedTextRef.current.toLowerCase()) {
      return;
    }
    lastExecutedTextRef.current = trimmed;

    const result = parseVoiceCommand(trimmed, products);
    setLastResult(result);

    const logItem: VoiceLogItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      transcript: trimmed,
      success: result.success,
      message: result.message,
      product: result.matchedProduct,
      quantity: result.quantity
    };

    setVoiceLogs(prev => [logItem, ...prev].slice(0, 15));

    if (result.success) {
      if (result.intent === 'add_product' && result.matchedProduct) {
        soundEffects.playBarcodeBeep();
        onAddToCart(result.matchedProduct, result.quantity);
        speakFeedback(`${result.quantity} ${result.matchedProduct.name} ajouté`, voiceTtsEnabled);
      } else if (result.intent === 'remove_product' && result.matchedProduct) {
        soundEffects.playBarcodeBeep();
        onRemoveFromCart(result.matchedProduct.id);
        speakFeedback(`${result.matchedProduct.name} retiré`, voiceTtsEnabled);
      } else if (result.intent === 'clear_cart') {
        soundEffects.playCashDrawerSound();
        onClearCart();
        speakFeedback("Panier vidé", voiceTtsEnabled);
      } else if (result.intent === 'checkout') {
        soundEffects.playSaleChime();
        onCheckout();
        speakFeedback("Passage au règlement", voiceTtsEnabled);
      }
    } else {
      soundEffects.playBarcodeError();
      speakFeedback(result.message, voiceTtsEnabled);
    }
  }, [products, onAddToCart, onRemoveFromCart, onClearCart, onCheckout, voiceTtsEnabled]);

  const stopListening = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(() => {
    setErrorMessage(null);
    setIsPermissionDenied(false);
    setInterimTranscript('');
    latestTranscriptRef.current = '';
    lastExecutedTextRef.current = '';

    if (!isSpeechRecognitionSupported()) {
      setErrorMessage("La reconnaissance vocale nécessite Google Chrome, Microsoft Edge ou Safari.");
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'fr-FR';
      recognition.continuous = isContinuousActiveRef.current;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
        setIsPermissionDenied(false);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalPhrase = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalPhrase += transcriptChunk;
          } else {
            currentInterim += transcriptChunk;
          }
        }

        const candidate = finalPhrase.trim() || currentInterim.trim();
        if (candidate) {
          latestTranscriptRef.current = candidate;
        }

        if (currentInterim) {
          setInterimTranscript(currentInterim);
        }

        if (finalPhrase.trim()) {
          setInterimTranscript('');
          handleExecuteVoiceCommand(finalPhrase.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsPermissionDenied(true);
          setErrorMessage("L'accès au microphone est actuellement bloqué par le navigateur.");
          setIsListening(false);
        } else if (event.error === 'no-speech') {
          // Normal timeout between phrases
        } else if (event.error !== 'aborted') {
          setErrorMessage(`Signal audio : ${event.error}`);
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // Fallback: execute leftover transcript if final event was bypassed
        const leftover = latestTranscriptRef.current.trim();
        if (leftover && leftover.toLowerCase() !== lastExecutedTextRef.current.toLowerCase()) {
          latestTranscriptRef.current = '';
          setInterimTranscript('');
          handleExecuteVoiceCommand(leftover);
        }

        if (isContinuousActiveRef.current && isOpen) {
          restartTimerRef.current = setTimeout(() => {
            try {
              recognition.start();
            } catch {
              setIsListening(false);
            }
          }, 300);
        } else {
          setIsListening(false);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      if (err.name === 'NotAllowedError' || err.message?.includes('denied')) {
        setIsPermissionDenied(true);
        setErrorMessage("L'accès au microphone a été refusé.");
      } else {
        setErrorMessage("Cliquez sur le micro pour lancer l'écoute.");
      }
      setIsListening(false);
    }
  }, [handleExecuteVoiceCommand, isOpen]);

  // Check support on mount
  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
  }, []);

  // Stop listening when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopListening();
    }
  }, [isOpen, stopListening]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const openInDedicatedTab = () => {
    window.open(window.location.href, '_blank');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const phrase = manualInput.trim();
    setManualInput('');
    setInterimTranscript(phrase);
    setTimeout(() => {
      setInterimTranscript('');
      handleExecuteVoiceCommand(phrase);
    }, 250);
  };

  if (!isOpen) return null;

  // Real products from store inventory for instant 1-click test pills
  const sampleProducts = products.filter(p => !p.archived).slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50 via-purple-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-2xl transition-all ${
              isListening ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30' : 'bg-white text-rose-600 shadow-xs'
            }`}>
              <Mic className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-lg">Commande Vocale Caisse</h3>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  isListening ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-slate-200 text-slate-700'
                }`}>
                  {isListening ? 'Micro Ouvert' : 'En Pause'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Dictez vos articles en français : nom, modèle ou quantité
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopListening();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-full transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Permission Denied Recovery Banner */}
          {isPermissionDenied && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-3 text-amber-900 text-xs animate-in slide-in-from-top-2">
              <div className="flex items-start space-x-2.5">
                <Lock className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-sm text-amber-950">
                    Déblocage de l'accès au microphone
                  </p>
                  <p className="mt-1 text-amber-800 leading-relaxed">
                    Si votre navigateur bloque le micro (souvent le cas dans les fenêtres intégrées ou en mode aperçu), vous avez deux solutions simples :
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {/* Solution 1: Open in dedicated tab */}
                <button
                  type="button"
                  onClick={openInDedicatedTab}
                  className="px-3 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl flex items-center justify-center space-x-1.5 transition shadow-xs cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Ouvrir en plein écran</span>
                </button>

                {/* Solution 2: Retry with explicit click */}
                <button
                  type="button"
                  onClick={startListening}
                  className="px-3 py-2 bg-white hover:bg-amber-100 border border-amber-400 text-amber-900 font-bold rounded-xl flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4 text-amber-700" />
                  <span>Réessayer d'autoriser</span>
                </button>
              </div>

              <div className="p-2 bg-white/70 rounded-lg text-[11px] text-amber-900 border border-amber-200">
                💡 <strong>Astuce sur Chrome/Edge :</strong> Cliquez sur l'icône de réglages ou cadenas à gauche de l'adresse du site (en haut), puis réglez <em>Microphone</em> sur <strong>« Autoriser »</strong>.
              </div>
            </div>
          )}

          {/* Interactive Microphone Pulse Center */}
          <div className="flex flex-col items-center justify-center pt-1 pb-2">
            <div className="relative flex items-center justify-center">
              {/* Animated wave rings when listening */}
              {isListening && (
                <>
                  <div className="absolute w-36 h-36 rounded-full bg-rose-400/20 animate-ping pointer-events-none"></div>
                  <div className="absolute w-28 h-28 rounded-full bg-rose-500/30 animate-pulse pointer-events-none"></div>
                </>
              )}
              
              <button
                type="button"
                onClick={handleToggleListening}
                className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-300 transform active:scale-95 cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 text-white ring-4 ring-rose-200 hover:bg-rose-600 scale-105'
                    : 'bg-gradient-to-tr from-slate-800 to-slate-900 text-white hover:from-slate-700 hover:to-slate-800 ring-4 ring-slate-100 hover:scale-105'
                }`}
              >
                {isListening ? (
                  <>
                    <Mic className="h-9 w-9 animate-bounce" />
                    <span className="text-[10px] font-bold mt-1 tracking-wider uppercase">J'écoute...</span>
                  </>
                ) : (
                  <>
                    <MicOff className="h-9 w-9 text-slate-300" />
                    <span className="text-[10px] font-bold mt-1 tracking-wider uppercase text-slate-300">Activer Micro</span>
                  </>
                )}
              </button>
            </div>

            {/* Status text */}
            <p className="mt-3 text-xs sm:text-sm font-semibold text-slate-700 flex items-center space-x-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-rose-500 animate-pulse' : 'bg-slate-300'}`}></span>
              <span>
                {isListening 
                  ? "Microphone actif : Parlez maintenant..." 
                  : "Microphone en attente. Cliquez sur le bouton noir pour démarrer l'écoute."}
              </span>
            </p>

            {/* Live Interim Transcript or Result Display */}
            <div className="w-full mt-3 min-h-[56px] bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-center text-center">
              {errorMessage && !isPermissionDenied ? (
                <div className="flex items-center space-x-2 text-rose-600 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              ) : interimTranscript ? (
                <div className="flex items-center space-x-2 text-slate-900 text-sm font-bold animate-pulse">
                  <span className="text-rose-500">●</span>
                  <span>« {interimTranscript} »</span>
                </div>
              ) : lastResult ? (
                <div className={`text-xs font-semibold flex items-center space-x-2 ${lastResult.success ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {lastResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />}
                  <span>{lastResult.message}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">
                  Dites par exemple : « Ajoute 2 robes koko dunda » ou « 3 savons »
                </span>
              )}
            </div>
          </div>

          {/* Instant 1-Click Test Buttons from Real Inventory (Always works, even without mic) */}
          <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-bold text-purple-900 flex items-center space-x-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                <span>Test direct d'ajout au panier (1 clic) :</span>
              </div>
              <span className="text-[10px] text-purple-700">Cliquez pour tester immédiatement</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sampleProducts.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleExecuteVoiceCommand(`ajoute 1 ${p.name}`)}
                  className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-semibold transition shadow-2xs flex items-center space-x-1 cursor-pointer"
                >
                  <Play className="h-2.5 w-2.5 text-purple-600 fill-current" />
                  <span className="truncate max-w-[150px]">+1 {p.name}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleExecuteVoiceCommand("vider le panier")}
                className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition shadow-2xs flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="h-2.5 w-2.5 text-rose-600" />
                <span>Vider panier</span>
              </button>
            </div>
          </div>

          {/* Fallback Text Simulation Bar */}
          <form onSubmit={handleManualSubmit} className="relative">
            <input
              type="text"
              placeholder="Ou testez en tapant votre commande (ex: 2 robes, 3 savons, vider le panier)..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-24 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
            />
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
            >
              <span>Tester</span>
              <Send className="h-3 w-3" />
            </button>
          </form>

          {/* Controls Bar: Continuous mode toggle & TTS voice toggle */}
          <div className="grid grid-cols-2 gap-2.5 p-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            {/* Continuous / Handsfree toggle */}
            <button
              type="button"
              onClick={() => {
                const nextVal = !continuousMode;
                setContinuousMode(nextVal);
                if (isListening) {
                  stopListening();
                  setTimeout(() => startListening(), 200);
                }
              }}
              className={`flex items-center justify-between p-2 rounded-xl border transition cursor-pointer ${
                continuousMode
                  ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2 text-left">
                <Radio className={`h-4 w-4 shrink-0 ${continuousMode ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
                <div className="min-w-0">
                  <div className="font-bold leading-tight truncate">Mains-libres continu</div>
                  <div className="text-[10px] text-slate-500 font-normal truncate">Reste à l'écoute</div>
                </div>
              </div>
              <span className={`w-3.5 h-3.5 rounded-full border shrink-0 ${continuousMode ? 'bg-rose-500 border-rose-600' : 'bg-slate-200 border-slate-300'}`}></span>
            </button>

            {/* Text-To-Speech Voice Feedback toggle */}
            <button
              type="button"
              onClick={() => setVoiceTtsEnabled(!voiceTtsEnabled)}
              className={`flex items-center justify-between p-2 rounded-xl border transition cursor-pointer ${
                voiceTtsEnabled
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2 text-left">
                {voiceTtsEnabled ? (
                  <Volume2 className="h-4 w-4 text-indigo-600 shrink-0" />
                ) : (
                  <VolumeX className="h-4 w-4 text-slate-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="font-bold leading-tight truncate">Confirmation vocale</div>
                  <div className="text-[10px] text-slate-500 font-normal truncate">Répète l'article</div>
                </div>
              </div>
              <span className={`w-3.5 h-3.5 rounded-full border shrink-0 ${voiceTtsEnabled ? 'bg-indigo-500 border-indigo-600' : 'bg-slate-200 border-slate-300'}`}></span>
            </button>
          </div>

          {/* Guide & Examples Accordion */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowExamples(!showExamples)}
              className="w-full px-4 py-2 bg-white hover:bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <HelpCircle className="h-4 w-4 text-purple-600" />
                <span>Exemples de phrases supportées</span>
              </div>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md text-slate-500">
                {showExamples ? 'Masquer' : 'Afficher'}
              </span>
            </button>

            {showExamples && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2 text-xs">
                <div>
                  <div className="font-semibold text-slate-800 mb-1">Articles & Modèles :</div>
                  <div className="flex flex-wrap gap-1">
                    {[
                      "Ajoute 2 robes", 
                      "3 savons", 
                      "Mets 1 flacon", 
                      "Prends 2 koko dunda", 
                      "Modèle W572", 
                      "Donne-moi 2 tailleurs"
                    ].map((ex) => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => handleExecuteVoiceCommand(ex)}
                        className="px-2 py-0.5 bg-white hover:bg-purple-50 hover:text-purple-700 border border-slate-200 rounded-lg text-slate-600 font-medium transition cursor-pointer text-left"
                      >
                        « {ex} »
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-slate-800 mb-1">Actions rapides :</div>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { label: "Vider le panier", phrase: "Vider le panier" },
                      { label: "Encaisser / Payer", phrase: "Encaisser" },
                      { label: "Supprimer article", phrase: "Supprime le savon" }
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => handleExecuteVoiceCommand(item.phrase)}
                        className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium transition cursor-pointer text-left"
                      >
                        « {item.phrase} »
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Voice Activity Log */}
          {voiceLogs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Commandes récentes ({voiceLogs.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setVoiceLogs([])}
                  className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Effacer</span>
                </button>
              </div>

              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {voiceLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded-xl border flex items-center justify-between text-xs transition ${
                      log.success
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50/70 border-rose-200 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className={`p-1 rounded-lg shrink-0 ${log.success ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'}`}>
                        {log.success ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">« {log.transcript} »</div>
                        <div className="text-[10px] opacity-75 truncate">{log.message}</div>
                      </div>
                    </div>
                    <span className="text-[9px] opacity-60 font-mono shrink-0 ml-2">
                      {log.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>Raccourci clavier : <strong>Alt + V</strong> ou <strong>Ctrl + M</strong></span>
          </div>
          <button
            type="button"
            onClick={() => {
              stopListening();
              onClose();
            }}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
