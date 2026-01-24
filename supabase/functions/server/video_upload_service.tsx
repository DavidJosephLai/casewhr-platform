/**
 * 🎬 影片上傳服務
 * 處理 Hero 背景影片上傳到 Supabase Storage
 */

import { createClient } from "npm:@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Bucket 名稱
const BUCKET_NAME = 'make-215f78a5-hero-videos';

/**
 * 初始化 Storage Bucket
 * 在伺服器啟動時創建 bucket（如果不存在）
 */
export async function initializeVideoBucket() {
  try {
    console.log('🎬 [Video Storage] Checking if bucket exists...');
    
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ [Video Storage] Error listing buckets:', listError);
      return;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);

    if (!bucketExists) {
      console.log('🎬 [Video Storage] Creating bucket:', BUCKET_NAME);
      
      const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true, // 公開存取，讓影片可以直接播放
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
      });

      if (error) {
        console.error('❌ [Video Storage] Error creating bucket:', error);
      } else {
        console.log('✅ [Video Storage] Bucket created successfully:', BUCKET_NAME);
      }
    } else {
      console.log('✅ [Video Storage] Bucket already exists:', BUCKET_NAME);
    }
  } catch (error) {
    console.error('❌ [Video Storage] Initialization error:', error);
  }
}

/**
 * 上傳影片到 Supabase Storage
 */
export async function uploadHeroVideo(file: Blob, filename: string): Promise<{ url: string; path: string }> {
  try {
    console.log('🎬 [Video Upload] Starting upload:', filename);
    console.log('🎬 [Video Upload] File size:', file.size, 'bytes');
    console.log('🎬 [Video Upload] File type:', file.type);

    // 生成唯一檔名（避免覆蓋）
    const timestamp = Date.now();
    const uniqueFilename = `hero-bg-${timestamp}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `videos/${uniqueFilename}`;

    console.log('🎬 [Video Upload] Uploading to path:', filePath);

    // 上傳到 Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'video/mp4'
      });

    if (error) {
      console.error('❌ [Video Upload] Upload failed:', error);
      throw new Error(`上傳失敗: ${error.message}`);
    }

    console.log('✅ [Video Upload] Upload successful:', data);

    // 獲取公開 URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log('✅ [Video Upload] Public URL:', publicUrl);

    return {
      url: publicUrl,
      path: filePath
    };

  } catch (error: any) {
    console.error('❌ [Video Upload] Error:', error);
    throw error;
  }
}

/**
 * 列出所有已上傳的影片
 */
export async function listHeroVideos() {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('videos', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('❌ [Video List] Error listing videos:', error);
      throw error;
    }

    // 為每個影片生成公開 URL
    const videos = data.map(file => {
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(`videos/${file.name}`);

      return {
        name: file.name,
        size: file.metadata?.size || 0,
        createdAt: file.created_at,
        url: urlData.publicUrl
      };
    });

    return videos;

  } catch (error: any) {
    console.error('❌ [Video List] Error:', error);
    throw error;
  }
}

/**
 * 刪除影片
 */
export async function deleteHeroVideo(filePath: string) {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('❌ [Video Delete] Error:', error);
      throw error;
    }

    console.log('✅ [Video Delete] Deleted successfully:', filePath);
    return { success: true };

  } catch (error: any) {
    console.error('❌ [Video Delete] Error:', error);
    throw error;
  }
}
