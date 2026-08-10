const { createClient } = require('@supabase/supabase-js');


const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jkndpfqefprfrnftqqxs.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_c0Ts40rX5Pj-RI8fsBJw-Q_alrszQGF';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function recalculateQuotas() {
  try {
    console.log('Fetching data...');
    // 1. Fetch all user policies
    const { data: policies, error: polErr } = await supabase.from('user_policies').select('*');
    if (polErr) throw polErr;

    // 2. Fetch all leave requests
    const { data: requests, error: reqErr } = await supabase.from('leave_requests').select('*');
    if (reqErr) throw reqErr;

    // 3. Fetch all approval steps
    const { data: steps, error: stepErr } = await supabase.from('approval_steps').select('*');
    if (stepErr) throw stepErr;

    console.log(`Found ${policies.length} policies, ${requests.length} requests, ${steps.length} approval steps.`);

    let updateCount = 0;

    // Iterate through each policy
    for (const policy of policies) {
      // Find all requests for this user and this leave type
      const userRequests = requests.filter(r => r.user_id === policy.user_id && r.leave_type === policy.leave_type);
      
      let actualUsedDays = 0;

      for (const req of userRequests) {
        // Check if there is a step 3 that is 'Approved' for this request
        const step3 = steps.find(s => s.request_id === req.id && s.step_number === 3);
        if (step3 && step3.status === 'Approved') {
          actualUsedDays += Number(req.leave_duration);
        }
      }

      // If the actual used days differs from current used_days, update it
      if (policy.used_days !== actualUsedDays) {
        console.log(`Updating ${policy.user_id} - ${policy.leave_type}: from ${policy.used_days} to ${actualUsedDays}`);
        
        const { error: updateErr } = await supabase
          .from('user_policies')
          .update({ used_days: actualUsedDays })
          .eq('id', policy.id);
          
        if (updateErr) {
          console.error(`Failed to update ${policy.id}:`, updateErr);
        } else {
          updateCount++;
        }
      }
    }

    console.log(`Successfully recalculated quotas. Updated ${updateCount} records.`);
  } catch (error) {
    console.error('Error:', error);
  }
}

recalculateQuotas();
