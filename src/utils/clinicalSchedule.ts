/**
 * Clinical Scheduling, Bengali Calendar & Patient Intake Utilities
 * Sonali Diagnostic Center ERP
 */

// Bengali Days of the Week mapping (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
export const BENGALI_DAYS_SHORT = [
  'রবি',      // 0 - Sunday
  'সোম',     // 1 - Monday
  'মঙ্গল',    // 2 - Tuesday
  'বুধ',      // 3 - Wednesday
  'বৃহস্পতি', // 4 - Thursday
  'শুক্র',    // 5 - Friday
  'শনি',      // 6 - Saturday
];

export const BENGALI_DAYS_FULL = [
  'রবিবার (Sunday)',
  'সোমবার (Monday)',
  'মঙ্গলবার (Tuesday)',
  'বুধবার (Wednesday)',
  'বৃহস্পতিবার (Thursday)',
  'শুক্রবার (Friday)',
  'শনিবার (Saturday)',
];

export interface BengaliDayPill {
  index: number;
  label: string;
  fullLabel: string;
  isAvailable: boolean;
  isSelected: boolean;
  dayIndex: number;
  nameBn: string;
  isOpen: boolean;
}

const DAY_ALIASES: Record<number, string[]> = {
  0: ['sun', 'রবি', 'sunday'],
  1: ['mon', 'সোম', 'monday'],
  2: ['tue', 'মঙ্গল', 'tuesday'],
  3: ['wed', 'বুধ', 'wednesday'],
  4: ['thu', 'বৃহস্পতি', 'thursday'],
  5: ['fri', 'শুক্র', 'friday'],
  6: ['sat', 'শনি', 'saturday'],
};

/**
 * Checks whether a doctor is available on a specific day of the week (0 = Sun, ..., 6 = Sat or YYYY-MM-DD date string)
 */
export function isDoctorAvailableOnDay(chamberDays: string, dayOrDate: number | string): boolean {
  if (!chamberDays || chamberDays.trim() === '') return true;

  let dayOfWeekIndex: number;
  if (typeof dayOrDate === 'string') {
    try {
      const d = new Date(dayOrDate + 'T00:00:00');
      dayOfWeekIndex = isNaN(d.getDay()) ? 0 : d.getDay();
    } catch {
      return true;
    }
  } else {
    dayOfWeekIndex = dayOrDate;
  }

  const lower = chamberDays.toLowerCase();

  // If daily (প্রতিদিন) — inspect any exclusion / off-day clause such as "(শুক্র ও সোমবার বন্ধ)" or "(Except Friday)"
  if (lower.includes('daily') || lower.includes('প্রতিদিন')) {
    const hasExclusion =
      lower.includes('বন্ধ') ||
      lower.includes('বাদে') ||
      lower.includes('except') ||
      lower.includes('off') ||
      lower.includes('no ');

    if (hasExclusion) {
      const parenMatch = lower.match(/\(([^)]+)\)/);
      const exclusionScope = parenMatch ? parenMatch[1] : lower;
      const aliases = DAY_ALIASES[dayOfWeekIndex] || [];
      if (aliases.some((alias) => exclusionScope.includes(alias))) {
        return false;
      }
    }
    return true;
  }

  const aliases = DAY_ALIASES[dayOfWeekIndex] || [];
  return aliases.some((alias) => lower.includes(alias));
}

export const CLINIC_DOCTOR_PRIORITY_PATTERNS = [
  'নাবিলা হাসান',
  'জাফর আলী',
  'তাসনিম আফরোজ',
  'রুহুল আমিন',
  'সুজিত চন্দ্র',
  'হাবিবুর রহমান',
  'মাইদুল ইসলাম',
];

export function getDoctorPriorityRank(name: string): number {
  const normalized = (name || '').trim().toLowerCase();
  for (let i = 0; i < CLINIC_DOCTOR_PRIORITY_PATTERNS.length; i++) {
    if (normalized.includes(CLINIC_DOCTOR_PRIORITY_PATTERNS[i])) {
      return i;
    }
  }
  return CLINIC_DOCTOR_PRIORITY_PATTERNS.length;
}

