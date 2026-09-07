// src/services/emailService.js

// You can set this in your .env file as VITE_GAS_EMAIL_URL
// For now, if it's not set, we'll just log it so the app doesn't crash before you deploy it.
const GAS_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GAS_EMAIL_URL) || '';
const SYSTEM_URL = 'https://smetaltech26.github.io/leave-management-system/';

/**
 * Helper to build an Outlook-friendly HTML email container
 */
const buildOutlookEmailWrapper = ({
  title,
  titleColor = '#059669',
  greeting,
  leadText,
  rows = [],
  noteHtml = '',
  ctaText = '',
  buttonText = '',
  buttonUrl = SYSTEM_URL,
  theme = 'emerald'
}) => {
  const accentColor = theme === 'rose' ? '#ef4444' : '#059669';
  const boxBg = theme === 'rose' ? '#fef2f2' : '#f8fafc';
  const boxBorder = theme === 'rose' ? '#fecaca' : '#e2e8f0';
  const labelColor = theme === 'rose' ? '#991b1b' : '#475569';
  const valColor = theme === 'rose' ? '#991b1b' : '#0f172a';

  const rowsHtml = rows.map(r => `
    <tr>
      <td style="padding: 9px 12px 9px 0; width: 145px; color: ${labelColor}; font-family: 'Segoe UI', Tahoma, Arial, 'Sarabun', sans-serif; font-size: 15px; font-weight: bold; vertical-align: top; white-space: nowrap;">
        ${r.label}:
      </td>
      <td style="padding: 9px 0 9px 8px; color: ${valColor}; font-family: 'Segoe UI', Tahoma, Arial, 'Sarabun', sans-serif; font-size: 16px; font-weight: 600; line-height: 1.6; vertical-align: top;">
        ${r.value}
      </td>
    </tr>
  `).join('');

  const buttonHtml = buttonText ? `
    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 20px 0 8px 0;">
      <tr>
        <td align="center" bgcolor="#2563eb" style="border-radius: 8px; background-color: #2563eb; padding: 14px 32px;">
          <a href="${buttonUrl}" target="_blank" style="color: #ffffff; font-family: 'Segoe UI', Tahoma, Arial, 'Sarabun', sans-serif; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; line-height: 1.3;">
            ${buttonText}
          </a>
        </td>
      </tr>
    </table>
  ` : '';

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, th, p, a, span, h2, h3, strong, i {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif !important;
    }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Arial, 'Sarabun', sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; width: 100%;">
    <tr>
      <td align="center" style="padding: 28px 12px;">
        <!--[if mso]>
        <table role="presentation" width="620" align="center" border="0" cellspacing="0" cellpadding="0">
        <tr>
        <td>
        <![endif]-->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="height: 5px; background-color: ${accentColor}; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding: 32px 36px; font-family: 'Segoe UI', Tahoma, Arial, 'Sarabun', sans-serif;">
              <h2 style="margin: 0 0 18px 0; color: ${titleColor}; font-family: 'Segoe UI', Tahoma, Arial, 'Sarabun', sans-serif; font-size: 22px; font-weight: bold; line-height: 1.4;">
                ${title}
              </h2>
              <p style="margin: 0 0 12px 0; color: #0f172a; font-family: 'Segoe UI', Tahoma, Arial, 'Sarabun', sans-serif; font-size: 17px; font-weight: bold; line-height: 1.6;">
                ${greeting}
              </p>
              <p style="margin: 0 0 18px 0; color: #1e293b; font-family: 'Segoe UI', Tahoma, Arial, 'Sarabun', sans-serif; font-size: 16px; line-height: 1.65;">
                ${leadText}
              </p>
              
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${boxBg}; border: 1px solid ${boxBorder}; border-radius: 8px; margin: 0 0 20px 0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      ${rowsHtml}
                    </table>
                  </td>
                </tr>
              </table>

              ${noteHtml ? `<p style="margin: 0 0 16px 0; color: #334155; font-family: 'Segoe UI', Tahoma, Arial, 'Sarabun', sans-serif; font-size: 15px; line-height: 1.6;">${noteHtml}</p>` : ''}

              ${ctaText ? `<p style="margin: 0 0 14px 0; color: #0f172a; font-family: 'Segoe UI', Tahoma, Arial, 'Sarabun', sans-serif; font-size: 16px; font-weight: bold; line-height: 1.6;">${ctaText}</p>` : ''}

              ${buttonHtml}

              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0 16px 0;">
                <tr>
                  <td style="border-top: 1px solid #e2e8f0; font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>
              </table>

              <p style="margin: 0; font-family: 'Segoe UI', Tahoma, Arial, 'Sarabun', sans-serif; font-size: 13px; color: #64748b; line-height: 1.6;">
                <i>นี่คืออีเมลอัตโนมัติจากระบบ Leave Management System กรุณาอย่าตอบกลับ</i>
              </p>
            </td>
          </tr>
        </table>
        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * 1. Email ขออนุมัติการลา (ส่งหาผู้อนุมัติขั้นที่ 1 หรือขั้นถัดไป)
 */
export const buildRequestApprovalEmail = ({
  approverName,
  requesterName,
  requestId,
  leaveType,
  dateRange,
  periodText,
  duration,
  description,
  stepNum
}) => {
  const title = stepNum ? `แจ้งเตือนขออนุมัติการลา (ขั้นที่ ${stepNum})` : 'แจ้งเตือนขออนุมัติการลา';
  return buildOutlookEmailWrapper({
    title,
    titleColor: '#059669',
    greeting: `เรียน คุณ${approverName},`,
    leadText: 'ระบบได้รับคำขออนุมัติการลา โปรดพิจารณาอนุมัติคำขอดังกล่าว โดยมีรายละเอียดดังนี้:',
    rows: [
      { label: 'รหัสคำขอ', value: requestId },
      { label: 'พนักงานผู้ขอลา', value: requesterName || 'พนักงาน' },
      { label: 'ประเภทการลา', value: leaveType },
      { label: 'วันที่ลา', value: dateRange },
      { label: 'ช่วงเวลา', value: periodText },
      { label: 'จำนวนวัน', value: `${duration} วัน` },
      { label: 'เหตุผลการลา', value: description || '-' },
    ],
    ctaText: 'กรุณาเข้าสู่ระบบเพื่อตรวจสอบและพิจารณาอนุมัติคำขอ:',
    buttonText: 'เข้าสู่ระบบ',
    buttonUrl: SYSTEM_URL,
    theme: 'emerald'
  });
};

/**
 * 2. Email อนุมัติการลาเสร็จสมบูรณ์ (ส่งหาพนักงานผู้ขอลา)
 */
export const buildApprovedEmail = ({
  requesterName,
  requestId,
  leaveType,
  dateRange,
  duration,
  periodText
}) => {
  const durationText = `${duration} วัน ${periodText ? `(${periodText})` : ''}`.trim();
  return buildOutlookEmailWrapper({
    title: '✅ อนุมัติการลา',
    titleColor: '#059669',
    greeting: `เรียน คุณ${requesterName},`,
    leadText: 'คำขออนุมัติการลาของคุณได้รับการพิจารณา <strong>"อนุมัติ"</strong> ครบทุกขั้นตอนเรียบร้อยแล้ว โดยมีรายละเอียดดังนี้:',
    rows: [
      { label: 'รหัสคำขอ', value: requestId },
      { label: 'ประเภทการลา', value: leaveType },
      { label: 'วันที่เริ่ม', value: dateRange },
      { label: 'จำนวนวัน', value: durationText },
    ],
    buttonText: 'ตรวจสอบประวัติการลาของคุณ',
    buttonUrl: SYSTEM_URL,
    theme: 'emerald'
  });
};

/**
 * 3. Email ไม่อนุมัติการลา (ส่งหาพนักงานผู้ขอลา)
 */
export const buildRejectedEmail = ({
  requesterName,
  requestId,
  leaveType,
  dateRange,
  rejectorName,
  comment
}) => {
  return buildOutlookEmailWrapper({
    title: '❌ ไม่อนุมัติการลา',
    titleColor: '#ef4444',
    greeting: `เรียน คุณ${requesterName},`,
    leadText: 'คำขออนุมัติการลาของคุณ <strong>"ไม่ได้รับการอนุมัติ"</strong> โดยมีรายละเอียดดังนี้:',
    rows: [
      { label: 'รหัสคำขอ', value: requestId },
      { label: 'ประเภทการลา', value: leaveType },
      { label: 'วันที่ลา', value: dateRange },
      { label: 'ผู้ปฏิเสธคำขอ', value: rejectorName || 'ผู้อนุมัติ' },
      { label: 'เหตุผลที่ไม่อนุมัติ', value: comment || 'ไม่ระบุ' },
    ],
    noteHtml: 'หากมีข้อสงสัย กรุณาติดต่อหัวหน้างานหรือฝ่ายบุคคลค่ะ',
    buttonText: 'เข้าสู่ระบบ',
    buttonUrl: SYSTEM_URL,
    theme: 'rose'
  });
};

/**
 * Sends an email notification using the Google Apps Script backend.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - HTML body of the email
 */
export const sendEmailNotification = async ({ to, subject, body }) => {
  if (!to) {
    console.error('sendEmailNotification: Missing recipient email address.');
    return;
  }

  if (!GAS_URL) {
    console.warn('sendEmailNotification: VITE_GAS_EMAIL_URL is not configured. Email not sent.', { to, subject });
    return;
  }

  try {
    // We send this in the background, without waiting for the UI to block
    fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors', // Important for GAS to avoid CORS issues in some setups
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // GAS often works better with text/plain for CORS
      },
      body: JSON.stringify({ to, subject, body }),
    }).catch(err => {
      console.error('Failed to send email silently:', err);
    });
    
    // We assume it's successful since it's fire-and-forget
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

