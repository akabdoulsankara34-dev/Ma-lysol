import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice, InvoiceItem, Product } from '../../types';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer
} from 'lucide-react';

export const InvoicesView: React.FC = () => {
  const { business, currentUser, invoices } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Facturation Client
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Éditez des factures, suivez les paiements et relancez vos clients.
          </p>
        </div>

        <button
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Créer une Facture</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une facture par numéro ou nom du client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center p-6">
            <FileText className="h-10 w-10 mb-2 opacity-30 text-slate-400" />
            <p className="text-sm font-medium text-slate-600">Aucune facture trouvée</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Cliquez sur "Créer une Facture" pour démarrer.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Facture</th>
                  <th className="py-3 px-3">Client</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Statut</th>
                  <th className="py-3 px-3 text-right">Montant</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-800">{inv.customerName}</p>
                      {inv.customerPhone && <p className="text-[10px] text-slate-500">{inv.customerPhone}</p>}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(inv.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        inv.status === 'partial' ? 'bg-blue-100 text-blue-800' :
                        inv.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.status === 'paid' ? 'Payée' :
                         inv.status === 'partial' ? 'Partielle' :
                         inv.status === 'cancelled' ? 'Annulée' :
                         'Impayée'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <p className="font-bold text-slate-900">{inv.total.toLocaleString()} {business.currency}</p>
                      {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                        <p className="text-[10px] text-amber-600 font-semibold">Reste: {(inv.total - inv.amountPaid).toLocaleString()}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Télécharger PDF">
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
