import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jkndpfqefprfrnftqqxs.supabase.co';
const supabaseKey = 'sb_publishable_c0Ts40rX5Pj-RI8fsBJw-Q_alrszQGF';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log("Checking Supabase tables...");
  
  const tables = ['users', 'agencies', 'departments', 'user_policies', 'leave_requests', 'approval_steps', 'holidays', 'day_of_week'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.error(`Error fetching from ${table}:`, error.message);
    } else {
      console.log(`✅ Table '${table}' exists. Rows found: ${data.length}`);
    }
  }
}

checkTables();
