# 📘 ระบบลางานออนไลน์ (Leave Management System - S Metal Tech)
## 📝 เอกสารประวัติการพัฒนา สถาปัตยกรรมระบบ และบันทึกการแก้ไข (System Changelog & Architecture)

> **บันทึกข้อมูลล่าสุดเมื่อ:** 24 สิงหาคม 2026  
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

---

## 🔮 4. แผนงานและข้อเสนอแนะสำหรับการปรับปรุงในอนาคต (Future Roadmap)

1. **📧 ยกระดับความปลอดภัยระบบส่งอีเมล (Email Webhook Hardening):**
   - *สถานะปัจจุบัน:* ใช้ Google Apps Script Webhook (`VITE_GAS_EMAIL_URL`) แบบ Unauthenticated
   - *แผนปรับปรุง:* ใส่ Secret API Key ในการเรียก Webhook หรือย้ายไปใช้ **Supabase Edge Functions / Resend API** เพื่อตัดการพึ่งพา Google Apps Script 100%
2. **💬 ย้าย LINE Token ไปไว้ฝั่งหลังบ้าน (LINE Access Token Security):**
   - *สถานะปัจจุบัน:* โทเคน `VITE_LINE_CHANNEL_ACCESS_TOKEN` อยู่ในไฟล์ `.env` ฝั่ง Client
   - *แผนปรับปรุง:* ย้ายการยิงส่ง LINE 1:1 Push Message ไปทำผ่าน **Supabase Database Trigger / Edge Functions** เพื่อไม่ให้มี Token หลุดอยู่ที่ฝั่ง Client

---

*เอกสารนี้ถูกบันทึกเพื่อเป็นคู่มือและประวัติการทำงาน ให้ทีมพัฒนาสามารถตรวจสอบและต่อยอดระบบได้อย่างราบรื่นค่ะ* 💕
