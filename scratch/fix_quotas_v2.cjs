const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jkndpfqefprfrnftqqxs.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_c0Ts40rX5Pj-RI8fsBJw-Q_alrszQGF';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchAll(table) {
  let allData = [];
  let from = 0;
  const step = 1000;
  
  while (true) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + step - 1);
    if (error) throw error;
    if (data.length === 0) break;
    allData = allData.concat(data);
    if (data.length < step) break;
    from += step;
  }
  return allData;
}

async function recalculateQuotas() {
  try {
    console.log('Fetching all data (handling pagination)...');
    
    const policies = await fetchAll('user_policies');
    const requests = await fetchAll('leave_requests');
    const steps = await fetchAll('approval_steps');

    console.log(`Found ${policies.length} policies, ${requests.length} requests, ${steps.length} approval steps.`);

    let updateCount = 0;

    for (const policy of policies) {
      // Note: We should filter requests by the same year as the policy.
      // Assuming policy.year is something like 2026.
      // request.date_start starts with '2026-'
      const policyYear = String(policy.year);
      
      const userRequests = requests.filter(r => 
        r.user_id === policy.user_id && 
        r.leave_type === policy.leave_type &&
        (r.date_start && r.date_start.startsWith(policyYear)) // Only count requests for the matching year
      );
      
      let actualUsedDays = 0;

      for (const req of userRequests) {
        // Check if there is a step 3 that is 'Approved' for this request
        const step3 = steps.find(s => s.request_id === req.id && s.step_number === 3);
        if (step3 && step3.status === 'Approved') {
          actualUsedDays += Number(req.leave_duration);
        }
      }

      if (policy.used_days !== actualUsedDays) {
        console.log(`Updating ${policy.user_id} - ${policy.leave_type} (${policyYear}): from ${policy.used_days} to ${actualUsedDays}`);
        
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
