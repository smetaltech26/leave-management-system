import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jkndpfqefprfrnftqqxs.supabase.co';
const supabaseKey = 'sb_publishable_c0Ts40rX5Pj-RI8fsBJw-Q_alrszQGF';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: user } = await supabase.from('users').select('id, fullname').eq('fullname', 'วิรดา แก้วดอน').single();
  if (user) {
    console.log("User:", user);
    const { data: reqs } = await supabase.from('leave_requests').select('leave_type, leave_duration, status').eq('user_id', user.id);
    console.log("Requests:", reqs);
    
    const { data: pols } = await supabase.from('user_policies').select('leave_type, max_days, used_days').eq('user_id', user.id);
    console.log("Policies:", pols);
  }
}

check();
