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
    console.log('Fetching requests and holidays from DB...');
    const dbRequests = await fetchAll('leave_requests');
    const holidays = await fetchAll('holidays');
    
    console.log('Parsing Data.xlsx...');
    const workbook = XLSX.readFile('Data.xlsx');
    const sheet = workbook.Sheets['LeaveRequests'];
    // Use header: 1 to get array of arrays
    const rawData = XLSX.utils.sheet_to_json(sheet, {header: 1});
    
    // Create map of ID -> 'F' / 'AM' / 'PM'
    const excelMap = {};
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (row && row[0]) {
        // ID is in col 0, leaveDuration string is in col 12
        excelMap[row[0]] = row[12];
      }
    }

    let updateCount = 0;

    for (const req of dbRequests) {
      const excelDurStr = excelMap[req.id];
      if (!excelDurStr) continue; // Skip if not from Excel

      let correctDuration = 0;
      
      const sDate = new Date(req.date_start);
      const eDate = new Date(req.date_end);
      
      if (excelDurStr === 'AM' || excelDurStr === 'PM') {
        correctDuration = 0.5;
      } else {
        // Full days - calculate excluding Sundays and Holidays
        let curr = new Date(sDate);
        while (curr <= eDate) {
          const dayOfWeek = curr.getDay();
          if (dayOfWeek !== 0) { // Not Sunday
            const dateStr = curr.toISOString().split('T')[0];
            const isHoliday = holidays.some(h => h.date === dateStr);
            if (!isHoliday) {
              correctDuration += 1;
            }
          }
          curr.setDate(curr.getDate() + 1);
        }
      }

      // If DB has a different duration, update it
      if (Number(req.leave_duration) !== correctDuration) {
        console.log(`Fixing ${req.id} (User: ${req.user_id}): DB=${req.leave_duration}, Correct=${correctDuration} (Period: ${excelDurStr})`);
        
        const { error } = await supabase
          .from('leave_requests')
          .update({ leave_duration: correctDuration })
          .eq('id', req.id);
          
        if (error) {
          console.error(`Error updating ${req.id}:`, error);
        } else {
          updateCount++;
        }
      }
    }

    console.log(`Successfully fixed ${updateCount} leave requests.`);

  } catch (err) {
    console.error(err);
  }
}

run();
