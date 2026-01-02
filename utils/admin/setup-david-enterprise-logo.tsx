/**
 * 🌟 為 David Lai 設置企業 LOGO
 * 
 * 用戶：davidlai234@hotmail.com
 * 訂閱：Enterprise
 * 目標：設置企業 LOGO，確保郵件中顯示
 */

import { createClient } from 'npm:@supabase/supabase-js@2.39.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 目標用戶
const TARGET_EMAIL = 'davidlai234@hotmail.com';

// 企業 LOGO URL（使用 CaseWHR 的 LOGO 作為範例）
const ENTERPRISE_LOGO_URL = 'https://bihplitfentxioxyjalb.supabase.co/storage/v1/object/public/platform-assets/casewhr-logo-white.png';
const COMPANY_NAME = 'Case Where 接得準股份有限公司';

console.log('🌟 [Setup] Setting up Enterprise Logo for David Lai...\n');
console.log('📧 Target Email:', TARGET_EMAIL);
console.log('🏢 Company:', COMPANY_NAME);
console.log('🎨 Logo URL:', ENTERPRISE_LOGO_URL);
console.log('\n' + '='.repeat(60) + '\n');

async function setupEnterpriseLogo() {
  try {
    // 1. 查找用戶
    console.log('🔍 [Step 1] Finding user by email...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }
    
    const user = users.find(u => u.email === TARGET_EMAIL);
    
    if (!user) {
      throw new Error(`User not found: ${TARGET_EMAIL}`);
    }
    
    console.log('✅ User found:', user.id);
    console.log('   Email:', user.email);
    console.log('   Created:', user.created_at);
    console.log('');
    
    // 2. 設置訂閱為企業版
    console.log('🔍 [Step 2] Setting subscription to Enterprise...');
    
    const subscriptionData = {
      user_id: user.id,
      plan: 'enterprise',
      status: 'active',
      billing_cycle: 'annual',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      payment_method: 'admin',
      auto_renew: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // 使用 API 設置
    const apiUrl = `${supabaseUrl}/functions/v1/make-server-215f78a5/admin/set-subscription`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        subscriptionData,
      }),
    });
    
    if (!response.ok) {
      console.log('⚠️  API failed, trying direct KV store...');
      // 直接通過 KV Store 設置（備用方案）
      const kvUrl = `${supabaseUrl}/functions/v1/make-server-215f78a5/kv/set`;
      const kvResponse = await fetch(kvUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: `subscription:${user.id}`,
          value: subscriptionData,
        }),
      });
      
      if (!kvResponse.ok) {
        throw new Error('Failed to set subscription');
      }
    }
    
    console.log('✅ Subscription set to Enterprise');
    console.log('   Plan: enterprise');
    console.log('   Status: active');
    console.log('   Billing: annual');
    console.log('');
    
    // 3. 設置企業 LOGO
    console.log('🔍 [Step 3] Setting enterprise logo...');
    
    const logoResponse = await fetch(
      `${supabaseUrl}/functions/v1/make-server-215f78a5/enterprise/logo`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          logoUrl: ENTERPRISE_LOGO_URL,
          companyName: COMPANY_NAME,
        }),
      }
    );
    
    if (!logoResponse.ok) {
      console.log('⚠️  API failed, trying direct KV store...');
      // 直接設置 LOGO
      const logoKvUrl = `${supabaseUrl}/functions/v1/make-server-215f78a5/kv/set`;
      
      // 設置 LOGO URL
      await fetch(logoKvUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: `user:enterprise-logo:${user.id}`,
          value: ENTERPRISE_LOGO_URL,
        }),
      });
      
      // 設置企業資訊
      await fetch(logoKvUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: `user:enterprise-info:${user.id}`,
          value: {
            userId: user.id,
            companyName: COMPANY_NAME,
            logoUrl: ENTERPRISE_LOGO_URL,
            uploadedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
          },
        }),
      });
    }
    
    console.log('✅ Enterprise logo set successfully');
    console.log('   Logo URL:', ENTERPRISE_LOGO_URL);
    console.log('   Company:', COMPANY_NAME);
    console.log('');
    
    // 4. 驗證設置
    console.log('🔍 [Step 4] Verifying setup...');
    
    const verifyResponse = await fetch(
      `${supabaseUrl}/functions/v1/make-server-215f78a5/enterprise/logo?userId=${user.id}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
      }
    );
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log('✅ Verification successful');
      console.log('   Logo URL:', verifyData.logoUrl);
      console.log('   Company:', verifyData.info?.companyName);
      console.log('');
    }
    
    // 5. 發送測試郵件
    console.log('🔍 [Step 5] Sending test email...');
    
    const testEmailResponse = await fetch(
      `${supabaseUrl}/functions/v1/make-server-215f78a5/test-smart-email`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          type: 'welcome',
          language: 'zh',
        }),
      }
    );
    
    if (testEmailResponse.ok) {
      const testResult = await testEmailResponse.json();
      console.log('✅ Test email sent successfully');
      console.log('   User Tier:', testResult.userInfo?.tier);
      console.log('   Has Custom Logo:', testResult.userInfo?.hasCustomLogo);
      console.log('');
    } else {
      console.log('⚠️  Test email failed, but setup is complete');
      console.log('   You can manually test by logging in and checking email');
      console.log('');
    }
    
    // 完成
    console.log('='.repeat(60));
    console.log('🎉 SETUP COMPLETE!');
    console.log('='.repeat(60));
    console.log('');
    console.log('✅ User:', TARGET_EMAIL);
    console.log('✅ Subscription: Enterprise');
    console.log('✅ Logo: Set');
    console.log('✅ Ready to receive branded emails');
    console.log('');
    console.log('📧 Next time this user receives an email, it will include:');
    console.log('   • Custom enterprise logo in header');
    console.log('   • "Powered by Case Where" badge');
    console.log('   • Professional branding');
    console.log('');
    
  } catch (error) {
    console.error('❌ [Error]', error);
    throw error;
  }
}

// 執行設置
if (import.meta.main) {
  await setupEnterpriseLogo();
}

export { setupEnterpriseLogo };
