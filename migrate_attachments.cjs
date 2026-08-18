const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: attachments, error } = await supabase.from('attachments').select('*').like('file_url', '%drive.google.com%');
  if (error) { console.error("Error fetching", error); return; }

  console.log(`Found ${attachments.length} attachments on Google Drive. Starting migration...`);
  
  for (const att of attachments) {
    const driveUrl = att.file_url;
    // Extract ID
    const match = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) {
      console.log(`Could not parse ID for ${att.id}: ${driveUrl}`);
      continue;
    }
    const fileId = match[1];
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    try {
      console.log(`Downloading ${att.id} ...`);
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        console.error(`Failed to download ${att.id}: ${response.statusText}`);
        continue;
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const fileName = att.file_name || `${att.id}.pdf`; 
      const ext = fileName.includes('.') ? fileName.split('.').pop() : 'png';
      const filePath = `${att.request_id}/${att.id}.${ext}`;
      
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('attachments')
        .upload(filePath, buffer, { contentType: response.headers.get('content-type') || 'application/octet-stream', upsert: true });
        
      if (uploadErr) {
        console.error(`Failed to upload ${att.id} to Supabase:`, uploadErr.message);
        continue;
      }
      
      const { data: publicUrlData } = supabase.storage.from('attachments').getPublicUrl(filePath);
      const newUrl = publicUrlData.publicUrl;
      
      // Update database
      const { error: updateErr } = await supabase.from('attachments').update({ file_url: newUrl }).eq('id', att.id);
      if (updateErr) {
         console.error(`Failed to update DB for ${att.id}`, updateErr.message);
      } else {
         console.log(`Successfully migrated ${att.id}`);
      }
      
    } catch(err) {
      console.error(`Error processing ${att.id}:`, err.message);
    }
  }
  
  console.log('Migration completed!');
}
run();
