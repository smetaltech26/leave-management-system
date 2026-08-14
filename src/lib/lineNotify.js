/**
 * ระบบส่งการแจ้งเตือนการลางานผ่าน LINE Messaging API แบบ 1:1 Direct Push
 * ตาม logic ใน รหัส.gs ล่าสุด
 */

export const sendLinePushToUser = async (lineUserId, messageText, channelAccessToken) => {
  if (!lineUserId || !lineUserId.startsWith('U')) {
    console.warn('LINE User ID ไม่ถูกต้อง:', lineUserId);
    return { success: false, errorMsg: 'LINE User ID ไม่ถูกต้อง' };
  }

  const token = channelAccessToken || import.meta.env.VITE_LINE_CHANNEL_ACCESS_TOKEN;

  if (!token) {
    console.warn('ยังไม่ได้ระบุ LINE_CHANNEL_ACCESS_TOKEN');
    return { success: false, errorMsg: 'ไม่มี Token' };
  }

  try {
    const proxyUrl = import.meta.env.VITE_GAS_LINE_URL;
    const apiUrl = import.meta.env.DEV 
      ? '/line-api/v2/bot/message/push' 
      : (proxyUrl || 'https://api.line.me/v2/bot/message/push');

    const headers = import.meta.env.DEV 
      ? {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      : {
          // ส่งเป็น text/plain เพื่อเลี่ยงการเกิด CORS Preflight (OPTIONS) ไปยัง GAS
          'Content-Type': 'text/plain', 
        };

    // ถ้ายิงไปที่ GAS ให้แนบ Token ไปใน Payload ไม่ใช่ Headers เพราะ GAS อาจจะไม่ส่งต่อ Authorization Header ให้
    const payload = import.meta.env.DEV
      ? { to: lineUserId, messages: [{ type: 'text', text: messageText }] }
      : { to: lineUserId, messages: [{ type: 'text', text: messageText }], channelToken: token };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log('ส่ง LINE 1:1 สำเร็จหา:', lineUserId);
      return { success: true };
    } else {
      const errText = await response.text();
      console.error('ส่ง LINE 1:1 ล้มเหลว:', response.status, errText);
      return { success: false, errorMsg: `Error ${response.status}: ${errText}` };
    }
  } catch (error) {
    console.error('Error in sendLinePushToUser:', error);
    return { success: false, errorMsg: error.message };
  }
};

/**
 * แจ้งเตือนผู้อนุมัติตาม Step
 */
export const notifyLeaveApprover = async ({ approverName, lineUserId, requesterName, leaveType, dateRange, stepNum, channelAccessToken }) => {
  if (!lineUserId) return;

  const leaveTypesMap = {
    'Annual': 'ลาพักร้อน',
    'Sick': 'ลาป่วย',
    'Personal': 'ลากิจ',
    'Other': 'ลาอื่นๆ',
    'Maternity': 'ลาคลอด',
    'Study': 'ลาศึกษา',
    'Military': 'ลาทหาร'
  };

  const typeName = leaveTypesMap[leaveType] || leaveType;
  
  let formattedDateRange = dateRange;
  if (dateRange && dateRange.includes(' ถึง ')) {
    const [start, end] = dateRange.split(' ถึง ');
    if (start && end) {
      formattedDateRange = `${start.split('-').reverse().join('-')} ถึง ${end.split('-').reverse().join('-')}`;
    }
  }

  const message = `${approverName} มีพนักงาน (${requesterName}) ขออนุมัติ${typeName} (${formattedDateRange}) เข้ามาในระบบค่ะ ช่วยตรวจสอบและอนุมัติด้วยค่ะ 🙏`;

  return await sendLinePushToUser(lineUserId, message, channelAccessToken);
};
