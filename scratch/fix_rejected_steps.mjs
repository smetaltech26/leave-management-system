import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials. Use --env-file=.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Fetching all rejected leave requests...");
  
  // 1. Fetch all rejected requests
  const { data: requests, error: reqError } = await supabase
    .from('leave_requests')
    .select('id')
    .eq('status', 'Rejected');
    
  if (reqError) {
    console.error("Error fetching requests:", reqError);
    return;
  }
  
  console.log(`Found ${requests.length} rejected requests.`);
  
  let totalFixed = 0;

  for (const req of requests) {
    // 2. Fetch approval steps for this request
    const { data: steps, error: stepError } = await supabase
      .from('approval_steps')
      .select('*')
      .eq('request_id', req.id)
      .order('step_number', { ascending: true });
      
    if (stepError) {
      console.error(`Error fetching steps for req ${req.id}:`, stepError);
      continue;
    }
    
    // Find the first rejected step
    const rejectedStep = steps.find(s => s.status === 'Rejected');
    if (!rejectedStep) continue;
    
    // 3. Find subsequent steps that are 'Pending'
    const stepsToUpdate = steps.filter(s => s.step_number > rejectedStep.step_number && s.status === 'Pending');
    
    if (stepsToUpdate.length > 0) {
      console.log(`Updating ${stepsToUpdate.length} pending steps for request ${req.id}...`);
      
      for (const step of stepsToUpdate) {
        const { error: updateError } = await supabase
          .from('approval_steps')
          .update({
            status: 'Rejected',
            comment: rejectedStep.comment || 'ไม่อนุมัติตามขั้นตอนก่อนหน้า (Automated)',
            action_date: rejectedStep.action_date || new Date().toISOString()
          })
          .eq('id', step.id);
          
        if (updateError) {
          console.error(`Failed to update step ${step.id}:`, updateError);
        } else {
          totalFixed++;
        }
      }
    }
  }
  
  console.log(`Finished fixing past requests. Total steps updated: ${totalFixed}`);
}

main();
