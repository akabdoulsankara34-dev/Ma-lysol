import { soundEffects } from './sound';

export interface UsbScannerSettings {
  enabled: boolean;
  enableSound: boolean;
  azertyAutoFix: boolean;
  autoAddToCart: boolean;
  maxIntervalMs: number;
  minBarcodeLength: number;
  autoSubmitOnTimeout: boolean;
  suffixTimeoutMs: number;
}

export interface RawKeyStrokeEvent {
  key: string;
  code: string;
  intervalMs: number;
  timestamp: number;
  currentBuffer: string;
}

export interface LastScanInfo {
  raw: string;
  decoded: string;
  charCount: number;
  durationMs: number;
  avgIntervalMs: number;
  timestamp: number;
  isKeyboardWedge: boolean;
  terminator: 'enter' | 'tab' | 'timeout' | 'manual';
  azertyFixed: boolean;
  alternatives: string[];
}

const STORAGE_KEY = 'bizpilot_usb_scanner_settings';

const DEFAULT_SETTINGS: UsbScannerSettings = {
  enabled: true,
  enableSound: true,
  azertyAutoFix: true,
  autoAddToCart: true,
  maxIntervalMs: 180, // Generous 180ms threshold (supports USB hubs, Bluetooth, 2.4G dongles, Netum, Tera)
  minBarcodeLength: 3,
  autoSubmitOnTimeout: true, // Automatically commit scan if scanner has NO Enter suffix
  suffixTimeoutMs: 280, // 280ms pause after a burst of keys = scan complete
};

// Map French AZERTY top row characters to digits 0-9 (including caps and Belgian/Swiss variants)
const AZERTY_TO_DIGIT: Record<string, string> = {
  '&': '1',
  '1': '1',
  'é': '2',
  'É': '2',
  '2': '2',
  '"': '3',
  '3': '3',
  "'": '4',
  '4': '4',
  '(': '5',
  '5': '5',
  '-': '6',
  '§': '6',
  '|': '6',
  '6': '6',
  'è': '7',
  'È': '7',
  '7': '7',
  '_': '8',
  '!': '8',
  '8': '8',
  'ç': '9',
  'Ç': '9',
  '9': '9',
  'à': '0',
  'À': '0',
  '0': '0',
};

// Swaps for QWERTY vs AZERTY letter transpositions (crucial for model codes like W572 <-> Z572)
const AZERTY_QWERTY_SWAPS: Record<string, string> = {
  'a': 'q', 'A': 'Q',
  'q': 'a', 'Q': 'A',
  'z': 'w', 'Z': 'W',
  'w': 'z', 'W': 'Z',
  'm': ',', 'M': '?',
};

/**
 * Strips AIM Symbology Identifiers (e.g. ]e0 for EAN, ]C1 for Code 128, ]A0 for Code 39, ]Q1 for QR, ]d1 for DataMatrix)
 * and non-printable ASCII control characters (\x00-\x1F, \x7F).
 */
export function stripAimAndControlChars(str: string): string {
  if (!str) return '';
  // Strip non-printable ASCII control chars
  let cleaned = str.replace(/[\x00-\x1F\x7F]/g, '');
  // Strip AIM prefix if present (']' followed by 1 to 3 alphanumeric characters)
  cleaned = cleaned.replace(/^\][a-zA-Z0-9]{1,3}/, '');
  return cleaned.trim();
}

/**
 * Transposes alphanumeric letters between AZERTY and QWERTY (e.g. Z572 <-> W572)
 */
export function transposeAzertyQwertyLetters(str: string): string {
  if (!str) return '';
  let result = '';
  for (const ch of str) {
    result += AZERTY_QWERTY_SWAPS[ch] || ch;
  }
  return result;
}

/**
 * Normalizes barcode string handling AZERTY keyboard conversion if needed.
 * For instance, if an EAN-13 was scanned on an AZERTY keyboard without shift,
 * '&é"\'(-è_çà' becomes '1234567890'.
 */
