export type UserRole =
  | 'Super Admin / Owner'
  | 'Administrator'
  | 'Manager'
  | 'Receptionist'
  | 'Lab Technician'
  | 'Report Approver / Pathologist'
  | 'Doctor'
  | 'Accountant'
  | 'Marketing Representative';

export interface UserProfile {
  id?: number;
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  designation?: string;
  active?: boolean;
}

export interface Patient {
  id: number;
  patientId: string;
  name: string;
  age: number;
  dob?: string;
  gender: 'Male' | 'Female' | 'Other';
  phone?: string;
  address?: string;
  bloodGroup?: string;
  weightKg?: string;
  sizeOrHeight?: string; // শারীরিক সাইজ / উচ্চতা (Size / Height)
  bloodPressure?: string;
  systolicBp?: string;
  diastolicBp?: string;
  referringDoctor?: string;
  notes?: string;
  isProxyPhone?: boolean;
  willingToDonateBlood?: boolean;
  createdAt: string;
}

export interface TestParameter {
  name: string;
  unit: string;
  normalRange: string;
  defaultValue?: string;
  result?: string;
  status?: 'Normal' | 'High' | 'Low' | 'Critical';
}

export interface DiagnosticTest {
  id: number;
  code: string;
  name: string;
  category: string;
  department: string;
  price: string;
  sampleType: string;
  sampleRequirements?: string;
  tatHours: number;
  methodology?: string;
  referenceRanges?: string;
  units?: string;
  parametersSchema: TestParameter[];
  active: boolean;
}

export interface InvoiceItem {
  id?: number;
  invoiceId?: string;
  testId: number;
  testCode: string;
  testName: string;
  category: string;
  price: string;
  status?: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientGender?: string;
  patientAge?: number;
  referringDoctor?: string;
  subtotal: string;
  discountType: 'fixed' | 'percentage';
  discountValue: string;
  total: string;
  paidAmount: string;
  dueAmount: string;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid' | 'Refunded';
  paymentMethod: string;
  doctorId?: number;
  commissionType?: 'percentage' | 'fixed';
  commissionRate?: string;
  commissionAmount?: string;
  commissionPaid?: boolean;
  commissionNotes?: string;
  notes?: string;
  createdByName?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: number;
  invoiceId: string;
  amount: string;
  paymentMethod: string;
  transactionRef?: string;
  notes?: string;
  receivedByName?: string;
  createdAt: string;
}

export interface SampleItem {
  id: number;
  sampleId: string;
  invoiceId: string;
  patientId: string;
  patientName: string;
  testId: number;
  testName: string;
  sampleType: string;
  barcode: string;
  status:
    | 'Test Ordered'
    | 'Sample Pending'
    | 'Sample Collected'
    | 'Sample Received'
    | 'Processing'
    | 'Result Entered'
    | 'Under Review'
    | 'Approved'
    | 'Report Delivered'
    | 'Rejected';
  collectorName?: string | null;
  collectedAt?: string | null;
  receivedAt?: string | null;
  rejectedReason?: string | null;
  notes?: string | null;
}

export interface LabReport {
  id: number;
  reportNumber: string;
  invoiceId: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  referringDoctor?: string;
  testId: number;
  testCode: string;
  testName: string;
  category: string;
  sampleId?: string;
  sampleType?: string;
  status: 'Draft' | 'Under Review' | 'Approved' | 'Delivered';
  results: TestParameter[];
  abnormalFlag: boolean;
  technicianName?: string;
  pathologistName?: string;
  pathologistCredentials?: string;
  comments?: string;
  approvedAt?: string | null;
  deliveredAt?: string | null;
  qrCodeHash: string;
  createdAt: string;
}

