import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  UserPlus,
  User,
  Phone,
  Stethoscope,
  Calendar,
  Clock,
  Lock,
  Unlock,
  Settings,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  AlertTriangle,
  Check,
  CheckCircle2,
  Droplet,
  MapPin,
  HeartHandshake,
  Save,
  RefreshCw,
  MessageSquare,
  Send,
  ExternalLink,
  Copy,
  Printer,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { Patient, Doctor, MarketingRep, BloodDonor } from '../types/index.ts';
import {
  getDoctorDayPills,
  getNextAvailableDoctorDate,
  getUpcomingChamberDates,
  resolveDayOfMonthToIsoDate,
  getMatchingAddresses,
  isDoctorAvailableOnDay,
  toBengaliDigits,
  toAsciiDigits,
  formatBengaliNumber,
  formatBengaliDDMMYYYY,
  formatLocalIsoDate,
  normalizeBdMobileRemainder,
  isValidBdPhone,
  computeLivePatientId,
  sortDoctorsByPriority,
  BENGALI_DAYS_SHORT,
} from '../utils/clinicalSchedule.ts';

const DRAFT_STORAGE_KEY = 'sdc_patient_draft_v2';
const ID_DIGITS_STORAGE_KEY = 'sdc_patient_id_digits';

export interface RegistrationSuccessSummary {
  patientId: string;
  patientName: string;
  patientPhone: string;
  isProxyPhone: boolean;
  doctorName?: string;
  appointmentDateIso?: string;
  serialNumber?: number;
  fee?: string;
  originalFee?: string;
  waiverReason?: string;
  honorarium?: string;
  bloodGroup?: string;
  bloodDonorRegistered: boolean;
  smsText?: string;
}

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  patientsList: Patient[];
  doctorsList: Doctor[];
  marketingRepsList: MarketingRep[];
  onSuccessRefresh: () => void;
}

const BLOOD_GROUP_OPTIONS = [
  { value: 'A+Positive', short: 'A+', label: 'A+ (এ পজিটিভ)' },
  { value: 'A-Negative', short: 'A-', label: 'A- (এ নেগেটিভ)' },
  { value: 'B+Positive', short: 'B+', label: 'B+ (বি পজিটিভ)' },
  { value: 'B-Negative', short: 'B-', label: 'B- (বি নেগেটিভ)' },
  { value: 'O+Positive', short: 'O+', label: 'O+ (ও পজিটিভ)' },
  { value: 'O-Negative', short: 'O-', label: 'O- (ও নেগেটিভ)' },
  { value: 'AB+Positive', short: 'AB+', label: 'AB+ (এবি পজিটিভ)' },
  { value: 'AB-Negative', short: 'AB-', label: 'AB- (এবি নেগেটিভ)' },
];

const WAIVER_REASON_PRESETS = ['গরিব রোগী', 'স্টাফ', 'অন্যান্য'] as const;

