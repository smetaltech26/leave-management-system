import { createClient } from '@supabase/supabase-js';

// ค่า Supabase Live Project Credentials จาก smetaltech26@gmail.com
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jkndpfqefprfrnftqqxs.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_c0Ts40rX5Pj-RI8fsBJw-Q_alrszQGF';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};