export type PermissionKey =
  // Dashboard & Analytics
  | 'view_dashboard'
  | 'view_financial_kpis'
  | 'view_executive_summary'
  | 'export_mis_reports'
  // Patients & Reception
  | 'view_patients'
  | 'register_patients'
  | 'edit_patient_info'
  | 'view_patient_history'
  // Billing & Counter
  | 'create_invoice'
  | 'edit_invoice'
  | 'settle_dues'
  | 'apply_discounts'
  | 'view_billing_history'
  | 'send_patient_alerts'
  // Laboratory
  | 'view_samples'
  | 'collect_samples'
  | 'enter_lab_results'
  | 'approve_lab_reports'
  | 'deliver_lab_reports'
  | 'manage_test_catalog'
  // Doctor Chamber
  | 'view_doctor_schedules'
  | 'manage_chamber_appointments'
  | 'write_prescriptions'
  | 'view_doctor_commissions'
  // Queue TV
  | 'manage_queue'
  // Accounting & Expenses
  | 'view_accounting'
  | 'record_expenses'
  | 'approve_commissions'
  | 'disburse_commissions'
  // HR & Staff
  | 'manage_employees'
  | 'view_attendance'
  | 'mark_attendance'
  // Marketing
  | 'manage_marketing'
  // Security & Audit
  | 'view_audit_logs'
  | 'manage_user_accounts'
  | 'configure_role_permissions';

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  category:
    | 'Dashboard & MIS'
    | 'Front Desk & Billing'
    | 'Laboratory & Pathology'
    | 'Chamber & Doctors'
    | 'Finance & Accounts'
    | 'HR & Marketing'
    | 'Security & Governance';
  description: string;
}

export interface RoleConfig {
  role: UserRole;
  label: string;
  badgeColor: string;
  description: string;
  iconName: string;
  permissions: PermissionKey[];
  defaultUser?: {
    name: string;
    email: string;
    designation: string;
    pin: string;
  };
}

export interface MockNotification {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  type: 'SMS' | 'Email' | 'Both';
  triggerEvent:
    | 'Lab Report Generated'
    | 'Report Approved'
    | 'Bill Issued'
    | 'Due Payment Settled'
    | 'Critical Panic Alert';
  referenceId: string; // e.g. REP-261107-0001-1 or INV-...
  testName?: string;
  status: 'Delivered' | 'Queued' | 'Sent';
  sentAt: string;
  messageContent: string;
  emailSubject?: string;
  emailBodyHtml?: string;
}

export interface Doctor {
  id: number;
  name: string;
  qualifications: string;
  specialty: string;
  department: string;
  chamberDays: string;
  chamberTime: string;
  fee: string;
  phone?: string;
  roomNo?: string;
  maxPatientsPerDay?: number;
  commissionType?: 'percentage' | 'fixed' | 'custom';
  commissionRate?: string;
  usgFixedCommission?: string; // প্রতি আল্ট্রাসনো বাবদ ৩০০ টাকা ফিক্সড
  generalTestCommissionRate?: string; // অন্যান্য টেস্টের উপর ২০-২৫-৩০%
  customTestRates?: any;
  bkashNumber?: string;
  bankAccount?: string;
  bankName?: string;
  isChamberDoctor?: boolean;
  active: boolean;
}

export interface DoctorCommission {
  id: number;
  doctorId?: number;
  doctorName: string;
  invoiceNumber: string;
  patientName: string;
  billTotal: string;
  commissionType: 'percentage' | 'fixed' | 'custom';
  rate: string;
  usgTestsCount?: number;
  usgCommissionAmount?: string;
  otherTestsAmount?: string;
  otherTestsCommissionAmount?: string;
  testsBreakdown?: any[];
  calculatedAmount: string;
  approvedAmount: string; // e.g. 550 can be edited to 600 or 500
  status: 'Pending' | 'Approved' | 'Paid' | 'Cancelled';
  paymentMethod: string;
  doctorBkash?: string;
  doctorBank?: string;
  transactionRef?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
}

