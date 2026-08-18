const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function cleanupDb() {
  console.log('Cleaning up DB...');
  
  // 1. Set current_step = 3 for Approved
  const { data: appData, error: appErr } = await supabase
    .from('leave_requests')
    .update({ 
      current_step: 3,
      reject_reason: null
    })
    .eq('status', 'Approved');

  if (appErr) {
    console.error('Error updating Approved requests:', appErr);
  } else {
    console.log('Successfully updated Approved requests.');
  }

  // 2. Ensure current_step = total_steps for Rejected (optional, usually Rejected stays at the step it was rejected, but let's check what the user wants)
  // The user said: "clear current_step เป็น 3 กรณีอุนมัติแล้วและ reject_reason ให้เป็น NULL สำหรับคำขอที่ถูกปฏิเสธ (Rejected) จริงๆ แอ๊นละเว้นเอาไว้ไม่ได้ล้างค่า ด้วย"
  
  console.log('Done!');
}

cleanupDb();
