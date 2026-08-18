const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function formatExcelDate(dateVal) {
  if (!dateVal) return null;
  // If it's a number (Excel serial date)
  if (typeof dateVal === 'number') {
    const d = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
    return d.toISOString();
  }
  // Handle DD/MM/YYYY
  const parts = dateVal.toString().split('/');
  if (parts.length === 3) {
    let [dd, mm, yyyy] = parts;
    if (yyyy.length === 2) yyyy = '20' + yyyy;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T00:00:00Z`;
  }
  return dateVal.toString();
}

async function importAttachments() {
  const filePath = './Data.xlsx';
  if (!fs.existsSync(filePath)) {
    console.error('Data.xlsx not found!');
    return;
  }

  const workbook = xlsx.readFile(filePath);
  
  if (!workbook.SheetNames.includes('Attachments')) {
    console.error('Sheet "Attachments" not found in Data.xlsx');
    return;
  }

  const sheet = workbook.Sheets['Attachments'];
  // Read without cellDates to prevent timezone shift issues for simple strings
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  const attachmentsToUpsert = [];

  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue; // Skip if no ID

    const id = row[0];
    const requestId = row[1];
    const fileUrl = row[2];
    const uploadedBy = row[3];
    const createdAt = formatExcelDate(row[4]);
    
    // Extract file name from URL if possible, otherwise use ID
    let fileName = id;
    if (fileUrl && fileUrl.includes('/d/')) {
        const parts = fileUrl.split('/d/');
        if (parts.length > 1) {
            fileName = parts[1].split('/')[0] || id;
        }
    }

    attachmentsToUpsert.push({
      id: id,
      request_id: requestId,
      file_url: fileUrl,
      file_name: fileName,
      uploaded_by: uploadedBy,
      created_at: createdAt || new Date().toISOString()
    });
  }

  console.log(`Found ${attachmentsToUpsert.length} attachments to import. Upserting...`);

  // Batch upsert to Supabase
  const batchSize = 100;
  for (let i = 0; i < attachmentsToUpsert.length; i += batchSize) {
    const batch = attachmentsToUpsert.slice(i, i + batchSize);
    const { error } = await supabase
      .from('attachments')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`Error upserting batch ${i} - ${i + batch.length}:`, error.message);
    } else {
      console.log(`Successfully upserted batch ${i} - ${i + batch.length}`);
    }
  }

  console.log('Finished importing attachments!');
}

importAttachments();
