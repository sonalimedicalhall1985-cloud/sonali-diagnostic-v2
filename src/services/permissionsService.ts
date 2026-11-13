import { UserRole, PermissionKey, PermissionDefinition, RoleConfig } from '../types/index.ts';

export const ALL_SYSTEM_ROLES: UserRole[] = [
  'Super Admin / Owner',
  'Administrator',
  'Manager',
  'Receptionist',
  'Lab Technician',
  'Report Approver / Pathologist',
  'Doctor',
  'Accountant',
  'Marketing Representative',
];

export const ALL_PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Dashboard & MIS
  {
    key: 'view_dashboard',
    label: 'View Executive Dashboard',
    category: 'Dashboard & MIS',
    description: 'Access the main executive KPI dashboard and overview metrics',
  },
  {
    key: 'view_financial_kpis',
    label: 'View Financial KPIs & Profits',
    category: 'Dashboard & MIS',
    description: 'Inspect daily revenue, cash drawer collections, expenses, and net profit',
  },
  {
    key: 'view_executive_summary',
    label: 'View Executive Business Analytics',
    category: 'Dashboard & MIS',
    description: 'View monthly revenue charts, departmental volume, and hourly traffic',
  },
  {
    key: 'export_mis_reports',
    label: 'Export Day-End MIS Reconciliation',
    category: 'Dashboard & MIS',
    description: 'Print and export day-end financial and audit reports',
  },

  // Front Desk & Billing
  {
    key: 'view_patients',
    label: 'View Patient Directory',
    category: 'Front Desk & Billing',
    description: 'Browse, search, and view registered patient records',
  },
  {
    key: 'register_patients',
    label: 'Register New Patients',
    category: 'Front Desk & Billing',
    description: 'Add new patient demographics and generate UHID',
  },
  {
    key: 'edit_patient_info',
    label: 'Edit Patient Demographics',
    category: 'Front Desk & Billing',
    description: 'Update existing patient personal info, phone, and medical history',
  },
  {
    key: 'view_patient_history',
    label: 'View Patient Test History',
    category: 'Front Desk & Billing',
    description: 'Access previous diagnostic reports and invoice history of patients',
  },
  {
    key: 'create_invoice',
    label: 'Generate Diagnostic Bills',
    category: 'Front Desk & Billing',
    description: 'Create new invoices, select tests, and print receipts',
  },
  {
    key: 'edit_invoice',
    label: 'Modify Invoices & Due Adjustments',
    category: 'Front Desk & Billing',
    description: 'Edit ordered tests or adjust bill amounts on active invoices',
  },
  {
    key: 'settle_dues',
    label: 'Collect & Settle Outstanding Dues',
    category: 'Front Desk & Billing',
    description: 'Receive due payments and issue money collection receipts',
  },
  {
    key: 'apply_discounts',
    label: 'Authorize & Apply Billing Discounts',
    category: 'Front Desk & Billing',
    description: 'Apply percentage or fixed fee waivers on diagnostic billing',
  },
  {
    key: 'view_billing_history',
    label: 'View Invoices & Billing Archive',
    category: 'Front Desk & Billing',
    description: 'Search and inspect previous invoices and cashier payments',
  },
  {
    key: 'send_patient_alerts',
    label: 'Send SMS & Email Patient Alerts',
    category: 'Front Desk & Billing',
    description: 'Trigger automated or manual SMS/Email notifications for bills and reports',
  },
  {
    key: 'manage_queue',
    label: 'Manage Token Queue & Counter TV',
    category: 'Front Desk & Billing',
    description: 'Call next token, update waiting screen, and manage patient queue',
  },

  // Laboratory & Pathology
  {
    key: 'view_samples',
    label: 'View Sample Worklist',
    category: 'Laboratory & Pathology',
    description: 'Access the phlebotomy collection list and test requests',
  },
  {
    key: 'collect_samples',
    label: 'Collect & Barcode Samples',
    category: 'Laboratory & Pathology',
    description: 'Acknowledge specimen collection, generate barcodes, and mark received',
  },
  {
    key: 'enter_lab_results',
    label: 'Enter Lab Findings & Analyzer Data',
    category: 'Laboratory & Pathology',
    description: 'Input test parameters, analyzer values, and preliminary findings',
  },
  {
    key: 'approve_lab_reports',
    label: 'Approve & Digitally Sign Reports',
    category: 'Laboratory & Pathology',
    description: 'Authorize clinical findings and apply pathologist digital signature',
  },
  {
    key: 'deliver_lab_reports',
    label: 'Deliver Reports to Patients',
    category: 'Laboratory & Pathology',
    description: 'Mark printed or online report as officially handed over to patient',
  },
  {
    key: 'manage_test_catalog',
    label: 'Manage Diagnostic Test Catalog',
    category: 'Laboratory & Pathology',
    description: 'Configure tests, tariffs, reference ranges, and parameter schemas',
  },

  // Chamber & Doctors
  {
    key: 'view_doctor_schedules',
    label: 'View Doctor Chamber Schedules',
    category: 'Chamber & Doctors',
    description: 'Check specialist consultant timings, fees, and room assignments',
  },
  {
    key: 'manage_chamber_appointments',
    label: 'Book & Manage Doctor Appointments',
    category: 'Chamber & Doctors',
    description: 'Schedule patient appointments, serial tokens, and follow-up calls',
  },
  {
    key: 'write_prescriptions',
    label: 'Prescription & Clinical Consultation',
    category: 'Chamber & Doctors',
    description: 'Compose digital prescription with medicines and advised investigations',
  },
  {
    key: 'view_doctor_commissions',
    label: 'View Doctor Referral Honorariums',
    category: 'Chamber & Doctors',
    description: 'Inspect referral commissions and ultrasonography fixed rates',
  },

  // Finance & Accounts
  {
    key: 'view_accounting',
    label: 'Access Accounting Ledger',
    category: 'Finance & Accounts',
    description: 'View financial balance sheets, cash drawer reconciliation, and vouchers',
  },
  {
    key: 'record_expenses',
    label: 'Record Operating Expenses',
    category: 'Finance & Accounts',
    description: 'Post clinic operational expenses, utility bills, and reagent purchases',
  },
  {
    key: 'approve_commissions',
    label: 'Approve Doctor Honorarium Payouts',
    category: 'Finance & Accounts',
    description: 'Audit and approve calculated referral commission amounts',
  },
  {
    key: 'disburse_commissions',
    label: 'Disburse Commissions via bKash/Bank',
    category: 'Finance & Accounts',
    description: 'Process payment vouchers and record transaction numbers',
  },

  // HR & Marketing
  {
    key: 'manage_employees',
    label: 'Manage Employee Records',
    category: 'HR & Marketing',
    description: 'Add staff, edit payroll, designate duty schedules and department',
  },
  {
    key: 'view_attendance',
    label: 'View Staff Attendance Logs',
    category: 'HR & Marketing',
    description: 'Check daily biometric/PIN attendance of all personnel',
  },
  {
    key: 'mark_attendance',
    label: 'Record Daily Staff Attendance',
    category: 'HR & Marketing',
    description: 'Clock in/out or update attendance status for team members',
  },
  {
    key: 'manage_marketing',
    label: 'Marketing & Field Agent CRM',
    category: 'HR & Marketing',
    description: 'Track field representatives, referral sources, and doctor liaison',
  },

  // Security & Governance
  {
    key: 'view_audit_logs',
    label: 'View Security Audit Trail',
    category: 'Security & Governance',
    description: 'Inspect immutable logs of all billing, medical edits, and staff logins',
  },
  {
    key: 'manage_user_accounts',
    label: 'Manage Staff User Accounts',
    category: 'Security & Governance',
    description: 'Create staff accounts, reset PINs, and grant access',
  },
  {
    key: 'configure_role_permissions',
    label: 'Configure Role Permissions Matrix',
    category: 'Security & Governance',
    description: 'Customize and assign granular security permissions across all 9 roles',
  },
];

