// Ultra-Polished Voice Command Recognition & NLP Engine for Retail POS (French language focused)
import { Product } from '../types';

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

// French single digits and numbers dictionary
const FRENCH_NUMBER_WORDS: Record<string, number> = {
  'zero': 0, 'un': 1, 'une': 1, 'deux': 2, 'trois': 3, 'quatre': 4,
  'cinq': 5, 'six': 6, 'sept': 7, 'huit': 8, 'neuf': 9, 'dix': 10,
  'onze': 11, 'douze': 12, 'treize': 13, 'quatorze': 14, 'quinze': 15,
  'seize': 16, 'dix-sept': 17, 'dix-huit': 18, 'dix-neuf': 19,
  'vingt': 20, 'trente': 30, 'quarante': 40, 'cinquante': 50,
  'soixante': 60, 'septante': 70, 'quatre-vingt': 80, 'quatre-vingts': 80,
  'octante': 80, 'huitante': 80, 'nonante': 90, 'quatre-vingt-dix': 90,
  'cent': 100, 'cents': 100, 'mille': 1000
};

// Common phonetic replacements for retail & French speech recognition quirks
const PHONETIC_SYNONYMS: Record<string, string> = {
  'dounda': 'dunda',
  'doundah': 'dunda',
  'coco': 'koko',
  'danfany': 'danfani',
  'danphani': 'danfani',
  'fasodanfani': 'danfani',
  'carite': 'karite',
  'courcuma': 'curcuma',
  'kourkouma': 'curcuma',
  'kurkuma': 'curcuma',
  'sahelien': 'sahel',
  'sahelienne': 'sahel',
  'vitamine-c': 'vitamine c',
  'vitc': 'vitamine c',
  'tsirt': 'tshirt',
  'tee-shirt': 'tshirt',
  'teeshirt': 'tshirt'
};

/**
 * Normalizes French text: removes accents, unifies apostrophes, converts spoken letter names
 * (e.g. "double v" -> "w") and standardizes spaces.
 */
