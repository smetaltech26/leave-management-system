const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://jkndpfqefprfrnftqqxs.supabase.co';
const supabaseAnonKey = 'sb_publishable_c0Ts40rX5Pj-RI8fsBJw-Q_alrszQGF';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.rpc('get_user_role'); // Wait, we can just run a query using service role to check pg_policies
}
check();
