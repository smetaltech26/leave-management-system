/**
 * Leave Management System - LINE Push Notification Proxy
 * ให้ นำโค้ดนี้ไปวางใน Google Apps Script (GAS) ชุดใหม่
 * 
 * วิธีการ Deploy:
 * 1. สร้างโปรเจกต์ใหม่ใน Google Apps Script (script.google.com)
 * 2. คัดลอกโค้ดนี้ไปวางแทนที่โค้ดเดิม
 * 3. แทนที่ YOUR_LINE_CHANNEL_ACCESS_TOKEN ด้วย Token ของบอท LINE
 * 4. กดปุ่ม "การทำให้ใช้งานได้" (Deploy) > "การทำให้ใช้งานได้รายการใหม่" (New deployment)
 * 5. เลือกประเภท: แอปพลิเคชันเว็บ (Web app)
 * 6. คำอธิบาย: LINE Proxy
 * 7. สิทธิ์การเข้าถึง (Who has access): ทุกคน (Anyone)
 * 8. กด Deploy และคัดลอก Web App URL มาใส่ในไฟล์ .env ตัวแปร VITE_GAS_LINE_URL
 */

// ให้โค้ดดึง Token จาก "พร็อพเพอร์ตี้ของสคริปต์" (Script Properties) ที่พี่ต้นตั้งค่าไว้ค่ะ
const CHANNEL_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');

function doPost(e) {
  try {
    // รับข้อมูล Payload จาก React (ส่งมาเป็น text/plain เพื่อเลี่ยง CORS Preflight)
    const payload = JSON.parse(e.postData.contents);
    const to = payload.to;
    const messages = payload.messages;
    const channelToken = payload.channelToken || CHANNEL_ACCESS_TOKEN;
    
    if (!to || !messages) {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "error", 
        message: "Missing 'to' or 'messages'" 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ยิง LINE Messaging API (GAS จะไม่ติดปัญหา CORS)
    const response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + channelToken
      },
      payload: JSON.stringify({
        to: to,
        messages: messages
      }),
      muteHttpExceptions: true
    });
    
    const statusCode = response.getResponseCode();
    const resultText = response.getContentText();
    
    if (statusCode === 200) {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        message: "LINE push sent successfully" 
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "error", 
        message: `LINE API Error ${statusCode}: ${resultText}` 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
