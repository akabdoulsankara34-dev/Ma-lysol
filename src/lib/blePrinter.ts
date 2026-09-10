// ESC/POS Command Generator and Web Bluetooth POS-80 / POS-58 Printer Handler

export interface BluetoothPrinterDevice {
  device: any;
  characteristic: any;
  name: string;
}

// ESC/POS Byte Commands
export const ESC = 0x1B;
export const GS = 0x1D;
export const LF = 0x0A;

export class EscPosEncoder {
  private buffer: number[] = [];

  constructor() {
    this.initialize();
  }

  // Initialize printer
  initialize(): this {
    this.buffer.push(ESC, 0x40); // ESC @
    return this;
  }

  // Alignment: 'left' | 'center' | 'right'
  align(alignment: 'left' | 'center' | 'right'): this {
    const val = alignment === 'center' ? 1 : alignment === 'right' ? 2 : 0;
    this.buffer.push(ESC, 0x61, val);
    return this;
  }

  // Text formatting
  bold(enable: boolean): this {
    this.buffer.push(ESC, 0x45, enable ? 1 : 0);
    return this;
  }

  underline(enable: boolean): this {
    this.buffer.push(ESC, 0x2D, enable ? 1 : 0);
    return this;
  }

  // Double height & width (mode: 0=normal, 1=double-height, 2=double-width, 3=both)
  textSize(widthMultiplier: 1 | 2, heightMultiplier: 1 | 2): this {
    const width = widthMultiplier === 2 ? 1 : 0;
    const height = heightMultiplier === 2 ? 1 : 0;
    const size = (width << 4) | height;
    this.buffer.push(GS, 0x21, size);
    return this;
  }

