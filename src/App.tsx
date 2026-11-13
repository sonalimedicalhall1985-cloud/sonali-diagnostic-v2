/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext.tsx';
import { ThemeProvider, useTheme } from './context/ThemeContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar, NavTab } from './components/Sidebar.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { Patients } from './components/Patients.tsx';
import { Billing } from './components/Billing.tsx';
import { Samples } from './components/Samples.tsx';
import { LabResults } from './components/LabResults.tsx';
import { Reports } from './components/Reports.tsx';
import { Doctors } from './components/Doctors.tsx';
import { QueueTV } from './components/QueueTV.tsx';
import { FreeCamp } from './components/FreeCamp.tsx';
import { BloodDonors } from './components/BloodDonors.tsx';
import { Accounting } from './components/Accounting.tsx';
import { Employees } from './components/Employees.tsx';
import { Marketing } from './components/Marketing.tsx';
import { AuditLogs } from './components/AuditLogs.tsx';
import { TestCatalog } from './components/TestCatalog.tsx';
import { RolesAndPermissions } from './components/RolesAndPermissions.tsx';
import { PrintInvoiceModal } from './components/PrintInvoiceModal.tsx';
import { PrintReportModal } from './components/PrintReportModal.tsx';
import { ReportVerifyModal } from './components/ReportVerifyModal.tsx';
import { Patient, Invoice, InvoiceItem, PaymentRecord, LabReport } from './types/index.ts';
import {
  WifiOff,
  LayoutDashboard,
  Users,
  CreditCard,
  FileCheck2,
  Menu,
  PlusCircle,
  ShieldAlert,
  Shield,
} from 'lucide-react';