export function sortDoctorsByPriority<T extends { id?: number; name: string }>(list: T[]): T[] {
  return [...list]
    .filter((doc) => !(doc.name || '').includes('মোস্তফা কামাল'))
    .sort((a, b) => {
      const rankA = getDoctorPriorityRank(a.name);
      const rankB = getDoctorPriorityRank(b.name);
      if (rankA !== rankB) return rankA - rankB;
      return (a.id ?? 9999) - (b.id ?? 9999);
    });
}

/**
 * Returns Bengali day pill items for a doctor's schedule and the currently selected date
 */
export function getDoctorDayPills(chamberDays: string, selectedDateStr?: string): BengaliDayPill[] {
  let selectedDayIndex = -1;
  if (selectedDateStr) {
    try {
      const d = new Date(selectedDateStr + 'T00:00:00');
      selectedDayIndex = isNaN(d.getDay()) ? -1 : d.getDay();
    } catch {
      selectedDayIndex = -1;
    }
  }

  // Display week starting Saturday as customary in Bangladesh (Sat, Sun, Mon, Tue, Wed, Thu, Fri)
  const orderedIndices = [6, 0, 1, 2, 3, 4, 5];

  return orderedIndices.map((idx) => {
    const isAvail = isDoctorAvailableOnDay(chamberDays, idx);
    return {
      index: idx,
      dayIndex: idx,
      label: BENGALI_DAYS_SHORT[idx],
      nameBn: BENGALI_DAYS_SHORT[idx],
      fullLabel: BENGALI_DAYS_FULL[idx],
      isAvailable: isAvail,
      isOpen: isAvail,
      isSelected: idx === selectedDayIndex,
    };
  });
}

/**
 * Calculates the next available date for a doctor starting from today (or tomorrow if off-day)
 */
export function getNextAvailableDoctorDate(chamberDays: string, startDate?: string): string {
  const baseDate = startDate ? new Date(startDate + 'T00:00:00') : new Date();

  // Search forward up to 14 days
  for (let i = 0; i < 14; i++) {
    const candidate = new Date(baseDate);
    candidate.setDate(baseDate.getDate() + i);
    const dayIdx = candidate.getDay();
    if (isDoctorAvailableOnDay(chamberDays, dayIdx)) {
      return candidate.toISOString().split('T')[0];
    }
  }

  // Fallback to today
  return new Date().toISOString().split('T')[0];
}

/**
 * Formats a date string (YYYY-MM-DD) into clean Bengali format with day name
 * Example: "14/11/2026 (শনিবার)"
 */
