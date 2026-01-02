// File Upload Service for Case Where Platform
// Handles file uploads, downloads, and management for deliverables, invoices, and attachments

import { createClient } from "npm:@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Bucket names
export const BUCKETS = {
  DELIVERABLES: 'make-215f78a5-deliverables',
  INVOICES: 'make-215f78a5-invoices',
  ATTACHMENTS: 'make-215f78a5-attachments',
  AVATARS: 'make-215f78a5-avatars',
};

// File type configurations
export const FILE_CONFIGS = {
  // Images
  IMAGE: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  },
  // Documents
  DOCUMENT: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ],
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'],
  },
  // Code/Archives
  ARCHIVE: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/gzip',
    ],
    extensions: ['.zip', '.rar', '.7z', '.gz', '.tar'],
  },
  // Videos
  VIDEO: {
    maxSize: 50 * 1024 * 1024, // 50MB (adjusted for Supabase free tier)
    allowedTypes: [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
    ],
    extensions: ['.mp4', '.mpeg', '.mov', '.avi', '.webm'],
  },
  // Audio
  AUDIO: {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: [
      'audio/mpeg',
      'audio/wav',
      'audio/mp3',
      'audio/ogg',
      'audio/webm',
    ],
    extensions: ['.mp3', '.wav', '.ogg', '.webm'],
  },
};

// Initialize storage buckets
export async function initializeBuckets() {
  console.log('🔵 [Storage] Initializing buckets...');

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.log('⚠️  [Storage] Initialization skipped: Missing credentials');
    return false;
  }

  // Validate that SUPABASE_URL is a valid URL
  try {
    new URL(supabaseUrl);
  } catch (error) {
    console.log('⚠️  [Storage] Invalid SUPABASE_URL format');
    return false;
  }

  try {
    // List existing buckets with better error handling
    let existingBuckets;
    try {
      const { data, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        // Log the error but don't throw - Storage might not be available
        console.log('ℹ️  [Storage] Storage API not available:', listError.message || 'Unknown error');
        console.log('ℹ️  [Storage] This is normal in some environments. File features will be disabled.');
        return false;
      }

      existingBuckets = data;
    } catch (fetchError: any) {
      // Catch network or parsing errors
      console.log('ℹ️  [Storage] Storage API is not accessible in this environment');
      console.log('ℹ️  [Storage] File upload features will be disabled');
      return false;
    }

    // Create buckets if they don't exist
    for (const [name, bucketId] of Object.entries(BUCKETS)) {
      const bucketExists = existingBuckets?.some(bucket => bucket.name === bucketId);

      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket(bucketId, {
          public: false, // Private buckets (require signed URLs)
          fileSizeLimit: 50 * 1024 * 1024, // 50MB max (Supabase free tier limit)
        });

        if (createError) {
          console.error(`❌ [Storage] Error creating ${name} bucket:`, createError);
        } else {
          console.log(`✅ [Storage] Created ${name} bucket: ${bucketId}`);
        }
      } else {
        console.log(`✅ [Storage] ${name} bucket already exists: ${bucketId}`);
      }
    }

    return true;
  } catch (error) {
    console.log('ℹ️  [Storage] Storage initialization skipped');
    return false;
  }
}

