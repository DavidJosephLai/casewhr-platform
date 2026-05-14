import { createClient } from 'jsr:@supabase/supabase-js@2';

const BUCKET_NAME = 'make-215f78a5-perfectcomm-downloads';

// Initialize Supabase client
function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

// 📋 List all files in the bucket
export async function listStorageFiles() {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list();
    
    if (error) {
      console.error('❌ Error listing files:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`✅ Found ${data?.length || 0} files in storage`);
    
    return { 
      success: true, 
      files: data?.map(file => ({
        name: file.name,
        size: file.metadata?.size || 0,
        lastModified: file.updated_at,
        contentType: file.metadata?.mimetype
      })) || []
    };
  } catch (error: any) {
    console.error('❌ Error listing storage files:', error);
    return { success: false, error: error.message };
  }
}

// 🔄 Rename a file in storage (copy + delete)
export async function renameStorageFile(oldName: string, newName: string) {
  const supabase = getSupabaseClient();
  
  try {
    console.log(`🔄 Renaming file: ${oldName} → ${newName}`);
    
    // Step 1: Download the old file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(oldName);
    
    if (downloadError) {
      console.error('❌ Error downloading file:', downloadError);
      return { success: false, error: `Failed to download: ${downloadError.message}` };
    }
    
    console.log(`✅ Downloaded file: ${oldName}`);
    
    // Step 2: Upload with new name
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(newName, fileData, {
        contentType: 'application/zip',
        upsert: true
      });
    
    if (uploadError) {
      console.error('❌ Error uploading file:', uploadError);
      return { success: false, error: `Failed to upload: ${uploadError.message}` };
    }
    
    console.log(`✅ Uploaded file with new name: ${newName}`);
    
    // Step 3: Delete old file
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([oldName]);
    
    if (deleteError) {
      console.error('⚠️ Warning: Failed to delete old file:', deleteError);
      // Don't fail the operation - new file is already uploaded
    } else {
      console.log(`✅ Deleted old file: ${oldName}`);
    }
    
    return { 
      success: true, 
      message: `File renamed from ${oldName} to ${newName}`,
      oldName,
      newName
    };
  } catch (error: any) {
    console.error('❌ Error renaming file:', error);
    return { success: false, error: error.message };
  }
}

// 🗑️ Delete a file from storage
export async function deleteStorageFile(fileName: string) {
  const supabase = getSupabaseClient();
  
  try {
    console.log(`🗑️ Deleting file: ${fileName}`);
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName]);
    
    if (error) {
      console.error('❌ Error deleting file:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`✅ Deleted file: ${fileName}`);
    
    return { 
      success: true, 
      message: `File deleted: ${fileName}`,
      fileName
    };
  } catch (error: any) {
    console.error('❌ Error deleting file:', error);
    return { success: false, error: error.message };
  }
}

// 🔍 Check if a file exists
export async function checkFileExists(fileName: string) {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list();
    
    if (error) {
      return { success: false, exists: false, error: error.message };
    }
    
    const exists = data?.some(file => file.name === fileName) || false;
    
    return { 
      success: true, 
      exists,
      fileName
    };
  } catch (error: any) {
    console.error('❌ Error checking file:', error);
    return { success: false, exists: false, error: error.message };
  }
}

// 🔧 Auto-fix common filename mistakes
export async function autoFixFileNames() {
  const supabase = getSupabaseClient();
  
  try {
    console.log('🔧 Auto-fixing common filename mistakes...');
    
    const { data: files } = await supabase.storage
      .from(BUCKET_NAME)
      .list();
    
    const corrections: any[] = [];
    const fixMap: Record<string, string> = {
      // Common typos
      'PrefectComm_Tril.zip': 'PerfectComm_Trial.zip',
      'PrefectComm_Trial.zip': 'PerfectComm_Trial.zip',
      'PerfectComm_Tril.zip': 'PerfectComm_Trial.zip',
      'PerfectComm_Standerd.zip': 'PerfectComm_Standard.zip', // ✅ 修正 Standard 拼寫錯誤
      'PrefectComm_Standard.zip': 'PerfectComm_Standard.zip',
      'PrefectComm_Standerd.zip': 'PerfectComm_Standard.zip',
      'PrefectComm_Enterprise.zip': 'PerfectComm_Enterprise.zip',
    };
    
    for (const file of files || []) {
      const correctName = fixMap[file.name];
      
      if (correctName) {
        console.log(`🔧 Found typo: ${file.name} → ${correctName}`);
        
        const result = await renameStorageFile(file.name, correctName);
        corrections.push({
          oldName: file.name,
          newName: correctName,
          ...result
        });
      }
    }
    
    return {
      success: true,
      corrections,
      message: `Fixed ${corrections.length} filename(s)`
    };
  } catch (error: any) {
    console.error('❌ Error auto-fixing filenames:', error);
    return { success: false, error: error.message };
  }
}
