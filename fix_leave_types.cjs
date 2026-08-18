const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const leaveTypeMap = {
  'Annual': 'ลาพักร้อน',
  'Sick': 'ลาป่วย',
  'Personal': 'ลากิจได้รับค่าจ้าง',
  'Other': 'ลาอื่นๆ',
  'Maternity': 'ลาคลอด',
  'Military': 'ลาทหาร'
};

async function fixLeaveTypes() {
  console.log("Fixing leave types in leave_requests...");
  
  for (const [eng, thai] of Object.entries(leaveTypeMap)) {
    const { data, error, count } = await supabase
      .from('leave_requests')
      .update({ leave_type: thai })
      .eq('leave_type', eng)
      .select();
      
    if (error) {
      console.error(`Error updating ${eng} to ${thai}:`, error);
    } else {
      console.log(`Updated ${data.length} requests from '${eng}' to '${thai}'`);
    }
  }

  // Also fix user_policies just in case any English policies were accidentally created
  for (const [eng, thai] of Object.entries(leaveTypeMap)) {
    const { data, error } = await supabase
      .from('user_policies')
      .update({ leave_type: thai })
      .eq('leave_type', eng)
      .select();
      
    if (error) {
      console.error(`Error updating policy ${eng} to ${thai}:`, error);
    } else {
      console.log(`Updated ${data.length} policies from '${eng}' to '${thai}'`);
    }
  }

  console.log("Recalculating quotas (used_days) for 2026 with correct Thai names...");
  
  // Reset all used_days to 0
  await supabase.from('user_policies').update({ used_days: 0 }).eq('year', 2026);
  
  // Fetch policies
  const { data: policies } = await supabase.from('user_policies').select('*').eq('year', 2026);
  
  // Fetch valid requests
  const { data: validRequests } = await supabase.from('leave_requests')
    .select('user_id, leave_type, leave_duration')
    .in('status', ['Approved', 'Pending']);
    
  const usedDaysMap = {};
  for (const r of validRequests) {
    const key = `${r.user_id}_${r.leave_type}`;
    if (!usedDaysMap[key]) usedDaysMap[key] = 0;
    usedDaysMap[key] += Number(r.leave_duration);
  }
  
  let updatedCount = 0;
  for (const p of policies) {
    const key = `${p.user_id}_${p.leave_type}`;
    const calculatedUsed = usedDaysMap[key] || 0;
    
    if (Number(p.used_days) !== calculatedUsed) {
      await supabase.from('user_policies')
        .update({ used_days: calculatedUsed })
        .eq('id', p.id);
      updatedCount++;
    }
  }
  console.log(`Recalculation done. Updated ${updatedCount} policies with new quotas.`);
}

fixLeaveTypes().catch(console.error);