export function formatBengaliDateWithDay(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const dayIdx = d.getDay();
    const shortDay = BENGALI_DAYS_SHORT[dayIdx];
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]} (${shortDay}বার)`;
    }
    return `${dateStr} (${shortDay}বার)`;
  } catch {
    return dateStr;
  }
}

/**
 * Curated Sylhet & Regional diagnostic catchment areas for address autocomplete
 */
export const DEFAULT_CATCHMENT_LOCATIONS = [
  'জিন্দাবাজার, সিলেট',
  'আম্বরখানা, সিলেট',
  'মীরবক্সটুলা, সিলেট',
  'শাহী ঈদগাহ, সিলেট',
  'সুবিদবাজার, সিলেট',
  'লামাবাজার, সিলেট',
  'দক্ষিণ সুরমা, সিলেট',
  'টিলাগড়, সিলেট',
  'উপশহর, সিলেট',
  'চৌহাট্টা, সিলেট',
  'শিবগঞ্জ, সিলেট',
  'মেডিকেল রোড, সিলেট',
  'পাঠানটুলা, সিলেট',
  'কুমারপাড়া, সিলেট',
  'দরগাহ গেট, সিলেট',
  'কাজীর বাজার, সিলেট',
  'বিয়ানীবাজার, সিলেট',
  'গোলাপগঞ্জ, সিলেট',
  'ফেঞ্চুগঞ্জ, সিলেট',
  'ওসমানীনগর, সিলেট',
  'ছাতক, সুনামগঞ্জ',
  'মৌলভীবাজার সদর',
  'হবিগঞ্জ সদর',
];

/**
 * Combines existing patient addresses with default catchment areas and filters by search query
 */
export function getMatchingAddresses(
  searchQuery: string,
  existingAddresses: string[] = []
): string[] {
  const query = (searchQuery || '').trim().toLowerCase();
  const allUnique = Array.from(
    new Set([...existingAddresses.filter(Boolean), ...DEFAULT_CATCHMENT_LOCATIONS])
  );

  if (!query) {
    return allUnique.slice(0, 8);
  }

  return allUnique.filter((addr) => addr.toLowerCase().includes(query)).slice(0, 8);
}

/**
 * Classifies Blood Pressure readings
 */
export function classifyBloodPressure(
  systolic: number | string,
  diastolic: number | string
): { label: string; color: string; badgeBg: string } {
  const sys = typeof systolic === 'string' ? parseInt(systolic, 10) : systolic;
  const dia = typeof diastolic === 'string' ? parseInt(diastolic, 10) : diastolic;

  if (isNaN(sys) || isNaN(dia) || sys <= 0 || dia <= 0) {
    return { label: 'অসম্পূর্ণ BP', color: 'text-slate-400', badgeBg: 'bg-slate-100 text-slate-600' };
  }

  if (sys < 90 || dia < 60) {
    return { label: 'নিম্ন রক্তচাপ (Low BP)', color: 'text-blue-600', badgeBg: 'bg-blue-50 text-blue-700' };
  }
  if (sys <= 120 && dia <= 80) {
    return { label: 'স্বাভাবিক (Normal BP)', color: 'text-emerald-600', badgeBg: 'bg-emerald-50 text-emerald-700' };
  }
  if (sys <= 139 || dia <= 89) {
    return { label: 'প্রি-হাইপারটেনশন (Pre-HTN)', color: 'text-amber-600', badgeBg: 'bg-amber-50 text-amber-700' };
  }
  return { label: 'উচ্চ রক্তচাপ (High BP / HTN)', color: 'text-rose-600', badgeBg: 'bg-rose-50 text-rose-700' };
}

// ============================================================
// Bengali Numeral, DD/MM/YYYY, Chamber Cards & Unique ID Engine
// ============================================================

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliDigits(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)] ?? d);
}

export function toAsciiDigits(value: string | null | undefined): string {
  if (!value) return '';
  return String(value).replace(/[০-৯]/g, (d) => {
    const idx = BN_DIGITS.indexOf(d);
    return idx >= 0 ? String(idx) : d;
  });
}

export function formatBengaliNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '০';
  const num = typeof value === 'number' ? value : Number(toAsciiDigits(String(value)).replace(/[^\d.-]/g, ''));
  if (isNaN(num)) return toBengaliDigits(String(value));
  const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num);
  return toBengaliDigits(formatted);
}

/**
 * Formats YYYY-MM-DD or Date into DD/MM/YYYY strictly in Bengali numerals.
 */
export function formatBengaliDDMMYYYY(dateInput: string | Date): string {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') {
    const isoMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return toBengaliDigits(`${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`);
    }
  }
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return toBengaliDigits(String(dateInput));
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return toBengaliDigits(`${dd}/${mm}/${yyyy}`);
}

export function formatLocalIsoDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export interface ChamberDateCardItem {
  iso: string;
  ddMmYyyyBn: string;
  ddMmBn: string;
  dayShortBn: string;
  dayFullBn: string;
  relativeBadgeBn?: string;
}

/**
 * Generates upcoming open chamber dates as horizontal scrollable card items.
 */
export function getUpcomingChamberDates(chamberDays: string, count = 10): ChamberDateCardItem[] {
  const results: ChamberDateCardItem[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < 45 && results.length < count; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const dayIdx = d.getDay();
    if (isDoctorAvailableOnDay(chamberDays, dayIdx)) {
      const iso = formatLocalIsoDate(d);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      results.push({
        iso,
        ddMmYyyyBn: formatBengaliDDMMYYYY(iso),
        ddMmBn: toBengaliDigits(`${dd}/${mm}`),
        dayShortBn: BENGALI_DAYS_SHORT[dayIdx],
        dayFullBn: `${BENGALI_DAYS_SHORT[dayIdx]}বার`,
        relativeBadgeBn: offset === 0 ? 'আজ' : offset === 1 ? 'আগামীকাল' : undefined,
      });
    }
  }

  return results;
}

/**
 * Resolves a numeric day-of-month input ("অন্য দিন", e.g. "25") into an ISO YYYY-MM-DD date.
 * Assumes current month & year; if that day already passed in the current month, advances to next month.
 */
export function resolveDayOfMonthToIsoDate(
  dayRaw: string,
  now = new Date()
): { valid: boolean; iso?: string; ddMmYyyyBn?: string; dayFullBn?: string; error?: string } {
  const ascii = toAsciiDigits(dayRaw).replace(/\D/g, '');
  if (!ascii) return { valid: false };

  const dayNum = parseInt(ascii, 10);
  if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
    return { valid: false, error: 'অনুগ্রহ করে ১ থেকে ৩১-এর মধ্যে সঠিক দিন লিখুন।' };
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let year = today.getFullYear();
  let month = today.getMonth();

  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const candidateCurrentDay = Math.min(dayNum, daysInCurrentMonth);
  let target = new Date(year, month, candidateCurrentDay);

  if (target < today || dayNum > daysInCurrentMonth) {
    // Move to next month if passed or doesn't fit cleanly in current month
    if (target < today) {
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }
    const daysInTargetMonth = new Date(year, month + 1, 0).getDate();
    target = new Date(year, month, Math.min(dayNum, daysInTargetMonth));
  }

  const iso = formatLocalIsoDate(target);
  return {
    valid: true,
    iso,
    ddMmYyyyBn: formatBengaliDDMMYYYY(iso),
    dayFullBn: `${BENGALI_DAYS_SHORT[target.getDay()]}বার`,
  };
}

/**
 * Extracts the 9 digits after the fixed "01" prefix, handling pastes like 017..., +88017..., 88017...
 */
export function normalizeBdMobileRemainder(raw: string): string {
  const digitsOnly = toAsciiDigits(raw).replace(/\D/g, '');
  if (!digitsOnly) return '';

  let cleaned = digitsOnly;
  if (cleaned.startsWith('8801') && cleaned.length >= 11) {
    cleaned = cleaned.slice(4);
  } else if (cleaned.startsWith('880') && cleaned.length >= 11) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.startsWith('01') && cleaned.length >= 10) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('1') && cleaned.length === 10) {
    cleaned = cleaned.slice(1);
  }
  return cleaned.slice(0, 9);
}

export function isValidBdPhone(full11Phone: string): boolean {
  return /^01[3-9]\d{8}$/.test(toAsciiDigits(full11Phone).trim());
}

export interface LivePatientIdResult {
  id: string;
  baseId: string;
  isCollision: boolean;
  collidingPatientName?: string;
}

export function computeLivePatientId(params: {
  mode: 'mobile' | 'other';
  fullPhone: string;
  digitCount: number;
  isProxyPhone: boolean;
  manualCustomId?: string;
  existingPatients: Array<{ patientId: string; name?: string }>;
}): LivePatientIdResult {
  const existingMap = new Map<string, string>();
  params.existingPatients.forEach((p) => {
    if (p.patientId) existingMap.set(p.patientId.trim().toLowerCase(), p.name || '');
  });

  const resolveUnique = (base: string): LivePatientIdResult => {
    const cleanBase = base.trim();
    if (!cleanBase) {
      return { id: '', baseId: '', isCollision: false };
    }
    const colliding = existingMap.get(cleanBase.toLowerCase());
    if (colliding === undefined) {
      return { id: cleanBase, baseId: cleanBase, isCollision: false };
    }
    let suffix = 2;
    while (existingMap.has(`${cleanBase}-${suffix}`.toLowerCase())) {
      suffix += 1;
    }
    return {
      id: `${cleanBase}-${suffix}`,
      baseId: cleanBase,
      isCollision: true,
      collidingPatientName: colliding,
    };
  };

  if (params.mode === 'other' || params.isProxyPhone) {
    const manual = (params.manualCustomId || '').trim();
    if (manual) {
      return resolveUnique(manual);
    }
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const prefix = `PT-${yy}${mm}${dd}-`;
    let seq = params.existingPatients.length + 1;
    let candidate = `${prefix}${String(seq).padStart(4, '0')}`;
    while (existingMap.has(candidate.toLowerCase())) {
      seq += 1;
      candidate = `${prefix}${String(seq).padStart(4, '0')}`;
    }
    return { id: candidate, baseId: candidate, isCollision: false };
  }

  // Option 1: trailing N digits of mobile phone
  const cleanPhone = toAsciiDigits(params.fullPhone).replace(/\D/g, '');
  const len = Math.max(4, Math.min(8, params.digitCount || 6));
  if (cleanPhone.length < len) {
    return { id: '', baseId: '', isCollision: false };
  }
  const base = cleanPhone.slice(-len);
  return resolveUnique(base);
}
