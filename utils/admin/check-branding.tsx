/**
 * 🔍 品牌 LOGO 查詢工具
 * 用於查看和管理 Enterprise 用戶的品牌設置和 LOGO
 */

import { createClient } from 'npm:@supabase/supabase-js@2.39.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// KV Store 讀取函數
async function kvGet(key: string) {
  try {
    const { data } = await supabase
      .from('kv_store_215f78a5')
      .select('value')
      .eq('key', key)
      .single();
    
    return data?.value;
  } catch (error) {
    return null;
  }
}

// 根據 email 查找用戶 ID
async function findUserByEmail(email: string) {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  return users?.find(u => u.email === email);
}

// 列出所有 Storage buckets
async function listBuckets() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('❌ Error listing buckets:', error);
    return [];
  }
  return buckets || [];
}

// 列出 bucket 中的文件
async function listFiles(bucketName: string, path: string = '') {
  const { data: files, error } = await supabase.storage
    .from(bucketName)
    .list(path);
  
  if (error) {
    console.error(`❌ Error listing files in ${bucketName}:`, error);
    return [];
  }
  return files || [];
}

// 主函數
export async function checkBrandingForUser(email: string) {
  console.log('\n🔍 查詢 Enterprise 品牌設置');
  console.log('='.repeat(60));
  console.log(`📧 Email: ${email}\n`);

  // 1. 查找用戶
  const user = await findUserByEmail(email);
  if (!user) {
    console.log('❌ 找不到此用戶');
    return;
  }

  console.log(`✅ 找到用戶: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Created: ${new Date(user.created_at).toLocaleString('zh-TW')}\n`);

  // 2. 查詢 Branding 設置
  const branding = await kvGet(`branding:${user.id}`) || await kvGet(`branding_${user.id}`);
  
  if (!branding) {
    console.log('⚠️  此用戶尚未設置品牌配置\n');
  } else {
    console.log('📋 品牌配置:');
    console.log('   公司名稱:', branding.company_name || 'N/A');
    console.log('   主要顏色:', branding.primary_color || 'N/A');
    console.log('   次要顏色:', branding.secondary_color || 'N/A');
    console.log('   強調顏色:', branding.accent_color || 'N/A');
    console.log('   自定義域名:', branding.custom_domain || 'N/A');
    console.log('   LOGO URL:', branding.logo_url || '❌ 未上傳');
    console.log('   創建時間:', branding.created_at ? new Date(branding.created_at).toLocaleString('zh-TW') : 'N/A');
    console.log('   更新時間:', branding.updated_at ? new Date(branding.updated_at).toLocaleString('zh-TW') : 'N/A');
    console.log('');
  }

  // 3. 檢查 Storage Bucket
  console.log('💾 Storage 檢查:');
  const buckets = await listBuckets();
  const brandingBucket = buckets.find(b => b.name === 'make-215f78a5-branding');
  
  if (!brandingBucket) {
    console.log('   ❌ Bucket "make-215f78a5-branding" 不存在\n');
  } else {
    console.log(`   ✅ Bucket "make-215f78a5-branding" 存在`);
    console.log(`      Public: ${brandingBucket.public ? 'Yes' : 'No'}`);
    console.log(`      Created: ${new Date(brandingBucket.created_at).toLocaleString('zh-TW')}\n`);

    // 列出用戶的文件
    const userFiles = await listFiles('make-215f78a5-branding', user.id);
    
    if (userFiles.length === 0) {
      console.log('   📂 用戶文件夾為空（尚未上傳 LOGO）\n');
    } else {
      console.log(`   📂 用戶文件夾 (${userFiles.length} 個文件):`);
      for (const file of userFiles) {
        console.log(`      📄 ${file.name}`);
        console.log(`         Size: ${(file.metadata?.size / 1024).toFixed(2)} KB`);
        console.log(`         Updated: ${new Date(file.updated_at).toLocaleString('zh-TW')}`);
        
        // 獲取簽名 URL
        const { data: urlData } = await supabase.storage
          .from('make-215f78a5-branding')
          .createSignedUrl(`${user.id}/${file.name}`, 60);
        
        if (urlData?.signedUrl) {
          console.log(`         URL (60s): ${urlData.signedUrl.substring(0, 100)}...`);
        }
      }
      console.log('');
    }
  }

  // 4. 訂閱檢查
  const subscription = await kvGet(`subscription:${user.id}`) || await kvGet(`subscription_${user.id}`);
  if (subscription) {
    console.log('💳 訂閱狀態:');
    console.log('   計劃:', subscription.plan || 'N/A');
    console.log('   狀態:', subscription.status || 'N/A');
    if (subscription.plan !== 'enterprise') {
      console.log('   ⚠️  注意: 只有 Enterprise 用戶可以上傳 LOGO');
    }
  }

  console.log('\n' + '='.repeat(60));
}

// CLI 使用
if (import.meta.main) {
  const email = Deno.args[0] || 'davidlai234@hotmail.com';
  await checkBrandingForUser(email);
}
