import { MockNotification, LabReport, Invoice } from '../types/index.ts';

const NOTIFICATIONS_STORAGE_KEY = 'sdc_mock_notifications_v1';

// Seed initial realistic notification history for demonstration
const INITIAL_NOTIFICATIONS: MockNotification[] = [
  {
    id: 'NOTIF-261108-001',
    patientId: 'SDC-P-202611-0001',
    patientName: 'Md. Rafiqul Islam',
    patientPhone: '+8801712345678',
    patientEmail: 'rafiqul.islam@gmail.com',
    type: 'Both',
    triggerEvent: 'Report Approved',
    referenceId: 'REP-261107-0001-1',
    testName: 'Complete Blood Count (CBC with ESR)',
    status: 'Delivered',
    sentAt: new Date(Date.now() - 3600000).toISOString(),
    messageContent:
      'সোনালী ডায়াগনস্টিক সেন্টার: প্রিয় Md. Rafiqul Islam, আপনার Complete Blood Count (CBC with ESR) রিপোর্ট প্রস্তুত হয়েছে (ID: REP-261107-0001-1)। অনলাইন ভিউ: https://sonali.diag/r/REP-261107-0001-1। হেল্পলাইন: 01712-345678',
    emailSubject:
      'Medical Diagnostic Report Ready: Complete Blood Count - Sonali Diagnostic Center',
    emailBodyHtml:
      '<p>Dear Md. Rafiqul Islam,</p><p>Your lab test results for <strong>Complete Blood Count (CBC with ESR)</strong> have been verified and approved by Dr. Md. Tariqul Islam (Consultant Pathologist).</p><p>You can collect your physical report from our counter or download the certified copy online.</p>',
  },
  {
    id: 'NOTIF-261108-002',
    patientId: 'SDC-P-202611-0002',
    patientName: 'Mrs. Salma Begum',
    patientPhone: '+8801819998877',
    patientEmail: 'salma.family@yahoo.com',
    type: 'Both',
    triggerEvent: 'Critical Panic Alert',
    referenceId: 'REP-261106-0014',
    testName: 'Cardiac Markers (Troponin-I High Sensitivity)',
    status: 'Delivered',
    sentAt: new Date(Date.now() - 7200000).toISOString(),
    messageContent:
      'জরুরি এলার্ট: সোনালী ডায়াগনস্টিক সেন্টার। প্রিয় Mrs. Salma Begum, আপনার ট্রপোনিন-আই টেস্ট রিপোর্ট প্রস্তুত এবং এতে বিশেষ পর্যবেক্ষণ রয়েছে। অনুগ্রহ করে দ্রুত আপনার চিকিৎসকের সাথে যোগাযোগ করুন। হেল্পলাইন: 01712-345678',
    emailSubject:
      'URGENT CLINICAL ALERT: Cardiac Marker Report Ready - Sonali Diagnostic Center',
  },
  {
    id: 'NOTIF-261108-003',
    patientId: 'SDC-P-202611-0003',
    patientName: 'Dr. Shahabuddin Ahmed',
    patientPhone: '+8801911223344',
    patientEmail: 'shahab.dr@gmail.com',
    type: 'SMS',
    triggerEvent: 'Bill Issued',
    referenceId: 'INV-261107-0003',
    testName: 'Lipid Profile & HbA1c',
    status: 'Delivered',
    sentAt: new Date(Date.now() - 14400000).toISOString(),
    messageContent:
      'Sonali Diagnostic Center: Money Receipt INV-261107-0003 for BDT 1,800.00 received. Estimated report delivery today at 6:00 PM. Hotline: 01712-345678',
  },
];

class NotificationService {
  private notifications: MockNotification[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (raw) {
        this.notifications = JSON.parse(raw);
      } else {
        this.notifications = [...INITIAL_NOTIFICATIONS];
        this.saveToStorage();
      }
    } catch (e) {
      this.notifications = [...INITIAL_NOTIFICATIONS];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(this.notifications.slice(0, 100))
      );
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  public getNotifications(): MockNotification[] {
    return [...this.notifications];
  }

