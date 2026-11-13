import React, { useState, useEffect } from 'react';
import {
  Tv,
  Volume2,
  PhoneCall,
  CheckCircle,
  PauseCircle,
  XCircle,
  Maximize2,
  Minimize2,
  PlusCircle,
  RefreshCw,
  Users,
  Radio,
  Printer,
  X,
  FileText,
  Check,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { QueueToken } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { DEFAULT_CATCHMENT_LOCATIONS } from '../utils/clinicalSchedule.ts';

export const QueueTV: React.FC = () => {
  const { language, t } = useLanguage();
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFullscreenTV, setIsFullscreenTV] = useState(false);
  const [newTokenDept, setNewTokenDept] = useState('Reception');
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenPhone, setNewTokenPhone] = useState('');
  const [isProxyPhone, setIsProxyPhone] = useState(false);
  const [newTokenAddress, setNewTokenAddress] = useState('');
  const [newTokenSlipSize, setNewTokenSlipSize] = useState<'80mm POS Thermal' | '58mm Compact POS' | 'A5 Sheet'>('80mm POS Thermal');
  const [tokenCopies, setTokenCopies] = useState<1 | 2>(1);
  const [newTokenCounter, setNewTokenCounter] = useState('1');
  const [showPrintModal, setShowPrintModal] = useState<QueueToken | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/queue/sync-all', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSyncStatusMsg(data.message || 'টিভি কিউ সফলভাবে সিঙ্ক হয়েছে');
        fetchTokens();
        setTimeout(() => setSyncStatusMsg(null), 4000);
      }
    } catch (err) {
      console.error('Error syncing queue:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchTokens();
    const interval = setInterval(fetchTokens, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTokens = async () => {
    try {
      const res = await fetch('/api/queue');
      if (res.ok) {
        const json = await res.json();
        setTokens(json);
      }
    } catch (err) {
      console.error('Error fetching queue tokens:', err);
    }
  };

  const playChimeAndAnnounce = (token: QueueToken) => {
    // 1. Play Synthesized Chime Audio using Web Audio API
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      // AudioContext unavailable
    }

    // 2. Synthesize Bengali Voice Announcement via Web Speech API
    if ('speechSynthesis' in window) {
      setTimeout(() => {
        const announcementText =
          language === 'bn'
            ? `টোকেন নম্বর ${token.tokenNumber}, কাউন্টার ${token.counterNo || 'এক'} এ আসুন।`
            : `Token number ${token.tokenNumber}, please proceed to counter ${token.counterNo || 'one'}.`;

        const utterance = new SpeechSynthesisUtterance(announcementText);
        utterance.lang = language === 'bn' ? 'bn-BD' : 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }, 400);
    }
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectivePhone = isProxyPhone ? '01700000000' : newTokenPhone.trim();

    try {
      const res = await fetch('/api/queue/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: newTokenDept,
          patientName: newTokenName || (language === 'bn' ? 'সাধারণ রোগী' : 'Walk-in Patient'),
          patientPhone: effectivePhone,
          patientAddress: newTokenAddress || 'জিন্দাবাজার, সিলেট',
          slipSize: newTokenSlipSize,
          printCopies: tokenCopies,
          counterNo: newTokenCounter,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        const tokenForPrint = {
          ...created,
          patientAddress: newTokenAddress,
          slipSize: newTokenSlipSize,
          printCopies: tokenCopies,
        };
        setShowPrintModal(tokenForPrint);
        setNewTokenName('');
        setNewTokenPhone('');
        setIsProxyPhone(false);
        setNewTokenAddress('');
        fetchTokens();
      }
    } catch (err) {
      console.error('Error generating token:', err);
    }
  };

  const handleUpdateStatus = async (id: number, status: string, counterNo?: string) => {
    try {
      const res = await fetch(`/api/queue/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, counterNo }),
      });
      if (res.ok) {
        const updated = await res.json();
        if (status === 'Calling') {
          playChimeAndAnnounce(updated);
        }
        fetchTokens();
      }
    } catch (err) {
      console.error('Error updating token status:', err);
    }
  };

  const callingTokens = tokens.filter((t) => t.status === 'Calling' || t.status === 'In Service');
  const waitingTokens = tokens.filter((t) => t.status === 'Waiting');

  // FULLSCREEN TV DISPLAY MODE
  if (isFullscreenTV) {
    return (
      <div className="fixed inset-0 z-50 bg-[#071322] text-white flex flex-col justify-between p-6 select-none animate-in fade-in">
        {/* Top TV Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center font-black text-xl shadow-lg">
              SDC
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                SONALI DIAGNOSTIC CENTER
              </h1>
              <p className="text-xs text-teal-400 font-bold">
                সোনালী ডায়াগনস্টিক সেন্টার • Quality Healthcare • Serial Call Display
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>LIVE SERIAL TV</span>
            </div>
            <button
              onClick={() => setIsFullscreenTV(false)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Exit TV Mode"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Main Stage: NOW SERVING BIG NUMBERS & LARGE FONTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-auto py-6">
          {callingTokens.length > 0 ? (
            callingTokens.slice(0, 3).map((token) => (
              <div
                key={token.id}
                className="bg-gradient-to-b from-[#0a1e38] via-[#0f2a4d] to-[#13335c] rounded-3xl p-8 lg:p-10 border-4 border-teal-400 shadow-2xl shadow-teal-950/60 flex flex-col items-center justify-between text-center relative overflow-hidden animate-pulse"
              >
                {/* Department badge */}
                <div className="text-sm lg:text-base font-black uppercase tracking-widest text-teal-300 px-4 py-1.5 rounded-full bg-slate-900/80 border border-teal-500/50 mb-3 shadow-md">
                  {token.department === 'Doctor Chamber'
                    ? '🩺 ডাক্তার চেম্বার (DOCTOR CHAMBER)'
                    : token.department === 'Sample Collection'
                    ? '🧪 স্যাম্পল কালেকশন (LAB PHLEBOTOMY)'
                    : token.department?.toUpperCase()}
                </div>

                {/* GIANT SERIAL / TOKEN NUMBER */}
                <div className="text-8xl md:text-9xl lg:text-[115px] leading-none font-black tracking-tight text-amber-300 font-mono my-3 drop-shadow-[0_6px_20px_rgba(251,191,36,0.35)]">
                  {token.tokenCode || `#${token.tokenNumber}`}
                </div>

                {/* BIG PATIENT NAME */}
                <div className="mt-2 text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-wide leading-tight drop-shadow-md">
                  {token.patientName || (language === 'bn' ? 'সাধারণ রোগী' : 'Walk-in Patient')}
                </div>

                {/* PATIENT ADDRESS IN LARGE CLEAR FONT */}
                <div className="mt-2.5 text-xl md:text-2xl text-teal-200 font-bold flex items-center justify-center gap-2">
                  <span>📍 {token.patientAddress || 'জিন্দাবাজার, সিলেট'}</span>
                </div>

                {/* BIG SERVING COUNTER BADGE */}
                <div className="mt-6 px-8 py-3.5 rounded-2xl bg-teal-400 text-slate-950 font-black text-2xl lg:text-3xl shadow-xl shadow-teal-500/50">
                  {token.department === 'Doctor Chamber' ? 'রুম / চেম্বার: ' : 'কাউন্টার: '}
                  {token.counterNo || '1'}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16 bg-[#0a1e38]/50 rounded-3xl border border-slate-800">
              <div className="text-6xl lg:text-7xl font-black text-slate-500 font-mono">STANDBY</div>
              <p className="text-slate-300 mt-4 text-xl font-bold">
                {language === 'bn' ? 'পরবর্তী সিরিয়াল কিছুক্ষণের মধ্যেই কল করা হবে' : 'Next token will be called shortly'}
              </p>
              {waitingTokens.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <span className="text-sm font-bold text-teal-400">অপেক্ষমাণ সিরিয়াল:</span>
                  {waitingTokens.slice(0, 5).map((w) => (
                    <span key={w.id} className="px-4 py-2 rounded-xl bg-slate-800 border border-teal-500/30 text-amber-300 font-mono text-xl font-bold">
                      {w.tokenCode || `#${w.tokenNumber}`} ({w.patientName})
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Ticker: Upcoming Tokens */}
        <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.queue.nextTokens}:
            </span>
            <div className="flex items-center gap-2">
              {waitingTokens.slice(0, 8).map((w) => (
                <span
                  key={w.id}
                  className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono font-bold text-sm"
                >
                  {w.tokenCode || `#${w.tokenNumber}`}
                </span>
              ))}
            </div>
          </div>
          <div className="text-xs text-slate-400 font-semibold">
            LAN Active • Local Reception Dispatch
          </div>
        </div>
      </div>
    );
  }

  // STANDARD OPERATOR CONTROL PANEL
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t.queue.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.queue.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-500/30 font-bold text-xs shadow-xs transition active:scale-95"
            title="Sync all today's doctor appointments and invoice tokens directly"
          >
            <RefreshCw className={`w-4 h-4 text-teal-500 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'সিঙ্ক হচ্ছে...' : 'আজকের সিরিয়াল ও বিল সরাসরি সিঙ্ক'}</span>
          </button>

          <button
            onClick={() => setIsFullscreenTV(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f2744] dark:bg-teal-600 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition active:scale-95"
          >
            <Maximize2 className="w-4 h-4" />
            <span>{t.queue.tvMode}</span>
          </button>
        </div>
      </div>

      {syncStatusMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: ISSUE TOKEN & COUNTER CALLING (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Issue Queue Token
              </h3>
              <span className="text-[11px] text-slate-400">Reception Dispatch Station</span>
            </div>
          </div>

          <form onSubmit={handleCreateToken} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.queue.department}
              </label>
              <select
                value={newTokenDept}
                onChange={(e) => setNewTokenDept(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Reception">Reception & Registration</option>
                <option value="Sample Collection">Phlebotomy / Sample Collection</option>
                <option value="Doctor Chamber">Doctor Consultation Chamber</option>
                <option value="Billing">Billing & Cash Counter</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'রোগীর নাম' : 'Patient Name'}
                </label>
                <input
                  type="text"
                  lang="en"
                  autoCapitalize="words"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  placeholder={language === 'bn' ? 'e.g. Kulsuma Begum' : 'Walk-in patient name...'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              {/* Mobile Phone with Workaround */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    {language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Phone'} *
                  </label>
                  <label className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isProxyPhone}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsProxyPhone(checked);
                        if (checked) setNewTokenPhone('01700000000');
                        else setNewTokenPhone('');
                      }}
                      className="rounded text-amber-600 w-3 h-3 cursor-pointer"
                    />
                    <span>মোবাইল নেই (প্রক্সি)</span>
                  </label>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    disabled={isProxyPhone}
                    value={newTokenPhone}
                    onChange={(e) => setNewTokenPhone(e.target.value)}
                    placeholder={isProxyPhone ? '01700000000 (প্রক্সি)' : '017XXXXXXXX'}
                    className={`w-full px-3 py-2 rounded-xl border font-mono ${
                      isProxyPhone
                        ? 'border-amber-400 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                    }`}
                  />
                  {isProxyPhone && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsProxyPhone(false);
                        setNewTokenPhone('');
                      }}
                      className="px-2.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 font-bold text-[11px] shrink-0 hover:bg-amber-100"
                    >
                      🔒 খুলুন
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Address with Autocomplete */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'bn' ? 'রোগীর ঠিকানা / এলাকা (টিভিতে বড় ফন্টে প্রদর্শিত হবে)' : 'Address / Area (Shown Large on TV Display)'}
              </label>
              <input
                type="text"
                lang="en"
                list="queueLocationsDatalist"
                value={newTokenAddress}
                onChange={(e) => setNewTokenAddress(e.target.value)}
                placeholder="e.g. Zindabazar, Sylhet"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <datalist id="queueLocationsDatalist">
                {DEFAULT_CATCHMENT_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>

            {/* Mandatory Token Print Slip Size */}
            <div className="p-3 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/20 space-y-2">
              <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-teal-600" />
                  <span>টোকেন স্লিপ প্রিন্ট সাইজ (Slip Format Size) *</span>
                </span>
                <span className="text-[9px] text-teal-700 dark:text-teal-400 font-bold uppercase">বাধ্যতামূলক</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '80mm POS Thermal', label: '80mm POS (Standard)', desc: 'হাসপাতাল স্ট্যান্ডার্ড' },
                  { id: '58mm Compact POS', label: '58mm Compact POS', desc: 'মিনি স্লিপ' },
                  { id: 'A5 Sheet', label: 'A5 Sheet Format', desc: 'হাফ পেজ প্রিন্ট' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setNewTokenSlipSize(s.id as any)}
                    className={`p-2 rounded-xl border text-center transition ${
                      newTokenSlipSize === s.id
                        ? 'border-teal-600 bg-teal-600 text-white font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-[11px] leading-tight">{s.label}</div>
                    <div className="text-[9px] opacity-75 mt-0.5">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'কাউন্টার / রুম' : 'Serving Counter / Room'}
                </label>
                <select
                  value={newTokenCounter}
                  onChange={(e) => setNewTokenCounter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="1">Counter 1 (Front Desk)</option>
                  <option value="2">Counter 2 (Billing)</option>
                  <option value="Lab-A">Phlebotomy Booth A</option>
                  <option value="Lab-B">Phlebotomy Booth B</option>
                  <option value="Room 101">Doctor Chamber 101</option>
                  <option value="Room 102">Doctor Chamber 102</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'টোকেন প্রিন্ট কপি' : 'Print Copies (POS)'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTokenCopies(1)}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      tokenCopies === 1
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>১ কপি (Default)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTokenCopies(2)}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      tokenCopies === 2
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>২ কপি (Duplex)</span>
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'bn' ? 'টোকেন তৈরি ও প্রিন্ট করুন' : 'Generate & Print Token'}</span>
            </button>
          </form>
        </div>

        {/* RIGHT: LIVE QUEUE DISPATCH BOARD (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Live Waiting List & Dispatch
              </h3>
              <span className="text-[11px] text-slate-400">
                {waitingTokens.length} waiting • {callingTokens.length} active
              </span>
            </div>
            <button
              onClick={fetchTokens}
              className="text-xs font-semibold text-teal-600 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {tokens.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">No tokens issued today.</div>
            ) : (
              tokens.map((tk) => (
                <div
                  key={tk.id}
                  className={`p-3.5 rounded-xl border text-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    tk.status === 'Calling' || tk.status === 'In Service'
                      ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#0f2744] text-white flex items-center justify-center font-mono font-black text-base shadow">
                      {tk.tokenCode}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{tk.patientName || 'Walk-in Patient'}</span>
                        {tk.patientPhone && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {tk.patientPhone}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                        <span>{tk.department} • Counter: {tk.counterNo || '1'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {/* Reprint POS slip button */}
                    <button
                      onClick={() => setShowPrintModal(tk)}
                      className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                      title="Print POS Token Slip"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {tk.status === 'Waiting' && (
                      <button
                        onClick={() => handleUpdateStatus(tk.id, 'Calling', '1')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </button>
                    )}

                    {(tk.status === 'Calling' || tk.status === 'In Service') && (
                      <>
                        <button
                          onClick={() => playChimeAndAnnounce(tk)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
                          title="Announce token again in Bengali"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Recall</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(tk.id, 'Completed')}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                        >
                          Complete
                        </button>
                      </>
                    )}

                    {tk.status !== 'Completed' && tk.status !== 'Cancelled' && (
                      <button
                        onClick={() => handleUpdateStatus(tk.id, 'Cancelled')}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500"
                        title="Cancel Token"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* POS THERMAL TOKEN PRINT MODAL (58mm / 80mm format) */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  {showPrintModal.slipSize || '80mm POS Thermal'} • {showPrintModal.printCopies || 1} Copy
                </span>
              </div>
              <button
                onClick={() => setShowPrintModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Slip Preview Box */}
            <div className="my-4 p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 font-mono text-center space-y-2">
              <div className="border-b border-dashed border-slate-300 pb-2">
                <h4 className="font-black text-sm tracking-tight text-slate-900">
                  সোনালী ডায়াগনস্টিক সেন্টার
                </h4>
                <p className="text-[10px] text-slate-500">Sonali Diagnostic Center</p>
                <p className="text-[9px] text-slate-400">Quality Healthcare • Trusted Care</p>
                <div className="mt-1 inline-block px-1.5 py-0.5 rounded bg-slate-200 text-[9px] font-bold text-slate-600">
                  Format: {showPrintModal.slipSize || '80mm POS Thermal'}
                </div>
              </div>

              <div className="py-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  TOKEN / সিরিয়াল নম্বর
                </div>
                <div className="text-4xl font-black tracking-tight text-[#0f2744] my-1">
                  {showPrintModal.tokenCode || `#${showPrintModal.tokenNumber}`}
                </div>
                <div className="text-xs font-bold text-teal-700 bg-teal-50 inline-block px-2 py-0.5 rounded">
                  {showPrintModal.department}
                </div>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-2 text-[11px] text-left space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">কাউন্টার:</span>
                  <span className="font-bold">Counter {showPrintModal.counterNo || '1'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">রোগী:</span>
                  <span className="font-bold">{showPrintModal.patientName || 'Walk-in Patient'}</span>
                </div>
                {showPrintModal.patientPhone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">মোবাইল:</span>
                    <span className="font-bold">
                      {showPrintModal.patientPhone === '01700000000'
                        ? '01700000000 (প্রক্সি)'
                        : showPrintModal.patientPhone}
                    </span>
                  </div>
                )}
                {showPrintModal.patientAddress && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">ঠিকানা:</span>
                    <span className="font-bold truncate max-w-[170px]">{showPrintModal.patientAddress}</span>
                  </div>
                )}
              </div>

              <div className="text-[9px] text-slate-400 pt-1">
                তারিখ: {new Date(showPrintModal.createdAt || Date.now()).toLocaleDateString('bn-BD')} • {new Date(showPrintModal.createdAt || Date.now()).toLocaleTimeString()}
                <br />
                অনুগ্রহ করে আপনার টোকেন নম্বর ডাকার জন্য অপেক্ষা করুন
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
              >
                <Printer className="w-4 h-4" />
                <span>
                  {language === 'bn'
                    ? `${showPrintModal.printCopies || 1} কপি প্রিন্ট করুন`
                    : `Print ${showPrintModal.printCopies || 1} Copies`}
                </span>
              </button>
              <button
                onClick={() => setShowPrintModal(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
