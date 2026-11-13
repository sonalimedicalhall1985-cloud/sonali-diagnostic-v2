import React, { useState } from 'react';
import { X, Printer, Receipt, FileText, Copy, Scissors } from 'lucide-react';
import { Invoice, InvoiceItem, PaymentRecord } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface PrintInvoiceModalProps {
  invoice: Invoice | null;
  items: InvoiceItem[];
  payments: PaymentRecord[];
  onClose: () => void;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  invoice,
  items,
  payments,
  onClose,
}) => {
  const { language } = useLanguage();
  // Default to Dual Half-Page (Customer Copy + Lab Copy on 1 sheet) as requested by user
  const [printFormat, setPrintFormat] = useState<'dual' | 'A4' | 'POS'>('dual');

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  // Reusable component for rendering one half-page copy
  const renderMemoHalf = (copyType: 'CUSTOMER' | 'LAB') => (
    <div className="border border-slate-300 p-3.5 rounded-lg bg-white text-slate-900 font-sans text-xs flex flex-col justify-between min-h-[460px] md:h-[490px] print:h-[136mm] print:max-h-[136mm] print:p-2.5 print:text-[10px] print:border-slate-400 overflow-hidden">
      <div>
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-900 pb-2 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-[#0f2744] flex items-center justify-center text-teal-400 font-black text-base shadow-xs">
              SDC
            </div>
            <div>
              <h2 className="text-base font-black text-[#0f2744] tracking-tight leading-none">
                SONALI DIAGNOSTIC CENTER
              </h2>
              <p className="text-[10px] font-bold text-teal-700 leading-tight">
                সোনালী ডায়াগনস্টিক সেন্টার • Quality Healthcare • Trusted Diagnostics
              </p>
              <p className="text-[9px] text-slate-500">
                Hospital Road, Dhaka | Helpline: +880 1711-000000
              </p>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-block px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider rounded border ${
                copyType === 'CUSTOMER'
                  ? 'bg-blue-50 text-blue-900 border-blue-300'
                  : 'bg-amber-50 text-amber-900 border-amber-300'
              }`}
            >
              {copyType === 'CUSTOMER' ? '★ কাস্টমার কপি / CUSTOMER COPY' : '🧪 ল্যাব ও অফিস কপি / LAB COPY'}
            </span>
            <div className="mt-1 font-mono font-bold text-xs text-[#0f2744]">
              {invoice.invoiceNumber}
            </div>
            <div className="text-[9px] text-slate-500">
              Date: {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : 'Today'}
            </div>
          </div>
        </div>

        {/* Patient & Doctor Meta */}
        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded border border-slate-200 text-[11px] mb-2">
          <div>
            <div>
              <span className="text-slate-500">Patient: </span>
              <strong className="text-slate-900">{invoice.patientName}</strong>
              <span className="text-slate-600"> ({invoice.patientAge || '—'}Y / {invoice.patientGender || '—'})</span>
            </div>
            <div>
              <span className="text-slate-500">ID: </span>
              <span className="font-mono text-slate-700">{invoice.patientId}</span>
              <span className="text-slate-500 ml-2">Phone: </span>
              <span className="font-mono text-slate-700">{invoice.patientPhone}</span>
            </div>
          </div>
          <div>
            <div>
              <span className="text-slate-500">Ref Doctor: </span>
              <strong className="text-slate-900">{invoice.referringDoctor || 'Self / General'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Status: </span>
              <strong
                className={
                  invoice.paymentStatus === 'Paid' ? 'text-emerald-700' : 'text-rose-700'
                }
              >
                {invoice.paymentStatus.toUpperCase()}
              </strong>
              <span className="text-slate-500 ml-2">Mode: </span>
              <span className="text-slate-700">{invoice.paymentMethod}</span>
            </div>
          </div>
        </div>

        {/* Tests Table */}
        <table className="w-full text-[11px] text-left border-collapse mb-2">
          <thead>
            <tr className="bg-[#0f2744] text-white">
              <th className="py-1 px-2 rounded-l">SL</th>
              <th className="py-1 px-2">Code</th>
              <th className="py-1 px-2">Investigation Description</th>
              <th className="py-1 px-2">Department / Specimen</th>
              <th className="py-1 px-2 text-right rounded-r">BDT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="py-1 px-2 text-slate-500">{idx + 1}</td>
                <td className="py-1 px-2 font-mono font-bold text-slate-700">{item.testCode}</td>
                <td className="py-1 px-2 font-medium text-slate-900">{item.testName}</td>
                <td className="py-1 px-2 text-slate-600">{item.category}</td>
                <td className="py-1 px-2 text-right font-bold text-slate-900">
                  {parseFloat(item.price).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Financials & Signatures */}
      <div>
        <div className="flex justify-between items-end border-t border-slate-200 pt-1.5 text-[11px] mb-2">
          <div className="text-[10px] text-slate-500 space-y-0.5">
            {copyType === 'CUSTOMER' ? (
              <p>* রসিদ প্রদর্শন সাপেক্ষে রিপোর্ট প্রদান করা হবে। সময়মতো রিপোর্ট সংগ্রহ করুন।</p>
            ) : (
              <p>🧪 ল্যাব নির্দেশ: নমুনা সংগ্রহের সময় পেশেন্ট বারকোড ও ভায়াল চেক করুন।</p>
            )}
            <p>Billed by: {invoice.createdByName || 'Reception'} | Sonali Diagnostic ERP</p>
          </div>

          <div className="w-56 space-y-0.5 text-right font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>৳{parseFloat(invoice.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Discount:</span>
              <span className="text-emerald-700">-৳{parseFloat(invoice.discountValue).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-0.5">
              <span>Net Total:</span>
              <span className="text-[#0f2744]">৳{parseFloat(invoice.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Paid:</span>
              <span>৳{parseFloat(invoice.paidAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-slate-200 pt-0.5">
              <span>Due:</span>
              <span className={parseFloat(invoice.dueAmount) > 0 ? 'text-rose-600' : 'text-slate-600'}>
                ৳{parseFloat(invoice.dueAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="flex justify-between items-end pt-3 text-center text-[10px] text-slate-500 border-t border-slate-100">
          <div>
            <div className="w-28 border-t border-slate-400 mb-0.5"></div>
            <span>Prepared By</span>
          </div>
          <div className="font-mono text-[9px] text-slate-400">
            {copyType === 'CUSTOMER' ? 'SDC-CUSTOMER-COPY' : 'SDC-LAB-WORK-ORDER'}
          </div>
          <div>
            <div className="w-28 border-t border-slate-400 mb-0.5"></div>
            <span>Cashier / Authorized</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto print:block">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 print:my-0 print:border-none print:shadow-none print:w-full print:max-w-none">
        {/* Modal Controls - Hidden during print */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 print:hidden bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">ফরম্যাট নির্বাচন:</span>
            <button
              onClick={() => setPrintFormat('dual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                printFormat === 'dual'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Copy className="w-3.5 h-3.5" /> একসাথে দুই কপি (কাস্টমার + ল্যাব কপি)
            </button>
            <button
              onClick={() => setPrintFormat('A4')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                printFormat === 'A4'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> ফুল A4 ইনভয়েস
            </button>
            <button
              onClick={() => setPrintFormat('POS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                printFormat === 'POS'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" /> ৮০ মিমি থার্মাল রসিদ
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition"
            >
              <Printer className="w-4 h-4" /> {language === 'bn' ? 'প্রিন্ট দিন' : 'Print Document'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE CONTAINER */}
        <div className="p-6 print:p-0">
          {printFormat === 'dual' ? (
            /* DUAL COPY ON SINGLE A4 SHEET (TOP: CUSTOMER COPY, BOTTOM: LAB COPY) */
            <div className="max-w-[800px] mx-auto bg-white p-4 space-y-4 print:space-y-4 print:p-0">
              {/* Top Half: Customer Copy */}
              {renderMemoHalf('CUSTOMER')}

              {/* Perforation / Tear-off cut line */}
              <div className="relative flex items-center justify-center my-2 select-none">
                <div className="border-t-2 border-dashed border-slate-400 w-full"></div>
                <div className="absolute px-3 bg-white text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 border border-slate-300 rounded-full py-0.5">
                  <Scissors className="w-3 h-3 text-slate-600" />
                  <span>কাটুন / TEAR HERE (ল্যাব ও কাস্টমার কপি পৃথক করুন)</span>
                </div>
              </div>

              {/* Bottom Half: Lab / Office Copy */}
              {renderMemoHalf('LAB')}
            </div>
          ) : printFormat === 'A4' ? (
            /* SINGLE FULL A4 FORMAT */
            <div className="max-w-[800px] mx-auto bg-white text-slate-900 p-8 border border-slate-200 shadow-sm print:border-none print:shadow-none font-sans">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#0f2744] flex items-center justify-center text-teal-400 font-bold text-2xl shadow">
                    SDC
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-[#0f2744] tracking-tight">
                      SONALI DIAGNOSTIC CENTER
                    </h1>
                    <p className="text-xs font-semibold text-teal-700">
                      সোনালী ডায়াগনস্টিক সেন্টার • উন্নত স্বাস্থ্যসেবা • নির্ভরযোগ্য ডায়াগনস্টিক
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Hospital Road, Dhaka | Helpline: +880 1711-000000
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 font-bold text-xs uppercase tracking-wider rounded">
                    Money Receipt / Invoice
                  </span>
                  <div className="mt-2 text-xs font-mono font-bold text-[#0f2744]">
                    {invoice.invoiceNumber}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Date: {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : 'Today'}
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs mb-6">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Patient Details</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{invoice.patientName}</div>
                  <div className="text-slate-600">ID: <span className="font-mono font-medium">{invoice.patientId}</span></div>
                  <div className="text-slate-600">
                    Age/Gender: <span className="font-medium">{invoice.patientAge || '—'} Y / {invoice.patientGender || '—'}</span>
                  </div>
                  <div className="text-slate-600">Phone: <span className="font-medium">{invoice.patientPhone}</span></div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Referring Consultant</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{invoice.referringDoctor || 'Self / General'}</div>
                  <div className="text-slate-600 mt-2">Billed By: <span className="font-medium">{invoice.createdByName || 'Reception'}</span></div>
                  <div className="text-slate-600">
                    Status:{' '}
                    <span className={`font-bold ${invoice.paymentStatus === 'Paid' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {invoice.paymentStatus.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-xs text-left mb-6 border-collapse">
                <thead>
                  <tr className="bg-[#0f2744] text-white">
                    <th className="py-2.5 px-3 font-semibold rounded-l">SL</th>
                    <th className="py-2.5 px-3 font-semibold">Test Code</th>
                    <th className="py-2.5 px-3 font-semibold">Investigation Description</th>
                    <th className="py-2.5 px-3 font-semibold">Department</th>
                    <th className="py-2.5 px-3 font-semibold text-right rounded-r">Amount (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-700">{item.testCode}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{item.testName}</td>
                      <td className="py-2 px-3 text-slate-600">{item.category}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{parseFloat(item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Calculation */}
              <div className="flex justify-between items-start pt-2 border-t border-slate-200 mb-6 text-xs">
                <div className="w-1/2 pr-4">
                  <div className="text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Payment Mode:</span> {invoice.paymentMethod}
                  </div>
                  {invoice.notes && (
                    <div className="text-[11px] text-slate-500 mt-1">
                      <span className="font-semibold text-slate-700">Notes:</span> {invoice.notes}
                    </div>
                  )}
                </div>

                <div className="w-1/2 pl-4 space-y-1.5 text-right font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>BDT {parseFloat(invoice.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Discount:</span>
                    <span className="text-emerald-700">- BDT {parseFloat(invoice.discountValue).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-300 pt-1">
                    <span>Net Payable:</span>
                    <span className="text-[#0f2744]">BDT {parseFloat(invoice.total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-semibold">
                    <span>Paid Amount:</span>
                    <span className="text-emerald-700">BDT {parseFloat(invoice.paidAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1">
                    <span>Due Balance:</span>
                    <span className={parseFloat(invoice.dueAmount) > 0 ? 'text-rose-600' : 'text-slate-600'}>
                      BDT {parseFloat(invoice.dueAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="flex justify-between items-end pt-12 text-center text-xs text-slate-600">
                <div>
                  <div className="w-40 border-t border-slate-400 mb-1"></div>
                  <div>Prepared By / Receptionist</div>
                </div>
                <div>
                  <div className="w-40 border-t border-slate-400 mb-1"></div>
                  <div>Accountant / Cashier</div>
                </div>
              </div>
            </div>
          ) : (
            /* 80mm POS RECEIPT */
            <div className="max-w-[320px] mx-auto bg-white text-slate-900 p-4 border border-dashed border-slate-300 font-mono text-[11px] leading-tight print:border-none">
              <div className="text-center pb-2 border-b border-dashed border-slate-400">
                <div className="font-bold text-sm">SONALI DIAGNOSTIC CENTER</div>
                <div className="text-[10px]">সোনালী ডায়াগনস্টিক সেন্টার</div>
                <div className="text-[9px]">Hospital Road, Dhaka | Tel: 01711-000000</div>
                <div className="font-bold text-xs mt-1">CASH RECEIPT</div>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5">
                <div>Inv: {invoice.invoiceNumber}</div>
                <div>Date: {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : 'Today'}</div>
                <div>Pt: {invoice.patientName} ({invoice.patientAge}Y/{invoice.patientGender})</div>
                <div>Ref: {invoice.referringDoctor || 'Self'}</div>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400">
                <div className="flex justify-between font-bold pb-1">
                  <span>ITEM</span>
                  <span>BDT</span>
                </div>
                {items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate max-w-[200px]">{it.testCode}</span>
                    <span>{parseFloat(it.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-right">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{parseFloat(invoice.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>{parseFloat(invoice.discountValue).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{parseFloat(invoice.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid ({invoice.paymentMethod}):</span>
                  <span>{parseFloat(invoice.paidAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Due:</span>
                  <span>{parseFloat(invoice.dueAmount).toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center pt-2 text-[9px] text-slate-500">
                Thank you for choosing Sonali Diagnostic.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
