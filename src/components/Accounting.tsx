import React, { useState, useEffect } from 'react';
import {
  WalletCards,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  FileSpreadsheet,
  CheckCircle,
  Building,
  CreditCard,
  PieChart,
  Edit3,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Expense } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export const Accounting: React.FC = () => {
  const { language, t } = useLanguage();
  const { token, user, canAccessFinancials } = useAuth();
  const [expensesList, setExpensesList] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Super Admin Edit Expense State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editExpenseData, setEditExpenseData] = useState({
    category: 'Lab Reagents',
    title: '',
    amount: '',
    paymentMethod: 'Cash',
    receiptNo: '',
    notes: '',
  });

  // New Expense Form
  const [expenseData, setExpenseData] = useState({
    category: 'Lab Reagents',
    title: '',
    amount: '',
    paymentMethod: 'Cash',
    receiptNo: '',
    notes: '',
  });

  useEffect(() => {
    fetchExpenses();
  }, [token]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/accounting/expenses', {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (res.ok) {
        const json = await res.json();
        setExpensesList(json);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseData.title || !expenseData.amount) return;

    try {
      const res = await fetch('/api/accounting/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify(expenseData),
      });

      if (res.ok) {
        setShowExpenseModal(false);
        setExpenseData({
          category: 'Lab Reagents',
          title: '',
          amount: '',
          paymentMethod: 'Cash',
          receiptNo: '',
          notes: '',
        });
        fetchExpenses();
      }
    } catch (err) {
      console.error('Error recording expense:', err);
    }
  };

  const handleStartEditExpense = (exp: Expense) => {
    setEditingExpense(exp);
    setEditExpenseData({
      category: exp.category,
      title: exp.title,
      amount: exp.amount,
      paymentMethod: exp.paymentMethod,
      receiptNo: exp.receiptNo || '',
      notes: exp.notes || '',
    });
  };

  const handleSaveEditedExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !editExpenseData.title || !editExpenseData.amount) return;

    try {
      const res = await fetch(`/api/accounting/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify(editExpenseData),
      });

      if (res.ok) {
        setEditingExpense(null);
        fetchExpenses();
      }
    } catch (err) {
      console.error('Error correcting expense voucher:', err);
    }
  };

  const totalExpenses = expensesList.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Diagnostic Accounts, Ledger & Expense Vouchers
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Strict separation of billed receivables vs. actual cash collected, daily closing, and profit & loss
          </p>
        </div>

        <button
          onClick={() => setShowExpenseModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record Expense Voucher</span>
        </button>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Monthly Cash Inflow</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ৳546,800.00
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Realized collections through Cash & MFS</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Operational Outflow</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            ৳{totalExpenses.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Reagents, electricity, and clinic maintenance</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Cash Register & Banks</span>
            <Building className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            ৳357,800.00
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Counter Drawer: ৳45,200 • Bank: ৳312,600</div>
        </div>
      </div>

      {/* Expenses Voucher Ledger */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Authorized Expenses Ledger
            </h3>
            <span className="text-[11px] text-slate-400">{expensesList.length} recorded expense vouchers</span>
          </div>
          <button
            onClick={fetchExpenses}
            className="text-xs font-semibold text-teal-600 hover:underline"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Voucher Title</th>
                <th className="py-2.5 px-3">Expense Head</th>
                <th className="py-2.5 px-3">Receipt / Ref</th>
                <th className="py-2.5 px-3">Payment Mode</th>
                <th className="py-2.5 px-3">Approved By</th>
                <th className="py-2.5 px-3 text-right">Amount (BDT)</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {expensesList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                expensesList.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{exp.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      {exp.title}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{exp.receiptNo || '—'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{exp.paymentMethod}</td>
                    <td className="py-2.5 px-3 text-slate-600">{exp.approvedBy || 'Admin'}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                      - ৳{parseFloat(exp.amount).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleStartEditExpense(exp)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 dark:bg-slate-800 dark:hover:bg-teal-950 text-slate-700 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400 font-semibold text-[11px] inline-flex items-center gap-1 transition"
                        title="Super Admin: Edit and correct voucher details"
                      >
                        <Edit3 className="w-3 h-3 text-teal-600" />
                        <span>{language === 'bn' ? 'সংশোধন' : 'Edit'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              New Expense Voucher
            </h3>
            <p className="text-slate-500 mb-4">
              All expenses are logged into the permanent audit ledger
            </p>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Expense Category *
                </label>
                <select
                  value={expenseData.category}
                  onChange={(e) => setExpenseData({ ...expenseData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Lab Reagents">Lab Reagents & Controls</option>
                  <option value="Electricity">Electricity & Generator Diesel</option>
                  <option value="Center Rent">Premises Rent</option>
                  <option value="Maintenance">Bio-medical Equipment Maintenance</option>
                  <option value="Office Supplies">Thermal Rolls & Office Stationery</option>
                  <option value="Staff Welfare">Staff Refreshments & Welfare</option>
                  <option value="Marketing">Authorized Marketing Expenses</option>
                  <option value="Doctor Payment">Doctor Honorarium / Chamber</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Title *
                </label>
                <input
                  type="text"
                  required
                  value={expenseData.title}
                  onChange={(e) => setExpenseData({ ...expenseData, title: e.target.value })}
                  placeholder="e.g. Sysmex CBC Reagent Pack 20L"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Amount (BDT) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={expenseData.amount}
                    onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                    placeholder="12000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={expenseData.paymentMethod}
                    onChange={(e) => setExpenseData({ ...expenseData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Cash">Cash Drawer</option>
                    <option value="Bank">Bank Cheque / EFT</option>
                    <option value="bKash">bKash Merchant</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Receipt / Memo #
                </label>
                <input
                  type="text"
                  value={expenseData.receiptNo}
                  onChange={(e) => setExpenseData({ ...expenseData, receiptNo: e.target.value })}
                  placeholder="e.g. MEMO-8841"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Save Expense Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPER ADMIN EDIT & CORRECT EXPENSE MODAL */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {language === 'bn' ? 'ভাউচার সংশোধন ও এডিট' : 'Edit & Correct Expense Voucher'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === 'bn' ? 'সুপার অ্যাডমিন কর্তৃক ভুল তথ্য সংশোধনের ব্যবস্থা' : 'Super Admin Voucher Audit Correction'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingExpense(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedExpense} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'খরচের খাত / ক্যাটাগরি *' : 'Expense Category *'}
                </label>
                <select
                  value={editExpenseData.category}
                  onChange={(e) => setEditExpenseData({ ...editExpenseData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Lab Reagents">Lab Reagents & Controls</option>
                  <option value="Electricity">Electricity & Generator Diesel</option>
                  <option value="Center Rent">Premises Rent</option>
                  <option value="Maintenance">Bio-medical Equipment Maintenance</option>
                  <option value="Office Supplies">Thermal Rolls & Office Stationery</option>
                  <option value="Staff Welfare">Staff Refreshments & Welfare</option>
                  <option value="Marketing">Authorized Marketing Expenses</option>
                  <option value="Doctor Payment">Doctor Honorarium / Chamber</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'ভাউচার বিবরণ / শিরোনাম *' : 'Voucher Title / Description *'}
                </label>
                <input
                  type="text"
                  required
                  value={editExpenseData.title}
                  onChange={(e) => setEditExpenseData({ ...editExpenseData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'টাকার পরিমাণ (BDT) *' : 'Amount (BDT) *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editExpenseData.amount}
                    onChange={(e) => setEditExpenseData({ ...editExpenseData, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'পেমেন্ট মেথড' : 'Payment Mode'}
                  </label>
                  <select
                    value={editExpenseData.paymentMethod}
                    onChange={(e) => setEditExpenseData({ ...editExpenseData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Cash">Cash Drawer</option>
                    <option value="Bank">Bank Cheque / EFT</option>
                    <option value="bKash">bKash Merchant</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'রসিদ / মেমো নম্বর' : 'Receipt / Ref Memo #'}
                </label>
                <input
                  type="text"
                  value={editExpenseData.receiptNo}
                  onChange={(e) => setEditExpenseData({ ...editExpenseData, receiptNo: e.target.value })}
                  placeholder="e.g. MEMO-9912"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'সংশোধনের কারণ / নোট' : 'Correction Reason / Notes'}
                </label>
                <input
                  type="text"
                  value={editExpenseData.notes}
                  onChange={(e) => setEditExpenseData({ ...editExpenseData, notes: e.target.value })}
                  placeholder="e.g. Corrected voucher amount and invoice reference"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md transition"
                >
                  {language === 'bn' ? 'সংশোধন সংরক্ষণ করুন' : 'Save Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
