const CHANNEL_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN'); 
function checkAndNotifyLeaveRequests() {
  const ss = SpreadsheetApp.openById('1AczccmAWd2YJ7rOvNrNdErzVB6snGDy6W5QTcCZYf8g');
  const leaveSheet = ss.getSheetByName('LeaveRequests');
  const dataSheet = ss.getSheetByName('Data');
  const approvalSheet = ss.getSheetByName('ApprovalSteps'); 
  
  const dataRange = dataSheet.getDataRange().getValues();
  const userMap = {};
  const userMapStep2 = {};
  const userMapStep3 = {};
  const approverStep1UidMap = {};
  const lineUserIdMap = {};
  
  for (let i = 1; i < dataRange.length; i++) {
    let uid = String(dataRange[i][0] || '').trim();
    let managerName = dataRange[i][6];
    if (uid) {
      userMap[uid] = managerName;
      approverStep1UidMap[uid] = String(dataRange[i][7] || '').trim();
      lineUserIdMap[uid] = String(dataRange[i][12] || '').trim();
    }

    let uidStep2 = dataRange[i][9]; 
    let managerNameStep2 = dataRange[i][8]; 
    if (uidStep2) userMapStep2[uidStep2] = managerNameStep2;

    let uidStep3 = dataRange[i][11];
    let managerNameStep3 = dataRange[i][10];
    if (uidStep3) userMapStep3[uidStep3] = managerNameStep3;
  }

  const approvalData = approvalSheet.getDataRange().getValues();
  const approvalStep1Status = {};
  const approvalStep2Status = {};
  const approvalStep2User = {};
  const approvalStep3User = {};

  for (let i = 1; i < approvalData.length; i++) {
    let reqId = approvalData[i][1];
    let stepNum = approvalData[i][2];
    let uId = approvalData[i][3];
    let status = approvalData[i][6];

    if (stepNum == 1) approvalStep1Status[reqId] = status; 
    if (stepNum == 2) {
      approvalStep2User[reqId] = uId;      
      approvalStep2Status[reqId] = status;
    }
    if (stepNum == 3) approvalStep3User[reqId] = uId;
  }
  
  const startRow = 433;
  const lastRow = leaveSheet.getLastRow();
  
  if (lastRow < startRow) return; 
  
  const checkRange = leaveSheet.getRange(startRow, 1, lastRow - startRow + 1, 16);
  const leaveData = checkRange.getValues(); 
  
  let isDataChanged = false; 
  const updateStatusData = []; // สร้างถังใบใหม่ไว้เก็บแค่สถานะแจ้งเตือน (คอลัมน์ N, O, P)

  for (let i = 0; i < leaveData.length; i++) {
    let reqId = leaveData[i][0];
    let userId = leaveData[i][4];
    let isNotified = leaveData[i][13];
    let isNotifiedStep2 = leaveData[i][14];
    let isNotifiedStep3 = leaveData[i][15];
    
    // 🔔 STEP 1: ส่งตรงถึงผู้อนุมัติคนที่ 1 แบบ 1:1 เท่านั้น
    if (userId && isNotified === '') {
      let managerName = userMap[userId];
      let approverUserId = approverStep1UidMap[userId];
      let lineUserId = lineUserIdMap[approverUserId];

      if (!approverUserId) {
        Logger.log('STEP1 ไม่พบ UserSend1 ของ ' + userId + ' แถว ' + (startRow + i));
      } else if (!lineUserId) {
        Logger.log('STEP1 ยังไม่มี LineUserId ของผู้อนุมัติ ' + approverUserId + ' แถว ' + (startRow + i));
      } else if (!managerName) {
        Logger.log('STEP1 ไม่พบชื่อผู้อนุมัติของ ' + userId + ' แถว ' + (startRow + i));
      } else {
        let message = managerName + " มีพนักงานขออนุมัติลางานมาในระบบค่ะ ช่วยตรวจสอบด้วยค่ะ";
        let sendResult = sendLinePushToUser_(lineUserId, message);

        if (sendResult.success) {
          isNotified = 'แจ้งเตือน 1:1 แล้ว';
        } else {
          isNotified = 'ส่ง 1:1 ไม่สำเร็จ/Error';
          Logger.log('STEP1 ส่ง 1:1 ไม่สำเร็จ แถว ' + (startRow + i) + ': ' + sendResult.errorMsg);
        }
        isDataChanged = true;
      }
    }

    // 🔔 STEP 2: ส่งตรงถึงผู้อนุมัติคนที่ 2 แบบ 1:1 เท่านั้น
    if (reqId && approvalStep1Status[reqId] === 'Approved' &&
        isNotifiedStep2 === '') {
      let step2UserId = String(approvalStep2User[reqId] || '').trim();
      let managerNameStep2 = userMapStep2[step2UserId];
      let lineUserIdStep2 = lineUserIdMap[step2UserId];

      if (!step2UserId) {
        Logger.log('STEP2 ไม่พบ UID ผู้อนุมัติ ReqID ' + reqId + ' แถว ' + (startRow + i));
      } else if (!lineUserIdStep2) {
        Logger.log('STEP2 ยังไม่มี LineUserId ของผู้อนุมัติ ' + step2UserId + ' แถว ' + (startRow + i));
      } else if (!managerNameStep2) {
        Logger.log('STEP2 ไม่พบชื่อผู้อนุมัติ ' + step2UserId + ' แถว ' + (startRow + i));
      } else {
        let message2 = managerNameStep2 + " มีพนักงานขออนุมัติลางานมาในระบบค่ะ ช่วยตรวจสอบด้วยค่ะ";
        let sendResult2 = sendLinePushToUser_(lineUserIdStep2, message2);

        if (sendResult2.success) {
          isNotifiedStep2 = 'แจ้งเตือน STEP2 แบบ 1:1 แล้ว';
        } else {
          isNotifiedStep2 = 'ส่ง STEP2 แบบ 1:1 ไม่สำเร็จ/Error';
          Logger.log('STEP2 ส่ง 1:1 ไม่สำเร็จ แถว ' + (startRow + i) + ': ' + sendResult2.errorMsg);
        }
        isDataChanged = true;
      }
    }

    // 🔔 STEP 3: ส่งตรงถึงผู้อนุมัติคนสุดท้ายแบบ 1:1 เท่านั้น
    if (reqId && approvalStep2Status[reqId] === 'Approved' &&
        isNotifiedStep3 === '') {
      let step3UserId = String(approvalStep3User[reqId] || '').trim();
      let managerNameStep3 = userMapStep3[step3UserId];
      let lineUserIdStep3 = lineUserIdMap[step3UserId];

      if (!step3UserId) {
        Logger.log('STEP3 ไม่พบ UID ผู้อนุมัติ ReqID ' + reqId + ' แถว ' + (startRow + i));
      } else if (!lineUserIdStep3) {
        Logger.log('STEP3 ยังไม่มี LineUserId ของผู้อนุมัติ ' + step3UserId + ' แถว ' + (startRow + i));
      } else if (!managerNameStep3) {
        Logger.log('STEP3 ไม่พบชื่อผู้อนุมัติ ' + step3UserId + ' แถว ' + (startRow + i));
      } else {
        let message3 = managerNameStep3 + " มีพนักงานขออนุมัติลางานมาในระบบค่ะ ช่วยตรวจสอบด้วยค่ะ";
        let sendResult3 = sendLinePushToUser_(lineUserIdStep3, message3);

        if (sendResult3.success) {
          isNotifiedStep3 = 'แจ้งเตือน STEP3 แบบ 1:1 แล้ว';
        } else {
          isNotifiedStep3 = 'ส่ง STEP3 แบบ 1:1 ไม่สำเร็จ/Error';
          Logger.log('STEP3 ส่ง 1:1 ไม่สำเร็จ แถว ' + (startRow + i) + ': ' + sendResult3.errorMsg);
        }
        isDataChanged = true;
      }
    }

    // เอาข้อมูลแค่ 3 คอลัมน์ (N, O, P) เก็บใส่ถังใบใหม่
    updateStatusData.push([isNotified, isNotifiedStep2, isNotifiedStep3]);
  }

  // 🚀 เทข้อมูลกลับลง Sheet เฉพาะคอลัมน์ 14 ถึง 16 (N, O, P)
  if (isDataChanged) {
    leaveSheet.getRange(startRow, 14, updateStatusData.length, 3).setValues(updateStatusData);
  }
}

