import React, { useState } from 'react';
import { Sale, Business } from '../../types';
import { 
  X, 
  Printer, 
  Share2, 
  CheckCircle, 
  MessageCircle, 
  Download,
  Calendar,
  User,
  CreditCard,
  Phone,
  Bluetooth,
  Wifi,
  AlertCircle,
  Check
} from 'lucide-react';
import { blePrinter, EscPosEncoder } from '../../lib/blePrinter';

interface ReceiptModalProps {
  sale: Sale;
  business: Business;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, business, onClose }) => {
  const [isBlePrinting, setIsBlePrinting] = useState(false);
  const [bleStatus, setBleStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Espèces (Cash)';
      case 'orange_money': return 'Orange Money (OM)';
      case 'moov_money': return 'Moov Money';
      case 'wave_coris': return 'Wave / Coris Money';
      case 'credit': return 'Vente à Crédit';
      case 'split': return 'Paiement Mixte';
      default: return method;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Direct Bluetooth Thermal Printing for POS80 / POS58 BLE Printers
  const handleBlePrint = async () => {
    setIsBlePrinting(true);
    setBleStatus({ type: 'info', message: 'Connexion à l\'imprimante POS-80 BLE...' });

    try {
      // Build ESC/POS Byte Stream
      const encoder = new EscPosEncoder();
      
      // Store Header
      encoder.initialize()
        .align('center')
        .bold(true)
        .textSize(2, 2)
        .textLine(business.name.toUpperCase())
        .textSize(1, 1)
        .bold(false)
        .textLine(business.city)
        .textLine(`Tel : ${business.phone}`);
      
      if (business.ifu) {
        encoder.textLine(`IFU : ${business.ifu}`);
      }

      encoder.divider('-', 42)
        .align('left')
        .textLine(`Ticket N : ${sale.receiptNumber}`)
        .textLine(`Date : ${new Date(sale.createdAt).toLocaleDateString('fr-FR')} ${new Date(sale.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`)
        .textLine(`Caissier : ${sale.sellerName}`);
      
      if (sale.customerName && sale.customerName !== 'Client Comptoir') {
        encoder.textLine(`Client : ${sale.customerName}`);
      }

      encoder.divider('-', 42)
        .row('ARTICLE', 'TOTAL (FCFA)', 42);

      sale.items.forEach(item => {
        const itemLine = `${item.quantity}x ${item.productName}`;
        const itemTotal = `${item.subtotal.toLocaleString()} ${business.currency}`;
        encoder.row(itemLine.slice(0, 24), itemTotal, 42);
      });

      encoder.divider('-', 42);

      if (sale.discount > 0) {
        encoder.row('Sous-total :', `${sale.subtotal.toLocaleString()} ${business.currency}`, 42)
          .row('Remise :', `-${sale.discount.toLocaleString()} ${business.currency}`, 42);
      }

      encoder.bold(true)
        .textSize(2, 2)
        .row('TOTAL :', `${sale.total.toLocaleString()} ${business.currency}`, 32)
        .textSize(1, 1)
        .bold(false)
        .row('Reglement :', getPaymentLabel(sale.paymentMethod), 42)
        .divider('=', 42)
        .align('center')
        .textLine(business.receiptFooter || 'Merci pour votre achat !')
        .textLine('BizPilot BF POS80 BLE')
        .cut();

      const rawBytes = encoder.encode();
      await blePrinter.printData(rawBytes);

      setBleStatus({ type: 'success', message: 'Ticket imprimé sur POS-80 BLE avec succès !' });
      setTimeout(() => setBleStatus(null), 4000);
    } catch (err: any) {
      setBleStatus({ 
        type: 'error', 
        message: err.message || 'Échec de transmission Bluetooth vers la POS80.' 
      });
      setTimeout(() => setBleStatus(null), 6000);
    } finally {
      setIsBlePrinting(false);
    }
  };

  // Generate WhatsApp preformatted receipt message
  const handleShareWhatsApp = () => {
    const dateFormatted = new Date(sale.createdAt).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let itemsText = sale.items
      .map(item => `• ${item.quantity}x ${item.productName} = ${item.subtotal.toLocaleString()} ${business.currency}`)
      .join('\n');

    let text = `🧾 *REÇU DE VENTE - ${business.name.toUpperCase()}*\n`;
    text += `N° Ticket : *${sale.receiptNumber}*\n`;
    text += `Date : ${dateFormatted}\n`;
    text += `Caissier : ${sale.sellerName}\n`;
    if (sale.customerName && sale.customerName !== 'Client Comptoir') {
      text += `Client : ${sale.customerName}\n`;
    }
    text += `--------------------------------\n`;
    text += `*DÉTAILS DES ACHATS :*\n${itemsText}\n`;
    text += `--------------------------------\n`;
    if (sale.discount > 0) {
      text += `Sous-total : ${sale.subtotal.toLocaleString()} ${business.currency}\n`;
      text += `Remise accordée : -${sale.discount.toLocaleString()} ${business.currency}\n`;
    }
    text += `*TOTAL PAYÉ : ${sale.total.toLocaleString()} ${business.currency}*\n`;
    text += `Mode de règlement : ${getPaymentLabel(sale.paymentMethod)}\n`;
    text += `--------------------------------\n`;
    text += `${business.receiptFooter || 'Merci pour votre confiance !'}\n`;
    text += `📞 Contact : ${business.phone}\n`;
    if (business.ifu) text += `N° IFU : ${business.ifu}`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-emerald-400" />
            <div>
              <h3 className="font-bold text-base">Vente Validée avec Succès</h3>
              <p className="text-xs text-slate-300">Ticket N° {sale.receiptNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Box */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 max-h-[55vh] overflow-y-auto print:max-h-none">
          <div 
            id="thermal-receipt" 
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs font-mono text-xs text-slate-800 space-y-3"
          >
            {/* Store Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
              <p className="font-extrabold text-sm tracking-wide text-slate-900">{business.name.toUpperCase()}</p>
              <p className="text-[11px] text-slate-600">{business.city}</p>
              <p className="text-[11px] text-slate-600">Tél : {business.phone}</p>
              {business.ifu && <p className="text-[10px] text-slate-500">N° IFU : {business.ifu}</p>}
            </div>

            {/* Meta Info */}
            <div className="space-y-1 text-[11px] text-slate-600 pb-2 border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span>N° Ticket :</span>
                <span className="font-bold text-slate-900">{sale.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date :</span>
                <span>{new Date(sale.createdAt).toLocaleDateString('fr-FR')} {new Date(sale.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span>Caissier :</span>
                <span>{sale.sellerName}</span>
              </div>
              {sale.customerName && (
                <div className="flex justify-between">
                  <span>Client :</span>
                  <span className="font-semibold text-slate-900">{sale.customerName}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="space-y-1.5 pb-3 border-b border-dashed border-slate-300">
              <div className="flex justify-between font-bold text-[11px] text-slate-900 pb-1">
                <span>Article</span>
                <span>Total</span>
              </div>
              {sale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <div className="pr-2">
                    <p className="font-medium text-slate-900">{item.productName}</p>
                    <p className="text-[10px] text-slate-500">
                      {item.quantity} x {item.unitPrice.toLocaleString()} {business.currency}
                    </p>
                  </div>
                  <span className="font-semibold text-slate-900 whitespace-nowrap">
                    {item.subtotal.toLocaleString()} {business.currency}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-slate-300">
              {sale.discount > 0 && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Sous-total :</span>
                    <span>{sale.subtotal.toLocaleString()} {business.currency}</span>
                  </div>
                  <div className="flex justify-between text-blue-700 font-semibold">
                    <span>Remise accordée :</span>
                    <span>-{sale.discount.toLocaleString()} {business.currency}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm font-extrabold text-slate-950 pt-1">
                <span>TOTAL :</span>
                <span>{sale.total.toLocaleString()} {business.currency}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600 pt-1">
                <span>Règlement :</span>
                <span className="font-semibold text-slate-900">{getPaymentLabel(sale.paymentMethod)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-1 text-[10px] text-slate-500 leading-tight">
              <p>{business.receiptFooter || 'Merci pour votre achat et à très bientôt !'}</p>
              <p className="mt-1 font-bold text-slate-600">BizPilot Burkina • Gestion de Caisse</p>
            </div>
          </div>
        </div>

        {/* BLE Status Alert */}
        {bleStatus && (
          <div className={`px-4 py-2 text-xs flex items-center gap-2 ${
            bleStatus.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' 
              : bleStatus.type === 'error'
              ? 'bg-red-50 text-red-800 border-b border-red-200'
              : 'bg-blue-50 text-blue-800 border-b border-blue-200'
          }`}>
            {bleStatus.type === 'success' ? <Check className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            <span className="font-medium">{bleStatus.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-4 bg-white space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <button
              id="btn-ble-print"
              type="button"
              disabled={isBlePrinting}
              onClick={handleBlePrint}
              className="flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-2.5 px-2 rounded-xl font-bold text-xs shadow-xs transition disabled:opacity-50"
              title="Impression sans fil directe sur Imprimante POS-80 Bluetooth"
            >
              <Bluetooth className={`h-4 w-4 ${isBlePrinting ? 'animate-spin' : ''}`} />
              <span className="truncate">POS80 BLE</span>
            </button>

            <button
              id="btn-share-whatsapp"
              type="button"
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white py-2.5 px-2 rounded-xl font-bold text-xs shadow-xs transition"
            >
              <MessageCircle className="h-4 w-4 text-emerald-100" />
              <span className="truncate">WhatsApp</span>
            </button>

            <button
              id="btn-print-receipt"
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-900 active:bg-black text-white py-2.5 px-2 rounded-xl font-bold text-xs shadow-xs transition"
            >
              <Printer className="h-4 w-4 text-slate-200" />
              <span className="truncate">Navigateur</span>
            </button>
          </div>

          <button
            id="btn-close-receipt"
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition"
          >
            Nouvelle Vente
          </button>
        </div>

      </div>
    </div>
  );
};

