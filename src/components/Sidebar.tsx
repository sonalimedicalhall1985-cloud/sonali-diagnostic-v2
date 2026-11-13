import React from 'react';
import {
  LayoutDashboard,
  Users,
  FlaskConical,
  CreditCard,
  TestTube2,
  FileCheck2,
  Stethoscope,
  Tv,
  WalletCards,
  UserCheck,
  Megaphone,
  ShieldAlert,
  ClipboardList,
  Sparkles,
  ShieldCheck,
  Sliders,
  HeartHandshake,
  Droplet,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export type NavTab =
  | 'dashboard'
  | 'patients'
  | 'billing'
  | 'samples'
  | 'labResults'
  | 'reports'
  | 'tests'
  | 'doctors'
  | 'queue'
  | 'freeCamp'
  | 'bloodDonors'
  | 'accounting'
  | 'employees'
  | 'marketing'
  | 'audit'
  | 'roles';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const { language, t } = useLanguage();
  const { user, canAccessTab } = useAuth();

  const navSections = [
    {
      title: 'EXECUTIVE & OVERVIEW',
      items: [
        { id: 'dashboard' as NavTab, label: t.nav.dashboard, icon: LayoutDashboard, badge: 'KPI' },
      ],
    },
    {
      title: 'FRONT DESK & PATIENTS',
      items: [
        { id: 'patients' as NavTab, label: t.nav.patients, icon: Users },
        { id: 'billing' as NavTab, label: t.nav.billing, icon: CreditCard, highlight: true },
        { id: 'queue' as NavTab, label: t.nav.queue, icon: Tv, badge: 'Live TV' },
        {
          id: 'freeCamp' as NavTab,
          label: language === 'bn' ? 'ফ্রি হেলথ ক্যাম্প' : 'Free Health Camp',
          icon: HeartHandshake,
          badge: 'CSR',
        },
        {
          id: 'bloodDonors' as NavTab,
          label: language === 'bn' ? 'রক্তদাতার তালিকা' : 'Blood Donors',
          icon: Droplet,
          badge: 'STAT',
        },
      ],
    },
    {
      title: 'LABORATORY DIAGNOSTICS',
      items: [
        { id: 'samples' as NavTab, label: t.nav.samples, icon: TestTube2 },
        { id: 'labResults' as NavTab, label: t.nav.labResults, icon: FlaskConical },
        { id: 'reports' as NavTab, label: t.nav.reports, icon: FileCheck2, badge: 'Sign' },
        { id: 'tests' as NavTab, label: t.nav.tests, icon: ClipboardList },
      ],
    },
    {
      title: 'CHAMBER & OPERATIONS',
      items: [
        { id: 'doctors' as NavTab, label: t.nav.doctors, icon: Stethoscope },
        { id: 'accounting' as NavTab, label: t.nav.accounting, icon: WalletCards },
        { id: 'employees' as NavTab, label: t.nav.employees, icon: UserCheck },
        { id: 'marketing' as NavTab, label: t.nav.marketing, icon: Megaphone },
      ],
    },
    {
      title: 'SECURITY & GOVERNANCE',
      items: [
        { id: 'roles' as NavTab, label: language === 'bn' ? 'রোল ও পারমিশন' : 'Roles & Permissions', icon: ShieldCheck, badge: 'RBAC' },
        { id: 'audit' as NavTab, label: t.nav.audit, icon: ShieldAlert },
      ],
    },
  ];

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccessTab(item.id)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 z-45 h-screen lg:h-[calc(100vh-4rem)] w-64 shrink-0 bg-[#0f2744] text-slate-300 flex flex-col transition-transform duration-200 ease-in-out border-r border-[#17375e] ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex lg:hidden items-center justify-between p-4 border-b border-[#17375e]">
          <span className="font-bold text-white text-sm">SONALI ERP</span>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
          {visibleSections.map((section, sIdx) => (
            <div key={sIdx}>
              <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-teal-600 text-white shadow-md shadow-teal-900/40'
                          : 'text-slate-300 hover:bg-[#17375e] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-white' : 'text-teal-400 group-hover:text-teal-300'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            isActive
                              ? 'bg-teal-800 text-teal-100'
                              : 'bg-[#17375e] text-teal-300 border border-teal-800/40'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Active Role & Workstation Info */}
        <div className="p-3 bg-[#0a1b30] border-t border-[#17375e] text-[11px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Active Role</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-teal-950 text-teal-300 border border-teal-700/40">
              RBAC Guarded
            </span>
          </div>
          <div className="font-bold text-white text-xs truncate">
            {user?.role || 'Guest'}
          </div>
          <div className="text-[10px] text-teal-300/80 truncate">
            {user?.name || 'Staff User'}
          </div>
        </div>
      </aside>
    </>
  );
};
