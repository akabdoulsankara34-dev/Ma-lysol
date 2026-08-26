import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Business, 
  AppUser, 
  Product, 
  Sale, 
  Customer, 
  CustomerPayment, 
  Expense, 
  StockMovement, 
  NotificationItem, 
  CartItem, 
  PaymentMethod, 
  UserRole,
  BusinessSummary,
  StockMovementType,
  ExpenseCategory,
  NavigationTab,
  UserPermissions,
  CashSession,
  Quotation,
  QuotationItem,
  Invoice,
  InvoiceItem,
  QueuedMutation
} from '../types';
import { 
  initialBusinesses,
  initialBusiness, 
  initialUsers, 
  initialProducts, 
  initialCustomers, 
  initialExpenses, 
  initialSales, 
  initialStockMovements,
  initialCashSessions,
  initialQuotations
} from '../data/initialDemoData';
import { db, sanitizeForFirestore, ensureFirebaseAuth } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  writeBatch,
  getDocFromServer
} from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Sync Notice:', JSON.stringify(errInfo));
  return errInfo;
}

interface AppContextType {
  // Business Multi-Tenant State
  allBusinesses: Business[];
  business: Business;
  isBusinessAuthenticated: boolean;
  authenticateBusiness: (accessCode: string) => Promise<{ success: boolean; message?: string; business?: Business }>;
  logoutBusiness: () => void;
  createBusiness: (businessData: Omit<Business, 'id' | 'createdAt'>, ownerPin?: string) => Promise<Business>;
  updateBusiness: (id: string, updates: Partial<Business>) => Promise<void>;
  deleteBusiness: (id: string) => Promise<void>;
  regenerateAccessCode: (businessId: string) => Promise<string>;
  switchBusiness: (businessId: string) => void;
  updateBusinessProfile: (updates: Partial<Business>) => Promise<void>;

  // User & Staff Management (Owner -> Cashier/Manager)
  currentUser: AppUser;
  allUsers: AppUser[];
  switchUser: (userId: string) => void;
  userToSwitchWithPin: AppUser | null;
  setUserToSwitchWithPin: (user: AppUser | null) => void;
  requestUserSwitch: (userId: string) => void;
  addUser: (userData: Omit<AppUser, 'id' | 'businessId' | 'createdAt' | 'active'>) => Promise<AppUser>;
  updateUser: (userId: string, updates: Partial<AppUser>) => Promise<void>;
  updateUserPin: (userId: string, newPin: string) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  verifyUserPin: (userId: string, pin: string) => boolean;

