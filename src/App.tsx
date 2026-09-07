import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { PosView } from './components/pos/PosView';
import { ProductsView } from './components/products/ProductsView';
import { StockView } from './components/stock/StockView';
import { CustomersView } from './components/customers/CustomersView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { DashboardView } from './components/dashboard/DashboardView';
import { SettingsView } from './components/settings/SettingsView';
import { PlatformAdminView } from './components/admin/PlatformAdminView';
import { AdminPinModal } from './components/admin/AdminPinModal';
import { CompanyAccessPortal } from './components/auth/CompanyAccessPortal';
import { StaffPinModal } from './components/auth/StaffPinModal';
import { CashRegisterView } from './components/cash/CashRegisterView';
import { ExpiryManagementView } from './components/expiry/ExpiryManagementView';
import { ProformaInvoicesView } from './components/proformas/ProformaInvoicesView';
import { BarcodeLabelsView } from './components/labels/BarcodeLabelsView';
import { InvoicesView } from './components/invoices/InvoicesView';
import { CustomerDisplayView } from './components/pos/CustomerDisplayView';

const MainLayout: React.FC = () => {
  const { 
    activeTab, 
    currentUser, 
    isPlatformAdminUnlocked, 
    isBusinessAuthenticated,
    userToSwitchWithPin,
    setUserToSwitchWithPin,
    switchUser
  } = useApp();

  // Check if this window was opened specifically as the Secondary Customer-Facing Display
  const isDedicatedCustomerWindow = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('display') === 'customer'
  );

  if (isDedicatedCustomerWindow) {
    return <CustomerDisplayView isStandaloneWindow={true} />;
  }

  // If the user hasn't authenticated their business and isn't on the platform admin screen, show company login portal
  if (!isBusinessAuthenticated && activeTab !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 font-sans antialiased">
        <CompanyAccessPortal />
        <AdminPinModal />
      </div>
    );
  }

  const isOwner = currentUser.role === 'owner' || currentUser.role === 'admin';
  const isManager = currentUser.role === 'manager' || isOwner;
  const isStockManager = currentUser.role === 'stock_manager' || isManager;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0 bg-slate-50">
          {activeTab === 'pos' && <PosView />}
          {activeTab === 'cash_register' && <CashRegisterView />}
          {activeTab === 'products' && <ProductsView />}
          {activeTab === 'stock' && (isStockManager ? <StockView /> : <PosView />)}
          {activeTab === 'expiry' && (isStockManager ? <ExpiryManagementView /> : <PosView />)}
          {activeTab === 'proformas' && <ProformaInvoicesView />}
          {activeTab === 'invoices' && <InvoicesView />}
          {activeTab === 'labels' && (isStockManager ? <BarcodeLabelsView /> : <PosView />)}
          {activeTab === 'customers' && <CustomersView />}
          {activeTab === 'expenses' && <ExpensesView />}
          {activeTab === 'dashboard' && (isManager ? <DashboardView /> : <PosView />)}
          {activeTab === 'settings' && (isOwner ? <SettingsView /> : <PosView />)}
          {activeTab === 'customer_display' && <CustomerDisplayView />}
          {activeTab === 'admin' && (isPlatformAdminUnlocked ? <PlatformAdminView /> : <PosView />)}
        </main>
      </div>

      {/* Bottom Mobile Navigation for Phone Screens */}
      <MobileNav />

      {/* Master Admin PIN Modal */}
      <AdminPinModal />

      {/* Staff PIN Switch Modal */}
      <StaffPinModal
        userToSwitch={userToSwitchWithPin}
        onClose={() => setUserToSwitchWithPin(null)}
        onSuccess={(user) => {
          switchUser(user.id);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
