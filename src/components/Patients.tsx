import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  Calendar,
  MapPin,
  Stethoscope,
  FileText,
  AlertTriangle,
  History,
  X,
  Printer,
  ChevronRight,
  Shield,
  Clock,
  CheckCircle2,
  Receipt,
  CreditCard,
  Edit3,
  MessageSquare,
  Share2,
  Copy,
  ExternalLink,
  Send,
} from 'lucide-react';
import { Patient, Invoice, LabReport, Doctor, MarketingRep } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { PatientRegistrationModal } from './PatientRegistrationModal.tsx';
import {
  getNextAvailableDoctorDate,
  formatBengaliDateWithDay,
  normalizeBdMobileRemainder,
  toAsciiDigits,
} from '../utils/clinicalSchedule.ts';

interface PatientsProps {
  onStartBillingWithPatient?: (patient: Patient) => void;
  onViewReport?: (report: LabReport) => void;
  onViewInvoice?: (invoice: Invoice) => void;
  onNavigateDoctors?: () => void;
}

export const Patients: React.FC<PatientsProps> = ({
  onStartBillingWithPatient,
  onViewReport,
  onViewInvoice,
  onNavigateDoctors,
}) => {
  const { language, t } = useLanguage();
  const { token } = useAuth();
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [marketingRepsList, setMarketingRepsList] = useState<MarketingRep[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [historyInvoices, setHistoryInvoices] = useState<Invoice[]>([]);
  const [historyReports, setHistoryReports] = useState<LabReport[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Edit Patient State (keeps nullable clinical fields in memory so edits preserve old DB records)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    age: '',
    dob: '',
    gender: 'Female' as 'Female' | 'Male' | 'Other',
    phone: '',
    isNoMobileWorkaround: false,
    weightKg: '',
    sizeOrHeight: '',
    systolicBp: '',
    diastolicBp: '',
    bloodPressure: '',
    address: '',
    bloodGroup: '',
    referringDoctor: '',
    notes: '',
  });

  // Quick Book Doctor Appointment Modal for existing patient
  const [quickBookPatient, setQuickBookPatient] = useState<Patient | null>(null);
  const [quickDoctorId, setQuickDoctorId] = useState<number | ''>('');
  const [quickDate, setQuickDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickFeePaid, setQuickFeePaid] = useState(true);
  const [quickFeeOption, setQuickFeeOption] = useState<'standard' | 'waived' | 'custom'>('standard');
  const [quickCustomFee, setQuickCustomFee] = useState('');
  const [quickWaiverReason, setQuickWaiverReason] = useState('');
  const [quickMarketingSource, setQuickMarketingSource] = useState('Direct Walk-in');
  const [quickMarketingRepId, setQuickMarketingRepId] = useState('');

  const [createdNotice, setCreatedNotice] = useState<{
    patientId: string;
    patientName: string;
    patientPhone: string;
    serialNumber?: number;
    doctorName?: string;
    fee?: string;
    smsText?: string;
  } | null>(null);

  const [smsCopied, setSmsCopied] = useState(false);

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
    fetchMarketingReps();
  }, [searchQuery, token]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const url = searchQuery ? `/api/patients?q=${encodeURIComponent(searchQuery)}` : '/api/patients';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (res.ok) {
        const json = await res.json();
        setPatientsList(json);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors');
      if (res.ok) {
        const json = await res.json();
        setDoctorsList(json);
        if (json.length > 0) {
          const firstDoc = json[0];
          const autoDate = getNextAvailableDoctorDate(firstDoc.chamberDays);
          setQuickDoctorId(firstDoc.id);
          setQuickDate(autoDate);
        }
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }
  };

  const fetchMarketingReps = async () => {
    try {
      const res = await fetch('/api/marketing', {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (res.ok) {
        const json = await res.json();
        setMarketingRepsList(json);
      }
    } catch (err) {
      console.error('Error fetching marketing reps:', err);
    }
  };

  const handleQuickBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBookPatient || !quickDoctorId) return;

    const doc = doctorsList.find((d) => d.id === Number(quickDoctorId));
    if (!doc) return;

    const rep = marketingRepsList.find((m) => String(m.id) === String(quickMarketingRepId));

    let finalFee = doc.fee || '800';
    let isWaived = false;
    let waiverNote = '';
    if (quickFeeOption === 'waived') {
      finalFee = '0';
      isWaived = true;
      waiverNote = quickWaiverReason || '১০০% ফ্রি ভিজিট / মওকুফ';
    } else if (quickFeeOption === 'custom') {
      finalFee = quickCustomFee || doc.fee || '800';
      waiverNote = quickWaiverReason || 'বিশেষ ছাড় / কনসেশন';
    }

    try {
      const isProxy = Boolean(quickBookPatient.isProxyPhone || quickBookPatient.phone === '01700000000');
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          doctorId: doc.id,
          doctorName: doc.name,
          doctorSpecialty: doc.specialty,
          patientId: quickBookPatient.patientId,
          patientName: quickBookPatient.name,
          patientPhone: quickBookPatient.phone,
          patientAge: quickBookPatient.age,
          patientGender: quickBookPatient.gender,
          appointmentDate: quickDate,
          fee: finalFee,
          originalFee: doc.fee,
          feePaid: quickFeePaid,
          feeWaived: isWaived,
          waiverReason: waiverNote,
          isProxyPhone: isProxy,
          marketingSource: quickMarketingSource,
          marketingRepId: rep ? rep.id : null,
          marketingRepName: rep ? rep.name : null,
          notes: isWaived ? `ভিজিট ফি মওকুফ: ${waiverNote}` : 'Direct serial issued from patient directory',
        }),
      });

      if (res.ok) {
        const appData = await res.json();
        let smsContent: string | undefined;
        if (!isProxy) {
          smsContent = `সোনালী ডায়াগনস্টিক সেন্টার: সম্মানিত ${quickBookPatient.name}, ${doc.name}-এর সাথে আপনার সিরিয়াল #${appData.serialNumber} নিশ্চিত হয়েছে। তারিখ: ${formatBengaliDateWithDay(quickDate)}। রুম: ${doc.roomNo || 'Room 101'}। ফি: ৳${finalFee}। হেল্পলাইন: 01711-000000`;
        }

        setCreatedNotice({
          patientId: quickBookPatient.patientId,
          patientName: quickBookPatient.name,
          patientPhone: quickBookPatient.phone || '',
          serialNumber: appData.serialNumber,
          doctorName: doc.name,
          fee: finalFee,
          smsText: smsContent,
        });
        setQuickBookPatient(null);
        setQuickFeeOption('standard');
        setQuickCustomFee('');
        setQuickWaiverReason('');
      }
    } catch (err) {
      console.error('Error quick booking:', err);
    }
  };

  const handleOpenEditPatient = (pt: Patient) => {
    setEditingPatient(pt);
    const isProxy = Boolean(pt.phone === '01700000000' || pt.isProxyPhone);

    setEditFormData({
      name: pt.name,
      age: String(pt.age),
      dob: pt.dob || '',
      gender: pt.gender,
      phone: pt.phone || '',
      isNoMobileWorkaround: isProxy,
      weightKg: pt.weightKg || '',
      sizeOrHeight: pt.sizeOrHeight || '',
      systolicBp: pt.systolicBp || '',
      diastolicBp: pt.diastolicBp || '',
      bloodPressure: pt.bloodPressure || '',
      address: pt.address || '',
      bloodGroup: pt.bloodGroup || '',
      referringDoctor: pt.referringDoctor || '',
      notes: pt.notes || '',
    });
  };

  const handleSaveEditPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient || !editFormData.name || !editFormData.age) return;

    try {
      const effectivePhone = editFormData.isNoMobileWorkaround ? '01700000000' : editFormData.phone.trim();

      const res = await fetch(`/api/patients/${editingPatient.patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          ...editFormData,
          phone: effectivePhone,
          isProxyPhone: editFormData.isNoMobileWorkaround,
        }),
      });

      if (res.ok) {
        setEditingPatient(null);
        fetchPatients();
      }
    } catch (err) {
      console.error('Error updating patient:', err);
    }
  };

  const handleOpenPatientHistory = async (patient: Patient) => {
    setSelectedPatient(patient);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/patients/${patient.patientId}/history`, {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (res.ok) {
        const json = await res.json();
        setHistoryInvoices(json.invoices || []);
        setHistoryReports(json.reports || []);
      }
    } catch (err) {
      console.error('Error fetching patient history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t.patient.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            একই স্ক্রিনে রোগী নিবন্ধন, তথ্য এডিট, তাৎক্ষণিক ডাক্তার অ্যাপয়েন্টমেন্ট ও এসএমএস নোটিফিকেশন
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>নতুন রোগী নিবন্ধন ও ডাক্তার সিরিয়াল</span>
        </button>
      </div>

      {/* Success Notification Slip Modal with SMS confirmation */}
      {createdNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border-2 border-teal-500 text-xs text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                নিবন্ধন ও সিরিয়াল সফল হয়েছে!
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                রোগীর ইউনিক আইডি: <strong className="text-teal-600 font-mono text-sm">{createdNotice.patientId}</strong>
              </p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {createdNotice.patientName} (মোবাইল: {createdNotice.patientPhone})
              </p>
            </div>

            {createdNotice.serialNumber && (
              <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                  ডাক্তার চেম্বার সিরিয়াল টোকেন
                </span>
                <div className="text-3xl font-black font-mono text-[#0f2744] dark:text-teal-400">
                  সিরিয়াল #{createdNotice.serialNumber}
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {createdNotice.doctorName}
                </div>
                <div className="text-[11px] text-slate-500">
                  ভিজিট ফি: ৳{createdNotice.fee} (পরিশোধিত)
                </div>
              </div>
            )}

            {/* SMS Notification Preview & Direct Actions */}
            {createdNotice.smsText && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-left space-y-2">
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-bold">
                  <div className="flex items-center gap-1.5 text-xs text-teal-700 dark:text-teal-300">
                    <MessageSquare className="w-4 h-4" />
                    <span>রোগীকে এসএমএস পাঠানোর বার্তা (SMS Notification)</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    প্রস্তুত
                  </span>
                </div>
                <p className="text-[11px] font-sans text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 leading-relaxed">
                  {createdNotice.smsText}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {/* Direct Mobile SMS App */}
                  <a
                    href={`sms:${createdNotice.patientPhone}?body=${encodeURIComponent(createdNotice.smsText)}`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-xs text-center"
                    title="মোবাইল বা ট্যাবের মেসেজ অ্যাপ ওপেন করুন"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>মোবাইল SMS</span>
                  </a>

                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/88${createdNotice.patientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(createdNotice.smsText)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  {/* Copy */}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdNotice.smsText || '');
                      setSmsCopied(true);
                      setTimeout(() => setSmsCopied(false), 2500);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-bold text-[11px] text-slate-700 dark:text-slate-200 hover:bg-slate-100 col-span-2 sm:col-span-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{smsCopied ? 'কপি হয়েছে ✓' : 'টেক্সট কপি'}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>টোকেন স্লিপ প্রিন্ট</span>
              </button>

              <button
                type="button"
                onClick={() => setCreatedNotice(null)}
                className="flex-1 py-2.5 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition"
              >
                ঠিক আছে / সম্পন্ন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            language === 'bn'
              ? 'রোগীর নাম, মোবাইল নম্বর অথবা পেশেন্ট আইডি (SDC-P-...) দিয়ে খুঁজুন'
              : 'Search by patient name, mobile phone or Patient ID (SDC-P-...)'
          }
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Patients Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-bold">{t.patient.id}</th>
                <th className="py-3 px-4 font-bold">{t.patient.name}</th>
                <th className="py-3 px-4 font-bold">{t.patient.age} / {t.patient.gender}</th>
                <th className="py-3 px-4 font-bold">{t.patient.phone}</th>
                <th className="py-3 px-4 font-bold">{t.patient.bloodGroup}</th>
                <th className="py-3 px-4 font-bold">{t.patient.referringDoctor}</th>
                <th className="py-3 px-4 font-bold text-right">পদক্ষেপ (এডিট / সিরিয়াল / টেস্ট বিল / হিস্ট্রি)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    {t.common.loading}
                  </td>
                </tr>
              ) : patientsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    {t.common.noData}
                  </td>
                </tr>
              ) : (
                patientsList.map((pt) => (
                  <tr key={pt.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#0f2744] dark:text-teal-400">
                      {pt.patientId}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {pt.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {pt.age} Y / {pt.gender}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {pt.phone}
                    </td>
                    <td className="py-3 px-4">
                      {pt.bloodGroup ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          {pt.bloodGroup}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                      {pt.referringDoctor || 'Self / General'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 0. Edit Patient Info */}
                        <button
                          onClick={() => handleOpenEditPatient(pt)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-[11px] transition border border-slate-200 dark:border-slate-700"
                          title="রোগীর তথ্য এডিট করুন (Edit Patient Information)"
                        >
                          <Edit3 className="w-3 h-3 text-slate-600" />
                          <span>এডিট</span>
                        </button>

                        {/* 1. Quick Doctor Appointment */}
                        <button
                          onClick={() => setQuickBookPatient(pt)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-[11px] transition border border-blue-200 dark:border-blue-800"
                          title="ডাক্তার অ্যাপয়েন্টমেন্ট / সিরিয়াল দিন"
                        >
                          <Stethoscope className="w-3 h-3" />
                          <span>সিরিয়াল</span>
                        </button>

                        {/* 2. Diagnostic Test Billing */}
                        {onStartBillingWithPatient && (
                          <button
                            onClick={() => onStartBillingWithPatient(pt)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-bold text-[11px] transition border border-teal-200 dark:border-teal-800"
                            title="Generate diagnostic bill for prescribed tests"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>টেস্ট বিল</span>
                          </button>
                        )}

                        {/* 3. Medical History */}
                        <button
                          onClick={() => handleOpenPatientHistory(pt)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-[11px] transition"
                          title="View clinical history & past reports"
                        >
                          <History className="w-3 h-3 text-slate-500" />
                          <span>হিস্ট্রি</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT PATIENT INFORMATION MODAL */}
      {editingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 text-xs">
            <button
              onClick={() => setEditingPatient(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  রোগীর তথ্য সংশোধন করুন (Edit Patient Profile)
                </h3>
                <p className="text-[11px] text-slate-500">
                  আইডি: <strong className="font-mono text-teal-600">{editingPatient.patientId}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEditPatient} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  রোগীর পূর্ণ নাম *
                </label>
                <input
                  type="text"
                  lang="en"
                  autoCapitalize="words"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    বয়স (Age) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={editFormData.age}
                    onChange={(e) => setEditFormData({ ...editFormData, age: toAsciiDigits(e.target.value).replace(/\D/g, '').slice(0, 3) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    লিঙ্গ (Gender) *
                  </label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Female">মহিলা (Female - ডিফল্ট)</option>
                    <option value="Male">পুরুষ (Male)</option>
                    <option value="Other">অন্যান্য</option>
                  </select>
                </div>
              </div>

              {/* Mobile Phone (01 prefix + 9 digits) & No-Mobile Workaround + 🔒 খুলুন */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  মোবাইল নম্বর (Phone) * (বাধ্যতামূলক)
                </label>
                <div className="space-y-1.5">
                  <div className="flex items-stretch gap-2">
                    <div className="flex-1 flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
                      <span className="px-3 py-2 bg-slate-100 dark:bg-slate-700 border-r border-slate-200 dark:border-slate-600 font-mono font-bold text-xs text-slate-700 dark:text-slate-200">
                        01
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={9}
                        required={!editFormData.isNoMobileWorkaround}
                        disabled={editFormData.isNoMobileWorkaround}
                        value={
                          editFormData.isNoMobileWorkaround
                            ? '700000000'
                            : normalizeBdMobileRemainder(editFormData.phone)
                        }
                        onChange={(e) => {
                          const rem = normalizeBdMobileRemainder(e.target.value);
                          setEditFormData({ ...editFormData, phone: rem ? `01${rem}` : '' });
                        }}
                        placeholder="7XXXXXXXX"
                        className="flex-1 px-3 py-2 bg-transparent font-mono disabled:bg-slate-100 dark:disabled:bg-slate-800/80 disabled:text-slate-500 focus:outline-none"
                      />
                    </div>
                    {editFormData.isNoMobileWorkaround && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditFormData({
                            ...editFormData,
                            isNoMobileWorkaround: false,
                            phone: '',
                          })
                        }
                        className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 font-bold text-xs shrink-0 hover:bg-amber-100"
                      >
                        🔒 খুলুন
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      type="checkbox"
                      id="editNoMobileWorkaround"
                      checked={editFormData.isNoMobileWorkaround}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setEditFormData({
                          ...editFormData,
                          isNoMobileWorkaround: checked,
                          phone: checked ? '01700000000' : '',
                        });
                      }}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <label htmlFor="editNoMobileWorkaround" className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                      রোগীর নিজস্ব মোবাইল নম্বর নেই (ক্লিনিক প্রক্সি নম্বর ০১৭০০-০০০০০০ ব্যবহার করুন, কোনো SMS যাবে না)
                    </label>
                  </div>
                </div>
              </div>

              {/* Weight, Size/Height & Blood Pressure fields intentionally omitted from UI while preserving DB columns */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    রক্তের গ্রুপ (Blood Group)
                  </label>
                  <select
                    value={editFormData.bloodGroup}
                    onChange={(e) => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="">বাছাই করুন</option>
                    <option value="A+Positive">A+ Positive</option>
                    <option value="A-Negative">A- Negative</option>
                    <option value="B+Positive">B+ Positive</option>
                    <option value="B-Negative">B- Negative</option>
                    <option value="O+Positive">O+ Positive</option>
                    <option value="O-Negative">O- Negative</option>
                    <option value="AB+Positive">AB+ Positive</option>
                    <option value="AB-Negative">AB- Negative</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    রেফারকারী ডাক্তার
                  </label>
                  <input
                    type="text"
                    value={editFormData.referringDoctor}
                    onChange={(e) => setEditFormData({ ...editFormData, referringDoctor: e.target.value })}
                    placeholder="e.g. Prof. Dr. M. A. Bashar (or Self)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ঠিকানা / এলাকা (Address)
                </label>
                <input
                  type="text"
                  lang="en"
                  list="sylhet-address-list"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  placeholder="e.g. Zindabazar, Sylhet"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPatient(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  তথ্য সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOBILE-FIRST REGISTRATION + SERIAL MODAL */}
      <PatientRegistrationModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        token={token}
        patientsList={patientsList}
        doctorsList={doctorsList}
        marketingRepsList={marketingRepsList}
        onSuccessRefresh={fetchPatients}
      />

      {/* QUICK BOOK MODAL FOR EXISTING PATIENT */}
      {quickBookPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setQuickBookPatient(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-600" />
              <span>ডাক্তার সিরিয়াল ইস্যু করুন</span>
            </h3>
            <p className="text-slate-500 mb-4">
              রোগী: <strong>{quickBookPatient.name}</strong> (ID: {quickBookPatient.patientId})
            </p>

            <form onSubmit={handleQuickBookAppointment} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ডাক্তার বাছাই করুন *
                </label>
                <select
                  value={quickDoctorId}
                  onChange={(e) => setQuickDoctorId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                >
                  {doctorsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialty}) — ফি: ৳{d.fee}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  তারিখ
                </label>
                <input
                  type="date"
                  value={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    মার্কেটিং সোর্স
                  </label>
                  <select
                    value={quickMarketingSource}
                    onChange={(e) => setQuickMarketingSource(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                  >
                    <option value="Direct Walk-in">ওয়াক-ইন (Direct)</option>
                    <option value="Marketing Rep">মার্কেটিং প্রতিনিধি</option>
                    <option value="Social Media / Facebook">ফেসবুক</option>
                    <option value="Campaign / Leaflet">ক্যাম্পেইন</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    মার্কেটিং প্রতিনিধি
                  </label>
                  <select
                    value={quickMarketingRepId}
                    onChange={(e) => setQuickMarketingRepId(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                  >
                    <option value="">প্রযোজ্য নয়</option>
                    {marketingRepsList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="quickFee"
                  checked={quickFeePaid}
                  onChange={(e) => setQuickFeePaid(e.target.checked)}
                  className="rounded text-teal-600"
                />
                <label htmlFor="quickFee" className="text-slate-700 dark:text-slate-300 font-semibold">
                  ভিজিট ফি জমা নেওয়া হয়েছে
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickBookPatient(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  সিরিয়াল নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PATIENT HISTORY DRAWER */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <button
              onClick={() => setSelectedPatient(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 text-teal-600 rounded-xl">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedPatient.name} ({selectedPatient.patientId})
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedPatient.gender}, {selectedPatient.age} Years • Phone: {selectedPatient.phone}
                </p>
              </div>
            </div>

            {loadingHistory ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading records...</div>
            ) : (
              <div className="space-y-6 text-xs">
                {/* Reports */}
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>{t.patient.previousReports} ({historyReports.length})</span>
                  </h4>
                  {historyReports.length === 0 ? (
                    <p className="text-slate-400 italic">No previous test reports on record.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      {historyReports.map((r) => (
                        <div key={r.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">{r.testName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{r.reportNumber}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                              {r.status}
                            </span>
                            {onViewReport && (
                              <button
                                onClick={() => onViewReport(r)}
                                className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 font-semibold hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                              >
                                View Report
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Invoices */}
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-teal-600" />
                    <span>{t.patient.previousInvoices} ({historyInvoices.length})</span>
                  </h4>
                  {historyInvoices.length === 0 ? (
                    <p className="text-slate-400 italic">No previous billing invoices found.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      {historyInvoices.map((inv) => (
                        <div key={inv.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white font-mono">{inv.invoiceNumber}</div>
                            <div className="text-[11px] text-slate-500">
                              Total: ৳{inv.total} • Paid: ৳{inv.paidAmount} • Due: ৳{inv.dueAmount}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                inv.paymentStatus === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {inv.paymentStatus}
                            </span>
                            {onViewInvoice && (
                              <button
                                onClick={() => onViewInvoice(inv)}
                                className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 font-semibold hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                              >
                                View Invoice
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
