import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * 🔍 LOGO 診斷工具專用路由
 * 這些是公開路由，用於診斷企業 LOGO 同步問題
 */

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// 🔐 ROOT ADMIN EMAILS - 這些用戶永遠擁有企業版權限
const ROOT_ADMIN_EMAILS = [
  'davidlai234@hotmail.com',
  'davidjosephlai@gmail.com',
  'davidjosephlai@casewhr.com',
  'davidlai117@yahoo.com.tw',
  'admin@casewhr.com',
];

export function registerLogoDebuggerRoutes(app: Hono) {
  
  // ============= STEP 1: 檢查訂閱狀態 =============
  app.get("/make-server-215f78a5/subscription/status", async (c) => {
    try {
      const userId = c.req.query('userId');
      
      if (!userId) {
        return c.json({ error: 'userId parameter is required' }, 400);
      }

      console.log('🔍 [Subscription Status] Checking for user:', userId);

      // 🔐 檢查是否為 ROOT ADMIN
      const { data: { user: userProfile } } = await supabase.auth.admin.getUserById(userId);
      const userEmail = userProfile?.email?.toLowerCase();
      
      if (userEmail && ROOT_ADMIN_EMAILS.includes(userEmail)) {
        console.log('👑 [Subscription Status] ROOT ADMIN detected:', userEmail);
        return c.json({ 
          success: true,
          userId,
          plan: 'Enterprise',
          subscription: {
            plan: 'Enterprise',
            status: 'active',
            user_id: userId,
            is_root_admin: true,
          },
          hasEnterprise: true,
          isRootAdmin: true,
          timestamp: new Date().toISOString()
        });
      }

      // 獲取訂閱信息
      const subscription = await kv.get(`subscription:${userId}`) || await kv.get(`subscription_${userId}`);

      console.log('🔍 [Subscription Status] Found:', subscription);

      // 確定訂閱計劃
      let plan = 'Free';
      if (subscription) {
        plan = subscription.plan || subscription.tier || 'Free';
        // 統一轉換為首字母大寫格式（與前端一致）
        plan = plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
      }

      return c.json({ 
        success: true,
        userId,
        plan,
        subscription,
        hasEnterprise: plan === 'Enterprise',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('❌ [Subscription Status] Error:', error);
      return c.json({ 
        error: 'Failed to fetch subscription status', 
        details: error.message 
      }, 500);
    }
  });

  // ============= STEP 2: 檢查品牌設定 =============
  app.get("/make-server-215f78a5/branding/config", async (c) => {
    try {
      const userId = c.req.query('userId');
      
      if (!userId) {
        return c.json({ error: 'userId parameter is required' }, 400);
      }

      console.log('🔍 [Branding Config] Getting config for user:', userId);

      // 獲取品牌設定
      const branding = await kv.get(`branding:${userId}`) || await kv.get(`branding_${userId}`);

      console.log('🔍 [Branding Config] Retrieved:', branding);

      return c.json({ 
        success: true,
        userId,
        config: branding || null,
        hasConfig: !!branding,
        logoUrl: branding?.logo_url || null,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('❌ [Branding Config] Error:', error);
      return c.json({ 
        error: 'Failed to fetch branding config', 
        details: error.message 
      }, 500);
    }
  });

  // ============= STEP 3 & 5: 企業 LOGO 服務 =============
  app.get("/make-server-215f78a5/public/enterprise-logo/:userId", async (c) => {
    try {
      const userId = c.req.param('userId');
      
      if (!userId) {
        return c.json({ error: 'userId parameter is required' }, 400);
      }

      console.log('🔍 [Enterprise Logo] Getting logo for user:', userId);

      // 檢查企業 LOGO
      const enterpriseLogo = await kv.get(`enterprise_logo_${userId}`);

      console.log('🔍 [Enterprise Logo] Found:', enterpriseLogo);

      if (enterpriseLogo && enterpriseLogo.logoUrl) {
        return c.json({
          success: true,
          hasLogo: true,
          logoUrl: enterpriseLogo.logoUrl,
          userId,
          syncedAt: enterpriseLogo.syncedAt || enterpriseLogo.created_at,
          data: enterpriseLogo,
          timestamp: new Date().toISOString()
        });
      } else {
        return c.json({
          success: true,
          hasLogo: false,
          logoUrl: null,
          userId,
          message: 'No enterprise logo found for this user',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      console.error('❌ [Enterprise Logo] Error:', error);
      return c.json({ 
        error: 'Failed to fetch enterprise logo', 
        details: error.message 
      }, 500);
    }
  });

  // ============= STEP 4: KV Store 檢查 =============
  app.get("/make-server-215f78a5/debug/check-kv", async (c) => {
    try {
      const prefix = c.req.query('prefix');
      
      if (!prefix) {
        return c.json({ error: 'prefix parameter is required' }, 400);
      }

      console.log('🔍 [KV Debug] Checking prefix:', prefix);

      // 嘗試獲取所有匹配的鍵
      const results = await kv.getByPrefix(prefix);

      console.log('🔍 [KV Debug] Found:', results);

      return c.json({ 
        success: true,
        found: results && results.length > 0,
        count: results?.length || 0,
        data: results || [],
        prefix,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('❌ [KV Debug] Error:', error);
      return c.json({ 
        error: 'Failed to check KV store', 
        details: error.message 
      }, 500);
    }
  });

  console.log('✅ [Logo Debugger Routes] Registered 4 diagnostic routes');
}