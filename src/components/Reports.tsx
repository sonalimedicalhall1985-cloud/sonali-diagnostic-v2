import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  CheckCircle,
  Printer,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  Send,
  AlertTriangle,
  QrCode,
  Calendar,
  User,
} from 'lucide-react';
import { LabReport } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { notificationService } from '../services/notificationService.ts';

interface ReportsProps {
  onPrintReport: (report: LabReport) => void;
  onVerifyQR?: (hash: string) => void;
}

export const Reports: React.FC<ReportsProps> = ({ onPrintReport, onVerifyQR }) => {
  const { language, t } = useLanguage();
  const { token, user, canApproveReports } = useAuth();
  const [reportsList, setReportsList] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchReports();
  }, [token]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reports', {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (res.ok) {
        const json = await res.json();
        setReportsList(json);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReport = async (reportNumber: string) => {
    try {
      const res = await fetch(`/api/reports/${reportNumber}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          comments: 'Clinically correlated and verified by Consultant Pathologist.',
        }),
      });

      if (res.ok) {
        const targetReport = reportsList.find((r) => r.reportNumber === reportNumber);
        if (targetReport) {
          notificationService.triggerReportNotification(
            {
              ...targetReport,
              status: 'Approved',
            },
            'Report Approved'
          );
        }
        fetchReports();
      } else {
        const err = await res.json();
        console.warn('Approval notice:', err.error || 'Approval failed');
      }
    } catch (err) {
      console.error('Error approving report:', err);
    }
  };

  const handleDeliverReport = async (reportNumber: string) => {
    try {
      const res = await fetch(`/api/reports/${reportNumber}/deliver`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });
      if (res.ok) {
        fetchReports();
      }
    } catch (err) {
      console.error('Error delivering report:', err);
    }
  };

  const filtered = reportsList.filter((r) => {
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchesSearch =
      r.reportNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.testName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t.reports.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.reports.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800">
            <ShieldCheck className="w-4 h-4" />
            <span>Pathologist Sign & Seal Active</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports by report number, patient name, or investigation..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
          >
            <option value="All">All Report Statuses</option>
            <option value="Under Review">Under Review (Ready for Approval)</option>
            <option value="Draft">Draft (Technician Entering)</option>
            <option value="Approved">Approved (Ready for Delivery)</option>
            <option value="Delivered">Delivered to Patient</option>
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">Loading reports...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">No reports found.</div>
        ) : (
          filtered.map((r) => {
            const isApproved = r.status === 'Approved' || r.status === 'Delivered';
            return (
              <div
                key={r.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition space-y-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-[#0f2744] dark:text-teal-400">
                      {r.reportNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : r.status === 'Delivered'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : r.status === 'Under Review'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2">
                    {r.testName}
                  </h3>

                  <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <div className="text-slate-800 dark:text-slate-200 font-semibold">
                      {r.patientName} ({r.patientGender}, {r.patientAge} Y)
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Ref: <span className="text-slate-700 dark:text-slate-300">{r.referringDoctor || 'Self'}</span>
                    </div>
                    {r.abnormalFlag && (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 pt-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Abnormal Clinical Value Detected</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onPrintReport(r)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 font-bold text-xs transition"
                      title="Preview and print official A4 report"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print A4</span>
                    </button>
                    {onVerifyQR && (
                      <button
                        onClick={() => onVerifyQR(r.qrCodeHash)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Verify QR hash"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    {!isApproved ? (
                      <button
                        onClick={() => handleApproveReport(r.reportNumber)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    ) : r.status === 'Approved' ? (
                      <button
                        onClick={() => handleDeliverReport(r.reportNumber)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
                      >
                        Handover / Deliver
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Delivered
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
