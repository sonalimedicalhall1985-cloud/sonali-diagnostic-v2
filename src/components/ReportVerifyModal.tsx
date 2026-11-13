import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X, ShieldCheck, Building2, User, FileText, Calendar } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

interface ReportVerifyModalProps {
  hash: string | null;
  onClose: () => void;
}

export const ReportVerifyModal: React.FC<ReportVerifyModalProps> = ({ hash, onClose }) => {
  const { language } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hash) return;
    setLoading(true);
    fetch(`/api/reports/verify/${hash}`)
      .then((res) => {
        if (!res.ok) throw new Error('Verification failed: Report not found or invalid');
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [hash]);

  if (!hash) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-xl">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {language === 'bn' ? 'অফিসিয়াল ডায়াগনস্টিক রিপোর্ট ভেরিফিকেশন' : 'Official Diagnostic Report Verification'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              SONALI DIAGNOSTIC CENTER • Trusted Healthcare System
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {language === 'bn' ? 'ডিজিটাল রেকর্ড যাচাই করা হচ্ছে...' : 'Verifying digital record against database...'}
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">
                {language === 'bn' ? 'যাচাইকরণ ব্যর্থ হয়েছে' : 'Verification Unsuccessful'}
              </p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="text-xs font-semibold">
                {language === 'bn'
                  ? 'এই রিপোর্টটি সোনালী ডায়াগনস্টিক সেন্টার ডাটাবেজে আনুষ্ঠানিকভাবে যাচাইকৃত ও অনুমোদিত।'
                  : 'This medical report is authentic, verified, and officially released by Sonali Diagnostic Center.'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Report Number</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono text-xs">{data.reportNumber}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Status</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                  {data.status}
                </span>
              </div>
              <div className="col-span-2 border-t border-slate-200 dark:border-slate-700 pt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Patient Name</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {data.patientName} ({data.patientGender}, {data.patientAge} Years)
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Diagnostic Investigation</span>
                <span className="font-semibold text-teal-700 dark:text-teal-400">{data.testName}</span>
              </div>
              <div className="col-span-2 border-t border-slate-200 dark:border-slate-700 pt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Approved By Pathologist</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{data.pathologistName}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">{data.pathologistCredentials}</span>
              </div>
              {data.approvedAt && (
                <div className="col-span-2 text-xs text-slate-400">
                  Approval Timestamp: {new Date(data.approvedAt).toLocaleString()}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-sm hover:opacity-90 transition"
            >
              {language === 'bn' ? 'বন্ধ করুন' : 'Close Verification'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
