// Voice Command Recognition & NLP Engine for Retail POS (French language focused)
import { Product } from '../types';
import { soundEffects } from './sound';

export type VoiceIntentType = 
  | 'add_product' 
  | 'remove_product' 
  | 'clear_cart' 
  | 'checkout' 
  | 'unknown';

export interface VoiceCommandResult {
  rawTranscript: string;
  cleanedQuery: string;
  intent: VoiceIntentType;
  quantity: number;
  matchedProduct: Product | null;
  confidenceScore: number;
  message: string;
  success: boolean;
}

// French number dictionary mapping words to numeric values
const FRENCH_NUMBERS: Record<string, number> = {
  'zero': 0,
  'un': 1,
  'une': 1,
  'deux': 2,
  'trois': 3,
  'quatre': 4,
  'cinq': 5,
  'six': 6,
  'sept': 7,
  'huit': 8,
  'neuf': 9,
  'dix': 10,
  'onze': 11,
  'douze': 12,
  'treize': 13,
  'quatorze': 14,
  'quinze': 15,
  'seize': 16,
  'dix-sept': 17,
  'dix-huit': 18,
  'dix-neuf': 19,
  'vingt': 20,
  'vingt-et-un': 21,
  'vingt et un': 21,
  'vingt-deux': 22,
  'vingt-trois': 23,
  'vingt-quatre': 24,
  'vingt-cinq': 25,
  'trente': 30,
  'quarante': 40,
  'cinquante': 50,
  'soixante': 60,
  'soixante-dix': 70,
  'quatre-vingt': 80,
  'quatre-vingt-dix': 90,
  'cent': 100,
  'mille': 1000,
  'demi-douzaine': 6,
  'demi douzaine': 6,
  'douzaine': 12
};

// Normalize string for French accents and special characters
export function normalizeFrenchText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// French plural lemmatization (removes trailing s or x or common plural endings)
export function lemmatizeFrenchWord(word: string): string {
  if (!word || word.length <= 2) return word;
  if (word.endsWith('aux')) return word.slice(0, -3) + 'al';
  if (word.endsWith('eaux')) return word.slice(0, -1);
  if (word.endsWith('s') || word.endsWith('x')) return word.slice(0, -1);
  return word;
}

/**
 * Determine the intent of the spoken text.
 */
export function detectVoiceIntent(rawText: string): VoiceIntentType {
  const norm = normalizeFrenchText(rawText);

  // Clear cart triggers
  if (
    norm.includes('vide le panier') ||
    norm.includes('vider le panier') ||
    norm.includes('annule la commande') ||
    norm.includes('annuler la commande') ||
    norm.includes('annule le panier') ||
    norm.includes('efface le panier') ||
    norm.includes('effacer le panier') ||
    norm.includes('reinitialiser le panier') ||
    norm.includes('nettoyer le panier') ||
    norm === 'vider' ||
    norm === 'vide' ||
    norm === 'annuler'
  ) {
    return 'clear_cart';
  }

  // Checkout triggers
  if (
    norm.includes('encaisser') ||
    norm.includes('encaisse') ||
    norm.includes('valider la commande') ||
    norm.includes('valider le panier') ||
    norm.includes('passer au paiement') ||
    norm.includes('passer a la caisse') ||
    norm.includes('payer') ||
    norm.includes('reglement') ||
    norm.includes('facturer') ||
    norm === 'caisse'
  ) {
    return 'checkout';
  }

  // Remove item triggers
  if (
    norm.startsWith('supprime') ||
    norm.startsWith('supprimer') ||
    norm.startsWith('enleve') ||
    norm.startsWith('enlever') ||
    norm.startsWith('retire') ||
    norm.startsWith('retirer') ||
    norm.startsWith('moins') ||
    norm.includes('supprimer du panier') ||
    norm.includes('enlever du panier')
  ) {
    return 'remove_product';
  }

  return 'add_product';
}

/**
 * Parse quantity and extract clean search keywords from French speech transcript.
 */
