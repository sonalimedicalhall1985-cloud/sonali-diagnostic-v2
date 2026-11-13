import { pgTable, serial, text, timestamp, integer, numeric, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users & Staff
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID or internal staff UID
  email: text('email').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('Receptionist'), // Owner, Administrator, Manager, Receptionist, Lab Technician, Report Approver, Doctor, Accountant, Marketing Representative
  phone: text('phone'),
  designation: text('designation'),
  pinHash: text('pin_hash'),
  active: boolean('active').notNull().default(true),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 2. Patients
export const patients = pgTable('patients', {
  id: serial('id').primaryKey(),
  patientId: text('patient_id').notNull().unique(), // e.g., SDC-P-202611-0001
  name: text('name').notNull(),
  age: integer('age').notNull(),
  dob: text('dob'),
  gender: text('gender').notNull(), // Male, Female, Other
  phone: text('phone').notNull(),
  address: text('address'),
  bloodGroup: text('blood_group'),
  referringDoctor: text('referring_doctor'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. Diagnostic Tests Catalog
export const tests = pgTable('tests', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(), // CBC, LFT, KFT, RBS, LIPID, TSH, etc.
  name: text('name').notNull(),
  category: text('category').notNull(), // Hematology, Biochemistry, Clinical Pathology, etc.
  department: text('department').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  sampleType: text('sample_type').notNull(), // Blood (EDTA), Serum, Urine, Stool, etc.
  sampleRequirements: text('sample_requirements'),
  tatHours: integer('tat_hours').notNull().default(6),
  methodology: text('methodology'),
  referenceRanges: text('reference_ranges'),
  units: text('units'),
  parametersSchema: jsonb('parameters_schema'), // Parameter array [{name, unit, normalRange, defaultValue}]
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. Invoices & Billing
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(), // e.g., INV-261101-0001
  patientId: text('patient_id').notNull(),
  patientName: text('patient_name').notNull(),
  patientPhone: text('patient_phone').notNull(),
  patientGender: text('patient_gender'),
  patientAge: integer('patient_age'),
  referringDoctor: text('referring_doctor'),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  discountType: text('discount_type').default('fixed'), // fixed, percentage
  discountValue: numeric('discount_value', { precision: 10, scale: 2 }).default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  paidAmount: numeric('paid_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  dueAmount: numeric('due_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  paymentStatus: text('payment_status').notNull().default('Unpaid'), // Paid, Partial, Unpaid, Refunded
  paymentMethod: text('payment_method').default('Cash'), // Cash, Card, bKash, Nagad, Rocket, Bank
  doctorId: integer('doctor_id'),
  commissionType: text('commission_type').default('percentage'), // percentage, fixed
  commissionRate: numeric('commission_rate', { precision: 10, scale: 2 }).default('0'),
  commissionAmount: numeric('commission_amount', { precision: 10, scale: 2 }).default('0'),
  commissionPaid: boolean('commission_paid').default(false),
  commissionNotes: text('commission_notes'),
  notes: text('notes'),
  createdByUid: text('created_by_uid'),
  createdByName: text('created_by_name'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 5. Invoice Items
export const invoiceItems = pgTable('invoice_items', {
  id: serial('id').primaryKey(),
  invoiceId: text('invoice_id').notNull(),
  testId: integer('test_id').notNull(),
  testCode: text('test_code').notNull(),
  testName: text('test_name').notNull(),
  category: text('category').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('Ordered'), // Ordered, Sample Collected, Processing, Completed
  createdAt: timestamp('created_at').defaultNow(),
});

// 6. Payments
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  invoiceId: text('invoice_id').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').notNull().default('Cash'),
  transactionRef: text('transaction_ref'),
  notes: text('notes'),
  receivedByName: text('received_by_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 7. Samples & Tracking
export const samples = pgTable('samples', {
  id: serial('id').primaryKey(),
  sampleId: text('sample_id').notNull().unique(), // SMP-261101-0001
  invoiceId: text('invoice_id').notNull(),
  patientId: text('patient_id').notNull(),
  patientName: text('patient_name').notNull(),
  testId: integer('test_id').notNull(),
  testName: text('test_name').notNull(),
  sampleType: text('sample_type').notNull(),
  barcode: text('barcode').notNull(),
  status: text('status').notNull().default('Sample Pending'), // Test Ordered, Sample Pending, Sample Collected, Sample Received, Processing, Result Entered, Under Review, Approved, Report Delivered
  collectorName: text('collector_name'),
  collectedAt: timestamp('collected_at'),
  receivedAt: timestamp('received_at'),
  rejectedReason: text('rejected_reason'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 8. Laboratory Reports & Results
export const labReports = pgTable('lab_reports', {
  id: serial('id').primaryKey(),
  reportNumber: text('report_number').notNull().unique(), // REP-261101-0001
  invoiceId: text('invoice_id').notNull(),
  patientId: text('patient_id').notNull(),
  patientName: text('patient_name').notNull(),
  patientAge: integer('patient_age'),
  patientGender: text('patient_gender'),
  referringDoctor: text('referring_doctor'),
  testId: integer('test_id').notNull(),
  testCode: text('test_code').notNull(),
  testName: text('test_name').notNull(),
  category: text('category').notNull(),
  sampleId: text('sample_id'),
  sampleType: text('sample_type'),
  status: text('status').notNull().default('Draft'), // Draft, Under Review, Approved, Delivered
  results: jsonb('results'), // Parameters key-values: [{parameter, result, unit, normalRange, status: Normal|High|Low|Critical}]
  abnormalFlag: boolean('abnormal_flag').default(false),
  technicianName: text('technician_name'),
  pathologistName: text('pathologist_name'),
  pathologistCredentials: text('pathologist_credentials'),
  comments: text('comments'),
  approvedAt: timestamp('approved_at'),
  deliveredAt: timestamp('delivered_at'),
  qrCodeHash: text('qr_code_hash'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 9. Doctors
export const doctors = pgTable('doctors', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  qualifications: text('qualifications').notNull(),
  specialty: text('specialty').notNull(),
  department: text('department').notNull(),
  chamberDays: text('chamber_days').notNull(), // Sat, Sun, Mon...
  chamberTime: text('chamber_time').notNull(), // 05:00 PM - 09:00 PM
  fee: numeric('fee', { precision: 10, scale: 2 }).notNull(),
  phone: text('phone'),
  roomNo: text('room_no'),
  maxPatientsPerDay: integer('max_patients_per_day').default(30),
  commissionType: text('commission_type').default('percentage'), // percentage, fixed, custom
  commissionRate: numeric('commission_rate', { precision: 10, scale: 2 }).default('20.00'),
  usgFixedCommission: numeric('usg_fixed_commission', { precision: 10, scale: 2 }).default('300.00'), // প্রতি আল্ট্রাসনো বাবদ ৩০০ টাকা পাবে ডাক্তার ফিক্স
  generalTestCommissionRate: numeric('general_test_commission_rate', { precision: 10, scale: 2 }).default('25.00'), // অন্য টেস্টের উপর ২০-২৫-৩০%
  customTestRates: jsonb('custom_test_rates'), // [{ testCode, fixedAmount, percentage }]
  bkashNumber: text('bkash_number'), // বিকাশ নম্বর (তাৎক্ষণিক পেমেন্টের জন্য)
  bankAccount: text('bank_account'), // ব্যাংক অ্যাকাউন্ট নম্বর
  bankName: text('bank_name'), // ব্যাংকের নাম ও শাখা
  isChamberDoctor: boolean('is_chamber_doctor').notNull().default(true),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Doctor Commission / Honorarium Ledger
export const doctorCommissions = pgTable('doctor_commissions', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id'),
  doctorName: text('doctor_name').notNull(),
  invoiceNumber: text('invoice_number').notNull(),
  patientName: text('patient_name').notNull(),
  billTotal: numeric('bill_total', { precision: 10, scale: 2 }).notNull(),
  commissionType: text('commission_type').default('percentage'), // percentage, fixed, custom
  rate: numeric('rate', { precision: 10, scale: 2 }).notNull(),
  usgTestsCount: integer('usg_tests_count').default(0),
  usgCommissionAmount: numeric('usg_commission_amount', { precision: 10, scale: 2 }).default('0'),
  otherTestsAmount: numeric('other_tests_amount', { precision: 10, scale: 2 }).default('0'),
  otherTestsCommissionAmount: numeric('other_tests_commission_amount', { precision: 10, scale: 2 }).default('0'),
  testsBreakdown: jsonb('tests_breakdown'), // Details of tests and commission per test
  calculatedAmount: numeric('calculated_amount', { precision: 10, scale: 2 }).notNull(),
  approvedAmount: numeric('approved_amount', { precision: 10, scale: 2 }).notNull(), // editable e.g. 550 changed to 600 or 500
  status: text('status').notNull().default('Pending'), // Pending, Approved, Paid, Cancelled
  paymentMethod: text('payment_method').default('bKash'), // bKash, Cash, Bank Transfer
  doctorBkash: text('doctor_bkash'),
  doctorBank: text('doctor_bank'),
  transactionRef: text('transaction_ref'),
  paidAt: timestamp('paid_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 10. Appointments
export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  serialNumber: integer('serial_number').notNull(),
  doctorId: integer('doctor_id').notNull(),
  doctorName: text('doctor_name').notNull(),
  doctorSpecialty: text('doctor_specialty'),
  patientId: text('patient_id'),
  patientName: text('patient_name').notNull(),
  patientPhone: text('patient_phone').notNull(),
  patientAge: integer('patient_age'),
  patientGender: text('patient_gender'),
  appointmentDate: text('appointment_date').notNull(), // YYYY-MM-DD
  timeSlot: text('time_slot'),
  status: text('status').notNull().default('Waiting'), // Waiting, In Consultation, Completed, Cancelled
  fee: numeric('fee', { precision: 10, scale: 2 }).notNull(),
  feePaid: boolean('fee_paid').notNull().default(false),
  // Marketing Tracking
  marketingSource: text('marketing_source').default('Direct Walk-in'), // Direct Walk-in, Marketing Rep, Social Media / Facebook, Leaflet / Campaign
  marketingRepId: integer('marketing_rep_id'),
  marketingRepName: text('marketing_rep_name'),
  // Call Logging & Patient Follow-up
  callStatus: text('call_status').default('Not Called'), // Connected / Answered, No Answer, Switched Off, Wrong Number, Missed Call, Not Called
  callDurationSeconds: integer('call_duration_seconds').default(0),
  callNotes: text('call_notes'),
  feedbackStatus: text('feedback_status'), // Satisfied, Needs Follow-up, Report Pending, Medicines Started
  feedbackNotes: text('feedback_notes'),
  smsSent: boolean('sms_sent').default(false),
  lastCalledAt: timestamp('last_called_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 11. Queue Tokens (Local LAN & Reception TV Display)
export const queueTokens = pgTable('queue_tokens', {
  id: serial('id').primaryKey(),
  tokenNumber: integer('token_number').notNull(),
  tokenCode: text('token_code').notNull(), // T-001, L-001, C-001
  department: text('department').notNull().default('Reception'), // Reception, Sample Collection, Doctor Chamber, Billing
  counterNo: text('counter_no').default('1'),
  patientName: text('patient_name'),
  patientPhone: text('patient_phone'),
  status: text('status').notNull().default('Waiting'), // Waiting, Calling, In Service, Hold, Completed, Cancelled
  calledAt: timestamp('called_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 12. Accounting & Expenses
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  category: text('category').notNull(), // Lab Reagents, Electricity, Rent, Maintenance, Staff Welfare, Office Supplies, Doctor Payment, Marketing
  title: text('title').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').default('Cash'),
  receiptNo: text('receipt_no'),
  approvedBy: text('approved_by'),
  date: text('date').notNull(), // YYYY-MM-DD
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 13. Employees & Attendance
export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  designation: text('designation').notNull(),
  department: text('department').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  joiningDate: text('joining_date').notNull(),
  basicSalary: numeric('basic_salary', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('Active'), // Active, On Leave, Resigned
  dutySchedule: text('duty_schedule').default('Morning (8 AM - 4 PM)'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const employeeAttendance = pgTable('employee_attendance', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  employeeName: text('employee_name').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  status: text('status').notNull().default('Present'), // Present, Absent, Late, On Leave
  checkIn: text('check_in'),
  checkOut: text('check_out'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 14. Marketing Representatives
export const marketingReps = pgTable('marketing_reps', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  area: text('area').notNull(),
  monthlyTarget: numeric('monthly_target', { precision: 10, scale: 2 }).default('100000'),
  active: boolean('active').notNull().default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 15. Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid'),
  userName: text('user_name'),
  role: text('role'),
  action: text('action').notNull(), // LOGIN, CREATE_INVOICE, APPROVE_REPORT, RECORD_PAYMENT, etc.
  entityType: text('entity_type'), // Patient, Invoice, Report, etc.
  entityId: text('entity_id'),
  details: text('details'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow(),
});
