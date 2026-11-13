import React, { useState } from 'react';
import {
  X,
  Lock,
  User,
  Key,
  Shield,
  CheckCircle,
  Crown,
  Briefcase,
  UserCheck,
  FlaskConical,
  FileCheck2,
  Stethoscope,
  WalletCards,
  Megaphone,
  ArrowRight,
  Sparkles,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { UserRole } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import {
  ALL_SYSTEM_ROLES,
  ROLE_CONFIGURATIONS,
} from '../services/permissionsService.ts';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Crown: Crown,
  ShieldCheck: Shield,
  Briefcase: Briefcase,
  UserCheck: UserCheck,
  FlaskConical: FlaskConical,
  FileCheck2: FileCheck2,
  Stethoscope: Stethoscope,
  WalletCards: WalletCards,
  Megaphone: Megaphone,
};

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { user, loginWithCredentials, signInAsStaffRole, signInWithGoogle, logout, loading } = useAuth();
  const { language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'workstation' | 'credentials' | 'google'>('workstation');
  const [emailOrUser, setEmailOrUser] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUser) {
      setError('Please enter your email, username, or role name');
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await loginWithCredentials(emailOrUser, pin || '1234');
    setSubmitting(false);
    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Invalid credentials or PIN');
    }
  };

  const handleRoleQuickLogin = async (role: UserRole) => {
    const conf = ROLE_CONFIGURATIONS[role];
    await signInAsStaffRole(
      role,
      conf?.defaultUser?.name,
      conf?.defaultUser?.email,
      conf?.defaultUser?.designation
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0a192f] via-[#0f2744] to-[#17375e] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500 text-slate-950 flex items-center justify-center font-black shadow-lg">
              SDC
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold uppercase tracking-wider mb-1 border border-teal-400/30">
                <Sparkles className="w-3 h-3" />
                <span>Sonali Diagnostic Workstation Login</span>
              </div>
              <h2 className="text-xl font-black text-white">
                {language === 'bn' ? 'স্টাফ ও চিকিৎসক লগইন পোর্টাল' : 'Staff & Clinical Authentication'}
              </h2>
              <p className="text-xs text-teal-200/80">
                Select your assigned workstation role or sign in with your PIN credentials.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-5 flex gap-2">
            <button
              onClick={() => {
                setActiveTab('workstation');
                setError(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'workstation'
                  ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>9 Workstation Roles</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('credentials');
                setError(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'credentials'
                  ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>PIN / Password</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('google');
                setError(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'google'
                  ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Google SSO</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 p-3 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: 9 QUICK WORKSTATION ROLES */}
          {activeTab === 'workstation' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Click any workstation below to sign in instantly with simulated role permissions:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {ALL_SYSTEM_ROLES.map((role) => {
                  const conf = ROLE_CONFIGURATIONS[role];
                  const Icon = conf?.iconName && ROLE_ICONS[conf.iconName] ? ROLE_ICONS[conf.iconName] : Shield;
                  const isCurrent = user?.role === role;

                  return (
                    <button
                      key={role}
                      onClick={() => handleRoleQuickLogin(role)}
                      className={`text-left p-3 rounded-2xl border transition-all flex flex-col justify-between group ${
                        isCurrent
                          ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 shadow-sm ring-1 ring-teal-500'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-600 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isCurrent
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 group-hover:bg-teal-600 group-hover:text-white transition'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {role}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {conf?.defaultUser?.name}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-100 dark:border-slate-700/60 text-teal-600 dark:text-teal-400 font-bold">
                        <span>{isCurrent ? 'Active Now' : 'Sign In'}</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CREDENTIALS / PIN */}
          {activeTab === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4 max-w-md mx-auto py-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email, Username or Role Name
                </label>
                <input
                  type="text"
                  value={emailOrUser}
                  onChange={(e) => setEmailOrUser(e.target.value)}
                  placeholder="e.g. reception, labtech, dr.azad, admin, owner"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Workstation Security PIN (Default: 1234 or Owner: 1985)
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter 4-digit PIN..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs shadow-lg shadow-teal-700/20 transition active:scale-95 disabled:opacity-50"
              >
                {submitting ? 'Verifying Workstation PIN...' : 'Log In to Workstation'}
              </button>

              <div className="text-center text-[11px] text-slate-400">
                Tip: You can type any role name (e.g. <code>accountant</code>, <code>receptionist</code>, <code>doctor</code>) with default PIN <code>1234</code>.
              </div>
            </form>
          )}

          {/* TAB 3: GOOGLE SSO */}
          {activeTab === 'google' && (
            <div className="text-center py-6 space-y-4 max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto shadow-md">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Google Workspace / Firebase Auth
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Sign in with your verified Google clinical account. Owner account (<code>sonalimedicalhall1985@gmail.com</code>) receives automatic Super Admin privileges.
                </p>
              </div>

              <button
                onClick={async () => {
                  await signInWithGoogle();
                  onClose();
                }}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-800 dark:text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {user && (
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Active session:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {user.name} ({user.role})
              </span>
            </div>
            <button
              onClick={async () => {
                await logout();
                onClose();
              }}
              className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