// Default baseline permissions for all 9 roles
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  'Super Admin / Owner': ALL_PERMISSION_DEFINITIONS.map((p) => p.key),

  'Administrator': [
    'view_dashboard',
    'view_financial_kpis',
    'view_executive_summary',
    'export_mis_reports',
    'view_patients',
    'register_patients',
    'edit_patient_info',
    'view_patient_history',
    'create_invoice',
    'edit_invoice',
    'settle_dues',
    'apply_discounts',
    'view_billing_history',
    'send_patient_alerts',
    'manage_queue',
    'view_samples',
    'collect_samples',
    'enter_lab_results',
    'approve_lab_reports',
    'deliver_lab_reports',
    'manage_test_catalog',
    'view_doctor_schedules',
    'manage_chamber_appointments',
    'view_doctor_commissions',
    'view_accounting',
    'record_expenses',
    'approve_commissions',
    'disburse_commissions',
    'manage_employees',
    'view_attendance',
    'mark_attendance',
    'manage_marketing',
    'view_audit_logs',
    'manage_user_accounts',
    'configure_role_permissions',
  ],

  'Manager': [
    'view_dashboard',
    'view_financial_kpis',
    'view_executive_summary',
    'export_mis_reports',
    'view_patients',
    'register_patients',
    'edit_patient_info',
    'view_patient_history',
    'create_invoice',
    'edit_invoice',
    'settle_dues',
    'apply_discounts',
    'view_billing_history',
    'send_patient_alerts',
    'manage_queue',
    'view_samples',
    'deliver_lab_reports',
    'manage_test_catalog',
    'view_doctor_schedules',
    'manage_chamber_appointments',
    'view_doctor_commissions',
    'view_accounting',
    'record_expenses',
    'approve_commissions',
    'manage_employees',
    'view_attendance',
    'mark_attendance',
    'manage_marketing',
    'view_audit_logs',
  ],

  'Receptionist': [
    'view_dashboard',
    'view_patients',
    'register_patients',
    'edit_patient_info',
    'view_patient_history',
    'create_invoice',
    'settle_dues',
    'view_billing_history',
    'send_patient_alerts',
    'manage_queue',
    'deliver_lab_reports',
    'view_doctor_schedules',
    'manage_chamber_appointments',
    'mark_attendance',
  ],

  'Lab Technician': [
    'view_samples',
    'collect_samples',
    'enter_lab_results',
    'deliver_lab_reports',
    'view_patient_history',
    'manage_test_catalog',
    'mark_attendance',
  ],

  'Report Approver / Pathologist': [
    'view_samples',
    'enter_lab_results',
    'approve_lab_reports',
    'deliver_lab_reports',
    'view_patient_history',
    'manage_test_catalog',
    'mark_attendance',
  ],

  'Doctor': [
    'view_dashboard',
    'view_patients',
    'view_patient_history',
    'view_doctor_schedules',
    'manage_chamber_appointments',
    'write_prescriptions',
    'view_doctor_commissions',
    'approve_lab_reports',
    'mark_attendance',
  ],

  'Accountant': [
    'view_dashboard',
    'view_financial_kpis',
    'view_executive_summary',
    'export_mis_reports',
    'view_billing_history',
    'settle_dues',
    'view_accounting',
    'record_expenses',
    'approve_commissions',
    'disburse_commissions',
    'view_attendance',
    'mark_attendance',
    'view_audit_logs',
  ],

  'Marketing Representative': [
    'view_doctor_schedules',
    'manage_chamber_appointments',
    'manage_marketing',
    'view_doctor_commissions',
    'mark_attendance',
  ],
};

