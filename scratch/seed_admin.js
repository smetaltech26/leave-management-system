import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jkndpfqefprfrnftqqxs.supabase.co';
const supabaseKey = 'sb_publishable_c0Ts40rX5Pj-RI8fsBJw-Q_alrszQGF';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedAdmin() {
  console.log("Seeding minimal data for admin access...");
  
  // 1. Insert Agency
  await supabase.from('agencies').upsert([{ id: 'AG-01', name: 'S Metal Tech' }]);
  
  // 2. Insert Department
  await supabase.from('departments').upsert([{ id: 'DP-01', name: 'บริหาร / จัดการ' }]);
  
  // 3. Insert Admin User
  const { data, error } = await supabase.from('users').upsert([{
    id: 'USER-001',
    email: 'admin@smetaltech.co.th',
    fullname: 'ผู้ดูแลระบบ (Admin)',
    agency_id: 'AG-01',
    department_id: 'DP-01',
    role: 'Admin',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    password_hash: '123456'
  }]);

  if (error) {
    console.error("Error inserting admin user:", error.message);
  } else {
    console.log("✅ Admin user seeded successfully! You can login with admin@smetaltech.co.th");
  }
}

seedAdmin();