/**
 * ทดสอบ Token โดยไม่ส่งข้อความและไม่ใช้โควตา
 */
function testLineToken() {
  const token = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');

  if (!token) {
    throw new Error('ไม่พบ LINE_CHANNEL_ACCESS_TOKEN ใน Script Properties');
  }

  const response = UrlFetchApp.fetch('https://api.line.me/v2/bot/info', {
    method: 'get',
    headers: {
      Authorization: 'Bearer ' + token
    },
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (statusCode !== 200) {
    throw new Error('Token ใช้งานไม่ได้ HTTP ' + statusCode + ': ' + responseText);
  }

  const botInfo = JSON.parse(responseText);
  console.log('เชื่อมต่อ LINE สำเร็จ: ' + botInfo.displayName);
}


/**
 * ส่งข้อความ LINE แบบ 1:1 ไปยังผู้ใช้หนึ่งคน
 */
function sendLinePushToUser_(lineUserId, messageText) {
  const targetUserId = String(lineUserId || '').trim();

  if (!targetUserId || targetUserId.charAt(0) !== 'U') {
    return { success: false, errorMsg: 'LINE User ID ไม่ถูกต้อง' };
  }

  const payload = {
    to: targetUserId,
    messages: [{ type: 'text', text: String(messageText) }]
  };

  const response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + CHANNEL_ACCESS_TOKEN
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (statusCode !== 200) {
    return {
      success: false,
      errorMsg: 'API Error ' + statusCode + ': ' + responseText
    };
  }

  return { success: true, errorMsg: '' };
}

/**
 * ทดสอบส่งข้อความ 1:1 จำนวนหนึ่งข้อความ
 */
function testPushLine1To1() {
  const testUserId = PropertiesService.getScriptProperties().getProperty('TEST_LINE_USER_ID');

  if (!testUserId) {
    throw new Error('ไม่พบ TEST_LINE_USER_ID ใน Script Properties');
  }

  const result = sendLinePushToUser_(
    testUserId,
    '✅ ทดสอบระบบแจ้งเตือนการลาแบบ 1:1 สำเร็จค่ะ'
  );

  if (!result.success) {
    throw new Error('ส่ง LINE 1:1 ไม่สำเร็จ: ' + result.errorMsg);
  }

  console.log('ส่ง LINE 1:1 สำเร็จแล้ว');
}

/**
 * บันทึก TEST_LINE_USER_ID ให้ USER-008 ในคอลัมน์ LineUserId ของชีต Data
 */
function saveTestLineUserIdForUser008() {
  const employeeUid = 'USER-008';
  const lineUserId = String(
    PropertiesService.getScriptProperties().getProperty('TEST_LINE_USER_ID') || ''
  ).trim();

  if (!/^U[0-9a-f]{32}$/i.test(lineUserId)) {
    throw new Error('TEST_LINE_USER_ID ไม่ถูกต้องหรือยังไม่ได้บันทึกใน Script Properties');
  }

  const ss = SpreadsheetApp.openById('1AczccmAWd2YJ7rOvNrNdErzVB6snGDy6W5QTcCZYf8g');
  const dataSheet = ss.getSheetByName('Data');

  if (!dataSheet) {
    throw new Error('ไม่พบชีต Data');
  }

  const lineUserIdColumn = 13; // คอลัมน์ M
  const header = String(dataSheet.getRange(1, lineUserIdColumn).getValue()).trim();

  if (header !== 'LineUserId') {
    throw new Error('ไม่พบหัวคอลัมน์ LineUserId ที่ M1');
  }

  const lastRow = dataSheet.getLastRow();
  const uidValues = dataSheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
  const uidIndex = uidValues.findIndex(row => String(row[0]).trim() === employeeUid);

  if (uidIndex === -1) {
    throw new Error('ไม่พบ ' + employeeUid + ' ในชีต Data');
  }

  const targetRow = uidIndex + 2;
  dataSheet.getRange(targetRow, lineUserIdColumn).setValue(lineUserId);
  console.log('บันทึก LINE User ID ให้ ' + employeeUid + ' เรียบร้อย');
}

/**
 * รับ Webhook จาก LINE สำหรับลงทะเบียน LINE User ID ของผู้อนุมัติ
 * ผู้ใช้ส่งข้อความเพียง USER-XXX ในแชต 1:1 กับ Official Account
 */
function doPost(e) {
  const response = HtmlService.createHtmlOutput('OK');

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return response;
    }

    const body = JSON.parse(e.postData.contents);
    const events = Array.isArray(body.events) ? body.events : [];

    events.forEach(event => handleLineWebhookEvent_(event));
  } catch (error) {
    console.error('LINE Webhook Error: ' + error.message);
  }

  return response;
}

