const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jkndpfqefprfrnftqqxs.supabase.co';
const supabaseAnonKey = 'sb_publishable_c0Ts40rX5Pj-RI8fsBJw-Q_alrszQGF';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRLS() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  console.log("Anon User fetch:", data, error);
}

checkRLS();
