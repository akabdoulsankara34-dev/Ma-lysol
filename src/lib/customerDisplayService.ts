export interface CustomerDisplayItem {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  unit?: string;
  priceType?: 'retail' | 'wholesale' | 'semi-wholesale';
}

export interface CustomerDisplayState {
  businessName: string;
  currency: string;
  phone?: string;
  address?: string;
  slogan?: string;
  cashierName?: string;
  items: CustomerDisplayItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  totalAmount: number;
  customerName?: string;
  customerPhone?: string;
  loyaltyPoints?: number;
  loyaltyTier?: string;
  lastScannedItem?: {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    timestamp: number;
  } | null;
  checkoutState?: {
    isCheckingOut: boolean;
    paymentMethod?: string;
    receivedAmount?: number;
    changeToReturn?: number;
  } | null;
  lastCompletedSale?: {
    receiptNumber: string;
    totalAmount: number;
    receivedAmount?: number;
    changeToReturn?: number;
    paymentMethod: string;
    itemCount: number;
    customerName?: string;
    date: string;
    timestamp: number;
  } | null;
  updatedAt: number;
}

const STORAGE_KEY = 'bizpilot_customer_display_state';
const CHANNEL_NAME = 'bizpilot_customer_display_channel';

// Default initial state
export const getInitialDisplayState = (): CustomerDisplayState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // Ignore parse error
  }

  return {
    businessName: 'BizPilot Burkina',
    currency: 'FCFA',
    phone: '',
    address: 'Ouagadougou, Burkina Faso',
    slogan: 'Gestion Commerciale & Point de Vente',
    items: [],
    itemCount: 0,
    subtotal: 0,
    discount: 0,
    totalAmount: 0,
    updatedAt: Date.now()
  };
};

// Singleton broadcast channel instance for this window
let channel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (e) {
  console.warn('[CustomerDisplay] BroadcastChannel not supported, using storage events');
}

/**
 * Send real-time updates from Cashier Screen to 2nd Customer Display Screen
 */
export const broadcastCustomerDisplay = (stateUpdate: Partial<CustomerDisplayState>) => {
  if (typeof window === 'undefined') return;

  const current = getInitialDisplayState();
  const newState: CustomerDisplayState = {
    ...current,
    ...stateUpdate,
    updatedAt: Date.now()
  };

  // 1. Save to localStorage (cross-window storage sync)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  } catch (e) {
    // Storage quota or private mode
  }

  // 2. Broadcast via BroadcastChannel (0ms latency for cross-window)
  if (channel) {
    try {
      channel.postMessage({
        type: 'CUSTOMER_DISPLAY_UPDATE',
        payload: newState
      });
    } catch (err) {
      console.warn('[CustomerDisplay] Channel post failed:', err);
    }
  }

  // 3. Local window event (for instant same-window component updates & test views)
  try {
    window.dispatchEvent(new CustomEvent('bizpilot_customer_display_event', {
      detail: newState
    }));
  } catch (err) {
    // Ignore
  }
};

/**
 * Robust listener subscribing to all channels: BroadcastChannel, StorageEvent, CustomEvent, and Polling fallback
 */
export const subscribeCustomerDisplay = (onUpdate: (state: CustomerDisplayState) => void): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let localChannel: BroadcastChannel | null = null;
  let lastUpdatedAt = 0;

  const handleUpdate = (state: CustomerDisplayState) => {
    if (state && state.updatedAt !== lastUpdatedAt) {
      lastUpdatedAt = state.updatedAt;
      onUpdate(state);
    }
  };

  // 1. BroadcastChannel (0ms cross-window)
  try {
    if ('BroadcastChannel' in window) {
      localChannel = new BroadcastChannel(CHANNEL_NAME);
      localChannel.onmessage = (event) => {
        if (event.data?.type === 'CUSTOMER_DISPLAY_UPDATE' && event.data.payload) {
          handleUpdate(event.data.payload);
        }
      };
    }
  } catch (e) {
    // BroadcastChannel unsupported
  }

  // 2. Storage event (cross-tab/window fallback)
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        handleUpdate(parsed);
      } catch (err) {
        // Ignore
      }
    }
  };
  window.addEventListener('storage', handleStorage);

  // 3. Window CustomEvent (instant for same-window / tabs)
  const handleCustomEvent = (e: Event) => {
    const customEvt = e as CustomEvent<CustomerDisplayState>;
    if (customEvt.detail) {
      handleUpdate(customEvt.detail);
    }
  };
  window.addEventListener('bizpilot_customer_display_event', handleCustomEvent);

  // 4. Polling fallback (every 800ms) for sandboxed iframes or background tabs
  const pollInterval = setInterval(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.updatedAt && parsed.updatedAt > lastUpdatedAt) {
          handleUpdate(parsed);
        }
      }
    } catch {
      // Ignore
    }
  }, 800);

  // Initial push with current state
  const initial = getInitialDisplayState();
  lastUpdatedAt = initial.updatedAt || 0;
  onUpdate(initial);

  return () => {
    if (localChannel) {
      localChannel.close();
    }
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('bizpilot_customer_display_event', handleCustomEvent);
    clearInterval(pollInterval);
  };
};