// Rich configuration metadata for each role
export const ROLE_CONFIGURATIONS: Record<UserRole, RoleConfig> = {
  'Super Admin / Owner': {
    role: 'Super Admin / Owner',
    label: 'Super Admin / Owner (মালিক)',
    badgeColor: 'bg-indigo-600 text-white',
    description: 'Full unconstrained system authority over medical operations, financials, staff governance, and audit trails.',
    iconName: 'Crown',
    permissions: DEFAULT_ROLE_PERMISSIONS['Super Admin / Owner'],
    defaultUser: {
      name: 'Dr. Sonali Admin',
      email: 'sonalimedicalhall1985@gmail.com',
      designation: 'Managing Director & Chief Consultant',
      pin: '1985',
    },
  },
  'Administrator': {
    role: 'Administrator',
    label: 'Administrator (প্রশাসক)',
    badgeColor: 'bg-purple-600 text-white',
    description: 'Comprehensive day-to-day managerial supervision, staff accounts, test catalog setup, and financial approvals.',
    iconName: 'ShieldCheck',
    permissions: DEFAULT_ROLE_PERMISSIONS['Administrator'],
    defaultUser: {
      name: 'Engr. Mahbubur Rahman',
      email: 'admin@sonalidiag.com',
      designation: 'General Operations Administrator',
      pin: '1234',
    },
  },
  'Manager': {
    role: 'Manager',
    label: 'Manager (ম্যানেজার)',
    badgeColor: 'bg-blue-600 text-white',
    description: 'Supervises front desk counters, specimen flow, billing reconciliations, doctor liaison, and shift management.',
    iconName: 'Briefcase',
    permissions: DEFAULT_ROLE_PERMISSIONS['Manager'],
    defaultUser: {
      name: 'Kazi Faruk Ahmed',
      email: 'manager@sonalidiag.com',
      designation: 'Branch & Clinic Operations Manager',
      pin: '1234',
    },
  },
  'Receptionist': {
    role: 'Receptionist',
    label: 'Receptionist / Cashier (ফ্রন্ট ডেস্ক)',
    badgeColor: 'bg-emerald-600 text-white',
    description: 'Patient registration, investigation billing, cash/digital payment receipt, token issuance, and report delivery.',
    iconName: 'UserCheck',
    permissions: DEFAULT_ROLE_PERMISSIONS['Receptionist'],
    defaultUser: {
      name: 'Fatema Khatun',
      email: 'reception@sonalidiag.com',
      designation: 'Senior Front Desk Executive',
      pin: '1234',
    },
  },
  'Lab Technician': {
    role: 'Lab Technician',
    label: 'Lab Technician (ল্যাব টেকনোলজিস্ট)',
    badgeColor: 'bg-cyan-600 text-white',
    description: 'Specimen receipt, automated analyzer operations, biochemistry/hematology measurements, and preliminary finding entry.',
    iconName: 'FlaskConical',
    permissions: DEFAULT_ROLE_PERMISSIONS['Lab Technician'],
    defaultUser: {
      name: 'Md. Al-Amin',
      email: 'labtech@sonalidiag.com',
      designation: 'Medical Technologist (Laboratory)',
      pin: '1234',
    },
  },
  'Report Approver / Pathologist': {
    role: 'Report Approver / Pathologist',
    label: 'Report Approver / Pathologist (প্যাথলজিস্ট)',
    badgeColor: 'bg-teal-600 text-white',
    description: 'Clinical validation of findings, smear cross-examination, abnormal panic flagging, and authorized digital sign-off.',
    iconName: 'FileCheck2',
    permissions: DEFAULT_ROLE_PERMISSIONS['Report Approver / Pathologist'],
    defaultUser: {
      name: 'Dr. Md. Tariqul Islam',
      email: 'pathologist@sonalidiag.com',
      designation: 'MBBS, MD (Pathology) - Consultant Pathologist',
      pin: '1234',
    },
  },
  'Doctor': {
    role: 'Doctor',
    label: 'Doctor / Consultant (কনসালট্যান্ট)',
    badgeColor: 'bg-sky-600 text-white',
    description: 'Chamber patient queue, electronic clinical prescriptions, investigation advice, and referral commission tracking.',
    iconName: 'Stethoscope',
    permissions: DEFAULT_ROLE_PERMISSIONS['Doctor'],
    defaultUser: {
      name: 'Prof. Dr. A. K. Azad',
      email: 'dr.azad@sonalidiag.com',
      designation: 'FCPS, MD (Internal Medicine) - Senior Consultant',
      pin: '1234',
    },
  },
  'Accountant': {
    role: 'Accountant',
    label: 'Accountant (হিসাবরক্ষক)',
    badgeColor: 'bg-amber-600 text-white',
    description: 'Cash drawer closing, daily vouchers, operational expense verification, and doctor honorarium payment disbursement.',
    iconName: 'WalletCards',
    permissions: DEFAULT_ROLE_PERMISSIONS['Accountant'],
    defaultUser: {
      name: 'Kamal Hossain',
      email: 'accounts@sonalidiag.com',
      designation: 'Senior Accounts Officer',
      pin: '1234',
    },
  },
  'Marketing Representative': {
    role: 'Marketing Representative',
    label: 'Marketing Representative (মার্কেটিং)',
    badgeColor: 'bg-rose-600 text-white',
    description: 'Field doctor liaison, referral source coordination, medical camps, and regional patient relationship management.',
    iconName: 'Megaphone',
    permissions: DEFAULT_ROLE_PERMISSIONS['Marketing Representative'],
    defaultUser: {
      name: 'Tanvir Hossain',
      email: 'marketing@sonalidiag.com',
      designation: 'Senior Medical Marketing Officer',
      pin: '1234',
    },
  },
};

