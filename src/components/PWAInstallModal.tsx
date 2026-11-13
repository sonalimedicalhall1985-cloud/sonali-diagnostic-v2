import React from 'react';
import {
  Download,
  Share2,
  PlusSquare,
  Smartphone,
  Laptop,
  Tablet,
  CheckCircle2,
  X,
  Wifi,
  Sparkles,
  ArrowRight,
  Monitor,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

interface PWAInstallModalProps {
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ onClose }) => {
  const { language } = useLanguage();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -right-20 -top-20 w-52 h-52 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0f2744] to-teal-700 flex items-center justify-center text-teal-300 shadow-md">
              <Download className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                {language === 'bn' ? 'সোনালী ডায়াগনস্টিক অ্যাপ ইনস্টল করুন' : 'Install Sonali Diagnostic App'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'মোবাইল, ট্যাব এবং কম্পিউটারে হোমস্ক্রিন অ্যাপ হিসেবে চালান'
                  : 'Run as a standalone app on Mobile, Tablet & PC Desktop'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Status / 1-Click Install Button */}
        {isInstalled ? (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                {language === 'bn' ? 'অ্যাপটি ইতিমধ্যেই ইনস্টল করা আছে!' : 'App is already installed!'}
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                {language === 'bn'
                  ? 'আপনি আপনার ডিভাইস থেকে সরাসরি পূর্ণ স্ক্রিন অ্যাপ হিসেবে এটি চালাতে পারেন।'
                  : 'You are running the standalone Progressive Web App.'}
              </p>
            </div>
          </div>
        ) : isInstallable ? (
          <div className="space-y-3">
            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 font-black text-sm shadow-xl shadow-teal-500/25 transition active:scale-98 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              <span>
                {language === 'bn'
                  ? 'সরাসরি এখনই ইনস্টল করুন (১-ক্লিক)'
                  : 'Install App Now (1-Click)'}
              </span>
            </button>
            <p className="text-center text-[11px] text-slate-500">
              {language === 'bn'
                ? 'হোমস্ক্রিনে একটি আইকন যুক্ত হবে এবং ব্রাউজার ফ্রেম ছাড়া দ্রুত ওপেন হবে।'
                : 'Adds an app icon to your home screen or desktop launcher.'}
            </p>
          </div>
        ) : null}

        {/* Device Guides (Mobile / Tablet / PC) */}
        <div className="space-y-3">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            {language === 'bn' ? 'ডিভাইস অনুযায়ী ইনস্টল নির্দেশিকা:' : 'Device Installation Instructions:'}
          </div>

          <div className="grid grid-cols-1 gap-2.5 text-xs">
            {/* Guide 1: Android & Mobile Chrome */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Android / মোবাইল ব্রাউজার</span>
                  <span className="text-[10px] text-teal-600 font-semibold">(Chrome / Edge)</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  {language === 'bn' ? (
                    <>ব্রাউজারের উপরের ডানদিকের <b>৩টি ডট মেনু (⋮)</b> চাপুন এবং <b>&quot;Install app&quot;</b> বা <b>&quot;Add to Home screen&quot;</b> সিলেক্ট করুন।</>
                  ) : (
                    <>Tap the <b>3 dots menu (⋮)</b> in your browser and select <b>&quot;Install app&quot;</b> or <b>&quot;Add to Home screen&quot;</b>.</>
                  )}
                </p>
              </div>
            </div>

            {/* Guide 2: iPhone / iPad (iOS Safari) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 shrink-0">
                <Share2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>iPhone / iPad</span>
                  <span className="text-[10px] text-purple-600 font-semibold">(Safari)</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  {language === 'bn' ? (
                    <>সাফারি ব্রাউজারের নিচে <b>Share বাটন</b> চাপুন, নিচে স্ক্রোল করে <b>&quot;Add to Home Screen&quot; (➕)</b> এ ট্যাপ করুন।</>
                  ) : (
                    <>Tap the Safari <b>Share button</b> at the bottom, scroll down and tap <b>&quot;Add to Home Screen&quot; (➕)</b>.</>
                  )}
                </p>
              </div>
            </div>

            {/* Guide 3: PC Desktop / Laptop */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 shrink-0">
                <Monitor className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>PC / Laptop</span>
                  <span className="text-[10px] text-teal-600 font-semibold">(Windows / Mac Chrome &amp; Edge)</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  {language === 'bn' ? (
                    <>ব্রাউজারের অ্যাড্রেস বারের (URL bar) ডানপাশে থাকা <b>ইনস্টল আইকন (🖥️ / ⬇️)</b> ক্লিক করুন অথবা ব্রাউজার মেনু থেকে <b>&quot;Install Sonali Diagnostic&quot;</b> চাপুন।</>
                  ) : (
                    <>Click the <b>Install icon (🖥️ / ⬇️)</b> in the browser address bar or open the 3-dot menu and select <b>&quot;Install Sonali Diagnostic&quot;</b>.</>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features / Benefits */}
        <div className="p-3 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200/50 dark:border-teal-800/50 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Wifi className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>অফলাইন ক্যাশ ও এলএএন সাপোর্ট</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-teal-700 dark:text-teal-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>সম্পূর্ণ ফুল-স্ক্রিন মোড</span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition"
          >
            {language === 'bn' ? 'বুঝেছি / বন্ধ করুন' : 'Got it / Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
