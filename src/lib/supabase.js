import { createClient } from '@supabase/supabase-js';

// ค่า Supabase credentials (สามารถใส่ env หรือตั้งค่าตรงนี้ได้)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummykey';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ฟังก์ชัน helper เช็คว่า supabase พร้อมใช้งานหรือไม่
export const isSupabaseConfigured = () => {
  return import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
};
