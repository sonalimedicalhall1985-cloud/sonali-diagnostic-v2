import React from 'react';
import { X, Printer, ShieldCheck, CheckCircle2, AlertTriangle, QrCode } from 'lucide-react';
import { LabReport } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface PrintReportModalProps {
  report: LabReport | null;
  onClose: () => void;
  onVerifyQR?: (hash: string) => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  report,
  onClose,
  onVerifyQR,
}) => {
  const { language } = useLanguage();

  if (!report) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        {/* Controls - Hidden during print */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 print:hidden bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-white text-sm">
              {language === 'bn' ? 'অফিসিয়াল ডায়াগনস্টিক রিপোর্ট' : 'Official Diagnostic Laboratory Report'}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
              {report.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md transition"
            >
              <Printer className="w-4 h-4" /> {language === 'bn' ? 'রিপোর্ট প্রিন্ট করুন' : 'Print A4 Report'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE A4 DIAGNOSTIC REPORT */}
        <div className="p-8 print:p-0">
          <div className="max-w-[850px] mx-auto bg-white text-slate-900 p-8 border border-slate-200 shadow-sm print:border-none print:shadow-none font-sans min-h-[1050px] flex flex-col justify-between">
            <div>
              {/* Official Header */}
              <div className="border-b-2 border-[#0f2744] pb-4 mb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#0f2744] flex flex-col items-center justify-center text-teal-400 font-black shadow">
                      <span className="text-xl leading-none">SDC</span>
                      <span className="text-[8px] tracking-widest text-white mt-0.5">LAB</span>
                    </div>
                    <div>
                      <h1 className="text-2xl font-black text-[#0f2744] tracking-tight">
                        SONALI DIAGNOSTIC CENTER
                      </h1>
                      <div className="text-xs font-bold text-teal-700">
                        সোনালী ডায়াগনস্টিক সেন্টার • Quality Healthcare • Trusted Diagnostic Services
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Main Center: Modern Tower (Ground & 1st Floor), Hospital Road, Dhaka
                        <br />Helpline: +880 1711-000000, +880 1819-000000 | Email: reports@sonalidiagnostic.com
                      </div>
                    </div>
                  </div>

                  {/* Verification QR Box */}
                  <div className="text-right">
                    <button
                      onClick={() => onVerifyQR && onVerifyQR(report.qrCodeHash)}
                      className="group flex flex-col items-center p-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-teal-50 transition print:pointer-events-none"
                      title="Click to verify digital authenticity"
                    >
                      <div className="w-14 h-14 bg-white p-1 rounded border border-slate-200 flex items-center justify-center text-slate-800">
                        <QrCode className="w-12 h-12" />
                      </div>
                      <span className="text-[9px] font-mono font-bold text-slate-600 mt-1">SCAN TO VERIFY</span>
                      <span className="text-[8px] font-mono text-teal-600 group-hover:underline">Digital Security</span>
                    </button>
                  </div>
                </div>

                <div className="mt-3 py-1 px-3 bg-[#0f2744] text-white flex justify-between items-center text-xs font-bold tracking-wide rounded">
                  <span>DEPARTMENT OF {report.category?.toUpperCase() || 'PATHOLOGY'}</span>
                  <span className="font-mono text-teal-300">REPORT #: {report.reportNumber}</span>
                </div>
              </div>

              {/* Patient Meta Strip */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs mb-6">
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500 w-24 inline-block">Patient Name:</span>
                    <span className="font-bold text-slate-900 text-sm">{report.patientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 w-24 inline-block">Patient ID:</span>
                    <span className="font-mono font-semibold text-slate-700">{report.patientId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 w-24 inline-block">Age / Gender:</span>
                    <span className="font-semibold text-slate-800">{report.patientAge || '—'} Years / {report.patientGender || '—'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500 w-28 inline-block">Ref. Doctor:</span>
                    <span className="font-bold text-slate-900">{report.referringDoctor || 'Self / General'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 w-28 inline-block">Specimen / Barcode:</span>
                    <span className="font-mono text-slate-700">{report.sampleType || 'Serum'} ({report.sampleId || 'SMP-2611'})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 w-28 inline-block">Approval Date:</span>
                    <span className="font-semibold text-slate-800">
                      {report.approvedAt ? new Date(report.approvedAt).toLocaleString() : 'Pending Pathologist Review'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Test Name Header */}
              <div className="text-center py-2 bg-slate-100 border-y border-slate-300 mb-4">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                  {report.testName} ({report.testCode})
                </h2>
              </div>

              {/* Diagnostic Results Table */}
              <table className="w-full text-xs text-left mb-6 border-collapse">
                <thead>
                  <tr className="bg-slate-200/80 text-slate-800 border-b border-slate-300">
                    <th className="py-2 px-3 font-bold w-2/5">INVESTIGATION / PARAMETER</th>
                    <th className="py-2 px-3 font-bold w-1/5 text-center">RESULT</th>
                    <th className="py-2 px-3 font-bold w-1/6">UNITS</th>
                    <th className="py-2 px-3 font-bold w-1/4">REFERENCE INTERVAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {Array.isArray(report.results) && report.results.length > 0 ? (
                    report.results.map((param: any, idx: number) => {
                      const isAbnormal = param.status === 'High' || param.status === 'Low' || param.status === 'Critical';
                      return (
                        <tr key={idx} className={isAbnormal ? 'bg-amber-50/70 font-semibold' : 'hover:bg-slate-50'}>
                          <td className="py-2 px-3 text-slate-900 font-medium">{param.name}</td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded font-mono font-bold ${
                                isAbnormal ? 'text-rose-700 bg-rose-50 border border-rose-200' : 'text-slate-900'
                              }`}
                            >
                              {param.result || param.defaultValue || '—'}
                            </span>
                            {param.status && param.status !== 'Normal' && (
                              <span className="ml-1 text-[9px] font-bold text-rose-600">[{param.status.toUpperCase()}]</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-600 font-mono">{param.unit || '—'}</td>
                          <td className="py-2 px-3 text-slate-600 text-[11px] leading-tight">{param.normalRange || '—'}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-500">
                        Result data not yet recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Lab Technician & Pathologist Remarks */}
              {report.comments && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs mb-6">
                  <span className="font-bold text-slate-800 block mb-1">Pathological Interpretation & Remarks:</span>
                  <p className="text-slate-700 leading-relaxed italic">{report.comments}</p>
                </div>
              )}
            </div>

            {/* Official Signatures & Verification Seal */}
            <div className="pt-8 border-t-2 border-slate-200 mt-auto">
              <div className="flex justify-between items-end text-xs">
                {/* Tech Sign */}
                <div className="text-center w-52">
                  <div className="font-semibold text-slate-900">{report.technicianName || 'Md. Anisur Rahman'}</div>
                  <div className="text-[10px] text-slate-500">Medical Technologist (Lab)</div>
                  <div className="w-36 border-t border-slate-400 mx-auto mt-2 pt-1 text-[9px] text-slate-400">
                    Checked By
                  </div>
                </div>

                {/* Center Seal */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-50 border border-teal-300 text-teal-800 text-[10px] font-bold shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    CERTIFIED MEDICAL REPORT
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1">Verified with SDC Clinical LIS</div>
                </div>

                {/* Pathologist Stamp */}
                <div className="text-center w-64">
                  <div className="font-bold text-slate-900 text-sm">
                    {report.pathologistName || 'Dr. Tariqul Islam'}
                  </div>
                  <div className="text-[10px] text-slate-700 font-medium">
                    {report.pathologistCredentials || 'MBBS, MD (Pathology) - Consultant Pathologist'}
                  </div>
                  <div className="w-48 border-t-2 border-[#0f2744] mx-auto mt-2 pt-1 text-[10px] font-bold text-[#0f2744]">
                    Authorized Signature & Approval
                  </div>
                </div>
              </div>

              <div className="text-center pt-4 text-[9px] text-slate-400 border-t border-slate-100 mt-4">
                * Note: It is clinically advised to correlate all laboratory results with clinical findings and patient history. This report is generated and authenticated digitally.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
