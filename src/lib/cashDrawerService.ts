import { blePrinter, EscPosEncoder } from './blePrinter';
import { soundEffects } from './sound';

export interface CashDrawerSettings {
  autoOpenOnSaleValidation: boolean;
  openOnlyOnCashOrSplit: boolean;
  soundFeedback: boolean;
  pinNumber: 0 | 1; // 0 = Pin 2, 1 = Pin 5
  autoPrintReceipt?: boolean;
}

export interface CashDrawerLog {
  id: string;
  timestamp: string;
  reason: string;
  paymentMethod?: string;
  saleId?: string;
  isManual: boolean;
  operatorName?: string;
}

const SETTINGS_KEY = 'bizpilot_cash_drawer_settings';
const LOGS_KEY = 'bizpilot_cash_drawer_logs';

const DEFAULT_SETTINGS: CashDrawerSettings = {
  autoOpenOnSaleValidation: true,
  openOnlyOnCashOrSplit: false,
  soundFeedback: true,
  pinNumber: 0,
  autoPrintReceipt: false,
};

// Web Serial Port handle for USB / RS232 POS receipt printer / cash drawer kick box
let serialPort: any = null;

class CashDrawerManager {
  private settings: CashDrawerSettings;

  constructor() {
    this.settings = this.loadSettings();
  }

  loadSettings(): CashDrawerSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  }

  saveSettings(newSettings: Partial<CashDrawerSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
      } catch {
        // ignore
      }
    }
    return this.settings;
  }

  getSettings(): CashDrawerSettings {
    return { ...this.settings };
  }

  getLogs(): CashDrawerLog[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(LOGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return [];
  }

  private addLog(log: Omit<CashDrawerLog, 'id' | 'timestamp'>) {
    if (typeof window === 'undefined') return;
    try {
      const currentLogs = this.getLogs();
      const newLog: CashDrawerLog = {
        id: `drawer_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        ...log,
      };
      const updated = [newLog, ...currentLogs].slice(0, 50); // Keep last 50 openings for security audit
      localStorage.setItem(LOGS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  // Web Serial API check (Chrome/Edge desktop)
  isSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  isSerialConnected(): boolean {
    return Boolean(serialPort && serialPort.readable && serialPort.writable);
  }

  async connectSerial(): Promise<boolean> {
    if (!this.isSerialSupported()) {
      throw new Error("L'API Web Serial n'est pas supportée par ce navigateur (utilisez Google Chrome ou Microsoft Edge).");
    }

    try {
      const nav = navigator as any;
      serialPort = await nav.serial.requestPort();
      await serialPort.open({ baudRate: 9600 });
      return true;
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        throw new Error('Aucun port série sélectionné.');
      }
      throw new Error(`Erreur connexion USB/Série: ${err.message || err}`);
    }
  }

  async disconnectSerial(): Promise<void> {
    if (serialPort) {
      try {
        await serialPort.close();
      } catch {
        // ignore
      }
      serialPort = null;
    }
  }

  // Hardware kick pulse to open cash drawer
  private async sendHardwareKick(): Promise<{ bluetooth: boolean; serial: boolean }> {
    const result = { bluetooth: false, serial: false };

    // 1. Send kick via connected Bluetooth POS Printer
    if (blePrinter.isConnected()) {
      result.bluetooth = await blePrinter.kickDrawer();
    }

    // 2. Send kick via Web Serial POS Printer / Drawer controller
    if (this.isSerialConnected()) {
      try {
        const encoder = new EscPosEncoder();
        encoder.openDrawer(this.settings.pinNumber);
        const data = encoder.encode();
        const writer = serialPort.writable.getWriter();
        await writer.write(data);
        writer.releaseLock();
        result.serial = true;
      } catch (err) {
        console.warn('Web Serial cash drawer kick error:', err);
      }
    }

    return result;
  }

  /**
   * Main Cash Drawer Trigger
   * Called automatically when a sale receipt is validated, or manually by cashier
   */
  async triggerDrawer(options: {
    reason: string;
    paymentMethod?: string;
    saleId?: string;
    isManual?: boolean;
    operatorName?: string;
    force?: boolean;
  }): Promise<{ opened: boolean; reason: string; soundPlayed: boolean; hardwareKicked: boolean }> {
    const isManual = Boolean(options.isManual);
    const force = Boolean(options.force);

    // If triggered from sale validation, check user preferences
    if (!isManual && !force) {
      if (!this.settings.autoOpenOnSaleValidation) {
        return { opened: false, reason: 'Ouverture automatique désactivée dans les paramètres', soundPlayed: false, hardwareKicked: false };
      }

      if (this.settings.openOnlyOnCashOrSplit) {
        const method = options.paymentMethod || 'cash';
        const isCashOrSplit = method === 'cash' || method === 'split';
        if (!isCashOrSplit) {
          return { opened: false, reason: `Ignoré: mode de paiement ${method} (seuls espèces/mixtes ouvrent)`, soundPlayed: false, hardwareKicked: false };
        }
      }
    }

    // 1. Play mechanical cash drawer sound
    let soundPlayed = false;
    if (this.settings.soundFeedback) {
      soundEffects.playCashDrawerSound();
      soundPlayed = true;
    }

    // 2. Dispatch hardware kick-out pulses
    const hwResult = await this.sendHardwareKick();
    const hardwareKicked = hwResult.bluetooth || hwResult.serial;

    // 3. Log event for store manager security / audit trail
    this.addLog({
      reason: options.reason,
      paymentMethod: options.paymentMethod,
      saleId: options.saleId,
      isManual,
      operatorName: options.operatorName || 'Caissier',
    });

    // 4. Dispatch browser custom event for visual UI toast & animation
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('bizpilot:cash-drawer-opened', {
        detail: {
          timestamp: Date.now(),
          reason: options.reason,
          paymentMethod: options.paymentMethod,
          saleId: options.saleId,
          isManual,
          operatorName: options.operatorName || 'Caissier',
          hardwareKicked,
        },
      });
      window.dispatchEvent(event);
    }

    return {
      opened: true,
      reason: options.reason,
      soundPlayed,
      hardwareKicked,
    };
  }
}

export const cashDrawerService = new CashDrawerManager();