const STORAGE_KEY = 'sdc_role_permissions_v1';

/**
 * Load customized role permissions from local storage or fallback to defaults
 */
export function getSavedRolePermissions(): Record<UserRole, PermissionKey[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure all 9 roles are present
      const merged = { ...DEFAULT_ROLE_PERMISSIONS };
      for (const role of ALL_SYSTEM_ROLES) {
        if (Array.isArray(parsed[role])) {
          // Super admin always retains all permissions
          if (role === 'Super Admin / Owner') {
            merged[role] = DEFAULT_ROLE_PERMISSIONS['Super Admin / Owner'];
          } else {
            merged[role] = parsed[role];
          }
        }
      }
      return merged;
    }
  } catch (err) {
    console.error('Error loading role permissions:', err);
  }
  return { ...DEFAULT_ROLE_PERMISSIONS };
}

/**
 * Save customized role permissions
 */
export function saveRolePermissions(
  permissionsMap: Record<UserRole, PermissionKey[]>
): void {
  try {
    // Super admin always retains all permissions
    permissionsMap['Super Admin / Owner'] = DEFAULT_ROLE_PERMISSIONS['Super Admin / Owner'];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(permissionsMap));
    window.dispatchEvent(new CustomEvent('sdc_permissions_updated'));
  } catch (err) {
    console.error('Error saving role permissions:', err);
  }
}