/**
 * จัดการ Follow event และข้อความลงทะเบียนจากแชต 1:1
 */
function handleLineWebhookEvent_(event) {
  if (!event || !event.source || event.source.type !== 'user') {
    return;
  }

  if (event.type === 'follow') {
    replyLineMessage_(
      event.replyToken,
      'ยินดีต้อนรับค่ะ กรุณาส่งรหัสพนักงานของคุณในรูปแบบ USER-XXX เช่น USER-006'
    );
    return;
  }

  if (event.type !== 'message' || !event.message || event.message.type !== 'text') {
    return;
  }

  const employeeUid = String(event.message.text || '').trim().toUpperCase();
  const lineUserId = String(event.source.userId || '').trim();

  if (!/^USER-\d{3}$/.test(employeeUid)) {
    replyLineMessage_(
      event.replyToken,
      'รูปแบบไม่ถูกต้องค่ะ กรุณาส่งเฉพาะรหัสพนักงาน เช่น USER-006'
    );
    return;
  }

  if (!/^U[0-9a-f]{32}$/i.test(lineUserId)) {
    replyLineMessage_(event.replyToken, 'ไม่สามารถอ่าน LINE User ID ได้ กรุณาลองใหม่ค่ะ');
    return;
  }

  const lock = LockService.getScriptLock();

  if (!lock.tryLock(5000)) {
    replyLineMessage_(event.replyToken, 'ระบบกำลังประมวลผล กรุณาลองใหม่อีกครั้งค่ะ');
    return;
  }

  let result;

  try {
    result = registerApproverLineUser_(employeeUid, lineUserId);
  } finally {
    lock.releaseLock();
  }

  replyLineMessage_(event.replyToken, result.message);
}

