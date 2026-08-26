import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Barcode, 
  Printer, 
  Search, 
  Layers, 
  CheckSquare, 
  Square, 
  Sparkles, 
  Tag, 
  Settings2,
  Maximize2
} from 'lucide-react';
import { Product } from '../../types';

export const BarcodeLabelsView: React.FC = () => {
  const { products, business } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(() => 
    products.slice(0, 6).map(p => p.id)
  );
  const [labelFormat, setLabelFormat] = useState<'a4_grid' | 'thermal_58' | 'thermal_80'>('a4_grid');
  const [copiesPerItem, setCopiesPerItem] = useState<number>(2);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showBusinessName, setShowBusinessName] = useState<boolean>(true);

  const activeProducts = useMemo(() => products.filter(p => !p.archived), [products]);

  const filteredProducts = useMemo(() => {
    return activeProducts.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm)) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activeProducts, searchTerm]);

  const toggleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Compile list of labels to render based on copies
  const labelsToPrint = useMemo(() => {
    const list: Product[] = [];
    selectedProductIds.forEach(id => {
      const prod = products.find(p => p.id === id);
      if (prod) {
        for (let i = 0; i < copiesPerItem; i++) {
          list.push(prod);
        }
      }
    });
    return list;
  }, [selectedProductIds, products, copiesPerItem]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
            <Barcode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Générateur d'Étiquettes & Code-barres</h1>
            <p className="text-sm text-slate-500">
              Impression d'étiquettes de rayonnage, planches A4 et rouleaux thermiques 58/80mm
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          disabled={labelsToPrint.length === 0}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium rounded-xl text-sm transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Lancer l'Impression ({labelsToPrint.length} étiquette{labelsToPrint.length > 1 ? 's' : ''})
        </button>
      </div>

      {/* Control Panel (Hidden when printing) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        {/* Left: Product Selection List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par article ou code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={toggleSelectAll}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer"
            >
              {selectedProductIds.length === filteredProducts.length ? (
                <><CheckSquare className="w-4 h-4" /> Tout désélectionner</>
              ) : (
                <><Square className="w-4 h-4" /> Tout sélectionner ({filteredProducts.length})</>
              )}
            </button>
          </div>

          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const isSelected = selectedProductIds.includes(p.id);
              const barcodeValue = p.barcode || p.sku || `BF-${p.id.slice(-6).toUpperCase()}`;

              return (
                <div
                  key={p.id}
                  onClick={() => toggleSelectProduct(p.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer text-xs ${
                    isSelected 
                      ? 'bg-indigo-50/70 border-indigo-300 text-slate-900' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // Handled by parent div
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <div>
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>Code: {barcodeValue}</span>
                        <span>•</span>
                        <span>Stock: {p.currentStock} {p.unit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-bold text-slate-900">
                    {p.salePrice.toLocaleString()} {business.currency}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Print Layout Configuration */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
            <Settings2 className="w-4 h-4 text-indigo-600" />
            Paramètres du Format d'Impression
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Format du Support d'Impression
            </label>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer text-xs ${labelFormat === 'a4_grid' ? 'bg-indigo-50 border-indigo-400 font-semibold text-indigo-900' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input
                  type="radio"
                  name="labelFormat"
                  value="a4_grid"
                  checked={labelFormat === 'a4_grid'}
                  onChange={() => setLabelFormat('a4_grid')}
                  className="text-indigo-600"
                />
                <div>
                  <div>Planche A4 (Grille 24 étiquettes / 70x37mm)</div>
                  <div className="text-[11px] text-slate-400 font-normal">Idéal pour imprimante de bureau standard</div>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer text-xs ${labelFormat === 'thermal_58' ? 'bg-indigo-50 border-indigo-400 font-semibold text-indigo-900' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input
                  type="radio"
                  name="labelFormat"
                  value="thermal_58"
                  checked={labelFormat === 'thermal_58'}
                  onChange={() => setLabelFormat('thermal_58')}
                  className="text-indigo-600"
                />
                <div>
                  <div>Rouleau Thermique 58mm (Ticket Continu)</div>
                  <div className="text-[11px] text-slate-400 font-normal">Pour mini imprimante thermique mobile</div>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer text-xs ${labelFormat === 'thermal_80' ? 'bg-indigo-50 border-indigo-400 font-semibold text-indigo-900' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input
                  type="radio"
                  name="labelFormat"
                  value="thermal_80"
                  checked={labelFormat === 'thermal_80'}
                  onChange={() => setLabelFormat('thermal_80')}
                  className="text-indigo-600"
                />
                <div>
                  <div>Rouleau Thermique 80mm (Grande Largeur)</div>
                  <div className="text-[11px] text-slate-400 font-normal">Pour imprimante caisse POS standard</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre d'étiquettes par article sélectionné
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={copiesPerItem}
              onChange={(e) => setCopiesPerItem(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-center"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showPrice}
                onChange={(e) => setShowPrice(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Afficher le prix de vente ({business.currency})</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showBusinessName}
                onChange={(e) => setShowBusinessName(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Afficher le nom de l'enseigne ({business.name})</span>
            </label>
          </div>
        </div>
      </div>

      {/* Live Print Preview Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 print:hidden">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Aperçu Avant Impression</h3>
          </div>
          <span className="text-xs text-slate-400">
            {labelsToPrint.length} étiquette(s) prêtes
          </span>
        </div>

        {labelsToPrint.length === 0 ? (
          <div className="text-center py-12 text-slate-400 print:hidden">
            Veuillez sélectionner au moins un article pour prévisualiser les étiquettes.
          </div>
        ) : (
          <div className={
            labelFormat === 'a4_grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 print:grid-cols-3 print:gap-2'
              : 'flex flex-col items-center space-y-3 print:space-y-2'
          }>
            {labelsToPrint.map((prod, index) => {
              const barcodeValue = prod.barcode || prod.sku || `BF-${prod.id.slice(-6).toUpperCase()}`;

              return (
                <div
                  key={`${prod.id}-${index}`}
                  className={`border border-slate-300 p-3 rounded-xl bg-white text-center flex flex-col justify-between shadow-2xs ${
                    labelFormat === 'thermal_58'
                      ? 'w-56 h-36'
                      : labelFormat === 'thermal_80'
                      ? 'w-72 h-40'
                      : 'w-full h-36'
                  }`}
                >
                  {showBusinessName && (
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 truncate">
                      {business.name}
                    </div>
                  )}

                  <div className="font-bold text-slate-900 text-xs line-clamp-2 leading-tight">
                    {prod.name}
                  </div>

                  {/* Pseudo Barcode Representation */}
                  <div className="my-1 flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center gap-[2px] h-9 w-full max-w-[150px] bg-slate-100 p-1 rounded-sm">
                      {Array.from({ length: 28 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-full ${
                            (i * 7 + index) % 3 === 0 
                              ? 'w-1 bg-slate-900' 
                              : (i * 3 + index) % 2 === 0 
                              ? 'w-[1.5px] bg-slate-900' 
                              : 'w-[0.5px] bg-slate-900'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="font-mono text-[9px] font-bold text-slate-700 tracking-widest mt-0.5">
                      {barcodeValue}
                    </div>
                  </div>

                  {showPrice && (
                    <div className="text-xs font-black text-slate-950">
                      {prod.salePrice.toLocaleString()} {business.currency}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