export interface Appointment {
  id: number;
  serialNumber: number;
  doctorId: number;
  doctorName: string;
  doctorSpecialty?: string;
  patientId?: string;
  patientName: string;
  patientPhone: string;
  patientAge?: number;
  patientGender?: string;
  appointmentDate: string;
  timeSlot?: string;
  status: 'Waiting' | 'In Consultation' | 'Completed' | 'Cancelled';
  fee: string;
  feePaid: boolean;
  marketingSource?: string;
  marketingRepId?: number;
  marketingRepName?: string;
  marketingHonorarium?: string;
  honorarium?: string;
  callStatus?: 'Connected' | 'No Answer' | 'Switched Off' | 'Wrong Number' | 'Missed Call' | 'Not Called';
  callDurationSeconds?: number;
  callNotes?: string;
  feedbackStatus?: 'Satisfied' | 'Needs Follow-up' | 'Report Pending' | 'Medicines Started' | 'Neutral';
  feedbackNotes?: string;
  smsSent?: boolean;
  isProxyPhone?: boolean;
  originalFee?: string;
  feeWaived?: boolean;
  waiverReason?: string;
  lastCalledAt?: string;
  notes?: string;
  createdAt: string;
}

export interface Prescription {
  id?: number;
  prescriptionNumber: string;
  appointmentId?: number;
  doctorId: number;
  doctorName: string;
  doctorQualifications: string;
  doctorSpecialty: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientPhone?: string;
  chiefComplaints: string;
  clinicalFindings?: string;
  diagnosis?: string;
  medicines: {
    name: string;
    dosage: string; // e.g. 1+0+1
    frequency: string; // e.g. After meal
    duration: string; // e.g. 7 days
    instructions?: string;
  }[];
  advisedTests: {
    testCode: string;
    testName: string;
    price: string;
  }[];
  adviceNotes?: string;
  nextVisitDate?: string;
  createdAt?: string;
}