/**
 * Interactive Demo / Simulation for testing the customer display live
 */
export const runCustomerDisplaySimulation = (onStep?: (stepName: string) => void) => {
  const baseState = getInitialDisplayState();
  const businessName = baseState.businessName || 'BizPilot Burkina';
  const currency = baseState.currency || 'FCFA';

  // Step 1: Add first article (0ms)
  onStep?.('Ajout Article 1');
  const item1: CustomerDisplayItem = {
    id: 'test_item_1',
    productId: 'demo_1',
    name: 'Sac de Riz Parfumé Dinor 25kg',
    quantity: 1,
    unitPrice: 19500,
    discount: 0,
    total: 19500,
    unit: 'Sac',
    priceType: 'retail'
  };

  broadcastCustomerDisplay({
    items: [item1],
    itemCount: 1,
    subtotal: 19500,
    discount: 0,
    totalAmount: 19500,
    checkoutState: null,
    lastCompletedSale: null,
    lastScannedItem: {
      name: item1.name,
      quantity: 1,
      unitPrice: 19500,
      total: 19500,
      timestamp: Date.now()
    }
  });

  // Step 2: Add second article (+1800ms)
  setTimeout(() => {
    onStep?.('Ajout Article 2');
    const item2: CustomerDisplayItem = {
      id: 'test_item_2',
      productId: 'demo_2',
      name: 'Bidon d\'Huile Végétale 5L',
      quantity: 1,
      unitPrice: 6500,
      discount: 0,
      total: 6500,
      unit: 'Bidon',
      priceType: 'retail'
    };

    broadcastCustomerDisplay({
      items: [item1, item2],
      itemCount: 2,
      subtotal: 26000,
      discount: 1000,
      totalAmount: 25000,
      customerName: 'Client Démo (Ibrahim Ouédraogo)',
      loyaltyPoints: 45,
      lastScannedItem: {
        name: item2.name,
        quantity: 1,
        unitPrice: 6500,
        total: 6500,
        timestamp: Date.now()
      }
    });
  }, 1800);

  // Step 3: Start Checkout with cash & change calculation (+3800ms)
  setTimeout(() => {
    onStep?.('Encaissement Espèces & Monnaie');
    broadcastCustomerDisplay({
      checkoutState: {
        isCheckingOut: true,
        paymentMethod: 'cash',
        receivedAmount: 30000,
        changeToReturn: 5000
      }
    });
  }, 3800);

  // Step 4: Finalize sale with celebratory thank-you screen (+6000ms)
  setTimeout(() => {
    onStep?.('Vente validée & Ticket');
    broadcastCustomerDisplay({
      items: [],
      itemCount: 0,
      subtotal: 0,
      discount: 0,
      totalAmount: 0,
      lastScannedItem: null,
      checkoutState: null,
      lastCompletedSale: {
        receiptNumber: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
        totalAmount: 25000,
        receivedAmount: 30000,
        changeToReturn: 5000,
        paymentMethod: 'cash',
        itemCount: 2,
        customerName: 'Ibrahim Ouédraogo',
        date: new Date().toISOString(),
        timestamp: Date.now()
      }
    });
  }, 6200);

  // Step 5: Return to idle state (+16000ms)
  setTimeout(() => {
    onStep?.('Écran de veille');
    broadcastCustomerDisplay({
      items: [],
      itemCount: 0,
      subtotal: 0,
      discount: 0,
      totalAmount: 0,
      lastScannedItem: null,
      checkoutState: null,
      lastCompletedSale: null
    });
  }, 16000);
};

/**
 * Play subtle, pleasing sound effects on customer screen or POS
 */
export const playPosTone = (type: 'beep' | 'success' | 'remove') => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'beep') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'success') {
      // 2-tone melodic chime
      const now = ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'remove') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(330, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    }
  } catch (e) {
    // AudioContext blocked before user interaction
  }
};
