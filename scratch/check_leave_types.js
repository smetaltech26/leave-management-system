import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jkndpfqefprfrnftqqxs.supabase.co';
const supabaseKey = 'sb_publishable_c0Ts40rX5Pj-RI8fsBJw-Q_alrszQGF';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('leave_requests').select('leave_type');
  if (error) console.error(error);
  
  const counts = {};
  data.forEach(r => {
    counts[r.leave_type] = (counts[r.leave_type] || 0) + 1;
  });
  console.log(counts);
}

check();
