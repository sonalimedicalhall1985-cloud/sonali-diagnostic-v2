import React, { useState, useEffect } from 'react';
import {
  Droplet,
  Search,
  PlusCircle,
  Phone,
  PhoneCall,
  MapPin,
  Calendar,
  Heart,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  X,
  Send,
  Sparkles,
  Filter,
} from 'lucide-react';
import { BloodDonor } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export const BloodDonors: React.FC = () => {
  const { language } = useLanguage();
  const { token, user } = useAuth();

  const [donors, setDonors] = useState<BloodDonor[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [contactSuccessMsg, setContactSuccessMsg] = useState('');

  // New Donor Form
  const [formData, setFormData] = useState({
    name: '',
    bloodGroup: 'O+' as BloodDonor['bloodGroup'],
    phone: '',
    alternatePhone: '',
    area: '',
    thanaOrUpazila: 'সিলেট সদর',
    district: 'সিলেট',
    gender: 'Male' as 'Male' | 'Female',
    age: '26',
    weightKg: '65',
    lastDonationDate: '',
    availableForEmergency: true,
    notes: '',
  });

  const bloodGroups: Array<BloodDonor['bloodGroup']> = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    fetchDonors();
  }, [selectedGroup, searchQuery]);

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedGroup !== 'ALL') params.append('bloodGroup', selectedGroup);
      if (searchQuery) params.append('q', searchQuery);

      const res = await fetch(`/api/blood-donors?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setDonors(json);
      }
    } catch (err) {
      console.error('Error fetching blood donors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.bloodGroup) return;

    try {
      const res = await fetch('/api/blood-donors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          name: '',
          bloodGroup: 'O+',
          phone: '',
          alternatePhone: '',
          area: '',
          thanaOrUpazila: 'সিলেট সদর',
          district: 'সিলেট',
          gender: 'Male',
          age: '26',
          weightKg: '65',
          lastDonationDate: '',
          availableForEmergency: true,
          notes: '',
        });
        fetchDonors();
      }
    } catch (err) {
      console.error('Error saving blood donor:', err);
    }
  };

  const handleSendUrgentCallAlert = (donor: BloodDonor) => {
    setContactSuccessMsg(
      language === 'bn'
        ? `জরুরি রক্তের অ্যালার্ট ${donor.name} (${donor.bloodGroup}) এর ফোনে পাঠানো হয়েছে!`
        : `Emergency blood requirement alert sent to ${donor.name} (${donor.bloodGroup})!`
    );
    setTimeout(() => setContactSuccessMsg(''), 4000);
  };

  const filteredDonors = donors.filter((d) => {
    if (emergencyOnly && !d.availableForEmergency) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <Droplet className="w-5 h-5 fill-rose-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {language === 'bn' ? 'স্বেচ্ছাসেবী রক্তদাতা ডিরেক্টরি' : 'Voluntary Blood Donor Directory'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn'
                  ? 'জরুরি রোগীর রক্তের প্রয়োজনে রক্তের গ্রুপ ও এলাকা অনুযায়ী তাৎক্ষণিক সন্ধান ও যোগাযোগ'
                  : 'Emergency blood donor directory searchable by blood group, area & emergency availability'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{language === 'bn' ? '+ নতুন রক্তদাতা যুক্ত করুন' : '+ Register Blood Donor'}</span>
        </button>
      </div>

      {contactSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{contactSuccessMsg}</span>
        </div>
      )}

      {/* Blood Group Filter Pill Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-rose-500" />
            <span>{language === 'bn' ? 'রক্তের গ্রুপ বাছাই করুন:' : 'Filter Blood Group:'}</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-rose-600 font-semibold">
            <input
              type="checkbox"
              checked={emergencyOnly}
              onChange={(e) => setEmergencyOnly(e.target.checked)}
              className="rounded text-rose-600 focus:ring-rose-500"
            />
            <span>{language === 'bn' ? 'জরুরি প্রয়োজনে প্রস্তুত (24/7 STAT)' : 'Emergency 24/7 STAT Only'}</span>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedGroup('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedGroup === 'ALL'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {language === 'bn' ? 'সকল গ্রুপ' : 'All Groups'} ({donors.length})
          </button>
          {bloodGroups.map((grp) => {
            const count = donors.filter((d) => d.bloodGroup === grp).length;
            const isSelected = selectedGroup === grp;
            return (
              <button
                key={grp}
                onClick={() => setSelectedGroup(grp)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40 hover:bg-rose-100'
                }`}
              >
                <span>{grp}</span>
                {count > 0 && <span className="text-[10px] opacity-80">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative pt-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'bn'
                ? 'রক্তদাতার নাম, এলাকা (যেমন: আম্বরখানা, সুবিদবাজার), থানা বা মোবাইল দিয়ে সার্চ...'
                : 'Search by donor name, area (e.g. Amberkhana, Zindabazar), thana or phone...'
            }
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* Donors Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDonors.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <Droplet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold">{language === 'bn' ? 'কোনো রক্তদাতা পাওয়া যায়নি' : 'No blood donors found'}</p>
            <p className="text-[11px] mt-1">
              {language === 'bn'
                ? 'অনুগ্রহ করে অন্য গ্রুপ বেছে নিন অথবা নতুন রক্তদাতা যুক্ত করুন।'
                : 'Try selecting a different group or add a new blood donor.'}
            </p>
          </div>
        ) : (
          filteredDonors.map((donor) => (
            <div
              key={donor.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 hover:border-rose-300 dark:hover:border-rose-900/60 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-13 h-13 rounded-2xl bg-rose-600 text-white flex flex-col items-center justify-center font-black shadow-md">
                    <span className="text-lg leading-tight">{donor.bloodGroup}</span>
                    <span className="text-[9px] uppercase tracking-tighter opacity-90">Donor</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{donor.name}</h3>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                      <span>{donor.gender === 'Male' ? (language === 'bn' ? 'পুরুষ' : 'Male') : (language === 'bn' ? 'মহিলা' : 'Female')}</span>
                      <span>•</span>
                      <span>{donor.age} {language === 'bn' ? 'বছর' : 'yrs'}</span>
                      {donor.weightKg && (
                        <>
                          <span>•</span>
                          <span>{donor.weightKg} kg</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {donor.availableForEmergency && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                    <span>24/7 STAT</span>
                  </span>
                )}
              </div>

              {/* Location & Contact Details */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs space-y-2 border border-slate-100 dark:border-slate-800">
                <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span className="text-[11px]">
                    {donor.area}, {donor.thanaOrUpazila}, {donor.district}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span>{language === 'bn' ? 'সর্বশেষ রক্তদান:' : 'Last Donated:'}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {donor.lastDonationDate || (language === 'bn' ? 'তথ্য নেই' : 'Not recorded')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{language === 'bn' ? 'মোট রক্তদান:' : 'Total Donations:'}</span>
                  <span className="font-bold text-rose-600">{donor.totalDonations} {language === 'bn' ? 'বার' : 'times'}</span>
                </div>
              </div>

              {donor.notes && (
                <p className="text-[11px] text-slate-500 italic bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200/50">
                  💡 {donor.notes}
                </p>
              )}

              {/* Contact Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`tel:${donor.phone}`}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'কল করুন' : 'Call Donor'}</span>
                </a>

                <button
                  onClick={() => handleSendUrgentCallAlert(donor)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                >
                  <Send className="w-3.5 h-3.5 text-rose-500" />
                  <span>{language === 'bn' ? 'জরুরি SMS' : 'STAT SMS'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ADD DONOR MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                  <Droplet className="w-5 h-5 fill-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {language === 'bn' ? 'নতুন স্বেচ্ছাসেবী রক্তদাতা নিবন্ধন' : 'Register Voluntary Blood Donor'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === 'bn'
                      ? 'সোনালী ডায়াগনস্টিক সেন্টারের রক্তদাতা সেন্ট্রাল পুলে রক্তদাতার তথ্য সংরক্ষণ'
                      : 'Store blood donor information in central clinical registry'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDonor} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'রক্তদাতার পুরো নাম *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Md. Shakil Ahmed"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'রক্তের গ্রুপ (Blood Group) *' : 'Blood Group *'}
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black"
                  >
                    {bloodGroups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'মোবাইল নম্বর *' : 'Phone Number *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="017xxxxxxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'বিকল্প ফোন (ঐচ্ছিক)' : 'Alternate Phone (Optional)'}
                  </label>
                  <input
                    type="tel"
                    value={formData.alternatePhone}
                    onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                    placeholder="018xxxxxxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'এলাকা / পয়েন্ট *' : 'Area *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="e.g. আম্বরখানা"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'থানা / উপজেলা' : 'Thana / Upazila'}
                  </label>
                  <input
                    type="text"
                    value={formData.thanaOrUpazila}
                    onChange={(e) => setFormData({ ...formData, thanaOrUpazila: e.target.value })}
                    placeholder="সিলেট সদর"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'জেলা' : 'District'}
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="সিলেট"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'লিঙ্গ' : 'Gender'}
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Male">{language === 'bn' ? 'পুরুষ' : 'Male'}</option>
                    <option value="Female">{language === 'bn' ? 'মহিলা' : 'Female'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'বয়স' : 'Age'}
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="26"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'ওজন (kg)' : 'Weight (kg)'}
                  </label>
                  <input
                    type="number"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                    placeholder="65"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'সর্বশেষ রক্তদানের তারিখ' : 'Last Donation Date'}
                </label>
                <input
                  type="date"
                  value={formData.lastDonationDate}
                  onChange={(e) => setFormData({ ...formData, lastDonationDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="availEmergency"
                  checked={formData.availableForEmergency}
                  onChange={(e) => setFormData({ ...formData, availableForEmergency: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <label htmlFor="availEmergency" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  {language === 'bn'
                    ? 'জরুরি রক্তের প্রয়োজনে দিন-রাত কল গ্রহণ করতে ইচ্ছুক (24/7 Emergency Available)'
                    : 'Available for emergency STAT calls 24/7'}
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'বিশেষ মন্তব্য / নোট' : 'Special Notes'}
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={language === 'bn' ? 'যেমন: এমএজি ওসমানী মেডিকেল সংলগ্ন...' : 'e.g. Near MAG Osmani Medical...'}
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
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md transition"
                >
                  {language === 'bn' ? 'রক্তদাতা সংরক্ষণ করুন' : 'Save Blood Donor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
