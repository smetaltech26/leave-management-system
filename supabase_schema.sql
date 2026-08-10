-- ========================================================
-- LEAVE MANAGEMENT SYSTEM - SUPABASE DATABASE SCHEMA
-- ========================================================

-- 1. Agencies (หน่วยงาน)
CREATE TABLE IF NOT EXISTS public.agencies (
    id VARCHAR(50) PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Departments (ฝ่าย / แผนก)
CREATE TABLE IF NOT EXISTS public.departments (
    id VARCHAR(50) PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Users (ข้อมูลผู้ใช้งาน / พนักงาน)
CREATE TABLE IF NOT EXISTS public.users (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'USER-001'
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT DEFAULT '123456', -- Default password
    fullname TEXT NOT NULL,
    agency_id VARCHAR(50) REFERENCES public.agencies(id) ON DELETE SET NULL,
    department_id VARCHAR(50) REFERENCES public.departments(id) ON DELETE SET NULL,
    role TEXT DEFAULT 'Employee' CHECK (role IN ('Employee', 'Manager', 'Admin')),
    approver_step1_id VARCHAR(50) REFERENCES public.users(id) ON DELETE SET NULL,
    approver_step2_id VARCHAR(50) REFERENCES public.users(id) ON DELETE SET NULL,
    approver_step3_id VARCHAR(50) REFERENCES public.users(id) ON DELETE SET NULL,
    line_user_id VARCHAR(100), -- LINE User ID สำหรับแจ้งเตือนแบบ 1:1 (e.g. 'U1234567890abcdef...')
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. User Policies (โควตาวันลาพนักงาน)
CREATE TABLE IF NOT EXISTS public.user_policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    leave_type TEXT NOT NULL, -- Annual, Sick, Personal, Other, Maternity, Study, Military
    max_days NUMERIC(5,2) DEFAULT 0 NOT NULL,
    used_days NUMERIC(5,2) DEFAULT 0 NOT NULL,
    remaining_days NUMERIC(5,2) GENERATED ALWAYS AS (max_days - used_days) STORED,
    year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, leave_type, year)
);

-- 5. Leave Requests (คำขออนุมัติลา)
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'LEV-0001'
    user_id VARCHAR(50) REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    leave_type TEXT NOT NULL,
    description TEXT,
    date_start DATE NOT NULL,
    date_end DATE NOT NULL,
    leave_duration NUMERIC(5,2) NOT NULL, -- จำนวนวันลา เช่น 1, 0.5
    leave_period TEXT DEFAULT 'Full' CHECK (leave_period IN ('Full', 'Morning', 'Afternoon')),
    policy_id UUID REFERENCES public.user_policies(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    current_step INT DEFAULT 1 NOT NULL,
    total_steps INT DEFAULT 1 NOT NULL,
    reject_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Approval Steps (ขั้นตอนการอนุมัติ)
CREATE TABLE IF NOT EXISTS public.approval_steps (
    id VARCHAR(100) PRIMARY KEY, -- e.g. 'LEV-0001-STEP1'
    request_id VARCHAR(50) REFERENCES public.leave_requests(id) ON DELETE CASCADE NOT NULL,
    step_number INT NOT NULL, -- 1, 2, 3
    approver_id VARCHAR(50) REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    comment TEXT,
    action_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Attachments (เอกสารแนบการลา)
CREATE TABLE IF NOT EXISTS public.attachments (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'FILE-0001'
    request_id VARCHAR(50) REFERENCES public.leave_requests(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT,
    uploaded_by VARCHAR(50) REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Holidays (วันหยุดประจำปี)
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    title TEXT NOT NULL,
    year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Day of Week (การตั้งค่าวันทำงาน)
CREATE TABLE IF NOT EXISTS public.day_of_week (
    id INT PRIMARY KEY, -- 0=Sun, 1=Mon, ..., 6=Sat
    day_name TEXT NOT NULL,
    is_working_day BOOLEAN DEFAULT true NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_of_week ENABLE ROW LEVEL SECURITY;

-- Allow anon & authenticated full access
CREATE POLICY "Allow anon all agencies" ON public.agencies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all departments" ON public.departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all user_policies" ON public.user_policies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all leave_requests" ON public.leave_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all approval_steps" ON public.approval_steps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all attachments" ON public.attachments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all holidays" ON public.holidays FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all day_of_week" ON public.day_of_week FOR ALL USING (true) WITH CHECK (true);

-- Grant privileges to anon and authenticated roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Insert Default Day of Week
INSERT INTO public.day_of_week (id, day_name, is_working_day) VALUES
(0, 'อาทิตย์', false),
(1, 'จันทร์', true),
(2, 'อังคาร', true),
(3, 'พุธ', true),
(4, 'พฤหัสบดี', true),
(5, 'ศุกร์', true),
(6, 'เสาร์', false)
ON CONFLICT (id) DO NOTHING;