export function normalizeBarcode(rawText: string, azertyFix = true): string {
  if (!rawText) return '';
  const trimmed = stripAimAndControlChars(rawText);

  if (!azertyFix) {
    return trimmed;
  }

  let azertyConverted = '';
  let hasAzertyChar = false;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (AZERTY_TO_DIGIT[char] !== undefined) {
      azertyConverted += AZERTY_TO_DIGIT[char];
      if (char !== AZERTY_TO_DIGIT[char]) {
        hasAzertyChar = true;
      }
    } else {
      azertyConverted += char;
    }
  }

  // If converting produced digits or resolved AZERTY symbols
  if (hasAzertyChar && /^\d+$/.test(azertyConverted)) {
    return azertyConverted;
  }

  return trimmed;
}

/**
 * Generates an array of all possible barcode interpretations
 * (raw, stripped AIM, azerty-converted, code-based, letter-transposed, sanitized, zero-padded)
 */
export function generateBarcodeAlternatives(raw: string, codeBased = ''): string[] {
  const alts = new Set<string>();
  const cleanRaw = (raw || '').trim();
  const strippedRaw = stripAimAndControlChars(cleanRaw);

  const baseCandidates = [cleanRaw, strippedRaw, (codeBased || '').trim()];

  baseCandidates.forEach((cand) => {
    if (!cand) return;
    alts.add(cand);
    alts.add(cand.toLowerCase());
    alts.add(cand.toUpperCase());
    alts.add(cand.replace(/[-\s._/]/g, ''));

    // AZERTY digit conversion
    const azerty = normalizeBarcode(cand, true);
    if (azerty) {
      alts.add(azerty);
      alts.add(azerty.toLowerCase());
      alts.add(azerty.toUpperCase());
      alts.add(azerty.replace(/[-\s._/]/g, ''));
    }

    // Letter transposition (e.g. W572 <-> Z572)
    const transposed = transposeAzertyQwertyLetters(cand);
    if (transposed && transposed !== cand) {
      alts.add(transposed);
      alts.add(transposed.toLowerCase());
      alts.add(transposed.toUpperCase());
      alts.add(transposed.replace(/[-\s._/]/g, ''));

      const transposedAzerty = normalizeBarcode(transposed, true);
      if (transposedAzerty) {
        alts.add(transposedAzerty);
        alts.add(transposedAzerty.toLowerCase());
        alts.add(transposedAzerty.toUpperCase());
      }
    }
  });

  // EAN-13 vs UPC-A: 12-digit code with leading zero & 13-digit code starting with 0
  Array.from(alts).forEach((val) => {
    if (/^\d{12}$/.test(val)) {
      alts.add('0' + val);
    } else if (/^0\d{12}$/.test(val)) {
      alts.add(val.substring(1));
    }
  });

  return Array.from(alts).filter(Boolean);
}

type ScanCallback = (barcode: string, scanInfo: LastScanInfo) => void;
type RawKeyCallback = (event: RawKeyStrokeEvent) => void;
type FocusCallback = (isFocused: boolean) => void;

class UsbBarcodeScannerService {
  private settings: UsbScannerSettings;
  private listeners: Set<ScanCallback> = new Set();
  private rawKeyListeners: Set<RawKeyCallback> = new Set();
  private focusListeners: Set<FocusCallback> = new Set();

  private keyBuffer: { key: string; code: string; time: number }[] = [];
  private autoSubmitTimer: ReturnType<typeof setTimeout> | null = null;
  private bufferExpiryTimer: ReturnType<typeof setTimeout> | null = null;
  private lastScanInfo: LastScanInfo | null = null;
  private lastEnterTimestamp = 0;
  private isInitialized = false;
  private windowFocused = true;

