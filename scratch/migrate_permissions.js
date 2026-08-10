import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';

const supabaseUrl = 'https://jkndpfqefprfrnftqqxs.supabase.co';
const supabaseKey = 'sb_publishable_c0Ts40rX5Pj-RI8fsBJw-Q_alrszQGF';
const supabase = createClient(supabaseUrl, supabaseKey);

async function migratePermissions() {
  console.log("🚀 Starting Permissions & Roles Migration...");

  const wb = XLSX.readFile('ระบบลางาน ออนไลน์ 2025.xlsx');
  
  // 1. นำเข้า Role Permissions
  console.log("📂 Loading UsersMenu...");
  const menuSheet = XLSX.utils.sheet_to_json(wb.Sheets['UsersMenu']);
  
  if (menuSheet.length > 0) {
    const records = menuSheet.map(r => ({
      id: r.MenuItems, // e.g., sidebarManu1
      menu_name: r['เมนู'],
      "SuperAdmin": r.SuperAdmin === true || r.SuperAdmin === 'TRUE',
      "Admin": r.Admin === true || r.Admin === 'TRUE',
      "SuperUser": r.SuperUser === true || r.SuperUser === 'TRUE',
      "User": r.User === true || r.User === 'TRUE',
    }));
    
    // Clear and insert
    await supabase.from('role_permissions').delete().neq('id', '0');
    const { error: permError } = await supabase.from('role_permissions').upsert(records);
    
    if (permError) {
      console.error("❌ Error migrating permissions:", permError);
      return;
    }
    console.log(`✅ Migrated ${records.length} Permissions`);
  }

  // 2. อัปเดต Role ของ Users ให้ตรงกับ Excel (SuperAdmin, Admin, etc.)
  console.log("📂 Loading Users to restore roles...");
  const usersSheet = XLSX.utils.sheet_to_json(wb.Sheets['Users']);
  
  let updateCount = 0;
  for (const row of usersSheet) {
    if (!row.UID || !row.Role) continue;
    
    // Keep exact role from Excel (SuperAdmin, Admin, SuperUser, User)
    const { error } = await supabase.from('users').update({ role: row.Role }).eq('id', row.UID);
    if (error) {
      console.error(`❌ Failed to update role for ${row.UID}:`, error.message);
    } else {
      updateCount++;
    }
  }
  
  console.log(`✅ Restored original roles for ${updateCount} Users`);
  console.log("🎉 Migration Complete!");
}

migratePermissions();
