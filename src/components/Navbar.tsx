import React, { useState } from 'react';
import {
  Activity,
  Globe,
  Moon,
  Sun,
  Shield,
  User,
  LogOut,
  ChevronDown,
  Download,
  CheckCircle,
  Menu,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { PWAInstallModal } from './PWAInstallModal.tsx';
import { LoginModal } from './LoginModal.tsx';
import { UserRole } from '../types/index.ts';

interface NavbarProps {
  onToggleSidebar: () => void;
  onNavigateToRoles?: () => void;
}

const ALL_ROLES: UserRole[] = [
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

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onNavigateToRoles }) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, signInWithGoogle, logout, switchActiveRole, loading } = useAuth();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left: Mobile Toggle & Brand Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0f2744] to-teal-700 flex items-center justify-center text-teal-300 shadow-md">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base lg:text-lg tracking-tight text-[#0f2744] dark:text-teal-400">
                  {language === 'bn' ? 'সোনালী ডায়াগনস্টিক সেন্টার' : 'SONALI DIAGNOSTIC CENTER'}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300">
                  ERP v2.6
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
                {language === 'bn' ? t.bengaliTagline : t.tagline}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions, Language, Theme, Role Selector, PWA */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* PWA Install Button */}
          {!isInstalled ? (
            <button
              onClick={() => {
                if (isInstallable) {
                  install();
                } else {
                  setShowInstallModal(true);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-700/20 transition active:scale-95"
              title="Install app on Mobile, Tablet or PC"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'অ্যাপ ইনস্টল করুন' : 'Install App'}</span>
            </button>
          ) : (
            <div
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[10px] font-bold"
              title="Running as installed app"
            >
              <CheckCircle className="w-3 h-3 text-teal-600 dark:text-teal-400" />
              <span>{language === 'bn' ? 'ইনস্টলড' : 'Installed'}</span>
            </div>
          )}

          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Toggle English / বাংলা"
          >
            <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>{language === 'en' ? 'বাংলা' : 'EN'}</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Toggle Light / Dark mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Role Switcher & User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 transition border border-slate-200 dark:border-slate-700"
            >
              <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[10px]">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-semibold text-[11px] leading-tight truncate max-w-[120px]">
                  {user?.name || 'Staff User'}
                </div>
                <div className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">
                  {user?.role || 'Guest'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in duration-150">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">{user?.name || 'Authorized Staff'}</div>
                  <div className="text-[11px] text-slate-500 truncate">{user?.email || 'Workstation Session'}</div>
                  <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300">
                    <Shield className="w-3 h-3" />
                    {user?.role || 'Guest'}
                  </div>
                </div>

                <div className="px-3 py-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Switch Role (9 Roles)</span>
                  {onNavigateToRoles && (
                    <button
                      onClick={() => {
                        onNavigateToRoles();
                        setShowRoleDropdown(false);
                      }}
                      className="text-teal-600 dark:text-teal-400 hover:underline capitalize font-bold"
                    >
                      Manage RBAC
                    </button>
                  )}
                </div>

                <div className="max-h-48 overflow-y-auto py-1">
                  {ALL_ROLES.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        switchActiveRole(r);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 ${
                        user?.role === r ? 'font-bold text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/30' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="truncate">{r}</span>
                      {user?.role === r && <CheckCircle className="w-3 h-3 text-teal-600" />}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-2 px-2 space-y-1">
                  <button
                    onClick={() => {
                      setShowRoleDropdown(false);
                      setShowLoginModal(true);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 flex items-center gap-2"
                  >
                    <Shield className="w-3.5 h-3.5 text-teal-600" />
                    <span>Staff Login / Workstation PIN</span>
                  </button>
                  <button
                    onClick={signInWithGoogle}
                    disabled={loading}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span>Sign In with Google</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setShowRoleDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comprehensive Device PWA Install Modal */}
      {showInstallModal && <PWAInstallModal onClose={() => setShowInstallModal(false)} />}

      {/* Staff Login / Workstation PIN Modal */}
      {showLoginModal && <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />}
    </header>
  );
};
