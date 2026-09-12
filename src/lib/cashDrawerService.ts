import { blePrinter, EscPosEncoder } from './blePrinter';
import { soundEffects } from './sound';

export interface CashDrawerSettings {
  autoOpenOnSaleValidation: boolean;
  autoOpenOnPrint: boolean; // Ouvrir automatiquement le tiroir lors de l'impression du ticket (pilote USB / reçu)
  openOnlyOnCashOrSplit: boolean;
  soundFeedback: boolean;
  pinNumber: 0 | 1; // 0 = Pin 2, 1 = Pin 5 (connecteur RJ11/RJ12)
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
const USB_DEVICE_KEY = 'bizpilot_usb_device_name';

const DEFAULT_SETTINGS: CashDrawerSettings = {
  autoOpenOnSaleValidation: true,
  autoOpenOnPrint: true,
  openOnlyOnCashOrSplit: false,
  soundFeedback: true,
  pinNumber: 0,
  autoPrintReceipt: false,
};

// Web Serial Port handle for USB / RS232 POS receipt printer / cash drawer kick box
let serialPort: any = null;

// WebUSB Device handle for direct USB ESC/POS thermal printers (POS-80, Xprinter, Epson, etc.)
let usbDevice: any = null;
let usbEndpointOut: number = 1;

class CashDrawerManager {
  private settings: CashDrawerSettings;
  private usbDeviceName: string | null = null;

  constructor() {
    this.settings = this.loadSettings();
    if (typeof window !== 'undefined') {
      try {
        this.usbDeviceName = localStorage.getItem(USB_DEVICE_KEY);
      } catch {}
      // Try silent background reconnect for WebUSB and WebSerial
      this.trySilentUsbReconnect();
    }
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
      const updated = [newLog, ...currentLogs].slice(0, 50); // Keep last 50 openings for audit
      localStorage.setItem(LOGS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  // --- WebUSB API (Direct USB connection to POS thermal printers) ---
  isUsbSupported(): boolean {
    return typeof navigator !== 'undefined' && 'usb' in navigator;
  }

  isUsbConnected(): boolean {
    return Boolean(usbDevice && usbDevice.opened);
  }

  getConnectedUsbName(): string | null {
    if (usbDevice && (usbDevice.productName || usbDevice.manufacturerName)) {
      return usbDevice.productName || usbDevice.manufacturerName;
    }
    return this.usbDeviceName;
  }

  private async trySilentUsbReconnect() {
    if (!this.isUsbSupported()) return;
    try {
      const nav = navigator as any;
      if (nav.usb && nav.usb.getDevices) {
        const devices = await nav.usb.getDevices();
        if (devices.length > 0) {
          const dev = devices[0];
          await this.initializeUsbDevice(dev);
        }
      }
    } catch {
      // silent fail in background
    }
  }

  private async initializeUsbDevice(device: any): Promise<void> {
    await device.open();
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }

    let targetInterfaceNumber = 0;
    let targetEndpointNumber = 1;

    if (device.configuration && device.configuration.interfaces) {
      for (const iface of device.configuration.interfaces) {
        for (const alt of iface.alternates) {
          for (const ep of alt.endpoints) {
            if (ep.direction === 'out') {
              targetInterfaceNumber = iface.interfaceNumber;
              targetEndpointNumber = ep.endpointNumber;
              break;
            }
          }
        }
      }
    }

    try {
      await device.claimInterface(targetInterfaceNumber);
    } catch (claimErr) {
      console.warn('USB interface claim notice:', claimErr);
    }

    usbDevice = device;
    usbEndpointOut = targetEndpointNumber;
    const name = device.productName || device.manufacturerName || 'Imprimante POS USB';
    this.usbDeviceName = name;
    try {
      localStorage.setItem(USB_DEVICE_KEY, name);
    } catch {}
  }

  async connectUsb(): Promise<string> {
    if (!this.isUsbSupported()) {
      throw new Error("L'API WebUSB n'est pas supportée par ce navigateur. Utilisez Google Chrome ou Microsoft Edge sur ordinateur ou tablette Android.");
    }

    try {
      const nav = navigator as any;
      const device = await nav.usb.requestDevice({
        filters: [] // Allow selecting any connected USB POS thermal printer
      });
      await this.initializeUsbDevice(device);
      return this.getConnectedUsbName() || 'Imprimante POS USB';
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        throw new Error('Aucun périphérique USB sélectionné.');
      }
      throw new Error(`Erreur connexion USB: ${err.message || err}`);
    }
  }

  async disconnectUsb(): Promise<void> {
    if (usbDevice) {
      try {
        await usbDevice.close();
      } catch {}
      usbDevice = null;
    }
  }

  // --- Web Serial API (USB Virtual COM / RS232 / CH340 / CP2102) ---
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

