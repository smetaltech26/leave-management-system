// src/services/emailService.js

// You can set this in your .env file as VITE_GAS_EMAIL_URL
// For now, if it's not set, we'll just log it so the app doesn't crash before you deploy it.
const GAS_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GAS_EMAIL_URL) || '';
const SYSTEM_URL = 'https://smetaltech26.github.io/leave-management-system/';

/**
 * Helper to build an Outlook-friendly HTML email container (MRS style)
 */
const buildOutlookEmailWrapper = ({
  systemSubtitle = 'SMETALTECH • LEAVE MANAGEMENT SYSTEM (LMS)',
  headerTitle,
  badgeText,
  greeting,
  leadText,
  boxTitle,
  rows = [],
  noteHtml = '',
  buttonText = 'คลิกเข้าสู่ระบบ (เฉพาะผู้อนุมัติ)',
  buttonUrl = SYSTEM_URL,
  statusText = '',
  theme = 'blue' // 'blue' | 'green' | 'red'
}) => {
  const accentColor = theme === 'red' ? '#dc2626' : theme === 'green' ? '#16a34a' : '#1d4ed8';

  const rowsHtml = rows.map(r => `
    <tr>
      <td width="140" style="padding: 7px 12px 7px 0; width: 140px; color: #4b5563; font-family: Tahoma, 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: bold; line-height: 1.5; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word;">
        ${r.label}:
      </td>
      <td style="padding: 7px 0 7px 4px; color: #111827; font-family: Tahoma, 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 500; line-height: 1.5; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word;">
        ${r.value}
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${headerTitle || 'แจ้งเตือนคำขอลางาน'}</title>
  <style type="text/css">
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
    }
    * {
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
    }
    body, table, td, th, p, a, span, h1, h2, h3, div, strong, b, i {
      font-family: Tahoma, 'Segoe UI', Arial, sans-serif !important;
    }
    table, td {
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
    table {
      border-spacing: 0 !important;
      border-collapse: collapse !important;
    }
    .email-container {
      width: 600px !important;
      max-width: 600px !important;
      table-layout: fixed !important;
    }
    .content-table {
      width: 544px !important;
      max-width: 544px !important;
      table-layout: fixed !important;
    }
    .rows-table {
      width: 498px !important;
      max-width: 498px !important;
      table-layout: fixed !important;
    }
    /* Mobile responsive constraint */
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .content-table,
      .rows-table {
        width: 100% !important;
        max-width: 100% !important;
      }
      .mobile-padding {
        padding-left: 16px !important;
        padding-right: 16px !important;
      }
    }
  </style>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, th, p, a, span, h1, h2, h3, div, strong, b, i {
      font-family: Tahoma, Arial, sans-serif !important;
    }
  </style>
  <![endif]-->
</head>
<body bgcolor="#f3f4f6" style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Tahoma, 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Full-width background wrapper; only the inner card is fixed at 600px. -->
  <table role="presentation" width="100%" align="center" border="0" cellpadding="0" cellspacing="0" bgcolor="#f3f4f6" style="width: 100%; background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <!-- Fixed desktop card. Outlook uses the HTML width attribute instead of max-width. -->
        <table role="presentation" class="email-container" width="600" border="0" cellpadding="0" cellspacing="0" style="width: 600px; max-width: 600px; table-layout: fixed; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07); text-align: left;">
      
      <!-- Colored Header Banner -->
      <tr>
        <td class="mobile-padding" style="padding: 0 28px; text-align: left;">
          <!-- Keep the colored header independent from Outlook's expanded parent table. -->
          <table role="presentation" class="content-table" width="544" border="0" cellpadding="0" cellspacing="0" bgcolor="${accentColor}" style="width: 544px; max-width: 544px; table-layout: fixed; clear: both; background-color: ${accentColor}; border-radius: 8px 8px 0 0;">
            <tr>
              <td bgcolor="${accentColor}" style="background-color: ${accentColor}; padding: 24px 28px; text-align: left;">
                <div style="font-family: Tahoma, 'Segoe UI', Arial, sans-serif; font-size: 11px; font-weight: bold; color: #ffffff; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 6px;">
                  ${systemSubtitle}
                </div>
                <div style="font-family: Tahoma, 'Segoe UI', Arial, sans-serif; font-size: 26px; font-weight: bold; color: #ffffff; line-height: 1.2; margin-bottom: 12px;">
                  ${headerTitle}
                </div>
                <div>
                  <span style="display: inline-block; border: 1px solid #ffffff; background-color: rgba(255, 255, 255, 0.15); border-radius: 4px; padding: 4px 12px; color: #ffffff; font-family: Tahoma, 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: bold;">
                    ${badgeText}
                  </span>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Main White Body -->
      <tr>
        <td class="mobile-padding" style="padding: 28px 28px 24px 28px; font-family: Tahoma, 'Segoe UI', Arial, sans-serif; text-align: left;">
          
          <!-- Greeting -->
          <div style="font-family: Tahoma, 'Segoe UI', Arial, sans-serif; font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 10px;">
            ${greeting}
          </div>

          <!-- Lead Text -->
          <div style="font-family: Tahoma, 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #374151; line-height: 1.6; margin-bottom: 20px;">
            ${leadText}
          </div>

          <!-- Fixed 544px content box prevents nested content from widening the card in Outlook. -->
          <table role="presentation" class="content-table" width="544" border="0" cellpadding="0" cellspacing="0" style="width: 544px; max-width: 544px; table-layout: fixed; background-color: #f9fafb; border: 1px solid #e5e7eb; border-left: 5px solid ${accentColor}; border-radius: 6px; margin: 0 0 22px 0;">
            <tr>
              <td style="padding: 18px 20px;">
                
                ${boxTitle ? `
                <div style="font-family: Tahoma, 'Segoe UI', Arial, sans-serif; font-size: 17px; font-weight: bold; color: #111827; margin-bottom: 14px; border-bottom: 1px dashed #e5e7eb; padding-bottom: 10px;">
                  ${boxTitle}
                </div>
                ` : ''}

                <table role="presentation" class="rows-table" width="498" border="0" cellpadding="0" cellspacing="0" style="width: 498px; max-width: 498px; table-layout: fixed;">
                  ${rowsHtml}
                </table>

              </td>
            </tr>
          </table>

          ${noteHtml ? `
          <div style="font-family: Tahoma, 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #4b5563; line-height: 1.6; margin-bottom: 18px;">
            ${noteHtml}
          </div>
          ` : ''}

          <!-- Wide Action Button: do not use table align here; Outlook treats it as a floating table. -->
          <table role="presentation" class="content-table" width="544" border="0" cellpadding="0" cellspacing="0" style="width: 544px; max-width: 544px; table-layout: fixed; clear: both; margin: 22px 0 16px 0;">
            <tr>
              <td align="center" bgcolor="${accentColor}" style="border-radius: 6px; background-color: ${accentColor}; padding: 13px 24px; text-align: center;">
                <a href="${buttonUrl}" target="_blank" style="color: #ffffff; font-family: Tahoma, 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: bold; text-decoration: none; display: block; text-align: center; line-height: 1.3;">
                  ${buttonText}
                </a>
              </td>
            </tr>
          </table>

          <!-- Status Text -->
          ${statusText ? `
          <div style="font-family: Tahoma, 'Segoe UI', Arial, sans-serif; font-size: 14px; font-weight: bold; color: ${accentColor}; margin: 0 0 6px 0;">
            ${statusText}
          </div>
          ` : ''}

          <!-- Disclaimer -->
          <div style="font-family: Tahoma, 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #6b7280; line-height: 1.5; margin: 4px 0 0 0;">
            ข้อความอัตโนมัติจากระบบ Leave Management System (LMS) กรุณาอย่าตอบกลับ
          </div>

        </td>
      </tr>

        </table>
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
  stepNum,
  prevApproverName,
  prevApproverComment
}) => {
  const badgeText = stepNum ? `รอนุมัติ (ขั้นที่ ${stepNum})` : 'รอนุมัติ';
  const rows = [
    { label: 'พนักงานผู้ขอลา', value: requesterName || 'พนักงาน' },
    { label: 'ประเภทการลา', value: leaveType },
    { label: 'วันที่ลา', value: dateRange },
    { label: 'ช่วงเวลา', value: periodText },
    { label: 'จำนวนวัน', value: `${duration} วัน` },
    { label: 'เหตุผลการลา', value: description || '-' },
  ];

  if (prevApproverName) {
    rows.push({
      label: `ผู้อนุมัติขั้นก่อนหน้า`,
      value: `${prevApproverName} <span style="color: #16a34a; font-weight: bold;">(อนุมัติ)</span>`
    });
    if (prevApproverComment && prevApproverComment.trim()) {
      rows.push({
        label: 'ความเห็นผู้อนุมัติ',
        value: prevApproverComment
      });
    }
  }

  return buildOutlookEmailWrapper({
    headerTitle: requestId,
    badgeText,
    greeting: `เรียน คุณ${approverName}`,
    leadText: 'ระบบได้รับคำขออนุมัติการลา โปรดพิจารณาอนุมัติคำขอดังกล่าว โดยมีรายละเอียดดังนี้',
    boxTitle: `รหัสคำขอลา: ${requestId}`,
    rows,
    buttonText: 'คลิกเข้าสู่ระบบ (เฉพาะผู้อนุมัติ)',
    buttonUrl: SYSTEM_URL,
    statusText: `สถานะปัจจุบัน: รอพิจารณาอนุมัติ (ขั้นที่ ${stepNum || 1})`,
    theme: 'blue'
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
    headerTitle: requestId,
    badgeText: 'อนุมัติเสร็จสมบูรณ์',
    greeting: `เรียน คุณ${requesterName}`,
    leadText: 'คำขออนุมัติการลาของคุณได้รับการพิจารณา <strong>"อนุมัติ"</strong> ครบทุกขั้นตอนเรียบร้อยแล้ว โดยมีรายละเอียดดังนี้',
    boxTitle: `รหัสคำขอลา: ${requestId}`,
    rows: [
      { label: 'ประเภทการลา', value: leaveType },
      { label: 'วันที่เริ่ม', value: dateRange },
      { label: 'จำนวนวัน', value: durationText },
      { label: 'สถานะ', value: '<span style="color: #16a34a; font-weight: bold;">อนุมัติเรียบร้อยแล้ว</span>' },
    ],
    buttonText: 'คลิกเข้าสู่ระบบ (ตรวจสอบประวัติการลา)',
    buttonUrl: SYSTEM_URL,
    statusText: 'สถานะปัจจุบัน: อนุมัติเสร็จสมบูรณ์ (Approved)',
    theme: 'green'
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
    headerTitle: requestId,
    badgeText: 'ไม่อนุมัติ',
    greeting: `เรียน คุณ${requesterName}`,
    leadText: 'คำขออนุมัติการลาของคุณ <strong>"ไม่ได้รับการอนุมัติ"</strong> โดยมีรายละเอียดดังนี้',
    boxTitle: `รหัสคำขอลา: ${requestId}`,
    rows: [
      { label: 'ประเภทการลา', value: leaveType },
      { label: 'วันที่ลา', value: dateRange },
      { label: 'ผู้ปฏิเสธคำขอ', value: rejectorName || 'ผู้อนุมัติ' },
      { label: 'เหตุผลที่ไม่อนุมัติ', value: `<span style="color: #dc2626; font-weight: bold;">${comment || 'ไม่ระบุ'}</span>` },
    ],
    noteHtml: 'หากมีข้อสงสัย กรุณาติดต่อหัวหน้างานหรือฝ่ายบุคคล',
    buttonText: 'คลิกเข้าสู่ระบบ',
    buttonUrl: SYSTEM_URL,
    statusText: 'สถานะปัจจุบัน: ไม่อนุมัติ (Rejected)',
    theme: 'red'
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
