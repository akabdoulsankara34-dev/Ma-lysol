import { soundEffects } from './sound';

export interface UsbScannerSettings {
  enabled: boolean;
  enableSound: boolean;
  azertyAutoFix: boolean;
  autoAddToCart: boolean;
  maxIntervalMs: number;
  minBarcodeLength: number;
}

export interface LastScanInfo {
  raw: string;
  decoded: string;
  charCount: number;
  durationMs: number;
  avgIntervalMs: number;
  timestamp: number;
  isKeyboardWedge: boolean;
}

const STORAGE_KEY = 'bizpilot_usb_scanner_settings';

const DEFAULT_SETTINGS: UsbScannerSettings = {
  enabled: true,
  enableSound: true,
  azertyAutoFix: true,
  autoAddToCart: true,
  maxIntervalMs: 70, // 70ms threshold between keystrokes to detect keyboard wedge vs human typing
  minBarcodeLength: 3,
};

// Map French AZERTY top row characters to digits 0-9
const AZERTY_TO_DIGIT: Record<string, string> = {
  '&': '1',
  'é': '2',
  '"': '3',
  "'": '4',
  '(': '5',
  '-': '6',
  'è': '7',
  '_': '8',
  'ç': '9',
  'à': '0',
  '§': '6',
  '!': '8',
};

/**
 * Normalizes barcode string handling AZERTY keyboard conversion if needed.
 * For instance, if an EAN-13 was scanned on an AZERTY keyboard without shift,
 * '&é"\'(-è_çà' becomes '1234567890'.
 */
export function normalizeBarcode(rawText: string, azertyFix = true): string {
  if (!rawText) return '';
  const trimmed = rawText.trim();

  if (!azertyFix) {
    return trimmed;
  }

  // Check if rawText is made predominantly of AZERTY numeric characters
  let azertyConverted = '';
  let hasAzertyChar = false;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (AZERTY_TO_DIGIT[char] !== undefined) {
      azertyConverted += AZERTY_TO_DIGIT[char];
      hasAzertyChar = true;
    } else {
      azertyConverted += char;
    }
  }

  // If converting produced a valid numeric barcode (e.g. 8, 12, 13, 14 digits) or resolved AZERTY symbols
  if (hasAzertyChar && /^\d+$/.test(azertyConverted)) {
    return azertyConverted;
  }

  return trimmed;
}

type ScanCallback = (barcode: string, scanInfo: LastScanInfo) => void;

class UsbBarcodeScannerService {
  private settings: UsbScannerSettings;
  private listeners: Set<ScanCallback> = new Set();
  private keyBuffer: { key: string; code: string; time: number }[] = [];
  private bufferTimer: ReturnType<typeof setTimeout> | null = null;
  private lastScanInfo: LastScanInfo | null = null;
  private isInitialized = false;

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

  public subscribe(callback: ScanCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
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

    // Also dispatch a custom window event so any element can react
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

    window.addEventListener('keydown', this.handleKeyDown, true);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.settings.enabled) return;

    // Ignore modifier keys alone
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
      return;
    }

    const now = performance.now();
    const target = e.target as HTMLElement | null;
    const isInsideInput =
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable);

    // If Enter key is pressed, verify if we have a fast barcode stream
    if (e.key === 'Enter') {
      if (this.keyBuffer.length >= this.settings.minBarcodeLength) {
        // Calculate interval metrics
        const firstTime = this.keyBuffer[0].time;
        const totalDuration = now - firstTime;
        const avgInterval = totalDuration / (this.keyBuffer.length - 1 || 1);

        // A barcode scanner typically fires characters with < 65ms between keys
        // Humans type much slower (>120ms between keys)
        const isKeyboardWedge = avgInterval <= this.settings.maxIntervalMs;

        // Build the raw string
        let rawBarcode = '';
        let codeBasedBarcode = '';

        for (const item of this.keyBuffer) {
          rawBarcode += item.key;
          // Check if code was Digit0-Digit9 or Numpad0-Numpad9
          if (item.code.startsWith('Digit')) {
            codeBasedBarcode += item.code.replace('Digit', '');
          } else if (item.code.startsWith('Numpad')) {
            codeBasedBarcode += item.code.replace('Numpad', '');
          } else {
            codeBasedBarcode += item.key;
          }
        }

        // Apply AZERTY normalization
        let finalDecoded = normalizeBarcode(rawBarcode, this.settings.azertyAutoFix);

        // If raw didn't resolve to digits, but codeBased did, prefer codeBased
        if (/^\d+$/.test(codeBasedBarcode) && !/^\d+$/.test(finalDecoded)) {
          finalDecoded = codeBasedBarcode;
        }

        const scanInfo: LastScanInfo = {
          raw: rawBarcode,
          decoded: finalDecoded,
          charCount: this.keyBuffer.length,
          durationMs: Math.round(totalDuration),
          avgIntervalMs: Math.round(avgInterval * 10) / 10,
          timestamp: Date.now(),
          isKeyboardWedge,
        };

        // If it was detected as a scanner (fast sequence) or if not in input:
        if (isKeyboardWedge || !isInsideInput) {
          e.preventDefault();
          e.stopPropagation();

          // If the cashier was focused in an input (e.g. search bar), clear it or blur
          if (isInsideInput && target instanceof HTMLInputElement) {
            // Check if input value equals the scanned code
            if (
              target.value.toLowerCase().includes(rawBarcode.toLowerCase()) ||
              target.value.toLowerCase().includes(finalDecoded.toLowerCase()) ||
              target.id === 'input-search-product'
            ) {
              target.value = '';
              target.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }

          this.lastScanInfo = scanInfo;
          this.keyBuffer = [];
          if (this.bufferTimer) clearTimeout(this.bufferTimer);

          this.notifyListeners(finalDecoded, scanInfo);
          return;
        }
      }

      // Reset buffer on Enter
      this.keyBuffer = [];
      if (this.bufferTimer) clearTimeout(this.bufferTimer);
      return;
    }

    // Normal printable character
    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      // Check interval with previous key
      if (this.keyBuffer.length > 0) {
        const lastKey = this.keyBuffer[this.keyBuffer.length - 1];
        const diff = now - lastKey.time;

        // If interval is too long, it's likely human typing: reset buffer
        if (diff > this.settings.maxIntervalMs * 2.5) {
          this.keyBuffer = [];
        }
      }

      this.keyBuffer.push({
        key: e.key,
        code: e.code,
        time: now,
      });

      // Clear buffer after a short timeout if no more keys arrive
      if (this.bufferTimer) clearTimeout(this.bufferTimer);
      this.bufferTimer = setTimeout(() => {
        this.keyBuffer = [];
      }, 250);
    }
  };

  /**
   * Simulates or tests a scan manually (useful for testing or on-screen barcode buttons)
   */
  public simulateScan(barcode: string) {
    const clean = normalizeBarcode(barcode, this.settings.azertyAutoFix);
    const info: LastScanInfo = {
      raw: barcode,
      decoded: clean,
      charCount: clean.length,
      durationMs: 45,
      avgIntervalMs: 3.5,
      timestamp: Date.now(),
      isKeyboardWedge: true,
    };
    this.lastScanInfo = info;
    this.notifyListeners(clean, info);
  }
}

export const usbBarcodeScanner = new UsbBarcodeScannerService();