  // Send hardware kick command to direct USB
  private async sendUsbKick(): Promise<boolean> {
    if (!this.isUsbConnected()) {
      await this.trySilentUsbReconnect();
    }

    if (!this.isUsbConnected() || !usbDevice) {
      return false;
    }

    try {
      const encoder = new EscPosEncoder();
      encoder.openDrawer(this.settings.pinNumber);
      const data = encoder.encode();
      await usbDevice.transferOut(usbEndpointOut, data);
      return true;
    } catch (err) {
      console.warn('WebUSB kick drawer error:', err);
      return false;
    }
  }

  // Send hardware kick command to Web Serial
  private async sendSerialKick(): Promise<boolean> {
    if (!this.isSerialConnected() || !serialPort || !serialPort.writable) {
      return false;
    }

    try {
      const encoder = new EscPosEncoder();
      encoder.openDrawer(this.settings.pinNumber);
      const data = encoder.encode();
      const writer = serialPort.writable.getWriter();
      await writer.write(data);
      writer.releaseLock();
      return true;
    } catch (err) {
      console.warn('Web Serial cash drawer kick error:', err);
      return false;
    }
  }

  // Hardware kick pulse to open cash drawer
  async sendHardwareKick(): Promise<{ bluetooth: boolean; usb: boolean; serial: boolean }> {
    const result = { bluetooth: false, usb: false, serial: false };

    // 1. Send kick via connected Bluetooth POS Printer
    if (blePrinter.isConnected()) {
      result.bluetooth = await blePrinter.kickDrawer();
    }

    // 2. Send kick via Direct WebUSB POS Printer
    result.usb = await this.sendUsbKick();

    // 3. Send kick via Web Serial / USB-COM POS Printer
    result.serial = await this.sendSerialKick();

    return result;
  }

  /**
   * Dedicated Trigger when a receipt print is validated
   * (via USB printer driver, system dialog, or direct POS print)
   */
  async triggerDrawerOnPrintValidation(options: {
    saleId?: string;
    receiptNumber?: string;
    paymentMethod?: string;
    operatorName?: string;
    force?: boolean;
  }): Promise<{ opened: boolean; reason: string; soundPlayed: boolean; hardwareKicked: boolean }> {
    if (!options.force && !this.settings.autoOpenOnPrint) {
      return { 
        opened: false, 
        reason: "Ouverture à l'impression désactivée dans les paramètres", 
        soundPlayed: false, 
        hardwareKicked: false 
      };
    }

    return this.triggerDrawer({
      reason: `Validation Impression Reçu ${options.receiptNumber ? `N° ${options.receiptNumber}` : ''} (Pilote USB / Caisse)`,
      paymentMethod: options.paymentMethod,
      saleId: options.saleId,
      operatorName: options.operatorName || 'Caissier',
      force: true
    });
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
  }): Promise<{ opened: boolean; reason: string; soundPlayed: boolean; hardwareKicked: boolean; hardwareDetails: { bluetooth: boolean; usb: boolean; serial: boolean } }> {
    const isManual = Boolean(options.isManual);
    const force = Boolean(options.force);

    // If triggered from sale checkout without force, check user preferences
    if (!isManual && !force) {
      if (!this.settings.autoOpenOnSaleValidation) {
        return { 
          opened: false, 
          reason: 'Ouverture automatique désactivée dans les paramètres', 
          soundPlayed: false, 
          hardwareKicked: false,
          hardwareDetails: { bluetooth: false, usb: false, serial: false }
        };
      }

      if (this.settings.openOnlyOnCashOrSplit) {
        const method = options.paymentMethod || 'cash';
        const isCashOrSplit = method === 'cash' || method === 'split';
        if (!isCashOrSplit) {
          return { 
            opened: false, 
            reason: `Ignoré: mode de paiement ${method} (seuls espèces/mixtes ouvrent)`, 
            soundPlayed: false, 
            hardwareKicked: false,
            hardwareDetails: { bluetooth: false, usb: false, serial: false }
          };
        }
      }
    }

    // 1. Play mechanical cash drawer sound
    let soundPlayed = false;
    if (this.settings.soundFeedback) {
      soundEffects.playCashDrawerSound();
      soundPlayed = true;
    }

    // 2. Dispatch hardware kick-out pulses (USB, Serial, Bluetooth)
    const hwResult = await this.sendHardwareKick();
    const hardwareKicked = hwResult.bluetooth || hwResult.usb || hwResult.serial;

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
          hardwareDetails: hwResult,
        },
      });
      window.dispatchEvent(event);
    }

    return {
      opened: true,
      reason: options.reason,
      soundPlayed,
      hardwareKicked,
      hardwareDetails: hwResult,
    };
  }
}

export const cashDrawerService = new CashDrawerManager();
