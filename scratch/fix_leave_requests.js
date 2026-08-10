import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jkndpfqefprfrnftqqxs.supabase.co';
const supabaseKey = 'sb_publishable_c0Ts40rX5Pj-RI8fsBJw-Q_alrszQGF';
const supabase = createClient(supabaseUrl, supabaseKey);

const leaveTypeMap = {
  'Annual': 'ลาพักร้อน',
  'Sick': 'ลาป่วย',
  'Personal': 'ลากิจได้รับค่าจ้าง',
  'Other': 'อื่นๆ'
};

async function fixLeaveRequests() {
  console.log("🚀 Starting to fix leave_requests...");

  const { data, error } = await supabase.from('leave_requests').select('id, leave_type');
  if (error) {
    console.error("Fetch error", error);
    return;
  }

  let updated = 0;
  for (const req of data) {
    if (leaveTypeMap[req.leave_type]) {
      const { error: updErr } = await supabase.from('leave_requests')
        .update({ leave_type: leaveTypeMap[req.leave_type] })
        .eq('id', req.id);
      
      if (updErr) {
        console.error("Update error for", req.id, updErr);
      } else {
        updated++;
      }
    }
  }

  console.log(`✅ Updated ${updated} leave requests successfully!`);
}

fixLeaveRequests();