/**
 * Reset all permissions to system factory defaults
 */
export function resetRolePermissionsToDefaults(): Record<UserRole, PermissionKey[]> {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('sdc_permissions_updated'));
  return { ...DEFAULT_ROLE_PERMISSIONS };
}

/**
 * Check if a role has a specific permission
 */
export function checkRolePermission(
  role: UserRole | string,
  permission: PermissionKey,
  customMap?: Record<UserRole, PermissionKey[]>
): boolean {
  if (role === 'Super Admin / Owner') return true;
  const currentMap = customMap || getSavedRolePermissions();
  const permissions = currentMap[role as UserRole];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Determine which navigation tabs a role is allowed to view
 */
export function getAuthorizedTabsForRole(
  role: UserRole,
  customMap?: Record<UserRole, PermissionKey[]>
): string[] {
  const has = (key: PermissionKey) => checkRolePermission(role, key, customMap);

  const tabs: string[] = [];

  // Super Admin / Owner has access to everything
  if (role === 'Super Admin / Owner') {
    return [
      'dashboard',
      'patients',
      'billing',
      'samples',
      'labResults',
      'reports',
      'tests',
      'doctors',
      'queue',
      'freeCamp',
      'bloodDonors',
      'accounting',
      'employees',
      'marketing',
      'audit',
      'roles',
    ];
  }

  if (has('view_dashboard')) tabs.push('dashboard');
  if (has('view_patients')) tabs.push('patients');
  if (has('create_invoice') || has('view_billing_history')) tabs.push('billing');
  if (has('view_samples') || has('collect_samples')) tabs.push('samples');
  if (has('enter_lab_results')) tabs.push('labResults');
  if (has('approve_lab_reports') || has('deliver_lab_reports')) tabs.push('reports');
  if (has('manage_test_catalog')) tabs.push('tests');
  if (has('view_doctor_schedules') || has('manage_chamber_appointments')) tabs.push('doctors');
  if (has('manage_queue')) tabs.push('queue');
  tabs.push('freeCamp');
  tabs.push('bloodDonors');
  if (has('view_accounting') || has('record_expenses')) tabs.push('accounting');
  if (has('manage_employees') || has('view_attendance')) tabs.push('employees');
  if (has('manage_marketing')) tabs.push('marketing');
  if (has('view_audit_logs')) tabs.push('audit');
  if (has('configure_role_permissions') || role === 'Administrator') tabs.push('roles');

  return tabs;
}
