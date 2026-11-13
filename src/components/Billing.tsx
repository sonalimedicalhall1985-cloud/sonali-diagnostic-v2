import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  Printer,
  Receipt,
  Search,
  CheckCircle2,
  DollarSign,
  User,
  Percent,
  AlertCircle,
  FileText,
  Clock,
  X,
  PlusCircle,
  Stethoscope,
  Wallet,
  RotateCcw,
  Edit3,
  Sliders,
  Scissors,
  Check,
  AlertTriangle,
  BellRing,
  Smartphone,
  Mail,
  Send,
  Lock,
  Shield,
  ChevronDown,
  ChevronUp,
  Save,
  RefreshCw,
  MessageCircle,
} from 'lucide-react';
import { Invoice, InvoiceItem, DiagnosticTest, Patient, PaymentRecord, Doctor } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { notificationService } from '../services/notificationService.ts';
import { PatientNotificationCenter } from './PatientNotificationCenter.tsx';

interface BillingProps {
  initialPatient?: Patient | null;
  onPrintInvoice: (invoice: Invoice, items: InvoiceItem[], payments: PaymentRecord[]) => void;
}

export const Billing: React.FC<BillingProps> = ({ initialPatient, onPrintInvoice }) => {
  const { language, t } = useLanguage();
  const { token, user, hasPermission } = useAuth();

  const [activeBillingView, setActiveBillingView] = useState<'pos' | 'notifications'>('pos');
  const [invoicesList, setInvoicesList] = useState<Invoice[]>([]);
  const [testsList, setTestsList] = useState<DiagnosticTest[]>([]);
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);

  // Bill Creation Form State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(initialPatient || null);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedTests, setSelectedTests] = useState<DiagnosticTest[]>([]);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [paidAmount, setPaidAmount] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [notes, setNotes] = useState<string>('');

  // Referring Doctor & Honorarium / Commission State
  const [selectedDoctorObj, setSelectedDoctorObj] = useState<Doctor | null>(null);
  const [doctorSelectMode, setDoctorSelectMode] = useState<string>('self'); // 'self', 'custom', or doctor id string
  const [customDoctorName, setCustomDoctorName] = useState<string>('');
  const [doctorHonorariumType, setDoctorHonorariumType] = useState<'percentage' | 'fixed'>('percentage');
  const [doctorHonorariumRate, setDoctorHonorariumRate] = useState<string>('25');
  const [doctorApprovedCommission, setDoctorApprovedCommission] = useState<string>('0');
  const [doctorCommissionNotes, setDoctorCommissionNotes] = useState<string>('');
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);
  const [isHonorariumOpen, setIsHonorariumOpen] = useState<boolean>(false);
  const [testSearchQuery, setTestSearchQuery] = useState<string>('');
  const [autoSendInvoiceAlerts, setAutoSendInvoiceAlerts] = useState<boolean>(true);
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState<boolean>(false);
  const [showBillingExitModal, setShowBillingExitModal] = useState<boolean>(false);
  const [draftSavedToast, setDraftSavedToast] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const saveBillingDraft = () => {
    try {
      const draft = {
        selectedPatient,
        selectedTests,
        discountType,
        discountValue,
        paidAmount,
        paymentMethod,
        doctorSelectMode,
        customDoctorName,
        doctorHonorariumRate,
        doctorApprovedCommission,
        notes,
      };
      localStorage.setItem('sdc_billing_draft', JSON.stringify(draft));
      setDraftSavedToast(true);
      setTimeout(() => setDraftSavedToast(false), 3000);
    } catch (e) {}
  };

  const loadBillingDraft = () => {
    try {
      const saved = localStorage.getItem('sdc_billing_draft');
      if (saved) {
        const d = JSON.parse(saved);
        if (d.selectedPatient) setSelectedPatient(d.selectedPatient);
        if (d.selectedTests) setSelectedTests(d.selectedTests);
        if (d.discountType) setDiscountType(d.discountType);
        if (d.discountValue) setDiscountValue(d.discountValue);
        if (d.paidAmount) setPaidAmount(d.paidAmount);
        if (d.paymentMethod) setPaymentMethod(d.paymentMethod);
        if (d.doctorSelectMode) setDoctorSelectMode(d.doctorSelectMode);
        if (d.customDoctorName) setCustomDoctorName(d.customDoctorName);
        if (d.doctorHonorariumRate) setDoctorHonorariumRate(d.doctorHonorariumRate);
        if (d.doctorApprovedCommission) setDoctorApprovedCommission(d.doctorApprovedCommission);
        if (d.notes) setNotes(d.notes);
      }
    } catch (e) {}
  };

  const clearBillingDraft = () => {
    localStorage.removeItem('sdc_billing_draft');
  };

  const hasBillingDraft = typeof window !== 'undefined' && !!localStorage.getItem('sdc_billing_draft');

  // Settle Due Modal State
  const [settleInvoice, setSettleInvoice] = useState<Invoice | null>(null);
  const [duePayAmount, setDuePayAmount] = useState('');
  const [duePayMethod, setDuePayMethod] = useState('Cash');

  // Edit Existing Invoice Modal State (for patient financial difficulty / test adjustment)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editInvoiceTests, setEditInvoiceTests] = useState<DiagnosticTest[]>([]);
  const [editDiscountType, setEditDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [editDiscountValue, setEditDiscountValue] = useState<string>('0');
  const [editPaidAmount, setEditPaidAmount] = useState<string>('0');
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>('Cash');
  const [editCommissionAmount, setEditCommissionAmount] = useState<string>('0');
  const [editNotes, setEditNotes] = useState<string>('');

  useEffect(() => {
    fetchInvoices();
    fetchTests();
    fetchPatients();
    fetchDoctors();
  }, [token]);

  useEffect(() => {
    if (initialPatient) {
      setSelectedPatient(initialPatient);
      if (initialPatient.referringDoctor && initialPatient.referringDoctor !== 'Self / General') {
        setDoctorSelectMode('custom');
        setCustomDoctorName(initialPatient.referringDoctor);
      }
    }
  }, [initialPatient]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/invoices', {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (res.ok) {
        const json = await res.json();
        setInvoicesList(json);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTests = async () => {
    try {
      const res = await fetch('/api/tests');
      if (res.ok) {
        const json = await res.json();
        setTestsList(json);
      }
    } catch (err) {
      console.error('Error fetching tests:', err);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients', {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (res.ok) {
        const json = await res.json();
        setPatientsList(json);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors');
      if (res.ok) {
        const json = await res.json();
        setDoctorsList(json);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }
  };

  // Helper: check if a test is an Ultrasonography test
  const isUsgTest = (t: DiagnosticTest) => {
    const code = (t.code || '').toUpperCase();
    const name = (t.name || '').toLowerCase();
    const category = (t.category || '').toLowerCase();
    return (
      category.includes('ultrasound') ||
      category.includes('ultrasonography') ||
      code.includes('USG') ||
      name.includes('usg') ||
      name.includes('ultra') ||
      name.includes('আল্ট্রা')
    );
  };

  // Calculations
  const subtotal = selectedTests.reduce((sum, t) => sum + parseFloat(t.price || '0'), 0);
  let discount = 0;
  if (discountType === 'percentage') {
    discount = (subtotal * (parseFloat(discountValue) || 0)) / 100;
  } else {
    discount = parseFloat(discountValue) || 0;
  }
  if (discount > subtotal) discount = subtotal;

  const total = Math.max(0, subtotal - discount);
  const paid = parseFloat(paidAmount) || 0;
  const due = Math.max(0, total - paid);

  // Calculate USG Fixed ৳300 + Remaining tests net percentage (after discount)
  const calculateCommissionBreakdown = (tests: DiagnosticTest[], disc: number, docObj: Doctor | null, customRate: string) => {
    if (doctorSelectMode === 'self') {
      return { usgCount: 0, usgFixedFee: 300, usgComm: 0, usgTotalBill: 0, remainingNetBill: 0, generalRate: 25, generalComm: 0, total: 0 };
    }

    const usgFixedFee = parseFloat(docObj?.usgFixedCommission || '300') || 300;
    const generalRate = parseFloat(docObj?.generalTestCommissionRate || customRate || '25') || 25;

    let usgCount = 0;
    let usgTotalBill = 0;
    let nonUsgTotalBill = 0;

    for (const t of tests) {
      const price = parseFloat(t.price || '0');
      if (isUsgTest(t)) {
        usgCount++;
        usgTotalBill += price;
      } else {
        nonUsgTotalBill += price;
      }
    }

    const grossSubtotal = usgTotalBill + nonUsgTotalBill;
    const netBill = Math.max(0, grossSubtotal - disc);

    // USG commission is fixed: usgCount * ৳300
    const usgComm = usgCount * usgFixedFee;

    // The remaining net bill after deducting USG test bills from net bill
    // As per user specification: "যে কয়টা আলতা ওর মোট বিল থেকে বাদ যাবে তারপর কমিশন হবে ২০-২৫ বা ৩০, ডিসকাউন্টের পরে কিন্তু হিসাবটা হবে"
    const remainingNetBill = Math.max(0, netBill - usgTotalBill);
    const generalComm = Math.round((remainingNetBill * generalRate) / 100);

    const totalCommission = usgComm + generalComm;

    return {
      usgCount,
      usgFixedFee,
      usgComm,
      usgTotalBill,
      nonUsgTotalBill,
      remainingNetBill,
      generalRate,
      generalComm,
      total: totalCommission,
    };
  };

  const autoBreakdown = calculateCommissionBreakdown(selectedTests, discount, selectedDoctorObj, doctorHonorariumRate);

  // Keep approved commission in sync with auto-calculation unless manually overridden
  useEffect(() => {
    if (!isManualOverride) {
      setDoctorApprovedCommission(String(autoBreakdown.total));
    }
  }, [subtotal, discount, doctorSelectMode, selectedDoctorObj, doctorHonorariumRate, isManualOverride]);

  const handleDoctorSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setDoctorSelectMode(val);
    setIsManualOverride(false);

    if (val === 'self') {
      setSelectedDoctorObj(null);
      setCustomDoctorName('');
      setDoctorApprovedCommission('0');
    } else if (val === 'custom') {
      setSelectedDoctorObj(null);
      setDoctorHonorariumType('percentage');
      setDoctorHonorariumRate('25');
    } else {
      const doc = doctorsList.find((d) => String(d.id) === val);
      if (doc) {
        setSelectedDoctorObj(doc);
        setCustomDoctorName(doc.name);
        setDoctorHonorariumType('percentage');
        setDoctorHonorariumRate(doc.generalTestCommissionRate || '25');
      }
    }
  };

  const handleAddTest = (test: DiagnosticTest) => {
    if (!selectedTests.some((t) => t.id === test.id)) {
      const updated = [...selectedTests, test];
      setSelectedTests(updated);
      const newSub = updated.reduce((s, it) => s + parseFloat(it.price || '0'), 0);
      const net = Math.max(0, newSub - discount);
      setPaidAmount(String(net));
    }
  };

  const handleRemoveTest = (id: number) => {
    const updated = selectedTests.filter((t) => t.id !== id);
    setSelectedTests(updated);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selectedPatient) {
      setFormError('অনুগ্রহ করে প্রথমে একজন রোগী নির্বাচন অথবা নিবন্ধন করুন।');
      return;
    }
    if (selectedTests.length === 0) {
      setFormError('অনুগ্রহ করে কমপক্ষে একটি ডায়াগনস্টিক টেস্ট নির্বাচন করুন।');
      return;
    }

    let finalDoctorName = 'Self / General';
    if (doctorSelectMode === 'custom') {
      finalDoctorName = customDoctorName.trim() || 'External Consultant';
    } else if (selectedDoctorObj) {
      finalDoctorName = selectedDoctorObj.name;
    } else if (selectedPatient.referringDoctor) {
      finalDoctorName = selectedPatient.referringDoctor;
    }

    setIsSubmittingInvoice(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          patientId: selectedPatient.patientId,
          patientName: selectedPatient.name,
          patientPhone: selectedPatient.phone,
          patientGender: selectedPatient.gender,
          patientAge: selectedPatient.age,
          referringDoctor: finalDoctorName,
          doctorId: selectedDoctorObj ? selectedDoctorObj.id : null,
          commissionType: 'percentage',
          commissionRate: doctorHonorariumRate,
          commissionAmount: doctorApprovedCommission,
          commissionNotes: `USG: ${autoBreakdown.usgCount}x৳${autoBreakdown.usgFixedFee} + General: ৳${autoBreakdown.generalComm}`,
          selectedTests,
          discountType,
          discountValue,
          paidAmount: String(paid),
          paymentMethod,
          notes,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // Automated invoice delivery via WhatsApp and SMS upon billing confirmation
        if (autoSendInvoiceAlerts && data?.invoice) {
          try {
            const smsContent = `সোনালী ডায়াগনস্টিক সেন্টার: শ্রদ্ধাভাজন ${selectedPatient.name}, আপনার বিল #${data.invoiceNumber} কনফার্ম হয়েছে। মোট: ৳${data.invoice.total}, পরিশোধ: ৳${data.invoice.paidAmount}, বকেয়া: ৳${data.invoice.dueAmount}। টেস্ট: ${selectedTests.map((t) => t.code).join(', ')}। হেল্পলাইন: 01711-000000`;
            notificationService.sendManualAlert(
              selectedPatient.phone || '',
              smsContent,
              'SMS',
              data.invoiceNumber
            );
            notificationService.triggerBillingNotification(
              data.invoice,
              selectedTests.map((t) => t.code).join(', ')
            );
          } catch (notifErr) {
            console.warn('Simulated notification dispatch notice:', notifErr);
          }
        }

        // Trigger simulated alert that lab investigation order is received
        for (const t of selectedTests) {
          notificationService.triggerReportNotification(
            {
              reportNumber: `REP-${data.invoiceNumber.replace('INV-', '')}-${t.code}`,
              patientName: selectedPatient.name,
              testName: t.name,
              patientPhone: selectedPatient.phone,
              status: 'Sample Pending / In Processing',
              abnormalFlag: false,
            },
            'Lab Report Generated'
          );
        }

        // Clear saved billing draft
        clearBillingDraft();

        // Fetch fresh invoice details with items and open print dialog
        const invRes = await fetch(`/api/invoices/${data.invoiceNumber}`, {
          headers: { Authorization: `Bearer ${token || ''}` },
        });
        if (invRes.ok) {
          const fullInv = await invRes.json();
          onPrintInvoice(fullInv.invoice, fullInv.items, fullInv.payments);
        }

        // Reset Form
        setSelectedTests([]);
        setDiscountValue('0');
        setPaidAmount('0');
        setNotes('');
        setDoctorCommissionNotes('');
        setIsManualOverride(false);
        fetchInvoices();
      } else {
        const errData = await res.json().catch(() => ({}));
        setFormError(errData.error || 'ইনভয়েস তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      }
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      setFormError(err.message || 'সার্ভার যোগাযোগে সমস্যা হয়েছে।');
    } finally {
      setIsSubmittingInvoice(false);
    }
  };

  const handleSettleDue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleInvoice || !duePayAmount || parseFloat(duePayAmount) <= 0) return;

    try {
      const res = await fetch(`/api/invoices/${settleInvoice.invoiceNumber}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          amount: duePayAmount,
          paymentMethod: duePayMethod,
          notes: 'Counter settlement of outstanding dues',
        }),
      });

      if (res.ok) {
        setSettleInvoice(null);
        setDuePayAmount('');
        fetchInvoices();
      }
    } catch (err) {
      console.error('Error settling due:', err);
    }
  };

  // Open Edit Invoice modal
  const handleOpenEditInvoice = async (inv: Invoice) => {
    try {
      const res = await fetch(`/api/invoices/${inv.invoiceNumber}`, {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEditingInvoice(data.invoice);
        // Map items back to test objects
        const fullTests: DiagnosticTest[] = data.items.map((it: InvoiceItem) => {
          const found = testsList.find((t) => t.id === it.testId);
          return (
            found || {
              id: it.testId,
              code: it.testCode,
              name: it.testName,
              category: it.category,
              department: it.category,
              price: it.price,
              sampleType: 'Serum',
              tatHours: 6,
              parametersSchema: [],
              active: true,
            }
          );
        });
        setEditInvoiceTests(fullTests);
        setEditDiscountType(data.invoice.discountType || 'fixed');
        setEditDiscountValue(data.invoice.discountValue || '0');
        setEditPaidAmount(data.invoice.paidAmount || '0');
        setEditPaymentMethod(data.invoice.paymentMethod || 'Cash');
        setEditCommissionAmount(data.invoice.commissionAmount || '0');
        setEditNotes(data.invoice.notes || '');
      }
    } catch (err) {
      console.error('Error loading invoice for edit:', err);
    }
  };

  // Save edited invoice (adjust tests, discount, paid amount if patient is unable to pay)
  const handleSaveEditInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    try {
      const res = await fetch(`/api/invoices/${editingInvoice.invoiceNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          selectedTests: editInvoiceTests,
          discountType: editDiscountType,
          discountValue: editDiscountValue,
          paidAmount: editPaidAmount,
          paymentMethod: editPaymentMethod,
          commissionAmount: editCommissionAmount,
          notes: editNotes || 'Invoice adjusted due to patient concession/modification',
        }),
      });

      if (res.ok) {
        setEditingInvoice(null);
        fetchInvoices();
      }
    } catch (err) {
      console.error('Error updating invoice:', err);
    }
  };

  const handleViewInvoicePrint = async (inv: Invoice) => {
    try {
      const res = await fetch(`/api/invoices/${inv.invoiceNumber}`, {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (res.ok) {
        const full = await res.json();
        onPrintInvoice(full.invoice, full.items, full.payments);
      }
    } catch (err) {
      console.error('Error loading invoice for print:', err);
    }
  };

  // Calculations for Edit Invoice Modal
  const editSubtotal = editInvoiceTests.reduce((sum, t) => sum + parseFloat(t.price || '0'), 0);
  let editDiscount = 0;
  if (editDiscountType === 'percentage') {
    editDiscount = (editSubtotal * (parseFloat(editDiscountValue) || 0)) / 100;
  } else {
    editDiscount = parseFloat(editDiscountValue) || 0;
  }
  if (editDiscount > editSubtotal) editDiscount = editSubtotal;
  const editTotal = Math.max(0, editSubtotal - editDiscount);
  const editPaid = parseFloat(editPaidAmount) || 0;
  const editDue = Math.max(0, editTotal - editPaid);

  return (
    <div className="space-y-6">
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t.billing.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'bn' ? 'দ্রুত ও নির্ভুল ইনভয়েসিং কাউন্টার • ফাস্ট ডায়াগনস্টিক ক্যাশিয়ার ডেস্ক' : 'Fast Diagnostic Cashier & Invoice Desk'}
          </p>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <button
            onClick={() => setActiveBillingView('pos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeBillingView === 'pos'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'বিলিং কাউন্টার' : 'Billing Counter'}</span>
          </button>
          <button
            onClick={() => setActiveBillingView('notifications')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeBillingView === 'notifications'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BellRing className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'bn' ? 'পেশেন্ট নোটিফিকেশন (SMS/Email)' : 'Mock Alerts (SMS/Email)'}</span>
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          </button>
        </div>
      </div>

      {activeBillingView === 'notifications' ? (
        <PatientNotificationCenter
          invoices={invoicesList}
          patients={patientsList}
          tests={testsList}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: INVOICE GENERATOR (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {t.billing.newInvoice}
                  </h3>
                  <span className="text-[11px] text-slate-400">Cashier Counter 1 • SDC Smart POS</span>
                </div>
              </div>

              {selectedTests.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowBillingExitModal(true)}
                  className="text-[11px] text-rose-500 hover:underline font-semibold"
                >
                  কার্ট রিসেট
                </button>
              )}
            </div>

          <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
            {draftSavedToast && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <Save className="w-4 h-4 text-amber-600 shrink-0" />
                <span>বিলিং তথ্য সফলভাবে লোকাল মেমরিতে ড্রাফট হিসেবে সংরক্ষিত হয়েছে।</span>
              </div>
            )}

            {hasBillingDraft && !selectedPatient && selectedTests.length === 0 && (
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-between text-xs">
                <div className="text-teal-800 dark:text-teal-200 font-semibold">
                  পূর্বে সংরক্ষিত একটি অসম্পূর্ণ বিল ড্রাফট পাওয়া গেছে।
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadBillingDraft}
                    className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px]"
                  >
                    ড্রাফট লোড করুন
                  </button>
                  <button
                    type="button"
                    onClick={clearBillingDraft}
                    className="px-2 py-1 text-slate-500 hover:text-rose-600 text-[11px]"
                  >
                    মুছুন
                  </button>
                </div>
              </div>
            )}

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            {/* 1. Patient Selection */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.billing.selectPatient} *
              </label>
              {selectedPatient ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/40">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {selectedPatient.name} ({selectedPatient.gender}, {selectedPatient.age} Y)
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      ID: {selectedPatient.patientId} • Phone: {selectedPatient.phone}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPatient(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      placeholder="রোগীর নাম, ফোন নম্বর বা আইডি লিখে বাছাই করুন..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  {patientSearch && (
                    <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                      {patientsList
                        .filter(
                          (p) =>
                            p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                            (p.phone || '').includes(patientSearch) ||
                            p.patientId.toLowerCase().includes(patientSearch.toLowerCase())
                        )
                        .slice(0, 5)
                        .map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedPatient(p);
                              if (p.referringDoctor && p.referringDoctor !== 'Self / General') {
                                setDoctorSelectMode('custom');
                                setCustomDoctorName(p.referringDoctor);
                              }
                              setPatientSearch('');
                            }}
                            className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer flex justify-between items-center"
                          >
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">{p.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{p.phone} • {p.patientId}</div>
                            </div>
                            <span className="text-[10px] text-teal-600 font-bold">Select</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Diagnostic Tests Picker with Instant Auto-Complete Search */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  ডায়াগনস্টিক টেস্ট নির্বাচন ({selectedTests.length}টি যুক্ত) *
                </label>
                <span className="text-[10px] text-slate-400">নাম বা কোড দিয়ে তাৎক্ষণিক সার্চ করুন</span>
              </div>

              {/* Instant Auto-Complete Search Bar */}
              <div className="relative mb-2">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={testSearchQuery}
                  onChange={(e) => setTestSearchQuery(e.target.value)}
                  placeholder="টেস্ট সার্চ করুন (e.g. CBC, Lipid, USG, Widal, Glucose)..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-teal-500/40 bg-teal-50/20 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500"
                />
                {testSearchQuery && (
                  <div className="absolute left-0 right-0 top-11 z-30 max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-teal-500/40 bg-white dark:bg-slate-900 shadow-2xl">
                    {testsList
                      .filter(
                        (t) =>
                          t.name.toLowerCase().includes(testSearchQuery.toLowerCase()) ||
                          t.code.toLowerCase().includes(testSearchQuery.toLowerCase()) ||
                          t.category.toLowerCase().includes(testSearchQuery.toLowerCase())
                      )
                      .slice(0, 8)
                      .map((t) => {
                        const isSelected = selectedTests.some((st) => st.id === t.id);
                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              if (!isSelected) handleAddTest(t);
                              setTestSearchQuery('');
                            }}
                            className="p-2.5 hover:bg-teal-50 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-teal-600">{t.code}</span>
                              <span className="font-semibold text-slate-900 dark:text-white">{t.name}</span>
                              <span className="text-[10px] text-slate-400">({t.category})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 dark:text-teal-400">৳{t.price}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isSelected ? 'bg-slate-200 text-slate-600' : 'bg-teal-600 text-white'}`}>
                                {isSelected ? 'যুক্ত আছে' : '+ যোগ করুন'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Quick Pick Pills */}
              <div className="flex flex-wrap gap-1.5 mb-2 max-h-28 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                {testsList.map((test) => {
                  const isSelected = selectedTests.some((t) => t.id === test.id);
                  const isUsg = isUsgTest(test);
                  return (
                    <button
                      type="button"
                      key={test.id}
                      onClick={() => (isSelected ? handleRemoveTest(test.id) : handleAddTest(test))}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-xs'
                          : isUsg
                          ? 'bg-blue-50 text-blue-800 border border-blue-300 dark:bg-blue-950/40 dark:text-blue-300'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-400'
                      }`}
                    >
                      {isUsg && <span className="text-[9px] font-bold bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200 px-1 rounded">USG</span>}
                      <span>{test.code}</span>
                      <span className="opacity-80">৳{test.price}</span>
                      {isSelected ? '✕' : '+'}
                    </button>
                  );
                })}
              </div>

              {/* Selected Tests Table */}
              {selectedTests.length > 0 && (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {selectedTests.map((t, idx) => (
                    <div key={t.id} className="p-2.5 flex items-center justify-between bg-white dark:bg-slate-800/60">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono text-[11px]">{idx + 1}.</span>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{t.name}</span>
                            {isUsgTest(t) && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200">
                                আল্ট্রা (ডাক্তার ফিক্সড ৳৩০০)
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">{t.category} • Specimen: {t.sampleType}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900 dark:text-teal-400">
                          ৳{t.price}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTest(t.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. DOCTOR REFERRAL HONORARIUM & COMMISSION SECTION (COLLAPSIBLE AS REQUESTED) */}
            <div className="rounded-2xl border border-amber-300 dark:border-amber-900/60 overflow-hidden bg-amber-50/50 dark:bg-amber-950/20">
              <button
                type="button"
                onClick={() => setIsHonorariumOpen(!isHonorariumOpen)}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition"
              >
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold">
                  <Wallet className="w-4 h-4 text-amber-600" />
                  <span>{language === 'bn' ? 'ডাক্তার অনারিয়াম হিসাব (ক্লিক করে খুলুন/বন্ধ করুন)' : 'Doctor Honorarium Calculation (Collapsible)'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                    {doctorSelectMode === 'self' ? 'Self / কমিশন নেই' : `৳${doctorApprovedCommission}`}
                  </span>
                  {isHonorariumOpen ? (
                    <ChevronUp className="w-4 h-4 text-amber-700" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-amber-700" />
                  )}
                </div>
              </button>

              {isHonorariumOpen && (
                <div className="p-4 pt-1 border-t border-amber-200/60 dark:border-amber-900/40 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Doctor Selection */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        রেফারকারী / চেম্বার ডাক্তার
                      </label>
                      <select
                        value={doctorSelectMode}
                        onChange={handleDoctorSelectChange}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      >
                        <option value="self">নিজে এসেছেন (Self - কমিশন নেই)</option>
                        <optgroup label="সোনালী ডায়াগনস্টিক চেম্বার ও কনসালটেন্ট ডাক্তার">
                          {doctorsList.map((doc) => (
                            <option key={doc.id} value={String(doc.id)}>
                              {doc.name} ({doc.specialty}) • USG ৳{doc.usgFixedCommission || 300} + {doc.generalTestCommissionRate || 25}%
                            </option>
                          ))}
                        </optgroup>
                        <option value="custom">অন্যান্য / নতুন ডাক্তার লিখুন</option>
                      </select>

                      {doctorSelectMode === 'custom' && (
                        <input
                          type="text"
                          value={customDoctorName}
                          onChange={(e) => setCustomDoctorName(e.target.value)}
                          placeholder="ডাক্তারের নাম লিখুন..."
                          className="w-full mt-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      )}
                    </div>

                    {/* Calculation Mode & Rate */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        সাধারণ টেস্ট কমিশন হার (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        disabled={doctorSelectMode === 'self'}
                        value={doctorHonorariumRate}
                        onChange={(e) => {
                          setDoctorHonorariumRate(e.target.value);
                          setIsManualOverride(false);
                        }}
                        placeholder="25"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        আল্ট্রা বাদে বাকি টেস্টের নিট বিলের উপর
                      </span>
                    </div>

                    {/* Approved Override Amount */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-amber-900 dark:text-amber-300">
                          অনুমোদিত অনারিয়াম *
                        </label>
                        {isManualOverride && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                            সংশোধিত
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-2 font-bold text-slate-500">৳</span>
                        <input
                          type="number"
                          min={0}
                          disabled={doctorSelectMode === 'self'}
                          value={doctorApprovedCommission}
                          onChange={(e) => {
                            setDoctorApprovedCommission(e.target.value);
                            setIsManualOverride(true);
                          }}
                          className="w-full pl-7 pr-3 py-1.5 font-mono font-black text-sm text-amber-950 dark:text-amber-200 bg-white dark:bg-slate-800 border-2 border-amber-300 dark:border-amber-700 rounded-xl focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Formula Breakdown */}
                  {doctorSelectMode !== 'self' && (
                    <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-amber-200 dark:border-amber-900 text-[11px] font-sans space-y-1">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                        <span>হিসাব বিশ্লেষণ:</span>
                        <span className="font-mono font-bold text-teal-700 dark:text-teal-400">
                          অটো মোট অনারিয়াম: ৳{autoBreakdown.total}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 text-[10px]">
                        <div>
                          • আল্ট্রা (USG): <strong>{autoBreakdown.usgCount}টি</strong> x ৳{autoBreakdown.usgFixedFee} = <strong>৳{autoBreakdown.usgComm}</strong>
                        </div>
                        <div>
                          • সাধারণ টেস্ট (নিট ৳{autoBreakdown.remainingNetBill}): <strong>{autoBreakdown.generalRate}%</strong> = <strong>৳{autoBreakdown.generalComm}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Adjustment Pills */}
                  {doctorSelectMode !== 'self' && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-900/40 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <span className="text-slate-400">দ্রুত সেট:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setDoctorApprovedCommission('500');
                            setIsManualOverride(true);
                          }}
                          className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-300 hover:bg-amber-100 font-mono font-bold text-amber-900 dark:text-amber-200"
                        >
                          ৳৫০০
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDoctorApprovedCommission('600');
                            setIsManualOverride(true);
                          }}
                          className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-300 hover:bg-amber-100 font-mono font-bold text-amber-900 dark:text-amber-200"
                        >
                          ৳৬০০
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const curr = parseFloat(doctorApprovedCommission) || 0;
                            setDoctorApprovedCommission(String(curr + 50));
                            setIsManualOverride(true);
                          }}
                          className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 hover:bg-slate-100 font-mono font-bold text-slate-700 dark:text-slate-300"
                        >
                          +৳৫০
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const curr = parseFloat(doctorApprovedCommission) || 0;
                            setDoctorApprovedCommission(String(Math.max(0, curr - 50)));
                            setIsManualOverride(true);
                          }}
                          className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 hover:bg-slate-100 font-mono font-bold text-slate-700 dark:text-slate-300"
                        >
                          -৳৫০
                        </button>
                      </div>

                      {isManualOverride && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsManualOverride(false);
                            setDoctorApprovedCommission(String(autoBreakdown.total));
                          }}
                          className="text-[10px] text-teal-700 dark:text-teal-400 font-bold hover:underline flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>অটো হিসাবে রিসেট</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Discount, Payment Mode & Settlement */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Discount Type
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="fixed">Fixed (BDT)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Discount Value
                </label>
                <input
                  type="number"
                  min={0}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.billing.paidAmount} *
                </label>
                <input
                  type="number"
                  min={0}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.billing.paymentMethod}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Cash">{t.billing.cash}</option>
                  <option value="bKash">{t.billing.bkash}</option>
                  <option value="Nagad">{t.billing.nagad}</option>
                  <option value="Rocket">{t.billing.rocket}</option>
                  <option value="Card">{t.billing.card}</option>
                </select>
              </div>
            </div>

            {/* Calculations Summary Box with Precise Net-Payable Rounding */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span>BDT {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Discount:</span>
                <span className="text-emerald-600">- BDT {discount.toFixed(2)}</span>
              </div>
              {Math.abs(Math.round(total) - total) > 0.001 && (
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Rounding Adjustment:</span>
                  <span>{Math.round(total) - total > 0 ? '+' : ''}BDT {(Math.round(total) - total).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-slate-700">
                <span>Net Payable (রাউন্ডেড):</span>
                <span className="text-teal-600 dark:text-teal-400">BDT {Math.round(total)}</span>
              </div>
              <div className="flex justify-between font-bold text-xs">
                <span>Due Balance:</span>
                <span className={due > 0 ? 'text-rose-600' : 'text-slate-600'}>BDT {due.toFixed(2)}</span>
              </div>
            </div>

            {/* Smart Notification & Automation Toggle Switch */}
            <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    WhatsApp ও SMS বিল অটো-ডেলিভারি (Auto Delivery)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    বিল কনফার্মেশনের সাথে সাথে রোগীর নম্বরে মেসেজ যাবে
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSendInvoiceAlerts}
                  onChange={(e) => setAutoSendInvoiceAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            {/* Draft Actions & Submit */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                type="button"
                onClick={saveBillingDraft}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold text-xs transition flex items-center justify-center gap-1.5"
                title="Save current billing form state as local draft"
              >
                <Save className="w-4 h-4 text-amber-600" />
                <span>ড্রাফট সংরক্ষণ (Save Draft)</span>
              </button>

              <button
                type="submit"
                disabled={isSubmittingInvoice}
                className="w-full flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                {isSubmittingInvoice ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{isSubmittingInvoice ? 'ইনভয়েস তৈরি হচ্ছে...' : 'বিল নিশ্চিত ও হাফ-সাইজ মেমো প্রিন্ট (কাস্টমার + ল্যাব)'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT: RECENT INVOICES & EDIT / DUE SETTLEMENTS (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Recent Diagnostic Invoices
              </h3>
              <span className="text-[11px] text-slate-400">{invoicesList.length} total billed records</span>
            </div>
            <button
              onClick={fetchInvoices}
              className="text-[11px] font-semibold text-teal-600 hover:underline"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-2.5 max-h-[650px] overflow-y-auto pr-1">
            {invoicesList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">No invoices created yet.</div>
            ) : (
              invoicesList.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-600 bg-white dark:bg-slate-800/50 transition text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#0f2744] dark:text-teal-400">
                      {inv.invoiceNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.paymentStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {inv.paymentStatus}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-900 dark:text-white font-semibold">
                    <span>{inv.patientName}</span>
                    <span className="font-mono">৳{inv.total}</span>
                  </div>

                  {/* Doctor & Commission meta */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-[180px]">
                      ডাক্তার: {inv.referringDoctor || 'Self'}
                    </span>
                    {parseFloat(inv.commissionAmount || '0') > 0 && (
                      <span className="font-mono text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                        অনারিয়াম: ৳{inv.commissionAmount}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Paid: ৳{inv.paidAmount}</span>
                    <span className={parseFloat(inv.dueAmount) > 0 ? 'text-rose-600 font-bold' : ''}>
                      Due: ৳{inv.dueAmount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400">
                      {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'Today'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {/* EDIT INVOICE BUTTON (USER REQUEST) */}
                      <button
                        onClick={() => handleOpenEditInvoice(inv)}
                        className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-[10px] flex items-center gap-1"
                        title="বিল ও টেস্ট সংশোধন করুন (যদি রোগীর টাকা কম থাকে)"
                      >
                        <Edit3 className="w-3 h-3 text-slate-500" />
                        <span>এডিট</span>
                      </button>

                      {parseFloat(inv.dueAmount) > 0 && (
                        <button
                          onClick={() => {
                            setSettleInvoice(inv);
                            setDuePayAmount(inv.dueAmount);
                          }}
                          className="px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-[10px] hover:bg-rose-100"
                        >
                          Settle Due
                        </button>
                      )}
                      {/* SIMULATE PATIENT SMS/EMAIL NOTIFICATION BUTTON */}
                      <button
                        onClick={() => {
                          notificationService.triggerReportNotification(
                            {
                              reportNumber: `REP-${inv.invoiceNumber.replace('INV-', '')}-1`,
                              patientName: inv.patientName,
                              testName: 'Diagnostic Investigation Panel',
                              patientPhone: inv.patientPhone,
                              status: 'Generated & Ready for Collection',
                              abnormalFlag: false,
                            },
                            'Lab Report Generated'
                          );
                          setActiveBillingView('notifications');
                        }}
                        className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 transition"
                        title="Simulate SMS/Email alert to patient"
                      >
                        <BellRing className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      </button>

                      <button
                        onClick={() => handleViewInvoicePrint(inv)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                        title="Print Invoice / Thermal Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      )}

      {/* EDIT INVOICE MODAL (USER REQUEST: যদি টাকা না থাকে বা টেস্ট পরিবর্তন করতে হয়) */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border-2 border-teal-500 my-8 text-xs space-y-4">
            <button
              onClick={() => setEditingInvoice(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  ইনভয়েস ও টেস্ট সংশোধন করুন (Edit Invoice)
                </h3>
                <p className="text-[11px] text-slate-500">
                  ইনভয়েস #{editingInvoice.invoiceNumber} • রোগী: {editingInvoice.patientName} (টাকা কম থাকলে ডিসকাউন্ট বৃদ্ধি বা টেস্ট রিমুভ করুন)
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEditInvoice} className="space-y-4">
              {/* Test Items Table inside Edit Modal */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  নির্বাচিত টেস্টসমূহ ({editInvoiceTests.length})
                </label>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto">
                  {editInvoiceTests.map((t, idx) => (
                    <div key={idx} className="p-2 flex items-center justify-between bg-white dark:bg-slate-800">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{t.code}</span> — {t.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">৳{t.price}</span>
                        <button
                          type="button"
                          onClick={() => setEditInvoiceTests(editInvoiceTests.filter((_, i) => i !== idx))}
                          className="text-rose-500 font-bold p-1 hover:bg-rose-50 rounded"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Add test to existing bill */}
                <select
                  onChange={(e) => {
                    const found = testsList.find((t) => t.code === e.target.value);
                    if (found && !editInvoiceTests.some((t) => t.id === found.id)) {
                      setEditInvoiceTests([...editInvoiceTests, found]);
                    }
                  }}
                  className="w-full mt-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="">+ আরো টেস্ট যোগ করুন</option>
                  {testsList.map((t) => (
                    <option key={t.id} value={t.code}>
                      {t.code} — {t.name} (৳{t.price})
                    </option>
                  ))}
                </select>
              </div>

              {/* Financial Adjustments */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ডিসকাউন্ট টাইপ
                  </label>
                  <select
                    value={editDiscountType}
                    onChange={(e) => setEditDiscountType(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded-lg border bg-white dark:bg-slate-800"
                  >
                    <option value="fixed">Fixed (৳)</option>
                    <option value="percentage">%</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ডিসকাউন্ট টাকা/হার
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editDiscountValue}
                    onChange={(e) => setEditDiscountValue(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border bg-white dark:bg-slate-800 font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    পরিশোধিত টাকা (Paid) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editPaidAmount}
                    onChange={(e) => setEditPaidAmount(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border bg-white dark:bg-slate-800 font-bold text-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    পেমেন্ট মোড
                  </label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border bg-white dark:bg-slate-800"
                  >
                    <option value="Cash">Cash</option>
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              </div>

              {/* Calculations summary in edit */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs flex justify-between">
                <span>Subtotal: <strong>৳{editSubtotal.toFixed(2)}</strong></span>
                <span className="text-emerald-600">Discount: -৳{editDiscount.toFixed(2)}</span>
                <span className="font-bold text-teal-700 dark:text-teal-400">Net: ৳{editTotal.toFixed(2)}</span>
                <span className={editDue > 0 ? 'text-rose-600 font-bold' : ''}>Due: ৳{editDue.toFixed(2)}</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  সংশোধনের কারণ ও মন্তব্য (Notes)
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. রোগীর অনুরোধে টেস্ট কমিয়ে ডিসকাউন্ট সমন্বয় করা হয়েছে"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  ইনভয়েস আপডেট ও সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Due Modal */}
      {settleInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setSettleInvoice(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
              Collect Outstanding Due
            </h3>
            <p className="text-slate-500 mb-4">
              Invoice #{settleInvoice.invoiceNumber} for {settleInvoice.patientName}
            </p>

            <form onSubmit={handleSettleDue} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount (Max: ৳{settleInvoice.dueAmount}) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={settleInvoice.dueAmount}
                  required
                  value={duePayAmount}
                  onChange={(e) => setDuePayAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Mode
                </label>
                <select
                  value={duePayMethod}
                  onChange={(e) => setDuePayMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                  <option value="Card">Bank Card</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettleInvoice(null)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Confirm Due Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Billing Exit / Discard Confirmation Modal */}
      {showBillingExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  অসম্পূর্ণ বিলিং তথ্য বাতিল নিশ্চিতকরণ
                </h3>
                <p className="text-[11px] text-slate-500">
                  Exit Protection & Draft Safeguard
                </p>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
              বর্তমান বিলে রোগী অথবা টেস্ট নির্বাচন করা রয়েছে। আপনি কি ডেটা ড্রাফট হিসেবে সংরক্ষণ করতে চান, নাকি সম্পূর্ণ কার্ট ক্লিয়ার করে নতুন বিল শুরু করবেন?
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBillingExitModal(false)}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
              >
                ফিরে যান
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTests([]);
                  setSelectedPatient(null);
                  setNotes('');
                  setDiscountValue('0');
                  setPaidAmount('0');
                  setDoctorSelectMode('self');
                  setCustomDoctorName('');
                  setDoctorApprovedCommission('0');
                  setDoctorCommissionNotes('');
                  setFormError(null);
                  setShowBillingExitModal(false);
                }}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold"
              >
                সব মুছুন (Discard)
              </button>
              <button
                type="button"
                onClick={() => {
                  saveBillingDraft();
                  setSelectedTests([]);
                  setSelectedPatient(null);
                  setNotes('');
                  setDiscountValue('0');
                  setPaidAmount('0');
                  setDoctorSelectMode('self');
                  setCustomDoctorName('');
                  setDoctorApprovedCommission('0');
                  setDoctorCommissionNotes('');
                  setShowBillingExitModal(false);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                ড্রাফট সেভ ও রিসেট
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