// Validate file
export function validateFile(params: {
  fileName: string;
  fileSize: number;
  fileType: string;
  category: 'IMAGE' | 'DOCUMENT' | 'ARCHIVE' | 'VIDEO' | 'AUDIO' | 'ANY';
}): { valid: boolean; error?: string } {
  const { fileName, fileSize, fileType, category } = params;

  // Check file name
  if (!fileName || fileName.length === 0) {
    return { valid: false, error: 'File name is required' };
  }

  // Check for dangerous file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.app', '.deb', '.rpm'];
  const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  
  if (dangerousExtensions.includes(fileExtension)) {
    return { valid: false, error: 'This file type is not allowed for security reasons' };
  }

  // If category is ANY, allow all safe files
  if (category === 'ANY') {
    const maxSize = 50 * 1024 * 1024; // 50MB for any file (Supabase free tier limit)
    if (fileSize > maxSize) {
      return { valid: false, error: `File size must be less than ${formatFileSize(maxSize)}` };
    }
    return { valid: true };
  }

  const config = FILE_CONFIGS[category];

  // Check file size
  if (fileSize > config.maxSize) {
    return { 
      valid: false, 
      error: `File size must be less than ${formatFileSize(config.maxSize)}` 
    };
  }

  // Check file type
  if (!config.allowedTypes.includes(fileType)) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed: ${config.extensions.join(', ')}` 
    };
  }

  return { valid: true };
}

// Create signed upload URL
export async function createUploadUrl(params: {
  bucket: string;
  filePath: string;
  expiresIn?: number; // seconds, default 3600 (1 hour)
}): Promise<{ signedUrl?: string; token?: string; error?: string }> {
  const { bucket, filePath, expiresIn = 3600 } = params;

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(filePath, {
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error('❌ [Storage] Error creating signed upload URL:', error);
      return { error: 'Failed to create upload URL' };
    }

    return {
      signedUrl: data.signedUrl,
      token: data.token,
    };
  } catch (error) {
    console.error('❌ [Storage] Exception creating upload URL:', error);
    return { error: 'Storage service error' };
  }
}

// Create signed download URL
export async function createDownloadUrl(params: {
  bucket: string;
  filePath: string;
  expiresIn?: number; // seconds, default 3600 (1 hour)
}): Promise<{ signedUrl?: string; error?: string }> {
  const { bucket, filePath, expiresIn = 3600 } = params;

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('❌ [Storage] Error creating signed download URL:', error);
      return { error: 'Failed to create download URL' };
    }

    return { signedUrl: data.signedUrl };
  } catch (error) {
    console.error('❌ [Storage] Exception creating download URL:', error);
    return { error: 'Storage service error' };
  }
}

// Delete file
export async function deleteFile(params: {
  bucket: string;
  filePath: string;
}): Promise<{ success: boolean; error?: string }> {
  const { bucket, filePath } = params;

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('❌ [Storage] Error deleting file:', error);
      return { success: false, error: 'Failed to delete file' };
    }

    console.log(`✅ [Storage] Deleted file: ${filePath}`);
    return { success: true };
  } catch (error) {
    console.error('❌ [Storage] Exception deleting file:', error);
    return { success: false, error: 'Storage service error' };
  }
}

// List files in folder
export async function listFiles(params: {
  bucket: string;
  folder?: string;
  limit?: number;
  offset?: number;
}): Promise<{ files?: any[]; error?: string }> {
  const { bucket, folder = '', limit = 100, offset = 0 } = params;

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: limit,
        offset: offset,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('❌ [Storage] Error listing files:', error);
      return { error: 'Failed to list files' };
    }

    return { files: data };
  } catch (error) {
    console.error('❌ [Storage] Exception listing files:', error);
    return { error: 'Storage service error' };
  }
}

// Get file metadata
export async function getFileMetadata(params: {
  bucket: string;
  filePath: string;
}): Promise<{ metadata?: any; error?: string }> {
  const { bucket, filePath } = params;

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(filePath.substring(0, filePath.lastIndexOf('/')), {
        search: filePath.substring(filePath.lastIndexOf('/') + 1),
      });

    if (error) {
      console.error('❌ [Storage] Error getting file metadata:', error);
      return { error: 'Failed to get file metadata' };
    }

    if (!data || data.length === 0) {
      return { error: 'File not found' };
    }

    return { metadata: data[0] };
  } catch (error) {
    console.error('❌ [Storage] Exception getting metadata:', error);
    return { error: 'Storage service error' };
  }
}

// Generate unique file path
export function generateFilePath(params: {
  userId: string;
  projectId?: string;
  fileName: string;
  prefix?: string;
}): string {
  const { userId, projectId, fileName, prefix } = params;

  // Get file extension
  const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
  
  // Generate timestamp
  const timestamp = Date.now();
  
  // Generate unique ID
  const uniqueId = crypto.randomUUID();
  
  // Build path
  const pathParts = [];
  
  if (prefix) {
    pathParts.push(prefix);
  }
  
  if (projectId) {
    pathParts.push(projectId);
  }
  
  pathParts.push(userId);
  pathParts.push(`${timestamp}-${uniqueId}${fileExtension}`);
  
  return pathParts.join('/');
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Get file category from MIME type
export function getFileCategory(mimeType: string): 'IMAGE' | 'DOCUMENT' | 'ARCHIVE' | 'VIDEO' | 'AUDIO' | 'ANY' {
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  if (mimeType.startsWith('audio/')) return 'AUDIO';
  
  if (mimeType.includes('pdf') || 
      mimeType.includes('word') || 
      mimeType.includes('excel') || 
      mimeType.includes('text')) {
    return 'DOCUMENT';
  }
  
  if (mimeType.includes('zip') || 
      mimeType.includes('rar') || 
      mimeType.includes('7z') || 
      mimeType.includes('gzip')) {
    return 'ARCHIVE';
  }
  
  return 'ANY';
}

// Check if storage is available
export async function checkStorageHealth(): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ [Storage] Health check failed:', error);
      return false;
    }
    
    console.log('✅ [Storage] Health check passed');
    return true;
  } catch (error) {
    console.error('❌ [Storage] Health check exception:', error);
    return false;
  }
}

export default {
  BUCKETS,
  FILE_CONFIGS,
  initializeBuckets,
  validateFile,
  createUploadUrl,
  createDownloadUrl,
  deleteFile,
  listFiles,
  getFileMetadata,
  generateFilePath,
  formatFileSize,
  getFileCategory,
  checkStorageHealth,
};