  // Add line feed
  lineFeed(lines = 1): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(LF);
    }
    return this;
  }

  // Raw text (latin1 encoded for French accents & currency)
  text(str: string): this {
    // Normalize string to replace unsupported special unicode with ASCII equivalents
    const normalized = str
      .replace(/[\u202F\u00A0]/g, ' ') // Replace non-breaking spaces with normal spaces
      .replace(/é/g, 'e')
      .replace(/è/g, 'e')
      .replace(/ê/g, 'e')
      .replace(/ë/g, 'e')
      .replace(/à/g, 'a')
      .replace(/â/g, 'a')
      .replace(/î/g, 'i')
      .replace(/ï/g, 'i')
      .replace(/ô/g, 'o')
      .replace(/ù/g, 'u')
      .replace(/û/g, 'u')
      .replace(/ç/g, 'c')
      .replace(/É/g, 'E')
      .replace(/È/g, 'E')
      .replace(/Ê/g, 'E')
      .replace(/À/g, 'A')
      .replace(/Ç/g, 'C')
      .replace(/•/g, '-');

    for (let i = 0; i < normalized.length; i++) {
      const code = normalized.charCodeAt(i);
      this.buffer.push(code <= 255 ? code : 63); // ? for unknown
    }
    return this;
  }

  // Print text with line feed
  textLine(str = ''): this {
    if (str) this.text(str);
    this.buffer.push(LF);
    return this;
  }

  // 2-column row format for 80mm (approx 48 chars) or 58mm (approx 32 chars)
  row(left: string, right: string, width = 42): this {
    const cleanLeft = left.trim();
    const cleanRight = right.trim();
    const spaces = Math.max(1, width - cleanLeft.length - cleanRight.length);
    const line = cleanLeft + ' '.repeat(spaces) + cleanRight;
    this.textLine(line);
    return this;
  }

  // Separator line
  divider(char = '-', width = 42): this {
    this.textLine(char.repeat(width));
    return this;
  }

  // Cut paper (GS V 66 0)
  cut(): this {
    this.lineFeed(3);
    this.buffer.push(GS, 0x56, 0x42, 0x00);
    return this;
  }

  // Cash drawer kick-out pulse (ESC p m t1 t2 & DLE DC4 real-time kick)
  // Connects via RJ11 / RJ12 from receipt printer to cash drawer
  openDrawer(pin: 0 | 1 = 0): this {
    // ESC p pin 25 250 (pulse 50ms ON, 500ms OFF)
    this.buffer.push(ESC, 0x70, pin, 0x19, 0xFA);
    // Real-time pulse DLE DC4 1 pin 5
    this.buffer.push(0x10, 0x14, 0x01, pin, 0x05);
    return this;
  }

  // Get raw Uint8Array
  encode(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

// Web Bluetooth BLE POS Printer Manager with High-Speed Pairing & Cached GATT Discovery
class BluetoothPosPrinter {
  private device: any = null;
  private characteristic: any = null;
  private isConnecting: boolean = false;
  private connectionPromise: Promise<{ name: string }> | null = null;

  // Storage keys for persistent printer profiling
  private readonly STORAGE_KEYS = {
    DEVICE_ID: 'bizpilot_ble_device_id',
    DEVICE_NAME: 'bizpilot_ble_device_name',
    SERVICE_UUID: 'bizpilot_ble_service_uuid',
    CHAR_UUID: 'bizpilot_ble_char_uuid',
  };

  // Known Bluetooth Service UUIDs for Thermal POS printers (ordered by prevalence)
  private readonly PRINT_SERVICES = [
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // POS80 / POS58 Common BLE (most widespread)
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent UART
    '000018f0-0000-1000-8000-00805f9b34fb', // Standard Print Service (Bluetooth SIG)
    '0000ff00-0000-1000-8000-00805f9b34fb', // Common ESC/POS vendor service
    '0000ae00-0000-1000-8000-00805f9b34fb', // Android/iOS POS Mini
    '0000fee7-0000-1000-8000-00805f9b34fb', // Tencent / POS80 BLE
  ];

  // Common thermal printer name prefixes for targeted fast scanning
  private readonly PRINTER_NAME_PREFIXES = [
    'POS', 'pos', 'Printer', 'printer', 'RP', 'MTP', 'MPT',
    'XP', 'PT', 'GP', 'NT', 'ZJ', 'TM', 'BT', '58', '80',
    'Receipt', 'Thermal', 'InnerPrinter'
  ];

  isBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  getLastPairedDeviceName(): string | null {
    try {
      return localStorage.getItem(this.STORAGE_KEYS.DEVICE_NAME) || null;
    } catch {
      return null;
    }
  }

  hasPairedPrinter(): boolean {
    try {
      return Boolean(localStorage.getItem(this.STORAGE_KEYS.DEVICE_ID));
    } catch {
      return false;
    }
  }

  // Pre-warms or verifies Bluetooth connection in background
  async ensureConnected(): Promise<boolean> {
    if (this.isConnected()) return true;
    try {
      await this.connect(false, true); // silent attempt
      return this.isConnected();
    } catch {
      return false;
    }
  }

  async connect(forceNew: boolean = false, silentOnly: boolean = false): Promise<{ name: string }> {
    if (!this.isBluetoothSupported()) {
      throw new Error("L'API Web Bluetooth n'est pas supportée par ce navigateur. Utilisez Chrome/Edge ou activez Bluetooth.");
    }

    // Return current connection immediately if already alive and valid
    if (!forceNew && this.isConnected()) {
      return { name: this.device.name || this.getLastPairedDeviceName() || 'Imprimante POS BLE' };
    }

    // Deduplicate concurrent connection attempts
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = this.performConnect(forceNew, silentOnly);

    try {
      const result = await this.connectionPromise;
      return result;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  private async performConnect(forceNew: boolean, silentOnly: boolean): Promise<{ name: string }> {
    try {
      let device = this.device;
      const nav = navigator as any;

      // STEP 1: Fast Instant Reconnect without browser dialog
      // If we don't force a new scan, check previously paired devices via getDevices()
      if (!forceNew && !device && typeof nav.bluetooth.getDevices === 'function') {
        try {
          const pairedDevices: any[] = await nav.bluetooth.getDevices();
          if (pairedDevices && pairedDevices.length > 0) {
            const savedId = localStorage.getItem(this.STORAGE_KEYS.DEVICE_ID);
            // Match previously used device ID, or take the first known device
            device = pairedDevices.find(d => d.id === savedId) || pairedDevices[0];
            if (device) {
              console.log(`Reconnexion ultra-rapide au périphérique déjà couplé : ${device.name || device.id}`);
            }
          }
        } catch (e) {
          console.warn('Silent device retrieval via getDevices() failed:', e);
        }
      }

      // If silentOnly is requested and we don't have a device, abort without prompting
      if (silentOnly && !device) {
        throw new Error('Aucune imprimante précédemment couplée.');
      }

      // STEP 2: Request Device with Fast Targeted Filters
      if (!device || forceNew) {
        try {
          // Fast Scan: Try targeted namePrefix filter first (scans in < 1 second!)
          const filters = this.PRINTER_NAME_PREFIXES.map(prefix => ({ namePrefix: prefix }));
          device = await nav.bluetooth.requestDevice({
            filters,
            optionalServices: this.PRINT_SERVICES,
          });
        } catch (filterErr: any) {
          // If user cancels, rethrow
          if (filterErr.name === 'NotFoundError') {
            throw new Error("Connexion annulée : aucune imprimante sélectionnée.");
          }
          // If printer doesn't match standard prefixes, fallback to acceptAllDevices
          console.warn('Targeted prefix scan failed or unsupported, trying fallback broad scan...', filterErr);
          device = await nav.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: this.PRINT_SERVICES,
          });
        }
      }

      if (!device) {
        throw new Error("Aucun périphérique Bluetooth sélectionné.");
      }

      // Setup disconnect listener
      device.addEventListener('gattserverdisconnected', () => {
        console.warn('Imprimante BLE déconnectée.');
        this.characteristic = null;
      });

      this.device = device;

      // Persist device identity
      try {
        if (device.id) localStorage.setItem(this.STORAGE_KEYS.DEVICE_ID, device.id);
        if (device.name) localStorage.setItem(this.STORAGE_KEYS.DEVICE_NAME, device.name);
      } catch {}

      // STEP 3: Connect to GATT Server
      const server = device.gatt.connected ? device.gatt : await device.gatt.connect();

      // STEP 4: Lightning-Fast Characteristic Discovery
      let writeChar: any = null;
      let usedServiceUuid = '';

      // 4A: Check cached service and characteristic UUIDs (sub-50ms shortcut!)
      const cachedServiceUuid = localStorage.getItem(this.STORAGE_KEYS.SERVICE_UUID);
      const cachedCharUuid = localStorage.getItem(this.STORAGE_KEYS.CHAR_UUID);

      if (cachedServiceUuid && cachedCharUuid) {
        try {
          const cachedService = await server.getPrimaryService(cachedServiceUuid);
          const cachedChar = await cachedService.getCharacteristic(cachedCharUuid);
          if (cachedChar && (cachedChar.properties.write || cachedChar.properties.writeWithoutResponse)) {
            writeChar = cachedChar;
            usedServiceUuid = cachedServiceUuid;
          }
        } catch (cacheErr) {
          console.log('Cached GATT profile mismatch or stale, running direct targeted discovery...');
        }
      }

      // 4B: Fast Priority Scanning (checks known POS printer services in order)
      if (!writeChar) {
        for (const serviceUuid of this.PRINT_SERVICES) {
          try {
            const service = await server.getPrimaryService(serviceUuid);
            const characteristics = await service.getCharacteristics();
            for (const char of characteristics) {
              if (char.properties.writeWithoutResponse || char.properties.write) {
                writeChar = char;
                usedServiceUuid = serviceUuid;
                // Cache this working characteristic for all future prints!
                try {
                  localStorage.setItem(this.STORAGE_KEYS.SERVICE_UUID, serviceUuid);
                  localStorage.setItem(this.STORAGE_KEYS.CHAR_UUID, char.uuid);
                } catch {}
                break;
              }
            }
            if (writeChar) break;
          } catch {
            // Service not present on this device, continue to next
          }
        }
      }

      // 4C: Broad Discovery fallback only if priority list did not find a writable channel
      if (!writeChar) {
        try {
          const services = await server.getPrimaryServices();
          for (const service of services) {
            try {
              const characteristics = await service.getCharacteristics();
              for (const char of characteristics) {
                if (char.properties.writeWithoutResponse || char.properties.write) {
                  writeChar = char;
                  usedServiceUuid = service.uuid;
                  try {
                    localStorage.setItem(this.STORAGE_KEYS.SERVICE_UUID, service.uuid);
                    localStorage.setItem(this.STORAGE_KEYS.CHAR_UUID, char.uuid);
                  } catch {}
                  break;
                }
              }
              if (writeChar) break;
            } catch {}
          }
        } catch (broadErr) {
          console.warn('Broad discovery error:', broadErr);
        }
      }

      if (!writeChar) {
        throw new Error("Impossible d'identifier le canal d'écriture thermique sur cette imprimante.");
      }

      this.characteristic = writeChar;
      return { name: device.name || 'Imprimante POS-80 BLE' };

    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        throw new Error("Connexion annulée : aucune imprimante sélectionnée.");
      }
      throw new Error(`Erreur Bluetooth: ${err.message || err}`);
    }
  }

  // Fast chunked data transmission with optimized MTU
  async printData(data: Uint8Array): Promise<void> {
    if (!this.isConnected()) {
      await this.connect(false);
    }

    if (!this.characteristic) {
      throw new Error("Imprimante non connectée.");
    }

    // 128 bytes chunk size provides optimal balance for BLE throughput and receiver buffers
    const CHUNK_SIZE = 128;
    const canWriteWithoutResponse = Boolean(this.characteristic.properties.writeWithoutResponse);

    try {
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        if (canWriteWithoutResponse && this.characteristic.writeValueWithoutResponse) {
          await this.characteristic.writeValueWithoutResponse(chunk);
          // 8ms interval is sufficient for thermal printer buffer without stalling
          await new Promise((r) => setTimeout(r, 8));
        } else {
          await this.characteristic.writeValue(chunk);
          await new Promise((r) => setTimeout(r, 15));
        }
      }
    } catch (err: any) {
      console.warn('Bluetooth write interrupted, attempting instant recovery...', err);
      this.characteristic = null;
      if (this.device && this.device.gatt) {
        try { await this.device.gatt.disconnect(); } catch (e) {}
      }

      // Reconnect immediately using cached profile
      await this.connect(false);
      if (!this.characteristic) throw new Error("Échec de la reconnexion automatique Bluetooth.");

      // Retry sending
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        if (this.characteristic.writeValueWithoutResponse) {
          await this.characteristic.writeValueWithoutResponse(chunk);
          await new Promise((r) => setTimeout(r, 10));
        } else {
          await this.characteristic.writeValue(chunk);
          await new Promise((r) => setTimeout(r, 18));
        }
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.device && this.device.gatt?.connected) {
      try {
        await this.device.gatt.disconnect();
      } catch {}
    }
    this.device = null;
    this.characteristic = null;
  }

  // Forgets the stored printer credentials to allow fresh pairing
  clearSavedPrinter(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.DEVICE_ID);
      localStorage.removeItem(this.STORAGE_KEYS.DEVICE_NAME);
      localStorage.removeItem(this.STORAGE_KEYS.SERVICE_UUID);
      localStorage.removeItem(this.STORAGE_KEYS.CHAR_UUID);
    } catch {}
    this.disconnect();
  }

  isConnected(): boolean {
    return Boolean(this.device && this.device.gatt && this.device.gatt.connected && this.characteristic);
  }

  getConnectedDeviceName(): string | null {
    return this.device?.name || this.getLastPairedDeviceName() || null;
  }

  // Trigger cash drawer kick-out command via connected Bluetooth POS Printer
  async kickDrawer(): Promise<boolean> {
    try {
      if (!this.isConnected()) return false;
      const encoder = new EscPosEncoder();
      encoder.openDrawer(0);
      await this.printData(encoder.encode());
      return true;
    } catch (err) {
      console.warn('Could not kick drawer via Bluetooth printer:', err);
      return false;
    }
  }
}

export const blePrinter = new BluetoothPosPrinter();