export function normalizeFrenchText(text: string): string {
  if (!text) return '';
  let str = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .replace(/[’']/g, "'")
    // Convert spoken letters e.g. "double v" / "double vé" -> "w"
    .replace(/\bdouble\s*v[eé]?\b/g, 'w')
    .replace(/\bdouble-v\b/g, 'w')
    .replace(/\btiret\b/g, '-')
    .replace(/\btiret du bas\b/g, '_')
    .replace(/\bpoint\b/g, '.')
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return str;
}

/**
 * Converts spelled-out digit sequences to digits, especially for model numbers & SKUs
 * (e.g. "cinq sept deux" -> "572", "cinq cent soixante douze" -> "572", "deux cinq cinq" -> "255")
 */
export function convertSpokenNumbersToDigits(text: string): string {
  const words = text.split(' ').filter(Boolean);
  const result: string[] = [];

  let i = 0;
  while (i < words.length) {
    const word = words[i];

    // Check if current word is a single digit word (zero through neuf)
    const singleDigitMap: Record<string, string> = {
      'zero': '0', 'un': '1', 'une': '1', 'deux': '2', 'trois': '3',
      'quatre': '4', 'cinq': '5', 'six': '6', 'sept': '7', 'huit': '8', 'neuf': '9'
    };

    // Check sequence of 2 or more consecutive single digits (e.g. "cinq sept deux" -> 572)
    if (singleDigitMap[word] !== undefined && i + 1 < words.length && singleDigitMap[words[i + 1]] !== undefined) {
      let digitSeq = '';
      while (i < words.length && singleDigitMap[words[i]] !== undefined) {
        digitSeq += singleDigitMap[words[i]];
        i++;
      }
      result.push(digitSeq);
      continue;
    }

    // Check compound French numbers like "cinq cent soixante-douze" -> 572
    if (FRENCH_NUMBER_WORDS[word] !== undefined && i + 1 < words.length && (words[i + 1] === 'cent' || words[i + 1] === 'cents')) {
      const mult = FRENCH_NUMBER_WORDS[word] || 1;
      let sum = mult * 100;
      i += 2; // consumed multiplier and "cent"
      if (i < words.length && FRENCH_NUMBER_WORDS[words[i]] !== undefined) {
        sum += FRENCH_NUMBER_WORDS[words[i]];
        i++;
        if (i < words.length && words[i] === 'et' && i + 1 < words.length && FRENCH_NUMBER_WORDS[words[i + 1]] !== undefined) {
          sum += FRENCH_NUMBER_WORDS[words[i + 1]];
          i += 2;
        } else if (i < words.length && FRENCH_NUMBER_WORDS[words[i]] !== undefined && FRENCH_NUMBER_WORDS[words[i]] < 10) {
          sum += FRENCH_NUMBER_WORDS[words[i]];
          i++;
        }
      }
      result.push(String(sum));
      continue;
    }

    // Check two-word numbers like "soixante douze" -> 72 or "vingt cinq" -> 25
    if (FRENCH_NUMBER_WORDS[word] !== undefined && FRENCH_NUMBER_WORDS[word] >= 20 && FRENCH_NUMBER_WORDS[word] <= 90) {
      let sum = FRENCH_NUMBER_WORDS[word];
      if (i + 1 < words.length && words[i + 1] === 'et' && i + 2 < words.length && FRENCH_NUMBER_WORDS[words[i + 2]] !== undefined) {
        sum += FRENCH_NUMBER_WORDS[words[i + 2]];
        i += 3;
        result.push(String(sum));
        continue;
      } else if (i + 1 < words.length && FRENCH_NUMBER_WORDS[words[i + 1]] !== undefined && FRENCH_NUMBER_WORDS[words[i + 1]] < 20) {
        sum += FRENCH_NUMBER_WORDS[words[i + 1]];
        i += 2;
        result.push(String(sum));
        continue;
      }
    }

    result.push(word);
    i++;
  }

  return result.join(' ');
}

/**
 * Lemmatizes French words (strips trailing plural 's', 'x', 'eaux', 'aux')
 */
export function lemmatizeFrenchWord(word: string): string {
  if (!word || word.length <= 2) return word;
  if (word.endsWith('eaux')) return word.slice(0, -1);
  if (word.endsWith('aux') && word.length > 4) return word.slice(0, -3) + 'al';
  if (word.endsWith('s') || word.endsWith('x')) return word.slice(0, -1);
  return word;
}

/**
 * Standard Levenshtein distance
 */
function levenshteinDistance(s1: string, s2: string): number {
  if (s1 === s2) return 0;
  if (!s1.length) return s2.length;
  if (!s2.length) return s1.length;

  const d: number[][] = [];
  for (let i = 0; i <= s1.length; i++) d[i] = [i];
  for (let j = 0; j <= s2.length; j++) d[0][j] = j;

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
    }
  }

  return d[s1.length][s2.length];
}

/**
 * Similarity score between two tokens [0..1]
 */
function tokenSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (!a || !b) return 0.0;
  if (a.includes(b) || b.includes(a)) {
    return Math.min(a.length, b.length) / Math.max(a.length, b.length);
  }
  const maxLen = Math.max(a.length, b.length);
  if (maxLen <= 2) return a === b ? 1.0 : 0.0;
  const dist = levenshteinDistance(a, b);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Detect voice intent: clear_cart, checkout, remove_product, add_product.
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
    norm.includes('annuler le panier') ||
    norm.includes('efface le panier') ||
    norm.includes('effacer le panier') ||
    norm.includes('reinitialiser le panier') ||
    norm.includes('nettoyer le panier') ||
    norm.includes('tout supprimer') ||
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
    norm.includes('cloturer la vente') ||
    norm === 'caisse' ||
    norm === 'encaisser'
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
    norm.includes('enlever du panier') ||
    norm.includes('retirer du panier')
  ) {
    return 'remove_product';
  }

  return 'add_product';
}

/**
 * Parse quantity from French tokens (e.g. "deux", "3", "vingt-cinq", "demi-douzaine", "douzaine")
 */
function parseQuantityAtToken(token: string): number | null {
  if (!token) return null;
  const num = parseInt(token, 10);
  if (!isNaN(num) && num > 0 && String(num) === token) {
    return num;
  }
  if (token === 'demi-douzaine' || token === 'demidouzaine') return 6;
  if (token === 'douzaine') return 12;
  if (FRENCH_NUMBER_WORDS[token] !== undefined && FRENCH_NUMBER_WORDS[token] > 0) {
    return FRENCH_NUMBER_WORDS[token];
  }
  return null;
}