  /**
   * Primary method: Trigger simulated SMS and Email when a lab report is generated or updated
   */
  public triggerReportNotification(
    report: Omit<Partial<LabReport>, 'status'> & {
      reportNumber: string;
      patientName: string;
      testName: string;
      patientPhone?: string;
      patientEmail?: string;
      status?: string;
      abnormalFlag?: boolean;
    },
    triggerType: 'Lab Report Generated' | 'Report Approved' = 'Lab Report Generated'
  ): MockNotification {
    const phone =
      report.patientPhone ||
      (report as any).phone ||
      '+88017' + Math.floor(10000000 + Math.random() * 90000000);
    const email =
      report.patientEmail ||
      `${report.patientName.toLowerCase().replace(/[^a-z]/g, '')}@gmail.com`;

    const isUrgent = report.abnormalFlag;

    const smsText = isUrgent
      ? `সোনালী ডায়াগনস্টিক সেন্টার (জরুরি): প্রিয় ${report.patientName}, আপনার ${report.testName} টেস্ট রিপোর্ট (${report.reportNumber}) প্রস্তুত হয়েছে। জরুরি পর্যবেক্ষণ থাকায় অনতিবিলম্বে বিশেষজ্ঞ চিকিৎসকের পরামর্শ নিন। অনলাইন রিপোর্ট: https://sonalidiag.com/verify/${report.reportNumber}। হটলাইন: 01712-345678`
      : `সোনালী ডায়াগনস্টিক সেন্টার: প্রিয় ${report.patientName}, আপনার ${report.testName} টেস্ট রিপোর্ট প্রস্তুত হয়েছে (ID: ${report.reportNumber})। কাউন্টার থেকে সংগ্রহ করুন অথবা অনলাইন রিপোর্ট দেখতে ভিজিট করুন: https://sonalidiag.com/verify/${report.reportNumber}। হেল্পলাইন: 01712-345678`;

    const emailSubject = isUrgent
      ? `[URGENT ATTENTION] Lab Report Ready: ${report.testName} - Sonali Diagnostic Center`
      : `Diagnostic Lab Report Available: ${report.testName} (ID: ${report.reportNumber})`;

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0f2744; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px; color: #2dd4bf;">SONALI DIAGNOSTIC CENTER</h2>
          <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.85;">Quality Healthcare • Trusted Diagnostic Services</p>
        </div>
        <div style="padding: 24px; color: #1e293b;">
          <p style="font-size: 15px; margin-top: 0;">Dear <strong>${report.patientName}</strong>,</p>
          <p>We are pleased to inform you that your laboratory investigation results are now ready:</p>
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Test Name:</strong> ${report.testName}</p>
            <p style="margin: 4px 0;"><strong>Report Number:</strong> ${report.reportNumber}</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> ${report.status || 'Ready for Delivery'}</p>
            <p style="margin: 4px 0;"><strong>Verification Code:</strong> SDC-VERIFY-${report.reportNumber}</p>
          </div>
          ${
            isUrgent
              ? '<p style="color: #dc2626; font-weight: bold; background: #fef2f2; padding: 8px 12px; border-radius: 6px;">Note: One or more parameters require medical attention. Please consult your physician promptly.</p>'
              : ''
          }
          <div style="text-align: center; margin: 24px 0;">
            <a href="https://sonalidiag.com/verify/${report.reportNumber}" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View & Download Certified PDF</a>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Sonali Diagnostic Center, Hospital Road. 24/7 Hotline: 01712-345678</p>
        </div>
      </div>
    `;

    const newNotif: MockNotification = {
      id: `NOTIF-${Date.now().toString().slice(-6)}`,
      patientId: report.patientId || 'SDC-P-AUTO',
      patientName: report.patientName,
      patientPhone: phone,
      patientEmail: email,
      type: 'Both',
      triggerEvent: triggerType,
      referenceId: report.reportNumber,
      testName: report.testName,
      status: 'Delivered',
      sentAt: new Date().toISOString(),
      messageContent: smsText,
      emailSubject,
      emailBodyHtml: emailHtml,
    };

    this.notifications.unshift(newNotif);
    this.saveToStorage();

    // Dispatch global event for live sound/visual alert
    window.dispatchEvent(
      new CustomEvent('sdc_notification_sent', {
        detail: newNotif,
      })
    );

    return newNotif;
  }

  /**
   * Trigger simulated SMS when billing receipt is generated
   */
  public triggerBillingNotification(
    invoice: Invoice,
    testsSummary: string
  ): MockNotification {
    const sms = `সোনালী ডায়াগনস্টিক সেন্টার: মানি রিসিট ${invoice.invoiceNumber}। টেস্ট: ${testsSummary}। মোট বিল: ৳${invoice.total}, পরিশোধিত: ৳${invoice.paidAmount}, বকেয়া: ৳${invoice.dueAmount}। আনুমানিক রিপোর্ট সময়: আজ সন্ধ্যা ৬:০০ টা। ধন্যবাদ! হেল্পলাইন: 01712-345678`;

    const newNotif: MockNotification = {
      id: `NOTIF-${Date.now().toString().slice(-6)}`,
      patientId: invoice.patientId,
      patientName: invoice.patientName,
      patientPhone: invoice.patientPhone,
      type: 'SMS',
      triggerEvent: 'Bill Issued',
      referenceId: invoice.invoiceNumber,
      testName: testsSummary,
      status: 'Delivered',
      sentAt: new Date().toISOString(),
      messageContent: sms,
    };

    this.notifications.unshift(newNotif);
    this.saveToStorage();

    window.dispatchEvent(
      new CustomEvent('sdc_notification_sent', {
        detail: newNotif,
      })
    );

    return newNotif;
  }

  /**
   * Resend / Manual notification
   */
  public sendManualAlert(
    patientName: string,
    phone: string,
    message: string,
    type: 'SMS' | 'Email' = 'SMS',
    referenceId: string = 'MANUAL'
  ): MockNotification {
    const newNotif: MockNotification = {
      id: `NOTIF-${Date.now().toString().slice(-6)}`,
      patientId: 'SDC-P-MANUAL',
      patientName,
      patientPhone: phone,
      type,
      triggerEvent: 'Lab Report Generated',
      referenceId,
      status: 'Delivered',
      sentAt: new Date().toISOString(),
      messageContent: message,
    };

    this.notifications.unshift(newNotif);
    this.saveToStorage();

    window.dispatchEvent(
      new CustomEvent('sdc_notification_sent', {
        detail: newNotif,
      })
    );

    return newNotif;
  }
}

export const notificationService = new NotificationService();