/**
 * ตรวจสิทธิ์ผู้อนุมัติและบันทึก LINE User ID ลงคอลัมน์ M
 */
function registerApproverLineUser_(employeeUid, lineUserId) {
  const ss = SpreadsheetApp.openById('1AczccmAWd2YJ7rOvNrNdErzVB6snGDy6W5QTcCZYf8g');
  const dataSheet = ss.getSheetByName('Data');

  if (!dataSheet) {
    return { success: false, message: 'ระบบไม่พบชีต Data กรุณาติดต่อ HR ค่ะ' };
  }

  const lastRow = dataSheet.getLastRow();

  if (lastRow < 2) {
    return { success: false, message: 'ยังไม่มีข้อมูลพนักงาน กรุณาติดต่อ HR ค่ะ' };
  }

  const lineUserIdColumn = 13; // คอลัมน์ M
  const header = String(dataSheet.getRange(1, lineUserIdColumn).getValue()).trim();

  if (header !== 'LineUserId') {
    return { success: false, message: 'ไม่พบคอลัมน์ LineUserId กรุณาติดต่อ HR ค่ะ' };
  }

  const data = dataSheet.getRange(2, 1, lastRow - 1, lineUserIdColumn).getDisplayValues();
  const targetIndex = data.findIndex(row => String(row[0]).trim().toUpperCase() === employeeUid);

  if (targetIndex === -1) {
    return { success: false, message: 'ไม่พบ ' + employeeUid + ' ในระบบ กรุณาตรวจสอบรหัสอีกครั้งค่ะ' };
  }

  const approverUids = new Set();

  data.forEach(row => {
    [row[7], row[9], row[11]].forEach(uid => {
      const normalizedUid = String(uid || '').trim().toUpperCase();
      if (normalizedUid) approverUids.add(normalizedUid);
    });
  });

  if (!approverUids.has(employeeUid)) {
    return { success: false, message: employeeUid + ' ไม่ได้อยู่ในรายชื่อผู้อนุมัติ กรุณาติดต่อ HR ค่ะ' };
  }

  const existingLineUserId = String(data[targetIndex][12] || '').trim();

  if (existingLineUserId) {
    if (existingLineUserId === lineUserId) {
      return { success: true, message: employeeUid + ' ลงทะเบียน LINE ไว้แล้วค่ะ' };
    }

    return {
      success: false,
      message: employeeUid + ' ลงทะเบียนกับ LINE บัญชีอื่นไว้แล้ว กรุณาติดต่อ HR ค่ะ'
    };
  }

  const duplicateLineIndex = data.findIndex((row, index) =>
    index !== targetIndex && String(row[12] || '').trim() === lineUserId
  );

  if (duplicateLineIndex !== -1) {
    return {
      success: false,
      message: 'LINE บัญชีนี้ลงทะเบียนกับรหัสอื่นไว้แล้ว กรุณาติดต่อ HR ค่ะ'
    };
  }

  const targetRow = targetIndex + 2;
  dataSheet.getRange(targetRow, lineUserIdColumn).setValue(lineUserId);
  console.log('ลงทะเบียน LINE สำเร็จสำหรับ ' + employeeUid);

  return { success: true, message: 'ลงทะเบียน ' + employeeUid + ' สำเร็จค่ะ' };
}

/**
 * ตอบกลับข้อความจาก LINE Webhook
 */
function replyLineMessage_(replyToken, messageText) {
  const token = String(replyToken || '').trim();

  if (!token || token === '00000000000000000000000000000000') {
    return;
  }

  const response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + CHANNEL_ACCESS_TOKEN
    },
    payload: JSON.stringify({
      replyToken: token,
      messages: [{ type: 'text', text: String(messageText) }]
    }),
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    console.error('ตอบกลับ LINE ไม่สำเร็จ HTTP ' + response.getResponseCode());
  }
}