/**
 * Extracts quantity and cleaned query from spoken text.
 * Handles both prefix quantity ("2 robes", "trois savons") and postfix quantity ("robes quantité 3", "savon fois 2").
 */
export function extractQuantityAndQuery(rawText: string, products: Product[] = []): { quantity: number; query: string } {
  let text = normalizeFrenchText(rawText);
  text = convertSpokenNumbersToDigits(text);

  // 1. Remove polite expressions and conversational phrases
  const conversationalLeadPatterns = [
    /\b(s'il vous plait|s'il te plait|svp|stp|merci beaucoup|merci|bonjour|bonsoir)\b/g,
    /\b(je voudrais|je veux|je vais prendre|je prends|j'aimerais|peux-tu ajouter|pouvez-vous ajouter)\b/g,
    /\b(donne-moi|donnez-moi|donne moi|donnez moi|prends-moi|prenez-moi|prends moi|prenez moi)\b/g,
    /\b(ajoute-moi|ajoutez-moi|ajoute moi|ajoutez moi|mets-moi|mettez-moi|mets moi|mettez moi)\b/g,
    /\b(ajoute|ajouter|ajoutez|rajoute|rajouter|rajoutez|mets|mettre|mettez|prends|prendre|prenez|commande|commander)\b/g,
    /\b(supprime|supprimer|enleve|enlever|retire|retirer)\b/g,
    /\b(au panier|dans le panier|sur le panier|du panier|pour le panier|en caisse|a la caisse)\b/g
  ];

  for (const pattern of conversationalLeadPatterns) {
    text = text.replace(pattern, ' ');
  }

  text = text.replace(/\s+/g, ' ').trim();

  // 2. Identify if any number in the text is actually part of an existing product's SKU or name
  // (e.g. "W572", "001", "MAE-ROB-001", "Huile 5L", "Lot de 3")
  const productSpecificNumbers = new Set<string>();
  for (const p of products) {
    const skuMatches = (p.sku || '').match(/\d+/g);
    if (skuMatches) skuMatches.forEach(m => productSpecificNumbers.add(m));
    const nameMatches = (p.name || '').match(/\d+/g);
    if (nameMatches) nameMatches.forEach(m => productSpecificNumbers.add(m));
    if (p.barcode) {
      productSpecificNumbers.add(p.barcode);
    }
  }

  const words = text.split(' ').filter(Boolean);
  let extractedQuantity = 1;
  const filteredWords: string[] = [];

  // Check postfix patterns first: e.g. "fois 3", "quantite 2", "x 4"
  for (let idx = 0; idx < words.length; idx++) {
    const w = words[idx];
    if ((w === 'fois' || w === 'quantite' || w === 'x') && idx + 1 < words.length) {
      const nextNum = parseQuantityAtToken(words[idx + 1]);
      if (nextNum !== null && nextNum > 0) {
        extractedQuantity = nextNum;
        words.splice(idx, 2);
        idx--;
        continue;
      }
    }
  }

  // Check prefix quantity (e.g. "3 robes" or "trois robes")
  let quantityFound = extractedQuantity > 1;
  for (let idx = 0; idx < words.length; idx++) {
    const w = words[idx];
    const candidateQty = parseQuantityAtToken(w);

    if (candidateQty !== null && !quantityFound) {
      // If this number belongs to a known SKU or product model (and is not alone), protect it!
      const isProductPart = productSpecificNumbers.has(w) && words.length > 1;
      if (!isProductPart) {
        extractedQuantity = candidateQty;
        quantityFound = true;
        continue;
      }
    }

    filteredWords.push(w);
  }

  // 3. Strip remaining French articles, unit words, and generic fillers
  const fillersToStrip = new Set([
    'de', 'du', 'des', 'la', 'le', 'les', 'un', 'une', 'd', 'l', 'en', 'pour', 'avec',
    'article', 'articles', 'produit', 'produits', 'modele', 'modeles', 'reference', 'ref',
    'piece', 'pieces', 'bouteille', 'bouteilles', 'flacon', 'flacons', 'sachet', 'sachets',
    'boite', 'boites', 'paquet', 'paquets', 'exemplaire', 'exemplaires'
  ]);

  const cleanTokens = filteredWords
    .filter(w => !fillersToStrip.has(w))
    .map(w => PHONETIC_SYNONYMS[w] || w);

  return {
    quantity: Math.max(1, extractedQuantity),
    query: cleanTokens.join(' ').trim()
  };
}

/**
 * Universal, Ultra-Accurate Multi-Tier Product Matching Engine.
 * Evaluates barcodes, SKUs, exact phrases, concatenated letters, and phonetic similarity.
 */
export function matchProductByVoice(query: string, products: Product[]): { product: Product | null; score: number } {
  if (!query || products.length === 0) {
    return { product: null, score: 0 };
  }

  const normQuery = normalizeFrenchText(query);
  const queryDigitsConverted = convertSpokenNumbersToDigits(normQuery);
  const queryNoSpace = normQuery.replace(/[^a-z0-9]/g, '');
  const queryDigitsNoSpace = queryDigitsConverted.replace(/[^a-z0-9]/g, '');

  const queryTokens = queryDigitsConverted.split(' ').filter(w => w.length >= 2);
  const lemmatizedQueryWords = queryTokens.map(lemmatizeFrenchWord);

  let bestMatch: Product | null = null;
  let bestScore = 0;

  for (const product of products) {
    if (product.archived) continue;

    const normName = normalizeFrenchText(product.name);
    const normSku = normalizeFrenchText(product.sku || '');
    const normBarcode = normalizeFrenchText(product.barcode || '');
    const normCategory = normalizeFrenchText(product.category || '');

    const nameNoSpace = normName.replace(/[^a-z0-9]/g, '');
    const skuNoSpace = normSku.replace(/[^a-z0-9]/g, '');
    const barcodeNoSpace = normBarcode.replace(/[^a-z0-9]/g, '');

    let score = 0;

    // 1. Exact Barcode Match (100)
    if (product.barcode && (normBarcode === normQuery || barcodeNoSpace === queryNoSpace || barcodeNoSpace === queryDigitsNoSpace)) {
      return { product, score: 100 };
    }

    // 2. Exact SKU Match (98)
    if (product.sku && (normSku === normQuery || skuNoSpace === queryNoSpace || skuNoSpace === queryDigitsNoSpace)) {
      return { product, score: 98 };
    }

    // 3. Exact Name Match (96)
    if (normName === normQuery || nameNoSpace === queryNoSpace) {
      return { product, score: 96 };
    }

    // 4. Barcode / SKU contains query digits or query matches SKU model (e.g. "w572", "mae-rob-001", "001")
    if (queryDigitsNoSpace.length >= 2) {
      if (skuNoSpace && (skuNoSpace.includes(queryDigitsNoSpace) || queryDigitsNoSpace.includes(skuNoSpace))) {
        score = Math.max(score, 94);
      }
      if (barcodeNoSpace && (barcodeNoSpace.endsWith(queryDigitsNoSpace) || barcodeNoSpace.includes(queryDigitsNoSpace))) {
        score = Math.max(score, 93);
      }
    }

    // 5. Product name contains query string directly or query contains product name
    if (normName.includes(normQuery) || (normQuery.length >= 3 && normName.includes(normQuery))) {
      score = Math.max(score, 90);
    }
    if (normQuery.includes(normName) && normName.length >= 4) {
      score = Math.max(score, 88);
    }

    // 6. Concatenated name match (e.g. "kokodunda" -> "koko dunda", "danfani" -> "faso dan fani")
    if (nameNoSpace.includes(queryNoSpace) || nameNoSpace.includes(queryDigitsNoSpace)) {
      score = Math.max(score, 86);
    }
    if (queryNoSpace.includes(nameNoSpace) || queryDigitsNoSpace.includes(nameNoSpace)) {
      score = Math.max(score, 85);
    }

    // 7. Token Overlap, Lemmatization, and Typos Similarity
    if (lemmatizedQueryWords.length > 0) {
      const nameRawWords = normName.split(' ').filter(w => w.length >= 2);
      const nameLemmatizedWords = nameRawWords.map(lemmatizeFrenchWord);

      let matchedTokensScore = 0;
      let exactWordMatchesCount = 0;

      for (const qWord of lemmatizedQueryWords) {
        let bestTokenScore = 0;

        for (const nWord of nameLemmatizedWords) {
          if (nWord === qWord) {
            bestTokenScore = Math.max(bestTokenScore, 1.0);
            exactWordMatchesCount++;
          } else if (nWord.startsWith(qWord) || qWord.startsWith(nWord)) {
            bestTokenScore = Math.max(bestTokenScore, 0.92);
          } else if (nWord.includes(qWord) || qWord.includes(nWord)) {
            bestTokenScore = Math.max(bestTokenScore, 0.85);
          } else {
            const sim = tokenSimilarity(qWord, nWord);
            if (sim >= 0.72) {
              bestTokenScore = Math.max(bestTokenScore, sim * 0.9);
            }
          }
        }

        // Also check if token matches SKU, Model or Category (e.g. "parfum", "robe", "savon", "soin", "sac")
        if (bestTokenScore < 0.7) {
          if (normSku.includes(qWord)) {
            bestTokenScore = Math.max(bestTokenScore, 0.88);
          } else if (normCategory.includes(qWord)) {
            bestTokenScore = Math.max(bestTokenScore, 0.65);
          }
        }

        matchedTokensScore += bestTokenScore;
      }

      const ratio = matchedTokensScore / lemmatizedQueryWords.length;

      // Bonus for multiple exact matches (e.g. "savon" + "curcuma")
      const specificityBonus = exactWordMatchesCount > 1 ? 15 : 0;

      if (ratio >= 0.9) {
        score = Math.max(score, 84 + specificityBonus);
      } else if (ratio >= 0.7) {
        score = Math.max(score, 70 + specificityBonus);
      } else if (ratio >= 0.5) {
        score = Math.max(score, 52 + specificityBonus);
      } else if (matchedTokensScore >= 0.85) {
        score = Math.max(score, 40 + specificityBonus);
      }
    }

    // Update champion product
    if (score > bestScore) {
      bestScore = score;
      bestMatch = product;
    }
  }

  // Acceptance threshold (score >= 25 ensures even single distinctive keywords match cleanly)
  if (bestScore >= 25 && bestMatch) {
    return { product: bestMatch, score: bestScore };
  }

  return { product: null, score: bestScore };
}

/**
 * Text-to-speech speaker in French with pitch & rate tuning
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
    utterance.volume = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const frVoice = voices.find(v => 
      v.lang.startsWith('fr') && 
      (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Amelie') || v.name.includes('Thomas') || v.name.includes('French'))
    ) || voices.find(v => v.lang.startsWith('fr'));

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
 * Main parser translating raw speech into actionable POS command.
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
      message: 'Aucune parole détectée. Parlez clairement face à votre micro.',
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

  // Extract quantity and search query
  const { quantity, query } = extractQuantityAndQuery(trimmed, products);

  // Fallback: If query was completely stripped by fillers, use trimmed text without digits
  const effectiveQuery = query || trimmed.replace(/[0-9]/g, '').trim();

  if (!effectiveQuery) {
    return {
      rawTranscript: trimmed,
      cleanedQuery: '',
      intent,
      quantity,
      matchedProduct: null,
      confidenceScore: 0,
      message: 'Veuillez préciser le nom, modèle ou la référence de l’article.',
      success: false
    };
  }

  // Match against store catalog
  const { product, score } = matchProductByVoice(effectiveQuery, products);

  if (!product) {
    return {
      rawTranscript: trimmed,
      cleanedQuery: effectiveQuery,
      intent,
      quantity,
      matchedProduct: null,
      confidenceScore: score,
      message: `Article non trouvé pour « ${effectiveQuery} ». Essayez un mot-clé du nom ou modèle.`,
      success: false
    };
  }

  const actionVerb = intent === 'remove_product' ? 'retiré(e)' : 'ajouté(e)';
  const pluralSuffix = quantity > 1 ? 's' : '';

  return {
    rawTranscript: trimmed,
    cleanedQuery: effectiveQuery,
    intent,
    quantity,
    matchedProduct: product,
    confidenceScore: score,
    message: `${quantity} × ${product.name} ${actionVerb}${pluralSuffix}`,
    success: true
  };
}
