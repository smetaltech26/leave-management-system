const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function cleanBucket() {
  console.log('Fetching files in root of attachments bucket...');
  const { data, error } = await supabase.storage.from('attachments').list();
  
  if (error) {
    console.error('Error fetching list:', error);
    return;
  }
  
  // Folders don't have an ID, or we can check if it looks like the garbage files 'FILE-0001_1R...'
  // The garbage files are starting with 'FILE-' and have '_' in them, or just all files in root.
  // We want to delete files in the root that are NOT folders. 
  // In Supabase storage list(), folders have metadata: null or id: null. Files have metadata.
  const filesToDelete = data.filter(item => {
    // Check if it's a file (has metadata or id, not a folder)
    // And to be extremely safe, only delete files in root that start with 'FILE-' and contain '_' 
    // since all the junk files follow this pattern (e.g. FILE-0001_1Ruku...).
    return item.name.startsWith('FILE-') && item.name.includes('_');
  }).map(item => item.name);

  if (filesToDelete.length === 0) {
    console.log('No garbage files found in root.');
    return;
  }

  console.log(`Found ${filesToDelete.length} garbage files. Deleting...`);
  
  const { data: delData, error: delError } = await supabase.storage.from('attachments').remove(filesToDelete);
  
  if (delError) {
    console.error('Error deleting files:', delError);
  } else {
    console.log(`Successfully deleted ${delData.length} files!`);
  }
}

cleanBucket();
