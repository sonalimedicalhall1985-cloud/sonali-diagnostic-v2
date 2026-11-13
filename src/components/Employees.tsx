import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  PlusCircle,
  Clock,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  DollarSign,
  Building,
  Laptop,
  AlertTriangle,
  FileText,
  Send,
  Bell,
  Check,
  ShieldAlert,
  Sparkles,
  Users,
  Activity,
  Layers,
  ChevronRight,
  X,
  Radio,
  FileCheck2,
} from 'lucide-react';
import {
  Employee,
  EmployeeAttendance,
  StaffTask,
  EmergencyHandover,
  StaffDirective,
} from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export const Employees: React.FC = () => {
  const { language, t } = useLanguage();
  const { token, user } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'roster' | 'remoteTasks' | 'emergencyHandover' | 'directives' | 'attendance'
  >('roster');

  // Main Datasets
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [attendanceList, setAttendanceList] = useState<EmployeeAttendance[]>([]);
  const [tasksList, setTasksList] = useState<StaffTask[]>([]);
  const [handoversList, setHandoversList] = useState<EmergencyHandover[]>([]);
  const [directivesList, setDirectivesList] = useState<StaffDirective[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddHandoverModal, setShowAddHandoverModal] = useState(false);
  const [showAddDirectiveModal, setShowAddDirectiveModal] = useState(false);
  const [ackNotice, setAckNotice] = useState<string | null>(null);

  // New Employee Form
  const [employeeFormData, setEmployeeFormData] = useState({
    name: '',
    designation: '',
    department: 'Laboratory',
    phone: '',
    email: '',
    basicSalary: '28000',
    dutySchedule: 'Morning (08:00 AM - 02:00 PM)',
    shiftType: 'Morning (08:00 - 14:00)' as Employee['shiftType'],
    assignedResponsibility: '',
    isRemoteAllowed: true,
  });

  // New Task Form
  const [taskFormData, setTaskFormData] = useState({
    employeeName: '',
    title: '',
    description: '',
    priority: 'Normal' as StaffTask['priority'],
    department: 'Pathology Lab',
    dueDate: new Date().toISOString().split('T')[0],
    isRemote: true,
    notes: '',
  });

  // New Handover Form
  const [handoverFormData, setHandoverFormData] = useState({
    fromShift: 'Morning Shift (08:00 - 14:00)',
    toShift: 'Evening Shift (14:00 - 20:00)',
    outgoingStaffName: user?.name || 'Md. Al-Amin',
    incomingStaffName: 'Tahmina Khatun',
    criticalPatientsNotes: '',
    pendingSamplesCount: '3',
    urgentReportsCount: '2',
    reagentEquipmentStatus: 'Mindray BC-5000 & Chemray calibrated. Controls OK.',
  });

  // New Directive Form
  const [directiveFormData, setDirectiveFormData] = useState({
    title: '',
    content: '',
    category: 'Urgent Directive' as StaffDirective['category'],
    priority: 'High' as StaffDirective['priority'],
    targetRoles: 'Lab Technician, Report Approver, Receptionist',
  });

  useEffect(() => {
    fetchAllData();
  }, [token]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token || ''}` };

      const [empRes, attRes, taskRes, handRes, dirRes] = await Promise.all([
        fetch('/api/employees', { headers }),
        fetch('/api/employees/attendance', { headers }),
        fetch('/api/staff-tasks', { headers }),
        fetch('/api/emergency-handovers', { headers }),
        fetch('/api/staff-directives', { headers }),
      ]);

      if (empRes.ok) setEmployeesList(await empRes.json());
      if (attRes.ok) setAttendanceList(await attRes.json());
      if (taskRes.ok) setTasksList(await taskRes.json());
      if (handRes.ok) setHandoversList(await handRes.json());
      if (dirRes.ok) setDirectivesList(await dirRes.json());
    } catch (err) {
      console.error('Error fetching employee module data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handover Acknowledgment
  const handleAcknowledgeHandover = async (id: number) => {
    try {
      const res = await fetch(`/api/emergency-handovers/${id}/acknowledge`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
      });
      if (res.ok) {
        setAckNotice(
          language === 'bn'
            ? 'জরুরি সার্ভিসের কাজ সফলভাবে বুঝে নেওয়া হয়েছে এবং ডিজিটাল সাইন সম্পন্ন!'
            : 'Emergency service handover signed off and acknowledged successfully!'
        );
        setTimeout(() => setAckNotice(null), 4000);
        fetchAllData();
      }
    } catch (err) {
      console.error('Error acknowledging handover:', err);
    }
  };

  // Task Status Toggle
  const handleTaskStatusChange = async (id: number, status: StaffTask['status']) => {
    try {
      const res = await fetch(`/api/staff-tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  // Directive Acknowledgment
  const handleAcknowledgeDirective = async (id: number) => {
    try {
      const res = await fetch(`/api/staff-directives/${id}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
      });
      if (res.ok) {
        setAckNotice(
          language === 'bn'
            ? 'নির্দেশনাটি পড়া হয়েছে মর্মে আপনার নাম তালিকাভুক্ত হয়েছে।'
            : 'Directive marked as read and acknowledged.'
        );
        setTimeout(() => setAckNotice(null), 4000);
        fetchAllData();
      }
    } catch (err) {
      console.error('Error acknowledging directive:', err);
    }
  };

  // Submit Handover Form
  const handleCreateHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/emergency-handovers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify(handoverFormData),
      });
      if (res.ok) {
        setShowAddHandoverModal(false);
        setHandoverFormData({
          fromShift: 'Morning Shift (08:00 - 14:00)',
          toShift: 'Evening Shift (14:00 - 20:00)',
          outgoingStaffName: user?.name || 'Md. Al-Amin',
          incomingStaffName: 'Tahmina Khatun',
          criticalPatientsNotes: '',
          pendingSamplesCount: '3',
          urgentReportsCount: '2',
          reagentEquipmentStatus: 'Mindray BC-5000 & Chemray calibrated. Controls OK.',
        });
        fetchAllData();
      }
    } catch (err) {
      console.error('Error creating handover:', err);
    }
  };

  // Submit Task Form
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/staff-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify(taskFormData),
      });
      if (res.ok) {
        setShowAddTaskModal(false);
        setTaskFormData({
          employeeName: '',
          title: '',
          description: '',
          priority: 'Normal',
          department: 'Pathology Lab',
          dueDate: new Date().toISOString().split('T')[0],
          isRemote: true,
          notes: '',
        });
        fetchAllData();
      }
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  // Submit Directive Form
  const handleCreateDirective = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/staff-directives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          title: directiveFormData.title,
          content: directiveFormData.content,
          category: directiveFormData.category,
          priority: directiveFormData.priority,
          targetRoles: directiveFormData.targetRoles.split(',').map((s) => s.trim()),
        }),
      });
      if (res.ok) {
        setShowAddDirectiveModal(false);
        setDirectiveFormData({
          title: '',
          content: '',
          category: 'Urgent Directive',
          priority: 'High',
          targetRoles: 'Lab Technician, Report Approver, Receptionist',
        });
        fetchAllData();
      }
    } catch (err) {
      console.error('Error creating directive:', err);
    }
  };

  const handleMarkAttendance = (emp: Employee, status: 'Present' | 'On Leave') => {
    const today = new Date().toISOString().split('T')[0];
    const checkIn = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setAttendanceList((prev) => {
      const existing = prev.find((a) => a.employeeId === emp.id);
      if (existing) {
        return prev.map((a) =>
          a.employeeId === emp.id
            ? { ...a, status, checkIn: status === 'Present' ? checkIn : undefined }
            : a
        );
      }
      return [
        ...prev,
        {
          id: prev.length + 1,
          employeeId: emp.id,
          employeeName: emp.name,
          date: today,
          status,
          checkIn: status === 'Present' ? checkIn : undefined,
        },
      ];
    });
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {language === 'bn'
              ? 'স্টাফ দায়িত্ব বণ্টন, রিমোট কাজ ও জরুরি সার্ভিস হ্যান্ডওভার'
              : 'Staff Roster, Remote Task Hub & Emergency Shift Handover'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'bn'
              ? 'কার কি দায়িত্ব, শিফট টাইম সিডিউল, রিমোট ওয়ার্কস্টেশন, জরুরি হ্যান্ডওভার লগবুক ও প্রাতিষ্ঠানিক নির্দেশনা'
              : 'Assigned duties, time schedules, remote task tracking, STAT handover sign-offs and owner circulars'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'roster' && (
            <button
              onClick={() => setShowAddEmployeeModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{language === 'bn' ? '+ নতুন কর্মী যুক্ত করুন' : '+ Add Employee'}</span>
            </button>
          )}

          {activeTab === 'remoteTasks' && (
            <button
              onClick={() => setShowAddTaskModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{language === 'bn' ? '+ নতুন কাজ এসাইন করুন' : '+ Assign Staff Task'}</span>
            </button>
          )}

          {activeTab === 'emergencyHandover' && (
            <button
              onClick={() => setShowAddHandoverModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{language === 'bn' ? '+ নতুন শিফট হ্যান্ডওভার লগ' : '+ New Shift Handover'}</span>
            </button>
          )}

          {activeTab === 'directives' && (
            <button
              onClick={() => setShowAddDirectiveModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{language === 'bn' ? '+ নতুন নির্দেশনা জারি করুন' : '+ Issue Directive'}</span>
            </button>
          )}
        </div>
      </div>

      {ackNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{ackNotice}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2 text-xs">
        <button
          onClick={() => setActiveTab('roster')}
          className={`py-3 px-4 font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'roster'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{language === 'bn' ? 'কার কি দায়িত্ব + টাইম সিডিউল' : 'Duty Roster & Assigned Responsibilities'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800">
            {employeesList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('remoteTasks')}
          className={`py-3 px-4 font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'remoteTasks'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>{language === 'bn' ? 'স্টাফ কাজ এর রিমোট ব্যাবস্হা' : 'Remote Tasks & Work Hub'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-bold">
            {tasksList.filter((t) => t.status !== 'Completed').length} active
          </span>
        </button>

        <button
          onClick={() => setActiveTab('emergencyHandover')}
          className={`py-3 px-4 font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'emergencyHandover'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
          <span>{language === 'bn' ? 'জরুরি সার্ভিস এর কাজ বুঝে নেওয়া (হ্যান্ডওভার)' : 'Emergency Shift Handover'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold">
            {handoversList.filter((h) => !h.acknowledged).length} pending
          </span>
        </button>

        <button
          onClick={() => setActiveTab('directives')}
          className={`py-3 px-4 font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'directives'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>{language === 'bn' ? 'সকল স্টাফদের নির্দেশনা প্রদান' : 'Directives & Noticeboard'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
            {directivesList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`py-3 px-4 font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'attendance'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>{language === 'bn' ? 'দৈনিক উপস্থিতি ও হাজিরা' : 'Attendance Log'}</span>
        </button>
      </div>

      {/* TAB 1: DUTY ROSTER & ASSIGNED RESPONSIBILITIES */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employeesList.map((emp) => (
              <div
                key={emp.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3.5 hover:border-teal-500 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#0f2744] text-white flex items-center justify-center font-bold text-sm shadow">
                      {emp.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">{emp.name}</h3>
                      <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">{emp.designation}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      emp.currentShiftStatus === 'Active on Duty'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {emp.currentShiftStatus || 'Active on Duty'}
                  </span>
                </div>

                {/* Shift Time & Mode */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>{language === 'bn' ? 'শিফট টাইম:' : 'Shift Time:'}</span>
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-[11px]">
                      {emp.shiftType || emp.dutySchedule}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Laptop className="w-3.5 h-3.5 text-blue-500" />
                      <span>{language === 'bn' ? 'কাজের ধরণ:' : 'Work Mode:'}</span>
                    </span>
                    <span
                      className={`font-semibold text-[11px] ${
                        emp.remoteWorkStatus === 'Remote Active'
                          ? 'text-purple-600 dark:text-purple-400 font-bold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {emp.remoteWorkStatus || 'On-Site Workstation'}
                    </span>
                  </div>
                </div>

                {/* Specific Assigned Responsibility */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {language === 'bn' ? 'নির্দিষ্ট দায়িত্ব ও দায়িত্বপ্রাপ্ত মেশিন:' : 'Assigned Responsibility:'}
                  </span>
                  <div className="p-2.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/50 dark:border-teal-900/40 text-xs text-slate-800 dark:text-slate-200 font-medium">
                    {emp.assignedResponsibility || (language === 'bn' ? 'সাধারণ ল্যাব কার্যক্রম ও স্যাম্পল প্রসেসিং' : 'General clinical operations & sample testing')}
                  </div>
                </div>

                {/* Contact info */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                  <span className="font-mono">{emp.phone}</span>
                  <span className="text-slate-400">{emp.department}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: REMOTE STAFF TASKS */}
      {activeTab === 'remoteTasks' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {language === 'bn' ? 'অনলাইন ও ওয়ার্কস্টেশন রিমোট টাস্ক বোর্ড' : 'Online & Workstation Task Board'}
                </h3>
                <span className="text-[11px] text-slate-400">
                  {language === 'bn'
                    ? 'স্টাফদের বাসা বা শাখা অফিস থেকে অনলাইন রিপোর্ট ভেরিফিকেশন, স্টক অডিট ও টেস্ট কোয়ালিটি কন্ট্রোল'
                    : 'Task assignments for laboratory QA, remote clinical report verifications and operations'}
                </span>
              </div>
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:underline"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{language === 'bn' ? 'নতুন কাজ দিন' : 'Assign Task'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {tasksList.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border text-xs transition space-y-2.5 ${
                    task.status === 'Completed'
                      ? 'border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : task.priority === 'Urgent / STAT'
                      ? 'border-rose-300 bg-rose-50/40 dark:bg-rose-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          task.priority === 'Urgent / STAT'
                            ? 'bg-rose-600 text-white'
                            : task.priority === 'High'
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {task.priority}
                      </span>
                      {task.isRemote && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 flex items-center gap-1">
                          <Laptop className="w-3 h-3" />
                          <span>{language === 'bn' ? 'রিমোট কাজ' : 'Remote'}</span>
                        </span>
                      )}
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{task.title}</h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={task.status}
                        onChange={(e) => handleTaskStatusChange(task.id, e.target.value as any)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          task.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Review Required">Review Required</option>
                      </select>
                    </div>
                  </div>

                  {task.description && (
                    <p className="text-slate-600 dark:text-slate-400 text-xs">{task.description}</p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                    <div className="flex items-center gap-3">
                      <span>
                        👤 <strong className="text-slate-700 dark:text-slate-300">{task.employeeName}</strong>
                      </span>
                      <span>•</span>
                      <span>{task.department}</span>
                      <span>•</span>
                      <span>Assigned by: {task.assignedBy}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span>Due: {task.dueDate}</span>
                      {task.completedAt && (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Done</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EMERGENCY SERVICE SHIFT HANDOVER LOG */}
      {activeTab === 'emergencyHandover' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
                  <span>{language === 'bn' ? 'জরুরি সার্ভিস ও শিফট হ্যান্ডওভার রেজিস্টার' : 'STAT Service Shift Handover Register'}</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  {language === 'bn'
                    ? 'আউটগোয়িং ও ইনকামিং টেকনিশিয়ানদের মাঝে জরুরি নমুনা, প্যানিক অ্যালার্ট ও কাজ ডিজিটাল সাইনে বুঝিয়ে দেওয়া'
                    : 'Shift-to-shift transition log: critical panic results, pending investigations, and incoming staff sign-off'}
                </span>
              </div>
              <button
                onClick={() => setShowAddHandoverModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{language === 'bn' ? 'হ্যান্ডওভার এন্ট্রি' : 'Log Handover'}</span>
              </button>
            </div>

            <div className="space-y-4">
              {handoversList.map((hnd) => (
                <div
                  key={hnd.id}
                  className={`p-5 rounded-2xl border text-xs transition space-y-3.5 ${
                    hnd.acknowledged
                      ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/30'
                      : 'border-rose-400 bg-rose-50/40 dark:bg-rose-950/20 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-900 text-white">
                        {hnd.handoverNumber}
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {hnd.fromShift} ➔ {hnd.toShift}
                      </span>
                      <span className="text-slate-400 text-[11px]">({hnd.date})</span>
                    </div>

                    <div>
                      {hnd.acknowledged ? (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{language === 'bn' ? 'কাজ বুঝে নেওয়া হয়েছে' : 'Acknowledged & Signed'}</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAcknowledgeHandover(hnd.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition flex items-center gap-1.5"
                        >
                          <FileCheck2 className="w-4 h-4" />
                          <span>{language === 'bn' ? 'কাজ বুঝে নিয়ে ডিজিটাল সাইন করুন' : 'Sign & Acknowledge'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Critical Patients Notes Box */}
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-slate-800 dark:text-slate-200 space-y-1">
                    <span className="font-bold text-rose-700 dark:text-rose-400 text-[11px] uppercase tracking-wide flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'জরুরি সার্ভিস ও ক্রিটিক্যাল রুগীদের তথ্য (STAT Panic Cases):' : 'Emergency & Panic Patient Notes:'}</span>
                    </span>
                    <p className="text-xs font-medium leading-relaxed">{hnd.criticalPatientsNotes}</p>
                  </div>

                  {/* Quantitative Handover Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-600 dark:text-slate-400">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">{language === 'bn' ? 'হস্তান্তরিত পেন্ডিং নমুনা' : 'Pending Samples'}</span>
                      <strong className="text-sm font-mono text-slate-900 dark:text-white">
                        {hnd.pendingSamplesCount} {language === 'bn' ? 'টি নমুনা' : 'tubes'}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">{language === 'bn' ? 'জরুরি আন-ডেলিভার্ড রিপোর্ট' : 'Urgent Reports'}</span>
                      <strong className="text-sm font-mono text-rose-600">
                        {hnd.urgentReportsCount} {language === 'bn' ? 'টি রিপোর্ট' : 'reports'}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">{language === 'bn' ? 'মেশিন ও রিএজেন্ট স্থিতি' : 'Reagent Status'}</span>
                      <span className="text-[11px] font-semibold text-emerald-600 truncate block">
                        {hnd.reagentEquipmentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                    <div>
                      {language === 'bn' ? 'দায়িত্ব হস্তান্তরকারী (Outgoing):' : 'Handed over by:'}{' '}
                      <strong className="text-slate-800 dark:text-slate-200">{hnd.outgoingStaffName}</strong>
                    </div>

                    <div>
                      {language === 'bn' ? 'দায়িত্ব গ্রহণকারী (Incoming):' : 'Received by:'}{' '}
                      <strong className="text-slate-800 dark:text-slate-200">{hnd.incomingStaffName}</strong>
                      {hnd.acknowledgedAt && (
                        <span className="text-emerald-600 ml-1">
                          ({new Date(hnd.acknowledgedAt).toLocaleTimeString()})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DIRECTIVES & SOPs */}
      {activeTab === 'directives' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {language === 'bn' ? 'সকল স্টাফদের নির্দেশনা ও সার্কুলার নোটিশবোর্ড' : 'Staff Directives & Circulars Noticeboard'}
                </h3>
                <span className="text-[11px] text-slate-400">
                  {language === 'bn'
                    ? 'মালিক ও অ্যাডমিন কর্তৃক প্রকাশিত প্রোটোকল, এসওপি এবং কর্মীদের গ্রহণ ও সম্মতি ট্র্যাকিং'
                    : 'Mandatory clinical SOPs, administrative circulars, and staff acknowledgment records'}
                </span>
              </div>
              <button
                onClick={() => setShowAddDirectiveModal(true)}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{language === 'bn' ? 'নতুন নির্দেশনা জারি' : 'Issue Directive'}</span>
              </button>
            </div>

            <div className="space-y-3.5">
              {directivesList.map((dir) => {
                const isAckedByMe = user?.name ? dir.acknowledgedBy.includes(user.name) : false;
                return (
                  <div
                    key={dir.id}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-xs space-y-3 shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-black ${
                            dir.priority === 'Emergency'
                              ? 'bg-rose-600 text-white'
                              : dir.priority === 'High'
                              ? 'bg-amber-500 text-white'
                              : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {dir.category}
                        </span>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">{dir.title}</h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isAckedByMe ? (
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'পড়া সম্পন্ন' : 'Read & Acknowledged'}</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAcknowledgeDirective(dir.id)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition"
                          >
                            {language === 'bn' ? 'পড়েছি ও বুঝেছি (Acknowledge)' : 'Acknowledge Notice'}
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      {dir.content}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                      <div>
                        {language === 'bn' ? 'জারি করেছেন:' : 'Issued by:'}{' '}
                        <strong className="text-slate-700 dark:text-slate-300">{dir.issuedBy}</strong>
                        <span className="ml-2">({dir.createdAt?.split('T')[0]})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span>
                          {language === 'bn' ? 'সম্মতি জানিয়েছেন:' : 'Acknowledged by:'}{' '}
                          <strong className="text-indigo-600 font-bold">{dir.acknowledgmentCount} {language === 'bn' ? 'জন কর্মী' : 'staff'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {language === 'bn' ? 'দৈনিক উপস্থিতি ও বায়োমেট্রিক হাজিরা লগ' : 'Daily Attendance Log'}
              </h3>
              <span className="text-[11px] text-slate-400">
                {language === 'bn'
                  ? 'আজকের উপস্থিতি, প্রবেশের সময় এবং শিফট ট্র্যাকিং'
                  : "Today's check-in status across clinical shifts"}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="py-2.5 px-3">Employee Name</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Check-In Time</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Quick Mark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employeesList.map((emp) => {
                  const att = attendanceList.find((a) => a.employeeId === emp.id);
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{emp.name}</td>
                      <td className="py-2.5 px-3 text-slate-500">{emp.department}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {att?.checkIn || '08:00 AM'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {att?.status || 'Present'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1">
                        <button
                          onClick={() => handleMarkAttendance(emp, 'Present')}
                          className="px-2.5 py-1 rounded bg-teal-50 text-teal-700 hover:bg-teal-100 text-[11px] font-bold"
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleMarkAttendance(emp, 'On Leave')}
                          className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 text-[11px]"
                        >
                          Leave
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD HANDOVER */}
      {showAddHandoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-rose-600" />
                <span>{language === 'bn' ? 'জরুরি শিফট হ্যান্ডওভার এন্ট্রি' : 'Log Emergency Shift Handover'}</span>
              </h3>
              <button
                onClick={() => setShowAddHandoverModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHandover} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'বর্তমান শিফট (From)' : 'Current Shift'}
                  </label>
                  <select
                    value={handoverFormData.fromShift}
                    onChange={(e) => setHandoverFormData({ ...handoverFormData, fromShift: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Morning Shift (08:00 - 14:00)">Morning (08:00 - 14:00)</option>
                    <option value="Evening Shift (14:00 - 20:00)">Evening (14:00 - 20:00)</option>
                    <option value="Night Shift (20:00 - 08:00)">Night (20:00 - 08:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'পরবর্তী শিফট (To)' : 'Next Shift'}
                  </label>
                  <select
                    value={handoverFormData.toShift}
                    onChange={(e) => setHandoverFormData({ ...handoverFormData, toShift: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Evening Shift (14:00 - 20:00)">Evening (14:00 - 20:00)</option>
                    <option value="Night Shift (20:00 - 08:00)">Night (20:00 - 08:00)</option>
                    <option value="Morning Shift (08:00 - 14:00)">Morning (08:00 - 14:00)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'হস্তান্তরকারী কর্মী (Outgoing)' : 'Outgoing Technologist'}
                  </label>
                  <input
                    type="text"
                    required
                    value={handoverFormData.outgoingStaffName}
                    onChange={(e) => setHandoverFormData({ ...handoverFormData, outgoingStaffName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'দায়িত্ব গ্রহণকারী কর্মী (Incoming)' : 'Incoming Technologist'}
                  </label>
                  <input
                    type="text"
                    required
                    value={handoverFormData.incomingStaffName}
                    onChange={(e) => setHandoverFormData({ ...handoverFormData, incomingStaffName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-rose-600 mb-1">
                  {language === 'bn' ? 'জরুরি সার্ভিস ও ক্রিটিক্যাল কেস বিবরণ *' : 'Critical Patient & Emergency Notes *'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={handoverFormData.criticalPatientsNotes}
                  onChange={(e) => setHandoverFormData({ ...handoverFormData, criticalPatientsNotes: e.target.value })}
                  placeholder={
                    language === 'bn'
                      ? 'যেমন: ডেঙ্গু প্লাটিলেট ১৮,০০০ রুগীর পরবর্তী স্যাম্পল ৫টায় নিতে হবে, ট্রপোনিন-আই প্যানিক হাই কেস...'
                      : 'e.g. Dengue Platelet 18,000 follow-up sample needed at 5 PM, Troponin-I panic case...'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'পেন্ডিং নমুনা সংখ্যা' : 'Pending Samples Count'}
                  </label>
                  <input
                    type="number"
                    value={handoverFormData.pendingSamplesCount}
                    onChange={(e) => setHandoverFormData({ ...handoverFormData, pendingSamplesCount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'জরুরি আন-ডেলিভার্ড রিপোর্ট' : 'Urgent Reports Count'}
                  </label>
                  <input
                    type="number"
                    value={handoverFormData.urgentReportsCount}
                    onChange={(e) => setHandoverFormData({ ...handoverFormData, urgentReportsCount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'মেশিন ও রিএজেন্ট স্থিতি' : 'Reagent & Equipment Calibration'}
                </label>
                <input
                  type="text"
                  value={handoverFormData.reagentEquipmentStatus}
                  onChange={(e) => setHandoverFormData({ ...handoverFormData, reagentEquipmentStatus: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddHandoverModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md transition"
                >
                  {language === 'bn' ? 'হ্যান্ডওভার রেজিস্টার করুন' : 'Submit Handover'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TASK */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'bn' ? 'স্টাফ টাস্ক এসাইন করুন' : 'Assign Staff Task'}
              </h3>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'কাজের শিরোনাম *' : 'Task Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={taskFormData.title}
                  onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                  placeholder="e.g. 5-Part Hematology 2-Point Daily Calibration"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'দায়িত্বপ্রাপ্ত কর্মী *' : 'Assignee *'}
                  </label>
                  <select
                    value={taskFormData.employeeName}
                    onChange={(e) => setTaskFormData({ ...taskFormData, employeeName: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="">Select Employee...</option>
                    {employeesList.map((e) => (
                      <option key={e.id} value={e.name}>
                        {e.name} ({e.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'অগ্রাধিকার (Priority)' : 'Priority'}
                  </label>
                  <select
                    value={taskFormData.priority}
                    onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Urgent / STAT">Urgent / STAT</option>
                    <option value="High">High</option>
                    <option value="Normal">Normal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'কাজের বিস্তারিত বিবরণ' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={taskFormData.description}
                  onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isRemoteTask"
                  checked={taskFormData.isRemote}
                  onChange={(e) => setTaskFormData({ ...taskFormData, isRemote: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <label htmlFor="isRemoteTask" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  {language === 'bn' ? 'রিমোট ওয়ার্কস্টেশন কাজ (Remote Task)' : 'Remote Workstation Task'}
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md transition"
                >
                  {language === 'bn' ? 'টাস্ক এসাইন করুন' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD DIRECTIVE */}
      {showAddDirectiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'bn' ? 'নতুন নির্দেশনা জারি করুন' : 'Issue Directives / Circular'}
              </h3>
              <button
                onClick={() => setShowAddDirectiveModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDirective} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'নির্দেশনার শিরোনাম *' : 'Directive Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={directiveFormData.title}
                  onChange={(e) => setDirectiveFormData({ ...directiveFormData, title: e.target.value })}
                  placeholder="যেমন: জরুরি ডেঙ্গু সিবিসি টেস্ট প্রোটোকল..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                </label>
                <select
                  value={directiveFormData.category}
                  onChange={(e) => setDirectiveFormData({ ...directiveFormData, category: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Urgent Directive">Urgent Directive</option>
                  <option value="Clinical Protocol">Clinical Protocol</option>
                  <option value="Administrative SOP">Administrative SOP</option>
                  <option value="General Circular">General Circular</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'নির্দেশনার বিস্তারিত বিবরণ *' : 'Directive Content *'}
                </label>
                <textarea
                  rows={4}
                  required
                  value={directiveFormData.content}
                  onChange={(e) => setDirectiveFormData({ ...directiveFormData, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'টার্গেট কর্মী / রোলসমূহ' : 'Target Roles'}
                </label>
                <input
                  type="text"
                  value={directiveFormData.targetRoles}
                  onChange={(e) => setDirectiveFormData({ ...directiveFormData, targetRoles: e.target.value })}
                  placeholder="Lab Technician, Report Approver, Receptionist"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddDirectiveModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md transition"
                >
                  {language === 'bn' ? 'নির্দেশনা জারি করুন' : 'Broadcast Directive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
