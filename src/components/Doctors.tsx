import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Calendar,
  Clock,
  User,
  Phone,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Building2,
  DollarSign,
  Users,
  Award,
  Edit3,
  Percent,
  Wallet,
  Receipt,
  Sparkles,
  FileCheck,
  X,
  Search,
  ExternalLink,
  PhoneCall,
  PhoneOff,
  PhoneMissed,
  MessageSquare,
  FileText,
  Printer,
  Copy,
  Sliders,
  Send,
  CreditCard,
  Check,
  Share2,
  Droplet,
  Lock,
  Unlock,
} from 'lucide-react';
import { Doctor, Appointment, DoctorCommission, Prescription, MarketingRep, DiagnosticTest, Patient } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  getDoctorDayPills,
  getNextAvailableDoctorDate,
  formatBengaliDateWithDay,
  isDoctorAvailableOnDay,
  DEFAULT_CATCHMENT_LOCATIONS,
  BENGALI_DAYS_SHORT,
  toAsciiDigits,
  toBengaliDigits,
  formatBengaliNumber,
  formatBengaliDDMMYYYY,
  normalizeBdMobileRemainder,
  isValidBdPhone,
  computeLivePatientId,
  resolveDayOfMonthToIsoDate,
  sortDoctorsByPriority,
} from '../utils/clinicalSchedule.ts';

