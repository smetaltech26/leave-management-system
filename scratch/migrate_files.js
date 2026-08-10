import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase config
const supabaseUrl = 'https://jkndpfqefprfrnftqqxs.supabase.co';
const supabaseKey = 'sb_publishable_c0Ts40rX5Pj-RI8fsBJw-Q_alrszQGF';
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to extract Google Drive file ID
function extractDriveId(url) {
  const match = url.match(/\/d\/(.+?)\//);
  if (match && match[1]) return match[1];
  const urlObj = new URL(url);
  return urlObj.searchParams.get('id');
}

// Download file from URL
async function downloadFile(url) {
  try {
    let fetchUrl = url;
    
    // If it's a Google Drive link, convert to direct download link
    if (url.includes('drive.google.com/file/d/')) {
      const id = extractDriveId(url);
      if (id) {
        fetchUrl = `https://drive.google.com/uc?export=download&id=${id}`;
      }
    }
    
    console.log(`Downloading: ${fetchUrl}`);
    const response = await fetch(fetchUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type');
    
    return { buffer, contentType };
  } catch (error) {
    console.error(`Error downloading ${url}:`, error.message);
    return null;
  }
}

async function migrateFiles() {
  console.log('🚀 Starting File Migration...');

  // ---------------------------------------------------------
  // 1. Migrate Avatars
  // ---------------------------------------------------------
  console.log('\n--- 🧑 Migrating Avatars ---');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, avatar_url')
    .not('avatar_url', 'is', null);

  if (usersError) {
    console.error('Failed to fetch users:', usersError);
  } else {
    for (const user of users) {
      if (user.avatar_url && (user.avatar_url.includes('googleusercontent.com') || user.avatar_url.includes('drive.google.com'))) {
        console.log(`\nProcessing avatar for user ${user.id}`);
        const downloaded = await downloadFile(user.avatar_url);
        
        if (downloaded) {
          const extension = downloaded.contentType?.includes('png') ? 'png' : 'jpg';
          const filePath = `${user.id}.${extension}`;
          
          // Upload to Supabase Storage
          const { data, error } = await supabase.storage
            .from('avatars')
            .upload(filePath, downloaded.buffer, {
              contentType: downloaded.contentType,
              upsert: true
            });
            
          if (error) {
            console.error(`Failed to upload avatar for ${user.id}:`, error);
          } else {
            // Get public URL
            const { data: publicUrlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(filePath);
              
            const newUrl = publicUrlData.publicUrl;
            
            // Update database
            await supabase.from('users').update({ avatar_url: newUrl }).eq('id', user.id);
            console.log(`✅ Avatar updated for ${user.id}`);
          }
        }
      }
    }
  }

  // ---------------------------------------------------------
  // 2. Migrate Attachments
  // ---------------------------------------------------------
  console.log('\n--- 📎 Migrating Attachments ---');
  const { data: attachments, error: attError } = await supabase
    .from('attachments')
    .select('*')
    .not('file_url', 'is', null);

  if (attError) {
    console.error('Failed to fetch attachments:', attError);
  } else {
    for (const att of attachments) {
      if (att.file_url && att.file_url.includes('drive.google.com')) {
        console.log(`\nProcessing attachment ${att.id}`);
        const downloaded = await downloadFile(att.file_url);
        
        if (downloaded) {
          const safeName = att.file_name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const filePath = `${att.id}_${safeName}`;
          
          // Upload to Supabase Storage
          const { data, error } = await supabase.storage
            .from('attachments')
            .upload(filePath, downloaded.buffer, {
              contentType: downloaded.contentType,
              upsert: true
            });
            
          if (error) {
            console.error(`Failed to upload attachment ${att.id}:`, error);
          } else {
            // Get public URL
            const { data: publicUrlData } = supabase.storage
              .from('attachments')
              .getPublicUrl(filePath);
              
            const newUrl = publicUrlData.publicUrl;
            
            // Update database
            await supabase.from('attachments').update({ file_url: newUrl }).eq('id', att.id);
            console.log(`✅ Attachment updated for ${att.id}`);
          }
        }
      }
    }
  }

  console.log('\n🎉 File Migration Complete!');
}

migrateFiles();
