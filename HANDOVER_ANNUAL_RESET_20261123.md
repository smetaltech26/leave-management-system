# ใบส่งต่องาน: ฟีเจอร์รีเซ็ตข้อมูลคำขอลาขึ้นปีใหม่ (LEV-0001) & ลบไฟล์ใน Storage Bucket — 23 พฤศจิกายน 2026

> **โปรเจกต์:** Leave Management System (LMS — `smetaltech26/leave-management-system`)  
> **จัดทำโดย:** แอ๊น (Antigravity AI Assistant) ร่วมกับ พี่ต้น (P'Ton)  
> **สถานะ:** ติดตั้ง SQL Migration บน Supabase จริง และ Deploy ขึ้น GitHub Pages เรียบร้อยแล้ว

---

## 1. สถานะ Release & สภาพแวดล้อม

- **Repository / Branch:** `smetaltech26/leave-management-system` (`main` Commit `4814f59`)
- **Production URL:** https://smetaltech26.github.io/leave-management-system/
- **Production Asset:** `dist/assets/index-CKRFXzwn.js` (Published ไปยัง `gh-pages` ด้วย `npm run deploy`)
- **Supabase Project:** `jkndpfqefprfrnftqqxs` (`leave-management-system`, บัญชี `smetaltech26@gmail.com`)
- **ข้อสำคัญ:** ระหว่างการติดตั้งและตรวจรับ **ไม่มีการเรียกใช้งาน RPC รีเซ็ตหรือลบข้อมูลคำขอลา/ไฟล์แนบจริงใดๆ** ข้อมูลคำขอลาและไฟล์แนบทั้งหมดยังอยู่ครบตามปกติ

---

## 2. รายการไฟล์ที่สร้างและแก้ไข

| ไฟล์ | ประเภท | รายละเอียด |
| :--- | :--- | :--- |
| `supabase/checks/annual_reset_preflight.sql` | ไฟล์ใหม่ | สคริปต์ Read-only สำหรับตรวจนิยาม `get_next_leave_request_id()`, FK cascade, triggers, `storage.objects` policies และจำนวนแถว/ไฟล์ปัจจุบัน |
| `supabase/migrations/20261123_annual_reset_requests.sql` | ไฟล์ใหม่ | ติดตั้ง RPC `public.lms_reset_leave_requests_for_new_year(p_confirmation text)` และ RLS Policy `"Allow SuperAdmin delete attachments"` บน `storage.objects` |
| `src/services/supabaseApi.js` | แก้ไข | เพิ่ม `ANNUAL_RESET_CONFIRMATION_TEXT`, `STORAGE_PURGE_CONFIRMATION_TEXT`, `resetLeaveRequestsForNewYear()`, `listAllAttachmentStorageFiles()`, และ `purgeAttachmentStorageBucket()` (ไม่มี direct-delete fallback) |
| `src/App.jsx` | แก้ไข | เพิ่ม `handleResetLeaveRequests` (เช็ก SuperAdmin + เรียก RPC + รีเซ็ต/รีโหลด `requests` state โดยไม่แตะ state อื่น) และส่ง props `currentUser`, `requests`, `onResetLeaveRequests` ให้ `SettingsPage` |
| `src/components/SettingsPage.jsx` | แก้ไข | เพิ่มกรอบ **Danger Zone — รีเซ็ตระบบขึ้นปีใหม่** ในแท็บ **ฐานข้อมูล** เฉพาะ `SuperAdmin` พร้อมปุ่มรีเซ็ต DB, ปุ่มลบไฟล์ Storage Bucket (`attachments`), ตัวเลขสถิติปัจจุบัน และ Modal ยืนยัน 2 ชั้นตามมาตรฐาน iOS Safari (`100svh` + Portal) |
| `tests/annual-reset.test.cjs` | ไฟล์ใหม่ | Unit Tests 4 กรณีสำหรับทดสอบคำยืนยัน, RPC payload/error, ห้าม fallback, recursive Storage listing/deletion และเคส RLS บล็อก |

---

## 3. รายละเอียดฐานข้อมูลและความปลอดภัย (Verified on Live DB)

### 3.1 ผลการตรวจ Preflight บน Supabase จริง
- **`public.get_next_leave_request_id()`:** ใช้ `COALESCE(MAX(NULLIF(regexp_replace(id, '\D', '', 'g'), '')::int), 0)` และ `lpad((max_num + 1)::text, 4, '0')` → ยืนยัน 100% ว่าเมื่อลบ `public.leave_requests` ออกทั้งหมด เลขที่คำขอถัดไปจะเริ่มที่ **`LEV-0001`** ทันที (ไม่ต้องสร้าง PostgreSQL Sequence ใหม่)
- **Foreign Keys Cascade:** `public.approval_steps(request_id)` และ `public.attachments(request_id)` อ้างอิง `public.leave_requests(id)` ด้วย `ON DELETE CASCADE` ครบถ้วน
- **Storage Policies เดิม:** เดิมมีเฉพาะ `SELECT`, `INSERT`, `UPDATE` บน `storage.objects` (ยังไม่มี `DELETE` policy)

### 3.2 สิ่งที่ติดตั้งและตรวจยืนยันแล้ว
1. **RPC `public.lms_reset_leave_requests_for_new_year(p_confirmation text)`:**
   - `SECURITY DEFINER`, `SET search_path = ''`
   - ตรวจสิทธิ์ `anon_can_exec = false`, `auth_can_exec = true`
   - ล็อกสิทธิ์ภายในด้วย `auth.uid()` เทียบ `public.users.auth_id` ที่ `role = 'SuperAdmin'` เท่านั้น (`ERRCODE = '42501'`)
   - ตรวจคำยืนยันฝั่ง DB ซ้ำให้ตรงกับ **`Reset เลขที่คำขอทั้งหมดเป็น LEV-0001`** (`ERRCODE = '22023'`)
   - ล็อกตารางเฉพาะ `leave_requests`, `approval_steps`, `attachments` แบบ `ACCESS EXCLUSIVE MODE` ใน Transaction เดียว → ลบ `leave_requests` (cascade ลบ `approval_steps` & `attachments`) → ตรวจ `get_next_leave_request_id() = 'LEV-0001'` → คืน JSON สรุปผล
   - **ตารางที่ไม่ถูกแตะต้อง:** `users`, `agencies`, `departments`, `leave_types`, `user_policies`, `holidays`, `day_of_week`, `role_permissions`
2. **Storage RLS Policy `"Allow SuperAdmin delete attachments"`:**
   - ตาราง `storage.objects`, `FOR DELETE`, `TO authenticated`
   - เงื่อนไข: `bucket_id = 'attachments'` และผู้เรียกต้องมี `role = 'SuperAdmin'` ใน `public.users`
   - **ไม่แตะต้อง** Bucket `avatars` (รูปโปรไฟล์พนักงาน)

---

## 4. ผลการตรวจสอบและข้อจำกัดที่ทราบ

### ตรวจผ่านแล้ว
- **Automated Unit Tests:** `node --test tests/annual-reset.test.cjs tests/report-delete.test.cjs tests/holiday-persistence.test.cjs` → **ผ่าน 20/20 รายการ**
- **Production Build:** `npm run build` ผ่านเรียบร้อย (มีคำเตือน chunk size > 500 kB เดิมของโปรเจกต์ ไม่ใช่ Error)
- **Localhost Visual Check:** พี่ต้นตรวจหน้าตา Danger Zone บน `localhost:5173` ด้วยบัญชี SuperAdmin ยืนยันตัวเลขสถิติ (คำขอลา, ขั้นตอนอนุมัติ, เอกสารแนบ DB, จำนวนไฟล์ใน Storage Bucket) และสั่งปรับหัวข้อตัด `(1 มกราคม 2570)` ออกเรียบร้อยแล้ว
- **Flow เดิมที่ไม่กระทบ:** การยื่นคำขอลา, การอนุมัติ 3 ขั้นตอน, การคำนวณวันลา/โควตา และระบบแจ้งเตือน Email/LINE ทำงานตามเดิม 100% และการรีเซ็ตไม่ส่ง Email/LINE ใดๆ

### ข้อจำกัดที่ยังไม่ได้ทดสอบจริง
- ยังไม่ได้กดยืนยันลบข้อมูลคำขอลาจริงและไฟล์ใน Storage จริงบน Production (รอใช้งานจริงในวันขึ้นปีใหม่)
- ยังไม่ได้ทดสอบ Modal ยืนยัน 2 ชั้นบนเครื่อง iPhone Safari / Chrome จริง (ใช้โครงสร้างมาตรฐาน iOS Safari `100svh` + Portal + Safe Area ของโปรเจกต์)

---

## 5. คู่มือขั้นตอนใช้งานจริงวันขึ้นปีใหม่ (สำหรับ SuperAdmin)

1. **สำรองข้อมูลก่อนเริ่ม:** Export รายงานการลาประจำเดือน/ประจำปีจากเมนู **รายงาน** เก็บไว้ให้เรียบร้อย และแนะนำให้ทำนอกช่วงเวลาที่มีพนักงานกำลังยื่นหรืออนุมัติใบลาพร้อมกัน
2. **เข้าสู่เมนู:** ล็อกอินด้วยบัญชี **SuperAdmin** → ไปที่ **ตั้งค่าระบบ → แท็บ ฐานข้อมูล** → เลื่อนลงไปที่กรอบ **Danger Zone — รีเซ็ตระบบขึ้นปีใหม่**
3. **ขั้นที่ 1 (รีเซ็ตคำขอลาเป็น LEV-0001):**
   - ตรวจสอบตัวเลขคำขอลาปัจจุบัน → กดปุ่ม **รีเซ็ตคำขอลาขึ้นปีใหม่ (LEV-0001)**
   - พิมพ์คำยืนยันใน Modal: `Reset เลขที่คำขอทั้งหมดเป็น LEV-0001` → กดยืนยัน
   - รอข้อความยืนยันว่าเลขที่คำขอถัดไปพร้อมเริ่มที่ `LEV-0001`
4. **ขั้นที่ 2 (ล้างไฟล์แนบใน Storage Bucket — ทำหลังขั้นที่ 1):**
   - กดปุ่ม **ลบไฟล์ใน Storage Bucket**
   - พิมพ์คำยืนยันใน Modal: `ลบไฟล์แนบทั้งหมดใน Storage` → กดยืนยัน
   - ตรวจสอบว่าจำนวนไฟล์คงเหลือใน Bucket `attachments` เป็น `0 ไฟล์` (รูปโปรไฟล์ใน `avatars` จะยังคงอยู่ตามเดิม)
5. **ตั้งค่าโควตาวันลาปีใหม่:** หากต้องการตั้งโควตาวันลาประจำปีใหม่ ให้ดำเนินการที่แท็บ **โควตาวันลา** ตามขั้นตอนปกติของระบบ
