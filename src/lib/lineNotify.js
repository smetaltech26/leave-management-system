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
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: 'text', text: messageText }]
      })
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
    'Other': 'อื่นๆ',
    'Maternity': 'ลาคลอด',
    'Study': 'ลาศึกษา',
    'Military': 'ลาทหาร'
  };

  const typeName = leaveTypesMap[leaveType] || leaveType;
  const message = `${approverName} มีพนักงาน (${requesterName}) ขออนุมัติ${typeName} (${dateRange}) เข้ามาในระบบค่ะ (ขั้นตอนที่ ${stepNum}) ช่วยตรวจสอบและอนุมัติด้วยค่ะ 🙏`;

  return await sendLinePushToUser(lineUserId, message, channelAccessToken);
};