export const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({
  isOpen,
  onClose,
  token,
  patientsList,
  doctorsList,
  marketingRepsList,
  onSuccessRefresh,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Active Chamber Doctors sorted by clinic priority (Nabila -> Jafar -> Rafa -> Ruhul Amin -> others)
  const selectableDoctors = useMemo(() => {
    const sorted = sortDoctorsByPriority(doctorsList);
    const chamberDocs = sorted.filter(
      (d) => d.active !== false && d.isChamberDoctor !== false
    );
    return chamberDocs.length > 0 ? chamberDocs : sorted;
  }, [doctorsList]);

  const defaultDoctor = selectableDoctors[0] || null;

  // Patient ID Settings (Number of trailing mobile digits, default 6)
  const [idMode, setIdMode] = useState<'mobile' | 'other'>('mobile');
  const [idDigitCount, setIdDigitCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(ID_DIGITS_STORAGE_KEY);
      const parsed = saved ? parseInt(saved, 10) : 6;
      return parsed >= 4 && parsed <= 8 ? parsed : 6;
    } catch {
      return 6;
    }
  });
  const [showIdSettingsPopover, setShowIdSettingsPopover] = useState(false);
  const [manualCustomId, setManualCustomId] = useState('');
  const [useManualCustomId, setUseManualCustomId] = useState(false);

  // Main Registration Form State (NO sizeOrHeight, weightKg, or BP fields!)
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [mobileRemainder, setMobileRemainder] = useState(''); // 9 digits after fixed "01"
  const [isProxyPhone, setIsProxyPhone] = useState(false);

  // Doctor Serial State
  const [bookDoctorNow, setBookDoctorNow] = useState(true);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<string>(() =>
    formatLocalIsoDate(new Date())
  );
  const [customDayInput, setCustomDayInput] = useState('');
  const [customDayError, setCustomDayError] = useState<string | null>(null);

  // Fee & Waiver Modal State
  const [feePaid, setFeePaid] = useState(true);
  const [adjustedFee, setAdjustedFee] = useState<string>(''); // empty means use doctor's standard fee
  const [waiverReasonPreset, setWaiverReasonPreset] = useState<string>('');
  const [waiverCustomReason, setWaiverCustomReason] = useState<string>('');
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [tempFeeInput, setTempFeeInput] = useState('');
  const [tempReasonPreset, setTempReasonPreset] = useState<string>('');
  const [tempCustomReason, setTempCustomReason] = useState<string>('');
  const [feeModalError, setFeeModalError] = useState<string | null>(null);

  // Collapsible Optional Section ("আরও তথ্য (ঐচ্ছিক)")
  const [showOptionalSection, setShowOptionalSection] = useState(false);
  const [bloodGroup, setBloodGroup] = useState('');
  const [willingBloodDonor, setWillingBloodDonor] = useState(false);
  const [matchingDonors, setMatchingDonors] = useState<BloodDonor[]>([]);
  const [loadingDonors, setLoadingDonors] = useState(false);
  const [address, setAddress] = useState('');
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [marketingSource, setMarketingSource] = useState('Direct Walk-in');
  const [marketingRepId, setMarketingRepId] = useState('');
  const [manualHonorarium, setManualHonorarium] = useState('');
  const [notes, setNotes] = useState('');

  // Validation & Lifecycle States
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftToast, setDraftToast] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Confirmation Card State
  const [successSummary, setSuccessSummary] = useState<RegistrationSuccessSummary | null>(null);
  const [smsCopied, setSmsCopied] = useState(false);

  // Persist digit count preference
  const handleChangeIdDigitCount = (n: number) => {
    setIdDigitCount(n);
    try {
      localStorage.setItem(ID_DIGITS_STORAGE_KEY, String(n));
    } catch {
      // ignore storage failure
    }
    setShowIdSettingsPopover(false);
  };

  // Initialize default doctor when doctors list loads or modal opens
  useEffect(() => {
    if (defaultDoctor && !selectedDoctorId) {
      setSelectedDoctorId(String(defaultDoctor.id));
      setAppointmentDate(getNextAvailableDoctorDate(defaultDoctor.chamberDays));
    }
  }, [defaultDoctor, selectedDoctorId]);

  // Always reset scroll to top cleanly when opening so "রোগীর নাম" is visible immediately
  useEffect(() => {
    if (isOpen) {
      try {
        setHasSavedDraft(Boolean(localStorage.getItem(DRAFT_STORAGE_KEY)));
      } catch {
        setHasSavedDraft(false);
      }
      requestAnimationFrame(() => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
      });
    }
  }, [isOpen, successSummary]);

  // Fetch matching blood donors when blood group selected
  useEffect(() => {
    if (!bloodGroup) {
      setMatchingDonors([]);
      return;
    }
    const cleanGroup = bloodGroup
      .replace('Positive', '+')
      .replace('Negative', '-')
      .replace(/\s+/g, '');

    let cancelled = false;
    const fetchMatching = async () => {
      try {
        setLoadingDonors(true);
        const res = await fetch(
          `/api/blood-donors?bloodGroup=${encodeURIComponent(cleanGroup)}`
        );
        if (res.ok && !cancelled) {
          const list: BloodDonor[] = await res.json();
          setMatchingDonors(list.filter((d) => d.availableForEmergency));
        }
      } catch {
        // silent fail for matching lookup
      } finally {
        if (!cancelled) setLoadingDonors(false);
      }
    };
    fetchMatching();
    return () => {
      cancelled = true;
    };
  }, [bloodGroup]);

  const currentDoctor = useMemo(() => {
    return (
      selectableDoctors.find((d) => String(d.id) === String(selectedDoctorId)) ||
      defaultDoctor ||
      null
    );
  }, [selectableDoctors, selectedDoctorId, defaultDoctor]);

  const originalFeeNum = useMemo(() => {
    const raw = currentDoctor?.fee ? parseFloat(currentDoctor.fee) : 0;
    return isNaN(raw) ? 0 : raw;
  }, [currentDoctor]);

  const effectiveFeeNum = useMemo(() => {
    if (adjustedFee !== '') {
      const parsed = parseFloat(adjustedFee);
      return isNaN(parsed) ? originalFeeNum : parsed;
    }
    return originalFeeNum;
  }, [adjustedFee, originalFeeNum]);

  const isFeeReduced = effectiveFeeNum < originalFeeNum;
  const isFeeWaived = effectiveFeeNum === 0 && originalFeeNum > 0;

  const fullPhone = useMemo(() => {
    if (isProxyPhone) return '01700000000';
    return mobileRemainder ? `01${mobileRemainder}` : '01';
  }, [isProxyPhone, mobileRemainder]);

  // Live Unique Patient ID calculation
  const livePatientId = useMemo(() => {
    return computeLivePatientId({
      mode: idMode,
      fullPhone: isProxyPhone ? '01700000000' : `01${mobileRemainder}`,
      digitCount: idDigitCount,
      isProxyPhone,
      manualCustomId: useManualCustomId ? manualCustomId : undefined,
      existingPatients: patientsList,
    });
  }, [
    idMode,
    isProxyPhone,
    mobileRemainder,
    idDigitCount,
    useManualCustomId,
    manualCustomId,
    patientsList,
  ]);

  // Doctor schedule derived data
  const dayPills = useMemo(() => {
    if (!currentDoctor) return [];
    return getDoctorDayPills(currentDoctor.chamberDays, appointmentDate);
  }, [currentDoctor, appointmentDate]);

  const upcomingChamberCards = useMemo(() => {
    return getUpcomingChamberDates(currentDoctor?.chamberDays || 'Daily', 10);
  }, [currentDoctor]);

  const isSelectedDateOpen = useMemo(() => {
    if (!currentDoctor || !appointmentDate) return true;
    return isDoctorAvailableOnDay(currentDoctor.chamberDays, appointmentDate);
  }, [currentDoctor, appointmentDate]);

  const selectedDateDayFullBn = useMemo(() => {
    if (!appointmentDate) return '';
    const d = new Date(`${appointmentDate}T00:00:00`);
    if (isNaN(d.getTime())) return '';
    return `${BENGALI_DAYS_SHORT[d.getDay()]}বার`;
  }, [appointmentDate]);

  const handleDoctorChange = (docId: string) => {
    setSelectedDoctorId(docId);
    const doc = selectableDoctors.find((d) => String(d.id) === String(docId));
    if (doc) {
      setAppointmentDate(getNextAvailableDoctorDate(doc.chamberDays));
      setCustomDayInput('');
      setCustomDayError(null);
      setAdjustedFee('');
      setWaiverReasonPreset('');
      setWaiverCustomReason('');
    }
  };

  const handleCustomDayChange = (val: string) => {
    const cleanDigits = toAsciiDigits(val).replace(/\D/g, '').slice(0, 2);
    setCustomDayInput(cleanDigits);

    if (!cleanDigits) {
      setCustomDayError(null);
      return;
    }
    const resolved = resolveDayOfMonthToIsoDate(cleanDigits);
    if (!resolved.valid) {
      setCustomDayError(resolved.error || 'সঠিক দিন লিখুন।');
      return;
    }
    setCustomDayError(null);
    if (resolved.iso) {
      setAppointmentDate(resolved.iso);
    }
  };

  const handleToggleProxyPhone = (checked: boolean) => {
    setIsProxyPhone(checked);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.phone;
      return next;
    });
    if (checked) {
      setIdMode('other');
      setUseManualCustomId(false);
    }
  };

  const handleUnlockPhone = () => {
    setIsProxyPhone(false);
    setMobileRemainder('');
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.phone;
      return next;
    });
  };

  const openFeeAdjustmentModal = (presetZero = false) => {
    setTempFeeInput(presetZero ? '0' : String(effectiveFeeNum));
    setTempReasonPreset(waiverReasonPreset);
    setTempCustomReason(waiverCustomReason);
    setFeeModalError(null);
    setShowFeeModal(true);
  };

  const handleConfirmFeeAdjustment = () => {
    const cleanNumStr = toAsciiDigits(tempFeeInput).replace(/[^\d]/g, '');
    if (cleanNumStr === '') {
      setFeeModalError('অনুগ্রহ করে সঠিক ভিজিট ফি লিখুন।');
      return;
    }
    const parsedFee = parseInt(cleanNumStr, 10);
    if (isNaN(parsedFee) || parsedFee < 0) {
      setFeeModalError('ভিজিট ফি ০ বা তার বেশি হতে হবে।');
      return;
    }

    if (parsedFee < originalFeeNum) {
      if (!tempReasonPreset) {
        setFeeModalError('মূল ফি থেকে কম হলে কারণ নির্বাচন করা বাধ্যতামূলক।');
        return;
      }
      if (tempReasonPreset === 'অন্যান্য' && !tempCustomReason.trim()) {
        setFeeModalError('“অন্যান্য” নির্বাচন করলে অনুগ্রহ করে কারণটি লিখুন।');
        return;
      }
    }

    setAdjustedFee(String(parsedFee));
    setWaiverReasonPreset(parsedFee < originalFeeNum ? tempReasonPreset : '');
    setWaiverCustomReason(parsedFee < originalFeeNum ? tempCustomReason.trim() : '');
    setFeeModalError(null);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.fee;
      return next;
    });
    setShowFeeModal(false);
  };

  const resetFormCompletely = () => {
    const doc = defaultDoctor;
    setIdMode('mobile');
    setUseManualCustomId(false);
    setManualCustomId('');
    setName('');
    setAge('');
    setGender('Female');
    setMobileRemainder('');
    setIsProxyPhone(false);
    setBookDoctorNow(true);
    setSelectedDoctorId(doc ? String(doc.id) : '');
    setAppointmentDate(
      doc ? getNextAvailableDoctorDate(doc.chamberDays) : formatLocalIsoDate(new Date())
    );
    setCustomDayInput('');
    setCustomDayError(null);
    setFeePaid(true);
    setAdjustedFee('');
    setWaiverReasonPreset('');
    setWaiverCustomReason('');
    setShowOptionalSection(false);
    setBloodGroup('');
    setWillingBloodDonor(false);
    setAddress('');
    setMarketingSource('Direct Walk-in');
    setMarketingRepId('');
    setManualHonorarium('');
    setNotes('');
    setFieldErrors({});
    setSubmitError(null);
    setSuccessSummary(null);
    requestAnimationFrame(() => {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    });
  };

  const handleSaveDraft = () => {
    try {
      const payload = {
        idMode,
        manualCustomId,
        useManualCustomId,
        name,
        age,
        gender,
        mobileRemainder,
        isProxyPhone,
        bookDoctorNow,
        selectedDoctorId,
        appointmentDate,
        adjustedFee,
        waiverReasonPreset,
        waiverCustomReason,
        feePaid,
        bloodGroup,
        willingBloodDonor,
        address,
        marketingSource,
        marketingRepId,
        manualHonorarium,
        notes,
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
      setHasSavedDraft(true);
      setDraftToast(true);
      setTimeout(() => setDraftToast(false), 3000);
    } catch {
      // ignore storage error
    }
  };

  const handleLoadDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.idMode) setIdMode(d.idMode);
      if (d.manualCustomId !== undefined) setManualCustomId(d.manualCustomId);
      if (d.useManualCustomId !== undefined) setUseManualCustomId(Boolean(d.useManualCustomId));
      if (d.name !== undefined) setName(d.name);
      if (d.age !== undefined) setAge(d.age);
      if (d.gender) setGender(d.gender);
      if (d.mobileRemainder !== undefined) setMobileRemainder(d.mobileRemainder);
      if (d.isProxyPhone !== undefined) setIsProxyPhone(Boolean(d.isProxyPhone));
      if (d.bookDoctorNow !== undefined) setBookDoctorNow(Boolean(d.bookDoctorNow));
      if (d.selectedDoctorId) setSelectedDoctorId(d.selectedDoctorId);
      if (d.appointmentDate) setAppointmentDate(d.appointmentDate);
      if (d.adjustedFee !== undefined) setAdjustedFee(d.adjustedFee);
      if (d.waiverReasonPreset !== undefined) setWaiverReasonPreset(d.waiverReasonPreset);
      if (d.waiverCustomReason !== undefined) setWaiverCustomReason(d.waiverCustomReason);
      if (d.feePaid !== undefined) setFeePaid(Boolean(d.feePaid));
      if (d.bloodGroup !== undefined) setBloodGroup(d.bloodGroup);
      if (d.willingBloodDonor !== undefined) setWillingBloodDonor(Boolean(d.willingBloodDonor));
      if (d.address !== undefined) setAddress(d.address);
      if (d.marketingSource) setMarketingSource(d.marketingSource);
      if (d.marketingRepId !== undefined) setMarketingRepId(d.marketingRepId);
      if (d.manualHonorarium !== undefined) setManualHonorarium(d.manualHonorarium);
      if (d.notes !== undefined) setNotes(d.notes);
    } catch {
      // ignore parse error
    }
  };

  const handleClearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasSavedDraft(false);
    } catch {
      // ignore
    }
  };

  const handleRequestClose = () => {
    if (successSummary) {
      resetFormCompletely();
      onClose();
      return;
    }
    if (name.trim() || mobileRemainder.trim()) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const errors: Record<string, string> = {};

    const cleanName = name.trim();
    const asciiAge = toAsciiDigits(age).replace(/\D/g, '');
    const parsedAge = parseInt(asciiAge, 10);

    if (!cleanName) {
      errors.name = 'রোগীর পূর্ণ নাম লেখা বাধ্যতামূলক।';
    }
    if (!asciiAge || isNaN(parsedAge) || parsedAge < 0 || parsedAge > 130) {
      errors.age = 'সঠিক বয়স লিখুন (০ থেকে ১৩০ বছর)।';
    }

    const effectivePhone = isProxyPhone ? '01700000000' : `01${mobileRemainder}`;
    if (!isProxyPhone && !isValidBdPhone(effectivePhone)) {
      errors.phone =
        'সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন (যেমন ০১৭XXXXXXXX) অথবা প্রক্সি অপশন বেছে নিন।';
    }

    if (idMode === 'other' && useManualCustomId && !manualCustomId.trim()) {
      errors.patientId = 'কাস্টম রোগী আইডি লিখুন অথবা অটো আইডি মোড ব্যবহার করুন।';
    }

    if (bookDoctorNow) {
      if (!currentDoctor) {
        errors.doctor = 'দয়া করে একজন ডাক্তার নির্বাচন করুন।';
      }
      if (customDayError) {
        errors.date = customDayError;
      }
      if (isFeeReduced) {
        const finalReason =
          waiverReasonPreset === 'অন্যান্য'
            ? waiverCustomReason.trim()
            : waiverReasonPreset;
        if (!finalReason) {
          errors.fee = 'ভিজিট ফি মূল ফি থেকে কম হলে কারণ নির্বাচন করা বাধ্যতামূলক।';
        }
      }
    }

    if (willingBloodDonor && !bloodGroup) {
      errors.bloodGroup = 'রক্তদাতা হিসেবে যুক্ত করতে রক্তের গ্রুপ নির্বাচন করুন।';
      setShowOptionalSection(true);
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError('অনুগ্রহ করে লাল চিহ্নিত ঘরগুলো সঠিকভাবে পূরণ করুন।');
      requestAnimationFrame(() => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const resolvedPatientIdToSend =
        livePatientId.id ||
        (idMode === 'other'
          ? `PT-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${String(
              patientsList.length + 1
            ).padStart(4, '0')}`
          : effectivePhone.slice(-idDigitCount));

      // ১. রোগী নিবন্ধন API কল (sizeOrHeight, weightKg, BP UI-তে নেই; ব্যাকএন্ড অক্ষুণ্ণ)
      const ptRes = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          patientId: resolvedPatientIdToSend,
          name: cleanName,
          age: parsedAge,
          gender,
          phone: effectivePhone,
          isProxyPhone,
          address: address.trim(),
          bloodGroup,
          willingToDonateBlood: willingBloodDonor,
          notes: notes.trim(),
        }),
      });

      if (!ptRes.ok) {
        const errJson = await ptRes.json().catch(() => ({}));
        setSubmitError(errJson.error || 'রোগী সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
        return;
      }

      const ptJson = await ptRes.json();
      const createdPatient: Patient = ptJson.patient;

      // ২. সিরিয়াল বুকিং (যদি টগল চালু থাকে)
      let bookedSerial: number | undefined;
      let bookedDocName: string | undefined;
      let bookedFeeStr: string | undefined;
      let combinedWaiverNote = '';
      let smsText: string | undefined;
      const cleanHonorarium = toAsciiDigits(manualHonorarium).replace(/[^\d]/g, '');

      if (bookDoctorNow && currentDoctor) {
        const rep = marketingRepsList.find(
          (m) => String(m.id) === String(marketingRepId)
        );
        combinedWaiverNote = isFeeReduced
          ? [waiverReasonPreset, waiverCustomReason.trim()].filter(Boolean).join(' - ')
          : '';

        const apptRes = await fetch('/api/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token || ''}`,
          },
          body: JSON.stringify({
            doctorId: currentDoctor.id,
            doctorName: currentDoctor.name,
            doctorSpecialty: currentDoctor.specialty,
            patientId: createdPatient.patientId,
            patientName: createdPatient.name,
            patientPhone: effectivePhone,
            patientAge: createdPatient.age,
            patientGender: createdPatient.gender,
            appointmentDate,
            fee: String(effectiveFeeNum),
            originalFee: String(originalFeeNum),
            feePaid,
            feeWaived: isFeeWaived,
            waiverReason: combinedWaiverNote,
            isProxyPhone,
            marketingSource,
            marketingRepId: rep ? rep.id : null,
            marketingRepName: rep ? rep.name : null,
            honorarium: cleanHonorarium || undefined,
            notes: [
              isFeeWaived
                ? `ভিজিট ফি মওকুফ: ${combinedWaiverNote}`
                : isFeeReduced
                ? `ফি সমন্বয়: ${combinedWaiverNote}`
                : 'রিসেপশন নিবন্ধনের সাথে বুকিং',
              notes.trim(),
            ]
              .filter(Boolean)
              .join(' | '),
          }),
        });

        if (apptRes.ok) {
          const apptJson = await apptRes.json();
          bookedSerial = apptJson.serialNumber;
          bookedDocName = currentDoctor.name;
          bookedFeeStr = String(effectiveFeeNum);
          if (!isProxyPhone) {
            smsText = `সোনালী ডায়াগনস্টিক সেন্টার: সম্মানিত ${createdPatient.name}, ${currentDoctor.name}-এর সাথে আপনার সিরিয়াল #${toBengaliDigits(
              bookedSerial
            )} নিশ্চিত হয়েছে। তারিখ: ${formatBengaliDDMMYYYY(
              appointmentDate
            )} (${selectedDateDayFullBn})। রুম: ${
              currentDoctor.roomNo || 'চেম্বার ১০১'
            }। ফি: ৳${formatBengaliNumber(bookedFeeStr)}।`;
          }
        }
      }

      // ৩. রক্তদানে ইচ্ছুক হলে ব্লাড-ডোনার তালিকায় যুক্ত নিশ্চিত করা (POST /api/patients-এ সিঙ্ক হয়েছে)
      const donorSaved = Boolean(willingBloodDonor && bloodGroup);

      handleClearDraft();
      onSuccessRefresh();

      setSuccessSummary({
        patientId: createdPatient.patientId,
        patientName: createdPatient.name,
        patientPhone: effectivePhone,
        isProxyPhone,
        doctorName: bookedDocName,
        appointmentDateIso: bookDoctorNow ? appointmentDate : undefined,
        serialNumber: bookedSerial,
        fee: bookedFeeStr,
        originalFee: bookDoctorNow ? String(originalFeeNum) : undefined,
        waiverReason: combinedWaiverNote || undefined,
        honorarium: cleanHonorarium || undefined,
        bloodGroup: bloodGroup
          ? BLOOD_GROUP_OPTIONS.find((b) => b.value === bloodGroup)?.short || bloodGroup
          : undefined,
        bloodDonorRegistered: donorSaved,
        smsText,
      });
    } catch (err: any) {
      setSubmitError(err?.message || 'সার্ভারের সাথে সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center md:bg-black/60 md:backdrop-blur-xs md:p-6 bg-slate-50 dark:bg-slate-950">
      {/* Main Container: Full-screen Mobile, Large Centered Modal Desktop */}
      <div className="relative w-full h-full md:h-auto md:max-h-[92vh] md:max-w-3xl md:rounded-[22px] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 md:shadow-2xl md:border md:border-slate-200 dark:md:border-slate-800 flex flex-col overflow-hidden">
        {/* Safe-area top header */}
        <header className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pb-3 pt-[max(env(safe-area-inset-top),0.85rem)] md:pt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white truncate">
                {successSummary ? 'নিবন্ধন সম্পন্ন হয়েছে' : 'নতুন রোগী নিবন্ধন + সিরিয়াল'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {successSummary
                  ? 'রোগীর বিবরণ ও সিরিয়াল স্লিপ নিচে দেখানো হলো'
                  : 'রোগীর তথ্য, ইউনিক আইডি ও ডাক্তার সিরিয়াল একই সাথে সম্পন্ন করুন'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRequestClose}
            aria-label="বন্ধ করুন"
            className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Body */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-8"
        >
          {successSummary ? (
            /* ==================== SUCCESS CONFIRMATION CARD ==================== */
            <div className="space-y-4">
              <div className="rounded-[20px] bg-white dark:bg-slate-900 border-2 border-emerald-500/80 dark:border-emerald-600 p-5 shadow-md space-y-5">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                    তথ্য সফলভাবে সংরক্ষিত হয়েছে!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    নিচের সারসংক্ষেপ দেখে রোগীকে টোকেন দিন বা নতুন রোগী নিবন্ধন করুন
                  </p>
                </div>

                {/* Highlight Serial Banner if booked */}
                {successSummary.serialNumber !== undefined && (
                  <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 p-4 text-center space-y-1">
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                      ডাক্তার চেম্বার সিরিয়াল নম্বর
                    </span>
                    <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                      সিরিয়াল #{toBengaliDigits(successSummary.serialNumber)}
                    </div>
                  </div>
                )}

                {/* Summary Key-Value Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400">রোগী আইডি</div>
                    <div className="font-bold font-mono text-base text-blue-700 dark:text-blue-400 mt-0.5">
                      {successSummary.patientId}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400">রোগীর নাম</div>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {successSummary.patientName}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400">ডাক্তার</div>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {successSummary.doctorName || 'শুধু রোগী নিবন্ধন (সিরিয়াল ছাড়া)'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400">তারিখ</div>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {successSummary.appointmentDateIso
                        ? formatBengaliDDMMYYYY(successSummary.appointmentDateIso)
                        : formatBengaliDDMMYYYY(new Date())}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400">ভিজিট ফি</div>
                    <div className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                      {successSummary.fee !== undefined
                        ? Number(successSummary.fee) === 0
                          ? '৳ ০ (ফি মওকুফ)'
                          : `৳ ${formatBengaliNumber(successSummary.fee)}`
                        : 'প্রযোজ্য নয়'}
                    </div>
                    {successSummary.waiverReason && (
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                        কারণ: {successSummary.waiverReason}
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      ডাক্তারের সম্মানী
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {successSummary.honorarium
                        ? `৳ ${formatBengaliNumber(successSummary.honorarium)} (ম্যানুয়াল)`
                        : 'ম্যানুয়াল (নির্ধারিত নয়)'}
                    </div>
                  </div>

                  <div className="sm:col-span-2 p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          রক্তদাতা স্ট্যাটাস
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {successSummary.bloodDonorRegistered
                            ? `রক্তদাতা হিসেবে নিবন্ধিত (${successSummary.bloodGroup})`
                            : successSummary.bloodGroup
                            ? `রক্তের গ্রুপ: ${successSummary.bloodGroup} (ডোনার তালিকাভুক্ত নয়)`
                            : 'ডোনার হিসেবে যুক্ত করা হয়নি'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SMS Preview Box */}
                {successSummary.smsText && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4" />
                        <span>এসএমএস বার্তা প্রস্তুত</span>
                      </span>
                    </div>
                    <p className="text-xs bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed">
                      {successSummary.smsText}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <a
                        href={`sms:${successSummary.patientPhone}?body=${encodeURIComponent(
                          successSummary.smsText
                        )}`}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>SMS</span>
                      </a>
                      <a
                        href={`https://wa.me/88${successSummary.patientPhone.replace(
                          /\D/g,
                          ''
                        )}?text=${encodeURIComponent(successSummary.smsText)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(successSummary.smsText || '');
                          setSmsCopied(true);
                          setTimeout(() => setSmsCopied(false), 2000);
                        }}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-bold text-xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{smsCopied ? 'কপি ✓' : 'কপি'}</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="min-h-[50px] px-4 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>স্লিপ প্রিন্ট</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetFormCompletely}
                    className="flex-1 min-h-[50px] px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>নতুন রোগী</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetFormCompletely();
                      onClose();
                    }}
                    className="min-h-[50px] px-5 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm"
                  >
                    সম্পন্ন
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ==================== REGISTRATION + SERIAL FORM ==================== */
            <form id="patient-registration-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Draft notification & restore */}
              {draftToast && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center gap-2">
                  <Save className="w-4 h-4 shrink-0" />
                  <span>ফর্মের তথ্য ড্রাফট হিসেবে সংরক্ষিত হয়েছে।</span>
                </div>
              )}

              {hasSavedDraft && !name && !mobileRemainder && (
                <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-blue-900 dark:text-blue-200">
                    পূর্বে সংরক্ষিত একটি অসম্পূর্ণ ড্রাফট রয়েছে।
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLoadDraft}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                      ড্রাফট লোড করুন
                    </button>
                    <button
                      type="button"
                      onClick={handleClearDraft}
                      className="px-2.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-rose-600 font-semibold"
                    >
                      মুছুন
                    </button>
                  </div>
                </div>
              )}

              {submitError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* LIVE PATIENT ID BANNER WITH DIGIT SETTINGS */}
              <section className="rounded-[18px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3 relative">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      রোগী আইডি (স্বয়ংক্রিয় প্রিভিউ)
                    </span>
                  </div>

                  {/* Live ID Badge + Settings Gear */}
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 font-mono font-bold text-sm text-blue-700 dark:text-blue-300">
                      {livePatientId.id || `মোবাইলের শেষ ${toBengaliDigits(idDigitCount)} সংখ্যা`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowIdSettingsPopover((v) => !v)}
                      title="আইডি সংখ্যার সেটিংস"
                      className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Inline Settings Popover for ID trailing digit count */}
                {showIdSettingsPopover && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        মোবাইলের শেষ কয়টি সংখ্যা রোগী আইডি হবে?
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowIdSettingsPopover(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[4, 5, 6, 7, 8].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => handleChangeIdDigitCount(cnt)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                            idDigitCount === cnt
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {toBengaliDigits(cnt)} সংখ্যা {cnt === 6 ? '(ডিফল্ট)' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2 Mode Selector Pills */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isProxyPhone}
                    onClick={() => {
                      setIdMode('mobile');
                      setUseManualCustomId(false);
                    }}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold border text-left transition flex items-center justify-between ${
                      idMode === 'mobile' && !isProxyPhone
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-800 dark:text-blue-200'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-50'
                    }`}
                  >
                    <span>অপশন ১: মোবাইলের শেষ {toBengaliDigits(idDigitCount)} সংখ্যা</span>
                    {idMode === 'mobile' && !isProxyPhone && (
                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIdMode('other')}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold border text-left transition flex items-center justify-between ${
                      idMode === 'other' || isProxyPhone
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-800 dark:text-blue-200'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>অপশন ২: অন্যান্য (অটো/ম্যানুয়াল)</span>
                    {(idMode === 'other' || isProxyPhone) && (
                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                  </button>
                </div>

                {/* Option 2 Custom / Sequential Controls */}
                {(idMode === 'other' || isProxyPhone) && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setUseManualCustomId((v) => !v)}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0"
                    >
                      {useManualCustomId ? 'স্বয়ংক্রিয় আইডি ব্যবহার করুন' : 'নিজে আইডি লিখুন'}
                    </button>
                    {useManualCustomId && (
                      <input
                        type="text"
                        lang="en"
                        autoCorrect="off"
                        spellCheck={false}
                        value={manualCustomId}
                        onChange={(e) => setManualCustomId(e.target.value)}
                        placeholder="e.g. PT-CUSTOM-101"
                        className={`flex-1 min-h-[50px] px-3.5 rounded-xl border bg-white dark:bg-slate-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          fieldErrors.patientId
                            ? 'border-rose-500 ring-2 ring-rose-500/20'
                            : 'border-slate-300 dark:border-slate-700'
                        }`}
                      />
                    )}
                  </div>
                )}

                {/* Collision Alert */}
                {livePatientId.isCollision && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        আইডি <strong className="font-mono">{livePatientId.baseId}</strong> ইতোমধ্যে
                        ব্যবহৃত হয়েছে
                        {livePatientId.collidingPatientName
                          ? ` (${livePatientId.collidingPatientName})`
                          : ''}
                        । স্বয়ংক্রিয়ভাবে{' '}
                        <strong className="font-mono">{livePatientId.id}</strong> নির্ধারিত হবে।
                      </span>
                    </div>
                    {idMode === 'mobile' && (
                      <button
                        type="button"
                        onClick={() => setIdMode('other')}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] shrink-0"
                      >
                        অন্যান্য মোড নিন
                      </button>
                    )}
                  </div>
                )}
              </section>

              {/* CARD 1: PATIENT IDENTITY */}
              <section className="rounded-[18px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    রোগীর পরিচিতি
                  </h4>
                </div>

                {/* Patient Name (English keyboard ergonomics) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    রোগীর নাম *
                  </label>
                  <input
                    type="text"
                    lang="en"
                    autoCapitalize="words"
                    autoCorrect="off"
                    spellCheck={false}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) {
                        setFieldErrors((p) => {
                          const n = { ...p };
                          delete n.name;
                          return n;
                        });
                      }
                    }}
                    placeholder="e.g. Md. Abdul Karim"
                    className={`w-full min-h-[50px] px-4 rounded-xl border bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.name
                        ? 'border-rose-500 ring-2 ring-rose-500/20'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                {/* Age & Gender Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      বয়স (বছর) *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={age}
                      onChange={(e) => {
                        const clean = toAsciiDigits(e.target.value).replace(/\D/g, '').slice(0, 3);
                        setAge(clean);
                        if (fieldErrors.age) {
                          setFieldErrors((p) => {
                            const n = { ...p };
                            delete n.age;
                            return n;
                          });
                        }
                      }}
                      placeholder="e.g. 35"
                      className={`w-full min-h-[50px] px-4 rounded-xl border bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        fieldErrors.age
                          ? 'border-rose-500 ring-2 ring-rose-500/20'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    />
                    {fieldErrors.age && (
                      <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                        {fieldErrors.age}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      লিঙ্গ *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { val: 'Female', label: 'মহিলা' },
                          { val: 'Male', label: 'পুরুষ' },
                          { val: 'Other', label: 'অন্যান্য' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setGender(opt.val)}
                          className={`min-h-[50px] px-2 rounded-xl border text-xs font-bold transition ${
                            gender === opt.val
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mobile Number: Fixed 01 Prefix + 9 Numeric Digits + Proxy Unlock */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>মোবাইল নম্বর *</span>
                    </label>
                    {!isProxyPhone && (
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {toBengaliDigits(2 + mobileRemainder.length)}/১১ সংখ্যা
                      </span>
                    )}
                  </div>

                  <div className="flex items-stretch gap-2">
                    <div
                      className={`flex-1 flex items-center min-h-[50px] rounded-xl border overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 ${
                        isProxyPhone
                          ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700'
                          : fieldErrors.phone
                          ? 'bg-white dark:bg-slate-800 border-rose-500 ring-2 ring-rose-500/20'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <span className="h-full px-3.5 bg-slate-100 dark:bg-slate-700/70 border-r border-slate-200 dark:border-slate-600 flex items-center font-mono font-bold text-sm text-slate-700 dark:text-slate-200 select-none">
                        01
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={9}
                        disabled={isProxyPhone}
                        value={isProxyPhone ? '700000000' : mobileRemainder}
                        onChange={(e) => {
                          const normalized = normalizeBdMobileRemainder(e.target.value);
                          setMobileRemainder(normalized);
                          if (fieldErrors.phone) {
                            setFieldErrors((p) => {
                              const n = { ...p };
                              delete n.phone;
                              return n;
                            });
                          }
                        }}
                        placeholder="711223344"
                        className="flex-1 min-h-[50px] px-3 bg-transparent font-mono font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none disabled:text-slate-500"
                      />
                    </div>

                    {isProxyPhone && (
                      <button
                        type="button"
                        onClick={handleUnlockPhone}
                        className="min-h-[50px] px-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 shrink-0 hover:bg-amber-100 transition"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>🔒 খুলুন</span>
                      </button>
                    )}
                  </div>

                  {fieldErrors.phone && (
                    <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                      {fieldErrors.phone}
                    </p>
                  )}

                  <label className="mt-2.5 flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isProxyPhone}
                      onChange={(e) => handleToggleProxyPhone(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      রোগীর নিজস্ব নম্বর নেই (ক্লিনিক প্রক্সি ০১৭০০-০০০০০০ বসবে, কোনো SMS যাবে না)
                    </span>
                  </label>
                </div>
              </section>

              {/* CARD 2: DOCTOR SERIAL & CHAMBER CALENDAR */}
              <section className="rounded-[18px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      একই সাথে ডাক্তার সিরিয়াল বুক করুন
                    </span>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={bookDoctorNow}
                    onClick={() => setBookDoctorNow((v) => !v)}
                    className={`w-12 h-7 rounded-full transition-colors p-1 flex items-center ${
                      bookDoctorNow ? 'bg-blue-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white shadow-xs block" />
                  </button>
                </div>

                {bookDoctorNow && (
                  <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {/* Doctor Selector (Clean single doctor view when 1, select when >1; no invented data) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        চেম্বার ডাক্তার *
                      </label>
                      {selectableDoctors.length === 0 ? (
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                          এখনো কোনো চেম্বার ডাক্তার যুক্ত করা হয়নি। ডাক্তার পাতা থেকে ডাক্তারের তথ্য যুক্ত করুন।
                        </div>
                      ) : selectableDoctors.length === 1 ? (
                        <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/70 flex items-center justify-between gap-3">
                          <div>
                            <div className="font-bold text-sm text-slate-900 dark:text-white">
                              {currentDoctor?.name}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                              {currentDoctor?.specialty}
                              {currentDoctor?.chamberTime ? ` • ${currentDoctor.chamberTime}` : ''}
                            </div>
                          </div>
                          <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                            ৳ {formatBengaliNumber(originalFeeNum)}
                          </span>
                        </div>
                      ) : (
                        <>
                          <select
                            value={selectedDoctorId}
                            onChange={(e) => handleDoctorChange(e.target.value)}
                            className="w-full min-h-[50px] px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {selectableDoctors.map((doc) => (
                              <option key={doc.id} value={doc.id}>
                                {doc.name} — {doc.specialty} (৳{formatBengaliNumber(doc.fee)})
                              </option>
                            ))}
                          </select>
                          {currentDoctor && (
                            <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-blue-500" />
                              <span>
                                সময়: {currentDoctor.chamberTime || 'নির্ধারিত'} • চেম্বার:{' '}
                                {currentDoctor.roomNo || 'চেম্বার ১০১'}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* 7-Box Weekly Schedule Indicator (Green = Open, Gray = Closed) */}
                    {currentDoctor && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            সাপ্তাহিক চেম্বার শিডিউল
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            সবুজ = খোলা • ধূসর = বন্ধ
                          </span>
                        </div>
                        <div className="grid grid-cols-7 gap-1.5">
                          {dayPills.map((pill) => (
                            <button
                              key={pill.index}
                              type="button"
                              disabled={!pill.isAvailable}
                              onClick={() => {
                                const today = new Date();
                                const diff = (pill.index - today.getDay() + 7) % 7;
                                const nextDate = new Date();
                                nextDate.setDate(today.getDate() + diff);
                                setAppointmentDate(formatLocalIsoDate(nextDate));
                                setCustomDayInput('');
                                setCustomDayError(null);
                              }}
                              className={`py-2 px-1 rounded-xl text-[11px] font-bold border text-center transition ${
                                pill.isSelected && pill.isAvailable
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                  : pill.isAvailable
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                                  : 'bg-slate-100 dark:bg-slate-800/70 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                              }`}
                            >
                              {pill.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Horizontal Scrollable Open Chamber Date Cards + "অন্য দিন" Numeric Box */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span>চেম্বারের তারিখ নির্বাচন</span>
                        </label>
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                          নির্বাচিত: {formatBengaliDDMMYYYY(appointmentDate)} ({selectedDateDayFullBn})
                        </span>
                      </div>

                      {/* Horizontal Scrollable Date Cards */}
                      <div className="flex items-stretch gap-2 overflow-x-auto no-scrollbar pb-1">
                        {upcomingChamberCards.map((card) => {
                          const isSelected = appointmentDate === card.iso;
                          return (
                            <button
                              key={card.iso}
                              type="button"
                              onClick={() => {
                                setAppointmentDate(card.iso);
                                setCustomDayInput('');
                                setCustomDayError(null);
                              }}
                              className={`shrink-0 min-w-[96px] px-3 py-2.5 rounded-2xl border text-left transition ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                  : 'bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className={`text-[11px] font-bold ${
                                    isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                                  }`}
                                >
                                  {card.dayShortBn}
                                </span>
                                {card.relativeBadgeBn && (
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                      isSelected
                                        ? 'bg-white/20 text-white'
                                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                    }`}
                                  >
                                    {card.relativeBadgeBn}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-bold mt-1">{card.ddMmYyyyBn}</div>
                            </button>
                          );
                        })}
                      </div>

                      {/* "অন্য দিন" Quick Numeric Day Input (শুধু দিন) */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                            অন্য দিন (শুধু দিন):
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={customDayInput}
                            onChange={(e) => handleCustomDayChange(e.target.value)}
                            placeholder="২৫"
                            className={`w-28 min-h-[50px] px-3 rounded-xl border bg-white dark:bg-slate-800 text-sm font-bold text-center text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              customDayError
                                ? 'border-rose-500 ring-2 ring-rose-500/20'
                                : 'border-slate-300 dark:border-slate-700'
                            }`}
                          />
                        </div>
                        {customDayInput && !customDayError && (
                          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                            বার: {selectedDateDayFullBn} ({formatBengaliDDMMYYYY(appointmentDate)})
                          </span>
                        )}
                      </div>

                      {customDayError && (
                        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                          {customDayError}
                        </p>
                      )}

                      {/* Off-day Warning Banner */}
                      {!isSelectedDateOpen && currentDoctor && (
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>
                            সতর্কবার্তা: {formatBengaliDDMMYYYY(appointmentDate)} (
                            {selectedDateDayFullBn}) এই ডাক্তারের চেম্বার বন্ধ! দয়া করে খোলা দিন
                            বেছে নিন।
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* CARD 3: VISIT FEE (Visible only when booking doctor serial) */}
              {bookDoctorNow && (
                <section className="rounded-[18px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {originalFeeNum === 20
                          ? 'রেজিস্ট্রেশন / টিকিট ফি (ফ্রি করা যাবে)'
                          : 'ডাক্তারের ভিজিট ফি'}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                          ৳ {formatBengaliNumber(effectiveFeeNum)}
                        </span>
                        {isFeeReduced && (
                          <span className="text-xs line-through text-slate-400 tabular-nums">
                            ৳ {formatBengaliNumber(originalFeeNum)}
                          </span>
                        )}
                        {isFeeWaived && (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                            ফি মওকুফ
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {effectiveFeeNum > 0 && (
                        <button
                          type="button"
                          onClick={() => openFeeAdjustmentModal(true)}
                          className="min-h-[46px] px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 transition whitespace-nowrap"
                        >
                          <span>ফ্রি করুন (৳০)</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openFeeAdjustmentModal(false)}
                        className="min-h-[46px] px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center gap-1.5 transition shrink-0 whitespace-nowrap"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>🔒 পরিবর্তন</span>
                      </button>
                    </div>
                  </div>

                  {isFeeReduced && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2">
                      <span>
                        কারণ:{' '}
                        <strong>
                          {[waiverReasonPreset, waiverCustomReason].filter(Boolean).join(' - ') ||
                            'নির্বাচন প্রয়োজন'}
                        </strong>
                      </span>
                      <span className="text-[11px] opacity-80">সম্মানী ম্যানুয়াল</span>
                    </div>
                  )}

                  {fieldErrors.fee && (
                    <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                      {fieldErrors.fee}
                    </p>
                  )}

                  <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={feePaid}
                      onChange={(e) => setFeePaid(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      কাউন্টারে ভিজিট ফি গ্রহণ সম্পন্ন হয়েছে
                    </span>
                  </label>
                </section>
              )}

              {/* CARD 4: COLLAPSIBLE "আরও তথ্য (ঐচ্ছিক)" DRAWER */}
              <section className="rounded-[18px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowOptionalSection((v) => !v)}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                >
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      আরও তথ্য (ঐচ্ছিক)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                      রক্তের গ্রুপ, রক্তদাতা, ঠিকানা, মার্কেটিং, সম্মানী
                    </span>
                  </div>
                  {showOptionalSection ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {showOptionalSection && (
                  <div className="p-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    {/* Blood Group + Willing Blood Donor Checkbox */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          রক্তের গ্রুপ
                        </label>
                        <select
                          value={bloodGroup}
                          onChange={(e) => {
                            setBloodGroup(e.target.value);
                            if (fieldErrors.bloodGroup) {
                              setFieldErrors((p) => {
                                const n = { ...p };
                                delete n.bloodGroup;
                                return n;
                              });
                            }
                          }}
                          className={`w-full min-h-[50px] px-3.5 rounded-xl border bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            fieldErrors.bloodGroup
                              ? 'border-rose-500 ring-2 ring-rose-500/20'
                              : 'border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          <option value="">বাছাই করুন</option>
                          {BLOOD_GROUP_OPTIONS.map((bg) => (
                            <option key={bg.value} value={bg.value}>
                              {bg.label}
                            </option>
                          ))}
                        </select>
                        {fieldErrors.bloodGroup && (
                          <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                            {fieldErrors.bloodGroup}
                          </p>
                        )}
                      </div>

                      <div className="sm:pt-6">
                        <label className="min-h-[50px] px-3.5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 flex items-center gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={willingBloodDonor}
                            onChange={(e) => setWillingBloodDonor(e.target.checked)}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                          />
                          <div className="text-xs">
                            <span className="font-bold text-rose-800 dark:text-rose-300 block">
                              রক্তদানে ইচ্ছুক
                            </span>
                            <span className="text-[11px] text-rose-600/80 dark:text-rose-400/80">
                              রক্তদাতা তালিকায় যুক্ত হবে
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Reactive Matching Emergency Donors */}
                    {bloodGroup && (
                      <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                            <Droplet className="w-3.5 h-3.5 text-rose-600" />
                            <span>
                              {matchingDonors.length > 0
                                ? `প্রস্তুত রক্তদাতা পাওয়া গেছে: ${toBengaliDigits(
                                    matchingDonors.length
                                  )} জন`
                                : 'এই গ্রুপের প্রস্তুত রক্তদাতা এখন নেই'}
                            </span>
                          </span>
                          {loadingDonors && (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-500" />
                          )}
                        </div>
                        {matchingDonors.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {matchingDonors.slice(0, 4).map((donor) => (
                              <div
                                key={donor.id}
                                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/40 flex items-center justify-between gap-2 text-xs"
                              >
                                <span className="font-semibold truncate">
                                  {donor.name} ({donor.area || 'সিলেট'})
                                </span>
                                <a
                                  href={`tel:${donor.phone}`}
                                  className="px-2 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px] shrink-0"
                                >
                                  {donor.phone}
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Address (English keyboard ergonomics + Sylhet autocomplete) */}
                    <div className="relative">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        ঠিকানা / এলাকা
                      </label>
                      <input
                        type="text"
                        lang="en"
                        autoCorrect="off"
                        spellCheck={false}
                        value={address}
                        onFocus={() => setShowAddressDropdown(true)}
                        onBlur={() => setTimeout(() => setShowAddressDropdown(false), 180)}
                        onChange={(e) => {
                          setAddress(e.target.value);
                          setShowAddressDropdown(true);
                        }}
                        placeholder="e.g. Zindabazar, Sylhet"
                        className="w-full min-h-[50px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {showAddressDropdown && address && (
                        <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg max-h-44 overflow-y-auto">
                          {getMatchingAddresses(
                            address,
                            patientsList.map((p) => p.address || '')
                          ).map((addr, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onMouseDown={() => {
                                setAddress(addr);
                                setShowAddressDropdown(false);
                              }}
                              className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                            >
                              <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span>{addr}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Marketing Source & Rep */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          রোগী আসার মাধ্যম
                        </label>
                        <select
                          value={marketingSource}
                          onChange={(e) => setMarketingSource(e.target.value)}
                          className="w-full min-h-[50px] px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Direct Walk-in">সরাসরি / ওয়াক-ইন</option>
                          <option value="Marketing Rep">মার্কেটিং প্রতিনিধি</option>
                          <option value="Social Media / Facebook">ফেসবুক / সোশ্যাল মিডিয়া</option>
                          <option value="Campaign / Leaflet">লিফলেট / ক্যাম্পেইন</option>
                          <option value="Local Pharmacy / Clinic">লোকাল ফার্মেসি / ক্লিনিক</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          মার্কেটিং প্রতিনিধি (ঐচ্ছিক)
                        </label>
                        <select
                          value={marketingRepId}
                          onChange={(e) => {
                            const repId = e.target.value;
                            setMarketingRepId(repId);
                            const matched = marketingRepsList.find(
                              (m) => String(m.id) === String(repId)
                            );
                            if (matched) {
                              setMarketingSource('Marketing Rep');
                              setManualHonorarium(matched.defaultHonorarium || '150');
                            } else {
                              setManualHonorarium('');
                            }
                          }}
                          className="w-full min-h-[50px] px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">প্রযোজ্য নয়</option>
                          {marketingRepsList.map((rep) => (
                            <option key={rep.id} value={rep.id}>
                              {rep.name} ({rep.area}) — ৳{rep.defaultHonorarium || '150'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Auto + Manual Editable Honorarium + Notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                          <Wallet className="w-3.5 h-3.5 text-slate-400" />
                          <span>মার্কেটিং প্রতিনিধির সম্মানী (৳)</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={manualHonorarium}
                          onChange={(e) =>
                            setManualHonorarium(
                              toAsciiDigits(e.target.value).replace(/\D/g, '')
                            )
                          }
                          placeholder="প্রতিনিধি বাছাইয়ে অটো বসবে"
                          className="w-full min-h-[50px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          প্রতিনিধির নির্ধারিত রেট অটো বসে; প্রয়োজনে হাতে বদলাতে পারবেন
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          নোট / মন্তব্য (ঐচ্ছিক)
                        </label>
                        <input
                          type="text"
                          lang="en"
                          autoCorrect="off"
                          spellCheck={false}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="e.g. Urgent ultrasound follow-up"
                          className="w-full min-h-[50px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </form>
          )}
        </div>

        {/* STICKY BOTTOM ACTION BAR (Hidden on Success Screen) */}
        {!successSummary && (
          <footer className="shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 pt-2.5 pb-[max(env(safe-area-inset-bottom),0.85rem)] space-y-2.5">
            {/* Compact Live Summary Line */}
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 gap-2 truncate">
              {bookDoctorNow ? (
                <>
                  <span className="font-semibold truncate">
                    {currentDoctor?.name || 'ডাক্তার নির্বাচন'} ·{' '}
                    {formatBengaliDDMMYYYY(appointmentDate)}
                  </span>
                  <span className="font-bold text-blue-700 dark:text-blue-400 shrink-0">
                    নিট ফি: ৳ {formatBengaliNumber(effectiveFeeNum)}
                  </span>
                </>
              ) : (
                <>
                  <span className="font-semibold">শুধু রোগী নিবন্ধন (সিরিয়াল ছাড়া)</span>
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                    আইডি: {livePatientId.id || '—'}
                  </span>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="min-h-[50px] px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition"
              >
                <Save className="w-4 h-4 text-amber-600" />
                <span>ড্রাফট</span>
              </button>

              <button
                type="submit"
                form="patient-registration-form"
                disabled={isSubmitting}
                className="flex-1 min-h-[50px] px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {bookDoctorNow ? 'সংরক্ষণ ও সিরিয়াল দিন' : 'শুধু রোগী নিবন্ধন'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </footer>
        )}
      </div>

      {/* FIT-TO-CONTENT VISIT FEE ADJUSTMENT BOTTOM SHEET / MODAL (NO PASSWORD) */}
      {showFeeModal && (
        <div
          className="fixed inset-0 z-60 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-xs md:p-4"
          onClick={() => setShowFeeModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full md:max-w-md rounded-t-[22px] md:rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  ভিজিট ফি পরিবর্তন
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ডাক্তারের মূল ফি: ৳ {formatBengaliNumber(originalFeeNum)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFeeModal(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  নতুন ভিজিট ফি (৳) — ০ দিলে ফি মওকুফ
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={tempFeeInput}
                  onChange={(e) => {
                    setTempFeeInput(toAsciiDigits(e.target.value).replace(/\D/g, ''));
                    setFeeModalError(null);
                  }}
                  placeholder="e.g. 500"
                  className="w-full min-h-[50px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTempFeeInput('0');
                      setFeeModalError(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold"
                  >
                    ০ টাকা (ফি মওকুফ)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempFeeInput(String(originalFeeNum));
                      setTempReasonPreset('');
                      setTempCustomReason('');
                      setFeeModalError(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
                  >
                    মূল ফি (৳{formatBengaliNumber(originalFeeNum)})
                  </button>
                </div>
              </div>

              {/* Mandatory Reason Section when Fee < Original Fee */}
              {Number(toAsciiDigits(tempFeeInput) || 0) < originalFeeNum && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2.5">
                  <label className="block text-xs font-bold text-amber-900 dark:text-amber-200">
                    মূল ফি থেকে কমানোর কারণ * (বাধ্যতামূলক)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {WAIVER_REASON_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setTempReasonPreset(preset);
                          setFeeModalError(null);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                          tempReasonPreset === preset
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  {tempReasonPreset && (
                    <input
                      type="text"
                      lang="en"
                      autoCorrect="off"
                      spellCheck={false}
                      value={tempCustomReason}
                      onChange={(e) => {
                        setTempCustomReason(e.target.value);
                        setFeeModalError(null);
                      }}
                      placeholder={
                        tempReasonPreset === 'অন্যান্য'
                          ? 'কারণ লিখুন (বাধ্যতামূলক)...'
                          : 'অতিরিক্ত তথ্য (ঐচ্ছিক, e.g. Doctor ref)...'
                      }
                      className="w-full min-h-[50px] px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              )}

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                নোট: ফি কমালে ডাক্তারের সম্মানী স্বয়ংক্রিয়ভাবে কমবে না; সম্মানী ম্যানুয়াল রাখা হয়েছে।
              </p>

              {feeModalError && (
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  {feeModalError}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowFeeModal(false)}
                className="min-h-[50px] px-4 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmFeeAdjustment}
                className="flex-1 min-h-[50px] px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm"
              >
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXIT CONFIRMATION DIALOG */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[20px] max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  ড্রাফট সংরক্ষণ করবেন?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  ফর্মে অসম্পূর্ণ তথ্য রয়েছে। বের হওয়ার আগে কি ড্রাফট সেভ করতে চান?
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  handleSaveDraft();
                  setShowExitConfirm(false);
                  onClose();
                }}
                className="min-h-[46px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                ড্রাফট সেভ করে বন্ধ করুন
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  onClose();
                }}
                className="min-h-[46px] rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-xs"
              >
                সেভ না করে বন্ধ করুন
              </button>
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="min-h-[46px] rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs"
              >
                ফর্মে ফিরে যান
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
