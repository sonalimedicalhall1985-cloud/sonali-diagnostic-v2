import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  Users,
  PlusCircle,
  CheckCircle2,
  Printer,
  Sparkles,
  Phone,
  Tag,
  AlertCircle,
  FileText,
  X,
  Share2,
  Award,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { FreeHealthCamp, CampPatientRegistration } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export const FreeCamp: React.FC = () => {
  const { language } = useLanguage();
  const { token, user } = useAuth();

  const [camps, setCamps] = useState<FreeHealthCamp[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState<FreeHealthCamp | null>(null);

  // Modals
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showFlyerModal, setShowFlyerModal] = useState(false);
  const [activeCampForFlyer, setActiveCampForFlyer] = useState<FreeHealthCamp | null>(null);

  // Camp Patient Registration Form State
  const [regPatientName, setRegPatientName] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regGender, setRegGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [regPhone, setRegPhone] = useState('');
  const [regVillage, setRegVillage] = useState('');
  const [regBloodPressure, setRegBloodPressure] = useState('120/80');
  const [regWeightKg, setRegWeightKg] = useState('62');
  const [regBloodGroup, setRegBloodGroup] = useState('B+');
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'র‍্যান্ডম ব্লাড সুগার (RBS ডায়াবেটিস টেস্ট)',
    'রক্তের গ্রুপ নির্ণয় (ABO & Rh Grouping)',
    'মেডিসিন বিশেষজ্ঞ ডাক্তারের ফ্রি স্বাস্থ্য পরামর্শ',
  ]);

  // Generated Registration Receipt Slip
  const [registrationSlip, setRegistrationSlip] = useState<{
    tokenNumber: number;
    patientName: string;
    campTitle: string;
    campDate: string;
    venue: string;
    services: string[];
  } | null>(null);

  // New Camp Form
  const [newCampData, setNewCampData] = useState({
    title: '',
    bengaliTitle: '',
    description: '',
    date: '',
    time: 'সকাল ০৯:০০ টা - দুপুর ০১:০০ টা',
    venue: 'সোনালী ডায়াগনস্টিক সেন্টার প্রাঙ্গণ',
    chiefConsultants: 'Prof. Dr. A. K. Azad (মেডিসিন বিশেষজ্ঞ)\nDr. Farhana Akter (শিশু বিশেষজ্ঞ)',
    freeServices: 'র‍্যান্ডম ব্লাড সুগার (RBS)\nরক্তের গ্রুপ নির্ণয়\nরক্তচাপ ও ওজন পরিমাপ\nবিশেষজ্ঞ ডাক্তারের ফ্রি পরামর্শ',
    discountedServices: 'হোল এবডোমেন ৪ডি ইউএসজি - ৩০% ছাড়\nসিবিসি ও ইএসআর টেস্ট - ২৫% ছাড়',
    targetPatients: '150',
    contactPhone: '01711000000',
    bannerNotice: 'আগে আসলে আগে পাবেন ভিত্তিতে সীমিত আসন • হেল্পলাইন: 01711-000000',
  });

  useEffect(() => {
    fetchCamps();
  }, []);

  const fetchCamps = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/free-camps');
      if (res.ok) {
        const json = await res.json();
        setCamps(json);
        if (json.length > 0 && !selectedCamp) {
          setSelectedCamp(json[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching free health camps:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: newCampData.title || newCampData.bengaliTitle,
        bengaliTitle: newCampData.bengaliTitle,
        description: newCampData.description,
        date: newCampData.date,
        time: newCampData.time,
        venue: newCampData.venue,
        chiefConsultants: newCampData.chiefConsultants.split('\n').filter(Boolean),
        freeServices: newCampData.freeServices.split('\n').filter(Boolean),
        discountedServices: newCampData.discountedServices.split('\n').filter(Boolean),
        targetPatients: parseInt(newCampData.targetPatients, 10) || 100,
        contactPhone: newCampData.contactPhone,
        bannerNotice: newCampData.bannerNotice,
      };

      const res = await fetch('/api/free-camps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowAnnounceModal(false);
        fetchCamps();
      }
    } catch (err) {
      console.error('Error creating health camp:', err);
    }
  };

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCamp || !regPatientName) return;

    try {
      const payload = {
        patientName: regPatientName,
        age: parseInt(regAge, 10) || 30,
        gender: regGender,
        phone: regPhone,
        villageOrArea: regVillage,
        registeredServices: selectedServices,
        bloodPressure: regBloodPressure,
        weightKg: regWeightKg,
        bloodGroup: regBloodGroup,
      };

      const res = await fetch(`/api/free-camps/${selectedCamp.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        setRegistrationSlip({
          tokenNumber: json.registration.tokenNumber,
          patientName: regPatientName,
          campTitle: selectedCamp.bengaliTitle || selectedCamp.title,
          campDate: selectedCamp.date,
          venue: selectedCamp.venue,
          services: selectedServices,
        });

        // Reset form
        setRegPatientName('');
        setRegAge('');
        setRegPhone('');
        setRegVillage('');
        fetchCamps();
      }
    } catch (err) {
      console.error('Error registering camp patient:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 shadow-xs">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {language === 'bn' ? 'ফ্রি মেডিকেল ও ডায়াগনস্টিক স্বাস্থ্য ক্যাম্প' : 'Free Medical & Diagnostic Health Camps'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn'
                  ? 'জনকল্যাণমূলক বিনামূল্যে ডায়াবেটিস ও ব্লাড গ্রুপ পরীক্ষা, বিশেষজ্ঞ ডাক্তারদের ফ্রি ভিজিট ও ছাড়ে পরীক্ষা'
                  : 'Corporate social responsibility portal: free screening tests, doctor consultations & camp registration'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAnnounceModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{language === 'bn' ? '+ নতুন ক্যাম্প ঘোষণা করুন' : '+ Announce Health Camp'}</span>
          </button>
        </div>
      </div>

      {/* Camp Highlighting Hero Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of Camps */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
            {language === 'bn' ? 'চলমান ও আসন্ন ক্যাম্প তালিকা' : 'Active & Upcoming Camps'}
          </h3>

          <div className="space-y-3">
            {camps.map((camp) => {
              const isSelected = selectedCamp?.id === camp.id;
              return (
                <div
                  key={camp.id}
                  onClick={() => setSelectedCamp(camp)}
                  className={`p-4 rounded-2xl border cursor-pointer transition text-xs space-y-2.5 ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200">
                      {camp.campCode}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        camp.status === 'Registration Open'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {camp.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2">
                    {camp.bengaliTitle || camp.title}
                  </h4>

                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>{camp.date}</span>
                    <span>•</span>
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{camp.time}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <span className="text-slate-500">{language === 'bn' ? 'নিবন্ধিত রুগী:' : 'Registered:'}</span>
                    <span className="font-bold text-teal-600">
                      {camp.registeredPatientsCount} / {camp.targetPatients} {language === 'bn' ? 'জন' : 'pts'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Camp Card & Live Registration (2 cols) */}
        {selectedCamp ? (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#0f2744] text-white">
                      {selectedCamp.campCode}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {selectedCamp.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {selectedCamp.bengaliTitle || selectedCamp.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{selectedCamp.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setActiveCampForFlyer(selectedCamp);
                      setShowFlyerModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition"
                  >
                    <Printer className="w-4 h-4 text-teal-600" />
                    <span>{language === 'bn' ? 'ব্যানার / ফ্লায়ার প্রিন্ট' : 'Print Camp Flyer'}</span>
                  </button>

                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{language === 'bn' ? 'রুগী নিবন্ধন করুন' : 'Register Patient'}</span>
                  </button>
                </div>
              </div>

              {/* Venue & Date Info Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/50 dark:border-teal-900/30 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">{language === 'bn' ? 'তারিখ ও সময়' : 'Date & Time'}</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    <span>{selectedCamp.date}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">{selectedCamp.time}</div>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">{language === 'bn' ? 'স্থান / ভেন্যু' : 'Venue'}</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>{selectedCamp.venue}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">সিলেট সদর</div>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">{language === 'bn' ? 'হেল্পলাইন' : 'Helpline'}</span>
                  <div className="font-bold text-teal-600 font-mono mt-0.5 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{selectedCamp.contactPhone}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">24/7 Information Desk</div>
                </div>
              </div>

              {/* Free Services & Specialist Doctors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Free Services List */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40 text-xs space-y-2.5">
                  <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-black">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'bn' ? 'বিনামূল্যে প্রাপ্ত সেবাসমূহ (100% Free)' : '100% Free Services'}</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                    {selectedCamp.freeServices.map((srv, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{srv}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Discounted Tests List */}
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40 text-xs space-y-2.5">
                  <div className="flex items-center gap-1.5 text-blue-800 dark:text-blue-300 font-black">
                    <Tag className="w-4 h-4 text-blue-600" />
                    <span>{language === 'bn' ? 'ক্যাম্প উপলক্ষে বিশেষ ছাড় (Special Discount)' : 'Special Discounts on Diagnostics'}</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                    {(selectedCamp.discountedServices || []).map((srv, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{srv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Specialist Doctors Participating */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                  <span>{language === 'bn' ? 'উপস্থিত বিশেষজ্ঞ চিকিৎসকবৃন্দ:' : 'Consultant Doctors in Attendance:'}</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedCamp.chiefConsultants.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 font-semibold text-slate-900 dark:text-white text-xs flex items-center gap-2"
                    >
                      <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 flex items-center justify-center font-bold">
                        Dr
                      </div>
                      <span>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Registration Progress */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-600 dark:text-slate-400">
                    {language === 'bn' ? 'রেজিস্ট্রেশন অগ্রগতি (ক্যাম্প কোটা)' : 'Registration Capacity Progress'}
                  </span>
                  <span className="text-teal-600 font-mono">
                    {selectedCamp.registeredPatientsCount} / {selectedCamp.targetPatients} (
                    {Math.round((selectedCamp.registeredPatientsCount / selectedCamp.targetPatients) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((selectedCamp.registeredPatientsCount / selectedCamp.targetPatients) * 100)
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* REGISTRATION SLIP SUCCESS MODAL */}
      {registrationSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {language === 'bn' ? 'ফ্রি ক্যাম্প টোকেন নিশ্চিত হয়েছে!' : 'Camp Token Generated!'}
              </h3>
              <p className="text-[11px] text-slate-500">সোনালী ডায়াগনস্টিক সেন্টার - হেলথ ক্যাম্প ডেস্ক</p>
            </div>

            {/* Token Badge */}
            <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-teal-800 dark:text-teal-300">
                {language === 'bn' ? 'রুগীর টোকেন নম্বর' : 'Camp Patient Token'}
              </span>
              <div className="text-3xl font-black text-teal-700 dark:text-teal-400 font-mono">
                #{String(registrationSlip.tokenNumber).padStart(3, '0')}
              </div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                {registrationSlip.patientName}
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>{language === 'bn' ? 'ক্যাম্প:' : 'Camp:'}</span>
                <span className="font-semibold text-slate-900 dark:text-white text-right">
                  {registrationSlip.campTitle}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'bn' ? 'তারিখ:' : 'Date:'}</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {registrationSlip.campDate}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'bn' ? 'স্থান:' : 'Venue:'}</span>
                <span>{registrationSlip.venue}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>{language === 'bn' ? 'টোকেন প্রিন্ট করুন' : 'Print Token Slip'}</span>
              </button>
              <button
                onClick={() => setRegistrationSlip(null)}
                className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300"
              >
                {language === 'bn' ? 'ঠিক আছে' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER PATIENT MODAL */}
      {showRegisterModal && selectedCamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'bn' ? 'ক্যাম্পে রুগী নিবন্ধন' : 'Camp Patient Registration'}
                </h3>
                <p className="text-[11px] text-slate-500">{selectedCamp.bengaliTitle || selectedCamp.title}</p>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterPatient} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'রোগীর পুরো নাম *' : 'Patient Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={regPatientName}
                  onChange={(e) => setRegPatientName(e.target.value)}
                  placeholder="e.g. Mrs. Rokeya Begum"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'বয়স *' : 'Age *'}
                  </label>
                  <input
                    type="number"
                    required
                    value={regAge}
                    onChange={(e) => setRegAge(e.target.value)}
                    placeholder="45"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'লিঙ্গ' : 'Gender'}
                  </label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Male">{language === 'bn' ? 'পুরুষ' : 'Male'}</option>
                    <option value="Female">{language === 'bn' ? 'মহিলা' : 'Female'}</option>
                    <option value="Other">{language === 'bn' ? 'অন্যান্য' : 'Other'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'মোবাইল নম্বর (ঐচ্ছিক)' : 'Mobile Phone (Optional)'}
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="017xxxxxxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'গ্রাম / এলাকা' : 'Area / Village'}
                  </label>
                  <input
                    type="text"
                    value={regVillage}
                    onChange={(e) => setRegVillage(e.target.value)}
                    placeholder="সুবিদবাজার, সিলেট"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Weight and BP Fields */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'রক্তচাপ (BP)' : 'Blood Pressure'}
                  </label>
                  <input
                    type="text"
                    value={regBloodPressure}
                    onChange={(e) => setRegBloodPressure(e.target.value)}
                    placeholder="120/80"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'ওজন (kg)' : 'Weight (kg)'}
                  </label>
                  <input
                    type="text"
                    value={regWeightKg}
                    onChange={(e) => setRegWeightKg(e.target.value)}
                    placeholder="62"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'ব্লাড গ্রুপ' : 'Blood Group'}
                  </label>
                  <select
                    value={regBloodGroup}
                    onChange={(e) => setRegBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md transition"
                >
                  {language === 'bn' ? 'টোকেন ইস্যু করুন' : 'Issue Camp Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE CAMP FLYER / POSTER BANNER MODAL */}
      {showFlyerModal && activeCampForFlyer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white text-slate-900 p-8 shadow-2xl border-4 border-[#0f2744] text-xs space-y-6 my-8">
            <div className="flex justify-between items-start print:hidden">
              <span className="text-[11px] font-bold text-teal-700 uppercase tracking-widest">
                Printable Public Campaign Banner
              </span>
              <button
                onClick={() => setShowFlyerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Flyer Header with SDC Seal */}
            <div className="text-center space-y-2 border-b-2 border-slate-200 pb-4">
              <div className="inline-block px-4 py-1 rounded-full bg-[#0f2744] text-white font-bold text-xs uppercase tracking-wider mb-1">
                সোনালী জনকল্যাণ স্বাস্থ্য সেবা প্রকল্প
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0f2744] tracking-tight">
                সোনালী ডায়াগনস্টিক সেন্টার
              </h1>
              <p className="text-xs font-bold text-teal-700">
                SONALI DIAGNOSTIC CENTER • Quality Healthcare & Trusted Diagnostics
              </p>
              <div className="text-lg sm:text-xl font-black text-rose-600 pt-2">
                {activeCampForFlyer.bengaliTitle || activeCampForFlyer.title}
              </div>
            </div>

            {/* Schedule & Venue Ribbon */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-teal-50 border border-teal-200 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">তারিখ ও সময়</span>
                <div className="font-black text-base text-teal-900">{activeCampForFlyer.date}</div>
                <div className="text-xs font-semibold text-slate-600">{activeCampForFlyer.time}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">স্থান / ভেন্যু</span>
                <div className="font-black text-base text-teal-900">{activeCampForFlyer.venue}</div>
                <div className="text-xs text-slate-600">হেল্পলাইন: {activeCampForFlyer.contactPhone}</div>
              </div>
            </div>

            {/* Free Services Big Highlights */}
            <div className="space-y-3">
              <h4 className="font-black text-sm uppercase tracking-wider text-slate-900 text-center flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>বিনামূল্যে পরীক্ষা ও সেবাসমূহ (১০০% ফ্রি)</span>
                <Sparkles className="w-4 h-4 text-emerald-600" />
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {activeCampForFlyer.freeServices.map((srv, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 font-bold text-emerald-900 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{srv}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Specialist Doctors on Flyer */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-xs text-slate-700 block text-center">
                পরামর্শ প্রদানে উপস্থিত থাকবেন প্রখ্যাত বিশেষজ্ঞ চিকিৎসকবৃন্দ
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {activeCampForFlyer.chiefConsultants.map((doc, idx) => (
                  <div key={idx} className="font-bold text-[#0f2744] flex items-center gap-1.5">
                    <span>🩺</span>
                    <span>{doc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Discounted Diagnostic Services */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center text-xs text-amber-900 font-bold">
              🎉 ক্যাম্পের সকল রেজিস্ট্রেশনকৃত রোগীদের জন্য আল্ট্রাসনোগ্রাফি ও রক্ত পরীক্ষায় বিশেষ ২৫% - ৩৫% ছাড়!
            </div>

            {/* Flyer Footer */}
            <div className="text-center text-[11px] text-slate-500 pt-2 border-t border-slate-200">
              <p className="font-bold text-slate-800">
                সোনালী ডায়াগনস্টিক সেন্টার • হেল্পলাইন: {activeCampForFlyer.contactPhone} • সিলেট
              </p>
              <p className="text-[10px] mt-0.5">আগে আসলে আগে পাবেন ভিত্তিতে সীমিত আসন সংখ্যা</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 print:hidden">
              <button
                onClick={() => window.print()}
                className="py-2.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-lg flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট / সেভ করুন (Print Poster)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ANNOUNCE NEW CAMP MODAL */}
      {showAnnounceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'bn' ? 'নতুন ফ্রি হেলথ ক্যাম্প আয়োজন' : 'Announce Free Health Camp'}
              </h3>
              <button
                onClick={() => setShowAnnounceModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCamp} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'ক্যাম্পের শিরোনাম (বাংলায়) *' : 'Camp Title (Bengali) *'}
                </label>
                <input
                  type="text"
                  required
                  value={newCampData.bengaliTitle}
                  onChange={(e) => setNewCampData({ ...newCampData, bengaliTitle: e.target.value })}
                  placeholder="যেমন: সোনালী ফ্রি ডায়াবেটিস ও ব্লাড প্রেশার ক্যাম্প"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'ক্যাম্পের তারিখ *' : 'Camp Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={newCampData.date}
                    onChange={(e) => setNewCampData({ ...newCampData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'ক্যাম্পের সময়' : 'Time'}
                  </label>
                  <input
                    type="text"
                    value={newCampData.time}
                    onChange={(e) => setNewCampData({ ...newCampData, time: e.target.value })}
                    placeholder="সকাল ০৯:০০ টা - দুপুর ০১:০০ টা"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'স্থান / ভেন্যু *' : 'Venue *'}
                </label>
                <input
                  type="text"
                  required
                  value={newCampData.venue}
                  onChange={(e) => setNewCampData({ ...newCampData, venue: e.target.value })}
                  placeholder="সোনালী ডায়াগনস্টিক সেন্টার প্রাঙ্গণ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'উপস্থিত চিকিৎসকবৃন্দ (প্রতি লাইনে ১ জন)' : 'Consultants (1 per line)'}
                </label>
                <textarea
                  rows={2}
                  value={newCampData.chiefConsultants}
                  onChange={(e) => setNewCampData({ ...newCampData, chiefConsultants: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'বিনামূল্যে সেবাসমূহ (প্রতি লাইনে ১টি)' : 'Free Services (1 per line)'}
                </label>
                <textarea
                  rows={2}
                  value={newCampData.freeServices}
                  onChange={(e) => setNewCampData({ ...newCampData, freeServices: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'টার্গেট রুগী সংখ্যা' : 'Target Patients'}
                  </label>
                  <input
                    type="number"
                    value={newCampData.targetPatients}
                    onChange={(e) => setNewCampData({ ...newCampData, targetPatients: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'হেল্পলাইন মোবাইল' : 'Contact Phone'}
                  </label>
                  <input
                    type="tel"
                    value={newCampData.contactPhone}
                    onChange={(e) => setNewCampData({ ...newCampData, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAnnounceModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md transition"
                >
                  {language === 'bn' ? 'ক্যাম্প প্রকাশ করুন' : 'Publish Health Camp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
