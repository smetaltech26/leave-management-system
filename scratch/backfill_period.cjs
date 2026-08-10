const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jkndpfqefprfrnftqqxs.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_c0Ts40rX5Pj-RI8fsBJw-Q_alrszQGF';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchAll(table) {
  let allData = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + step - 1);
    if (error) throw error;
    if (data.length === 0) break;
    allData = allData.concat(data);
    if (data.length < step) break;
    from += step;
  }
  return allData;
}

async function run() {
  try {
    console.log('Fetching requests from DB...');
    const dbRequests = await fetchAll('leave_requests');
    
    console.log('Parsing Data.xlsx...');
    const workbook = XLSX.readFile('Data.xlsx');
    const sheet = workbook.Sheets['LeaveRequests'];
    const rawData = XLSX.utils.sheet_to_json(sheet, {header: 1});
    
    const excelMap = {};
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (row && row[0]) {
        excelMap[row[0]] = row[12]; // 'F', 'AM', 'PM'
      }
    }

    let updateCount = 0;

    for (const req of dbRequests) {
      const excelDurStr = excelMap[req.id];
      if (!excelDurStr) continue;

      let period = 'Full';
      if (excelDurStr === 'AM') period = 'Morning';
      else if (excelDurStr === 'PM') period = 'Afternoon';
      
      // Update the leave_period column
      const { error } = await supabase
        .from('leave_requests')
        .update({ leave_period: period })
        .eq('id', req.id);
        
      if (error) {
        console.error(`Error updating ${req.id}:`, error);
      } else {
        updateCount++;
      }
    }

    console.log(`Successfully updated leave_period for ${updateCount} requests.`);

  } catch (err) {
    console.error(err);
  }
}

run();
