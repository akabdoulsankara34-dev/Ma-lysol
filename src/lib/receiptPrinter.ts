import { Sale, Business } from '../types';
import { cashDrawerService } from './cashDrawerService';

export interface PrintReceiptOptions {
  paperWidth?: '80mm' | '58mm';
  autoPrint?: boolean;
  kickDrawer?: boolean;
}

/**
 * Generates an ultra-clean, high-contrast, thermal-compatible HTML receipt string.
 * Optimized for 80mm & 58mm ESC/POS thermal printers as well as standard office printers (A4/Letter).
 */
export function generateReceiptHtml(
  sale: Sale,
  business: Business,
  options: PrintReceiptOptions = {}
): string {
  const paperWidth = options.paperWidth || '80mm';
  const is58mm = paperWidth === '58mm';

  const dateFormatted = new Date(sale.createdAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeFormatted = new Date(sale.createdAt).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

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

  const isCancelled = sale.status === 'cancelled';

  const itemsRows = sale.items.map((item) => `
    <tr>
      <td style="padding: 5px 0; text-align: left; vertical-align: top;">
        <div style="font-weight: 800; color: #000000; font-size: ${is58mm ? '12px' : '13px'}; line-height: 1.25;">${escapeHtml(item.productName)}</div>
        <div style="font-size: ${is58mm ? '11px' : '12px'}; font-weight: 600; color: #000000; margin-top: 1px;">
          ${item.quantity} x ${item.unitPrice.toLocaleString('fr-FR')} ${escapeHtml(business.currency)}
        </div>
      </td>
      <td style="padding: 5px 0; text-align: right; vertical-align: top; font-weight: 800; white-space: nowrap; font-size: ${is58mm ? '12px' : '13px'}; color: #000000;">
        ${item.subtotal.toLocaleString('fr-FR')} ${escapeHtml(business.currency)}
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reçu_${escapeHtml(sale.receiptNumber)}</title>
  <style>
    @page {
      size: ${paperWidth} auto;
      margin: 0;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
      text-rendering: geometricPrecision;
    }
    html, body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Liberation Sans", sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      width: ${paperWidth};
      max-width: 100%;
      padding: 8px 10px 24px 10px;
      margin: 0 auto;
      font-size: ${is58mm ? '12px' : '13px'};
      font-weight: 600;
      line-height: 1.35;
      color: #000000;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-normal { font-weight: 500; }
    .font-bold { font-weight: 800; }
    .font-black { font-weight: 900; }
    .uppercase { text-transform: uppercase; }
    
    .divider {
      border-top: 1.5px dashed #000000;
      margin: 7px 0;
    }
    .divider-solid {
      border-top: 1.5px solid #000000;
      margin: 7px 0;
    }
    .divider-double {
      border-top: 2.5px solid #000000;
      margin: 8px 0;
    }

    .store-name {
      font-size: ${is58mm ? '16px' : '18px'};
      font-weight: 900;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
      line-height: 1.2;
      color: #000000;
    }

    .store-info {
      font-size: ${is58mm ? '11px' : '12px'};
      font-weight: 600;
      line-height: 1.3;
      color: #000000;
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
      font-size: ${is58mm ? '11.5px' : '12.5px'};
      font-weight: 600;
      color: #000000;
    }

    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0;
    }
    table.items-table th {
      border-bottom: 2px solid #000000;
      padding: 4px 0;
      font-size: ${is58mm ? '12px' : '13px'};
      font-weight: 900;
      text-transform: uppercase;
      color: #000000;
    }

    .total-banner {
      font-size: ${is58mm ? '15px' : '17px'};
      font-weight: 900;
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      color: #000000;
      letter-spacing: 0.2px;
    }

    .cancelled-box {
      border: 2.5px solid #000000;
      padding: 6px;
      margin: 8px 0;
      text-align: center;
      font-weight: 900;
      font-size: 13px;
      color: #000000;
    }

    .footer {
      margin-top: 12px;
      font-size: ${is58mm ? '11px' : '12px'};
      text-align: center;
      line-height: 1.4;
      font-weight: 600;
      color: #000000;
    }

    .screen-actions {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-bottom: 16px;
      padding: 10px;
      background: #f1f5f9;
      border-radius: 8px;
    }
    .btn {
      padding: 8px 16px;
      font-size: 13px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
      border: none;
      font-family: sans-serif;
    }
    .btn-primary { background: #0f172a; color: #fff; }
    .btn-secondary { background: #cbd5e1; color: #1e293b; }

    @media print {
      .screen-actions {
        display: none !important;
      }
      body {
        padding: 4px 6px 16px 6px;
      }
    }
  </style>
</head>
<body>
  <div class="screen-actions" id="screen-actions">
    <button class="btn btn-primary" onclick="window.print()">🖨️ Lancer l'Impression</button>
    <button class="btn btn-secondary" onclick="window.close()">Fermer</button>
  </div>

  <!-- Store Header -->
  <div class="text-center">
    <div class="store-name uppercase">${escapeHtml(business.name)}</div>
    ${business.city ? `<div class="store-info">${escapeHtml(business.city)}</div>` : ''}
    ${business.phone ? `<div class="store-info font-bold">Tél : ${escapeHtml(business.phone)}</div>` : ''}
    ${business.ifu ? `<div class="store-info">N° IFU : ${escapeHtml(business.ifu)}</div>` : ''}
  </div>

  <div class="divider"></div>

  <!-- Cancelled Stamp if applicable -->
  ${isCancelled ? `
    <div class="cancelled-box">
      *** TICKET ANNULÉ ***<br />
      <span style="font-weight: bold; font-size: 11px;">Motif : ${escapeHtml(sale.cancellationReason || 'Annulation')}</span>
    </div>
  ` : ''}

  <!-- Meta Info -->
  <div class="meta-row">
    <span>Ticket N° :</span>
    <span class="font-bold">${escapeHtml(sale.receiptNumber)}</span>
  </div>
  <div class="meta-row">
    <span>Date :</span>
    <span class="font-bold">${dateFormatted} à ${timeFormatted}</span>
  </div>
  <div class="meta-row">
    <span>Caissier :</span>
    <span class="font-bold">${escapeHtml(sale.sellerName)}</span>
  </div>
  ${sale.customerName && sale.customerName !== 'Client Comptoir' ? `
    <div class="meta-row">
      <span>Client :</span>
      <span class="font-bold">${escapeHtml(sale.customerName)}</span>
    </div>
  ` : ''}

  <div class="divider"></div>

  <!-- Items Table -->
  <table class="items-table">
    <thead>
      <tr>
        <th class="text-left">Article</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <div class="divider"></div>

  <!-- Totals Section -->
  ${sale.discount > 0 ? `
    <div class="meta-row">
      <span>Sous-total :</span>
      <span class="font-bold">${sale.subtotal.toLocaleString('fr-FR')} ${escapeHtml(business.currency)}</span>
    </div>
    <div class="meta-row" style="font-weight: 800;">
      <span>Remise accordée :</span>
      <span class="font-bold">-${sale.discount.toLocaleString('fr-FR')} ${escapeHtml(business.currency)}</span>
    </div>
    <div class="divider"></div>
  ` : ''}

  <div class="total-banner">
    <span>TOTAL À PAYER :</span>
    <span>${sale.total.toLocaleString('fr-FR')} ${escapeHtml(business.currency)}</span>
  </div>

  <div class="divider-double"></div>

  <div class="meta-row" style="font-size: ${is58mm ? '12px' : '13px'};">
    <span>Mode de Règlement :</span>
    <span class="font-bold uppercase">${getPaymentLabel(sale.paymentMethod)}</span>
  </div>

  <!-- Receipt Footer -->
  <div class="footer">
    <p style="margin: 3px 0; font-weight: 700;">${escapeHtml(business.receiptFooter || 'Merci pour votre achat et à très bientôt !')}</p>
    <p style="font-size: 9px; font-weight: 800; color: #000000; margin-top: 6px; letter-spacing: 0.5px;">BIZPILOT BURKINA • GESTION DE CAISSE</p>
  </div>

  <!-- Cash drawer kick signal trigger for standalone tabs / print events -->
  <script>
    (function() {
      var triggered = false;
      function notifyPrintTrigger() {
        if (triggered) return;
        triggered = true;
        try {
          // Broadcast to parent BizPilot window via localStorage to kick RJ11 cash drawer
          var payload = {
            receiptNumber: ${JSON.stringify(sale.receiptNumber)},
            saleId: ${JSON.stringify(sale.id)},
            paymentMethod: ${JSON.stringify(sale.paymentMethod)},
            time: Date.now()
          };
          localStorage.setItem('bizpilot_print_kick_trigger', JSON.stringify(payload));
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'BIZPILOT_PRINT_DRAWER_KICK', data: payload }, '*');
          }
        } catch (e) {
          // ignore
        }
      }

      window.addEventListener('beforeprint', notifyPrintTrigger);
      var printBtn = document.querySelector('.btn-primary');
      if (printBtn) {
        printBtn.addEventListener('click', notifyPrintTrigger);
      }
    })();
  </script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Universal, rock-solid receipt printing:
 * 1. Tries hidden iframe print (isolated from parent DOM & transforms).
 * 2. If restricted, attaches a print portal directly to document.body and runs window.print().
 * 3. If window.print() is blocked by an iframe sandbox without allow-modals, provides a Blob URL for popup / download.
 */
export async function printReceipt(
  sale: Sale,
  business: Business,
  options: PrintReceiptOptions = {}
): Promise<{ success: boolean; fallbackType?: 'iframe' | 'portal' | 'popup_needed'; blobUrl?: string; message?: string; drawerKicked?: boolean }> {
  // Option kickDrawer (default: true) triggers the cash drawer kick via RJ11 / USB / Bluetooth
  const shouldKickDrawer = options.kickDrawer !== false;
  let drawerKicked = false;

  if (shouldKickDrawer) {
    try {
      const kickRes = await cashDrawerService.triggerDrawerOnPrintValidation({
        receiptNumber: sale.receiptNumber,
        paymentMethod: sale.paymentMethod,
        saleId: sale.id,
        operatorName: sale.sellerName,
        force: true
      });
      drawerKicked = kickRes.opened;
    } catch (err) {
      console.warn('Cash drawer kick on printReceipt notice:', err);
    }
  }

  const htmlContent = generateReceiptHtml(sale, business, options);

  // --- METHOD 1: Hidden Isolated Iframe (Best for POS thermal printing) ---
  try {
    const printSuccess = await new Promise<boolean>((resolve) => {
      let resolved = false;
      const iframe = document.createElement('iframe');
      iframe.id = 'receipt-print-iframe';
      iframe.setAttribute(
        'style',
        'position:fixed;top:-10000px;left:-10000px;width:80mm;height:100px;border:none;visibility:hidden;z-index:-1;'
      );
      document.body.appendChild(iframe);

      const cleanup = () => {
        try {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        } catch {}
      };

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(false);
        }
      }, 4000);

      try {
        const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
        if (!iframeDoc) {
          clearTimeout(timer);
          cleanup();
          resolve(false);
          return;
        }

        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();

        // Give the iframe a brief moment to render typography
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            if (!resolved) {
              resolved = true;
              clearTimeout(timer);
              setTimeout(cleanup, 1500);
              resolve(true);
            }
          } catch (printErr) {
            console.warn('Iframe print call failed, attempting fallback...', printErr);
            if (!resolved) {
              resolved = true;
              clearTimeout(timer);
              cleanup();
              resolve(false);
            }
          }
        }, 200);
      } catch (err) {
        clearTimeout(timer);
        cleanup();
        resolve(false);
      }
    });

    if (printSuccess) {
      return { success: true, fallbackType: 'iframe', drawerKicked };
    }
  } catch (e) {
    console.warn('Iframe print method encountered an error:', e);
  }

  // --- METHOD 2: Direct Body Portal Fallback ---
  try {
    const portal = document.createElement('div');
    portal.id = 'print-portal';
    portal.setAttribute('data-print-portal', 'true');
    portal.innerHTML = htmlContent;

    document.body.appendChild(portal);
    document.body.classList.add('printing-receipt-mode');

    let printAttemptSucceeded = false;
    try {
      window.print();
      printAttemptSucceeded = true;
    } catch (windowPrintErr) {
      console.warn('Direct window.print() failed or blocked by sandbox:', windowPrintErr);
    }

    const removePortal = () => {
      document.body.classList.remove('printing-receipt-mode');
      try {
        portal.remove();
      } catch {}
    };

    window.addEventListener('afterprint', removePortal, { once: true });
    setTimeout(removePortal, 1500);

    if (printAttemptSucceeded) {
      return { success: true, fallbackType: 'portal', drawerKicked };
    }
  } catch (portalErr) {
    console.warn('Portal print failed:', portalErr);
  }

  // --- METHOD 3: Create Blob URL for new tab or download when sandboxed ---
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);

  // Try opening new tab
  try {
    const newWindow = window.open(blobUrl, '_blank');
    if (newWindow) {
      return {
        success: true,
        fallbackType: 'popup_needed',
        blobUrl,
        drawerKicked,
        message: 'Reçu ouvert dans un nouvel onglet pour impression.',
      };
    }
  } catch {}

  return {
    success: false,
    fallbackType: 'popup_needed',
    blobUrl,
    drawerKicked,
    message: "L'environnement d'affichage restreint l'impression directe. Utilisez l'ouverture dans un nouvel onglet ou le téléchargement.",
  };
}

/**
 * Downloads the receipt as an offline self-contained HTML file that can be printed or sent.
 */
export function downloadReceipt(sale: Sale, business: Business): void {
  const htmlContent = generateReceiptHtml(sale, business);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Recu_${sale.receiptNumber}.html`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Opens the receipt in a clean standalone browser tab where printing is 100% unrestricted.
 * Also triggers the cash drawer kick via RJ11 / USB / Bluetooth if configured.
 */
export function openReceiptInNewTab(sale: Sale, business: Business, kickDrawer = true): void {
  if (kickDrawer) {
    cashDrawerService.triggerDrawerOnPrintValidation({
      receiptNumber: sale.receiptNumber,
      paymentMethod: sale.paymentMethod,
      saleId: sale.id,
      operatorName: sale.sellerName,
      force: true
    }).catch(console.warn);
  }
  const htmlContent = generateReceiptHtml(sale, business);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
