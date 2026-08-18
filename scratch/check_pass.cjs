const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jkndpfqefprfrnftqqxs.supabase.co';
const supabaseAnonKey = 'sb_publishable_c0Ts40rX5Pj-RI8fsBJw-Q_alrszQGF';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPass() {
  const { data, error } = await supabase.from('users').select('email, password_hash').eq('email', 'pongsak@smetaltech.co.th').single();
  console.log("User:", data);
  if (error) console.error(error);
}

checkPass();
