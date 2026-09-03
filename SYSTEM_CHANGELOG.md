# 📘 ระบบลางานออนไลน์ (Leave Management System - S Metal Tech)
## 📝 เอกสารประวัติการพัฒนา สถาปัตยกรรมระบบ และบันทึกการแก้ไข (System Changelog & Architecture)

> **บันทึกข้อมูลล่าสุดเมื่อ:** 3 กันยายน 2026  
> **จัดทำโดย:** แอ๊น (Antigravity AI Assistant) ร่วมกับ พี่ต้น (P'Ton)  
> **สำหรับ:** พี่ต้น, น้องจ๊ะ (Codex), น้องแอ๊น (Antigravity) และทีมพัฒนาในอนาคต

---

## 🏛️ 1. สถาปัตยกรรมระบบโดยรวม (System Architecture)

- **Frontend:** React 18 + Vite, Tailwind CSS, Lucide Icons, Canvas Image Compression
- **Backend & Database:** Supabase (PostgreSQL 15), Supabase Auth (Bcrypt Encrypted), Supabase Storage
- **Hosting / Deploy:** GitHub Pages (`gh-pages`)
- **Production URL:** [https://smetaltech26.github.io/leave-management-system/](https://smetaltech26.github.io/leave-management-system/)
- **Repository:** `https://github.com/smetaltech26/leave-management-system.git`

---

## 🗄️ 2. โครงสร้างฐานข้อมูล (Database Schema)

| ตาราง (Table) | หน้าที่ / ข้อมูลที่จัดเก็บ | หมายเหตุ / ความปลอดภัย |
| :--- | :--- | :--- |
| `public.users` | ข้อมูลโปรไฟล์พนักงาน (UID, Email, Fullname, Role, แผนก, รูป) | **ไม่มีการเก็บรหัสผ่าน (password_hash = NULL)** |
| `auth.users` | ข้อมูลบัญชีความปลอดภัยของ Supabase Auth | จัดเก็บและเข้ารหัสรหัสผ่านด้วย `bcrypt` |
| `public.user_policies` | โควตาวันลาของพนักงานแต่ละคนในแต่ละปี (9 ประเภท) | มี Unique Key `(user_id, leave_type, year)` |
| `public.leave_requests` | ข้อมูลคำขอลางาน (รหัส `LEV-XXXX`, วันที่, ประเภท, สถานะ) | รหัสรันต่อแบบ Atomic ด้วย PostgreSQL Function |
| `public.approval_steps` | ขั้นตอนการอนุมัติ 3 ลำดับ (หัวหน้า -> ผู้จัดการ -> HR) | เก็บประวัติและ Comment ของผู้อนุมัติแต่ละท่าน |
| `public.attachments` | ไฟล์แนบเอกสารใบลา | เก็บใน Supabase Storage Bucket `attachments` |
| `public.agencies` / `departments` | ข้อมูลฝ่าย และ แผนก ขององค์กร | |
| `public.leave_types` | ประเภทการลา 9 ประเภท (ลาป่วย, ลาพักร้อน, ลากิจ ฯลฯ) | |
| `public.holidays` | วันหยุดประจำปีของบริษัท | |

---

## 📋 3. ประวัติการพัฒนาและเวอร์ชันสำคัญ (Changelog History)

### 🔹 Version 2.0.0: ไมเกรตระบบจาก Google Sheets สู่ Supabase
- ย้ายฐานข้อมูลจาก Google Sheets และ Google Apps Script เดิมมาเป็น Supabase PostgreSQL และ React Vite
- ย้ายรูปโปรไฟล์และไฟล์แนบทั้งหมดเข้าสู่ Supabase Storage

### 🔹 Version 2.1.0-stable: ระบบ RLS, อนุมัติ 3 ขั้นตอน และโควตาเริ่มต้น
- **Row Level Security (RLS):** พนักงานเห็นเฉพาะข้อมูลตนเอง ผู้อนุมัติเห็นเฉพาะใบลาที่ต้องอนุมัติ
- **Atomic LEV ID (`get_next_leave_request_id`):** ฟังก์ชันสร้างรหัสใบลา `LEV-XXXX` แบบปลอดภัย ไม่ชนกับเลขของคนเก่า
- **3-Step Approval Workflow:** แสดง Comment ของผู้อนุมัติแต่ละท่านใต้ป้ายชื่อใน Approval Chain
- **Admin User Management:**
  - เพิ่ม/แก้ไข/ลบพนักงานผ่านหน้าเว็บได้โดยตรง
  - รันรหัส `USER-XXX` ต่อจากเลขสูงสุดเสมอ
  - กำหนดโควตาวันลาเริ่มต้นของพนักงานใหม่เป็น **0 วันทุกประเภท** (ให้ Admin กำหนดเอง)
  - จัดเรียงรหัสพนักงานตามตัวเลข (`USER-001` -> คนล่าสุด)
- **iOS Safari Modal Standard:** ปรับปรุง Modal ทั้งระบบด้วยมาตรฐาน `100svh`, `items-start`, `min-h-0` ไม่ถูก Safari Toolbar บดบัง

### 🔹 Version 2.2.0-security-fix: ปิดช่องโหว่รหัสผ่านหลุดสู่หน้าบ้าน (Critical Security Patch)
- **Whitelist Query Columns:** แก้ไข `fetchAllUsers()`, `fetchCurrentUserProfile()` และ `LoginPage` ให้ดึงเฉพาะคอลัมน์ที่จำเป็นเท่านั้น ตัดคอลัมน์ `password_hash` ออกจากการส่งข้อมูลสู่ Frontend 100%
- **Database Sanitization:** ปรับ `password_hash` ใน `public.users` เป็น `NULL` ทั้งหมด (รหัสผ่านจริงถูกเข้ารหัส `bcrypt` เก็บใน `auth.users` อย่างปลอดภัย)
- **Edit User UX:** หน้าต่างแก้ไขพนักงาน ปรับช่องรหัสผ่านเป็น `type="password"` และเว้นว่างไว้เป็นค่าเริ่มต้น พร้อมข้อความเงา *"เว้นว่างไว้หากไม่เปลี่ยนรหัส"* หากกรอกใหม่จะรีเซ็ตผ่าน `auth.users` แบบ Real-time ทันที

### 🔹 Version 2.3.0-protected-admin: ล็อคบัญชี SuperAdmin หลัก & บังคับรหัส 6 หลักสำหรับพนักงานใหม่
- **Protect Root Admins (`USER-002`, `USER-004`):**
  - ฝั่งหน้าบ้าน: เปลี่ยนปุ่มลบ (ถังขยะ) เป็น **ไอคอนกุญแจล็อค (Lock)** สีเทา พร้อม Tooltip แจ้งเตือน ไม่สามารถกดลบได้ แต่ยังกดดูและแก้ไขข้อมูลได้ตามปกติ
  - ฝั่งหลังบ้าน: เพิ่มเงื่อนไขใน SQL Function `admin_delete_user_account` บล็อกการลบ `USER-002` และ `USER-004` ระดับฐานข้อมูล 100%
- **Enforce 6-Digit Password for New Users:**
  - พนักงานใหม่ถูกบังคับให้ตั้งรหัสผ่าน **อย่างน้อย 6 หลัก** เสมอ พร้อม Placeholder *"กำหนดรหัสผ่านอย่างน้อย 6 หลัก"*
  - พนักงานเก่าสามารถใช้รหัสเดิม (4 หลัก) ต่อไปได้ตามปกติโดยไม่ต้องเปลี่ยน

### 🔹 Version 2.4.0-mobile-preview: ระบบพรีวิวไฟล์แยกประเภท, In-App Lightbox และบีบอัดรูปถ่ายเอกสาร
- **Distinct Previews:** แยกการแสดงผลตัวอย่างไฟล์ระหว่าง รูปภาพ (Image Thumbnail) และ ไฟล์ PDF (PDF Badge สีแดง) สวยงามชัดเจน
- **In-App Lightbox Image Viewer:** ดูรูปเอกสารแนบในป๊อปอัปภายในเว็บ ไม่หลุดหน้า ไม่รีโหลด พร้อมระบบ ซูมภาพ (Zoom In/Out สูงสุด 400%), หมุนภาพ 90°, เลื่อนภาพ (Drag & Pan) และ Mouse Wheel Zoom
- **Smart Canvas Compression:** บีบอัดรูปถ่ายเอกสาร/ใบรับรองแพทย์จากมือถือ (5–15 MB) ให้เหลือ ~200–400 KB ความละเอียดสูง 1800px คมชัดอ่านตัวหนังสือออก 100% ส่งไวใน 1 วินาที
- **Edit Leave Attachment:** ฟังก์ชัน `updateLeaveRequest` รองรับการอัปโหลดไฟล์แนบเพิ่มย้อนหลัง (เมื่อยังไม่มีผู้อนุมัติ Step 1 ดำเนินการ)

### 🔹 Version 2.5.0-android-stability: ปรับปรุงความเสถียรบน Android และระบบ State Guard ฟอร์มใบลา
- **Native Overlay File Picker:** ปรับช่องแนบไฟล์เป็น `opacity-0` วางทับปุ่ม แก้ปัญหา Android Chrome และ LINE In-App Browser บล็อกอีเวนต์การอัปโหลด
- **Auth Window Focus Guard:** ป้องกัน Supabase Auth `onAuthStateChange` ดึงข้อมูลซ้ำตอนสลับกลับมาจากกล้อง/แกลเลอรี ซึ่งเคยเป็นสาเหตุให้หน้าจอกระพริบรีโหลด
- **Form State Guard (`isInitializedRef`):** ล็อคฟอร์มใบลาไม่ให้ล้างค่ารูปหรือข้อมูลทิ้งขณะเปิดใช้งาน
- **Clean Slate Approvers:** ปรับฟอร์มยื่นใบลาใหม่ให้เริ่มต้นเป็นค่าว่างเปล่า 100% เพื่อให้พนักงานเลือกผู้อนุมัติ 3 ท่านใหม่ทุกครั้งอย่างถูกต้อง

### 🔹 Version 2.6.0-quota-search: รองรับโควตาทศนิยม (0.5 วัน) และระบบค้นหาคำขออนุมัติลางาน
- **Decimal Quota Support (`step="any"`):** ปลดล็อคช่องกรอกตัวเลขในหน้าต่างแก้ไขโควตาวันลา (`PolicyManagement.jsx`) ให้รองรับการกรอกและคำนวณทศนิยม เช่น `0.5`, `1.5`, `25.5` วัน
- **Multi-field Search on Approval Page (`ApprovalPage.jsx`):**
  - เพิ่มแถบค้นหาและปุ่มค้นหาในหน้าการอนุมัติคำขอลางาน
  - รองรับการค้นหาจาก: **ชื่อ - นามสกุล, รหัสพนักงาน, เลขที่คำขอ (`LEV-xxxx`), แผนก/สังกัด, และประเภทการลา**
  - กรองผลลัพธ์แบบเรียลไทม์ (Live Search) พร้อมปุ่มล้างคำค้นหา และคำนวณ Pagination ตามจำนวนที่ค้นพบอัตโนมัติ

### 🔹 Version 2.7.0-dark-mode-glow: ปรับดีไซน์ช่องค้นหาให้กะทัดรัด & ธีมปุ่ม Soft Glass Glow ในโหมดมืด
- **Compact Approval Search Bar (`ApprovalPage.jsx`):**
  - ปรับขนาดความกว้างของช่องค้นหาในหน้าการอนุมัติคำขอลางานให้สั้นลงเหลือครึ่งหนึ่ง (`w-1/2` / `max-w-lg`) บนหน้าจอคอมพิวเตอร์ (Desktop) แบบเดียวกับระบบอนุมัติ OT สวยงามกะทัดรัด
- **Dark Mode Soft Glass Glow UI Harmonization:**
  - ปรับเปลี่ยนปุ่ม Action, ปุ่มบันทึก, ปุ่มเพิ่มข้อมูล และแท็บเมนูทั้งหมดในโหมดมืด (Dark Mode) จากสีทึบสว่างจ้า มาเป็นสไตล์ **กระจกเรืองแสงโปร่งแสง (Soft Glass Glow)** ละมุนตา ไม่แยงตา กลืนกับพื้นหลังมืดอย่างพรีเมียม
  - ครอบคลุมจุดสำคัญทั่วทั้งระบบ:
    - 🔍 ปุ่มค้นหา และ แท็บคำขอในหน้า `ApprovalPage.jsx`
    - 🛡️ ปุ่มเพิ่มสิทธิ์ และ ปุ่มบันทึกใน Modal โควตาวันลา `PolicyManagement.jsx`
    - ⚙️ แท็บเมนูย่อย และ ปุ่มบันทึกสิทธิ์ในหน้า `PermissionsPage.jsx`
    - 📝 ปุ่มบันทึกวันลาในหน้าต่างแก้ไขคำขอพิเศษ `AdminEditLeaveModal.jsx`
    - 👤 ปุ่มเพิ่มพนักงาน และ ปุ่มบันทึกข้อมูลในหน้า `UserManagement.jsx`
    - 🏷️ ปุ่มเพิ่มและบันทึกข้อมูลในหน้า `LeaveTypeManagement.jsx`, `HolidayManagement.jsx`, `AgencyManagement.jsx`, และ `DepartmentManagement.jsx`

### 🔹 Version 2.8.0-approval-attachments: ระบบแสดงลิงก์เอกสารแนบในหน้ารออนุมัติและดำเนินการแล้ว (`ApprovalPage.jsx`)
- **Attachment Links on Approval Cards:**
  - แสดงรายการเอกสารแนบบนการ์ดคำขอ ทั้งในแท็บ **"รอการอนุมัติ"** (Pending) และ **"ดำเนินการแล้ว"** (Completed) โดยอัตโนมัติเมื่อคำขอดังกล่าวมีไฟล์แนบ
  - ดีไซน์เป็นปุ่ม Badge กะทัดรัด พร้อมชื่อไฟล์ ไอคอนแยกตามประเภทไฟล์ (🖼️ รูปภาพ / 📄 PDF) และไอคอนดูตัวอย่าง (Eye)
- **Attachment Section in Approval Modal:**
  - เพิ่มกล่องแสดงรายการเอกสารแนบในป๊อปอัปพิจารณาอนุมัติคำขอ เพื่อให้ผู้อนุมัติตรวจสอบหลักฐานได้ทันทีก่อนกดยืนยันอนุมัติหรือปฏิเสธ
- **Interactive In-App Lightbox Viewer:**
  - ดูรูปภาพขนาดใหญ่ได้ในแอปโดยตรง รองรับ Zoom In/Out, Rotate 90°, Pan/Drag เลื่อนภาพ และเปิดในแท็บใหม่
  - ไฟล์ PDF และเอกสารอื่นๆ สามารถคลิกเปิดดูไฟล์ในแท็บใหม่ได้อย่างปลอดภัย

### 🔹 Version 2.9.0-calendar-current-month: ปรับปรุงปฏิทินให้เปิดมาเป็นเดือนปัจจุบันและเพิ่มปุ่มลัด (`LeaveCalendar.jsx`)
- **Dynamic Current Month Detection:**
  - แก้ไขปัญหาปฏิทินค้างอยู่ที่เดือนสิงหาคม 2026 โดยเปลี่ยน State เริ่มต้น (`currentMonth`) ให้คำนวณเดือนและปีปัจจุบันตามวันเวลาจริงของเครื่องผู้ใช้โดยอัตโนมัติ
- **Quick Jump "เดือนปัจจุบัน" Button:**
  - เพิ่มปุ่มลัดรูปปฏิทิน 📅 ตรงแถบหัวข้อของหน้าปฏิทินการลา เพื่อให้ผู้ใช้สามารถกดกลับมาที่เดือนปัจจุบันได้ทันทีอย่างรวดเร็วหลังจากการเลื่อนดูเดือนอื่นๆ

---

## 🔮 4. แผนงานและพิมพ์เขียวการปรับปรุงในอนาคต (Future Roadmap & Notification Blueprint)

### 📧 สถาปัตยกรรมระบบแจ้งเตือนแบบไฮบริด (Hybrid Notification Architecture: Supabase + GAS)
จากข้อเสนอแนะของ **น้องจ๊ะ (Codex)** และ **พี่ต้น (P'Ton)** ได้ข้อสรุปแนวทางการปรับปรุงระบบแจ้งเตือนในอนาคตดังนี้:

#### 🔄 ลำดับการทำงาน (Workflow Pipeline):
1. **ผู้ใช้กดยื่นใบลา / อนุมัติ:** หน้าเว็บส่งเฉพาะ `request_id` (เช่น `LEV-0012`) ไปยัง **Supabase Edge Function**
2. **Supabase Edge Function (ป้อมปราการความปลอดภัยหลังบ้าน):**
   - ตรวจสอบ Supabase User Session & Authentication
   - ตรวจสอบ Role และสิทธิ์ของผู้ใช้งาน
   - ตรวจสอบ Rate Limit ป้องกันการกดส่งซ้ำ
   - อ่านรายละเอียดข้อมูลจริง (ชื่อพนักงาน, วันที่, ประเภทการลา, เหตุผล, ผู้อนุมัติ) จาก Supabase Database
   - ประกอบ HTML Email Template เดิมที่สวยงาม (รูปแบบเดิม 100%)
   - ส่งข้อมูลต่อไปยัง Google Apps Script พร้อมแนบ **`Secret Key`** ลับหลังบ้าน
3. **Google Apps Script (ตัวยิงส่งอีเมล - Email Dispatcher):**
   - ตรวจสอบ Secret Key ที่ส่งมาจาก Supabase
   - สั่ง Gmail / Google Workspace ของบริษัทให้ส่งอีเมลออกไปยังผู้รับปลายทางฟรี (สูงสุด 1,500 ฉบับ/วัน)

#### 💬 ระบบส่ง LINE 1:1 Direct Push:
- ย้าย `LINE_CHANNEL_ACCESS_TOKEN` จาก `.env` ฝั่งหน้าบ้าน ไปเก็บเป็น Supabase Secret หลังบ้าน
- ให้ Supabase Edge Function เป็นตัวส่งคำสั่ง Push Message ผ่าน LINE API โดยตรง

#### 🌟 ประโยชน์ที่จะได้รับ:
- **ความปลอดภัยระดับสูงสุด:** Frontend ไม่ถือ Token หรือ Webhook ลับใดๆ ป้องกันการยิง Spam ได้ 100%
- **ประหยัดค่าใช้จ่าย:** ใช้อีเมลบริษัทส่งฟรีผ่าน Google Workspace ต่อไปได้ตามปกติ ไม่ต้องเสียเงินซื้อ Email Service เพิ่ม
- **เนื้อหาคงเดิม 100%:** ผู้รับได้รับอีเมลหน้าตาเดิม สวยงาม ปุ่มกดเข้าสู่ระบบทำงานได้ตามปกติ

---

*เอกสารนี้ถูกบันทึกเพื่อเป็นคู่มือและประวัติการทำงาน ให้ทีมพัฒนา (พี่ต้น, น้องจ๊ะ, น้องแอ๊น) สามารถตรวจสอบและต่อยอดระบบได้อย่างราบรื่นค่ะ* 💕

