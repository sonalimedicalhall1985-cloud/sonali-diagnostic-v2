import React, { useState, useEffect } from 'react';
import {
  BellRing,
  Smartphone,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Eye,
  RotateCcw,
  Clock,
  Sparkles,
  Phone,
  FileText,
  X,
  ExternalLink,
  ShieldAlert,
  Copy,
  Check,
} from 'lucide-react';
import { MockNotification, Invoice, Patient, DiagnosticTest } from '../types/index.ts';
import { notificationService } from '../services/notificationService.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface PatientNotificationCenterProps {
  invoices: Invoice[];
  patients: Patient[];
  tests: DiagnosticTest[];
}

export const PatientNotificationCenter: React.FC<PatientNotificationCenterProps> = ({
  invoices,
  patients,
  tests,
}) => {
  const { language } = useLanguage();
  const { hasPermission } = useAuth();

  const [notifications, setNotifications] = useState<MockNotification[]>(() =>
    notificationService.getNotifications()
  );
  const [selectedNotif, setSelectedNotif] = useState<MockNotification | null>(null);
  const [filterTrigger, setFilterTrigger] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'sms' | 'email'>('sms');

  // Manual Trigger Simulation Form State
  const [simPatientName, setSimPatientName] = useState('');
  const [simPhone, setSimPhone] = useState('');
  const [simEmail, setSimEmail] = useState('');
  const [simTestName, setSimTestName] = useState('Complete Blood Count (CBC with ESR)');
  const [simReportId, setSimReportId] = useState(`REP-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-0042`);
  const [simTriggerType, setSimTriggerType] = useState<'Lab Report Generated' | 'Report Approved' | 'Critical Panic Alert'>('Lab Report Generated');
  const [simChannel, setSimChannel] = useState<'Both' | 'SMS' | 'Email'>('Both');
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Subscribe to live notification updates
  useEffect(() => {
    const handleNotification = (e: any) => {
      setNotifications(notificationService.getNotifications());
    };
    window.addEventListener('sdc_notification_sent', handleNotification);
    return () => window.removeEventListener('sdc_notification_sent', handleNotification);
  }, []);

  const handleSimulateDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simPatientName || !simPhone) return;

    const notif = notificationService.triggerReportNotification(
      {
        reportNumber: simReportId,
        patientName: simPatientName,
        testName: simTestName,
        patientPhone: simPhone,
        patientEmail: simEmail || `${simPatientName.toLowerCase().replace(/[^a-z]/g, '')}@gmail.com`,
        status: simTriggerType === 'Report Approved' ? 'Approved' : 'Generated / Ready',
        abnormalFlag: simTriggerType === 'Critical Panic Alert',
      },
      simTriggerType === 'Critical Panic Alert' ? 'Lab Report Generated' : simTriggerType
    );

    setNotifications(notificationService.getNotifications());
    setSelectedNotif(notif);
    setDispatchSuccess(true);
    setTimeout(() => setDispatchSuccess(false), 4000);
  };

  const handleQuickTriggerForInvoice = (inv: Invoice) => {
    const notif = notificationService.triggerReportNotification(
      {
        reportNumber: `REP-${inv.invoiceNumber.replace('INV-', '')}-1`,
        patientName: inv.patientName,
        testName: 'Diagnostic Investigation Panel',
        patientPhone: inv.patientPhone,
        status: 'Generated & Ready for Collection',
        abnormalFlag: false,
      },
      'Lab Report Generated'
    );
    setSelectedNotif(notif);
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredList = notifications.filter((item) => {
    const matchesTrigger = filterTrigger === 'All' || item.triggerEvent === filterTrigger;
    const matchesSearch =
      searchQuery === '' ||
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.patientPhone.includes(searchQuery) ||
      item.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.testName && item.testName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTrigger && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 flex items-center justify-center">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Alerts Dispatched
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {notifications.length}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              SMS Gateway Status
            </div>
            <div className="text-xl font-black text-emerald-600 flex items-center gap-1.5">
              <span>100% Delivered</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Report Ready Alerts
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {notifications.filter((n) => n.triggerEvent === 'Lab Report Generated' || n.triggerEvent === 'Report Approved').length}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Telecom Carrier Routes
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              GP • Robi • Banglalink • Teletalk
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: LIVE TRIGGER SIMULATION PANEL (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center font-black">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Simulate Lab Report Alert
              </h3>
              <p className="text-[11px] text-slate-400">
                Trigger simulated SMS/Email to verify patient receipt flow
              </p>
            </div>
          </div>

          {dispatchSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 p-3 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Simulated alert dispatched successfully! Check phone preview below.</span>
            </div>
          )}

          <form onSubmit={handleSimulateDispatch} className="space-y-3 text-xs">
            {/* Quick Pick from Patients */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Patient or Input Details *
              </label>
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  const p = patients.find((x) => x.patientId === val);
                  if (p) {
                    setSimPatientName(p.name);
                    setSimPhone(p.phone || '');
                    setSimEmail(`${p.name.toLowerCase().replace(/[^a-z]/g, '')}@gmail.com`);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white mb-2"
              >
                <option value="">-- Choose from Registered Patients --</option>
                {patients.slice(0, 10).map((p) => (
                  <option key={p.id} value={p.patientId}>
                    {p.name} {p.phone ? `(${p.phone})` : ''}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-1 gap-2">
                <input
                  type="text"
                  value={simPatientName}
                  onChange={(e) => setSimPatientName(e.target.value)}
                  placeholder="Patient Name (e.g. Md. Rafiqul Islam)"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  required
                />
                <input
                  type="text"
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  placeholder="Patient Mobile Number (+88017...)"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                  required
                />
                <input
                  type="email"
                  value={simEmail}
                  onChange={(e) => setSimEmail(e.target.value)}
                  placeholder="Patient Email (optional for Email alert)"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>
            </div>

            {/* Test Selection */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Investigation / Lab Test Name *
              </label>
              <select
                value={simTestName}
                onChange={(e) => setSimTestName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              >
                {tests.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Trigger Event */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alert Trigger
                </label>
                <select
                  value={simTriggerType}
                  onChange={(e) => setSimTriggerType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                >
                  <option value="Lab Report Generated">Report Generated</option>
                  <option value="Report Approved">Report Approved</option>
                  <option value="Critical Panic Alert">Critical Panic Alert</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dispatch Channel
                </label>
                <select
                  value={simChannel}
                  onChange={(e) => setSimChannel(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                >
                  <option value="Both">Both (SMS + Email)</option>
                  <option value="SMS">SMS Only</option>
                  <option value="Email">Email Only</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs shadow-md shadow-teal-700/20 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Simulate Trigger Alert</span>
            </button>
          </form>

          {/* Quick Trigger From Recent Invoices */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Quick Trigger from Today's Bills:
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {invoices.slice(0, 4).map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] border border-slate-100 dark:border-slate-800"
                >
                  <div className="truncate mr-2">
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      {inv.patientName}
                    </div>
                    <div className="text-[10px] text-slate-400">{inv.invoiceNumber}</div>
                  </div>
                  <button
                    onClick={() => handleQuickTriggerForInvoice(inv)}
                    className="px-2 py-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold hover:bg-teal-100 shrink-0 border border-teal-200 dark:border-teal-800 text-[10px]"
                  >
                    Simulate Alert
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: NOTIFICATION LOG ARCHIVE & LIVE PHONE PREVIEW (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notifications by patient, phone or report ID..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {['All', 'Lab Report Generated', 'Report Approved', 'Bill Issued'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterTrigger(t)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                    filterTrigger === t
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {t === 'Lab Report Generated' ? 'Report Ready' : t}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications Log Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                  Patient Dispatch Outbox ({filteredList.length})
                </h4>
                <p className="text-[11px] text-slate-400">
                  Simulated carrier delivery logs with instant device view
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                  <tr>
                    <th className="p-3">Patient & Contact</th>
                    <th className="p-3">Trigger Event</th>
                    <th className="p-3">Test / Reference</th>
                    <th className="p-3">Channel & Status</th>
                    <th className="p-3">Time</th>
                    <th className="p-3 text-right">Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredList.map((notif) => (
                    <tr
                      key={notif.id}
                      onClick={() => setSelectedNotif(notif)}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 cursor-pointer"
                    >
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">
                        <div>{notif.patientName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{notif.patientPhone}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            notif.triggerEvent === 'Critical Panic Alert'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : notif.triggerEvent === 'Lab Report Generated' ||
                                notif.triggerEvent === 'Report Approved'
                              ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {notif.triggerEvent}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-medium truncate max-w-[160px]">
                          {notif.testName || notif.referenceId}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Ref: {notif.referenceId}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {notif.type}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Delivered</span>
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-[11px] text-slate-400">
                        {new Date(notif.sentAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNotif(notif);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-bold text-[11px] inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Alert</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredList.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  No notifications match your current filter.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SIMULATED SMARTPHONE DEVICE ALERT MODAL              */}
      {/* ---------------------------------------------------- */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-teal-600" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  Patient Device Notification Preview
                </h3>
              </div>
              <button
                onClick={() => setSelectedNotif(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Channels Switcher */}
            <div className="px-6 pt-4 flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <button
                onClick={() => setActivePreviewTab('sms')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activePreviewTab === 'sms'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>SMS View (Banglalink / GP / Robi)</span>
              </button>
              <button
                onClick={() => setActivePreviewTab('email')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activePreviewTab === 'email'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Certified Email View</span>
              </button>
            </div>

            {/* Device Screen Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {activePreviewTab === 'sms' && (
                <div className="max-w-xs mx-auto bg-slate-900 text-white rounded-[36px] p-3 shadow-2xl border-4 border-slate-700 relative">
                  {/* Speaker & Camera Notch */}
                  <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-900 mr-2" />
                    <div className="w-8 h-1 bg-slate-700 rounded-full" />
                  </div>

                  {/* Phone Status Bar */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 px-3 pb-2 border-b border-slate-800">
                    <span>9:41</span>
                    <span className="font-semibold text-teal-400">Grameenphone 4G LTE</span>
                    <span>100%</span>
                  </div>

                  {/* Messaging App Header */}
                  <div className="py-2 px-1 text-center border-b border-slate-800">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0f2744] to-teal-600 text-teal-300 font-bold text-xs flex items-center justify-center mx-auto mb-1">
                      SDC
                    </div>
                    <div className="font-bold text-xs text-white">SONALI-DIAG</div>
                    <div className="text-[9px] text-teal-400">Verified Healthcare Sender</div>
                  </div>

                  {/* Messages Stream */}
                  <div className="py-4 space-y-3 min-h-[220px]">
                    <div className="text-center text-[9px] text-slate-500">
                      Today {new Date(selectedNotif.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    <div className="bg-[#1e293b] border border-slate-700/80 rounded-2xl rounded-tl-xs p-3 text-xs leading-relaxed text-slate-100 shadow-md">
                      {selectedNotif.messageContent}
                    </div>

                    <div className="text-right text-[9px] text-teal-400 flex items-center justify-end gap-1">
                      <Check className="w-3 h-3 text-teal-400" />
                      <span>Delivered to {selectedNotif.patientPhone}</span>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'email' && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-slate-800">
                  <div className="bg-slate-100 dark:bg-slate-700/50 p-3 border-b border-slate-200 dark:border-slate-700 text-xs">
                    <div className="font-bold text-slate-800 dark:text-white">
                      Subject: {selectedNotif.emailSubject || 'Your Diagnostic Report is Ready - Sonali Diagnostic Center'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      From: Sonali Diagnostic Lab &lt;reports@sonalidiag.com&gt;
                    </div>
                    <div className="text-[11px] text-slate-500">
                      To: {selectedNotif.patientEmail || `${selectedNotif.patientName}@gmail.com`}
                    </div>
                  </div>

                  <div className="p-4">
                    {selectedNotif.emailBodyHtml ? (
                      <div
                        className="prose prose-xs dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: selectedNotif.emailBodyHtml }}
                      />
                    ) : (
                      <div className="text-xs space-y-3 text-slate-700 dark:text-slate-300">
                        <p>Dear {selectedNotif.patientName},</p>
                        <p>
                          Your lab report for <strong>{selectedNotif.testName}</strong> (ID: {selectedNotif.referenceId}) is now ready for collection at Sonali Diagnostic Center.
                        </p>
                        <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 font-semibold text-center">
                          Verification Reference: SDC-VERIFY-{selectedNotif.referenceId}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <button
                onClick={() => handleCopyMessage(selectedNotif.messageContent)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>

              <button
                onClick={() => setSelectedNotif(null)}
                className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
