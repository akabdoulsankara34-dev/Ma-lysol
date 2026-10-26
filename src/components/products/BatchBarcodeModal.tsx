import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../../types';
import { 
  Barcode, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Upload, 
  Download, 
  Zap, 
  Layers, 
  Copy, 
  ArrowRight, 
  RotateCcw,
  Search,
  Check,
  FileSpreadsheet,
  ScanBarcode,
  Keyboard,
  Info
} from 'lucide-react';
import { usbBarcodeScanner, stripAimAndControlChars } from '../../lib/usbBarcodeScanner';
import { soundEffects } from '../../lib/sound';
import confetti from 'canvas-confetti';

interface BatchBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  businessCurrency: string;
  businessName: string;
  onBatchUpdate: (updates: { id: string; updates: Partial<Product> }[]) => Promise<void>;
}

export const BatchBarcodeModal: React.FC<BatchBarcodeModalProps> = ({
  isOpen,
  onClose,
  products,
  businessCurrency,
  businessName,
  onBatchUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'one_click' | 'import_csv' | 'chrono_scan'>('one_click');
  const [generationStrategy, setGenerationStrategy] = useState<'sku_as_barcode' | 'clean_ean13' | 'prefix_sequential'>('sku_as_barcode');
  const [isApplying, setIsApplying] = useState(false);
  const [appliedCount, setAppliedCount] = useState<number | null>(null);

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [csvPreviewMatches, setCsvPreviewMatches] = useState<{
    productId: string;
    productName: string;
    productSku: string;
    oldBarcode?: string;
    newBarcode: string;
  }[]>([]);
  const [csvUnmatched, setCsvUnmatched] = useState<string[]>([]);

  // Chrono Scan State (Continuous rapid USB scanner assignment)
  const [chronoScanIndex, setChronoScanIndex] = useState(0);
  const [chronoScanHistory, setChronoScanHistory] = useState<{ id: string; name: string; code: string }[]>([]);

  // Filter products without barcodes vs with barcodes
  const productsWithoutBarcode = useMemo(() => {
    return products.filter(p => !p.archived && (!p.barcode || p.barcode.trim() === ''));
  }, [products]);

  const productsWithBarcode = useMemo(() => {
    return products.filter(p => !p.archived && p.barcode && p.barcode.trim() !== '');
  }, [products]);

  const totalActive = useMemo(() => {
    return products.filter(p => !p.archived).length;
  }, [products]);

  // Compute previews for 1-Click Generation
  const previewUpdates = useMemo(() => {
    // Generate clean unique codes for products without barcode
    const updates: { product: Product; generatedBarcode: string }[] = [];
    const usedCodes = new Set<string>();

    // Register existing barcodes to prevent collisions
    products.forEach(p => {
      if (p.barcode) usedCodes.add(p.barcode.trim().toUpperCase());
    });

    productsWithoutBarcode.forEach((p, idx) => {
      let code = '';
      if (generationStrategy === 'sku_as_barcode') {
        // Option 1: Use product SKU / Reference directly
        code = p.sku.trim();
        // If empty or colliding, append suffix
        if (!code || usedCodes.has(code.toUpperCase())) {
          code = `${p.sku || 'ART'}-${String(idx + 1).padStart(3, '0')}`;
        }
      } else if (generationStrategy === 'clean_ean13') {
        // Option 2: EAN-13 format starting with 618 (Burkina Faso Country Code)
        // 618 + 8 digits + 1 checksum
        const baseNum = 10000000 + idx;
        const ean12 = `618${String(baseNum).slice(-9)}`;
        // Calculate check digit
        let sum = 0;
        for (let i = 0; i < 12; i++) {
          const digit = parseInt(ean12[i], 10);
          sum += (i % 2 === 0) ? digit : digit * 3;
        }
        const check = (10 - (sum % 10)) % 10;
        code = `${ean12}${check}`;
      } else {
        // Option 3: Standard retail prefix: e.g. BF-ROB-001 or MAE-XXXX
        const cleanNamePart = p.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'ART';
        code = `BF-${cleanNamePart}-${String(idx + 1).padStart(4, '0')}`;
      }

      usedCodes.add(code.toUpperCase());
      updates.push({ product: p, generatedBarcode: code });
    });

    return updates;
  }, [productsWithoutBarcode, products, generationStrategy]);

  // Listen to USB Barcode Scanner when Chrono-Scan tab is active
  useEffect(() => {
    if (!isOpen || activeTab !== 'chrono_scan') return;

    const unsubscribe = usbBarcodeScanner.subscribe((scannedCode) => {
      const targetProduct = productsWithoutBarcode[chronoScanIndex];
      if (!targetProduct) return;

      const cleanCode = stripAimAndControlChars(scannedCode).trim();
      if (!cleanCode) return;

      // Update this product
      onBatchUpdate([{ id: targetProduct.id, updates: { barcode: cleanCode } }]);
      soundEffects.playBarcodeBeep();

      setChronoScanHistory(prev => [
        { id: targetProduct.id, name: targetProduct.name, code: cleanCode },
        ...prev
      ]);

      // Automatically advance to next item
      if (chronoScanIndex < productsWithoutBarcode.length - 1) {
        setChronoScanIndex(prev => prev + 1);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, activeTab, chronoScanIndex, productsWithoutBarcode, onBatchUpdate]);

  // Handle 1-Click Batch Apply
  const handleApply1Click = async () => {
    if (previewUpdates.length === 0 || isApplying) return;
    setIsApplying(true);

    try {
      const payload = previewUpdates.map(item => ({
        id: item.product.id,
        updates: { barcode: item.generatedBarcode }
      }));

      await onBatchUpdate(payload);
      soundEffects.playBarcodeBeep();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch {}

      setAppliedCount(payload.length);
      setTimeout(() => {
        setAppliedCount(null);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Batch barcode application error:', err);
    } finally {
      setIsApplying(false);
    }
  };

  // Parse CSV text for batch import
  const handleParseCsv = (text: string) => {
    setCsvText(text);
    if (!text.trim()) {
      setCsvPreviewMatches([]);
      setCsvUnmatched([]);
      return;
    }

    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    const matches: typeof csvPreviewMatches = [];
    const unmatched: string[] = [];

    lines.forEach(line => {
      // Split by tab, semicolon, comma or pipe
      const parts = line.split(/[;\t,|]/).map(p => p.trim()).filter(Boolean);
      if (parts.length < 2) return;

      const identifier = parts[0];
      const newBarcode = parts[1];

      // Match by SKU or Name or existing Barcode
      const idClean = identifier.toLowerCase().replace(/[^a-z0-9]/g, '');
      const foundProduct = products.find(p => {
        if (p.archived) return false;
        const pSkuClean = p.sku.toLowerCase().replace(/[^a-z0-9]/g, '');
        const pNameClean = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return (
          p.sku.toLowerCase() === identifier.toLowerCase() ||
          p.name.toLowerCase() === identifier.toLowerCase() ||
          pSkuClean === idClean ||
          pNameClean.includes(idClean)
        );
      });

      if (foundProduct) {
        matches.push({
          productId: foundProduct.id,
          productName: foundProduct.name,
          productSku: foundProduct.sku,
          oldBarcode: foundProduct.barcode,
          newBarcode: newBarcode
        });
      } else {
        unmatched.push(line);
      }
    });

    setCsvPreviewMatches(matches);
    setCsvUnmatched(unmatched);
  };

  const handleApplyCsvImport = async () => {
    if (csvPreviewMatches.length === 0 || isApplying) return;
    setIsApplying(true);

    try {
      const payload = csvPreviewMatches.map(m => ({
        id: m.productId,
        updates: { barcode: m.newBarcode }
      }));

      await onBatchUpdate(payload);
      soundEffects.playBarcodeBeep();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch {}

      setAppliedCount(payload.length);
      setTimeout(() => {
        setAppliedCount(null);
        setCsvText('');
        setCsvPreviewMatches([]);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('CSV barcode import error:', err);
    } finally {
      setIsApplying(false);
    }
  };

  const downloadSampleCsv = () => {
    const header = 'Référence;CodeBarres;NomArticle\n';
    const sampleRows = products.slice(0, 5).map(p => 
      `${p.sku};${p.barcode || '61811000' + Math.floor(1000 + Math.random() * 9000)};${p.name}`
    ).join('\n');

    const blob = new Blob([header + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `modele_import_codes_barres_${businessName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  const currentChronoProduct = productsWithoutBarcode[chronoScanIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-xs">
              <Barcode className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-lg">
                  Liaison & Attribution de Codes-Barres en Masse
                </h3>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                  1 Clic
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Liez en un seul clic tous les articles sans code-barres à leur référence ou générez des codes EAN standards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-full transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Catalog Barcode KPI Overview */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="bg-white p-3 rounded-2xl border border-slate-200">
            <div className="text-slate-400 font-bold uppercase text-[10px]">Catalogue Total</div>
            <div className="text-base sm:text-lg font-black text-slate-800 mt-0.5">{totalActive} articles</div>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-emerald-200 bg-emerald-50/30">
            <div className="text-emerald-700 font-bold uppercase text-[10px] flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Avec Code-barres</span>
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-800 mt-0.5">
              {productsWithBarcode.length} articles
            </div>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-amber-200 bg-amber-50/40">
            <div className="text-amber-700 font-bold uppercase text-[10px] flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              <span>Sans Code-barres</span>
            </div>
            <div className="text-base sm:text-lg font-black text-amber-800 mt-0.5">
              {productsWithoutBarcode.length} articles à lier
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('one_click')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition cursor-pointer ${
              activeTab === 'one_click'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>⚡ Liaison Automatique (1 Clic)</span>
          </button>

          <button
            onClick={() => setActiveTab('import_csv')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition cursor-pointer ${
              activeTab === 'import_csv'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>📥 Importer / Coller Excel & CSV</span>
          </button>

          <button
            onClick={() => setActiveTab('chrono_scan')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition cursor-pointer ${
              activeTab === 'chrono_scan'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ScanBarcode className="h-4 w-4" />
            <span>🔫 Chrono-Scan USB (Mains-libres)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {appliedCount !== null && (
            <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-2xl text-emerald-900 font-bold text-sm flex items-center space-x-2 animate-in zoom-in-95">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>Succès ! {appliedCount} codes-barres ont été enregistrés et liés avec succès !</span>
            </div>
          )}

          {/* TAB 1: ONE CLICK AUTOMATIC ASSIGNMENT */}
          {activeTab === 'one_click' && (
            <div className="space-y-4">
              {productsWithoutBarcode.length === 0 ? (
                <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200">
                  <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-2" />
                  <h4 className="font-bold text-emerald-900 text-base">Tous vos articles ont déjà un code-barres !</h4>
                  <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
                    Aucun article sans code-barres détecté. Votre catalogue est 100% prêt pour les scans à la douchette USB et l'impression d'étiquettes.
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
                    <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      <span>Choisissez la méthode de liaison en 1 clic :</span>
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                      {/* Strategy 1: SKU / Model to Barcode */}
                      <button
                        type="button"
                        onClick={() => setGenerationStrategy('sku_as_barcode')}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          generationStrategy === 'sku_as_barcode'
                            ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 text-slate-900 shadow-xs'
                            : 'bg-white/70 border-slate-200 text-slate-600 hover:bg-white'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>Code-barres = Réf / Modèle</span>
                          {generationStrategy === 'sku_as_barcode' && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Copie la référence ou le modèle (ex: <em>W572</em>, <em>MAE-ROB-001</em>) dans le code-barres.
                        </p>
                      </button>

                      {/* Strategy 2: EAN-13 Standard */}
                      <button
                        type="button"
                        onClick={() => setGenerationStrategy('clean_ean13')}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          generationStrategy === 'clean_ean13'
                            ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 text-slate-900 shadow-xs'
                            : 'bg-white/70 border-slate-200 text-slate-600 hover:bg-white'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>Standard EAN-13 (618...)</span>
                          {generationStrategy === 'clean_ean13' && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Génère 13 chiffres officiels avec clé de contrôle (format international Burkinabè).
                        </p>
                      </button>

                      {/* Strategy 3: Prefix + Sequential */}
                      <button
                        type="button"
                        onClick={() => setGenerationStrategy('prefix_sequential')}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          generationStrategy === 'prefix_sequential'
                            ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 text-slate-900 shadow-xs'
                            : 'bg-white/70 border-slate-200 text-slate-600 hover:bg-white'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>Préfixe Boutique + Numéro</span>
                          {generationStrategy === 'prefix_sequential' && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Format clair et lisible : <em>BF-ROB-0001</em>, <em>BF-SAV-0002</em>.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Preview Table of What Will Be Linked */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                        Aperçu des {previewUpdates.length} articles qui seront liés en 1 clic :
                      </h4>
                      <span className="text-xs text-slate-500">
                        Total : {previewUpdates.length} à mettre à jour
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {previewUpdates.map(({ product, generatedBarcode }) => (
                        <div key={product.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50 text-xs">
                          <div className="min-w-0 pr-3">
                            <div className="font-bold text-slate-900 truncate">{product.name}</div>
                            <div className="text-[11px] text-slate-400">
                              Réf: <span className="font-mono text-slate-600 font-semibold">{product.sku}</span> • Cat: {product.category}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="text-[10px] text-slate-400">Code attribué :</span>
                            <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-900 font-mono font-black rounded-lg text-xs">
                              {generatedBarcode}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Big Action Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={isApplying}
                      onClick={handleApply1Click}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-600/30 transition flex items-center space-x-2 cursor-pointer"
                    >
                      <Zap className="h-4 w-4" />
                      <span>
                        {isApplying 
                          ? 'Enregistrement en cours...' 
                          : `Lier les ${previewUpdates.length} articles en 1 Clic`}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: IMPORT / PASTE CSV & EXCEL */}
          {activeTab === 'import_csv' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    <span>Collez votre tableau Excel ou CSV :</span>
                  </p>
                  <button
                    type="button"
                    onClick={downloadSampleCsv}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Télécharger Modèle CSV</span>
                  </button>
                </div>
                <p className="text-slate-600">
                  Copiez vos colonnes depuis Excel (ex: <strong>Référence</strong> et <strong>Code-Barres</strong>) et collez-les directement ci-dessous :
                </p>
              </div>

              <div>
                <textarea
                  rows={5}
                  placeholder={`Exemple :\nW572; 8412345678901\nMAE-ROB-001; 618110001001\nSavon Noir; 618110001022`}
                  value={csvText}
                  onChange={(e) => handleParseCsv(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {csvPreviewMatches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2 text-xs">
                    <h4 className="font-bold text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{csvPreviewMatches.length} articles reconnus prêts à lier :</span>
                    </h4>
                  </div>

                  <div className="border border-emerald-200 bg-emerald-50/30 rounded-2xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-emerald-100 text-xs">
                    {csvPreviewMatches.map(m => (
                      <div key={m.productId} className="p-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900">{m.productName}</span>
                          <span className="text-slate-500 ml-1.5 font-mono">({m.productSku})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {m.oldBarcode && (
                            <span className="line-through text-slate-400 font-mono text-[11px]">
                              {m.oldBarcode}
                            </span>
                          )}
                          <ArrowRight className="h-3 w-3 text-emerald-600" />
                          <span className="px-2 py-0.5 bg-emerald-600 text-white font-mono font-bold rounded">
                            {m.newBarcode}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      type="button"
                      disabled={isApplying}
                      onClick={handleApplyCsvImport}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-2 cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      <span>Lier les {csvPreviewMatches.length} codes-barres importés</span>
                    </button>
                  </div>
                </div>
              )}

              {csvUnmatched.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  <span className="font-bold">{csvUnmatched.length} lignes non reconnues :</span> Vérifiez que la référence ou le nom correspond exactement à un article existant.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONTINUOUS SERIAL USB CHRONO-SCAN */}
          {activeTab === 'chrono_scan' && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-start space-x-3 text-xs text-purple-900">
                <ScanBarcode className="h-6 w-6 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-sm">Mode Chrono-Scan USB Mains-libres</p>
                  <p className="mt-0.5 text-purple-700">
                    Bipez les articles physiques l'un après l'autre avec votre douchette USB. Le code est enregistré et l'écran passe <strong>automatiquement</strong> à l'article suivant sans clic !
                  </p>
                </div>
              </div>

              {productsWithoutBarcode.length === 0 ? (
                <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
                  <p className="font-bold text-emerald-900">Aucun article en attente de code-barres !</p>
                </div>
              ) : currentChronoProduct ? (
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden">
                  <div className="absolute top-3 right-4 px-2.5 py-1 bg-white/20 rounded-full text-[10px] font-bold">
                    Article {chronoScanIndex + 1} / {productsWithoutBarcode.length}
                  </div>

                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                    En attente de scan douchette...
                  </span>

                  <h3 className="text-xl sm:text-2xl font-black">
                    {currentChronoProduct.name}
                  </h3>

                  <div className="flex items-center space-x-3 text-xs font-mono text-blue-100">
                    <span>Réf : {currentChronoProduct.sku}</span>
                    <span>•</span>
                    <span>Prix : {currentChronoProduct.salePrice.toLocaleString('fr-FR')} {businessCurrency}</span>
                    <span>•</span>
                    <span>Catégorie : {currentChronoProduct.category}</span>
                  </div>

                  <div className="pt-2 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (chronoScanIndex < productsWithoutBarcode.length - 1) {
                          setChronoScanIndex(prev => prev + 1);
                        }
                      }}
                      className="px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Passer cet article &rarr;
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Scan History */}
              {chronoScanHistory.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs text-slate-600 uppercase tracking-wider mb-2">
                    Articles récemment bippés ({chronoScanHistory.length}) :
                  </h4>
                  <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-40 overflow-y-auto text-xs">
                    {chronoScanHistory.map(h => (
                      <div key={h.id} className="p-2.5 flex items-center justify-between">
                        <span className="font-bold text-slate-800">{h.name}</span>
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {h.code}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 flex items-center gap-1.5">
            <Info className="h-4 w-4 text-slate-400" />
            <span>Tous les codes-barres attribués sont instantanément reconnus par les douchettes USB à la caisse.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
