import React, { useState, useEffect } from 'react';
import {
  TestTube2,
  CheckCircle,
  Clock,
  AlertTriangle,
  QrCode,
  Search,
  Filter,
  UserCheck,
  Building,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { SampleItem } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export const Samples: React.FC = () => {
  const { language, t } = useLanguage();
  const { token, user } = useAuth();
  const [samplesList, setSamplesList] = useState<SampleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSamples();
  }, [token]);

  const fetchSamples = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/samples', {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (res.ok) {
        const json = await res.json();
        setSamplesList(json);
      }
    } catch (err) {
      console.error('Error fetching samples:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (sampleId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/samples/${sampleId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          status: newStatus,
          collectorName: user?.name || 'Phlebotomist Tanvir',
        }),
      });
      if (res.ok) {
        fetchSamples();
      }
    } catch (err) {
      console.error('Error updating sample status:', err);
    }
  };

  const filteredSamples = samplesList.filter((s) => {
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    const matchesSearch =
      s.sampleId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.barcode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getTubeBadge = (sampleType: string) => {
    if (sampleType.includes('EDTA') || sampleType.includes('Blood')) {
      return { label: 'EDTA (Purple Top)', bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' };
    }
    if (sampleType.includes('Serum') || sampleType.includes('Clot')) {
      return { label: 'Serum (Red Top)', bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' };
    }
    if (sampleType.includes('Fluoride') || sampleType.includes('Sugar')) {
      return { label: 'Fluoride (Grey Top)', bg: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200' };
    }
    if (sampleType.includes('Urine')) {
      return { label: 'Sterile Urine Cup', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
    }
    return { label: sampleType, bg: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' };
  };

  return (
    <div className="space-y-6">
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t.sample.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.sample.subtitle}
          </p>
        </div>

        <button
          onClick={fetchSamples}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search specimen by Sample ID, Barcode, Patient, or Test..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
          >
            <option value="All">All Specimen Statuses</option>
            <option value="Sample Pending">Sample Pending (Phlebotomy Waiting)</option>
            <option value="Sample Collected">Sample Collected</option>
            <option value="Sample Received">Sample Received in Lab</option>
            <option value="Processing">Processing in Analyzer</option>
            <option value="Approved">Approved</option>
          </select>
        </div>
      </div>

      {/* Samples Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-bold">{t.sample.sampleId}</th>
                <th className="py-3 px-4 font-bold">Patient</th>
                <th className="py-3 px-4 font-bold">Investigation</th>
                <th className="py-3 px-4 font-bold">{t.sample.specimenType}</th>
                <th className="py-3 px-4 font-bold">{t.sample.barcode}</th>
                <th className="py-3 px-4 font-bold">{t.common.status}</th>
                <th className="py-3 px-4 font-bold text-right">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading samples...
                  </td>
                </tr>
              ) : filteredSamples.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No samples match criteria.
                  </td>
                </tr>
              ) : (
                filteredSamples.map((s) => {
                  const tube = getTubeBadge(s.sampleType);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#0f2744] dark:text-teal-400">
                        {s.sampleId}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{s.patientName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {s.patientId}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {s.testName}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tube.bg}`}>
                          {tube.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-mono text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded w-fit">
                          <QrCode className="w-3 h-3 text-slate-400" />
                          <span>{s.barcode}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === 'Sample Pending'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                              : s.status === 'Sample Collected'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : s.status === 'Processing'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {s.status === 'Sample Pending' && (
                            <button
                              onClick={() => handleUpdateStatus(s.sampleId, 'Sample Collected')}
                              className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] shadow-xs"
                            >
                              Collect Sample
                            </button>
                          )}
                          {s.status === 'Sample Collected' && (
                            <button
                              onClick={() => handleUpdateStatus(s.sampleId, 'Sample Received')}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] shadow-xs"
                            >
                              Receive in Lab
                            </button>
                          )}
                          {s.status === 'Sample Received' && (
                            <button
                              onClick={() => handleUpdateStatus(s.sampleId, 'Processing')}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] shadow-xs"
                            >
                              Start Processing
                            </button>
                          )}
                          {s.status === 'Processing' && (
                            <span className="text-[10px] text-teal-600 font-semibold italic">In Analyzer</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