export function extractQuantityAndQuery(rawText: string): { quantity: number; query: string } {
  let text = normalizeFrenchText(rawText);

  // 1. Remove polite expressions and conversational phrases
  const conversationalLeadPatterns = [
    /\b(s'il vous plait|s'il te plait|svp|stp|merci beaucoup|merci|bonjour|s'il vous plaît|s'il te plaît)\b/g,
    /\b(je voudrais|je veux|je vais prendre|je prends|j'aimerais|peux-tu ajouter|pouvez-vous ajouter)\b/g,
    /\b(donne-moi|donnez-moi|donne moi|donnez moi|prends-moi|prenez-moi|prends moi|prenez moi)\b/g,
    /\b(ajoute-moi|ajoutez-moi|ajoute moi|ajoutez moi|mets-moi|mettez-moi|mets moi|mettez moi)\b/g,
    /\b(ajoute|ajouter|ajoutez|rajoute|rajouter|rajoutez|mets|mettre|mettez|prends|prendre|prenez|commande|commander)\b/g,
    /\b(supprime|supprimer|enleve|enlever|retire|retirer)\b/g,
    /\b(au panier|dans le panier|sur le panier|du panier|pour le panier)\b/g
  ];

  for (const pattern of conversationalLeadPatterns) {
    text = text.replace(pattern, ' ');
  }

  text = text.replace(/\s+/g, ' ').trim();

  // 2. Scan for quantity anywhere in the text (both digit numbers and French words)
  let extractedQuantity = 1;
  let words = text.split(' ').filter(Boolean);
  const remainingWords: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Compound number check: "demi douzaine"
    if (word === 'demi' && words[i + 1] === 'douzaine') {
      extractedQuantity = 6;
      i++; // skip 'douzaine'
      continue;
    }

    // Direct numeric digits e.g. "2", "15"
    const parsedNum = parseInt(word, 10);
    if (!isNaN(parsedNum) && parsedNum > 0 && String(parsedNum) === word) {
      extractedQuantity = parsedNum;
      continue;
    }

    // Spoken French number words e.g. "deux", "trois"
    if (FRENCH_NUMBERS[word] !== undefined) {
      extractedQuantity = FRENCH_NUMBERS[word];
      continue;
    }

    remainingWords.push(word);
  }

  // 3. Strip remaining French articles, unit words, and generic fillers
  const fillersToStrip = new Set([
    'de', 'du', 'des', 'la', 'le', 'les', 'un', 'une', 'd', 'l', 'en', 'pour', 'avec',
    'article', 'articles', 'produit', 'produits', 'modele', 'modeles', 'reference', 'ref', 'code', 'piece', 'pieces'
  ]);

  const cleanTokens = remainingWords.filter(w => !fillersToStrip.has(w));

  return {
    quantity: Math.max(1, extractedQuantity),
    query: cleanTokens.join(' ').trim()
  };
}

/**
 * Robust product matching algorithm with token overlap, substring, SKU, and barcode support.
 */
