import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Save,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  FileEdit,
  Info,
} from 'lucide-react';
import { LabReport, TestParameter } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export const LabResults: React.FC = () => {
  const { language, t } = useLanguage();
  const { token, user, canEnterLabResults } = useAuth();

  const [reportsList, setReportsList] = useState<LabReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [parameters, setParameters] = useState<TestParameter[]>([]);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchDraftReports();
  }, [token]);

  const fetchDraftReports = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reports', {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (res.ok) {
        const json: LabReport[] = await res.json();
        setReportsList(json);
        // Default pick first draft if none selected
        if (!selectedReport && json.length > 0) {
          handleSelectReport(json[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReport = (rep: LabReport) => {
    setSelectedReport(rep);
    setParameters(Array.isArray(rep.results) ? JSON.parse(JSON.stringify(rep.results)) : []);
    setComments(rep.comments || '');
    setSuccessMessage('');
  };

  const handleParamChange = (index: number, val: string) => {
    const copy = [...parameters];
    copy[index].result = val;

    // Basic heuristic for flag
    const num = parseFloat(val);
    const range = copy[index].normalRange || '';
    if (!isNaN(num) && range.includes('-')) {
      const parts = range.split('-').map((s) => parseFloat(s.replace(/[^0-9.]/g, '')));
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        if (num < parts[0]) copy[index].status = 'Low';
        else if (num > parts[1]) copy[index].status = 'High';
        else copy[index].status = 'Normal';
      }
    } else {
      copy[index].status = 'Normal';
    }

    setParameters(copy);
  };

  const handleFlagChange = (index: number, flag: 'Normal' | 'High' | 'Low' | 'Critical') => {
    const copy = [...parameters];
    copy[index].status = flag;
    setParameters(copy);
  };

  const handleSaveResults = async (submitForReview: boolean) => {
    if (!selectedReport) return;
    setSaving(true);
    setSuccessMessage('');

    const hasAbnormal = parameters.some(
      (p) => p.status === 'High' || p.status === 'Low' || p.status === 'Critical'
    );

    try {
      const res = await fetch(`/api/reports/${selectedReport.reportNumber}/results`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          results: parameters,
          comments,
          abnormalFlag: hasAbnormal,
        }),
      });

      if (res.ok) {
        setSuccessMessage(
          submitForReview
            ? 'Results successfully saved and submitted to Consultant Pathologist for clinical verification.'
            : 'Draft test results saved successfully.'
        );
        fetchDraftReports();
      }
    } catch (err) {
      console.error('Error saving lab results:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {t.lab.title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t.lab.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: REPORTS LIST (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
          <div className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span>Workstation Reports Queue</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold">
              {reportsList.length}
            </span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {reportsList.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No pending reports found.</div>
            ) : (
              reportsList.map((r) => {
                const isSelected = selectedReport?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectReport(r)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-[#0f2744] dark:text-teal-400">
                        {r.reportNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          r.status === 'Draft'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : r.status === 'Under Review'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {r.testName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Pt: {r.patientName} ({r.patientGender}, {r.patientAge} Y)
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: PARAMETER ENTRY SHEET (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
          {selectedReport ? (
            <>
              {/* Report Header Meta */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    Diagnostic Investigation
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {selectedReport.testName} ({selectedReport.testCode})
                  </h3>
                  <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                    Report #: {selectedReport.reportNumber} • Patient: {selectedReport.patientName} (ID: {selectedReport.patientId})
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      selectedReport.status === 'Draft'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : selectedReport.status === 'Under Review'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {selectedReport.status}
                  </span>
                </div>
              </div>

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Parameters Table */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">{t.lab.parameter}</th>
                      <th className="py-2.5 px-3 text-center">{t.lab.result} *</th>
                      <th className="py-2.5 px-3">{t.lab.unit}</th>
                      <th className="py-2.5 px-3">{t.lab.normalRange}</th>
                      <th className="py-2.5 px-3">{t.lab.flag}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parameters.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          {p.name}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="text"
                            value={p.result !== undefined ? p.result : p.defaultValue || ''}
                            onChange={(e) => handleParamChange(idx, e.target.value)}
                            placeholder="Observed..."
                            className="w-28 text-center px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{p.unit || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px] leading-tight max-w-[160px]">
                          {p.normalRange}
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={p.status || 'Normal'}
                            onChange={(e) => handleFlagChange(idx, e.target.value as any)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              p.status === 'High' || p.status === 'Critical'
                                ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                                : p.status === 'Low'
                                ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            <option value="Normal">Normal</option>
                            <option value="High">High</option>
                            <option value="Low">Low</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Technologist Comments */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs mb-1">
                  {t.lab.comments}
                </label>
                <textarea
                  rows={2}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Technologist microscopic impression, sample adequacy, or automated analyzer notes..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveResults(false)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{t.lab.saveDraft}</span>
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveResults(true)}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition"
                >
                  <Send className="w-4 h-4" />
                  <span>{t.lab.submitReview}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs">
              Select a diagnostic report from the left workstation queue to enter results.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
