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

  // Get raw Uint8Array
  encode(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

// Web Bluetooth BLE POS Printer Manager
class BluetoothPosPrinter {
  private device: any = null;
  private characteristic: any = null;

  // Known Bluetooth Service UUIDs for Thermal POS printers (standard BLE serial / print services)
  private readonly PRINT_SERVICES = [
    '000018f0-0000-1000-8000-00805f9b34fb', // Standard Print Service
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // POS80 / POS58 Common BLE
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent UART
    '0000ff00-0000-1000-8000-00805f9b34fb', // Common ESC/POS vendor service
    '0000ae00-0000-1000-8000-00805f9b34fb', // Android/iOS POS Mini
    '0000fee7-0000-1000-8000-00805f9b34fb', // Tencent / POS80 BLE
  ];

  isBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  async connect(): Promise<{ name: string }> {
    if (!this.isBluetoothSupported()) {
      throw new Error("L'API Web Bluetooth n'est pas supportée par ce navigateur. Utilisez Chrome/Edge ou activez Bluetooth.");
    }

    try {
      const nav = navigator as any;
      // Request device with optional services
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: this.PRINT_SERVICES,
      });

      this.device = device;

      // Connect to GATT Server
      const server = await device.gatt.connect();

      // Find valid writable characteristic for printing
      let writeChar: any = null;

      // Try discovering primary services
      for (const serviceUuid of this.PRINT_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              writeChar = char;
              break;
            }
          }
          if (writeChar) break;
        } catch {
          // Continue searching
        }
      }

      // Fallback: enumerate all primary services
      if (!writeChar) {
        const services = await server.getPrimaryServices();
        for (const service of services) {
          try {
            const characteristics = await service.getCharacteristics();
            for (const char of characteristics) {
              if (char.properties.write || char.properties.writeWithoutResponse) {
                writeChar = char;
                break;
              }
            }
            if (writeChar) break;
          } catch {
            // ignore
          }
        }
      }

      if (!writeChar) {
        throw new Error("Impossible de trouver le canal d'écriture d'impression Bluetooth sur cette imprimante.");
      }

      this.characteristic = writeChar;
      return { name: device.name || 'Imprimante POS80 BLE' };
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        throw new Error("Connexion annulée : aucune imprimante sélectionnée.");
      }
      throw new Error(`Erreur Bluetooth: ${err.message || err}`);
    }
  }

  async printData(data: Uint8Array): Promise<void> {
    if (!this.characteristic) {
      await this.connect();
    }

    if (!this.characteristic) {
      throw new Error("Imprimante non connectée.");
    }

    // Send in chunks of 100 bytes to avoid BLE buffer overflow
    const CHUNK_SIZE = 100;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      if (this.characteristic.writeValueWithoutResponse) {
        await this.characteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.characteristic.writeValue(chunk);
      }
      // Brief delay between chunks
      await new Promise((r) => setTimeout(r, 20));
    }
  }

  async disconnect(): Promise<void> {
    if (this.device && this.device.gatt.connected) {
      await this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
  }

  isConnected(): boolean {
    return Boolean(this.device && this.device.gatt && this.device.gatt.connected && this.characteristic);
  }

  getConnectedDeviceName(): string | null {
    return this.device ? this.device.name || 'POS-80 BLE' : null;
  }
}

export const blePrinter = new BluetoothPosPrinter();
