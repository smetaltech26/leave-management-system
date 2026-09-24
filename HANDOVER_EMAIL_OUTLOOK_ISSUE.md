# 📋 เอกสารส่งต่องาน: ปัญหาอีเมลแจ้งเตือนขยายเต็มจอใน Microsoft Outlook Desktop
**เอกสารสำหรับ:** น้องจ๊ะ (Codex), พี่ต้น (P'Ton) และทีมพัฒนา  
**จัดทำโดย:** แอ๊น (Antigravity)  
**วันที่บันทึก:** 24 กันยายน 2026  
**อัปเดตผลการรับช่วงโดย:** จ๊ะ (Codex) วันที่ 24 กันยายน 2026

**สถานะปัจจุบัน:** ✅ ปิดปัญหา Outlook Desktop แล้ว และปรับปรุงความเร็วการยื่นลา/อนุมัติเรียบร้อย โดยพี่ต้นทดสอบจากอุปกรณ์จริงและยืนยันผล

---

## ✅ อัปเดตล่าสุดสำหรับแอ๊น (Antigravity): ผลการรับช่วงงานโดยจ๊ะ

### 1. ปิดปัญหาอีเมลขยายเต็มจอใน Classic Outlook Desktop แล้ว

**สาเหตุจริงที่พบ:**

1. ตารางหลักกำหนด `width="600"` ซ้ำกับเซลล์ด้านในที่มี Padding ทำให้ Word Rendering Engine ของ Outlook คำนวณความกว้างเกินกรอบ
2. ตารางปุ่มมี `align="center"` ซึ่ง Outlook ตีความเป็น Floating Table ทำให้กล่องรายละเอียดอยู่ซ้าย แต่ปุ่มไปอยู่ขวา และดันตารางแม่ให้ขยายเต็มหน้าจอ
3. สีพื้น Header ถูกกำหนดบน `<td>` ของแถวตารางแม่ เมื่อ Outlook ขยายตารางแม่ แถบสีน้ำเงินจึงขยายตามทั้งแถว

**แนวทางแก้สุดท้ายใน `src/services/emailService.js`:**

- ใช้ Background wrapper กว้าง `100%` แต่แยกส่วนเนื้อหาเป็นตารางคงที่
- การ์ด Desktop ใช้ความกว้าง `600px`
- Header, กล่องรายละเอียด และปุ่มใช้ตารางย่อยความกว้าง `544px` เท่ากัน
- ตารางรายการรายละเอียดภายในใช้ `498px`
- นำ `align` ที่ทำให้เกิด Floating Table ออกจากตารางการ์ดและตารางปุ่ม
- แยกพื้นสีน้ำเงินออกจากเซลล์เต็มแถวมาอยู่บนตาราง Header `544px`
- เอา `white-space: nowrap` ที่อาจดันตารางออก และเพิ่มการตัดบรรทัดสำหรับข้อความยาว
- คง Media Query สำหรับมือถือให้ตารางปรับเป็น `width: 100%`

**Commit ที่เกี่ยวข้อง:**

- `886bbaf` — ล็อกความกว้างตารางและเนื้อหาสำหรับ Outlook
- `22a6cf6` — แก้ Floating Table ของปุ่มและบังคับให้เรียงใต้รายละเอียด
- `60219d1` — แยก Header เป็นตารางย่อย `544px`

**ผลยืนยัน:**

- พี่ต้นทดสอบอีเมลใหม่บน Classic Outlook Desktop ทั้ง Reading Pane และหน้าต่าง Message แยกแล้ว
- Header, กล่องรายละเอียด และปุ่มกว้างตรงกัน ไม่ขยายเต็มจอ และไม่วางเหลื่อมซ้าย/ขวา
- Production Asset ที่ใช้ยืนยันรอบปิดปัญหา: `index-DAcejB3Y.js`

### 2. ปรับปรุงความเร็วการยื่นลาและอนุมัติบนมือถือ

**ผลตรวจเดิม:** UI รอ `await` การส่ง LINE ผ่าน Google Apps Script ก่อนแสดงผลสำเร็จ ทำให้ผู้ใช้ค้างที่ `กำลังส่งข้อมูล...` แม้ข้อมูลหลักใน Supabase อาจบันทึกสำเร็จแล้ว

**เวลาที่วัดจากระบบจริง:**

- GitHub Pages: Median ประมาณ `135ms`
- Supabase Read baseline: Median ประมาณ `86ms`
- LINE GAS แบบ No-op ซึ่งยังไม่เรียก LINE API จริง: `1.75s`, `8.79s`, และ `16.75s`
- สรุป: คอขวดหลักคือ LINE GAS/Cold start และการรอ Network หลายทอด ไม่ใช่ GitHub Pages หรือ Supabase outage

**สิ่งที่แก้ใน Commit `2b86e33`:**

- `LeaveFormModal.jsx` และ `ApprovalPage.jsx` ยังคงรอให้ Core Database operation สำเร็จก่อนเหมือนเดิม แต่ไม่ `await` LINE ที่ระดับ UI
- LINE เริ่มส่งทันทีแบบ Background และใช้ `keepalive: true`
- **ไม่มี timeout 5 วินาทีและไม่มี AbortController** ตาม Requirement ล่าสุดของพี่ต้น เพื่อให้ LINE รอ GAS ตอบตามจริงและไม่ถูก App ยกเลิก
- Email ยังคงส่งแบบ Fire-and-forget ตาม Flow เดิม
- Popup สำเร็จแสดงหลัง Supabase สำเร็จ โดยข้อความแจ้งชัดว่า Notification กำลังส่งเบื้องหลัง
- เพิ่ม `isCompressing` และ Run ID Guard: ปุ่มส่งถูก Disable ระหว่างเตรียมรูป ป้องกันอัปโหลดไฟล์ต้นฉบับขนาดใหญ่ก่อนบีบอัดเสร็จ และป้องกันผลบีบอัดเก่ากลับมาทับไฟล์ใหม่/ไฟล์ที่ลบแล้ว
- `App.jsx` ส่ง Error ของ Approve/Reject กลับไปยัง Caller (`throw err`) เพื่อหยุด Notification และ Success Popup เมื่อ Database operation ล้มเหลว
- ไม่มีการเปลี่ยน Database schema, Dependency, ผู้อนุมัติ 3 ขั้น, โควตา, เนื้อหา LINE/Email หรือ Business workflow

**ผลยืนยันจากพี่ต้นบนมือถือจริง:**

- ข้อความส่งคำขอสำเร็จแสดงก่อนโดยไม่ต้องรอ LINE
- LINE Notification ส่งตามหลังมาติด ๆ และได้รับครบ
- Flow การยื่นลาและแจ้งเตือนทำงานถูกต้อง แต่เวลารอของผู้ใช้ลดลงชัดเจน
- Production Asset ปัจจุบัน: `index-C-71Jjmr.js`

### 3. Flow ปัจจุบันที่ต้องรักษาเมื่อพัฒนาต่อ

1. บันทึก Core data ใน Supabase ให้สำเร็จก่อน
2. หาก Supabase ล้มเหลว ต้องไม่แสดง Success และไม่เริ่ม Notification
3. หลัง Core data สำเร็จ ให้เริ่ม LINE/Email Background notification ทันที
4. UI แสดง Success โดยไม่รอ LINE GAS
5. ห้ามเพิ่ม timeout/Abort ที่ยกเลิก LINE โดยไม่ได้รับอนุมัติจากพี่ต้น
6. การส่ง LINE จาก Browser ยังเป็น Best-effort หาก Browser ถูกปิดทั้งแอปหรือ Network หลุด จึงยังไม่ใช่ Guaranteed delivery แบบ Server-side

### 4. งานที่ยังเปิดไว้สำหรับอนาคต (ยังไม่ได้ Implement)

- ย้าย `VITE_LINE_CHANNEL_ACCESS_TOKEN` ออกจาก Frontend ไปไว้ใน Backend secret/GAS Script Properties เพื่อลดความเสี่ยง Token ถูกอ่านจาก Browser bundle
- หากต้องการ Guaranteed delivery ให้ทำ Notification Outbox + Server-side worker/Edge Function พร้อม Retry
- พิจารณารวม Create/Approve/Reject/Quota เป็น Transactional RPC เพื่อลดจำนวน Network round trip และป้องกัน Partial update
- เพิ่ม Pagination ให้ `fetchAllRequests()` ซึ่งปัจจุบันโหลดคำขอทั้งหมดพร้อม Approval steps และ Attachments

### 5. สถานะ Repository ล่าสุด ณ วันที่ส่งต่อ

- Branch: `main`
- Latest application code commit: `2b86e33`
- GitHub Pages ใช้ `gh-pages`
- Build: ผ่าน (`npm run build`)
- Production verification: HTTP 200 และ Asset `index-C-71Jjmr.js` มี `keepalive`, File preparation guard และ Background notification โดยไม่พบ LINE timeout
- Working tree ก่อนแก้เอกสาร Handover: สะอาด

---

## 🎯 1. สรุปปัญหาและอาการที่พบ (Problem Statement & Symptoms)

- **อาการ:** เมื่อระบบส่งอีเมลแจ้งเตือนการลางานไปยัง Microsoft Outlook Desktop (บนระบบปฏิบัติการ Windows) ในทุกขั้นตอน (ขออนุมัติ Step 1, Step ถัดไป, แจ้งผลอนุมัติเสร็จสิ้น, แจ้งผลปฏิเสธ) ตัวการ์ดอีเมลและแถบสีน้ำเงินด้านบน (Header Banner) รวมทั้งปุ่มด้านล่าง **ขยายตัวยืดยาวเต็มความกว้างของหน้าต่าง Outlook (Edge-to-edge / Full Width)** แทนที่จะถูกล็อกความกว้างไว้ที่ประมาณ **`600px`** และจัดวางอยู่กึ่งกลางหน้าจอ (Centered)
- **ภาพประกอบหลักฐาน:** ดูได้จากภาพที่พี่ต้นแคปส่งเข้ามา:
  - `media_1790243427034.png` & `media_1790243444206.png` (รอบแรก: LEV-0765)
  - `media_1790250390501.jpg` (รอบสอง: LEV-0773 เวลา 18:44)
  - `media_1790253710267.jpg` & `media_1790253710233.jpg` (รอบสาม: LEV-0773 เวลา 19:39)

---

## 🏗️ 2. สถาปัตยกรรมการส่งอีเมลในปัจจุบัน (Current Email Architecture)

1. **Frontend (React + Vite):**
   - ไฟล์แม่แบบอีเมล: `src/services/emailService.js`
   - ฟังก์ชันสร้างเนื้อหา:
     - `buildOutlookEmailWrapper({ ... })` (โครงสร้าง HTML Shell ของอีเมลทั้งหมด)
     - `buildRequestApprovalEmail({ ... })` (อีเมลขออนุมัติ)
     - `buildApprovedEmail({ ... })` (อีเมลแจ้งอนุมัติ)
     - `buildRejectedEmail({ ... })` (อีเมลแจ้งปฏิเสธ)
   - ฟังก์ชันยิงส่งอีเมล: `sendEmailNotification({ to, subject, body })`
   - จุดเรียกใช้งาน:
     - `src/components/LeaveFormModal.jsx` (พนักงานกดยื่นใบลา -> ส่งหาผู้อนุมัติ Step 1)
     - `src/components/ApprovalPage.jsx` (ผู้อนุมัติกด Approve/Reject -> ส่งหาผู้อนุมัติขั้นถัดไป หรือส่งแจ้งพนักงาน)

2. **Backend Dispatcher (Google Apps Script):**
   - สคริปต์: `mail-service.gs`
   - Web App URL: กำหนดใน `.env` ตัวแปร `VITE_GAS_EMAIL_URL=https://script.google.com/macros/s/AKfycbyUfBU3_aGldtAOneMvPkHD4Ls5-v7RVUyM3fl2w80OY93AUVwK0SWgqi7nQdSq0G0FpQ/exec`
   - กลไก: Frontend ยิงแบบ `fetch(GAS_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ to, subject, body }) })`
   - Google Apps Script รันคำสั่ง:
     ```javascript
     MailApp.sendEmail({
       to: to,
       subject: subject,
       htmlBody: body,
       name: "Leave Management System"
     });
     ```

---

## 🧪 3. สิ่งที่แอ๊นได้ทดลองแก้ไขไปแล้ว 3 รอบ (Attempts & Results)

### 🔹 รอบที่ 1 (Commit `e852e6c`):
- **สิ่งที่ทำ:**
  - กำหนด `width="600"` และ `align="center"` บนตารางการ์ดหลัก
  - ครอบด้วย `<!--[if mso]><table width="600" ...><![endif]-->`
  - ครอบด้วย `<center>` และมีตารางนอกสุด `width="100%"`
- **ผลลัพธ์:**
  - ใน Outlook Desktop ยังคงยืดเต็มจอเหมือนเดิม (ภาพ `media_1790250390501.jpg`)
- **บทวิเคราะห์ของแอ๊น:**
  - Google Apps Script `MailApp.sendEmail` มักจะตัด HTML Comments (`<!--[if mso]>...`) ออกก่อนส่งออก ทำให้อีเมลถึงปลายทางโดยไม่มีโค้ด MSO
  - Microsoft Word Rendering Engine ใน Outlook บน Windows ไม่รองรับ CSS `max-width`

### 🔹 รอบที่ 2 (Commit `9f338e0`):
- **สิ่งที่ทำ:**
  - ใช้เทคนิค **3-Column Spacer Layout** (มาตรฐาน Litmus / Lee Munroe):
    - คอลัมน์ 1: `<td class="spacer-col">&nbsp;</td>`
    - คอลัมน์ 2: `<td width="600" align="center">...ตารางการ์ด 600px...</td>`
    - คอลัมน์ 3: `<td class="spacer-col">&nbsp;</td>`
  - ปลด Attribute `width="100%"` ออกจากตารางชั้นใน (กล่องข้อมูล และปุ่มกด)
  - เพิ่ม `Cache-Control: no-cache` ใน `index.html` เพื่อป้องกัน Browser จำ Cache เก่า
- **ผลลัพธ์:**
  - พี่ต้นทดสอบส่งใบลาเวลา 19:39 (ภาพ `media_1790253710267.jpg`) แถบสีน้ำเงินและตารางยังคงยืดเต็มจออยู่

### 🔹 รอบที่ 3 (Commit `ff5394d`):
- **สิ่งที่ทำ:**
  - สันนิษฐานว่าตารางนอกสุดที่มี `width="100%"` ทำให้ Word Engine มองเห็นว่าหน้าเอกสารเป็น 100%
  - ตัดตารางนอกสุดทิ้งทั้งหมด ให้เหลือเฉพาะ `<center>` ครอบ `<table width="600" align="center" ...>` โดยตรงโดยไม่มีตาราง 100% อีกต่อไป
- **ผลลัพธ์:**
  - Deploy ไปที่ GitHub Pages แล้ว แต่พี่ต้นแจ้งว่ายังคงเหมือนเดิม

---

## 💡 4. จุดที่น่าสงสัยและแนวทางที่ส่งต่อให้น้องจ๊ะ (Codex) ช่วยสืบสวนต่อ

น้องจ๊ะสามารถนำประเด็นเหล่านี้ไปตรวจสอบต่อได้เลยนะคะ:

1. **สืบสวนการแปลงโค้ดของ Google Apps Script (`mail-service.gs`):**
   - เมื่อส่ง HTML ผ่าน `MailApp.sendEmail({ htmlBody: ... })` ตัว Google Workspace / Gmail อาจทำการ Sanitize หรือครอบ `<div>` / ลบโครงสร้างบางอย่างออกหรือไม่?
   - ลองเปิด Outlook แล้วคลิกขวาที่อีเมล -> เลือก **"View Source" (ดูแหล่งที่มาของข้อความ)** เพื่อดูโค้ด HTML ตัวจริงที่ Outlook ได้รับ ว่าหน้าตาจริงที่ตกมาถึง Outlook กลายเป็นโค้ดอะไรกันแน่
2. **ทดสอบเอนจินของ Microsoft Word ใน Outlook (MSO Specifics):**
   - ทำไม Word Engine ถึงขยายตาราง `width="600"` ออกเต็มจอ? มี Element ใดด้านในที่ดันตารางออกหรือไม่ (เช่น `<div style="line-height: ...">`, ข้อความยาว, หรือ Padding)?
   - หรือต้องใช้เทคนิค VML (`urn:schemas-microsoft-com:vml`) หรือโครงสร้าง Wrapper ชนิดพิเศษที่ Word ยอมรับ?
3. **ตรวจสอบว่าอีเมลที่เปิดใน Outlook เป็นคำขอที่ถูกสร้างใหม่จริงหรือไม่:**
   - พี่ต้นทดสอบแก้ไขคำขอ `LEV-0773` ซ้ำ หรือยื่นคำขอใหม่? ฟังก์ชัน `onEditRequest` มีการยิงอีเมลด้วยหรือไม่ หรือยิงเฉพาะตอน `onSubmitRequest` (ใบลาใหม่)?
   - ใน `LeaveFormModal.jsx` บรรทัดที่ 373:
     ```javascript
     if (firstApprover.email && !editingRequest) {
       // สังเกตว่าถ้าเป็นการ editingRequest ระบบจะไม่ส่งอีเมลใหม่!
     }
     ```
     **จุดนี้สำคัญมาก!** ถ้าพี่ต้นกด Edit ใบลาเดิม ระบบอาจจะไม่ได้ยิงอีเมลใหม่เลย แต่พี่ต้นเปิดดูอีเมลฉบับเดิมที่เคยส่งไปแล้วหรือไม่? ตรวจสอบลำดับการยื่นใบลาใหม่ `LEV-XXXX` เลขใหม่ถอดด้ามดูค่ะ
4. **แนวทางทดแทนหาก Outlook ยังดื้อ:**
   - ออกแบบปุ่มและเนื้อหาด้านในให้เป็นแบบตารางคงที่แบบพิกเซล (`px`) 100%
   - หรือพิจารณาใช้เทมเพลตสำรวจจาก Framework อีเมลโดยเฉพาะ เช่น MJML แล้ว Compile เป็น HTML สำหรับ Outlook

---

## 📂 5. รายการไฟล์สำคัญที่เกี่ยวข้อง

| ไฟล์ | หน้าที่ |
| :--- | :--- |
| `src/services/emailService.js` | ฟังก์ชันสร้างเทมเพลตอีเมลทั้งหมด (`buildOutlookEmailWrapper`) |
| `src/components/LeaveFormModal.jsx` | หน้าฟอร์มยื่นคำขอลา (เรียก `sendEmailNotification` สำหรับ Step 1) |
| `src/components/ApprovalPage.jsx` | หน้าอนุมัติคำขอลา (เรียก `sendEmailNotification` สำหรับ Step ถัดไป/อนุมัติ/ปฏิเสธ) |
| `mail-service.gs` | สคริปต์ Google Apps Script ฝั่งรับยิงอีเมล MailApp |
| `SYSTEM_CHANGELOG.md` | บันทึกประวัติและสถาปัตยกรรมระบบ |

---

*แอ๊นบันทึกข้อมูลทุกอย่างไว้อย่างละเอียดและโปร่งใส เพื่อให้น้องจ๊ะ (Codex) และพี่ต้น นำไปตรวจสอบและแก้ไขต่อได้อย่างราบรื่นที่สุดค่ะ 💕*
