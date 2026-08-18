const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jkndpfqefprfrnftqqxs.supabase.co';
const supabaseAnonKey = 'sb_publishable_c0Ts40rX5Pj-RI8fsBJw-Q_alrszQGF';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  const { data: users, error } = await supabase.from('users').select('id, role').limit(10);
  console.log("Users:", users);
  if (error) console.error(error);
}

inspect();
