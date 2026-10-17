/**
 * Code 128 Barcode Generator (Subset B) in Pure TypeScript.
 * Produces crisp, standard-compliant vector SVG barcodes that can be read
 * directly from screens or printed on thermal paper / label sheets by any
 * commercial USB or wireless barcode scanner (Netum, Zebra, Honeywell, Inateck, Tera, etc.)
 * Standard: ISO/IEC 15417.
 */

// Code 128 character patterns: bar/space widths (e.g. '212222' = 2 bar, 1 space, 2 bar, 2 space, 2 bar, 2 space = 11 modules)
const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112' // 100-106 (106 is STOP pattern 13 modules)
];

const START_B = 104; // Start Code B pattern index
const STOP = 106; // Stop pattern index

export interface BarcodeRenderOptions {
  width?: number;
  height?: number;
  showText?: boolean;
  barColor?: string;
  bgColor?: string;
  fontSize?: number;
}

/**
 * Encodes text into Code 128 (Subset B) modules.
 * Returns an array of module values (true = bar, false = space).
 */
export function encodeCode128B(text: string): boolean[] {
  if (!text) return [];

  // Start with Start Code B
  const values: number[] = [START_B];
  let checkSum = START_B;

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // Code 128B maps ASCII 32-127 directly to value = charCode - 32
    const val = (charCode >= 32 && charCode <= 126) ? charCode - 32 : 0;
    values.push(val);
    checkSum += val * (i + 1);
  }

  // Check character
  const checkDigit = checkSum % 103;
  values.push(checkDigit);
  // Stop character
  values.push(STOP);

  // Convert pattern strings to boolean modules
  const modules: boolean[] = [];

  // 10 modules quiet zone at start
  for (let q = 0; q < 10; q++) modules.push(false);

  for (const val of values) {
    const pattern = CODE128_PATTERNS[val];
    if (!pattern) continue;
    let isBar = true;
    for (let p = 0; p < pattern.length; p++) {
      const width = parseInt(pattern[p], 10);
      for (let w = 0; w < width; w++) {
        modules.push(isBar);
      }
      isBar = !isBar;
    }
  }

  // 10 modules quiet zone at end
  for (let q = 0; q < 10; q++) modules.push(false);

  return modules;
}

/**
 * Generates an SVG string of a 100% compliant Code 128 barcode.
 */
export function generateCode128Svg(text: string, options: BarcodeRenderOptions = {}): string {
  const {
    height = 64,
    showText = true,
    barColor = '#0f172a',
    bgColor = '#ffffff',
    fontSize = 11,
  } = options;

  const modules = encodeCode128B(text);
  if (modules.length === 0) return '';

  const moduleWidth = 2; // SVG user units per module
  const svgWidth = modules.length * moduleWidth;
  const barHeight = showText ? height - fontSize - 6 : height;

  let rects = '';
  let inBar = false;
  let barStart = 0;

  for (let i = 0; i < modules.length; i++) {
    if (modules[i] && !inBar) {
      inBar = true;
      barStart = i;
    } else if (!modules[i] && inBar) {
      inBar = false;
      const w = (i - barStart) * moduleWidth;
      const x = barStart * moduleWidth;
      rects += `<rect x="${x}" y="0" width="${w}" height="${barHeight}" fill="${barColor}" />`;
    }
  }

  if (inBar) {
    const w = (modules.length - barStart) * moduleWidth;
    const x = barStart * moduleWidth;
    rects += `<rect x="${x}" y="0" width="${w}" height="${barHeight}" fill="${barColor}" />`;
  }

  const textElement = showText
    ? `<text x="${svgWidth / 2}" y="${height - 2}" text-anchor="middle" font-family="monospace" font-size="${fontSize}" font-weight="bold" fill="${barColor}" letter-spacing="2">${text}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${height}" width="100%" height="${height}" style="background-color: ${bgColor}; display: block; shape-rendering: crispEdges;">
    <rect width="${svgWidth}" height="${height}" fill="${bgColor}" />
    ${rects}
    ${textElement}
  </svg>`;
}