export interface QueueToken {
  id: number;
  tokenNumber: number;
  tokenCode: string;
  department: string;
  counterNo: string;
  patientName?: string;
  patientPhone?: string;
  patientAddress?: string; // রোগীর ঠিকানা / এলাকা
  patientWeight?: string; // ওজন (kg)
  patientSizeOrHeight?: string; // শারীরিক সাইজ / উচ্চতা
  patientBloodPressure?: string; // রক্তচাপ (mmHg)
  systolicBp?: string;
  diastolicBp?: string;
  slipSize?: string; // '80mm POS Thermal' | '58mm Compact POS' | 'A5 Sheet'
  printCopies?: number; // 1 or 2
  status: 'Waiting' | 'Calling' | 'In Service' | 'Hold' | 'Completed' | 'Cancelled';
  calledAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Expense {
  id: number;
  category: string;
  title: string;
  amount: string;
  paymentMethod: string;
  receiptNo?: string;
  approvedBy?: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface Employee {
  id: number;
  name: string;
  designation: string;
  department: string;
  phone: string;
  email?: string;
  joiningDate: string;
  basicSalary: string;
  status: 'Active' | 'On Leave' | 'Resigned';
  dutySchedule: string;
  shiftType?: 'Morning (08:00 - 14:00)' | 'Evening (14:00 - 20:00)' | 'Night (20:00 - 08:00)' | 'General Duty';
  assignedResponsibility?: string; // কার কি দায়িত্ব
  isRemoteAllowed?: boolean; // রিমোট কাজের সুবিধা
  remoteWorkStatus?: 'On-Site Workstation' | 'Remote Active' | 'Offline / Off-Duty';
  currentShiftStatus?: 'Active on Duty' | 'Upcoming Shift' | 'Shift Completed' | 'On Leave';
}

export interface StaffTask {
  id: number;
  employeeId?: number;
  employeeName: string;
  title: string;
  description?: string;
  priority: 'Urgent / STAT' | 'High' | 'Normal';
  department: string;
  assignedBy: string;
  dueDate: string;
  isRemote: boolean; // রিমোট কাজ
  status: 'Pending' | 'In Progress' | 'Completed' | 'Review Required';
  completedAt?: string;
  notes?: string;
}

export interface EmergencyHandover {
  id: number;
  handoverNumber: string;
  date: string;
  fromShift: string;
  toShift: string;
  outgoingStaffName: string;
  incomingStaffName: string;
  criticalPatientsNotes: string; // জরুরি সার্ভিস ও ক্রিটিক্যাল রুগীদের তথ্য
  pendingSamplesCount: number;
  urgentReportsCount: number;
  reagentEquipmentStatus: string;
  acknowledged: boolean; // কাজ বুঝে নেওয়া
  acknowledgedAt?: string;
  createdAt: string;
}

export interface StaffDirective {
  id: number;
  title: string;
  content: string;
  category: 'Urgent Directive' | 'Clinical Protocol' | 'Administrative SOP' | 'General Circular';
  priority: 'Emergency' | 'High' | 'Routine';
  issuedBy: string;
  targetRoles: string[];
  acknowledgmentCount: number;
  acknowledgedBy: string[];
  createdAt: string;
}

export interface FreeHealthCamp {
  id: number;
  campCode: string;
  title: string;
  bengaliTitle: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  chiefConsultants: string[];
  freeServices: string[];
  discountedServices?: string[];
  registeredPatientsCount: number;
  targetPatients: number;
  status: 'Upcoming' | 'Registration Open' | 'Ongoing Today' | 'Completed';
  bannerNotice?: string;
  contactPhone: string;
  createdAt: string;
}

export interface CampPatientRegistration {
  id: number;
  campId: number;
  patientName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone?: string;
  villageOrArea: string;
  registeredServices: string[];
  tokenNumber: number;
  consultationDone: boolean;
  bloodPressure?: string;
  weightKg?: string;
  bloodGroup?: string;
  createdAt: string;
}

export interface BloodDonor {
  id: number;
  donorId: string;
  name: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  phone: string;
  alternatePhone?: string;
  area: string;
  thanaOrUpazila: string;
  district: string;
  gender: 'Male' | 'Female';
  age: number;
  weightKg?: number;
  lastDonationDate?: string;
  isEligible: boolean;
  totalDonations: number;
  notes?: string;
  availableForEmergency: boolean;
  createdAt: string;
}

export interface EmployeeAttendance {
  id: number;
  employeeId: number;
  employeeName: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'On Leave';
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}

export interface MarketingRep {
  id: number;
  name: string;
  phone: string;
  area: string;
  monthlyTarget: string;
  active: boolean;
  gender?: 'Female' | 'Male';
  isFemaleRep?: boolean; // নারী মার্কেটিং কর্মীদের আলাদা চিহ্নিতকরণ
  defaultHonorarium?: string;
  notes?: string;
}

export interface AuditLog {
  id: number;
  userUid?: string;
  userName?: string;
  role?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface DepartmentBreakdown {
  department: string;
  count: number;
  revenue: number;
  percentage: number;
  color: string;
}

export interface HourlyTraffic {
  hour: string;
  patients: number;
  revenue: number;
}

export interface ReferringDoctorMetric {
  id: number;
  name: string;
  specialty: string;
  referrals: number;
  totalBilled: number;
  honorarium: number;
  status: string;
}

export interface CriticalAlert {
  reportNumber: string;
  patientName: string;
  testName: string;
  parameter: string;
  result: string;
  normalRange: string;
  severity: string;
  status: string;
}

export interface DashboardStats {
  todayPatients: number;
  yesterdayPatients: number;
  totalPatients: number;
  todayBilling: number;
  todayCollected: number;
  todayDues: number;
  todayDiscounts: number;
  todayExpenses: number;
  netProfitToday: number;
  pendingReports: number;
  criticalAlertsCount: number;
  urgentReports: number;
  completedReports: number;
  totalReports: number;
  pendingSamples: number;
  todayAppointments: number;
  todayTokensCount?: number;
  todayTestIdsCount?: number;
  totalPendingTasks?: number;
  activeDirectivesCount?: number;
  upcomingCampCount?: number;
  totalEmployees: number;
  employeesPresentToday: number;
  tatSlaRate: number;
  cashDrawer: number;
  digitalPayments: number;
  monthlySummary: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
  departmentBreakdown: DepartmentBreakdown[];
  hourlyTraffic: HourlyTraffic[];
  topReferringDoctors: ReferringDoctorMetric[];
  criticalAlerts: CriticalAlert[];
}
