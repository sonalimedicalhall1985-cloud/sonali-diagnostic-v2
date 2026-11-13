import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Search,
  PlusCircle,
  Tag,
  Clock,
  FlaskConical,
  CheckCircle,
  Activity,
  Layers,
} from 'lucide-react';
import { DiagnosticTest } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export const TestCatalog: React.FC = () => {
  const { language, t } = useLanguage();
  const { token, user } = useAuth();
  const [testsList, setTestsList] = useState<DiagnosticTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTests();
  }, [token]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tests');
      if (res.ok) {
        const json = await res.json();
        setTestsList(json);
      }
    } catch (err) {
      console.error('Error fetching tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(testsList.map((t) => t.category)))];

  const filtered = testsList.filter((test) => {
    const matchesCat = categoryFilter === 'All' || test.category === categoryFilter;
    const matchesSearch =
      test.name.toLowerCase().includes(search.toLowerCase()) ||
      test.code.toLowerCase().includes(search.toLowerCase()) ||
      test.category.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Clinical Investigation & Diagnostic Test Directory
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configurable reference intervals, turnaround times (TAT), specimen vials, and pricing schedule
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search diagnostic test by code or name (e.g. CBC, Lipid, USG)..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === 'All' ? 'All Clinical Categories' : c}
            </option>
          ))}
        </select>
      </div>

      {/* Test Directory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">Loading catalog...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">No diagnostic tests found.</div>
        ) : (
          filtered.map((test) => (
            <div
              key={test.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#0f2744] text-teal-400">
                    {test.code}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {test.category}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2">
                  {test.name}
                </h3>

                <div className="mt-2.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
                    <span>Specimen: <strong className="text-slate-800 dark:text-slate-200">{test.sampleType}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Report Delivery TAT: <strong>{test.tatHours} Hours</strong></span>
                  </div>
                  {test.methodology && (
                    <div className="text-[11px] text-slate-500 italic">
                      Method: {test.methodology}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Rate / Price</span>
                  <span className="font-mono font-bold text-base text-slate-900 dark:text-teal-400">
                    BDT {parseFloat(test.price).toFixed(0)}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Active
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
