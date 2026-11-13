import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Target,
  Users,
  Phone,
  MapPin,
  TrendingUp,
  Award,
  CheckCircle2,
  PlusCircle,
  X,
  UserCheck,
} from 'lucide-react';
import { MarketingRep } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export const Marketing: React.FC = () => {
  const { language, t } = useLanguage();
  const { token } = useAuth();
  const [repsList, setRepsList] = useState<MarketingRep[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Rep Form
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    area: '',
    monthlyTarget: '150000',
    defaultHonorarium: '150',
    gender: 'Female' as 'Female' | 'Male',
    isFemaleRep: true,
    notes: '',
  });

  useEffect(() => {
    fetchReps();
  }, [token]);

  const fetchReps = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/marketing', {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (res.ok) {
        const json = await res.json();
        setRepsList(json);
      }
    } catch (err) {
      console.error('Error fetching marketing reps:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    try {
      const res = await fetch('/api/marketing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          name: '',
          phone: '',
          area: '',
          monthlyTarget: '150000',
          defaultHonorarium: '150',
          gender: 'Female',
          isFemaleRep: true,
          notes: '',
        });
        fetchReps();
      }
    } catch (err) {
      console.error('Error saving marketing rep:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {language === 'bn' ? 'মার্কেটিং ও ফিল্ড রিপ্রেজেন্টেটিভ' : 'Marketing Representatives & Referral Liaison'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'bn'
              ? 'এলাকা ব্যবস্থাপনা, নারী মার্কেটিং কর্মী চিহ্নিতকরণ, হাসপাতাল যোগাযোগ ও মাসিক টার্গেট'
              : 'Area management, clinic communications, female rep tagging, monthly targets & tracking'}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{language === 'bn' ? '+ নতুন প্রতিনিধি যোগ করুন' : '+ Add Marketing Rep'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {repsList.map((rep) => (
          <div
            key={rep.id}
            className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-sm space-y-3 transition ${
              rep.isFemaleRep
                ? 'border-pink-300 dark:border-pink-900/60 bg-gradient-to-b from-pink-50/20 to-transparent'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  rep.isFemaleRep
                    ? 'bg-pink-100 dark:bg-pink-950/60 text-pink-600'
                    : 'bg-teal-50 dark:bg-teal-950/40 text-teal-600'
                }`}
              >
                <Megaphone className="w-5 h-5" />
              </div>

              <div className="flex items-center gap-1.5">
                {rep.isFemaleRep && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300 border border-pink-200 dark:border-pink-900 flex items-center gap-1">
                    <span>👩‍💼</span>
                    <span>{language === 'bn' ? 'নারী প্রতিনিধি' : 'Female Rep'}</span>
                  </span>
                )}
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Active
                </span>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{rep.name}</span>
              </h3>
              <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Area: {rep.area}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono">{rep.phone}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Monthly Target:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ৳{parseFloat(rep.monthlyTarget).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Default Honorarium:</span>
                <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                  ৳{rep.defaultHonorarium || '150'} / রোগী
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Achievement:</span>
                <span className="font-mono font-bold text-emerald-600">84%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full w-[84%] ${
                    rep.isFemaleRep ? 'bg-pink-500' : 'bg-teal-500'
                  }`}
                ></div>
              </div>
            </div>

            {rep.notes && (
              <p className="text-[11px] text-slate-500 italic">{rep.notes}</p>
            )}
          </div>
        ))}
      </div>

      {/* ADD MARKETING REP MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'bn' ? 'নতুন মার্কেটিং প্রতিনিধি যুক্ত করুন' : 'Add Marketing Representative'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRep} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'প্রতিনিধির নাম *' : 'Representative Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Farzana Yasmin"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'মোবাইল নম্বর *' : 'Phone Number *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="019xxxxxxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'কাজের এলাকা *' : 'Assigned Area *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="Zindabazar Zone"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'মাসিক টার্গেট (BDT)' : 'Monthly Target (BDT)'}
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={formData.monthlyTarget}
                    onChange={(e) => setFormData({ ...formData, monthlyTarget: e.target.value })}
                    placeholder="150000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'ডিফল্ট সম্মানী (৳ / রোগী)' : 'Default Honorarium (BDT)'}
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={formData.defaultHonorarium}
                    onChange={(e) => setFormData({ ...formData, defaultHonorarium: e.target.value })}
                    placeholder="150"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Female Rep Distinct Identification Toggle */}
              <div className="p-3 rounded-xl bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/50 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="femaleRepCheckbox"
                  checked={formData.isFemaleRep}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isFemaleRep: e.target.checked,
                      gender: e.target.checked ? 'Female' : 'Male',
                    })
                  }
                  className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500"
                />
                <label htmlFor="femaleRepCheckbox" className="font-bold text-pink-900 dark:text-pink-300 cursor-pointer">
                  👩‍💼 {language === 'bn' ? 'নারী কর্মী হিসেবে আলাদা চিহ্নিত করুন (Female Field Officer)' : 'Tag as Female Marketing Representative'}
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'নোট / কাজের ক্ষেত্র' : 'Notes / Special Focus'}
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={
                    language === 'bn'
                      ? 'যেমন: ম্যাটারনিটি ও গাইনি ক্লিনিক সমন্বয়কারী...'
                      : 'e.g. Liaison for maternity & gynecology...'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md transition"
                >
                  {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Representative'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
