const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://jkndpfqefprfrnftqqxs.supabase.co';
const supabaseAnonKey = 'sb_publishable_c0Ts40rX5Pj-RI8fsBJw-Q_alrszQGF';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log("Trying login...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'pongsak@smetaltech.co.th',
    password: '3200'
  });
  console.log("Login result:", data, error);
}

testLogin();
