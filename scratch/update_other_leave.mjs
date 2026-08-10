import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials. Use --env-file=.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Fetching all users...");
  const { data: users, error: userError } = await supabase.from('users').select('id');
  
  if (userError) {
    console.error("Error fetching users:", userError);
    return;
  }
  
  console.log(`Found ${users.length} users.`);
  
  const currentYear = 2026;

  console.log("Upserting 'ลาอื่นๆ' policies with 15 max_days for all users...");
  
  const { error: delError } = await supabase.from('user_policies').delete().eq('leave_type', 'อื่นๆ');
  if (delError) {
     console.error("Error deleting old 'อื่นๆ' records:", delError);
  } else {
     console.log("Deleted old 'อื่นๆ' records (if any).");
  }
  
  const policiesToUpsert = users.map(u => ({
    user_id: u.id,
    leave_type: 'ลาอื่นๆ',
    max_days: 15.00,
    used_days: 0.00,
    year: currentYear
  }));

  const { data: insertData, error: insertError } = await supabase
    .from('user_policies')
    .upsert(policiesToUpsert, { onConflict: 'user_id, leave_type, year' });
    
  if (insertError) {
    console.error("Error upserting policies:", insertError);
  } else {
    console.log("Successfully restored/added 'ลาอื่นๆ' policies for all users!");
  }
}

main();
