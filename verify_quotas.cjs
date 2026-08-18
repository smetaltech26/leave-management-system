const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function verifyQuotas() {
  console.log('Verifying quotas...');
  
  // Get all policies for 2026
  const { data: policies, error: polErr } = await supabase
    .from('user_policies')
    .select('*')
    .eq('year', 2026);

  if (polErr) {
    console.error('Error fetching policies:', polErr);
    return;
  }

  // Get all approved/pending requests for 2026
  const { data: requests, error: reqErr } = await supabase
    .from('leave_requests')
    .select('*')
    .in('status', ['Approved', 'Pending'])
    .gte('date_start', '2026-01-01')
    .lte('date_start', '2026-12-31');

  if (reqErr) {
    console.error('Error fetching requests:', reqErr);
    return;
  }

  // Calculate true usage
  const trueUsage = {};
  
  for (const req of requests) {
    const key = `${req.user_id}_${req.leave_type}`;
    if (!trueUsage[key]) {
      trueUsage[key] = 0;
    }
    trueUsage[key] += parseFloat(req.leave_duration || 0);
  }

  let mismatches = 0;
  
  for (const policy of policies) {
    const key = `${policy.user_id}_${policy.leave_type}`;
    const calculatedUsed = trueUsage[key] || 0;
    const dbUsed = parseFloat(policy.used_days || 0);
    
    if (Math.abs(calculatedUsed - dbUsed) > 0.01) {
      console.log(`Mismatch for ${key}: DB says ${dbUsed}, but actual is ${calculatedUsed}`);
      mismatches++;
    }
  }

  if (mismatches === 0) {
    console.log('All quotas are CORRECT! 100% matched.');
  } else {
    console.log(`Found ${mismatches} mismatches.`);
  }
}

verifyQuotas();
