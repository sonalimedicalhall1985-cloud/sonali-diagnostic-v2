import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Crown,
  Briefcase,
  UserCheck,
  FlaskConical,
  FileCheck2,
  Stethoscope,
  WalletCards,
  Megaphone,
  Check,
  X,
  RotateCcw,
  Search,
  Filter,
  UserPlus,
  Key,
  Users,
  Lock,
  Unlock,
  AlertCircle,
  Sparkles,
  Info,
  CheckCircle2,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import { UserRole, PermissionKey } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import {
  ALL_SYSTEM_ROLES,
  ALL_PERMISSION_DEFINITIONS,
  ROLE_CONFIGURATIONS,
  DEFAULT_ROLE_PERMISSIONS,
} from '../services/permissionsService.ts';

const ROLE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Crown: Crown,
  ShieldCheck: ShieldCheck,
  Briefcase: Briefcase,
  UserCheck: UserCheck,
  FlaskConical: FlaskConical,
  FileCheck2: FileCheck2,
  Stethoscope: Stethoscope,
  WalletCards: WalletCards,
  Megaphone: Megaphone,
};

export const RolesAndPermissions: React.FC = () => {
  const {
    user,
    rolePermissions,
    updateRolePermissions,
    resetPermissionsToDefault,
    switchActiveRole,
    isSuperAdmin,
    isAdminOrOwner,
  } = useAuth();
  const { language } = useLanguage();

  const [selectedRole, setSelectedRole] = useState<UserRole>('Receptionist');
  const [activeTab, setActiveTab] = useState<'matrix' | 'users' | 'overview'>('matrix');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Demo staff assignments
  const [staffUsers, setStaffUsers] = useState([
    {
      id: 1,
      name: 'Dr. Sonali Admin',
      email: 'sonalimedicalhall1985@gmail.com',
      role: 'Super Admin / Owner' as UserRole,
      designation: 'Managing Director & Chief Consultant',
      phone: '+8801712345678',
      pin: '1985',
      active: true,
    },
    {
      id: 2,
      name: 'Engr. Mahbubur Rahman',
      email: 'admin@sonalidiag.com',
      role: 'Administrator' as UserRole,
      designation: 'General Operations Administrator',
      phone: '+8801711223344',
      pin: '1234',
      active: true,
    },
    {
      id: 3,
      name: 'Kazi Faruk Ahmed',
      email: 'manager@sonalidiag.com',
      role: 'Manager' as UserRole,
      designation: 'Branch & Clinic Operations Manager',
      phone: '+8801712233445',
      pin: '1234',
      active: true,
    },
    {
      id: 4,
      name: 'Fatema Khatun',
      email: 'reception@sonalidiag.com',
      role: 'Receptionist' as UserRole,
      designation: 'Senior Front Desk Executive',
      phone: '+8801713344556',
      pin: '1234',
      active: true,
    },
    {
      id: 5,
      name: 'Md. Al-Amin',
      email: 'labtech@sonalidiag.com',
      role: 'Lab Technician' as UserRole,
      designation: 'Medical Technologist (Laboratory)',
      phone: '+8801714455667',
      pin: '1234',
      active: true,
    },
    {
      id: 6,
      name: 'Dr. Md. Tariqul Islam',
      email: 'pathologist@sonalidiag.com',
      role: 'Report Approver / Pathologist' as UserRole,
      designation: 'MBBS, MD (Pathology) - Consultant',
      phone: '+8801715566778',
      pin: '1234',
      active: true,
    },
    {
      id: 7,
      name: 'Prof. Dr. A. K. Azad',
      email: 'dr.azad@sonalidiag.com',
      role: 'Doctor' as UserRole,
      designation: 'FCPS, MD (Internal Medicine)',
      phone: '+8801716677889',
      pin: '1234',
      active: true,
    },
    {
      id: 8,
      name: 'Kamal Hossain',
      email: 'accounts@sonalidiag.com',
      role: 'Accountant' as UserRole,
      designation: 'Senior Accounts Officer',
      phone: '+8801717788990',
      pin: '1234',
      active: true,
    },
    {
      id: 9,
      name: 'Tanvir Hossain',
      email: 'marketing@sonalidiag.com',
      role: 'Marketing Representative' as UserRole,
      designation: 'Senior Medical Marketing Officer',
      phone: '+8801718899001',
      pin: '1234',
      active: true,
    },
  ]);

  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [newRoleForUser, setNewRoleForUser] = useState<UserRole>('Receptionist');

  const categories = [
    'All',
    'Dashboard & MIS',
    'Front Desk & Billing',
    'Laboratory & Pathology',
    'Chamber & Doctors',
    'Finance & Accounts',
    'HR & Marketing',
    'Security & Governance',
  ];

  const handleTogglePermission = (role: UserRole, permKey: PermissionKey) => {
    if (role === 'Super Admin / Owner') {
      triggerToast('Super Admin / Owner has permanent full access for system safety.');
      return;
    }

    const currentList = rolePermissions[role] || [];
    let updatedList: PermissionKey[];

    if (currentList.includes(permKey)) {
      updatedList = currentList.filter((k) => k !== permKey);
    } else {
      updatedList = [...currentList, permKey];
    }

    const newMap = {
      ...rolePermissions,
      [role]: updatedList,
    };

    updateRolePermissions(newMap);
    triggerToast(`Updated permissions for "${role}"`);
  };

  const handleEnableAllForRole = (role: UserRole) => {
    if (role === 'Super Admin / Owner') return;
    const allKeys = ALL_PERMISSION_DEFINITIONS.map((p) => p.key);
    const newMap = { ...rolePermissions, [role]: allKeys };
    updateRolePermissions(newMap);
    triggerToast(`Granted all permissions to ${role}`);
  };

  const handleResetCurrentRole = (role: UserRole) => {
    if (role === 'Super Admin / Owner') return;
    const defaultKeys = DEFAULT_ROLE_PERMISSIONS[role] || [];
    const newMap = { ...rolePermissions, [role]: defaultKeys };
    updateRolePermissions(newMap);
    triggerToast(`Reset ${role} to default permissions`);
  };

  const handleResetAllToFactory = () => {
    if (confirm('Reset all 9 roles to hospital factory default permissions?')) {
      resetPermissionsToDefault();
      triggerToast('All roles reset to system defaults');
    }
  };

  const triggerToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const filteredPermissions = ALL_PERMISSION_DEFINITIONS.filter((perm) => {
    const matchesCat = categoryFilter === 'All' || perm.category === categoryFilter;
    const matchesSearch =
      searchQuery === '' ||
      perm.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      perm.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      perm.key.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const selectedRoleConfig = ROLE_CONFIGURATIONS[selectedRole];
  const activePermsForRole = rolePermissions[selectedRole] || [];

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0f2744] text-white border border-teal-500/40 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0a192f] via-[#0f2744] to-[#17375e] text-white p-6 lg:p-8 rounded-3xl border border-teal-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 font-bold text-xs uppercase tracking-wider mb-2 border border-teal-400/30">
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <span>Security & Access Control Governance</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>User Roles & Configurable Permissions</span>
            </h1>
            <p className="text-xs text-teal-200/80 mt-1 max-w-2xl">
              Configure granular security policies for all 9 healthcare workstation roles. Changes apply instantly across all active sessions, APIs, and navigation bars.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleResetAllToFactory}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
              title="Reset all roles to factory defaults"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset Defaults</span>
            </button>
            <div className="px-3 py-2 rounded-xl bg-teal-950/80 border border-teal-500/30 text-teal-300 text-xs font-bold flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>9 Defined Roles</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs within Roles Module */}
        <div className="mt-6 pt-4 border-t border-slate-700/60 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'matrix'
                ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Configurable Permissions Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff Users & Role Assignment ({staffUsers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Role Hierarchy & Responsibility Guide</span>
          </button>
        </div>
      </div>

      {/* Current Active User Status Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 flex items-center justify-center font-black">
            {user?.role ? user.role[0] : 'U'}
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Currently Logged In Session:
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{user?.name}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 dark:border-teal-700">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden md:inline">
            Fast Role Preview:
          </span>
          <select
            value={user?.role}
            onChange={(e) => switchActiveRole(e.target.value as UserRole)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {ALL_SYSTEM_ROLES.map((r) => (
              <option key={r} value={r}>
                Switch to: {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: CONFIGURABLE PERMISSIONS MATRIX               */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: 9 Roles Selector Cards */}
          <div className="lg:col-span-4 space-y-2.5">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
              Select Role to Configure
            </div>

            <div className="space-y-2">
              {ALL_SYSTEM_ROLES.map((role) => {
                const conf = ROLE_CONFIGURATIONS[role];
                const Icon = conf?.iconName && ROLE_ICONS[conf.iconName] ? ROLE_ICONS[conf.iconName] : Shield;
                const isSelected = selectedRole === role;
                const isCurrentActive = user?.role === role;
                const activePermsCount = (rolePermissions[role] || []).length;
                const totalPermsCount = ALL_PERMISSION_DEFINITIONS.length;

                return (
                  <div
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`cursor-pointer rounded-2xl p-3.5 border transition-all text-left relative ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 shadow-md ring-1 ring-teal-500'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-teal-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{role}</span>
                            {isCurrentActive && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Your active session" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {conf?.defaultUser?.name || 'Staff operator'}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {activePermsCount}/{totalPermsCount}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">
                        {role === 'Super Admin / Owner' ? 'Unrestricted Superuser' : 'Configurable Permissions'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          switchActiveRole(role);
                          triggerToast(`Switched active workstation to: ${role}`);
                        }}
                        className="text-teal-600 dark:text-teal-400 hover:underline font-bold flex items-center gap-0.5"
                      >
                        <span>Test Drive</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Permissions Toggles for Selected Role */}
          <div className="lg:col-span-8 space-y-4">
            {/* Selected Role Header */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500 text-slate-950 flex items-center justify-center font-black shadow-md">
                    {selectedRoleConfig?.iconName && ROLE_ICONS[selectedRoleConfig.iconName] ? (
                      React.createElement(ROLE_ICONS[selectedRoleConfig.iconName], { className: 'w-6 h-6' })
                    ) : (
                      <Shield className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-slate-900 dark:text-white">
                        {selectedRole}
                      </h2>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-bold">
                        {activePermsForRole.length} Active Permissions
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {selectedRoleConfig?.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedRole !== 'Super Admin / Owner' && (
                    <>
                      <button
                        onClick={() => handleEnableAllForRole(selectedRole)}
                        className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 hover:bg-teal-100 text-xs font-bold transition border border-teal-200 dark:border-teal-800"
                      >
                        Enable All
                      </button>
                      <button
                        onClick={() => handleResetCurrentRole(selectedRole)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition"
                      >
                        Reset Role
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => switchActiveRole(selectedRole)}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black shadow-md transition"
                  >
                    Login As Role
                  </button>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search permissions by keyword..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Category filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {categories.slice(0, 4).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${
                        categoryFilter === cat
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  <select
                    value={categories.slice(0, 4).includes(categoryFilter) ? 'More' : categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-none focus:ring-0"
                  >
                    <option value="More" disabled>
                      More Categories...
                    </option>
                    {categories.slice(4).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Permissions List */}
            <div className="space-y-3">
              {filteredPermissions.map((perm) => {
                const isEnabled = activePermsForRole.includes(perm.key);
                const isLocked = selectedRole === 'Super Admin / Owner';

                return (
                  <div
                    key={perm.key}
                    onClick={() => !isLocked && handleTogglePermission(selectedRole, perm.key)}
                    className={`rounded-2xl p-4 border transition-all flex items-start justify-between gap-4 ${
                      isEnabled
                        ? 'bg-white dark:bg-slate-900 border-teal-200 dark:border-teal-900/60 shadow-xs'
                        : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70'
                    } ${!isLocked ? 'cursor-pointer hover:border-teal-400' : 'cursor-default'}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {perm.label}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                          {perm.category}
                        </span>
                        <code className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 font-mono">
                          {perm.key}
                        </code>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {perm.description}
                      </p>
                    </div>

                    {/* Toggle Switch */}
                    <div className="shrink-0 pt-0.5">
                      <button
                        type="button"
                        disabled={isLocked}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isEnabled ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                        } ${isLocked ? 'opacity-80 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            isEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredPermissions.length === 0 && (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  No permissions matching the current search criteria.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: STAFF USERS & ROLE ASSIGNMENTS                */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                Authorized Personnel Workstation Directory
              </h3>
              <p className="text-xs text-slate-500">
                Manage staff credentials, workstation PIN codes, and role assignments for all Sonali Diagnostic personnel.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-xl">Employee & Designation</th>
                  <th className="p-3">Email & Phone</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Workstation PIN</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {staffUsers.map((su) => (
                  <tr key={su.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      <div>{su.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{su.designation}</div>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">
                      <div>{su.email}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{su.phone}</div>
                    </td>
                    <td className="p-3">
                      {editingUserId === su.id ? (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={newRoleForUser}
                            onChange={(e) => setNewRoleForUser(e.target.value as UserRole)}
                            className="text-xs p-1 rounded border border-teal-500 bg-white dark:bg-slate-800"
                          >
                            {ALL_SYSTEM_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              setStaffUsers((prev) =>
                                prev.map((u) => (u.id === su.id ? { ...u, role: newRoleForUser } : u))
                              );
                              setEditingUserId(null);
                              triggerToast(`Updated role for ${su.name} to ${newRoleForUser}`);
                            }}
                            className="p-1 rounded bg-teal-600 text-white"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                          <Shield className="w-3 h-3 text-teal-500" />
                          <span>{su.role}</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-slate-500">•••• ({su.pin})</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingUserId(su.id);
                            setNewRoleForUser(su.role);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[11px]"
                        >
                          Change Role
                        </button>
                        <button
                          onClick={() => {
                            switchActiveRole(su.role);
                            triggerToast(`Logged in as ${su.name} (${su.role})`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px]"
                        >
                          Login
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: ROLE RESPONSIBILITY & GOVERNANCE GUIDE        */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_SYSTEM_ROLES.map((role) => {
            const conf = ROLE_CONFIGURATIONS[role];
            const Icon = conf?.iconName && ROLE_ICONS[conf.iconName] ? ROLE_ICONS[conf.iconName] : Shield;
            const perms = rolePermissions[role] || [];

            return (
              <div
                key={role}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 flex items-center justify-center font-black">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {perms.length} Permissions
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{role}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {conf.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Sample Key Privileges:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {perms.slice(0, 5).map((p) => (
                        <span
                          key={p}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-medium border border-teal-200/50 dark:border-teal-900/50"
                        >
                          {p.replace(/_/g, ' ')}
                        </span>
                      ))}
                      {perms.length > 5 && (
                        <span className="text-[10px] px-1.5 py-0.5 text-slate-400 font-bold">
                          +{perms.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Default: {conf.defaultUser?.pin ? `PIN ${conf.defaultUser.pin}` : 'PIN 1234'}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedRole(role);
                      setActiveTab('matrix');
                    }}
                    className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                  >
                    <span>Configure</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
