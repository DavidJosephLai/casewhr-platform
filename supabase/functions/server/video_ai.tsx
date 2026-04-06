import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const app = new Hono();

// 🔧 Supabase Client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// 📦 Storage Bucket Name
const BUCKET_NAME = 'video-ai-215f78a5';

// 🎬 確保 Bucket 存在
async function ensureBucket() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      console.log(`📦 [VideoAI] Creating bucket: ${BUCKET_NAME}`);
      // 簡化 bucket 配置，移除可能導致錯誤的參數
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false
      });
      
      if (error) {
        console.error('❌ [VideoAI] Bucket creation failed:', error);
      } else {
        console.log('✅ [VideoAI] Bucket created successfully');
      }
    } else {
      console.log('✅ [VideoAI] Bucket already exists');
    }
  } catch (error) {
    console.error('❌ [VideoAI] Bucket check error:', error);
  }
}

// 啟動時確保 Bucket 存在
ensureBucket();

// 🎬 處理 Hero 背景影片
app.post('/process-hero-video', async (c) => {
  try {
    console.log('🎬 [VideoAI] Process Hero video request received');

    // 驗證用戶
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { videoUrl, effect } = await c.req.json();

    if (!videoUrl || !effect) {
      return c.json({ error: 'Missing videoUrl or effect' }, 400);
    }

    console.log('📥 [VideoAI] Downloading video from:', videoUrl);

    // 下載原始影片
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error('Failed to download video');
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    const videoBlob = new Uint8Array(videoBuffer);

    console.log('✅ [VideoAI] Video downloaded, size:', videoBlob.length);

    // 生成文件名
    const timestamp = Date.now();
    const fileName = `hero-${effect}-${timestamp}.mp4`;

    // 模擬 AI 處理（實際上這裡可以調用 OpenAI 或其他 AI API）
    // 目前先直接上傳原始影片，之後可以整合真實的 AI 處理
    console.log('🎨 [VideoAI] Processing with effect:', effect);

    // 上傳到 Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, videoBlob, {
        contentType: 'video/mp4',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ [VideoAI] Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log('✅ [VideoAI] Video uploaded:', uploadData.path);

    // 生成 signed URL（1年有效期）
    const { data: urlData, error: urlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(uploadData.path, 31536000); // 1 year

    if (urlError) {
      throw new Error(`Failed to create signed URL: ${urlError.message}`);
    }

    // 保存到 KV Store
    const videoRecord = {
      id: `hero-video-${timestamp}`,
      original_url: videoUrl,
      processed_url: urlData.signedUrl,
      effect: effect,
      created_at: new Date().toISOString(),
      is_active: false,
      user_id: user.id,
    };

    // 獲取現有的 hero videos 列表
    const existingVideos = await getHeroVideos();
    existingVideos.push(videoRecord);

    // 保存回 KV Store
    await supabase
      .from('kv_store_215f78a5')
      .upsert({
        key: 'hero-videos',
        value: existingVideos,
      });

    return c.json({
      success: true,
      video: videoRecord,
    });

  } catch (error: any) {
    console.error('❌ [VideoAI] Process hero video error:', error);
    return c.json({ error: error.message || 'Processing failed' }, 500);
  }
});

// 🎬 獲取 Hero 影片列表
app.get('/hero-videos', async (c) => {
  try {
    const videos = await getHeroVideos();
    return c.json({ videos });
  } catch (error: any) {
    console.error('❌ [VideoAI] Get hero videos error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 🎬 設置啟用的 Hero 影片
app.post('/set-active-hero-video', async (c) => {
  try {
    const { videoId } = await c.req.json();

    if (!videoId) {
      return c.json({ error: 'Missing videoId' }, 400);
    }

    const videos = await getHeroVideos();

    // 將所有影片設為非啟用
    videos.forEach((v: any) => {
      v.is_active = false;
    });

    // 設置指定影片為啟用
    const targetVideo = videos.find((v: any) => v.id === videoId);
    if (!targetVideo) {
      return c.json({ error: 'Video not found' }, 404);
    }

    targetVideo.is_active = true;

    // 保存回 KV Store
    await supabase
      .from('kv_store_215f78a5')
      .upsert({
        key: 'hero-videos',
        value: videos,
      });

    // 同時更新到 hero-active-video key
    await supabase
      .from('kv_store_215f78a5')
      .upsert({
        key: 'hero-active-video',
        value: targetVideo,
      });

    return c.json({ success: true, video: targetVideo });

  } catch (error: any) {
    console.error('❌ [VideoAI] Set active hero video error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 🎬 輔助函數：獲取 Hero 影片列表
async function getHeroVideos() {
  const { data, error } = await supabase
    .from('kv_store_215f78a5')
    .select('value')
    .eq('key', 'hero-videos')
    .single();

  if (error || !data) {
    return [];
  }

  return data.value || [];
}

// 📤 上傳影片
app.post('/upload', async (c) => {
  try {
    console.log('📤 [VideoAI] Upload request received');

    // 驗證用戶
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // 解析表單數據
    const formData = await c.req.formData();
    const videoFile = formData.get('video') as File;

    if (!videoFile) {
      return c.json({ error: 'No video file provided' }, 400);
    }

    console.log('📹 [VideoAI] Video file:', {
      name: videoFile.name,
      type: videoFile.type,
      size: videoFile.size,
    });

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const ext = videoFile.name.split('.').pop() || 'mp4';
    const fileName = `${user.id}/${timestamp}-${randomId}.${ext}`;

    // 上傳到 Supabase Storage
    const arrayBuffer = await videoFile.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: videoFile.type,
        upsert: false,
      });

    if (error) {
      console.error('❌ [VideoAI] Upload error:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log('✅ [VideoAI] Upload successful:', data);

    return c.json({
      success: true,
      path: data.path,
      fileName: videoFile.name,
      size: videoFile.size,
    });
  } catch (error: any) {
    console.error('❌ [VideoAI] Upload error:', error);
    return c.json({ error: error.message || 'Upload failed' }, 500);
  }
});

export default app;