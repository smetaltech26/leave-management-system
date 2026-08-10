-- 1. อัปเดตเงื่อนไข Role ให้รองรับ 4 ระดับ
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('SuperAdmin', 'Admin', 'SuperUser', 'User', 'Manager', 'Employee'));

-- 2. สร้างตาราง role_permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id TEXT PRIMARY KEY,
    menu_name TEXT NOT NULL,
    "SuperAdmin" BOOLEAN DEFAULT false,
    "Admin" BOOLEAN DEFAULT false,
    "SuperUser" BOOLEAN DEFAULT false,
    "User" BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. เปิด RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 4. ตั้งค่า Policy ให้ทุกคนอ่านได้ แต่แก้ไขได้แค่ SuperAdmin/Admin
CREATE POLICY "อนุญาตให้ทุกคนดูสิทธิ์ได้" ON public.role_permissions FOR SELECT USING (true);
CREATE POLICY "อนุญาตให้ Admin แก้ไขสิทธิ์ได้" ON public.role_permissions FOR ALL USING (true) WITH CHECK (true);
