import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Printer, 
  Share2, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Calendar, 
  Building2, 
  Phone, 
  Mail, 
  User, 
  ArrowRight,
  Send,
  Eye,
  FileCheck
} from 'lucide-react';
import { Quotation, QuotationItem, PaymentMethod } from '../../types';

export const ProformaInvoicesView: React.FC = () => {
  const { 
    business, 
    products, 
    customers, 
    currentUser, 
    quotations, 
    addQuotation, 
    updateQuotationStatus, 
    deleteQuotation, 
    convertQuotationToSale 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedQuotationForView, setSelectedQuotationForView] = useState<Quotation | null>(null);

  // New Quotation Form state
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [quotationNotes, setQuotationNotes] = useState('Offre valable 15 jours. Paiement à la commande.');
  const [discount, setDiscount] = useState<number>(0);
  const [items, setItems] = useState<QuotationItem[]>([
    {
      productId: products[0]?.id || 'custom_1',
      productName: products[0]?.name || 'Article Exemple',
      quantity: 1,
      unitPrice: products[0]?.salePrice || 1000,
      subtotal: products[0]?.salePrice || 1000,
    }
  ]);

  const handleAddItem = () => {
    const defaultProd = products[0];
    setItems(prev => [
      ...prev,
      {
        productId: defaultProd ? defaultProd.id : `item_${Date.now()}`,
        productName: defaultProd ? defaultProd.name : 'Nouvel Article',
        quantity: 1,
        unitPrice: defaultProd ? defaultProd.salePrice : 1000,
        subtotal: defaultProd ? defaultProd.salePrice : 1000,
      }
    ]);
  };

  const handleItemChange = (index: number, field: keyof QuotationItem, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      const target = { ...copy[index], [field]: value };
      
      if (field === 'productId') {
        const found = products.find(p => p.id === value);
        if (found) {
          target.productName = found.name;
          target.unitPrice = found.salePrice;
        }
      }

      if (field === 'quantity' || field === 'unitPrice' || field === 'productId') {
        target.subtotal = target.quantity * target.unitPrice;
      }

      copy[index] = target;
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => items.reduce((acc, it) => acc + it.subtotal, 0);
  const calculateTotal = () => Math.max(0, calculateSubtotal() - discount);

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Veuillez ajouter au moins un article');
      return;
    }

    try {
      const created = await addQuotation({
        customerId: customerId || undefined,
        customerName: customerName || 'Client Proforma',
        customerPhone: customerPhone || undefined,
        items,
        subtotal: calculateSubtotal(),
        discount,
        total: calculateTotal(),
        validUntil,
        status: 'draft',
        notes: quotationNotes,
      });

      setShowCreateModal(false);
      setSelectedQuotationForView(created);
      // Reset form
      setCustomerId('');
      setCustomerName('');
      setCustomerPhone('');
      setDiscount(0);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création du devis');
    }
  };

  const handleConvertToSale = async (quotation: Quotation) => {
    const confirm = window.confirm(`Voulez-vous convertir le devis #${quotation.quotationNumber} en vente officielle ? Les articles seront automatiquement déduits du stock.`);
    if (!confirm) return;

    try {
      await convertQuotationToSale(quotation.id, 'cash');
      alert(`Devis #${quotation.quotationNumber} converti avec succès en Vente !`);
      setSelectedQuotationForView(null);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la conversion en vente');
    }
  };

  const handleSendWhatsApp = (quotation: Quotation) => {
    const cleanPhone = (quotation.customerPhone || '').replace(/\D/g, '');
    let msg = `Bonjour ${quotation.customerName},\n\nVoici votre Devis / Facture Proforma *#${quotation.quotationNumber}* émis par *${business.name}* :\n\n`;
    
    quotation.items.forEach(it => {
      msg += `• ${it.quantity}x ${it.productName} = ${(it.unitPrice * it.quantity).toLocaleString()} ${business.currency}\n`;
    });

    if (quotation.discount > 0) {
      msg += `\nRemise accordée : -${quotation.discount.toLocaleString()} ${business.currency}`;
    }

    msg += `\n*TOTAL NET À PAYER : ${quotation.total.toLocaleString()} ${business.currency}*\n`;
    msg += `Validité de l'offre : jusqu'au ${new Date(quotation.validUntil).toLocaleDateString('fr-FR')}\n\n`;
    msg += `Pour confirmer votre commande, répondez directement à ce message. Merci de votre confiance !`;

    const url = `https://wa.me/${cleanPhone ? (cleanPhone.startsWith('226') ? cleanPhone : '226' + cleanPhone) : ''}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const filteredQuotations = quotations.filter(q => 
    q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Devis & Factures Proforma</h1>
            <p className="text-sm text-slate-500">
              Émission de propositions commerciales, envoi WhatsApp et conversion 1-clic en vente
            </p>
          </div>
        </div>

        <button
          id="btn-create-quotation"
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nouveau Devis Proforma
        </button>
      </div>

      {/* Search & List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher devis, client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            {quotations.length} devis enregistré(s)
          </div>
        </div>

        {filteredQuotations.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="font-medium text-slate-600">Aucun devis proforma pour le moment.</p>
            <p className="text-xs mt-1">Créez votre première offre commerciale pour vos clients institutionnels et particuliers.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">N° Devis</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Date & Validité</th>
                  <th className="py-3.5 px-4 text-center">Nombre Articles</th>
                  <th className="py-3.5 px-4 text-right">Montant Total</th>
                  <th className="py-3.5 px-4 text-center">Statut</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotations.map((quot) => (
                  <tr key={quot.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      {quot.quotationNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{quot.customerName}</div>
                      {quot.customerPhone && (
                        <div className="text-xs text-slate-400">{quot.customerPhone}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs text-slate-900 font-medium">
                        Créé le {new Date(quot.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-xs text-slate-400">
                        Valide jusqu'au {new Date(quot.validUntil).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium">
                      {quot.items.length} ligne(s)
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      {quot.total.toLocaleString()} {business.currency}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {quot.status === 'converted' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Vendu
                        </span>
                      ) : quot.status === 'accepted' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                          <FileCheck className="w-3 h-3" /> Accepté
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          <Clock className="w-3 h-3" /> En attente
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedQuotationForView(quot)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Visualiser / Imprimer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSendWhatsApp(quot)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Envoyer sur WhatsApp"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        {quot.status !== 'converted' && (
                          <button
                            onClick={() => handleConvertToSale(quot)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            title="Transformer en Vente"
                          >
                            <ArrowRight className="w-3.5 h-3.5" /> Vendre
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (window.confirm('Supprimer ce devis ?')) deleteQuotation(quot.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Créer Nouveau Devis */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Nouveau Devis / Facture Proforma</h3>
                  <p className="text-xs text-slate-500">Créez une offre commerciale chiffrée</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateQuotation} className="space-y-4 pt-4">
              {/* Infos Client */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sélectionner un Client Existant ou Saisir
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setCustomerId(id);
                      const c = customers.find(cust => cust.id === id);
                      if (c) {
                        setCustomerName(c.name);
                        setCustomerPhone(c.phone);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 mb-2"
                  >
                    <option value="">-- Client personnalisé / Comptoir --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom du Client / Entreprise *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: Société Barka SARL..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Téléphone (pour envoi WhatsApp)
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Ex: 70 00 00 00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date Limite de Validité
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Lignes d'articles */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Lignes d'articles chiffrées</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter une ligne
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                      <div className="flex-1">
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className="w-full bg-white px-2 py-1.5 rounded-lg border border-slate-300 text-xs"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.salePrice.toLocaleString()} {business.currency})</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          placeholder="Qté"
                          className="w-full bg-white px-2 py-1.5 rounded-lg border border-slate-300 text-xs text-center font-bold"
                        />
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                          placeholder="Prix Unit"
                          className="w-full bg-white px-2 py-1.5 rounded-lg border border-slate-300 text-xs text-right font-medium"
                        />
                      </div>

                      <div className="w-24 text-right font-bold text-slate-800">
                        {item.subtotal.toLocaleString()}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totaux & Remise */}
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-200 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Sous-total HT :</span>
                  <span className="font-semibold">{calculateSubtotal().toLocaleString()} {business.currency}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Remise Commerciale ({business.currency}) :</span>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-28 px-2 py-1 rounded-lg border border-slate-300 text-right font-bold text-xs"
                  />
                </div>
                <div className="border-t border-slate-300 pt-2 flex justify-between text-sm font-black text-slate-900">
                  <span>TOTAL NET PROFORMA :</span>
                  <span>{calculateTotal().toLocaleString()} {business.currency}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Conditions Particulières / Mentions
                </label>
                <textarea
                  rows={2}
                  value={quotationNotes}
                  onChange={(e) => setQuotationNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-xs cursor-pointer"
                >
                  Générer le Devis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualisation / Impression Format A4 Proforma */}
      {selectedQuotationForView && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:p-0 print:static print:bg-white overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 print:border-none print:shadow-none print:w-full my-8">
            {/* Header Document */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{business.name}</h2>
                <p className="text-xs text-slate-500">{business.address || 'Ouagadougou, Burkina Faso'}</p>
                <p className="text-xs text-slate-500">Tél : {business.phone}</p>
                {business.ifu && <p className="text-xs text-slate-500">N° IFU : {business.ifu}</p>}
                {business.rccm && <p className="text-xs text-slate-500">RCCM : {business.rccm}</p>}
              </div>

              <div className="text-right">
                <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-800 rounded-xl font-bold text-sm border border-blue-200">
                  DEVIS / FACTURE PROFORMA
                </div>
                <div className="font-mono text-lg font-black text-slate-900 mt-2">
                  #{selectedQuotationForView.quotationNumber}
                </div>
                <div className="text-xs text-slate-500">
                  Date : {new Date(selectedQuotationForView.createdAt).toLocaleDateString('fr-FR')}
                </div>
                <div className="text-xs font-semibold text-amber-600">
                  Validité : {new Date(selectedQuotationForView.validUntil).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>

            {/* Client Recipient */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 mb-6">
              <div className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Destinataire / Client</div>
              <div className="text-base font-bold text-slate-900">{selectedQuotationForView.customerName}</div>
              {selectedQuotationForView.customerPhone && (
                <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3 h-3 text-slate-400" /> {selectedQuotationForView.customerPhone}
                </div>
              )}
            </div>

            {/* Tableau Articles */}
            <table className="w-full text-left text-sm mb-6 border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Désignation</th>
                  <th className="py-2.5 px-4 text-center">Quantité</th>
                  <th className="py-2.5 px-4 text-right">Prix Unitaire</th>
                  <th className="py-2.5 px-4 text-right">Total ({business.currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {selectedQuotationForView.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-4 font-medium text-slate-900">{item.productName}</td>
                    <td className="py-2.5 px-4 text-center">{item.quantity}</td>
                    <td className="py-2.5 px-4 text-right">{item.unitPrice.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-bold">{item.subtotal.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Récapitulatif & Totaux */}
            <div className="flex justify-end mb-6">
              <div className="w-72 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Sous-Total :</span>
                  <span>{selectedQuotationForView.subtotal.toLocaleString()} {business.currency}</span>
                </div>
                {selectedQuotationForView.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Remise Commerciale :</span>
                    <span>-{selectedQuotationForView.discount.toLocaleString()} {business.currency}</span>
                  </div>
                )}
                <div className="border-t border-slate-300 pt-2 flex justify-between text-base font-black text-slate-900">
                  <span>TOTAL TTC :</span>
                  <span>{selectedQuotationForView.total.toLocaleString()} {business.currency}</span>
                </div>
              </div>
            </div>

            {selectedQuotationForView.notes && (
              <div className="text-xs text-slate-500 border-t border-slate-200 pt-4 mb-6 italic">
                Conditions : {selectedQuotationForView.notes}
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 print:hidden">
              <button
                onClick={() => setSelectedQuotationForView(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Fermer
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSendWhatsApp(selectedQuotationForView)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" /> Envoyer WhatsApp
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimer A4
                </button>
                {selectedQuotationForView.status !== 'converted' && (
                  <button
                    onClick={() => handleConvertToSale(selectedQuotationForView)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5" /> Convertir en Vente
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