  constructor() {
    this.settings = this.loadSettings();
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private loadSettings(): UsbScannerSettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore storage error
    }
    return { ...DEFAULT_SETTINGS };
  }

  public saveSettings(newSettings: Partial<UsbScannerSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {}
  }

  public getSettings(): UsbScannerSettings {
    return { ...this.settings };
  }

  public getLastScanInfo(): LastScanInfo | null {
    return this.lastScanInfo;
  }

  public isWindowFocused(): boolean {
    if (typeof document !== 'undefined') {
      return document.hasFocus();
    }
    return this.windowFocused;
  }

  public focusApplication() {
    if (typeof window !== 'undefined') {
      try {
        window.focus();
        document.body?.focus();
      } catch {}
      this.setWindowFocused(true);
    }
  }

  public onFocusChange(callback: FocusCallback): () => void {
    this.focusListeners.add(callback);
    // Emit immediate current state
    callback(this.isWindowFocused());
    return () => {
      this.focusListeners.delete(callback);
    };
  }

  private setWindowFocused(focused: boolean) {
    if (this.windowFocused !== focused) {
      this.windowFocused = focused;
      this.focusListeners.forEach((cb) => {
        try {
          cb(focused);
        } catch {}
      });
    }
  }

  public subscribe(callback: ScanCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public subscribeRawKeys(callback: RawKeyCallback): () => void {
    this.rawKeyListeners.add(callback);
    return () => {
      this.rawKeyListeners.delete(callback);
    };
  }

  public notifyListeners(barcode: string, info: LastScanInfo) {
    this.listeners.forEach((cb) => {
      try {
        cb(barcode, info);
      } catch (err) {
        console.error('Erreur listener scanner:', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('bizpilot:usb-barcode-scanned', {
          detail: { barcode, scanInfo: info },
        })
      );
    }
  }

  public playBeep() {
    if (this.settings.enableSound) {
      soundEffects.playBarcodeBeep();
    }
  }

  public playError() {
    if (this.settings.enableSound) {
      soundEffects.playBarcodeError();
    }
  }

  private init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Use capture phase on BOTH window and document to intercept scanner keys before inputs consume them
    window.addEventListener('keydown', this.handleKeyDown, { capture: true, passive: false });
    document.addEventListener('keydown', this.handleKeyDown, { capture: true, passive: false });

    // Window focus tracking
    window.addEventListener('focus', () => this.setWindowFocused(true));
    window.addEventListener('blur', () => this.setWindowFocused(false));
    document.addEventListener('visibilitychange', () => {
      this.setWindowFocused(!document.hidden && document.hasFocus());
    });
    // On click anywhere in the window, restore active focus
    window.addEventListener('click', () => {
      this.setWindowFocused(true);
    }, { passive: true });
  }

  private lastCommittedCode = '';
  private lastCommittedTime = 0;

  private commitScan = (terminator: 'enter' | 'tab' | 'timeout' | 'manual', originatingEvent?: KeyboardEvent) => {
    if (this.autoSubmitTimer) {
      clearTimeout(this.autoSubmitTimer);
      this.autoSubmitTimer = null;
    }
    if (this.bufferExpiryTimer) {
      clearTimeout(this.bufferExpiryTimer);
      this.bufferExpiryTimer = null;
    }

    if (this.keyBuffer.length < this.settings.minBarcodeLength) {
      this.keyBuffer = [];
      return;
    }

    const now = performance.now();
    const firstTime = this.keyBuffer[0].time;
    const totalDuration = now - firstTime;
    const intervals: number[] = [];
    for (let i = 1; i < this.keyBuffer.length; i++) {
      intervals.push(this.keyBuffer[i].time - this.keyBuffer[i - 1].time);
    }

    // Wireless / Bluetooth wake-up adjustment:
    // If the scanner had a wake-up lag on the first character, exclude intervals[0] if we have >= 4 chars
    const burstIntervals = intervals.length >= 3 ? intervals.slice(1) : intervals;
    const avgInterval = burstIntervals.length > 0 
      ? burstIntervals.reduce((a, b) => a + b, 0) / burstIntervals.length 
      : 0;

    // Check if the sequence looks like a hardware scanner:
    // Scanners operate between 2ms and 140ms per key.
    const fastIntervalsCount = burstIntervals.filter(d => d <= this.settings.maxIntervalMs * 1.5).length;
    const isFastRatio = burstIntervals.length > 0 ? (fastIntervalsCount / burstIntervals.length) >= 0.55 : true;
    const isKeyboardWedge = avgInterval <= this.settings.maxIntervalMs || (isFastRatio && avgInterval <= 240);

    // Build raw & code-based strings
    let rawBarcode = '';
    let codeBasedBarcode = '';

    for (const item of this.keyBuffer) {
      rawBarcode += item.key;
      if (item.code.startsWith('Digit')) {
        codeBasedBarcode += item.code.replace('Digit', '');
      } else if (item.code.startsWith('Numpad')) {
        codeBasedBarcode += item.code.replace('Numpad', '');
      } else if (item.code.startsWith('Key')) {
        codeBasedBarcode += item.code.replace('Key', '');
      } else {
        codeBasedBarcode += item.key;
      }
    }

    // Apply AZERTY normalization & AIM stripping
    const strippedRaw = stripAimAndControlChars(rawBarcode);
    let finalDecoded = normalizeBarcode(strippedRaw || rawBarcode, this.settings.azertyAutoFix);
    const azertyFixed = finalDecoded !== rawBarcode;

    // If raw didn't resolve to digits, but codeBased did, prefer codeBased
    if (/^\d+$/.test(codeBasedBarcode) && !/^\d+$/.test(finalDecoded)) {
      finalDecoded = codeBasedBarcode;
    }

    const alternatives = generateBarcodeAlternatives(rawBarcode, codeBasedBarcode);

    const scanInfo: LastScanInfo = {
      raw: rawBarcode,
      decoded: finalDecoded,
      charCount: this.keyBuffer.length,
      durationMs: Math.round(totalDuration),
      avgIntervalMs: Math.round(avgInterval * 10) / 10,
      timestamp: Date.now(),
      isKeyboardWedge,
      terminator,
      azertyFixed,
      alternatives,
    };

    // If it's a hardware scanner burst OR terminated with Enter/Tab:
    // Even on timeout, if >= minBarcodeLength keys arrived with fast burst, treat as valid scan!
    if (isKeyboardWedge || terminator === 'enter' || terminator === 'tab' || (terminator === 'timeout' && this.keyBuffer.length >= 3)) {
      if (originatingEvent) {
        if (originatingEvent.cancelable) originatingEvent.preventDefault();
        originatingEvent.stopPropagation();
      }

      // Check if target is an input and clean it up so barcode doesn't pollute the field
      const target = (originatingEvent?.target || document.activeElement) as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        const inputElem = target as HTMLInputElement;
        const val = inputElem.value;
        const matchesField = 
          inputElem.id === 'input-search-product' ||
          inputElem.name === 'search' ||
          inputElem.type === 'search' ||
          val === rawBarcode ||
          val === finalDecoded ||
          val.includes(rawBarcode) ||
          val.includes(finalDecoded);

        if (matchesField) {
          try {
            let newVal = val;
            if (val === rawBarcode || val === finalDecoded) {
              newVal = '';
            } else if (val.endsWith(rawBarcode)) {
              newVal = val.slice(0, -rawBarcode.length);
            } else if (val.endsWith(finalDecoded)) {
              newVal = val.slice(0, -finalDecoded.length);
            } else if (inputElem.id === 'input-search-product') {
              newVal = '';
            }

            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            if (nativeSetter) {
              nativeSetter.call(inputElem, newVal);
            } else {
              inputElem.value = newVal;
            }
            inputElem.dispatchEvent(new Event('input', { bubbles: true }));
            inputElem.dispatchEvent(new Event('change', { bubbles: true }));
          } catch {
            inputElem.value = '';
          }
        }
      }

      // Debounce protection: ignore trigger bounce if exact same barcode arrives within 350ms
      const nowTs = Date.now();
      if (finalDecoded === this.lastCommittedCode && nowTs - this.lastCommittedTime < 350) {
        this.keyBuffer = [];
        return;
      }
      this.lastCommittedCode = finalDecoded;
      this.lastCommittedTime = nowTs;

      this.lastScanInfo = scanInfo;
      this.keyBuffer = [];
      this.notifyListeners(finalDecoded, scanInfo);
      return;
    }

    // Otherwise it was slow human typing that timed out, reset buffer
    this.keyBuffer = [];
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.settings.enabled) return;

    // Ignore modifier keys alone
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) {
      return;
    }

    const now = performance.now();

    // Check for Enter key across all browser/OS quirks (including carriage return \r and linefeed \n)
    const isEnterKey = 
      e.key === 'Enter' || 
      e.key === 'Return' || 
      e.key === '\r' || 
      e.key === '\n' || 
      e.code === 'Enter' || 
      e.code === 'NumpadEnter' ||
      e.keyCode === 13 ||
      e.which === 13;

    // Prevent duplicate consecutive \n if scanner sends \r\n (CR+LF)
    if (isEnterKey && now - this.lastEnterTimestamp < 60) {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      return;
    }

    const isTabKey = e.key === 'Tab' || e.code === 'Tab' || e.keyCode === 9 || e.which === 9;

    // 1. Scanner Suffix: Enter or Tab
    if (isEnterKey || isTabKey) {
      this.lastEnterTimestamp = now;
      if (this.keyBuffer.length >= this.settings.minBarcodeLength) {
        this.commitScan(isEnterKey ? 'enter' : 'tab', e);
        return;
      }
      // If buffer is too small, just reset on Enter/Tab
      this.keyBuffer = [];
      if (this.autoSubmitTimer) clearTimeout(this.autoSubmitTimer);
      if (this.bufferExpiryTimer) clearTimeout(this.bufferExpiryTimer);
      return;
    }

    // 2. Printable character extraction (handles both e.key and fallback e.code)
    let charToRecord = '';
    if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      charToRecord = e.key;
    } else if (e.code) {
      if (e.code.startsWith('Digit')) {
        charToRecord = e.code.replace('Digit', '');
      } else if (e.code.startsWith('Numpad') && e.code.length === 7) {
        charToRecord = e.code.replace('Numpad', '');
      } else if (e.code.startsWith('Key')) {
        charToRecord = e.code.replace('Key', '').toLowerCase();
      } else if (e.code === 'Minus') {
        charToRecord = '-';
      } else if (e.code === 'Slash') {
        charToRecord = '/';
      }
    }

    if (charToRecord) {
      let intervalWithLast = 0;
      if (this.keyBuffer.length > 0) {
        const lastKey = this.keyBuffer[this.keyBuffer.length - 1];
        intervalWithLast = now - lastKey.time;

        // If pause is very long (> 500ms), it's a new scan
        if (intervalWithLast > Math.max(450, this.settings.maxIntervalMs * 3.5)) {
          this.keyBuffer = [];
        }
      }

      this.keyBuffer.push({
        key: charToRecord,
        code: e.code || '',
        time: now,
      });

      // Broadcast raw key to diagnostic monitors
      const currentRawString = this.keyBuffer.map(k => k.key).join('');
      if (this.rawKeyListeners.size > 0) {
        const rawEvent: RawKeyStrokeEvent = {
          key: charToRecord,
          code: e.code || '',
          intervalMs: Math.round(intervalWithLast * 10) / 10,
          timestamp: Date.now(),
          currentBuffer: currentRawString,
        };
        this.rawKeyListeners.forEach(listener => {
          try {
            listener(rawEvent);
          } catch {}
        });
      }

      // Reset auto-commit timeout for scanners WITHOUT Enter suffix
      if (this.autoSubmitTimer) clearTimeout(this.autoSubmitTimer);
      if (this.settings.autoSubmitOnTimeout && this.keyBuffer.length >= this.settings.minBarcodeLength) {
        this.autoSubmitTimer = setTimeout(() => {
          this.commitScan('timeout');
        }, this.settings.suffixTimeoutMs);
      }

      // Safety expiration timer if keys are abandoned
      if (this.bufferExpiryTimer) clearTimeout(this.bufferExpiryTimer);
      this.bufferExpiryTimer = setTimeout(() => {
        this.keyBuffer = [];
      }, 700);
    }
  };

  /**
   * Simulates or tests a scan manually (useful for testing or on-screen barcode buttons)
   */
  public simulateScan(barcode: string) {
    const clean = normalizeBarcode(barcode, this.settings.azertyAutoFix);
    const alternatives = generateBarcodeAlternatives(barcode, clean);
    const info: LastScanInfo = {
      raw: barcode,
      decoded: clean,
      charCount: clean.length,
      durationMs: 42,
      avgIntervalMs: 3.2,
      timestamp: Date.now(),
      isKeyboardWedge: true,
      terminator: 'manual',
      azertyFixed: clean !== barcode,
      alternatives,
    };
    this.lastScanInfo = info;
    this.notifyListeners(clean, info);
  }
}

export const usbBarcodeScanner = new UsbBarcodeScannerService();
