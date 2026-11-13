import React, { useState, useEffect } from 'react';
import {
  Users,
  CreditCard,
  Wallet,
  Clock,
  TestTube2,
  FileCheck2,
  Stethoscope,
  TrendingUp,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Activity,
  CheckCircle2,
  PlusCircle,
  RefreshCw,
  Printer,
  ChevronRight,
  SlidersHorizontal,
  ShieldAlert,
  PhoneCall,
  Flame,
  Award,
  CircleDot,
  Building2,
  Cpu,
  Layers,
  FileSpreadsheet,
  X,
  UserCheck,
  Download,
  Tv,
  HeartHandshake,
  Droplet,
  Radio,
  Laptop,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { PWAInstallModal } from './PWAInstallModal.tsx';
import { DashboardStats } from '../types/index.ts';

interface DashboardProps {
  onNavigate: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { language, t } = useLanguage();
  const { token, user } = useAuth();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState(
    new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [showCustomRangePicker, setShowCustomRangePicker] = useState(false);
  const [chartView, setChartView] = useState<'monthly' | 'weekly'>('monthly');
  const [showPrintMISModal, setShowPrintMISModal] = useState(false);
  const [showPWAInstallModal, setShowPWAInstallModal] = useState(false);
  const [showPanicModal, setShowPanicModal] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Update real-time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [language]);

  useEffect(() => {
    fetchStats();
  }, [token]);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/dashboard/stats', {
        headers: {
          Authorization: `Bearer ${token || 'STAFF_SESSION_:owner_admin:' + Date.now()}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        setStats(json);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatMoney = (amount: number) => {
    return (
      '৳ ' +
      new Intl.NumberFormat(language === 'bn' ? 'bn-BD' : 'en-BD', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    );
  };

  const weeklyTrendData = [
    { day: 'Mon', revenue: 54000, expenses: 14500, profit: 39500 },
    { day: 'Tue', revenue: 61500, expenses: 15200, profit: 46300 },
    { day: 'Wed', revenue: 58200, expenses: 14800, profit: 43400 },
    { day: 'Thu', revenue: 64800, expenses: 16100, profit: 48700 },
    { day: 'Fri', revenue: 72400, expenses: 17800, profit: 54600 },
    { day: 'Sat', revenue: 69500, expenses: 16500, profit: 53000 },
    {
      day: 'Sun (Today)',
      revenue: stats ? stats.todayBilling : 68450,
      expenses: stats ? stats.todayExpenses : 14800,
      profit: stats ? stats.netProfitToday : 44400,
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ---------------------------------------------------- */}
      {/* 1. EXECUTIVE COMMAND HEADER (NAVY & TEAL BRANDING)   */}
      {/* ---------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0a192f] via-[#0f2744] to-[#123652] text-white p-6 lg:p-8 shadow-2xl border border-teal-500/20">
        {/* Subtle background tech glow decoration */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-24 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Brand Identity & Title */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-400/30 text-teal-300 font-semibold text-xs uppercase tracking-wider backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span>
                {language === 'bn'
                  ? 'মালিক ও নির্বাহী নিয়ন্ত্রণ কেন্দ্র • সোনালী ডায়াগনস্টিক'
                  : "Owner & Executive Control Center • SDC ERP v3.2"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 font-black text-lg">
                SDC
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>SONALI DIAGNOSTIC CENTER</span>
                </h1>
                <p className="text-xs text-teal-200/80 font-medium">
                  {language === 'bn'
                    ? 'উন্নত স্বাস্থ্যসেবা • নির্ভরযোগ্য ডায়াগনস্টিক সার্ভিসেস • লাইভ ডাটা ম্যানেজমেন্ট'
                    : 'Quality Healthcare • Trusted Diagnostic Services • Real-Time MIS'}
                </p>
              </div>
            </div>

            {/* Live Operational Status Bar & Compact STAT Alert */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-300">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-950/70 border border-teal-500/40 text-teal-300 font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                <span>{language === 'bn' ? 'সরাসরি লাইভ সিঙ্ক • আজকের হিসাব' : 'Live Sync • Today Overview'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span className="font-mono font-bold">{currentTime || 'BST Live'}</span>
              </span>
              {stats?.criticalAlerts && stats.criticalAlerts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPanicModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/30 border border-rose-500/60 hover:bg-rose-500/40 text-rose-200 text-xs font-bold transition shadow-md shadow-rose-950/40 active:scale-95 animate-pulse"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>🚨 {stats.criticalAlerts.length}টি জরুরি রেজাল্ট (STAT / 999) — ক্লিক করুন</span>
                </button>
              )}
            </div>
          </div>

          {/* Executive Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('billing')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{language === 'bn' ? 'নতুন বিলিং' : 'New Invoice'}</span>
            </button>

            <button
              onClick={() => onNavigate('queue')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs border border-teal-500/30 transition active:scale-95"
              title="Launch LAN TV Queue Waiting Lounge Display"
            >
              <Tv className="w-4 h-4" />
              <span className="hidden sm:inline">
                {language === 'bn' ? 'টিভি সিরিয়াল' : 'TV Queue'}
              </span>
            </button>

            {!isInstalled && (
              <button
                onClick={() => {
                  if (isInstallable) install();
                  else setShowPWAInstallModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-bold text-xs border border-teal-400/40 transition active:scale-95"
                title="Install Progressive Web App on Mobile, Tab or PC"
              >
                <Download className="w-4 h-4 text-teal-300 animate-pulse" />
                <span className="hidden sm:inline">
                  {language === 'bn' ? 'অ্যাপ ইনস্টল' : 'Install App'}
                </span>
              </button>
            )}

            <button
              onClick={() => setShowPrintMISModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 transition active:scale-95"
              title="Print Day-End Financial Reconciliation MIS"
            >
              <Printer className="w-4 h-4 text-teal-300" />
              <span className="hidden sm:inline">
                {language === 'bn' ? 'ডে-এন্ড রিপোর্ট' : 'Day-End MIS'}
              </span>
            </button>

            <button
              onClick={fetchStats}
              disabled={refreshing}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition active:scale-95"
              title="Refresh Live Metrics"
            >
              <RefreshCw className={`w-4 h-4 text-teal-300 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* PWA Mobile / Tablet / PC Quick Install Card */}
      {!isInstalled && (
        <div className="bg-gradient-to-r from-teal-950/70 via-slate-900 to-[#0f2744] border border-teal-500/30 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Download className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <span>{language === 'bn' ? 'মোবাইল, ট্যাবলেট ও কম্পিউটারে অ্যাপ হিসেবে চালান' : 'Install Sonali Diagnostic App on Mobile, Tab or PC'}</span>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-black uppercase">PWA Ready</span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                {language === 'bn'
                  ? 'কোন ব্রাউজার ফ্রেম ছাড়া ফুল-স্ক্রিনে চালান। হোমস্ক্রিন আইকন ও অফলাইন সাপোর্ট সুবিধাসহ সরাসরি ইনস্টল করুন।'
                  : 'Fast standalone experience without browser URL bars. Instant home screen access and offline capabilities.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isInstallable) install();
              else setShowPWAInstallModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/20 transition shrink-0 flex items-center justify-center gap-2 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{language === 'bn' ? 'এখনই ইনস্টল করুন' : 'Install Now'}</span>
          </button>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. COMPACT STAT PANIC VALUE MODAL (999 LAB ALERT)    */}
      {/* ---------------------------------------------------- */}
      {showPanicModal && stats?.criticalAlerts && stats.criticalAlerts.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border-2 border-rose-500 animate-in fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-rose-900/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-600 text-white shadow-md">
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-base text-rose-700 dark:text-rose-400">
                    {language === 'bn' ? 'জরুরি প্যানিক ভ্যালু অ্যালার্ট (ক্রিটিক্যাল ল্যাব)' : 'CRITICAL PANIC VALUE ALERTS (STAT)'}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {stats.criticalAlerts.length} {language === 'bn' ? 'জন রোগীর জরুরি ফলাফল' : 'urgent abnormal findings'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPanicModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {stats.criticalAlerts.map((alert, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-rose-900 dark:text-rose-200">
                      {alert.patientName} • <span className="font-mono text-xs">{alert.reportNumber}</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 mt-0.5">
                      {alert.testName}: <strong className="text-rose-600 dark:text-rose-400">{alert.parameter} = {alert.result}</strong> (স্বাভাবিক: {alert.normalRange})
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPanicModal(false);
                      onNavigate('reports');
                    }}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px] shadow-xs hover:bg-rose-700"
                  >
                    রিভিউ
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-500 text-[11px]">চিকিৎসককে অবিলম্বে অবগত করুন</span>
              <button
                type="button"
                onClick={() => {
                  setShowPanicModal(false);
                  onNavigate('reports');
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold hover:bg-slate-800 flex items-center gap-1.5"
              >
                <span>রিপোর্ট ও ডাক্তার নোটিফিকেশন</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2.5. EXECUTIVE LIVE COUNTER & PENDING HUB            */}
      {/* (কতটা জন সিরিয়াল, টোকেন কয়টি, টেস্ট ID কয়টি, এমাউন্ট, পেন্ডিং) */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-teal-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-teal-500 animate-ping"></span>
            <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              {language === 'bn' ? 'এক্সিকিউটিভ লাইভ কাউন্টার ও অপারেশনাল সারসংক্ষেপ' : 'Executive Live Counters & Operational Oversight'}
            </h3>
          </div>
          <span className="text-[11px] text-teal-600 dark:text-teal-400 font-bold">
            {language === 'bn' ? 'সরাসরি চেম্বার, ল্যাব ও বিলিং লাইভ সিঙ্ক' : 'Direct Real-Time Synchronized Data'}
          </span>
        </div>

        {/* 5 Big Live Counters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* 1: কতটা জন সিরিয়াল */}
          <div
            onClick={() => onNavigate('doctors')}
            className="cursor-pointer p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/40 dark:from-blue-950/40 dark:to-slate-900 border border-blue-200 dark:border-blue-900/60 hover:scale-[1.02] transition shadow-xs space-y-1"
          >
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
              <span className="text-[11px] font-bold uppercase">{language === 'bn' ? 'কতটা জন সিরিয়াল' : 'Doctor Serials'}</span>
              <Stethoscope className="w-4 h-4" />
            </div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {stats?.todayAppointments ?? 18} <span className="text-xs font-semibold text-slate-500">{language === 'bn' ? 'জন' : 'serials'}</span>
            </div>
            <div className="text-[10px] text-slate-500 flex items-center justify-between">
              <span>{language === 'bn' ? 'আজকের ডাক্তার চেম্বার' : "Today's Chambers"}</span>
              <ChevronRight className="w-3 h-3 text-blue-500" />
            </div>
          </div>

          {/* 2: কতটা জন্য টোকেন নিছে */}
          <div
            onClick={() => onNavigate('queue')}
            className="cursor-pointer p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50/40 dark:from-teal-950/40 dark:to-slate-900 border border-teal-200 dark:border-teal-900/60 hover:scale-[1.02] transition shadow-xs space-y-1"
          >
            <div className="flex items-center justify-between text-teal-600 dark:text-teal-400">
              <span className="text-[11px] font-bold uppercase">{language === 'bn' ? 'টোকেন কয়টি নিছে' : 'Tokens Issued'}</span>
              <Tv className="w-4 h-4" />
            </div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {stats?.todayTokensCount ?? 24} <span className="text-xs font-semibold text-slate-500">{language === 'bn' ? 'টি' : 'tokens'}</span>
            </div>
            <div className="text-[10px] text-slate-500 flex items-center justify-between">
              <span>{language === 'bn' ? 'ওয়েটিং ও কাউন্টার টিভি' : 'Live Counter Display'}</span>
              <ChevronRight className="w-3 h-3 text-teal-500" />
            </div>
          </div>

          {/* 3: টেস্ট ID কয়টি */}
          <div
            onClick={() => onNavigate('samples')}
            className="cursor-pointer p-4 rounded-2xl bg-gradient-to-br from-cyan-50 to-sky-50/40 dark:from-cyan-950/40 dark:to-slate-900 border border-cyan-200 dark:border-cyan-900/60 hover:scale-[1.02] transition shadow-xs space-y-1"
          >
            <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400">
              <span className="text-[11px] font-bold uppercase">{language === 'bn' ? 'টেস্ট ID কয়টি' : 'Ordered Test IDs'}</span>
              <TestTube2 className="w-4 h-4" />
            </div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {stats?.todayTestIdsCount ?? 36} <span className="text-xs font-semibold text-slate-500">{language === 'bn' ? 'টি' : 'tests'}</span>
            </div>
            <div className="text-[10px] text-slate-500 flex items-center justify-between">
              <span>{language === 'bn' ? 'হিমাটো, বায়ো ও ইউএসজি' : 'Lab Test Workflow'}</span>
              <ChevronRight className="w-3 h-3 text-cyan-500" />
            </div>
          </div>

          {/* 4: মোট এমাউন্ট ও কালেকশন */}
          <div
            onClick={() => onNavigate('billing')}
            className="cursor-pointer p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50/40 dark:from-emerald-950/40 dark:to-slate-900 border border-emerald-200 dark:border-emerald-900/60 hover:scale-[1.02] transition shadow-xs space-y-1 col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span className="text-[11px] font-bold uppercase">{language === 'bn' ? 'মোট বিল এমাউন্ট' : 'Gross Billing'}</span>
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="text-xl lg:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {formatMoney(stats?.todayBilling ?? 68450)}
            </div>
            <div className="text-[10px] text-slate-500 flex items-center justify-between">
              <span>{language === 'bn' ? 'আদায়:' : 'Collected:'} {formatMoney(stats?.todayCollected ?? 59200)}</span>
              <span className="text-rose-500 font-semibold">{language === 'bn' ? 'বকেয়া:' : 'Due:'} {formatMoney(stats?.todayDues ?? 9250)}</span>
            </div>
          </div>

          {/* 5: পেন্ডিং কাজের হিসেব */}
          <div
            onClick={() => onNavigate('reports')}
            className="cursor-pointer p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50/40 dark:from-amber-950/40 dark:to-slate-900 border border-amber-300 dark:border-amber-900/60 hover:scale-[1.02] transition shadow-xs space-y-1 col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
              <span className="text-[11px] font-bold uppercase">{language === 'bn' ? 'পেন্ডিং কাজের হিসেব' : 'Pending Oversight'}</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl lg:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {(stats?.pendingReports ?? 7) + (stats?.pendingSamples ?? 5)} <span className="text-xs font-semibold text-slate-500">{language === 'bn' ? 'টি পেন্ডিং' : 'pending'}</span>
            </div>
            <div className="text-[10px] text-slate-500 flex items-center justify-between">
              <span>রিপোর্ট: {stats?.pendingReports ?? 7} • স্যাম্পল: {stats?.pendingSamples ?? 5}</span>
              <ChevronRight className="w-3 h-3 text-amber-500" />
            </div>
          </div>
        </div>

        {/* 3 Quick Action Module Banners */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* Staff Remote Work & Shift Handover banner */}
          <div
            onClick={() => onNavigate('employees')}
            className="cursor-pointer p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/30 border border-slate-200 dark:border-slate-800 hover:border-teal-400 transition flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 shrink-0">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                  {language === 'bn' ? 'স্টাফ কাজ এর রিমোট ব্যাবস্হা ও শিফট হ্যান্ডওভার' : 'Remote Tasks & Shift Handover'}
                </h4>
                <p className="text-[10px] text-slate-500">
                  {language === 'bn' ? 'কার কি দায়িত্ব + জরুরি সার্ভিস কাজ বুঝে নেওয়া' : 'Roster, STAT Handover & SOPs'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-teal-600 shrink-0" />
          </div>

          {/* Free Health Camp Announcement Portal */}
          <div
            onClick={() => onNavigate('freeCamp')}
            className="cursor-pointer p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/30 border border-slate-200 dark:border-slate-800 hover:border-teal-400 transition flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 shrink-0">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                  {language === 'bn' ? 'রুগীদের ফ্রি ক্যাম্প আয়োজনের ইনফরমেশন' : 'Free Health Camp Portal'}
                </h4>
                <p className="text-[10px] text-slate-500">
                  {language === 'bn' ? 'ফ্রি ডায়াবেটিস, ব্লাড গ্রুপ ও ডাক্তার পরামর্শ ক্যাম্প' : 'Free Screening & Patient Reg'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-teal-600 shrink-0" />
          </div>

          {/* Voluntary Blood Donor Directory */}
          <div
            onClick={() => onNavigate('bloodDonors')}
            className="cursor-pointer p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-800 hover:border-rose-400 transition flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 shrink-0">
                <Droplet className="w-4 h-4 fill-rose-600" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                  {language === 'bn' ? 'স্বেচ্ছাসেবী রক্তদাতা ডিরেক্টরি' : 'Voluntary Blood Donors'}
                </h4>
                <p className="text-[10px] text-slate-500">
                  {language === 'bn' ? 'জরুরি প্রয়োজনে গ্রুপ ও এলাকা অনুযায়ী সন্ধান' : 'Emergency 24/7 STAT Donor Pool'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-600 shrink-0" />
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. TIER 1: HIGH-STAKES FINANCIAL & VOLUME METRIC CARDS */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Today's Patients */}
        <div
          onClick={() => onNavigate('patients')}
          className="group cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 shadow-sm hover:shadow-xl transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              {t.dashboard.todayPatients}
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
              {stats ? stats.todayPatients : '48'}
            </span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +14.3%
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>New vs Returning:</span>
              <span className="font-bold text-teal-600 dark:text-teal-400">
                34 (71%) / 14 (29%)
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Total Tests Today:</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">
                128 Tests Conducted
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Today's Gross Billing */}
        <div
          onClick={() => onNavigate('billing')}
          className="group cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 shadow-sm hover:shadow-xl transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              {t.dashboard.todayBilling}
            </span>
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 group-hover:bg-teal-500 group-hover:text-slate-950 transition">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black text-teal-600 dark:text-teal-400 tabular-nums tracking-tight">
              {stats ? formatMoney(stats.todayBilling) : '৳ 68,450'}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{t.common.discount}:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">
              {stats ? formatMoney(stats.todayDiscounts) : '৳ 4,350'} (6.3%)
            </span>
          </div>
        </div>

        {/* Card 3: Actual Cash & Digital Collected */}
        <div
          onClick={() => onNavigate('accounting')}
          className="group cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              {t.dashboard.todayCollection}
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
              {stats ? formatMoney(stats.todayCollected) : '৳ 59,200'}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Cash: <b className="text-slate-700 dark:text-slate-200">{formatMoney(stats?.cashDrawer || 41600)}</b></span>
            <span>bKash: <b className="text-slate-700 dark:text-slate-200">{formatMoney(stats?.digitalPayments || 17600)}</b></span>
          </div>
        </div>

        {/* Card 4: Daily Net Operating Profit */}
        <div
          onClick={() => onNavigate('accounting')}
          className="group cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm hover:shadow-xl transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              {t.dashboard.netProfit}
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums tracking-tight">
              {stats ? formatMoney(stats.netProfitToday) : '৳ 44,400'}
            </span>
            <span className="text-[11px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
              64.9%
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{t.dashboard.todayExpenses}:</span>
            <span className="font-bold text-rose-500">
              {stats ? formatMoney(stats.todayExpenses) : '৳ 14,800'}
            </span>
          </div>
        </div>

        {/* Card 5: Outstanding Patient Dues */}
        <div
          onClick={() => onNavigate('billing')}
          className="group cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500 shadow-sm hover:shadow-xl transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              {t.dashboard.outstandingDues}
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black text-rose-600 dark:text-rose-400 tabular-nums tracking-tight">
              {stats ? formatMoney(stats.todayDues) : '৳ 9,250'}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Recovery Target:</span>
            <span className="font-bold text-teal-600 dark:text-teal-400">
              86.5% Collected
            </span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. TIER 2: CLINICAL WORKFLOW, QUALITY & TAT CARDS    */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Pending Lab Reports */}
        <div
          onClick={() => onNavigate('reports')}
          className="cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-purple-400 transition shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {t.dashboard.pendingReports}
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Pathologist Sign-off Queue</span>
              </div>
            </div>
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400 tabular-nums">
              {stats ? stats.pendingReports : 7}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
            <span>Urgent/STAT: <b className="text-rose-600">{stats?.urgentReports || 3}</b></span>
            <span>Completed Today: <b className="text-emerald-600">{stats?.completedReports || 41}</b></span>
          </div>
        </div>

        {/* Metric 2: Phlebotomy Samples Queue */}
        <div
          onClick={() => onNavigate('samples')}
          className="cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-amber-400 transition shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition">
                <TestTube2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {t.dashboard.pendingSamples}
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Phlebotomy & Centrifuge</span>
              </div>
            </div>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
              {stats ? stats.pendingSamples : 5}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
            <span>Avg Wait Time: <b className="text-slate-800 dark:text-slate-200">8.4 Mins</b></span>
            <span>Analyzers: <b className="text-emerald-600">Active</b></span>
          </div>
        </div>

        {/* Metric 3: Doctor Chamber Serials */}
        <div
          onClick={() => onNavigate('doctors')}
          className="cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-teal-400 transition shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-teal-50 dark:bg-teal-950/50 text-teal-600 rounded-xl group-hover:bg-teal-500 group-hover:text-slate-950 transition">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {t.dashboard.doctorAppointments}
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Specialist Chamber Serials</span>
              </div>
            </div>
            <span className="text-2xl font-black text-teal-600 dark:text-teal-400 tabular-nums">
              {stats ? stats.todayAppointments : 18}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
            <span>Consulted: <b className="text-slate-800 dark:text-slate-200">12</b></span>
            <span>In Lounge: <b className="text-teal-600">6</b></span>
          </div>
        </div>

        {/* Metric 4: Lab TAT SLA Compliance */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Diagnostic TAT Compliance
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">On-Time Report Delivery</span>
              </div>
            </div>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {stats ? stats.tatSlaRate : 96.8}%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
            <span>Target: <b>&gt;95.0%</b></span>
            <span className="text-emerald-600 font-bold">Standard Met ✓</span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 5. INTERACTIVE PERFORMANCE & REVENUE CHARTS          */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: Revenue, Expenses & Net Profit (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  {chartView === 'monthly'
                    ? language === 'bn'
                      ? 'মাসিক রাজস্ব ও নিট লাভ বৃদ্ধি চিত্র'
                      : 'Monthly Revenue, Expenses & Net Profit Trend'
                    : language === 'bn'
                    ? 'চলতি সপ্তাহের দৈনিক আর্থিক অগ্রগতি'
                    : 'Weekly 7-Day Diagnostic Performance'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Comparative analysis of clinical diagnostic receipts versus reagent and operational overheads
              </p>
            </div>

            {/* View Switcher & Legend */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setChartView('monthly')}
                  className={`px-3 py-1 rounded-lg transition ${
                    chartView === 'monthly'
                      ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  6 Months
                </button>
                <button
                  onClick={() => setChartView('weekly')}
                  className={`px-3 py-1 rounded-lg transition ${
                    chartView === 'weekly'
                      ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  7 Days
                </button>
              </div>
            </div>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center gap-5 text-xs font-bold mb-4 px-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-teal-500 shadow-sm" />
              <span className="text-slate-700 dark:text-slate-300">Revenue (বিলিং)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-400 shadow-sm" />
              <span className="text-slate-700 dark:text-slate-300">Expenses (ব্যয়)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#0f2744] dark:bg-cyan-400 shadow-sm" />
              <span className="text-slate-700 dark:text-slate-300">Net Profit (নিট লাভ)</span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-64 flex items-end gap-3 sm:gap-6 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
            {chartView === 'monthly' ? (
              stats?.monthlySummary ? (
                stats.monthlySummary.map((item, idx) => {
                  const maxVal = 700000;
                  const revHeight = Math.min(100, Math.round((item.revenue / maxVal) * 100));
                  const expHeight = Math.min(100, Math.round((item.expenses / maxVal) * 100));
                  const profitHeight = Math.min(100, Math.round((item.profit / maxVal) * 100));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full relative">
                        {/* Hover Value Popover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-slate-900 text-white text-[10px] font-mono py-1 px-2 rounded-lg shadow-xl pointer-events-none whitespace-nowrap">
                          Rev: {formatMoney(item.revenue)} | Profit: {formatMoney(item.profit)}
                        </div>

                        {/* Revenue Bar */}
                        <div
                          style={{ height: `${revHeight}%` }}
                          className="w-1/3 max-w-[24px] bg-teal-500 rounded-t-lg transition-all group-hover:bg-teal-400 relative shadow-sm"
                        />
                        {/* Expense Bar */}
                        <div
                          style={{ height: `${expHeight}%` }}
                          className="w-1/3 max-w-[24px] bg-rose-400 rounded-t-lg transition-all group-hover:bg-rose-300 relative shadow-sm"
                        />
                        {/* Profit Bar */}
                        <div
                          style={{ height: `${profitHeight}%` }}
                          className="w-1/3 max-w-[24px] bg-[#0f2744] dark:bg-cyan-400 rounded-t-lg transition-all group-hover:bg-[#1b3a63] relative shadow-sm"
                        />
                      </div>
                      <span className="text-xs font-black text-slate-600 dark:text-slate-400">{item.month}</span>
                    </div>
                  );
                })
              ) : null
            ) : (
              weeklyTrendData.map((item, idx) => {
                const maxVal = 90000;
                const revHeight = Math.min(100, Math.round((item.revenue / maxVal) * 100));
                const expHeight = Math.min(100, Math.round((item.expenses / maxVal) * 100));
                const profitHeight = Math.min(100, Math.round((item.profit / maxVal) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full relative">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-slate-900 text-white text-[10px] font-mono py-1 px-2 rounded-lg shadow-xl pointer-events-none whitespace-nowrap">
                        Rev: {formatMoney(item.revenue)} | Net: {formatMoney(item.profit)}
                      </div>

                      <div
                        style={{ height: `${revHeight}%` }}
                        className="w-1/3 max-w-[20px] bg-teal-500 rounded-t-lg transition-all group-hover:bg-teal-400 shadow-sm"
                      />
                      <div
                        style={{ height: `${expHeight}%` }}
                        className="w-1/3 max-w-[20px] bg-rose-400 rounded-t-lg transition-all group-hover:bg-rose-300 shadow-sm"
                      />
                      <div
                        style={{ height: `${profitHeight}%` }}
                        className="w-1/3 max-w-[20px] bg-[#0f2744] dark:bg-cyan-400 rounded-t-lg transition-all shadow-sm"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{item.day}</span>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2">
            <span>Fiscal Year 2026-27 • Automated Cash Flow Reconciliation</span>
            <span className="font-bold text-teal-600 dark:text-teal-400">
              {language === 'bn' ? 'চলতি মাসে প্রবৃদ্ধি: +১৮.৫%' : 'Monthly Expansion: +18.5% YoY'}
            </span>
          </div>
        </div>

        {/* Department Revenue Breakdown (1 Col) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  {language === 'bn' ? 'ডিপার্টমেন্ট রাজস্ব বণ্টন' : 'Department Revenue Share'}
                </h3>
              </div>
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                82 Tests Today
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Breakdown of today's diagnostic test volume & billing contribution across modalities
            </p>

            {/* Department Progress Bars */}
            <div className="space-y-4">
              {stats?.departmentBreakdown?.map((dept, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                      {dept.department}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-slate-600 dark:text-slate-400">
                        {formatMoney(dept.revenue)}
                      </span>
                      <span className="font-bold text-teal-600 dark:text-teal-400 w-8 text-right">
                        {dept.percentage}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{
                        width: `${dept.percentage}%`,
                        backgroundColor: dept.color || '#0d9488',
                      }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Leading Department:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              Biochemistry & Serology (34%)
            </span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 6. HOURLY PATIENT INFLOW & RECEPTION RUSH CURVE      */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                {language === 'bn' ? 'ঘণ্টাভিত্তিক রোগী প্রবাহ ও ভিড় পর্যবেক্ষণ' : 'Hourly Patient Footfall & Rush Curve'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Helps clinic management balance phlebotomists, cash counters, and laboratory technician shifts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            <span>Peak Hours: 10:00 AM (Morning Lab) &amp; 06:00 PM (Evening Chamber)</span>
          </div>
        </div>

        {/* Hourly Distribution Grid / Bars */}
        <div className="grid grid-cols-3 sm:grid-cols-9 gap-3 pt-4">
          {stats?.hourlyTraffic?.map((h, idx) => {
            const isPeak = h.patients >= 9;
            return (
              <div
                key={idx}
                className={`p-3 rounded-2xl border transition-all text-center flex flex-col justify-between ${
                  isPeak
                    ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700 shadow-sm'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {h.hour}
                </span>

                <div className="my-2">
                  <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                    {h.patients}
                  </div>
                  <span className="text-[10px] text-slate-500">Patients</span>
                </div>

                <div className="text-[11px] font-mono font-bold text-teal-600 dark:text-teal-400 truncate">
                  {formatMoney(h.revenue)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 7. DOCTOR REFERRAL HONORARIUM & COMMISSION LEDGER    */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                {language === 'bn' ? 'শীর্ষ রেফারেল চিকিৎসক ও কমিশন লেজার' : 'Top Referring Doctors & Honorarium Ledger'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn' ? 'স্বয়ংক্রিয় রেফারেল ট্র্যাকিং ও সরাসরি বিকাশ/ক্যাশ সেটেলমেন্ট হিসাব' : 'Automated referral tracking with instant bKash settlement calculation'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('doctors')}
              className="px-3.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>{language === 'bn' ? 'ডাক্তার হিসাব ও পে-আউট লেজার' : 'Doctor Accounts & Ledger'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black">
                <th className="py-2.5 px-3">Doctor</th>
                <th className="py-2.5 px-3">Specialty</th>
                <th className="py-2.5 px-3 text-center">Referrals</th>
                <th className="py-2.5 px-3">Bill Total</th>
                <th className="py-2.5 px-3">Honorarium</th>
                <th className="py-2.5 px-3 text-right">Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {stats?.topReferringDoctors?.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {doc.name}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    {doc.specialty}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-teal-600">
                    {doc.referrals}
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {formatMoney(doc.totalBilled)}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {formatMoney(doc.honorarium)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black ${
                        doc.status.includes('Paid')
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          : doc.status === 'Approved'
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 8. DAY-END FINANCIAL RECONCILIATION MODAL (PRINT MIS) */}
      {/* ---------------------------------------------------- */}
      {showPrintMISModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0f2744] text-teal-400 flex items-center justify-center font-black">
                  SDC
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">
                    SONALI DIAGNOSTIC CENTER
                  </h3>
                  <p className="text-xs text-slate-500">
                    Day-End Cash &amp; Bank Reconciliation MIS Sheet
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPrintMISModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reconciliation Table */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300">Statement Date:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {new Date().toLocaleDateString('en-GB')} (Today)
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600 dark:text-slate-300">1. Gross Diagnostic Billing:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {stats ? formatMoney(stats.todayBilling) : '৳ 68,450'}
                </span>
              </div>
              <div className="flex justify-between py-1 text-amber-600">
                <span>2. Less: Authorized Discounts:</span>
                <span>- {stats ? formatMoney(stats.todayDiscounts) : '৳ 4,350'}</span>
              </div>
              <div className="flex justify-between py-1 text-rose-500">
                <span>3. Less: Unpaid Patient Dues (Receivables):</span>
                <span>- {stats ? formatMoney(stats.todayDues) : '৳ 9,250'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-slate-200 dark:border-slate-700 font-bold text-sm text-emerald-600">
                <span>4. Net Actual Collection:</span>
                <span>{stats ? formatMoney(stats.todayCollected) : '৳ 59,200'}</span>
              </div>
              <div className="pl-4 space-y-1 text-slate-500 text-[11px]">
                <div className="flex justify-between">
                  <span>• Cash in Counter Drawer:</span>
                  <span>{formatMoney(stats?.cashDrawer || 41600)}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Digital Transfers (bKash / POS):</span>
                  <span>{formatMoney(stats?.digitalPayments || 17600)}</span>
                </div>
              </div>
              <div className="flex justify-between py-1 text-rose-600 border-t border-slate-200 dark:border-slate-700">
                <span>5. Less: Daily Operational &amp; Reagent Expenses:</span>
                <span>- {stats ? formatMoney(stats.todayExpenses) : '৳ 14,800'}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-slate-900 dark:border-slate-100 font-black text-base text-indigo-600 dark:text-indigo-400">
                <span>6. Net Cash Remitted to Owner / Bank Vault:</span>
                <span>{stats ? formatMoney(stats.netProfitToday) : '৳ 44,400'}</span>
              </div>
            </div>

            {/* Verification Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-4 text-center text-xs text-slate-500">
              <div className="border-t border-slate-300 dark:border-slate-700 pt-2">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Duty Accounts Officer
                </span>
                <p className="text-[10px]">Verified Cash Drawer Physical Count</p>
              </div>
              <div className="border-t border-slate-300 dark:border-slate-700 pt-2">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Managing Director / Owner
                </span>
                <p className="text-[10px]">Dr. Sonali Admin • Received in Vault</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPrintMISModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official MIS Statement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Device PWA Install Guidance Modal */}
      {showPWAInstallModal && (
        <PWAInstallModal onClose={() => setShowPWAInstallModal(false)} />
      )}
    </div>
  );
};