  // Products & Inventory
  products: Product[];
  addProduct: (productData: Omit<Product, 'id' | 'businessId' | 'createdAt'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  archiveProduct: (id: string) => Promise<void>;
  recordStockMovement: (
    productId: string,
    type: StockMovementType,
    quantity: number,
    reason: string
  ) => Promise<void>;
  stockMovements: StockMovement[];
  applyExpiryDiscount: (productId: string, discountPercentage: number) => Promise<void>;
  declareDamagedLoss: (productId: string, quantity: number, reason: string) => Promise<void>;

  // Sales & Cart
  sales: Sale[];
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  updateCartItemDiscount: (productId: string, discount: number) => void;
  updateCartItemPriceType: (productId: string, priceType: 'retail' | 'wholesale' | 'semi-wholesale') => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  completeSale: (
    paymentMethod: PaymentMethod,
    customerId?: string,
    customerName?: string,
    overallDiscount?: number,
    splitDetails?: { cash?: number; orangeMoney?: number; moovMoney?: number; waveCoris?: number; credit?: number; },
    notes?: string,
    loyaltyPointsToRedeem?: number
  ) => Promise<Sale>;

  // Customers, Debts & Loyalty
  customers: Customer[];
  customerPayments: CustomerPayment[];
  addCustomer: (customerData: Omit<Customer, 'id' | 'businessId' | 'createdAt' | 'totalDebt'>) => Promise<Customer>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  recordCustomerPayment: (
    customerId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    notes?: string
  ) => Promise<void>;
  addLoyaltyPoints: (customerId: string, pointsEarned: number, spentAmount: number) => Promise<void>;

  // Expenses
  expenses: Expense[];
  addExpense: (expenseData: {
    category: ExpenseCategory;
    customCategory?: string;
    amount: number;
    paymentMethod: PaymentMethod;
    beneficiary: string;
    notes?: string;
  }) => Promise<Expense>;

  // Cash Register Sessions & Z-Report
  cashSessions: CashSession[];
  activeCashSession: CashSession | null;
  openCashSession: (initialFloat: number, notes?: string) => Promise<CashSession>;
  closeCashSession: (actualCashCounted: number, notes?: string) => Promise<CashSession>;
  recordCashMovement: (type: 'cash_in' | 'cash_out', amount: number, reason: string) => Promise<void>;

  // Quotations & Proformas
  quotations: Quotation[];
  addQuotation: (quotationData: Omit<Quotation, 'id' | 'businessId' | 'quotationNumber' | 'createdBy' | 'createdByName' | 'createdAt'>) => Promise<Quotation>;
  updateQuotationStatus: (id: string, status: Quotation['status']) => Promise<void>;
  deleteQuotation: (id: string) => Promise<void>;
  convertQuotationToSale: (quotationId: string, paymentMethod: PaymentMethod) => Promise<Sale>;
  loadQuotationToCart: (quotation: Quotation) => void;

  // Invoices
  invoices: Invoice[];
  addInvoice: (invoiceData: Omit<Invoice, 'id' | 'businessId' | 'invoiceNumber' | 'createdBy' | 'createdByName' | 'createdAt'>) => Promise<Invoice>;
  updateInvoiceStatus: (id: string, status: Invoice['status'], amountPaid?: number) => Promise<void>;

  // Navigation & Platform Admin
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isPlatformAdminUnlocked: boolean;
  showAdminPinModal: boolean;
  setShowAdminPinModal: (show: boolean) => void;
  unlockPlatformAdmin: (pin: string) => boolean;
  lockPlatformAdmin: () => void;
  handleLogoClick: () => void;

  // System, Sync & Telemetry
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  forceSyncCloudData: () => Promise<void>;
  pendingSyncCount: number;
  offlineQueue: QueuedMutation[];
  processOfflineQueue: () => Promise<void>;
  notifications: NotificationItem[];
  summary: BusinessSummary;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  resetToDemoData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'bizpilot_burkina_v2';
const OFFLINE_QUEUE_KEY = 'bizpilot_burkina_offline_queue_v1';
const PLATFORM_ADMIN_PIN = '761278';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved state or fallback
  const getInitialStorage = () => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load local storage:', e);
    }
    return null;
  };

  const initialCached = getInitialStorage();

  // Multi-Business States
  const [allBusinesses, setAllBusinesses] = useState<Business[]>(
    initialCached?.allBusinesses || initialBusinesses
  );
  
  const [business, setBusiness] = useState<Business>(
    initialCached?.business || initialBusinesses[0]
  );

  const [isBusinessAuthenticated, setIsBusinessAuthenticated] = useState<boolean>(
    initialCached?.isBusinessAuthenticated ?? true
  );

  // Global Multi-tenant Dataset
  const [allUsers, setAllUsers] = useState<AppUser[]>(
    initialCached?.allUsers || initialUsers
  );

  const [currentUser, setCurrentUser] = useState<AppUser>(
    initialCached?.currentUser || initialUsers[0]
  );

  const [products, setProducts] = useState<Product[]>(
    initialCached?.products || initialProducts
  );
  const [sales, setSales] = useState<Sale[]>(
    initialCached?.sales || initialSales
  );
  const [customers, setCustomers] = useState<Customer[]>(
    initialCached?.customers || initialCustomers
  );
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>(
    initialCached?.customerPayments || []
  );
  const [expenses, setExpenses] = useState<Expense[]>(
    initialCached?.expenses || initialExpenses
  );
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(
    initialCached?.stockMovements || initialStockMovements
  );
  const [cashSessions, setCashSessions] = useState<CashSession[]>(
    initialCached?.cashSessions || initialCashSessions
  );
  const [quotations, setQuotations] = useState<Quotation[]>(
    initialCached?.quotations || initialQuotations
  );
  const [invoices, setInvoices] = useState<Invoice[]>(
    initialCached?.invoices || []
  );

  // Offline Mutations Outbox Queue
  const [offlineQueue, setOfflineQueue] = useState<QueuedMutation[]>(() => {
    try {
      const savedQueue = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return savedQueue ? JSON.parse(savedQueue) : [];
    } catch {
      return [];
    }
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<NavigationTab>('pos');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());
  
  // Staff PIN verification modal
  const [userToSwitchWithPin, setUserToSwitchWithPin] = useState<AppUser | null>(null);

  // Platform Admin state
  const [isPlatformAdminUnlocked, setIsPlatformAdminUnlocked] = useState<boolean>(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState<boolean>(false);
  const logoClicksRef = React.useRef<{ count: number; timer: NodeJS.Timeout | null }>({ count: 0, timer: null });

  // 1. Authenticate Business by Access Code
  const authenticateBusiness = useCallback(async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    let found = allBusinesses.find(b => 
      (b.accessCode && b.accessCode.toUpperCase() === code) ||
      b.id.toUpperCase() === code
    );

    // If not found in local memory state, query Firestore directly
    if (!found) {
      try {
        await ensureFirebaseAuth();
        const snap = await getDocs(collection(db, 'businesses'));
        if (!snap.empty) {
          const list: Business[] = [];
          snap.forEach(d => list.push({ id: d.id, ...d.data() } as Business));
          setAllBusinesses(list);
          found = list.find(b => 
            (b.accessCode && b.accessCode.toUpperCase() === code) ||
            b.id.toUpperCase() === code
          );
        }
      } catch (err) {
        console.warn('Direct Firestore business lookup notice:', err);
      }
    }

    if (!found) {
      return { 
        success: false, 
        message: `Code d'accès "${code}" non trouvé. Veuillez vérifier auprès de l'administrateur.` 
      };
    }

    if (found.status === 'suspended') {
      return { 
        success: false, 
        message: `L'entreprise "${found.name}" a été suspendue par l'administrateur de la plateforme.` 
      };
    }

    // Set active store
    setBusiness(found);
    setIsBusinessAuthenticated(true);

    // Switch to first owner/manager of this business
    let storeUsers = allUsers.filter(u => u.businessId === found.id);
    if (storeUsers.length === 0) {
      try {
        const uSnap = await getDocs(collection(db, 'users'));
        if (!uSnap.empty) {
          const uList: AppUser[] = [];
          uSnap.forEach(d => uList.push({ id: d.id, ...d.data() } as AppUser));
          setAllUsers(uList);
          storeUsers = uList.filter(u => u.businessId === found.id);
        }
      } catch (err) {
        console.warn('Direct users fetch notice:', err);
      }
    }

    if (storeUsers.length > 0) {
      const defaultOwner = storeUsers.find(u => u.role === 'owner') || storeUsers[0];
      setCurrentUser(defaultOwner);
    } else {
      const newOwner: AppUser = {
        id: `usr_${Date.now()}`,
        businessId: found.id,
        name: found.ownerName || 'Propriétaire',
        phone: found.phone,
        role: 'owner',
        pin: '1234',
        active: true,
        permissions: {
          canAccessPos: true,
          canAccessStock: true,
          canAccessCustomers: true,
          canAccessExpenses: true,
          canAccessReports: true,
          canGiveDiscount: true,
          canManageUsers: true,
        },
        createdAt: new Date().toISOString(),
      };
      setAllUsers(prev => [...prev, newOwner]);
      setCurrentUser(newOwner);
      try {
        await setDoc(doc(db, 'users', newOwner.id), sanitizeForFirestore(newOwner));
      } catch (e) {
        console.warn('Auto-create owner error:', e);
      }
    }

    return { success: true, business: found };
  }, [allBusinesses, allUsers]);

  // Logout current business
  const logoutBusiness = useCallback(() => {
    setIsBusinessAuthenticated(false);
    setCart([]);
  }, []);

  // Switch Business
  const switchBusiness = useCallback((businessId: string) => {
    const target = allBusinesses.find(b => b.id === businessId);
    if (target) {
      setBusiness(target);
      setIsBusinessAuthenticated(true);
      const storeUsers = allUsers.filter(u => u.businessId === target.id);
      if (storeUsers.length > 0) {
        setCurrentUser(storeUsers.find(u => u.role === 'owner') || storeUsers[0]);
      }
    }
  }, [allBusinesses, allUsers]);

  // Create New Enterprise
  const createBusiness = async (businessData: Omit<Business, 'id' | 'createdAt'>, ownerPin = '1234'): Promise<Business> => {
    const businessId = `biz_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`;
    const nowIso = new Date().toISOString();

    const newBusiness: Business = {
      ...businessData,
      id: businessId,
      accessCode: businessData.accessCode.trim().toUpperCase(),
      createdAt: nowIso,
    };

    const ownerUser: AppUser = {
      id: `usr_${Date.now().toString(36)}_owner`,
      businessId,
      name: businessData.ownerName || 'Gérant Principal',
      phone: businessData.phone,
      role: 'owner',
      pin: ownerPin,
      active: true,
      permissions: {
        canAccessPos: true,
        canAccessStock: true,
        canAccessCustomers: true,
        canAccessExpenses: true,
        canAccessReports: true,
        canGiveDiscount: true,
        canManageUsers: true,
      },
      createdAt: nowIso,
    };

    setAllBusinesses(prev => [...prev, newBusiness]);
    setAllUsers(prev => [...prev, ownerUser]);

    try {
      await setDoc(doc(db, 'businesses', businessId), sanitizeForFirestore(newBusiness));
      await setDoc(doc(db, 'users', ownerUser.id), sanitizeForFirestore(ownerUser));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `businesses/${businessId}`);
    }

    return newBusiness;
  };

  // Update business
  const updateBusiness = async (id: string, updates: Partial<Business>) => {
    setAllBusinesses(prev =>
      prev.map(b => (b.id === id ? { ...b, ...updates } : b))
    );
    if (business.id === id) {
      setBusiness(prev => ({ ...prev, ...updates }));
    }

    try {
      await updateDoc(doc(db, 'businesses', id), sanitizeForFirestore(updates));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `businesses/${id}`);
    }
  };

  // Delete business
  const deleteBusiness = async (id: string) => {
    if (id === 'biz_maelys') {
      throw new Error('La boutique démo Maëlys ne peut pas être supprimée.');
    }

    setAllBusinesses(prev => prev.filter(b => b.id !== id));
    setAllUsers(prev => prev.filter(u => u.businessId !== id));

    if (business.id === id) {
      const fallback = allBusinesses.find(b => b.id !== id) || initialBusinesses[0];
      setBusiness(fallback);
      const fallbackUsers = allUsers.filter(u => u.businessId === fallback.id);
      setCurrentUser(fallbackUsers[0] || initialUsers[0]);
    }

    try {
      await deleteDoc(doc(db, 'businesses', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `businesses/${id}`);
    }
  };

  // Regenerate unique access code
  const regenerateAccessCode = async (businessId: string): Promise<string> => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newCode = `BF-${business.name.slice(0, 4).toUpperCase()}-${randomSuffix}`;
    await updateBusiness(businessId, { accessCode: newCode });
    return newCode;
  };

  // Switch User
  const switchUser = (userId: string) => {
    const found = allUsers.find(u => u.id === userId);
    if (found && found.active) {
      setCurrentUser(found);
      setUserToSwitchWithPin(null);
    }
  };

  const requestUserSwitch = (userId: string) => {
    const found = allUsers.find(u => u.id === userId);
    if (found && found.active) {
      if (!found.pin || found.pin === '0000') {
        setCurrentUser(found);
      } else {
        setUserToSwitchWithPin(found);
      }
    }
  };

  const verifyUserPin = (userId: string, pin: string): boolean => {
    const found = allUsers.find(u => u.id === userId);
    return found ? (found.pin === pin || (!found.pin && pin === '0000')) : false;
  };

  // User Management by Owner
  const addUser = async (userData: Omit<AppUser, 'id' | 'businessId' | 'createdAt' | 'active'>): Promise<AppUser> => {
    const id = `usr_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 3)}`;
    const newUser: AppUser = {
      ...userData,
      id,
      businessId: business.id,
      active: true,
      createdAt: new Date().toISOString(),
    };

    setAllUsers(prev => [...prev, newUser]);

    try {
      await setDoc(doc(db, 'users', id), sanitizeForFirestore(newUser));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'users');
    }

    return newUser;
  };

  const updateUser = async (userId: string, updates: Partial<AppUser>) => {
    setAllUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, ...updates } : u))
    );

    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
    }

    try {
      await updateDoc(doc(db, 'users', userId), sanitizeForFirestore(updates));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const updateUserPin = async (userId: string, newPin: string) => {
    await updateUser(userId, { pin: newPin });
  };

  const toggleUserStatus = async (id: string) => {
    const target = allUsers.find(u => u.id === id);
    if (!target) return;
    const newStatus = !target.active;
    await updateUser(id, { active: newStatus });
  };

  const deleteUser = async (id: string) => {
    setAllUsers(prev => prev.filter(u => u.id !== id));
    if (currentUser.id === id) {
      const remaining = allUsers.filter(u => u.id !== id && u.businessId === business.id);
      if (remaining.length > 0) {
        setCurrentUser(remaining[0]);
      }
    }

    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${id}`);
    }
  };

  const updateBusinessProfile = async (updates: Partial<Business>) => {
    await updateBusiness(business.id, updates);
  };

  // Platform Admin PIN Unlock
  const unlockPlatformAdmin = useCallback((pin: string): boolean => {
    if (pin.trim() === PLATFORM_ADMIN_PIN) {
      setIsPlatformAdminUnlocked(true);
      setShowAdminPinModal(false);
      setActiveTab('admin');
      return true;
    }
    return false;
  }, []);

  const lockPlatformAdmin = useCallback(() => {
    setIsPlatformAdminUnlocked(false);
    setActiveTab(prev => (prev === 'admin' ? 'pos' : prev));
  }, []);

  const handleLogoClick = useCallback(() => {
    if (logoClicksRef.current.timer) {
      clearTimeout(logoClicksRef.current.timer);
    }
    
    logoClicksRef.current.count += 1;
    
    if (logoClicksRef.current.count >= 3) {
      logoClicksRef.current.count = 0;
      if (isPlatformAdminUnlocked) {
        setActiveTab('admin');
      } else {
        setShowAdminPinModal(true);
      }
    } else {
      logoClicksRef.current.timer = setTimeout(() => {
        logoClicksRef.current.count = 0;
      }, 700);
    }
  }, [isPlatformAdminUnlocked]);

  // Save to localStorage whenever state updates
  useEffect(() => {
    const dataToSave = {
      allBusinesses,
      business,
      isBusinessAuthenticated,
      allUsers,
      currentUser,
      products,
      sales,
      customers,
      customerPayments,
      expenses,
      stockMovements,
      cashSessions,
      quotations,
      invoices
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (err) {
      console.warn('LocalStorage limit reached or disabled:', err);
    }
  }, [
    allBusinesses, 
    business, 
    isBusinessAuthenticated, 
    allUsers, 
    currentUser, 
    products, 
    sales, 
    customers, 
    customerPayments, 
    expenses, 
    stockMovements,
    cashSessions,
    quotations,
    invoices
  ]);

  // Persist offline queue to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(offlineQueue));
    } catch (err) {
      console.warn('Could not persist offline queue:', err);
    }
  }, [offlineQueue]);

  // Helper to perform cloud write or queue offline
  const syncMutation = useCallback(async (
    collectionName: string,
    docId: string,
    action: 'set' | 'update' | 'delete',
    payload?: any,
    description?: string
  ) => {
    if (navigator.onLine) {
      try {
        if (action === 'set') {
          await setDoc(doc(db, collectionName, docId), sanitizeForFirestore(payload));
        } else if (action === 'update') {
          await updateDoc(doc(db, collectionName, docId), sanitizeForFirestore(payload));
        } else if (action === 'delete') {
          await deleteDoc(doc(db, collectionName, docId));
        }
        return;
      } catch (err) {
        console.warn(`[Sync] Direct cloud write failed for ${collectionName}/${docId}, queueing mutation:`, err);
      }
    }

    // If offline or if direct write threw, save to offline outbox queue
    const mutationItem: QueuedMutation = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      collection: collectionName,
      docId,
      action,
      payload,
      timestamp: new Date().toISOString(),
      description: description || `${action.toUpperCase()} sur ${collectionName}/${docId}`,
      retryCount: 0,
    };

    setOfflineQueue(prev => {
      const filtered = prev.filter(m => !(m.collection === collectionName && m.docId === docId && m.action === action));
      const nextQueue = [...filtered, mutationItem];
      return nextQueue;
    });
  }, []);

  // Process pending offline mutations
  const processOfflineQueue = useCallback(async () => {
    if (!navigator.onLine) return;
    const currentQueue = [...offlineQueue];
    if (currentQueue.length === 0) return;

    setIsSyncing(true);
    const remaining: QueuedMutation[] = [];
    let successfulCount = 0;

    for (const item of currentQueue) {
      try {
        if (item.action === 'set') {
          await setDoc(doc(db, item.collection, item.docId), sanitizeForFirestore(item.payload));
        } else if (item.action === 'update') {
          await updateDoc(doc(db, item.collection, item.docId), sanitizeForFirestore(item.payload));
        } else if (item.action === 'delete') {
          await deleteDoc(doc(db, item.collection, item.docId));
        }
        successfulCount++;
      } catch (e) {
        console.warn(`[Sync Engine] Could not process queued mutation ${item.id}:`, e);
        remaining.push({ ...item, retryCount: (item.retryCount || 0) + 1 });
      }
    }

    setOfflineQueue(remaining);
    setIsSyncing(false);
    setLastSyncedAt(new Date());

    if (successfulCount > 0) {
      setNotifications(prev => [
        {
          id: `notif_sync_${Date.now()}`,
          title: 'Synchronisation Cloud Réussie',
          message: `${successfulCount} opération(s) enregistrée(s) hors-ligne ont été synchronisées avec le Cloud.`,
          type: 'success',
          timestamp: new Date().toISOString(),
          read: false
        },
        ...prev
      ]);
    }
  }, [offlineQueue]);

  // Online / Offline monitor with active ping probe
  useEffect(() => {
    const checkConnectivity = async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }
      try {
        const res = await fetch('/manifest.json?probe=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
        if (res.ok) {
          setIsOnline(true);
        }
      } catch {
        setIsOnline(false);
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      checkConnectivity();
      processOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(() => {
      checkConnectivity();
      if (navigator.onLine && offlineQueue.length > 0) {
        processOfflineQueue();
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [processOfflineQueue, offlineQueue.length]);

  // Multi-Device Real-Time Cloud Synchronization Engine with Firestore
  useEffect(() => {
    if (!isOnline) return;

    let unsubscribeBusinesses: (() => void) | undefined;
    let unsubscribeProducts: (() => void) | undefined;
    let unsubscribeSales: (() => void) | undefined;
    let unsubscribeCustomers: (() => void) | undefined;
    let unsubscribeExpenses: (() => void) | undefined;
    let unsubscribeUsers: (() => void) | undefined;
    let unsubscribeStockMovements: (() => void) | undefined;
    let unsubscribeCustomerPayments: (() => void) | undefined;
    let unsubscribeCashSessions: (() => void) | undefined;
    let unsubscribeQuotations: (() => void) | undefined;
    let unsubscribeInvoices: (() => void) | undefined;

    const setupFirestoreSync = async () => {
      try {
        setIsSyncing(true);

        try {
          await getDocFromServer(doc(db, 'system', 'connection_test')).catch(() => null);
        } catch {
          // Non-blocking connection test
        }

        // Initial Cloud Seeding Check: If Firestore is fresh / empty across all devices, seed standard master dataset
        try {
          const bizSnapshot = await getDocs(collection(db, 'businesses'));
          if (bizSnapshot.empty) {
            console.log('Seeding initial master data to Cloud Firestore for multi-device collaboration...');
            const batch = writeBatch(db);
            
            initialBusinesses.forEach(b => {
              batch.set(doc(db, 'businesses', b.id), sanitizeForFirestore(b));
            });
            initialUsers.forEach(u => {
              batch.set(doc(db, 'users', u.id), sanitizeForFirestore(u));
            });
            initialProducts.forEach(p => {
              batch.set(doc(db, 'products', p.id), sanitizeForFirestore(p));
            });
            initialCustomers.forEach(c => {
              batch.set(doc(db, 'customers', c.id), sanitizeForFirestore(c));
            });
            initialExpenses.forEach(e => {
              batch.set(doc(db, 'expenses', e.id), sanitizeForFirestore(e));
            });
            initialSales.forEach(s => {
              batch.set(doc(db, 'sales', s.id), sanitizeForFirestore(s));
            });
            initialStockMovements.forEach(sm => {
              batch.set(doc(db, 'stock_movements', sm.id), sanitizeForFirestore(sm));
            });
            initialCashSessions.forEach(cs => {
              batch.set(doc(db, 'cash_sessions', cs.id), sanitizeForFirestore(cs));
            });
            initialQuotations.forEach(q => {
              batch.set(doc(db, 'quotations', q.id), sanitizeForFirestore(q));
            });

            await batch.commit();
          }
        } catch (seedErr) {
          console.warn('Notice on initial seeding to Firestore:', seedErr);
        }

        // 1. Real-Time Businesses Listener
        const bizCol = collection(db, 'businesses');
        unsubscribeBusinesses = onSnapshot(bizCol, (snapshot) => {
          if (!snapshot.empty) {
            const list: Business[] = [];
            snapshot.forEach(docSnap => {
              list.push({ id: docSnap.id, ...docSnap.data() } as Business);
            });
            if (list.length > 0) {
              setAllBusinesses(list);
              setBusiness(prev => list.find(b => b.id === prev.id) || prev);
            }
          }
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'businesses'));

        // 2. Real-Time Products Listener
        const prodCol = collection(db, 'products');
        unsubscribeProducts = onSnapshot(prodCol, (snapshot) => {
          if (!snapshot.empty) {
            const list: Product[] = [];
            snapshot.forEach(docSnap => {
              list.push({ id: docSnap.id, ...docSnap.data() } as Product);
            });
            setProducts(list);
          }
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

        // 3. Real-Time Sales Listener
        const salesCol = collection(db, 'sales');
        unsubscribeSales = onSnapshot(salesCol, (snapshot) => {
          if (!snapshot.empty) {
            const list: Sale[] = [];
            snapshot.forEach(docSnap => {
              list.push({ id: docSnap.id, ...docSnap.data() } as Sale);
            });
            setSales(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          }
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'sales'));

        // 4. Real-Time Customers Listener
        const custCol = collection(db, 'customers');
        unsubscribeCustomers = onSnapshot(custCol, (snapshot) => {
          if (!snapshot.empty) {
            const list: Customer[] = [];
            snapshot.forEach(docSnap => {
              list.push({ id: docSnap.id, ...docSnap.data() } as Customer);
            });
            setCustomers(list);
          }
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'customers'));

        // 5. Real-Time Customer Reimbursements Listener
        const custPayCol = collection(db, 'customer_payments');
        unsubscribeCustomerPayments = onSnapshot(custPayCol, (snapshot) => {
          if (!snapshot.empty) {
            const list: CustomerPayment[] = [];
            snapshot.forEach(docSnap => {
              list.push({ id: docSnap.id, ...docSnap.data() } as CustomerPayment);
            });
            setCustomerPayments(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          }
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'customer_payments'));

        // 6. Real-Time Stock Movements Listener
        const movCol = collection(db, 'stock_movements');
        unsubscribeStockMovements = onSnapshot(movCol, (snapshot) => {
          if (!snapshot.empty) {
            const list: StockMovement[] = [];
            snapshot.forEach(docSnap => {
              list.push({ id: docSnap.id, ...docSnap.data() } as StockMovement);
            });
            setStockMovements(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          }
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'stock_movements'));

        // 7. Real-Time Expenses Listener
        const expCol = collection(db, 'expenses');
        unsubscribeExpenses = onSnapshot(expCol, (snapshot) => {
          if (!snapshot.empty) {
            const list: Expense[] = [];
            snapshot.forEach(docSnap => {
              list.push({ id: docSnap.id, ...docSnap.data() } as Expense);
            });
            setExpenses(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          }
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'expenses'));

        // 8. Real-Time Users Listener
        const usersCol = collection(db, 'users');
        unsubscribeUsers = onSnapshot(usersCol, (snapshot) => {
          if (!snapshot.empty) {
            const list: AppUser[] = [];
            snapshot.forEach(docSnap => {
              list.push({ id: docSnap.id, ...docSnap.data() } as AppUser);
            });
            setAllUsers(list);
            setCurrentUser(prev => list.find(u => u.id === prev.id) || prev);
          }
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

        // 9. Real-Time Cash Sessions Listener
        const cashCol = collection(db, 'cash_sessions');
        unsubscribeCashSessions = onSnapshot(cashCol, (snapshot) => {
          if (!snapshot.empty) {
            const list: CashSession[] = [];
            snapshot.forEach(docSnap => {
              list.push({ id: docSnap.id, ...docSnap.data() } as CashSession);
            });
            setCashSessions(list.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()));
          }
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'cash_sessions'));

        // 10. Real-Time Quotations Listener
        const quotCol = collection(db, 'quotations');
        unsubscribeQuotations = onSnapshot(quotCol, (snapshot) => {
          if (!snapshot.empty) {
            const list: Quotation[] = [];
            snapshot.forEach(docSnap => {
              list.push({ id: docSnap.id, ...docSnap.data() } as Quotation);
            });
            setQuotations(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          }
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'quotations'));

        // 11. Real-Time Invoices Listener
        const invCol = collection(db, 'invoices');
        unsubscribeInvoices = onSnapshot(invCol, (snapshot) => {
          if (!snapshot.empty) {
            const list: Invoice[] = [];
            snapshot.forEach(docSnap => {
              list.push({ id: docSnap.id, ...docSnap.data() } as Invoice);
            });
            setInvoices(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          }
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'invoices'));

        setLastSyncedAt(new Date());
        setIsSyncing(false);
      } catch (e) {
        console.warn('Initial Firestore sync error:', e);
        setIsSyncing(false);
      }
    };

    setupFirestoreSync();

    return () => {
      unsubscribeBusinesses?.();
      unsubscribeProducts?.();
      unsubscribeSales?.();
      unsubscribeCustomers?.();
      unsubscribeExpenses?.();
      unsubscribeUsers?.();
      unsubscribeStockMovements?.();
      unsubscribeCustomerPayments?.();
      unsubscribeCashSessions?.();
      unsubscribeQuotations?.();
      unsubscribeInvoices?.();
    };
  }, [isOnline]);

  // Manual / On-demand force sync helper
  const forceSyncCloudData = useCallback(async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    try {
      // First process any pending offline queue
      await processOfflineQueue();

      await ensureFirebaseAuth();
      const [
        bizSnap,
        prodSnap,
        salesSnap,
        custSnap,
        custPaySnap,
        movSnap,
        expSnap,
        usersSnap,
        cashSnap,
        quotSnap,
        invSnap
      ] = await Promise.all([
        getDocs(collection(db, 'businesses')),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'sales')),
        getDocs(collection(db, 'customers')),
        getDocs(collection(db, 'customer_payments')),
        getDocs(collection(db, 'stock_movements')),
        getDocs(collection(db, 'expenses')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'cash_sessions')),
        getDocs(collection(db, 'quotations')),
        getDocs(collection(db, 'invoices')),
      ]);

      if (!bizSnap.empty) {
        const bList: Business[] = [];
        bizSnap.forEach(d => bList.push({ id: d.id, ...d.data() } as Business));
        setAllBusinesses(bList);
        setBusiness(prev => bList.find(b => b.id === prev.id) || prev);
      }

      if (!prodSnap.empty) {
        const pList: Product[] = [];
        prodSnap.forEach(d => pList.push({ id: d.id, ...d.data() } as Product));
        setProducts(pList);
      }

      if (!salesSnap.empty) {
        const sList: Sale[] = [];
        salesSnap.forEach(d => sList.push({ id: d.id, ...d.data() } as Sale));
        setSales(sList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }

      if (!custSnap.empty) {
        const cList: Customer[] = [];
        custSnap.forEach(d => cList.push({ id: d.id, ...d.data() } as Customer));
        setCustomers(cList);
      }

      if (!custPaySnap.empty) {
        const cpList: CustomerPayment[] = [];
        custPaySnap.forEach(d => cpList.push({ id: d.id, ...d.data() } as CustomerPayment));
        setCustomerPayments(cpList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }

      if (!movSnap.empty) {
        const smList: StockMovement[] = [];
        movSnap.forEach(d => smList.push({ id: d.id, ...d.data() } as StockMovement));
        setStockMovements(smList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }

      if (!expSnap.empty) {
        const eList: Expense[] = [];
        expSnap.forEach(d => eList.push({ id: d.id, ...d.data() } as Expense));
        setExpenses(eList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }

      if (!usersSnap.empty) {
        const uList: AppUser[] = [];
        usersSnap.forEach(d => uList.push({ id: d.id, ...d.data() } as AppUser));
        setAllUsers(uList);
        setCurrentUser(prev => uList.find(u => u.id === prev.id) || prev);
      }

      if (!cashSnap.empty) {
        const csList: CashSession[] = [];
        cashSnap.forEach(d => csList.push({ id: d.id, ...d.data() } as CashSession));
        setCashSessions(csList.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()));
      }

      if (!quotSnap.empty) {
        const qList: Quotation[] = [];
        quotSnap.forEach(d => qList.push({ id: d.id, ...d.data() } as Quotation));
        setQuotations(qList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }

      if (!invSnap.empty) {
        const invList: Invoice[] = [];
        invSnap.forEach(d => invList.push({ id: d.id, ...d.data() } as Invoice));
        setInvoices(invList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }

      setLastSyncedAt(new Date());
    } catch (err) {
      console.warn('Manual cloud sync notice:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [processOfflineQueue]);

  // Current Business scoped entities (Multi-tenancy isolation)
  const scopedProducts = useMemo(() => 
    products.filter(p => p.businessId === business.id),
    [products, business.id]
  );

  const scopedSales = useMemo(() => 
    sales.filter(s => s.businessId === business.id),
    [sales, business.id]
  );

  const scopedCustomers = useMemo(() => 
    customers.filter(c => c.businessId === business.id),
    [customers, business.id]
  );

  const scopedCustomerPayments = useMemo(() => 
    customerPayments.filter(cp => cp.businessId === business.id),
    [customerPayments, business.id]
  );

  const scopedExpenses = useMemo(() => 
    expenses.filter(e => e.businessId === business.id),
    [expenses, business.id]
  );

  const scopedStockMovements = useMemo(() => 
    stockMovements.filter(sm => sm.businessId === business.id),
    [stockMovements, business.id]
  );

  const scopedUsers = useMemo(() => 
    allUsers.filter(u => u.businessId === business.id),
    [allUsers, business.id]
  );

  const scopedCashSessions = useMemo(() => 
    cashSessions.filter(cs => cs.businessId === business.id),
    [cashSessions, business.id]
  );

  const activeCashSession = useMemo(() => 
    scopedCashSessions.find(cs => cs.status === 'open') || null,
    [scopedCashSessions]
  );

  const scopedQuotations = useMemo(() => 
    quotations.filter(q => q.businessId === business.id),
    [quotations, business.id]
  );

  // Generate automated alerts for stock, expiry, and overdue debts
  useEffect(() => {
    const alerts: NotificationItem[] = [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Stock alerts & Expiry alerts
    scopedProducts.forEach(p => {
      if (!p.archived) {
        if (p.currentStock <= 0) {
          alerts.push({
            id: `notif_stock_zero_${p.id}`,
            title: `Rupture de Stock : ${p.name}`,
            message: `Le stock est épuisé (0 ${p.unit}). Prévoyez un réapprovisionnement d'urgence.`,
            type: 'danger',
            timestamp: new Date().toISOString(),
            read: false,
            linkTab: 'stock',
          });
        } else if (p.currentStock <= p.alertThreshold) {
          alerts.push({
            id: `notif_stock_low_${p.id}`,
            title: `Stock Faible : ${p.name}`,
            message: `Il ne reste que ${p.currentStock} ${p.unit} (Seuil d'alerte: ${p.alertThreshold}).`,
            type: 'warning',
            timestamp: new Date().toISOString(),
            read: false,
            linkTab: 'stock',
          });
        }

        // Expiry date checking
        if (p.expiryDate) {
          const expDate = new Date(p.expiryDate);
          const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays < 0) {
            alerts.push({
              id: `notif_exp_past_${p.id}`,
              title: `Produit Périmé : ${p.name}`,
              message: `Ce produit est périmé depuis le ${p.expiryDate}. Retirez-le immédiatement de la vente.`,
              type: 'danger',
              timestamp: new Date().toISOString(),
              read: false,
              linkTab: 'expiry',
            });
          } else if (diffDays <= 30) {
            alerts.push({
              id: `notif_exp_soon_${p.id}`,
              title: `Péremption Proche (${diffDays}j) : ${p.name}`,
              message: `DLC: ${p.expiryDate}. Appliquez une remise déstockage anti-gaspillage pour accélérer la vente.`,
              type: 'warning',
              timestamp: new Date().toISOString(),
              read: false,
              linkTab: 'expiry',
            });
          }
        }
      }
    });

    // Overdue credit alerts
    scopedCustomers.forEach(c => {
      if (c.totalDebt > 0 && c.dueDate && c.dueDate < todayStr) {
        alerts.push({
          id: `notif_debt_overdue_${c.id}`,
          title: `Échéance de crédit dépassée`,
          message: `${c.name} doit ${c.totalDebt.toLocaleString()} ${business.currency} (Échéance: ${c.dueDate}). Envoyer un rappel WhatsApp.`,
          type: 'danger',
          timestamp: new Date().toISOString(),
          read: false,
          linkTab: 'customers',
        });
      }
    });

    setNotifications(alerts);
  }, [scopedProducts, scopedCustomers, business.currency]);

  // Cart operations
  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      const effectivePrice = product.discountPrice || product.salePrice;
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prev, { product, quantity, unitPrice: effectivePrice, discount: 0 }];
      }
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const updateCartItemDiscount = (productId: string, discount: number) => {
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, discount: Math.max(0, discount) } : item
      )
    );
  };

  const updateCartItemPriceType = (productId: string, priceType: 'retail' | 'wholesale' | 'semi-wholesale') => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        let newPrice = item.product.salePrice;
        if (priceType === 'wholesale' && item.product.wholesalePrice) {
          newPrice = item.product.wholesalePrice;
        } else if (priceType === 'semi-wholesale' && item.product.semiWholesalePrice) {
          newPrice = item.product.semiWholesalePrice;
        }
        return { ...item, priceType, unitPrice: newPrice };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Complete a sale (multi-device synced with loyalty, stock decrement, & cash register updates)
  const completeSale = async (
    paymentMethod: PaymentMethod,
    customerId?: string,
    customerName?: string,
    overallDiscount = 0,
    splitDetails?: { cash?: number; orangeMoney?: number; moovMoney?: number; waveCoris?: number; credit?: number; },
    notes?: string,
    loyaltyPointsToRedeem = 0
  ): Promise<Sale> => {
    if (cart.length === 0) {
      throw new Error('Le panier est vide');
    }

    const saleItems = cart.map(item => {
      const itemSubtotal = (item.unitPrice * item.quantity) - (item.discount || 0);
      const itemCost = item.product.purchasePrice * item.quantity;
      return {
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        purchasePrice: item.product.purchasePrice,
        subtotal: itemSubtotal,
        totalCost: itemCost,
      };
    });

    const subtotal = saleItems.reduce((acc, curr) => acc + curr.subtotal, 0);
    // Loyalty discount: 1 point = 100 FCFA discount (or 1:1 depending on points rule)
    const loyaltyDiscountValue = Math.min(subtotal, loyaltyPointsToRedeem * 100);
    const totalDiscountCombined = overallDiscount + loyaltyDiscountValue;
    const total = Math.max(0, subtotal - totalDiscountCombined);
    const totalCost = saleItems.reduce((acc, curr) => acc + curr.totalCost, 0);
    const profit = total - totalCost;

    // Calculate loyalty points earned: 1 point per 1,000 FCFA spent
    const pointsEarned = Math.floor(total / 1000);

    const receiptNumber = `BZ-${new Date().getFullYear()}-${String(scopedSales.length + 1).padStart(3, '0')}`;
    const saleId = `sale_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const nowIso = new Date().toISOString();

    const newSale: Sale = {
      id: saleId,
      businessId: business.id,
      receiptNumber,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      customerId,
      customerName: customerName || (customerId ? customers.find(c => c.id === customerId)?.name : 'Client Comptoir'),
      items: saleItems,
      subtotal,
      discount: totalDiscountCombined,
      total,
      totalCost,
      profit,
      paymentMethod,
      paymentBreakdown: splitDetails,
      loyaltyPointsUsed: loyaltyPointsToRedeem,
      loyaltyDiscount: loyaltyDiscountValue,
      loyaltyPointsEarned: pointsEarned,
      notes,
      createdAt: nowIso,
    };

    // Update local sales optimistically
    setSales(prev => [newSale, ...prev]);

    // 1. Decrement products stock & record stock movements
    const updatedProducts = [...products];
    const newMovements: StockMovement[] = [];

    saleItems.forEach(item => {
      const prodIndex = updatedProducts.findIndex(p => p.id === item.productId);
      if (prodIndex >= 0) {
        const p = updatedProducts[prodIndex];
        const prevStock = p.currentStock;
        const nextStock = prevStock - item.quantity;
        updatedProducts[prodIndex] = { ...p, currentStock: nextStock };

        newMovements.push({
          id: `mov_${Date.now()}_${item.productId}`,
          businessId: business.id,
          productId: item.productId,
          productName: item.productName,
          type: 'sale',
          quantity: -item.quantity,
          previousStock: prevStock,
          newStock: nextStock,
          reason: `Vente Ticket #${receiptNumber}`,
          userId: currentUser.id,
          userName: currentUser.name,
          createdAt: nowIso,
        });
      }
    });

    setProducts(updatedProducts);
    setStockMovements(prev => [...newMovements, ...prev]);

    // 2. If credit sale, increase customer's totalDebt & update loyalty points
    let customerCreditIncrement = 0;
    if ((paymentMethod === 'credit' || (splitDetails && (splitDetails.credit || 0) > 0)) && customerId) {
      customerCreditIncrement = paymentMethod === 'credit' ? total : (splitDetails?.credit || 0);
    }

    if (customerId) {
      const targetCustomer = customers.find(c => c.id === customerId);
      if (targetCustomer) {
        const currentPoints = targetCustomer.loyaltyPoints || 0;
        const nextPoints = Math.max(0, currentPoints - loyaltyPointsToRedeem + pointsEarned);
        const nextTotalSpent = (targetCustomer.totalSpent || 0) + total;
        
        let loyaltyTier: Customer['loyaltyTier'] = 'Bronze';
        if (nextTotalSpent >= 500000) loyaltyTier = 'VIP';
        else if (nextTotalSpent >= 250000) loyaltyTier = 'Gold';
        else if (nextTotalSpent >= 100000) loyaltyTier = 'Silver';

        const updatedCustomer: Customer = {
          ...targetCustomer,
          totalDebt: targetCustomer.totalDebt + customerCreditIncrement,
          loyaltyPoints: nextPoints,
          totalSpent: nextTotalSpent,
          loyaltyTier,
        };

        setCustomers(prev => prev.map(c => c.id === customerId ? updatedCustomer : c));
        await syncMutation('customers', customerId, 'update', {
          totalDebt: updatedCustomer.totalDebt,
          loyaltyPoints: updatedCustomer.loyaltyPoints,
          totalSpent: updatedCustomer.totalSpent,
          loyaltyTier: updatedCustomer.loyaltyTier,
        }, `Fidélité client ${updatedCustomer.name}`);
      }
    }

    // 3. Update active cash session if open
    if (activeCashSession) {
      const cashAmount = paymentMethod === 'cash' ? total : (splitDetails?.cash || 0);
      const omAmount = paymentMethod === 'orange_money' ? total : (splitDetails?.orangeMoney || 0);
      const moovAmount = paymentMethod === 'moov_money' ? total : (splitDetails?.moovMoney || 0);
      const waveAmount = paymentMethod === 'wave_coris' ? total : (splitDetails?.waveCoris || 0);
      const creditAmount = paymentMethod === 'credit' ? total : (splitDetails?.credit || 0);

      const updatedSession: CashSession = {
        ...activeCashSession,
        totalCashSales: activeCashSession.totalCashSales + cashAmount,
        totalOrangeMoneySales: activeCashSession.totalOrangeMoneySales + omAmount,
        totalMoovMoneySales: activeCashSession.totalMoovMoneySales + moovAmount,
        totalWaveSales: activeCashSession.totalWaveSales + waveAmount,
        totalCreditSales: activeCashSession.totalCreditSales + creditAmount,
        expectedCashInDrawer: activeCashSession.expectedCashInDrawer + cashAmount,
      };

      setCashSessions(prev => prev.map(cs => cs.id === activeCashSession.id ? updatedSession : cs));
      await syncMutation('cash_sessions', activeCashSession.id, 'update', updatedSession, 'Encaissement vente');
    }

    // 4. Clear cart
    clearCart();

    // 5. Multi-Device Real-Time Cloud Firestore Sync / Offline Queue
    await syncMutation('sales', saleId, 'set', newSale, `Vente Ticket #${receiptNumber}`);
    
    for (const p of updatedProducts) {
      const itemInSale = saleItems.find(si => si.productId === p.id);
      if (itemInSale) {
        await syncMutation('products', p.id, 'update', { currentStock: p.currentStock }, `Stock ${p.name}`);
      }
    }

    for (const mov of newMovements) {
      await syncMutation('stock_movements', mov.id, 'set', mov, `Mouvement stock ${mov.productName}`);
    }

    return newSale;
  };

  // Add Product
  const addProduct = async (productData: Omit<Product, 'id' | 'businessId' | 'createdAt'>): Promise<Product> => {
    const id = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const nowIso = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id,
      businessId: business.id,
      createdAt: nowIso,
    };

    setProducts(prev => [newProduct, ...prev]);

    let initMov: StockMovement | null = null;
    if (newProduct.currentStock > 0) {
      initMov = {
        id: `mov_${Date.now()}_init`,
        businessId: business.id,
        productId: id,
        productName: newProduct.name,
        type: 'in_purchase',
        quantity: newProduct.currentStock,
        previousStock: 0,
        newStock: newProduct.currentStock,
        reason: 'Stock initial à la création du produit',
        userId: currentUser.id,
        userName: currentUser.name,
        createdAt: nowIso,
      };
      setStockMovements(prev => [initMov!, ...prev]);
    }

    await syncMutation('products', id, 'set', newProduct, `Nouveau produit ${newProduct.name}`);
    if (initMov) {
      await syncMutation('stock_movements', initMov.id, 'set', initMov, `Stock initial ${newProduct.name}`);
    }

    return newProduct;
  };

  // Update Product
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates } : p))
    );

    await syncMutation('products', id, 'update', updates, `Modification produit ${id}`);
  };

  // Apply Expiry Discount (Anti-Gaspillage)
  const applyExpiryDiscount = async (productId: string, discountPercentage: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const discountAmount = Math.round(product.salePrice * (discountPercentage / 100));
    const newDiscountPrice = Math.max(product.purchasePrice, product.salePrice - discountAmount);

    await updateProduct(productId, {
      discountPrice: newDiscountPrice
    });
  };

  // Declare Damaged / Expired Loss
  const declareDamagedLoss = async (productId: string, quantity: number, reason: string) => {
    await recordStockMovement(productId, 'damaged_loss', quantity, reason || 'Sortie perte / péremption');
  };

  // Archive Product
  const archiveProduct = async (id: string) => {
    await updateProduct(id, { archived: true });
  };

  // Record Stock Movement
  const recordStockMovement = async (
    productId: string,
    type: StockMovementType,
    quantity: number,
    reason: string
  ) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const prevStock = prod.currentStock;
    let nextStock = prevStock;

    if (type === 'in_purchase' || type === 'return_customer') {
      nextStock = prevStock + quantity;
    } else if (type === 'out_manual' || type === 'damaged_loss' || type === 'sale') {
      nextStock = Math.max(0, prevStock - quantity);
    } else if (type === 'inventory_adjustment') {
      nextStock = quantity;
    }

    const movementId = `mov_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const nowIso = new Date().toISOString();

    const newMovement: StockMovement = {
      id: movementId,
      businessId: business.id,
      productId,
      productName: prod.name,
      type,
      quantity: nextStock - prevStock,
      previousStock: prevStock,
      newStock: nextStock,
      reason,
      userId: currentUser.id,
      userName: currentUser.name,
      createdAt: nowIso,
    };

    setStockMovements(prev => [newMovement, ...prev]);
    await updateProduct(productId, { currentStock: nextStock });
    await syncMutation('stock_movements', movementId, 'set', newMovement, `Mouvement stock ${prod.name}`);
  };

  // Customer Management
  const addCustomer = async (customerData: Omit<Customer, 'id' | 'businessId' | 'createdAt' | 'totalDebt'>): Promise<Customer> => {
    const id = `cust_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const nowIso = new Date().toISOString();
    const newCustomer: Customer = {
      ...customerData,
      id,
      businessId: business.id,
      totalDebt: 0,
      loyaltyPoints: 0,
      loyaltyTier: 'Bronze',
      totalSpent: 0,
      createdAt: nowIso,
    };

    setCustomers(prev => [newCustomer, ...prev]);
    await syncMutation('customers', id, 'set', newCustomer, `Nouveau client ${newCustomer.name}`);

    return newCustomer;
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    setCustomers(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates } : c))
    );

    await syncMutation('customers', id, 'update', updates, `Modification client ${id}`);
  };

  const addLoyaltyPoints = async (customerId: string, pointsEarned: number, spentAmount: number) => {
    const target = customers.find(c => c.id === customerId);
    if (!target) return;
    const nextPoints = (target.loyaltyPoints || 0) + pointsEarned;
    const nextSpent = (target.totalSpent || 0) + spentAmount;
    let loyaltyTier: Customer['loyaltyTier'] = 'Bronze';
    if (nextSpent >= 500000) loyaltyTier = 'VIP';
    else if (nextSpent >= 250000) loyaltyTier = 'Gold';
    else if (nextSpent >= 100000) loyaltyTier = 'Silver';

    await updateCustomer(customerId, {
      loyaltyPoints: nextPoints,
      totalSpent: nextSpent,
      loyaltyTier,
    });
  };

  // Record Customer Debt Payment
  const recordCustomerPayment = async (
    customerId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    notes?: string
  ) => {
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return;

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const nowIso = new Date().toISOString();

    const newPayment: CustomerPayment = {
      id: paymentId,
      businessId: business.id,
      customerId,
      customerName: cust.name,
      amount,
      paymentMethod,
      recordedBy: currentUser.id,
      recordedByName: currentUser.name,
      notes,
      createdAt: nowIso,
    };

    const newDebt = Math.max(0, cust.totalDebt - amount);

    setCustomerPayments(prev => [newPayment, ...prev]);
    await updateCustomer(customerId, { totalDebt: newDebt });

    // If cash session open and payment in cash, update cash session
    if (activeCashSession && paymentMethod === 'cash') {
      const updatedSession: CashSession = {
        ...activeCashSession,
        totalCashIn: activeCashSession.totalCashIn + amount,
        expectedCashInDrawer: activeCashSession.expectedCashInDrawer + amount,
      };
      setCashSessions(prev => prev.map(cs => cs.id === activeCashSession.id ? updatedSession : cs));
      await syncMutation('cash_sessions', activeCashSession.id, 'update', updatedSession, 'Encaissement règlement');
    }

    await syncMutation('customer_payments', paymentId, 'set', newPayment, `Règlement client ${cust.name}`);
  };

  // Add Expense
  const addExpense = async (expenseData: {
    category: ExpenseCategory;
    customCategory?: string;
    amount: number;
    paymentMethod: PaymentMethod;
    beneficiary: string;
    notes?: string;
  }): Promise<Expense> => {
    const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const nowIso = new Date().toISOString();
    const newExp: Expense = {
      ...expenseData,
      id,
      businessId: business.id,
      recordedBy: currentUser.id,
      recordedByName: currentUser.name,
      createdAt: nowIso,
    };

    setExpenses(prev => [newExp, ...prev]);

    // If active cash session and paid in cash, record cash out
    if (activeCashSession && expenseData.paymentMethod === 'cash') {
      const updatedSession: CashSession = {
        ...activeCashSession,
        totalCashOut: activeCashSession.totalCashOut + expenseData.amount,
        expectedCashInDrawer: Math.max(0, activeCashSession.expectedCashInDrawer - expenseData.amount),
      };
      setCashSessions(prev => prev.map(cs => cs.id === activeCashSession.id ? updatedSession : cs));
      await syncMutation('cash_sessions', activeCashSession.id, 'update', updatedSession, 'Décaissement dépense');
    }

    await syncMutation('expenses', id, 'set', newExp, `Dépense ${newExp.beneficiary}`);

    return newExp;
  };

  // Cash Session Operations (Z-Report)
  const openCashSession = async (initialFloat: number, notes?: string): Promise<CashSession> => {
    const id = `cash_sess_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const nowIso = new Date().toISOString();

    const newSession: CashSession = {
      id,
      businessId: business.id,
      userId: currentUser.id,
      userName: currentUser.name,
      openedAt: nowIso,
      initialFloat,
      totalCashSales: 0,
      totalOrangeMoneySales: 0,
      totalMoovMoneySales: 0,
      totalWaveSales: 0,
      totalCreditSales: 0,
      totalCashIn: 0,
      totalCashOut: 0,
      expectedCashInDrawer: initialFloat,
      status: 'open',
      closingNotes: notes,
      createdAt: nowIso,
    };

    setCashSessions(prev => [newSession, ...prev]);
    await syncMutation('cash_sessions', id, 'set', newSession, `Ouverture session caisse`);

    return newSession;
  };

  const closeCashSession = async (actualCashCounted: number, notes?: string): Promise<CashSession> => {
    if (!activeCashSession) {
      throw new Error('Aucune session de caisse active.');
    }

    const nowIso = new Date().toISOString();
    const discrepancy = actualCashCounted - activeCashSession.expectedCashInDrawer;

    const closedSession: CashSession = {
      ...activeCashSession,
      closedAt: nowIso,
      actualCashCounted,
      discrepancy,
      status: 'closed',
      closingNotes: notes || activeCashSession.closingNotes,
    };

    setCashSessions(prev => prev.map(cs => cs.id === activeCashSession.id ? closedSession : cs));
    await syncMutation('cash_sessions', activeCashSession.id, 'update', closedSession, `Clôture session caisse`);

    return closedSession;
  };

  const recordCashMovement = async (type: 'cash_in' | 'cash_out', amount: number, reason: string) => {
    if (!activeCashSession) {
      throw new Error('Veuillez d\'abord ouvrir une session de caisse.');
    }

    const updatedSession: CashSession = {
      ...activeCashSession,
      totalCashIn: type === 'cash_in' ? activeCashSession.totalCashIn + amount : activeCashSession.totalCashIn,
      totalCashOut: type === 'cash_out' ? activeCashSession.totalCashOut + amount : activeCashSession.totalCashOut,
      expectedCashInDrawer: type === 'cash_in'
        ? activeCashSession.expectedCashInDrawer + amount
        : Math.max(0, activeCashSession.expectedCashInDrawer - amount),
      closingNotes: activeCashSession.closingNotes 
        ? `${activeCashSession.closingNotes} | ${type === 'cash_in' ? '+Entrée' : '-Sortie'}: ${amount} FCFA (${reason})`
        : `${type === 'cash_in' ? '+Entrée' : '-Sortie'}: ${amount} FCFA (${reason})`,
    };

    setCashSessions(prev => prev.map(cs => cs.id === activeCashSession.id ? updatedSession : cs));
    await syncMutation('cash_sessions', activeCashSession.id, 'update', updatedSession, `Mouvement caisse ${type}`);
  };

  // Quotation / Proforma Operations
  const addQuotation = async (
    quotationData: Omit<Quotation, 'id' | 'businessId' | 'quotationNumber' | 'createdBy' | 'createdByName' | 'createdAt'>
  ): Promise<Quotation> => {
    const id = `quot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const nowIso = new Date().toISOString();
    const quotationNumber = `DEV-${business.name.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${String(scopedQuotations.length + 1).padStart(2, '0')}`;

    const newQuotation: Quotation = {
      ...quotationData,
      id,
      businessId: business.id,
      quotationNumber,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: nowIso,
    };

    setQuotations(prev => [newQuotation, ...prev]);
    await syncMutation('quotations', id, 'set', newQuotation, `Nouveau devis #${quotationNumber}`);

    return newQuotation;
  };

  const updateQuotationStatus = async (id: string, status: Quotation['status']) => {
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    await syncMutation('quotations', id, 'update', { status }, `Statut devis ${id}`);
  };

  const deleteQuotation = async (id: string) => {
    setQuotations(prev => prev.filter(q => q.id !== id));
    await syncMutation('quotations', id, 'delete', undefined, `Suppression devis ${id}`);
  };

  // INVOICES

  const addInvoice = async (
    invoiceData: Omit<Invoice, 'id' | 'businessId' | 'invoiceNumber' | 'createdBy' | 'createdByName' | 'createdAt'>
  ): Promise<Invoice> => {
    const id = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const nowIso = new Date().toISOString();
    const invoiceNumber = `FAC-${business.name.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${String(invoices.filter(i => i.businessId === business.id).length + 1).padStart(2, '0')}`;

    const newInvoice: Invoice = {
      ...invoiceData,
      id,
      businessId: business.id,
      invoiceNumber,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: nowIso,
    };

    setInvoices(prev => [newInvoice, ...prev]);
    await syncMutation('invoices', id, 'set', newInvoice, `Nouvelle facture #${invoiceNumber}`);

    return newInvoice;
  };

  const updateInvoiceStatus = async (id: string, status: Invoice['status'], amountPaid?: number) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        return { 
          ...inv, 
          status, 
          amountPaid: amountPaid !== undefined ? amountPaid : inv.amountPaid 
        };
      }
      return inv;
    }));

    const updates: any = { status };
    if (amountPaid !== undefined) {
      updates.amountPaid = amountPaid;
    }
    await syncMutation('invoices', id, 'update', updates, `Statut facture ${id}`);
  };

  const loadQuotationToCart = (quotation: Quotation) => {
    const itemsToLoad: CartItem[] = quotation.items.map(it => {
      const prod = products.find(p => p.id === it.productId) || {
        id: it.productId,
        businessId: business.id,
        name: it.productName,
        sku: 'DEV-ITEM',
        category: 'Général',
        unit: 'Pièce',
        purchasePrice: Math.round(it.unitPrice * 0.7),
        salePrice: it.unitPrice,
        currentStock: 99,
        alertThreshold: 5,
        archived: false,
        createdAt: new Date().toISOString(),
      };
      return {
        product: prod,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discount: 0,
      };
    });

    setCart(itemsToLoad);
    setActiveTab('pos');
  };

  const convertQuotationToSale = async (quotationId: string, paymentMethod: PaymentMethod): Promise<Sale> => {
    const quotation = quotations.find(q => q.id === quotationId);
    if (!quotation) {
      throw new Error('Devis introuvable');
    }

    loadQuotationToCart(quotation);
    const sale = await completeSale(
      paymentMethod,
      quotation.customerId,
      quotation.customerName,
      quotation.discount,
      undefined,
      `Converti depuis Devis #${quotation.quotationNumber}`
    );

    await updateQuotationStatus(quotationId, 'converted');
    return sale;
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Reset to sample Boutique Maëlys demo dataset
  const resetToDemoData = async () => {
    setAllBusinesses(initialBusinesses);
    setBusiness(initialBusinesses[0]);
    setIsBusinessAuthenticated(true);
    setAllUsers(initialUsers);
    setCurrentUser(initialUsers[0]);
    setProducts(initialProducts);
    setSales(initialSales);
    setCustomers(initialCustomers);
    setExpenses(initialExpenses);
    setStockMovements(initialStockMovements);
    setCashSessions(initialCashSessions);
    setQuotations(initialQuotations);
    setCustomerPayments([]);
    setCart([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);

    try {
      const batch = writeBatch(db);
      initialBusinesses.forEach(b => batch.set(doc(db, 'businesses', b.id), sanitizeForFirestore(b)));
      initialUsers.forEach(u => batch.set(doc(db, 'users', u.id), sanitizeForFirestore(u)));
      initialProducts.forEach(p => batch.set(doc(db, 'products', p.id), sanitizeForFirestore(p)));
      initialCustomers.forEach(c => batch.set(doc(db, 'customers', c.id), sanitizeForFirestore(c)));
      initialExpenses.forEach(e => batch.set(doc(db, 'expenses', e.id), sanitizeForFirestore(e)));
      initialSales.forEach(s => batch.set(doc(db, 'sales', s.id), sanitizeForFirestore(s)));
      initialStockMovements.forEach(sm => batch.set(doc(db, 'stock_movements', sm.id), sanitizeForFirestore(sm)));
      initialCashSessions.forEach(cs => batch.set(doc(db, 'cash_sessions', cs.id), sanitizeForFirestore(cs)));
      initialQuotations.forEach(q => batch.set(doc(db, 'quotations', q.id), sanitizeForFirestore(q)));
      await batch.commit();
    } catch (e) {
      console.warn('Reset demo batch error:', e);
    }
  };

  // Compute live Business Summary for current scoped business
  const summary: BusinessSummary = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let todaySales = 0;
    let todaySalesCount = 0;
    let todayProfit = 0;
    let weekSales = 0;
    let monthSales = 0;
    let monthProfit = 0;

    scopedSales.forEach(sale => {
      const saleDate = new Date(sale.createdAt);
      const saleDateStr = sale.createdAt.split('T')[0];

      if (saleDateStr === todayStr) {
        todaySales += sale.total;
        todaySalesCount += 1;
        todayProfit += sale.profit;
      }
      if (saleDate >= sevenDaysAgo) {
        weekSales += sale.total;
      }
      if (saleDate >= thirtyDaysAgo) {
        monthSales += sale.total;
        monthProfit += sale.profit;
      }
    });

    let todayExpenses = 0;
    let monthExpenses = 0;
    scopedExpenses.forEach(exp => {
      const expDate = new Date(exp.createdAt);
      const expDateStr = exp.createdAt.split('T')[0];
      if (expDateStr === todayStr) {
        todayExpenses += exp.amount;
      }
      if (expDate >= thirtyDaysAgo) {
        monthExpenses += exp.amount;
      }
    });

    const totalPendingDebts = scopedCustomers.reduce((acc, c) => acc + (c.totalDebt || 0), 0);
    const lowStockCount = scopedProducts.filter(p => !p.archived && p.currentStock > 0 && p.currentStock <= p.alertThreshold).length;
    const outOfStockCount = scopedProducts.filter(p => !p.archived && p.currentStock <= 0).length;

    const expiringProductsCount = scopedProducts.filter(p => {
      if (!p.expiryDate || p.archived) return false;
      const exp = new Date(p.expiryDate);
      const diff = (exp.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 30;
    }).length;

    return {
      todaySales,
      todaySalesCount,
      todayProfit: todayProfit - todayExpenses,
      todayExpenses,
      weekSales,
      monthSales,
      monthProfit: monthProfit - monthExpenses,
      monthExpenses,
      totalPendingDebts,
      lowStockCount,
      outOfStockCount,
      expiringProductsCount,
      activeCashSession,
    };
  }, [scopedSales, scopedExpenses, scopedCustomers, scopedProducts, activeCashSession]);

  return (
    <AppContext.Provider
      value={{
        allBusinesses,
        business,
        isBusinessAuthenticated,
        authenticateBusiness,
        logoutBusiness,
        createBusiness,
        updateBusiness,
        deleteBusiness,
        regenerateAccessCode,
        switchBusiness,
        updateBusinessProfile,
        currentUser,
        allUsers: scopedUsers,
        switchUser,
        userToSwitchWithPin,
        setUserToSwitchWithPin,
        requestUserSwitch,
        addUser,
        updateUser,
        updateUserPin,
        toggleUserStatus,
        deleteUser,
        verifyUserPin,
        products: scopedProducts,
        sales: scopedSales,
        customers: scopedCustomers,
        customerPayments: scopedCustomerPayments,
        expenses: scopedExpenses,
        stockMovements: scopedStockMovements,
        cashSessions: scopedCashSessions,
        activeCashSession,
        openCashSession,
        closeCashSession,
        recordCashMovement,
        quotations: scopedQuotations,
        addQuotation,
        updateQuotationStatus,
        deleteQuotation,
        convertQuotationToSale,
        loadQuotationToCart,
        invoices: invoices.filter(i => i.businessId === business.id),
        addInvoice,
        updateInvoiceStatus,
        applyExpiryDiscount,
        declareDamagedLoss,
        addLoyaltyPoints,
        notifications,
        cart,
        isOnline,
        isSyncing,
        lastSyncedAt,
        forceSyncCloudData,
        pendingSyncCount: offlineQueue.length,
        offlineQueue,
        processOfflineQueue,
        activeTab,
        setActiveTab,
        isPlatformAdminUnlocked,
        showAdminPinModal,
        setShowAdminPinModal,
        unlockPlatformAdmin,
        lockPlatformAdmin,
        handleLogoClick,
        addToCart,
        updateCartQuantity,
        updateCartItemDiscount,
        updateCartItemPriceType,
        removeFromCart,
        clearCart,
        completeSale,
        addProduct,
        updateProduct,
        archiveProduct,
        recordStockMovement,
        addCustomer,
        updateCustomer,
        recordCustomerPayment,
        addExpense,
        summary,
        markNotificationAsRead,
        clearAllNotifications,
        resetToDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