export const Doctors: React.FC = () => {
  const { language, t } = useLanguage();
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'directory' | 'appointments' | 'commissions' | 'prescription' | 'slipSuggester'>('directory');

  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);
  const [commissionsList, setCommissionsList] = useState<DoctorCommission[]>([]);
  const [testsList, setTestsList] = useState<DiagnosticTest[]>([]);
  const [marketingRepsList, setMarketingRepsList] = useState<MarketingRep[]>([]);
  const [loading, setLoading] = useState(false);

  // Appointment Filter
  const [appointmentFilter, setAppointmentFilter] = useState<'today' | 'lastWeek' | 'all'>('today');

  // Doctor Entry Modal State
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    qualifications: '',
    specialty: '',
    department: 'General Medicine',
    chamberDays: 'Daily (Except Friday)',
    chamberTime: '05:00 PM - 09:00 PM',
    fee: '800',
    phone: '',
    roomNo: 'Room 101',
    maxPatientsPerDay: '30',
    commissionType: 'percentage',
    commissionRate: '20',
    usgFixedCommission: '300',
    generalTestCommissionRate: '25',
    bkashNumber: '',
    bankAccount: '',
    bankName: '',
    isChamberDoctor: true,
  });

  // Dedicated Commission Structure Modal
  const [commissionStructureDoctor, setCommissionStructureDoctor] = useState<Doctor | null>(null);
  const [structureForm, setStructureForm] = useState({
    usgFixedCommission: '300',
    generalTestCommissionRate: '25',
    bkashNumber: '',
    bankAccount: '',
    bankName: '',
  });

  // Quick Fee Edit State
  const [quickFeeDoctor, setQuickFeeDoctor] = useState<Doctor | null>(null);
  const [quickFeeAmount, setQuickFeeAmount] = useState('');
  const [autoSmsEnabled, setAutoSmsEnabled] = useState(true);

  const getBengaliDayName = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      const dayIndex = d.getDay();
      const daysBn = [
        'রবিবার (Sunday)',
        'সোমবার (Monday)',
        'মঙ্গলবার (Tuesday)',
        'বুধবার (Wednesday)',
        'বৃহস্পতিবার (Thursday)',
        'শুক্রবার (Friday)',
        'শনিবার (Saturday)',
      ];
      return daysBn[dayIndex] || '';
    } catch {
      return '';
    }
  };

  // Booking Form State
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookData, setBookData] = useState({
    patientName: '',
    mobileRemainder: '', // 9 digits after "01"
    patientAge: '',
    patientGender: 'Female',
    patientAddress: '',
    bloodGroup: '',
    willingToDonateBlood: false,
    appointmentDate: new Date().toISOString().split('T')[0],
    customDayInput: '',
    feeOption: 'standard' as 'standard' | 'waived' | 'custom',
    customFeeAmount: '',
    waiverReasonPreset: '',
    waiverReason: '',
    isNoMobileWorkaround: false,
    feePaid: true,
    marketingSource: 'Direct Walk-in',
    marketingRepId: '',
    marketingHonorarium: '',
    idMode: 'mobile' as 'mobile' | 'other',
    notes: '',
  });
  const [bookCustomDayError, setBookCustomDayError] = useState<string | null>(null);
  const [bookFormError, setBookFormError] = useState<string | null>(null);
  const [showBookFeeSheet, setShowBookFeeSheet] = useState(false);
  const [tempBookFee, setTempBookFee] = useState('');
  const [tempBookReasonPreset, setTempBookReasonPreset] = useState('');
  const [tempBookCustomReason, setTempBookCustomReason] = useState('');
  const [bookFeeSheetError, setBookFeeSheetError] = useState<string | null>(null);

  // Appointment Notification Slip & SMS State
  const [appointmentNotice, setAppointmentNotice] = useState<{
    id?: number;
    serialNumber: number;
    doctorName: string;
    doctorSpecialty: string;
    chamberRoom?: string;
    chamberTime?: string;
    patientName: string;
    patientPhone: string;
    appointmentDate: string;
    fee: string;
    smsText: string;
  } | null>(null);
  const [smsCopied, setSmsCopied] = useState(false);
  const [serverSmsSent, setServerSmsSent] = useState(false);

  // Call Logging Modal State
  const [callLogAppointment, setCallLogAppointment] = useState<Appointment | null>(null);
  const [callStatus, setCallStatus] = useState<'Connected' | 'No Answer' | 'Switched Off' | 'Wrong Number' | 'Missed Call'>('Connected');
  const [callDurationSeconds, setCallDurationSeconds] = useState('45');
  const [callNotes, setCallNotes] = useState('');

  // Feedback Modal State
  const [feedbackAppointment, setFeedbackAppointment] = useState<Appointment | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<'Satisfied' | 'Needs Follow-up' | 'Report Pending' | 'Medicines Started'>('Satisfied');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState('');

  // Commission Detail & Payout / Notify Modal State
  const [payoutCommission, setPayoutCommission] = useState<DoctorCommission | null>(null);
  const [overrideAmount, setOverrideAmount] = useState('');
  const [overrideStatus, setOverrideStatus] = useState('Approved');
  const [overridePaymentMethod, setOverridePaymentMethod] = useState('bKash');
  const [transactionRef, setTransactionRef] = useState('');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [notifySuccessMsg, setNotifySuccessMsg] = useState('');

  // Prescription Pad State (BP & Weight removed from UI)
  const [prescriptionDoctor, setPrescriptionDoctor] = useState<Doctor | null>(null);
  const [prescPatientName, setPrescPatientName] = useState('');
  const [prescPatientAge, setPrescPatientAge] = useState('');
  const [prescPatientGender, setPrescPatientGender] = useState('Female');
  const [prescPatientPhone, setPrescPatientPhone] = useState('');
  const [prescChiefComplaints, setPrescChiefComplaints] = useState('জ্বর ৩ দিন যাবৎ, শরীর ব্যথা ও দুর্বলতা');
  const [prescDiagnosis, setPrescDiagnosis] = useState('Acute Viral Fever / Susp. Infection');
  const [prescMedicines, setPrescMedicines] = useState([
    { name: 'Tab. Napa Extra 500mg', dosage: '1+0+1', frequency: 'খাবারের পর', duration: '৫ দিন', instructions: 'জ্বর থাকলে' },
    { name: 'Cap. Seclo 20mg', dosage: '1+0+1', frequency: 'খাবারের ২০ মিনিট পূর্বে', duration: '১৪ দিন', instructions: '' },
    { name: 'Tab. Fexo 120mg', dosage: '0+0+1', frequency: 'রাতে খাবারের পর', duration: '৭ দিন', instructions: '' },
  ]);
  const [prescAdvisedTests, setPrescAdvisedTests] = useState([
    { testCode: 'CBC', testName: 'CBC with ESR', price: '450' },
    { testCode: 'USG-WA', testName: 'USG of Whole Abdomen', price: '1200' },
  ]);
  const [prescNextVisit, setPrescNextVisit] = useState('৭ দিন পর টেস্ট রিপোর্ট সহ দেখা করবেন');
  const [prescriptionPrinted, setPrescriptionPrinted] = useState(false);

  // Clinical Panel Suggester State
  const [suggesterDoctor, setSuggesterDoctor] = useState('');
  const [suggesterPatient, setSuggesterPatient] = useState('');
  const [selectedPanel, setSelectedPanel] = useState<string>('');
  const [suggesterSuccess, setSuggesterSuccess] = useState('');

  useEffect(() => {
    fetchDoctors();
    fetchPatients();
    fetchAppointments();
    fetchCommissions();
    fetchTests();
    fetchMarketingReps();
  }, [token]);

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
        const sorted = sortDoctorsByPriority<Doctor>(json);
        setDoctorsList(sorted);
        if (sorted.length > 0 && !prescriptionDoctor) {
          setPrescriptionDoctor(sorted[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/appointments', {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (res.ok) {
        const json = await res.json();
        setAppointmentsList(json);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissions = async () => {
    try {
      const res = await fetch('/api/doctor-commissions', {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (res.ok) {
        const json = await res.json();
        setCommissionsList(json);
      }
    } catch (err) {
      console.error('Error fetching commissions:', err);
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

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorForm.name || !doctorForm.qualifications || !doctorForm.specialty) {
      return;
    }

    try {
      const url = editingDoctor ? `/api/doctors/${editingDoctor.id}` : '/api/doctors';
      const method = editingDoctor ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify(doctorForm),
      });

      if (res.ok) {
        setShowAddDoctorModal(false);
        setEditingDoctor(null);
        fetchDoctors();
      }
    } catch (err) {
      console.error('Error saving doctor:', err);
    }
  };

  const handleSaveCommissionStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commissionStructureDoctor) return;

    try {
      const res = await fetch(`/api/doctors/${commissionStructureDoctor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          ...commissionStructureDoctor,
          usgFixedCommission: structureForm.usgFixedCommission,
          generalTestCommissionRate: structureForm.generalTestCommissionRate,
          bkashNumber: structureForm.bkashNumber,
          bankAccount: structureForm.bankAccount,
          bankName: structureForm.bankName,
        }),
      });

      if (res.ok) {
        setCommissionStructureDoctor(null);
        fetchDoctors();
      }
    } catch (err) {
      console.error('Error saving commission structure:', err);
    }
  };

  const handleSaveQuickFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickFeeDoctor || !quickFeeAmount) return;
    try {
      const res = await fetch(`/api/doctors/${quickFeeDoctor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          ...quickFeeDoctor,
          fee: quickFeeAmount,
        }),
      });
      if (res.ok) {
        setDoctorsList((prev) =>
          prev.map((d) => (d.id === quickFeeDoctor.id ? { ...d, fee: quickFeeAmount } : d))
        );
        setQuickFeeDoctor(null);
      }
    } catch (err) {
      console.error('Error updating doctor fee:', err);
    }
  };

  const liveBookPatientId = computeLivePatientId({
    mode: bookData.isNoMobileWorkaround ? 'other' : bookData.idMode,
    fullPhone: bookData.isNoMobileWorkaround ? '01700000000' : `01${bookData.mobileRemainder}`,
    digitCount: 6,
    isProxyPhone: bookData.isNoMobileWorkaround,
    existingPatients: patientsList,
  });

  const getOnlyBengaliDay = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(`${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return '';
    return `${BENGALI_DAYS_SHORT[d.getDay()]}বার`;
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookFormError(null);
    const effectivePhone = bookData.isNoMobileWorkaround
      ? '01700000000'
      : `01${bookData.mobileRemainder.trim()}`;

    if (!selectedDoctor || !bookData.patientName.trim()) {
      setBookFormError('রোগীর নাম এবং ডাক্তার নির্বাচন করা বাধ্যতামূলক।');
      return;
    }

    if (!bookData.isNoMobileWorkaround && !isValidBdPhone(effectivePhone)) {
      setBookFormError('সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (01 + ৯ সংখ্যা) অথবা প্রক্সি নম্বর নির্বাচন করুন।');
      return;
    }

    if (bookData.willingToDonateBlood && !bookData.bloodGroup) {
      setBookFormError('রক্তদাতা তালিকায় যুক্ত করতে রক্তের গ্রুপ নির্বাচন করুন।');
      return;
    }

    const rep = marketingRepsList.find((m) => String(m.id) === String(bookData.marketingRepId));

    // Fee calculations
    let effectiveFee = selectedDoctor.fee;
    let isWaived = false;
    let waiverNote = '';

    if (bookData.feeOption === 'waived') {
      effectiveFee = '0';
      isWaived = true;
      waiverNote = [bookData.waiverReasonPreset, bookData.waiverReason].filter(Boolean).join(' - ') || '১০০% ফি মওকুফ';
    } else if (bookData.feeOption === 'custom') {
      effectiveFee = bookData.customFeeAmount || '0';
      waiverNote = [bookData.waiverReasonPreset, bookData.waiverReason].filter(Boolean).join(' - ') || 'বিশেষ ছাড়';
    }

    const cleanHonorarium = toAsciiDigits(bookData.marketingHonorarium).replace(/[^\d]/g, '');

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          doctorName: selectedDoctor.name,
          doctorSpecialty: selectedDoctor.specialty,
          patientId: liveBookPatientId.id || undefined,
          patientName: bookData.patientName.trim(),
          patientPhone: effectivePhone,
          patientAge: bookData.patientAge,
          patientGender: bookData.patientGender,
          patientAddress: bookData.patientAddress.trim(),
          bloodGroup: bookData.bloodGroup,
          willingToDonateBlood: bookData.willingToDonateBlood,
          appointmentDate: bookData.appointmentDate,
          fee: effectiveFee,
          originalFee: selectedDoctor.fee,
          feeWaived: isWaived,
          waiverReason: waiverNote,
          isProxyPhone: bookData.isNoMobileWorkaround,
          feePaid: isWaived ? true : bookData.feePaid,
          marketingSource: bookData.marketingSource,
          marketingRepId: rep ? rep.id : null,
          marketingRepName: rep ? rep.name : null,
          marketingHonorarium: cleanHonorarium || undefined,
          notes: bookData.notes,
        }),
      });

      if (res.ok) {
        const apptData = await res.json();
        const dateStr = bookData.appointmentDate;
        const timeStr = selectedDoctor.chamberTime || 'বিকেল ৫:০০ - রাত ৯:০০';
        const roomStr = selectedDoctor.roomNo || 'চেম্বার ১০১';
        const feeStr = String(effectiveFee);

        const smsContent = `সোনালী ডায়াগনস্টিক সেন্টার: শ্রদ্ধেয় ${bookData.patientName}, ${selectedDoctor.name}-এর চেম্বারে আপনার সিরিয়াল #${apptData.serialNumber} নিশ্চিত হয়েছে। তারিখ: ${dateStr}, চেম্বার: ${roomStr} (${timeStr})। ভিজিট ফি: ৳${feeStr}${isWaived ? ' (মওকুফ)' : ''}। সিরিয়ালের ১০ মিনিট পূর্বে উপস্থিত থাকার অনুরোধ করা হচ্ছে। হেল্পলাইন: 01711-000000। সুস্থ থাকুন!`;

        // If auto-SMS enabled AND not a proxy phone, trigger the server SMS gateway
        let autoSent = false;
        if (autoSmsEnabled && !bookData.isNoMobileWorkaround && effectivePhone !== '01700000000') {
          try {
            await fetch(`/api/appointments/${apptData.id}/sms`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token || ''}`,
              },
              body: JSON.stringify({
                type: 'confirmation',
                customText: smsContent,
              }),
            });
            autoSent = true;
          } catch (smsErr) {
            console.error('Auto SMS error:', smsErr);
          }
        }

        setServerSmsSent(autoSent);
        setAppointmentNotice({
          id: apptData.id,
          serialNumber: apptData.serialNumber,
          doctorName: selectedDoctor.name,
          doctorSpecialty: selectedDoctor.specialty,
          chamberRoom: roomStr,
          chamberTime: timeStr,
          patientName: bookData.patientName,
          patientPhone: effectivePhone,
          appointmentDate: dateStr,
          fee: feeStr,
          smsText: smsContent,
        });

        setShowBookModal(false);
        setBookFormError(null);
        setBookCustomDayError(null);
        setBookData({
          patientName: '',
          mobileRemainder: '',
          patientAge: '',
          patientGender: 'Female',
          patientAddress: '',
          bloodGroup: '',
          willingToDonateBlood: false,
          appointmentDate: new Date().toISOString().split('T')[0],
          customDayInput: '',
          feeOption: 'standard',
          customFeeAmount: '',
          waiverReasonPreset: '',
          waiverReason: '',
          isNoMobileWorkaround: false,
          feePaid: true,
          marketingSource: 'Direct Walk-in',
          marketingRepId: '',
          marketingHonorarium: '',
          idMode: 'mobile',
          notes: '',
        });
        fetchAppointments();
        fetchPatients();
      }
    } catch (err) {
      console.error('Error booking appointment:', err);
    }
  };

  const handleOpenAppointmentSmsModal = (appt: Appointment) => {
    const doc = doctorsList.find((d) => d.id === appt.doctorId);
    const roomStr = doc?.roomNo || 'চেম্বার ১০১';
    const timeStr = doc?.chamberTime || 'বিকেল ৫:০০ - রাত ৯:০০';
    const feeStr = String(appt.fee || '৮০০');
    const smsContent = `সোনালী ডায়াগনস্টিক সেন্টার: শ্রদ্ধেয় ${appt.patientName}, ${appt.doctorName}-এর চেম্বারে আপনার সিরিয়াল #${appt.serialNumber} নিশ্চিত হয়েছে। তারিখ: ${appt.appointmentDate}, চেম্বার: ${roomStr} (${timeStr})। ভিজিট ফি: ৳${feeStr}। সিরিয়ালের ১০ মিনিট পূর্বে উপস্থিত থাকার অনুরোধ করা হচ্ছে। হেল্পলাইন: 01711-000000। সুস্থ থাকুন!`;

    setServerSmsSent(false);
    setAppointmentNotice({
      id: appt.id,
      serialNumber: appt.serialNumber,
      doctorName: appt.doctorName,
      doctorSpecialty: appt.doctorSpecialty || 'General Medicine',
      chamberRoom: roomStr,
      chamberTime: timeStr,
      patientName: appt.patientName,
      patientPhone: appt.patientPhone,
      appointmentDate: appt.appointmentDate,
      fee: feeStr,
      smsText: smsContent,
    });
  };

  const handleTriggerServerSms = async () => {
    if (!appointmentNotice || !appointmentNotice.id) return;
    try {
      const res = await fetch(`/api/appointments/${appointmentNotice.id}/sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          type: 'confirmation',
          customText: appointmentNotice.smsText,
        }),
      });
      if (res.ok) {
        setServerSmsSent(true);
        fetchAppointments();
      }
    } catch (err) {
      console.error('Error triggering server SMS:', err);
    }
  };

  const handleSaveCallLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callLogAppointment) return;

    try {
      const res = await fetch(`/api/appointments/${callLogAppointment.id}/call-log`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          callStatus,
          callDurationSeconds: parseInt(callDurationSeconds, 10) || 0,
          callNotes,
        }),
      });

      if (res.ok) {
        setCallLogAppointment(null);
        fetchAppointments();
      }
    } catch (err) {
      console.error('Error saving call log:', err);
    }
  };

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackAppointment) return;

    try {
      const res = await fetch(`/api/appointments/${feedbackAppointment.id}/feedback`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          feedbackStatus,
          feedbackNotes,
        }),
      });

      if (res.ok) {
        setFeedbackSuccessMsg('রোগীর ফলো-আপ ও ফিডব্যাক সফলভাবে সংরক্ষিত হয়েছে!');
        setTimeout(() => {
          setFeedbackSuccessMsg('');
          setFeedbackAppointment(null);
          fetchAppointments();
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving feedback:', err);
    }
  };

  const handleSendFollowupSms = async (appt: Appointment) => {
    try {
      const res = await fetch(`/api/appointments/${appt.id}/sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          type: 'followup',
        }),
      });

      if (res.ok) {
        fetchAppointments();
      }
    } catch (err) {
      console.error('Error sending SMS:', err);
    }
  };

  const handleSaveCommissionPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutCommission || !overrideAmount) return;

    try {
      const res = await fetch(`/api/doctor-commissions/${payoutCommission.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          approvedAmount: overrideAmount,
          status: overrideStatus,
          paymentMethod: overridePaymentMethod,
          transactionRef,
          notes: overrideNotes || `Honorarium paid via ${overridePaymentMethod}`,
        }),
      });

      if (res.ok) {
        setPayoutCommission(null);
        fetchCommissions();
      }
    } catch (err) {
      console.error('Error updating commission:', err);
    }
  };

  // Helper for generating doctor referral breakdown notification text
  const generateDoctorNotificationText = (comm: DoctorCommission, doc?: Doctor) => {
    const bkash = doc?.bkashNumber || comm.doctorBkash || 'নম্বর নথিভুক্ত নেই';
    return `সোনালী ডায়াগনস্টিক সেন্টার (Sonali Diagnostic): শ্রদ্ধাভাজন ${comm.doctorName}, আপনার রেফারকৃত রোগী: ${comm.patientName} (ইনভয়েস: ${comm.invoiceNumber})-এর মোট ডায়াগনস্টিক বিল ৳${comm.billTotal}-এর বিপরীতে রেফারেল অনারিয়াম বাবদ ৳${comm.approvedAmount || comm.calculatedAmount} অনুমোদিত হয়েছে। পরিশোধ মাধ্যম: বিকাশ (${bkash}) বা ক্যাশ। হেল্পলাইন: 01711-000000। ধন্যবাদ।`;
  };

  // Pre-configured diagnostic panels
  const CLINICAL_PANELS = [
    {
      id: 'fever',
      title: 'জ্বর ও ইনফেকশন স্ক্রিনিং (Fever Panel)',
      tests: ['CBC with ESR (৳450)', 'Widal Test (৳350)', 'Dengue Duo NS1+IgM (৳900)', 'Urine R/M/E (৳200)'],
      total: '৳1,900',
    },
    {
      id: 'diabetes',
      title: 'ডায়াবেটিস ও মেটাবলিক কমপ্লিট প্যাকেজ',
      tests: ['RBS (৳100)', 'HbA1c (৳750)', 'Serum Creatinine (৳600)', 'Lipid Profile (৳850)'],
      total: '৳2,300',
    },
    {
      id: 'cardiac',
      title: 'কার্ডিয়াক ও উচ্চরক্তচাপ প্রোফাইল (Cardiac Profile)',
      tests: ['ECG 12-Lead (৳300)', 'Lipid Profile Full (৳850)', 'Serum Electrolytes (৳800)', 'Creatinine (৳600)'],
      total: '৳2,550',
    },
    {
      id: 'abdominal',
      title: 'পেট ব্যথা ও আল্ট্রাসনোগ্রাম প্যাকেজ (Abdominal & USG)',
      tests: ['USG Whole Abdomen (৳1,200)', 'LFT (৳950)', 'KFT (৳600)', 'Urine R/M/E (৳200)'],
      total: '৳2,950',
    },
    {
      id: 'antenatal',
      title: 'গর্ভবতী রুটিন স্ক্রিনিং ও আল্ট্রা (ANC & USG)',
      tests: ['USG Pregnancy Profile (৳1,000)', 'Blood Group & Rh (৳150)', 'CBC (৳450)', 'RBS (৳100)', 'Urine (৳200)'],
      total: '৳1,900',
    },
  ];

  // Filtered Appointments
  const filteredAppointments = appointmentsList.filter((app) => {
    if (appointmentFilter === 'all') return true;
    const today = new Date().toISOString().split('T')[0];
    if (appointmentFilter === 'today') {
      return app.appointmentDate === today;
    }
    if (appointmentFilter === 'lastWeek') {
      // appointments with dates prior to today
      return app.appointmentDate < today;
    }
    return true;
  });

  const totalCommissionsAccrued = commissionsList.reduce(
    (acc, c) => acc + parseFloat(c.approvedAmount || c.calculatedAmount || '0'),
    0
  );
  const totalCommissionsPaid = commissionsList
    .filter((c) => c.status === 'Paid')
    .reduce((acc, c) => acc + parseFloat(c.approvedAmount || '0'), 0);
  const totalCommissionsPending = commissionsList
    .filter((c) => c.status === 'Pending' || c.status === 'Approved')
    .reduce((acc, c) => acc + parseFloat(c.approvedAmount || '0'), 0);

  return (
    <div className="space-y-6">
      {/* Title & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            ডাক্তার চেম্বার, প্রেসক্রিপশন ও রেফারেল অনারিয়াম
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            কনসালটেন্ট ডাক্তার ব্যবস্থাপনা, আল্ট্রা ফিক্সড ও সাধারণ টেস্ট কমিশন রুলস, সরাসরি কল/হোয়াটসঅ্যাপ ও ডিজিটাল প্রেসক্রিপশন
          </p>
        </div>

        <button
          onClick={() => {
            setEditingDoctor(null);
            setDoctorForm({
              name: '',
              qualifications: '',
              specialty: '',
              department: 'General Medicine',
              chamberDays: 'Daily (Except Friday)',
              chamberTime: '05:00 PM - 09:00 PM',
              fee: '800',
              phone: '',
              roomNo: 'Room 101',
              maxPatientsPerDay: '30',
              commissionType: 'percentage',
              commissionRate: '20',
              usgFixedCommission: '300',
              generalTestCommissionRate: '25',
              bkashNumber: '',
              bankAccount: '',
              bankName: '',
              isChamberDoctor: true,
            });
            setShowAddDoctorModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>নতুন ডাক্তার এন্ট্রি করুন</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'directory'
              ? 'bg-[#0f2744] text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <Stethoscope className="w-4 h-4 text-teal-400" />
          <span>ডাক্তার তালিকা ও অনারিয়াম কাঠামো ({doctorsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'appointments'
              ? 'bg-[#0f2744] text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <PhoneCall className="w-4 h-4 text-emerald-400" />
          <span>চেম্বার সিরিয়াল, কল ও ফলো-আপ ({appointmentsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('commissions')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'commissions'
              ? 'bg-[#0f2744] text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <Wallet className="w-4 h-4 text-amber-400" />
          <span>ডাক্তার অনারিয়াম ও পে-আউট লেজার ({commissionsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('prescription')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'prescription'
              ? 'bg-[#0f2744] text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4 text-teal-400" />
          <span>প্রেসক্রিপশন প্যাড 📋</span>
        </button>

        <button
          onClick={() => setActiveTab('slipSuggester')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'slipSuggester'
              ? 'bg-[#0f2744] text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>টেস্ট প্যানেল সাজেস্টার ✨</span>
        </button>
      </div>

      {/* TAB 1: DOCTOR DIRECTORY & COMMISSION STRUCTURES */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctorsList.map((doc) => (
              <div
                key={doc.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3 flex flex-col justify-between hover:border-teal-500 transition"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center font-bold text-sm">
                        Dr
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            doc.isChamberDoctor
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          }`}
                        >
                          {doc.isChamberDoctor ? 'চেম্বার ডাক্তার' : 'রেফারেল কনসালটেন্ট'}
                        </span>
                        {/* Live Serial Count Badge */}
                        {(() => {
                          const todayStr = new Date().toISOString().split('T')[0];
                          const count = appointmentsList.filter(
                            (a) => a.doctorId === doc.id && a.appointmentDate === todayStr
                          ).length;
                          return (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>আজকের সিরিয়াল: {count} জন</span>
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {doc.roomNo || 'Room 101'}
                      </span>
                      <button
                        onClick={() => {
                          setEditingDoctor(doc);
                          setDoctorForm({
                            name: doc.name,
                            qualifications: doc.qualifications,
                            specialty: doc.specialty,
                            department: doc.department,
                            chamberDays: doc.chamberDays,
                            chamberTime: doc.chamberTime,
                            fee: doc.fee,
                            phone: doc.phone || '',
                            roomNo: doc.roomNo || 'Room 101',
                            maxPatientsPerDay: String(doc.maxPatientsPerDay || 30),
                            commissionType: doc.commissionType || 'percentage',
                            commissionRate: doc.commissionRate || '20',
                            usgFixedCommission: doc.usgFixedCommission || '300',
                            generalTestCommissionRate: doc.generalTestCommissionRate || '25',
                            bkashNumber: doc.bkashNumber || '',
                            bankAccount: doc.bankAccount || '',
                            bankName: doc.bankName || '',
                            isChamberDoctor: doc.isChamberDoctor !== undefined ? doc.isChamberDoctor : true,
                          });
                          setShowAddDoctorModal(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-teal-600"
                        title="Edit doctor profile"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2">
                    {doc.name}
                  </h4>
                  <div className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold">
                    {doc.specialty}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                    {doc.qualifications}
                  </div>

                  {/* Chamber info */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{doc.chamberDays}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{doc.chamberTime}</span>
                    </div>
                    {doc.phone && (
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{doc.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Custom Commission Structure Card */}
                  <div className="mt-2.5 p-2.5 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60 text-[11px] space-y-1">
                    <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200">
                      <span className="flex items-center gap-1">
                        <Wallet className="w-3 h-3 text-amber-600" />
                        <span>অনারিয়াম কাঠামো:</span>
                      </span>
                      <button
                        onClick={() => {
                          setCommissionStructureDoctor(doc);
                          setStructureForm({
                            usgFixedCommission: doc.usgFixedCommission || '300',
                            generalTestCommissionRate: doc.generalTestCommissionRate || '25',
                            bkashNumber: doc.bkashNumber || '',
                            bankAccount: doc.bankAccount || '',
                            bankName: doc.bankName || '',
                          });
                        }}
                        className="text-[10px] text-teal-700 dark:text-teal-400 font-bold hover:underline flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded shadow-2xs border border-amber-200"
                      >
                        <Sliders className="w-2.5 h-2.5" />
                        <span>কমিশন এডিট</span>
                      </button>
                    </div>

                    <div className="text-slate-700 dark:text-slate-300 font-mono text-[10px] space-y-0.5">
                      <div>• আল্ট্রাসনোগ্রাম (USG): <strong>৳{doc.usgFixedCommission || '300'} (ফিক্সড)</strong></div>
                      <div>• অন্যান্য টেস্ট (নেট বিলের উপর): <strong>{doc.generalTestCommissionRate || '25'}%</strong></div>
                      {doc.bkashNumber && (
                        <div className="text-emerald-700 dark:text-emerald-400 font-bold">
                          • বিকাশ: {doc.bkashNumber}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 block">ভিজিট ফি (Fee)</span>
                      <button
                        onClick={() => {
                          setQuickFeeDoctor(doc);
                          setQuickFeeAmount(doc.fee);
                        }}
                        className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5 font-bold"
                        title="ডাক্তারের ভিজিট ফি পরিবর্তন করুন"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                        <span>ফি এডিট</span>
                      </button>
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      ৳{parseFloat(doc.fee).toFixed(0)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDoctor(doc);
                      const nextDate = getNextAvailableDoctorDate(doc.chamberDays);
                      setBookFormError(null);
                      setBookCustomDayError(null);
                      setBookData({
                        patientName: '',
                        mobileRemainder: '',
                        patientAge: '',
                        patientGender: 'Female',
                        patientAddress: '',
                        bloodGroup: '',
                        willingToDonateBlood: false,
                        appointmentDate: nextDate,
                        customDayInput: '',
                        feeOption: 'standard',
                        customFeeAmount: '',
                        waiverReasonPreset: '',
                        waiverReason: '',
                        isNoMobileWorkaround: false,
                        feePaid: true,
                        marketingSource: 'Direct Walk-in',
                        marketingRepId: '',
                        marketingHonorarium: '',
                        idMode: 'mobile',
                        notes: '',
                      });
                      setShowBookModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition"
                  >
                    সিরিয়াল দিন
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: APPOINTMENTS LIST, CALLING & FOLLOW-UP LOG */}
      {activeTab === 'appointments' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                চেম্বার সিরিয়াল, সরাসরি কল ও রোগী ফলো-আপ লগ
              </h3>
              <p className="text-xs text-slate-500">
                ওয়েবসাইট/অ্যাপ থেকে সরাসরি ফোন কল, হোয়াটসঅ্যাপ মেসেজ এবং গত সপ্তাহের রোগীদের ফলো-আপ ট্র্যাকিং
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setAppointmentFilter('today')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  appointmentFilter === 'today'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                আজকের সিরিয়াল ({appointmentsList.filter(a => a.appointmentDate === new Date().toISOString().split('T')[0]).length})
              </button>
              <button
                onClick={() => setAppointmentFilter('lastWeek')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  appointmentFilter === 'lastWeek'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                গত সপ্তাহের রোগী ফলো-আপ
              </button>
              <button
                onClick={() => setAppointmentFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  appointmentFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                সকল ({appointmentsList.length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="py-2.5 px-3">সিরিয়াল #</th>
                  <th className="py-2.5 px-3">রোগীর নাম ও মোবাইল</th>
                  <th className="py-2.5 px-3">ডাক্তার</th>
                  <th className="py-2.5 px-3">মার্কেটিং সোর্স</th>
                  <th className="py-2.5 px-3">সরাসরি কল ও যোগাযোগ</th>
                  <th className="py-2.5 px-3">কল অবস্থা ও কথা (সেকেন্ড)</th>
                  <th className="py-2.5 px-3">ফলো-আপ ও ফিডব্যাক</th>
                  <th className="py-2.5 px-3 text-right">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      কোন সিরিয়াল পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-600 text-sm">
                        #{app.serialNumber}
                        <span className="block text-[10px] text-slate-400 font-sans font-normal">{app.appointmentDate}</span>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 dark:text-white block">{app.patientName}</span>
                        <span className="font-mono text-slate-600 dark:text-slate-400 text-[11px]">{app.patientPhone}</span>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{app.doctorName}</span>
                        <span className="text-[10px] text-slate-400 block">{app.doctorSpecialty}</span>
                      </td>

                      {/* Marketing Source Badge */}
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {app.marketingSource || 'Direct Walk-in'}
                        </span>
                        {app.marketingRepName && (
                          <span className="block text-[10px] text-slate-500 font-medium">
                            প্রতিনিধি: {app.marketingRepName}
                          </span>
                        )}
                      </td>

                      {/* Direct Click-to-Call & WhatsApp Action */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${app.patientPhone}`}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800 transition shadow-2xs"
                            title="সরাসরি অ্যাপ/ওয়েব থেকে কল দিন"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>কল দিন</span>
                          </a>

                          <a
                            href={`https://wa.me/88${app.patientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `সোনালী ডায়াগনস্টিক সেন্টার: সম্মানিত ${app.patientName}, ${app.doctorName}-এর চেম্বারে আপনার সিরিয়াল #${app.serialNumber}। হেল্পলাইন: 01711-000000`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 dark:bg-green-950/40 hover:bg-green-100 text-green-700 dark:text-green-300 font-bold text-[11px] border border-green-200 dark:border-green-800 transition"
                            title="হোয়াটসঅ্যাপে মেসেজ বা কল দিন"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </td>

                      {/* Call Status & Duration */}
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            app.callStatus === 'Connected'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : app.callStatus === 'No Answer' || app.callStatus === 'Missed Call'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : app.callStatus === 'Switched Off'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {app.callStatus === 'Connected' ? '✓ ধরেছে' : app.callStatus === 'No Answer' ? '✕ ধরে নাই' : app.callStatus === 'Switched Off' ? '📵 বন্ধ ছিল' : app.callStatus || 'কল করা হয়নি'}
                        </span>
                        {app.callDurationSeconds ? (
                          <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                            কথা হয়েছে: {app.callDurationSeconds} সে.
                          </span>
                        ) : null}
                      </td>

                      {/* Feedback status */}
                      <td className="py-2.5 px-3">
                        {app.feedbackStatus ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200">
                            {app.feedbackStatus}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">পেন্ডিং</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setCallLogAppointment(app);
                              setCallStatus((app.callStatus as any) || 'Connected');
                              setCallDurationSeconds(String(app.callDurationSeconds || 45));
                              setCallNotes(app.callNotes || '');
                            }}
                            className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[10px] transition"
                            title="কলের ফলাফল ও সেকেন্ড লিপিবদ্ধ করুন"
                          >
                            কল লগ
                          </button>

                          <button
                            onClick={() => {
                              setFeedbackAppointment(app);
                              setFeedbackStatus((app.feedbackStatus as any) || 'Satisfied');
                              setFeedbackNotes(app.feedbackNotes || '');
                            }}
                            className="px-2 py-1 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 hover:bg-teal-100 font-bold text-[10px] transition"
                            title="রোগীর মতামত / ফলো-আপ এন্ট্রি"
                          >
                            ফিডব্যাক
                          </button>

                          <button
                            onClick={() => handleOpenAppointmentSmsModal(app)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-bold text-[10px] border border-teal-200 dark:border-teal-800 transition shadow-2xs"
                            title="রোগীকে অ্যাপয়েন্টমেন্ট এসএমএস নোটিফিকেশন পাঠান"
                          >
                            <MessageSquare className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                            <span>এসএমএস</span>
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
      )}

      {/* TAB 3: DOCTOR COMMISSIONS & HONORARIUM LEDGER */}
      {activeTab === 'commissions' && (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500 font-bold uppercase">মোট প্রযোজ্য অনারিয়াম</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                ৳{totalCommissionsAccrued.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400">আল্ট্রা ৩০০৳ ফিক্সড + সাধারণ টেস্ট কমিশন</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500 font-bold uppercase">পরিশোধিত অনারিয়াম (Paid)</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                ৳{totalCommissionsPaid.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">বিকাশ বা ব্যাংক মাধ্যমে প্রদানকৃত</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500 font-bold uppercase">বকেয়া অনারিয়াম (Pending)</span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                ৳{totalCommissionsPending.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-amber-600 font-medium">যাচাই ও পরিশোধযোগ্য</span>
            </div>
          </div>

          {/* Commission Table with In-line Edit / Override and Notify Doctor */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  ডাক্তারদের রেফারেল অনারিয়াম ও কমিশন বিবরণী
                </h3>
                <p className="text-xs text-slate-500">
                  হিসাবকৃত টাকা সরাসরি কম-বেশি (এডিট) করে অনুমোদিত করতে পারেন (যেমন: ৫৫০ টাকা হলে ৫০০ বা ৬০০ টাকা নির্ধারণ করা যায়)
                </p>
              </div>
              <button
                onClick={fetchCommissions}
                className="text-xs font-semibold text-teal-600 hover:underline"
              >
                রিফ্রেশ
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <tr>
                    <th className="py-2.5 px-3">ইনভয়েস #</th>
                    <th className="py-2.5 px-3">রেফারকারী ডাক্তার</th>
                    <th className="py-2.5 px-3">রোগীর নাম</th>
                    <th className="py-2.5 px-3">টেস্ট বিল</th>
                    <th className="py-2.5 px-3">মূল হিসাবকৃত</th>
                    <th className="py-2.5 px-3">চূড়ান্ত অনুমোদিত টাকা (Editable)</th>
                    <th className="py-2.5 px-3">অবস্থা ও মাধ্যম</th>
                    <th className="py-2.5 px-3 text-right">পদক্ষেপ (পে-আউট / ডাক্তার নোটিশ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {commissionsList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        কোন কমিশন রেকর্ড নেই। বিলিং করার সময় ডাক্তার নির্বাচন করলে অটো হিসাব হবে।
                      </td>
                    </tr>
                  ) : (
                    commissionsList.map((comm) => {
                      const doc = doctorsList.find((d) => d.name === comm.doctorName);
                      return (
                        <tr key={comm.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-mono font-bold text-teal-600">
                            {comm.invoiceNumber}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                            {comm.doctorName}
                            {doc?.bkashNumber && (
                              <span className="block font-mono text-[10px] text-emerald-600">
                                বিকাশ: {doc.bkashNumber}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                            {comm.patientName}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">
                            ৳{parseFloat(comm.billTotal).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">
                            ৳{parseFloat(comm.calculatedAmount).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-sm text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                              ৳{parseFloat(comm.approvedAmount).toFixed(2)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                comm.status === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : comm.status === 'Approved'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {comm.status} ({comm.paymentMethod})
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Notify Doctor Button (WhatsApp or SMS text) */}
                              <a
                                href={`https://wa.me/?text=${encodeURIComponent(
                                  generateDoctorNotificationText(comm, doc)
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300 font-bold text-[10px] border border-green-200 hover:bg-green-100 flex items-center gap-1"
                                title="ডাক্তারকে মেসেজ দিয়ে অনারিয়াম জানান"
                              >
                                <Share2 className="w-3 h-3" />
                                <span>জানান</span>
                              </a>

                              {/* Payout & Override button */}
                              <button
                                onClick={() => {
                                  setPayoutCommission(comm);
                                  setOverrideAmount(comm.approvedAmount || comm.calculatedAmount);
                                  setOverrideStatus(comm.status);
                                  setOverridePaymentMethod(doc?.bkashNumber ? 'bKash' : 'Cash');
                                  setTransactionRef(comm.transactionRef || '');
                                  setOverrideNotes(comm.notes || '');
                                }}
                                className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 hover:text-teal-700 font-bold text-[11px] border border-slate-200 dark:border-slate-700 transition"
                              >
                                টাকা এডিট / পে-আউট
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DOCTOR PRESCRIPTION PAD */}
      {activeTab === 'prescription' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>ডিজিটাল প্রেসক্রিপশন সেটআপ ও প্রিন্ট প্যাড (Doctor Prescription Pad)</span>
              </h3>
              <p className="text-xs text-slate-500">
                চেম্বার কনসালটেন্ট ডাক্তারদের জন্য প্রেসক্রিপশন তৈরি, ডায়াগনস্টিক টেস্ট পরামর্শ ও সরাসরি প্রিন্ট
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>প্রেসক্রিপশন প্রিন্ট দিন</span>
            </button>
          </div>

          {/* PRESCRIPTION EDITOR SHEET */}
          <div className="max-w-[850px] mx-auto bg-white text-slate-900 p-6 border-2 border-slate-300 rounded-2xl shadow-sm space-y-4 print:border-none print:p-0">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
              <div>
                <h2 className="text-xl font-black text-[#0f2744] tracking-tight">
                  SONALI DIAGNOSTIC CENTER
                </h2>
                <p className="text-[11px] font-bold text-teal-700">
                  সোনালী ডায়াগনস্টিক সেন্টার • কনসালটেশন চেম্বার
                </p>
                <p className="text-[10px] text-slate-500">Hospital Road, Dhaka | Helpline: 01711-000000</p>
              </div>

              {/* Doctor Selector */}
              <div className="text-right">
                <select
                  value={prescriptionDoctor ? String(prescriptionDoctor.id) : ''}
                  onChange={(e) => {
                    const doc = doctorsList.find((d) => String(d.id) === e.target.value);
                    if (doc) setPrescriptionDoctor(doc);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 font-bold text-xs bg-slate-50"
                >
                  {doctorsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialty})
                    </option>
                  ))}
                </select>
                {prescriptionDoctor && (
                  <div className="mt-1 text-[11px]">
                    <div className="font-bold text-slate-900">{prescriptionDoctor.name}</div>
                    <div className="text-slate-600 text-[10px]">{prescriptionDoctor.qualifications}</div>
                    <div className="text-teal-700 font-semibold text-[10px]">{prescriptionDoctor.specialty} • {prescriptionDoctor.roomNo}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Patient Meta Bar */}
            <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-sans">
              <div>
                <label className="text-[10px] text-slate-500 block">রোগীর নাম:</label>
                <input
                  type="text"
                  value={prescPatientName}
                  onChange={(e) => setPrescPatientName(e.target.value)}
                  placeholder="মোঃ আব্দুল করিম"
                  className="font-bold text-slate-900 bg-transparent w-full focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">বয়স ও লিঙ্গ:</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={prescPatientAge}
                    onChange={(e) => setPrescPatientAge(e.target.value)}
                    placeholder="45Y"
                    className="font-bold text-slate-900 bg-transparent w-12 focus:outline-none"
                  />
                  <select
                    value={prescPatientGender}
                    onChange={(e) => setPrescPatientGender(e.target.value)}
                    className="font-semibold text-slate-700 bg-transparent text-xs"
                  >
                    <option value="Male">M</option>
                    <option value="Female">F</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">মোবাইল:</label>
                <input
                  type="text"
                  value={prescPatientPhone}
                  onChange={(e) => setPrescPatientPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="font-mono text-slate-900 bg-transparent w-full focus:outline-none"
                />
              </div>
              <div className="text-right">
                <label className="text-[10px] text-slate-500 block">তারিখ:</label>
                <span className="font-mono font-bold text-slate-900">{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* Clinical Diagnosis Bar (BP & Weight removed) */}
            <div className="flex items-center gap-4 text-xs font-mono bg-white border border-slate-200 p-2 rounded-lg text-slate-700">
              <div className="flex items-center gap-1 flex-1">
                <span className="text-slate-400 font-sans text-[11px]">Diagnosis:</span>
                <input
                  type="text"
                  value={prescDiagnosis}
                  onChange={(e) => setPrescDiagnosis(e.target.value)}
                  className="w-full font-bold font-sans text-teal-800"
                />
              </div>
            </div>

            {/* Prescription Body: Left (Investigations & Complaints) | Right (Rx Medicines) */}
            <div className="grid grid-cols-12 gap-4 min-h-[350px]">
              {/* Left 4 cols: Chief complaints & Advised Investigations */}
              <div className="col-span-4 border-r border-slate-200 pr-3 space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">C/C (উপসর্গ):</h4>
                  <textarea
                    rows={2}
                    value={prescChiefComplaints}
                    onChange={(e) => setPrescChiefComplaints(e.target.value)}
                    className="w-full p-2 bg-slate-50 rounded border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                    <span>Advised Tests (পরীক্ষা):</span>
                  </div>
                  <div className="space-y-1.5">
                    {prescAdvisedTests.map((t, idx) => (
                      <div key={idx} className="flex justify-between items-center p-1.5 bg-teal-50/60 rounded border border-teal-100 text-[11px]">
                        <div>
                          <span className="font-bold text-slate-900">{t.testCode}</span>
                          <span className="text-[10px] text-slate-500 block">{t.testName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPrescAdvisedTests(prescAdvisedTests.filter((_, i) => i !== idx))}
                          className="text-rose-500 font-bold p-1 hover:bg-rose-50 rounded"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Test to Prescription */}
                  <select
                    onChange={(e) => {
                      const t = testsList.find((item) => item.code === e.target.value);
                      if (t && !prescAdvisedTests.some((ex) => ex.testCode === t.code)) {
                        setPrescAdvisedTests([...prescAdvisedTests, { testCode: t.code, testName: t.name, price: t.price }]);
                      }
                    }}
                    className="w-full mt-2 p-1.5 rounded border border-slate-200 text-[11px] bg-white font-medium"
                  >
                    <option value="">+ টেস্ট যুক্ত করুন</option>
                    {testsList.map((t) => (
                      <option key={t.id} value={t.code}>
                        {t.code} — {t.name} (৳{t.price})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right 8 cols: Rx Medicines */}
              <div className="col-span-8 pl-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black font-serif italic text-teal-800">℞</span>
                  <span className="text-xs font-bold text-slate-600">Prescribed Medicines</span>
                </div>

                <div className="space-y-2 text-xs">
                  {prescMedicines.map((med, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 text-sm">{idx + 1}. {med.name}</div>
                        <div className="text-slate-600 font-mono text-[11px]">
                          মাত্রা: <strong>{med.dosage}</strong> • {med.frequency} • {med.duration}
                        </div>
                        {med.instructions && (
                          <div className="text-[10px] text-teal-700 italic">{med.instructions}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setPrescMedicines(prescMedicines.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new medicine */}
                <button
                  type="button"
                  onClick={() => {
                    const name = prompt('ওষুধের নাম লিখুন (e.g. Tab. Ace Plus 500mg):');
                    if (name) {
                      setPrescMedicines([
                        ...prescMedicines,
                        { name, dosage: '1+0+1', frequency: 'খাবারের পর', duration: '৭ দিন', instructions: '' },
                      ]);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-dashed border-teal-500 text-teal-700 font-bold text-xs hover:bg-teal-50 flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ নতুন ওষুধ যোগ করুন</span>
                </button>

                {/* Advice Notes & Follow-up */}
                <div className="pt-3 border-t border-slate-200 text-xs">
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">পরামর্শ ও পরবর্তী সাক্ষাত:</label>
                  <input
                    type="text"
                    value={prescNextVisit}
                    onChange={(e) => setPrescNextVisit(e.target.value)}
                    className="w-full p-2 bg-slate-50 rounded border border-slate-200 font-semibold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Doctor Signature */}
            <div className="pt-8 flex justify-between items-end border-t border-slate-200 text-xs">
              <div className="text-[10px] text-slate-400 font-mono">
                Sonali Diagnostic Center • Digital Prescription Pad
              </div>
              <div className="text-center">
                <div className="w-36 border-t border-slate-600 mb-1"></div>
                <div className="font-bold text-slate-900">{prescriptionDoctor?.name}</div>
                <div className="text-[10px] text-slate-500">Chamber Consultant Signature</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CLINICAL PANEL SUGGESTER */}
      {activeTab === 'slipSuggester' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                স্মার্ট প্রেসক্রিপশন স্লিপ ও ডায়াগনস্টিক টেস্ট প্যানেল সাজেস্টার
              </h3>
              <p className="text-xs text-slate-500">
                ডাক্তার চেম্বারে বসে রোগীর উপসর্গ নির্বাচন করলেই সাথে সাথে প্রয়োজনীয় টেস্ট প্যানেল সুপারিশ করে রিসেপশনে বিলিংয়ের জন্য প্রস্তুত হয়
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                চেম্বার ডাক্তার নির্বাচন করুন
              </label>
              <select
                value={suggesterDoctor}
                onChange={(e) => setSuggesterDoctor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="">ডাক্তার বাছাই করুন</option>
                {doctorsList.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name} ({d.specialty})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                রোগীর নাম বা সিরিয়াল
              </label>
              <input
                type="text"
                value={suggesterPatient}
                onChange={(e) => setSuggesterPatient(e.target.value)}
                placeholder="যেমন: মোঃ রফিক (সিরিয়াল #০৩)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs mb-2">
              ক্লিনিক্যাল ইনভেস্টিগেশন প্যানেল সমূহ (১-ক্লিকে সিলেক্ট করুন):
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {CLINICAL_PANELS.map((p) => {
                const isSelected = selectedPanel === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPanel(p.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition text-xs flex flex-col justify-between ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white mb-2">
                        <span>{p.title}</span>
                        <span className="font-mono text-teal-600">{p.total}</span>
                      </div>
                      <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                        {p.tests.map((t, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] font-bold">
                      <span className={isSelected ? 'text-teal-600' : 'text-slate-400'}>
                        {isSelected ? '✓ নির্বাচিত' : 'ক্লিক করে বাছাই করুন'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                if (!suggesterDoctor || !selectedPanel) {
                  return;
                }
                setSuggesterSuccess(
                  'প্রেসক্রিপশন স্লিপ সফলভাবে তৈরি হয়েছে এবং ডায়াগনস্টিক কাউন্টারে পাঠানো হয়েছে!'
                );
                setTimeout(() => setSuggesterSuccess(''), 4000);
              }}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>প্রেসক্রিপশন স্লিপ সাবমিট করুন (কাউন্টারে যাবে)</span>
            </button>

            {suggesterSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{suggesterSuccess}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DEDICATED COMMISSION STRUCTURE MODAL (USER REQUEST) */}
      {commissionStructureDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border-2 border-amber-300 dark:border-amber-700 my-8 text-xs space-y-4">
            <button
              onClick={() => setCommissionStructureDoctor(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-3 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-xl">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  কমিশন ও অনারিয়াম স্ট্রাকচার নির্ধারণ (Edit Commission)
                </h3>
                <p className="text-[11px] text-slate-500">
                  ডাক্তার: <strong className="text-slate-900 dark:text-white">{commissionStructureDoctor.name}</strong> ({commissionStructureDoctor.specialty})
                </p>
              </div>
            </div>

            {/* Explanation of the requested calculation rule */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-[11px] text-blue-900 dark:text-blue-200 leading-relaxed space-y-1">
              <div className="font-bold flex items-center gap-1">
                <span>💡 অনারিয়াম হিসাব পদ্ধতি:</span>
              </div>
              <p>
                ১. প্রতি আল্ট্রাসনো (USG) বাবদ ডাক্তার <strong>৳৩০০ ফিক্সড</strong> পাবেন।<br />
                ২. অন্যান্য সকল ডায়াগনস্টিক টেস্টের ক্ষেত্রে রোগীর মোট বিল থেকে আল্ট্রার টাকা এবং ডিসকাউন্ট বাদ যাওয়ার পর অবশিষ্ট টাকার উপর নির্ধারিত <strong>২০-২৫-৩০%</strong> কমিশন পাবেন।
              </p>
            </div>

            <form onSubmit={handleSaveCommissionStructure} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    প্রতি আল্ট্রাসনো ফিক্সড ফি (৳) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={structureForm.usgFixedCommission}
                    onChange={(e) => setStructureForm({ ...structureForm, usgFixedCommission: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-teal-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">ডিফল্ট: ৳৩০০ প্রতি আল্ট্রা</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    অন্যান্য টেস্ট কমিশন হার (%) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={structureForm.generalTestCommissionRate}
                    onChange={(e) => setStructureForm({ ...structureForm, generalTestCommissionRate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-teal-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">২০, ২৫, বা ৩০ শতাংশ</span>
                </div>
              </div>

              {/* Quick payout mobile & bank info */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>তাৎক্ষণিক পেমেন্টের জন্য ডাক্তারের অ্যাকাউন্ট তথ্য</span>
                </h4>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    বিকাশ নম্বর (bKash Number for Quick Payout)
                  </label>
                  <input
                    type="tel"
                    value={structureForm.bkashNumber}
                    onChange={(e) => setStructureForm({ ...structureForm, bkashNumber: e.target.value })}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ব্যাংক অ্যাকাউন্ট নম্বর
                    </label>
                    <input
                      type="text"
                      value={structureForm.bankAccount}
                      onChange={(e) => setStructureForm({ ...structureForm, bankAccount: e.target.value })}
                      placeholder="e.g. 2050XXXXXXXXX"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ব্যাংকের নাম ও শাখা
                    </label>
                    <input
                      type="text"
                      value={structureForm.bankName}
                      onChange={(e) => setStructureForm({ ...structureForm, bankName: e.target.value })}
                      placeholder="e.g. Islami Bank, Dhanmondi"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCommissionStructureDoctor(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  স্ট্রাকচার সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CALL LOGGING MODAL */}
      {callLogAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4">
            <button
              onClick={() => setCallLogAppointment(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-emerald-600" />
              <span>রোগীর কল রেকর্ড ও অবস্থা (Call Log)</span>
            </h3>
            <p className="text-slate-500">
              রোগী: <strong>{callLogAppointment.patientName}</strong> ({callLogAppointment.patientPhone})
            </p>

            <form onSubmit={handleSaveCallLog} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  কলের অবস্থা (Call Status) *
                </label>
                <select
                  value={callStatus}
                  onChange={(e) => setCallStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                >
                  <option value="Connected">ফোন ধরেছে ও কথা হয়েছে (Connected / Answered)</option>
                  <option value="No Answer">ফোন রিং হয়েছে কিন্তু ধরেনি (No Answer / Busy)</option>
                  <option value="Switched Off">ফোন বন্ধ ছিল (Switched Off)</option>
                  <option value="Wrong Number">ভুল নম্বর (Wrong Number)</option>
                  <option value="Missed Call">মিসড কল গেছে (Missed Call)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  কত সেকেন্ড কথা হয়েছে (Call Duration Seconds)
                </label>
                <input
                  type="number"
                  min={0}
                  value={callDurationSeconds}
                  onChange={(e) => setCallDurationSeconds(e.target.value)}
                  placeholder="e.g. 45"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  কল সম্পর্কিত নোট
                </label>
                <input
                  type="text"
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="e.g. সিরিয়ালের সময়মতো আসবেন বলেছেন"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCallLogAppointment(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  লগ সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FEEDBACK & FOLLOW-UP MODAL */}
      {feedbackAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4">
            <button
              onClick={() => setFeedbackAppointment(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-600" />
              <span>রোগীর ফলো-আপ ও ফিডব্যাক (Patient Feedback)</span>
            </h3>
            <p className="text-slate-500">
              রোগী: <strong>{feedbackAppointment.patientName}</strong> (ডাক্তার: {feedbackAppointment.doctorName})
            </p>

            <form onSubmit={handleSaveFeedback} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  বর্তমান অবস্থা / ফিডব্যাক
                </label>
                <select
                  value={feedbackStatus}
                  onChange={(e) => setFeedbackStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                >
                  <option value="Satisfied">চিকিৎসায় সন্তুষ্ট ও সুস্থ (Satisfied)</option>
                  <option value="Medicines Started">ওষুধ সেবন করছেন ও উন্নতি হচ্ছে (Medicines Started)</option>
                  <option value="Report Pending">টেস্ট রিপোর্ট দেখাবেন (Report Pending)</option>
                  <option value="Needs Follow-up">পুনরায় ডাক্তারের পরামর্শ প্রয়োজন (Needs Follow-up)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  রোগীর মন্তব্য ও নোট
                </label>
                <textarea
                  rows={3}
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="রোগীর বক্তব্য বা ফলো-আপ পরামর্শ লিখুন..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              {feedbackSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold">
                  {feedbackSuccessMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFeedbackAppointment(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  ফিডব্যাক সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMMISSION PAYOUT & OVERRIDE MODAL */}
      {payoutCommission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4 my-8">
            <button
              onClick={() => setPayoutCommission(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-teal-600" />
              <span>ডাক্তার অনারিয়াম টাকা এডিট ও পে-আউট (Payout Settlement)</span>
            </h3>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                <span>{payoutCommission.doctorName}</span>
                <span className="font-mono text-teal-600">ইনভয়েস: {payoutCommission.invoiceNumber}</span>
              </div>
              <div className="text-slate-500 text-[11px]">
                রোগী: {payoutCommission.patientName} • মোট বিল: ৳{payoutCommission.billTotal}
              </div>
            </div>

            <form onSubmit={handleSaveCommissionPayout} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  অনুমোদিত অনারিয়াম টাকা (সরাসরি কম-বেশি এডিট করুন) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-500">৳</span>
                  <input
                    type="number"
                    min={0}
                    required
                    value={overrideAmount}
                    onChange={(e) => setOverrideAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border-2 border-teal-500 font-mono font-black text-base text-teal-900 dark:text-teal-200 bg-white dark:bg-slate-800"
                  />
                </div>
                <div className="flex gap-2 mt-1.5 text-[10px]">
                  <span className="text-slate-400">দ্রুত সেট:</span>
                  <button
                    type="button"
                    onClick={() => setOverrideAmount('500')}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border font-bold"
                  >
                    ৳৫০০
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideAmount('600')}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border font-bold"
                  >
                    ৳৬০০
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideAmount(payoutCommission.calculatedAmount)}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border font-bold text-teal-600"
                  >
                    মূল হিসাব (৳{payoutCommission.calculatedAmount})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    পেমেন্ট স্ট্যাটাস
                  </label>
                  <select
                    value={overrideStatus}
                    onChange={(e) => setOverrideStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="Approved">অনুমোদিত (Approved - পরিশোধের অপেক্ষায়)</option>
                    <option value="Paid">পরিশোধিত (Paid - টাকা দেওয়া হয়েছে)</option>
                    <option value="Pending">পেন্ডিং (Pending)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    পেমেন্ট মাধ্যম
                  </label>
                  <select
                    value={overridePaymentMethod}
                    onChange={(e) => setOverridePaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="bKash">বিকাশ (bKash)</option>
                    <option value="Nagad">নগদ (Nagad)</option>
                    <option value="Bank Transfer">ব্যাংক ট্রান্সফার (Bank)</option>
                    <option value="Cash">ক্যাশ (Cash)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ট্রানজেকশন আইডি / রেফারেন্স (যদি থাকে)
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. bKash TrxID: 9B76A2XX"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPayoutCommission(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  টাকা সংরক্ষণ ও পে-আউট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCTOR ENTRY & EDIT MODAL */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs my-8 space-y-4">
            <button
              onClick={() => setShowAddDoctorModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingDoctor ? 'ডাক্তার তথ্য ও প্রোফাইল এডিট করুন' : 'নতুন ডাক্তার এন্ট্রি করুন (Doctor Registration)'}
            </h3>

            <form onSubmit={handleSaveDoctor} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ডাক্তারের নাম *
                </label>
                <input
                  type="text"
                  required
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                  placeholder="e.g. Prof. Dr. M. A. Bashar"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ডিগ্রি ও পদবী *
                  </label>
                  <input
                    type="text"
                    required
                    value={doctorForm.qualifications}
                    onChange={(e) => setDoctorForm({ ...doctorForm, qualifications: e.target.value })}
                    placeholder="MBBS, FCPS, MD"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    বিশেষজ্ঞতা *
                  </label>
                  <input
                    type="text"
                    required
                    value={doctorForm.specialty}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
                    placeholder="Cardiologist & Medicine"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ভিজিট ফি (৳)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={doctorForm.fee}
                    onChange={(e) => setDoctorForm({ ...doctorForm, fee: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    রুম নং
                  </label>
                  <input
                    type="text"
                    value={doctorForm.roomNo}
                    onChange={(e) => setDoctorForm({ ...doctorForm, roomNo: e.target.value })}
                    placeholder="Room 101"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="tel"
                    value={doctorForm.phone}
                    onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    চেম্বারের দিন
                  </label>
                  <input
                    type="text"
                    value={doctorForm.chamberDays}
                    onChange={(e) => setDoctorForm({ ...doctorForm, chamberDays: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    চেম্বারের সময়
                  </label>
                  <input
                    type="text"
                    value={doctorForm.chamberTime}
                    onChange={(e) => setDoctorForm({ ...doctorForm, chamberTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Commission rates setup */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60 space-y-2">
                <span className="font-bold text-amber-900 dark:text-amber-200 block">
                  রেফারেল অনারিয়াম ও পেমেন্ট নম্বর
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">USG ফিক্সড ফি (৳)</label>
                    <input
                      type="number"
                      value={doctorForm.usgFixedCommission}
                      onChange={(e) => setDoctorForm({ ...doctorForm, usgFixedCommission: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg border font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">অন্যান্য টেস্ট হার (%)</label>
                    <input
                      type="number"
                      value={doctorForm.generalTestCommissionRate}
                      onChange={(e) => setDoctorForm({ ...doctorForm, generalTestCommissionRate: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg border font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">বিকাশ নম্বর</label>
                    <input
                      type="tel"
                      value={doctorForm.bkashNumber}
                      onChange={(e) => setDoctorForm({ ...doctorForm, bkashNumber: e.target.value })}
                      placeholder="017XXXXXXXX"
                      className="w-full px-2 py-1.5 rounded-lg border font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOOK SERIAL MODAL (8-Point Verified Reception Parity) */}
      {showBookModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4 my-6 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowBookModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-600" />
                <span>চেম্বার সিরিয়াল বুকিং ও শিডিউলিং</span>
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                ডাক্তার: <strong>{selectedDoctor.name}</strong> ({selectedDoctor.specialty}) • মূল ভিজিট ফি: ৳{selectedDoctor.fee}
              </p>
            </div>

            {bookFormError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bookFormError}</span>
              </div>
            )}

            {/* (3) Live Patient ID Preview (Last 6 Digits / অন্যান্য + Duplicate -2/-3) */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>রোগী আইডি (মোবাইলের শেষ ৬ সংখ্যা / অন্যান্য)</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 font-mono font-bold text-teal-700 dark:text-teal-300">
                  {liveBookPatientId.id || 'শেষ ৬ সংখ্যা'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={bookData.isNoMobileWorkaround}
                  onClick={() => setBookData({ ...bookData, idMode: 'mobile' })}
                  className={`py-1.5 px-2.5 rounded-lg border text-[11px] font-bold text-left transition ${
                    bookData.idMode === 'mobile' && !bookData.isNoMobileWorkaround
                      ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-800 dark:text-teal-200'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-50'
                  }`}
                >
                  মোবাইলের শেষ ৬ সংখ্যা
                </button>
                <button
                  type="button"
                  onClick={() => setBookData({ ...bookData, idMode: 'other' })}
                  className={`py-1.5 px-2.5 rounded-lg border text-[11px] font-bold text-left transition ${
                    bookData.idMode === 'other' || bookData.isNoMobileWorkaround
                      ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-800 dark:text-teal-200'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  অন্যান্য (অটো সিরিয়াল)
                </button>
              </div>
              {liveBookPatientId.isCollision && (
                <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
                  আইডি <strong>{liveBookPatientId.baseId}</strong> ইতোমধ্যে আছে — স্বয়ংক্রিয়ভাবে{' '}
                  <strong className="font-mono">{liveBookPatientId.id}</strong> নির্ধারিত হবে।
                </div>
              )}
            </div>

            {/* (5) Doctor Switcher + Auto Chamber Date & Fee */}
            {doctorsList.length > 1 && (
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  চেম্বার ডাক্তার নির্বাচন *
                </label>
                <select
                  value={selectedDoctor.id}
                  onChange={(e) => {
                    const nextDoc = doctorsList.find((d) => String(d.id) === e.target.value);
                    if (nextDoc) {
                      setSelectedDoctor(nextDoc);
                      const autoDate = getNextAvailableDoctorDate(nextDoc.chamberDays);
                      setBookData((prev) => ({
                        ...prev,
                        appointmentDate: autoDate,
                        customDayInput: '',
                        feeOption: 'standard',
                        customFeeAmount: '',
                        waiverReasonPreset: '',
                        waiverReason: '',
                      }));
                      setBookCustomDayError(null);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                >
                  {doctorsList.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} — {doc.specialty} (৳{formatBengaliNumber(doc.fee)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Doctor Chamber Schedule Days (Bengali Badges) */}
            <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-teal-900 dark:text-teal-200">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  চেম্বার বারের তালিকা:
                </span>
                <span className="text-[10px] text-teal-700 dark:text-teal-400 font-mono">
                  {selectedDoctor.chamberTime || 'বিকেল ৫:০০ - রাত ৯:০০'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {getDoctorDayPills(selectedDoctor.chamberDays).map((pill) => (
                  <span
                    key={pill.dayIndex}
                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 border ${
                      pill.isOpen
                        ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 line-through opacity-70'
                    }`}
                  >
                    {pill.nameBn}
                    {pill.isOpen && <span className="text-[9px] font-normal">✓</span>}
                  </span>
                ))}
              </div>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-3.5">
              {/* Patient Basic Info — (4) English keyboard on Name, numeric keypad on Age */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    রোগীর নাম *
                  </label>
                  <input
                    type="text"
                    lang="en"
                    autoCapitalize="words"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                    value={bookData.patientName}
                    onChange={(e) => setBookData({ ...bookData, patientName: e.target.value })}
                    placeholder="e.g. Fatema Begum"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  />
                </div>

                {/* Gender - Default Female */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    লিঙ্গ (Gender) * <span className="text-[10px] font-normal text-teal-600">(ডিফল্ট: মহিলা)</span>
                  </label>
                  <select
                    value={bookData.patientGender}
                    onChange={(e) => setBookData({ ...bookData, patientGender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    <option value="Female">মহিলা (Female)</option>
                    <option value="Male">পুরুষ (Male)</option>
                    <option value="Other">অন্যান্য (Other)</option>
                  </select>
                </div>

                {/* Age */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    বয়স (Age)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={bookData.patientAge}
                    onChange={(e) =>
                      setBookData({
                        ...bookData,
                        patientAge: toAsciiDigits(e.target.value).replace(/\D/g, '').slice(0, 3),
                      })
                    }
                    placeholder="e.g. 35"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              {/* (1) & (2) Mobile Number: Fixed 01 Prefix + 9 Numeric Digits + Clinic Proxy Lock + 🔒 খুলুন */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    মোবাইল নম্বর * {!bookData.isNoMobileWorkaround && `(${toBengaliDigits(2 + bookData.mobileRemainder.length)}/১১ সংখ্যা)`}
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bookData.isNoMobileWorkaround}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setBookData({
                          ...bookData,
                          isNoMobileWorkaround: checked,
                          idMode: checked ? 'other' : 'mobile',
                        });
                      }}
                      className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>রোগীর নিজস্ব মোবাইল নম্বর নেই (ক্লিনিক নম্বর)</span>
                  </label>
                </div>

                <div className="flex items-stretch gap-2">
                  <div
                    className={`flex-1 flex items-center rounded-xl border overflow-hidden ${
                      bookData.isNoMobileWorkaround
                        ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/40'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <span className="px-3 py-2 bg-slate-100 dark:bg-slate-700 border-r border-slate-200 dark:border-slate-600 font-mono font-bold text-slate-700 dark:text-slate-200 select-none">
                      01
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={9}
                      required={!bookData.isNoMobileWorkaround}
                      disabled={bookData.isNoMobileWorkaround}
                      value={bookData.isNoMobileWorkaround ? '700000000' : bookData.mobileRemainder}
                      onChange={(e) =>
                        setBookData({
                          ...bookData,
                          mobileRemainder: normalizeBdMobileRemainder(e.target.value),
                        })
                      }
                      placeholder="711223344"
                      className={`flex-1 px-3 py-2 bg-transparent font-mono font-bold focus:outline-none ${
                        bookData.isNoMobileWorkaround ? 'text-amber-900 dark:text-amber-200' : 'text-slate-900 dark:text-white'
                      }`}
                    />
                  </div>
                  {bookData.isNoMobileWorkaround && (
                    <button
                      type="button"
                      onClick={() =>
                        setBookData({
                          ...bookData,
                          isNoMobileWorkaround: false,
                          mobileRemainder: '',
                          idMode: 'mobile',
                        })
                      }
                      className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 font-bold text-[11px] flex items-center gap-1 shrink-0 hover:bg-amber-100"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>🔒 খুলুন</span>
                    </button>
                  )}
                </div>

                {bookData.isNoMobileWorkaround && (
                  <div className="p-2 rounded-lg bg-amber-100/70 dark:bg-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      ক্লিনিক প্রক্সি নম্বর <strong>01700000000</strong> লক করা আছে। পরিবর্তন করতে “🔒 খুলুন” চাপুন।
                    </span>
                  </div>
                )}
              </div>

              {/* Patient Address — (4) English keyboard ergonomics + Autocomplete */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ঠিকানা / এলাকা (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  lang="en"
                  autoCapitalize="words"
                  autoCorrect="off"
                  spellCheck={false}
                  list="doctorPatientLocations"
                  value={bookData.patientAddress}
                  onChange={(e) => setBookData({ ...bookData, patientAddress: e.target.value })}
                  placeholder="e.g. Zindabazar, Sylhet"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <datalist id="doctorPatientLocations">
                  {DEFAULT_CATCHMENT_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
              </div>

              {/* (7) Blood Group + Willing Blood Donor Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    রক্তের গ্রুপ (ঐচ্ছিক)
                  </label>
                  <select
                    value={bookData.bloodGroup}
                    onChange={(e) => setBookData({ ...bookData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="">বাছাই করুন</option>
                    <option value="A+Positive">A+ (এ পজিটিভ)</option>
                    <option value="A-Negative">A- (এ নেগেটিভ)</option>
                    <option value="B+Positive">B+ (বি পজিটিভ)</option>
                    <option value="B-Negative">B- (বি নেগেটিভ)</option>
                    <option value="O+Positive">O+ (ও পজিটিভ)</option>
                    <option value="O-Negative">O- (ও নেগেটিভ)</option>
                    <option value="AB+Positive">AB+ (এবি পজিটিভ)</option>
                    <option value="AB-Negative">AB- (এবি নেগেটিভ)</option>
                  </select>
                </div>

                <label className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={bookData.willingToDonateBlood}
                    onChange={(e) => setBookData({ ...bookData, willingToDonateBlood: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1 text-[11px]">
                      <Droplet className="w-3 h-3 text-rose-600" />
                      <span>রক্তদানে ইচ্ছুক</span>
                    </span>
                    <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80 block">
                      রক্তদাতা তালিকায় যুক্ত হবে
                    </span>
                  </div>
                </label>
              </div>

              {/* (5) Appointment Date + "অন্য দিন" (শুধু দিন) */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>সিরিয়ালের তারিখ *</span>
                  <span className="text-[10px] text-slate-400">অতীতের তারিখ লক করা</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={bookData.appointmentDate}
                    onChange={(e) => {
                      setBookData({ ...bookData, appointmentDate: e.target.value, customDayInput: '' });
                      setBookCustomDayError(null);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                      অন্য দিন (শুধু দিন):
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={bookData.customDayInput}
                      onChange={(e) => {
                        const cleanDigits = toAsciiDigits(e.target.value).replace(/\D/g, '').slice(0, 2);
                        setBookData((prev) => ({ ...prev, customDayInput: cleanDigits }));
                        if (!cleanDigits) {
                          setBookCustomDayError(null);
                          return;
                        }
                        const resolved = resolveDayOfMonthToIsoDate(cleanDigits);
                        if (!resolved.valid) {
                          setBookCustomDayError(resolved.error || 'সঠিক দিন লিখুন।');
                          return;
                        }
                        setBookCustomDayError(null);
                        if (resolved.iso) {
                          setBookData((prev) => ({ ...prev, appointmentDate: resolved.iso! }));
                        }
                      }}
                      placeholder="২৫"
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-bold"
                    />
                  </div>
                </div>

                {bookCustomDayError && (
                  <p className="text-[11px] font-semibold text-rose-600">{bookCustomDayError}</p>
                )}

                {bookData.appointmentDate && (
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-teal-800 dark:text-teal-300 flex items-center justify-between gap-1.5 bg-teal-50 dark:bg-teal-950/50 px-2.5 py-1 rounded-lg">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        <span>বার: {getOnlyBengaliDay(bookData.appointmentDate)}</span>
                      </span>
                      <span className="font-mono">{formatBengaliDDMMYYYY(bookData.appointmentDate)}</span>
                    </div>

                    {!isDoctorAvailableOnDay(selectedDoctor.chamberDays, bookData.appointmentDate) && (
                      <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>
                          সতর্কতা: শিডিউল অনুযায়ী এই দিনে ড. {selectedDoctor.name}-এর চেম্বার বন্ধ থাকতে পারে।
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* (6) Visit Fee Card + Bottom Sheet Trigger ("🔒 পরিবর্তন") */}
              <div className="p-3 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/20 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-bold text-slate-500">
                      {parseFloat(selectedDoctor.fee) === 20
                        ? 'রেজিস্ট্রেশন / টিকিট ফি (ফ্রি করা যাবে)'
                        : 'ডাক্তারের ভিজিট ফি'}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono font-black text-base text-teal-700 dark:text-teal-300 tabular-nums">
                        ৳{bookData.feeOption === 'waived' ? '০ (ফ্রি)' : bookData.feeOption === 'custom' ? formatBengaliNumber(bookData.customFeeAmount || '0') : formatBengaliNumber(selectedDoctor.fee)}
                      </span>
                      {bookData.feeOption !== 'standard' && (
                        <span className="text-[11px] line-through text-slate-400 tabular-nums">
                          ৳{formatBengaliNumber(selectedDoctor.fee)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {bookData.feeOption !== 'waived' && (
                      <button
                        type="button"
                        onClick={() => {
                          setTempBookFee('0');
                          setTempBookReasonPreset(bookData.waiverReasonPreset);
                          setTempBookCustomReason(bookData.waiverReason);
                          setBookFeeSheetError(null);
                          setShowBookFeeSheet(true);
                        }}
                        className="px-2.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-bold text-xs whitespace-nowrap"
                      >
                        ফ্রি করুন (৳০)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const currentFee =
                          bookData.feeOption === 'waived'
                            ? '0'
                            : bookData.feeOption === 'custom'
                            ? bookData.customFeeAmount || selectedDoctor.fee
                            : selectedDoctor.fee;
                        setTempBookFee(currentFee);
                        setTempBookReasonPreset(bookData.waiverReasonPreset);
                        setTempBookCustomReason(bookData.waiverReason);
                        setBookFeeSheetError(null);
                        setShowBookFeeSheet(true);
                      }}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>🔒 পরিবর্তন</span>
                    </button>
                  </div>
                </div>

                {bookData.feeOption !== 'standard' && (
                  <div className="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
                    কারণ: <strong>{[bookData.waiverReasonPreset, bookData.waiverReason].filter(Boolean).join(' - ') || 'ফি সমন্বয়'}</strong>
                  </div>
                )}
              </div>

              {/* (8) Marketing Source, Representative & Auto + Manual Editable Honorarium */}
              <div className="space-y-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/30">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      মার্কেটিং মাধ্যম
                    </label>
                    <select
                      value={bookData.marketingSource}
                      onChange={(e) => setBookData({ ...bookData, marketingSource: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                    >
                      <option value="Direct Walk-in">সরাসরি ওয়াক-ইন</option>
                      <option value="Marketing Rep">মার্কেটিং প্রতিনিধি</option>
                      <option value="Social Media / Facebook">সোশ্যাল মিডিয়া/ফেসবুক</option>
                      <option value="Campaign / Leaflet">ক্যাম্পেইন</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      মার্কেটিং প্রতিনিধি
                    </label>
                    <select
                      value={bookData.marketingRepId}
                      onChange={(e) => {
                        const repId = e.target.value;
                        const matched = marketingRepsList.find((m) => String(m.id) === String(repId));
                        setBookData({
                          ...bookData,
                          marketingRepId: repId,
                          marketingSource: matched ? 'Marketing Rep' : bookData.marketingSource,
                          marketingHonorarium: matched ? matched.defaultHonorarium || '150' : '',
                        });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                    >
                      <option value="">প্রযোজ্য নয়</option>
                      {marketingRepsList.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.isFemaleRep ? '👩‍💼' : ''} — ৳{m.defaultHonorarium || '150'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-teal-600" />
                    <span>মার্কেটিং প্রতিনিধির সম্মানী (৳ — অটো ও ম্যানুয়াল এডিট)</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={bookData.marketingHonorarium}
                    onChange={(e) =>
                      setBookData({
                        ...bookData,
                        marketingHonorarium: toAsciiDigits(e.target.value).replace(/\D/g, ''),
                      })
                    }
                    placeholder="প্রতিনিধি বাছাইয়ে অটো বসবে (হাতে বদলানো যাবে)"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Payment & Auto-SMS */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                {bookData.feeOption !== 'waived' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="bookFeePaid"
                      checked={bookData.feePaid}
                      onChange={(e) => setBookData({ ...bookData, feePaid: e.target.checked })}
                      className="rounded text-teal-600"
                    />
                    <label htmlFor="bookFeePaid" className="font-semibold text-slate-700 dark:text-slate-300">
                      ভিজিট ফি জমা নেওয়া হয়েছে
                    </label>
                  </div>
                )}

                {/* Auto-SMS Toggle */}
                <div className={`flex items-center gap-2.5 p-2 rounded-xl border ${
                  bookData.isNoMobileWorkaround
                    ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60'
                    : 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800'
                }`}>
                  <input
                    type="checkbox"
                    id="autoSmsToggle"
                    disabled={bookData.isNoMobileWorkaround}
                    checked={autoSmsEnabled && !bookData.isNoMobileWorkaround}
                    onChange={(e) => setAutoSmsEnabled(e.target.checked)}
                    className="rounded text-teal-600 w-4 h-4 cursor-pointer"
                  />
                  <label
                    htmlFor="autoSmsToggle"
                    className="font-bold text-teal-900 dark:text-teal-200 text-[11px] cursor-pointer flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                    <span>
                      {bookData.isNoMobileWorkaround
                        ? 'প্রক্সি নম্বরে এসএমএস বন্ধ রাখা হয়েছে (Auto-SMS Suppressed for Proxy Phone)'
                        : 'সিরিয়াল এন্ট্রিতে অটো এসএমএস পাঠান (Auto-SMS Notification)'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition shadow-md"
                >
                  সিরিয়াল নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* (6) BOTTOM SHEET FOR VISIT FEE CUSTOMIZATION IN DOCTOR BOOKING */}
      {showBookFeeSheet && selectedDoctor && (
        <div
          className="fixed inset-0 z-60 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-xs md:p-4"
          onClick={() => setShowBookFeeSheet(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full md:max-w-md rounded-t-[22px] md:rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  ভিজিট ফি পরিবর্তন
                </h4>
                <p className="text-xs text-slate-500">
                  ডাক্তারের মূল ফি: ৳{formatBengaliNumber(selectedDoctor.fee)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBookFeeSheet(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  নতুন ভিজিট ফি (৳) — ০ দিলে সম্পূর্ণ ফ্রি
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={tempBookFee}
                  onChange={(e) => {
                    setTempBookFee(toAsciiDigits(e.target.value).replace(/\D/g, ''));
                    setBookFeeSheetError(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-base font-bold font-mono"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTempBookFee('0');
                      setBookFeeSheetError(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold"
                  >
                    ০ টাকা (ফি মওকুফ)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempBookFee(String(selectedDoctor.fee || '800'));
                      setTempBookReasonPreset('');
                      setTempBookCustomReason('');
                      setBookFeeSheetError(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                  >
                    মূল ফি (৳{formatBengaliNumber(selectedDoctor.fee)})
                  </button>
                </div>
              </div>

              {Number(toAsciiDigits(tempBookFee) || 0) < (parseFloat(selectedDoctor.fee) || 0) && (
                <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
                  <label className="block font-bold text-amber-900 dark:text-amber-200">
                    ফি কমানোর কারণ * (বাধ্যতামূলক)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['গরিব রোগী', 'স্টাফ', 'অন্যান্য'] as const).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setTempBookReasonPreset(preset);
                          setBookFeeSheetError(null);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold border transition ${
                          tempBookReasonPreset === preset
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  {tempBookReasonPreset && (
                    <input
                      type="text"
                      lang="en"
                      value={tempBookCustomReason}
                      onChange={(e) => {
                        setTempBookCustomReason(e.target.value);
                        setBookFeeSheetError(null);
                      }}
                      placeholder={
                        tempBookReasonPreset === 'অন্যান্য'
                          ? 'কারণ লিখুন (বাধ্যতামূলক)...'
                          : 'অতিরিক্ত নোট (ঐচ্ছিক)...'
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  )}
                </div>
              )}

              {bookFeeSheetError && (
                <p className="font-bold text-rose-600">{bookFeeSheetError}</p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowBookFeeSheet(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  const clean = toAsciiDigits(tempBookFee).replace(/\D/g, '');
                  const orig = parseFloat(selectedDoctor.fee) || 0;
                  if (clean === '') {
                    setBookFeeSheetError('সঠিক ফি লিখুন।');
                    return;
                  }
                  const val = parseInt(clean, 10);
                  if (val < orig) {
                    if (!tempBookReasonPreset) {
                      setBookFeeSheetError('মূল ফি থেকে কম হলে কারণ নির্বাচন করুন।');
                      return;
                    }
                    if (tempBookReasonPreset === 'অন্যান্য' && !tempBookCustomReason.trim()) {
                      setBookFeeSheetError('“অন্যান্য” নির্বাচন করলে কারণটি লিখুন।');
                      return;
                    }
                  }
                  const nextOption: 'standard' | 'waived' | 'custom' =
                    val === 0 ? 'waived' : val === orig ? 'standard' : 'custom';
                  setBookData({
                    ...bookData,
                    feeOption: nextOption,
                    customFeeAmount: nextOption === 'custom' ? String(val) : '',
                    waiverReasonPreset: val < orig ? tempBookReasonPreset : '',
                    waiverReason: val < orig ? tempBookCustomReason.trim() : '',
                  });
                  setShowBookFeeSheet(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
              >
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSTANT APPOINTMENT NOTIFICATION & SMS MODAL */}
      {appointmentNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border-2 border-teal-500 my-8 text-xs text-center space-y-4">
            <button
              onClick={() => setAppointmentNotice(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 dark:border-teal-800 mb-1">
                তাৎক্ষণিক নোটিফিকেশন এসএমএস
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                অ্যাপয়েন্টমেন্ট সিরিয়াল নিশ্চিত হয়েছে!
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                রোগী: <strong className="text-slate-800 dark:text-slate-200">{appointmentNotice.patientName}</strong> ({appointmentNotice.patientPhone})
              </p>
            </div>

            {/* Chamber Serial Token Badge */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50 via-slate-50 to-teal-50 dark:from-slate-800 dark:to-slate-800/80 border border-teal-200 dark:border-teal-800 space-y-1 text-center shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 block">
                সোনালী ডায়াগনস্টিক সেন্টার • চেম্বার সিরিয়াল
              </span>
              <div className="text-3xl font-black font-mono text-[#0f2744] dark:text-teal-400">
                সিরিয়াল #{appointmentNotice.serialNumber}
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {appointmentNotice.doctorName}
              </div>
              <div className="text-[11px] text-slate-500">
                {appointmentNotice.doctorSpecialty}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 pt-1 font-semibold flex items-center justify-center gap-3">
                <span>রুম: {appointmentNotice.chamberRoom || 'চেম্বার ১০১'}</span>
                <span>•</span>
                <span>তারিখ: {appointmentNotice.appointmentDate}</span>
                <span>•</span>
                <span className="text-teal-700 dark:text-teal-400 font-bold">ফি: ৳{appointmentNotice.fee} (জমা)</span>
              </div>
            </div>

            {/* SMS Message Box */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-left space-y-2.5">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-bold">
                <div className="flex items-center gap-1.5 text-xs text-teal-700 dark:text-teal-300">
                  <MessageSquare className="w-4 h-4" />
                  <span>রোগীর মোবাইলে এসএমএস বার্তা (SMS Notification)</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  {serverSmsSent ? 'সার্ভার এসএমএস প্রেরিত ✓' : 'প্রস্তুত'}
                </span>
              </div>

              <textarea
                value={appointmentNotice.smsText}
                onChange={(e) =>
                  setAppointmentNotice({
                    ...appointmentNotice,
                    smsText: e.target.value,
                  })
                }
                rows={3}
                className="w-full text-[11px] font-sans text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 leading-relaxed focus:ring-2 focus:ring-teal-500"
              />

              {/* Action Buttons Row: Device SMS, WhatsApp, Copy, Server Send */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {/* 1. Mobile SMS App Intent */}
                <a
                  href={`sms:${appointmentNotice.patientPhone}?body=${encodeURIComponent(appointmentNotice.smsText)}`}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-xs text-center transition"
                  title="মোবাইল বা ট্যাবের সরাসরি মেসেজ অ্যাপে ওপেন করুন"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>মোবাইল SMS</span>
                </a>

                {/* 2. WhatsApp Direct */}
                <a
                  href={`https://wa.me/88${appointmentNotice.patientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(appointmentNotice.smsText)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs text-center transition"
                  title="রোগীর নম্বরে সরাসরি হোয়াটসঅ্যাপ বার্তা দিন"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                {/* 3. 1-Click Copy */}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(appointmentNotice.smsText);
                    setSmsCopied(true);
                    setTimeout(() => setSmsCopied(false), 2500);
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-bold text-[11px] text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{smsCopied ? 'কপি হয়েছে ✓' : 'টেক্সট কপি'}</span>
                </button>

                {/* 4. Server Auto-SMS Gateway */}
                <button
                  type="button"
                  onClick={handleTriggerServerSms}
                  disabled={serverSmsSent}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-bold text-[11px] transition ${
                    serverSmsSent
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-[#0f2744] hover:bg-[#1a3a5f] text-white shadow-xs'
                  }`}
                  title="সেন্টারের অটোমেটেড এসএমএস গেটওয়ে থেকে পাঠান"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{serverSmsSent ? 'পাঠানো শেষ' : 'গেটওয়ে SMS'}</span>
                </button>
              </div>
            </div>

            {/* Bottom Actions: Print Token Slip & Close */}
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
                onClick={() => setAppointmentNotice(null)}
                className="flex-1 py-2.5 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition"
              >
                সম্পন্ন / ঠিক আছে
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK VISIT FEE EDIT MODAL */}
      {quickFeeDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4 animate-in zoom-in-95">
            <button
              onClick={() => setQuickFeeDoctor(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-teal-600">
              <DollarSign className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ডাক্তারের ভিজিট ফি পরিবর্তন
              </h3>
            </div>

            <p className="text-slate-500">
              ডাক্তার: <strong>{quickFeeDoctor.name}</strong> ({quickFeeDoctor.specialty})
            </p>

            <form onSubmit={handleSaveQuickFee} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  নতুন কনসালটেশন ফি (টাকা) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">৳</span>
                  <input
                    type="number"
                    required
                    value={quickFeeAmount}
                    onChange={(e) => setQuickFeeAmount(e.target.value)}
                    placeholder="800"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base font-bold font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickFeeDoctor(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md"
                >
                  ফি আপডেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