export function matchProductByVoice(query: string, products: Product[]): { product: Product | null; score: number } {
  if (!query || products.length === 0) {
    return { product: null, score: 0 };
  }

  const normQuery = normalizeFrenchText(query);
  const rawTokens = normQuery.split(' ').filter(w => w.length >= 2);
  const lemmatizedQueryTokens = rawTokens.map(lemmatizeFrenchWord);

  let bestMatch: Product | null = null;
  let bestScore = 0;

  for (const product of products) {
    if (product.archived) continue;

    const normName = normalizeFrenchText(product.name);
    const normSku = normalizeFrenchText(product.sku || '');
    const normBarcode = normalizeFrenchText(product.barcode || '');
    const normCategory = normalizeFrenchText(product.category || '');

    let score = 0;

    // 1. Exact Barcode Match (100)
    if (product.barcode && (normBarcode === normQuery || normBarcode.replace(/[^a-z0-9]/g, '') === normQuery.replace(/[^a-z0-9]/g, ''))) {
      return { product, score: 100 };
    }

    // 2. Exact SKU Match (98)
    if (product.sku && (normSku === normQuery || normSku.replace(/[^a-z0-9]/g, '') === normQuery.replace(/[^a-z0-9]/g, ''))) {
      return { product, score: 98 };
    }

    // 3. Exact Name Match (95)
    if (normName === normQuery) {
      return { product, score: 95 };
    }

    // 4. Barcode / SKU contains query or query contains SKU (e.g. "w572" or "mae rob 001")
    if (product.sku && (normSku.includes(normQuery) || normQuery.includes(normSku))) {
      score = Math.max(score, 90);
    }
    if (product.barcode && (normBarcode.includes(normQuery) || normQuery.includes(normBarcode))) {
      score = Math.max(score, 90);
    }

    // 5. Product name contains query string directly
    if (normName.includes(normQuery)) {
      score = Math.max(score, 85);
    }

    // 6. Token Overlap & Lemmatized Matching
    if (lemmatizedQueryTokens.length > 0) {
      const nameRawTokens = normName.split(' ').filter(w => w.length >= 2);
      const nameLemmatizedTokens = nameRawTokens.map(lemmatizeFrenchWord);

      let matchedTokensCount = 0;

      for (const qTok of lemmatizedQueryTokens) {
        // Direct match with product name token
        const matchedInName = nameLemmatizedTokens.some(nTok => 
          nTok === qTok || 
          nTok.startsWith(qTok) || 
          qTok.startsWith(nTok) ||
          (qTok.length >= 4 && nTok.includes(qTok))
        );

        if (matchedInName) {
          matchedTokensCount += 1.0;
        } else if (normSku.includes(qTok) || normCategory.includes(qTok)) {
          matchedTokensCount += 0.7;
        }
      }

      const matchRatio = matchedTokensCount / lemmatizedQueryTokens.length;

      if (matchRatio >= 1.0) {
        // All query words found in product!
        score = Math.max(score, 80);
      } else if (matchRatio >= 0.65) {
        score = Math.max(score, 60);
      } else if (matchRatio >= 0.45) {
        score = Math.max(score, 40);
      } else if (matchedTokensCount >= 1.0) {
        // At least 1 full key word matched
        score = Math.max(score, 35);
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = product;
    }
  }

  // Minimum threshold to accept a match
  if (bestScore >= 30 && bestMatch) {
    return { product: bestMatch, score: bestScore };
  }

  return { product: null, score: bestScore };
}

/**
 * Text-to-speech feedback in French
 */
export function speakFeedback(text: string, enabled = true): void {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const frVoice = voices.find(v => v.lang.startsWith('fr') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Amelie') || v.name.includes('Thomas')));
    if (frVoice) {
      utterance.voice = frVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}

/**
 * Check if the browser supports Speech Recognition
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

/**
 * Main parser translating raw transcript into actionable POS command.
 */
export function parseVoiceCommand(transcript: string, products: Product[]): VoiceCommandResult {
  const trimmed = (transcript || '').trim();
  if (!trimmed) {
    return {
      rawTranscript: '',
      cleanedQuery: '',
      intent: 'unknown',
      quantity: 1,
      matchedProduct: null,
      confidenceScore: 0,
      message: 'Aucune parole détectée. Veuillez parler distinctement.',
      success: false
    };
  }

  const intent = detectVoiceIntent(trimmed);

  if (intent === 'clear_cart') {
    return {
      rawTranscript: trimmed,
      cleanedQuery: '',
      intent,
      quantity: 1,
      matchedProduct: null,
      confidenceScore: 99,
      message: 'Panier vidé avec succès',
      success: true
    };
  }

  if (intent === 'checkout') {
    return {
      rawTranscript: trimmed,
      cleanedQuery: '',
      intent,
      quantity: 1,
      matchedProduct: null,
      confidenceScore: 99,
      message: 'Passage en caisse pour règlement',
      success: true
    };
  }

  // Extract quantity and target query
  const { quantity, query } = extractQuantityAndQuery(trimmed);

  // If query is empty, try raw transcript without numbers
  const effectiveQuery = query || trimmed.replace(/[0-9]/g, '').trim();

  if (!effectiveQuery) {
    return {
      rawTranscript: trimmed,
      cleanedQuery: '',
      intent,
      quantity,
      matchedProduct: null,
      confidenceScore: 0,
      message: 'Veuillez préciser le nom ou le modèle de l’article.',
      success: false
    };
  }

  // Match against catalog
  const { product, score } = matchProductByVoice(effectiveQuery, products);

  if (!product) {
    return {
      rawTranscript: trimmed,
      cleanedQuery: effectiveQuery,
      intent,
      quantity,
      matchedProduct: null,
      confidenceScore: score,
      message: `Article non trouvé pour "${effectiveQuery}". Essayez un mot-clé du nom (ex: Koko Dunda, Savon, Parfum).`,
      success: false
    };
  }

  const actionVerb = intent === 'remove_product' ? 'retiré(e)(s)' : 'ajouté(e)(s)';
  return {
    rawTranscript: trimmed,
    cleanedQuery: effectiveQuery,
    intent,
    quantity,
    matchedProduct: product,
    confidenceScore: score,
    message: `${quantity} × ${product.name} ${actionVerb}`,
    success: true
  };
}
