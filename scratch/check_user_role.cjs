const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://jkndpfqefprfrnftqqxs.supabase.co';
const supabaseAnonKey = 'sb_publishable_c0Ts40rX5Pj-RI8fsBJw-Q_alrszQGF';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.from('users').select('*').eq('fullname', 'วิรดา แก้วดอน');
  console.log("data:", data, error);
}
check();
