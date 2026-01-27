import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

// Supabase Storage Bucket Name
const BUCKET_NAME = 'make-215f78a5-perfectcomm-downloads';

// Initialize Supabase client
function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

// Ensure bucket exists
export async function ensureDownloadBucket() {
  const supabase = getSupabaseClient();
  
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false, // Private bucket - requires signed URLs
        fileSizeLimit: 524288000, // 500MB limit
      });
      
      if (error) {
        console.error('❌ Error creating download bucket:', error);
      } else {
        console.log(`✅ Created download bucket: ${BUCKET_NAME}`);
      }
    } else {
      console.log(`✅ Download bucket already exists: ${BUCKET_NAME}`);
    }
  } catch (error) {
    console.error('❌ Error ensuring download bucket:', error);
  }
}

// Get download URL for PerfectComm installer
export async function getDownloadUrl(
  licenseType: 'trial' | 'standard' | 'enterprise' = 'trial'
): Promise<string | null> {
  const supabase = getSupabaseClient();
  
  // Define file paths based on license type (changed to .zip format)
  const fileMap = {
    trial: 'PerfectComm_Trial.zip',
    standard: 'PerfectComm_Standard.zip',
    enterprise: 'PerfectComm_Enterprise.zip'
  };
  
  const fileName = fileMap[licenseType];
  
  try {
    // Generate signed URL (valid for 24 hours)
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, 86400); // 24 hours
    
    if (error) {
      console.error(`❌ Error generating download URL for ${fileName}:`, error);
      return null;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('❌ Error getting download URL:', error);
    return null;
  }
}

// Record download statistics
export async function recordDownload(data: {
  licenseKey?: string;
  email?: string;
  licenseType: 'trial' | 'standard' | 'enterprise';
  ipAddress?: string;
  userAgent?: string;
}) {
  const downloadId = `download_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  const record = {
    downloadId,
    licenseKey: data.licenseKey || 'anonymous',
    email: data.email || 'anonymous',
    licenseType: data.licenseType,
    timestamp: new Date().toISOString(),
    ipAddress: data.ipAddress || 'unknown',
    userAgent: data.userAgent || 'unknown'
  };
  
  await kv.set(`wismachion:download:${downloadId}`, record);
  
  console.log(`📥 Download recorded: ${data.licenseType} - ${data.email || 'anonymous'}`);
  
  return downloadId;
}

// Get download statistics
export async function getDownloadStats() {
  const downloads = await kv.getByPrefix('wismachion:download:');
  
  const stats = {
    total: downloads.length,
    trial: downloads.filter((d: any) => d.licenseType === 'trial').length,
    standard: downloads.filter((d: any) => d.licenseType === 'standard').length,
    enterprise: downloads.filter((d: any) => d.licenseType === 'enterprise').length,
    recent: downloads.slice(-10).reverse() // Last 10 downloads
  };
  
  return stats;
}

// Upload file to storage (for admin use)
export async function uploadInstaller(
  file: Uint8Array,
  fileName: string,
  contentType: string = 'application/octet-stream'
): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        contentType,
        upsert: true // Overwrite if exists
      });
    
    if (error) {
      console.error(`❌ Error uploading ${fileName}:`, error);
      return false;
    }
    
    console.log(`✅ Uploaded: ${fileName}`);
    return true;
  } catch (error) {
    console.error('❌ Error uploading installer:', error);
    return false;
  }
}

// List available installers
export async function listInstallers(): Promise<string[]> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list();
    
    if (error) {
      console.error('❌ Error listing installers:', error);
      return [];
    }
    
    return data?.map(file => file.name) || [];
  } catch (error) {
    console.error('❌ Error listing installers:', error);
    return [];
  }
}