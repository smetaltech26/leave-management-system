import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';

const supabaseUrl = 'https://jkndpfqefprfrnftqqxs.supabase.co';
const supabaseKey = 'sb_publishable_c0Ts40rX5Pj-RI8fsBJw-Q_alrszQGF';
const supabase = createClient(supabaseUrl, supabaseKey);

const leaveTypeMap = {
  'Annual': 'ลาพักร้อน',
  'Sick': 'ลาป่วย',
  'Personal': 'ลากิจได้รับค่าจ้าง',
  'Other': 'ลากิจไม่ได้รับค่าจ้าง'
};

async function fixUserPolicies() {
  console.log("🚀 Starting to fix User Policies...");

  const wb = XLSX.readFile('ระบบลางาน ออนไลน์ 2025.xlsx');
  const policiesSheet = XLSX.utils.sheet_to_json(wb.Sheets['UserPolicies']);
  
  const { data: usersData, error: usersError } = await supabase.from('users').select('id');
  if (usersError) {
    console.error("Failed to fetch users", usersError);
    return;
  }
  const validUserIds = new Set(usersData.map(u => u.id));

  if (policiesSheet.length) {
    const records = policiesSheet
      .filter(r => r.UserID && validUserIds.has(r.UserID))
      .map(r => ({
        user_id: r.UserID,
        leave_type: leaveTypeMap[r.LeaveType] || r.LeaveType, // Map to Thai UI strings
        max_days: Number(r.LeaveQuota) || 0,
        used_days: 0,
        year: 2026 // or current year
      }));

    console.log(`🧹 Clearing old UserPolicies in Supabase...`);
    const { error: delError } = await supabase.from('user_policies').delete().gt('year', 0);
    if (delError) console.error("Failed to delete", delError);
    
    console.log(`⬆️ Inserting ${records.length} mapped policies...`);
    for (let i = 0; i < records.length; i += 50) {
      const { error } = await supabase.from('user_policies').upsert(
        records.slice(i, i + 50),
        { onConflict: 'user_id,leave_type,year' }
      );
      if (error) console.error("❌ Error UserPolicies batch:", error.message);
    }
    
    console.log(`✅ All User Policies Fixed successfully!`);
  }
}

fixUserPolicies();
