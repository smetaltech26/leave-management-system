const { createClient } = require('@supabase/supabase-js');
const xlsx = require('xlsx');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function formatExcelDate(dateVal) {
  if (!dateVal) return null;
  if (typeof dateVal === 'number') {
    const d = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
    return d.toISOString().split('T')[0];
  }
  if (dateVal instanceof Date) {
    return dateVal.toISOString().split('T')[0];
  }
  const parts = dateVal.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return null;
}

async function verify() {
  console.log("=== EXCEL DATA ===");
  const workbook = xlsx.readFile('Data.xlsx');
  const reqSheet = workbook.Sheets['LeaveRequests'];
  const reqData = xlsx.utils.sheet_to_json(reqSheet, { header: 1 });
  
  // Collect all valid IDs from Excel (skip header)
  const allIds = [];
  for (let i = 1; i < reqData.length; i++) {
    if (reqData[i][0] && reqData[i][0].startsWith('LEV-')) {
      allIds.push(reqData[i][0]);
    }
  }
  
  // Pick 3 random IDs
  const idsToCheck = [];
  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * allIds.length);
    idsToCheck.push(allIds[randomIndex]);
    allIds.splice(randomIndex, 1); // remove to avoid duplicates
  }
  
  console.log("Randomly selected IDs:", idsToCheck);
  
  const excelRecords = {};
  for (let i = 1; i < reqData.length; i++) {
    const row = reqData[i];
    if (idsToCheck.includes(row[0])) {
      excelRecords[row[0]] = {
        id: row[0],
        dateStart: formatExcelDate(row[2]),
        dateEnd: formatExcelDate(row[3]),
        submitDate: formatExcelDate(row[10]),
        updatedDate: formatExcelDate(row[11])
      };
      console.log("EXCEL:", excelRecords[row[0]]);
    }
  }

  console.log("\n=== DATABASE DATA ===");
  for (const id of idsToCheck) {
    const { data: req } = await supabase.from('leave_requests').select('id, date_start, date_end, created_at, updated_at').eq('id', id).single();
    if (req) {
      console.log("DB:", {
        id: req.id,
        dateStart: req.date_start,
        dateEnd: req.date_end,
        submitDate: req.created_at.split('T')[0],
        updatedDate: req.updated_at.split('T')[0]
      });
    }
  }
}

verify().catch(console.error);
