const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://jkndpfqefprfrnftqqxs.supabase.co';
const supabaseAnonKey = 'sb_publishable_c0Ts40rX5Pj-RI8fsBJw-Q_alrszQGF';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFullLogin() {
  console.log("Trying login...");
  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'pongsak@smetaltech.co.th',
    password: '3200'
  });
  
  if (signInError) {
    console.error("signInError:", signInError);
    return;
  }
  
  console.log("Login success! auth.uid:", data.user.id);
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', data.user.id)
    .single();
    
  if (userError) {
    console.error("userError:", userError);
  } else {
    console.log("userData found:", userData.email);
  }
}

testFullLogin();
