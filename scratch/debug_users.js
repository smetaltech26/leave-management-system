import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';

const supabase = createClient('https://jkndpfqefprfrnftqqxs.supabase.co', 'sb_publishable_c0Ts40rX5Pj-RI8fsBJw-Q_alrszQGF');

function excelDateToJSDate(serial) {
  if (!serial) return null;
  try {
    if (typeof serial === 'number') {
      const epoch = new Date(Math.round((serial - 25569) * 86400 * 1000));
      return epoch.toISOString();
    }
    const d = new Date(serial);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch(e) {
    return null;
  }
}

async function debugUsers() {
  const wb1 = XLSX.readFile('ระบบลางาน ออนไลน์ 2025.xlsx');
  const wb2 = XLSX.readFile('Data.xlsx');
  const usersSheet1 = XLSX.utils.sheet_to_json(wb1.Sheets['Users']);
  const usersSheet2 = XLSX.utils.sheet_to_json(wb2.Sheets['Data']);
  
  const records = usersSheet1.filter(r => r.UID && r.Username).map(r => {
      const match = usersSheet2.find(u => u.UID === r.UID) || {};
      return {
        id: r.UID,
        email: r.Username,
        password_hash: String(r.Password || '123456'),
        fullname: r.Fullname || 'Unknown',
        agency_id: r.Agency,
        department_id: r.Department,
        role: r.Role === 'SuperAdmin' ? 'Admin' : (r.Role === 'Admin' ? 'Manager' : (r.Role || 'Employee')),
        avatar_url: r.Profile || null,
        created_at: excelDateToJSDate(r.Date),
        approver_step1_id: match.UserSend1 || null,
        approver_step2_id: match.UserSend2 || null,
        approver_step3_id: match.UserSend3 || null,
        line_user_id: match.LineUserId || null,
      };
  });
  
  // Try inserting first 5 to see if error
  const { error } = await supabase.from('users').upsert(records.slice(0, 5));
  console.log("Error inserting first 5 users:", JSON.stringify(error, null, 2));

  // Check if agencies/departments exist
  const a = await supabase.from('agencies').select('id');
  console.log("Agencies in DB:", a.data.map(x=>x.id));
  const d = await supabase.from('departments').select('id');
  console.log("Depts in DB:", d.data.map(x=>x.id));
}

debugUsers();