function AppContent() {
  const { language } = useLanguage();
  const { user, canAccessTab } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Unsaved data prevention & beforeunload warning
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Cross-module states
  const [billingPatient, setBillingPatient] = useState<Patient | null>(null);

  // Modals state
  const [printInvoiceData, setPrintInvoiceData] = useState<{
    invoice: Invoice;
    items: InvoiceItem[];
    payments: PaymentRecord[];
  } | null>(null);

  const [printReportData, setPrintReportData] = useState<LabReport | null>(null);
  const [verifyQrHash, setVerifyQrHash] = useState<string | null>(null);

  // Online status for PWA
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleStartBillingWithPatient = (patient: Patient) => {
    setBillingPatient(patient);
    setCurrentTab('billing');
  };

  const handleOpenPrintInvoice = (
    invoice: Invoice,
    items: InvoiceItem[],
    payments: PaymentRecord[]
  ) => {
    setPrintInvoiceData({ invoice, items, payments });
  };

  const handleOpenPrintReport = (report: LabReport) => {
    setPrintReportData(report);
  };

  const handleVerifyQR = (hash: string) => {
    setVerifyQrHash(hash);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Offline PWA Banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs px-4 py-2 flex items-center justify-center gap-2 font-semibold">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>
            {language === 'bn'
              ? 'অফলাইন মোড সক্রিয় — স্থানীয় ক্যাশ ও এলএএন (LAN) ডাটা ব্যবহৃত হচ্ছে।'
              : 'Offline Mode Active — Running on Local LAN cache & queue synchronization.'}
          </span>
        </div>
      )}

      {/* Main Top Navbar */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNavigateToRoles={() => setCurrentTab('roles')}
      />

      {/* Body Layout: Sidebar + Main Content */}
      <div className="flex-1 flex">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 p-3 sm:p-4 lg:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto w-full transition-all">
          {!canAccessTab(currentTab) ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-xl mx-auto my-12 text-center shadow-lg space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto shadow-md">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Access Restricted by Role Policy
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Your current role (<strong>{user?.role}</strong>) does not have permission to access the{' '}
                  <span className="font-bold text-teal-600 uppercase">{currentTab}</span> module.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                You can switch to an authorized workstation role or request the Administrator to grant this privilege in the Roles & Permissions matrix.
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold transition"
                >
                  Return to Dashboard
                </button>
                <button
                  onClick={() => setCurrentTab('roles')}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black shadow-md transition"
                >
                  View Roles & Permissions
                </button>
              </div>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && <Dashboard onNavigate={(tab) => setCurrentTab(tab)} />}
              {currentTab === 'patients' && (
                <Patients
                  onStartBillingWithPatient={handleStartBillingWithPatient}
                  onViewReport={handleOpenPrintReport}
                  onViewInvoice={(inv) => handleOpenPrintInvoice(inv, [], [])}
                />
              )}
              {currentTab === 'billing' && (
                <Billing
                  initialPatient={billingPatient}
                  onPrintInvoice={handleOpenPrintInvoice}
                />
              )}
              {currentTab === 'samples' && <Samples />}
              {currentTab === 'labResults' && <LabResults />}
              {currentTab === 'reports' && (
                <Reports
                  onPrintReport={handleOpenPrintReport}
                  onVerifyQR={handleVerifyQR}
                />
              )}
              {currentTab === 'tests' && <TestCatalog />}
              {currentTab === 'doctors' && <Doctors />}
              {currentTab === 'queue' && <QueueTV />}
              {currentTab === 'freeCamp' && <FreeCamp />}
              {currentTab === 'bloodDonors' && <BloodDonors />}
              {currentTab === 'accounting' && <Accounting />}
              {currentTab === 'employees' && <Employees />}
              {currentTab === 'marketing' && <Marketing />}
              {currentTab === 'audit' && <AuditLogs />}
              {currentTab === 'roles' && <RolesAndPermissions />}
            </>
          )}
        </main>
      </div>

      {/* Mobile & Tablet Quick Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1 shadow-2xl flex items-center justify-around safe-bottom">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => {
            setCurrentTab('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all min-w-[56px] ${
            currentTab === 'dashboard'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${currentTab === 'dashboard' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">
            {language === 'bn' ? 'ড্যাশবোর্ড' : 'Home'}
          </span>
        </button>

        {/* Tab 2: Patients */}
        <button
          onClick={() => {
            setCurrentTab('patients');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all min-w-[56px] ${
            currentTab === 'patients'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <Users className={`w-5 h-5 ${currentTab === 'patients' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">
            {language === 'bn' ? 'রোগী' : 'Patients'}
          </span>
        </button>

        {/* Center Tab: Billing (Elevated) */}
        <button
          onClick={() => {
            setCurrentTab('billing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center justify-center -mt-4 bg-teal-500 hover:bg-teal-400 text-slate-950 p-2.5 rounded-2xl shadow-lg shadow-teal-500/30 transition-transform active:scale-95"
          aria-label="New Bill"
        >
          <CreditCard className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">
            {language === 'bn' ? 'নতুন বিল' : 'New Bill'}
          </span>
        </button>

        {/* Tab 4: Reports */}
        <button
          onClick={() => {
            setCurrentTab('reports');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all min-w-[56px] ${
            currentTab === 'reports'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className={`w-5 h-5 ${currentTab === 'reports' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">
            {language === 'bn' ? 'রিপোর্ট' : 'Reports'}
          </span>
        </button>

        {/* Tab 5: Menu Drawer */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center justify-center p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 min-w-[56px]"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">
            {language === 'bn' ? 'মেনু' : 'Menu'}
          </span>
        </button>
      </nav>

      {/* Modals */}
      {printInvoiceData && (
        <PrintInvoiceModal
          invoice={printInvoiceData.invoice}
          items={printInvoiceData.items}
          payments={printInvoiceData.payments}
          onClose={() => setPrintInvoiceData(null)}
        />
      )}

      {printReportData && (
        <PrintReportModal
          report={printReportData}
          onClose={() => setPrintReportData(null)}
          onVerifyQR={handleVerifyQR}
        />
      )}

      {verifyQrHash && (
        <ReportVerifyModal
          hash={verifyQrHash}
          onClose={() => setVerifyQrHash(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
