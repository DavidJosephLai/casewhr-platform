import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js";
import { paymentRoutes } from "./payment.tsx";
import * as emailService from "./email_service.tsx";
import * as enhancedEmailTemplates from "./email_templates_enhanced.tsx";
import * as bilingualEmails from "./bilingual_email_helpers.tsx";
import * as emailIntegration from "./email_integration_service.tsx";
import * as invoiceService from "./invoice_service.tsx";
import * as contractService from "./contract_service.tsx";
import * as stripeService from "./stripe_service.tsx";
import * as paypalService from "./paypal_service.tsx";
import * as fileService from "./file_upload_service.tsx";
import { registerAdminApis } from "./admin_apis.tsx";
import * as messageService from "./message_service.tsx";
import * as adminCheck from "./admin_check.tsx";
import * as adminService from "./admin_service.tsx";
import { registerECPayRoutes } from "./ecpay_payment_service.tsx";
import * as deliverableEmails from "./email_templates_deliverables.tsx";
import { EXCHANGE_RATES, toUSD, getExchangeRates } from "./exchange_rates.tsx";
import { registerInternationalPayoutRoutes } from "./international_payout_service.tsx";
import { registerInternalTransferRoutes } from "./internal_transfer_service.tsx";
import { registerSinopacRoutes } from "./sinopac_bank_service.tsx";
import { registerSubscriptionNotificationRoutes, checkSubscriptionsAndNotify } from "./subscription_notification_service.tsx";
import { sendTeamInvitationEmail } from "./email_team_invitation.tsx";
import { sendPasswordResetOTP, verifyPasswordResetOTP } from "./password_reset_service.tsx";
import * as enterpriseLogoService from "./enterprise_logo_service.tsx";
import * as smartEmailSender from "./smart_email_sender.tsx";
import { milestoneRoutes } from "./milestone_service.tsx";
import * as aiSeoService from "./ai_seo_service.tsx";
import aiChatbotService from "./ai_chatbot_service.tsx";
import { fixPlatformRevenue } from "./fix_platform_revenue.tsx";
import { fixPayPalTransactionKeys, verifyPayPalTransactions } from "./fix_paypal_transactions.tsx";
import aiSeoRoutes from "./ai-seo.ts";
import { handleSitemapRequest, handleRobotsRequest, handleSEOHealthCheck } from "./sitemap_service.tsx";
import * as lineAuth from "./line-auth.tsx";
import { logLineEnvStatus } from "./line_health_check.tsx";
import { sitemapRouter } from "./sitemap.tsx";
import wismachionRoutes from "./wismachion_routes.tsx";
import * as internalLinkScanner from "./internal_link_scanner.tsx";
import * as videoUploadService from "./video_upload_service.tsx";
import * as subscriptionRecurring from "./subscription_recurring_service.tsx";
import * as subscriptionMonitor from "./subscription_monitor.tsx";
import videoAiRoutes from "./video_ai.tsx"; // 🎬 AI 影片處理

// ✅ 驗證關鍵服務已正確導入
if (!enterpriseLogoService || typeof enterpriseLogoService.getUserEnterpriseLogo !== 'function') {
  throw new Error('❌ enterpriseLogoService not properly imported!');
}

console.log('🚀 [SERVER STARTUP] Edge Function v2.0.6 - LINE Auth Integration - Starting...');

// Log environment variable status (without exposing the actual keys)
console.log('🔍 [ENV CHECK] STRIPE_SECRET_KEY:', Deno.env.get('STRIPE_SECRET_KEY') ? 
  `Configured (starts with: ${Deno.env.get('STRIPE_SECRET_KEY')?.substring(0, 15)}...)` : 
  'NOT CONFIGURED');

// ✅ LINE OAuth 環境變數檢查
// ✅ LINE OAuth 環境變數檢查
logLineEnvStatus();

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

console.log('✅ [SERVER] Hono app created');
console.log('✅ [SERVER] Supabase client initialized');

// 🛡️ 全局錯誤處理中間件
app.use('*', async (c, next) => {
  try {
    await next();
  } catch (error: any) {
    console.error('❌ [GLOBAL ERROR]', error);
    
    // 檢查是否是資料庫連接錯誤
    const errorMessage = error?.message || String(error);
    if (errorMessage.includes('kv_store_215f78a5') || errorMessage.includes('Cannot read properties of undefined')) {
      return c.json({
        error: 'Database connection error',
        message: '資料庫連接錯誤，請稍後再試',
        details: errorMessage.substring(0, 200)
      }, 500);
    }
    
    return c.json({
      error: 'Internal server error',
      message: error.message || '伺服器內部錯誤'
    }, 500);
  }
});

// 🧪 Helper function to verify user from access token (supports dev mode)
async function verifyUser(accessToken: string | undefined) {
  if (!accessToken) {
    return { user: null, error: 'No access token provided' };
  }

  // 🧪 Check if this is a dev mode token (format: dev-user-{id}||{email})
  if (accessToken.startsWith('dev-user-')) {
    console.log('🧪 [Auth] Dev mode token detected:', accessToken.substring(0, 30) + '...');
    
    const parts = accessToken.split('||');
    if (parts.length === 2) {
      const userId = parts[0];
      const email = parts[1];
      
      console.log('🧪 [Auth] Dev mode user:', { userId, email });
      
      return {
        user: {
          id: userId,
          email: email,
          aud: 'authenticated',
          role: 'authenticated',
        },
        error: null
      };
    }
  }

  // Real Supabase token verification
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  return { user, error };
}

// Helper function to safely get user from access token
async function getUserFromToken(accessToken: string | undefined) {
  if (!accessToken) {
    return { user: null, error: { message: 'No access token provided' } };
  }
  
  // 🧪 DEV MODE: Handle mock tokens (dev-user-*)
  // In development mode, the frontend creates mock users with IDs like "dev-user-1234567890"
  if (accessToken.startsWith('dev-user-')) {
    console.log('🧪 [getUserFromToken] Dev mode detected!');
    console.log('🧪 [getUserFromToken] Full token:', accessToken);
    console.log('🧪 [getUserFromToken] Token length:', accessToken.length);
    console.log('🧪 [getUserFromToken] Contains ||:', accessToken.includes('||'));
    
    // Extract email from the token format: "dev-user-{timestamp}||{email}"
    let mockEmail = 'admin@casewhr.com'; // Default to admin email
    if (accessToken.includes('||')) {
      const parts = accessToken.split('||');
      mockEmail = parts[1] || mockEmail;
      console.log('🧪 [getUserFromToken] Extracted email from token:', mockEmail);
    } else {
      console.log('🧪 [getUserFromToken] No || found, using default email');
    }
    
    // Create a mock user object that matches Supabase user structure
    const mockUser = {
      id: accessToken.split('||')[0], // Use the dev-user-timestamp part as ID
      email: mockEmail,
      user_metadata: { name: 'Dev Mode User' },
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log('✅ [getUserFromToken] Mock user created successfully!');
    console.log('✅ [getUserFromToken] User ID:', mockUser.id);
    console.log('✅ [getUserFromToken] User email:', mockUser.email);
    return { user: mockUser, error: null };
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    // If there's an error from Supabase, handle it gracefully
    if (error) {
      // Only log non-session errors (session errors are expected when token expires)
      if (error.name !== 'AuthSessionMissingError' && error.message !== 'Auth session missing!') {
        console.log('ℹ️ [getUserFromToken] Auth error:', error.message);
      }
      return { user: null, error: { message: 'Invalid or expired token' } };
    }
    
    return { user, error: null };
  } catch (error: any) {
    // Silently handle session missing errors (they're expected)
    if (error?.name === 'AuthSessionMissingError' || error?.message?.includes('Auth session missing')) {
      return { user: null, error: { message: 'Session expired' } };
    }
    
    // Log unexpected errors
    console.log('⚠️ [getUserFromToken] Unexpected error:', error instanceof Error ? error.message : 'Unknown error');
    return { user: null, error: { message: 'Invalid or expired token' } };
  }
}

// Helper function to get access token from request (支援 X-Dev-Token header)
function getAccessToken(c: any): string | undefined {
  // 首先檢查 X-Dev-Token header（開發模式）
  const devToken = c.req.header('X-Dev-Token');
  if (devToken) {
    console.log('🔧 [getAccessToken] Using X-Dev-Token header');
    return devToken;
  }
  
  // 否則使用��準 Authorization header
  const authHeader = c.req.header('Authorization');
  if (authHeader) {
    return authHeader.split(' ')[1];
  }
  
  return undefined;
}

// Helper function to safely get profile from KV store
async function getProfileSafely(userId: string): Promise<any> {
  if (!userId) {
    return null;
  }
  
  try {
    const profile = await kv.get(`profile_${userId}`);
    return profile;
  } catch (error: any) {
    // Silently handle missing profiles - they might not exist yet
    // Don't log errors for missing profiles as it's a normal case
    return null;
  }
}

// Helper function to check if user has enterprise subscription
async function checkEnterpriseSubscription(userId: string): Promise<{ hasEnterprise: boolean; subscription: any }> {
  // 🔐 ROOT ADMIN: Check if this user is a root admin first
  const profile = await getProfileSafely(userId);
  const userEmail = profile?.email?.toLowerCase();
  
  const ROOT_ADMIN_EMAILS = [
    'davidlai234@hotmail.com',
    'davidjosephlai@gmail.com',
    'davidjosephlai@casewhr.com',
    'davidlai117@yahoo.com.tw',
    'admin@casewhr.com',
  ];
  
  if (userEmail && ROOT_ADMIN_EMAILS.includes(userEmail)) {
    console.log('👑 [checkEnterpriseSubscription] Root admin detected:', userEmail);
    
    // Root admins always have enterprise access
    const adminSubscription = {
      plan: 'enterprise',
      status: 'active',
      user_id: userId,
      is_root_admin: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    return { hasEnterprise: true, subscription: adminSubscription };
  }
  
  // 🧪 DEV MODE: Check if this is a dev user
  if (userId.startsWith('dev-user-')) {
    console.log('🧪 [checkEnterpriseSubscription] Dev mode detected for user:', userId);
    
    // In dev mode, always grant enterprise access
    const devSubscription = {
      plan: 'enterprise',
      status: 'active',
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log('✅ [checkEnterpriseSubscription] Granting enterprise access in dev mode');
    return { hasEnterprise: true, subscription: devSubscription };
  }
  
  const subscriptionKey = `subscription_${userId}`;
  const subscription = await kv.get(subscriptionKey);
  
  // ✅ 必須是 enterprise 且狀態為 active
  const hasEnterprise = subscription?.plan === 'enterprise' && subscription?.status === 'active';
  
  return { hasEnterprise, subscription };
}

// Initialize Storage Bucket for deliverables and avatars
const DELIVERABLES_BUCKET = 'make-215f78a5-deliverables';
const AVATARS_BUCKET = 'make-215f78a5-avatars';
let STORAGE_AVAILABLE = false; // Track storage availability

async function initializeStorage() {
  try {
    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.log('⚠️  Storage initialization skipped: Missing SUPABASE_URL or SERVICE_ROLE_KEY');
      return;
    }

    // Validate URL format
    try {
      new URL(supabaseUrl);
    } catch (error) {
      console.log('⚠️  Storage initialization skipped: Invalid SUPABASE_URL format');
      return;
    }

    console.log('🔍 Initializing storage...');
    
    // Try to list buckets with proper error handling
    let buckets;
    try {
      const response = await supabase.storage.listBuckets();
      buckets = response.data;
      
      if (response.error) {
        throw response.error;
      }
    } catch (storageError: any) {
      // Storage API might not be available - this is normal in Figma Make environment
      console.log('ℹ️  Storage API is not available in this environment.');
      console.log('ℹ️  File upload features will be disabled.');
      console.log('ℹ️  This is normal and the app will continue to work.');
      STORAGE_AVAILABLE = false;
      return;
    }
    
    // Create deliverables bucket
    const deliverablesExists = buckets?.some(bucket => bucket.name === DELIVERABLES_BUCKET);
    
    if (!deliverablesExists) {
      console.log('📦 Creating deliverables bucket...');
      const { error } = await supabase.storage.createBucket(DELIVERABLES_BUCKET, {
        public: false, // Private bucket
      });
      if (error) {
        // Check if error is because bucket already exists
        if (error.statusCode === '409' || error.message?.includes('already exists')) {
          console.log('✅ Deliverables bucket already exists (expected on restart)');
        } else {
          console.log('⚠️  Could not create deliverables bucket.');
        }
      } else {
        console.log('✅ Deliverables bucket created successfully');
      }
    } else {
      console.log('✅ Deliverables bucket exists');
    }
    
    // Create avatars bucket
    const avatarsExists = buckets?.some(bucket => bucket.name === AVATARS_BUCKET);
    
    if (!avatarsExists) {
      console.log('📦 Creating avatars bucket...');
      const { error } = await supabase.storage.createBucket(AVATARS_BUCKET, {
        public: true, // Public bucket for avatars
      });
      if (error) {
        if (error.statusCode === '409' || error.message?.includes('already exists')) {
          console.log('✅ Avatars bucket already exists (expected on restart)');
          STORAGE_AVAILABLE = true;
        } else {
          console.log('⚠️  Could not create avatars bucket.');
          STORAGE_AVAILABLE = false;
        }
      } else {
        console.log('✅ Avatars bucket created successfully');
        STORAGE_AVAILABLE = true;
      }
    } else {
      console.log('✅ Avatars bucket exists');
      STORAGE_AVAILABLE = true;
    }
    
    // Create KYC documents bucket
    const KYC_BUCKET = 'make-215f78a5-kyc-documents';
    const kycExists = buckets?.some(bucket => bucket.name === KYC_BUCKET);
    
    if (!kycExists) {
      console.log('📦 Creating KYC documents bucket...');
      const { error } = await supabase.storage.createBucket(KYC_BUCKET, {
        public: false, // Private bucket for sensitive documents
        fileSizeLimit: 5242880, // 5MB limit
      });
      if (error) {
        if (error.statusCode === '409' || error.message?.includes('already exists')) {
          console.log('✅ KYC documents bucket already exists (expected on restart)');
        } else {
          console.log('⚠️  Could not create KYC documents bucket:', error.message);
        }
      } else {
        console.log('✅ KYC documents bucket created successfully');
      }
    } else {
      console.log('✅ KYC documents bucket exists');
    }
  } catch (error: any) {
    console.log('ℹ️  Storage initialization completed with limitations.');
    STORAGE_AVAILABLE = false;
    // 不要抛出错误，让服务器继续运行
  }
}

// Initialize storage on server start
(async () => {
  try {
    // Initialize KYC and other buckets
    await initializeStorage();
    
    // Only use fileService initialization to avoid conflicts
    const storageReady = await fileService.initializeBuckets();
    STORAGE_AVAILABLE = storageReady || false;
    console.log('✅ [SERVER] Storage initialization completed, available:', STORAGE_AVAILABLE);
  } catch (error) {
    console.error('⚠️  [SERVER] Storage initialization failed, but server will continue:', error);
    STORAGE_AVAILABLE = false;
  }
})();

// Initialize admin system on server start
(async () => {
  try {
    await adminService.initializeAdminSystem();
    console.log('✅ [SERVER] Admin system initialization completed');
  } catch (error) {
    console.error('⚠️  [SERVER] Admin system initialization failed, but server will continue:', error);
  }
})();

// Enable CORS for all routes and methods - MUST BE BEFORE REGISTERING ROUTES
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-Dev-Token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);
console.log('✅ [SERVER] CORS configured');

// ✅ 超簡單健康檢查端點（在所有 middleware 之前）
app.get("/make-server-215f78a5/health", (c) => {
  return c.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    message: "Server is running" 
  });
});

// ✅ ECPay 配置檢查端點（在所有 middleware 之前）
app.get("/make-server-215f78a5/test-ecpay-config", (c) => {
  const merchantId = Deno.env.get('ECPAY_MERCHANT_ID');
  const hashKey = Deno.env.get('ECPAY_HASH_KEY');
  const hashIV = Deno.env.get('ECPAY_HASH_IV');
  const mode = Deno.env.get('ECPAY_MODE') || 'production';
  
  return c.json({
    merchantId: merchantId || '❌ NOT SET',
    hashKey: hashKey ? `${hashKey.substring(0, 4)}...${hashKey.substring(hashKey.length - 4)}` : '❌ NOT SET',
    hashIV: hashIV ? `${hashIV.substring(0, 4)}...${hashIV.substring(hashIV.length - 4)}` : '❌ NOT SET',
    mode,
    hashKeyLength: hashKey?.length || 0,
    hashIVLength: hashIV?.length || 0,
    hashKeyFull: hashKey, // ⚠️ 完整 Key（僅用於診斷）
    hashIVFull: hashIV,   // ⚠️ 完整 IV（僅用於診斷）
    status: (merchantId && hashKey && hashIV) ? '✅ ALL SET' : '❌ MISSING',
    
    // 📌 加入測試環境的正確 Key/IV（根據 ECPay 文件）
    testModeCheck: mode === 'test' ? {
      expectedMerchantId: '2000132',
      expectedHashKey: '5294y06JbISpM5x9',
      expectedHashIV: 'v77hoKGq4kWxNNIS',
      yourMerchantId: merchantId,
      yourHashKey: hashKey,
      yourHashIV: hashIV,
      isCorrect: (
        merchantId === '2000132' &&
        hashKey === '5294y06JbISpM5x9' &&
        hashIV === 'v77hoKGq4kWxNNIS'
      )
    } : '✅ Production mode - using your credentials'
  });
});

// Add global request logging middleware
app.use("/*", async (c, next) => {
  const path = c.req.path;
  const method = c.req.method;
  const hasAuth = !!c.req.header('Authorization');
  console.log(`🌐 [REQUEST] ${method} ${path} (Auth: ${hasAuth ? 'YES' : 'NO'})`);
  await next();
});
console.log('✅ [SERVER] Global request logging middleware configured');

// Add global middleware to ensure CORS headers on all responses (including errors)
app.use("/*", async (c, next) => {
  // Set CORS headers BEFORE processing the request
  c.res.headers.set('Access-Control-Allow-Origin', '*');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Dev-Token');
  
  await next();
});
console.log('✅ [SERVER] Global CORS headers middleware configured');

// Global error handling middleware
app.use("/*", async (c, next) => {
  try {
    await next();
  } catch (error) {
    console.error('❌ [SERVER] Global error caught:', error);
    console.error('❌ [SERVER] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ [SERVER] Request path:', c.req.path);
    console.error('❌ [SERVER] Request method:', c.req.method);
    
    // Return a proper error response
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      path: c.req.path,
    }, 500);
  }
});
console.log('✅ [SERVER] Global error handling middleware configured');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔓 PUBLIC ROUTES - NO AUTHENTICATION REQUIRED
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ECPay: Public query by order ID (must be BEFORE registerECPayRoutes)
app.get('/make-server-215f78a5/ecpay-payments/by-order/:orderId', async (c) => {
  try {
    const orderId = c.req.param('orderId');
    console.log(`🔍 [ECPay Public API] Query payment by order: ${orderId}`);
    
    const payment = await kv.get(`ecpay_payment:${orderId}`);
    
    if (!payment) {
      console.log(`❌ [ECPay Public API] Payment not found: ${orderId}`);
      return c.json({ error: 'Payment not found' }, 404);
    }

    const createdAt = new Date(payment.created_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    
    if (diffMinutes > 30 && payment.status === 'pending') {
      payment.status = 'expired';
      payment.updated_at = now.toISOString();
      payment.expire_reason = 'Payment timeout (30 minutes)';
      await kv.set(`ecpay_payment:${orderId}`, payment);
      console.log(`⏰ [ECPay Public API] Payment expired: ${orderId}`);
    }
    
    console.log(`✅ [ECPay Public API] Payment found:`, { orderId, status: payment.status });
    return c.json({ payment });
  } catch (error: any) {
    console.error('[ECPay Public API] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});
console.log('✅ [SERVER] ECPay public query route registered (NO AUTH)');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 🔍 Diagnostic endpoint for environment variables
app.get('/make-server-215f78a5/health/env-check', async (c) => {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  return c.json({
    timestamp: new Date().toISOString(),
    stripe_secret_key: {
      configured: !!stripeKey,
      prefix: stripeKey ? stripeKey.substring(0, 15) + '...' : 'NOT_SET',
      length: stripeKey?.length || 0,
      valid_format: stripeKey ? stripeKey.startsWith('sk_test_') || stripeKey.startsWith('sk_live_') : false,
    },
    stripe_webhook_secret: {
      configured: !!webhookSecret,
      prefix: webhookSecret ? webhookSecret.substring(0, 10) + '...' : 'NOT_SET',
    },
    message: stripeKey?.startsWith('sk_test_') || stripeKey?.startsWith('sk_live_') 
      ? '✅ Stripe configuration looks correct!' 
      : '��� Stripe key format is incorrect or not set',
  });
});

// Register admin APIs (Transactions & Memberships)
registerAdminApis(app);
console.log('✅ [SERVER] Admin APIs registered');

// Register ECPay payment management APIs
registerECPayRoutes(app);
console.log('✅ [SERVER] ECPay payment APIs registered');

// Register International Payout APIs
registerInternationalPayoutRoutes(app);
console.log('✅ [SERVER] International payout APIs registered');

// Register Internal Transfer APIs
registerInternalTransferRoutes(app);
console.log('✅ [SERVER] Internal transfer APIs registered');

// Register SinoPac Bank (永豐銀行) APIs
registerSinopacRoutes(app);
console.log('✅ [SERVER] SinoPac Bank (永豐銀行寰宇金融) APIs registered');

// 🔍 診斷：查找用戶by 郵箱
app.post('/make-server-215f78a5/debug/find-user', async (c) => {
  try {
    const { email } = await c.req.json();
    const { findUserByEmail } = await import('./internal_transfer_service.tsx');
    const result = await findUserByEmail(email);
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 🔍 診斷：查找用戶by 郵箱 (GET 版本 - 方便直接訪問)
app.get('/make-server-215f78a5/debug/find-user-by-email', async (c) => {
  try {
    const email = c.req.query('email');
    if (!email) {
      return c.json({ error: 'Missing email parameter' }, 400);
    }
    const { findUserByEmail } = await import('./internal_transfer_service.tsx');
    const result = await findUserByEmail(email);
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 🐛 診斷路由：查看 KV Store 中的轉帳記錄
app.get('/make-server-215f78a5/debug/transfer-records/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    const [sent, received] = await Promise.all([
      kv.get(`transfers_sent:${userId}`),
      kv.get(`transfers_received:${userId}`)
    ]);
    
    return c.json({
      userId,
      sent: sent || [],
      received: received || [],
      sentCount: Array.isArray(sent) ? sent.length : 0,
      receivedCount: Array.isArray(received) ? received.length : 0,
      sentType: typeof sent,
      receivedType: typeof received,
      sentIsArray: Array.isArray(sent),
      receivedIsArray: Array.isArray(received),
      sentRaw: JSON.stringify(sent).substring(0, 300),
      receivedRaw: JSON.stringify(received).substring(0, 300)
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 🐛 診斷路由：查看用戶訂閱資料（檢查為什麼顯示錯誤）
app.get('/make-server-215f78a5/debug/subscription/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    // 檢查兩種格式的訂閱記錄
    const subscription_new = await kv.get(`subscription_${userId}`);
    const subscription_old = await kv.get(`subscription:${userId}`);
    
    // 檢查 profile
    const profile_new = await kv.get(`profile_${userId}`);
    const profile_old = await kv.get(`profile:${userId}`);
    
    // 計算最終顯示的等級（按照 API 邏輯）
    const subscription = subscription_new || subscription_old;
    const profile = profile_new || profile_old;
    const finalTier = subscription?.plan || subscription?.tier || profile?.membership_tier || 'free';
    
    return c.json({
      userId,
      subscription_formats: {
        new_format: subscription_new ? '✅ 存在' : '❌ 不存在',
        old_format: subscription_old ? '✅ 存在' : '❌ 不存在',
      },
      subscription_data: {
        new_format: subscription_new,
        old_format: subscription_old,
      },
      profile_formats: {
        new_format: profile_new ? '✅ 存在' : '❌ 不存在',
        old_format: profile_old ? '✅ 存在' : '❌ 不存在',
      },
      profile_membership_tier: profile?.membership_tier,
      calculated_tier: finalTier,
      priority_explanation: {
        step1: `subscription.plan = ${subscription?.plan || 'null'}`,
        step2: `subscription.tier = ${subscription?.tier || 'null'}`,
        step3: `profile.membership_tier = ${profile?.membership_tier || 'null'}`,
        step4: `default = 'free'`,
        result: finalTier
      }
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 🐛 診斷路由：通過 email 查看訂閱資料
app.get('/make-server-215f78a5/debug/subscription-by-email', async (c) => {
  try {
    const email = c.req.query('email');
    if (!email) {
      return c.json({ error: 'Missing email parameter' }, 400);
    }
    
    // 從 Supabase Auth 查找用戶
    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUser = authData?.users?.find(u => u.email === email);
    
    if (!authUser) {
      return c.json({ error: 'User not found in auth system' }, 404);
    }
    
    const userId = authUser.id;
    
    // 檢查兩種格式的訂閱記錄
    const subscription_new = await kv.get(`subscription_${userId}`);
    const subscription_old = await kv.get(`subscription:${userId}`);
    
    // 檢查 profile
    const profile_new = await kv.get(`profile_${userId}`);
    const profile_old = await kv.get(`profile:${userId}`);
    
    // 計算最終顯示的等級（按照 API 邏輯）
    const subscription = subscription_new || subscription_old;
    const profile = profile_new || profile_old;
    const finalTier = subscription?.plan || subscription?.tier || profile?.membership_tier || 'free';
    
    return c.json({
      email,
      userId,
      subscription_formats: {
        new_format: subscription_new ? '✅ 存在' : '❌ 不存在',
        old_format: subscription_old ? '✅ 存在' : '❌ 不存在',
      },
      subscription_data: {
        new_format: subscription_new,
        old_format: subscription_old,
      },
      profile_formats: {
        new_format: profile_new ? '✅ 存在' : '❌ 不存在',
        old_format: profile_old ? '✅ 存在' : '❌ 不存在',
      },
      profile_membership_tier: profile?.membership_tier,
      calculated_tier: finalTier,
      priority_explanation: {
        step1: `subscription.plan = ${subscription?.plan || 'null'}`,
        step2: `subscription.tier = ${subscription?.tier || 'null'}`,
        step3: `profile.membership_tier = ${profile?.membership_tier || 'null'}`,
        step4: `default = 'free'`,
        result: finalTier
      }
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 🔧 修復端點：直接設定用戶的訂閱等級
app.post('/make-server-215f78a5/debug/fix-subscription', async (c) => {
  try {
    const { email, tier } = await c.req.json();
    
    if (!email || !tier) {
      return c.json({ error: 'Missing email or tier parameter' }, 400);
    }
    
    // 驗證 tier 是否合法
    const validTiers = ['free', 'pro', 'enterprise'];
    if (!validTiers.includes(tier)) {
      return c.json({ error: `Invalid tier. Must be one of: ${validTiers.join(', ')}` }, 400);
    }
    
    // 從 Supabase Auth 查找用戶
    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUser = authData?.users?.find(u => u.email === email);
    
    if (!authUser) {
      return c.json({ error: 'User not found in auth system' }, 404);
    }
    
    const userId = authUser.id;
    
    // 讀取現有的 subscription 和 profile（新舊格式都讀取）
    const subscription_new = await kv.get(`subscription_${userId}`) || {};
    const subscription_old = await kv.get(`subscription:${userId}`) || {};
    const profile_new = await kv.get(`profile_${userId}`) || {};
    const profile_old = await kv.get(`profile:${userId}`) || {};
    
    // 更新訂閱資料（兩種格式都更新）
    const updatedSubscription = {
      ...subscription_new,
      plan: tier,
      tier: tier,
      status: 'active',
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`subscription_${userId}`, updatedSubscription);
    await kv.set(`subscription:${userId}`, updatedSubscription);
    
    // 更新 profile 的 membership_tier（兩種格式都更新）
    const profile = profile_new || profile_old || {};
    const updatedProfile = {
      ...profile,
      membership_tier: tier,
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`profile_${userId}`, updatedProfile);
    await kv.set(`profile:${userId}`, updatedProfile);
    
    return c.json({
      success: true,
      message: `Successfully updated ${email} to ${tier}`,
      userId,
      updated_data: {
        subscription: updatedSubscription,
        profile: updatedProfile
      }
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 🔍 診斷端點：列出所有 KV Store 中的用戶資料
app.get('/make-server-215f78a5/debug/list-all-users', async (c) => {
  try {
    // 獲取所有 profile
    const newFormatProfiles = (await kv.getByPrefix('profile_') || []).map(item => item.value);
    const oldFormatProfiles = (await kv.getByPrefix('profile:') || []).map(item => item.value);
    
    // 獲取所有 subscription
    const newFormatSubs = (await kv.getByPrefix('subscription_') || []).map(item => item.value);
    const oldFormatSubs = (await kv.getByPrefix('subscription:') || []).map(item => item.value);
    
    // 從 Supabase Auth 獲取所有用戶
    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUsers = authData?.users || [];
    
    return c.json({
      kv_store: {
        profiles_new_format: newFormatProfiles.length,
        profiles_old_format: oldFormatProfiles.length,
        subscriptions_new_format: newFormatSubs.length,
        subscriptions_old_format: oldFormatSubs.length,
        profile_samples: newFormatProfiles.slice(0, 3).map((p: any) => ({
          user_id: p.user_id,
          email: p.email,
          membership_tier: p.membership_tier
        })),
        subscription_samples: newFormatSubs.slice(0, 3).map((s: any) => ({
          user_id: s.user_id,
          plan: s.plan,
          tier: s.tier,
          status: s.status
        }))
      },
      supabase_auth: {
        total_users: authUsers.length,
        user_samples: authUsers.slice(0, 5).map((u: any) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at
        }))
      },
      diagnosis: {
        message: '如果 KV Store 的用戶數量 < Supabase Auth 的用戶數量，代表某些真實用戶沒有建立 profile/subscription'
      }
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 🔧 批量修復端點：為所有現有用戶創建缺失的 wallet 和 subscription
app.post('/make-server-215f78a5/debug/fix-all-users', async (c) => {
  try {
    console.log('🔧 [批量修復] 開始修復所有用戶資料...');
    
    // 從 Supabase Auth 獲取所有用戶
    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUsers = authData?.users || [];
    
    console.log(`📊 [批量修復] 找到 ${authUsers.length} 個 Auth 用戶`);
    
    const results = {
      total_users: authUsers.length,
      profiles_created: 0,
      wallets_created: 0,
      subscriptions_created: 0,
      errors: [] as string[],
    };
    
    // 逐一檢查並修復每個用戶
    for (const authUser of authUsers) {
      const userId = authUser.id;
      const email = authUser.email || '';
      const name = authUser.user_metadata?.name || authUser.user_metadata?.full_name || '';
      
      try {
        // 1️⃣ 檢查並創建 Profile
        let profile = await kv.get(`profile_${userId}`);
        if (!profile) {
          profile = await kv.get(`profile:${userId}`); // 檢查舊格式
        }
        
        if (!profile) {
          console.log(`📝 [批量修復] 為用戶 ${email} 創建 profile...`);
          const newProfile = {
            user_id: userId,
            email: email,
            full_name: name,
            account_type: 'client',
            created_at: authUser.created_at,
            updated_at: new Date().toISOString(),
          };
          await kv.set(`profile_${userId}`, newProfile);
          results.profiles_created++;
        }
        
        // 2️⃣ 檢查並創建 Wallet
        let wallet = await kv.get(`wallet_${userId}`);
        if (!wallet) {
          wallet = await kv.get(`wallet:${userId}`); // 檢查舊格式
        }
        
        if (!wallet) {
          console.log(`💰 [批量修復] 為用戶 ${email} 創建 wallet...`);
          const newWallet = {
            user_id: userId,
            available_balance: 0,
            pending_balance: 0,
            total_deposited: 0,
            total_withdrawn: 0,
            created_at: authUser.created_at,
            updated_at: new Date().toISOString(),
          };
          await kv.set(`wallet_${userId}`, newWallet);
          results.wallets_created++;
        }
        
        // 3️⃣ 檢查並創建 Subscription
        let subscription = await kv.get(`subscription_${userId}`);
        if (!subscription) {
          subscription = await kv.get(`subscription:${userId}`); // 檢查舊格式
        }
        
        if (!subscription) {
          console.log(`📋 [批量修復] 為用戶 ${email} 創建 subscription (free)...`);
          const newSubscription = {
            user_id: userId,
            plan: 'free',
            tier: 'free',
            status: 'active',
            created_at: authUser.created_at,
            updated_at: new Date().toISOString(),
          };
          await kv.set(`subscription_${userId}`, newSubscription);
          results.subscriptions_created++;
        }
        
      } catch (userError: any) {
        const errorMsg = `Failed to fix user ${email}: ${userError.message}`;
        console.error(`❌ [批量修復] ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }
    
    console.log('✅ [批量修復] 完成！結果:', results);
    
    return c.json({
      success: true,
      message: '批量修復完成',
      results
    });
    
  } catch (error: any) {
    console.error('❌ [批量修復] 致命錯誤:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Register Milestone Management APIs
app.route('/make-server-215f78a5', milestoneRoutes);
console.log('✅ [SERVER] Milestone management APIs registered');

// 🧪 DEV MODE: Manual fix for proposal milestone_plan_status
app.post("/make-server-215f78a5/dev/fix-proposal-status", async (c) => {
  try {
    const { proposalId, status } = await c.req.json();
    
    if (!proposalId || !status) {
      return c.json({ error: 'proposalId and status are required' }, 400);
    }
    
    console.log(`🔧 [DEV FIX] Updating proposal ${proposalId} milestone_plan_status to "${status}"`);
    
    // Get proposal
    const proposal = await kv.get(`proposal:${proposalId}`);
    if (!proposal) {
      return c.json({ error: 'Proposal not found' }, 404);
    }
    
    // Update milestone_plan_status
    const updatedProposal = {
      ...proposal,
      milestone_plan_status: status
    };
    
    await kv.set(`proposal:${proposalId}`, updatedProposal);
    
    // Also update milestone_plan if it exists
    const milestonePlan = await kv.get(`milestone_plan:${proposalId}`);
    if (milestonePlan) {
      await kv.set(`milestone_plan:${proposalId}`, {
        ...milestonePlan,
        status: status,
        reviewed_at: new Date().toISOString()
      });
    }
    
    console.log(`✅ [DEV FIX] Successfully updated proposal ${proposalId}`);
    
    return c.json({ 
      success: true, 
      message: `Updated proposal ${proposalId} to status "${status}"`,
      proposal: updatedProposal
    });
  } catch (error) {
    console.error('[DEV FIX] Error:', error);
    return c.json({ error: 'Failed to update proposal' }, 500);
  }
});

// Register AI Chatbot APIs
app.route('/make-server-215f78a5/chatbot', aiChatbotService);
console.log('✅ [SERVER] AI Chatbot APIs registered');

// Register AI SEO APIs
app.route('/make-server-215f78a5/ai', aiSeoRoutes);
console.log('✅ [SERVER] AI SEO APIs registered');

// Register Dynamic Sitemap APIs
app.route('/make-server-215f78a5/sitemap', sitemapRouter);
console.log('✅ [SERVER] Dynamic Sitemap APIs registered');

// 🔗 Register Internal Link Management APIs
app.get('/make-server-215f78a5/seo/internal-links', async (c) => {
  try {
    const links = await internalLinkScanner.getInternalLinks();
    const opportunities = await internalLinkScanner.generateLinkOpportunities();
    
    return c.json({
      links,
      opportunities,
      lastUpdated: await kv.get('seo:internal_links_updated_at'),
    });
  } catch (error: any) {
    console.error('❌ [SEO] Failed to get internal links:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/make-server-215f78a5/seo/scan-website', async (c) => {
  try {
    let baseUrl = 'https://casewhr.com';
    
    // 安全地解析 JSON，如果沒有 body 則使用默認值
    try {
      const body = await c.req.json();
      baseUrl = body.baseUrl || baseUrl;
    } catch (e) {
      console.log('🔍 [SEO] No body provided, using default URL');
    }
    
    console.log(`🔍 [SEO] Starting website scan: ${baseUrl}`);
    
    const result = await internalLinkScanner.scanWebsite(baseUrl);
    
    return c.json(result);
  } catch (error: any) {
    console.error('❌ [SEO] Failed to scan website:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/make-server-215f78a5/seo/check-links', async (c) => {
  try {
    let baseUrl = 'https://casewhr.com';
    
    // 安全地解析 JSON，如果沒有 body 則使用默認值
    try {
      const body = await c.req.json();
      baseUrl = body.baseUrl || baseUrl;
    } catch (e) {
      console.log('🔍 [SEO] No body provided, using default URL');
    }
    
    console.log(`🔍 [SEO] Checking all links for: ${baseUrl}`);
    
    const result = await internalLinkScanner.checkLinks(baseUrl);
    const links = await internalLinkScanner.getInternalLinks();
    
    return c.json({ ...result, links });
  } catch (error: any) {
    console.error('❌ [SEO] Failed to check links:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/make-server-215f78a5/seo/analyze-page', async (c) => {
  try {
    let url = '/';
    let baseUrl = 'https://casewhr.com';
    
    // 安全地解析 JSON，如果沒有 body 則使用默認值
    try {
      const body = await c.req.json();
      url = body.url || url;
      baseUrl = body.baseUrl || baseUrl;
    } catch (e) {
      console.log('📊 [SEO] No body provided, using default values');
    }
    
    console.log(`📊 [SEO] Analyzing page: ${url}`);
    
    const analysis = await internalLinkScanner.analyzePage(url, baseUrl);
    
    return c.json({ analysis });
  } catch (error: any) {
    console.error('❌ [SEO] Failed to analyze page:', error);
    return c.json({ error: error.message }, 500);
  }
});

console.log('✅ [SERVER] Internal Link Management APIs registered');

// 📝 Blog Posts API
app.get('/make-server-215f78a5/blog/posts', async (c) => {
  try {
    console.log('📥 [BLOG API] Loading all posts...');
    
    // 獲取 limit 參數（默認返回所有）
    const limitParam = c.req.query('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    console.log('📥 [BLOG API] Limit param:', limit);
    
    const allItems = await kv.getByPrefix('blog_post_');
    console.log('📋 [BLOG API] Raw items from KV:', allItems.length);

    // getByPrefix returns { key, value } objects — extract values
    const rawPosts = allItems.map((item: any) => item?.value ?? item);

    // 轉換為文章對象並按發布日期排序（最新的在前）
    let posts = rawPosts
      .filter((post: any) => post != null && typeof post === 'object' && (post.publishedAt || post.createdAt)) // 過濾掉無效數據
      .sort((a: any, b: any) => new Date(b.publishedAt || b.createdAt || 0).getTime() - new Date(a.publishedAt || a.createdAt || 0).getTime());
    
    console.log('📋 [BLOG API] Sorted posts:', posts.length);
    
    // 如果有 limit 參數，只返回前 N 篇
    if (limit && limit > 0) {
      posts = posts.slice(0, limit);
      console.log(`📋 [BLOG API] Limited to ${limit} posts:`, posts.length);
    }
    
    console.log('✅ [BLOG API] Returning posts:', posts.length);
    if (posts.length > 0) {
      console.log('📋 [BLOG API] First post:', {
        id: posts[0].id,
        slug: posts[0].slug,
        title: posts[0].title,
        publishedAt: posts[0].publishedAt
      });
    }
    
    return c.json({ posts: posts });
  } catch (error: any) {
    console.error('❌ [BLOG] Failed to load posts:', error);
    return c.json({ error: error.message, posts: [] }, 500);
  }
});

app.get('/make-server-215f78a5/blog/posts/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const post = await kv.get(`blog_post_${slug}`);
    
    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }
    
    // 獲取相關文章（同類別的其他文章）
    const allItems2 = await kv.getByPrefix('blog_post_');
    const allPosts = allItems2.map((item: any) => item?.value ?? item);
    const relatedPosts = allPosts
      .filter((p: any) => p.slug !== slug && p.category === post.category)
      .slice(0, 3);
    
    return c.json({ post, relatedPosts });
  } catch (error: any) {
    console.error('❌ [BLOG] Failed to load post:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/make-server-215f78a5/blog/posts/:slug/view', async (c) => {
  try {
    const slug = c.req.param('slug');
    const post = await kv.get(`blog_post_${slug}`);
    
    if (post) {
      post.views = (post.views || 0) + 1;
      await kv.set(`blog_post_${slug}`, post);
    }
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ [BLOG] Failed to increment views:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 📝 Create/Update Blog Post (All logged-in users)
app.post('/make-server-215f78a5/blog/posts', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const post = await c.req.json();
    
    // 驗證必填欄位
    if (!post.slug || !post.title) {
      return c.json({ error: 'Slug and title are required' }, 400);
    }
    
    // 🔥 檢查權限：只能編輯自己的文章，除非是超級管理員
    const existingPost = await kv.get(`blog_post_${post.slug}`);
    const SUPER_ADMINS = ['davidlai234@hotmail.com', 'davidlai117@yahoo.com.tw'];
    const isSuperAdmin = user.email && SUPER_ADMINS.includes(user.email);
    
    if (existingPost && existingPost.authorEmail !== user.email && !isSuperAdmin) {
      return c.json({ error: 'You can only edit your own posts' }, 403);
    }
    
    // 設置作者資訊
    if (!existingPost) {
      // 新文章：設置作者
      post.author = user.email || 'Anonymous';
      post.authorEmail = user.email;
    } else {
      // 編輯現有文章：保留原作者資訊
      post.author = existingPost.author;
      post.authorEmail = existingPost.authorEmail;
    }
    
    // 儲存文章
    await kv.set(`blog_post_${post.slug}`, post);
    
    console.log(`✅ [BLOG] Post saved: ${post.slug} by ${user.email}`);
    return c.json({ success: true, post });
  } catch (error: any) {
    console.error('❌ [BLOG] Failed to save post:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 🗑️ Delete Blog Post (User can delete own posts)
app.delete('/make-server-215f78a5/blog/posts/:slug', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const slug = c.req.param('slug');
    const post = await kv.get(`blog_post_${slug}`);
    
    // 🔥 檢查權限：只能刪除自己的文章，除非是超級管理員
    const SUPER_ADMINS = ['davidlai234@hotmail.com', 'davidlai117@yahoo.com.tw'];
    const isSuperAdmin = user.email && SUPER_ADMINS.includes(user.email);
    if (post && post.authorEmail !== user.email && !isSuperAdmin) {
      return c.json({ error: 'You can only delete your own posts' }, 403);
    }
    
    await kv.del(`blog_post_${slug}`);
    
    console.log(`✅ [BLOG] Post deleted: ${slug} by ${user.email}`);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ [BLOG] Failed to delete post:', error);
    return c.json({ error: error.message }, 500);
  }
});

console.log('✅ [SERVER] Blog APIs registered');

// 🧪 Test health endpoint BEFORE wismachion routes
app.get('/make-server-215f78a5/wismachion/health-test', (c) => {
  console.log('🩺 [HEALTH-TEST] Direct health-test endpoint hit!');
  return c.json({ 
    status: 'ok', 
    message: 'Direct test route working!',
    timestamp: new Date().toISOString()
  });
});

// Register Wismachion License APIs
app.route('/make-server-215f78a5/wismachion', wismachionRoutes);
console.log('✅ [SERVER] Wismachion License APIs registered');

// Register Video AI Processing APIs
app.route('/make-server-215f78a5/video-ai', videoAiRoutes);
console.log('✅ [SERVER] Video AI Processing APIs registered');

// Register Invoice Management APIs
app.route('/make-server-215f78a5', invoiceService.default);
console.log('✅ [SERVER] Invoice management APIs registered');

// Register Subscription Notification APIs
registerSubscriptionNotificationRoutes(app);
console.log('✅ [SERVER] Subscription notification APIs registered');

// ⚠️ Edge Functions 不支持 setInterval 長時間運行
// 訂閱檢查改用外部 Cron Job 或手動觸發 API
console.log('ℹ️ [SERVER] Subscription monitoring available via API endpoints:');
console.log('  - POST /make-server-215f78a5/subscription/check-expiry');
console.log('  - POST /make-server-215f78a5/subscription/cleanup-notifications');
console.log('ℹ️ [SERVER] Set up external cron (e.g., GitHub Actions) to call these endpoints daily');

// 🔧 Update admin profile - Fix admin permissions
app.post("/make-server-215f78a5/update-admin-profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      // Silently return 401 for unauthenticated requests
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { userId, email, isAdmin, adminLevel } = body;

    console.log('🔧 [Update Admin Profile] Request:', {
      requestedUserId: userId,
      requestedEmail: email,
      currentUserId: user.id,
      currentEmail: user.email,
      isAdmin,
      adminLevel
    });

    // 只允許用戶更新自己的 profile
    if (userId !== user.id) {
      console.error('❌ [Update Admin Profile] User ID mismatch');
      return c.json({ error: 'Cannot update other user profile' }, 403);
    }

    // 查找現有的 profile（支持兩種格式）
    const profileKeyUnderscore = `profile_${userId}`;
    const profileKeyColon = `profile:${userId}`;
    
    let existingProfile = await kv.get(profileKeyUnderscore);
    if (!existingProfile) {
      existingProfile = await kv.get(profileKeyColon);
    }

    console.log('📋 [Update Admin Profile] Existing profile:', existingProfile);

    // 更新 profile，保留其他字段
    const updatedProfile = {
      ...(existingProfile || {}),
      user_id: userId,
      isAdmin: isAdmin === true,
      adminLevel: adminLevel || 'SUPERADMIN',
      updated_at: new Date().toISOString()
    };

    // 保存更新後的 profile（同時更新兩種格式）
    await kv.set(profileKeyUnderscore, updatedProfile);
    await kv.set(profileKeyColon, updatedProfile);

    console.log('✅ [Update Admin Profile] Profile updated successfully:', updatedProfile);

    return c.json({
      success: true,
      message: 'Admin profile updated successfully',
      profile: updatedProfile
    });

  } catch (error: any) {
    console.error('❌ [Update Admin Profile] Error:', error);
    return c.json({
      error: 'Failed to update admin profile',
      details: error.message
    }, 500);
  }
});

// Enable logger - only log errors to reduce noise
// app.use('*', logger((str: string) => {
//   // Log to stderr instead of stdout to avoid interfering with HTTP responses
//   console.error(str);
// }));

// Simple test endpoint to verify server is running
app.get("/make-server-215f78a5/ping", (c) => {
  console.log('🏓 [SERVER] Ping endpoint hit');
  return c.json({ status: "pong", timestamp: new Date().toISOString() });
});

// 🟢 LINE OAuth: 生成授權 URL
app.get("/make-server-215f78a5/auth/line", async (c) => {
  try {
    console.log('🟢 [LINE OAuth] Generating auth URL...');
    
    // 生成隨機 state 用於 CSRF 保護
    const state = crypto.randomUUID();
    
    // 將 state 存儲到 KV（5分鐘過期）
    await kv.set(`line_oauth_state:${state}`, {
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
    
    const authUrl = lineAuth.generateLineAuthUrl(state);
    
    console.log('✅ [LINE OAuth] Auth URL generated');
    return c.json({ authUrl, state });
  } catch (error: any) {
    console.error('❌ [LINE OAuth] Error generating auth URL:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 🟢 LINE OAuth: 處理回調
app.get("/make-server-215f78a5/auth/line/callback", async (c) => {
  try {
    console.log('🟢 [LINE OAuth] ========================================');
    console.log('🟢 [LINE OAuth] Callback endpoint hit');
    console.log('🟢 [LINE OAuth] Full URL:', c.req.url);
    console.log('🟢 [LINE OAuth] Method:', c.req.method);
    console.log('🟢 [LINE OAuth] Environment check:', {
      hasChannelId: !!Deno.env.get('LINE_CHANNEL_ID'),
      hasChannelSecret: !!Deno.env.get('LINE_CHANNEL_SECRET'),
      hasCallbackUrl: !!Deno.env.get('LINE_CALLBACK_URL'),
    });
    
    const code = c.req.query('code');
    const state = c.req.query('state');
    const errorParam = c.req.query('error');
    const errorDescription = c.req.query('error_description');
    
    console.log('🟢 [LINE OAuth] Query parameters:', { 
      hasCode: !!code, 
      code: code ? `${code.substring(0, 10)}...` : 'null',
      hasState: !!state, 
      state: state || 'null',
      error: errorParam || 'null',
      errorDescription: errorDescription || 'null'
    });
    console.log('🟢 [LINE OAuth] ========================================');
    
    // 檢查環境變數
    if (!Deno.env.get('LINE_CHANNEL_ID') || !Deno.env.get('LINE_CHANNEL_SECRET')) {
      console.error('❌ [LINE OAuth] LINE credentials not configured!');
      return c.redirect(`https://casewhr.com?error=line_not_configured&message=${encodeURIComponent('LINE Channel ID or Secret not configured. Please set environment variables in Supabase Dashboard.')}`);
    }
    
    // 檢查是否有錯誤
    if (errorParam) {
      console.error('❌ [LINE OAuth] Authorization failed:', errorParam);
      return c.redirect(`https://casewhr.com?error=line_auth_failed&message=${errorParam}`);
    }
    
    // 驗證必要參數
    if (!code || !state) {
      console.error('❌ [LINE OAuth] Missing code or state');
      return c.redirect(`https://casewhr.com?error=line_auth_failed&message=${encodeURIComponent('Missing code or state parameter. Please try again.')}`);
    }
    
    // 驗證 state（CSRF 保護）
    const savedState = await kv.get(`line_oauth_state:${state}`);
    if (!savedState) {
      console.error('❌ [LINE OAuth] Invalid or expired state');
      return c.redirect(`https://casewhr.com?error=line_auth_failed&message=${encodeURIComponent('Invalid or expired state. Please try logging in again.')}`);
    }
    
    // 刪除已使用的 state
    await kv.del(`line_oauth_state:${state}`);
    
    // 執行 LINE 登入流程
    const { user, userId, email, needsEmail } = await lineAuth.handleLineCallback(code);
    
    console.log('✅ [LINE OAuth] Login successful:', email);
    console.log('🔍 [LINE OAuth] Needs email update:', needsEmail);
    
    // 將用戶信息存儲到 KV（供前端使用）
    const tempLoginKey = `temp_line_login:${userId}`;
    await kv.set(tempLoginKey, {
      user_id: userId,
      email: email,
      full_name: user.user_metadata?.full_name || 'LINE User',
      avatar_url: user.user_metadata?.avatar_url || '',
      needs_email_update: needsEmail, // 添加標記
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5分鐘過期
    });
    
    console.log('✅ [LINE OAuth] Temp login data stored:', tempLoginKey);
    
    // 重定向回前端並帶上臨時登錄 key
    const redirectUrl = new URL('https://casewhr.com');
    redirectUrl.searchParams.set('view', 'dashboard');
    redirectUrl.searchParams.set('auth', 'line');
    redirectUrl.searchParams.set('temp_key', userId);
    redirectUrl.searchParams.set('email', email);
    redirectUrl.searchParams.set('needs_email', needsEmail.toString()); // 添加標記到 URL
    
    return c.redirect(redirectUrl.toString());
  } catch (error: any) {
    console.error('❌ [LINE OAuth] ========================================');
    console.error('❌ [LINE OAuth] Callback error:', error);
    console.error('❌ [LINE OAuth] Error stack:', error.stack);
    console.error('❌ [LINE OAuth] Error type:', typeof error);
    console.error('❌ [LINE OAuth] Error name:', error.name);
    console.error('❌ [LINE OAuth] ========================================');
    return c.redirect(`https://casewhr.com?error=line_login_failed&message=${encodeURIComponent(error.message || 'Unknown error')}`);
  }
});

// 🟢 LINE OAuth: Exchange code for token (前端調用 - 新架構)
app.post("/make-server-215f78a5/auth/line/exchange-token", async (c) => {
  try {
    const { code, state } = await c.req.json();
    
    console.log('🟢 [LINE Token Exchange] Request received:', { 
      hasCode: !!code, 
      hasState: !!state 
    });
    
    // 檢查環境變數
    if (!Deno.env.get('LINE_CHANNEL_ID') || !Deno.env.get('LINE_CHANNEL_SECRET')) {
      console.error('❌ [LINE Token Exchange] LINE credentials not configured!');
      return c.json({ 
        error: 'line_not_configured',
        message: 'LINE Channel ID or Secret not configured. Please set environment variables in Supabase Dashboard.'
      }, 500);
    }
    
    // 驗證必要參數
    if (!code || !state) {
      console.error('❌ [LINE Token Exchange] Missing code or state');
      return c.json({ 
        error: 'missing_parameters',
        message: 'Missing code or state parameter'
      }, 400);
    }
    
    // 驗證 state（CSRF 保護）
    const savedState = await kv.get(`line_oauth_state:${state}`);
    if (!savedState) {
      console.error('❌ [LINE Token Exchange] Invalid or expired state');
      return c.json({ 
        error: 'invalid_state',
        message: 'Invalid or expired state. Please try logging in again.'
      }, 400);
    }
    
    // 刪除已使用的 state
    await kv.del(`line_oauth_state:${state}`);
    
    // 執行 LINE 登入流程
    const { user, userId, email, magicLink, needsEmail } = await lineAuth.handleLineCallback(code);
    
    console.log('✅ [LINE Token Exchange] Login successful:', email);
    console.log('🔍 [LINE Token Exchange] Needs email update:', needsEmail);
    
    // 檢查是否需要更新 email
    const needsEmailUpdate = needsEmail;
    if (needsEmailUpdate) {
      console.log('⚠️ [LINE Token Exchange] User needs to provide real email');
    }
    
    return c.json({
      success: true,
      user: {
        id: userId,
        email: email,
        full_name: user.user_metadata?.full_name || 'LINE User',
        avatar_url: user.user_metadata?.avatar_url || '',
      },
      magic_link: magicLink, // Return the magic link for frontend to use
      needsEmailUpdate, // Tell frontend if email needs updating
    });
  } catch (error: any) {
    console.error('❌ [LINE Token Exchange] Error:', error);
    console.error('❌ [LINE Token Exchange] Error stack:', error.stack);
    return c.json({ 
      error: 'exchange_failed',
      message: error.message || 'Unknown error'
    }, 500);
  }
});

// 🟢 LINE OAuth: 更新用戶 email
app.post("/make-server-215f78a5/auth/line/update-email", async (c) => {
  try {
    const { user_id, email } = await c.req.json();
    
    console.log('🟢 [LINE Update Email] Request received:', { user_id, email });
    
    // 驗證必要參數
    if (!user_id || !email) {
      console.error('❌ [LINE Update Email] Missing parameters');
      return c.json({ 
        error: 'missing_parameters',
        message: 'Missing user_id or email parameter'
      }, 400);
    }
    
    // 調用 line-auth 服務更新 email
    const { magicLink, linked } = await lineAuth.updateLineUserEmail(user_id, email);
    
    console.log('✅ [LINE Update Email] Email updated successfully');
    if (linked) {
      console.log('✨ [LINE Update Email] Accounts linked successfully');
    }
    
    return c.json({
      success: true,
      message: linked ? 'Accounts linked successfully' : 'Email updated successfully',
      magic_link: magicLink,
      linked: linked || false,
    });
  } catch (error: any) {
    console.error('❌ [LINE Update Email] Error:', error);
    return c.json({ 
      error: 'update_failed',
      message: error.message || 'Unknown error'
    }, 500);
  }
});

// 🟢 LINE OAuth: 完成登入（生成 Supabase session）
app.post("/make-server-215f78a5/auth/line/complete", async (c) => {
  try {
    const { temp_key, email } = await c.req.json();
    
    console.log('🟢 [LINE Auth Complete] Request received:', { temp_key, email });
    
    if (!temp_key || !email) {
      console.error('❌ [LINE Auth Complete] Missing parameters');
      return c.json({ error: 'Missing temp_key or email' }, 400);
    }
    
    // 從 KV 讀取臨時登錄資料
    const tempData = await kv.get(`temp_line_login:${temp_key}`);
    
    if (!tempData) {
      console.error('❌ [LINE Auth Complete] Temp login data not found or expired');
      return c.json({ error: 'Login session expired. Please try again.' }, 404);
    }
    
    // 驗證郵箱匹配
    if (tempData.email !== email) {
      console.error('❌ [LINE Auth Complete] Email mismatch');
      return c.json({ error: 'Invalid login session' }, 403);
    }
    
    // 刪除臨時數據
    await kv.del(`temp_line_login:${temp_key}`);
    
    console.log('✅ [LINE Auth Complete] Temp data validated and deleted');
    
    // 生成 Supabase magic link 供用戶登錄
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });
    
    if (error || !data) {
      console.error('❌ [LINE Auth Complete] Failed to generate login link:', error);
      return c.json({ error: 'Failed to complete login' }, 500);
    }
    
    console.log('✅ [LINE Auth Complete] Magic link generated successfully');
    
    // 從 magic link 中提取 token 並返回給前端
    // Magic link 格式: https://.../#access_token=xxx&...
    const url = data.properties?.action_link || '';
    const hashPart = url.split('#')[1] || '';
    const params = new URLSearchParams(hashPart);
    const accessToken = params.get('access_token');
    
    if (!accessToken) {
      console.error('❌ [LINE Auth Complete] Failed to extract access token from magic link');
      return c.json({ error: 'Failed to generate access token' }, 500);
    }
    
    console.log('✅ [LINE Auth Complete] Access token extracted successfully');
    
    return c.json({
      success: true,
      access_token: accessToken,
      user: {
        id: tempData.user_id,
        email: tempData.email,
        full_name: tempData.full_name,
        avatar_url: tempData.avatar_url,
      },
    });
  } catch (error: any) {
    console.error('❌ [LINE Auth Complete] Error:', error);
    return c.json({ error: error.message || 'Unknown error' }, 500);
  }
});

console.log('✅ [SERVER] LINE OAuth routes registered');

// 🗺️ SEO: Sitemap.xml endpoint
app.get("/make-server-215f78a5/sitemap.xml", (c) => {
  console.log('🗺️ [SEO] Sitemap.xml requested');
  
  const siteUrl = 'https://casewhr.com';
  const now = new Date().toISOString().split('T')[0];
  
  // 定義所有公開頁面
  const pages = [
    { path: '/', priority: 1.0, changefreq: 'daily' },
    { path: '/pricing', priority: 0.9, changefreq: 'weekly' },
    { path: '/about', priority: 0.8, changefreq: 'monthly' },
    { path: '/terms-of-service', priority: 0.5, changefreq: 'monthly' },
    { path: '/privacy-policy', priority: 0.5, changefreq: 'monthly' },
    { path: '/disclaimer', priority: 0.5, changefreq: 'monthly' },
    { path: '/cookies-policy', priority: 0.5, changefreq: 'monthly' },
  ];
  
  const urlEntries = pages.map(page => `  <url>
    <loc>${siteUrl}${page.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n');
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries}
</urlset>`;
  
  console.log('✅ [SEO] Sitemap.xml generated successfully');
  return c.text(sitemap, 200, {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  });
});

// 🤖 SEO: Robots.txt endpoint
app.get("/make-server-215f78a5/robots.txt", (c) => {
  console.log('🤖 [SEO] Robots.txt requested');
  
  // 獲取當前的 Supabase Project ID
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const projectId = supabaseUrl.split('//')[1]?.split('.')[0] ?? '';
  const sitemapUrl = `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/sitemap.xml`;
  
  const robots = `# Case Where 接得準 - Robots.txt
# 更新日期: ${new Date().toISOString().split('T')[0]}

# 允許所有搜索引擎爬取
User-agent: *
Allow: /

# 允許重要頁面
Allow: /pricing
Allow: /about
Allow: /terms-of-service
Allow: /privacy-policy

# 禁止爬取私密頁面
Disallow: /dashboard
Disallow: /admin

# Sitemap 位置（完整 URL）
Sitemap: ${sitemapUrl}

# 爬蟲速率限制
Crawl-delay: 1

# Google 機器人
User-agent: Googlebot
Allow: /
Disallow: /dashboard
Disallow: /admin

# Bing 機器人
User-agent: Bingbot
Allow: /
Disallow: /dashboard
Disallow: /admin

# 社交媒體機器人
User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /
`;
  
  console.log('✅ [SEO] Robots.txt generated successfully');
  console.log('🗺️ [SEO] Sitemap URL in robots.txt:', sitemapUrl);
  return c.text(robots, 200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  });
});

// 🔍 SEO: Google Search Console 驗證端點
app.get("/make-server-215f78a5/", (c) => {
  console.log('🔍 [SEO] Google verification page requested');
  
  // Google 驗證代碼
  const googleVerificationCode = '9Ehf9UQIP35HCGnahNU8JKWqxoGAv17ge72yB4t8yWA';
  
  const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="google-site-verification" content="${googleVerificationCode}" />
  <title>Case Where 接得準 - API Endpoint</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 { color: #2563eb; }
    .info { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .endpoint { background: #f9fafb; padding: 10px; border-left: 3px solid #2563eb; margin: 10px 0; }
    code { background: #e5e7eb; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>🚀 Case Where API Endpoint</h1>
  
  <div class="info">
    <p><strong>歡迎使用 Case Where 接得準 API 服務</strong></p>
    <p>這是一個 Supabase Edge Function 服務端點。</p>
  </div>
  
  <h2>📡 可用端點：</h2>
  
  <div class="endpoint">
    <strong>Sitemap:</strong> 
    <code>/make-server-215f78a5/sitemap.xml</code>
  </div>
  
  <div class="endpoint">
    <strong>Robots.txt:</strong> 
    <code>/make-server-215f78a5/robots.txt</code>
  </div>
  
  <div class="endpoint">
    <strong>Health Check:</strong> 
    <code>/make-server-215f78a5/ping</code>
  </div>
  
  <p style="margin-top: 40px; color: #6b7280; font-size: 0.9em;">
    © 2024 Case Where 接得準. All rights reserved.
  </p>
</body>
</html>`;
  
  console.log('✅ [SEO] Verification page generated');
  return c.html(html, 200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  });
});

// 🔍 SEO: Google HTML 檔案驗證端點
app.get("/make-server-215f78a5/google93316af37985a718.html", (c) => {
  console.log('🔍 [SEO] Google HTML file verification requested');
  
  // Google 驗證文件內容
  const verificationContent = `google-site-verification: google93316af37985a718.html`;
  
  console.log('✅ [SEO] Google verification file served');
  return c.text(verificationContent, 200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=86400', // 24小時緩存
  });
});

// Auth test endpoint
app.get("/make-server-215f78a5/auth-test", async (c) => {
  console.log('🔐 [AUTH TEST] Endpoint hit');
  const authHeader = c.req.header('Authorization');
  console.log('🔐 [AUTH TEST] Auth header:', authHeader ? `Bearer ${authHeader.split(' ')[1]?.substring(0, 20)}...` : 'MISSING');
  
  const accessToken = authHeader?.split(' ')[1];
  console.log('🔐 [AUTH TEST] Token extracted:', !!accessToken);
  
  const { user, error } = await getUserFromToken(accessToken);
  console.log('🔐 [AUTH TEST] getUserFromToken result:', {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    errorMessage: error?.message
  });
  
  return c.json({
    success: !!user,
    user: user ? { id: user.id, email: user.email } : null,
    error: error?.message || null
  });
});

// Health check endpoint
app.get("/make-server-215f78a5/health", (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const brevoApiKey = Deno.env.get('BREVO_API_KEY');
  
  // Helper to check if value is a placeholder
  const isPlaceholder = (value: string | undefined) => {
    if (!value) return true;
    if (value.includes('sb_secret_')) return true;
    if (value.startsWith('{{') || value.startsWith('${')) return true;
    return false;
  };
  
  // Validate Brevo API Key
  const brevoApiKeyValid = brevoApiKey && !isPlaceholder(brevoApiKey);
  
  return c.json({ 
    status: "ok",
    storage: STORAGE_AVAILABLE ? "available" : "disabled",
    environment: {
      supabase: {
        url: supabaseUrl ? '✅ configured' : '❌ missing',
        serviceRoleKey: serviceRoleKey ? '✅ configured' : '❌ missing',
      },
      email: {
        service: 'Brevo (Sendinblue)',
        apiKey: brevoApiKeyValid ? '✅ configured' : '❌ missing',
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Email configuration endpoint - Check Brevo API Key
app.get("/make-server-215f78a5/email-config", (c) => {
  const brevoApiKey = Deno.env.get('BREVO_API_KEY');
  
  const isPlaceholder = (value: string | undefined) => {
    if (!value) return true;
    if (value.includes('sb_secret_')) return true;
    if (value.startsWith('{{') || value.startsWith('${')) return true;
    return false;
  };
  
  const isConfigured = brevoApiKey && !isPlaceholder(brevoApiKey);
  
  return c.json({
    service: 'Brevo (Sendinblue)',
    configured: isConfigured,
    status: isConfigured ? '✅ Ready to send emails' : '❌ BREVO_API_KEY not configured',
    instructions: isConfigured ? null : 'Please set BREVO_API_KEY in Supabase Dashboard ��� Edge Functions → Environment Variables'
  });
});

// Test email endpoint - Simple Brevo testing
app.post("/make-server-215f78a5/test-email", async (c) => {
  try {
    const body = await c.req.json();
    const { email, language = 'en' } = body;

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    console.log('🧪 [Test] Sending test email to:', email);

    // Check if Brevo API Key is configured
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    
    const isPlaceholder = (value: string | undefined) => {
      if (!value) return true;
      if (value.includes('sb_secret_')) return true;
      if (value.startsWith('{{') || value.startsWith('${')) return true;
      return false;
    };
    
    if (!brevoApiKey || isPlaceholder(brevoApiKey)) {
      console.error('❌ [Test] BREVO_API_KEY not configured');
      return c.json({ 
        success: false, 
        error: 'Please configure BREVO_API_KEY in Supabase Dashboard → Edge Functions → Environment Variables',
        details: {
          instructions: 'Get your API key from: https://app.brevo.com/settings/keys/api'
        }
      }, 500);
    }

    console.log('✅ [Test] Brevo API key is configured');

    // Send test email
    const emailHtml = emailService.getProjectCreatedEmail({
      name: 'Test User',
      projectTitle: 'Test Project - Email System Test',
      projectId: 'test-123',
      language: language as 'en' | 'zh',
    });

    const result = await emailService.sendEmail({
      to: email,
      subject: language === 'en' ? '✅ Test Email - Case Where' : '✅ 測試����� - Case Where',
      html: emailHtml,
    });

    if (result.success) {
      console.log('✅ [Test] Email sent successfully via Brevo:', result.data);
      return c.json({ 
        success: true, 
        message: 'Test email sent successfully via Brevo!',
        service: 'Brevo (Sendinblue)',
        emailId: result.data?.id,
        recipient: email
      });
    } else {
      console.error('❌ [Test] Email sending failed:', result.error);
      
      return c.json({ 
        success: false, 
        message: 'Failed to send email',
        error: result.error,
        details: {
          hint: 'Check your BREVO_API_KEY and make sure it\'s valid',
          service: 'Brevo (Sendinblue)'
        }
      }, 400);
    }
  } catch (error: any) {
    console.error('❌ [Test] Exception:', error);
    return c.json({ 
      success: false, 
      error: 'Server error',
      details: error.message 
    }, 500);
  }
});

// 🔍 Check user email configuration
app.post("/make-server-215f78a5/check-user-email", async (c) => {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    console.log('🔍 [Email Check] Checking email:', email);

    // Search for user by email
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ [Email Check] Error listing users:', error);
      return c.json({ 
        found: false, 
        error: 'Failed to check users' 
      }, 500);
    }

    const user = users.find(u => u.email === email);

    if (!user) {
      console.log('❌ [Email Check] User not found:', email);
      return c.json({ 
        found: false, 
        message: 'No user found with this email' 
      });
    }

    console.log('✅ [Email Check] Found user:', user.id);

    // Check if user has a profile
    const profileKey = `profile_${user.id}`;
    const profile = await kv.get(profileKey);

    if (!profile) {
      console.log('⚠️ [Email Check] User found but no profile:', user.id);
      return c.json({
        found: true,
        user_id: user.id,
        email: user.email,
        has_profile: false,
        warning: 'User exists but has no profile in KV store',
      });
    }

    console.log('✅ [Email Check] Profile found:', profile);

    return c.json({
      found: true,
      user_id: user.id,
      email: (profile as any).email || user.email,
      name: (profile as any).name || (profile as any).full_name,
      language: (profile as any).language,
      account_type: (profile as any).account_type,
      has_profile: true,
    });

  } catch (error: any) {
    console.error('❌ [Email Check] Exception:', error);
    return c.json({ 
      found: false,
      error: 'Server error',
      details: error.message 
    }, 500);
  }
});

// 🎨 測試增強版郵件模板
app.post("/make-server-215f78a5/test-enhanced-email", async (c) => {
  try {
    const body = await c.req.json();
    const { email, type, language = 'zh' } = body;

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // 🌟 根據用戶郵箱查找用戶 ID 和訂閱等級
    let userId: string | undefined;
    let subscriptionTier = 'free';
    let headerLogoUrl: string | undefined;
    
    try {
      // 查找用戶
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const user = users.find(u => u.email === email);
      
      if (user) {
        userId = user.id;
        console.log('📧 [Test Email] Found user:', userId);
        
        // 查詢訂閱等級
        const subscription = await kv.get(`subscription:${userId}`) as any;
        if (subscription?.plan) {
          subscriptionTier = subscription.plan;
          console.log('📧 [Test Email] User subscription tier:', subscriptionTier);
          
          // 如果是企業版，獲取企業 LOGO
          if (subscriptionTier === 'enterprise') {
            headerLogoUrl = await enterpriseLogoService.getUserEnterpriseLogo(userId);
            console.log('🌟 [Test Email] Enterprise logo:', headerLogoUrl || 'Not set');
          }
        }
      }
    } catch (error) {
      console.log('⚠️  [Test Email] Could not find user, using defaults');
    }

    // 🎯 從 KV Store 獲��� Footer LOGO URL
    const logoUrl = await kv.get('system:email:logo-url') as string | undefined;
    console.log('📧 [Test Email] Footer Logo URL:', logoUrl);

    let emailHtml;
    let subject;

    switch (type) {
      case 'welcome':
        emailHtml = enhancedEmailTemplates.getWelcomeEmail({
          name: '測試用戶',
          language: language as 'en' | 'zh',
          logoUrl, // ✅ Footer LOGO
          headerLogoUrl, // 🌟 企業版 Header LOGO
        });
        subject = language === 'en' ? '🎉 Welcome to Case Where!' : '🎉 歡迎來到 Case Where！';
        break;

      case 'monthly-report':
        emailHtml = enhancedEmailTemplates.getMonthlyReportEmail({
          name: '測試用戶',
          month: language === 'en' ? 'December' : '12月',
          stats: {
            projectsPosted: 5,
            proposalsSubmitted: 12,
            projectsCompleted: 3,
            earningsThisMonth: 1500,
            totalEarnings: 8900,
            newReviews: 4,
            averageRating: 4.8,
          },
          language: language as 'en' | 'zh',
          logoUrl, // ✅ Footer LOGO
          headerLogoUrl, // 🌟 企業版 Header LOGO
        });
        subject = language === 'en' ? '📊 Your Monthly Report' : '📊 您的月度報告';
        break;

      case 'project-recommendation':
        emailHtml = enhancedEmailTemplates.getProjectRecommendationEmail({
          name: '測試用戶',
          projects: [
            {
              title: '電商網站開發',
              budget: '$5,000 - $10,000',
              skills: ['React', 'Node.js', 'MongoDB'],
              deadline: '2024-01-15',
            },
            {
              title: 'Mobile App UI Design',
              budget: '$3,000 - $5,000',
              skills: ['Figma', 'UI/UX', 'Mobile Design'],
              deadline: '2024-01-20',
            },
          ],
          language: language as 'en' | 'zh',
          logoUrl, // ✅ Footer LOGO
          headerLogoUrl, // 🌟 企業版 Header LOGO
        });
        subject = language === 'en' ? '🎯 Projects Matching Your Skills' : '🎯 符合您技能的項目';
        break;

      case 'milestone-reminder':
        emailHtml = enhancedEmailTemplates.getMilestoneReminderEmail({
          name: '測試用戶',
          projectTitle: '電商平台開發',
          milestonesCompleted: 2,
          totalMilestones: 5,
          nextMilestone: '完成產品頁面設計',
          daysRemaining: 5,
          language: language as 'en' | 'zh',
          logoUrl, // ✅ Footer LOGO
          headerLogoUrl, // 🌟 企業版 Header LOGO
        });
        subject = language === 'en' ? '🎊 Project Progress Update' : '🎊 項目進度更新';
        break;

      case 'message-notification':
        emailHtml = enhancedEmailTemplates.getMessageNotificationEmail({
          name: '測試用戶',
          senderName: '王小明',
          messagePreview: '您好，我對您的提案很感興趣，可以詳細討論一下嗎？',
          projectTitle: '企業網站重設計',
          language: language as 'en' | 'zh',
          logoUrl, // ✅ Footer LOGO
          headerLogoUrl, // 🌟 企業版 Header LOGO
        });
        subject = language === 'en' ? '💌 New Message' : '💌 新訊息';
        break;

      case 'system-notification':
        emailHtml = enhancedEmailTemplates.getSystemNotificationEmail({
          name: '測試用戶',
          title: language === 'en' ? '🔔 System Maintenance Notice' : '🔔 系統維護通知',
          message: language === 'en' 
            ? 'Our platform will undergo scheduled maintenance on Dec 10, 2024 from 2:00 AM to 4:00 AM (UTC+8). During this time, some services may be temporarily unavailable.'
            : '我們的平台將在 2024年12月10日 凌晨2:00至4:00（UTC+8）進行例行維護。在此期間，部分服務可能暫時無法使用。',
          type: 'info',
          actionButton: {
            text: language === 'en' ? 'Learn More' : '了解更多',
            url: '#',
          },
          language: language as 'en' | 'zh',
          logoUrl, // ✅ Footer LOGO
          headerLogoUrl, // 🌟 企業版 Header LOGO
        });
        subject = language === 'en' ? '🔔 System Maintenance Notice' : '🔔 系統維護通知';
        break;

      default:
        return c.json({ error: 'Invalid email type. Options: welcome, monthly-report, project-recommendation, milestone-reminder, message-notification, system-notification' }, 400);
    }

    const result = await emailService.sendEmail({
      to: email,
      subject,
      html: emailHtml,
    });

    if (result.success) {
      console.log(`✅ Enhanced email (${type}) sent successfully to:`, email);
      return c.json({
        success: true,
        message: `Enhanced ${type} email sent successfully!`,
        recipient: email,
      });
    } else {
      console.error(`❌ Failed to send enhanced email (${type}):`, result.error);
      return c.json({
        success: false,
        error: result.error,
      }, 400);
    }
  } catch (error: any) {
    console.error('❌ Exception in enhanced email test:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// 🔍 診斷用戶郵件配置
app.post("/make-server-215f78a5/diagnose-user-email", async (c) => {
  try {
    const body = await c.req.json();
    const { email: userEmail } = body;

    if (!userEmail) {
      return c.json({ error: 'Email is required' }, 400);
    }

    console.log(`🔍 [Diagnose] Searching for user with email: ${userEmail}`);

    // 搜索所有 profile，找到匹��的 email (both formats)
    const newFormatProfiles = (await kv.getByPrefix('profile_') || []).map(item => item.value);
    const oldFormatProfiles = (await kv.getByPrefix('profile:') || []).map(item => item.value);
    const allProfiles = [...newFormatProfiles, ...oldFormatProfiles];
    console.log(`🔍 [Diagnose] Found ${allProfiles.length} profiles (new: ${newFormatProfiles.length}, old: ${oldFormatProfiles.length})`);

    let matchedProfile = null;
    let matchedUserId = null;

    for (const profile of allProfiles) {
      if (profile && profile.email === userEmail) {
        matchedProfile = profile;
        // 從 profile key 中提取 user_id
        const profiles = (await kv.getByPrefix('profile_')).map(item => item.value);
        for (let i = 0; i < profiles.length; i++) {
          if (profiles[i] === profile) {
            // 這個需要找到對應的key
            console.log(`🔍 [Diagnose] Found matching profile`);
          }
        }
        break;
      }
    }

    if (matchedProfile) {
      console.log(`✅ [Diagnose] Found profile for ${userEmail}`);
      console.log(`📧 [Diagnose] Email in profile:`, matchedProfile.email);
      console.log(`👤 [Diagnose] Name:`, matchedProfile.name);
      console.log(`🌐 [Diagnose] Language:`, matchedProfile.language);

      // 嘗試發送測試郵件
      const testEmailHtml = emailService.getProposalSubmittedEmail({
        name: matchedProfile.name || matchedProfile.email,
        projectTitle: '測試項目 | Test Project',
        proposedBudget: 1000,
        language: 'zh',
      });

      const emailResult = await emailService.sendEmail({
        to: matchedProfile.email,
        subject: '🧪 測試郵件 | Test Email - Case Where',
        html: testEmailHtml,
      });

      return c.json({
        success: true,
        profile: {
          email: matchedProfile.email,
          name: matchedProfile.name,
          language: matchedProfile.language,
          hasEmail: !!matchedProfile.email,
        },
        emailSent: emailResult.success,
        emailError: emailResult.error || null,
        message: emailResult.success
          ? `測試郵件已發送到 ${matchedProfile.email}`
          : `郵件發送失敗: ${emailResult.error}`,
      });
    } else {
      console.warn(`⚠️ [Diagnose] No profile found for ${userEmail}`);
      return c.json({
        success: false,
        error: `未找到郵箱 ${userEmail} 的用戶資料`,
        searched: allProfiles.length,
      }, 404);
    }
  } catch (error: any) {
    console.error('❌ [Diagnose] Exception:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// ============= PROJECT ROUTES =============

// Create a new project
app.post("/make-server-215f78a5/projects", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { title, description, budget_min, budget_max, deadline, required_skills, category, currency } = body;

    if (!title || !description) {
      return c.json({ error: 'Title and description are required' }, 400);
    }

    const projectId = crypto.randomUUID();
    const project = {
      id: projectId,
      user_id: user.id,
      title,
      description,
      budget_min: budget_min || null,
      budget_max: budget_max || null,
      currency: currency || 'USD', // 默認使用 USD
      deadline: deadline || null,
      required_skills: required_skills || [],
      category: category || null,
      status: 'open', // 六種狀態: open, in_progress, pending_review, pending_payment, completed, cancelled
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Store project
    await kv.set(`project:${projectId}`, project);
    
    // Add to user's project list
    const userProjects = await kv.get(`projects:user:${user.id}`) || [];
    userProjects.push(projectId);
    await kv.set(`projects:user:${user.id}`, userProjects);

    // Add to all projects list
    const allProjects = await kv.get('projects:all') || [];
    allProjects.unshift(projectId);
    await kv.set('projects:all', allProjects);

    // 🔧 Increment project usage counter for subscription limits
    const now = new Date();
    const usageKey = `usage_${user.id}_${now.getFullYear()}_${now.getMonth() + 1}`;
    const usage = await kv.get(usageKey) || { projects: 0, proposals: 0 };
    usage.projects = (usage.projects || 0) + 1;
    await kv.set(usageKey, usage);

    // 📧 Send project created email
    try {
      const profileKey = `profile_${user.id}`;
      const profile = await kv.get(profileKey);
      
      if (profile?.email) {
        const language = profile.language || 'zh';
        const emailHtml = emailService.getProjectCreatedEmail({
          name: profile.name || profile.email,
          projectTitle: title,
          projectId,
          language,
        });

        await emailService.sendEmail({
          to: profile.email,
          subject: language === 'en' ? '✅ Project Posted Successfully' : '✅ 項目發布成功',
          html: emailHtml,
        });
        
        console.log(`📧 Project created email sent to ${profile.email}`);
      }
    } catch (emailError) {
      console.error('Error sending project created email:', emailError);
      // Don't fail the request if email fails
    }

    return c.json({ project }, 201);
  } catch (error) {
    console.error('Error creating project:', error);
    return c.json({ error: 'Failed to create project' }, 500);
  }
});

// Get current user's projects
app.get("/make-server-215f78a5/projects/my", async (c) => {
  try {
    console.log('📥 [GET /projects/my] Request received');
    
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      console.error('❌ [GET /projects/my] Unauthorized:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('✅ [GET /projects/my] User authenticated:', user.id);

    // Get user's project IDs
    const projectIds = await kv.get(`projects:user:${user.id}`) || [];
    console.log('📦 [GET /projects/my] Found project IDs:', projectIds);

    // Fetch full project details
    const projects = [];
    for (const projectId of projectIds) {
      const project = await kv.get(`project:${projectId}`);
      if (project) {
        projects.push(project);
      }
    }

    console.log('✅ [GET /projects/my] Returning', projects.length, 'projects');
    return c.json({ projects });
  } catch (error) {
    console.error('❌ [GET /projects/my] Error:', error);
    return c.json({ error: 'Failed to load projects' }, 500);
  }
});

// Get all projects (with optional filters)
app.get("/make-server-215f78a5/projects", async (c) => {
  try {
    console.log('📥 [GET /projects] Request received');
    
    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ [GET /projects] Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceRoleKey
      });
      return c.json({ 
        error: 'Server configuration error: Missing Supabase credentials',
        projects: [] 
      }, 500);
    }
    
    const status = c.req.query('status');
    const category = c.req.query('category');
    const requiredSkills = c.req.query('required_skills');
    const userId = c.req.query('user_id');
    const sortBy = c.req.query('sort_by'); // 新增排序參數
    const budgetMin = c.req.query('budget_min'); // 新增預算篩選
    const budgetMax = c.req.query('budget_max');
    const searchQuery = c.req.query('search_query'); // 新增搜尋參數
    console.log('📥 [GET /projects] Query params:', { status, category, requiredSkills, userId, sortBy, budgetMin, budgetMax, searchQuery });

    let projectIds = [];

    if (userId) {
      console.log('📥 [GET /projects] Fetching projects for user:', userId);
      try {
        const userProjects = await kv.get(`projects:user:${userId}`);
        projectIds = userProjects || [];
        console.log('📥 [GET /projects] User project IDs:', projectIds);
      } catch (kvError) {
        console.error('❌ [GET /projects] KV get error for user projects:', kvError);
        console.warn('⚠️  [GET /projects] Assuming empty user projects list (KV key might not exist yet)');
        // If the key doesn't exist, just return empty array instead of erroring
        projectIds = [];
      }
    } else {
      console.log('📥 [GET /projects] Fetching all projects');
      try {
        const allProjects = await kv.get('projects:all');
        projectIds = allProjects || [];
        console.log('📥 [GET /projects] All project IDs:', projectIds);
      } catch (kvError) {
        console.error('❌ [GET /projects] KV get error for all projects:', kvError);
        console.warn('⚠️  [GET /projects] Assuming empty projects list (KV key might not exist yet)');
        // If the key doesn't exist, just return empty array instead of erroring
        projectIds = [];
      }
    }

    console.log('📥 [GET /projects] Total project IDs found:', projectIds.length);

    // 如果沒有項目，直接返回空������組
    if (projectIds.length === 0) {
      console.log('✅ [GET /projects] No projects found, returning empty array');
      return c.json({ projects: [] });
    }

    // 🚀 優化：減少批次大小以避免超時
    const batchSize = 50; // 從 100 降到 50
    const totalProjects = projectIds.length;
    let allProjectsData: any[] = [];
    
    console.log(`📦 [GET /projects] Loading ${totalProjects} projects in batches of ${batchSize}...`);
    
    // 🚀 設置最大處理時間（25秒，留出緩衝時間）
    const startTime = Date.now();
    const maxProcessingTime = 25000; // 25秒
    
    for (let i = 0; i < totalProjects; i += batchSize) {
      // 檢查是否超時
      if (Date.now() - startTime > maxProcessingTime) {
        console.warn(`⏰ [GET /projects] Timeout approaching, stopping at ${i}/${totalProjects} projects`);
        break;
      }
      
      const batch = projectIds.slice(i, Math.min(i + batchSize, totalProjects));
      try {
        const batchProjects = await kv.mget(batch.map(id => `project:${id}`));
        allProjectsData = [...allProjectsData, ...batchProjects];
        console.log(`📦 Loaded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(totalProjects / batchSize)}`);
      } catch (batchError) {
        console.error(`❌ [GET /projects] Error loading batch ${Math.floor(i / batchSize) + 1}:`, batchError);
        // 繼續處理下一批
      }
    }

    const projects = allProjectsData;
    console.log('📥 [GET /projects] Total projects fetched from KV:', projects.length);

    let filteredProjects = projects.filter(p => p != null && typeof p === 'object');
    console.log('📥 [GET /projects] Valid projects:', filteredProjects.length);

    if (status) {
      filteredProjects = filteredProjects.filter(p => p?.status === status);
      console.log('📥 [GET /projects] After status filter:', filteredProjects.length);
    }

    if (category) {
      console.log('📥 [GET /projects] Applying category filter:', category);
      
      // 標準化類別名稱 - 將所有語言變體映射到統一的 key
      const normalizeCategoryName = (cat: string): string => {
        const normalized = cat.toLowerCase().trim();
        
        // Development & IT 的所有變體
        if (normalized.includes('develop') || 
            normalized.includes('開發') || 
            normalized.includes('开发') ||
            normalized.includes('it') || 
            normalized.includes('web') ||
            normalized.includes('網頁') ||
            normalized.includes('网页') ||
            normalized.includes('程式') ||
            normalized.includes('程序') ||
            normalized.includes('software') ||
            normalized.includes('軟體') ||
            normalized.includes('软件')) {
          return 'development';
        }
        
        // Design & Creative 的所有變體
        if (normalized.includes('design') || 
            normalized.includes('設計') || 
            normalized.includes('设计') ||
            normalized.includes('creative') || 
            normalized.includes('創意') ||
            normalized.includes('创意') ||
            normalized.includes('graphic') ||
            normalized.includes('平面') ||
            normalized.includes('ui') ||
            normalized.includes('ux')) {
          return 'design';
        }
        
        // Marketing & Sales 的所有變體
        if (normalized.includes('market') || 
            normalized.includes('營銷') || 
            normalized.includes('营销') ||
            normalized.includes('行銷') ||
            normalized.includes('sales') || 
            normalized.includes('銷售') ||
            normalized.includes('销售') ||
            normalized.includes('廣告') ||
            normalized.includes('广告')) {
          return 'marketing';
        }
        
        // Writing & Translation 的所有變體
        if (normalized.includes('writ') || 
            normalized.includes('寫作') || 
            normalized.includes('写作') ||
            normalized.includes('translat') || 
            normalized.includes('翻譯') ||
            normalized.includes('翻译') ||
            normalized.includes('content') ||
            normalized.includes('內容') ||
            normalized.includes('内容')) {
          return 'writing';
        }
        
        // Admin & Customer Support 的所有變體
        if (normalized.includes('admin') || 
            normalized.includes('行政') || 
            normalized.includes('customer') || 
            normalized.includes('客服') ||
            normalized.includes('support') ||
            normalized.includes('���援') ||
            normalized.includes('支持')) {
          return 'admin';
        }
        
        return normalized;
      };
      
      const normalizedSearchCategory = normalizeCategoryName(category);
      console.log('🔍 [GET /projects] Normalized search category:', {
        original: category,
        normalized: normalizedSearchCategory
      });
      
      // 支持跨語言模糊匹配
      filteredProjects = filteredProjects.filter(p => {
        if (!p?.category) return false;

        const projectCategory = p.category.toLowerCase();
        const searchCategory = category.toLowerCase();
        const normalizedProjectCategory = normalizeCategoryName(p.category);

        // 1. 完全匹配
        if (projectCategory === searchCategory) return true;

        // 2. 部分匹配
        if (projectCategory.includes(searchCategory) || searchCategory.includes(projectCategory)) {
          return true;
        }

        // 3. 標準化後匹配（跨語言）
        if (normalizedProjectCategory === normalizedSearchCategory) {
          console.log('✅ [GET /projects] Project matched category (normalized):', {
            projectId: p?.id,
            projectCategory: p.category,
            searchCategory: category,
            normalizedMatch: normalizedProjectCategory
          });
          return true;
        }

        return false;
      });
      console.log('📥 [GET /projects] After category filter:', filteredProjects.length);
    }

    if (requiredSkills) {
      // Split comma-separated skills into an array
      const searchSkills = requiredSkills.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
      console.log('🔍 [GET /projects] Searching for skills:', searchSkills);
      
      filteredProjects = filteredProjects.filter(p => {
        if (!p.required_skills || !Array.isArray(p.required_skills)) {
          console.log('�� [GET /projects] Project has no required_skills:', p.id);
          return false;
        }
        // Check if the project's required_skills includes ANY of the searched skills
        const matches = searchSkills.some(searchSkill => 
          p.required_skills.some(projectSkill => 
            projectSkill.toLowerCase().includes(searchSkill)
          )
        );
        
        if (matches) {
          console.log('✅ [GET /projects] Project matched skills:', {
            projectId: p.id,
            projectSkills: p.required_skills,
            searchSkills: searchSkills,
            status: p.status
          });
        }
        
        return matches;
      });
      console.log('📥 [GET /projects] After skills filter:', filteredProjects.length);
    }

    // 🔍 搜尋篩選（標題和描述）
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      console.log('🔍 [GET /projects] Applying search filter:', query);
      
      filteredProjects = filteredProjects.filter(p => {
        const titleMatch = p.title?.toLowerCase().includes(query);
        const descMatch = p.description?.toLowerCase().includes(query);
        return titleMatch || descMatch;
      });
      
      console.log('📥 [GET /projects] After search filter:', filteredProjects.length);
    }

    // 💰 預算範圍篩選
    if (budgetMin || budgetMax) {
      const minBudget = budgetMin ? parseFloat(budgetMin) : 0;
      const maxBudget = budgetMax ? parseFloat(budgetMax) : Infinity;
      console.log('💰 [GET /projects] Applying budget filter:', { minBudget, maxBudget });
      
      filteredProjects = filteredProjects.filter(p => {
        // 使用項目的最大預算來比較（如果沒有最大預算則使用最小預算）
        const projectBudget = p.budget_max || p.budget_min || 0;
        return projectBudget >= minBudget && projectBudget <= maxBudget;
      });
      
      console.log('📥 [GET /projects] After budget filter:', filteredProjects.length);
    }

    // ✅ 優化：為所有項目添加提案計數（批次處理）
    console.log('📥 [GET /projects] Adding proposal counts for all projects...');
    
    // 🚀 優化：減少批次大小並添加超時保護
    const proposalCountBatchSize = 30; // 從 50 降到 30
    const projectsWithCounts: any[] = [];
    
    for (let i = 0; i < filteredProjects.length; i += proposalCountBatchSize) {
      // 檢查是否超時
      if (Date.now() - startTime > maxProcessingTime) {
        console.warn(`⏰ [GET /projects] Timeout approaching, skipping remaining proposal counts`);
        // 將剩餘項目添加為 0 提案計數
        const remaining = filteredProjects.slice(i).map(p => ({ ...p, proposal_count: 0, pending_proposal_count: 0 }));
        projectsWithCounts.push(...remaining);
        break;
      }
      
      const batch = filteredProjects.slice(i, Math.min(i + proposalCountBatchSize, filteredProjects.length));
      
      try {
        const batchWithCounts = await Promise.all(
          batch.map(async (project) => {
            try {
              const proposalIds = await kv.get(`proposals:project:${project.id}`) || [];
              
              return {
                ...project,
                proposal_count: Array.isArray(proposalIds) ? proposalIds.length : 0,
                pending_proposal_count: 0,
              };
            } catch (proposalError) {
              // Silently handle missing proposal data - it's expected for new projects
              return {
                ...project,
                proposal_count: 0,
                pending_proposal_count: 0,
              };
            }
          })
        );
        
        projectsWithCounts.push(...batchWithCounts);
        console.log(`📊 Counted proposals for batch ${Math.floor(i / proposalCountBatchSize) + 1}/${Math.ceil(filteredProjects.length / proposalCountBatchSize)}`);
      } catch (batchError) {
        console.error(`❌ [GET /projects] Error counting proposals for batch:`, batchError);
        // 添加該批次但不含提案計數
        const batchWithoutCounts = batch.map(p => ({ ...p, proposal_count: 0, pending_proposal_count: 0 }));
        projectsWithCounts.push(...batchWithoutCounts);
      }
    }
    
    // 所有項目已包含提案計數
    let allProjects = projectsWithCounts;

    // 📊 智能排序
    if (sortBy) {
      console.log('📊 [GET /projects] Applying sort:', sortBy);
      
      allProjects.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          
          case 'oldest':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          
          case 'budget_high':
            const budgetA = a.budget_max || a.budget_min || 0;
            const budgetB = b.budget_max || b.budget_min || 0;
            return budgetB - budgetA;
          
          case 'budget_low':
            const budgetALow = a.budget_max || a.budget_min || 0;
            const budgetBLow = b.budget_max || b.budget_min || 0;
            return budgetALow - budgetBLow;
          
          case 'deadline_soon':
            if (!a.deadline && !b.deadline) return 0;
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          
          case 'deadline_far':
            if (!a.deadline && !b.deadline) return 0;
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
          
          default:
            return 0;
        }
      });
      
      console.log('✅ [GET /projects] Projects sorted by:', sortBy);
    }

    console.log('✅ [GET /projects] Returning projects:', allProjects.length);
    return c.json({ projects: allProjects });
  } catch (error) {
    console.error('❌ [GET /projects] Error fetching projects:', error);
    console.error('❌ [GET /projects] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return c.json({ error: 'Failed to fetch projects', projects: [] }, 500); // ✅ Always return projects array
  }
});

// Get a single project by ID
app.get("/make-server-215f78a5/projects/:id", async (c) => {
  try {
    const projectId = c.req.param('id');
    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    return c.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return c.json({ error: 'Failed to fetch project' }, 500);
  }
});

// Update a project
app.put("/make-server-215f78a5/projects/:id", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('id');
    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    if (project.user_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const updates = await c.req.json();
    const updatedProject = {
      ...project,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await kv.set(`project:${projectId}`, updatedProject);

    return c.json({ project: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);
    return c.json({ error: 'Failed to update project' }, 500);
  }
});

// Update project status (for testing)
app.put("/make-server-215f78a5/projects/:id/status", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      console.error('Authorization error while updating project status:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('id');
    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    if (project.user_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const { status } = await c.req.json();
    
    if (!status || !['open', 'in_progress', 'pending_review', 'pending_payment', 'completed', 'cancelled'].includes(status)) {
      return c.json({ error: 'Invalid status' }, 400);
    }

    project.status = status;
    project.updated_at = new Date().toISOString();
    
    // 如果标记为 completed，确保有 assigned_freelancer_id（测试模式��以不需要）
    if (status === 'completed' && !project.assigned_freelancer_id) {
      // 设置一个测试用的 freelancer ID（实际应��是真实的接案者ID）
      project.assigned_freelancer_id = 'test-freelancer-id';
    }

    await kv.set(`project:${projectId}`, project);

    console.log(`Project ${projectId} status updated to ${status}`);
    return c.json({ success: true, project });
  } catch (error) {
    console.error('Error updating project status:', error);
    return c.json({ error: 'Failed to update project status' }, 500);
  }
});

// Delete a project
app.delete("/make-server-215f78a5/projects/:id", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('id');
    console.log(`🗑️  [Delete Project] User ${user.id} attempting to delete project ${projectId}`);
    
    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      console.warn(`⚠️  [Delete Project] Project ${projectId} not found`);
      return c.json({ error: 'Project not found' }, 404);
    }

    if (project.user_id !== user.id) {
      console.warn(`⚠️  [Delete Project] User ${user.id} not authorized to delete project ${projectId}`);
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Check if project is in progress - warn but allow deletion
    if (project.status === 'in_progress' || project.status === 'completed') {
      console.warn(`⚠️  [Delete Project] Deleting project with status: ${project.status}`);
    }

    // Delete all proposals related to this project
    let projectProposals = [];
    try {
      projectProposals = await kv.get(`proposals:project:${projectId}`) || [];
    } catch (error) {
      console.log(`ℹ️  No proposals to delete for project ${projectId}`);
    }
    
    if (projectProposals.length > 0) {
      console.log(`🗑️  [Delete Project] Deleting ${projectProposals.length} proposals`);
      for (const proposalId of projectProposals) {
        await kv.del(`proposal:${proposalId}`);
      }
      await kv.del(`proposals:project:${projectId}`);
    }

    // Delete project
    await kv.del(`project:${projectId}`);

    // Remove from user's project list
    const userProjects = await kv.get(`projects:user:${user.id}`) || [];
    const filteredUserProjects = userProjects.filter(id => id !== projectId);
    await kv.set(`projects:user:${user.id}`, filteredUserProjects);

    // Remove from all projects list
    const allProjects = await kv.get('projects:all') || [];
    const filteredAllProjects = allProjects.filter(id => id !== projectId);
    await kv.set('projects:all', filteredAllProjects);

    console.log(`✅ [Delete Project] Successfully deleted project ${projectId}`);
    return c.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('❌ [Delete Project] Error deleting project:', error);
    return c.json({ error: 'Failed to delete project' }, 500);
  }
});

// ============= PROPOSAL ROUTES =============

// Submit a proposal
app.post("/make-server-215f78a5/proposals", async (c) => {
  console.log('🚀 [Submit Proposal] ===== START =====');
  try {
    const accessToken = getAccessToken(c); // 🔧 使用 getAccessToken helper 支援 X-Dev-Token
    console.log('🔑 [Submit Proposal] Access token:', accessToken ? 'Present' : 'Missing');
    
    const { user, error: authError } = await getUserFromToken(accessToken);
    console.log('👤 [Submit Proposal] User:', user?.id, user?.email);
    
    if (!user?.id || authError) {
      console.error('❌ [Submit Proposal] Auth failed:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    console.log('📦 [Submit Proposal] Request body:', JSON.stringify(body, null, 2));
    const { project_id, cover_letter, proposed_budget, currency, delivery_time, milestones, use_structured_milestones } = body;

    if (!project_id || !cover_letter || !proposed_budget) {
      console.error('❌ [Submit Proposal] Missing required fields:', { project_id, cover_letter, proposed_budget });
      return c.json({ error: 'Project ID, cover letter, and proposed budget are required' }, 400);
    }

    // Check if project exists
    console.log('🔍 [Submit Proposal] Looking for project:', project_id);
    const project = await kv.get(`project:${project_id}`);
    console.log('📋 [Submit Proposal] Project found:', !!project, project?.title);
    if (!project) {
      console.error('❌ [Submit Proposal] Project not found:', project_id);
      return c.json({ error: 'Project not found' }, 404);
    }

    // Check if user already submitted a proposal
    let projectProposals = [];
    try {
      projectProposals = await kv.get(`proposals:project:${project_id}`) || [];
    } catch (error) {
      console.log(`ℹ️  No existing proposals for project ${project_id} - this will be the first one`);
    }
    
    const existingProposals = Array.isArray(projectProposals) && projectProposals.length > 0 
      ? await kv.mget(projectProposals.map(id => `proposal:${id}`))
      : [];
    const alreadyProposed = existingProposals.some(p => p && p.freelancer_id === user.id);

    if (alreadyProposed) {
      return c.json({ error: 'You have already submitted a proposal for this project' }, 400);
    }

    const proposalId = crypto.randomUUID();
    console.log('🆔 [Submit Proposal] Generated proposal ID:', proposalId);
    
    // 🔥 獲取接案者的 profile 信息，用於在提案中存儲名字和 email
    const freelancerProfile = await kv.get(`profile_${user.id}`);
    console.log('🔍 [Submit Proposal] Freelancer profile:', freelancerProfile ? {
      email: freelancerProfile.email,
      name: freelancerProfile.name
    } : 'NULL');
    
    const proposal = {
      id: proposalId,
      project_id,
      freelancer_id: user.id,
      freelancer_email: user.email || freelancerProfile?.email || 'unknown@example.com', // 🔥 添加：直接存儲 email
      freelancer_name: freelancerProfile?.name || user.email || 'Unknown', // 🔥 添加：直接存儲名字
      client_id: project.user_id,
      cover_letter,
      proposed_budget,
      currency: currency || 'TWD', // 預設為 TWD 以保持向後相容
      delivery_time: delivery_time || null,
      milestones: milestones || [],
      use_structured_milestones: use_structured_milestones || false,
      status: 'pending', // pending, accepted, rejected, withdrawn
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('💾 [Submit Proposal] Saving proposal to KV store...');
    // Store proposal
    await kv.set(`proposal:${proposalId}`, proposal);
    console.log('✅ [Submit Proposal] Proposal saved successfully');
    
    // 💡 If using structured milestones, create milestone records
    if (use_structured_milestones && Array.isArray(milestones) && milestones.length > 0) {
      try {
        console.log(`📋 [Milestones] Creating ${milestones.length} structured milestones for proposal ${proposalId}`);
        console.log(`📋 [Milestones] Milestones data:`, JSON.stringify(milestones, null, 2));
        
        const milestoneIds = [];
        
        for (let i = 0; i < milestones.length; i++) {
          const milestone = milestones[i];
          const milestoneId = milestone.id || crypto.randomUUID();
          console.log(`📋 [Milestones] Creating milestone ${i + 1}/${milestones.length}: ${milestoneId}`);
          
          const milestoneRecord = {
            id: milestoneId,
            title: milestone.title,
            description: milestone.description || '',
            amount: milestone.amount,
            duration_days: milestone.duration_days || 0,
            order: milestone.order || (i + 1),
            currency: currency || 'TWD',
            proposal_id: proposalId,
            project_id,
            freelancer_id: user.id,
            client_id: project.user_id,
            status: 'pending', // pending, in_progress, submitted, approved, rejected
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          // Store individual milestone
          await kv.set(`milestone:${milestoneId}`, milestoneRecord);
          console.log(`✅ [Milestones] Milestone ${i + 1} saved:`, milestoneId);
          milestoneIds.push(milestoneId);
        }
        
        // Store milestone IDs for quick lookup
        await kv.set(`milestones:proposal:${proposalId}`, milestoneIds);
        
        console.log(`✅ [Milestones] Created ${milestones.length} milestones for proposal ${proposalId}`);
      } catch (milestoneError) {
        console.error('❌ [Milestones] Error creating milestones:', milestoneError);
        console.error('❌ [Milestones] Error details:', milestoneError?.message);
        console.error('❌ [Milestones] This error is non-fatal, proposal will still be created');
        // Don't throw - allow proposal creation to continue even if milestones fail
      }
    }
    
    // Add to project's proposal list
    projectProposals.push(proposalId);
    await kv.set(`proposals:project:${project_id}`, projectProposals);

    // Add to freelancer's proposal list
    const freelancerProposals = await kv.get(`proposals:user:${user.id}`) || [];
    freelancerProposals.push(proposalId);
    await kv.set(`proposals:user:${user.id}`, freelancerProposals);

    // 🔧 Increment proposal usage counter for subscription limits
    const now = new Date();
    const usageKey = `usage_${user.id}_${now.getFullYear()}_${now.getMonth() + 1}`;
    const usage = await kv.get(usageKey) || { projects: 0, proposals: 0 };
    usage.proposals = (usage.proposals || 0) + 1;
    await kv.set(usageKey, usage);

    // ����� Send proposal submitted email to freelancer
    try {
      const freelancerProfile = await kv.get(`profile_${user.id}`);
      
      if (freelancerProfile?.email) {
        const language = freelancerProfile.language || 'zh';
        const emailHtml = emailService.getProposalSubmittedEmail({
          name: freelancerProfile.name || freelancerProfile.email,
          projectTitle: project.title,
          proposedBudget: proposed_budget,
          language,
        });

        await emailService.sendEmail({
          to: freelancerProfile.email,
          subject: language === 'en' ? '✅ Proposal Submitted' : '✅ 提案已提交',
          html: emailHtml,
        });
        
        console.log(`📧 Proposal submitted email sent to freelancer ${freelancerProfile.email}`);
      }
    } catch (emailError) {
      console.error('Error sending proposal submitted email:', emailError);
    }

    // 📧 Send new proposal email to client
    try {
      console.log(`📧 [Proposal Email] Attempting to send email to project owner (user_id: ${project.user_id})`);
      
      const clientProfile = await kv.get(`profile_${project.user_id}`);
      const freelancerProfile = await kv.get(`profile_${user.id}`);
      
      console.log(`📧 [Proposal Email] Client profile found:`, {
        hasProfile: !!clientProfile,
        hasEmail: !!clientProfile?.email,
        email: clientProfile?.email,
        name: clientProfile?.name || clientProfile?.full_name,
      });
      
      if (clientProfile?.email) {
        const language = clientProfile.language || 'zh';
        const emailHtml = emailService.getNewProposalEmail({
          name: clientProfile.name || clientProfile.full_name || clientProfile.email,
          projectTitle: project.title,
          freelancerName: freelancerProfile?.name || freelancerProfile?.full_name || 'A freelancer',
          proposedBudget: proposed_budget,
          language,
        });

        await emailService.sendEmail({
          to: clientProfile.email,
          subject: language === 'en' ? '🎯 New Proposal Received' : '🎯 收到新提案',
          html: emailHtml,
        });
        
        console.log(`✅ [Proposal Email] Successfully sent to client ${clientProfile.email}`);
      } else {
        console.warn(`⚠️  [Proposal Email] Client profile has no email address. Profile:`, clientProfile);
      }
    } catch (emailError) {
      console.error('❌ [Proposal Email] Error sending new proposal email:', emailError);
    }

    console.log('🎉 [Submit Proposal] ===== SUCCESS ===== Proposal created:', proposalId);
    return c.json({ proposal }, 201);
  } catch (error) {
    console.error('❌❌❌ [Submit Proposal] ===== ERROR ===== Failed to create proposal');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return c.json({ 
      error: 'Failed to create proposal',
      details: error?.message || 'Unknown error',
      type: error?.constructor?.name || 'UnknownError'
    }, 500);
  }
});

// Get proposals for a project
app.get("/make-server-215f78a5/proposals/project/:projectId", async (c) => {
  console.log('🔥🔥🔥 [Get Proposals] ===== ROUTE HIT ===== Path:', c.req.path);
  console.log('🔥 [Get Proposals] Method:', c.req.method);
  console.log('🔥 [Get Proposals] Authorization header:', c.req.header('Authorization')?.substring(0, 30));
  console.log('🔥 [Get Proposals] X-Dev-Token header:', c.req.header('X-Dev-Token')?.substring(0, 30));
  try {
    console.log('📋 [Get Proposals] ===== START =====');
    const accessToken = getAccessToken(c);
    console.log('📋 [Get Proposals] Access token:', accessToken ? `${accessToken.substring(0, 30)}...` : 'MISSING');
    console.log('📋 [Get Proposals] Token full length:', accessToken?.length);
    console.log('📋 [Get Proposals] Is dev token:', accessToken?.startsWith('dev-user-'));
    
    const { user, error: authError } = await getUserFromToken(accessToken);
    console.log('📋 [Get Proposals] getUserFromToken result - User:', user ? { id: user.id, email: user.email } : 'NULL');
    console.log('📋 [Get Proposals] getUserFromToken result - Auth error:', authError);
    
    if (!user?.id || authError) {
      console.error('❌ [Get Proposals] Unauthorized - No user or auth error');
      console.error('❌ [Get Proposals] Details:', { hasUser: !!user, userId: user?.id, authError });
      return c.json({ code: 401, message: 'Unauthorized: ' + (authError?.message || 'No user found') }, 401);
    }

    const projectId = c.req.param('projectId');
    console.log('📋 [Get Proposals] Project ID:', projectId);
    
    // 🔥 開發模式支援：檢測是否為 mock 項目
    const isMockProject = projectId.startsWith('mock-project-');
    
    if (isMockProject) {
      console.log('🧪 [Get Proposals] Mock project detected, returning empty proposals for now');
      // 返回空提案列表（前端 ProposalListDialog 會生成 mock 數據）
      return c.json({ proposals: [] });
    }
    
    const project = await kv.get(`project:${projectId}`);
    console.log('📋 [Get Proposals] Project found:', !!project);

    if (!project) {
      console.error('❌ [Get Proposals] Project not found');
      return c.json({ error: 'Project not found' }, 404);
    }

    // 🔧 檢查特殊用戶（開發者帳號）
    const SPECIAL_USER_EMAILS = [
      'davidlai117@yahoo.com.tw',
      'davidlai234@hotmail.com'
    ];
    const isSpecialUser = user.email && SPECIAL_USER_EMAILS.includes(user.email.toLowerCase());
    console.log('📋 [Get Proposals] Is special user:', isSpecialUser);
    console.log('📋 [Get Proposals] Owner check:', { projectOwner: project.user_id, currentUser: user.id });
    
    // Only project owner or special users can view all proposals
    if (project.user_id !== user.id && !isSpecialUser) {
      console.warn(`⚠️  [Get Proposals] User ${user.id} (${user.email}) not authorized to view proposals for project ${projectId}`);
      return c.json({ error: 'Forbidden' }, 403);
    }

    console.log(`📋 [Get Proposals] User ${user.id} (${user.email}) ${isSpecialUser ? '[SPECIAL]' : ''} requesting proposals for project ${projectId}`);

    const proposalIds = await kv.get(`proposals:project:${projectId}`) || [];
    const proposals = Array.isArray(proposalIds) && proposalIds.length > 0
      ? await kv.mget(proposalIds.map(id => `proposal:${id}`))
      : [];
    const validProposals = proposals.filter(p => p !== null);

    // 🔧 為每個提案添加接案者名字
    const proposalsWithNames = await Promise.all(
      validProposals.map(async (proposal) => {
        try {
          console.log(`🔍 [Get Proposals] Fetching profile for freelancer_id: ${proposal.freelancer_id}`);
          const freelancerProfile = await kv.get(`profile_${proposal.freelancer_id}`);
          console.log(`🔍 [Get Proposals] Freelancer profile:`, freelancerProfile ? {
            email: freelancerProfile.email,
            name: freelancerProfile.name,
            hasData: !!freelancerProfile
          } : 'NULL');
          
          // 🔥 優先使用 profile，然後是提案中存儲的名字，最後是 email
          const freelancerName = freelancerProfile?.name 
            || freelancerProfile?.email 
            || proposal.freelancer_name  // 🔥 新增：使用提案中存儲的名字
            || proposal.freelancer_email // 🔥 新增：使用提案中存儲的 email
            || 'Unknown';
          console.log(`✅ [Get Proposals] Using freelancer name: ${freelancerName}`);
          
          return {
            ...proposal,
            freelancer_name: freelancerName
          };
        } catch (error) {
          console.error(`❌ [Get Proposals] Error fetching profile for ${proposal.freelancer_id}:`, error);
          // 🔥 錯誤情況下也嘗試使用提案中存儲的信息
          return {
            ...proposal,
            freelancer_name: proposal.freelancer_name || proposal.freelancer_email || 'Unknown'
          };
        }
      })
    );

    console.log(`✅ [Get Proposals] Returning ${proposalsWithNames.length} proposals for project ${projectId}`);
    console.log(`📋 [Get Proposals] Proposals with names:`, proposalsWithNames.map(p => ({
      id: p.id,
      freelancer_id: p.freelancer_id,
      freelancer_name: p.freelancer_name,
      status: p.status
    })));

    return c.json({ proposals: proposalsWithNames });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return c.json({ error: 'Failed to fetch proposals' }, 500);
  }
});

// Get user's proposals
app.get("/make-server-215f78a5/proposals/user/:userId", async (c) => {
  try {
    // 🧪 Check for dev mode token first (sent in X-Dev-Token header)
    const devToken = c.req.header('X-Dev-Token');
    const accessToken = devToken || c.req.header('Authorization')?.split(' ')[1];
    
    console.log('🔍 [Get User Proposals] Auth check:', {
      hasDevToken: !!devToken,
      hasAuthHeader: !!c.req.header('Authorization'),
      tokenPreview: accessToken?.substring(0, 30) + '...'
    });
    
    const { user, error: authError } = await verifyUser(accessToken);
    
    if (!user?.id || authError) {
      console.log('❌ [Get User Proposals] Auth failed:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.param('userId');

    // Users can only view their own proposals
    if (user.id !== userId) {
      console.log('❌ [Get User Proposals] Forbidden: user.id !== userId', { userId: user.id, requestedUserId: userId });
      return c.json({ error: 'Forbidden' }, 403);
    }

    const proposalIds = await kv.get(`proposals:user:${userId}`) || [];
    const proposals = Array.isArray(proposalIds) && proposalIds.length > 0
      ? await kv.mget(proposalIds.map(id => `proposal:${id}`))
      : [];
    const validProposals = proposals.filter(p => p !== null);

    // 🔥 獲取每個提案對應的項目標題
    const proposalsWithProjectTitles = await Promise.all(
      validProposals.map(async (proposal: any) => {
        const project = await kv.get(`project:${proposal.project_id}`);
        console.log(`📋 [Get User Proposals] Proposal ${proposal.id} -> Project ${proposal.project_id}: "${project?.title}"`);
        
        // 🔥 優先使用 proposal 自己的 milestone_plan_status，如果沒有則讀取 milestone_plan 的 status
        let milestoneStatus = proposal.milestone_plan_status;
        if (!milestoneStatus) {
          const milestonePlan = await kv.get(`milestone_plan:${proposal.id}`);
          milestoneStatus = milestonePlan?.status;
        }
        
        console.log(`🔍🔍🔍 [Get User Proposals] Proposal ${proposal.id}:`, {
          proposalMilestoneStatus: proposal.milestone_plan_status,
          finalMilestoneStatus: milestoneStatus,
          proposalStatus: proposal.status
        });
        
        return {
          ...proposal,
          project_title: project?.title || '專案',
          milestone_plan_status: milestoneStatus
        };
      })
    );

    console.log(`✅ [Get User Proposals] Returning ${proposalsWithProjectTitles.length} proposals for user ${userId}`);

    return c.json({ proposals: proposalsWithProjectTitles });
  } catch (error) {
    console.error('Error fetching user proposals:', error);
    return c.json({ error: 'Failed to fetch proposals' }, 500);
  }
});

// 🔥 Get a single proposal by ID (for viewing milestone feedback details)
app.get("/make-server-215f78a5/proposals/:id", async (c) => {
  console.log('📋 [Get Proposal] ===== GET SINGLE PROPOSAL =====');
  console.log('📋 [Get Proposal] Path:', c.req.path);
  
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      console.error('❌ [Get Proposal] Unauthorized');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const proposalId = c.req.param('id');
    console.log('📋 [Get Proposal] Proposal ID:', proposalId);
    
    const proposal = await kv.get(`proposal:${proposalId}`);
    console.log('📋 [Get Proposal] Proposal found:', !!proposal);
    console.log('📋 [Get Proposal] Proposal data:', {
      id: proposal?.id,
      milestone_plan_status: proposal?.milestone_plan_status,
      milestone_plan_feedback: proposal?.milestone_plan_feedback,
      milestone_plan_reviewed_at: proposal?.milestone_plan_reviewed_at
    });

    if (!proposal) {
      console.error('❌ [Get Proposal] Proposal not found');
      return c.json({ error: 'Proposal not found' }, 404);
    }

    // Check if user is authorized to view this proposal
    if (proposal.freelancer_id !== user.id && proposal.client_id !== user.id) {
      console.error('❌ [Get Proposal] Forbidden - User is not involved in this proposal');
      return c.json({ error: 'Forbidden' }, 403);
    }

    console.log('✅ [Get Proposal] Returning proposal with feedback');
    return c.json({ proposal });
  } catch (error) {
    console.error('❌ [Get Proposal] Error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// 🔥 DEBUG: Get milestone plan status for a proposal
app.get("/make-server-215f78a5/debug/milestone-plan/:proposalId", async (c) => {
  try {
    const proposalId = c.req.param('proposalId');
    
    const proposal = await kv.get(`proposal:${proposalId}`);
    const milestonePlan = await kv.get(`milestone_plan:${proposalId}`);
    const milestoneIds = await kv.get(`milestones:proposal:${proposalId}`) || [];
    const milestones = milestoneIds.length > 0 
      ? await kv.mget(milestoneIds.map((id: string) => `milestone:${id}`))
      : [];
    
    return c.json({
      proposal: proposal ? {
        id: proposal.id,
        status: proposal.status,
        project_id: proposal.project_id,
      } : null,
      milestone_plan: milestonePlan,
      milestones: milestones.filter(Boolean),
      debug: {
        proposal_key: `proposal:${proposalId}`,
        milestone_plan_key: `milestone_plan:${proposalId}`,
        milestones_key: `milestones:proposal:${proposalId}`,
      }
    });
  } catch (error) {
    console.error('Error debugging milestone plan:', error);
    return c.json({ error: 'Failed to debug milestone plan' }, 500);
  }
});

// Update proposal status (accept/reject)
app.put("/make-server-215f78a5/proposals/:id", async (c) => {
  try {
    // 🧪 Check for dev mode token first (sent in X-Dev-Token header)
    const devToken = c.req.header('X-Dev-Token');
    const accessToken = devToken || c.req.header('Authorization')?.split(' ')[1];
    
    console.log('🔍 [Update Proposal] Auth check:', {
      hasDevToken: !!devToken,
      hasAuthHeader: !!c.req.header('Authorization'),
      tokenPreview: accessToken?.substring(0, 30) + '...'
    });
    
    const { user, error: authError } = await verifyUser(accessToken);
    
    if (!user?.id || authError) {
      console.log('❌ [Update Proposal] Auth failed:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const proposalId = c.req.param('id');
    const proposal = await kv.get(`proposal:${proposalId}`);

    if (!proposal) {
      return c.json({ error: 'Proposal not found' }, 404);
    }

    const body = await c.req.json();
    const { status, milestone_plan_status } = body;
    
    console.log('🔍 [Update Proposal] Request:', {
      proposalId,
      status,
      milestone_plan_status,
      userId: user.id,
      freelancerId: proposal.freelancer_id,
      clientId: proposal.client_id
    });

    // Only client can accept/reject, only freelancer can withdraw
    if (status === 'accepted' || status === 'rejected') {
      if (proposal.client_id !== user.id) {
        return c.json({ error: 'Forbidden' }, 403);
      }
    } else if (status === 'withdrawn') {
      if (proposal.freelancer_id !== user.id) {
        return c.json({ error: 'Forbidden' }, 403);
      }
    }

    const updatedProposal = {
      ...proposal,
      updated_at: new Date().toISOString(),
    };
    
    // Update status if provided
    if (status) {
      updatedProposal.status = status;
    }
    
    // ✅ Update milestone_plan_status if provided
    if (milestone_plan_status !== undefined) {
      updatedProposal.milestone_plan_status = milestone_plan_status;
      console.log('✅ [Update Proposal] Updating milestone_plan_status:', {
        old: proposal.milestone_plan_status,
        new: milestone_plan_status
      });
    }

    await kv.set(`proposal:${proposalId}`, updatedProposal);
    
    console.log('✅ [Update Proposal] Updated proposal:', {
      id: proposalId,
      status: updatedProposal.status,
      milestone_plan_status: updatedProposal.milestone_plan_status
    });

    // If accepted, update project status and create escrow
    if (status === 'accepted') {
      const project = await kv.get(`project:${proposal.project_id}`);
      if (project) {
        project.status = 'in_progress';
        project.assigned_freelancer_id = proposal.freelancer_id;
        project.updated_at = new Date().toISOString();
        await kv.set(`project:${proposal.project_id}`, project);

        // ✅ Create escrow for the accepted proposal
        const escrowAmount = proposal.proposed_budget || project.budget_max || project.budget_min || 0;
        
        // Check client wallet balance
        let clientWallet = await kv.get(`wallet:${proposal.client_id}`);
        
        // 🔥 開發模式：檢查**當前登錄用戶**是否為特殊用戶
        const SPECIAL_USER_EMAILS = ['davidlai117@yahoo.com.tw', 'davidlai234@hotmail.com'];
        const currentUserProfile = await kv.get(`profile:${user.id}`);
        const isCurrentUserSpecial = currentUserProfile?.email && SPECIAL_USER_EMAILS.includes(currentUserProfile.email.toLowerCase());
        
        if (!clientWallet) {
          // Create wallet if it doesn't exist
          const newWallet = {
            user_id: proposal.client_id,
            balance: isCurrentUserSpecial ? 10000000 : 0, // 🧪 如果當前登錄用戶是特殊用戶，給予 1000 萬測試餘額
            locked: 0,
            total_earned: 0,
            total_spent: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          await kv.set(`wallet:${proposal.client_id}`, newWallet);
          clientWallet = newWallet;
          
          if (isCurrentUserSpecial) {
            console.log(`🧪 [Dev Mode] Special user ${user.email} detected, created wallet with ${newWallet.balance} balance`);
          } else if (!isCurrentUserSpecial) {
            return c.json({ error: 'Insufficient balance. Please deposit funds first.' }, 400);
          }
        }

        // Check if balance is sufficient (skip for special users in dev mode)
        if (clientWallet.balance < escrowAmount && !isCurrentUserSpecial) {
          return c.json({ error: 'Insufficient balance. Please deposit funds first.' }, 400);
        }
        
        // 🧪 如果特殊用戶且餘額不足，自動補足餘額
        if (isCurrentUserSpecial && clientWallet.balance < escrowAmount) {
          console.log(`🧪 [Dev Mode] Special user ${user.email} - auto-adding funds to wallet`);
          clientWallet.balance = escrowAmount + 10000000; // 補充足夠的餘額
          await kv.set(`wallet:${proposal.client_id}`, clientWallet);
        }

        // Update client wallet - move funds from balance to locked
        clientWallet.balance -= escrowAmount;
        clientWallet.locked += escrowAmount;
        clientWallet.updated_at = new Date().toISOString();
        await kv.set(`wallet:${proposal.client_id}`, clientWallet);

        // Create escrow record
        const escrowId = crypto.randomUUID();
        const escrow = {
          id: escrowId,
          project_id: proposal.project_id,
          client_id: proposal.client_id,
          freelancer_id: proposal.freelancer_id,
          amount: escrowAmount,
          status: 'locked',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          released_at: null,
        };
        await kv.set(`escrow:${escrowId}`, escrow);
        await kv.set(`escrow:project:${proposal.project_id}`, escrowId);

        // Create transaction record for escrow creation
        const transactionId = crypto.randomUUID();
        const transaction = {
          id: transactionId,
          user_id: proposal.client_id,
          type: 'escrow',
          amount: -escrowAmount,
          description: `Escrow created for project: ${project.title}`,
          created_at: new Date().toISOString(),
        };
        await kv.set(`transaction:${transactionId}`, transaction);
        
        // Add to user's transaction list
        const userTransactions = await kv.get(`transactions:user:${proposal.client_id}`) || [];
        userTransactions.unshift(transactionId);
        await kv.set(`transactions:user:${proposal.client_id}`, userTransactions);

        console.log('✅ Escrow created:', {
          escrowId,
          projectId: proposal.project_id,
          amount: escrowAmount,
          clientId: proposal.client_id,
          freelancerId: proposal.freelancer_id,
        });
      }
    }

    // 📧 Send proposal status email to freelancer
    try {
      console.log(`📧 [Accept Proposal] Sending status email to freelancer (id: ${proposal.freelancer_id}, status: ${status})`);
      
      const freelancerProfile = await kv.get(`profile_${proposal.freelancer_id}`);
      const clientProfile = await kv.get(`profile_${proposal.client_id}`);
      const project = await kv.get(`project:${proposal.project_id}`);
      
      console.log(`📧 [Accept Proposal] Freelancer profile:`, {
        hasProfile: !!freelancerProfile,
        hasEmail: !!freelancerProfile?.email,
        email: freelancerProfile?.email,
        name: freelancerProfile?.name || freelancerProfile?.full_name,
      });
      
      if (freelancerProfile?.email && project) {
        const language = freelancerProfile.language || 'zh';
        
        if (status === 'accepted') {
          // Send proposal accepted email
          const emailHtml = emailService.getProposalAcceptedEmail({
            name: freelancerProfile.name || freelancerProfile.full_name || freelancerProfile.email,
            projectTitle: project.title,
            clientName: clientProfile?.name || clientProfile?.full_name || 'The client',
            budget: proposal.proposed_budget,
            language,
          });

          await emailService.sendEmail({
            to: freelancerProfile.email,
            subject: language === 'en' ? '🎉 Congratulations! Your Proposal Was Accepted' : '🎉 恭喜！您的提案已被接受',
            html: emailHtml,
          });
          
          console.log(`✅ [Accept Proposal] Proposal accepted email sent to ${freelancerProfile.email}`);
        } else if (status === 'rejected') {
          // Send proposal rejected email
          const emailHtml = emailService.getProposalRejectedEmail({
            name: freelancerProfile.name || freelancerProfile.full_name || freelancerProfile.email,
            projectTitle: project.title,
            language,
          });

          await emailService.sendEmail({
            to: freelancerProfile.email,
            subject: language === 'en' ? 'Proposal Update' : '提案更��',
            html: emailHtml,
          });
          
          console.log(`✅ [Accept Proposal] Proposal rejected email sent to ${freelancerProfile.email}`);
        }
      } else {
        console.warn(`⚠️  [Accept Proposal] Missing required data - freelancerEmail: ${!!freelancerProfile?.email}, project: ${!!project}`);
      }
    } catch (emailError) {
      console.error('❌ [Accept Proposal] Error sending proposal status email:', emailError);
    }

    // 📧 發送郵��通知給案主（client）- 提案狀態更新
    if (status === 'accepted') {
      try {
        console.log(`📧 [Accept Proposal - Client] Sending confirmation to client (id: ${proposal.client_id})`);
        
        const clientProfile = await kv.get(`profile_${proposal.client_id}`);
        const freelancerProfile = await kv.get(`profile_${proposal.freelancer_id}`);
        const project = await kv.get(`project:${proposal.project_id}`);
        
        console.log(`📧 [Accept Proposal - Client] Client profile:`, {
          hasProfile: !!clientProfile,
          hasEmail: !!clientProfile?.email,
          email: clientProfile?.email,
          name: clientProfile?.name || clientProfile?.full_name,
        });
        
        if (clientProfile?.email && project) {
          const language = clientProfile.language || 'zh';
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3b82f6;">✅ ${language === 'en' ? 'Proposal Accepted' : '提案已接受'}</h2>
              <p>${language === 'en' ? 'Dear' : '親愛的'} ${clientProfile.name || clientProfile.full_name || clientProfile.email},</p>
              <p>${language === 'en' 
                ? `You have accepted ${freelancerProfile?.name || freelancerProfile?.full_name || "the freelancer's"} proposal for the project "${project.title}".`
                : `您已接受${freelancerProfile?.name || freelancerProfile?.full_name || '接案者'}為項目「${project.title}」提交的提案。`
              }</p>
              <div style="background: #dbeafe; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">${language === 'en' ? 'Project Details' : '項目詳情'}</h3>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>${language === 'en' ? 'Freelancer:' : '接案者：'}</strong> ${freelancerProfile?.name || freelancerProfile?.full_name || 'Freelancer'}</li>
                  <li><strong>${language === 'en' ? 'Budget:' : '預算：'}</strong> $${proposal.proposed_budget.toFixed(2)}</li>
                </ul>
              </div>
              <p>${language === 'en' 
                ? 'Funds have been placed in escrow. The freelancer will start working on your project soon.'
                : '款項已託管。接案者將很快開始為您的項目工作。'
              }</p>
            </div>
          `;

          await emailService.sendEmail({
            to: clientProfile.email,
            subject: language === 'en' ? '✅ Proposal Accepted' : '✅ 提案已接受',
            html: emailHtml,
          });
          
          console.log(`✅ [Accept Proposal - Client] Confirmation email sent to client ${clientProfile.email}`);
        } else {
          console.warn(`⚠️  [Accept Proposal - Client] Missing required data - clientEmail: ${!!clientProfile?.email}, project: ${!!project}`);
        }
      } catch (emailError) {
        console.error('❌ [Accept Proposal - Client] Error sending proposal acceptance email to client:', emailError);
      }
    }

    return c.json({ proposal: updatedProposal });
  } catch (error) {
    console.error('Error updating proposal:', error);
    return c.json({ error: 'Failed to update proposal' }, 500);
  }
});

// 🔧 Accept proposal (new simplified endpoint)
app.post("/make-server-215f78a5/proposals/:id/accept", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const proposalId = c.req.param('id');
    const proposal = await kv.get(`proposal:${proposalId}`);

    if (!proposal) {
      return c.json({ error: 'Proposal not found' }, 404);
    }

    // 🔧 檢查特殊用戶（開發者帳號）
    const SPECIAL_USER_EMAILS = [
      'davidlai117@yahoo.com.tw',
      'davidlai234@hotmail.com'
    ];
    const isSpecialUser = user.email && SPECIAL_USER_EMAILS.includes(user.email.toLowerCase());

    // Only client or special users can accept
    if (proposal.client_id !== user.id && !isSpecialUser) {
      console.warn(`⚠️  [Accept Proposal] User ${user.id} (${user.email}) not authorized to accept proposal ${proposalId}`);
      return c.json({ error: 'Forbidden' }, 403);
    }



    // Use the existing PUT logic by calling it with status='accepted'
    const updatedProposal = {
      ...proposal,
      status: 'accepted',
      updated_at: new Date().toISOString(),
    };

    await kv.set(`proposal:${proposalId}`, updatedProposal);

    // Update project status and create escrow
    const project = await kv.get(`project:${proposal.project_id}`);
    if (project) {
      // 🔥 NEW: 檢查是否有里程碑計劃
      const milestoneIds = await kv.get(`milestones:proposal:${proposalId}`) || [];
      const hasMilestones = milestoneIds.length > 0;
      
      if (hasMilestones) {
        // 🔥 如果有里程碑計劃，必須先確認計劃已被批准並創建託管
        const milestonePlan = await kv.get(`milestone_plan:${proposalId}`);
        
        // 檢查計劃是否已批准
        if (!milestonePlan || milestonePlan.status !== 'approved') {
          return c.json({ 
            error: 'milestone_plan_not_approved',
            message: 'Milestone plan must be approved before accepting the proposal',
            user_message: {
              en: '⚠️ Please review and approve the milestone plan before accepting this proposal.',
              'zh-TW': '⚠️ 請先審核並批准里程碑計劃，然後再接受此提案。',
              'zh-CN': '⚠️ 请先审核并批准里程碑计划，然后再接受此提案。'
            },
            milestone_plan_status: milestonePlan?.status || 'not_submitted',
            action_required: 'approve_milestone_plan'
          }, 400);
        }
        
        // 檢查託管是否已創建
        if (!milestonePlan.escrow_id) {
          return c.json({ 
            error: 'escrow_not_created',
            message: 'Escrow must be created before accepting the proposal',
            user_message: {
              en: '⚠️ Escrow account not created. This usually happens when wallet balance is insufficient. Please ensure you have enough funds and re-approve the milestone plan.',
              'zh-TW': '⚠️ 託管帳號尚未建立。這通常是因為錢包餘額不足。請確保您有足夠的資金並重新批准里程碑計劃。',
              'zh-CN': '⚠️ 托管账号尚未建立。这通常是因为钱包余额不足。请确保您有足够的资金并重新批准里程碑计划。'
            },
            action_required: 'deposit_and_approve_milestone_plan'
          }, 400);
        }
        
        // 驗證託管確實存在
        const escrow = await kv.get(`escrow:${milestonePlan.escrow_id}`);
        if (!escrow) {
          return c.json({ 
            error: 'escrow_not_found',
            message: 'Escrow record not found',
            user_message: {
              en: '⚠️ Escrow account not found. Please contact support.',
              'zh-TW': '⚠️ 找不到託管帳號。請聯繫客服。',
              'zh-CN': '⚠️ 找不到托管账号。请联系客服。'
            }
          }, 400);
        }
        
        // 里程碑計劃已批准且託管已創建，可以接受提案
        // 不需要再次創建託管，只需更新項目狀態
        project.status = 'in_progress';
        project.assigned_freelancer_id = proposal.freelancer_id;
        project.updated_at = new Date().toISOString();
        await kv.set(`project:${proposal.project_id}`, project);
      } else {
        // 🔥 沒有里程碑計劃，使用傳統的託管流程
        
        project.status = 'in_progress';
        project.assigned_freelancer_id = proposal.freelancer_id;
        project.updated_at = new Date().toISOString();
        await kv.set(`project:${proposal.project_id}`, project);

        // Create escrow
        const escrowAmount = proposal.proposed_budget || project.budget_max || project.budget_min || 0;
        
        let clientWallet = await kv.get(`wallet:${proposal.client_id}`);
        
        // 🔥 開發模式：檢查**當前登錄用戶**是否為特殊用戶（已在上面定義 isSpecialUser）
        if (!clientWallet) {
          const newWallet = {
            user_id: proposal.client_id,
            balance: isSpecialUser ? 10000000 : 0, // 🧪 如果當前登錄用戶是特殊用戶，給予 1000 萬測試餘額
            locked: 0,
            total_earned: 0,
            total_spent: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          await kv.set(`wallet:${proposal.client_id}`, newWallet);
          clientWallet = newWallet;
          
          if (isSpecialUser) {
            console.log(`🧪 [Dev Mode] Special user ${user.email} detected, created wallet with ${newWallet.balance} balance`);
          } else if (!isSpecialUser) {
            return c.json({ 
              error: 'insufficient_balance',
              message: 'Insufficient balance. Please deposit funds first.',
              user_message: {
                en: '💰 Insufficient wallet balance. Please deposit funds to accept this proposal.',
                'zh-TW': '💰 錢包餘額不足。請充值以接受此提案。',
                'zh-CN': '💰 钱包余额不足。请充值以接受此提案。'
              },
              required_amount: escrowAmount,
              available_balance: 0,
              shortfall_amount: escrowAmount,
              currency: proposal.currency || 'TWD'
            }, 400);
          }
        }

        // Check if balance is sufficient (skip for special users in dev mode)
        const availableBalance = clientWallet.balance - (clientWallet.locked || 0);
        
        if (availableBalance < escrowAmount && !isSpecialUser) {
          const shortfall = escrowAmount - availableBalance;
          
          return c.json({ 
            error: 'insufficient_balance',
            message: 'Insufficient balance. Please deposit funds first.',
            user_message: {
              en: `💰 Insufficient wallet balance. Please deposit at least $${shortfall.toFixed(2)} ${proposal.currency || 'TWD'} to accept this proposal.`,
              'zh-TW': `💰 錢包餘額不足。請至少充值 ${shortfall.toFixed(2)} ${proposal.currency || 'TWD'} 以接受此提案。`,
              'zh-CN': `💰 钱包余额不足。请至少充值 ${shortfall.toFixed(2)} ${proposal.currency || 'TWD'} 以接受此提案。`
            },
            required_amount: escrowAmount,
            available_balance: availableBalance,
            shortfall_amount: shortfall,
            currency: proposal.currency || 'TWD'
          }, 400);
        }
        
        // 🧪 如果特殊用戶且餘額不足，自動補足餘額
        if (isSpecialUser && clientWallet.balance < escrowAmount) {
          console.log(`🧪 [Dev Mode] Special user ${user.email} - auto-adding funds to wallet`);
          clientWallet.balance = escrowAmount + 10000000; // 補充足夠的餘額
          await kv.set(`wallet:${proposal.client_id}`, clientWallet);
        }

        clientWallet.balance -= escrowAmount;
        clientWallet.locked += escrowAmount;
        clientWallet.updated_at = new Date().toISOString();
        await kv.set(`wallet:${proposal.client_id}`, clientWallet);

        const escrowId = crypto.randomUUID();
        const escrow = {
          id: escrowId,
          project_id: proposal.project_id,
          client_id: proposal.client_id,
          freelancer_id: proposal.freelancer_id,
          amount: escrowAmount,
          currency: proposal.currency || 'TWD',
          status: 'locked',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          released_at: null,
        };
        await kv.set(`escrow:${escrowId}`, escrow);
        await kv.set(`escrow:project:${proposal.project_id}`, escrowId);

        const transactionId = crypto.randomUUID();
        const transaction = {
          id: transactionId,
          user_id: proposal.client_id,
          type: 'escrow',
          amount: -escrowAmount,
          currency: proposal.currency || 'TWD',
          description: `Escrow created for project: ${project.title}`,
          status: 'completed',
          created_at: new Date().toISOString(),
        };
        await kv.set(`transaction:${transactionId}`, transaction);
        
        const userTransactions = await kv.get(`transactions:user:${proposal.client_id}`) || [];
        userTransactions.unshift(transactionId);
        await kv.set(`transactions:user:${proposal.client_id}`, userTransactions);

        console.log('✅ Escrow created for accepted proposal');
      }
    }

    return c.json({ success: true, proposal: updatedProposal });
  } catch (error) {
    console.error('Error accepting proposal:', error);
    return c.json({ error: 'Failed to accept proposal' }, 500);
  }
});

// 🔧 Reject proposal (new simplified endpoint)
app.post("/make-server-215f78a5/proposals/:id/reject", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const proposalId = c.req.param('id');
    const proposal = await kv.get(`proposal:${proposalId}`);

    if (!proposal) {
      return c.json({ error: 'Proposal not found' }, 404);
    }

    // 🔧 檢查特殊用戶（開發者帳號）
    const SPECIAL_USER_EMAILS = [
      'davidlai117@yahoo.com.tw',
      'davidlai234@hotmail.com'
    ];
    const isSpecialUser = user.email && SPECIAL_USER_EMAILS.includes(user.email.toLowerCase());

    // Only client or special users can reject
    if (proposal.client_id !== user.id && !isSpecialUser) {
      console.warn(`⚠️  [Reject Proposal] User ${user.id} (${user.email}) not authorized to reject proposal ${proposalId}`);
      return c.json({ error: 'Forbidden' }, 403);
    }

    console.log(`✅ [Reject Proposal] User ${user.id} (${user.email}) ${isSpecialUser ? '[SPECIAL]' : ''} rejecting proposal ${proposalId}`);

    const updatedProposal = {
      ...proposal,
      status: 'rejected',
      updated_at: new Date().toISOString(),
    };

    await kv.set(`proposal:${proposalId}`, updatedProposal);

    return c.json({ success: true, proposal: updatedProposal });
  } catch (error) {
    console.error('Error rejecting proposal:', error);
    return c.json({ error: 'Failed to reject proposal' }, 500);
  }
});

// ============= MILESTONE PLAN REVIEW ROUTES =============

// 🔥 獲取提案的里程碑計劃（用於審核）
app.get("/make-server-215f78a5/milestones/plan/:proposalId", async (c) => {
  try {
    console.log('📋 [Get Milestone Plan] ===== START =====');
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const proposalId = c.req.param('proposalId');
    console.log('📋 [Get Milestone Plan] Proposal ID:', proposalId);

    // 獲取提案
    const proposal = await kv.get(`proposal:${proposalId}`);
    if (!proposal) {
      return c.json({ error: 'Proposal not found' }, 404);
    }

    // 檢查權限（只有客戶或接案者可以查看）
    if (proposal.client_id !== user.id && proposal.freelancer_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // 獲取里程碑
    const milestoneIds = await kv.get(`milestones:proposal:${proposalId}`) || [];
    const milestones = Array.isArray(milestoneIds) && milestoneIds.length > 0
      ? await kv.mget(milestoneIds.map(id => `milestone:${id}`))
      : [];
    const validMilestones = milestones.filter(m => m !== null);

    // 計算總金額
    const totalAmount = validMilestones.reduce((sum, m) => sum + (m.amount || 0), 0);

    // 構建計劃數據
    const plan = {
      status: proposal.milestone_plan_status || 'submitted', // submitted, revision_requested, approved
      submitted_at: proposal.created_at,
      reviewed_at: proposal.milestone_plan_reviewed_at,
      feedback: proposal.milestone_plan_feedback,
      milestones: validMilestones.sort((a, b) => (a.order || 0) - (b.order || 0)),
      total_amount: totalAmount,
    };

    console.log('✅ [Get Milestone Plan] Plan loaded:', {
      status: plan.status,
      milestones: plan.milestones.length,
      total: plan.total_amount
    });

    return c.json({ plan });
  } catch (error) {
    console.error('❌ [Get Milestone Plan] Error:', error);
    return c.json({ error: 'Failed to load milestone plan' }, 500);
  }
});

// 🔥 批准里程碑計劃
app.post("/make-server-215f78a5/milestones/plan/:proposalId/approve", async (c) => {
  try {
    console.log('✅ [Approve Milestone Plan] ===== START =====');
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const proposalId = c.req.param('proposalId');
    console.log('✅ [Approve Milestone Plan] Proposal ID:', proposalId);

    // 獲取提案
    const proposal = await kv.get(`proposal:${proposalId}`);
    if (!proposal) {
      return c.json({ error: 'Proposal not found' }, 404);
    }

    // 只有客戶可以批准
    if (proposal.client_id !== user.id) {
      return c.json({ error: 'Forbidden: Only client can approve' }, 403);
    }

    // 🔥 獲取所有里程碑並計算總金額
    const milestoneIds = await kv.get(`milestones:proposal:${proposalId}`) || [];
    if (!Array.isArray(milestoneIds) || milestoneIds.length === 0) {
      return c.json({ error: 'No milestones found' }, 400);
    }

    const milestones = await kv.mget(milestoneIds.map(id => `milestone:${id}`));
    const validMilestones = milestones.filter(m => m && m.amount);
    
    if (validMilestones.length === 0) {
      return c.json({ error: 'No valid milestones found' }, 400);
    }

    const totalAmount = validMilestones.reduce((sum, m) => sum + (m.amount || 0), 0);
    const currency = proposal.currency || 'TWD';

    console.log('💰 [Approve Milestone Plan] Total amount:', totalAmount, currency);

    // 🔥 檢查客戶錢包餘額
    const walletKey = `wallet:${user.id}`;
    const wallet = await kv.get(walletKey) || {
      user_id: user.id,
      balances: { TWD: 0, USD: 0, CNY: 0 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const availableBalance = wallet.balances?.[currency] || 0;

    console.log('💰 [Approve Milestone Plan] Available balance:', availableBalance, currency);

    // 🔥 檢查餘額是否足夠
    if (availableBalance < totalAmount) {
      const shortfall = totalAmount - availableBalance;
      console.log('❌ [Approve Milestone Plan] Insufficient balance!');
      
      return c.json({
        error: 'insufficient_balance',
        message: 'Insufficient wallet balance',
        user_message: {
          'en': `You need to deposit at least ${shortfall.toFixed(2)} ${currency} to approve this milestone plan.`,
          'zh-TW': `您需要至少儲值 ${shortfall.toFixed(2)} ${currency} 才能批准此里程碑計劃。`,
          'zh-CN': `您需要至少充值 ${shortfall.toFixed(2)} ${currency} 才能批准此里程碑计划。`,
        },
        required_amount: totalAmount,
        available_balance: availableBalance,
        shortfall_amount: shortfall,
        currency: currency,
      }, 400);
    }

    // 🔥 創建託管記錄
    const escrowId = crypto.randomUUID();
    const escrow = {
      id: escrowId,
      proposal_id: proposalId,
      project_id: proposal.project_id,
      client_id: user.id,
      freelancer_id: proposal.freelancer_id,
      amount: totalAmount,
      currency: currency,
      status: 'locked',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await kv.set(`escrow:${escrowId}`, escrow);
    await kv.set(`escrow:proposal:${proposalId}`, escrowId);

    console.log('🔒 [Approve Milestone Plan] Escrow created:', escrowId);

    // 🔥 扣除客戶錢包餘額
    wallet.balances[currency] = availableBalance - totalAmount;
    wallet.updated_at = new Date().toISOString();
    await kv.set(walletKey, wallet);

    console.log('💸 [Approve Milestone Plan] Deducted from wallet:', totalAmount, currency);

    // 🔥 創建交易記錄
    const transactionId = crypto.randomUUID();
    const transaction = {
      id: transactionId,
      user_id: user.id,
      type: 'escrow_lock',
      amount: -totalAmount,
      currency: currency,
      status: 'completed',
      description: `Locked ${totalAmount} ${currency} in escrow for proposal ${proposalId}`,
      created_at: new Date().toISOString(),
      related_id: escrowId,
    };

    await kv.set(`transaction:${transactionId}`, transaction);

    // 添加到用戶交易列表
    const userTransactionsKey = `transactions:user:${user.id}`;
    const userTransactions = await kv.get(userTransactionsKey) || [];
    userTransactions.unshift(transactionId);
    await kv.set(userTransactionsKey, userTransactions.slice(0, 100));

    console.log('📝 [Approve Milestone Plan] Transaction created:', transactionId);

    // 更新提案狀態
    const updatedProposal = {
      ...proposal,
      milestone_plan_status: 'approved',
      milestone_plan_reviewed_at: new Date().toISOString(),
      escrow_id: escrowId,
      updated_at: new Date().toISOString(),
    };

    await kv.set(`proposal:${proposalId}`, updatedProposal);

    // 🔥 更新所有里程碑狀態為 pending（等待開始）
    for (const milestone of validMilestones) {
      milestone.status = 'pending';
      milestone.updated_at = new Date().toISOString();
      await kv.set(`milestone:${milestone.id}`, milestone);
    }

    console.log('✅ [Approve Milestone Plan] Plan approved and funds locked!');
    
    return c.json({ 
      success: true,
      escrow: {
        id: escrowId,
        amount: totalAmount,
        currency: currency,
        status: 'locked',
      },
      wallet: {
        available_balance: wallet.balances[currency],
        currency: currency,
      }
    });
  } catch (error) {
    console.error('❌ [Approve Milestone Plan] Error:', error);
    return c.json({ error: 'Failed to approve plan', message: error.message }, 500);
  }
});

// ============= REVIEW ROUTES =============

// Check if user has already reviewed a project
app.get("/make-server-215f78a5/reviews/check/:project_id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('project_id');
    
    // Get the project to find the other party
    const project = await kv.get(`project:${projectId}`);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Determine the recipient based on whether user is client or freelancer
    const isClient = user.id === project.user_id;
    let recipientId;
    
    if (isClient) {
      // Client reviewing freelancer
      recipientId = project.assigned_freelancer_id;
    } else {
      // Freelancer reviewing client
      recipientId = project.user_id;
    }

    if (!recipientId) {
      return c.json({ has_reviewed: false });
    }

    // Check if review exists
    const reviewKey = `review:${projectId}:${user.id}:${recipientId}`;
    const existingReview = await kv.get(reviewKey);

    return c.json({ 
      has_reviewed: !!existingReview,
      review: existingReview || null
    });
  } catch (error) {
    console.error('Error checking review status:', error);
    return c.json({ error: 'Failed to check review status' }, 500);
  }
});

// Submit a review
app.post("/make-server-215f78a5/reviews/submit", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      console.error('Authorization error while submitting review:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { project_id, recipient_id, recipient_type, rating, comment } = body;

    if (!project_id || !recipient_id || !recipient_type || !rating) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (rating < 1 || rating > 5) {
      return c.json({ error: 'Rating must be between 1 and 5' }, 400);
    }

    // Verify project exists and is completed
    const project = await kv.get(`project:${project_id}`);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    if (project.status !== 'completed') {
      return c.json({ error: 'Project must be completed to submit reviews' }, 400);
    }

    // Verify user is part of the project (either client or freelancer)
    const isClient = user.id === project.user_id;
    // Note: In a real implementation, we'd fetch the accepted proposal to get freelancer_id
    // For now, we'll trust the frontend to pass the correct recipient_id
    
    // Check if review already exists
    const existingReviewKey = `review:${project_id}:${user.id}:${recipient_id}`;
    const existingReview = await kv.get(existingReviewKey);
    if (existingReview) {
      return c.json({ error: 'Review already submitted for this project' }, 400);
    }

    const reviewId = crypto.randomUUID();
    const review = {
      id: reviewId,
      project_id,
      reviewer_id: user.id,
      recipient_id,
      recipient_type,
      rating,
      comment: comment || '',
      created_at: new Date().toISOString(),
    };

    // Store review
    await kv.set(existingReviewKey, review);
    await kv.set(`review:${reviewId}`, review);

    // Add to recipient's reviews list
    const recipientReviewsList = await kv.get(`user:${recipient_id}:reviews`) || [];
    recipientReviewsList.push(reviewId);
    await kv.set(`user:${recipient_id}:reviews`, recipientReviewsList);

    // Update recipient's average rating
    try {
      const recipientReviews = (await kv.getByPrefix(`review:${project_id}:`) || []).map(item => item.value);
      const filteredReviews = recipientReviews.filter((r: any) => r.recipient_id === recipient_id);
      const allRecipientReviews = Array.isArray(filteredReviews) && filteredReviews.length > 0
        ? await kv.mget(filteredReviews.map((r: any) => `review:${r.id}`))
        : [];
      
      const totalRating = allRecipientReviews.reduce((sum: number, r: any) => sum + (r?.rating || 0), rating);
      const avgRating = totalRating / (allRecipientReviews.length + 1);

      // Store average rating
      await kv.set(`user:${recipient_id}:avg_rating`, avgRating);
      console.log(`✅ [Reviews] Updated average rating for user ${recipient_id}: ${avgRating}`);
    } catch (error) {
      console.error(`❌ [Reviews] Error updating average rating:`, error);
      // Continue even if average rating update fails
    }

    // 📧 Send new review email to recipient
    try {
      const recipientProfile = await kv.get(`profile_${recipient_id}`);
      const reviewerProfile = await kv.get(`profile_${user.id}`);
      const project = await kv.get(`project:${project_id}`);
      
      if (recipientProfile?.email && project) {
        const language = recipientProfile.language || 'zh';
        const emailHtml = emailService.getNewReviewEmail({
          name: recipientProfile.name || recipientProfile.email,
          reviewerName: reviewerProfile?.name || 'A user',
          rating,
          projectTitle: project.title,
          language,
        });

        await emailService.sendEmail({
          to: recipientProfile.email,
          subject: language === 'en' ? '⭐ You Received a New Review' : '⭐ 您收到了新評價',
          html: emailHtml,
        });
        
        console.log(`📧 New review email sent to ${recipientProfile.email}`);
      }
    } catch (emailError) {
      console.error('Error sending new review email:', emailError);
    }

    console.log('Review submitted successfully:', reviewId);
    return c.json({ 
      success: true, 
      review_id: reviewId,
      message: 'Review submitted successfully' 
    });

  } catch (error) {
    console.error('Error submitting review:', error);
    return c.json({ error: 'Failed to submit review' }, 500);
  }
});

// Get reviews for a user
app.get("/make-server-215f78a5/reviews/user/:user_id", async (c) => {
  try {
    const userId = c.req.param('user_id');
    
    if (!userId) {
      console.error('❌ [Reviews] Missing user ID parameter');
      return c.json({ error: 'User ID is required' }, 400);
    }

    console.log(`📊 [Reviews] Fetching reviews for user: ${userId}`);

    // Get all reviews for this user with error handling
    let reviewIds: string[] = [];
    try {
      const storedReviewIds = await kv.get(`user:${userId}:reviews`);
      reviewIds = Array.isArray(storedReviewIds) ? storedReviewIds : [];
      console.log(`📊 [Reviews] Found ${reviewIds.length} review IDs`);
    } catch (error: any) {
      console.error(`❌ [Reviews] Error fetching review IDs:`, error?.message || error);
      reviewIds = [];
    }

    // Fetch review details with error handling
    let reviews: any[] = [];
    if (reviewIds.length > 0) {
      try {
        const reviewData = await kv.mget(reviewIds.map((id: string) => `review:${id}`));
        reviews = reviewData.filter((r: any) => r !== null && r !== undefined);
        console.log(`📊 [Reviews] Fetched ${reviews.length} review details`);
      } catch (error: any) {
        console.error(`❌ [Reviews] Error fetching review details:`, error?.message || error);
        reviews = [];
      }
    }

    // Enrich reviews with reviewer and project information
    const enrichedReviews = await Promise.all(
      reviews.map(async (review: any) => {
        try {
          // Use safe profile getter - no error logging for missing profiles
          const reviewerProfile = await getProfileSafely(review.reviewer_id);
          
          let project = null;
          try {
            project = await kv.get(`project:${review.project_id}`);
          } catch (error) {
            // Project might not exist - silently handle
            project = null;
          }
          
          return {
            ...review,
            reviewer_name: reviewerProfile?.name || 'Anonymous',
            reviewer_email: reviewerProfile?.email || '',
            project_title: project?.title || 'Unknown Project',
          };
        } catch (error: any) {
          console.error(`❌ [Reviews] Error enriching review:`, error?.message || error);
          // Return basic review data if enrichment fails
          return {
            ...review,
            reviewer_name: 'Anonymous',
            reviewer_email: '',
            project_title: 'Unknown Project',
          };
        }
      })
    );

    // Get average rating with error handling
    let avgRating = 0;
    try {
      const storedAvgRating = await kv.get(`user:${userId}:avg_rating`);
      avgRating = storedAvgRating || 0;
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const shortError = errorMsg.length > 200 ? errorMsg.substring(0, 200) + '...' : errorMsg;
      console.error(`❌ [Reviews] Error fetching average rating:`, shortError);
      // If we can't get stored rating, calculate it from reviews
      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum: number, r: any) => sum + (r?.rating || 0), 0);
        avgRating = totalRating / reviews.length;
        console.log(`📊 [Reviews] Calculated average rating from ${reviews.length} reviews: ${avgRating}`);
      }
    }

    console.log(`✅ [Reviews] Successfully fetched ${enrichedReviews.length} reviews for user ${userId}`);

    return c.json({
      reviews: enrichedReviews,
      average_rating: avgRating,
      total_reviews: enrichedReviews.length,
    });

  } catch (error: any) {
    console.error('❌ [Reviews] Fatal error fetching reviews:', error?.message || error);
    console.error('❌ [Reviews] Error stack:', error?.stack);
    // Return empty data instead of error to prevent UI crashes
    return c.json({
      reviews: [],
      average_rating: 0,
      total_reviews: 0,
      error: 'Failed to fetch reviews',
    }, 200); // Return 200 with error message to prevent fetch failures
  }
});

// Get reviews for a specific project
app.get("/make-server-215f78a5/reviews/project/:project_id", async (c) => {
  try {
    const projectId = c.req.param('project_id');
    
    if (!projectId) {
      return c.json({ error: 'Project ID is required' }, 400);
    }

    console.log(`📊 [Reviews] Fetching reviews for project: ${projectId}`);

    // Get all reviews for this project with error handling
    let allReviews: any[] = [];
    try {
      const reviewData = (await kv.getByPrefix(`review:${projectId}:`)).map(item => item.value);
      allReviews = Array.isArray(reviewData) ? reviewData : [];
      console.log(`✅ [Reviews] Found ${allReviews.length} reviews for project`);
    } catch (error) {
      console.error(`❌ [Reviews] Error fetching project reviews:`, error);
      allReviews = [];
    }

    return c.json({
      reviews: allReviews,
      total: allReviews.length,
    });

  } catch (error) {
    console.error('❌ [Reviews] Error fetching project reviews:', error);
    // Return empty data instead of error
    return c.json({
      reviews: [],
      total: 0,
    });
  }
});

// ============= DELIVERABLE ROUTES =============

// Upload file and create signed URL
app.post("/make-server-215f78a5/deliverables/upload-url", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { project_id, file_name, file_type } = body;

    if (!project_id || !file_name) {
      return c.json({ error: 'Project ID and file name are required' }, 400);
    }

    // Generate unique file path
    const fileExtension = file_name.split('.').pop();
    const uniqueFileName = `${project_id}/${user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;
    
    try {
      // Create a signed upload URL (valid for 1 hour)
      const { data, error } = await supabase.storage
        .from(DELIVERABLES_BUCKET)
        .createSignedUploadUrl(uniqueFileName);

      if (error) {
        console.error('Storage error creating signed upload URL:', error);
        return c.json({ error: 'Storage service not available. Please try again later.' }, 503);
      }

      return c.json({ 
        upload_url: data.signedUrl,
        file_path: uniqueFileName,
        token: data.token,
      });
    } catch (storageError) {
      console.error('Storage exception:', storageError);
      return c.json({ error: 'Storage service not available. Please try again later.' }, 503);
    }
  } catch (error) {
    console.error('Error in upload-url endpoint:', error);
    return c.json({ error: 'Failed to create upload URL' }, 500);
  }
});

// Submit deliverables for a project
app.post("/make-server-215f78a5/deliverables/submit", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { project_id, description, files } = body;

    if (!project_id || !files || files.length === 0) {
      return c.json({ error: 'Project ID and files are required' }, 400);
    }

    // Verify project exists and user is assigned freelancer
    const project = await kv.get(`project:${project_id}`);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    if (project.assigned_freelancer_id !== user.id) {
      return c.json({ error: 'Forbidden: You are not assigned to this project' }, 403);
    }

    if (project.status !== 'in_progress') {
      return c.json({ error: 'Project is not in progress' }, 400);
    }

    // Create signed URLs for the files
    const filesWithUrls = await Promise.all(
      files.map(async (file: any) => {
        const { data, error } = await supabase.storage
          .from(DELIVERABLES_BUCKET)
          .createSignedUrl(file.file_path, 60 * 60 * 24 * 7); // Valid for 7 days

        if (error) {
          console.error('Error creating signed URL:', error);
          return { ...file, signed_url: null };
        }

        return {
          ...file,
          signed_url: data.signedUrl,
        };
      })
    );

    const deliverableId = crypto.randomUUID();
    const deliverable = {
      id: deliverableId,
      project_id,
      freelancer_id: user.id,
      client_id: project.user_id,
      description: description || '',
      files: filesWithUrls,
      status: 'pending_review', // pending_review, approved, revision_requested
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Store deliverable
    await kv.set(`deliverable:${deliverableId}`, deliverable);
    
    // Add to project's deliverables list
    const projectDeliverables = await kv.get(`deliverables:project:${project_id}`) || [];
    projectDeliverables.push(deliverableId);
    await kv.set(`deliverables:project:${project_id}`, projectDeliverables);

    // Update project status to pending_review
    project.status = 'pending_review';
    project.updated_at = new Date().toISOString();
    await kv.set(`project:${project_id}`, project);

    // 📧 發送郵件通知給案主（發案者）- 包含 15 天期限警告
    try {
      const clientProfile = await kv.get(`profile_${project.user_id}`);
      const freelancerProfile = await kv.get(`profile_${project.assigned_freelancer_id}`);
      
      if (clientProfile?.email) {
        // 計算過期日期（15天後）
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 15);
        const formattedExpiryDate = expiryDate.toLocaleDateString(
          clientProfile.language === 'en' ? 'en-US' : 'zh-TW',
          { year: 'numeric', month: 'long', day: 'numeric' }
        );

        // 使用新的郵件模板（包含 15 天期限警告）
        const emailHtml = deliverableEmails.getDeliverableSubmittedEmail({
          name: clientProfile.name || clientProfile.email,
          projectTitle: project.title,
          freelancerName: freelancerProfile?.name || '接案者',
          fileCount: files.length,
          expiryDate: formattedExpiryDate,
          language: clientProfile.language || 'zh',
        });

        const subject = clientProfile.language === 'en' 
          ? '📁 New Deliverable Submitted - Download Within 15 Days - Case Where'
          : '📁 新交付物已提交 - 請在 15 天內下載 - Case Where';

        await emailService.sendEmail({
          to: clientProfile.email,
          subject,
          html: emailHtml,
        });
        
        console.log(`📧 Deliverable submitted email (with 15-day warning) sent to client ${clientProfile.email}`);
      }
    } catch (emailError) {
      console.error('Error sending deliverable submitted email to client:', emailError);
    }

    // 📧 發送雙語確認郵件給接案者（freelancer）
    try {
      const freelancerProfile = await kv.get(`profile_${project.assigned_freelancer_id}`);
      
      if (freelancerProfile?.email) {
        const emailHtml = bilingualEmails.getDeliverableSubmittedEmailForFreelancer({
          freelancerName: freelancerProfile.name || freelancerProfile.email,
          projectTitle: project.title,
        });

        await emailService.sendEmail({
          to: freelancerProfile.email,
          subject: '✅ 交付物已成功提交 | Deliverable Submitted Successfully - Case Where',
          html: emailHtml,
        });
        
        console.log(`📧 Bilingual deliverable confirmation email sent to freelancer ${freelancerProfile.email}`);
      }
    } catch (emailError) {
      console.error('Error sending deliverable confirmation email to freelancer:', emailError);
    }

    return c.json({ deliverable }, 201);
  } catch (error) {
    console.error('Error submitting deliverable:', error);
    return c.json({ error: 'Failed to submit deliverable' }, 500);
  }
});

// Get deliverables for a project
app.get("/make-server-215f78a5/deliverables/project/:projectId", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      // Silently return 401 for unauthenticated requests
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      console.error('❌ [Deliverables] Project not found:', projectId);
      return c.json({ error: 'Project not found' }, 404);
    }

    console.log('���� [Deliverables] Checking permissions:', {
      userId: user.id,
      projectOwnerId: project.user_id,
      assignedFreelancerId: project.assigned_freelancer_id,
      freelancerId: project.freelancer_id,
      projectStatus: project.status,
      isOwner: project.user_id === user.id,
      isAssignedFreelancer: project.assigned_freelancer_id === user.id,
      isAcceptedFreelancer: project.freelancer_id === user.id,
    });

    // 🔧 檢查是否為特殊用戶（開發者帳號）
    const SPECIAL_USER_EMAILS = [
      'davidlai117@yahoo.com.tw',
      'davidlai234@hotmail.com'
    ];
    const userProfile = await kv.get(`profile_${user.id}`) || await kv.get(`profile:${user.id}`);
    const userEmail = userProfile?.email || user.email;
    const isSpecialUser = userEmail && SPECIAL_USER_EMAILS.includes(userEmail.toLowerCase());

    // Only project owner or assigned freelancer can view deliverables
    // Allow if: user is owner OR user is assigned freelancer OR project is accepted (freelancer_id matches)
    // 🔧 特殊用戶擁有所有項目的查看權限
    const isOwner = isSpecialUser || (project.user_id === user.id);
    const isAssignedFreelancer = project.assigned_freelancer_id === user.id;
    const isAcceptedFreelancer = project.freelancer_id === user.id && (project.status === 'in_progress' || project.status === 'completed');
    
    if (!isOwner && !isAssignedFreelancer && !isAcceptedFreelancer) {
      console.error('❌ [Deliverables] Forbidden access:', {
        userId: user.id,
        userEmail,
        isSpecialUser,
        projectId,
        isOwner,
        isAssignedFreelancer,
        isAcceptedFreelancer,
      });
      return c.json({ error: 'Forbidden - You do not have permission to view deliverables for this project' }, 403);
    }

    const deliverableIds = await kv.get(`deliverables:project:${projectId}`) || [];
    const deliverables = Array.isArray(deliverableIds) && deliverableIds.length > 0
      ? await kv.mget(deliverableIds.map(id => `deliverable:${id}`))
      : [];
    const validDeliverables = deliverables.filter(d => d !== null);

    // Refresh signed URLs if needed (check if they're expired)
    const deliverablesWithFreshUrls = await Promise.all(
      validDeliverables.map(async (deliverable) => {
        const freshFiles = await Promise.all(
          deliverable.files.map(async (file: any) => {
            const { data, error } = await supabase.storage
              .from(DELIVERABLES_BUCKET)
              .createSignedUrl(file.file_path, 60 * 60 * 24 * 7); // Valid for 7 days

            return {
              ...file,
              signed_url: error ? null : data.signedUrl,
            };
          })
        );

        return {
          ...deliverable,
          files: freshFiles,
        };
      })
    );

    return c.json({ deliverables: deliverablesWithFreshUrls });
  } catch (error) {
    console.error('Error fetching deliverables:', error);
    return c.json({ error: 'Failed to fetch deliverables' }, 500);
  }
});

// Review deliverable (approve or request revision)
app.post("/make-server-215f78a5/deliverables/:id/review", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const deliverableId = c.req.param('id');
    const deliverable = await kv.get(`deliverable:${deliverableId}`);

    if (!deliverable) {
      return c.json({ error: 'Deliverable not found' }, 404);
    }

    // Only client can review
    if (deliverable.client_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const body = await c.req.json();
    const { action, feedback } = body; // action: 'approve' or 'request_revision'

    if (!action || (action !== 'approve' && action !== 'request_revision')) {
      return c.json({ error: 'Invalid action. Must be "approve" or "request_revision"' }, 400);
    }

    // Update deliverable status
    deliverable.status = action === 'approve' ? 'approved' : 'revision_requested';
    deliverable.feedback = feedback || '';
    deliverable.reviewed_at = new Date().toISOString();
    deliverable.updated_at = new Date().toISOString();

    await kv.set(`deliverable:${deliverableId}`, deliverable);

    // Update project status
    const project = await kv.get(`project:${deliverable.project_id}`);
    
    if (project) {
      if (action === 'approve') {
        // 批准后进入等待拨款状态，不自动���放款项
        project.status = 'pending_payment'; // 新状态：等待案主拨款
      } else {
        project.status = 'in_progress'; // Back to in progress for revision
      }
      project.updated_at = new Date().toISOString();
      await kv.set(`project:${deliverable.project_id}`, project);
    }

    console.log(`Deliverable ${action === 'approve' ? 'approved' : 'revision requested'} for project ${deliverable.project_id}`);
    
    // 📧 發送郵件通��給接案者（freelancer）
    try {
      const freelancerProfile = await kv.get(`profile_${deliverable.freelancer_id}`);
      const clientProfile = await kv.get(`profile_${project?.user_id}`);
      
      if (freelancerProfile?.email && project) {
        const language = freelancerProfile.language || 'zh';
        
        if (action === 'approve') {
          // 批准交付物
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10b981;">✅ ${language === 'en' ? 'Deliverable Approved!' : '交付物已批准！'}</h2>
              <p>${language === 'en' ? 'Dear' : '親愛的'} ${freelancerProfile.name || freelancerProfile.email},</p>
              <p>${language === 'en' 
                ? `Great news! ${clientProfile?.name || 'The client'} has approved your deliverable for the project "${project.title}".`
                : `好消息！${clientProfile?.name || '案主'}已批准您為項目「${project.title}」提交的交付物。`
              }</p>
              <p>${language === 'en' 
                ? 'The project is now pending payment. The client will release the payment soon.'
                : '項目現在處於等待撥款狀態。案主將很快釋放款項。'
              }</p>
              <p>${language === 'en' ? 'Congratulations on your excellent work!' : '恭喜您的出色工作！'}</p>
            </div>
          `;

          await emailService.sendEmail({
            to: freelancerProfile.email,
            subject: language === 'en' ? '✅ Deliverable Approved!' : '✅ 交付物已��准！',
            html: emailHtml,
          });
          
          console.log(`📧 Deliverable approved email sent to freelancer ${freelancerProfile.email}`);
        } else {
          // 要求修改
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #f59e0b;">🔄 ${language === 'en' ? 'Revision Requested' : '需要修改'}</h2>
              <p>${language === 'en' ? 'Dear' : '親愛的'} ${freelancerProfile.name || freelancerProfile.email},</p>
              <p>${language === 'en' 
                ? `${clientProfile?.name || 'The client'} has requested revisions for your deliverable on the project "${project.title}".`
                : `${clientProfile?.name || '案主'}要求修改您為項目「${project.title}」提交的交付物。`
              }</p>
              ${reviewNote ? `
                <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <strong>${language === 'en' ? 'Client Feedback:' : '案主反饋：'}</strong>
                  <p>${reviewNote}</p>
                </div>
              ` : ''}
              <p>${language === 'en' 
                ? 'Please make the necessary revisions and resubmit the deliverable.'
                : '請進行必要的修改並重新提交交付物。'
              }</p>
            </div>
          `;

          await emailService.sendEmail({
            to: freelancerProfile.email,
            subject: language === 'en' ? '🔄 Revision Requested' : '🔄 需要修改',
            html: emailHtml,
          });
          
          console.log(`📧 Revision requested email sent to freelancer ${freelancerProfile.email}`);
        }
      }
    } catch (emailError) {
      console.error('Error sending deliverable review email to freelancer:', emailError);
    }

    // 📧 發送確認郵件給案主（client）
    try {
      const clientProfile = await kv.get(`profile_${project?.user_id}`);
      
      if (clientProfile?.email && project) {
        const language = clientProfile.language || 'zh';
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">${action === 'approve' ? '✅' : '🔄'} ${language === 'en' 
              ? (action === 'approve' ? 'Review Confirmed' : 'Revision Request Sent') 
              : (action === 'approve' ? '審核已確認' : '修改要求已發送')
            }</h2>
            <p>${language === 'en' ? 'Dear' : '親愛的'} ${clientProfile.name || clientProfile.email},</p>
            <p>${language === 'en' 
              ? (action === 'approve' 
                  ? `You have approved the deliverable for the project "${project.title}". You can now release the payment.`
                  : `You have requested revisions for the project "${project.title}". The freelancer will resubmit soon.`)
              : (action === 'approve'
                  ? `您已批准項目「${project.title}」的交付物。您現在可以撥款了。`
                  : `您已要求修改項目「${project.title}」。接案者將很快重新提交。`)
            }</p>
          </div>
        `;

        await emailService.sendEmail({
          to: clientProfile.email,
          subject: language === 'en' 
            ? (action === 'approve' ? '✅ Review Confirmed' : '🔄 Revision Request Sent')
            : (action === 'approve' ? '✅ 審核已確認' : '🔄 修改要求已發送'),
          html: emailHtml,
        });
        
        console.log(`📧 Review confirmation email sent to client ${clientProfile.email}`);
      }
    } catch (emailError) {
      console.error('Error sending review confirmation email to client:', emailError);
    }
    
    return c.json({ deliverable, project });
  } catch (error) {
    console.error('Error reviewing deliverable:', error);
    return c.json({ error: 'Failed to review deliverable' }, 500);
  }
});

// ============= PORTFOLIO ROUTES =============

// Update user portfolio
app.put("/make-server-215f78a5/portfolio/:userId", async (c) => {
  try {
    console.log('📥 [Portfolio PUT] Request received');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    console.log('🔑 [Portfolio PUT] Access token exists:', !!accessToken);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    console.log('👤 [Portfolio PUT] Auth user:', user?.id);
    console.log('❌ [Portfolio PUT] Auth error:', authError);
    
    if (!user?.id || authError) {
      console.error('❌ [Portfolio PUT] Unauthorized - no user ID or auth error');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.param('userId');
    console.log('🆔 [Portfolio PUT] Requested userId:', userId);
    console.log('🆔 [Portfolio PUT] Authenticated userId:', user.id);

    if (user.id !== userId) {
      console.error('❌ [Portfolio PUT] Forbidden - user ID mismatch');
      return c.json({ error: 'Forbidden' }, 403);
    }

    const body = await c.req.json();
    const { portfolio_items } = body;
    
    console.log('📦 [Portfolio PUT] Portfolio items count:', portfolio_items?.length || 0);
    console.log('📦 [Portfolio PUT] Portfolio items:', JSON.stringify(portfolio_items, null, 2));

    await kv.set(`portfolio:user:${userId}`, {
      user_id: userId,
      items: portfolio_items || [],
      updated_at: new Date().toISOString(),
    });

    console.log('✅ [Portfolio PUT] Portfolio saved successfully for user:', userId);
    return c.json({ message: 'Portfolio updated successfully' });
  } catch (error) {
    console.error('❌ [Portfolio PUT] Error updating portfolio:', error);
    return c.json({ error: 'Failed to update portfolio', details: error.message }, 500);
  }
});

// Get user portfolio
app.get("/make-server-215f78a5/portfolio/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const portfolio = await kv.get(`portfolio:user:${userId}`) || { items: [] };

    return c.json({ portfolio });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return c.json({ error: 'Failed to fetch portfolio' }, 500);
  }
});

// ============= CONTACT FORM ROUTES =============

// 📧 Contact form submission endpoint
app.post("/make-server-215f78a5/contact/submit", async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, phone, businessType, message, language = 'en' } = body;

    console.log('📧 [Contact Form] Processing submission from:', email);

    // Validate required fields
    if (!name || !email || !message) {
      return c.json({ error: 'Name, email, and message are required' }, 400);
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }

    // Prepare email content
    const emailSubject = language === 'zh' 
      ? `【接得準】新的聯絡表單提交 - ${name}`
      : `[Case Where] New Contact Form Submission - ${name}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .field { margin-bottom: 20px; }
          .label { font-weight: bold; color: #4b5563; margin-bottom: 5px; }
          .value { background: white; padding: 10px; border-radius: 4px; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">${language === 'zh' ? '📧 新的聯絡表單提交' : '📧 New Contact Form Submission'}</h2>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">${language === 'zh' ? '姓名' : 'Name'}:</div>
              <div class="value">${name}</div>
            </div>
            <div class="field">
              <div class="label">${language === 'zh' ? '電子郵件' : 'Email'}:</div>
              <div class="value"><a href="mailto:${email}">${email}</a></div>
            </div>
            ${phone ? `
            <div class="field">
              <div class="label">${language === 'zh' ? '電話' : 'Phone'}:</div>
              <div class="value">${phone}</div>
            </div>
            ` : ''}
            ${businessType ? `
            <div class="field">
              <div class="label">${language === 'zh' ? '業務類型' : 'Business Type'}:</div>
              <div class="value">${businessType}</div>
            </div>
            ` : ''}
            <div class="field">
              <div class="label">${language === 'zh' ? '訊息' : 'Message'}:</div>
              <div class="value">${message.replace(/\n/g, '<br>')}</div>
            </div>
            <div class="footer">
              <p>${language === 'zh' ? '此郵件由接得準平台自動發送' : 'This email was sent automatically by Case Where platform'}</p>
              <p><a href="https://www.casewhr.com">www.casewhr.com</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Import email service
    const { sendEmail } = await import('./email_service_brevo.tsx');

    // Send email to admin
    const emailResult = await sendEmail({
      to: 'davidjosephilai@gmail.com',
      subject: emailSubject,
      html: emailHtml,
      replyTo: email, // Set reply-to as the user's email
      emailType: 'default',
      language: language as 'en' | 'zh',
    });

    if (!emailResult.success) {
      console.error('❌ [Contact Form] Failed to send email:', emailResult.error);
      throw new Error('Failed to send email');
    }

    console.log('✅ [Contact Form] Email sent successfully to davidjosephilai@gmail.com');
    console.log('📧 [Contact Form] Reply-to set to:', email);

    return c.json({
      success: true,
      message: language === 'zh' 
        ? '感謝您的聯絡！我們會盡快回覆您。'
        : 'Thank you for contacting us! We will get back to you soon.',
    });

  } catch (error: any) {
    console.error('❌ [Contact Form] Error:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to submit contact form',
    }, 500);
  }
});

// ============= USER / AUTH ROUTES =============

// 🔐 Forgot Password endpoint (🧪 TEST MODE: Using Supabase native email)
app.post("/make-server-215f78a5/forgot-password", async (c) => {
  try {
    const body = await c.req.json();
    const { email, language = 'en' } = body;

    console.log('🔐 [Forgot Password] Processing password reset request for:', email);
    console.log('🧪 [TEST MODE] Using Supabase native email (Brevo temporarily disabled)');

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }

    // Check if user exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ [Forgot Password] Error listing users:', listError);
      // Don't reveal whether email exists
      return c.json({ 
        success: true, 
        message: 'If an account exists with this email, you will receive a password reset link.' 
      });
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      console.log('ℹ️ [Forgot Password] User not found:', email);
      // Security: Don't reveal whether email exists
      return c.json({ 
        success: true, 
        message: 'If an account exists with this email, you will receive a password reset link.' 
      });
    }

    console.log('✅ [Forgot Password] User found:', user.id);

    // 🧪 TEST MODE: Use Supabase native email instead of Brevo
    console.log('📧 [TEST MODE] Sending email via Supabase native service...');
    console.log('🔗 [TEST MODE] Redirect URL will be: https://www.casewhr.com/auth/verify');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    
    const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://www.casewhr.com/auth/verify',
    });
    
    if (resetError) {
      console.error('❌ [Forgot Password] Supabase resetPasswordForEmail failed:', resetError);
      throw new Error('Failed to send password reset email');
    }

    console.log('✅ [TEST MODE] Supabase native password reset email sent successfully');
    console.log('📬 [TEST MODE] Email sent to:', email);
    console.log('🔗 [TEST MODE] User should receive link redirecting to: https://www.casewhr.com/auth/verify');

    return c.json({
      success: true,
      message: language === 'zh' 
        ? '密碼重設郵件已發送！請檢查您��郵箱。(測試模式：使用 Supabase 原生郵件)' 
        : 'Password reset email sent! Please check your inbox. (Test mode: Using Supabase native email)',
    });

  } catch (error: any) {
    console.error('❌ [Forgot Password] Error:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to process password reset request',
    }, 500);
  }
});

// 🔐 NEW: Send Password Reset OTP via Brevo
app.post("/make-server-215f78a5/password-reset/send-otp", async (c) => {
  try {
    const body = await c.req.json();
    const { email, language = 'en' } = body;

    console.log('🔐 [密碼重設-OTP] 收到發送 OTP 請求:', { email, language });

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }

    // Check if user exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ [密碼重設-OTP] Error listing users:', listError);
      // Don't reveal whether email exists for security
      return c.json({ 
        success: true, 
        message: 'If an account exists with this email, you will receive a verification code.' 
      });
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      console.log('ℹ️ [密碼重設-OTP] User not found:', email);
      // Security: Don't reveal whether email exists
      return c.json({ 
        success: true, 
        message: 'If an account exists with this email, you will receive a verification code.' 
      });
    }

    console.log('✅ [密碼重設-OTP] User found:', user.id);

    // Get user name from metadata or profile
    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';

    // Send OTP via Brevo
    const result = await sendPasswordResetOTP(email, userName, language);

    if (!result.success) {
      throw new Error(result.error || 'Failed to send OTP');
    }

    return c.json({ 
      success: true, 
      message: language === 'en' 
        ? 'Verification code sent! Please check your email.' 
        : '驗證碼已發送！請檢查您的郵箱。' 
    });

  } catch (error: any) {
    console.error('❌ [密碼重設-OTP] Error:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to send verification code',
    }, 500);
  }
});

// 🔐 NEW: Verify OTP and Reset Password
app.post("/make-server-215f78a5/password-reset/verify-otp", async (c) => {
  try {
    const body = await c.req.json();
    const { email, otp, newPassword, language = 'en' } = body;

    console.log('🔐 [密碼重設-驗證] 收到驗證 OTP 請求:', { email, otp: otp?.substring(0, 2) + '****' });

    if (!email || !otp || !newPassword) {
      return c.json({ error: 'Email, OTP, and new password are required' }, 400);
    }

    // Verify OTP
    const verifyResult = await verifyPasswordResetOTP(email, otp);

    if (!verifyResult.valid) {
      console.warn('⚠️ [密碼重設-驗證] OTP 驗證失敗:', verifyResult.error);
      return c.json({ 
        success: false, 
        error: language === 'en' ? 'Invalid or expired verification code' : '驗證碼無效或已過期' 
      }, 400);
    }

    console.log('✅ [密碼重設-驗證] OTP 驗證成功，更新密碼...');

    // Get user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error('Failed to find user');
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new Error('User not found');
    }

    // Update password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('❌ [密碼重設-驗證] 密碼更新失敗:', updateError);
      throw updateError;
    }

    console.log('✅ [密碼重設-驗證] 密碼更新成功！');

    return c.json({ 
      success: true, 
      message: language === 'en' 
        ? 'Password reset successful! Please login with your new password.' 
        : '密碼重設成功！請使用新密碼登入。' 
    });

  } catch (error: any) {
    console.error('❌ [密碼重設-驗證] Error:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to reset password',
    }, 500);
  }
});

// User signup endpoint
app.post("/make-server-215f78a5/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, account_type, job_title, bio, skills, company, website } = body;

    if (!email || !password) {
      console.error('❌ [Signup] Missing required fields:', { email: !!email, password: !!password });
      return c.json({ error: 'Email and password are required' }, 400);
    }

    console.log('📝 [Signup] Starting signup process:', { email, name, account_type });

    // Create user with Supabase Auth
    console.log('🔐 [Signup] Attempting to create user in Supabase Auth...');
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || '' },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      // Check if user already exists by error code or message
      if (error.code === 'email_exists' || 
          error.code === 'user_already_exists' ||
          error.status === 422 ||
          error.message.includes('already registered') || 
          error.message.includes('already exists') ||
          error.message.includes('email address has already been registered')) {
        
        console.log('ℹ️ [Signup] Email already exists:', email);
        
        // Return user-friendly error
        return c.json({ 
          error: 'An account with this email already exists',
          code: 'email_exists',
          message: 'This email is already registered. Please try logging in instead.',
          suggestion: 'login'
        }, 409);
      }
      
      // Log other errors but don't expose stack traces to client
      console.error('❌ [Signup] Supabase Auth error:', {
        code: error.code,
        status: error.status,
        message: error.message,
      });
      
      return c.json({ 
        error: error.message || 'Failed to create user account',
        code: error.code,
        details: 'Authentication service error'
      }, 400);
    }

    const userId = data.user?.id;
    
    if (!userId) {
      console.error('❌ [Signup] No user ID returned from Supabase');
      return c.json({ error: 'Failed to create user - no user ID' }, 500);
    }

    console.log('✅ [Signup] User created in Supabase Auth:', userId);
    
    // Create comprehensive user profile in KV store - using underscore format (統一格式)
    const profileKey = `profile_${userId}`;
    const profile = {
      user_id: userId,
      email: email,
      full_name: name || '',
      account_type: account_type || 'client',
      job_title: job_title || '',
      bio: bio || '',
      skills: skills || [],
      company: company || '',
      website: website || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log('💾 [Signup] Creating profile in KV store:', { userId, email });
    try {
      await kv.set(profileKey, profile);
      console.log('✅ [Signup] Profile created successfully');
    } catch (kvError: any) {
      console.error('❌ [Signup] Failed to save profile to KV:', {
        message: kvError?.message,
        error: kvError,
      });
      // Continue anyway - profile can be created later
    }
      
    // 💰 Create wallet for new user (統一格式：wallet_userId)
    const walletKey = `wallet_${userId}`;
    const wallet = {
      user_id: userId,
      available_balance: 0,
      pending_balance: 0,
      total_deposited: 0,
      total_withdrawn: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log('💰 [Signup] Creating wallet in KV store:', { userId });
    try {
      await kv.set(walletKey, wallet);
      console.log('✅ [Signup] Wallet created successfully');
    } catch (kvError: any) {
      console.error('❌ [Signup] Failed to save wallet to KV:', kvError?.message);
    }
    
    // 📋 Create subscription for new user (統一格式：subscription_userId)
    const subscriptionKey = `subscription_${userId}`;
    const subscription = {
      user_id: userId,
      plan: 'free',           // 新用戶默認 free 方案
      tier: 'free',           // 同時設置 tier 字段以確保兼容性
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log('📋 [Signup] Creating subscription in KV store:', { userId, plan: 'free' });
    try {
      await kv.set(subscriptionKey, subscription);
      console.log('✅ [Signup] Subscription created successfully');
    } catch (kvError: any) {
      console.error('❌ [Signup] Failed to save subscription to KV:', kvError?.message);
    }
      
    // 🎉 發送歡迎郵件給新用戶
    let emailSent = false;
    let emailError = null;
    try {
      // 🌟 使用智能郵件發送器（自動處理企業版 LOGO）
      console.log('📧 [Signup] Attempting to send welcome email to:', email);
      const emailResult = await smartEmailSender.sendWelcomeEmail({
        userId: newUser.id,
        email: email,
        name: name || email.split('@')[0],
        subscriptionTier: 'free', // 新用戶默認免費版
        preferredLanguage: 'zh',
      });
      
      if (emailResult && emailResult.success) {
        console.log('✅ [Signup] Welcome email sent successfully');
        emailSent = true;
      } else {
        console.warn('⚠️ [Signup] Welcome email failed (non-critical):', emailResult?.error);
        emailError = emailResult?.error || 'Unknown error';
      }
    } catch (emailErr: any) {
      console.warn('⚠️ [Signup] Welcome email exception (non-critical):', emailErr?.message);
      emailError = emailErr?.message || String(emailErr);
      // 不影響註冊流程，繼續執行
    }

    console.log('✅ [Signup] User registration completed successfully:', userId);
    
    return c.json({ 
      message: 'User created successfully',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name: data.user?.user_metadata?.name,
      },
      welcome_email: {
        sent: emailSent,
        error: emailError,
      }
    });
  } catch (error: any) {
    console.error('❌ [Signup] Fatal error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      fullError: JSON.stringify(error, null, 2),
    });
    return c.json({ 
      error: 'Failed to create user',
      details: error?.message || 'Unknown error',
      errorType: error?.name || 'UnknownError'
    }, 500);
  }
});

// Get current user profile (from token)
app.get("/make-server-215f78a5/profile", async (c) => {
  try {
    console.log('📥 [GET /profile] Request received - getting current user profile');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.error('❌ [GET /profile] No access token provided');
      return c.json({ error: 'Unauthorized - No access token' }, 401);
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      console.error('❌ [GET /profile] Auth failed:', authError?.message);
      return c.json({ error: 'Unauthorized - Invalid token' }, 401);
    }
    
    const userId = user.id;
    console.log('👤 [GET /profile] User ID from token:', userId);
    
    // Try both key formats
    const profileKeyUnderscore = `profile_${userId}`;
    const profileKeyColon = `profile:${userId}`;
    let profile = null;
    
    try {
      // Try underscore format first (new standard)
      profile = await kv.get(profileKeyUnderscore);
      
      if (profile) {
        console.log('✅ [GET /profile] Profile found (underscore format)');
      } else {
        // Fall back to colon format (legacy)
        profile = await kv.get(profileKeyColon);
        
        if (profile) {
          console.log('📦 [GET /profile] Profile found (colon format), migrating...');
          await kv.set(profileKeyUnderscore, profile);
          console.log('✅ [GET /profile] Profile migrated successfully');
        }
      }
    } catch (kvError) {
      console.error('❌ [GET /profile] KV error:', kvError);
    }
    
    // If no profile exists, create a minimal one
    if (!profile) {
      console.log('⚠️ [GET /profile] No profile found, creating minimal profile');
      profile = {
        user_id: userId,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        is_client: false,
        is_freelancer: false,
        created_at: new Date().toISOString(),
      };
      
      try {
        await kv.set(profileKeyUnderscore, profile);
        console.log('✅ [GET /profile] Minimal profile created');
      } catch (kvError) {
        console.error('❌ [GET /profile] Failed to create profile:', kvError);
      }
    } else {
      // Ensure profile has user_id field (fix for legacy profiles)
      if (!profile.user_id) {
        console.log('⚠️ [GET /profile] Profile missing user_id, adding it now');
        profile.user_id = userId;
        
        // Save the updated profile
        try {
          await kv.set(profileKeyUnderscore, profile);
          console.log('✅ [GET /profile] Profile updated with user_id');
        } catch (kvError) {
          console.error('❌ [GET /profile] Failed to update profile with user_id:', kvError);
        }
      }
    }
    
    console.log('✅ [GET /profile] Returning profile for user:', userId);
    console.log('✅ [GET /profile] Profile has user_id:', profile.user_id);
    return c.json({ profile });
  } catch (error) {
    console.error('❌ [GET /profile] Error:', error);
    return c.json({ error: 'Failed to get profile' }, 500);
  }
});

// Get or create user profile endpoint (ultra-simple, never fails)
app.get("/make-server-215f78a5/profile/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    
    if (!userId) {
      console.log('⚠️ [GET /profile/:userId] No userId provided');
      return c.json({ profile: null }, 200);
    }

    console.log('📥 [GET /profile/:userId] Fetching profile for user:', userId);
    console.log('🔑 [GET /profile/:userId] Will search for keys:', {
      underscore: `profile_${userId}`,
      colon: `profile:${userId}`
    });

    // Try both key formats (underscore is new standard, colon is legacy)
    const profileKeyUnderscore = `profile_${userId}`;
    const profileKeyColon = `profile:${userId}`;
    let profile = null;
    
    try {
      // Try underscore format first (new standard)
      profile = await kv.get(profileKeyUnderscore);
      
      if (profile) {
        console.log('✅ [GET /profile/:userId] Profile found in NEW format (underscore)', {
          key: profileKeyUnderscore,
          user_id: profile.user_id,
          name: profile.name,
          email: profile.email,
          is_client: profile.is_client,
          is_freelancer: profile.is_freelancer
        });
      } else {
        // Fall back to colon format (legacy)
        profile = await kv.get(profileKeyColon);
        
        // If found in legacy format, migrate to new format
        if (profile) {
          console.log('📦 [GET /profile/:userId] Profile found in OLD format (colon), migrating...', {
            key: profileKeyColon,
            user_id: profile.user_id,
            name: profile.name,
            email: profile.email
          });
          try {
            await kv.set(profileKeyUnderscore, profile);
            console.log('✅ [GET /profile/:userId] Profile migrated successfully');
          } catch (migrateError) {
            console.error('⚠️ [GET /profile/:userId] Failed to migrate, but will return profile anyway:', migrateError);
          }
        }
      }
    } catch (kvError) {
      console.error('❌ [GET /profile/:userId] KV store error:', kvError);
      // Don't throw, just return null profile
      profile = null;
    }

    // ✅ 修復：從 Supabase Auth 獲取正確的 email（僅限真實 UUID 用戶）
    if (profile) {
      // 檢查是否為有效的 UUID 格式（8-4-4-4-12 格式）
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      
      if (isUUID) {
        try {
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
          
          if (!authError && authUser?.user?.email) {
            const correctEmail = authUser.user.email;
            
            // 如果 profile 中的 email 不正確，修正它
            if (profile.email !== correctEmail) {
              console.log('🔧 [GET /profile/:userId] Fixing incorrect email:', {
                userId,
                storedEmail: profile.email,
                correctEmail,
              });
              
              profile.email = correctEmail;
              
              // 同步更新 KV store
              try {
                await kv.set(profileKeyUnderscore, profile);
                console.log('✅ [GET /profile/:userId] Email corrected and saved');
              } catch (saveError) {
                console.error('⚠️ [GET /profile/:userId] Failed to save corrected email:', saveError);
              }
            }
          } else {
            console.warn('⚠️ [GET /profile/:userId] Could not fetch auth user:', authError?.message);
          }
        } catch (authCheckError) {
          console.error('⚠️ [GET /profile/:userId] Error checking auth email:', authCheckError);
          // 不影響返回，繼續使用現有的 profile
        }
      } else {
        console.log('ℹ️ [GET /profile/:userId] Non-UUID user (dev/test user), skipping auth email check');
      }
    }

    if (!profile) {
      console.log('⚠️ [GET /profile/:userId] Profile not found, returning null (frontend will use defaults)');
    }

    // ✅ 獲取訂閱狀態（自動檢查過期並降級）
    let subscription = null;
    try {
      subscription = await subscriptionRecurring.getUserSubscription(userId);
      console.log('📊 [GET /profile/:userId] Subscription status:', {
        plan: subscription.plan,
        status: subscription.status,
        auto_renew: subscription.auto_renew,
        next_billing: subscription.next_billing_date,
      });
    } catch (subError) {
      console.error('⚠️ [GET /profile/:userId] Failed to get subscription:', subError);
      subscription = { plan: 'free', status: 'active' };
    }

    // Always return 200 with profile (or null) and subscription
    return c.json({ profile, subscription });
  } catch (error) {
    console.error('❌ [GET /profile/:userId] Unexpected error:', error);
    // Even if something goes wrong, return null profile instead of error
    return c.json({ profile: null }, 200);
  }
});

// Get all freelancer profiles
app.get("/make-server-215f78a5/profiles/freelancers", async (c) => {
  try {
    console.log('📥 [GET /profiles/freelancers] Request received');

    // Get all profiles using prefix search (new format: underscore)
    let newFormatProfiles = [];
    try {
      const rawNewProfiles = await kv.getByPrefix('profile_');
      newFormatProfiles = (rawNewProfiles || []).filter(p => p != null && typeof p === 'object');
      console.log('📥 [GET /profiles/freelancers] New format profiles found:', newFormatProfiles.length);
    } catch (error) {
      console.error('❌ [GET /profiles/freelancers] Error loading new format profiles:', error);
      newFormatProfiles = [];
    }

    // Also get old format profiles for backward compatibility
    let oldFormatProfiles = [];
    try {
      const rawOldProfiles = await kv.getByPrefix('profile:');
      oldFormatProfiles = (rawOldProfiles || []).filter(p => p != null && typeof p === 'object');
      console.log('📥 [GET /profiles/freelancers] Old format profiles found:', oldFormatProfiles.length);
    } catch (error) {
      console.error('❌ [GET /profiles/freelancers] Error loading old format profiles:', error);
      oldFormatProfiles = [];
    }
    
    // Combine both formats, preferring new format if duplicate user_id exists
    const profileMap = new Map();
    
    // Add old format first
    oldFormatProfiles.forEach((profile: any) => {
      if (profile?.user_id) {
        profileMap.set(profile.user_id, profile);
      }
    });

    // Add new format (overwrites old if exists)
    newFormatProfiles.forEach((profile: any) => {
      if (profile?.user_id) {
        profileMap.set(profile.user_id, profile);
      }
    });
    
    const allProfiles = Array.from(profileMap.values());
    console.log('📥 [GET /profiles/freelancers] Total unique profiles:', allProfiles.length);

    // Get all subscriptions to add plan info to profiles
    let allSubscriptions = [];
    try {
      const rawSubscriptions = await kv.getByPrefix('subscription_');
      allSubscriptions = (rawSubscriptions || []).filter(s => s != null && typeof s === 'object');
      console.log('📥 [GET /profiles/freelancers] Subscriptions found:', allSubscriptions.length);
    } catch (error) {
      console.error('❌ [GET /profiles/freelancers] Error loading subscriptions:', error);
      allSubscriptions = [];
    }

    // Create a map of user_id -> subscription_plan
    const subscriptionMap = new Map();
    allSubscriptions.forEach((sub: any) => {
      if (sub?.user_id) {
        subscriptionMap.set(sub.user_id, sub.plan || 'free');
      }
    });
    
    // Filter for freelancers and normalize field names
    const freelancerProfiles = allProfiles
      .filter((profile: any) => {
        if (!profile?.account_type) return false;
        const accountTypes = Array.isArray(profile.account_type) ? profile.account_type : [profile.account_type];
        return accountTypes.includes('freelancer');
      })
      .map((profile: any) => ({
        ...profile,
        // Add missing id field (use user_id as fallback)
        id: profile?.id || profile?.user_id,
        // Normalize full_name field
        full_name: profile?.full_name || profile?.name || profile?.email,
        // Add subscription plan from subscription data
        subscription_plan: subscriptionMap.get(profile?.user_id) || 'free',
      }));
    
    // 🔥 為每個 profile 添加 portfolio_count
    for (const profile of freelancerProfiles) {
      try {
        const portfolioData = await kv.get(`portfolio:user:${profile.user_id}`) || { items: [] };
        profile.portfolio_count = Array.isArray(portfolioData?.items) ? portfolioData.items.length : 0;
      } catch (error) {
        console.log(`⚠️ [GET /profiles/freelancers] Failed to get portfolio for user ${profile.user_id}`);
        profile.portfolio_count = 0;
      }
    }
    
    console.log('📥 [GET /profiles/freelancers] Freelancer profiles:', freelancerProfiles.length);
    console.log('🎯 [GET /profiles/freelancers] Sample subscription plans:', freelancerProfiles.slice(0, 3).map((p: any) => ({
      name: p.full_name,
      plan: p.subscription_plan
    })));
    
    return c.json({ 
      profiles: freelancerProfiles,
      total: freelancerProfiles.length 
    });
  } catch (error) {
    console.error('❌ [GET /profiles/freelancers] Error:', error);
    return c.json({
      error: 'Failed to fetch freelancer profiles',
      profiles: [],
      total: 0
    }, 500);
  }
});

// Alias endpoint: /freelancers (returns same data as /profiles/freelancers but with 'freelancers' key)
app.get("/make-server-215f78a5/freelancers", async (c) => {
  try {
    console.log('📥 [GET /freelancers] Request received');

    // Get all profiles using prefix search (new format: underscore)
    let newFormatProfiles = [];
    try {
      const rawNewProfiles = await kv.getByPrefix('profile_');
      newFormatProfiles = (rawNewProfiles || []).filter(p => p != null && typeof p === 'object');
      console.log('📥 [GET /freelancers] New format profiles found:', newFormatProfiles.length);
    } catch (error) {
      console.error('❌ [GET /freelancers] Error loading new format profiles:', error);
      newFormatProfiles = [];
    }

    // Also get old format profiles for backward compatibility
    let oldFormatProfiles = [];
    try {
      const rawOldProfiles = await kv.getByPrefix('profile:');
      oldFormatProfiles = (rawOldProfiles || []).filter(p => p != null && typeof p === 'object');
      console.log('📥 [GET /freelancers] Old format profiles found:', oldFormatProfiles.length);
    } catch (error) {
      console.error('❌ [GET /freelancers] Error loading old format profiles:', error);
      oldFormatProfiles = [];
    }

    // Combine both formats, preferring new format if duplicate user_id exists
    const profileMap = new Map();

    // Add old format first
    oldFormatProfiles.forEach((profile: any) => {
      if (profile?.user_id) {
        profileMap.set(profile.user_id, profile);
      }
    });

    // Add new format (overwrites old if exists)
    newFormatProfiles.forEach((profile: any) => {
      if (profile?.user_id) {
        profileMap.set(profile.user_id, profile);
      }
    });

    const allProfiles = Array.from(profileMap.values());
    console.log('📥 [GET /freelancers] Total unique profiles:', allProfiles.length);

    // Get all subscriptions to add plan info to profiles
    let allSubscriptions = [];
    try {
      const rawSubscriptions = await kv.getByPrefix('subscription_');
      allSubscriptions = (rawSubscriptions || []).filter(s => s != null && typeof s === 'object');
      console.log('📥 [GET /freelancers] Subscriptions found:', allSubscriptions.length);
    } catch (error) {
      console.error('❌ [GET /freelancers] Error loading subscriptions:', error);
      allSubscriptions = [];
    }

    // Create a map of user_id -> subscription_plan
    const subscriptionMap = new Map();
    allSubscriptions.forEach((sub: any) => {
      if (sub?.user_id) {
        subscriptionMap.set(sub.user_id, sub.plan || 'free');
      }
    });

    // Filter for freelancers and normalize field names
    const freelancerProfiles = allProfiles
      .filter((profile: any) => {
        if (!profile?.account_type) return false;
        const accountTypes = Array.isArray(profile.account_type) ? profile.account_type : [profile.account_type];
        return accountTypes.includes('freelancer');
      })
      .map((profile: any) => ({
        ...profile,
        // Add missing id field (use user_id as fallback)
        id: profile?.id || profile?.user_id,
        // Normalize full_name field
        full_name: profile?.full_name || profile?.name || profile?.email,
        // Add subscription plan from subscription data
        subscription_plan: subscriptionMap.get(profile?.user_id) || 'free',
      }));

    // 🔥 為每個 profile 添加 portfolio_count
    for (const profile of freelancerProfiles) {
      try {
        const portfolioData = await kv.get(`portfolio:user:${profile.user_id}`) || { items: [] };
        profile.portfolio_count = Array.isArray(portfolioData?.items) ? portfolioData.items.length : 0;
      } catch (error) {
        console.log(`⚠️ [GET /freelancers] Failed to get portfolio for user ${profile.user_id}`);
        profile.portfolio_count = 0;
      }
    }

    console.log('📥 [GET /freelancers] Freelancer profiles:', freelancerProfiles.length);

    return c.json({
      freelancers: freelancerProfiles,
      total: freelancerProfiles.length
    });
  } catch (error) {
    console.error('❌ [GET /freelancers] Error:', error);
    return c.json({
      error: 'Failed to fetch freelancers',
      freelancers: [],
      total: 0
    }, 500);
  }
});

// Upload profile avatar (Supabase Storage)
app.post("/make-server-215f78a5/profile/:userId/avatar", async (c) => {
  try {
    const userId = c.req.param('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }
    
    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user || user.id !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    // 🔥 處理 FormData 文件上傳
    const contentType = c.req.header('Content-Type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // 從 FormData 接收文件
      const formData = await c.req.formData();
      const file = formData.get('avatar');
      
      if (!file || !(file instanceof File)) {
        return c.json({ error: 'No avatar file provided' }, 400);
      }
      
      // 上傳到 Supabase Storage
      const bucketName = AVATARS_BUCKET;
      const fileName = `${userId}/${Date.now()}-${file.name}`;
      
      const fileBuffer = await file.arrayBuffer();
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error('❌ [Avatar Upload] Storage upload failed:', uploadError);
        return c.json({ error: `Upload failed: ${uploadError.message}` }, 500);
      }
      
      // 獲取公開 URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);
      
      // 更新 profile
      const profileKey = `profile_${userId}`;
      const profile = await kv.get(profileKey);
      
      if (!profile) {
        return c.json({ error: 'Profile not found' }, 404);
      }
      
      profile.avatar_url = publicUrl;
      profile.updated_at = new Date().toISOString();
      
      await kv.set(profileKey, profile);
      
      // 同時更新舊格式
      const profileKeyColon = `profile:${userId}`;
      const oldProfile = await kv.get(profileKeyColon);
      if (oldProfile) {
        oldProfile.avatar_url = publicUrl;
        oldProfile.updated_at = new Date().toISOString();
        await kv.set(profileKeyColon, oldProfile);
      }
      
      return c.json({ 
        success: true, 
        avatar_url: publicUrl,
        message: 'Avatar uploaded successfully'
      });
    } else {
      // 向後兼容：接收已上傳的 avatar_url
      const body = await c.req.json();
      const avatarUrl = body.avatar_url;
      
      if (!avatarUrl) {
        return c.json({ error: 'No avatar URL provided' }, 400);
      }
      
      // Update profile with avatar URL - using underscore format (統一格式)
      const profileKey = `profile_${userId}`;
      const profile = await kv.get(profileKey);
      
      if (!profile) {
        return c.json({ error: 'Profile not found' }, 404);
      }
      
      profile.avatar_url = avatarUrl;
      profile.updated_at = new Date().toISOString();
      
      await kv.set(profileKey, profile);
      
      // Also update in old format for backwards compatibility
      const profileKeyColon = `profile:${userId}`;
      const oldProfile = await kv.get(profileKeyColon);
      if (oldProfile) {
        oldProfile.avatar_url = avatarUrl;
        oldProfile.updated_at = new Date().toISOString();
        await kv.set(profileKeyColon, oldProfile);
      }
      
      return c.json({ 
        success: true, 
        avatar_url: avatarUrl,
        message: 'Avatar updated successfully'
      });
    }
  } catch (error) {
    console.error('Error updating avatar:', error);
    return c.json({ error: 'Failed to update avatar' }, 500);
  }
});

// 🧪 DEV MODE: Update user profile without strict JWT validation
app.put("/make-server-215f78a5/profile-dev", async (c) => {
  console.log('🧪 [PUT /profile-dev] DEV MODE - Request received');
  try {
    const body = await c.req.json();
    console.log('🧪 [PUT /profile-dev] Request body:', JSON.stringify(body, null, 2));
    
    const { user_id, is_client, is_freelancer, ...otherUpdates } = body;

    if (!user_id) {
      console.error('❌ [PUT /profile-dev] No user_id in request body');
      return c.json({ error: 'user_id is required', code: 400 }, 400);
    }

    console.log('🧪 [PUT /profile-dev] Processing for user:', user_id);

    // Get existing profile - check both formats
    const profileKeyUnderscore = `profile_${user_id}`;
    const profileKeyColon = `profile:${user_id}`;
    
    let profile = await kv.get(profileKeyUnderscore);
    if (!profile) {
      profile = await kv.get(profileKeyColon);
    }

    if (!profile) {
      console.error('❌ [PUT /profile-dev] Profile not found for user:', user_id);
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Update profile
    profile = {
      ...profile,
      ...otherUpdates,
      updated_at: new Date().toISOString(),
    };

    if (is_client !== undefined) profile.is_client = is_client;
    if (is_freelancer !== undefined) profile.is_freelancer = is_freelancer;

    const accountTypes = [];
    if (profile.is_client) accountTypes.push('client');
    if (profile.is_freelancer) accountTypes.push('freelancer');
    profile.account_type = accountTypes.length > 0 ? accountTypes : ['client'];

    // Save to both formats
    await kv.set(profileKeyUnderscore, profile);
    await kv.set(profileKeyColon, profile);

    console.log(`✅ [PUT /profile-dev] Profile updated successfully for user ${user_id}`);

    return c.json({ 
      success: true, 
      profile,
      message: 'Profile updated successfully (DEV MODE)' 
    });
  } catch (error) {
    console.error('❌ [PUT /profile-dev] Error:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Update user profile (including role switcher) - SIMPLIFIED AUTH
app.put("/make-server-215f78a5/profile", async (c) => {
  console.log('🔵 [PUT /profile] Request received');
  try {
    const body = await c.req.json();
    console.log('🔵 [PUT /profile] Request body parsed, keys:', Object.keys(body));
    console.log('🔵 [PUT /profile] Full request body:', JSON.stringify(body, null, 2));
    
    const { user_id, is_client, is_freelancer, ...otherUpdates } = body;

    // ✅ 簡化認證：優先使用 user_id（開發模式友好）
    let userId: string | null = user_id || null;

    // 如果沒有 user_id，嘗試從 token 提取
    if (!userId) {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      if (accessToken) {
        console.log('🔐 [PUT /profile] No user_id in body, trying JWT validation...');
        const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
        if (user) {
          userId = user.id;
          console.log('✅ [PUT /profile] Extracted user ID from JWT:', userId);
        } else {
          console.warn('⚠️ [PUT /profile] JWT validation failed:', authError?.message);
        }
      }
    }

    if (!userId) {
      console.error('❌ [PUT /profile] No user_id provided and JWT validation failed');
      return c.json({ 
        error: 'user_id is required', 
        code: 400,
        message: 'Please provide user_id in request body or valid JWT token' 
      }, 400);
    }

    console.log('✅ [PUT /profile] Processing update for user:', userId);

    console.log('📝 [PUT /profile] Request received for user:', userId, {
      bodyKeys: Object.keys(body),
      is_client,
      is_freelancer
    });

    // Get existing profile - check both formats (向後兼容)
    const profileKeyUnderscore = `profile_${userId}`;
    const profileKeyColon = `profile:${userId}`;
    
    let profile = await kv.get(profileKeyUnderscore);
    console.log('📝 [PUT /profile] New format profile:', profile ? 'found' : 'not found');
    
    if (!profile) {
      // Try old format
      profile = await kv.get(profileKeyColon);
      console.log('📝 [PUT /profile] Old format profile:', profile ? 'found' : 'not found');
    }

    if (!profile) {
      console.error('❌ [PUT /profile] Profile not found for user:', userId);
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Update profile with new values
    profile = {
      ...profile,
      ...otherUpdates,
      updated_at: new Date().toISOString(),
    };

    // Handle role updates if provided
    if (is_client !== undefined) {
      profile.is_client = is_client;
    }
    if (is_freelancer !== undefined) {
      profile.is_freelancer = is_freelancer;
    }

    // Update account_type based on roles
    const accountTypes = [];
    if (profile.is_client) accountTypes.push('client');
    if (profile.is_freelancer) accountTypes.push('freelancer');
    profile.account_type = accountTypes.length > 0 ? accountTypes : ['client'];

    console.log('📝 [PUT /profile] Updated profile data:', {
      user_id: userId,
      is_client: profile.is_client,
      is_freelancer: profile.is_freelancer,
      account_type: profile.account_type,
      full_name: profile.full_name
    });

    // Save updated profile to BOTH formats for maximum compatibility
    await kv.set(profileKeyUnderscore, profile);
    await kv.set(profileKeyColon, profile);

    console.log(`✅ [PUT /profile] Profile updated successfully for user ${userId}`);

    return c.json({ 
      success: true, 
      profile,
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error('❌ [PUT /profile] Error updating profile:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// ============= GENERIC KV ROUTES =============

// Set a key-value pair
app.post("/make-server-215f78a5/kv", async (c) => {
  try {
    const body = await c.req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return c.json({ error: 'Key and value are required' }, 400);
    }

    console.log(`💾 [KV POST] Saving key: ${key}`, {
      keyFormat: key.includes('_') ? 'underscore' : (key.includes(':') ? 'colon' : 'other'),
      valueKeys: value && typeof value === 'object' ? Object.keys(value).slice(0, 5) : 'not-object',
      userName: value?.name || value?.full_name || 'N/A',
      userEmail: value?.email || 'N/A'
    });

    await kv.set(key, value);
    console.log(`✅ [KV POST] Successfully saved key: ${key}`);
    return c.json({ success: true, message: 'Value stored successfully' });
  } catch (error) {
    console.error('Error storing KV:', error);
    return c.json({ error: 'Failed to store value' }, 500);
  }
});

// ✅ 靜態路由必須在動態路由之前！
// 🔧 KV Store 測試端點 - 完整讀寫測試
app.get("/make-server-215f78a5/kv/test", async (c) => {
  try {
    const testKey = `test_${Date.now()}`;
    const testValue = { message: 'Test data', timestamp: new Date().toISOString() };
    
    console.log('🧪 [KV Test] Testing write operation...');
    console.log('  Key:', testKey);
    console.log('  Value:', testValue);
    
    // 测试写入
    await kv.set(testKey, testValue);
    console.log('✅ [KV Test] Write completed');
    
    // 测试读取
    const readValue = await kv.get(testKey);
    console.log('🔍 [KV Test] Read result:', readValue);
    
    // 删除测试数据
    await kv.del(testKey);
    console.log('🗑️ [KV Test] Test data cleaned up');
    
    if (readValue && readValue.message === testValue.message) {
      return c.json({ 
        status: 'ok', 
        message: 'KV Store read/write test passed',
        testKey,
        readValue
      }, 200);
    } else {
      return c.json({ 
        status: 'error', 
        message: 'KV Store read/write test failed - data mismatch',
        expected: testValue,
        actual: readValue
      }, 500);
    }
  } catch (error: any) {
    console.error('❌ [KV Test] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 🔍 KV Store 搜索端點
app.get("/make-server-215f78a5/kv/search", async (c) => {
  try {
    const prefix = c.req.query('prefix') || '';
    console.log(`🔍 [KV Search] Searching with prefix: ${prefix}`);
    
    const results = (await kv.getByPrefix(prefix) || []).map(item => ({ key: item.key, value: item.value }));
    console.log(`✅ [KV Search] Found ${results.length} results`);
    
    return c.json({ 
      success: true,
      prefix,
      count: results.length,
      results 
    }, 200);
  } catch (error: any) {
    console.error('❌ [KV Search] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 📊 KV Store 獲取所有數據端點
app.get("/make-server-215f78a5/kv/all", async (c) => {
  try {
    console.log(`�� [KV All] Fetching all KV data...`);
    
    // 獲取所有常見前綴的數據
    const prefixes = [
      'keyword:',
      'content:',
      'seo:',
      'ai_seo_',           // ✅ AI SEO 報告
      'profile_',
      'wallet_',
      'project_',
      'transaction_',
      'team_member:',
      'subscription_'
    ];
    
    const allData: any[] = [];
    
    // 直接查詢數據庫以獲取完整的 key-value 對
    for (const prefix of prefixes) {
      console.log(`  🔍 Querying prefix: "${prefix}"`);
      
      const { data, error } = await supabase
        .from('kv_store_215f78a5')
        .select('key, value')
        .like('key', `${prefix}%`);
      
      if (!error && data) {
        console.log(`    ✅ Found ${data.length} records for prefix "${prefix}"`);
        if (data.length > 0) {
          console.log(`    📋 First key: ${data[0].key}`);
        }
        
        allData.push(...data.map(item => ({
          key: item.key,
          value: item.value
        })));
      } else if (error) {
        console.warn(`⚠️ [KV All] Error fetching prefix "${prefix}":`, error.message);
      } else {
        console.log(`    ℹ️ No records found for prefix "${prefix}"`);
      }
    }
    
    console.log(`✅ [KV All] Found ${allData.length} total records`);
    
    // 列出所有 ai_seo_ 开头的 key
    const aiSeoKeys = allData.filter(item => item.key && item.key.startsWith('ai_seo_'));
    console.log(`🎯 [KV All] AI SEO reports count: ${aiSeoKeys.length}`);
    if (aiSeoKeys.length > 0) {
      console.log(`  📋 AI SEO keys:`, aiSeoKeys.map(item => item.key));
    }
    
    return c.json({ 
      success: true,
      count: allData.length,
      data: allData
    }, 200);
  } catch (error: any) {
    console.error('❌ [KV All] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get a value by key (動態路由必須在靜態路由之後)
app.get("/make-server-215f78a5/kv/:key", async (c) => {
  try {
    const key = c.req.param('key');
    const value = await kv.get(key);
    
    if (value === null) {
      return c.json({ error: 'Key not found' }, 404);
    }

    return c.json({ key, value });
  } catch (error) {
    console.error('Error getting KV:', error);
    return c.json({ error: 'Failed to get value' }, 500);
  }
});

// Delete a key
app.delete("/make-server-215f78a5/kv/:key", async (c) => {
  try {
    const key = c.req.param('key');
    console.log(`🗑️ [KV Delete] Deleting key: ${key}`);
    
    await kv.del(key);
    
    console.log(`✅ [KV Delete] Key deleted successfully`);
    
    return c.json({ 
      success: true,
      message: 'Key deleted successfully'
    }, 200);
  } catch (error: any) {
    console.error('❌ [KV Delete] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Append to an array value (for lists)
app.post("/make-server-215f78a5/kv/append", async (c) => {
  try {
    const body = await c.req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return c.json({ error: 'Key and value are required' }, 400);
    }

    // Get existing array or create new one
    const existing = await kv.get(key) || [];
    const newArray = Array.isArray(existing) ? [...existing, value] : [value];
    
    await kv.set(key, newArray);
    return c.json({ success: true, message: 'Value appended successfully' });
  } catch (error) {
    console.error('Error appending to KV:', error);
    return c.json({ error: 'Failed to append value' }, 500);
  }
});

// ==================== SUBSCRIPTION ROUTES ====================

// Get user's subscription
app.get("/make-server-215f78a5/subscription/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // 🔐 ROOT ADMIN: Check if this user is a root admin
    const profile = await getProfileSafely(userId);
    const userEmail = profile?.email?.toLowerCase();
    
    const ROOT_ADMIN_EMAILS = [
      'davidlai234@hotmail.com',
      'davidjosephlai@gmail.com',
      'davidjosephlai@casewhr.com',
      'davidlai117@yahoo.com.tw',
      'admin@casewhr.com',
    ];
    
    if (userEmail && ROOT_ADMIN_EMAILS.includes(userEmail)) {
      console.log('���� [Subscription API] Root admin detected:', userEmail);
      
      // Root admins always have enterprise subscription
      return c.json({
        subscription: {
          plan: 'enterprise',
          status: 'active',
          is_root_admin: true,
          start_date: '2024-01-01T00:00:00.000Z',
          end_date: '2099-12-31T23:59:59.999Z', // Never expires
          auto_renew: false,
        }
      });
    }

    // Get subscription from KV store
    const subscriptionKey = `subscription_${userId}`;
    const subscription = await kv.get(subscriptionKey);

    if (!subscription) {
      // Return default free plan
      return c.json({
        subscription: {
          plan: 'free',
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
          auto_renew: false,
        }
      });
    }

    // ✅ 檢查訂閱是否已過期
    const now = new Date();
    const endDate = new Date(subscription.end_date || subscription.current_period_end);
    
    if (endDate < now && subscription.status === 'active') {
      console.log(`⏰ [Subscription] Plan expired for user ${userId}, changing to expired status`);
      
      // 更新為過期狀態
      subscription.status = 'expired';
      subscription.plan = 'free'; // ✅ 降級為免費版
      await kv.set(subscriptionKey, subscription);
      
      console.log(`✅ [Subscription] User ${userId} downgraded to free plan due to expiration`);
    }

    return c.json({ subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return c.json({ error: 'Failed to fetch subscription' }, 500);
  }
});

// Upgrade subscription
app.post("/make-server-215f78a5/subscription/upgrade", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { plan, billingCycle = 'monthly', currency = 'USD' } = body;

    if (!['pro', 'enterprise'].includes(plan)) {
      return c.json({ error: 'Invalid plan' }, 400);
    }
    
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return c.json({ error: 'Invalid billing cycle' }, 400);
    }

    // ⭐ 三幣價格系統（與前端 PricingPage.tsx 完全一致）
    const planPrices = {
      pro: {
        monthly: { USD: 15, TWD: 480, CNY: 110 },
        yearly: { USD: 150, TWD: 4680, CNY: 1090 }
      },
      enterprise: {
        monthly: { USD: 45, TWD: 1400, CNY: 325 },
        yearly: { USD: 450, TWD: 14040, CNY: 3250 }
      }
    };

    // 驗證貨幣並獲取價格
    const validCurrency = ['USD', 'TWD', 'CNY'].includes(currency) ? currency : 'USD';
    const price = planPrices[plan as keyof typeof planPrices][billingCycle as 'monthly' | 'yearly'][validCurrency as 'USD' | 'TWD' | 'CNY'];

    // ⭐ 重要：將選擇的貨幣價格轉換為 USD（錢包統一存儲為 USD）
    // 使用即時匯率（會自動從 API 獲取或使用緩存）
    const rates = await getExchangeRates();
    const priceInUSD = price / rates[validCurrency as 'USD' | 'TWD' | 'CNY'];

    console.log(`💰 [Subscription Upgrade] Plan: ${plan}, Cycle: ${billingCycle}, Currency: ${validCurrency}`);
    console.log(`💰 [Subscription Upgrade] Price: ${price} ${validCurrency} = ${priceInUSD.toFixed(2)} USD`);
    console.log(`💱 [Subscription Upgrade] Exchange Rate: 1 USD = ${rates.TWD} TWD, ${rates.CNY} CNY`);

    // Get user's wallet
    const walletKey = `wallet_${user.id}`;
    const wallet = await kv.get(walletKey);
    
    console.log(`💰 [Subscription Upgrade] Wallet balance: ${wallet?.available_balance || 0} USD`);
    
    if (!wallet || wallet.available_balance < priceInUSD) {
      console.log(`❌ [Subscription Upgrade] Insufficient balance: ${wallet?.available_balance || 0} < ${priceInUSD}`);
      return c.json({ 
        error: 'Insufficient wallet balance',
        required: priceInUSD,
        available: wallet?.available_balance || 0
      }, 400);
    }

    // Deduct from wallet (in USD)
    wallet.available_balance -= priceInUSD;
    wallet.total_spent = (wallet.total_spent || 0) + priceInUSD;
    // 不要修改 wallet.currency，錢包統一存 USD
    await kv.set(walletKey, wallet);

    console.log(`✅ [Subscription Upgrade] Deducted ${priceInUSD.toFixed(2)} USD, New balance: ${wallet.available_balance.toFixed(2)} USD`);

    // ⭐ 將訂閱收入轉入平台擁有者錢包 (davidlai117@yahoo.com.tw)
    try {
      console.log('💰 [Platform Revenue] Starting transfer to platform wallet...');
      console.log('💰 [Platform Revenue] Subscription details:', {
        user: user.email,
        plan,
        billingCycle,
        amount: priceInUSD,
        currency: validCurrency,
        displayAmount: price
      });
      
      // 查找平台擁有者的用戶 ID
      const { data: platformOwnerData } = await supabase.auth.admin.listUsers();
      const platformOwner = platformOwnerData?.users?.find(
        u => u.email === 'davidlai117@yahoo.com.tw'
      );
      
      console.log('💰 [Platform Revenue] Platform owner lookup:', { 
        found: !!platformOwner, 
        email: platformOwner?.email,
        id: platformOwner?.id 
      });

      if (platformOwner) {
        const platformWalletKey = `wallet_${platformOwner.id}`;
        let platformWallet = await kv.get(platformWalletKey);

        // 如果平台錢包不存在，創建一個
        if (!platformWallet) {
          platformWallet = {
            user_id: platformOwner.id,
            balance: 0,
            available_balance: 0,
            locked: 0,
            pending_withdrawal: 0,
            total_earned: 0,
            total_spent: 0,
            currency: 'USD',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }

        // 將訂閱收入加入平台錢包
        platformWallet.available_balance = (platformWallet.available_balance || 0) + priceInUSD;
        platformWallet.balance = (platformWallet.balance || 0) + priceInUSD;
        platformWallet.total_earned = (platformWallet.total_earned || 0) + priceInUSD;
        platformWallet.updated_at = new Date().toISOString();
        await kv.set(platformWalletKey, platformWallet);

        console.log(`💰 [Platform Revenue] Added ${priceInUSD.toFixed(2)} USD to platform wallet (${platformOwner.email})`);
        console.log(`💰 [Platform Revenue] New platform balance: ${platformWallet.available_balance.toFixed(2)} USD`);

        // 記錄平台收入交易
        const platformTransactionKey = `transaction_${Date.now()}_platform_${platformOwner.id}`;
        const platformTransaction = {
          id: platformTransactionKey,
          user_id: platformOwner.id,
          type: 'subscription_revenue',
          amount: priceInUSD,
          currency: 'USD',
          display_currency: validCurrency,
          display_amount: price,
          description: `Platform Revenue: ${user.email} upgraded to ${plan} (${cycleLabel}) - ${price} ${validCurrency}`,
          from_user_id: user.id,
          from_user_email: user.email,
          created_at: new Date().toISOString(),
        };
        await kv.set(platformTransactionKey, platformTransaction);
        
        console.log('💰 [Platform Revenue] Transaction recorded:', {
          key: platformTransactionKey,
          amount: priceInUSD,
          type: 'subscription_revenue',
          from: user.email
        });
      } else {
        console.warn(`⚠️ [Platform Revenue] Platform owner not found (davidlai117@yahoo.com.tw)`);
      }
    } catch (error) {
      console.error('❌ [Platform Revenue] Error transferring to platform wallet:', error);
      // 不中斷訂閱流程，即使轉帳失敗
    }

    // Record transaction
    const transactionKey = `transaction_${Date.now()}_${user.id}`;
    const cycleLabel = billingCycle === 'yearly' ? 'Yearly' : 'Monthly';
    await kv.set(transactionKey, {
      id: transactionKey,
      user_id: user.id,
      type: 'subscription_upgrade',
      amount: -priceInUSD, // ⭐ 記錄 USD 金額
      currency: 'USD', // ⭐ 錢包統一存 USD
      display_currency: validCurrency, // 記錄用戶選擇的顯示貨幣
      display_amount: price, // 記錄顯示金額
      description: `Upgraded to ${plan} plan (${cycleLabel}) - ${price} ${validCurrency}`,
      created_at: new Date().toISOString(),
    });

    // Update subscription
    const subscriptionKey = `subscription_${user.id}`;
    const now = new Date();
    // Calculate end date based on billing cycle
    const daysToAdd = billingCycle === 'yearly' ? 365 : 30;
    const endDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    const subscription = {
      user_id: user.id, // Add user_id field for easier lookup
      plan,
      billingCycle,
      status: 'active',
      start_date: now.toISOString(),
      end_date: endDate.toISOString(),
      auto_renew: true,
      last_payment_date: now.toISOString(),
      next_billing_date: endDate.toISOString(),
    };

    await kv.set(subscriptionKey, subscription);

    console.log(`✅ User ${user.id} upgraded to ${plan} plan`);

    // Get user profile for email and language preference
    const profileKey = `profile_${user.id}`;
    const profile = await kv.get(profileKey);
    const language = (profile?.language || 'en') as 'en' | 'zh';

    // Generate invoice
    const invoiceData = invoiceService.createSubscriptionInvoice({
      userId: user.id,
      plan,
      amount: price, // 使用顯示貨幣的金額（用於發票顯示）
      transactionId: transactionKey,
      language,
      currency: validCurrency, // ⭐ 傳入選擇的貨幣（用於發票顯示）
    });

    const invoiceKey = `invoice_${Date.now()}_${user.id}`;
    const invoice = {
      id: invoiceKey,
      ...invoiceData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await kv.set(invoiceKey, invoice);
    console.log(`📄 Invoice ${invoice.invoice_number} generated`);
    
    // Send subscription success email
    if (profile?.email) {
      let emailHtml = emailService.getSubscriptionSuccessEmail({
        name: profile.name || profile.email,
        plan,
        amount: price,
        nextBillingDate: endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        language,
        currency: validCurrency, // ⭐ 傳入貨幣
      });

      // 🎨 Apply branding for enterprise users
      const { getUserBranding, injectBranding } = await import('./branded_email_helper.tsx');
      const branding = await getUserBranding(user.id);
      if (branding) {
        console.log('🎨 [Email] Applying branding to subscription email for user:', user.id);
        emailHtml = injectBranding(emailHtml, branding);
      }

      await emailService.sendEmail({
        to: profile.email,
        subject: language === 'en' ? '🎉 Subscription Confirmed!' : '🎉 訂閱確認成功！',
        html: emailHtml,
      });

      console.log(`📧 Subscription success email sent to ${profile.email}${branding ? ' (branded)' : ''}`);
    }

    return c.json({
      success: true,
      subscription,
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      new_balance: wallet.available_balance,
    });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    return c.json({ error: 'Failed to upgrade subscription' }, 500);
  }
});

// Downgrade subscription
app.post("/make-server-215f78a5/subscription/downgrade", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { plan } = body;

    if (!['free', 'pro'].includes(plan)) {
      return c.json({ error: 'Invalid downgrade plan' }, 400);
    }

    // Get current subscription
    const subscriptionKey = `subscription_${user.id}`;
    const currentSubscription = await kv.get(subscriptionKey);

    if (!currentSubscription) {
      return c.json({ error: 'No active subscription found' }, 404);
    }

    // Validate downgrade (can only downgrade to lower tiers)
    const planTiers = { free: 0, pro: 1, enterprise: 2 };
    const currentTier = planTiers[currentSubscription.plan as keyof typeof planTiers] || 0;
    const newTier = planTiers[plan as keyof typeof planTiers] || 0;

    if (newTier >= currentTier) {
      return c.json({ error: 'Can only downgrade to lower tier plans' }, 400);
    }

    const previousPlan = currentSubscription.plan;
    const now = new Date();

    // Update subscription - immediate downgrade
    const subscription = {
      ...currentSubscription,
      plan,
      status: 'active',
      downgraded_at: now.toISOString(),
      downgrade_reason: 'user_requested',
      previous_plan: previousPlan,
      auto_renew: false, // Disable auto-renew on downgrade
    };

    // For free plan, clear end dates
    if (plan === 'free') {
      subscription.end_date = null;
      subscription.next_billing_date = null;
    }

    await kv.set(subscriptionKey, subscription);

    console.log(`⬇️ User ${user.id} downgraded from ${previousPlan} to ${plan}`);

    // Get user profile for email notification
    const profileKey = `profile_${user.id}`;
    const profile = await kv.get(profileKey);
    
    // Send downgrade confirmation email
    if (profile?.email) {
      const language = profile.language || 'zh';
      
      const planNames = {
        en: { free: 'Free', pro: 'Professional', enterprise: 'Enterprise' },
        zh: { free: '免費版', pro: '專業版', enterprise: '企業版' }
      };
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">📉 ${language === 'en' ? 'Subscription Downgraded' : '訂閱已降級'}</h2>
          <p>${language === 'en' ? 'Dear' : '親愛的'} ${profile.name || profile.email},</p>
          <p>${language === 'en' 
            ? `Your subscription has been successfully downgraded from ${planNames.en[previousPlan as keyof typeof planNames.en]} to ${planNames.en[plan as keyof typeof planNames.en]}.`
            : `您的訂閱已成功從 ${planNames.zh[previousPlan as keyof typeof planNames.zh]} 降級為 ${planNames.zh[plan as keyof typeof planNames.zh]}。`
          }</p>
          
          <div style="background: #dbeafe; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>${language === 'en' ? '📋 What this means:' : '📋 這意���著：'}</strong>
            <ul style="margin: 10px 0;">
              <li>${language === 'en' 
                ? 'Your account now has the features and limits of the new plan'
                : '您的帳戶現在具���新方案��功能和限制'}</li>
              <li>${language === 'en' 
                ? 'You can upgrade again at any time'
                : '您可以���時再次升級'}</li>
              ${plan === 'free' ? `<li>${language === 'en' 
                ? 'No future billing - you are on the Free plan'
                : '無需未來付款 - 您現在使用免費方案'}</li>` : ''}
            </ul>
          </div>
          
          <p>${language === 'en' 
            ? 'Thank you for using our platform! You can upgrade your plan anytime from your dashboard.'
            : '感謝您使用我們的平台！您可以隨時從儀��板升級您的方案。'
          }</p>
          
          <p style="margin-top: 20px;">
            <a href="${Deno.env.get('FRONTEND_URL') || 'https://casewhere.com'}/dashboard?tab=subscription" 
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              ${language === 'en' ? 'View Subscription' : '查看訂閱'}
            </a>
          </p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            ${language === 'en' 
              ? 'If you have any questions, please contact our support team.'
              : '如有任何問題，請聯繫我們���客服團隊。'}
          </p>
        </div>
      `;

      await emailService.sendEmail({
        to: profile.email,
        subject: language === 'en' 
          ? '📉 Subscription Downgraded - Confirmation' 
          : '📉 訂閱降級 - 確認通知',
        html: emailHtml,
      });

      console.log(`📧 Downgrade confirmation email sent to ${profile.email}`);
    }

    return c.json({
      success: true,
      subscription,
      message: 'Subscription downgraded successfully'
    });
  } catch (error) {
    console.error('Error downgrading subscription:', error);
    return c.json({ error: 'Failed to downgrade subscription' }, 500);
  }
});

// Toggle auto-renew
app.post("/make-server-215f78a5/subscription/auto-renew", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return c.json({ error: 'Invalid request' }, 400);
    }

    // Get subscription
    const subscriptionKey = `subscription_${user.id}`;
    const subscription = await kv.get(subscriptionKey);

    if (!subscription) {
      return c.json({ error: 'No active subscription' }, 404);
    }

    // Update auto-renew setting
    subscription.auto_renew = enabled;
    await kv.set(subscriptionKey, subscription);

    console.log(`✅ User ${user.id} ${enabled ? 'enabled' : 'disabled'} auto-renew`);

    return c.json({
      success: true,
      auto_renew: enabled,
    });
  } catch (error) {
    console.error('Error toggling auto-renew:', error);
    return c.json({ error: 'Failed to update auto-renew setting' }, 500);
  }
});

// Cancel subscription
app.post("/make-server-215f78a5/subscription/cancel", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get subscription
    const subscriptionKey = `subscription_${user.id}`;
    const subscription = await kv.get(subscriptionKey);

    if (!subscription || subscription.plan === 'free') {
      return c.json({ error: 'No active subscription to cancel' }, 404);
    }

    // Mark as cancelled (but keep active until end date)
    subscription.status = 'cancelled';
    subscription.auto_renew = false;
    subscription.cancelled_at = new Date().toISOString();
    await kv.set(subscriptionKey, subscription);

    console.log(`✅ User ${user.id} cancelled subscription`);

    return c.json({
      success: true,
      message: 'Subscription will remain active until end date',
      subscription,
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return c.json({ error: 'Failed to cancel subscription' }, 500);
  }
});

// Check usage limits
app.get("/make-server-215f78a5/subscription/check-limits/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    console.log('📊 [Subscription] Checking limits for user:', userId);
    
    if (!accessToken) {
      console.error('❌ No access token provided');
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Verify user
    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user) {
      console.log('ℹ️ [Subscription] Authentication failed:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get subscription with error handling
    const subscriptionKey = `subscription_${userId}`;
    console.log('🔍 [Subscription] Fetching subscription with key:', subscriptionKey);
    
    let subscription;
    try {
      subscription = await kv.get(subscriptionKey);
      console.log('📦 [Subscription] Subscription data:', subscription);
    } catch (kvError) {
      console.error('⚠️ [Subscription] KV get error for subscription (using default):', kvError);
      subscription = null;
    }
    
    if (!subscription) {
      console.log('ℹ️ [Subscription] No subscription found, using default free plan');
      subscription = { plan: 'free', status: 'active' };
    }

    // Get current month's usage with error handling
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const usageKey = `usage_${userId}_${now.getFullYear()}_${now.getMonth() + 1}`;
    console.log('🔍 [Subscription] Fetching usage with key:', usageKey);
    
    let usage;
    try {
      usage = await kv.get(usageKey);
      console.log('📦 [Subscription] Usage data:', usage);
    } catch (kvError) {
      console.error('⚠️ [Subscription] KV get error for usage (using default):', kvError);
      usage = null;
    }
    
    if (!usage) {
      console.log('ℹ️ [Subscription] No usage found, initializing to zero');
      usage = { projects: 0, proposals: 0 };
    }

    // Plan limits (use -1 for unlimited instead of Infinity for JSON serialization)
    const limits = {
      free: { projects: 1, proposals: 5 },
      pro: { projects: -1, proposals: -1 },
      enterprise: { projects: -1, proposals: -1 },
    };

    const planLimits = limits[subscription.plan as keyof typeof limits] || limits.free;
    
    const response = {
      plan: subscription.plan,
      limits: planLimits,
      usage,
      canCreateProject: planLimits.projects === -1 || usage.projects < planLimits.projects,
      canSubmitProposal: planLimits.proposals === -1 || usage.proposals < planLimits.proposals,
    };
    
    console.log('✅ [Subscription] Returning limits:', response);

    return c.json(response);
  } catch (error: any) {
    console.error('❌ [Subscription] Error checking limits:', error);
    console.error('❌ [Subscription] Error stack:', error?.stack);
    
    // Return default free plan on any error instead of 500
    console.log('ℹ️ [Subscription] Returning default free plan due to error');
    return c.json({
      plan: 'free',
      limits: { projects: 1, proposals: 5 },
      usage: { projects: 0, proposals: 0 },
      canCreateProject: true,
      canSubmitProposal: true,
    });
  }
});

// Increment usage counter
app.post("/make-server-215f78a5/subscription/increment-usage", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    console.log('📊 [Subscription] Incrementing usage...');
    
    if (!accessToken) {
      console.error('❌ No access token provided');
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      console.error('❌ Authentication failed:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { type } = body; // 'project' or 'proposal'
    
    console.log('📊 Incrementing usage type:', type, 'for user:', user.id);

    if (!['project', 'proposal'].includes(type)) {
      console.error('❌ Invalid usage type:', type);
      return c.json({ error: 'Invalid usage type' }, 400);
    }

    // Get current month's usage
    const now = new Date();
    const usageKey = `usage_${user.id}_${now.getFullYear()}_${now.getMonth() + 1}`;
    console.log('🔍 Fetching usage with key:', usageKey);
    
    let usage;
    try {
      usage = await kv.get(usageKey);
      console.log('📦 Current usage:', usage);
    } catch (kvError) {
      console.error('❌ KV get error:', kvError);
      usage = null;
    }
    
    if (!usage) {
      console.log('ℹ️ No usage found, initializing');
      usage = { projects: 0, proposals: 0 };
    }

    // Increment counter
    if (type === 'project') {
      usage.projects = (usage.projects || 0) + 1;
    } else {
      usage.proposals = (usage.proposals || 0) + 1;
    }
    
    console.log('📊 New usage:', usage);

    try {
      await kv.set(usageKey, usage);
      console.log('✅ Usage updated successfully');
    } catch (kvError) {
      console.error('❌ KV set error:', kvError);
      return c.json({ error: 'Failed to save usage', details: kvError.message }, 500);
    }

    return c.json({ success: true, usage });
  } catch (error: any) {
    console.error('❌ Error incrementing usage:', error);
    console.error('❌ Error stack:', error?.stack);
    return c.json({ error: 'Failed to increment usage', details: error?.message }, 500);
  }
});

// ============= PAYMENT METHODS ROUTES =============

// Get all payment methods for a user
app.get("/make-server-215f78a5/payment-methods/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || user.id !== userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all payment methods for this user
    const paymentMethods = (await kv.getByPrefix(`payment_method_${userId}_`) || []).map(item => item.value);
    
    // Sort by default first, then by created date
    paymentMethods.sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return c.json({ payment_methods: paymentMethods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return c.json({ error: 'Failed to fetch payment methods' }, 500);
  }
});

// Add a new payment method
app.post("/make-server-215f78a5/payment-methods", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { type, card_number, expiry_month, expiry_year, cvv, cardholder_name, paypal_email } = body;

    if (!['credit_card', 'paypal'].includes(type)) {
      return c.json({ error: 'Invalid payment method type' }, 400);
    }

    // Validate based on type
    if (type === 'credit_card') {
      if (!card_number || !expiry_month || !expiry_year || !cvv || !cardholder_name) {
        return c.json({ error: 'Missing required card information' }, 400);
      }
      
      // Basic card number validation (should be 13-19 digits)
      const cleanCardNumber = card_number.replace(/\s/g, '');
      if (!/^\d{13,19}$/.test(cleanCardNumber)) {
        return c.json({ error: 'Invalid card number' }, 400);
      }
    } else if (type === 'paypal') {
      if (!paypal_email) {
        return c.json({ error: 'PayPal email is required' }, 400);
      }
      
      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypal_email)) {
        return c.json({ error: 'Invalid email format' }, 400);
      }
    }

    // Check if this is the first payment method
    const existingMethods = (await kv.getByPrefix(`payment_method_${user.id}_`) || []).map(item => item.value);
    const isFirstMethod = existingMethods.length === 0;

    // Create payment method
    const paymentMethodId = `payment_method_${user.id}_${Date.now()}`;
    const now = new Date().toISOString();

    let paymentMethod: any = {
      id: paymentMethodId,
      user_id: user.id,
      type,
      is_default: isFirstMethod,
      created_at: now,
      updated_at: now,
    };

    if (type === 'credit_card') {
      // Determine card brand from number
      const firstDigit = card_number.replace(/\s/g, '')[0];
      const firstTwoDigits = card_number.replace(/\s/g, '').substring(0, 2);
      let brand = 'Unknown';
      
      if (firstDigit === '4') brand = 'Visa';
      else if (['51', '52', '53', '54', '55'].includes(firstTwoDigits)) brand = 'Mastercard';
      else if (['34', '37'].includes(firstTwoDigits)) brand = 'American Express';
      else if (firstTwoDigits === '60') brand = 'Discover';

      // Store masked card number (last 4 digits only)
      const lastFour = card_number.replace(/\s/g, '').slice(-4);
      
      paymentMethod = {
        ...paymentMethod,
        brand,
        last_four: lastFour,
        expiry_month,
        expiry_year,
        cardholder_name,
      };
    } else if (type === 'paypal') {
      // Mask email (show first 2 chars and domain)
      const [localPart, domain] = paypal_email.split('@');
      const maskedEmail = localPart.substring(0, 2) + '***@' + domain;
      
      paymentMethod = {
        ...paymentMethod,
        paypal_email: paypal_email,
        masked_email: maskedEmail,
      };
    }

    await kv.set(paymentMethodId, paymentMethod);

    console.log(`✅ Payment method added for user ${user.id}`);

    return c.json({
      success: true,
      payment_method: paymentMethod,
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    return c.json({ error: 'Failed to add payment method' }, 500);
  }
});

// Set default payment method
app.post("/make-server-215f78a5/payment-methods/:methodId/set-default", async (c) => {
  try {
    const methodId = c.req.param('methodId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get the payment method
    const paymentMethod = await kv.get(methodId);
    
    if (!paymentMethod || paymentMethod.user_id !== user.id) {
      return c.json({ error: 'Payment method not found' }, 404);
    }

    // Get all payment methods for this user
    const allMethods = (await kv.getByPrefix(`payment_method_${user.id}_`) || []).map(item => item.value);

    // Update all methods
    for (const method of allMethods) {
      method.is_default = method.id === methodId;
      method.updated_at = new Date().toISOString();
      await kv.set(method.id, method);
    }

    console.log(`✅ Set default payment method for user ${user.id}`);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error setting default payment method:', error);
    return c.json({ error: 'Failed to set default payment method' }, 500);
  }
});

// Delete a payment method
app.delete("/make-server-215f78a5/payment-methods/:methodId", async (c) => {
  try {
    const methodId = c.req.param('methodId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get the payment method
    const paymentMethod = await kv.get(methodId);
    
    if (!paymentMethod || paymentMethod.user_id !== user.id) {
      return c.json({ error: 'Payment method not found' }, 404);
    }

    // Check if this is the default method
    const wasDefault = paymentMethod.is_default;

    // Delete the payment method
    await kv.del(methodId);

    // If this was the default, set another one as default
    if (wasDefault) {
      const remainingMethods = (await kv.getByPrefix(`payment_method_${user.id}_`) || []).map(item => item.value);
      if (remainingMethods.length > 0) {
        remainingMethods[0].is_default = true;
        remainingMethods[0].updated_at = new Date().toISOString();
        await kv.set(remainingMethods[0].id, remainingMethods[0]);
      }
    }

    console.log(`�� Deleted payment method for user ${user.id}`);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return c.json({ error: 'Failed to delete payment method' }, 500);
  }
});

// ============= TRANSACTION ROUTES =============

// Get all transactions for a user
app.get("/make-server-215f78a5/transactions", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    
    if (!accessToken) {
      console.log('�� [Transactions] No access token provided');
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Verify user
    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user?.id) {
      console.log('❌ [Transactions] Auth error:', authError?.message || 'No user ID');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`🔍 [Transactions] Fetching transactions for user: ${user.id}`);

    // Get all transactions for this user
    let allTransactions;
    try {
      allTransactions = (await kv.getByPrefix('transaction_')).map(item => item.value);
      console.log(`📊 [Transactions] getByPrefix returned:`, typeof allTransactions, Array.isArray(allTransactions));
    } catch (kvError) {
      console.error('❌ [Transactions] KV error:', kvError);
      allTransactions = [];
    }
    
    // Ensure it's an array
    if (!Array.isArray(allTransactions)) {
      console.log(`⚠️ [Transactions] getByPrefix returned non-array, converting...`);
      allTransactions = [];
    }
    
    // Filter transactions for this user
    const userTransactions = allTransactions.filter(
      (tx: any) => tx?.user_id === user.id
    );

    console.log(`✅ [Transactions] Retrieved ${userTransactions.length} transactions for user ${user.id}`);

    return c.json({ 
      transactions: userTransactions,
      total: userTransactions.length,
    });
  } catch (error) {
    console.error('❌ [Transactions] Unexpected error:', error);
    return c.json({ 
      error: 'Failed to fetch transactions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get transaction details by ID
app.get("/make-server-215f78a5/transactions/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const transactionId = c.req.param('id');
    const transaction = await kv.get(transactionId);

    if (!transaction) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    // Verify transaction belongs to user
    if (transaction.user_id !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    return c.json({ transaction });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return c.json({ error: 'Failed to fetch transaction' }, 500);
  }
});

// Get transaction statistics
app.get("/make-server-215f78a5/transactions/stats/summary", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all transactions for this user
    const allTransactions = (await kv.getByPrefix('transaction_') || []).map(item => item.value);
    const userTransactions = allTransactions.filter(
      (tx: any) => tx.user_id === user.id
    );

    // 💱 Helper function to convert amount to TWD (數據庫預設儲存 TWD)
    const convertTxToTWD = (amount: number, currency?: string): number => {
      if (!amount) return 0;
      if (!currency || currency === 'TWD') {
        return amount;
      }
      if (currency === 'USD') {
        const EXCHANGE_RATE = 31.29;
        return amount * EXCHANGE_RATE;
      }
      return amount;
    };

    // Calculate statistics
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    const stats = {
      total_transactions: userTransactions.length,
      total_income: 0,
      total_expenses: 0,
      this_month_income: 0,
      this_month_expenses: 0,
      this_year_income: 0,
      this_year_expenses: 0,
      by_type: {} as Record<string, number>,
    };

    console.log(`📊 [Transaction Stats] Processing ${userTransactions.length} transactions for user ${user.id}`);

    userTransactions.forEach((tx: any) => {
      const amount = convertTxToTWD(tx.amount || 0, tx.currency);
      const txDate = new Date(tx.created_at);
      
      // Total
      if (amount > 0) {
        stats.total_income += amount;
      } else {
        stats.total_expenses += Math.abs(amount);
      }

      // This month
      if (txDate >= thisMonth) {
        if (amount > 0) {
          stats.this_month_income += amount;
        } else {
          stats.this_month_expenses += Math.abs(amount);
        }
      }

      // This year
      if (txDate >= thisYear) {
        if (amount > 0) {
          stats.this_year_income += amount;
        } else {
          stats.this_year_expenses += Math.abs(amount);
        }
      }

      // By type
      const type = tx.type || 'unknown';
      stats.by_type[type] = (stats.by_type[type] || 0) + 1;
    });

    console.log(`✅ [Transaction Stats] Calculated for user ${user.id}:`, {
      total_transactions: stats.total_transactions,
      total_income: `NT$${Math.round(stats.total_income)}`,
      total_expenses: `NT$${Math.round(stats.total_expenses)}`,
      this_month_income: `NT$${Math.round(stats.this_month_income)}`,
      this_month_expenses: `NT$${Math.round(stats.this_month_expenses)}`,
      this_year_income: `NT$${Math.round(stats.this_year_income)}`,
      this_year_expenses: `NT$${Math.round(stats.this_year_expenses)}`,
    });

    // Return stats with explicit structure
    return c.json({ 
      stats: {
        total_transactions: stats.total_transactions,
        total_income: stats.total_income,
        total_expenses: stats.total_expenses,
        this_month_income: stats.this_month_income,
        this_month_expenses: stats.this_month_expenses,
        this_month_net: stats.this_month_income - stats.this_month_expenses,
        this_year_income: stats.this_year_income,
        this_year_expenses: stats.this_year_expenses,
        this_year_net: stats.this_year_income - stats.this_year_expenses,
        all_time_income: stats.total_income,
        all_time_expenses: stats.total_expenses,
        all_time_net: stats.total_income - stats.total_expenses,
        by_type: stats.by_type,
      }
    });
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    return c.json({ error: 'Failed to fetch transaction statistics' }, 500);
  }
});

// ============= INVOICE ROUTES =============

// Get all invoices for a user
app.get("/make-server-215f78a5/invoices", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.log('❌ [Invoices] No access token provided');
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      console.log('❌ [Invoices] Auth error:', authError?.message || 'No user ID');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`🔍 [Invoices] Fetching invoices for user: ${user.id}`);

    // Get all invoices for this user
    let allInvoices;
    try {
      allInvoices = (await kv.getByPrefix('invoice_')).map(item => item.value);
      console.log(`📊 [Invoices] getByPrefix returned:`, typeof allInvoices, Array.isArray(allInvoices));
    } catch (kvError) {
      console.error('❌ [Invoices] KV error:', kvError);
      allInvoices = [];
    }
    
    // Ensure it's an array
    if (!Array.isArray(allInvoices)) {
      console.log(`⚠️ [Invoices] getByPrefix returned non-array, converting...`);
      allInvoices = [];
    }
    
    // Filter invoices for this user
    const userInvoices = allInvoices.filter(
      (inv: any) => inv?.user_id === user.id
    );

    // Sort by date, newest first
    const sorted = userInvoices.sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    console.log(`✅ [Invoices] Retrieved ${sorted.length} invoices for user ${user.id}`);

    return c.json({ 
      invoices: sorted,
      total: sorted.length,
    });
  } catch (error) {
    console.error('❌ [Invoices] Unexpected error:', error);
    return c.json({ 
      error: 'Failed to fetch invoices',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get invoice statistics
app.get("/make-server-215f78a5/invoices/stats", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`🔍 [Invoice Stats] Fetching stats for user: ${user.id}`);

    // Get all invoices for this user
    let allInvoices;
    try {
      allInvoices = (await kv.getByPrefix('invoice_')).map(item => item.value);
    } catch (kvError) {
      console.error('❌ [Invoice Stats] KV error:', kvError);
      allInvoices = [];
    }
    
    if (!Array.isArray(allInvoices)) {
      allInvoices = [];
    }
    
    const userInvoices = allInvoices.filter(
      (inv: any) => inv?.user_id === user.id
    );

    console.log(`🔍 [Invoice Stats] User invoices (${userInvoices.length}):`, 
      userInvoices.map((inv: any) => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        total: inv.total,
        status: inv.status,
        currency: inv.currency,
        items: inv.items?.length || 0
      }))
    );

    // 💱 Helper function to convert amount to TWD (數據庫預設儲存 TWD)
    const convertToTWD = (amount: number, currency: string): number => {
      if (!currency || currency === 'TWD') {
        return amount;
      }
      if (currency === 'USD') {
        // 使用固定匯率 1 USD = 31.29 TWD（應該從環境變數或即時匯率 API 獲取）
        const EXCHANGE_RATE = 31.29;
        return amount * EXCHANGE_RATE;
      }
      // 其他幣種暫時返回原值
      return amount;
    };

    // Calculate statistics (統一轉換為 TWD)
    const stats = {
      total_invoices: userInvoices.length,
      total_amount: userInvoices.reduce((sum: number, inv: any) => {
        const amountInTWD = convertToTWD(inv.total || 0, inv.currency);
        return sum + amountInTWD;
      }, 0),
      paid_amount: userInvoices
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => {
          const amountInTWD = convertToTWD(inv.total || 0, inv.currency);
          return sum + amountInTWD;
        }, 0),
      pending_amount: userInvoices
        .filter((inv: any) => inv.status === 'pending')
        .reduce((sum: number, inv: any) => {
          const amountInTWD = convertToTWD(inv.total || 0, inv.currency);
          return sum + amountInTWD;
        }, 0),
      overdue_amount: userInvoices
        .filter((inv: any) => inv.status === 'overdue')
        .reduce((sum: number, inv: any) => {
          const amountInTWD = convertToTWD(inv.total || 0, inv.currency);
          return sum + amountInTWD;
        }, 0),
    };

    console.log(`✅ [Invoice Stats] Stats calculated for user ${user.id} (all amounts in TWD):`, {
      total_invoices: stats.total_invoices,
      total_amount: `NT$${Math.round(stats.total_amount)}`,
      paid_amount: `NT$${Math.round(stats.paid_amount)}`,
      pending_amount: `NT$${Math.round(stats.pending_amount)}`,
      overdue_amount: `NT$${Math.round(stats.overdue_amount)}`,
      sample_invoices: userInvoices.slice(0, 2).map((inv: any) => ({
        id: inv.id,
        total_original: inv.total,
        total_in_TWD: Math.round(convertToTWD(inv.total || 0, inv.currency)),
        status: inv.status,
        currency: inv.currency
      }))
    });

    return c.json({ stats });
  } catch (error) {
    console.error('❌ [Invoice Stats] Unexpected error:', error);
    return c.json({ 
      error: 'Failed to fetch invoice stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get invoice by ID
app.get("/make-server-215f78a5/invoices/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const invoiceId = c.req.param('id');
    const invoice = await kv.get(invoiceId);

    if (!invoice) {
      return c.json({ error: 'Invoice not found' }, 404);
    }

    // Verify invoice belongs to user
    if (invoice.user_id !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    return c.json({ invoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return c.json({ error: 'Failed to fetch invoice' }, 500);
  }
});

// Generate invoice HTML
app.get("/make-server-215f78a5/invoices/:id/html", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const invoiceId = c.req.param('id');
    // 從 query 參數獲取語言設置，預設為英文
    const language = (c.req.query('lang') || 'en') as 'en' | 'zh';
    const invoice = await kv.get(invoiceId);

    if (!invoice) {
      return c.json({ error: 'Invoice not found' }, 404);
    }

    // Verify invoice belongs to user
    if (invoice.user_id !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Get user profile for customer details
    const profileKey = `profile_${user.id}`;
    const profile = await kv.get(profileKey);

    const details: invoiceService.InvoiceDetails = {
      customer_name: profile?.name || profile?.email || 'Customer',
      customer_email: profile?.email || user.email || '',
      customer_address: profile?.address || undefined,
      company_name: 'Case Where 接得準公司',
      company_address: 'Taiwan',
      company_tax_id: '12345678',
      company_email: 'billing@casewhere.com',
    };

    const html = invoiceService.generateInvoiceHTML(invoice, details, language);

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating invoice HTML:', error);
    return c.json({ error: 'Failed to generate invoice' }, 500);
  }
});

// Download invoice as PDF (returns HTML that can be printed to PDF)
app.get("/make-server-215f78a5/invoices/:id/download", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const invoiceId = c.req.param('id');
    // 從 query 參數獲取語言設置，預設為英文
    const language = (c.req.query('lang') || 'en') as 'en' | 'zh';
    const invoice = await kv.get(invoiceId);

    if (!invoice) {
      return c.json({ error: 'Invoice not found' }, 404);
    }

    // Verify invoice belongs to user
    if (invoice.user_id !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Get user profile
    const profileKey = `profile_${user.id}`;
    const profile = await kv.get(profileKey);

    const details: invoiceService.InvoiceDetails = {
      customer_name: profile?.name || profile?.email || 'Customer',
      customer_email: profile?.email || user.email || '',
      customer_address: profile?.address || undefined,
      company_name: 'Case Where 接得準公司',
      company_address: 'Taiwan',
      company_tax_id: '12345678',
      company_email: 'billing@casewhere.com',
    };

    const html = invoiceService.generateInvoiceHTML(invoice, details, language);

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="invoice_${invoice.invoice_number}.html"`,
      },
    });
  } catch (error) {
    console.error('Error downloading invoice:', error);
    return c.json({ error: 'Failed to download invoice' }, 500);
  }
});

// ============= CONTRACT ROUTES =============

// Get all contracts for a user
app.get("/make-server-215f78a5/contracts", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.log('❌ [Contracts] No access token provided');
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      console.log('❌ [Contracts] Auth error:', authError?.message || 'No user ID');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`🔍 [Contracts] Fetching contracts for user: ${user.id}`);

    // Get all contracts for this user
    const contracts = await contractService.getUserContracts(user.id);
    
    // Enrich contracts with user names
    const enrichedContracts = await Promise.all(
      contracts.map(async (contract: any) => {
        // Get client name
        if (contract.client_id) {
          const clientProfile = await kv.get(`profile_${contract.client_id}`);
          contract.client_name = clientProfile?.name || clientProfile?.full_name || clientProfile?.email || 'Client';
        }
        
        // Get freelancer name
        if (contract.freelancer_id) {
          const freelancerProfile = await kv.get(`profile_${contract.freelancer_id}`);
          contract.freelancer_name = freelancerProfile?.name || freelancerProfile?.full_name || freelancerProfile?.email || 'Freelancer';
        }
        
        // Get project title
        if (contract.project_id) {
          const project = await kv.get(contract.project_id);
          contract.project_title = project?.title || 'Project';
        }
        
        return contract;
      })
    );

    console.log(`✅ [Contracts] Retrieved ${enrichedContracts.length} contracts for user ${user.id}`);

    return c.json({ 
      contracts: enrichedContracts,
      total: enrichedContracts.length,
    });
  } catch (error) {
    console.error('❌ [Contracts] Unexpected error:', error);
    return c.json({ 
      error: 'Failed to fetch contracts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get contract by ID
app.get("/make-server-215f78a5/contracts/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const contractId = c.req.param('id');
    const contract = await contractService.getContract(contractId);

    if (!contract) {
      return c.json({ error: 'Contract not found' }, 404);
    }

    // Verify user is part of this contract
    if (contract.client_id !== user.id && contract.freelancer_id !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    return c.json({ contract });
  } catch (error) {
    console.error('Error fetching contract:', error);
    return c.json({ error: 'Failed to fetch contract' }, 500);
  }
});

// Create a new contract (Enterprise only)
app.post("/make-server-215f78a5/contracts", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const contract = await contractService.createContract(body, user.id);

    console.log(`✅ [Contracts] Created contract ${contract.id} for user ${user.id}`);

    return c.json({ contract }, 201);
  } catch (error) {
    console.error('Error creating contract:', error);
    return c.json({ 
      error: 'Failed to create contract',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Update contract
app.put("/make-server-215f78a5/contracts/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const contractId = c.req.param('id');
    const contract = await contractService.getContract(contractId);

    if (!contract) {
      return c.json({ error: 'Contract not found' }, 404);
    }

    // Only client can update contract
    if (contract.client_id !== user.id) {
      return c.json({ error: 'Only the client can update this contract' }, 403);
    }

    // Cannot update if already signed
    if (contract.status === 'signed' || contract.status === 'active' || contract.status === 'completed') {
      return c.json({ error: 'Cannot update contract in current status' }, 400);
    }

    const body = await c.req.json();
    const updatedContract = await contractService.updateContract(contractId, body);

    console.log(`✅ [Contracts] Updated contract ${contractId}`);

    return c.json({ contract: updatedContract });
  } catch (error) {
    console.error('Error updating contract:', error);
    return c.json({ error: 'Failed to update contract' }, 500);
  }
});

// Update contract status
app.patch("/make-server-215f78a5/contracts/:id/status", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin or has enterprise subscription
    const userIsAdmin = await isAdminByEmail(user.email);
    const { hasEnterprise } = await checkEnterpriseSubscription(user.id);
    
    if (!userIsAdmin && !hasEnterprise) {
      return c.json({ 
        error: 'Enterprise subscription required',
        message: 'Contract management is only available for Enterprise tier users'
      }, 403);
    }

    const contractId = c.req.param('id');
    const contract = await contractService.getContract(contractId);

    if (!contract) {
      return c.json({ error: 'Contract not found' }, 404);
    }

    // Verify user is part of this contract (admins bypass)
    if (!userIsAdmin && contract.client_id !== user.id && contract.freelancer_id !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const { status } = await c.req.json();
    const updatedContract = await contractService.updateContractStatus(contractId, status);

    console.log(`✅ [Contracts] Updated contract ${contractId} status to ${status}`);

    return c.json({ contract: updatedContract });
  } catch (error) {
    console.error('Error updating contract status:', error);
    return c.json({ error: 'Failed to update contract status' }, 500);
  }
});

// Sign contract
app.post("/make-server-215f78a5/contracts/:id/sign", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin or has enterprise subscription
    const userIsAdmin = await isAdminByEmail(user.email);
    const { hasEnterprise } = await checkEnterpriseSubscription(user.id);
    
    if (!userIsAdmin && !hasEnterprise) {
      return c.json({ 
        error: 'Enterprise subscription required',
        message: 'Contract management is only available for Enterprise tier users'
      }, 403);
    }

    const contractId = c.req.param('id');
    const contract = await contractService.getContract(contractId);

    if (!contract) {
      return c.json({ error: 'Contract not found' }, 404);
    }

    // Verify user is part of this contract (admins bypass)
    if (!userIsAdmin && contract.client_id !== user.id && contract.freelancer_id !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const { signature } = await c.req.json();
    const signedContract = await contractService.signContract(contractId, user.id, signature);

    console.log(`✅ [Contracts] User ${user.id} signed contract ${contractId}`);

    return c.json({ contract: signedContract });
  } catch (error) {
    console.error('Error signing contract:', error);
    return c.json({ 
      error: 'Failed to sign contract',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Delete contract
app.delete("/make-server-215f78a5/contracts/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const contractId = c.req.param('id');
    const contract = await contractService.getContract(contractId);

    if (!contract) {
      return c.json({ error: 'Contract not found' }, 404);
    }

    // Only client can delete contract
    if (contract.client_id !== user.id) {
      return c.json({ error: 'Only the client can delete this contract' }, 403);
    }

    // Can only delete drafts
    if (contract.status !== 'draft') {
      return c.json({ error: 'Can only delete draft contracts' }, 400);
    }

    await contractService.deleteContract(contractId);

    console.log(`✅ [Contracts] Deleted contract ${contractId}`);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting contract:', error);
    return c.json({ error: 'Failed to delete contract' }, 500);
  }
});

// Generate contract HTML
app.get("/make-server-215f78a5/contracts/:id/html", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const contractId = c.req.param('id');
    const language = (c.req.query('lang') || 'en') as 'en' | 'zh';
    const contract = await contractService.getContract(contractId);

    if (!contract) {
      return c.json({ error: 'Contract not found' }, 404);
    }

    // Verify user is part of this contract
    if (contract.client_id !== user.id && contract.freelancer_id !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const html = contractService.generateContractHTML(contract, language);

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating contract HTML:', error);
    return c.json({ error: 'Failed to generate contract' }, 500);
  }
});

// Download contract
app.get("/make-server-215f78a5/contracts/:id/download", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const contractId = c.req.param('id');
    const language = (c.req.query('lang') || 'en') as 'en' | 'zh';
    const contract = await contractService.getContract(contractId);

    if (!contract) {
      return c.json({ error: 'Contract not found' }, 404);
    }

    // Verify user is part of this contract
    if (contract.client_id !== user.id && contract.freelancer_id !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const html = contractService.generateContractHTML(contract, language);

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="contract_${contract.contract_number}.html"`,
      },
    });
  } catch (error) {
    console.error('Error downloading contract:', error);
    return c.json({ error: 'Failed to download contract' }, 500);
  }
});

// ============= EMAIL NOTIFICATION ROUTES =============

// Check for upcoming subscription renewals and send reminders
app.post("/make-server-215f78a5/notifications/check-renewals", async (c) => {
  try {
    console.log('🔔 Starting renewal check...');
    
    // Get all subscriptions
    const allSubscriptions = (await kv.getByPrefix('subscription_') || []).map(item => item.value);
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    let emailsSent = 0;
    let errors = 0;

    for (const sub of allSubscriptions) {
      try {
        // Skip free plans or inactive subscriptions
        if (sub.plan === 'free' || sub.status !== 'active' || !sub.auto_renew) {
          continue;
        }

        // Check if renewal is within 3 days
        const nextBillingDate = new Date(sub.next_billing_date);
        
        // Check if we should send reminder (3 days before, but not already sent)
        const diffInDays = Math.ceil((nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 3) {
          // Get user ID from subscription object
          const userId = sub.user_id;
          if (!userId) {
            console.error('❌ [Renewals] Subscription missing user_id:', sub);
            continue;
          }

          // Get user profile
          const profileKey = `profile_${userId}`;
          const profile = await kv.get(profileKey);
          
          if (!profile?.email) continue;

          // Get user wallet
          const walletKey = `wallet_${userId}`;
          const wallet = await kv.get(walletKey);
          
          const balance = wallet?.available_balance || 0;
          const planPrices = { pro: 45, enterprise: 150 };
          const amount = planPrices[sub.plan as keyof typeof planPrices] || 0;

          // Send renewal reminder email
          const language = profile.language || 'zh';
          let emailHtml = emailService.getRenewalReminderEmail({
            name: profile.name || profile.email,
            plan: sub.plan,
            amount,
            renewalDate: nextBillingDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            balance,
            language,
          });

          // 🎨 Apply branding for enterprise users
          const { getUserBranding, injectBranding } = await import('./branded_email_helper.tsx');
          const branding = await getUserBranding(userId);
          if (branding) {
            emailHtml = injectBranding(emailHtml, branding);
          }

          const result = await emailService.sendEmail({
            to: profile.email,
            subject: language === 'en' 
              ? (balance >= amount ? '📅 Subscription Renewal Reminder' : '⚠️ Low Balance Alert - Renewal Due Soon')
              : (balance >= amount ? '📅 訂閱續費提醒' : '⚠️ 餘額不足警告 - 即將續費'),
            html: emailHtml,
          });

          if (result.success) {
            emailsSent++;
            console.log(`📧 Renewal reminder sent to ${profile.email}`);
          } else {
            errors++;
            console.error(`❌ Failed to send renewal reminder to ${profile.email}`);
          }
        }
      } catch (error) {
        errors++;
        console.error('Error processing subscription:', error);
      }
    }

    console.log(`✅ Renewal check complete: ${emailsSent} emails sent, ${errors} errors`);

    return c.json({
      success: true,
      emails_sent: emailsSent,
      errors,
    });
  } catch (error) {
    console.error('Error checking renewals:', error);
    return c.json({ error: 'Failed to check renewals' }, 500);
  }
});

// Process subscription renewals and automatic charging
app.post("/make-server-215f78a5/subscription/process-renewals", async (c) => {
  try {
    console.log('💳 Starting subscription renewal processing...');
    
    const now = new Date();
    const allSubscriptions = (await kv.getByPrefix('subscription_') || []).map(item => item.value);
    
    let renewed = 0;
    let downgraded = 0;
    let failed = 0;
    let emailsSent = 0;

    for (const subscription of allSubscriptions) {
      try {
        // Skip free plans or inactive subscriptions
        if (subscription.plan === 'free' || subscription.status !== 'active' || !subscription.auto_renew) {
          continue;
        }

        const nextBillingDate = new Date(subscription.next_billing_date);
        
        // Check if subscription has expired or is expiring today
        if (nextBillingDate <= now) {
          // Extract user ID - try multiple methods
          let userId = subscription.user_id;
          
          // If not directly available, try to extract from key structure
          if (!userId) {
            // subscriptions are stored as subscription_${userId}
            // we need to find the corresponding user (both profile formats)
            const newFormatProfiles = (await kv.getByPrefix('profile_') || []).map(item => item.value);
            const oldFormatProfiles = (await kv.getByPrefix('profile:') || []).map(item => item.value);
            const allProfiles = [...newFormatProfiles, ...oldFormatProfiles];
            for (const prof of allProfiles) {
              const subKey = `subscription_${prof.user_id}`;
              const userSub = await kv.get(subKey);
              if (userSub && userSub.plan === subscription.plan && userSub.next_billing_date === subscription.next_billing_date) {
                userId = prof.user_id;
                break;
              }
            }
          }
          
          if (!userId) {
            console.error('❌ Cannot find user_id for subscription:', subscription);
            continue;
          }

          console.log(`💰 Processing renewal for user ${userId}, plan: ${subscription.plan}`);

          // Get user wallet
          const walletKey = `wallet_${userId}`;
          const wallet = await kv.get(walletKey);
          
          if (!wallet) {
            console.error(`❌ Wallet not found for user ${userId}`);
            failed++;
            continue;
          }

          // Calculate renewal amount
          const planPrices = { 
            pro: subscription.billingCycle === 'yearly' ? 450 : 45,
            enterprise: subscription.billingCycle === 'yearly' ? 1400 : 140 
          };
          const amount = planPrices[subscription.plan as keyof typeof planPrices] || 0;

          // Get user profile for notifications
          const profileKey = `profile_${userId}`;
          const profile = await kv.get(profileKey);
          const language = profile?.language || 'en';

          // Check if wallet has sufficient balance
          if (wallet.available_balance >= amount) {
            // SUCCESS: Charge the wallet and renew subscription
            console.log(`✅ Sufficient balance ($${wallet.available_balance} >= $${amount}), processing renewal...`);
            
            // Deduct from wallet
            wallet.available_balance -= amount;
            wallet.lifetime_spent += amount;
            await kv.set(walletKey, wallet);

            // Record transaction
            const transactionKey = `transaction_${userId}_${Date.now()}`;
            const transaction = {
              id: transactionKey,
              user_id: userId,
              type: 'subscription_renewal',
              amount: -amount,
              description: `${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} plan renewal (${subscription.billingCycle})`,
              status: 'completed',
              created_at: now.toISOString(),
              balance_after: wallet.available_balance,
            };
            await kv.set(transactionKey, transaction);

            // Update subscription dates
            const daysToAdd = subscription.billingCycle === 'yearly' ? 365 : 30;
            const newEndDate = new Date(nextBillingDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
            
            subscription.last_payment_date = now.toISOString();
            subscription.next_billing_date = newEndDate.toISOString();
            subscription.end_date = newEndDate.toISOString();
            subscription.user_id = userId; // Ensure user_id is stored
            
            const subscriptionKey = `subscription_${userId}`;
            await kv.set(subscriptionKey, subscription);

            renewed++;
            console.log(`✅ User ${userId} subscription renewed successfully until ${newEndDate.toISOString()}`);

            // Send success email
            if (profile?.email) {
              const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>${language === 'en' ? '✅ Subscription Renewed Successfully' : '✅ 訂閱續費成功'}</h2>
                  <p>${language === 'en' ? 'Dear' : '親愛的'} ${profile.name || profile.email},</p>
                  <p>${language === 'en' 
                    ? `Your ${subscription.plan} subscription has been renewed successfully.`
                    : `您的 ${subscription.plan} 訂閱已成功續費。`}</p>
                  <ul>
                    <li>${language === 'en' ? 'Amount charged' : '扣款金額'}: $${amount}</li>
                    <li>${language === 'en' ? 'Next billing date' : '下次帳單日期'}: ${newEndDate.toLocaleDateString()}</li>
                    <li>${language === 'en' ? 'Remaining balance' : '剩餘餘額'}: $${wallet.available_balance.toFixed(2)}</li>
                  </ul>
                  <p>${language === 'en' ? 'Thank you for your continued support!' : '感謝您的持續支持！'}</p>
                </div>
              `;

              await emailService.sendEmail({
                to: profile.email,
                subject: language === 'en' ? '✅ Subscription Renewed Successfully' : '✅ 訂閱續費成功',
                html: emailHtml,
              });
              emailsSent++;
            }

          } else {
            // FAILED: Insufficient balance - Send warning and prepare for downgrade
            console.log(`⚠️ Insufficient balance ($${wallet.available_balance} < $${amount}), processing payment failure...`);
            
            // Check if we already sent a payment failure notice
            const failureNoticeKey = `payment_failure_${userId}`;
            const lastNotice = await kv.get(failureNoticeKey);
            
            const gracePeriodDays = 7; // Give user 7 days to top up
            const gracePeriodEnd = new Date(now.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);
            
            if (!lastNotice) {
              // First failure - send warning email and set grace period
              console.log(`📧 Sending payment failure warning to user ${userId}`);
              
              if (profile?.email) {
                const shortfall = amount - wallet.available_balance;
                const emailHtml = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #f59e0b;">⚠️ ${language === 'en' ? 'Payment Failed - Action Required' : '付款失敗 - 需要採取行動'}</h2>
                    <p>${language === 'en' ? 'Dear' : '親愛的'} ${profile.name || profile.email},</p>
                    <p>${language === 'en' 
                      ? `We were unable to renew your ${subscription.plan} subscription due to insufficient wallet balance.`
                      : `由於錢包餘額不足，我們無法續訂您的 ${subscription.plan} 訂閱。`}</p>
                    <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                      <strong>${language === 'en' ? 'Payment Details:' : '付款詳情：'}</strong>
                      <ul>
                        <li>${language === 'en' ? 'Amount required' : '所需金額'}: <strong>$${amount}</strong></li>
                        <li>${language === 'en' ? 'Current balance' : '當前餘額'}: $${wallet.available_balance.toFixed(2)}</li>
                        <li>${language === 'en' ? 'Amount needed' : '需要充值'}: <strong style="color: #dc2626;">$${shortfall.toFixed(2)}</strong></li>
                      </ul>
                    </div>
                    <div style="background: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0;">
                      <strong>${language === 'en' ? '⏰ Grace Period:' : '⏰ 寬限期：'}</strong>
                      <p>${language === 'en' 
                        ? `You have ${gracePeriodDays} days to add funds to your wallet. If payment is not received by ${gracePeriodEnd.toLocaleDateString()}, your account will be automatically downgraded to the Free plan.`
                        : `您有 ${gracePeriodDays} 天的時間為您的錢包充���。如果在 ${gracePeriodEnd.toLocaleDateString()} 之前未收到付款，您的帳戶將自動降級為免費方案���`}</p>
                    </div>
                    <p style="margin-top: 20px;">
                      <a href="${Deno.env.get('FRONTEND_URL') || 'https://casewhere.com'}/dashboard?tab=wallet" 
                         style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        ${language === 'en' ? '💳 Add Funds Now' : '💳 立即充值'}
                      </a>
                    </p>
                  </div>
                `;

                await emailService.sendEmail({
                  to: profile.email,
                  subject: language === 'en' 
                    ? '⚠️ Payment Failed - Please Add Funds to Your Wallet' 
                    : '⚠️ 付款失敗 - 請充值您的錢包',
                  html: emailHtml,
                });
                emailsSent++;
              }
              
              // Record the failure notice
              await kv.set(failureNoticeKey, {
                sent_at: now.toISOString(),
                grace_period_end: gracePeriodEnd.toISOString(),
                amount_required: amount,
                plan: subscription.plan,
              });
              
              failed++;
              
            } else {
              // Check if grace period has ended
              const graceEndDate = new Date(lastNotice.grace_period_end);
              
              if (now >= graceEndDate) {
                // Grace period ended - downgrade to free plan
                console.log(`⬇️ Grace period ended for user ${userId}, downgrading to free plan...`);
                
                const previousPlan = subscription.plan;
                subscription.plan = 'free';
                subscription.status = 'active';
                subscription.auto_renew = false;
                subscription.downgraded_at = now.toISOString();
                subscription.downgrade_reason = 'payment_failure';
                subscription.previous_plan = previousPlan;
                subscription.user_id = userId; // Ensure user_id is stored
                
                const subscriptionKey = `subscription_${userId}`;
                await kv.set(subscriptionKey, subscription);
                
                // Clear failure notice
                await kv.del(failureNoticeKey);
                
                downgraded++;
                console.log(`✅ User ${userId} downgraded to free plan`);
                
                // Send downgrade notification email
                if (profile?.email) {
                  const emailHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2 style="color: #dc2626;">📉 ${language === 'en' ? 'Subscription Downgraded' : '訂閱已降級'}</h2>
                      <p>${language === 'en' ? 'Dear' : '親愛的'} ${profile.name || profile.email},</p>
                      <p>${language === 'en' 
                        ? `Your ${previousPlan} subscription has been downgraded to the Free plan due to insufficient wallet balance.`
                        : `由於錢包餘額不足，您的 ${previousPlan} 訂閱已降級為免費方案。`}</p>
                      <div style="background: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p>${language === 'en' 
                          ? 'Your account is now on the Free plan with limited features. You can upgrade anytime by adding funds to your wallet and selecting a paid plan.'
                          : '您的帳戶現在使用免費方案，功能有限。您可以隨時充值錢包並選擇付費方案來升級。'}</p>
                      </div>
                      <p style="margin-top: 20px;">
                        <a href="${Deno.env.get('FRONTEND_URL') || 'https://casewhere.com'}/pricing" 
                           style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                          ${language === 'en' ? '⬆️ Upgrade Now' : '⬆️ 立即升級'}
                        </a>
                      </p>
                    </div>
                  `;

                  await emailService.sendEmail({
                    to: profile.email,
                    subject: language === 'en' 
                      ? '📉 Your Subscription Has Been Downgraded' 
                      : '📉 您的訂閱已降級',
                    html: emailHtml,
                  });
                  emailsSent++;
                }
              } else {
                // Still in grace period
                const daysRemaining = Math.ceil((graceEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                console.log(`⏳ User ${userId} still in grace period (${daysRemaining} days remaining)`);
                failed++;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error processing subscription renewal:', error);
        failed++;
      }
    }

    console.log(`✅ Renewal processing complete:`);
    console.log(`   - ${renewed} subscriptions renewed`);
    console.log(`   - ${downgraded} accounts downgraded`);
    console.log(`   - ${failed} payment failures`);
    console.log(`   - ${emailsSent} emails sent`);

    return c.json({
      success: true,
      renewed,
      downgraded,
      failed,
      emails_sent: emailsSent,
    });
  } catch (error) {
    console.error('Error processing renewals:', error);
    return c.json({ error: 'Failed to process renewals' }, 500);
  }
});

// Check for low wallet balances and send alerts
app.post("/make-server-215f78a5/notifications/check-low-balance", async (c) => {
  try {
    console.log('🔔 Starting low balance check...');
    
    const allWallets = (await kv.getByPrefix('wallet_') || []).map(item => item.value);
    const threshold = 50; // Alert when balance is below $50
    
    let emailsSent = 0;
    let errors = 0;

    for (const wallet of allWallets) {
      try {
        if (wallet.available_balance < threshold) {
          // Extract user ID from wallet key
          const userId = wallet.user_id;
          if (!userId) continue;

          // Get user profile
          const profileKey = `profile_${userId}`;
          const profile = await kv.get(profileKey);
          
          if (!profile?.email) continue;

          // Check if we already sent a low balance alert recently
          const alertKey = `low_balance_alert_${userId}`;
          const lastAlert = await kv.get(alertKey);
          
          // Only send alert if we haven't sent one in the last 7 days
          if (lastAlert) {
            const daysSinceLastAlert = Math.ceil(
              (new Date().getTime() - new Date(lastAlert.sent_at).getTime()) / (1000 * 60 * 60 * 24)
            );
            
            if (daysSinceLastAlert < 7) {
              continue; // Skip if alert was sent recently
            }
          }

          // Send low balance email
          const language = profile.language || 'zh';
          const emailHtml = emailService.getLowBalanceEmail({
            name: profile.name || profile.email,
            balance: wallet.available_balance,
            threshold,
            language,
          });

          const result = await emailService.sendEmail({
            to: profile.email,
            subject: language === 'en' ? '⚠️ Low Wallet Balance Alert' : '⚠️ 錢包餘額不足警告',
            html: emailHtml,
          });

          if (result.success) {
            // Record that we sent the alert
            await kv.set(alertKey, {
              sent_at: new Date().toISOString(),
              balance_at_time: wallet.available_balance,
            });
            
            emailsSent++;
            console.log(`📧 Low balance alert sent to ${profile.email}`);
          } else {
            errors++;
            console.error(`❌ Failed to send low balance alert to ${profile.email}`);
          }
        }
      } catch (error) {
        errors++;
        console.error('Error processing wallet:', error);
      }
    }

    console.log(`✅ Low balance check complete: ${emailsSent} emails sent, ${errors} errors`);

    return c.json({
      success: true,
      emails_sent: emailsSent,
      errors,
    });
  } catch (error) {
    console.error('Error checking low balances:', error);
    return c.json({ error: 'Failed to check low balances' }, 500);
  }
});

// Mount payment routes
app.route("/make-server-215f78a5", paymentRoutes);

// ============= ESCROW / PAYMENT RELEASE ROUTES =============

// Get escrow by project ID
app.get("/make-server-215f78a5/payment/escrow/project/:projectId", async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('📦 [Escrow] Fetching escrow for project:', projectId);

    // Get all escrows and find the one for this project
    const allEscrowsColon = (await kv.getByPrefix('escrow:') || []).map(item => item.value);
    const allEscrowsUnderscore = (await kv.getByPrefix('escrow_') || []).map(item => item.value);
    const allEscrows = [...allEscrowsColon, ...allEscrowsUnderscore];
    
    const escrow = allEscrows.find((e: any) => e.project_id === projectId);

    if (!escrow) {
      return c.json({ error: 'Escrow not found' }, 404);
    }

    // Verify user is authorized (client or freelancer)
    if (escrow.client_id !== user.id && escrow.freelancer_id !== user.id) {
      return c.json({ error: 'Unauthorized to view this escrow' }, 403);
    }

    console.log('✅ [Escrow] Found escrow:', escrow.id, 'Status:', escrow.status);

    return c.json({ escrow });
  } catch (error) {
    console.error('❌ [Escrow] Error fetching escrow:', error);
    return c.json({ error: 'Failed to fetch escrow' }, 500);
  }
});

// Release payment from escrow (with platform fee calculation)
app.post("/make-server-215f78a5/payment/escrow/release", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { project_id } = await c.req.json();

    if (!project_id) {
      return c.json({ error: 'Missing project_id' }, 400);
    }

    console.log('💰 [Escrow Release] Processing payment release for project:', project_id);

    // Get project
    const project = await kv.get(`project:${project_id}`);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Verify user is the client
    if (project.user_id !== user.id) {
      return c.json({ error: 'Only the client can release payment' }, 403);
    }

    // Verify project status
    if (project.status !== 'pending_payment') {
      return c.json({ error: 'Project is not ready for payment release. Status: ' + project.status }, 400);
    }

    // Get escrow
    const allEscrowsColon = (await kv.getByPrefix('escrow:') || []).map(item => item.value);
    const allEscrowsUnderscore = (await kv.getByPrefix('escrow_') || []).map(item => item.value);
    const allEscrows = [...allEscrowsColon, ...allEscrowsUnderscore];
    
    const escrow = allEscrows.find((e: any) => e.project_id === project_id);

    if (!escrow) {
      return c.json({ error: 'Escrow not found' }, 404);
    }

    if (escrow.status === 'released') {
      return c.json({ error: 'Payment has already been released' }, 400);
    }

    if (escrow.status !== 'locked') {
      return c.json({ error: 'Escrow is not in locked state. Status: ' + escrow.status }, 400);
    }

    const freelancerId = escrow.freelancer_id;
    const escrowAmount = escrow.amount;

    console.log('💰 [Escrow Release] Escrow amount:', escrowAmount);
    console.log('💰 [Escrow Release] Freelancer ID:', freelancerId);

    // Get freelancer's subscription to calculate platform fee
    const subscriptionKey = `subscription_${freelancerId}`;
    const subscription = await kv.get(subscriptionKey);
    
    // 🔐 ROOT ADMIN: Check if freelancer is a root admin
    const freelancerProfile = await getProfileSafely(freelancerId);
    const freelancerEmail = freelancerProfile?.email?.toLowerCase();
    
    const ROOT_ADMIN_EMAILS = [
      'davidlai234@hotmail.com',
      'davidjosephlai@gmail.com',
      'davidjosephlai@casewhr.com',
      'davidlai117@yahoo.com.tw',
      'admin@casewhr.com',
    ];
    
    let feePercentage = 20;
    let platformFee = 0;
    let freelancerPayout = escrowAmount;
    let isRootAdmin = false;
    
    if (freelancerEmail && ROOT_ADMIN_EMAILS.includes(freelancerEmail)) {
      // 👑 根管理員完全免除平台手續費
      console.log('👑 [Escrow Release] Root admin detected:', freelancerEmail);
      console.log('👑 [Escrow Release] Platform owner - NO FEES charged!');
      
      isRootAdmin = true;
      feePercentage = 0;
      platformFee = 0;
      freelancerPayout = escrowAmount; // 100% 給管理員
    } else {
      // ✅ 只有 active 狀態的訂閱才能享受優惠手續費
      const isActiveSubscription = subscription?.status === 'active';
      const plan = (isActiveSubscription && subscription?.plan) ? subscription.plan : 'free';
      
      // Calculate platform fee based on subscription plan
      const platformFeePercentages: Record<string, number> = {
        free: 20,
        pro: 10,
        enterprise: 5,
      };
      
      feePercentage = platformFeePercentages[plan] || 20;
      platformFee = Math.round((escrowAmount * feePercentage) / 100);
      freelancerPayout = escrowAmount - platformFee;
      
      console.log('💰 [Escrow Release] Freelancer Email:', freelancerEmail);
      console.log('💰 [Escrow Release] Subscription:', subscription?.plan, 'Status:', subscription?.status);
      console.log('💰 [Escrow Release] Effective Plan:', plan, '(Active:', isActiveSubscription, ')');
    }

    console.log('💰 [Escrow Release] Fee percentage:', feePercentage + '%');
    console.log('💰 [Escrow Release] Platform fee:', platformFee);
    console.log('💰 [Escrow Release] Freelancer payout:', freelancerPayout);

    // Get client wallet
    const clientWallet = await kv.get(`wallet:${escrow.client_id}`);
    if (!clientWallet) {
      return c.json({ error: 'Client wallet not found' }, 404);
    }

    // Get or create freelancer wallet
    let freelancerWallet = await kv.get(`wallet:${freelancerId}`);
    if (!freelancerWallet) {
      console.log('📝 [Escrow Release] Creating new wallet for freelancer');
      freelancerWallet = {
        user_id: freelancerId,
        balance: 0,
        locked: 0,
        total_earned: 0,
        total_spent: 0,
        lifetime_earnings: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // Update client wallet - deduct from locked
    clientWallet.locked = (clientWallet.locked || 0) - escrowAmount;
    clientWallet.total_spent = (clientWallet.total_spent || 0) + escrowAmount;
    clientWallet.updated_at = new Date().toISOString();
    await kv.set(`wallet:${escrow.client_id}`, clientWallet);

    // Update freelancer wallet - add payout to balance
    freelancerWallet.balance = (freelancerWallet.balance || 0) + freelancerPayout;
    freelancerWallet.total_earned = (freelancerWallet.total_earned || 0) + freelancerPayout;
    freelancerWallet.lifetime_earnings = (freelancerWallet.lifetime_earnings || 0) + freelancerPayout;
    freelancerWallet.updated_at = new Date().toISOString();
    await kv.set(`wallet:${freelancerId}`, freelancerWallet);

    // Update escrow status
    escrow.status = 'released';
    escrow.released_at = new Date().toISOString();
    escrow.platform_fee = platformFee;
    escrow.freelancer_payout = freelancerPayout;
    escrow.updated_at = new Date().toISOString();
    await kv.set(`escrow:${escrow.id}`, escrow);

    // Create transaction records
    const transactionId = crypto.randomUUID();
    const transaction = {
      id: transactionId,
      escrow_id: escrow.id,
      project_id: project_id,
      from_user_id: escrow.client_id,
      to_user_id: freelancerId,
      gross_amount: escrowAmount,
      platform_fee: platformFee,
      net_amount: freelancerPayout,
      fee_percentage: feePercentage,
      freelancer_plan: plan,
      type: 'escrow_release',
      status: 'completed',
      created_at: new Date().toISOString(),
    };
    await kv.set(`transaction:${transactionId}`, transaction);

    // Update project status to completed
    project.status = 'completed';
    project.completed_at = new Date().toISOString();
    project.updated_at = new Date().toISOString();
    await kv.set(`project:${project_id}`, project);

    console.log('✅ [Escrow Release] Payment released successfully');
    console.log('✅ [Escrow Release] Transaction ID:', transactionId);
    console.log('✅ [Escrow Release] Platform earned:', platformFee);
    console.log('✅ [Escrow Release] Freelancer received:', freelancerPayout);

    // 📧 發送郵件通知給接案者（freelancer）- 收到款項
    try {
      const freelancerProfile = await kv.get(`profile_${escrow.freelancerId}`);
      
      if (freelancerProfile?.email) {
        const language = freelancerProfile.language || 'zh';
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">💰 ${language === 'en' ? 'Payment Received!' : '款項已到賬！'}</h2>
            <p>${language === 'en' ? 'Dear' : '親愛的'} ${freelancerProfile.name || freelancerProfile.email},</p>
            <p>${language === 'en' 
              ? `Great news! Payment has been released for the project "${project.title}".`
              : `好消息！項目「${project.title}」的款項已釋放。`
            }</p>
            <div style="background: #d1fae5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">${language === 'en' ? 'Payment Details' : '款項詳情'}</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>${language === 'en' ? 'Gross Amount:' : '總金額：'}</strong> $${escrowAmount.toFixed(2)}</li>
                <li><strong>${language === 'en' ? 'Platform Fee:' : '平台費用：'}</strong> $${platformFee.toFixed(2)} (${feePercentage}%)</li>
                <li style="font-size: 1.2em; color: #10b981; margin-top: 10px;">
                  <strong>${language === 'en' ? 'You Received:' : '您收到：'}</strong> $${freelancerPayout.toFixed(2)}
                </li>
              </ul>
            </div>
            <p>${language === 'en' 
              ? 'The amount has been added to your wallet. You can withdraw it anytime.'
              : '金額已添加到您的錢包。您可以隨時提現。'
            }</p>
            <p>${language === 'en' ? 'Congratulations on completing the project!' : '恭喜您完成項目！'}</p>
          </div>
        `;

        await emailService.sendEmail({
          to: freelancerProfile.email,
          subject: language === 'en' ? '💰 Payment Received!' : '💰 款項已到賬！',
          html: emailHtml,
        });
        
        console.log(`📧 Payment received email sent to freelancer ${freelancerProfile.email}`);
      }
    } catch (emailError) {
      console.error('Error sending payment received email to freelancer:', emailError);
    }

    // 📧 發送郵件通知給案主（client）- 撥款確認
    try {
      const clientProfile = await kv.get(`profile_${escrow.clientId}`);
      
      if (clientProfile?.email) {
        const language = clientProfile.language || 'zh';
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">✅ ${language === 'en' ? 'Payment Released Successfully' : '款項已成功撥出'}</h2>
            <p>${language === 'en' ? 'Dear' : '親愛的'} ${clientProfile.name || clientProfile.email},</p>
            <p>${language === 'en' 
              ? `You have successfully released payment for the project "${project.title}".`
              : `您已成功為項目「${project.title}」撥款。`
            }</p>
            <div style="background: #dbeafe; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">${language === 'en' ? 'Payment Summary' : '撥款摘要'}</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>${language === 'en' ? 'Amount Released:' : '撥款金額：'}</strong> $${escrowAmount.toFixed(2)}</li>
                <li><strong>${language === 'en' ? 'Transaction ID:' : '交易編號：'}</strong> ${transactionId}</li>
              </ul>
            </div>
            <p>${language === 'en' 
              ? 'The project is now complete. Thank you for using Case Where!'
              : '項目現已完成。感謝您使用 Case Where！'
            }</p>
            <p>${language === 'en' 
              ? 'We hope to see you again for your next project.'
              : '期待您的下一個項目。'
            }</p>
          </div>
        `;

        await emailService.sendEmail({
          to: clientProfile.email,
          subject: language === 'en' ? '✅ Payment Released Successfully' : '✅ 款項已成功撥出',
          html: emailHtml,
        });
        
        console.log(`📧 Payment released confirmation email sent to client ${clientProfile.email}`);
      }
    } catch (emailError) {
      console.error('Error sending payment released email to client:', emailError);
    }

    return c.json({
      success: true,
      message: 'Payment released successfully',
      transaction: {
        id: transactionId,
        gross_amount: escrowAmount,
        platform_fee: platformFee,
        net_amount: freelancerPayout,
        fee_percentage: feePercentage,
      },
      escrow,
    });
  } catch (error) {
    console.error('❌ [Escrow Release] Error:', error);
    return c.json({ error: 'Failed to release payment' }, 500);
  }
});

// ============= ANALYTICS ROUTES (ENTERPRISE) =============

// Get advanced analytics for current user (Enterprise only)
app.get("/make-server-215f78a5/analytics/advanced", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('📊 [Analytics] Fetching advanced analytics for user:', user.id);

    // Check if user has enterprise subscription
    const { hasEnterprise, subscription } = await checkEnterpriseSubscription(user.id);
    
    if (!hasEnterprise) {
      return c.json({ 
        error: 'Advanced analytics is only available for Enterprise plan users',
        currentPlan: subscription?.plan || 'free',
        requiredPlan: 'enterprise'
      }, 403);
    }

    // Get all projects for this user
    const allProjectsColon = (await kv.getByPrefix('project:') || []).map(item => item.value);
    const allProjectsUnderscore = (await kv.getByPrefix('project_') || []).map(item => item.value);
    const allProjects = [...allProjectsColon, ...allProjectsUnderscore];
    
    const userProjects = allProjects.filter((p: any) => 
      p.user_id === user.id || p.assigned_freelancer_id === user.id
    );

    // Get all transactions for this user
    const allTransactionsColon = (await kv.getByPrefix('transaction:') || []).map(item => item.value);
    const allTransactionsUnderscore = (await kv.getByPrefix('transaction_') || []).map(item => item.value);
    const allTransactions = [...allTransactionsColon, ...allTransactionsUnderscore];
    
    const userTransactions = allTransactions.filter((t: any) => 
      t.from_user_id === user.id || t.to_user_id === user.id
    );

    // 💱 Helper function to convert amount to TWD (數據庫預設儲存 TWD)
    const convertToTWDAnalytics = (amount: number, currency?: string): number => {
      if (!amount) return 0;
      if (!currency || currency === 'TWD') {
        return amount;
      }
      if (currency === 'USD') {
        // 使用固定匯率 1 USD = 31.29 TWD
        const EXCHANGE_RATE = 31.29;
        return amount * EXCHANGE_RATE;
      }
      // 其他幣種暫時返回原值
      return amount;
    };

    // Calculate metrics
    const totalProjects = userProjects.length;
    const activeProjects = userProjects.filter((p: any) => 
      p.status === 'open' || p.status === 'in_progress' || p.status === 'pending_payment'
    ).length;
    const completedProjects = userProjects.filter((p: any) => p.status === 'completed').length;

    // Calculate earnings and spending (統一轉換為 TWD)
    let totalEarnings = 0;
    let totalSpending = 0;
    let platformFeesSaved = 0;

    userTransactions.forEach((t: any) => {
      if (t.to_user_id === user.id) {
        const netAmountTWD = convertToTWDAnalytics(t.net_amount || 0, t.currency);
        totalEarnings += netAmountTWD;
        const freeplanFee = Math.round((netAmountTWD / (100 - (t.fee_percentage || 20))) * 20);
        const actualFeeTWD = convertToTWDAnalytics(t.platform_fee || 0, t.currency);
        platformFeesSaved += (freeplanFee - actualFeeTWD);
      }
      if (t.from_user_id === user.id) {
        const grossAmountTWD = convertToTWDAnalytics(t.gross_amount || 0, t.currency);
        totalSpending += grossAmountTWD;
      }
    });

    const averageProjectValue = totalProjects > 0 ? totalSpending / totalProjects : 0;

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthTransactions = userTransactions.filter((t: any) => {
        const tDate = new Date(t.created_at);
        return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
      });
      
      const monthEarnings = monthTransactions
        .filter((t: any) => t.to_user_id === user.id)
        .reduce((sum: number, t: any) => sum + convertToTWDAnalytics(t.net_amount || 0, t.currency), 0);
      
      const monthSpending = monthTransactions
        .filter((t: any) => t.from_user_id === user.id)
        .reduce((sum: number, t: any) => sum + convertToTWDAnalytics(t.gross_amount || 0, t.currency), 0);
      
      const monthProjects = userProjects.filter((p: any) => {
        const pDate = new Date(p.created_at);
        return pDate.getMonth() === date.getMonth() && pDate.getFullYear() === date.getFullYear();
      }).length;
      
      monthlyTrend.push({
        month: monthName,
        earnings: monthEarnings,
        spending: monthSpending,
        projects: monthProjects,
      });
    }

    // Projects by status (轉換項目預算為 TWD)
    const statusCounts: any = {};
    userProjects.forEach((p: any) => {
      const status = p.status || 'unknown';
      if (!statusCounts[status]) {
        statusCounts[status] = { status, count: 0, value: 0 };
      }
      statusCounts[status].count++;
      const projectBudget = p.budget_max || p.budget_min || 0;
      statusCounts[status].value += convertToTWDAnalytics(projectBudget, p.currency);
    });
    
    const projectsByStatus = Object.values(statusCounts);

    // Top categories (轉換項目預算為 TWD)
    const categoryCounts: any = {};
    userProjects.forEach((p: any) => {
      const category = p.category || 'Other';
      if (!categoryCounts[category]) {
        categoryCounts[category] = { category, count: 0, value: 0 };
      }
      categoryCounts[category].count++;
      const projectBudget = p.budget_max || p.budget_min || 0;
      categoryCounts[category].value += convertToTWDAnalytics(projectBudget, p.currency);
    });
    
    const topCategories = Object.values(categoryCounts)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);

    const analytics = {
      totalProjects,
      totalEarnings,
      totalSpending,
      averageProjectValue,
      platformFeesSaved,
      activeProjects,
      completedProjects,
      monthlyTrend,
      projectsByStatus,
      topCategories,
    };

    console.log('✅ [Analytics] Advanced analytics calculated for user', user.id, '(all amounts in TWD):', {
      totalProjects,
      totalEarnings: `NT$${Math.round(totalEarnings)}`,
      totalSpending: `NT$${Math.round(totalSpending)}`,
      averageProjectValue: `NT$${Math.round(averageProjectValue)}`,
      platformFeesSaved: `NT$${Math.round(platformFeesSaved)}`,
      activeProjects,
      completedProjects,
      transactions_count: userTransactions.length,
      projects_count: userProjects.length,
    });

    return c.json({ analytics });
  } catch (error) {
    console.error('❌ [Analytics] Error:', error);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

// ============= TEAM MANAGEMENT ROUTES (ENTERPRISE) =============

// Get team members (Enterprise only)
app.get("/make-server-215f78a5/team/members", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user has enterprise subscription
    const subscriptionKey = `subscription_${user.id}`;
    const subscription = await kv.get(subscriptionKey);
    
    // ✅ 必須是 enterprise 且狀態為 active
    if (!subscription || subscription.plan !== 'enterprise' || subscription.status !== 'active') {
      return c.json({ 
        error: 'Team management is only available for active Enterprise plan users',
        currentPlan: subscription?.plan || 'free',
        currentStatus: subscription?.status || 'none',
        requiredPlan: 'enterprise'
      }, 403);
    }

    // Get team members for this user's organization - using only colon prefix to avoid duplicates
    const allTeamMembers = (await kv.getByPrefix('team_member:') || []).map(item => item.value);
    
    const teamMembers = allTeamMembers.filter((m: any) => m.organization_owner_id === user.id);

    // Add owner as first member
    const profile = await kv.get(`profile_${user.id}`);  // 統一使用下劃線格式
    const ownerMember = {
      id: `owner-${user.id}`, // Use unique prefix to avoid key conflicts
      email: user.email,
      full_name: profile?.full_name || profile?.name,
      role: 'owner',
      status: 'active',
      added_at: profile?.created_at || new Date().toISOString(),
      added_by: user.id,
    };
    
    // Filter out any team members with same email as owner to prevent duplicates
    const filteredTeamMembers = teamMembers.filter((m: any) => m.email !== user.email);
    
    // Remove duplicates by ID just in case
    const uniqueTeamMembers = Array.from(
      new Map(filteredTeamMembers.map((m: any) => [m.id, m])).values()
    );
    
    const members = [
      ownerMember,
      ...uniqueTeamMembers,
    ];

    return c.json({ members });
  } catch (error) {
    console.error('❌ [Team] Error fetching team members:', error);
    return c.json({ error: 'Failed to fetch team members' }, 500);
  }
});

// Invite team member (Enterprise only)
app.post("/make-server-215f78a5/team/invite", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user has enterprise subscription
    const subscriptionKey = `subscription_${user.id}`;
    const subscription = await kv.get(subscriptionKey);
    
    console.log('🔍 [Team Invite] Checking subscription for user:', user.id);
    console.log('📊 [Team Invite] Subscription data:', subscription);
    
    // ✅ 必須是 enterprise 且狀態為 active
    if (!subscription || subscription.plan !== 'enterprise' || subscription.status !== 'active') {
      console.log('❌ [Team Invite] Access denied - Plan:', subscription?.plan, 'Status:', subscription?.status);
      return c.json({ 
        error: 'Team management is only available for active Enterprise plan users',
        currentPlan: subscription?.plan || 'free',
        currentStatus: subscription?.status || 'none',
        requiredPlan: 'enterprise'
      }, 403);
    }
    
    console.log('✅ [Team Invite] Enterprise plan verified');

    const { email, role } = await c.req.json();

    if (!email || !role) {
      return c.json({ error: 'Email and role are required' }, 400);
    }

    // Validate role
    if (!['admin', 'member'].includes(role)) {
      return c.json({ error: 'Invalid role. Must be admin or member' }, 400);
    }

    // Check if member already exists - using only colon prefix
    const allTeamMembers = (await kv.getByPrefix('team_member:') || []).map(item => item.value);
    
    const existingMember = allTeamMembers.find((m: any) => 
      m.organization_owner_id === user.id && m.email === email
    );

    if (existingMember) {
      return c.json({ error: 'This email is already a team member' }, 400);
    }

    // Create team member invitation
    const memberId = crypto.randomUUID();
    console.log('🔑 [Team Invite API] Generated Member ID:', memberId);
    
    const teamMember = {
      id: memberId,
      email,
      role,
      status: 'invited',
      organization_owner_id: user.id,
      added_by: user.id,
      added_at: new Date().toISOString(),
    };

    console.log('💾 [Team Invite API] Attempting to save to KV store with key:', `team_member:${memberId}`);
    console.log('💾 [Team Invite API] Team member data:', JSON.stringify(teamMember));
    
    await kv.set(`team_member:${memberId}`, teamMember);
    
    console.log('✅ [Team Invite API] KV set completed');
    
    // Verify it was saved
    const verifyRead = await kv.get(`team_member:${memberId}`);
    console.log('🔍 [Team Invite API] Verification read result:', verifyRead ? 'FOUND' : 'NOT FOUND');
    if (verifyRead) {
      console.log('🔍 [Team Invite API] Verified data:', JSON.stringify(verifyRead));
    } else {
      console.error('❌ [Team Invite API] CRITICAL: Failed to verify saved invitation!');
    }

    console.log('✅ [Team] Team member invited:', email);

    // Send invitation email
    try {
      console.log('📧 [Team Invite API] Preparing to send invitation email...');
      console.log('📧 [Team Invite API] User ID (owner):', user.id);
      console.log('📧 [Team Invite API] Member ID:', memberId);
      console.log('📧 [Team Invite API] Target email:', email);
      console.log('📧 [Team Invite API] Role:', role);
      
      // 🔧 Add error handling for profile fetch
      let ownerName = user.email;
      try {
        const profile = await kv.get(`profile_${user.id}`);  // 統一使用下劃線格式
        ownerName = profile?.full_name || profile?.name || user.email;
        console.log('📧 [Team Invite API] Owner name from profile:', ownerName);
      } catch (profileError) {
        console.warn('⚠️ [Team Invite API] Failed to fetch owner profile, using email as fallback:', profileError);
        // Continue with email as fallback name
      }
      
      console.log('📧 [Team Invite API] Calling sendTeamInvitationEmail with ownerId:', user.id);
      console.log('📧 [Team Invite API] Invitation parameters:', {
        to: email,
        inviterName: ownerName,
        role: role,
        inviteId: memberId,
        ownerId: user.id
      });
      
      await sendTeamInvitationEmail({
        to: email,
        inviterName: ownerName,
        role: role,
        inviteId: memberId,
        ownerId: user.id, // Pass owner ID to fetch branding
      });
      
      console.log('✅ [Team Invite API] Invitation email sent successfully to:', email);
    } catch (emailError) {
      console.error('❌ [Team Invite API] Failed to send invitation email:', emailError);
      console.error('❌ [Team Invite API] Error stack:', emailError instanceof Error ? emailError.stack : 'No stack trace');
      // Don't fail the request if email fails
    }

    return c.json({ success: true, member: teamMember });
  } catch (error) {
    console.error('❌ [Team] Error inviting member:', error);
    return c.json({ error: 'Failed to invite team member' }, 500);
  }
});

// Update team member role (Enterprise only)
app.put("/make-server-215f78a5/team/members/:memberId/role", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const memberId = c.req.param('memberId');
    const { role } = await c.req.json();

    if (!role || !['admin', 'member'].includes(role)) {
      return c.json({ error: 'Invalid role. Must be admin or member' }, 400);
    }

    // Get team member
    const member = await kv.get(`team_member:${memberId}`);
    
    if (!member) {
      return c.json({ error: 'Team member not found' }, 404);
    }

    // Verify user is the organization owner or admin
    if (member.organization_owner_id !== user.id) {
      return c.json({ error: 'Unauthorized to update this team member' }, 403);
    }

    // Update role
    member.role = role;
    member.updated_at = new Date().toISOString();
    await kv.set(`team_member:${memberId}`, member);

    console.log('✅ [Team] Team member role updated:', memberId, 'to', role);

    return c.json({ success: true, member });
  } catch (error) {
    console.error('❌ [Team] Error updating member role:', error);
    return c.json({ error: 'Failed to update team member role' }, 500);
  }
});

// Remove team member (Enterprise only)
app.delete("/make-server-215f78a5/team/members/:memberId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const memberId = c.req.param('memberId');

    // Get team member
    const member = await kv.get(`team_member:${memberId}`);
    
    if (!member) {
      return c.json({ error: 'Team member not found' }, 404);
    }

    // Verify user is the organization owner
    if (member.organization_owner_id !== user.id) {
      return c.json({ error: 'Unauthorized to remove this team member' }, 403);
    }

    // Delete team member
    await kv.del(`team_member:${memberId}`);

    console.log('✅ [Team] Team member removed:', memberId);

    return c.json({ success: true });
  } catch (error) {
    console.error('❌ [Team] Error removing member:', error);
    return c.json({ error: 'Failed to remove team member' }, 500);
  }
});

// 🔍 DEBUG: Check if invitation exists in database
app.get("/make-server-215f78a5/team/debug/invitation/:inviteId", async (c) => {
  try {
    const inviteId = c.req.param('inviteId');
    
    console.log('🔍 [DEBUG] Checking invitation:', inviteId);
    
    // Try to get the invitation
    const invitation = await kv.get(`team_member:${inviteId}`);
    
    console.log('🔍 [DEBUG] Invitation found:', !!invitation);
    console.log('🔍 [DEBUG] Invitation data:', invitation);
    
    // Also check all team members to see what's in the database
    const allTeamMembers = (await kv.getByPrefix('team_member:') || []).map(item => item.value);
    console.log('🔍 [DEBUG] Total team members in database:', allTeamMembers.length);
    
    // Find any invitations with similar IDs
    const similarInvites = allTeamMembers.filter((m: any) => 
      m.id && m.id.includes(inviteId.substring(0, 8))
    );
    
    console.log('🔍 [DEBUG] Similar invitations:', similarInvites);
    
    return c.json({
      inviteId,
      found: !!invitation,
      invitation: invitation || null,
      totalTeamMembers: allTeamMembers.length,
      similarInvites: similarInvites.map((m: any) => ({
        id: m.id,
        email: m.email,
        status: m.status,
        created: m.added_at
      })),
      allInviteIds: allTeamMembers.map((m: any) => m.id)
    });
  } catch (error) {
    console.error('❌ [DEBUG] Error checking invitation:', error);
    return c.json({ error: 'Debug check failed', details: String(error) }, 500);
  }
});

// 🧪 PUBLIC TEST: Check environment variables
app.get("/make-server-215f78a5/team/test/check-env", async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  return c.json({
    SUPABASE_URL: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'NOT SET',
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey ? `${serviceRoleKey.substring(0, 20)}... (length: ${serviceRoleKey.length})` : 'NOT SET',
    SUPABASE_ANON_KEY: anonKey ? `${anonKey.substring(0, 20)}... (length: ${anonKey.length})` : 'NOT SET',
  });
});

// 🧪 PUBLIC TEST: Test direct database connection
app.get("/make-server-215f78a5/team/test/db-connection", async (c) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      return c.json({
        success: false,
        error: 'Environment variables not set',
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceRoleKey
      });
    }
    
    // Try to connect and query the KV store table
    const testClient = createClient(supabaseUrl, serviceRoleKey);
    
    const { data, error, count } = await testClient
      .from('kv_store_215f78a5')
      .select('key', { count: 'exact', head: false })
      .limit(5);
    
    if (error) {
      return c.json({
        success: false,
        error: 'Database query failed',
        errorMessage: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint
      });
    }
    
    return c.json({
      success: true,
      message: 'Database connection successful',
      totalRows: count,
      sampleKeys: data?.map((d: any) => d.key) || []
    });
    
  } catch (error) {
    return c.json({
      success: false,
      error: 'Exception occurred',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 500);
  }
});

// 🧪 PUBLIC TEST: List all team invitations (for debugging)
app.get("/make-server-215f78a5/team/test/list-all-invitations", async (c) => {
  try {
    console.log('🧪 [TEST] Listing all team invitations...');
    console.log('🧪 [TEST] SUPABASE_SERVICE_ROLE_KEY exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    
    const allTeamMembers = (await kv.getByPrefix('team_member:') || []).map(item => item.value);
    
    console.log('🧪 [TEST] Found team members:', allTeamMembers.length);
    
    return c.json({
      success: true,
      total: allTeamMembers.length,
      invitations: allTeamMembers.map((m: any) => ({
        id: m.id,
        email: m.email,
        status: m.status,
        role: m.role,
        added_at: m.added_at
      }))
    });
  } catch (error) {
    console.error('❌ [TEST] Error listing invitations:', error);
    console.error('❌ [TEST] Error details:', error instanceof Error ? error.message : String(error));
    console.error('❌ [TEST] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return c.json({ 
      success: false,
      error: 'Failed to list invitations', 
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 500);
  }
});

// Accept team invitation
app.post("/make-server-215f78a5/team/accept-invitation/:inviteId", async (c) => {
  try {
    // 🔧 FIX: Support dev mode with X-Dev-Token header
    const devToken = c.req.header('X-Dev-Token');
    let accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // If dev token is provided, use it as the access token
    if (devToken && devToken.startsWith('dev-user-')) {
      accessToken = devToken;
      console.log('🧪 [Accept Invitation] Using dev token from X-Dev-Token header');
    }
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const inviteId = c.req.param('inviteId');
    
    console.log('🔍 [Accept Invitation] Attempting to accept invitation:', inviteId);
    console.log('🔍 [Accept Invitation] User email:', user.email);
    console.log('🔍 [Accept Invitation] Looking for key:', `team_member:${inviteId}`);
    
    // Get the invitation
    let invitation = await kv.get(`team_member:${inviteId}`);
    
    console.log('🔍 [Accept Invitation] Invitation found:', !!invitation);
    
    // 🔧 FIX: If invitation not found in database, try to rebuild from request body
    if (!invitation) {
      console.warn('⚠️  [Accept Invitation] Invitation not found in database, attempting to rebuild from request...');
      
      try {
        const body = await c.req.json();
        console.log('📤 [Accept Invitation] Request body:', body);
        
        if (body.email && body.role) {
          // Verify the email matches the logged-in user
          if (body.email !== user.email) {
            return c.json({ error: 'This invitation is not for your email address' }, 403);
          }
          
          // Try to find any enterprise user as organization owner
          console.log('🔍 [Accept Invitation] Searching for enterprise subscription owners...');
          const allSubscriptions = (await kv.getByPrefix('subscription_') || []).map(item => item.value);
          let organizationOwnerId: string | null = null;
          
          for (const sub of allSubscriptions) {
            if (sub.tier === 'enterprise' && sub.user_id) {
              organizationOwnerId = sub.user_id;
              console.log('✅ [Accept Invitation] Found enterprise owner:', organizationOwnerId);
              break;
            }
          }
          
          if (!organizationOwnerId) {
            console.warn('⚠️ [Accept Invitation] No enterprise owner found, but accepting anyway...');
            // 🔥 CRITICAL FIX: Create a temporary organization owner reference
            // The real owner will be linked when they next log in
            organizationOwnerId = 'pending-enterprise-owner';
          }
          
          // Rebuild the invitation
          invitation = {
            id: inviteId,
            email: body.email,
            role: body.role,
            status: 'invited',
            organization_owner_id: organizationOwnerId,
            organization_name: body.organization_name || 'Team',
            inviter_name: body.inviter_name || 'Team Admin',
            added_by: organizationOwnerId,
            added_at: new Date().toISOString(),
            rebuilt: true,
            source: 'email_link'
          };
          
          console.log('✅ [Accept Invitation] Rebuilt invitation from email parameters:', invitation);
        } else {
          console.error('❌ [Accept Invitation] Cannot rebuild: missing email or role in request body');
          return c.json({ error: 'Invitation not found' }, 404);
        }
      } catch (parseError) {
        console.error('❌ [Accept Invitation] Failed to parse request body:', parseError);
        return c.json({ error: 'Invitation not found' }, 404);
      }
    }
    
    if (!invitation) {
      console.error('❌ [Accept Invitation] Invitation not found and could not be rebuilt');
      
      // Debug: Check if any invitations exist
      const allInvites = (await kv.getByPrefix('team_member:') || []).map(item => item.value);
      console.log('🔍 [Accept Invitation] Total invitations in database:', allInvites.length);
      console.log('🔍 [Accept Invitation] All invitation IDs:', allInvites.map((i: any) => i.id));
      
      return c.json({ 
        error: 'Invitation not found',
        debug: {
          inviteId,
          totalInvitations: allInvites.length,
          allIds: allInvites.map((i: any) => i.id)
        }
      }, 404);
    }
    
    console.log('✅ [Accept Invitation] Invitation data:', invitation);

    // Verify the invitation is for this user's email
    if (invitation.email !== user.email) {
      return c.json({ error: 'This invitation is not for your email address' }, 403);
    }

    // Check if invitation is still pending
    if (invitation.status !== 'invited') {
      return c.json({ 
        error: 'This invitation has already been processed',
        status: invitation.status 
      }, 400);
    }

    // Update invitation status to active
    invitation.status = 'active';
    invitation.accepted_at = new Date().toISOString();
    invitation.user_id = user.id; // Link to actual user account
    
    await kv.set(`team_member:${inviteId}`, invitation);

    console.log('✅ [Team] Invitation accepted:', inviteId, 'by user:', user.email);

    // Get organization owner's profile to send confirmation
    try {
      const ownerProfile = await kv.get(`profile_${invitation.organization_owner_id}`);  // 統一使用下劃線格式
      const memberProfile = await kv.get(`profile_${user.id}`);
      
      // You could send a confirmation email to the organization owner here
      console.log(`📧 [Team] Sending confirmation to organization owner: ${ownerProfile?.email}`);
    } catch (emailError) {
      console.error('⚠️ [Team] Failed to send confirmation email:', emailError);
    }

    return c.json({ 
      success: true, 
      member: invitation,
      message: 'You have successfully joined the team!' 
    });
  } catch (error) {
    console.error('❌ [Team] Error accepting invitation:', error);
    return c.json({ error: 'Failed to accept invitation' }, 500);
  }
});

// Get invitation details (public endpoint for email links)
app.get("/make-server-215f78a5/team/invitation/:inviteId", async (c) => {
  try {
    const inviteId = c.req.param('inviteId');
    
    // Get the invitation
    const invitation = await kv.get(`team_member:${inviteId}`);
    
    if (!invitation) {
      return c.json({ error: 'Invitation not found' }, 404);
    }

    // Only return limited information for pending invitations
    if (invitation.status !== 'invited') {
      return c.json({ 
        error: 'This invitation has already been processed',
        status: invitation.status 
      }, 400);
    }

    // Get organization owner's profile for display
    try {
      const ownerProfile = await kv.get(`profile_${invitation.organization_owner_id}`);  // 統一使用下劃線格式
      
      // Return only safe information
      return c.json({ 
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          organization_name: ownerProfile?.company || ownerProfile?.full_name || 'Unknown Organization',
          inviter_name: ownerProfile?.full_name || ownerProfile?.name || 'Unknown',
          created_at: invitation.created_at,
        }
      });
    } catch (error) {
      console.error('Error fetching owner profile:', error);
      return c.json({ 
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          organization_name: 'Unknown Organization',
          inviter_name: 'Unknown',
          created_at: invitation.created_at,
        }
      });
    }
  } catch (error) {
    console.error('❌ [Team] Error fetching invitation:', error);
    return c.json({ error: 'Failed to fetch invitation' }, 500);
  }
});

// Get pending invitations for current user
app.get("/make-server-215f78a5/team/my-invitations", async (c) => {
  try {
    // 🔧 FIX: Support dev mode with X-Dev-Token header
    const devToken = c.req.header('X-Dev-Token');
    let accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // If dev token is provided, use it as the access token
    if (devToken && devToken.startsWith('dev-user-')) {
      accessToken = devToken;
      console.log('🧪 [Team Invitations] Using dev token from X-Dev-Token header');
    }
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all team member records - using only colon prefix to avoid duplicates
    const allTeamMembers = (await kv.getByPrefix('team_member:') || []).map(item => item.value);

    // Filter invitations for this user's email that are pending
    const myInvitations = allTeamMembers.filter((m: any) => 
      m.email === user.email && m.status === 'invited'
    );

    // Enrich with organization owner information
    const enrichedInvitations = await Promise.all(
      myInvitations.map(async (inv: any) => {
        try {
          const ownerProfile = await kv.get(`profile_${inv.organization_owner_id}`);  // 統一使用下劃線格式
          return {
            ...inv,
            organization_name: ownerProfile?.company || ownerProfile?.full_name || 'Unknown Organization',
            inviter_name: ownerProfile?.full_name || ownerProfile?.name || 'Unknown',
          };
        } catch (error) {
          console.error('Error fetching owner profile:', error);
          return {
            ...inv,
            organization_name: 'Unknown Organization',
            inviter_name: 'Unknown',
          };
        }
      })
    );

    console.log(`📬 [Team] Found ${enrichedInvitations.length} pending invitations for ${user.email}`);

    return c.json({ invitations: enrichedInvitations });
  } catch (error) {
    console.error('❌ [Team] Error fetching invitations:', error);
    return c.json({ error: 'Failed to fetch invitations' }, 500);
  }
});

// Get team member profile details
app.get("/make-server-215f78a5/team/member/:userId/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const targetUserId = c.req.param('userId');
    
    // Get the target user's profile - using underscore format (統一格式)
    let profile = await kv.get(`profile_${targetUserId}`);
    if (!profile) {
      // Fallback to colon format for backward compatibility
      profile = await kv.get(`profile:${targetUserId}`);
    }

    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    console.log('�� [Team] Retrieved member profile:', targetUserId);

    // Return safe profile information with all available details
    return c.json({ 
      profile: {
        id: profile.id || profile.user_id,
        user_id: profile.user_id,
        email: profile.email,
        full_name: profile.full_name || profile.name,
        phone: profile.phone,
        location: profile.location,
        company: profile.company,
        job_title: profile.job_title,
        bio: profile.bio,
        skills: typeof profile.skills === 'string' ? profile.skills.split(',').map((s: string) => s.trim()) : (profile.skills || []),
        rating: profile.rating,
        completed_projects: profile.completed_projects,
        avatar_url: profile.avatar_url,
        website: profile.website,
        is_client: profile.is_client,
        is_freelancer: profile.is_freelancer,
        account_type: profile.account_type,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        language: profile.language,
        hourly_rate: profile.hourly_rate,
        availability: profile.availability,
      }
    });
  } catch (error) {
    console.error('❌ [Team] Error fetching member profile:', error);
    return c.json({ error: 'Failed to fetch member profile' }, 500);
  }
});

// Send message to team member
app.post("/make-server-215f78a5/team/send-message", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { recipient_email, recipient_name, subject, message } = await c.req.json();

    if (!recipient_email || !subject || !message) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Get sender's profile - using underscore format (統一格式)
    let senderProfile = await kv.get(`profile_${user.id}`);
    if (!senderProfile) {
      // Fallback to colon format for backward compatibility
      senderProfile = await kv.get(`profile:${user.id}`);
    }

    const senderName = senderProfile?.full_name || senderProfile?.name || user.email;

    // Send email using Brevo
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #9333ea 0%, #db2777 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .message-box { background: #f9fafb; padding: 20px; border-left: 4px solid #9333ea; margin: 20px 0; border-radius: 4px; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
          .sender-info { background: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📬 Team Message</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Case Where 團隊訊息</p>
          </div>
          <div class="content">
            <div class="sender-info">
              <p style="margin: 0;"><strong>From / 來自:</strong> ${senderName}</p>
              <p style="margin: 5px 0 0 0;"><strong>Email:</strong> ${user.email}</p>
            </div>
            
            <h2 style="color: #9333ea; margin-top: 0;">${subject}</h2>
            
            <div class="message-box">
              <p style="white-space: pre-wrap; margin: 0;">${message}</p>
            </div>
            
            <div style="background: #e0f2fe; padding: 15px; border-radius: 6px; margin-top: 30px; border-left: 4px solid #0284c7;">
              <p style="margin: 0; color: #0c4a6e; font-size: 14px;">
                💡 <strong>How to Reply / 如何回覆:</strong>
              </p>
              <p style="margin: 8px 0 0 0; color: #075985; font-size: 13px; line-height: 1.6;">
                <strong>English:</strong> Simply click "Reply" in your email client. Your response will be sent directly to <strong>${user.email}</strong>.<br>
                <strong>中文:</strong> 只需點擊您��件客戶端的「回覆」按鈕，您的回覆將直接發送到 <strong>${user.email}</strong>。
              </p>
            </div>
          </div>
          <div class="footer">
            <p>This message was sent via Case Where Team Management System</p>
            <p>此訊息透過 Case Where 團隊管理系統發送</p>
            <p style="margin-top: 10px;">
              <a href="https://casewhr.com" style="color: #9333ea;">casewhr.com</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { sendEmail } = await import('./email_service_brevo.tsx');
    const result = await sendEmail({
      to: recipient_email,
      subject: `[Case Where] ${subject}`,
      html: emailHtml,
      replyTo: user.email, // 🔧 設置回覆地址為發件人（案主）的郵箱
    });

    if (result.success) {
      console.log('✅ [Team] Message sent to:', recipient_email);
      console.log('✅ [Team] Reply-to set to:', user.email);
      return c.json({ 
        success: true,
        message: 'Message sent successfully' 
      });
    } else {
      console.error('❌ [Team] Failed to send message:', result.error);
      return c.json({ error: result.error || 'Failed to send message' }, 500);
    }
  } catch (error) {
    console.error('❌ [Team] Error sending message:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// ============= PREMIUM TALENT CONTACT LIMITS =============

// Check if user can contact premium talents this month
app.get("/make-server-215f78a5/premium-contacts/check", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user profile to check subscription
    const profile = await kv.get(`profile:${user.id}`);
    const subscriptionPlan = profile?.subscription_plan || 'free';

    // Pro and Enterprise users have unlimited contacts
    if (subscriptionPlan === 'pro' || subscriptionPlan === 'enterprise') {
      return c.json({ 
        canContact: true,
        isUnlimited: true,
        subscriptionPlan,
        contactsThisMonth: 0,
        limit: -1
      });
    }

    // Free users get 1 contact per month
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const contactKey = `premium_contact:${user.id}:${yearMonth}`;
    
    const contacts = await kv.get(contactKey) || [];
    const contactCount = Array.isArray(contacts) ? contacts.length : 0;

    return c.json({
      canContact: contactCount < 1,
      isUnlimited: false,
      subscriptionPlan,
      contactsThisMonth: contactCount,
      limit: 1
    });
  } catch (error) {
    console.error('❌ [Premium Contacts] Error checking contact limit:', error);
    return c.json({ error: 'Failed to check contact limit' }, 500);
  }
});

// Record a premium talent contact
app.post("/make-server-215f78a5/premium-contacts/record", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { talentUserId } = await c.req.json();
    
    if (!talentUserId) {
      return c.json({ error: 'Talent user ID is required' }, 400);
    }

    // Get user profile to check subscription
    const profile = await kv.get(`profile:${user.id}`);
    const subscriptionPlan = profile?.subscription_plan || 'free';

    // Pro and Enterprise users don't need recording (unlimited)
    if (subscriptionPlan === 'pro' || subscriptionPlan === 'enterprise') {
      return c.json({ 
        success: true,
        message: 'Contact recorded (unlimited)',
        isUnlimited: true
      });
    }

    // Record contact for free users
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const contactKey = `premium_contact:${user.id}:${yearMonth}`;
    
    const contacts = await kv.get(contactKey) || [];
    const contactArray = Array.isArray(contacts) ? contacts : [];
    
    // Check if already at limit
    if (contactArray.length >= 1) {
      return c.json({ 
        error: 'Monthly contact limit reached',
        contactsThisMonth: contactArray.length,
        limit: 1
      }, 403);
    }

    // Add new contact record
    contactArray.push({
      talentUserId,
      contactedAt: new Date().toISOString(),
      userEmail: user.email
    });

    await kv.set(contactKey, contactArray);

    console.log(`✅ [Premium Contacts] Recorded contact: ${user.email} -> ${talentUserId}`);

    return c.json({ 
      success: true,
      message: 'Contact recorded successfully',
      contactsThisMonth: contactArray.length,
      limit: 1
    });
  } catch (error) {
    console.error('❌ [Premium Contacts] Error recording contact:', error);
    return c.json({ error: 'Failed to record contact' }, 500);
  }
});

// ============= ACCOUNT MANAGER ROUTES (ENTERPRISE) =============

// Get assigned account manager (Enterprise only)
app.get("/make-server-215f78a5/account-manager", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user has enterprise subscription
    const { hasEnterprise, subscription } = await checkEnterpriseSubscription(user.id);
    
    if (!hasEnterprise) {
      return c.json({ 
        error: 'Account manager is only available for Enterprise plan users',
        currentPlan: subscription?.plan || 'free',
        requiredPlan: 'enterprise'
      }, 403);
    }

    // Get account manager assignment
    const assignment = await kv.get(`account_manager_assignment:${user.id}`);
    
    if (!assignment || !assignment.manager_id) {
      // No manager assigned yet, assign default manager
      const defaultManager = {
        id: 'default-manager-1',
        name: 'Sarah Chen',
        email: 'sarah.chen@casewhr.com',
        phone: '+886-2-1234-5678',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        title: 'Senior Account Manager',
        specialties: ['Enterprise Solutions', 'Team Management', 'Business Strategy'],
        languages: ['English', '中文', 'Japanese'],
        timezone: 'Asia/Taipei (UTC+8)',
        availability: 'Mon-Fri 9:00-18:00 TST',
      };

      const newAssignment = {
        user_id: user.id,
        manager_id: defaultManager.id,
        assigned_at: new Date().toISOString(),
      };

      await kv.set(`account_manager_assignment:${user.id}`, newAssignment);
      await kv.set(`account_manager:${defaultManager.id}`, defaultManager);

      console.log('✅ [Account Manager] Assigned default manager to user:', user.id);

      return c.json({ 
        manager: defaultManager,
        contactHistory: []
      });
    }

    // Get manager details
    const manager = await kv.get(`account_manager:${assignment.manager_id}`);

    // Get contact history
    const allContactsColon = (await kv.getByPrefix('account_manager_contact:') || []).map(item => item.value);
    const allContactsUnderscore = (await kv.getByPrefix('account_manager_contact_') || []).map(item => item.value);
    const allContacts = [...allContactsColon, ...allContactsUnderscore];
    
    const contactHistory = allContacts
      .filter((c: any) => c.user_id === user.id)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return c.json({ manager, contactHistory });
  } catch (error) {
    console.error('❌ [Account Manager] Error fetching manager:', error);
    return c.json({ error: 'Failed to fetch account manager' }, 500);
  }
});

// Send message to account manager (Enterprise only)
app.post("/make-server-215f78a5/account-manager/contact", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user has enterprise subscription
    const { hasEnterprise, subscription } = await checkEnterpriseSubscription(user.id);
    
    if (!hasEnterprise) {
      return c.json({ 
        error: 'Account manager is only available for Enterprise plan users',
        currentPlan: subscription?.plan || 'free',
        requiredPlan: 'enterprise'
      }, 403);
    }

    const { message } = await c.req.json();

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Get manager assignment
    const assignment = await kv.get(`account_manager_assignment:${user.id}`);
    
    if (!assignment) {
      return c.json({ error: 'No account manager assigned' }, 404);
    }

    // Create contact record
    const contactId = crypto.randomUUID();
    const contact = {
      id: contactId,
      user_id: user.id,
      manager_id: assignment.manager_id,
      message,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    await kv.set(`account_manager_contact:${contactId}`, contact);

    console.log('✅ [Account Manager] Message sent from user:', user.id, 'to manager:', assignment.manager_id);

    // TODO: Send email notification to account manager

    return c.json({ success: true, contact });
  } catch (error) {
    console.error('❌ [Account Manager] Error sending message:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// ============= API KEY MANAGEMENT ROUTES (ENTERPRISE) =============

// Get all API keys for current user (Enterprise only)
app.get("/make-server-215f78a5/api-keys", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user has enterprise subscription
    const { hasEnterprise, subscription } = await checkEnterpriseSubscription(user.id);
    
    if (!hasEnterprise) {
      return c.json({ 
        error: 'API access is only available for Enterprise plan users',
        currentPlan: subscription?.plan || 'free',
        requiredPlan: 'enterprise'
      }, 403);
    }

    // Get API keys for this user
    const allKeysColon = (await kv.getByPrefix('api_key:') || []).map(item => item.value);
    const allKeysUnderscore = (await kv.getByPrefix('api_key_') || []).map(item => item.value);
    const allKeys = [...allKeysColon, ...allKeysUnderscore];
    
    const userKeys = allKeys
      .filter((k: any) => k.user_id === user.id)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return c.json({ keys: userKeys });
  } catch (error) {
    console.error('❌ [API Keys] Error fetching keys:', error);
    return c.json({ error: 'Failed to fetch API keys' }, 500);
  }
});

// Create new API key (Enterprise only)
app.post("/make-server-215f78a5/api-keys", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user has enterprise subscription
    const { hasEnterprise, subscription } = await checkEnterpriseSubscription(user.id);
    
    if (!hasEnterprise) {
      return c.json({ 
        error: 'API access is only available for Enterprise plan users',
        currentPlan: subscription?.plan || 'free',
        requiredPlan: 'enterprise'
      }, 403);
    }

    const { name } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Key name is required' }, 400);
    }

    // Generate API key: cw_live_ + random string
    const randomString = crypto.randomUUID().replace(/-/g, '');
    const apiKey = `cw_live_${randomString}`;

    const keyId = crypto.randomUUID();
    const key = {
      id: keyId,
      user_id: user.id,
      name,
      key: apiKey,
      status: 'active',
      created_at: new Date().toISOString(),
      requests_count: 0,
    };

    await kv.set(`api_key:${keyId}`, key);
    await kv.set(`api_key_lookup:${apiKey}`, keyId);

    console.log('✅ [API Keys] Created new API key:', keyId, 'for user:', user.id);

    return c.json({ success: true, key });
  } catch (error) {
    console.error('❌ [API Keys] Error creating key:', error);
    return c.json({ error: 'Failed to create API key' }, 500);
  }
});

// Revoke API key (Enterprise only)
app.delete("/make-server-215f78a5/api-keys/:keyId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const keyId = c.req.param('keyId');

    // Get API key
    const key = await kv.get(`api_key:${keyId}`);
    
    if (!key) {
      return c.json({ error: 'API key not found' }, 404);
    }

    // Verify user owns this key
    if (key.user_id !== user.id) {
      return c.json({ error: 'Unauthorized to revoke this API key' }, 403);
    }

    // Update status to revoked
    key.status = 'revoked';
    key.revoked_at = new Date().toISOString();
    await kv.set(`api_key:${keyId}`, key);

    // Remove lookup entry
    await kv.del(`api_key_lookup:${key.key}`);

    console.log('✅ [API Keys] Revoked API key:', keyId);

    return c.json({ success: true });
  } catch (error) {
    console.error('❌ [API Keys] Error revoking key:', error);
    return c.json({ error: 'Failed to revoke API key' }, 500);
  }
});

// ============= PUBLIC API ROUTES (Requires API Key) =============

// Rate limiting function
async function checkRateLimit(userId: string, apiKey: string) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 100; // 100 requests per minute for Enterprise
  
  // Get rate limit data
  const rateLimitKey = `rate_limit:${userId}:${Math.floor(now / windowMs)}`;
  const rateLimitData = await kv.get(rateLimitKey) || { count: 0, resetAt: now + windowMs };
  
  // Check if limit exceeded
  if (rateLimitData.count >= maxRequests) {
    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      reset: rateLimitData.resetAt
    };
  }
  
  // Increment count
  rateLimitData.count += 1;
  await kv.set(rateLimitKey, rateLimitData);
  
  return {
    allowed: true,
    limit: maxRequests,
    remaining: maxRequests - rateLimitData.count,
    reset: rateLimitData.resetAt
  };
}

// API Key authentication middleware
async function authenticateApiKey(apiKey: string) {
  if (!apiKey || !apiKey.startsWith('cw_live_')) {
    return { valid: false, error: 'Invalid API key format' };
  }

  // Look up key
  const keyId = await kv.get(`api_key_lookup:${apiKey}`);
  if (!keyId) {
    return { valid: false, error: 'Invalid API key' };
  }

  const key = await kv.get(`api_key:${keyId}`);
  if (!key) {
    return { valid: false, error: 'Invalid API key' };
  }

  if (key.status !== 'active') {
    return { valid: false, error: 'API key has been revoked' };
  }

  // Check rate limit
  const rateLimitResult = await checkRateLimit(key.user_id, apiKey);
  if (!rateLimitResult.allowed) {
    return { 
      valid: false, 
      error: 'Rate limit exceeded. Try again later.',
      rateLimit: rateLimitResult 
    };
  }

  // Update usage statistics
  key.requests_count = (key.requests_count || 0) + 1;
  key.last_used_at = new Date().toISOString();
  await kv.set(`api_key:${keyId}`, key);

  return { 
    valid: true, 
    userId: key.user_id, 
    key,
    rateLimit: rateLimitResult
  };
}

// API v1: Get projects
app.get("/api/v1/projects", async (c) => {
  try {
    const apiKey = c.req.header('X-API-Key') || c.req.header('Authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return c.json({ error: 'API key required. Provide via X-API-Key header or Authorization: Bearer <key>' }, 401);
    }

    const auth = await authenticateApiKey(apiKey);
    if (!auth.valid) {
      const response = c.json({ error: auth.error }, 401);
      if (auth.rateLimit) {
        response.headers.set('X-RateLimit-Limit', String(auth.rateLimit.limit));
        response.headers.set('X-RateLimit-Remaining', String(auth.rateLimit.remaining));
        response.headers.set('X-RateLimit-Reset', String(auth.rateLimit.reset));
      }
      return response;
    }

    // Get user's projects
    const allProjectsColon = (await kv.getByPrefix('project:') || []).map(item => item.value);
    const allProjectsUnderscore = (await kv.getByPrefix('project_') || []).map(item => item.value);
    const allProjects = [...allProjectsColon, ...allProjectsUnderscore];
    
    const userProjects = allProjects.filter((p: any) => p.user_id === auth.userId);

    const response = c.json({
      success: true,
      data: userProjects,
      meta: {
        total: userProjects.length,
        api_version: 'v1'
      }
    });
    
    // Add rate limit headers
    if (auth.rateLimit) {
      response.headers.set('X-RateLimit-Limit', String(auth.rateLimit.limit));
      response.headers.set('X-RateLimit-Remaining', String(auth.rateLimit.remaining));
      response.headers.set('X-RateLimit-Reset', String(auth.rateLimit.reset));
    }
    
    return response;
  } catch (error) {
    console.error('❌ [API v1] Error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// API v1: Get wallet balance
app.get("/api/v1/wallet", async (c) => {
  try {
    const apiKey = c.req.header('X-API-Key') || c.req.header('Authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return c.json({ error: 'API key required' }, 401);
    }

    const auth = await authenticateApiKey(apiKey);
    if (!auth.valid) {
      const response = c.json({ error: auth.error }, 401);
      if (auth.rateLimit) {
        response.headers.set('X-RateLimit-Limit', String(auth.rateLimit.limit));
        response.headers.set('X-RateLimit-Remaining', String(auth.rateLimit.remaining));
        response.headers.set('X-RateLimit-Reset', String(auth.rateLimit.reset));
      }
      return response;
    }

    // Get wallet
    const wallet = await kv.get(`wallet:${auth.userId}`) || await kv.get(`wallet_${auth.userId}`);
    
    const responseData = wallet ? {
      success: true,
      data: {
        balance: wallet.balance || 0,
        locked: wallet.locked || 0,
        total_earned: wallet.total_earned || 0,
        total_spent: wallet.total_spent || 0,
        currency: 'USD'
      }
    } : {
      success: true,
      data: {
        balance: 0,
        locked: 0,
        currency: 'USD'
      }
    };
    
    const response = c.json(responseData);
    
    // Add rate limit headers
    if (auth.rateLimit) {
      response.headers.set('X-RateLimit-Limit', String(auth.rateLimit.limit));
      response.headers.set('X-RateLimit-Remaining', String(auth.rateLimit.remaining));
      response.headers.set('X-RateLimit-Reset', String(auth.rateLimit.reset));
    }
    
    return response;
  } catch (error) {
    console.error('❌ [API v1] Error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// API v1: Create project
app.post("/api/v1/projects", async (c) => {
  try {
    const apiKey = c.req.header('X-API-Key') || c.req.header('Authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return c.json({ error: 'API key required' }, 401);
    }

    const auth = await authenticateApiKey(apiKey);
    if (!auth.valid) {
      const response = c.json({ error: auth.error }, 401);
      if (auth.rateLimit) {
        response.headers.set('X-RateLimit-Limit', String(auth.rateLimit.limit));
        response.headers.set('X-RateLimit-Remaining', String(auth.rateLimit.remaining));
        response.headers.set('X-RateLimit-Reset', String(auth.rateLimit.reset));
      }
      return response;
    }

    const { title, description, budget, deadline, skills } = await c.req.json();

    if (!title || !description) {
      return c.json({ error: 'Title and description are required' }, 400);
    }

    // Create project
    const projectId = crypto.randomUUID();
    const project = {
      id: projectId,
      user_id: auth.userId,
      title,
      description,
      budget: budget || 0,
      deadline: deadline || null,
      skills: skills || [],
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await kv.set(`project:${projectId}`, project);

    console.log('✅ [API v1] Created project via API:', projectId);

    const response = c.json({
      success: true,
      data: project
    });
    
    // Add rate limit headers
    if (auth.rateLimit) {
      response.headers.set('X-RateLimit-Limit', String(auth.rateLimit.limit));
      response.headers.set('X-RateLimit-Remaining', String(auth.rateLimit.remaining));
      response.headers.set('X-RateLimit-Reset', String(auth.rateLimit.reset));
    }
    
    return response;
  } catch (error) {
    console.error('❌ [API v1] Error creating project:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// API v1: Get proposals
app.get("/api/v1/proposals", async (c) => {
  try {
    const apiKey = c.req.header('X-API-Key') || c.req.header('Authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return c.json({ error: 'API key required' }, 401);
    }

    const auth = await authenticateApiKey(apiKey);
    if (!auth.valid) {
      const response = c.json({ error: auth.error }, 401);
      if (auth.rateLimit) {
        response.headers.set('X-RateLimit-Limit', String(auth.rateLimit.limit));
        response.headers.set('X-RateLimit-Remaining', String(auth.rateLimit.remaining));
        response.headers.set('X-RateLimit-Reset', String(auth.rateLimit.reset));
      }
      return response;
    }

    // Get query parameters
    const projectId = c.req.query('project_id');
    const status = c.req.query('status');

    // Get user's proposals
    const allProposalsColon = (await kv.getByPrefix('proposal:') || []).map(item => item.value);
    const allProposalsUnderscore = (await kv.getByPrefix('proposal_') || []).map(item => item.value);
    const allProposals = [...allProposalsColon, ...allProposalsUnderscore];
    
    let userProposals = allProposals.filter((p: any) => p.freelancer_id === auth.userId);

    // Filter by project_id if provided
    if (projectId) {
      userProposals = userProposals.filter((p: any) => p.project_id === projectId);
    }

    // Filter by status if provided
    if (status) {
      userProposals = userProposals.filter((p: any) => p.status === status);
    }

    const response = c.json({
      success: true,
      data: userProposals,
      meta: {
        total: userProposals.length,
        filters: { project_id: projectId, status },
        api_version: 'v1'
      }
    });
    
    // Add rate limit headers
    if (auth.rateLimit) {
      response.headers.set('X-RateLimit-Limit', String(auth.rateLimit.limit));
      response.headers.set('X-RateLimit-Remaining', String(auth.rateLimit.remaining));
      response.headers.set('X-RateLimit-Reset', String(auth.rateLimit.reset));
    }
    
    return response;
  } catch (error) {
    console.error('❌ [API v1] Error fetching proposals:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// API v1: Create proposal
app.post("/api/v1/proposals", async (c) => {
  try {
    const apiKey = c.req.header('X-API-Key') || c.req.header('Authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return c.json({ error: 'API key required' }, 401);
    }

    const auth = await authenticateApiKey(apiKey);
    if (!auth.valid) {
      const response = c.json({ error: auth.error }, 401);
      if (auth.rateLimit) {
        response.headers.set('X-RateLimit-Limit', String(auth.rateLimit.limit));
        response.headers.set('X-RateLimit-Remaining', String(auth.rateLimit.remaining));
        response.headers.set('X-RateLimit-Reset', String(auth.rateLimit.reset));
      }
      return response;
    }

    const { project_id, cover_letter, proposed_amount, delivery_time } = await c.req.json();

    if (!project_id || !cover_letter || !proposed_amount) {
      return c.json({ error: 'project_id, cover_letter, and proposed_amount are required' }, 400);
    }

    // Check if project exists
    const project = await kv.get(`project:${project_id}`) || await kv.get(`project_${project_id}`);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Create proposal
    const proposalId = crypto.randomUUID();
    const proposal = {
      id: proposalId,
      project_id,
      freelancer_id: auth.userId,
      cover_letter,
      proposed_amount,
      delivery_time: delivery_time || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await kv.set(`proposal:${proposalId}`, proposal);

    console.log('✅ [API v1] Created proposal via API:', proposalId);

    const response = c.json({
      success: true,
      data: proposal
    });
    
    // Add rate limit headers
    if (auth.rateLimit) {
      response.headers.set('X-RateLimit-Limit', String(auth.rateLimit.limit));
      response.headers.set('X-RateLimit-Remaining', String(auth.rateLimit.remaining));
      response.headers.set('X-RateLimit-Reset', String(auth.rateLimit.reset));
    }
    
    return response;
  } catch (error) {
    console.error('❌ [API v1] Error creating proposal:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============= CUSTOM BRANDING ROUTES (ENTERPRISE) =============

// Get branding settings for current user
app.get("/make-server-215f78a5/branding", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const devToken = c.req.header('X-Dev-Token');
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    let userId: string;
    
    // 🎁 開發模式支持
    if (devToken && devToken.startsWith('dev-user-')) {
      console.log('🎁 [Branding GET] Dev mode detected, using dev token');
      userId = devToken;
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user?.id) {
        return c.json({ error: 'Unauthorized' }, 401);
      }
      userId = user.id;
    }

    // Get branding settings
    const branding = await kv.get(`branding:${userId}`) || await kv.get(`branding_${userId}`);

    return c.json({ branding: branding || null, settings: branding || null });
  } catch (error) {
    return c.json({ error: 'Failed to fetch branding settings' }, 500);
  }
});

// Save branding settings
app.post("/make-server-215f78a5/branding", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user has enterprise subscription
    const { hasEnterprise, subscription } = await checkEnterpriseSubscription(user.id);
    
    if (!hasEnterprise) {
      return c.json({ 
        error: 'Custom branding is only available for Enterprise plan users',
        currentPlan: subscription?.plan || 'free',
        requiredPlan: 'enterprise'
      }, 403);
    }

    const requestBody = await c.req.json();
    const { 
      company_name, 
      workspace_name,
      primary_color, 
      secondary_color, 
      accent_color, 
      font_family,
      custom_domain, 
      email_footer,
      logo_url 
    } = requestBody;

    const finalWorkspaceName = workspace_name || company_name;
    if (!finalWorkspaceName) {
      return c.json({ error: 'Workspace name or company name is required' }, 400);
    }

    // Get existing branding or create new
    const existingBranding = await kv.get(`branding:${user.id}`) || await kv.get(`branding_${user.id}`);

    const branding = {
      id: existingBranding?.id || crypto.randomUUID(),
      user_id: user.id,
      company_name: finalWorkspaceName,
      workspace_name: finalWorkspaceName,
      primary_color: primary_color || '#6366f1',
      secondary_color: secondary_color || '#8b5cf6',
      accent_color: accent_color || '#ec4899',
      font_family: font_family || 'Inter',
      custom_domain: custom_domain || '',
      email_footer: email_footer || '',
      logo_url: logo_url || existingBranding?.logo_url || undefined,
      created_at: existingBranding?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await kv.set(`branding:${user.id}`, branding);

    // 🔥 自動同步到企業 LOGO 記錄（包含公司名稱，無論是否有 LOGO）
    const enterpriseLogoInfo = {
      userId: user.id,
      logoUrl: branding.logo_url || null,
      companyName: branding.company_name || branding.workspace_name || 'Enterprise Client',
      syncedAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    await kv.set(`enterprise_logo_${user.id}`, enterpriseLogoInfo);

    return c.json({ success: true, branding });
  } catch (error) {
    return c.json({ error: 'Failed to save branding settings' }, 500);
  }
});

// Update branding settings (PUT method)
app.put("/make-server-215f78a5/branding", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const devToken = c.req.header('X-Dev-Token');
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    let userId: string;
    let isDevMode = false;
    
    // 🎁 開發模式支持
    if (devToken && devToken.startsWith('dev-user-')) {
      userId = devToken;
      isDevMode = true;
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user?.id) {
        return c.json({ error: 'Unauthorized' }, 401);
      }
      userId = user.id;

      // Check if user has enterprise subscription (only in production)
      const { hasEnterprise, subscription } = await checkEnterpriseSubscription(userId);
      
      if (!hasEnterprise) {
        return c.json({ 
          error: 'Custom branding is only available for Enterprise plan users',
          currentPlan: subscription?.plan || 'free',
          requiredPlan: 'enterprise'
        }, 403);
      }
    }

    const requestBody = await c.req.json();
    
    const { 
      company_name, 
      workspace_name,
      primary_color, 
      secondary_color, 
      accent_color, 
      font_family,
      custom_domain, 
      email_footer,
      logo_url 
    } = requestBody;

    // Get existing branding or create new
    const existingBranding = await kv.get(`branding:${userId}`) || await kv.get(`branding_${userId}`);

    const branding = {
      id: existingBranding?.id || crypto.randomUUID(),
      user_id: userId,
      company_name: workspace_name || company_name || existingBranding?.workspace_name || existingBranding?.company_name || 'My Workspace',
      workspace_name: workspace_name || company_name || existingBranding?.workspace_name || existingBranding?.company_name || 'My Workspace',
      primary_color: primary_color || existingBranding?.primary_color || '#6366f1',
      secondary_color: secondary_color || existingBranding?.secondary_color || '#8b5cf6',
      accent_color: accent_color || existingBranding?.accent_color || '#ec4899',
      font_family: font_family || existingBranding?.font_family || 'Inter',
      custom_domain: custom_domain !== undefined ? custom_domain : (existingBranding?.custom_domain || ''),
      email_footer: email_footer !== undefined ? email_footer : (existingBranding?.email_footer || ''),
      logo_url: logo_url !== undefined ? logo_url : existingBranding?.logo_url,
      created_at: existingBranding?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await kv.set(`branding:${userId}`, branding);

    // 🔥 自動同步到企業 LOGO 記錄（包含公司名稱，無論是否有 LOGO）
    const enterpriseLogoInfo = {
      userId: userId,
      logoUrl: branding.logo_url || null,
      companyName: branding.company_name || branding.workspace_name || 'Enterprise Client',
      syncedAt: new Date().toISOString(),
      created_at: existingBranding?.created_at || new Date().toISOString(),
    };
    await kv.set(`enterprise_logo_${userId}`, enterpriseLogoInfo);

    return c.json({ success: true, branding, settings: branding });
  } catch (error) {
    return c.json({ error: 'Failed to save branding settings' }, 500);
  }
});

// Upload logo
app.post("/make-server-215f78a5/branding/logo", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const devToken = c.req.header('X-Dev-Token');
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    let userId: string;
    let isDevMode = false;
    
    // 🎁 開發模式支持
    if (devToken && devToken.startsWith('dev-user-')) {
      userId = devToken;
      isDevMode = true;
      // 開發模式下跳過認證，但繼續執行真實上傳
    } else {
      // 真實模式：使用 Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user?.id) {
        return c.json({ error: 'Unauthorized' }, 401);
      }
      
      userId = user.id;

      // Check enterprise subscription (only in production mode)
      const { hasEnterprise, subscription } = await checkEnterpriseSubscription(userId);
      
      if (!hasEnterprise) {
        return c.json({ 
          error: 'Logo upload is only available for Enterprise plan users',
          currentPlan: subscription?.plan || 'free',
          requiredPlan: 'enterprise'
        }, 403);
      }
    }

    // Get the file from form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return c.json({ error: 'File must be an image' }, 400);
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      return c.json({ error: 'File size must be less than 2MB' }, 400);
    }

    let logoUrl: string;

    // 🎁 開發模式：使用 Base64 編碼直接保存（避免 Storage 權限問題）
    if (isDevMode) {
      const fileBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
      logoUrl = `data:${file.type};base64,${base64}`;
    } else {
      // 生產模式：上傳到 Supabase Storage
      const bucketName = 'make-215f78a5-branding';
      
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        return c.json({ error: 'Storage access error: ' + listError.message }, 500);
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: false,
          fileSizeLimit: 2097152
        });
        
        if (createError) {
          return c.json({ error: 'Failed to create storage bucket: ' + createError.message }, 500);
        }
      }

      // Upload to Supabase Storage
      const fileName = `${userId}/${Date.now()}-${file.name}`;
      const fileBuffer = await file.arrayBuffer();
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) {
        console.error('❌ [Branding] Upload error:', uploadError);
        return c.json({ error: 'Failed to upload file: ' + uploadError.message }, 500);
      }

      console.log('✅ [Branding] File uploaded, getting signed URL...');
      // Get signed URL (valid for 1 year)
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(fileName, 31536000);

      if (urlError || !signedUrlData?.signedUrl) {
        console.error('❌ [Branding] Failed to get signed URL:', urlError);
        return c.json({ error: 'Failed to generate URL: ' + (urlError?.message || 'Unknown error') }, 500);
      }

      logoUrl = signedUrlData.signedUrl;
    }

    // Update branding with logo URL
    const branding = await kv.get(`branding:${userId}`) || await kv.get(`branding_${userId}`);
    
    if (branding) {
      branding.logo_url = logoUrl;
      branding.updated_at = new Date().toISOString();
      await kv.set(`branding:${userId}`, branding);
    }
    
    // 🌟 同時更新企業 LOGO 服務（用於案件卡片顯示）
    try {
      const companyName = branding?.company_name || branding?.workspace_name || 'Enterprise Client';
      await enterpriseLogoService.setUserEnterpriseLogo(userId, logoUrl, companyName);
    } catch (error) {
      // 不阻止主流程
    }

    return c.json({ 
      success: true, 
      logo_url: logoUrl,
      dev_mode: isDevMode
    });
  } catch (error) {
    return c.json({ error: 'Failed to upload logo' }, 500);
  }
});

// 🔄 Sync enterprise logo from branding settings (手動同步 API)
app.post("/make-server-215f78a5/sync-enterprise-logo", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { userId } = await c.req.json();
    
    // 確保只能同步自己的 LOGO（除非是管理員）
    if (userId !== user.id) {
      const isAdmin = await adminCheck.isAnyAdminAsync(user.email);
      if (!isAdmin) {
        return c.json({ error: 'Forbidden: Can only sync your own logo' }, 403);
      }
    }

    console.log('🔄 [Logo Sync] Starting sync for user:', userId);

    // 獲取品牌設定
    const branding = await kv.get(`branding:${userId}`) || await kv.get(`branding_${userId}`);
    
    if (!branding || !branding.logo_url) {
      return c.json({ 
        error: 'No branding logo found',
        message: 'Please upload a logo in branding settings first'
      }, 404);
    }

    // 同步到企業 LOGO 記錄
    const enterpriseLogoInfo = {
      userId: userId,
      logoUrl: branding.logo_url,
      companyName: branding.company_name || branding.workspace_name || 'Enterprise Client',
      syncedAt: new Date().toISOString(),
      created_at: branding.created_at || new Date().toISOString(),
    };

    await kv.set(`enterprise_logo_${userId}`, enterpriseLogoInfo);
    console.log('✅ [Logo Sync] Synced enterprise logo:', enterpriseLogoInfo);

    // 同時使用新格式的 key
    try {
      await enterpriseLogoService.setUserEnterpriseLogo(
        userId, 
        branding.logo_url, 
        enterpriseLogoInfo.companyName
      );
      console.log('✅ [Logo Sync] Also updated enterprise logo service');
    } catch (error) {
      console.error('⚠️ [Logo Sync] Failed to update enterprise logo service:', error);
    }

    return c.json({ 
      success: true,
      message: 'Enterprise logo synced successfully',
      logoInfo: enterpriseLogoInfo
    });
  } catch (error) {
    console.error('❌ [Logo Sync] Error syncing logo:', error);
    return c.json({ error: 'Failed to sync logo' }, 500);
  }
});

// 🔄 Public logo sync API (for auto-fix, no auth required)
app.post("/make-server-215f78a5/sync-enterprise-logo-public", async (c) => {
  try {
    const { userId } = await c.req.json();
    
    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    console.log('🔄 [Public Logo Sync] Starting sync for user:', userId);

    // 獲取品牌設定
    const branding = await kv.get(`branding:${userId}`) || await kv.get(`branding_${userId}`);
    
    if (!branding || !branding.logo_url) {
      return c.json({ 
        error: 'No branding logo found',
        message: 'Please upload a logo in branding settings first'
      }, 404);
    }

    // 同步到企業 LOGO 記錄
    const enterpriseLogoInfo = {
      userId: userId,
      logoUrl: branding.logo_url,
      companyName: branding.company_name || branding.workspace_name || 'Enterprise Client',
      syncedAt: new Date().toISOString(),
      created_at: branding.created_at || new Date().toISOString(),
    };

    await kv.set(`enterprise_logo_${userId}`, enterpriseLogoInfo);
    console.log('✅ [Public Logo Sync] Synced enterprise logo:', enterpriseLogoInfo);

    // 同時使用新格式的 key
    try {
      await enterpriseLogoService.setUserEnterpriseLogo(
        userId, 
        branding.logo_url, 
        enterpriseLogoInfo.companyName
      );
      console.log('✅ [Public Logo Sync] Also updated enterprise logo service');
    } catch (error) {
      console.error('⚠️ [Public Logo Sync] Failed to update enterprise logo service:', error);
    }

    return c.json({ 
      success: true,
      message: 'Enterprise logo synced successfully (public API)',
      logoInfo: enterpriseLogoInfo
    });
  } catch (error) {
    console.error('❌ [Public Logo Sync] Error syncing logo:', error);
    return c.json({ error: 'Failed to sync logo' }, 500);
  }
});

// 📧 Upload email template logo (admin only)
app.post("/make-server-215f78a5/admin/upload-email-logo", async (c) => {
  try {
    console.log('📧 [Email Logo] Upload request received');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.error('❌ [Email Logo] No access token');
      return c.json({ error: 'Authorization required' }, 401);
    }

    console.log('📧 [Email Logo] Verifying user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      // Silently return 401 for unauthenticated requests
      return c.json({ error: 'Unauthorized: ' + (authError?.message || 'Invalid token') }, 401);
    }

    console.log('📧 [Email Logo] User verified:', user.id, user.email);

    // Check if user is admin
    const isAdmin = await adminCheck.isAnyAdminAsync(user.email);
    console.log('📧 [Email Logo] Admin check:', isAdmin);
    
    if (!isAdmin) {
      console.error('❌ [Email Logo] User is not admin');
      return c.json({ error: 'Admin access required' }, 403);
    }

    console.log('📧 [Email Logo] Getting file from form data...');
    
    // Get the file from form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('❌ [Email Logo] No file in form data');
      return c.json({ error: 'No file provided' }, 400);
    }

    console.log('📧 [Email Logo] File received:', file.name, file.type, file.size);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('❌ [Email Logo] Invalid file type:', file.type);
      return c.json({ error: 'File must be an image' }, 400);
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      console.error('❌ [Email Logo] File too large:', file.size);
      return c.json({ error: 'File size must be less than 2MB' }, 400);
    }

    // Create bucket if not exists
    const bucketName = 'platform-assets';
    console.log('📧 [Email Logo] Checking bucket:', bucketName);
    
    // Use service role client for storage operations
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    const { data: buckets, error: listError } = await serviceSupabase.storage.listBuckets();
    if (listError) {
      console.error('❌ [Email Logo] Error listing buckets:', listError);
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    console.log('📧 [Email Logo] Bucket exists:', bucketExists);
    
    if (!bucketExists) {
      console.log('📧 [Email Logo] Creating bucket...');
      const { error: createError } = await serviceSupabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 2097152,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
      });
      if (createError) {
        console.error('❌ [Email Logo] Error creating bucket:', createError);
        return c.json({ error: 'Failed to create storage bucket: ' + createError.message }, 500);
      }
      console.log('✅ [Email Logo] Created storage bucket:', bucketName);
    }

    // Upload to Supabase Storage
    const fileName = 'casewhr-logo-white.png';
    console.log('📧 [Email Logo] Uploading file:', fileName);
    
    const fileBuffer = await file.arrayBuffer();
    console.log('📧 [Email Logo] File buffer size:', fileBuffer.byteLength);
    
    const { data: uploadData, error: uploadError } = await serviceSupabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('❌ [Email Logo] Upload error:', uploadError);
      return c.json({ error: 'Failed to upload file: ' + uploadError.message }, 500);
    }

    console.log('✅ [Email Logo] Upload successful:', uploadData);

    // Get public URL
    const { data: urlData } = serviceSupabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    const logoUrl = urlData.publicUrl;

    console.log('✅ [Email Logo] Logo URL:', logoUrl);

    // Store logo URL in KV Store so email templates can use it
    console.log('📧 [Email Logo] Storing logo URL in KV Store...');
    await kv.set('system:email:logo-url', logoUrl);
    console.log('✅ [Email Logo] Logo URL stored in KV Store');

    return c.json({ success: true, logo_url: logoUrl });
  } catch (error: any) {
    console.error('❌ [Email Logo] Error uploading logo:', error);
    return c.json({ error: 'Failed to upload logo: ' + (error.message || String(error)) }, 500);
  }
});

// Get current email logo URL from KV Store (for debugging)
app.get("/make-server-215f78a5/admin/get-email-logo", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const isAdmin = await adminCheck.isAnyAdminAsync(user.email);
    if (!isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    // Get logo URL from KV Store
    const logoUrl = await kv.get('system:email:logo-url');
    
    console.log('📧 [Email Logo] Retrieved from KV Store:', logoUrl);

    return c.json({ 
      success: true, 
      logo_url: logoUrl,
      has_logo: !!logoUrl 
    });
  } catch (error: any) {
    console.error('❌ [Email Logo] Error getting logo URL:', error);
    return c.json({ error: 'Failed to get logo URL: ' + (error.message || String(error)) }, 500);
  }
});

// Remove logo
app.delete("/make-server-215f78a5/branding/logo", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get branding
    const branding = await kv.get(`branding:${user.id}`) || await kv.get(`branding_${user.id}`);
    
    if (branding) {
      branding.logo_url = undefined;
      branding.updated_at = new Date().toISOString();
      await kv.set(`branding:${user.id}`, branding);
    }
    
    // 🌟 同時刪除企業 LOGO 服務中的 LOGO
    try {
      await enterpriseLogoService.deleteUserEnterpriseLogo(user.id);
      console.log('✅ [Branding] Also deleted from enterprise logo service');
    } catch (error) {
      console.error('⚠️ [Branding] Failed to delete from enterprise logo service:', error);
      // 不阻止主流程
    }

    console.log('✅ [Branding] Logo removed for user:', user.id);

    return c.json({ success: true });
  } catch (error) {
    console.error('❌ [Branding] Error removing logo:', error);
    return c.json({ error: 'Failed to remove logo' }, 500);
  }
});

// 🔄 一鍵遷移 LOGO 到企業服務（用於已上傳但未同步的 LOGO）
app.post("/make-server-215f78a5/branding/migrate-logo", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = user.id;
    console.log('🔄 [Branding] Migrating logo for user:', userId);

    // 讀取現有的品牌設定
    const branding = await kv.get(`branding:${userId}`) as any;
    
    if (!branding?.logo_url) {
      return c.json({ 
        success: false, 
        message: 'No logo found to migrate' 
      });
    }

    // 同步到企業 LOGO 服務
    const companyName = branding.company_name || branding.workspace_name || 'Enterprise Client';
    await enterpriseLogoService.setUserEnterpriseLogo(userId, branding.logo_url, companyName);
    
    console.log('✅ [Branding] Logo migrated successfully');
    console.log('   - Company:', companyName);
    console.log('   - Logo URL:', branding.logo_url);

    return c.json({ 
      success: true,
      message: 'Logo migrated successfully',
      logoUrl: branding.logo_url,
      companyName
    });
  } catch (error: any) {
    console.error('❌ [Branding] Migration error:', error);
    return c.json({ 
      error: 'Migration failed',
      details: error.message 
    }, 500);
  }
});

// ============= PRIORITY SUPPORT ROUTES (ENTERPRISE) =============

// Get support tickets for current user
app.get("/make-server-215f78a5/support/tickets", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all tickets for this user
    const allTicketsColon = (await kv.getByPrefix('support_ticket:') || []).map(item => item.value);
    const allTicketsUnderscore = (await kv.getByPrefix('support_ticket_') || []).map(item => item.value);
    const allTickets = [...allTicketsColon, ...allTicketsUnderscore];
    
    const userTickets = allTickets
      .filter((t: any) => t.user_id === user.id)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return c.json({ tickets: userTickets });
  } catch (error) {
    console.error('❌ [Support] Error fetching tickets:', error);
    return c.json({ error: 'Failed to fetch support tickets' }, 500);
  }
});

// Create new support ticket
app.post("/make-server-215f78a5/support/tickets", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { subject, description, category, priority } = await c.req.json();

    if (!subject || !description || !category) {
      return c.json({ error: 'Subject, description, and category are required' }, 400);
    }

    // Check if user has enterprise subscription
    const { hasEnterprise, subscription } = await checkEnterpriseSubscription(user.id);
    const isEnterprise = hasEnterprise;

    // Create ticket
    const ticketId = crypto.randomUUID();
    const ticket = {
      id: ticketId,
      user_id: user.id,
      subject,
      description,
      category,
      priority: priority || 'medium',
      status: 'open',
      is_enterprise: isEnterprise,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await kv.set(`support_ticket:${ticketId}`, ticket);

    console.log('✅ [Support] Created ticket:', ticketId, 'Priority:', priority, 'Enterprise:', isEnterprise);

    return c.json({ success: true, ticket });
  } catch (error) {
    console.error('❌ [Support] Error creating ticket:', error);
    return c.json({ error: 'Failed to create support ticket' }, 500);
  }
});

// Update ticket status
app.put("/make-server-215f78a5/support/tickets/:ticketId/status", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const ticketId = c.req.param('ticketId');
    const { status } = await c.req.json();

    if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return c.json({ error: 'Invalid status' }, 400);
    }

    // Get ticket
    const ticket = await kv.get(`support_ticket:${ticketId}`);
    
    if (!ticket) {
      return c.json({ error: 'Ticket not found' }, 404);
    }

    // Verify ownership
    if (ticket.user_id !== user.id) {
      return c.json({ error: 'Unauthorized to update this ticket' }, 403);
    }

    // Update status
    ticket.status = status;
    ticket.updated_at = new Date().toISOString();
    
    if (status === 'resolved' && !ticket.resolved_at) {
      ticket.resolved_at = new Date().toISOString();
      
      // Calculate resolution time
      const createdTime = new Date(ticket.created_at).getTime();
      const resolvedTime = new Date(ticket.resolved_at).getTime();
      ticket.resolution_time = (resolvedTime - createdTime) / 1000;
    }

    await kv.set(`support_ticket:${ticketId}`, ticket);

    console.log('✅ [Support] Updated ticket status:', ticketId, 'to', status);

    return c.json({ success: true, ticket });
  } catch (error) {
    console.error('❌ [Support] Error updating ticket:', error);
    return c.json({ error: 'Failed to update ticket status' }, 500);
  }
});

// Get ticket replies
app.get("/make-server-215f78a5/support/tickets/:ticketId/replies", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const ticketId = c.req.param('ticketId');

    // Get ticket
    const ticket = await kv.get(`support_ticket:${ticketId}`);
    
    if (!ticket) {
      return c.json({ error: 'Ticket not found' }, 404);
    }

    // Verify ownership
    if (ticket.user_id !== user.id) {
      return c.json({ error: 'Unauthorized to view this ticket' }, 403);
    }

    // Get all replies for this ticket
    const allRepliesColon = (await kv.getByPrefix(`ticket_reply:${ticketId}:`) || []).map(item => item.value);
    const allRepliesUnderscore = (await kv.getByPrefix(`ticket_reply_${ticketId}_`) || []).map(item => item.value);
    const allReplies = [...allRepliesColon, ...allRepliesUnderscore];
    
    const sortedReplies = allReplies.sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return c.json({ replies: sortedReplies });
  } catch (error) {
    console.error('❌ [Support] Error fetching replies:', error);
    return c.json({ error: 'Failed to fetch replies' }, 500);
  }
});

// Add ticket reply
app.post("/make-server-215f78a5/support/tickets/:ticketId/replies", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const ticketId = c.req.param('ticketId');
    const { message } = await c.req.json();

    if (!message || !message.trim()) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Get ticket
    const ticket = await kv.get(`support_ticket:${ticketId}`);
    
    if (!ticket) {
      return c.json({ error: 'Ticket not found' }, 404);
    }

    // Verify ownership
    if (ticket.user_id !== user.id) {
      return c.json({ error: 'Unauthorized to reply to this ticket' }, 403);
    }

    // Create reply
    const replyId = crypto.randomUUID();
    const reply = {
      id: replyId,
      ticket_id: ticketId,
      user_id: user.id,
      message: message.trim(),
      is_staff: false,
      created_at: new Date().toISOString(),
    };

    await kv.set(`ticket_reply:${ticketId}:${replyId}`, reply);

    // Update ticket status if closed
    if (ticket.status === 'closed') {
      ticket.status = 'open';
      ticket.updated_at = new Date().toISOString();
      await kv.set(`support_ticket:${ticketId}`, ticket);
    }

    console.log('✅ [Support] Added reply to ticket:', ticketId);

    return c.json({ success: true, reply });
  } catch (error) {
    console.error('❌ [Support] Error adding reply:', error);
    return c.json({ error: 'Failed to add reply' }, 500);
  }
});

// ============= RECURRING SUBSCRIPTION ROUTES =============

// Create PayPal recurring subscription
app.post("/make-server-215f78a5/subscription/paypal/create-recurring", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { planType } = body; // 'pro' | 'enterprise'

    if (!['pro', 'enterprise'].includes(planType)) {
      return c.json({ error: 'Invalid plan type' }, 400);
    }

    const returnUrl = `${c.req.header('origin') || 'https://casewhr.com'}/?payment=success&provider=paypal-subscription`;
    const cancelUrl = `${c.req.header('origin') || 'https://casewhr.com'}/?payment=cancel`;

    const { subscriptionId, approvalUrl } = await subscriptionRecurring.createPayPalSubscription(
      user.id,
      planType,
      returnUrl,
      cancelUrl
    );

    return c.json({
      success: true,
      subscriptionId,
      approvalUrl,
    });
  } catch (error: any) {
    console.error('❌ [PayPal Subscription] Error:', error);
    console.error('❌ [PayPal Subscription] Stack:', error.stack);
    
    // 提供更友好的錯誤訊息
    let userMessage = error.message || 'Failed to create PayPal subscription';
    
    if (error.message?.includes('PayPal credentials not configured')) {
      userMessage = '⚠️ PayPal 尚未配置。請使用 ECPay 或其他支付方式。';
    } else if (error.message?.includes('PayPal authentication failed')) {
      userMessage = '⚠️ PayPal 認證失敗。請使用 ECPay 或聯繫客服。';
    }
    
    return c.json({ 
      error: userMessage,
      provider: 'paypal',
      suggestion: 'Please use ECPay for subscription payment'
    }, 500);
  }
});

// Activate PayPal subscription (callback after user approval)
app.post("/make-server-215f78a5/subscription/paypal/activate", async (c) => {
  try {
    const body = await c.req.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return c.json({ error: 'Missing subscription ID' }, 400);
    }

    await subscriptionRecurring.activatePayPalSubscription(subscriptionId);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ [PayPal Subscription] Activation error:', error);
    return c.json({ error: error.message || 'Failed to activate subscription' }, 500);
  }
});

// Cancel PayPal subscription
app.post("/make-server-215f78a5/subscription/paypal/cancel-recurring", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { reason } = body;

    await subscriptionRecurring.cancelPayPalSubscription(user.id, reason);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ [PayPal Subscription] Cancel error:', error);
    return c.json({ error: error.message || 'Failed to cancel subscription' }, 500);
  }
});

// PayPal Webhook handler
app.post("/make-server-215f78a5/webhooks/paypal/subscription", async (c) => {
  try {
    const event = await c.req.json();
    
    console.log('🔔 [PayPal Webhook] Received event:', event.event_type);
    
    await subscriptionRecurring.handlePayPalWebhook(event);
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ [PayPal Webhook] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Create ECPay recurring subscription
app.post("/make-server-215f78a5/subscription/ecpay/create-recurring", async (c) => {
  try {
    console.log('🟢 [ECPay Create] Received subscription request');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.error('❌ [ECPay Create] No authorization token');
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      console.error('❌ [ECPay Create] Unauthorized:', authError?.message);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('✅ [ECPay Create] User authenticated:', user.id);

    const body = await c.req.json();
    const { planType, billingCycle = 'monthly' } = body; // ✅ 新增 billingCycle 參數

    if (!['pro', 'enterprise'].includes(planType)) {
      console.error('❌ [ECPay Create] Invalid plan type:', planType);
      return c.json({ error: 'Invalid plan type' }, 400);
    }
    
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      console.error('❌ [ECPay Create] Invalid billing cycle:', billingCycle);
      return c.json({ error: 'Invalid billing cycle' }, 400);
    }

    console.log('✅ [ECPay Create] Plan type:', planType, 'Billing cycle:', billingCycle);

    // 檢查環境變數
    const merchantId = Deno.env.get('ECPAY_MERCHANT_ID');
    const hashKey = Deno.env.get('ECPAY_HASH_KEY');
    const hashIV = Deno.env.get('ECPAY_HASH_IV');
    
    if (!merchantId || !hashKey || !hashIV) {
      console.error('❌ [ECPay Create] Missing environment variables:', {
        merchantId: merchantId ? '✅' : '❌',
        hashKey: hashKey ? '✅' : '❌',
        hashIV: hashIV ? '✅' : '❌'
      });
      return c.json({ error: 'ECPay configuration missing. Please contact support.' }, 500);
    }

    console.log('✅ [ECPay Create] Environment variables OK');

    const returnUrl = `${c.req.header('origin') || 'https://casewhr.com'}`;
    console.log('🟢 [ECPay Create] Return URL:', returnUrl);

    const formHtml = await subscriptionRecurring.createECPaySubscription(
      user.id,
      planType,
      user.email || '',
      returnUrl,
      billingCycle // ✅ 傳入計費週期
    );

    console.log('✅ [ECPay Create] Form HTML generated, length:', formHtml.length);

    return c.html(formHtml);
  } catch (error: any) {
    console.error('❌ [ECPay Subscription] Error:', error);
    console.error('❌ [ECPay Subscription] Stack:', error.stack);
    return c.json({ error: error.message || 'Failed to create ECPay subscription' }, 500);
  }
});

// ECPay period callback
app.post("/make-server-215f78a5/ecpay-period-callback", async (c) => {
  try {
    const params = await c.req.parseBody();
    
    console.log('🔔 [ECPay Period] Callback received');
    
    await subscriptionRecurring.handleECPayPeriodCallback(params);
    
    return c.text('1|OK');
  } catch (error: any) {
    console.error('❌ [ECPay Period] Callback error:', error);
    return c.text('0|Error');
  }
});

// Cancel ECPay subscription
app.post("/make-server-215f78a5/subscription/ecpay/cancel-recurring", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    await subscriptionRecurring.cancelECPaySubscription(user.id);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ [ECPay Subscription] Cancel error:', error);
    return c.json({ error: error.message || 'Failed to cancel subscription' }, 500);
  }
});

// ============= 訂閱監控 API =============

// 🤖 Cron Job 端點（供外部定時任務調用）
app.post("/make-server-215f78a5/cron/subscription-check", async (c) => {
  try {
    const cronSecret = c.req.header('X-Cron-Secret');
    const expectedSecret = Deno.env.get('CRON_SECRET') || 'casewhr-cron-2024';
    
    if (cronSecret !== expectedSecret) {
      console.warn('⚠️ [Cron] Invalid secret provided');
      return c.json({ error: 'Invalid cron secret' }, 401);
    }

    console.log('🤖 [Cron] Running scheduled subscription check...');
    
    const stats = await subscriptionMonitor.checkSubscriptionExpiry();
    
    console.log('✅ [Cron] Subscription check completed:', stats);
    
    return c.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ [Cron] Error during subscription check:', error);
    return c.json({ 
      error: error.message || 'Cron job failed',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// 手動觸發訂閱到期檢查（僅限管理員）
app.post("/make-server-215f78a5/subscription/check-expiry", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // 檢查是否為管理員
    const isAdmin = await adminCheck.isUserAdmin(user.id);
    if (!isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    console.log('🔍 [Subscription Monitor] Manual expiry check triggered by admin:', user.id);
    
    const stats = await subscriptionMonitor.checkSubscriptionExpiry();
    
    return c.json({
      success: true,
      stats,
      message: `檢查了 ${stats.checked} 個訂閱，發送了 ${stats.emailsSent} 封郵件`
    });
  } catch (error: any) {
    console.error('❌ [Subscription Monitor] Check expiry error:', error);
    return c.json({ error: error.message || 'Failed to check subscription expiry' }, 500);
  }
});

// 手動清理舊通知（僅限管理員）
app.post("/make-server-215f78a5/subscription/cleanup-notifications", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // 檢查是否為管理員
    const isAdmin = await adminCheck.isUserAdmin(user.id);
    if (!isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    console.log('🧹 [Subscription Monitor] Manual cleanup triggered by admin:', user.id);
    
    const deletedCount = await subscriptionMonitor.cleanupOldNotifications();
    
    return c.json({
      success: true,
      deletedCount,
      message: `清理了 ${deletedCount} 條舊通知記錄`
    });
  } catch (error: any) {
    console.error('❌ [Subscription Monitor] Cleanup error:', error);
    return c.json({ error: error.message || 'Failed to cleanup notifications' }, 500);
  }
});

// ============= WEBHOOK ROUTES (ENTERPRISE) =============

// Get webhooks for current user
app.get("/make-server-215f78a5/webhooks", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check enterprise subscription
    const { hasEnterprise, subscription } = await checkEnterpriseSubscription(user.id);
    
    if (!hasEnterprise) {
      return c.json({ 
        error: 'Webhooks are only available for Enterprise plan users',
        currentPlan: subscription?.plan || 'free',
        requiredPlan: 'enterprise'
      }, 403);
    }

    // Get webhooks
    const allWebhooks = (await kv.getByPrefix(`webhook:${user.id}:`) || []).map(item => item.value);
    
    return c.json({ webhooks: allWebhooks });
  } catch (error) {
    console.error('❌ [Webhook] Error fetching webhooks:', error);
    return c.json({ error: 'Failed to fetch webhooks' }, 500);
  }
});

// Create webhook
app.post("/make-server-215f78a5/webhooks", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check enterprise subscription
    const { hasEnterprise, subscription } = await checkEnterpriseSubscription(user.id);
    
    if (!hasEnterprise) {
      return c.json({ 
        error: 'Webhooks are only available for Enterprise plan users',
        currentPlan: subscription?.plan || 'free',
        requiredPlan: 'enterprise'
      }, 403);
    }

    const { url, events } = await c.req.json();

    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      return c.json({ error: 'URL and events are required' }, 400);
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return c.json({ error: 'Invalid URL format' }, 400);
    }

    // Generate webhook secret
    const secret = `whsec_${crypto.randomUUID().replace(/-/g, '')}`;

    // Create webhook
    const webhookId = crypto.randomUUID();
    const webhook = {
      id: webhookId,
      user_id: user.id,
      url,
      events,
      secret,
      status: 'active',
      created_at: new Date().toISOString(),
      success_count: 0,
      failure_count: 0,
    };

    await kv.set(`webhook:${user.id}:${webhookId}`, webhook);

    console.log('✅ [Webhook] Created webhook:', webhookId);

    return c.json({ 
      success: true, 
      webhook: {
        ...webhook,
        secret: secret
      }
    });
  } catch (error) {
    console.error('❌ [Webhook] Error creating webhook:', error);
    return c.json({ error: 'Failed to create webhook' }, 500);
  }
});

// Delete webhook
app.delete("/make-server-215f78a5/webhooks/:webhookId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const webhookId = c.req.param('webhookId');

    // Get webhook
    const webhook = await kv.get(`webhook:${user.id}:${webhookId}`);
    
    if (!webhook) {
      return c.json({ error: 'Webhook not found' }, 404);
    }

    // Delete webhook
    await kv.del(`webhook:${user.id}:${webhookId}`);

    console.log('✅ [Webhook] Deleted webhook:', webhookId);

    return c.json({ success: true });
  } catch (error) {
    console.error('❌ [Webhook] Error deleting webhook:', error);
    return c.json({ error: 'Failed to delete webhook' }, 500);
  }
});

// Test webhook
app.post("/make-server-215f78a5/webhooks/:webhookId/test", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const webhookId = c.req.param('webhookId');

    // Get webhook
    const webhook = await kv.get(`webhook:${user.id}:${webhookId}`);
    
    if (!webhook) {
      return c.json({ error: 'Webhook not found' }, 404);
    }

    // Send test payload
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from Case Where',
        webhook_id: webhookId
      }
    };

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': webhook.secret
        },
        body: JSON.stringify(testPayload)
      });

      // Update statistics
      if (response.ok) {
        webhook.success_count = (webhook.success_count || 0) + 1;
      } else {
        webhook.failure_count = (webhook.failure_count || 0) + 1;
      }
      webhook.last_triggered_at = new Date().toISOString();
      await kv.set(`webhook:${user.id}:${webhookId}`, webhook);

      console.log('✅ [Webhook] Test sent to:', webhook.url, 'Status:', response.status);

      return c.json({ 
        success: true, 
        status: response.status,
        message: response.ok ? 'Test webhook delivered successfully' : 'Test webhook failed'
      });
    } catch (fetchError) {
      console.error('❌ [Webhook] Test failed:', fetchError);
      webhook.failure_count = (webhook.failure_count || 0) + 1;
      webhook.last_triggered_at = new Date().toISOString();
      await kv.set(`webhook:${user.id}:${webhookId}`, webhook);

      return c.json({ error: 'Failed to deliver test webhook' }, 500);
    }
  } catch (error) {
    console.error('❌ [Webhook] Error testing webhook:', error);
    return c.json({ error: 'Failed to test webhook' }, 500);
  }
});

// Enhanced webhook delivery with retry logic
async function deliverWebhookWithRetry(webhook: any, payload: any, maxRetries = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': webhook.secret,
          'X-Webhook-Attempt': attempt.toString(),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`✅ [Webhook] Delivered on attempt ${attempt}:`, webhook.url);
        return true;
      }

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`⏳ [Webhook] Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.error(`❌ [Webhook] Attempt ${attempt} error:`, error);
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`❌ [Webhook] All ${maxRetries} attempts failed for:`, webhook.url);
  return false;
}

// Enhanced webhook trigger with retry
async function triggerWebhooksWithRetry(userId: string, event: string, data: any) {
  try {
    const allWebhooks = (await kv.getByPrefix(`webhook:${userId}:`) || []).map(item => item.value);
    const activeWebhooks = allWebhooks.filter((w: any) => 
      w.status === 'active' && w.events.includes(event)
    );

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data
    };

    for (const webhook of activeWebhooks) {
      const success = await deliverWebhookWithRetry(webhook, payload);
      
      // Update statistics
      if (success) {
        webhook.success_count = (webhook.success_count || 0) + 1;
      } else {
        webhook.failure_count = (webhook.failure_count || 0) + 1;
      }
      webhook.last_triggered_at = new Date().toISOString();
      await kv.set(`webhook:${userId}:${webhook.id}`, webhook);
    }
  } catch (error) {
    console.error('❌ [Webhook] Error in triggerWebhooksWithRetry:', error);
  }
}

// ============= CHAT ROUTES (ENTERPRISE) =============

// Get chats for current user
app.get("/make-server-215f78a5/chats", async (c) => {
  try {
    // 🔧 FIX: Support dev mode with X-Dev-Token header
    const devToken = c.req.header('X-Dev-Token');
    let accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // If dev token is provided, use it as the access token
    if (devToken && devToken.startsWith('dev-user-')) {
      accessToken = devToken;
      console.log('🧪 [Get Chats] Using dev token from X-Dev-Token header');
    }
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check enterprise subscription
    const { hasEnterprise, subscription } = await checkEnterpriseSubscription(user.id);
    
    if (!hasEnterprise) {
      return c.json({ 
        error: 'Chat is only available for Enterprise plan users',
        currentPlan: subscription?.plan || 'free',
        requiredPlan: 'enterprise'
      }, 403);
    }

    // Get user's chats
    const allChats = (await kv.getByPrefix(`chat:${user.id}:`) || []).map(item => item.value);
    
    // Sort by last message time
    const sortedChats = allChats.sort((a: any, b: any) => {
      const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return timeB - timeA;
    });
    
    return c.json({ chats: sortedChats });
  } catch (error) {
    console.error('❌ [Chat] Error fetching chats:', error);
    return c.json({ error: 'Failed to fetch chats' }, 500);
  }
});

// Get messages for a chat
app.get("/make-server-215f78a5/chats/:chatId/messages", async (c) => {
  try {
    // 🔧 FIX: Support dev mode with X-Dev-Token header
    const devToken = c.req.header('X-Dev-Token');
    let accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // If dev token is provided, use it as the access token
    if (devToken && devToken.startsWith('dev-user-')) {
      accessToken = devToken;
      console.log('🧪 [Get Messages] Using dev token from X-Dev-Token header');
    }
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const chatId = c.req.param('chatId');

    // Get chat to verify ownership
    const chat = await kv.get(`chat:${user.id}:${chatId}`);
    
    if (!chat) {
      return c.json({ error: 'Chat not found' }, 404);
    }

    // Get messages
    const allMessages = (await kv.getByPrefix(`chat_message:${chatId}:`) || []).map(item => item.value);
    
    // Sort by created_at
    const sortedMessages = allMessages.sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    return c.json({ messages: sortedMessages });
  } catch (error) {
    console.error('❌ [Chat] Error fetching messages:', error);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});

// Send message
app.post("/make-server-215f78a5/chats/:chatId/messages", async (c) => {
  try {
    // 🔧 FIX: Support dev mode with X-Dev-Token header
    const devToken = c.req.header('X-Dev-Token');
    let accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // If dev token is provided, use it as the access token
    if (devToken && devToken.startsWith('dev-user-')) {
      accessToken = devToken;
      console.log('🧪 [Send Message] Using dev token from X-Dev-Token header');
    }
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const chatId = c.req.param('chatId');
    const { message } = await c.req.json();

    if (!message || !message.trim()) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Get chat to verify ownership
    const chat = await kv.get(`chat:${user.id}:${chatId}`);
    
    if (!chat) {
      return c.json({ error: 'Chat not found' }, 404);
    }

    // Get user profile - using underscore format (統一格式)
    const userProfile = await kv.get(`profile_${user.id}`) || await kv.get(`profile:${user.id}`);
    const senderName = userProfile?.full_name || userProfile?.email || 'User';

    // Create message
    const messageId = crypto.randomUUID();
    const newMessage = {
      id: messageId,
      chat_id: chatId,
      sender_id: user.id,
      sender_name: senderName,
      message: message.trim(),
      created_at: new Date().toISOString(),
      read: false,
    };

    await kv.set(`chat_message:${chatId}:${messageId}`, newMessage);

    // Update chat's last message
    chat.last_message = message.trim();
    chat.last_message_at = new Date().toISOString();
    await kv.set(`chat:${user.id}:${chatId}`, chat);

    // Update recipient's chat unread count
    const recipientChatKey = `chat:${chat.recipient_id}:${chatId}`;
    const recipientChat = await kv.get(recipientChatKey);
    if (recipientChat) {
      recipientChat.unread_count = (recipientChat.unread_count || 0) + 1;
      recipientChat.last_message = message.trim();
      recipientChat.last_message_at = new Date().toISOString();
      await kv.set(recipientChatKey, recipientChat);
    }

    console.log('✅ [Chat] Message sent:', messageId);

    // 🤖 Auto-reply from bot (if recipient is a bot)
    if (chat.recipient_id === 'account-manager-001' || chat.recipient_id === 'support-team-001') {
      console.log('🤖 [Chat Bot] Triggering auto-reply for recipient:', chat.recipient_id);
      
      // Import bot service (inline to avoid complex imports in Deno)
      const { getAccountManagerResponse, getSupportTeamResponse, detectLanguage } = await import('./enterprise_chat_bot.tsx');
      
      // Detect language
      const language = detectLanguage(message.trim());
      
      // Get bot response
      const botResponse = chat.recipient_id === 'account-manager-001'
        ? getAccountManagerResponse(message.trim(), language)
        : getSupportTeamResponse(message.trim(), language);
      
      // Schedule bot reply with delay
      setTimeout(async () => {
        try {
          const botMessageId = crypto.randomUUID();
          const botName = chat.recipient_id === 'account-manager-001'
            ? (language === 'en' ? 'Account Manager' : '客戶經理')
            : (language === 'en' ? 'Support Team' : '即時支援');
          
          const botMessage = {
            id: botMessageId,
            chat_id: chatId,
            sender_id: chat.recipient_id,
            sender_name: botName,
            message: botResponse.message,
            created_at: new Date().toISOString(),
            read: false,
          };
          
          await kv.set(`chat_message:${chatId}:${botMessageId}`, botMessage);
          
          // Update chat's last message
          chat.last_message = botResponse.message.substring(0, 50) + '...';
          chat.last_message_at = new Date().toISOString();
          await kv.set(`chat:${user.id}:${chatId}`, chat);
          
          console.log('✅ [Chat Bot] Auto-reply sent:', botMessageId);
        } catch (botError) {
          console.error('❌ [Chat Bot] Error sending auto-reply:', botError);
        }
      }, botResponse.delay || 1000);
    }

    return c.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('❌ [Chat] Error sending message:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// Mark messages as read
app.post("/make-server-215f78a5/chats/:chatId/read", async (c) => {
  try {
    // 🔧 FIX: Support dev mode with X-Dev-Token header
    const devToken = c.req.header('X-Dev-Token');
    let accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // If dev token is provided, use it as the access token
    if (devToken && devToken.startsWith('dev-user-')) {
      accessToken = devToken;
      console.log('🧪 [Mark as Read] Using dev token from X-Dev-Token header');
    }
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const chatId = c.req.param('chatId');

    // Get chat
    const chat = await kv.get(`chat:${user.id}:${chatId}`);
    
    if (!chat) {
      return c.json({ error: 'Chat not found' }, 404);
    }

    // Mark all messages as read
    const allMessages = (await kv.getByPrefix(`chat_message:${chatId}:`) || []).map(item => item.value);
    
    for (const message of allMessages) {
      if (message.sender_id !== user.id && !message.read) {
        message.read = true;
        await kv.set(`chat_message:${chatId}:${message.id}`, message);
      }
    }

    // Update chat unread count
    chat.unread_count = 0;
    await kv.set(`chat:${user.id}:${chatId}`, chat);

    console.log('✅ [Chat] Messages marked as read:', chatId);

    return c.json({ success: true });
  } catch (error) {
    console.error('❌ [Chat] Error marking as read:', error);
    return c.json({ error: 'Failed to mark as read' }, 500);
  }
});

// Create chat (or get existing)
app.post("/make-server-215f78a5/chats", async (c) => {
  try {
    // 🔧 FIX: Support dev mode with X-Dev-Token header
    const devToken = c.req.header('X-Dev-Token');
    let accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // If dev token is provided, use it as the access token
    if (devToken && devToken.startsWith('dev-user-')) {
      accessToken = devToken;
      console.log('🧪 [Create Chat] Using dev token from X-Dev-Token header');
    }
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check enterprise subscription
    const { hasEnterprise, subscription } = await checkEnterpriseSubscription(user.id);
    
    if (!hasEnterprise) {
      return c.json({ 
        error: 'Chat is only available for Enterprise plan users',
        currentPlan: subscription?.plan || 'free',
        requiredPlan: 'enterprise'
      }, 403);
    }

    const { recipient_id, recipient_name, recipient_type } = await c.req.json();

    if (!recipient_id || !recipient_name || !recipient_type) {
      return c.json({ error: 'Recipient information required' }, 400);
    }

    // Check if chat already exists
    const existingChats = (await kv.getByPrefix(`chat:${user.id}:`) || []).map(item => item.value);
    const existingChat = existingChats.find((c: any) => c.recipient_id === recipient_id);

    if (existingChat) {
      return c.json({ success: true, chat: existingChat });
    }

    // Create new chat
    const chatId = crypto.randomUUID();
    const chat = {
      id: chatId,
      user_id: user.id,
      recipient_id,
      recipient_name,
      recipient_type,
      unread_count: 0,
      online: false,
      created_at: new Date().toISOString(),
    };

    await kv.set(`chat:${user.id}:${chatId}`, chat);

    // Create reciprocal chat for recipient
    const recipientChat = {
      id: chatId,
      user_id: recipient_id,
      recipient_id: user.id,
      recipient_name: user.email || 'User',
      recipient_type: 'user',
      unread_count: 0,
      online: false,
      created_at: new Date().toISOString(),
    };

    await kv.set(`chat:${recipient_id}:${chatId}`, recipientChat);

    console.log('✅ [Chat] Created chat:', chatId);

    return c.json({ success: true, chat });
  } catch (error) {
    console.error('❌ [Chat] Error creating chat:', error);
    return c.json({ error: 'Failed to create chat' }, 500);
  }
});

// ============= SLA MONITORING ROUTES (ENTERPRISE) =============

// SLA targets by priority (in hours)
const SLA_TARGETS = {
  urgent: { response: 1, resolution: 4 },
  high: { response: 4, resolution: 8 },
  normal: { response: 8, resolution: 24 },
  low: { response: 24, resolution: 48 },
};

// Get SLA metrics
app.get("/make-server-215f78a5/sla/metrics", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check enterprise subscription
    const { hasEnterprise, subscription } = await checkEnterpriseSubscription(user.id);
    
    if (!hasEnterprise) {
      return c.json({ 
        error: 'SLA monitoring is only available for Enterprise plan users',
        currentPlan: subscription?.plan || 'free',
        requiredPlan: 'enterprise'
      }, 403);
    }

    // Get all tickets (try both key formats)
    const allTicketsColon = (await kv.getByPrefix('support_ticket:') || []).map(item => item.value);
    const allTicketsUnderscore = (await kv.getByPrefix('support_ticket_') || []).map(item => item.value);
    const allTickets = [...allTicketsColon, ...allTicketsUnderscore]
      .filter((t: any) => t.user_id === user.id);
    
    // Calculate SLA metrics for each ticket
    const metrics = allTickets.map((ticket: any) => {
      const priority = ticket.priority || 'normal';
      const targets = SLA_TARGETS[priority as keyof typeof SLA_TARGETS];
      
      const created = new Date(ticket.created_at);
      const now = new Date();
      
      // Calculate response time
      let responseTime = undefined;
      let responseStatus = 'pending';
      if (ticket.first_response_at) {
        const firstResponse = new Date(ticket.first_response_at);
        responseTime = (firstResponse.getTime() - created.getTime()) / (1000 * 60 * 60);
        responseStatus = responseTime <= targets.response ? 'met' : 'breached';
      } else if (ticket.status !== 'open') {
        const elapsed = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
        if (elapsed > targets.response) {
          responseStatus = 'breached';
        }
      }
      
      // Calculate resolution time
      let resolutionTime = undefined;
      let resolutionStatus = 'pending';
      if (ticket.status === 'resolved' || ticket.status === 'closed') {
        const resolved = new Date(ticket.updated_at || ticket.created_at);
        resolutionTime = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
        resolutionStatus = resolutionTime <= targets.resolution ? 'met' : 'breached';
      }
      
      return {
        id: ticket.id,
        ticket_id: ticket.id,
        ticket_title: ticket.title,
        priority,
        created_at: ticket.created_at,
        first_response_at: ticket.first_response_at,
        resolved_at: ticket.status === 'resolved' ? ticket.updated_at : undefined,
        sla_target_response: targets.response,
        sla_target_resolution: targets.resolution,
        response_time: responseTime,
        resolution_time: resolutionTime,
        response_status: responseStatus,
        resolution_status: resolutionStatus,
      };
    });
    
    // Calculate statistics
    const responseMet = metrics.filter((m: any) => m.response_status === 'met').length;
    const responseBreached = metrics.filter((m: any) => m.response_status === 'breached').length;
    const resolutionMet = metrics.filter((m: any) => m.resolution_status === 'met').length;
    const resolutionBreached = metrics.filter((m: any) => m.resolution_status === 'breached').length;
    
    const avgResponseTime = metrics
      .filter((m: any) => m.response_time !== undefined)
      .reduce((sum: number, m: any) => sum + m.response_time, 0) / 
      (metrics.filter((m: any) => m.response_time !== undefined).length || 1);
      
    const avgResolutionTime = metrics
      .filter((m: any) => m.resolution_time !== undefined)
      .reduce((sum: number, m: any) => sum + m.resolution_time, 0) / 
      (metrics.filter((m: any) => m.resolution_time !== undefined).length || 1);
    
    const stats = {
      total_tickets: allTickets.length,
      response_sla_met: responseMet,
      response_sla_breached: responseBreached,
      resolution_sla_met: resolutionMet,
      resolution_sla_breached: resolutionBreached,
      avg_response_time: avgResponseTime || 0,
      avg_resolution_time: avgResolutionTime || 0,
      response_sla_percentage: (responseMet / (responseMet + responseBreached || 1)) * 100,
      resolution_sla_percentage: (resolutionMet / (resolutionMet + resolutionBreached || 1)) * 100,
    };
    
    // Get active tickets
    const active = metrics.filter((m: any) => 
      m.resolution_status === 'pending'
    );
    
    return c.json({ 
      metrics: metrics.reverse(),
      stats,
      active,
    });
  } catch (error) {
    console.error('❌ [SLA] Error fetching metrics:', error);
    return c.json({ error: 'Failed to fetch SLA metrics' }, 500);
  }
});

// ============= WALLET ROUTES =============

// Get wallet for current user
app.get("/make-server-215f78a5/wallet/:userId", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const requestedUserId = c.req.param('userId');
    
    // Users can only view their own wallet
    if (user.id !== requestedUserId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const walletKey = `wallet_${user.id}`;
    let wallet = await kv.get(walletKey);
    
    // Create wallet if it doesn't exist OR migrate from old format
    if (!wallet) {
      // Check if old format wallet exists (wallet:userId with balance field)
      const oldWalletKey = `wallet:${user.id}`;
      const oldWallet = await kv.get(oldWalletKey);
      
      if (oldWallet) {
        // Migrate from old format to new format
        wallet = {
          user_id: user.id,
          available_balance: oldWallet.balance || 0,
          pending_withdrawal: 0,
          total_earned: oldWallet.total_earned || 0,
          total_spent: oldWallet.total_spent || 0,
          created_at: oldWallet.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await kv.set(walletKey, wallet);
        console.log(`✅ Migrated wallet from old format for user ${user.id}, balance: ${wallet.available_balance}`);
      } else {
        // Create new wallet
        wallet = {
          user_id: user.id,
          available_balance: 0,
          pending_withdrawal: 0,
          total_earned: 0,
          total_spent: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await kv.set(walletKey, wallet);
        console.log(`✅ Created new wallet for user ${user.id}`);
      }
    } else {
      // 🔄 Migrate field names if wallet exists but uses old structure
      let needsMigration = false;
      if (wallet.balance !== undefined && wallet.available_balance === undefined) {
        console.log(`🔄 Migrating wallet field for user ${user.id}: balance ${wallet.balance} -> available_balance`);
        wallet.available_balance = wallet.balance || 0;
        delete wallet.balance;
        needsMigration = true;
      }
      if (wallet.locked !== undefined && wallet.pending_withdrawal === undefined) {
        console.log(`🔄 Migrating wallet field for user ${user.id}: locked ${wallet.locked} -> pending_withdrawal`);
        wallet.pending_withdrawal = wallet.locked || 0;
        delete wallet.locked;
        needsMigration = true;
      }
      if (needsMigration) {
        wallet.updated_at = new Date().toISOString();
        await kv.set(walletKey, wallet);
        console.log(`✅ Migrated wallet fields for user ${user.id}, available_balance: ${wallet.available_balance}`);
      }
    }

    return c.json({ wallet });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return c.json({ error: 'Failed to fetch wallet' }, 500);
  }
});

// Get wallet for current user (alternative route without userId)
app.get("/make-server-215f78a5/wallet", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const walletKey = `wallet_${user.id}`;
    let wallet = await kv.get(walletKey);
    
    // Create wallet if it doesn't exist OR migrate from old format
    if (!wallet) {
      // Check if old format wallet exists (wallet:userId with balance field)
      const oldWalletKey = `wallet:${user.id}`;
      const oldWallet = await kv.get(oldWalletKey);
      
      if (oldWallet) {
        // Migrate from old format to new format
        wallet = {
          user_id: user.id,
          available_balance: oldWallet.balance || 0,
          pending_withdrawal: oldWallet.locked || 0,
          total_earned: oldWallet.total_earned || 0,
          total_spent: oldWallet.total_spent || 0,
          created_at: oldWallet.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await kv.set(walletKey, wallet);
        // Delete old wallet
        await kv.del(oldWalletKey);
        console.log(`✅ Migrated wallet from old key format for user ${user.id}, available_balance: ${wallet.available_balance}`);
      } else {
        // Create new wallet
        wallet = {
          user_id: user.id,
          available_balance: 0,
          pending_withdrawal: 0,
          total_earned: 0,
          total_spent: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await kv.set(walletKey, wallet);
        console.log(`✅ Created new wallet for user ${user.id}`);
      }
    } else {
      // 🔄 Migrate field names if wallet exists but uses old structure
      let needsMigration = false;
      if (wallet.balance !== undefined && wallet.available_balance === undefined) {
        console.log(`🔄 Migrating wallet field for user ${user.id}: balance ${wallet.balance} -> available_balance`);
        wallet.available_balance = wallet.balance || 0;
        delete wallet.balance;
        needsMigration = true;
      }
      if (wallet.locked !== undefined && wallet.pending_withdrawal === undefined) {
        console.log(`🔄 Migrating wallet field for user ${user.id}: locked ${wallet.locked} -> pending_withdrawal`);
        wallet.pending_withdrawal = wallet.locked || 0;
        delete wallet.locked;
        needsMigration = true;
      }
      
      // 🔄 Additional check: If wallet exists with new key but has 0 balance,
      // check if there's an old wallet with actual balance
      if (wallet.available_balance === 0 && wallet.total_earned > 0) {
        console.log(`⚠️ Wallet anomaly detected for user ${user.id}: available_balance=0 but total_earned=${wallet.total_earned}`);
        const oldWalletKey = `wallet:${user.id}`;
        const oldWallet = await kv.get(oldWalletKey);
        
        if (oldWallet && oldWallet.balance > 0) {
          console.log(`🔄 Found old wallet with balance ${oldWallet.balance}, merging...`);
          wallet.available_balance = (wallet.available_balance || 0) + (oldWallet.balance || 0);
          wallet.pending_withdrawal = (wallet.pending_withdrawal || 0) + (oldWallet.locked || 0);
          wallet.total_earned = Math.max(wallet.total_earned || 0, oldWallet.total_earned || 0);
          wallet.total_spent = Math.max(wallet.total_spent || 0, oldWallet.total_spent || 0);
          needsMigration = true;
          // Delete old wallet after merge
          await kv.del(oldWalletKey);
          console.log(`✅ Merged old wallet data, new available_balance: ${wallet.available_balance}`);
        }
      }
      
      if (needsMigration) {
        wallet.updated_at = new Date().toISOString();
        await kv.set(walletKey, wallet);
        console.log(`✅ Migrated wallet fields for user ${user.id}, available_balance: ${wallet.available_balance}`);
      }
    }

    return c.json({ wallet });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return c.json({ error: 'Failed to fetch wallet' }, 500);
  }
});

// ============= WALLET DEPOSIT & WITHDRAWAL ROUTES =============

// Manual wallet migration endpoint (for debugging)
app.post("/make-server-215f78a5/wallet/migrate", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`🔧 [Manual Migration] Starting wallet migration for user ${user.id}`);
    
    const walletKey = `wallet_${user.id}`;
    const oldWalletKey = `wallet:${user.id}`;
    
    let wallet = await kv.get(walletKey);
    const oldWallet = await kv.get(oldWalletKey);
    
    console.log(`🔧 [Manual Migration] New wallet (${walletKey}):`, JSON.stringify(wallet, null, 2));
    console.log(`🔧 [Manual Migration] Old wallet (${oldWalletKey}):`, JSON.stringify(oldWallet, null, 2));
    
    let migrationActions = [];
    
    if (oldWallet) {
      if (!wallet) {
        // Create new wallet from old wallet
        wallet = {
          user_id: user.id,
          available_balance: oldWallet.balance || 0,
          pending_withdrawal: oldWallet.locked || 0,
          total_earned: oldWallet.total_earned || 0,
          total_spent: oldWallet.total_spent || 0,
          created_at: oldWallet.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await kv.set(walletKey, wallet);
        migrationActions.push(`Created new wallet from old wallet, available_balance: ${wallet.available_balance}`);
      } else {
        // Merge old wallet into new wallet
        const oldBalance = oldWallet.balance || 0;
        const oldLocked = oldWallet.locked || 0;
        
        wallet.available_balance = (wallet.available_balance || 0) + oldBalance;
        wallet.pending_withdrawal = (wallet.pending_withdrawal || 0) + oldLocked;
        wallet.total_earned = Math.max(wallet.total_earned || 0, oldWallet.total_earned || 0);
        wallet.total_spent = Math.max(wallet.total_spent || 0, oldWallet.total_spent || 0);
        wallet.updated_at = new Date().toISOString();
        await kv.set(walletKey, wallet);
        migrationActions.push(`Merged old wallet (balance: ${oldBalance}) into new wallet, new available_balance: ${wallet.available_balance}`);
      }
      
      // Delete old wallet
      await kv.del(oldWalletKey);
      migrationActions.push('Deleted old wallet');
    } else if (wallet) {
      // Check if wallet needs field migration
      if (wallet.balance !== undefined || wallet.locked !== undefined) {
        if (wallet.balance !== undefined) {
          wallet.available_balance = wallet.balance;
          delete wallet.balance;
          migrationActions.push(`Migrated balance field: ${wallet.available_balance}`);
        }
        if (wallet.locked !== undefined) {
          wallet.pending_withdrawal = wallet.locked;
          delete wallet.locked;
          migrationActions.push(`Migrated locked field: ${wallet.pending_withdrawal}`);
        }
        wallet.updated_at = new Date().toISOString();
        await kv.set(walletKey, wallet);
      } else {
        migrationActions.push('No migration needed - wallet already in new format');
      }
    } else {
      migrationActions.push('No wallet found - nothing to migrate');
    }
    
    console.log(`✅ [Manual Migration] Completed for user ${user.id}:`, migrationActions);
    console.log(`✅ [Manual Migration] Final wallet:`, JSON.stringify(wallet, null, 2));
    
    return c.json({
      success: true,
      migrations: migrationActions,
      wallet
    });
  } catch (error) {
    console.error('❌ [Manual Migration] Error:', error);
    return c.json({ error: 'Migration failed' }, 500);
  }
});

// ============= DIAGNOSTICS ROUTES =============

// Proposal count diagnostics
app.get("/make-server-215f78a5/diagnostics/proposal-count/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || user.id !== userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get total proposals (all time)
    const proposalIds = await kv.get(`proposals:user:${userId}`) || [];
    const totalProposals = proposalIds.length;

    // Get this month's usage counter
    const now = new Date();
    const usageKey = `usage_${userId}_${now.getFullYear()}_${now.getMonth() + 1}`;
    const usage = await kv.get(usageKey) || { projects: 0, proposals: 0 };
    const thisMonthCount = usage.proposals || 0;

    // Get actual proposals created this month
    const proposals = Array.isArray(proposalIds) && proposalIds.length > 0
      ? await kv.mget(proposalIds.map(id => `proposal:${id}`))
      : [];
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthProposals = proposals.filter(p => 
      p && new Date(p.created_at) >= monthStart
    );

    return c.json({
      userId,
      totalProposals,
      thisMonthCount,
      thisMonthProposals,
      usageKey,
    });
  } catch (error) {
    console.error('Error in proposal count diagnostics:', error);
    return c.json({ error: 'Failed to get diagnostics' }, 500);
  }
});

// Sync proposal count
app.post("/make-server-215f78a5/diagnostics/sync-proposal-count", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all user's proposals
    const proposalIds = await kv.get(`proposals:user:${user.id}`) || [];
    const proposals = Array.isArray(proposalIds) && proposalIds.length > 0
      ? await kv.mget(proposalIds.map(id => `proposal:${id}`))
      : [];

    // Count proposals by month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthProposals = proposals.filter(p => 
      p && new Date(p.created_at) >= monthStart
    );

    // Update usage counter to match actual count
    const usageKey = `usage_${user.id}_${now.getFullYear()}_${now.getMonth() + 1}`;
    const usage = await kv.get(usageKey) || { projects: 0, proposals: 0 };
    usage.proposals = thisMonthProposals.length;
    await kv.set(usageKey, usage);

    return c.json({
      userId: user.id,
      totalProposals: proposalIds.length,
      thisMonthCount: usage.proposals,
      thisMonthProposals,
      synced: true,
    });
  } catch (error) {
    console.error('Error syncing proposal count:', error);
    return c.json({ error: 'Failed to sync proposal count' }, 500);
  }
});

// Deposit funds to wallet
app.post("/make-server-215f78a5/wallet/deposit", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      return c.json({ error: 'Invalid amount' }, 400);
    }

    if (amount > 1000000) {
      return c.json({ error: 'Maximum deposit amount is $1,000,000' }, 400);
    }

    const walletKey = `wallet_${user.id}`;
    let wallet = await kv.get(walletKey);

    // Create wallet if it doesn't exist
    if (!wallet) {
      wallet = {
        user_id: user.id,
        available_balance: 0,
        pending_withdrawal: 0,
        total_earned: 0,
        total_spent: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } else {
      // 🔄 Migrate old wallet data structure if needed
      if (wallet.balance !== undefined && wallet.available_balance === undefined) {
        console.log(`🔄 Migrating wallet data for user ${user.id}: balance ${wallet.balance} -> available_balance`);
        wallet.available_balance = wallet.balance || 0;
        delete wallet.balance;
      }
      if (wallet.locked !== undefined && wallet.pending_withdrawal === undefined) {
        console.log(`🔄 Migrating wallet data for user ${user.id}: locked ${wallet.locked} -> pending_withdrawal`);
        wallet.pending_withdrawal = wallet.locked || 0;
        delete wallet.locked;
      }
      // Ensure all required fields exist
      if (!wallet.total_earned) wallet.total_earned = 0;
      if (!wallet.total_spent) wallet.total_spent = 0;
      if (!wallet.created_at) wallet.created_at = new Date().toISOString();
    }

    // Update wallet balance
    wallet.available_balance = (wallet.available_balance || 0) + amount;
    wallet.updated_at = new Date().toISOString();
    await kv.set(walletKey, wallet);

    // Create transaction record
    const transactionKey = `transaction_${Date.now()}_${user.id}`;
    await kv.set(transactionKey, {
      id: transactionKey,
      user_id: user.id,
      type: 'deposit',
      amount: amount,
      description: `Deposit to wallet`,
      status: 'completed',
      created_at: new Date().toISOString(),
    });

    console.log(`✅ Deposit successful: $${amount} to user ${user.id}, new balance: $${wallet.available_balance}`);

    // 📧 Send deposit success email [v2.0 - with detailed logging]
    try {
      console.log(`🔍 [DEPOSIT EMAIL v2.0] Starting email send process for user ${user.id}`);
      
      const profile = await kv.get(`profile_${user.id}`);  // 統一使用下劃線格式
      console.log(`🔍 [DEPOSIT EMAIL] Profile lookup result:`, profile ? 'Found' : 'Not Found');
      
      if (profile) {
        console.log(`🔍 [DEPOSIT EMAIL] Profile data:`, {
          email: profile.email,
          name: profile.name,
          full_name: profile.full_name,
          language: profile.language
        });
      }
      
      if (profile?.email) {
        // 🔧 兼容多个语言字段名：language, bg_set, lang (默认使用中文)
        const language = profile.language || profile.bg_set || profile.lang || 'zh';
        console.log(`🔍 [DEPOSIT EMAIL] Generating email template in ${language}...`);
        console.log(`🔍 [DEPOSIT EMAIL] Language sources - language: ${profile.language}, bg_set: ${profile.bg_set}, final: ${language}`);
        
        let emailHtml = emailService.getDepositSuccessEmail({
          name: profile.name || profile.full_name || profile.email,
          amount,
          newBalance: wallet.available_balance,
          language,
        });
        
        // 🎨 Apply branding for enterprise users
        const { getUserBranding, injectBranding } = await import('./branded_email_helper.tsx');
        const branding = await getUserBranding(user.id);
        if (branding) {
          console.log('🎨 [Email] Applying branding to deposit email for user:', user.id);
          emailHtml = injectBranding(emailHtml, branding);
        }
        
        console.log(`🔍 [DEPOSIT EMAIL] Email template generated, length: ${emailHtml.length} chars`);
        console.log(`🔍 [DEPOSIT EMAIL] Calling sendEmail to ${profile.email}...`);

        const emailResult = await emailService.sendEmail({
          to: profile.email,
          subject: language === 'en' ? '✅ Deposit Successful' : '✅ 充值成功',
          html: emailHtml,
        });
        
        console.log(`🔍 [DEPOSIT EMAIL] Email send result:`, emailResult);
        console.log(`📧 Deposit success email sent to ${profile.email}`);
      } else {
        console.log(`⚠️ No profile or email found for user ${user.id}, skipping email`);
      }
    } catch (emailError) {
      console.error('❌ Error sending deposit success email:', emailError);
    }

    return c.json({ success: true, wallet });
  } catch (error) {
    console.error('Error processing deposit:', error);
    return c.json({ error: 'Failed to process deposit' }, 500);
  }
});

// 🧪 TEST ENDPOINT: Test deposit email sending
app.post("/make-server-215f78a5/test-deposit-email", async (c) => {
  try {
    console.log('🧪 [TEST ENDPOINT] Starting deposit email test...');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      // Silently return 401 for unauthenticated requests (test endpoint)
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`🧪 [TEST] User ID: ${user.id}`);
    
    // 📮 Check for custom test email
    const body = await c.req.json().catch(() => ({}));
    const customEmail = body.testEmail;
    
    if (customEmail) {
      console.log(`📮 [TEST] Using custom test email: ${customEmail}`);
    }
    
    // Get user profile - using underscore format (統一格式)
    const profile = await kv.get(`profile_${user.id}`);
    console.log(`🧪 [TEST] Profile lookup result:`, profile ? 'Found ✅' : 'Not Found ❌');
    
    if (profile) {
      console.log(`🧪 [TEST] Profile data:`, {
        email: profile.email,
        name: profile.name,
        full_name: profile.full_name,
        language: profile.language
      });
    }
    
    // Use custom email or profile email
    const recipientEmail = customEmail || profile?.email;
    
    if (!recipientEmail) {
      return c.json({ 
        success: false, 
        error: 'No email found in profile and no custom email provided',
        userId: user.id,
        profileExists: !!profile
      }, 400);
    }

    // Get wallet for balance info
    const wallet = await kv.get(`wallet_${user.id}`);
    const testAmount = 100;
    const newBalance = (wallet?.available_balance || 0) + testAmount;
    
    console.log(`🧪 [TEST] Wallet info - Current: ${wallet?.available_balance || 0}, Test amount: ${testAmount}, New: ${newBalance}`);

    // Generate email
    // 🔧 兼容多个语言字段名：language, bg_set, lang (默认使用中文)
    const language = profile?.language || profile?.bg_set || profile?.lang || 'zh';
    console.log(`🧪 [TEST] Generating email in ${language}...`);
    console.log(`🧪 [TEST] Language sources - language: ${profile?.language}, bg_set: ${profile?.bg_set}, final: ${language}`);
    
    let emailHtml = emailService.getDepositSuccessEmail({
      name: profile?.name || profile?.full_name || recipientEmail,
      amount: testAmount,
      newBalance: newBalance,
      language,
    });
    
    // 🎨 Apply branding for enterprise users
    const { getUserBranding, injectBranding } = await import('./branded_email_helper.tsx');
    const branding = await getUserBranding(user.id);
    if (branding) {
      console.log('🎨 [TEST Email] Applying branding for user:', user.id);
      emailHtml = injectBranding(emailHtml, branding);
    }
    
    console.log(`��� [TEST] Email template generated, length: ${emailHtml.length} chars`);

    // Send email
    console.log(`🧪 [TEST] Sending email to ${recipientEmail}...`);
    const emailResult = await emailService.sendEmail({
      to: recipientEmail,
      subject: `🧪 TEST - ${language === 'en' ? 'Deposit Successful' : '充值成功'}`,
      html: emailHtml,
    });
    
    console.log(`🧪 [TEST] Email send result:`, emailResult);

    return c.json({ 
      success: true,
      message: 'Test email sent successfully',
      details: {
        userId: user.id,
        email: recipientEmail,
        customEmailUsed: !!customEmail,
        language,
        testAmount,
        currentBalance: wallet?.available_balance || 0,
        emailResult
      }
    });
  } catch (error) {
    console.error('🧪 [TEST] Error:', error);
    return c.json({ 
      success: false, 
      error: 'Test failed', 
      details: error?.message || String(error)
    }, 500);
  }
});

// 🧪🧪 ULTRA SIMPLE TEST: Send plain text email
app.post("/make-server-215f78a5/test-simple-email", async (c) => {
  try {
    console.log('🧪🧪 [SIMPLE TEST] Starting ultra-simple email test...');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json().catch(() => ({}));
    const testEmail = body.testEmail;
    
    // Get profile (統一使用下劃線格式，fallback 到冒號格式)
    let profile = await kv.get(`profile_${user.id}`);
    if (!profile) {
      profile = await kv.get(`profile:${user.id}`);
    }
    const recipientEmail = testEmail || profile?.email || user.email;
    
    if (!recipientEmail) {
      return c.json({ error: 'No email found' }, 400);
    }

    console.log(`🧪🧪 [SIMPLE TEST] Sending to: ${recipientEmail}`);

    // Send ULTRA SIMPLE plain text email
    const simpleHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body>
        <p>Hello! This is a test email.</p>
        <p>If you receive this, the email system is working.</p>
        <p>Time: ${new Date().toISOString()}</p>
      </body>
      </html>
    `;

    const emailResult = await emailService.sendEmail({
      to: recipientEmail,
      subject: 'Simple Test Email',
      html: simpleHtml,
    });

    console.log(`🧪🧪 [SIMPLE TEST] Result:`, emailResult);

    return c.json({ 
      success: true,
      message: 'Simple test email sent',
      details: {
        to: recipientEmail,
        result: emailResult
      }
    });
  } catch (error) {
    console.error('🧪�� [SIMPLE TEST] Error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Withdraw funds from wallet
app.post("/make-server-215f78a5/wallet/withdraw", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      return c.json({ error: 'Invalid amount' }, 400);
    }

    const walletKey = `wallet_${user.id}`;
    let wallet = await kv.get(walletKey);

    if (!wallet) {
      return c.json({ error: 'Wallet not found' }, 404);
    }

    // 🔄 Migrate old wallet data structure if needed
    if (wallet.balance !== undefined && wallet.available_balance === undefined) {
      console.log(`🔄 Migrating wallet data for user ${user.id}: balance ${wallet.balance} -> available_balance`);
      wallet.available_balance = wallet.balance || 0;
      delete wallet.balance;
    }
    if (wallet.locked !== undefined && wallet.pending_withdrawal === undefined) {
      console.log(`🔄 Migrating wallet data for user ${user.id}: locked ${wallet.locked} -> pending_withdrawal`);
      wallet.pending_withdrawal = wallet.locked || 0;
      delete wallet.locked;
    }

    if (wallet.available_balance < amount) {
      return c.json({ error: 'Insufficient balance' }, 400);
    }

    // Update wallet balance (simple withdrawal without formal withdrawal request)
    wallet.available_balance -= amount;
    wallet.updated_at = new Date().toISOString();
    await kv.set(walletKey, wallet);

    // Create transaction record
    const transactionKey = `transaction_${Date.now()}_${user.id}`;
    await kv.set(transactionKey, {
      id: transactionKey,
      user_id: user.id,
      type: 'withdrawal',
      amount: -amount,
      description: `Withdrawal from wallet`,
      status: 'completed',
      created_at: new Date().toISOString(),
    });

    console.log(`✅ Withdrawal successful: $${amount} from user ${user.id}, new balance: $${wallet.available_balance}`);

    return c.json({ success: true, wallet });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return c.json({ error: 'Failed to process withdrawal' }, 500);
  }
});

// ============= BANK ACCOUNT ROUTES =============

// Get all bank accounts for a user
app.get("/make-server-215f78a5/bank-accounts/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || user.id !== userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const bankAccounts = (await kv.getByPrefix(`bank_account_${userId}_`) || []).map(item => item.value);
    
    bankAccounts.sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return c.json({ bank_accounts: bankAccounts });
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    return c.json({ error: 'Failed to fetch bank accounts' }, 500);
  }
});

// Add a new bank account
app.post("/make-server-215f78a5/bank-accounts", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.error('❌ Bank account add failed: No access token');
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      console.error('❌ Bank account add failed: Auth error', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    console.log('📝 Received bank account data:', {
      user_id: user.id,
      country: body.country,
      account_type: body.account_type,
      bank_name: body.bank_name,
      has_account_number: !!body.account_number,
      has_iban: !!body.iban,
      has_swift: !!body.swift_code,
      currency: body.currency
    });
    
    const { country, account_type, bank_name, account_number, iban, account_holder_name, branch_code, swift_code, routing_number, currency } = body;

    if (!bank_name || !account_holder_name) {
      console.error('❌ Bank account add failed: Missing required fields', { bank_name, account_holder_name });
      return c.json({ error: 'Missing required fields (bank name or account holder name)' }, 400);
    }

    if (account_type === 'international') {
      if (!iban && !swift_code) {
        console.error('❌ Bank account add failed: International account missing IBAN/SWIFT');
        return c.json({ error: 'IBAN or SWIFT code is required for international accounts' }, 400);
      }
    } else {
      if (!account_number) {
        console.error('❌ Bank account add failed: Local account missing account number');
        return c.json({ error: 'Account number is required for local accounts' }, 400);
      }
      if (account_number && !/^\d+$/.test(account_number)) {
        console.error('❌ Bank account add failed: Invalid account number format', account_number);
        return c.json({ error: 'Invalid account number format (must be digits only)' }, 400);
      }
    }

    const existingAccounts = (await kv.getByPrefix(`bank_account_${user.id}_`) || []).map(item => item.value);
    const isFirstAccount = existingAccounts.length === 0;

    const accountId = `bank_account_${user.id}_${Date.now()}`;
    const now = new Date().toISOString();

    let maskedAccountNumber = null;
    let maskedIban = null;

    if (account_number) {
      maskedAccountNumber = account_number.length > 7
        ? account_number.substring(0, 3) + '****' + account_number.substring(account_number.length - 4)
        : '****' + account_number.substring(account_number.length - 4);
    }

    if (iban) {
      const cleanIban = iban.replace(/\s/g, '');
      maskedIban = cleanIban.substring(0, 4) + '****' + cleanIban.substring(cleanIban.length - 4);
    }

    const bankAccount: any = {
      id: accountId,
      user_id: user.id,
      country: country || 'TW',
      account_type: account_type || 'local',
      bank_name,
      account_holder_name,
      currency: currency || 'TWD',
      is_default: isFirstAccount,
      created_at: now,
      updated_at: now,
    };

    if (account_number) {
      bankAccount.account_number = account_number;
      bankAccount.masked_account_number = maskedAccountNumber;
    }

    if (iban) {
      bankAccount.iban = iban;
      bankAccount.masked_iban = maskedIban;
    }

    if (branch_code) bankAccount.branch_code = branch_code;
    if (swift_code) bankAccount.swift_code = swift_code;
    if (routing_number) bankAccount.routing_number = routing_number;

    await kv.set(accountId, bankAccount);

    console.log(`✅ Bank account added for user ${user.id} (${country || 'TW'}, ${currency || 'TWD'})`);

    const { account_number: _, iban: __, ...accountToReturn } = bankAccount;

    return c.json({
      success: true,
      bank_account: accountToReturn,
    });
  } catch (error) {
    console.error('Error adding bank account:', error);
    return c.json({ error: 'Failed to add bank account' }, 500);
  }
});

// Set default bank account
app.post("/make-server-215f78a5/bank-accounts/:accountId/set-default", async (c) => {
  try {
    const accountId = c.req.param('accountId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const bankAccount = await kv.get(accountId);
    
    if (!bankAccount || bankAccount.user_id !== user.id) {
      return c.json({ error: 'Bank account not found' }, 404);
    }

    const allAccounts = (await kv.getByPrefix(`bank_account_${user.id}_`) || []).map(item => item.value);

    for (const account of allAccounts) {
      account.is_default = account.id === accountId;
      account.updated_at = new Date().toISOString();
      await kv.set(account.id, account);
    }

    console.log(`✅ Default bank account set for user ${user.id}`);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error setting default bank account:', error);
    return c.json({ error: 'Failed to set default bank account' }, 500);
  }
});

// Delete a bank account
app.delete("/make-server-215f78a5/bank-accounts/:accountId", async (c) => {
  try {
    const accountId = c.req.param('accountId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const bankAccount = await kv.get(accountId);
    
    if (!bankAccount || bankAccount.user_id !== user.id) {
      return c.json({ error: 'Bank account not found' }, 404);
    }

    await kv.del(accountId);

    if (bankAccount.is_default) {
      const remainingAccounts = (await kv.getByPrefix(`bank_account_${user.id}_`) || []).map(item => item.value);
      if (remainingAccounts.length > 0) {
        remainingAccounts[0].is_default = true;
        remainingAccounts[0].updated_at = new Date().toISOString();
        await kv.set(remainingAccounts[0].id, remainingAccounts[0]);
      }
    }

    console.log(`✅ Bank account deleted for user ${user.id}`);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    return c.json({ error: 'Failed to delete bank account' }, 500);
  }
});

// ============= WITHDRAWAL ROUTES =============

// Request a withdrawal
app.post("/make-server-215f78a5/withdrawals/request", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { amount, method_id } = body;

    if (!amount || amount <= 0) {
      return c.json({ error: 'Invalid amount' }, 400);
    }

    if (amount < 50) {
      return c.json({ error: 'Minimum withdrawal amount is $50' }, 400);
    }

    if (!method_id) {
      return c.json({ error: 'Withdrawal method required' }, 400);
    }

    const walletKey = `wallet_${user.id}`;
    const wallet = await kv.get(walletKey);

    if (!wallet || wallet.available_balance < amount) {
      return c.json({ error: 'Insufficient balance' }, 400);
    }

    const method = await kv.get(method_id);
    if (!method || method.user_id !== user.id) {
      return c.json({ error: 'Invalid withdrawal method' }, 400);
    }

    const fee = amount * 0.02;
    const netAmount = amount - fee;

    const withdrawalKey = `withdrawal_${Date.now()}_${user.id}`;
    const withdrawal = {
      id: withdrawalKey,
      user_id: user.id,
      amount,
      fee,
      net_amount: netAmount,
      method_id,
      method_type: method.type,
      method_details: method.type === 'bank' 
        ? `${method.bank_name} ****${method.account_number?.slice(-4)}`
        : method.paypal_email,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await kv.set(withdrawalKey, withdrawal);

    wallet.available_balance -= amount;
    wallet.pending_withdrawal = (wallet.pending_withdrawal || 0) + amount;
    await kv.set(walletKey, wallet);

    const transactionKey = `transaction_${Date.now()}_${user.id}`;
    await kv.set(transactionKey, {
      id: transactionKey,
      user_id: user.id,
      type: 'withdrawal',
      amount: -amount,
      description: `Withdrawal to ${withdrawal.method_details}`,
      status: 'pending',
      reference_id: withdrawalKey,
      created_at: new Date().toISOString(),
    });

    console.log(`✅ Withdrawal request created: ${withdrawalKey} for $${amount}`);

    return c.json({ success: true, withdrawal });
  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    return c.json({ error: 'Failed to create withdrawal request' }, 500);
  }
});

// Get all withdrawals for a user
app.get("/make-server-215f78a5/withdrawals", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.log('❌ [Withdrawals] No access token provided');
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      console.log('❌ [Withdrawals] Auth error:', authError?.message || 'No user ID');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`🔍 [Withdrawals] Fetching withdrawals for user: ${user.id}`);

    let allWithdrawals;
    try {
      allWithdrawals = (await kv.getByPrefix('withdrawal_')).map(item => item.value);
      console.log(`📊 [Withdrawals] getByPrefix returned:`, typeof allWithdrawals, Array.isArray(allWithdrawals));
    } catch (kvError) {
      console.error('❌ [Withdrawals] KV error:', kvError);
      allWithdrawals = [];
    }

    // Ensure it's an array
    if (!Array.isArray(allWithdrawals)) {
      console.log(`⚠️ [Withdrawals] getByPrefix returned non-array, converting...`);
      allWithdrawals = [];
    }

    const userWithdrawals = allWithdrawals.filter((w: any) => w?.user_id === user.id);
    const sorted = userWithdrawals.sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    console.log(`✅ [Withdrawals] Retrieved ${sorted.length} withdrawals for user ${user.id}`);

    return c.json({ withdrawals: sorted, total: sorted.length });
  } catch (error) {
    console.error('❌ [Withdrawals] Unexpected error:', error);
    return c.json({ 
      error: 'Failed to fetch withdrawals',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get withdrawal by ID
app.get("/make-server-215f78a5/withdrawals/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const withdrawalId = c.req.param('id');
    const withdrawal = await kv.get(withdrawalId);

    if (!withdrawal) {
      return c.json({ error: 'Withdrawal not found' }, 404);
    }

    if (withdrawal.user_id !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    return c.json({ withdrawal });
  } catch (error) {
    console.error('Error fetching withdrawal:', error);
    return c.json({ error: 'Failed to fetch withdrawal' }, 500);
  }
});

// Admin: Approve withdrawal
app.post("/make-server-215f78a5/withdrawals/:id/approve", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const withdrawalId = c.req.param('id');
    const withdrawal = await kv.get(withdrawalId);

    if (!withdrawal) {
      return c.json({ error: 'Withdrawal not found' }, 404);
    }

    if (withdrawal.status !== 'pending' && withdrawal.status !== 'processing') {
      return c.json({ error: 'Withdrawal cannot be approved' }, 400);
    }

    // 🎯 Check if it's a PayPal withdrawal - auto process
    if (withdrawal.method_type === 'paypal') {
      console.log(`💸 [Withdrawal Approve] PayPal withdrawal detected, initiating auto-payout...`);
      
      // Get PayPal method details
      const method = await kv.get(withdrawal.method_id);
      if (!method || !method.paypal_email) {
        console.error('❌ [Withdrawal Approve] PayPal method not found or missing email');
        return c.json({ error: 'PayPal account information not found' }, 400);
      }

      // Import PayPal service
      const { createPayout } = await import('./paypal_service.tsx');
      
      // Create PayPal payout
      const payoutResult = await createPayout(
        method.paypal_email,
        withdrawal.net_amount, // Use net amount (after fees)
        `Withdrawal from Case Where - Request ${withdrawalId}`,
        withdrawalId
      );

      if (payoutResult.success) {
        console.log(`✅ [Withdrawal Approve] PayPal payout created:`, {
          payoutBatchId: payoutResult.payoutBatchId,
          amount: withdrawal.net_amount,
          email: method.paypal_email,
        });

        // Update withdrawal with payout info
        withdrawal.status = 'completed';
        withdrawal.processed_at = new Date().toISOString();
        withdrawal.updated_at = new Date().toISOString();
        withdrawal.payout_batch_id = payoutResult.payoutBatchId;
        withdrawal.payout_item_id = payoutResult.payoutItemId;
        withdrawal.payout_status = payoutResult.status;
        withdrawal.payout_method = 'paypal_auto';
      } else {
        console.error('❌ [Withdrawal Approve] PayPal payout failed:', payoutResult.error);
        
        // Mark as processing failed, admin needs to check
        withdrawal.status = 'processing';
        withdrawal.processed_at = new Date().toISOString();
        withdrawal.updated_at = new Date().toISOString();
        withdrawal.payout_error = payoutResult.error;
        withdrawal.payout_method = 'paypal_auto_failed';
        
        await kv.set(withdrawalId, withdrawal);
        
        return c.json({ 
          success: false, 
          error: `PayPal payout failed: ${payoutResult.error}`,
          withdrawal 
        }, 500);
      }
    } else {
      // Manual withdrawal (bank transfer) - just mark as completed
      console.log(`🏦 [Withdrawal Approve] Manual withdrawal (${withdrawal.method_type}), marking as completed`);
      
      withdrawal.status = 'completed';
      withdrawal.processed_at = new Date().toISOString();
      withdrawal.updated_at = new Date().toISOString();
      withdrawal.payout_method = 'manual';
    }

    await kv.set(withdrawalId, withdrawal);

    // Update wallet
    const walletKey = `wallet_${withdrawal.user_id}`;
    const wallet = await kv.get(walletKey);
    if (wallet) {
      wallet.pending_withdrawal = (wallet.pending_withdrawal || 0) - withdrawal.amount;
      if (wallet.pending_withdrawal < 0) wallet.pending_withdrawal = 0;
      await kv.set(walletKey, wallet);
    }

    // Update transaction status
    const allTransactions = (await kv.getByPrefix('transaction_') || []).map(item => item.value);
    const transaction = allTransactions.find((t: any) => t.reference_id === withdrawalId);
    if (transaction) {
      transaction.status = 'completed';
      await kv.set(transaction.id, transaction);
    }

    console.log(`✅ Withdrawal ${withdrawalId} approved and processed`);

    return c.json({ success: true, withdrawal });
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    return c.json({ error: 'Failed to approve withdrawal' }, 500);
  }
});

// Admin: Reject withdrawal
app.post("/make-server-215f78a5/withdrawals/:id/reject", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const withdrawalId = c.req.param('id');
    const body = await c.req.json();
    const { reason } = body;

    const withdrawal = await kv.get(withdrawalId);

    if (!withdrawal) {
      return c.json({ error: 'Withdrawal not found' }, 404);
    }

    if (withdrawal.status !== 'pending' && withdrawal.status !== 'processing') {
      return c.json({ error: 'Withdrawal cannot be rejected' }, 400);
    }

    withdrawal.status = 'rejected';
    withdrawal.notes = reason || 'Withdrawal rejected';
    withdrawal.processed_at = new Date().toISOString();
    withdrawal.updated_at = new Date().toISOString();
    await kv.set(withdrawalId, withdrawal);

    const walletKey = `wallet_${withdrawal.user_id}`;
    const wallet = await kv.get(walletKey);
    if (wallet) {
      wallet.available_balance += withdrawal.amount;
      wallet.pending_withdrawal = (wallet.pending_withdrawal || 0) - withdrawal.amount;
      if (wallet.pending_withdrawal < 0) wallet.pending_withdrawal = 0;
      await kv.set(walletKey, wallet);
    }

    const allTransactions = (await kv.getByPrefix('transaction_') || []).map(item => item.value);
    const transaction = allTransactions.find((t: any) => t.reference_id === withdrawalId);
    if (transaction) {
      transaction.status = 'failed';
      await kv.set(transaction.id, transaction);
    }

    const refundKey = `transaction_${Date.now()}_${withdrawal.user_id}_refund`;
    await kv.set(refundKey, {
      id: refundKey,
      user_id: withdrawal.user_id,
      type: 'project_refund',
      amount: withdrawal.amount,
      description: `Withdrawal refund: ${withdrawal.notes}`,
      status: 'completed',
      reference_id: withdrawalId,
      created_at: new Date().toISOString(),
    });

    console.log(`❌ Withdrawal ${withdrawalId} rejected`);

    return c.json({ success: true, withdrawal });
  } catch (error) {
    console.error('Error rejecting withdrawal:', error);
    return c.json({ error: 'Failed to reject withdrawal' }, 500);
  }
});

// ============= ADMIN ROUTES =============

// Helper function to check if user is admin (by email)
async function isAdminByEmail(email: string): Promise<boolean> {
  return await adminCheck.isAnyAdminAsync(email);
}

// Helper function to check if user is admin (by userId) - DEPRECATED
// Use isAdminByEmail instead
async function isAdmin(userId: string): Promise<boolean> {
  // Get user profile to get email
  const profile = await kv.get(`profile_${userId}`);  // 統一使用下劃線格式
  if (!profile || !profile.email) {
    return false;
  }
  return await isAdminByEmail(profile.email);
}

// Admin: Set user subscription plan
app.post("/make-server-215f78a5/admin/set-subscription", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check admin permission
    const isUserAdmin = await isAdminByEmail(user.email);
    if (!isUserAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { userId, plan, status } = await c.req.json();

    if (!userId || !plan) {
      return c.json({ error: 'userId and plan are required' }, 400);
    }

    // Create or update subscription
    const subscriptionKey = `subscription_${userId}`;
    const now = new Date();
    const endDate = new Date(now);
    endDate.setFullYear(endDate.getFullYear() + 1); // 1 year subscription

    const subscription = {
      user_id: userId,
      plan, // 'free' | 'pro' | 'enterprise'
      status: status || 'active',
      start_date: now.toISOString(),
      end_date: endDate.toISOString(),
      auto_renew: true,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    await kv.set(subscriptionKey, subscription);

    console.log(`✅ [Admin] Set subscription for user ${userId} to ${plan}`);

    return c.json({ 
      success: true, 
      subscription,
      message: `Subscription set to ${plan} plan` 
    });
  } catch (error) {
    console.error('❌ [Admin] Error setting subscription:', error);
    return c.json({ error: 'Failed to set subscription' }, 500);
  }
});

// Admin: Setup special users (enterprise + wallet balance)
app.post("/make-server-215f78a5/admin/setup-special-users", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    console.log('🔍 [Admin/SpecialUsers] Token received, length:', accessToken?.length);
    console.log('🔍 [Admin/SpecialUsers] Token prefix:', accessToken?.substring(0, 30) + '...');

    // 使用 getUserFromToken 幫助函數（支持開發模式）
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (authError || !user?.email) {
      console.error('❌ [Admin/SpecialUsers] Auth failed:', authError);
      return c.json({ error: 'Unauthorized', message: authError?.message || 'Invalid JWT' }, 401);
    }

    console.log('✅ [Admin/SpecialUsers] User authenticated:', user.email);

    // Check admin permission
    const isUserAdmin = await isAdminByEmail(user.email);
    if (!isUserAdmin) {
      console.error('❌ [Admin/SpecialUsers] Not admin:', user.email);
      return c.json({ error: 'Admin access required' }, 403);
    }

    console.log('✅ [Admin/SpecialUsers] Admin verified:', user.email);

    // Special users to setup
    const specialEmails = [
      'davidlai117@yahoo.com.tw',
      'davidlai234@hotmail.com'
    ];

    const results = [];
    const passwords: Record<string, string> = {}; // Track passwords for newly created users
    const now = new Date();

    // Get all profiles to find user IDs
    const allProfiles = (await kv.getByPrefix('profile_') || []).map(item => item.value);
    
    for (const email of specialEmails) {
      // Find user profile by email
      let profile = allProfiles.find((p: any) => p.email === email);
      
      if (!profile) {
        // 🔧 User doesn't exist, create them automatically!
        console.log(`🆕 [Admin/SpecialUsers] Profile not found for ${email}, creating user...`);
        
        try {
          // Create user in Supabase Auth
          const randomPassword = `SpecialUser${Math.random().toString(36).substring(2, 10)}!`;
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: randomPassword,
            email_confirm: true, // Auto-confirm email
            user_metadata: { 
              name: email === 'davidlai117@yahoo.com.tw' ? 'David Lai (117)' : 'David Lai (234)',
              role: 'creator'
            }
          });

          if (authError || !authData?.user) {
            console.error(`❌ [Admin/SpecialUsers] Failed to create auth user for ${email}:`, authError);
            results.push({ email, status: 'error', message: `Failed to create auth user: ${authError?.message}` });
            continue;
          }

          const newUserId = authData.user.id;
          console.log(`✅ [Admin/SpecialUsers] Auth user created:`, newUserId);

          // Create profile in KV store
          const profileKey = `profile_${newUserId}`;
          profile = {
            id: newUserId,
            user_id: newUserId,
            email: email,
            name: email === 'davidlai117@yahoo.com.tw' ? 'David Lai (117)' : 'David Lai (234)',
            role: 'creator',
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          };

          await kv.set(profileKey, profile);
          console.log(`✅ [Admin/SpecialUsers] Profile created for ${email}`);
          
          // Track the password for this user
          passwords[email] = randomPassword;
          console.log(`🔑 [Admin/SpecialUsers] Password for ${email}: ${randomPassword}`);
          
        } catch (createError) {
          console.error(`❌ [Admin/SpecialUsers] Exception creating user ${email}:`, createError);
          results.push({ email, status: 'error', message: `Exception: ${createError instanceof Error ? createError.message : 'Unknown error'}` });
          continue;
        }
      }

      const userId = profile.user_id || profile.id;

      // 1. Set enterprise subscription
      const subscriptionKey = `subscription_${userId}`;
      const endDate = new Date(now);
      endDate.setFullYear(endDate.getFullYear() + 1);

      const subscription = {
        user_id: userId,
        plan: 'enterprise',
        status: 'active',
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        auto_renew: true,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      await kv.set(subscriptionKey, subscription);

      // 2. Setup wallet with balance (100,000 TWD → USD using real-time exchange rate)
      // ⭐ 重要：錢包統一存儲 USD，所以要先轉換貨幣
      const rates = await getExchangeRates();
      const amountTWD = 100000; // NT$100,000
      const amountUSD = Math.round((amountTWD / rates.TWD) * 100) / 100; // 轉換為 USD 並四捨五入到小數點後兩位
      
      console.log(`💱 [Admin/Setup] Exchange Rate: 1 USD = ${rates.TWD} TWD`);
      console.log(`💱 [Admin/Setup] Converting NT$${amountTWD.toLocaleString()} → $${amountUSD.toFixed(2)} USD`);
      
      const walletKey = `wallet_${userId}`;
      let wallet = await kv.get(walletKey);

      if (!wallet) {
        // Create new wallet
        wallet = {
          user_id: userId,
          available_balance: amountUSD, // ✅ 存儲 USD（已從 TWD 轉換）
          pending_withdrawal: 0,
          total_earned: 0,
          total_spent: 0,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        };
      } else {
        // Update existing wallet - ADD to balance instead of replacing
        const oldBalance = wallet.available_balance || 0;
        wallet.available_balance = oldBalance + amountUSD; // ✅ 增加餘額，不是覆蓋！
        wallet.updated_at = now.toISOString();
        console.log(`💰 [Admin/Setup] Balance updated: $${oldBalance.toFixed(2)} → $${wallet.available_balance.toFixed(2)} USD (+$${amountUSD.toFixed(2)})`);
      }

      await kv.set(walletKey, wallet);

      // 3. Create deposit transaction record
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const transactionKey = `transaction_${transactionId}`;
      
      const transaction = {
        id: transactionId,
        user_id: userId,
        type: 'deposit',
        amount: amountUSD, // ✅ 存儲 USD（已從 TWD 轉換）
        status: 'completed',
        description: '🎁 管理員充值 - 測試用企業帳號 (Admin top-up for testing)',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      await kv.set(transactionKey, transaction);

      console.log(`✅ [Admin] Setup completed for ${email}: Enterprise + NT$${amountTWD.toLocaleString()} ($${amountUSD.toFixed(2)} USD)`);
      
      results.push({
        email,
        userId,
        status: 'success',
        subscription: 'enterprise',
        wallet_balance_usd: amountUSD, // ✅ 返回 USD 金額
        wallet_balance_twd: amountTWD, // ✅ 同時返回 TWD 金額供參考
        message: `Enterprise subscription activated + NT$${amountTWD.toLocaleString()} ($${amountUSD.toFixed(2)} USD) added to wallet`
      });
    }

    return c.json({ 
      success: true, 
      results,
      passwords, // Include passwords for newly created users
      message: `Setup completed for ${results.filter(r => r.status === 'success').length} users`
    });
  } catch (error) {
    console.error('❌ [Admin] Error setting up special users:', error);
    return c.json({ error: 'Failed to setup special users' }, 500);
  }
});

// 🔧 Public: Initialize special users (PUBLIC endpoint with secret key)
// This endpoint uses a secret key instead of JWT to allow initial setup
// Note: Not under /admin/ path to bypass authorization middleware
app.post("/make-server-215f78a5/public/initialize-special-users", async (c) => {
  try {
    const body = await c.req.json();
    const { secretKey } = body;
    
    // 🔓 使用一個簡單的固定密鑰，因為這只是測試環境
    // 實際生產環境應該使用更安全的機制
    const expectedSecret = 'INIT_SPECIAL_USERS_2025';
    if (!secretKey || secretKey !== expectedSecret) {
      console.error('❌ [Public/InitSpecialUsers] Invalid secret key');
      return c.json({ error: 'Invalid secret key' }, 403);
    }

    console.log('✅ [Public/InitSpecialUsers] Secret key verified, proceeding with user creation...');

    // Special users to setup
    const specialEmails = [
      'davidlai117@yahoo.com.tw',
      'davidlai234@hotmail.com'
    ];

    const results = [];
    const passwords: Record<string, string> = {}; // Track passwords for newly created users
    const now = new Date();

    // Get all profiles to find user IDs
    const allProfiles = (await kv.getByPrefix('profile_') || []).map(item => item.value);
    
    for (const email of specialEmails) {
      // Find user profile by email
      let profile = allProfiles.find((p: any) => p.email === email);
      
      if (!profile) {
        // 🔧 User doesn't exist, create them automatically!
        console.log(`🆕 [Public/InitSpecialUsers] Profile not found for ${email}, creating user...`);
        
        try {
          // Create user in Supabase Auth
          const fixedPassword = 'CaseWHR2025!'; // 🔧 固定測試密碼，方便記憶
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: fixedPassword,
            email_confirm: true, // Auto-confirm email
            user_metadata: { 
              name: email === 'davidlai117@yahoo.com.tw' ? 'David Lai (117)' : 'David Lai (234)',
              role: 'creator'
            }
          });

          if (authError || !authData?.user) {
            console.error(`❌ [Public/InitSpecialUsers] Failed to create auth user for ${email}:`, authError);
            results.push({ email, status: 'error', message: `Failed to create auth user: ${authError?.message}` });
            continue;
          }

          const newUserId = authData.user.id;
          console.log(`✅ [Public/InitSpecialUsers] Auth user created:`, newUserId);

          // Create profile in KV store
          const profileKey = `profile_${newUserId}`;
          profile = {
            id: newUserId,
            user_id: newUserId,
            email: email,
            name: email === 'davidlai117@yahoo.com.tw' ? 'David Lai (117)' : 'David Lai (234)',
            role: 'creator',
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          };

          await kv.set(profileKey, profile);
          console.log(`✅ [Public/InitSpecialUsers] Profile created for ${email}`);
          
          // Track the password for this user
          passwords[email] = fixedPassword;
          console.log(`🔑 [Public/InitSpecialUsers] Password for ${email}: ${fixedPassword}`);
          
        } catch (createError) {
          console.error(`❌ [Public/InitSpecialUsers] Exception creating user ${email}:`, createError);
          results.push({ email, status: 'error', message: `Exception: ${createError instanceof Error ? createError.message : 'Unknown error'}` });
          continue;
        }
      } else {
        console.log(`ℹ️ [Public/InitSpecialUsers] User ${email} already exists, updating subscription and password...`);
        
        // 🔧 即使用戶已存在，也更新密碼為固定密碼
        try {
          const userId = profile.user_id || profile.id;
          const fixedPassword = 'CaseWHR2025!';
          
          // 查找 Supabase Auth 中的用戶
          const { data: users, error: listError } = await supabase.auth.admin.listUsers();
          if (!listError && users) {
            const targetUser = users.users.find(u => u.email === email);
            if (targetUser) {
              // 更新密碼
              const { error: updateError } = await supabase.auth.admin.updateUserById(
                targetUser.id,
                { password: fixedPassword }
              );
              
              if (!updateError) {
                console.log(`✅ [Public/InitSpecialUsers] Password updated for ${email}: ${fixedPassword}`);
                passwords[email] = fixedPassword; // Track the fixed password
              } else {
                console.error(`⚠️ [Public/InitSpecialUsers] Failed to update password for ${email}:`, updateError);
              }
            }
          }
        } catch (updateError) {
          console.error(`⚠️ [Public/InitSpecialUsers] Exception updating password for ${email}:`, updateError);
        }
      }

      const userId = profile.user_id || profile.id;

      // 1. Set enterprise subscription
      const subscriptionKey = `subscription_${userId}`;
      const endDate = new Date(now);
      endDate.setFullYear(endDate.getFullYear() + 1);

      const subscription = {
        user_id: userId,
        plan: 'enterprise',
        status: 'active',
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        auto_renew: true,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      await kv.set(subscriptionKey, subscription);

      // 2. Setup wallet with balance (100,000 TWD → USD using real-time exchange rate)
      // ⭐ 重要：錢包統一存儲 USD，所以要先轉換貨幣
      const rates2 = await getExchangeRates();
      const amountTWD2 = 100000; // NT$100,000
      const amountUSD2 = Math.round((amountTWD2 / rates2.TWD) * 100) / 100; // 轉換為 USD 並四捨五入到小數點後兩位
      
      console.log(`💱 [Public/InitSpecialUsers] Exchange Rate: 1 USD = ${rates2.TWD} TWD`);
      console.log(`💱 [Public/InitSpecialUsers] Converting NT$${amountTWD2.toLocaleString()} → $${amountUSD2.toFixed(2)} USD`);
      
      const walletKey = `wallet_${userId}`;
      let wallet = await kv.get(walletKey);

      if (!wallet) {
        // Create new wallet
        wallet = {
          user_id: userId,
          available_balance: amountUSD2, // ✅ 存儲 USD（已從 TWD 轉換）
          pending_withdrawal: 0,
          total_earned: 0,
          total_spent: 0,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        };
      } else {
        // Update existing wallet - ADD to balance instead of replacing
        const oldBalance = wallet.available_balance || 0;
        wallet.available_balance = oldBalance + amountUSD2; // ✅ 增加餘額，不是覆蓋！
        wallet.updated_at = now.toISOString();
        console.log(`💰 [Public/InitSpecialUsers] Balance updated: $${oldBalance.toFixed(2)} → $${wallet.available_balance.toFixed(2)} USD (+$${amountUSD2.toFixed(2)})`);
      }

      await kv.set(walletKey, wallet);

      // 3. Create deposit transaction record
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const transactionKey = `transaction_${transactionId}`;
      
      const transaction = {
        id: transactionId,
        user_id: userId,
        type: 'deposit',
        amount: amountUSD2, // ✅ 存儲 USD（已從 TWD 轉換）
        status: 'completed',
        description: '🎁 管理員充值 - 測試用企業帳號 (Admin top-up for testing)',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      await kv.set(transactionKey, transaction);

      console.log(`✅ [Public/InitSpecialUsers] Setup completed for ${email}: Enterprise + NT$${amountTWD2.toLocaleString()} ($${amountUSD2.toFixed(2)} USD)`);
      
      // 🔍 驗證設置是否成功
      const verifySubscription = await kv.get(subscriptionKey);
      const verifyWallet = await kv.get(walletKey);
      console.log(`🔍 [Public/InitSpecialUsers] Verification for ${email}:`);
      console.log(`   📋 Subscription:`, verifySubscription);
      console.log(`   💰 Wallet:`, verifyWallet);
      
      results.push({
        email,
        userId,
        status: 'success',
        subscription: 'enterprise',
        wallet_balance_usd: amountUSD2, // ✅ 返回 USD 金額
        wallet_balance_twd: amountTWD2, // ✅ 同時返回 TWD 金額供參考
        message: `Enterprise subscription activated + NT$${amountTWD2.toLocaleString()} ($${amountUSD2.toFixed(2)} USD) added to wallet`
      });
    }

    return c.json({ 
      success: true, 
      results,
      passwords, // Include passwords for newly created users
      message: `Setup completed for ${results.filter(r => r.status === 'success').length} users`
    });
  } catch (error) {
    console.error('❌ [Public/InitSpecialUsers] Error:', error);
    return c.json({ error: 'Failed to initialize special users' }, 500);
  }
});

// 🔑 Admin: Reset user password
app.post("/make-server-215f78a5/admin/reset-password", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check admin permission
    const isUserAdmin = await isAdminByEmail(user.email);
    if (!isUserAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const body = await c.req.json();
    const { email, newPassword } = body;
    
    if (!email || !newPassword) {
      return c.json({ error: 'Email and newPassword are required' }, 400);
    }
    
    console.log(`🔑 [Admin/ResetPassword] Resetting password for: ${email}`);
    
    // Get user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ [Admin/ResetPassword] Failed to list users:', listError);
      return c.json({ error: 'Failed to find user' }, 500);
    }
    
    const targetUser = users.users.find(u => u.email === email);
    
    if (!targetUser) {
      console.error(`❌ [Admin/ResetPassword] User not found: ${email}`);
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      targetUser.id,
      { password: newPassword }
    );
    
    if (updateError) {
      console.error(`❌ [Admin/ResetPassword] Failed to update password:`, updateError);
      return c.json({ error: `Failed to update password: ${updateError.message}` }, 500);
    }
    
    console.log(`✅ [Admin/ResetPassword] Password updated for: ${email}`);
    
    return c.json({ 
      success: true, 
      email,
      message: 'Password reset successfully' 
    });
  } catch (error) {
    console.error('❌ [Admin/ResetPassword] Error:', error);
    return c.json({ error: 'Failed to reset password' }, 500);
  }
});

// Get all withdrawals (Admin only)
app.get("/make-server-215f78a5/admin/withdrawals/all", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check admin permission
    const isUserAdmin = await isAdminByEmail(user.email);
    if (!isUserAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    console.log('🔍 [Admin/Withdrawals] Fetching all withdrawals...');

    // Get all withdrawals - support both colon and underscore formats
    const allWithdrawalsColon = (await kv.getByPrefix('withdrawal:') || []).map(item => item.value);
    const allWithdrawalsUnderscore = (await kv.getByPrefix('withdrawal_') || []).map(item => item.value);
    
    console.log(`📊 [Admin/Withdrawals] Found ${allWithdrawalsColon.length} with 'withdrawal:' prefix`);
    console.log(`📊 [Admin/Withdrawals] Found ${allWithdrawalsUnderscore.length} with 'withdrawal_' prefix`);
    
    const combinedWithdrawals = [...allWithdrawalsColon, ...allWithdrawalsUnderscore];
    
    // Deduplicate by id
    const seen = new Set();
    const allWithdrawals = combinedWithdrawals.filter((item: any) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    
    console.log(`📊 [Admin/Withdrawals] Total after deduplication: ${allWithdrawals.length}`);
    
    // Enrich withdrawals with user email and bank info
    const enrichedWithdrawals = await Promise.all(
      allWithdrawals.map(async (withdrawal: any) => {
        try {
          // Get user profile to fetch email
          const profileKey = `profile_${withdrawal.user_id}`;
          const profile = await kv.get(profileKey);
          
          // Get bank account info if method_id exists
          let bank_info = null;
          if (withdrawal.method_id) {
            const method = await kv.get(withdrawal.method_id);
            if (method && method.type === 'bank') {
              bank_info = {
                bank_name: method.bank_name,
                account_holder_name: method.account_holder_name,
                masked_account_number: method.account_number 
                  ? `****${method.account_number.slice(-4)}` 
                  : undefined,
                masked_iban: method.iban 
                  ? `****${method.iban.slice(-4)}` 
                  : undefined,
                swift_code: method.swift_code,
                routing_number: method.routing_number,
                country: method.country,
                currency: method.currency,
              };
            }
          }
          
          return {
            ...withdrawal,
            user_email: profile?.email || null,
            bank_info,
          };
        } catch (err) {
          console.error(`❌ Error enriching withdrawal ${withdrawal.id}:`, err);
          return {
            ...withdrawal,
            user_email: null,
            bank_info: null,
          };
        }
      })
    );
    
    // Sort by created_at (newest first)
    const sortedWithdrawals = enrichedWithdrawals.sort((a: any, b: any) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    console.log(`✅ [Admin/Withdrawals] Returning ${sortedWithdrawals.length} withdrawals`);
    if (sortedWithdrawals.length > 0) {
      console.log(`📝 [Admin/Withdrawals] Latest withdrawal:`, {
        id: sortedWithdrawals[0].id,
        user_id: sortedWithdrawals[0].user_id,
        user_email: sortedWithdrawals[0].user_email,
        amount: sortedWithdrawals[0].amount,
        status: sortedWithdrawals[0].status,
        created_at: sortedWithdrawals[0].created_at
      });
    }

    return c.json({ withdrawals: sortedWithdrawals });
  } catch (error) {
    console.error('Error fetching all withdrawals:', error);
    return c.json({ error: 'Failed to fetch withdrawals' }, 500);
  }
});

// Alias for /admin/withdrawals (without /all)
app.get("/make-server-215f78a5/admin/withdrawals", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check admin permission
    const isUserAdmin = await isAdminByEmail(user.email);
    if (!isUserAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    // Get all withdrawals - support both colon and underscore formats
    const allWithdrawalsColon = (await kv.getByPrefix('withdrawal:') || []).map(item => item.value);
    const allWithdrawalsUnderscore = (await kv.getByPrefix('withdrawal_') || []).map(item => item.value);
    
    console.log(`📊 [Admin/Withdrawals-Alias] Found ${allWithdrawalsColon.length} with 'withdrawal:' prefix`);
    console.log(`📊 [Admin/Withdrawals-Alias] Found ${allWithdrawalsUnderscore.length} with 'withdrawal_' prefix`);
    
    const combinedWithdrawals = [...allWithdrawalsColon, ...allWithdrawalsUnderscore];
    
    // Deduplicate by id
    const seen2 = new Set();
    const allWithdrawals = combinedWithdrawals.filter((item: any) => {
      if (seen2.has(item.id)) return false;
      seen2.add(item.id);
      return true;
    });
    
    console.log(`📊 [Admin/Withdrawals-Alias] Total after deduplication: ${allWithdrawals.length}`);
    
    // Enrich withdrawals with user email and bank info
    const enrichedWithdrawals = await Promise.all(
      allWithdrawals.map(async (withdrawal: any) => {
        try {
          // Get user profile to fetch email
          const profileKey = `profile_${withdrawal.user_id}`;
          const profile = await kv.get(profileKey);
          
          // Get bank account info if method_id exists
          let bank_info = null;
          if (withdrawal.method_id) {
            const method = await kv.get(withdrawal.method_id);
            if (method && method.type === 'bank') {
              bank_info = {
                bank_name: method.bank_name,
                account_holder_name: method.account_holder_name,
                masked_account_number: method.account_number 
                  ? `****${method.account_number.slice(-4)}` 
                  : undefined,
                masked_iban: method.iban 
                  ? `****${method.iban.slice(-4)}` 
                  : undefined,
                swift_code: method.swift_code,
                routing_number: method.routing_number,
                country: method.country,
                currency: method.currency,
              };
            }
          }
          
          return {
            ...withdrawal,
            user_email: profile?.email || null,
            bank_info,
          };
        } catch (err) {
          console.error(`❌ Error enriching withdrawal ${withdrawal.id}:`, err);
          return {
            ...withdrawal,
            user_email: null,
            bank_info: null,
          };
        }
      })
    );
    
    // Sort by created_at (newest first)
    const sortedWithdrawals = enrichedWithdrawals.sort((a: any, b: any) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    console.log(`✅ [Admin/Withdrawals-Alias] Returning ${sortedWithdrawals.length} withdrawals`);
    if (sortedWithdrawals.length > 0) {
      console.log(`📝 [Admin/Withdrawals-Alias] Latest withdrawal:`, {
        id: sortedWithdrawals[0].id,
        user_id: sortedWithdrawals[0].user_id,
        user_email: sortedWithdrawals[0].user_email,
        amount: sortedWithdrawals[0].amount,
        status: sortedWithdrawals[0].status,
        created_at: sortedWithdrawals[0].created_at
      });
    }

    return c.json({ withdrawals: sortedWithdrawals });
  } catch (error) {
    console.error('Error fetching all withdrawals:', error);
    return c.json({ error: 'Failed to fetch withdrawals' }, 500);
  }
});

// NOTE: The /admin/stats route is defined later in the file (around line 5549)
// This duplicate route has been removed to avoid conflicts

// Get all users (Admin only)
app.get("/make-server-215f78a5/admin/users", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check admin permission
    const isUserAdmin = await isAdminByEmail(user.email);
    if (!isUserAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    // Get all profiles (both formats)
    const newFormatProfiles = (await kv.getByPrefix('profile_') || []).map(item => item.value);
    const oldFormatProfiles = (await kv.getByPrefix('profile:') || []).map(item => item.value);
    
    // Combine and deduplicate by user_id, preferring new format
    const profileMap = new Map();
    oldFormatProfiles.forEach((profile: any) => {
      if (profile.user_id) profileMap.set(profile.user_id, profile);
    });
    newFormatProfiles.forEach((profile: any) => {
      if (profile.user_id) profileMap.set(profile.user_id, profile);
    });
    const allProfiles = Array.from(profileMap.values());

    // Get wallet and subscription data for each user
    const usersWithData = await Promise.all(
      allProfiles.map(async (profile: any) => {
        const wallet = await kv.get(`wallet_${profile.user_id}`);
        
        // 🔧 Check both subscription formats (old: subscription:id, new: subscription_id)
        let subscription = await kv.get(`subscription_${profile.user_id}`);
        if (!subscription) {
          subscription = await kv.get(`subscription:${profile.user_id}`);
        }
        
        // 🔧 訂閱等級優先順序：subscription.plan > subscription.tier > profile.membership_tier > 'free'
        let rawTier = subscription?.plan || subscription?.tier || profile.membership_tier || 'free';
        
        // 🔄 將舊版方案名稱映射到新版（basic → pro, premium → enterprise）
        const tierMapping: Record<string, string> = {
          'basic': 'pro',
          'premium': 'enterprise',
          'starter': 'pro',           // 如果有 starter 也映射到 pro
          'professional': 'enterprise' // 如果有 professional 也映射到 enterprise
        };
        const subscriptionTier = tierMapping[rawTier.toLowerCase()] || rawTier;
        
        // 🔧 Convert account_type (string) to account_types (array) for frontend compatibility
        const accountTypes = profile.account_type 
          ? [profile.account_type] 
          : (profile.account_types || ['client']);
        
        return {
          ...profile,
          id: profile.user_id,  // ✅ 確保 id 欄位正確對應到 user_id
          account_types: accountTypes,  // ✅ Ensure array format
          wallet_balance: wallet?.available_balance || 0,
          subscription_tier: subscriptionTier,
          subscription_status: subscription?.status || 'inactive',
        };
      })
    );

    return c.json({ users: usersWithData });
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Get user details (Admin only)
app.get("/make-server-215f78a5/admin/users/:userId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check admin permission
    const isUserAdmin = await isAdminByEmail(user.email);
    if (!isUserAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const userId = c.req.param('userId');
    
    // Get user data - check both formats for profile and subscription
    const [profileNew, profileOld, wallet, subscriptionNew, subscriptionOld, projects, proposals] = await Promise.all([
      kv.get(`profile_${userId}`),  // New format
      kv.get(`profile:${userId}`),  // Old format
      kv.get(`wallet_${userId}`),
      kv.get(`subscription_${userId}`),  // New format
      kv.get(`subscription:${userId}`),  // Old format
      kv.get(`projects:user:${userId}`),
      kv.get(`proposals:user:${userId}`),
    ]);

    const profile = profileNew || profileOld;
    const subscription = subscriptionNew || subscriptionOld;

    if (!profile) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Get transactions
    const allTransactions = (await kv.getByPrefix('transaction_') || []).map(item => item.value);
    const userTransactions = allTransactions
      .filter((t: any) => t.user_id === userId)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10); // Last 10 transactions

    const userDetails = {
      profile,
      wallet,
      subscription,
      stats: {
        totalProjects: projects?.length || 0,
        totalProposals: proposals?.length || 0,
        recentTransactions: userTransactions,
      }
    };

    return c.json({ user: userDetails });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return c.json({ error: 'Failed to fetch user details' }, 500);
  }
});

// Update user status (Admin only)
app.put("/make-server-215f78a5/admin/users/:userId/status", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check admin permission
    const isUserAdmin = await isAdminByEmail(user.email);
    if (!isUserAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const userId = c.req.param('userId');
    const { status, reason } = await c.req.json();

    const profile = await kv.get(`profile_${userId}`);  // 統一使用下劃線格式
    if (!profile) {
      return c.json({ error: 'User not found' }, 404);
    }

    profile.status = status;
    profile.status_reason = reason || '';
    profile.updated_at = new Date().toISOString();
    
    await kv.set(`profile_${userId}`, profile);  // 統一使用下劃線格式

    console.log(`✅ User ${userId} status updated to ${status}`);

    return c.json({ success: true, profile });
  } catch (error) {
    console.error('Error updating user status:', error);
    return c.json({ error: 'Failed to update user status' }, 500);
  }
});

// ============= ADMIN ROUTES =============

// Get all admins (Super Admin only)
app.get("/make-server-215f78a5/admin/admins", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const devToken = c.req.header('X-Dev-Token');
    
    console.log('🎯 [Get Admins] Authorization header:', authHeader ? `Bearer ${authHeader.substring(7, 30)}...` : 'MISSING');
    console.log('🎯 [Get Admins] X-Dev-Token header:', devToken ? devToken.substring(0, 30) + '...' : 'MISSING');
    
    // 🧪 DEV MODE: Use dev token if provided
    let accessToken = authHeader?.split(' ')[1];
    if (devToken && devToken.startsWith('dev-user-')) {
      console.log('🧪 [Get Admins] Dev mode detected, using dev token');
      accessToken = devToken;
    }
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user?.id || !user?.email) {
      console.log('❌ [Get Admins] Auth error:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is super admin using email-based check
    if (!adminCheck.isSuperAdmin(user.email)) {
      console.log('❌ [Admin] User', user.email, 'is not a super admin');
      return c.json({ error: 'Super admin access required' }, 403);
    }

    // Get admin list from KV store
    const adminList = await kv.get('admin_list') || [];
    
    console.log('✅ [Admin] Fetched admin list:', adminList.length, 'admins');

    return c.json({ admins: adminList });
  } catch (error) {
    console.error('❌ [Admin] Error fetching admins:', error);
    return c.json({ error: 'Failed to fetch admins' }, 500);
  }
});

// Add new admin (Super Admin only)
app.post("/make-server-215f78a5/admin/admins", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const devToken = c.req.header('X-Dev-Token');
    
    console.log('🎯 [Add Admin] Authorization header:', authHeader ? `Bearer ${authHeader.substring(7, 30)}...` : 'MISSING');
    console.log('🎯 [Add Admin] X-Dev-Token header:', devToken ? devToken.substring(0, 30) + '...' : 'MISSING');
    
    // 🧪 DEV MODE: Use dev token if provided
    let accessToken = authHeader?.split(' ')[1];
    if (devToken && devToken.startsWith('dev-user-')) {
      console.log('🧪 [Add Admin] Dev mode detected, using dev token');
      accessToken = devToken;
    }
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user?.id || !user?.email) {
      console.log('❌ [Add Admin] Auth error:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is super admin using email-based check
    if (!adminCheck.isSuperAdmin(user.email)) {
      console.log('❌ [Admin] User', user.email, 'is not a super admin');
      return c.json({ error: 'Super admin access required' }, 403);
    }

    const { email, name, level } = await c.req.json();

    if (!email || !name || !level) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Find user by email - 搜索兩種格式的鍵
    const profilesColon = (await kv.getByPrefix('profile:')).map(item => item.value);
    const profilesUnderscore = (await kv.getByPrefix('profile_')).map(item => item.value);
    const allProfiles = [...profilesColon, ...profilesUnderscore];
    
    // 使用 email 去重
    const uniqueProfiles = allProfiles.reduce((acc: any[], curr: any) => {
      if (!acc.find((p: any) => p.email === curr.email)) {
        acc.push(curr);
      }
      return acc;
    }, []);
    
    const targetProfile = uniqueProfiles.find((p: any) => p.email === email);
    
    if (!targetProfile) {
      return c.json({ error: 'User not found. User must sign up first.' }, 404);
    }

    // Update user profile to admin - 修復：同時更新兩種格式的鍵
    targetProfile.isAdmin = true;
    targetProfile.adminLevel = level;
    targetProfile.updated_at = new Date().toISOString();
    
    // 使用 user_id 而不是 id
    const userId = targetProfile.user_id || targetProfile.id;
    
    // 統一使用下劃線格式
    await kv.set(`profile_${userId}`, targetProfile);
    console.log(`✅ Updated profile for user ${userId}, set isAdmin=true, adminLevel=${level}`);

    // Add to admin list
    const adminList = await kv.get('admin_list') || [];
    const newAdmin = {
      userId: userId,
      email: email,
      name: name,
      level: level,
      addedAt: new Date().toISOString(),
      addedBy: user.email || user.id,
    };
    
    adminList.push(newAdmin);
    await kv.set('admin_list', adminList);

    console.log(`✅ Added new admin: ${email} (${level}), userId: ${userId}`);

    return c.json({ success: true, admin: newAdmin });
  } catch (error) {
    console.error('Error adding admin:', error);
    return c.json({ error: 'Failed to add admin' }, 500);
  }
});

// Debug endpoint: Check user profile status (Super Admin only)
app.get("/make-server-215f78a5/admin/debug-profile/:email", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const devToken = c.req.header('X-Dev-Token');
    
    // 🧪 DEV MODE: Use dev token if provided
    let accessToken = authHeader?.split(' ')[1];
    if (devToken && devToken.startsWith('dev-user-')) {
      accessToken = devToken;
    }
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user?.id || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is super admin
    if (!adminCheck.isSuperAdmin(user.email)) {
      return c.json({ error: 'Super admin access required' }, 403);
    }

    const targetEmail = c.req.param('email');
    console.log(`🔍 [Debug] Checking profile for email: ${targetEmail}`);

    // Search in both formats
    const profilesColon = (await kv.getByPrefix('profile:')).map(item => item.value);
    const profilesUnderscore = (await kv.getByPrefix('profile_')).map(item => item.value);
    
    const profileColon = profilesColon.find((p: any) => p.email === targetEmail);
    const profileUnderscore = profilesUnderscore.find((p: any) => p.email === targetEmail);
    
    console.log(`📋 [Debug] Profile with colon format:`, profileColon);
    console.log(`📋 [Debug] Profile with underscore format:`, profileUnderscore);
    
    return c.json({
      email: targetEmail,
      profileColon: profileColon || null,
      profileUnderscore: profileUnderscore || null,
      hasColonFormat: !!profileColon,
      hasUnderscoreFormat: !!profileUnderscore,
      colonIsAdmin: profileColon?.isAdmin || false,
      underscoreIsAdmin: profileUnderscore?.isAdmin || false,
      colonAdminLevel: profileColon?.adminLevel || null,
      underscoreAdminLevel: profileUnderscore?.adminLevel || null,
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return c.json({ error: 'Failed to debug profile' }, 500);
  }
});

// Remove admin (Super Admin only)
app.delete("/make-server-215f78a5/admin/admins/:userId", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const devToken = c.req.header('X-Dev-Token');
    
    console.log('🎯 [Delete Admin] Authorization header:', authHeader ? `Bearer ${authHeader.substring(7, 30)}...` : 'MISSING');
    console.log('🎯 [Delete Admin] X-Dev-Token header:', devToken ? devToken.substring(0, 30) + '...' : 'MISSING');
    
    // 🧪 DEV MODE: Use dev token if provided
    let accessToken = authHeader?.split(' ')[1];
    if (devToken && devToken.startsWith('dev-user-')) {
      console.log('🧪 [Delete Admin] Dev mode detected, using dev token');
      accessToken = devToken;
    }
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user?.id || !user?.email) {
      console.log('❌ [Delete Admin] Auth error:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is super admin using email-based check
    if (!adminCheck.isSuperAdmin(user.email)) {
      console.log('❌ [Admin] User', user.email, 'is not a super admin');
      return c.json({ error: 'Super admin access required' }, 403);
    }

    const targetUserId = c.req.param('userId');
    console.log('[Remove Admin] Attempting to remove admin with ID/Email:', targetUserId);
    
    // Get admin list first to find the admin by userId or email
    const adminList = await kv.get('admin_list') || [];
    const adminToRemove = adminList.find((admin: any) => 
      admin.userId === targetUserId || admin.email === targetUserId
    );
    
    if (!adminToRemove) {
      console.log('[Remove Admin] Admin not found:', targetUserId);
      return c.json({ error: 'Admin not found' }, 404);
    }
    
    const actualUserId = adminToRemove.userId || adminToRemove.email;
    console.log('[Remove Admin] Found admin:', adminToRemove.email, 'with userId:', actualUserId);

    // Cannot remove super admins defined in config (hardcoded ones)
    // But allow removing dynamically added super admins
    console.log('[Remove Admin] Checking if hardcoded super admin...');
    console.log('[Remove Admin] Admin email to check:', adminToRemove.email);
    console.log('[Remove Admin] Hardcoded super admins:', adminCheck.getAllSuperAdmins().map(a => a.email));
    
    const isHardcodedSuperAdmin = adminCheck.isSuperAdmin(adminToRemove.email);
    console.log('[Remove Admin] Is hardcoded super admin?', isHardcodedSuperAdmin);
    
    if (isHardcodedSuperAdmin) {
      console.log('[Remove Admin] ❌ Cannot remove hardcoded super admin:', adminToRemove.email);
      return c.json({ error: 'Cannot remove hardcoded super admin' }, 403);
    }
    
    console.log('[Remove Admin] ✅ Not a hardcoded super admin, proceeding with removal...');
    
    // 讀取用戶資料（兼容兩種格式）
    let targetProfile = await kv.get(`profile_${actualUserId}`);
    if (!targetProfile) {
      // Fallback to colon format for backward compatibility
      targetProfile = await kv.get(`profile:${actualUserId}`);
    }

    // Update user profile - 統一使用下劃線格式
    if (targetProfile) {
      targetProfile.isAdmin = false;
      delete targetProfile.adminLevel;
      targetProfile.updated_at = new Date().toISOString();
      await kv.set(`profile_${actualUserId}`, targetProfile);
      console.log(`✅ Removed admin status from profile_${actualUserId}`);
    }

    // Remove from admin list - only remove the exact matching admin by email (unique identifier)
    const updatedList = adminList.filter((admin: any) => admin.email !== adminToRemove.email);
    await kv.set('admin_list', updatedList);

    console.log('[Remove Admin] Successfully removed:', adminToRemove.email);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error removing admin:', error);
    return c.json({ error: 'Failed to remove admin' }, 500);
  }
});

// Reset admin password (Super Admin only)
app.post("/make-server-215f78a5/admin/admins/:email/reset-password", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is super admin
    if (!adminCheck.isSuperAdmin(user.email)) {
      console.log('❌ [Admin] User', user.email, 'is not a super admin');
      return c.json({ error: 'Super admin access required' }, 403);
    }

    const targetEmail = c.req.param('email');
    const { newPassword } = await c.req.json();

    if (!newPassword || newPassword.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters long' }, 400);
    }

    console.log('🔐 [Admin] Resetting password for:', targetEmail);

    // Get user by email
    const { data: userData, error: getUserError } = await supabase.auth.admin.listUsers();
    
    if (getUserError) {
      console.error('❌ [Admin] Failed to list users:', getUserError);
      return c.json({ error: 'Failed to find user' }, 500);
    }

    const targetUser = userData.users.find(u => u.email === targetEmail);
    
    if (!targetUser) {
      console.error('❌ [Admin] User not found:', targetEmail);
      return c.json({ error: 'User not found' }, 404);
    }

    // Update user password
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      targetUser.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('❌ [Admin] Failed to reset password:', updateError);
      return c.json({ error: 'Failed to reset password: ' + updateError.message }, 500);
    }

    console.log('✅ [Admin] Password reset successful for:', targetEmail);

    return c.json({ 
      success: true, 
      message: 'Password reset successfully',
      email: targetEmail 
    });
  } catch (error) {
    console.error('❌ [Admin] Error resetting password:', error);
    return c.json({ error: 'Failed to reset password' }, 500);
  }
});

// ============= USER MANAGEMENT (Super Admin Only) =============

// Admin adds a new user (Super Admin only)
app.post("/make-server-215f78a5/admin/users", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is super admin or admin (MODERATOR cannot add users)
    const userAdminLevel = await adminCheck.getAdminLevelAsync(user.email);
    if (!userAdminLevel || userAdminLevel === 'MODERATOR') {
      console.log('❌ [Add User] User', user.email, 'does not have admin privileges');
      return c.json({ error: 'Admin or Super Admin access required' }, 403);
    }

    const { email, password, name, account_type } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    console.log('Admin creating user:', { email, name, account_type });

    // Create user with Supabase Auth
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true, // Auto-confirm email
    });

    if (createError) {
      console.error('❌ [Add User] Error creating user:', createError);
      return c.json({ error: createError.message || 'Failed to create user' }, 400);
    }

    const userId = authData.user?.id;
    
    if (userId) {
      // Create user profile in KV store
      const profileKey = `profile_${userId}`;  // 統一使用下劃線格式
      const profile = {
        user_id: userId,
        email: email,
        full_name: name,
        account_type: account_type || 'client',
        job_title: '',
        bio: '',
        skills: [],
        company: '',
        website: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      await kv.set(profileKey, profile);
      console.log('✅ [Add User] Profile created for user:', userId);

      // Send welcome email
      try {
        // 🌟 使用智能郵件發送器
        await smartEmailSender.sendWelcomeEmail({
          userId: userId,
          email: email,
          name: name || email.split('@')[0],
          subscriptionTier: 'free',
          preferredLanguage: 'zh',
        });
        
        console.log('✅ [Add User] Welcome email sent to:', email);
      } catch (emailErr) {
        console.error('❌ [Add User] Failed to send welcome email:', emailErr);
        // Don't fail the user creation if email fails
      }
    }

    return c.json({ 
      success: true,
      user: {
        id: userId,
        email: email,
        name: name,
      }
    });
  } catch (error) {
    console.error('❌ [Add User] Error:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// Admin deletes a user (Super Admin only)
app.delete("/make-server-215f78a5/admin/users/:userId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is super admin or admin (MODERATOR cannot delete users)
    const userAdminLevel = await adminCheck.getAdminLevelAsync(user.email);
    if (!userAdminLevel || userAdminLevel === 'MODERATOR') {
      console.log('❌ [Delete User] User', user.email, 'does not have admin privileges');
      return c.json({ error: 'Admin or Super Admin access required' }, 403);
    }

    const userIdToDelete = c.req.param('userId');

    // Prevent deleting yourself
    if (userIdToDelete === user.id) {
      return c.json({ error: 'Cannot delete your own account' }, 403);
    }

    // Get user profile
    const profileKeyUnderscore = `profile_${userIdToDelete}`;
    const profileKeyColon = `profile:${userIdToDelete}`;
    
    let profile = await kv.get(profileKeyUnderscore);
    if (!profile) {
      // Fallback to colon format for backward compatibility
      profile = await kv.get(profileKeyColon);
    }
    
    if (!profile) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Prevent deleting super admins
    if (adminCheck.isSuperAdmin(profile.email)) {
      return c.json({ error: 'Cannot delete super admin accounts' }, 403);
    }

    console.log('🗑️ [Delete User] Deleting user:', userIdToDelete, profile.email);

    // Delete user from Supabase Auth
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userIdToDelete);
    
    if (deleteAuthError) {
      // Only log if it's not a "user not found" error (which is expected for test data)
      if (deleteAuthError.status !== 404) {
        console.error('❌ [Delete User] Error deleting from auth:', deleteAuthError);
      } else {
        console.log('⚠️ [Delete User] User not found in auth (cleaning up KV data only):', userIdToDelete);
      }
      // Continue anyway to clean up KV data
    }

    // Delete user data from KV store (both formats: underscore and colon)
    await kv.del(`profile_${userIdToDelete}`);
    await kv.del(`profile:${userIdToDelete}`);
    await kv.del(`wallet_${userIdToDelete}`);
    await kv.del(`wallet:${userIdToDelete}`);
    await kv.del(`subscription_${userIdToDelete}`);
    await kv.del(`subscription:${userIdToDelete}`);
    await kv.del(`portfolio_${userIdToDelete}`);
    await kv.del(`portfolio:${userIdToDelete}`);
    
    // Remove from admin list if they were an admin
    const adminList = await kv.get('admin_list') || [];
    const updatedAdminList = adminList.filter((admin: any) => admin.userId !== userIdToDelete);
    if (updatedAdminList.length !== adminList.length) {
      await kv.set('admin_list', updatedAdminList);
    }

    console.log('✅ [Delete User] Successfully deleted user:', userIdToDelete);

    return c.json({ success: true });
  } catch (error) {
    console.error('❌ [Delete User] Error:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

// Get admin statistics
app.get("/make-server-215f78a5/admin/stats", async (c) => {
  try {
    console.log('🎯 [Stats API] Request received');
    const authHeader = c.req.header('Authorization');
    const devToken = c.req.header('X-Dev-Token');
    
    console.log('🎯 [Stats API] Authorization header:', authHeader ? `Bearer ${authHeader.substring(7, 30)}...` : 'MISSING');
    console.log('🎯 [Stats API] X-Dev-Token header:', devToken ? devToken.substring(0, 30) + '...' : 'MISSING');
    
    // 🧪 DEV MODE: Use dev token if provided
    let accessToken = authHeader?.split(' ')[1];
    if (devToken && devToken.startsWith('dev-user-')) {
      console.log('🧪 [Stats API] Dev mode detected, using X-Dev-Token');
      accessToken = devToken;
    }
    
    if (!accessToken) {
      console.log('❌ [Stats API] No access token');
      return c.json({ error: 'Authorization required' }, 401);
    }
    
    console.log('🎯 [Stats API] Access token extracted:', accessToken.substring(0, 30) + '...');
    console.log('🎯 [Stats API] Token starts with "dev-user-"?', accessToken.startsWith('dev-user-'));

    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user?.id || !user?.email) {
      console.log('❌ [Stats API] Auth error:', authError);
      console.log('❌ [Stats API] User object:', user);
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    console.log('✅ [Stats API] User authenticated:', user.id, 'Email:', user.email);

    // Check if user is admin (any level: SUPER_ADMIN, ADMIN, or MODERATOR can view stats)
    console.log('🔍 [Stats API] Checking admin level for:', user.email);
    const userAdminLevel = await adminCheck.getAdminLevelAsync(user.email);
    console.log('🔍 [Stats API] Admin level result:', userAdminLevel);
    
    if (!userAdminLevel) {
      console.log('❌ [Stats API] User', user.email, 'is not an admin. Returning 403.');
      return c.json({ error: 'Admin access required' }, 403);
    }

    console.log('✅ [Stats API] Admin level verified:', userAdminLevel);

    // 獲取所有數據 - 同時支持兩種格式（冒號和下劃線），並去重
    console.log('🔍 [Stats API] Fetching data...');
    
    // Helper function to deduplicate by id
    const deduplicateById = (arr: any[]) => {
      const seen = new Set();
      return arr.filter((item: any) => {
        const id = item.id || item.user_id;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    };
    
    const allUsersColon = (await kv.getByPrefix('profile:') || []).map(item => item.value);
    const allUsersUnderscore = (await kv.getByPrefix('profile_') || []).map(item => item.value);
    const allUsers = deduplicateById([...allUsersColon, ...allUsersUnderscore]);
    
    const allProjectsColon = (await kv.getByPrefix('project:') || []).map(item => item.value);
    const allProjectsUnderscore = (await kv.getByPrefix('project_') || []).map(item => item.value);
    const allProjects = deduplicateById([...allProjectsColon, ...allProjectsUnderscore]);
    
    const allWalletsColon = (await kv.getByPrefix('wallet:') || []).map(item => item.value);
    const allWalletsUnderscore = (await kv.getByPrefix('wallet_') || []).map(item => item.value);
    const allWallets = deduplicateById([...allWalletsColon, ...allWalletsUnderscore]);
    
    const allWithdrawalsColon = (await kv.getByPrefix('withdrawal:') || []).map(item => item.value);
    const allWithdrawalsUnderscore = (await kv.getByPrefix('withdrawal_') || []).map(item => item.value);
    const allWithdrawals = deduplicateById([...allWithdrawalsColon, ...allWithdrawalsUnderscore]);
    
    const allMessagesColon = (await kv.getByPrefix('message:') || []).map(item => item.value);
    const allMessagesUnderscore = (await kv.getByPrefix('message_') || []).map(item => item.value);
    const allMessages = deduplicateById([...allMessagesColon, ...allMessagesUnderscore]);
    
    const allTransactionsColon = (await kv.getByPrefix('transaction:') || []).map(item => item.value);
    const allTransactionsUnderscore = (await kv.getByPrefix('transaction_') || []).map(item => item.value);
    const allTransactions = deduplicateById([...allTransactionsColon, ...allTransactionsUnderscore]);
    
    const allMilestonesColon = (await kv.getByPrefix('milestone:') || []).map(item => item.value);
    const allMilestonesUnderscore = (await kv.getByPrefix('milestone_') || []).map(item => item.value);
    const allMilestones = deduplicateById([...allMilestonesColon, ...allMilestonesUnderscore]);
    
    const allReviewsColon = (await kv.getByPrefix('review:') || []).map(item => item.value);
    const allReviewsUnderscore = (await kv.getByPrefix('review_') || []).map(item => item.value);
    const allReviews = deduplicateById([...allReviewsColon, ...allReviewsUnderscore]);

    console.log('📊 [Stats] Counts:', {
      users: allUsers.length,
      projects: allProjects.length,
      wallets: allWallets.length,
      withdrawals: allWithdrawals.length,
      messages: allMessages.length,
      transactions: allTransactions.length,
      milestones: allMilestones.length,
      reviews: allReviews.length,
    });

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 計算項目平均價值
    const projectValues = allProjects
      .filter((p: any) => p.budget && p.budget > 0)
      .map((p: any) => p.budget);
    const avgProjectValue = projectValues.length > 0 
      ? projectValues.reduce((sum: number, val: number) => sum + val, 0) / projectValues.length 
      : 0;

    // 計算今日活躍用戶（有登錄或活動的）
    const activeUsersToday = allUsers.filter((u: any) => {
      const lastActivity = u.last_activity || u.updated_at || u.created_at;
      return lastActivity && new Date(lastActivity) >= today;
    }).length;

    // 計算里程碑統計
    const totalMilestones = allMilestones.length;
    const completedMilestones = allMilestones.filter((m: any) => m.status === 'completed').length;

    // 計算評分統計
    const totalReviews = allReviews.length;
    const avgRating = totalReviews > 0
      ? allReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / totalReviews
      : 0;

    // 計算會員統計
    const membershipStats = {
      free: allUsers.filter((u: any) => !u.membership_tier || u.membership_tier === 'free').length,
      basic: allUsers.filter((u: any) => u.membership_tier === 'basic').length,
      premium: allUsers.filter((u: any) => u.membership_tier === 'premium').length,
    };

    // 計算真正的平台收入（非用戶錢包總和）
    // 1. 從交易中收取的平台手續費
    const platformServiceFees = allTransactions
      .filter((t: any) => t.type === 'project_payment' && t.status === 'completed')
      .reduce((sum: number, t: any) => sum + (t.platform_fee || t.service_fee || 0), 0);
    
    // 2. 訂閱收入
    const allSubscriptionsColon = (await kv.getByPrefix('subscription:') || []).map(item => item.value);
    const allSubscriptionsUnderscore = (await kv.getByPrefix('subscription_') || []).map(item => item.value);
    const allSubscriptions = deduplicateById([...allSubscriptionsColon, ...allSubscriptionsUnderscore]);
    
    const subscriptionRevenue = allSubscriptions
      .filter((s: any) => s.status === 'active' || s.status === 'paid')
      .reduce((sum: number, s: any) => {
        // 根據訂閱計劃計算收入
        if (s.plan === 'professional') return sum + 49;
        if (s.plan === 'enterprise') return sum + 99;
        return sum;
      }, 0);
    
    // 3. 總平台收入 = 服務費 + 訂閱收入
    const totalPlatformRevenue = platformServiceFees + subscriptionRevenue;
    
    console.log('💰 [Stats] Revenue Breakdown:', {
      serviceFees: platformServiceFees,
      subscriptionRevenue: subscriptionRevenue,
      totalRevenue: totalPlatformRevenue,
      note: 'This is actual platform revenue, not user wallet balances'
    });

    const stats = {
      totalUsers: allUsers.length,
      activeProjects: allProjects.filter((p: any) => p.status === 'in_progress' || p.status === 'open').length,
      totalRevenue: totalPlatformRevenue, // ✅ 修復：使用真正的平台收入
      platformServiceFees: platformServiceFees, // 平台服務費
      subscriptionRevenue: subscriptionRevenue, // 訂閱收入
      totalUserWalletBalance: allWallets.reduce((sum: number, w: any) => sum + (w.balance || 0), 0), // 用戶錢包總餘額（僅供參考）
      pendingWithdrawals: allWithdrawals.filter((w: any) => w.status === 'pending').length,
      newUsersThisMonth: allUsers.filter((u: any) => new Date(u.created_at) >= thisMonth).length,
      completedProjectsThisMonth: allProjects.filter((p: any) => 
        p.status === 'completed' && new Date(p.completed_at || p.updated_at) >= thisMonth
      ).length,
      withdrawalRequests: {
        pending: allWithdrawals.filter((w: any) => w.status === 'pending').length,
        approved: allWithdrawals.filter((w: any) => w.status === 'approved').length,
        rejected: allWithdrawals.filter((w: any) => w.status === 'rejected').length,
      },
      // 新增統計數據
      totalProjects: allProjects.length,
      totalMessages: allMessages.length,
      totalTransactions: allTransactions.length,
      avgProjectValue: Math.round(avgProjectValue),
      activeUsersToday: activeUsersToday,
      totalMilestones: totalMilestones,
      completedMilestones: completedMilestones,
      totalReviews: totalReviews,
      avgRating: Math.round(avgRating * 10) / 10, // 保留一位小數
      membershipStats: membershipStats,
    };

    console.log('✅ [Stats API] Returning stats:', JSON.stringify(stats, null, 2));
    return c.json({ stats });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// Get admin revenue data (all admin levels can view)
app.get("/make-server-215f78a5/admin/revenue", async (c) => {
  try {
    console.log('💰 [Revenue API] Request received');
    const authHeader = c.req.header('Authorization');
    const devToken = c.req.header('X-Dev-Token');
    
    console.log('💰 [Revenue API] Authorization header:', authHeader ? `Bearer ${authHeader.substring(7, 30)}...` : 'MISSING');
    console.log('💰 [Revenue API] X-Dev-Token header:', devToken ? devToken.substring(0, 30) + '...' : 'MISSING');
    
    // 🧪 DEV MODE: Use dev token if provided
    let accessToken = authHeader?.split(' ')[1];
    if (devToken && devToken.startsWith('dev-user-')) {
      console.log('🧪 [Revenue API] Dev mode detected, using X-Dev-Token');
      accessToken = devToken;
    }
    
    if (!accessToken) {
      console.log('❌ [Revenue API] No access token');
      return c.json({ error: 'Authorization required' }, 401);
    }
    
    console.log('💰 [Revenue API] Access token extracted:', accessToken.substring(0, 30) + '...');

    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user?.id || !user?.email) {
      console.log('❌ [Revenue API] Auth error:', authError);
      console.log('❌ [Revenue API] User object:', user);
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    console.log('✅ [Revenue API] User authenticated:', user.id, 'Email:', user.email);

    // Check if user is admin (any level can view revenue)
    console.log('🔍 [Revenue API] Checking admin level for:', user.email);
    const userAdminLevel = await adminCheck.getAdminLevelAsync(user.email);
    console.log('🔍 [Revenue API] Admin level result:', userAdminLevel);
    
    if (!userAdminLevel) {
      console.log('❌ [Revenue API] User', user.email, 'is not an admin. Returning 403.');
      return c.json({ error: 'Admin access required' }, 403);
    }

    console.log('✅ [Revenue API] Admin level verified:', userAdminLevel);

    // 獲取所有交易數據
    console.log('🔍 [Revenue API] Fetching transactions...');
    
    const deduplicateById = (arr: any[]) => {
      const seen = new Set();
      return arr.filter((item: any) => {
        const id = item.id;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    };
    
    const allTransactionsColon = (await kv.getByPrefix('transaction:') || []).map(item => item.value);
    const allTransactionsUnderscore = (await kv.getByPrefix('transaction_') || []).map(item => item.value);
    const allTransactions = deduplicateById([...allTransactionsColon, ...allTransactionsUnderscore]);

    console.log('📊 [Revenue API] Total transactions:', allTransactions.length);

    // 返回所有交易數據
    const transactions = allTransactions.map((t: any) => ({
      id: t.id,
      user_id: t.user_id,
      type: t.type,
      amount: t.amount || 0,
      currency: t.currency || 'USD',
      display_currency: t.display_currency,
      display_amount: t.display_amount,
      description: t.description || '',
      from_user_id: t.from_user_id,
      from_user_email: t.from_user_email,
      created_at: t.created_at || new Date().toISOString(),
      status: t.status || 'completed',
    }));

    console.log('✅ [Revenue API] Returning', transactions.length, 'transactions');
    return c.json({ transactions });
  } catch (error) {
    console.error('❌ [Revenue API] Error:', error);
    return c.json({ error: 'Failed to fetch revenue data' }, 500);
  }
});

// Admin: Add test balance to wallet (for testing without Stripe)
app.post("/make-server-215f78a5/admin/add-test-balance", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userAdminLevel = await adminCheck.getAdminLevelAsync(user.email);
    if (!userAdminLevel) {
      console.log('❌ [Add Test Balance] User', user.email, 'is not an admin');
      return c.json({ error: 'Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { user_id, amount } = body;

    if (!user_id || !amount || amount <= 0) {
      return c.json({ error: 'user_id and positive amount required' }, 400);
    }

    const walletKey = `wallet_${user_id}`;
    let wallet = await kv.get(walletKey);

    console.log(`💰 [Admin] Adding balance to user ${user_id}`);
    console.log(`📊 [Admin] Wallet key: ${walletKey}`);
    console.log(`📊 [Admin] Existing wallet:`, wallet);

    if (!wallet) {
      console.log(`🆕 [Admin] Creating new wallet for user ${user_id}`);
      wallet = {
        user_id: user_id,
        available_balance: 0,
        pending_withdrawal: 0,
        total_earned: 0,
        total_spent: 0,
        lifetime_earnings: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    const oldBalance = wallet.available_balance || 0;
    wallet.available_balance = oldBalance + amount;
    wallet.updated_at = new Date().toISOString();
    
    console.log(`📊 [Admin] Old balance: $${oldBalance}`);
    console.log(`📊 [Admin] Amount to add: $${amount}`);
    console.log(`📊 [Admin] New balance: $${wallet.available_balance}`);
    
    await kv.set(walletKey, wallet);
    console.log(`✅ [Admin] Wallet saved to KV store`);

    // Record transaction
    const transactionKey = `transaction_${Date.now()}_${user_id}`;
    await kv.set(transactionKey, {
      id: transactionKey,
      user_id: user_id,
      type: 'deposit',
      amount: amount,
      status: 'completed',
      description: `Test balance added by admin (${user.id})`,
      created_at: new Date().toISOString(),
    });
    console.log(`✅ [Admin] Transaction recorded: ${transactionKey}`);

    console.log(`✅ [Admin] Added $${amount} test balance to user ${user_id}`);

    return c.json({ 
      success: true, 
      wallet,
      message: `Added $${amount} to wallet` 
    });
  } catch (error) {
    console.error('Error adding test balance:', error);
    return c.json({ error: 'Failed to add test balance' }, 500);
  }
});

// Admin: Reset wallet balance to zero (Super Admin only)
app.post("/make-server-215f78a5/admin/reset-wallet", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is SUPER ADMIN (only super admins can reset wallets)
    const userAdminLevel = await adminCheck.getAdminLevelAsync(user.email);
    if (userAdminLevel !== 'SUPER_ADMIN') {
      console.log('❌ [Reset Wallet] User', user.email, 'is not a super admin. Level:', userAdminLevel);
      return c.json({ error: 'Super admin access required' }, 403);
    }

    const body = await c.req.json();
    const { user_id, reason } = body;

    if (!user_id) {
      return c.json({ error: 'user_id required' }, 400);
    }

    const walletKey = `wallet_${user_id}`;
    let wallet = await kv.get(walletKey);

    console.log(`🚨 [Super Admin] Resetting wallet for user ${user_id}`);
    console.log(`📊 [Super Admin] Wallet key: ${walletKey}`);
    console.log(`📊 [Super Admin] Existing wallet:`, wallet);
    console.log(`📝 [Super Admin] Reason: ${reason || 'No reason provided'}`);

    if (!wallet) {
      console.log(`⚠️ [Super Admin] Wallet not found for user ${user_id}, creating empty wallet`);
      wallet = {
        user_id: user_id,
        available_balance: 0,
        pending_withdrawal: 0,
        total_earned: 0,
        total_spent: 0,
        lifetime_earnings: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } else {
      // Record the old balance before reset
      const oldBalance = wallet.available_balance || 0;
      const oldPendingWithdrawal = wallet.pending_withdrawal || 0;
      
      console.log(`📊 [Super Admin] Old balance: $${oldBalance}`);
      console.log(`📊 [Super Admin] Old pending withdrawal: $${oldPendingWithdrawal}`);
      
      // Reset all balances to zero
      wallet.available_balance = 0;
      wallet.pending_withdrawal = 0;
      // Note: We keep total_earned, total_spent, and lifetime_earnings for historical records
      wallet.updated_at = new Date().toISOString();
      
      console.log(`📊 [Super Admin] New balance: $0`);
      console.log(`📊 [Super Admin] New pending withdrawal: $0`);
      
      // Record a transaction for the reset
      if (oldBalance !== 0 || oldPendingWithdrawal !== 0) {
        const transactionKey = `transaction_${Date.now()}_${user_id}_reset`;
        await kv.set(transactionKey, {
          id: transactionKey,
          user_id: user_id,
          type: 'admin_reset',
          amount: -(oldBalance + oldPendingWithdrawal),
          status: 'completed',
          description: `Wallet reset to zero by super admin (${user.email}). Reason: ${reason || 'Not specified'}`,
          metadata: {
            admin_id: user.id,
            admin_email: user.email,
            old_balance: oldBalance,
            old_pending_withdrawal: oldPendingWithdrawal,
            reason: reason || 'Not specified'
          },
          created_at: new Date().toISOString(),
        });
        console.log(`✅ [Super Admin] Reset transaction recorded: ${transactionKey}`);
      }
    }
    
    await kv.set(walletKey, wallet);
    console.log(`✅ [Super Admin] Wallet reset to zero for user ${user_id}`);

    return c.json({ 
      success: true, 
      wallet,
      message: `Wallet reset to zero for user ${user_id}` 
    });
  } catch (error) {
    console.error('Error resetting wallet:', error);
    return c.json({ error: 'Failed to reset wallet' }, 500);
  }
});

// Admin: Create test subscription
app.post("/make-server-215f78a5/admin/create-test-subscription", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userAdminLevel = await adminCheck.getAdminLevelAsync(user.email);
    if (!userAdminLevel) {
      console.log('❌ [Create Test Subscription] User', user.email, 'is not an admin');
      return c.json({ error: 'Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { user_id, plan, payment_method } = body;

    if (!user_id || !plan) {
      return c.json({ error: 'user_id and plan required' }, 400);
    }

    const validPlans = ['free', 'starter', 'professional', 'enterprise'];
    if (!validPlans.includes(plan)) {
      return c.json({ error: 'Invalid plan. Must be one of: free, starter, professional, enterprise' }, 400);
    }

    console.log(`📋 [Admin] Creating ${plan} subscription for user ${user_id}`);

    const subscriptionKey = `subscription_${user_id}`;
    
    // Check if subscription exists
    const existingSub = await kv.get(subscriptionKey);
    if (existingSub) {
      console.log(`⚠️ [Admin] User ${user_id} already has a subscription, updating...`);
    }

    // Create subscription object based on plan
    const planConfig = {
      free: {
        maxProjects: 1,
        maxBids: 10,
        canAccessAdvancedFeatures: false,
        canAccessTeamFeatures: false,
        priority_support: false,
      },
      starter: {
        maxProjects: 10,
        maxBids: 50,
        canAccessAdvancedFeatures: true,
        canAccessTeamFeatures: false,
        priority_support: false,
      },
      professional: {
        maxProjects: 50,
        maxBids: 200,
        canAccessAdvancedFeatures: true,
        canAccessTeamFeatures: true,
        priority_support: false,
      },
      enterprise: {
        maxProjects: 999999,
        maxBids: 999999,
        canAccessAdvancedFeatures: true,
        canAccessTeamFeatures: true,
        priority_support: true,
      },
    };

    const config = planConfig[plan];
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year from now

    const subscription = {
      id: `sub_test_${Date.now()}_${user_id}`,
      user_id: user_id,
      plan: plan,
      status: 'active',
      payment_method: payment_method || 'test',
      amount: 0,
      currency: 'TWD',
      interval: 'yearly',
      current_period_start: now.toISOString(),
      current_period_end: expiresAt.toISOString(),
      created_at: existingSub?.created_at || now.toISOString(),
      updated_at: now.toISOString(),
      ...config,
    };

    await kv.set(subscriptionKey, subscription);
    console.log(`✅ [Admin] Created ${plan} subscription for user ${user_id}`);

    // Also update user limits key for immediate effect
    const limitsKey = `limits_${user_id}`;
    await kv.set(limitsKey, {
      plan: plan,
      maxProjects: config.maxProjects,
      maxBids: config.maxBids,
      canAccessAdvancedFeatures: config.canAccessAdvancedFeatures,
      canAccessTeamFeatures: config.canAccessTeamFeatures,
      priority_support: config.priority_support,
      updated_at: now.toISOString(),
    });

    return c.json({ 
      success: true, 
      subscription,
      message: `Created ${plan} subscription for user ${user_id}` 
    });
  } catch (error) {
    console.error('Error creating test subscription:', error);
    return c.json({ error: 'Failed to create test subscription' }, 500);
  }
});

// Admin: Get user by email
app.post("/make-server-215f78a5/admin/get-user-by-email", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userAdminLevel = await adminCheck.getAdminLevelAsync(user.email);
    if (!userAdminLevel) {
      console.log('❌ [Get User] User', user.email, 'is not an admin');
      return c.json({ error: 'Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json({ error: 'Email required' }, 400);
    }

    // 🔍 First, try to find user in Supabase Auth
    console.log(`🔍 [Get User] Searching for user: ${email}`);
    
    let authUser = null;
    try {
      // List all users from Supabase Auth (admin only)
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      
      if (!listError && users) {
        authUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        console.log(`🔍 [Get User] Auth lookup: ${authUser ? 'Found' : 'Not found'}`);
      }
    } catch (authLookupError) {
      console.warn('⚠️  [Get User] Failed to lookup in Auth:', authLookupError);
    }

    // Search for user profile by email
    const allProfiles = (await kv.getByPrefix('user_profile_')).map(item => item.value);
    const userProfile = allProfiles.find(profile => 
      profile && profile.email && profile.email.toLowerCase() === email.toLowerCase()
    );

    // If user exists in Auth but not in profiles, create a minimal profile
    if (authUser && !userProfile) {
      console.log(`⚠️  [Get User] User exists in Auth but not in KV Store, creating profile...`);
      
      const newProfile = {
        id: authUser.id,
        email: authUser.email,
        user_metadata: authUser.user_metadata || {},
        created_at: authUser.created_at,
        role: authUser.user_metadata?.role || 'freelancer',
      };
      
      // Save to KV Store
      await kv.set(`user_profile_${authUser.id}`, newProfile);
      
      console.log(`✅ [Admin] Created profile for user: ${email} (${authUser.id})`);
      
      return c.json({ 
        success: true, 
        user: {
          ...newProfile,
          wallet: null
        }
      });
    }

    if (!userProfile && !authUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Get wallet info
    const walletKey = `wallet_${userProfile.id}`;
    const wallet = await kv.get(walletKey);

    console.log(`✅ [Admin] Found user: ${email} (${userProfile.id})`);

    return c.json({ 
      success: true, 
      user: {
        ...userProfile,
        wallet: wallet || null
      }
    });
  } catch (error) {
    console.error('Error getting user by email:', error);
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

// Admin: Rebuild project index - scan all projects and recreate projects:all
app.post("/make-server-215f78a5/admin/rebuild-project-index", async (c) => {
  try {
    console.log('🔄 [Admin] Starting project index rebuild...');
    
    // Get all keys with prefix 'project:' from KV store
    const allProjectKeys = (await kv.getByPrefix('project:')).map(item => item.value);
    console.log(`📊 [Admin] Found ${allProjectKeys.length} project keys in KV store`);
    
    // Extract project IDs and projects
    const projectIds: string[] = [];
    const userProjectsMap: { [userId: string]: string[] } = {};
    
    for (const projectData of allProjectKeys) {
      if (projectData && projectData.id) {
        projectIds.push(projectData.id);
        
        // Also organize by user
        const userId = projectData.user_id || projectData.client_id;
        if (userId) {
          if (!userProjectsMap[userId]) {
            userProjectsMap[userId] = [];
          }
          userProjectsMap[userId].push(projectData.id);
        }
      }
    }
    
    console.log(`✅ [Admin] Collected ${projectIds.length} project IDs`);
    console.log(`👥 [Admin] Found projects for ${Object.keys(userProjectsMap).length} users`);
    
    // Update projects:all index
    await kv.set('projects:all', projectIds);
    console.log(`✅ [Admin] Updated projects:all index with ${projectIds.length} projects`);
    
    // Update projects:user:${userId} indexes
    let userIndexesUpdated = 0;
    for (const [userId, userProjectIds] of Object.entries(userProjectsMap)) {
      await kv.set(`projects:user:${userId}`, userProjectIds);
      userIndexesUpdated++;
    }
    console.log(`✅ [Admin] Updated ${userIndexesUpdated} user project indexes`);
    
    return c.json({
      success: true,
      totalProjects: projectIds.length,
      usersWithProjects: Object.keys(userProjectsMap).length,
      userIndexesUpdated: userIndexesUpdated,
      message: `Successfully rebuilt project index with ${projectIds.length} projects`,
    });
    
  } catch (error: any) {
    console.error('❌ [Admin] Rebuild project index error:', error);
    return c.json({ 
      error: error.message,
      details: 'Failed to rebuild project index'
    }, 500);
  }
});

// Admin: Delete test data - remove all test projects and related data
app.post("/make-server-215f78a5/admin/delete-test-data", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userAdminLevel = await adminCheck.getAdminLevelAsync(user.email);
    if (!userAdminLevel) {
      console.log('❌ [Delete Test] User', user.email, 'is not an admin');
      return c.json({ error: 'Admin access required' }, 403);
    }

    // Get pattern from request body (default to 'test')
    const requestBody = await c.req.json().catch(() => ({}));
    const pattern = (requestBody.pattern || 'test').toLowerCase();
    
    // Helper function to get data with keys from database
    const getByPrefixWithKeys = async (prefix: string): Promise<Array<{key: string, value: any}>> => {
      const { data, error } = await supabase
        .from('kv_store_215f78a5')
        .select('key, value')
        .like('key', prefix + '%');
      
      if (error) {
        console.error(`⚠️ Error fetching ${prefix}:`, error.message);
        return [];
      }
      
      return data || [];
    };

    console.log(`🗑️ [Admin] Starting data deletion with pattern: "${pattern}"`);
    
    const deletionStats = {
      projects: 0,
      transactions: 0,
      milestones: 0,
      reviews: 0,
      messages: 0,
      withdrawals: 0,
      profiles: 0,
      wallets: 0,
    };
    
    // 1. Delete matching projects
    const deletedProjectIds: string[] = [];
    const userProjectsToUpdate: { [userId: string]: string[] } = {};
    const allProjectsData: Array<{key: string, value: any}> = [];
    
    try {
      const allProjectsWithKeys = await getByPrefixWithKeys('project');
      console.log(`📊 [Admin] Found ${allProjectsWithKeys.length} total projects`);
      
      for (const item of allProjectsWithKeys) {
        allProjectsData.push(item);
        try {
          const projectData = item.value;
          if (projectData && projectData.id && projectData.title) {
            const title = projectData.title.toLowerCase();
            if (title.includes(pattern)) {
              console.log(`🗑️ [Admin] Deleting project: ${item.key} - "${projectData.title}"`);
              await kv.del(item.key);
              deletedProjectIds.push(projectData.id);
              deletionStats.projects++;
              
              const userId = projectData.user_id || projectData.client_id;
              if (userId) {
                if (!userProjectsToUpdate[userId]) {
                  userProjectsToUpdate[userId] = [];
                }
              }
            }
          }
        } catch (projectError: any) {
          console.error(`⚠️ [Admin] Error deleting project ${item.key}:`, projectError.message);
        }
      }
    } catch (error: any) {
      console.error('⚠️ [Admin] Error processing projects:', error.message);
    }
    
    // 2. Delete matching transactions
    try {
      const allTransactionsWithKeys = await getByPrefixWithKeys('transaction');
      console.log(`📊 [Admin] Found ${allTransactionsWithKeys.length} total transactions`);
      
      for (const item of allTransactionsWithKeys) {
        try {
          const txData = item.value;
          if (txData && txData.id) {
            // Check both description and id for pattern match
            const description = (txData.description || '').toLowerCase();
            const txId = (txData.id || '').toLowerCase();
            if (description.includes(pattern) || txId.includes(pattern)) {
              console.log(`🗑️ [Admin] Deleting transaction: ${item.key}`);
              await kv.del(item.key);
              deletionStats.transactions++;
            }
          }
        } catch (txError: any) {
          console.error(`⚠️ [Admin] Error deleting transaction ${item.key}:`, txError.message);
        }
      }
    } catch (error: any) {
      console.error('⚠️ [Admin] Error processing transactions:', error.message);
    }
    
    // 3. Delete matching milestones
    try {
      const allMilestonesWithKeys = await getByPrefixWithKeys('milestone');
      console.log(`📊 [Admin] Found ${allMilestonesWithKeys.length} total milestones`);
      
      for (const item of allMilestonesWithKeys) {
        try {
          const mileData = item.value;
          if (mileData && mileData.id) {
            const title = (mileData.title || '').toLowerCase();
            const mileId = (mileData.id || '').toLowerCase();
            if (title.includes(pattern) || mileId.includes(pattern)) {
              console.log(`🗑️ [Admin] Deleting milestone: ${item.key}`);
              await kv.del(item.key);
              deletionStats.milestones++;
            }
          }
        } catch (mileError: any) {
          console.error(`⚠️ [Admin] Error deleting milestone ${item.key}:`, mileError.message);
        }
      }
    } catch (error: any) {
      console.error('⚠️ [Admin] Error processing milestones:', error.message);
    }
    
    // 4. Delete matching reviews
    try {
      const allReviewsWithKeys = await getByPrefixWithKeys('review');
      console.log(`📊 [Admin] Found ${allReviewsWithKeys.length} total reviews`);
      
      for (const item of allReviewsWithKeys) {
        try {
          const reviewData = item.value;
          if (reviewData && reviewData.id) {
            const comment = (reviewData.comment || '').toLowerCase();
            const reviewId = (reviewData.id || '').toLowerCase();
            if (comment.includes(pattern) || reviewId.includes(pattern)) {
              console.log(`🗑️ [Admin] Deleting review: ${item.key}`);
              await kv.del(item.key);
              deletionStats.reviews++;
            }
          }
        } catch (reviewError: any) {
          console.error(`⚠️ [Admin] Error deleting review ${item.key}:`, reviewError.message);
        }
      }
    } catch (error: any) {
      console.error('⚠️ [Admin] Error processing reviews:', error.message);
    }
    
    // 5. Delete matching messages
    try {
      const allMessagesWithKeys = await getByPrefixWithKeys('message');
      console.log(`📊 [Admin] Found ${allMessagesWithKeys.length} total messages`);
      
      for (const item of allMessagesWithKeys) {
        try {
          const msgData = item.value;
          if (msgData && msgData.id) {
            const content = (msgData.content || '').toLowerCase();
            const msgId = (msgData.id || '').toLowerCase();
            if (content.includes(pattern) || msgId.includes(pattern)) {
              console.log(`🗑️ [Admin] Deleting message: ${item.key}`);
              await kv.del(item.key);
              deletionStats.messages++;
            }
          }
        } catch (msgError: any) {
          console.error(`⚠️ [Admin] Error deleting message ${item.key}:`, msgError.message);
        }
      }
    } catch (error: any) {
      console.error('⚠️ [Admin] Error processing messages:', error.message);
    }
    
    // 6. Delete matching withdrawals
    const deletedUserIds: string[] = [];
    try {
      const allWithdrawalsWithKeys = await getByPrefixWithKeys('withdrawal');
      console.log(`📊 [Admin] Found ${allWithdrawalsWithKeys.length} total withdrawals`);
      
      for (const item of allWithdrawalsWithKeys) {
        try {
          const withdrawalData = item.value;
          if (withdrawalData && withdrawalData.id) {
            const email = (withdrawalData.user_email || '').toLowerCase();
            const withdrawalId = (withdrawalData.id || '').toLowerCase();
            if (email.includes(pattern) || withdrawalId.includes(pattern)) {
              console.log(`🗑️ [Admin] Deleting withdrawal: ${item.key}`);
              await kv.del(item.key);
              deletionStats.withdrawals++;
              
              if (withdrawalData.user_id && !deletedUserIds.includes(withdrawalData.user_id)) {
                deletedUserIds.push(withdrawalData.user_id);
              }
            }
          }
        } catch (withdrawalError: any) {
          console.error(`⚠️ [Admin] Error deleting withdrawal ${item.key}:`, withdrawalError.message);
        }
      }
    } catch (error: any) {
      console.error('⚠️ [Admin] Error processing withdrawals:', error.message);
    }
    
    // 7. Delete matching user profiles and wallets
    try {
      const allProfilesWithKeys = await getByPrefixWithKeys('profile');
      console.log(`📊 [Admin] Found ${allProfilesWithKeys.length} total profiles`);
      
      for (const item of allProfilesWithKeys) {
        try {
          const profileData = item.value;
          if (profileData && profileData.id) {
            const email = (profileData.email || '').toLowerCase();
            const profileId = (profileData.id || '').toLowerCase();
            if (email.includes(pattern) || profileId.includes(pattern)) {
              console.log(`🗑️ [Admin] Deleting user profile and wallet: ${item.key}`);
              await kv.del(item.key);
              await kv.del(`wallet:${profileData.id}`);
              deletionStats.profiles++;
              deletionStats.wallets++;
              
              if (!deletedUserIds.includes(profileData.id)) {
                deletedUserIds.push(profileData.id);
              }
            }
          }
        } catch (profileError: any) {
          console.error(`⚠️ [Admin] Error deleting profile ${item.key}:`, profileError.message);
        }
      }
    } catch (error: any) {
      console.error('⚠️ [Admin] Error processing profiles:', error.message);
    }
    
    console.log(`✅ [Admin] Deleted ${deletionStats.projects} projects, ${deletionStats.transactions} transactions, ${deletionStats.milestones} milestones, ${deletionStats.reviews} reviews, ${deletionStats.messages} messages, ${deletionStats.withdrawals} withdrawals, ${deletionStats.profiles} profiles`);
    
    // Rebuild projects:all index
    let remainingProjectsCount = 0;
    try {
      const remainingProjectIds = allProjectsData
        .filter(item => item.value && item.value.id && !deletedProjectIds.includes(item.value.id))
        .map(item => item.value.id);
      
      remainingProjectsCount = remainingProjectIds.length;
      
      await kv.set('projects:all', remainingProjectIds);
      console.log(`✅ [Admin] Updated projects:all index with ${remainingProjectIds.length} remaining projects`);
      
      // Update user project indexes
      for (const userId of Object.keys(userProjectsToUpdate)) {
        try {
          const userProjects = remainingProjectIds.filter(pid => {
            const projectItem = allProjectsData.find(item => item.value.id === pid);
            const project = projectItem?.value;
            return project && (project.user_id === userId || project.client_id === userId);
          });
          await kv.set(`projects:user:${userId}`, userProjects);
        } catch (userError: any) {
          console.error(`⚠️ [Admin] Error updating user index ${userId}:`, userError.message);
        }
      }
      
      console.log(`✅ [Admin] Updated ${Object.keys(userProjectsToUpdate).length} user project indexes`);
    } catch (error: any) {
      console.error('⚠️ [Admin] Error rebuilding project indexes:', error.message);
    }
    
    // Clean up withdrawal indexes for deleted users
    try {
      for (const userId of deletedUserIds) {
        try {
          await kv.del(`withdrawals:user:${userId}`);
          console.log(`🗑️ [Admin] Cleaned up withdrawal index for user: ${userId}`);
        } catch (delError: any) {
          console.error(`⚠️ [Admin] Error deleting withdrawal index for ${userId}:`, delError.message);
        }
      }
    } catch (error: any) {
      console.error('⚠️ [Admin] Error cleaning up withdrawal indexes:', error.message);
    }
    
    const totalDeleted = Object.values(deletionStats).reduce((sum, count) => sum + count, 0);
    
    return c.json({
      success: true,
      deleted: totalDeleted,
      pattern: pattern,
      details: deletionStats,
      remainingProjects: remainingProjectsCount,
      message: `Successfully deleted ${totalDeleted} items matching "${pattern}"`,
    });
    
  } catch (error: any) {
    console.error('❌ [Admin] Delete test data error:', error);
    console.error('❌ [Admin] Error stack:', error.stack);
    return c.json({ 
      error: error.message || 'Unknown error occurred',
      details: 'Failed to delete test data',
      errorType: error.constructor?.name || 'Error'
    }, 500);
  }
});

// Admin: Test email connection (SMTP)
app.post("/make-server-215f78a5/admin/test-email-connection", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userAdminLevel = await adminCheck.getAdminLevelAsync(user.email);
    if (!userAdminLevel) {
      console.log('❌ [Test Email] User', user.email, 'is not an admin');
      return c.json({ error: 'Admin access required' }, 403);
    }

    console.log('🧪 [Admin] Testing SMTP connection...');
    
    // Check BREVO_API_KEY
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    console.log('🔍 [Admin] BREVO_API_KEY configured:', brevoApiKey ? '✅ Yes' : '❌ No');
    console.log('🔍 [Admin] BREVO_API_KEY length:', brevoApiKey?.length || 0);
    
    if (!brevoApiKey) {
      return c.json({ 
        error: 'BREVO_API_KEY environment variable is not set',
        instructions: 'Please configure BREVO_API_KEY in your environment variables'
      }, 500);
    }
    
    // Test SMTP by verifying connection
    const nodemailer = await import('npm:nodemailer@6.9.7');
    
    const smtpConfig = {
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: '9d7ac7001@smtp-brevo.com',
        pass: brevoApiKey,
      },
    };
    
    const transporter = nodemailer.default.createTransport(smtpConfig);
    
    // Verify connection
    await transporter.verify();
    
    console.log('✅ [Admin] SMTP connection test successful');
    
    return c.json({ 
      success: true,
      message: 'SMTP connection successful',
      config: {
        host: smtpConfig.host,
        port: smtpConfig.port,
        user: smtpConfig.auth.user,
        apiKeyConfigured: true,
        apiKeyLength: brevoApiKey.length,
      }
    });
  } catch (error: any) {
    console.error('❌ [Admin] SMTP connection test failed:', error);
    return c.json({ 
      error: error.message || 'SMTP connection test failed',
      details: error.code 
    }, 500);
  }
});

// Admin: Get Brevo email activity/events
app.get("/make-server-215f78a5/admin/brevo-activity", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userAdminLevel = await adminCheck.getAdminLevelAsync(user.email);
    if (!userAdminLevel) {
      console.log('❌ [Brevo Activity] User', user.email, 'is not an admin');
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    // 🔑 使用專門的 REST API Key
    const brevoRestApiKey = Deno.env.get('BREVO_REST_API_KEY');
    if (!brevoRestApiKey) {
      return c.json({ 
        error: 'BREVO_REST_API_KEY not configured',
        hint: 'Please set the BREVO_REST_API_KEY environment variable with your REST API key (xkeysib-...)',
      }, 500);
    }

    console.log('📊 [Admin] Fetching Brevo email activity...');
    console.log('🔑 Using Brevo REST API Key (first 20 chars):', brevoRestApiKey.substring(0, 20) + '...');
    console.log('🔑 Key type:', brevoRestApiKey.startsWith('xkeysib-') ? '✅ REST API' : '⚠️ Unknown type');
    
    // Get email events from last 7 days
    const limit = c.req.query('limit') || '50';
    const offset = c.req.query('offset') || '0';
    
    console.log('📊 Fetching email events (limit:', limit, ', offset:', offset, ', days: 7)');
    
    const response = await fetch(
      `https://api.brevo.com/v3/smtp/statistics/events?limit=${limit}&offset=${offset}&days=7`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'api-key': brevoRestApiKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Brevo API error:', error);
      console.error('❌ Response status:', response.status);
      return c.json({ 
        error: 'Failed to fetch Brevo activity', 
        details: error,
        status: response.status,
        hint: 'Make sure you are using a REST API key (xkeysib-...) not an SMTP key (xsmtpsib-...)',
        instructions: 'Get REST API key from: https://app.brevo.com/settings/keys/api',
      }, response.status);
    }

    const data = await response.json();
    console.log('✅ Brevo activity fetched successfully!');
    console.log('📧 Total events:', data.events?.length || 0);
    
    if (data.events && data.events.length > 0) {
      console.log('📊 Recent events:');
      data.events.slice(0, 5).forEach((event: any, index: number) => {
        console.log(`  ${index + 1}. ${event.event} - ${event.email} - ${event.subject || 'No subject'} - ${event.date}`);
      });
    }
    
    return c.json(data);
  } catch (error: any) {
    console.error('❌ Error fetching Brevo activity:', error);
    return c.json({ error: error.message || 'Failed to fetch Brevo activity' }, 500);
  }
});

// Admin: Send test email
app.post("/make-server-215f78a5/admin/send-test-email", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userAdminLevel = await adminCheck.getAdminLevelAsync(user.email);
    if (!userAdminLevel) {
      console.log('❌ [Send Test Email] User', user.email, 'is not an admin');
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    // 🔍 Debug: Check BREVO_API_KEY
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    console.log('🔍 [Admin] BREVO_API_KEY configured:', brevoApiKey ? '✅ Yes' : '❌ No');
    console.log('🔍 [Admin] BREVO_API_KEY length:', brevoApiKey?.length || 0);

    const body = await c.req.json();
    const { to, subject, html } = body;

    if (!to || !subject || !html) {
      return c.json({ error: 'to, subject, and html are required' }, 400);
    }

    console.log(`📧 [Admin] Sending test email to ${to}...`);
    
    // ✅ 管理员测试邮件 - 保持简洁，直接发送原始内容（不添加 Header/Footer）
    const { sendEmail } = await import('./email_service.tsx');
    const result = await sendEmail({ to, subject, html });
    
    if (result.success) {
      console.log(`✅ [Admin] Test email sent successfully to ${to}`);
      console.log('📊 Full response:', JSON.stringify(result.data, null, 2));
      return c.json({ 
        success: true,
        messageId: result.data.id,
        accepted: result.data.accepted,
        rejected: result.data.rejected,
        response: result.data.response,
        message: 'Email sent successfully',
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error(`❌ [Admin] Failed to send test email to ${to}:`, result.error);
      return c.json({ 
        error: result.error,
        details: result.details 
      }, 500);
    }
  } catch (error: any) {
    console.error('❌ [Admin] Error sending test email:', error);
    return c.json({ error: error.message || 'Failed to send test email' }, 500);
  }
});

// Admin: Send test team invitation email (to debug branding)
app.post("/make-server-215f78a5/admin/send-test-team-invitation", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { to } = body;

    if (!to) {
      return c.json({ error: 'Recipient email is required' }, 400);
    }

    console.log('📧 ==========================================');
    console.log('📧 [Admin Test Team Invitation] Starting test');
    console.log('📧 [Admin Test Team Invitation] From user:', user.email, '(ID:', user.id, ')');
    console.log('📧 [Admin Test Team Invitation] To:', to);
    console.log('📧 ==========================================');
    
    // Get user profile for inviter name
    let profile = await kv.get(`profile_${user.id}`);
    if (!profile) {
      profile = await kv.get(`profile:${user.id}`);
    }
    const inviterName = profile?.full_name || profile?.name || user.email;
    
    console.log('📧 [Admin Test Team Invitation] Inviter name:', inviterName);
    console.log('📧 [Admin Test Team Invitation] Calling sendTeamInvitationEmail...');
    
    // Send test team invitation email
    const { sendTeamInvitationEmail } = await import('./email_team_invitation.tsx');
    const testInviteId = 'test-' + crypto.randomUUID();
    
    await sendTeamInvitationEmail({
      to,
      inviterName,
      role: 'admin',
      inviteId: testInviteId,
      ownerId: user.id, // Use current user's ID to test branding
    });
    
    console.log('✅ [Admin Test Team Invitation] Email sent successfully');
    console.log('📧 ==========================================');
    
    return c.json({ 
      success: true,
      message: 'Test team invitation email sent successfully',
      to,
      inviterName,
      testInviteId,
      ownerId: user.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ [Admin Test Team Invitation] Error:', error);
    console.error('❌ [Admin Test Team Invitation] Stack:', error.stack);
    return c.json({ error: error.message || 'Failed to send test team invitation email' }, 500);
  }
});

// ==================== 🛠️ ADMIN PROJECT MANAGEMENT APIs ====================

// Get all projects (Admin) with advanced filtering
app.get("/make-server-215f78a5/admin/projects", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userAdminLevel = await adminCheck.getAdminLevelAsync(user.email);
    if (!userAdminLevel) {
      console.log('❌ [Admin Projects] User', user.email, 'is not an admin');
      return c.json({ error: 'Admin access required' }, 403);
    }

    // Get query parameters
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const status = c.req.query('status');
    const category = c.req.query('category');
    const search = c.req.query('search');
    const dateFrom = c.req.query('date_from');
    const dateTo = c.req.query('date_to');

    console.log('📊 [Admin] Fetching projects with filters:', { page, limit, status, category, search, dateFrom, dateTo });

    // Get all projects
    const allProjectIds = await kv.get('projects:all') || [];
    
    if (allProjectIds.length === 0) {
      return c.json({ projects: [], total: 0, page, limit });
    }

    // Fetch all projects
    const allProjects = await kv.mget(allProjectIds.map((id: string) => `project:${id}`));
    let filteredProjects = allProjects.filter((p: any) => p !== null);

    // Apply filters
    if (status) {
      filteredProjects = filteredProjects.filter((p: any) => p.status === status);
    }

    if (category) {
      filteredProjects = filteredProjects.filter((p: any) => {
        if (!p.category) return false;
        const projectCategory = p.category.toLowerCase();
        const searchCategory = category.toLowerCase();
        return projectCategory === searchCategory || 
               projectCategory.includes(searchCategory) ||
               searchCategory.includes(projectCategory);
      });
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredProjects = filteredProjects.filter((p: any) => 
        p.title?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.id?.toLowerCase().includes(searchLower)
      );
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filteredProjects = filteredProjects.filter((p: any) => 
        new Date(p.created_at) >= fromDate
      );
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filteredProjects = filteredProjects.filter((p: any) => 
        new Date(p.created_at) <= toDate
      );
    }

    // Helper function to validate UUID format
    const isValidUUID = (id: string): boolean => {
      if (!id) return false;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(id);
    };

    // Enrich with user and proposal data
    const enrichedProjects = await Promise.all(
      filteredProjects.map(async (project: any) => {
        try {
          const clientProfile = await kv.get(`profile_${project.user_id}`);
          
          // Only fetch auth user if user_id is a valid UUID
          let authUser = null;
          if (isValidUUID(project.user_id)) {
            try {
              const result = await supabase.auth.admin.getUserById(project.user_id);
              authUser = result.data;
            } catch (err) {
              console.log('Error fetching auth user:', err);
            }
          }
          
          const proposalIds = await kv.get(`proposals:project:${project.id}`) || [];
          const proposals = Array.isArray(proposalIds) && proposalIds.length > 0
            ? await kv.mget(proposalIds.map((id: string) => `proposal:${id}`))
            : [];
          const validProposals = proposals.filter((p: any) => p !== null);
          
          let freelancerInfo = null;
          if (project.assigned_freelancer_id) {
            const freelancerProfile = await kv.get(`profile_${project.assigned_freelancer_id}`);
            
            // Only fetch auth user if freelancer_id is a valid UUID
            let freelancerAuth = null;
            if (isValidUUID(project.assigned_freelancer_id)) {
              try {
                const result = await supabase.auth.admin.getUserById(project.assigned_freelancer_id);
                freelancerAuth = result.data;
              } catch (err) {
                console.log('Error fetching freelancer auth:', err);
              }
            }
            freelancerInfo = {
              id: project.assigned_freelancer_id,
              name: freelancerProfile?.name,
              email: freelancerAuth?.user?.email,
            };
          }

          return {
            ...project,
            client_name: clientProfile?.name || 'Unknown',
            client_email: authUser?.user?.email || 'Unknown',
            proposal_count: validProposals.length,
            pending_proposals: validProposals.filter((p: any) => p.status === 'pending').length,
            freelancer: freelancerInfo,
          };
        } catch (err) {
          console.error('Error enriching project:', err);
          return project;
        }
      })
    );

    enrichedProjects.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const total = enrichedProjects.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProjects = enrichedProjects.slice(startIndex, endIndex);

    return c.json({ 
      projects: paginatedProjects, 
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('❌ [Admin] Error fetching projects:', error);
    return c.json({ error: 'Failed to fetch projects' }, 500);
  }
});

// Get project statistics (Admin)
app.get("/make-server-215f78a5/admin/projects/stats", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || !user?.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userAdminLevel = await adminCheck.getAdminLevelAsync(user.email);
    if (!userAdminLevel) {
      console.log('❌ [Admin Project Stats] User', user.email, 'is not an admin');
      return c.json({ error: 'Admin access required' }, 403);
    }

    const allProjectIds = await kv.get('projects:all') || [];
    const allProjects = await kv.mget(allProjectIds.map((id: string) => `project:${id}`));
    const validProjects = allProjects.filter((p: any) => p !== null);

    const stats = {
      total: validProjects.length,
      by_status: {
        open: validProjects.filter((p: any) => p.status === 'open').length,
        in_progress: validProjects.filter((p: any) => p.status === 'in_progress').length,
        pending_review: validProjects.filter((p: any) => p.status === 'pending_review').length,
        completed: validProjects.filter((p: any) => p.status === 'completed').length,
        cancelled: validProjects.filter((p: any) => p.status === 'cancelled').length,
        paused: validProjects.filter((p: any) => p.status === 'paused').length,
      },
      average_budget: validProjects.reduce((sum: number, p: any) => {
        const budget = p.budget_max || p.budget_min || 0;
        return sum + budget;
      }, 0) / validProjects.length || 0,
      flagged_count: validProjects.filter((p: any) => p.flags && p.flags.length > 0).length,
      this_month: validProjects.filter((p: any) => {
        const createdAt = new Date(p.created_at);
        const now = new Date();
        return createdAt.getMonth() === now.getMonth() && 
               createdAt.getFullYear() === now.getFullYear();
      }).length,
    };

    return c.json({ stats });
  } catch (error) {
    console.error('❌ [Admin] Error fetching project stats:', error);
    return c.json({ error: 'Failed to fetch project stats' }, 500);
  }
});

// Get single project details (Admin)
app.get("/make-server-215f78a5/admin/projects/:projectId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Helper function to validate UUID format
    const isValidUUID = (id: string): boolean => {
      if (!id) return false;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(id);
    };

    const clientProfile = await kv.get(`profile_${project.user_id}`);
    
    // Only fetch auth user if user_id is a valid UUID
    let clientAuth = null;
    if (isValidUUID(project.user_id)) {
      try {
        const result = await supabase.auth.admin.getUserById(project.user_id);
        clientAuth = result.data;
      } catch (err) {
        console.log('Error fetching client auth:', err);
      }
    }

    const proposalIds = await kv.get(`proposals:project:${projectId}`) || [];
    const proposals = Array.isArray(proposalIds) && proposalIds.length > 0
      ? await kv.mget(proposalIds.map((id: string) => `proposal:${id}`))
      : [];

    const enrichedProposals = await Promise.all(
      proposals.filter((p: any) => p !== null).map(async (proposal: any) => {
        const freelancerProfile = await kv.get(`profile_${proposal.freelancer_id}`);
        
        // Only fetch auth user if freelancer_id is a valid UUID
        let freelancerAuth = null;
        if (isValidUUID(proposal.freelancer_id)) {
          try {
            const result = await supabase.auth.admin.getUserById(proposal.freelancer_id);
            freelancerAuth = result.data;
          } catch (err) {
            console.log('Error fetching freelancer auth:', err);
          }
        }
        
        return {
          ...proposal,
          freelancer_name: freelancerProfile?.name || 'Unknown',
          freelancer_email: freelancerAuth?.user?.email || 'Unknown',
        };
      })
    );

    let freelancerInfo = null;
    if (project.assigned_freelancer_id) {
      const freelancerProfile = await kv.get(`profile_${project.assigned_freelancer_id}`);
      
      // Only fetch auth user if freelancer_id is a valid UUID
      let freelancerAuth = null;
      if (isValidUUID(project.assigned_freelancer_id)) {
        try {
          const result = await supabase.auth.admin.getUserById(project.assigned_freelancer_id);
          freelancerAuth = result.data;
        } catch (err) {
          console.log('Error fetching assigned freelancer auth:', err);
        }
      }
      freelancerInfo = {
        id: project.assigned_freelancer_id,
        name: freelancerProfile?.name,
        email: freelancerAuth?.user?.email,
        profile: freelancerProfile,
      };
    }

    return c.json({
      project: {
        ...project,
        client_name: clientProfile?.name || 'Unknown',
        client_email: clientAuth?.user?.email || 'Unknown',
        client_profile: clientProfile,
      },
      proposals: enrichedProposals,
      freelancer: freelancerInfo,
    });
  } catch (error) {
    console.error('❌ [Admin] Error fetching project details:', error);
    return c.json({ error: 'Failed to fetch project details' }, 500);
  }
});

// Update project status (Admin)
app.put("/make-server-215f78a5/admin/projects/:projectId/status", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const { status, reason } = await c.req.json();

    if (!status) {
      return c.json({ error: 'Status is required' }, 400);
    }

    const validStatuses = ['open', 'in_progress', 'pending_review', 'completed', 'cancelled', 'paused'];
    if (!validStatuses.includes(status)) {
      return c.json({ error: 'Invalid status' }, 400);
    }

    const project = await kv.get(`project:${projectId}`);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    project.status = status;
    project.updated_at = new Date().toISOString();
    project.admin_note = reason || '';
    project.last_admin_action = {
      action: 'status_update',
      admin_id: user.id,
      timestamp: new Date().toISOString(),
      reason: reason || '',
    };

    await kv.set(`project:${projectId}`, project);

    console.log('✅ [Admin] Project status updated:', {
      projectId,
      newStatus: status,
      adminId: user.id,
      reason
    });

    return c.json({ success: true, project });
  } catch (error) {
    console.error('❌ [Admin] Error updating project status:', error);
    return c.json({ error: 'Failed to update project status' }, 500);
  }
});

// Delete project (Admin)
app.delete("/make-server-215f78a5/admin/projects/:projectId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const { reason } = await c.req.json();

    if (!reason) {
      return c.json({ error: 'Reason is required for deletion' }, 400);
    }

    const project = await kv.get(`project:${projectId}`);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const deletionRecord = {
      project_id: projectId,
      project_data: project,
      deleted_by: user.id,
      deleted_at: new Date().toISOString(),
      reason,
    };
    await kv.set(`deleted_project:${projectId}`, deletionRecord);

    await kv.del(`project:${projectId}`);

    const userProjects = await kv.get(`projects:user:${project.user_id}`) || [];
    const filteredUserProjects = userProjects.filter((id: string) => id !== projectId);
    await kv.set(`projects:user:${project.user_id}`, filteredUserProjects);

    const allProjects = await kv.get('projects:all') || [];
    const filteredAllProjects = allProjects.filter((id: string) => id !== projectId);
    await kv.set('projects:all', filteredAllProjects);

    console.log('✅ [Admin] Project deleted:', {
      projectId,
      adminId: user.id,
      reason
    });

    return c.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('❌ [Admin] Error deleting project:', error);
    return c.json({ error: 'Failed to delete project' }, 500);
  }
});

// Flag problem project (Admin)
app.post("/make-server-215f78a5/admin/projects/:projectId/flag", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const { issue_type, description } = await c.req.json();

    if (!issue_type || !description) {
      return c.json({ error: 'Issue type and description are required' }, 400);
    }

    const project = await kv.get(`project:${projectId}`);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    if (!project.flags) {
      project.flags = [];
    }

    const flag = {
      id: crypto.randomUUID(),
      issue_type,
      description,
      flagged_by: user.id,
      flagged_at: new Date().toISOString(),
      resolved: false,
    };

    project.flags.push(flag);
    project.updated_at = new Date().toISOString();

    await kv.set(`project:${projectId}`, project);

    console.log('⚠️ [Admin] Project flagged:', {
      projectId,
      issueType: issue_type,
      adminId: user.id
    });

    return c.json({ success: true, flag });
  } catch (error) {
    console.error('❌ [Admin] Error flagging project:', error);
    return c.json({ error: 'Failed to flag project' }, 500);
  }
});

// ==================== 📁 FILE UPLOAD APIs ====================

// Create upload URL for file
app.post("/make-server-215f78a5/files/upload-url", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { 
      file_name, 
      file_size, 
      file_type, 
      bucket_type = 'ATTACHMENTS',
      project_id,
      category = 'ANY'
    } = body;

    // Validate required fields
    if (!file_name || !file_size || !file_type) {
      return c.json({ error: 'File name, size, and type are required' }, 400);
    }

    // Validate file
    const validation = fileService.validateFile({
      fileName: file_name,
      fileSize: file_size,
      fileType: file_type,
      category: category,
    });

    if (!validation.valid) {
      return c.json({ error: validation.error }, 400);
    }

    // Get bucket name
    const bucketName = fileService.BUCKETS[bucket_type] || fileService.BUCKETS.ATTACHMENTS;

    // Generate unique file path
    const filePath = fileService.generateFilePath({
      userId: user.id,
      projectId: project_id,
      fileName: file_name,
      prefix: bucket_type.toLowerCase(),
    });

    // Create signed upload URL
    const uploadResult = await fileService.createUploadUrl({
      bucket: bucketName,
      filePath: filePath,
    });

    if (uploadResult.error) {
      return c.json({ error: uploadResult.error }, 500);
    }

    console.log(`✅ [Files] Created upload URL for ${file_name}`);

    return c.json({
      upload_url: uploadResult.signedUrl,
      file_path: filePath,
      token: uploadResult.token,
      bucket: bucketName,
    });

  } catch (error: any) {
    console.error('❌ [Files] Error creating upload URL:', error);
    return c.json({ error: 'Failed to create upload URL' }, 500);
  }
});

// Create download URL for file
app.post("/make-server-215f78a5/files/download-url", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { file_path, bucket_type = 'ATTACHMENTS' } = body;

    console.log('📥 [Files] Download URL request:', { file_path, bucket_type, userId: user.id });

    if (!file_path) {
      return c.json({ error: 'File path is required' }, 400);
    }

    // Get bucket name
    const bucketName = fileService.BUCKETS[bucket_type] || fileService.BUCKETS.ATTACHMENTS;

    console.log('📥 [Files] Using bucket:', { bucketName, bucket_type });

    // First, check if file exists
    const folderPath = file_path.substring(0, file_path.lastIndexOf('/'));
    const fileName = file_path.substring(file_path.lastIndexOf('/') + 1);
    
    console.log('📥 [Files] Checking file:', { folderPath, fileName });
    
    const { data: fileList, error: listError } = await supabase.storage
      .from(bucketName)
      .list(folderPath, {
        search: fileName,
      });

    console.log('📥 [Files] File existence check:', { 
      found: fileList && fileList.length > 0,
      fileCount: fileList?.length || 0,
      listError: listError?.message,
      files: fileList?.map(f => f.name)
    });

    // Create signed download URL (valid for 1 hour)
    const downloadResult = await fileService.createDownloadUrl({
      bucket: bucketName,
      filePath: file_path,
      expiresIn: 3600,
    });

    if (downloadResult.error) {
      console.error('❌ [Files] Download URL creation failed:', downloadResult.error);
      return c.json({ error: downloadResult.error }, 500);
    }

    console.log(`✅ [Files] Created download URL for ${file_path}`);

    return c.json({
      download_url: downloadResult.signedUrl,
    });

  } catch (error: any) {
    console.error('❌ [Files] Error creating download URL:', error);
    return c.json({ error: 'Failed to create download URL' }, 500);
  }
});

// Delete file
app.delete("/make-server-215f78a5/files/:filePath(*)", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const filePath = c.req.param('filePath');
    const bucketType = c.req.query('bucket_type') || 'ATTACHMENTS';

    if (!filePath) {
      return c.json({ error: 'File path is required' }, 400);
    }

    // Verify user owns the file (file path should contain user ID)
    if (!filePath.includes(user.id)) {
      return c.json({ error: 'Forbidden: You can only delete your own files' }, 403);
    }

    // Get bucket name
    const bucketName = fileService.BUCKETS[bucketType] || fileService.BUCKETS.ATTACHMENTS;

    // Delete file
    const deleteResult = await fileService.deleteFile({
      bucket: bucketName,
      filePath: filePath,
    });

    if (!deleteResult.success) {
      return c.json({ error: deleteResult.error }, 500);
    }

    console.log(`✅ [Files] Deleted file: ${filePath}`);

    return c.json({ success: true });

  } catch (error: any) {
    console.error('❌ [Files] Error deleting file:', error);
    return c.json({ error: 'Failed to delete file' }, 500);
  }
});

// List user's files
app.get("/make-server-215f78a5/files/list", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const bucketType = c.req.query('bucket_type') || 'ATTACHMENTS';
    const projectId = c.req.query('project_id');

    // Get bucket name
    const bucketName = fileService.BUCKETS[bucketType] || fileService.BUCKETS.ATTACHMENTS;

    // Build folder path
    let folder = '';
    if (projectId) {
      folder = `${bucketType.toLowerCase()}/${projectId}/${user.id}`;
    } else {
      folder = `${bucketType.toLowerCase()}/${user.id}`;
    }

    // List files
    const listResult = await fileService.listFiles({
      bucket: bucketName,
      folder: folder,
      limit: 100,
    });

    if (listResult.error) {
      return c.json({ error: listResult.error }, 500);
    }

    console.log(`✅ [Files] Listed ${listResult.files?.length || 0} files for user ${user.id}`);

    return c.json({
      files: listResult.files || [],
      total: listResult.files?.length || 0,
    });

  } catch (error: any) {
    console.error('❌ [Files] Error listing files:', error);
    return c.json({ error: 'Failed to list files' }, 500);
  }
});

// Check storage health
app.get("/make-server-215f78a5/files/health", async (c) => {
  try {
    const healthy = await fileService.checkStorageHealth();
    
    return c.json({
      healthy: healthy,
      buckets: fileService.BUCKETS,
    });

  } catch (error: any) {
    console.error('❌ [Files] Health check error:', error);
    return c.json({ error: 'Health check failed' }, 500);
  }
});

// ==================== 💳 STRIPE PAYMENT APIs ====================

// Check if Stripe is configured
app.get("/make-server-215f78a5/stripe/status", async (c) => {
  return c.json({
    configured: stripeService.isStripeConfigured,
    message: stripeService.isStripeConfigured 
      ? 'Stripe is configured and ready' 
      : 'Stripe is not configured. Payment features are unavailable in this demo environment.',
  });
});

// Create Stripe Checkout Session for wallet deposit
app.post("/make-server-215f78a5/stripe/create-checkout", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { amount } = await c.req.json();

    if (!amount || amount <= 0 || amount > 1000000) {
      return c.json({ error: 'Invalid amount. Must be between $1 and $1,000,000' }, 400);
    }

    // Get user profile for email and language
    let profile = await kv.get(`profile_${user.id}`);
    if (!profile) {
      // Fallback to colon format for backward compatibility
      profile = await kv.get(`profile:${user.id}`);
    }
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Create Stripe Checkout Session
    const session = await stripeService.createCheckoutSession({
      userId: user.id,
      amount: amount,
      userEmail: profile.email,
      userName: profile.name || profile.email,
      language: profile.language || 'en',
    });

    // Check if Stripe is configured
    if (session.configured === false) {
      console.warn('⚠️ [Stripe] Not configured, returning error to client');
      return c.json({ 
        error: session.error,
        configured: false,
      }, 503); // 503 Service Unavailable
    }

    console.log(`✅ [Stripe] Checkout session created for user ${user.id}: ${session.sessionId}`);

    return c.json({
      sessionId: session.sessionId,
      url: session.url,
      configured: true,
    });
  } catch (error: any) {
    console.error('❌ [Stripe] Error creating checkout session:', error);
    return c.json({ error: error.message || 'Failed to create checkout session' }, 500);
  }
});

// Test endpoint to check Stripe URL configuration
app.get("/make-server-215f78a5/stripe/test-urls", async (c) => {
  try {
    // Get the base URL that would be used for redirects
    const deploymentUrl = Deno.env.get('DEPLOYMENT_URL');
    const productionUrl = 'https://casewhr.com';
    const baseUrl = deploymentUrl || productionUrl || 'http://localhost:5173';
    
    return c.json({
      base_url: baseUrl,
      success_url: `${baseUrl}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?payment=cancel`,
      deployment_url_set: !!deploymentUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ [Stripe] Error checking URLs:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Verify Stripe configuration
app.get("/make-server-215f78a5/stripe/verify", async (c) => {
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
    
    if (!stripeKey) {
      return c.json({
        configured: false,
        error: 'STRIPE_SECRET_KEY not set'
      });
    }

    // Check key format
    const keyFormat = stripeKey.substring(0, 12) + '...';
    const keyLength = stripeKey.length;
    
    // Validate key format
    const isValidFormat = stripeKey.startsWith('sk_test_') || stripeKey.startsWith('sk_live_');
    
    return c.json({
      configured: true,
      key_format: keyFormat,
      key_length: keyLength,
      is_valid_format: isValidFormat,
      environment: stripeKey.startsWith('sk_test_') ? 'test' : 'live',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ [Stripe] Error verifying configuration:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Stripe Webhook endpoint
app.post("/make-server-215f78a5/stripe/webhook", async (c) => {
  try {
    const signature = c.req.header('stripe-signature');
    if (!signature) {
      return c.json({ error: 'Missing stripe-signature header' }, 400);
    }

    const body = await c.req.text();

    // Handle webhook
    await stripeService.handleWebhook({
      signature: signature,
      body: body,
    });

    return c.json({ received: true });
  } catch (error: any) {
    console.error('❌ [Stripe] Webhook error:', error);
    return c.json({ error: error.message || 'Webhook error' }, 400);
  }
});

// Get payment status
app.get("/make-server-215f78a5/stripe/payment-status/:sessionId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sessionId = c.req.param('sessionId');
    
    const payment = await stripeService.getPaymentStatus(sessionId);
    
    if (!payment) {
      return c.json({ error: 'Payment not found' }, 404);
    }

    // Verify the payment belongs to the user
    if (payment.user_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    return c.json({ payment });
  } catch (error: any) {
    console.error('❌ [Stripe] Error getting payment status:', error);
    return c.json({ error: error.message || 'Failed to get payment status' }, 500);
  }
});

// Verify payment success (called after redirect from Stripe)
app.post("/make-server-215f78a5/stripe/verify-payment", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { session_id } = await c.req.json();

    if (!session_id) {
      return c.json({ error: 'Missing session_id' }, 400);
    }

    // Get payment status
    const payment = await stripeService.getPaymentStatus(session_id);
    
    if (!payment) {
      return c.json({ error: 'Payment not found' }, 404);
    }

    // Verify the payment belongs to the user
    if (payment.user_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Retrieve session from Stripe
    const session = await stripeService.retrieveSession(session_id);

    return c.json({
      payment,
      session: {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        amount_total: session.amount_total ? session.amount_total / 100 : 0,
      },
    });
  } catch (error: any) {
    console.error('❌ [Stripe] Error verifying payment:', error);
    return c.json({ error: error.message || 'Failed to verify payment' }, 500);
  }
});

// ==================== 🅿️ PAYPAL PAYMENT APIs ====================

// Check PayPal configuration status
app.get("/make-server-215f78a5/paypal/status", async (c) => {
  const status = paypalService.getConfigStatus();
  return c.json(status);
});

// Check PayPal configuration status (alias for /paypal/config)
app.get("/make-server-215f78a5/paypal/config", async (c) => {
  const status = paypalService.getConfigStatus();
  return c.json(status);
});

// PayPal Configuration Diagnostic Test
app.post("/make-server-215f78a5/api/paypal/config-test", async (c) => {
  try {
    const PAYPAL_CLIENT_ID = (Deno.env.get('PAYPAL_CLIENT_ID') || '').trim();
    const PAYPAL_CLIENT_SECRET = (Deno.env.get('PAYPAL_CLIENT_SECRET') || '').trim();
    const PAYPAL_MODE = (Deno.env.get('PAYPAL_MODE') || 'live').trim(); // ✅ 生產環境
    // ✅ 支持 'production' 和 'live' 兩種模式名稱
    const isProductionMode = PAYPAL_MODE === 'production' || PAYPAL_MODE === 'live';
    const PAYPAL_API_BASE = isProductionMode
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    const result: any = {
      mode: PAYPAL_MODE,
      apiBase: PAYPAL_API_BASE,
      clientIdSet: !!PAYPAL_CLIENT_ID,
      clientSecretSet: !!PAYPAL_CLIENT_SECRET,
      clientIdLength: PAYPAL_CLIENT_ID.length,
      secretLength: PAYPAL_CLIENT_SECRET.length,
      clientIdPreview: PAYPAL_CLIENT_ID ? `${PAYPAL_CLIENT_ID.substring(0, 10)}...${PAYPAL_CLIENT_ID.substring(PAYPAL_CLIENT_ID.length - 10)}` : null,
      secretPreview: PAYPAL_CLIENT_SECRET ? `${PAYPAL_CLIENT_SECRET.substring(0, 10)}...${PAYPAL_CLIENT_SECRET.substring(PAYPAL_CLIENT_SECRET.length - 10)}` : null,
    };

    // Test authentication if both credentials are set
    if (PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET) {
      try {
        const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
        const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials',
        });

        if (response.ok) {
          result.authTest = {
            success: true,
            message: 'Authentication successful',
          };
        } else {
          const errorText = await response.text();
          let errorJson;
          try {
            errorJson = JSON.parse(errorText);
          } catch (e) {
            errorJson = { error: errorText };
          }
          
          result.authTest = {
            success: false,
            error: `${errorJson.error}: ${errorJson.error_description || 'Authentication failed'}`,
            statusCode: response.status,
          };
        }
      } catch (error) {
        result.authTest = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return c.json(result);
  } catch (error) {
    console.error('❌ [PayPal] Diagnostic error:', error);
    return c.json({
      error: 'Failed to run diagnostics',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Create PayPal Order for wallet deposit
app.post("/make-server-215f78a5/paypal/create-order", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - Please log in to deposit funds' }, 401);
    }

    const { amount } = await c.req.json();

    if (!amount || amount < 1) {
      return c.json({ error: 'Invalid amount. Minimum deposit is $1 USD' }, 400);
    }

    if (amount > 10000) {
      return c.json({ error: 'Maximum deposit is $10,000 USD' }, 400);
    }

    console.log('🅿️ [PayPal] Creating order:', { userId: user.id, amount });

    // Get origin from request headers to maintain www/non-www consistency
    const origin = c.req.header('Origin') || c.req.header('Referer')?.split('?')[0].replace(/\/$/, '');
    console.log('🌐 [PayPal] Request origin:', origin);

    const { orderId, approvalUrl } = await paypalService.createOrder(user.id, amount, origin);

    return c.json({
      orderId,
      approvalUrl,
    });
  } catch (error: any) {
    console.error('❌ [PayPal] Error creating order:', error);
    return c.json({ error: error.message || 'Failed to create PayPal order' }, 500);
  }
});

// Capture PayPal Payment (after user approves)
app.post("/make-server-215f78a5/paypal/capture-payment", async (c) => {
  try {
    const { orderId } = await c.req.json();

    if (!orderId) {
      return c.json({ error: 'Missing orderId' }, 400);
    }

    console.log('🅿️ [PayPal] Capturing payment:', { orderId });

    // ✅ PayPal Service will extract userId from PayPal order data (custom_id)
    // This works even if the user's JWT token has expired during PayPal checkout
    const result = await paypalService.capturePayment(orderId);

    console.log('✅ [PayPal] Payment captured successfully:', {
      userId: result.userId,
      amount: result.amount,
      orderId: orderId,
    });

    return c.json({
      success: true,
      amount: result.amount,
      userId: result.userId,
      message: 'Payment successful! Your wallet has been updated.',
    });
  } catch (error: any) {
    console.error('❌ [PayPal] Error capturing payment:', error);
    return c.json({ 
      error: error.message || 'Failed to capture payment',
      code: 500 
    }, 500);
  }
});

// PayPal Webhook endpoint
app.post("/make-server-215f78a5/paypal/webhook", async (c) => {
  try {
    const headers = c.req.header();
    const body = await c.req.text();

    // Verify webhook signature
    const isValid = await paypalService.verifyWebhook(headers, body);
    
    if (!isValid) {
      console.error('❌ [PayPal] Invalid webhook signature');
      return c.json({ error: 'Invalid signature' }, 401);
    }

    const event = JSON.parse(body);
    
    console.log('🅿️ [PayPal] Webhook received:', event.event_type);

    // Handle different webhook events
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        // Payment was captured successfully
        console.log('✅ [PayPal] Payment captured via webhook');
        break;
      
      case 'PAYMENT.CAPTURE.DENIED':
        // Payment was denied
        console.log('❌ [PayPal] Payment denied');
        break;
      
      default:
        console.log('ℹ️ [PayPal] Unhandled webhook event:', event.event_type);
    }

    return c.json({ received: true });
  } catch (error: any) {
    console.error('❌ [PayPal] Webhook error:', error);
    return c.json({ error: error.message || 'Webhook error' }, 400);
  }
});

// Get PayPal order details
app.get("/make-server-215f78a5/paypal/order/:orderId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orderId = c.req.param('orderId');
    const order = await paypalService.getOrderDetails(orderId);
    
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // Verify the order belongs to the user
    if (order.userId !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    return c.json({ order });
  } catch (error: any) {
    console.error('❌ [PayPal] Error getting order:', error);
    return c.json({ error: error.message || 'Failed to get order details' }, 500);
  }
});

// ==================== 💬 MESSAGING SYSTEM APIs ====================

// Send a message
app.post("/make-server-215f78a5/messages/send", async (c) => {
  try {
    // 🔥 开发模式支持
    const devToken = c.req.header('X-Dev-Token');
    let user: any;
    
    if (devToken) {
      console.log('💬 [Messages] Dev mode detected');
      const [userId, email] = devToken.split('||');
      user = { id: userId, email: email || 'dev@example.com' };
    } else {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const { data: { user: authUser }, error } = await supabase.auth.getUser(accessToken);
      
      if (!authUser || error) {
        console.error('❌ [Messages] Unauthorized:', error);
        return c.json({ error: 'Unauthorized' }, 401);
      }
      user = authUser;
    }

    const body = await c.req.json();
    const { receiver_id, content, project_id } = body;

    if (!receiver_id || !content) {
      return c.json({ error: 'receiver_id and content are required' }, 400);
    }
    
    console.log('💬 [Messages] Sending message:', {
      sender: user.id,
      receiver: receiver_id,
      project: project_id,
    });

    // Create conversation ID (sorted to ensure consistency)
    const conversationId = [user.id, receiver_id].sort().join('_');
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    // Create message object
    const message = {
      id: messageId,
      conversation_id: conversationId,
      sender_id: user.id,
      receiver_id,
      content,
      project_id: project_id || null,
      created_at: new Date().toISOString(),
      read: false,
    };

    // Save message
    await kv.set(`message:${messageId}`, message);

    // Update sender's conversation list
    const senderConvKey = `conversations:${user.id}`;
    const senderConversations = await kv.get(senderConvKey) || [];
    if (!senderConversations.some((c: any) => c.conversation_id === conversationId)) {
      senderConversations.push({
        conversation_id: conversationId,
        other_user_id: receiver_id,
        last_message_at: message.created_at,
        last_message: content.substring(0, 50),
      });
    } else {
      const convIndex = senderConversations.findIndex((c: any) => c.conversation_id === conversationId);
      senderConversations[convIndex].last_message_at = message.created_at;
      senderConversations[convIndex].last_message = content.substring(0, 50);
    }
    await kv.set(senderConvKey, senderConversations);

    // Update receiver's conversation list
    const receiverConvKey = `conversations:${receiver_id}`;
    const receiverConversations = await kv.get(receiverConvKey) || [];
    if (!receiverConversations.some((c: any) => c.conversation_id === conversationId)) {
      receiverConversations.push({
        conversation_id: conversationId,
        other_user_id: user.id,
        last_message_at: message.created_at,
        last_message: content.substring(0, 50),
        unread_count: 1,
      });
    } else {
      const convIndex = receiverConversations.findIndex((c: any) => c.conversation_id === conversationId);
      receiverConversations[convIndex].last_message_at = message.created_at;
      receiverConversations[convIndex].last_message = content.substring(0, 50);
      receiverConversations[convIndex].unread_count = (receiverConversations[convIndex].unread_count || 0) + 1;
    }
    await kv.set(receiverConvKey, receiverConversations);

    // Add message to conversation's message list
    const conversationMessagesKey = `conversation_messages:${conversationId}`;
    const conversationMessages = await kv.get(conversationMessagesKey) || [];
    conversationMessages.push(messageId);
    await kv.set(conversationMessagesKey, conversationMessages);

    console.log(`✅ [Messages] Message sent from ${user.id} to ${receiver_id}`);

    return c.json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// Get conversations list for current user
app.get("/make-server-215f78a5/messages/conversations", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const conversationsKey = `conversations:${user.id}`;
    let conversations = await kv.get(conversationsKey);
    
    // Ensure conversations is an array
    if (!conversations || !Array.isArray(conversations)) {
      console.log(`📭 [Conversations] No conversations found for user ${user.id}`);
      return c.json({ conversations: [] });
    }

    // Get user profiles for each conversation
    const conversationsWithProfiles = await Promise.all(conversations.map(async (conv: any) => {
      let otherUserProfile = await kv.get(`profile_${conv.other_user_id}`);
      if (!otherUserProfile) {
        otherUserProfile = await kv.get(`profile:${conv.other_user_id}`);
      }
      return {
        ...conv,
        other_user_name: otherUserProfile?.name || 'Unknown User',
        other_user_avatar: otherUserProfile?.avatar_url || null,
      };
    }));

    // Sort by last message time
    conversationsWithProfiles.sort((a, b) => 
      new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );

    console.log(`✅ [Conversations] Returning ${conversationsWithProfiles.length} conversations for user ${user.id}`);
    return c.json({ conversations: conversationsWithProfiles });
  } catch (error) {
    console.error('❌ [Conversations] Error fetching conversations:', error);
    // Return empty array instead of error to prevent frontend breaking
    return c.json({ conversations: [], error: 'Failed to fetch conversations' });
  }
});

// Get unread message count (MUST be before /:conversationId to avoid route conflict)
app.get("/make-server-215f78a5/messages/unread-count", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      // ℹ️ Silently return 403 for unauthenticated requests (this is expected behavior)
      // Don't log errors - users who aren't logged in will naturally fail auth
      return c.json({ error: 'Unauthorized', message: 'Please log in to view unread messages' }, 403);
    }

    console.log('📬 [Unread Count] User authenticated:', user.id);
    
    // Add timeout protection
    const timeoutPromise = new Promise<number>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 8000) // 8 second timeout
    );
    
    const countPromise = messageService.getUnreadCount(user.id);
    
    const count = await Promise.race([countPromise, timeoutPromise]);
    console.log('✅ [Unread Count] Count:', count);
    
    return c.json({ count });
  } catch (error: any) {
    console.error('❌ [Unread Count] Error:', error.message || error);
    
    // Return 0 count on error instead of failing
    if (error.message === 'Timeout') {
      console.warn('⚠️ [Unread Count] Request timed out, returning 0');
      return c.json({ count: 0, warning: 'Request timed out' }, 200);
    }
    
    return c.json({ count: 0, error: 'Failed to fetch unread count' }, 200);
  }
});

// Get messages for a specific conversation
app.get("/make-server-215f78a5/messages/:conversationId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const conversationId = c.req.param('conversationId');
    
    // Verify user is part of this conversation
    const userIds = conversationId.split('_');
    if (!userIds.includes(user.id)) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Get message IDs
    const conversationMessagesKey = `conversation_messages:${conversationId}`;
    const messageIds = await kv.get(conversationMessagesKey) || [];

    // Get all messages
    const messages = await Promise.all(
      messageIds.map(async (msgId: string) => {
        const msg = await kv.get(`message:${msgId}`);
        return msg;
      })
    );

    // Filter out null messages and sort by created_at
    const validMessages = messages.filter(m => m !== null).sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Mark messages as read for receiver
    const otherUserId = userIds.find(id => id !== user.id);
    const receiverConvKey = `conversations:${user.id}`;
    const receiverConversations = await kv.get(receiverConvKey) || [];
    const convIndex = receiverConversations.findIndex((c: any) => c.conversation_id === conversationId);
    if (convIndex !== -1) {
      receiverConversations[convIndex].unread_count = 0;
      await kv.set(receiverConvKey, receiverConversations);
    }

    // Mark individual messages as read
    await Promise.all(
      validMessages
        .filter(msg => msg.receiver_id === user.id && !msg.read)
        .map(async (msg) => {
          msg.read = true;
          await kv.set(`message:${msg.id}`, msg);
        })
    );

    return c.json({ messages: validMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});

// ========== 郵件整合 API 端點 ==========

// 📧 發送歡迎郵件（註冊時自動觸發）
app.post("/make-server-215f78a5/emails/welcome", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, email, name, language = 'zh' } = body;

    if (!userId || !email || !name) {
      return c.json({ error: 'userId, email, and name are required' }, 400);
    }

    const result = await emailIntegration.sendWelcomeEmail({
      userId,
      email,
      name,
      language: language as 'en' | 'zh',
    });

    return c.json(result);
  } catch (error: any) {
    console.error('Error in welcome email endpoint:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 📊 發送月度���告
app.post("/make-server-215f78a5/emails/monthly-report", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, email, name, month, stats, language = 'zh' } = body;

    if (!userId || !email || !name || !month || !stats) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const result = await emailIntegration.sendMonthlyReport({
      userId,
      email,
      name,
      month,
      stats,
      language: language as 'en' | 'zh',
    });

    return c.json(result);
  } catch (error: any) {
    console.error('Error in monthly report endpoint:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 🎯 發送項目推薦
app.post("/make-server-215f78a5/emails/project-recommendations", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, email, name, projects, language = 'zh' } = body;

    if (!userId || !email || !name || !projects || !Array.isArray(projects)) {
      return c.json({ error: 'Missing or invalid required fields' }, 400);
    }

    const result = await emailIntegration.sendProjectRecommendations({
      userId,
      email,
      name,
      projects,
      language: language as 'en' | 'zh',
    });

    return c.json(result);
  } catch (error: any) {
    console.error('Error in project recommendations endpoint:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ��� 發送里程碑提醒
app.post("/make-server-215f78a5/emails/milestone-reminder", async (c) => {
  try {
    const body = await c.req.json();
    const { 
      userId, 
      email, 
      name, 
      projectTitle, 
      milestonesCompleted, 
      totalMilestones, 
      nextMilestone, 
      daysRemaining,
      language = 'zh' 
    } = body;

    if (!userId || !email || !name || !projectTitle || 
        milestonesCompleted === undefined || totalMilestones === undefined ||
        !nextMilestone || daysRemaining === undefined) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const result = await emailIntegration.sendMilestoneReminder({
      userId,
      email,
      name,
      projectTitle,
      milestonesCompleted,
      totalMilestones,
      nextMilestone,
      daysRemaining,
      language: language as 'en' | 'zh',
    });

    return c.json(result);
  } catch (error: any) {
    console.error('Error in milestone reminder endpoint:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 💌 發送訊息通知
app.post("/make-server-215f78a5/emails/message-notification", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, email, name, senderName, messagePreview, projectTitle, language = 'zh' } = body;

    if (!userId || !email || !name || !senderName || !messagePreview) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const result = await emailIntegration.sendMessageNotification({
      userId,
      email,
      name,
      senderName,
      messagePreview,
      projectTitle,
      language: language as 'en' | 'zh',
    });

    return c.json(result);
  } catch (error: any) {
    console.error('Error in message notification endpoint:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 🔔 發送系統通知
app.post("/make-server-215f78a5/emails/system-notification", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, email, name, title, message, type, actionButton, language = 'zh' } = body;

    if (!userId || !email || !name || !title || !message || !type) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (!['info', 'success', 'warning', 'danger'].includes(type)) {
      return c.json({ error: 'Invalid notification type' }, 400);
    }

    const result = await emailIntegration.sendSystemNotification({
      userId,
      email,
      name,
      title,
      message,
      type: type as 'info' | 'success' | 'warning' | 'danger',
      actionButton,
      language: language as 'en' | 'zh',
    });

    return c.json(result);
  } catch (error: any) {
    console.error('Error in system notification endpoint:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 📈 批量���送月度報告（管理員功能）
app.post("/make-server-215f78a5/emails/bulk-monthly-reports", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // 檢查是否為管理員
    const userProfile = await kv.get(`profile_${user.id}`);
    if (!userProfile?.isAdmin) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { month, userReports } = body;

    if (!month || !userReports || !Array.isArray(userReports)) {
      return c.json({ error: 'Invalid request body' }, 400);
    }

    const result = await emailIntegration.sendBulkMonthlyReports({
      month,
      userReports,
    });

    return c.json(result);
  } catch (error: any) {
    console.error('Error in bulk monthly reports endpoint:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ���� 獲取用戶郵件歷史
app.get("/make-server-215f78a5/emails/history/:userId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.param('userId');

    // 用戶只能查看自己的郵件歷史，除非是管理員
    const userProfile = await kv.get(`profile_${user.id}`);
    if (user.id !== userId && !userProfile?.isAdmin) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const history = await emailIntegration.getUserEmailHistory(userId);

    return c.json({ history });
  } catch (error: any) {
    console.error('Error fetching email history:', error);
    return c.json({ error: 'Failed to fetch email history' }, 500);
  }
});

// 📊 獲取郵件發送統計
app.get("/make-server-215f78a5/emails/stats", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // 檢查是否為管理員
    const userProfile = await kv.get(`profile_${user.id}`);
    if (!userProfile?.isAdmin) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const stats = await emailIntegration.getEmailStats();

    return c.json({ stats });
  } catch (error: any) {
    console.error('Error fetching email stats:', error);
    return c.json({ error: 'Failed to fetch email stats' }, 500);
  }
});

// ===========================
// 🤖 AI SEO 報告雲端儲存 API
// ===========================

// 💾 儲存 AI SEO 報告到雲端
app.post("/make-server-215f78a5/ai/save-report", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - Please log in' }, 401);
    }

    const { reportData } = await c.req.json();
    
    if (!reportData) {
      return c.json({ error: 'Missing reportData' }, 400);
    }

    // 生成報告 ID
    const reportId = `ai_seo_${user.id}_${Date.now()}`;
    
    // 構建報告物件
    const report = {
      id: reportId,
      userId: user.id,
      title: reportData.title || '',
      description: reportData.description || '',
      keywords: reportData.keywords || '',
      pageType: reportData.pageType || 'home',
      analysis: reportData.analysis || null,
      generatedData: reportData.generatedData || null,
      createdAt: new Date().toISOString(),
    };

    console.log('💾 [AI SEO] Saving report to database...');
    console.log('  📝 Report ID:', reportId);
    console.log('  👤 User ID:', user.id);
    console.log('  📊 Report data size:', JSON.stringify(report).length, 'bytes');

    // 🔥 直接使用 Supabase Client 写入数据库（绕过 KV Store 的静默失败）
    console.log('🔥 [DEBUG] About to call supabase.from(kv_store_215f78a5).upsert()');
    console.log('🔥 [DEBUG] Supabase URL:', Deno.env.get('SUPABASE_URL'));
    console.log('🔥 [DEBUG] Service Role Key exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    
    const { error: insertError } = await supabase
      .from('kv_store_215f78a5')
      .upsert({ key: reportId, value: report });
    
    console.log('🔥 [DEBUG] Upsert completed. Error:', insertError);
    
    if (insertError) {
      console.error('❌ [AI SEO] Database write failed:', insertError);
      console.error('❌ [AI SEO] Error details:', JSON.stringify(insertError, null, 2));
      return c.json({ 
        error: 'Failed to save report to database', 
        details: insertError.message 
      }, 500);
    }
    
    console.log('✅ [AI SEO] Report saved to database');
    
    // 驗證保存是否成功
    const { data: verifyData, error: verifyError } = await supabase
      .from('kv_store_215f78a5')
      .select('value')
      .eq('key', reportId)
      .maybeSingle();
    
    if (verifyError || !verifyData) {
      console.error('❌ [AI SEO] Verification failed:', verifyError);
      return c.json({ 
        error: 'Report save verification failed',
        reportId
      }, 500);
    }
    
    console.log('✅ [AI SEO] Verification successful - Report exists in database');
    
    // 更新用戶的報告列表（直接用 Supabase）
    const userReportsKey = `ai_seo_reports_${user.id}`;
    console.log('📋 [AI SEO] Updating user report list:', userReportsKey);
    
    // 获取现有报告列表
    const { data: existingData } = await supabase
      .from('kv_store_215f78a5')
      .select('value')
      .eq('key', userReportsKey)
      .maybeSingle();
    
    const existingReports = (existingData?.value || []) as string[];
    console.log('  📦 Existing reports count:', existingReports.length);
    
    const updatedReports = [reportId, ...existingReports].slice(0, 50); // 最多保存 50 個報告
    
    // 保存更新后的列表
    await supabase
      .from('kv_store_215f78a5')
      .upsert({ key: userReportsKey, value: updatedReports });
    
    console.log('  ✅ Updated reports count:', updatedReports.length);

    console.log('✅ AI SEO report saved:', reportId);

    return c.json({ 
      success: true, 
      reportId,
      message: 'Report saved successfully'
    });
  } catch (error: any) {
    console.error('❌ Error saving AI SEO report:', error);
    return c.json({ error: error.message || 'Failed to save report' }, 500);
  }
});

// 📋 獲取用戶的 AI SEO 報告列表
app.get("/make-server-215f78a5/ai/reports", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - Please log in' }, 401);
    }

    const userReportsKey = `ai_seo_reports_${user.id}`;
    
    // 直接从数据库获取报告ID列表
    const { data: listData } = await supabase
      .from('kv_store_215f78a5')
      .select('value')
      .eq('key', userReportsKey)
      .maybeSingle();
    
    const reportIds = (listData?.value || []) as string[];
    console.log('📋 [AI Reports] User:', user.id, 'Report IDs:', reportIds.length);
    
    // 獲取所有報告的摘要信息（直接从数据库）
    const reports = [];
    for (const reportId of reportIds) {
      const { data: reportData } = await supabase
        .from('kv_store_215f78a5')
        .select('value')
        .eq('key', reportId)
        .maybeSingle();
      
      const report = reportData?.value;
      if (report) {
        // 只返回摘要信息，不包含完整的分析數據
        reports.push({
          id: report.id,
          title: report.title,
          pageType: report.pageType,
          createdAt: report.createdAt,
          hasAnalysis: !!report.analysis,
          hasGeneratedData: !!report.generatedData,
        });
      }
    }

    return c.json({ 
      success: true,
      reports,
      total: reports.length
    });
  } catch (error: any) {
    console.error('❌ Error fetching AI SEO reports:', error);
    return c.json({ error: error.message || 'Failed to fetch reports' }, 500);
  }
});

// 📄 獲取單個 AI SEO 報告的完整數據
app.get("/make-server-215f78a5/ai/reports/:reportId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - Please log in' }, 401);
    }

    const reportId = c.req.param('reportId');
    const report = await kv.get(reportId);

    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }

    // 驗證報告所有權
    if (report.userId !== user.id) {
      return c.json({ error: 'Forbidden - You do not own this report' }, 403);
    }

    return c.json({ 
      success: true,
      report
    });
  } catch (error: any) {
    console.error('❌ Error fetching AI SEO report:', error);
    return c.json({ error: error.message || 'Failed to fetch report' }, 500);
  }
});

// 🗑️ 刪除 AI SEO 報告
app.delete("/make-server-215f78a5/ai/reports/:reportId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - Please log in' }, 401);
    }

    const reportId = c.req.param('reportId');
    const report = await kv.get(reportId);

    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }

    // 驗證報告所有權
    if (report.userId !== user.id) {
      return c.json({ error: 'Forbidden - You do not own this report' }, 403);
    }

    // 從 KV Store 刪除報告
    await kv.del(reportId);

    // 從用戶報告列表中移除
    const userReportsKey = `ai_seo_reports_${user.id}`;
    const reportIds = await kv.get(userReportsKey) || [];
    const updatedReports = reportIds.filter((id: string) => id !== reportId);
    await kv.set(userReportsKey, updatedReports);

    console.log('✅ AI SEO report deleted:', reportId);

    return c.json({ 
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error: any) {
    console.error('❌ Error deleting AI SEO report:', error);
    return c.json({ error: error.message || 'Failed to delete report' }, 500);
  }
});

// 🌍 公開訪問：獲取單個 AI SEO 報告（無需登錄）
app.get("/make-server-215f78a5/public/seo-report/:reportId", async (c) => {
  try {
    const reportId = c.req.param('reportId');
    console.log('🌍 [Public SEO Report] Fetching report:', reportId);
    
    // 從數據庫獲取報告
    const { data, error } = await supabase
      .from('kv_store_215f78a5')
      .select('value')
      .eq('key', reportId)
      .single();
    
    if (error || !data) {
      console.error('❌ [Public SEO Report] Report not found:', reportId);
      return c.json({ error: 'Report not found' }, 404);
    }

    const report = data.value;
    
    console.log('✅ [Public SEO Report] Report found:', {
      id: report.id,
      keyword: report.keyword,
      hasAnalysis: !!report.analysis
    });

    return c.json({ 
      success: true,
      report
    });
  } catch (error: any) {
    console.error('❌ [Public SEO Report] Error:', error);
    return c.json({ error: error.message || 'Failed to fetch report' }, 500);
  }
});

// 🗺️ Sitemap.xml - 列出所有 AI SEO 報告
app.get("/make-server-215f78a5/sitemap.xml", async (c) => {
  try {
    console.log('🗺️ [Sitemap] Generating sitemap...');
    
    // 獲取所有 AI SEO 報告
    const { data, error } = await supabase
      .from('kv_store_215f78a5')
      .select('key, value')
      .like('key', 'ai_seo_%')
      .not('key', 'like', '%_reports_%');
    
    if (error) {
      console.error('❌ [Sitemap] Database error:', error);
      throw error;
    }

    const reports = data || [];
    console.log(`✅ [Sitemap] Found ${reports.length} reports`);
    
    const baseUrl = 'https://casewhr.com';
    const urls = reports.map(item => {
      // 使用當前日期作為 lastmod，因為 kv_store 沒有 created_at 欄位
      const lastmod = new Date().toISOString().split('T')[0];
      return `
  <url>
    <loc>${baseUrl}/seo-report/${item.key}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }).join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>${urls}
</urlset>`;

    console.log('✅ [Sitemap] Sitemap generated successfully');
    
    return c.text(sitemap, 200, {
      'Content-Type': 'application/xml'
    });
  } catch (error: any) {
    console.error('❌ [Sitemap] Error:', error);
    return c.text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', 500);
  }
});

// 🤖 robots.txt
app.get("/make-server-215f78a5/robots.txt", async (c) => {
  const robotsTxt = `User-agent: *
Allow: /
Allow: /seo-report/

Sitemap: https://casewhr.com/sitemap.xml`;

  return c.text(robotsTxt, 200, {
    'Content-Type': 'text/plain'
  });
});

// Validate critical environment variables before starting server
const validateEnvironment = () => {
  const required = {
    'SUPABASE_URL': Deno.env.get('SUPABASE_URL'),
    'SUPABASE_SERVICE_ROLE_KEY': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  };
  
  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
  
  if (missing.length > 0) {
    console.error('❌ CRITICAL: Missing required environment variables:', missing);
    console.error('❌ Server will not function properly without these variables!');
    console.error('❌ Please configure the following in your Supabase project settings:');
    missing.forEach(key => console.error(`   - ${key}`));
    return false;
  }
  
  console.log('✅ All required environment variables are configured');
  return true;
};

// Validate environment on startup
if (!validateEnvironment()) {
  console.error('⚠️  Server starting with missing environment variables - some features will not work!');
}

// ============= DASHBOARD STATS ROUTE =============

// Get dashboard statistics for a user
app.get("/make-server-215f78a5/dashboard/stats/:userId", async (c) => {
  try {
    // 🔧 FIX: Support dev mode with X-Dev-Token header
    const devToken = c.req.header('X-Dev-Token');
    let accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // If dev token is provided, use it as the access token
    if (devToken && devToken.startsWith('dev-user-')) {
      accessToken = devToken;
      console.log('🧪 [Dashboard Stats] Using dev token from X-Dev-Token header');
    }
    
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      // Only log if it's not a common session expiry error
      if (authError?.message && !authError.message.includes('expired') && !authError.message.includes('Session expired')) {
        console.error('[Dashboard Stats] Unexpected auth error:', authError);
      }
      return c.json({ code: 401, message: 'Invalid JWT' }, 401);
    }

    const userId = c.req.param('userId');
    
    // Users can only view their own stats unless they're admin
    let userProfile;
    try {
      userProfile = await kv.get(`profile_${user.id}`);
      if (!userProfile) {
        userProfile = await kv.get(`profile:${user.id}`);
      }
      console.log('[Dashboard Stats] User profile loaded:', !!userProfile);
    } catch (kvError: any) {
      console.error('[Dashboard Stats] KV Store error fetching profile:', kvError.message);
      // If KV store fails, try to continue with default permissions
      userProfile = null;
    }
    
    const isAdmin = userProfile?.isAdmin === true;
    
    if (user.id !== userId && !isAdmin) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Get user's projects with error handling
    let userProjects = [];
    try {
      userProjects = await kv.get(`projects:user:${userId}`) || [];
      console.log(`[Dashboard Stats] User ${userId} has ${userProjects.length} projects:`, userProjects);
    } catch (kvError: any) {
      console.error('[Dashboard Stats] Error fetching user projects:', kvError.message);
      // Continue with empty array if fetch fails
    }
    
    let totalProjects = 0;
    let activeProjects = 0;
    let completedProjects = 0;
    
    for (const projectId of userProjects) {
      try {
        const project = await kv.get(`project:${projectId}`);
        if (project) {
          totalProjects++;
          console.log(`[Dashboard Stats] Project ${projectId} status: ${project.status}`);
          // ✅ FIX: 包含所有進行中的狀態：等待接案、執行中、待審核、待撥款
          if (project.status === 'open' || project.status === 'in_progress' || project.status === 'pending_review' || project.status === 'pending_payment') {
            activeProjects++;
            console.log(`[Dashboard Stats] Project ${projectId} counted as active (status: ${project.status})`);
          }
          if (project.status === 'completed') {
            completedProjects++;
          }
        } else {
          console.warn(`[Dashboard Stats] Project ${projectId} not found in KV store`);
        }
      } catch (projectError: any) {
        console.error(`[Dashboard Stats] Error fetching project ${projectId}:`, projectError.message);
        // Continue with next project
      }
    }

    // Get wallet balance with error handling
    let balance = 0;
    try {
      const wallet = await kv.get(`wallet:${userId}`) || { balance: 0 };
      balance = wallet.balance || 0;
    } catch (walletError: any) {
      console.error('[Dashboard Stats] Error fetching wallet:', walletError.message);
    }

    // Get unread messages with error handling
    let unreadMessages = 0;
    try {
      unreadMessages = await messageService.getUnreadCount(userId);
    } catch (msgError: any) {
      console.error('[Dashboard Stats] Error fetching unread messages:', msgError.message);
    }

    // Get subscription info with error handling
    let subscription = { tier: 'free', status: 'inactive' };
    try {
      const subData = await kv.get(`subscription:${userId}`);
      if (subData) {
        subscription = {
          tier: subData.tier || 'free',
          status: subData.status || 'inactive'
        };
      }
    } catch (subError: any) {
      console.error('[Dashboard Stats] Error fetching subscription:', subError.message);
    }

    const stats = {
      totalProjects,
      activeProjects,
      completedProjects,
      balance,
      unreadMessages,
      subscription
    };

    console.log('[Dashboard Stats] Successfully compiled stats for user:', userId);
    console.log('[Dashboard Stats] Final stats:', JSON.stringify(stats, null, 2));
    return c.json(stats);
  } catch (error: any) {
    console.error('[Dashboard Stats] Fatal error:', error);
    console.error('[Dashboard Stats] Error stack:', error.stack);
    
    // Return a safe fallback response instead of failing completely
    return c.json({
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      balance: 0,
      unreadMessages: 0,
      subscription: {
        tier: 'free',
        status: 'inactive'
      },
      error: 'Partial data loaded due to server error',
      _errorDetails: error.message
    }, 200); // Return 200 with error info instead of 500
  }
});

// ============= MESSAGE & CONVERSATION ROUTES =============

// Get user's conversations
app.get("/make-server-215f78a5/conversations", async (c) => {
  try {
    console.log('🔍 [GET /conversations] Request received');
    const authHeader = c.req.header('Authorization');
    const devToken = c.req.header('X-Dev-Token');
    
    // 🧪 DEV MODE: Use dev token if provided
    let accessToken = authHeader?.split(' ')[1];
    if (devToken && devToken.startsWith('dev-user-')) {
      console.log('🧪 [GET /conversations] Dev mode detected, using dev token');
      accessToken = devToken;
    }
    
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      // Silently return 401 for unauthenticated requests
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if admin (with backward compatibility + dev token support)
    let isAdmin = false;
    
    // Dev mode users are automatically admin
    if (accessToken?.startsWith('dev-user-')) {
      isAdmin = true;
      console.log('🧪 [GET /conversations] Dev mode user - granting admin access');
    } else {
      let userProfile = await kv.get(`profile_${user.id}`);
      if (!userProfile) {
        userProfile = await kv.get(`profile:${user.id}`);
      }
      isAdmin = userProfile?.isAdmin === true;
    }
    
    console.log('🔍 [GET /conversations] User:', { id: user.id, isAdmin });

    const conversations = await messageService.getUserConversations(user.id, isAdmin);
    
    console.log('✅ [GET /conversations] Returning:', conversations.length, 'conversations');
    return c.json({ conversations });
  } catch (error: any) {
    console.error('❌ [GET /conversations] Error:', error);
    return c.json({ error: error.message || 'Failed to fetch conversations' }, 500);
  }
});

// Get or create conversation
app.post("/make-server-215f78a5/conversations", async (c) => {
  try {
    console.log('💬 [Create Conversation] Request received');
    console.log('💬 [Create Conversation] Request headers:', {
      'user-agent': c.req.header('user-agent'),
      'referer': c.req.header('referer'),
      'origin': c.req.header('origin'),
    });
    
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      // Silently return 401 for unauthenticated requests
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    console.log('💬 [Create Conversation] Raw body received:', JSON.stringify(body));
    console.log('💬 [Create Conversation] Body type:', typeof body);
    console.log('💬 [Create Conversation] All body keys:', Object.keys(body));
    
    const { clientId, freelancerId, projectId } = body;

    console.log('💬 [Create Conversation] Request data:', {
      clientId,
      freelancerId,
      projectId,
      requestingUserId: user.id,
      bodyKeys: Object.keys(body),
      hasClientId: !!clientId,
      hasFreelancerId: !!freelancerId,
    });

    if (!clientId || !freelancerId) {
      console.error('❌ [Create Conversation] Missing required fields:', {
        clientId: clientId || 'MISSING',
        freelancerId: freelancerId || 'MISSING',
        receivedBody: body,
        requestOrigin: c.req.header('referer') || 'UNKNOWN',
        userAgent: c.req.header('user-agent') || 'UNKNOWN',
      });
      return c.json({ 
        error: 'Client ID and Freelancer ID are required',
        hint: 'Please use the application UI buttons, not test scripts. Expected body: { clientId, freelancerId, projectId }',
        receivedKeys: Object.keys(body),
      }, 400);
    }

    // User must be one of the participants
    if (user.id !== clientId && user.id !== freelancerId) {
      console.error('❌ [Create Conversation] Forbidden - User is not a participant:', {
        userId: user.id,
        clientId,
        freelancerId,
      });
      return c.json({ error: 'Forbidden' }, 403);
    }

    console.log('🔹 [Create Conversation] Calling getOrCreateConversation...');
    const conversation = await messageService.getOrCreateConversation(
      clientId,
      freelancerId,
      projectId
    );
    
    console.log('✅ [Create Conversation] Success:', {
      conversationId: conversation.id,
      clientId: conversation.participants.client_id,
      freelancerId: conversation.participants.freelancer_id,
      projectId: conversation.project_id,
    });
    
    return c.json({ conversation });
  } catch (error: any) {
    console.error('❌ [Create Conversation] Error:', error);
    console.error('❌ [Create Conversation] Error stack:', error.stack);
    console.error('❌ [Create Conversation] Error name:', error.name);
    return c.json({ error: error.message || 'Failed to create conversation' }, 500);
  }
});

// Get messages in a conversation
app.get("/make-server-215f78a5/conversations/:id/messages", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const devToken = c.req.header('X-Dev-Token');
    
    // 🧪 DEV MODE: Use dev token if provided
    let accessToken = authHeader?.split(' ')[1];
    if (devToken && devToken.startsWith('dev-user-')) {
      accessToken = devToken;
    }
    
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const conversationId = c.req.param('id');
    
    // Check if admin (with dev token support)
    let isAdmin = false;
    if (accessToken?.startsWith('dev-user-')) {
      isAdmin = true;
    } else {
      let userProfile = await kv.get(`profile_${user.id}`);
      if (!userProfile) {
        userProfile = await kv.get(`profile:${user.id}`);
      }
      isAdmin = userProfile?.isAdmin === true;
    }

    const messages = await messageService.getMessages(conversationId);
    
    // Mark messages as read (only if not admin viewing)
    if (!isAdmin) {
      await messageService.markMessagesAsRead(conversationId, user.id);
    }
    
    return c.json({ messages });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return c.json({ error: error.message || 'Failed to fetch messages' }, 500);
  }
});

// Send a message
app.post("/make-server-215f78a5/conversations/:id/messages", async (c) => {
  try {
    console.log('📨 [Send Message] Request received');
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      // Silently return 401 for unauthenticated requests
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const conversationId = c.req.param('id');
    const body = await c.req.json();
    const { content } = body;

    console.log('📨 [Send Message] Request data:', {
      conversationId,
      senderId: user.id,
      contentLength: content?.length || 0,
    });

    if (!content || !content.trim()) {
      console.error('❌ [Send Message] Empty content');
      return c.json({ error: 'Message content is required' }, 400);
    }

    const message = await messageService.sendMessage(conversationId, user.id, content.trim());
    
    console.log('✅ [Send Message] Success:', {
      messageId: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      senderName: message.sender_name,
    });
    
    return c.json({ message });
  } catch (error: any) {
    console.error('❌ [Send Message] Error:', error);
    return c.json({ error: error.message || 'Failed to send message' }, 500);
  }
});

// Get available users for chat
app.get("/make-server-215f78a5/users/available-for-chat", async (c) => {
  try {
    console.log('👥 [Available Users] Request received');
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      // Silently return 401 for unauthenticated requests
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('👥 [Available Users] Loading for user:', user.id);

    // Get user profile to determine if they are a freelancer
    let currentUserProfile = await kv.get(`profile_${user.id}`);
    if (!currentUserProfile) {
      currentUserProfile = await kv.get(`profile:${user.id}`);
    }
    const isCurrentUserFreelancer = currentUserProfile?.is_freelancer ?? (currentUserProfile?.account_type === 'freelancer');

    console.log('👥 [Available Users] Current user type:', isCurrentUserFreelancer ? 'Freelancer' : 'Client');

    // Helper function to get project owner ID (supports both user_id and client_id)
    const getProjectOwnerId = (project: any) => project.user_id || project.client_id;

    // Collect unique user IDs from multiple sources
    const userIds = new Set<string>();
    const userProjectMap = new Map<string, { projectId: string; projectTitle: string }>();

    // Source 1: Get all projects where the user is involved (as owner or freelancer)
    const allProjects = (await kv.getByPrefix('project_')).map(item => item.value);
    const userProjects = allProjects.filter((p: any) => {
      const ownerId = getProjectOwnerId(p);
      return ownerId === user.id || p.assigned_freelancer_id === user.id;
    });

    console.log('👥 [Available Users] Found user projects:', userProjects.length);

    for (const project of userProjects) {
      // Add project owner (support both user_id and client_id)
      const ownerId = getProjectOwnerId(project);
      if (ownerId && ownerId !== user.id) {
        userIds.add(ownerId);
        if (!userProjectMap.has(ownerId)) {
          userProjectMap.set(ownerId, {
            projectId: project.id,
            projectTitle: project.title,
          });
        }
      }
      
      // Add assigned freelancer
      if (project.assigned_freelancer_id && project.assigned_freelancer_id !== user.id) {
        userIds.add(project.assigned_freelancer_id);
        if (!userProjectMap.has(project.assigned_freelancer_id)) {
          userProjectMap.set(project.assigned_freelancer_id, {
            projectId: project.id,
            projectTitle: project.title,
          });
        }
      }
    }

    // Source 2: Get all proposals on user's projects (if user is a client)
    if (!isCurrentUserFreelancer) {
      const allProposals = (await kv.getByPrefix('proposal_')).map(item => item.value);
      const userProjectIds = userProjects.map((p: any) => p.id);
      
      const relevantProposals = allProposals.filter((proposal: any) => 
        userProjectIds.includes(proposal.project_id)
      );

      console.log('👥 [Available Users] Found proposals on user projects:', relevantProposals.length);

      for (const proposal of relevantProposals) {
        if (proposal.user_id && proposal.user_id !== user.id) {
          userIds.add(proposal.user_id);
          
          // Find the project for this proposal
          const project = userProjects.find((p: any) => p.id === proposal.project_id);
          if (project && !userProjectMap.has(proposal.user_id)) {
            userProjectMap.set(proposal.user_id, {
              projectId: project.id,
              projectTitle: project.title,
            });
          }
        }
      }
    }

    // Source 3: Get all projects where user has submitted proposals (if user is a freelancer)
    if (isCurrentUserFreelancer) {
      const allProposals = (await kv.getByPrefix('proposal_')).map(item => item.value);
      const userProposals = allProposals.filter((proposal: any) => 
        proposal.user_id === user.id
      );

      console.log('👥 [Available Users] Found user proposals:', userProposals.length);

      for (const proposal of userProposals) {
        // Find the project owner (support both user_id and client_id)
        const project = allProjects.find((p: any) => p.id === proposal.project_id);
        if (project) {
          const ownerId = getProjectOwnerId(project);
          if (ownerId && ownerId !== user.id) {
            userIds.add(ownerId);
            if (!userProjectMap.has(ownerId)) {
              userProjectMap.set(ownerId, {
                projectId: project.id,
                projectTitle: project.title,
              });
            }
          }
        }
      }

      // Source 4: Get all open projects (so freelancers can contact clients before proposing)
      const allOpenProjects = allProjects.filter((p: any) => p.status === 'open');
      console.log('👥 [Available Users] Total projects in DB:', allProjects.length);
      console.log('👥 [Available Users] Projects with "open" status:', allOpenProjects.length);
      
      // Log sample of projects WITHOUT owner ID
      const projectsWithoutOwner = allOpenProjects.filter((p: any) => !getProjectOwnerId(p));
      console.log('👥 [Available Users] Projects WITHOUT owner ID:', projectsWithoutOwner.length);
      if (projectsWithoutOwner.length > 0) {
        console.log('👥 [Available Users] Sample project WITHOUT owner:', {
          id: projectsWithoutOwner[0].id,
          title: projectsWithoutOwner[0].title,
          status: projectsWithoutOwner[0].status,
          fields: Object.keys(projectsWithoutOwner[0])
        });
      }
      
      const openProjects = allOpenProjects.filter((p: any) => {
        const ownerId = getProjectOwnerId(p);
        return ownerId && ownerId !== user.id;
      });
      console.log('👥 [Available Users] Found open projects WITH owner (filtered):', openProjects.length);
      if (openProjects.length > 0) {
        console.log('👥 [Available Users] Sample open project:', {
          id: openProjects[0].id,
          title: openProjects[0].title,
          status: openProjects[0].status,
          user_id: openProjects[0].user_id,
          client_id: openProjects[0].client_id,
          ownerId: getProjectOwnerId(openProjects[0])
        });
      }

      for (const project of openProjects) {
        const ownerId = getProjectOwnerId(project);
        if (ownerId && ownerId !== user.id) {
          userIds.add(ownerId);
          if (!userProjectMap.has(ownerId)) {
            userProjectMap.set(ownerId, {
              projectId: project.id,
              projectTitle: project.title,
            });
          }
        }
      }
    }

    console.log('👥 [Available Users] Unique users found:', userIds.size);

    // Source 5: Get users from existing conversations
    const allConversations = (await kv.getByPrefix('conversation:')).map(item => item.value);
    const userConversations = allConversations.filter((conv: any) => 
      conv.participants?.client_id === user.id || conv.participants?.freelancer_id === user.id
    );

    console.log('👥 [Available Users] Found existing conversations:', userConversations.length);

    for (const conv of userConversations) {
      if (conv.participants) {
        // Add the other participant
        const otherUserId = conv.participants.client_id === user.id 
          ? conv.participants.freelancer_id 
          : conv.participants.client_id;
        
        if (otherUserId && otherUserId !== user.id) {
          userIds.add(otherUserId);
          
          // Try to use the conversation's project if available
          if (conv.project_id && !userProjectMap.has(otherUserId)) {
            const project = allProjects.find((p: any) => p.id === conv.project_id);
            if (project) {
              userProjectMap.set(otherUserId, {
                projectId: project.id,
                projectTitle: project.title,
              });
            }
          }
        }
      }
    }

    console.log('👥 [Available Users] Total unique users after conversations:', userIds.size);

    // Get user profiles
    const users = [];
    for (const userId of userIds) {
      // Try both key formats
      let profile = await kv.get(`profile_${userId}`);
      if (!profile) {
        profile = await kv.get(`profile:${userId}`);
      }
      
      if (profile) {
        const projectInfo = userProjectMap.get(userId);
        const isFreelancer = profile.is_freelancer ?? (profile.account_type === 'freelancer');
        
        users.push({
          id: userId,
          name: profile.name || profile.email?.split('@')[0] || 'Unknown User',
          email: profile.email || '',
          avatar: profile.avatar_url,
          type: isFreelancer ? 'freelancer' : 'client',
          projectTitle: projectInfo?.projectTitle,
          projectId: projectInfo?.projectId,
        });
      }
    }

    // Sort by name
    users.sort((a, b) => a.name.localeCompare(b.name));

    console.log('✅ [Available Users] Returning users:', users.length);

    return c.json({ users });
  } catch (error: any) {
    console.error('❌ [Available Users] Error:', error);
    return c.json({ error: error.message || 'Failed to fetch users' }, 500);
  }
});

// Delete conversation (admin or participant)
app.delete("/make-server-215f78a5/conversations/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const devToken = c.req.header('X-Dev-Token');
    
    // 🧪 DEV MODE: Use dev token if provided
    let accessToken = authHeader?.split(' ')[1];
    if (devToken && devToken.startsWith('dev-user-')) {
      accessToken = devToken;
    }
    
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const conversationId = c.req.param('id');
    
    // Get conversation to check permissions
    const conversation = await kv.get(`conversation:${conversationId}`);
    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }
    
    // Check if user is admin OR a participant in the conversation
    let isAdmin = false;
    
    // Dev mode users are automatically admin
    if (accessToken?.startsWith('dev-user-')) {
      isAdmin = true;
    } else {
      let userProfile = await kv.get(`profile_${user.id}`);
      if (!userProfile) {
        userProfile = await kv.get(`profile:${user.id}`);
      }
      isAdmin = userProfile?.isAdmin || false;
    }
    const isParticipant = 
      user.id === conversation.participants?.client_id || 
      user.id === conversation.participants?.freelancer_id;
    
    if (!isAdmin && !isParticipant) {
      return c.json({ error: 'Forbidden - Not a participant' }, 403);
    }

    await messageService.deleteConversation(conversationId);
    
    return c.json({ message: 'Conversation deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    return c.json({ error: error.message || 'Failed to delete conversation' }, 500);
  }
});

// Admin: Initialize test data
app.post("/make-server-215f78a5/admin/initialize-data", async (c) => {
  // Declare created outside try block so it's accessible in catch
  const created = {
    users: 0,
    projects: 0,
    messages: 0,
    reviews: 0,
    milestones: 0,
    transactions: 0,
    withdrawals: 0,
  };
  
  try {
    console.log('🎲 [Admin] Initialize data API called');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.error('❌ [Admin] No access token provided');
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id || !user?.email) {
      console.error('❌ [Admin] Auth error:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('🎲 [Admin] User authenticated:', user.email);

    // Check if user is admin
    const isUserAdmin = await adminCheck.isAnyAdminAsync(user.email);
    if (!isUserAdmin) {
      console.error('❌ [Admin] User is not admin:', user.email);
      return c.json({ error: 'Admin access required' }, 403);
    }

    console.log('✅ [Admin] Admin verified, starting data initialization...');

    // 🧹 STEP 1: Clean up all existing test data first to avoid duplicates
    console.log('🧹 [Admin] Cleaning up all existing test data...');
    
    // Clean test profiles
    const testProfiles = (await kv.getByPrefix('profile_test_') || []).map(item => item.value);
    for (const profile of testProfiles) {
      await kv.del(`profile_${profile.id}`);
    }
    console.log(`🧹 Deleted ${testProfiles.length} test profiles`);
    
    // Clean test wallets
    const testWallets = (await kv.getByPrefix('wallet:test_') || []).map(item => item.value);
    for (const wallet of testWallets) {
      await kv.del(`wallet:${wallet.user_id}`);
    }
    console.log(`🧹 Deleted ${testWallets.length} test wallets`);
    
    // Clean test projects
    const testProjects = (await kv.getByPrefix('project:test_') || []).map(item => item.value);
    for (const project of testProjects) {
      await kv.del(`project:${project.id}`);
    }
    console.log(`🧹 Deleted ${testProjects.length} test projects`);
    
    // Clean test milestones
    const testMilestones = (await kv.getByPrefix('milestone:test_') || []).map(item => item.value);
    for (const milestone of testMilestones) {
      await kv.del(`milestone:${milestone.id}`);
    }
    console.log(`🧹 Deleted ${testMilestones.length} test milestones`);
    
    // Clean test transactions
    const testTransactions = (await kv.getByPrefix('transaction:test_') || []).map(item => item.value);
    for (const tx of testTransactions) {
      await kv.del(`transaction:${tx.id}`);
    }
    console.log(`🧹 Deleted ${testTransactions.length} test transactions`);
    
    // Clean test reviews
    const testReviews = (await kv.getByPrefix('review:test_') || []).map(item => item.value);
    for (const review of testReviews) {
      await kv.del(`review:${review.id}`);
    }
    console.log(`🧹 Deleted ${testReviews.length} test reviews`);
    
    // Clean test messages
    const testMessages = (await kv.getByPrefix('message:test_') || []).map(item => item.value);
    for (const msg of testMessages) {
      await kv.del(`message:${msg.id}`);
    }
    console.log(`🧹 Deleted ${testMessages.length} test messages`);
    
    console.log('✅ [Admin] Test data cleanup complete!');
    console.log('🚀 [Admin] Starting fresh data creation...');

    // 創建測試用戶（包含新舊版訂閱方案）
    const testUsers = [
      // 新版訂閱方案
      { name: '張小明', email: 'zhang@test.com', skills: ['網頁開發', '前端設計'], membership: 'free' },
      { name: '李小華', email: 'li@test.com', skills: ['平面設計', 'UI/UX'], membership: 'starter' },
      { name: '王大偉', email: 'wang@test.com', skills: ['數據分析', 'Python'], membership: 'professional' },
      { name: 'John Smith', email: 'john@test.com', skills: ['Backend', 'Node.js'], membership: 'enterprise' },
      // 舊版訂閱方案（向後兼容）
      { name: 'Sarah Chen', email: 'sarah@test.com', skills: ['Marketing', 'Content'], membership: 'basic' },
      { name: '林美麗', email: 'lin@test.com', skills: ['寫作', '編輯'], membership: 'premium' },
    ];

    const userIds: string[] = [];
    console.log('👥 [Admin] Creating test users...');
    for (const userData of testUsers) {
      try {
        const userId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        userIds.push(userId);
        
        const profile = {
          id: userId,  // Add id field to match expected structure
          user_id: userId,
          email: userData.email,
          full_name: userData.name,
          display_name: userData.name,
          bio: `Professional ${userData.skills.join(', ')} specialist`,
          skills: userData.skills,
          hourly_rate: Math.floor(Math.random() * 100) + 30,
          location: 'Taiwan',
          membership_tier: userData.membership,
          account_type: ['freelancer'], // Add account_type field
          created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
        };
        
        // Use consistent key format 'profile_userId' (統一使用下劃線格式)
        console.log(`  📝 Setting profile_${userId}`);
        await kv.set(`profile_${userId}`, profile);
      
      const wallet = {
        user_id: userId,
        available_balance: Math.floor(Math.random() * 5000),
        pending_withdrawal: 0,
        total_earned: Math.floor(Math.random() * 10000),
        total_spent: Math.floor(Math.random() * 3000),
        lifetime_earnings: Math.floor(Math.random() * 15000),
        created_at: profile.created_at,
        updated_at: new Date().toISOString(),
      };
      
      // Use consistent key format 'wallet_userId' (新格式)
        console.log(`  💰 Setting wallet_${userId}`);
        await kv.set(`wallet_${userId}`, wallet);
        
        // 🎁 為部分測試用戶添加訂閱（模擬真實購買情況）
        if (userData.membership === 'basic' || userData.membership === 'premium') {
          // 舊版方案對應到新版方案
          const planMap: Record<string, 'pro' | 'enterprise'> = {
            'basic': 'pro',
            'premium': 'enterprise'
          };
          const newPlan = planMap[userData.membership] || 'pro';
          
          const subscription = {
            user_id: userId,
            plan: newPlan,  // ✅ 使用新版方案名稱 (pro, enterprise)
            billingCycle: 'monthly',
            status: 'active',
            start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15天前開始
            end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15天後到期
            auto_renew: true,
            last_payment_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            next_billing_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          };
          
          console.log(`  🎫 Setting subscription_${userId} with plan: ${newPlan}`);
          await kv.set(`subscription_${userId}`, subscription);
        }
        
        created.users++;
        console.log(`  ✅ User created: ${userData.name}`);
      } catch (userError) {
        console.error(`  ❌ Error creating user ${userData.name}:`, userError);
        throw userError;
      }
    }
    console.log(`✅ [Admin] Created ${created.users} users`);

    // 創建測試項目
    console.log('📁 [Admin] Creating test projects...');
    const projectStatuses = ['open', 'in_progress', 'completed'];
    const projectIdsList: string[] = []; // Track all project IDs for index
    const userProjectsMap: { [userId: string]: string[] } = {}; // Track projects per user
    const projectCategories = ['development', 'design', 'data', 'content', 'marketing'];
    const skillSets = [
      ['React', 'Node.js', 'JavaScript', 'TypeScript'],
      ['UI/UX', 'Figma', 'Adobe', 'Photoshop'],
      ['Data Analysis', 'Python', 'SQL', 'Excel'],
      ['Content', 'SEO Writing', 'Copywriting', 'Editing'],
      ['Marketing', 'Digital Marketing', 'SEO', 'Social Media'],
      ['Backend', 'Node.js', 'API', 'Database'],
      ['C/C++', 'Vb.net', 'Desktop App', 'Windows'],
    ];
    
    for (let i = 0; i < 15; i++) {
      try {
        // Use timestamp + index + random string to ensure unique IDs
        const projectId = `test_proj_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 9)}`;
        projectIdsList.push(projectId); // Add to index list
        const clientId = userIds[Math.floor(Math.random() * userIds.length)];
        const freelancerId = userIds[Math.floor(Math.random() * userIds.length)];
        const status = projectStatuses[i % 3];
        const category = projectCategories[i % 5];
        const requiredSkills = skillSets[i % skillSets.length];
        
        const project = {
          id: projectId,
          user_id: clientId, // ✅ Add user_id field
          title: `測試項目 ${i + 1}: ${category}`,
          description: `測試項目描述內容 - 需要 ${requiredSkills.join(', ')} 相關技能`,
          budget_min: Math.floor(Math.random() * 30000) + 5000,
          budget_max: Math.floor(Math.random() * 50000) + 35000,
          deadline: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
          status: status,
          category: category,
          required_skills: requiredSkills,
          client_id: clientId,
          freelancer_id: status !== 'open' ? freelancerId : null,
          created_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          completed_at: status === 'completed' ? new Date().toISOString() : null,
        };
        
        // Use consistent key format 'project:projectId'
        console.log(`  📝 Setting project:${projectId} - ${project.title}`);
        try {
          await kv.set(`project:${projectId}`, project);
        } catch (kvError) {
          console.error(`  ❌ KV Error setting project ${projectId}:`, kvError);
          console.error(`  📦 Project data:`, JSON.stringify(project, null, 2));
          throw kvError; // Re-throw to be caught by outer try-catch
        }
        
        // Track this project for the client user
        if (!userProjectsMap[clientId]) {
          userProjectsMap[clientId] = [];
        }
        userProjectsMap[clientId].push(projectId);
        
        created.projects++;
        console.log(`  ✅ Project ${i + 1} created`);

      if (status !== 'open' && Math.random() > 0.5) {
        for (let m = 0; m < 3; m++) {
          const milestoneId = `test_mile_${projectId}_${m}`;
          const milestone = {
            id: milestoneId,
            project_id: projectId,
            title: `里程碑 ${m + 1}`,
            description: `里程碑描述`,
            amount: (project.budget_min + project.budget_max) / 6,
            status: Math.random() > 0.5 ? 'completed' : 'pending',
            created_at: project.created_at,
            updated_at: new Date().toISOString(),
          };
          // Use consistent key format 'milestone:milestoneId'
          await kv.set(`milestone:${milestoneId}`, milestone);
          created.milestones++;
        }
      }

        if (status === 'completed' && Math.random() > 0.3) {
          const reviewId = `test_rev_${projectId}`;
          const review = {
            id: reviewId,
            project_id: projectId,
            reviewer_id: clientId,
            reviewee_id: freelancerId,
            rating: Math.floor(Math.random() * 2) + 4,
            comment: '工作完成得很好！',
            created_at: project.completed_at,
          };
          // Use consistent key format 'review:projectId:reviewId'
          await kv.set(`review:${projectId}:${reviewId}`, review);
          created.reviews++;
        }
      } catch (projectError) {
        console.error(`  ❌ Error creating project ${i + 1}:`, projectError);
        throw projectError;
      }
    }
    console.log(`✅ [Admin] Created ${created.projects} projects`);
    
    // Create projects:all index
    console.log('📇 [Admin] Creating projects:all index with', projectIdsList.length, 'project IDs');
    await kv.set('projects:all', projectIdsList);
    console.log('✅ [Admin] Projects index created');
    
    // Create projects:user:${userId} indexes
    console.log('📇 [Admin] Creating user project indexes...');
    for (const [userId, userProjects] of Object.entries(userProjectsMap)) {
      await kv.set(`projects:user:${userId}`, userProjects);
      console.log(`  ✅ Created index for user ${userId}: ${userProjects.length} projects`);
    }
    console.log('✅ [Admin] User project indexes created');

    // 創建測試消息
    for (let i = 0; i < 30; i++) {
      const messageId = `test_msg_${Date.now()}_${i}`;
      const senderId = userIds[Math.floor(Math.random() * userIds.length)];
      const receiverId = userIds[Math.floor(Math.random() * userIds.length)];
      
      if (senderId !== receiverId) {
        const message = {
          id: messageId,
          sender_id: senderId,
          receiver_id: receiverId,
          content: `測試消息 ${i + 1}`,
          read: Math.random() > 0.5,
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
        // Use consistent key format 'message:messageId'
        await kv.set(`message:${messageId}`, message);
        created.messages++;
      }
    }

    // 創建測試交易
    for (let i = 0; i < 20; i++) {
      const transactionId = `test_tx_${Date.now()}_${i}`;
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      
      const transaction = {
        id: transactionId,
        user_id: userId,
        type: ['deposit', 'withdrawal', 'payment', 'earning'][Math.floor(Math.random() * 4)],
        amount: Math.floor(Math.random() * 5000) + 100,
        status: 'completed',
        description: `測試交易 ${i + 1}`,
        created_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      };
      // Use consistent key format 'transaction:transactionId'
      await kv.set(`transaction:${transactionId}`, transaction);
      created.transactions++;
    }

    // 創建測試提現申請
    const withdrawalStatuses = ['pending', 'approved', 'rejected'];
    
    // 🧹 First, delete all existing test withdrawals to avoid duplicates
    console.log('🧹 [Admin] Cleaning up existing test withdrawals...');
    const existingWithdrawals = (await kv.getByPrefix('withdrawal:test_withdrawal_') || []).map(item => item.value);
    for (const withdrawal of existingWithdrawals) {
      await kv.del(`withdrawal:${withdrawal.id}`);
    }
    console.log(`🧹 [Admin] Deleted ${existingWithdrawals.length} existing test withdrawals`);
    
    // Create exactly 12 withdrawals: 4 pending, 4 approved, 4 rejected
    for (let i = 0; i < 12; i++) {
      const withdrawalId = `test_withdrawal_${Date.now()}_${i}`;
      const userIndex = i % testUsers.length; // Use modulo to cycle through users
      const userId = userIds[userIndex];
      const status = withdrawalStatuses[i % 3];
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
      const amount = Math.floor(Math.random() * 3000) + 500;
      const fee = Math.round(amount * 0.025); // 2.5% fee
      const net_amount = amount - fee;
      
      const withdrawal = {
        id: withdrawalId,
        user_id: userId,
        amount: amount,
        fee: fee,
        net_amount: net_amount,
        status: status,
        bank_info: {
          bank_name: ['台灣銀行', '玉���銀行', '中國信託', '國泰世華'][Math.floor(Math.random() * 4)],
          account_number: `****${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          account_holder_name: `測試用戶 ${i + 1}`,
        },
        method_id: `test_method_${userId}`,
        user_email: testUsers[userIndex].email,
        requested_at: createdAt,
        processed_at: status !== 'pending' ? new Date(new Date(createdAt).getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString() : null,
        rejection_reason: status === 'rejected' ? '銀行資訊不符' : null,
        admin_note: status === 'rejected' ? '銀行資訊不符' : null,
        created_at: createdAt,
        updated_at: new Date().toISOString(),
      };
      
      await kv.set(`withdrawal:${withdrawalId}`, withdrawal);
      
      // Add to user's withdrawal list
      const userWithdrawals: string[] = (await kv.get(`withdrawals:user:${userId}`)) || [];
      userWithdrawals.push(withdrawalId);
      await kv.set(`withdrawals:user:${userId}`, userWithdrawals);
      
      created.withdrawals++;
    }

    console.log('✅ [Admin] Test data initialization complete!');
    console.log('📊 [Admin] Summary:', created);

    // Verify data was saved
    const verification = (await kv.getByPrefix('project:')).map(item => item.value);
    console.log(`🔍 [Admin] Verification: Found ${verification.length} projects in database`);

    return c.json({ 
      success: true,
      message: 'Test data initialized successfully',
      created: created,
      verified: {
        projects_in_db: verification.length
      }
    });
  } catch (error: any) {
    console.error('❌ [Admin] Error initializing data:', error);
    console.error('❌ [Admin] Error stack:', error.stack);
    return c.json({ 
      error: error.message || 'Failed to initialize data',
      details: error.stack,
      created_so_far: created
    }, 500);
  }
});

// Admin: Debug - Check all keys
app.get("/make-server-215f78a5/admin/debug-keys", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) return c.json({ error: 'Unauthorized' }, 401);

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) return c.json({ error: 'Unauthorized' }, 401);

    const { data: allKeys, error } = await supabase.from('kv_store_215f78a5').select('key').limit(100);
    if (error) return c.json({ error: error.message }, 500);

    const keys = allKeys?.map(k => k.key) || [];
    
    return c.json({ 
      total: keys.length,
      summary: {
        profile_colon: keys.filter(k => k.startsWith('profile:')).length,
        profile_underscore: keys.filter(k => k.startsWith('profile_')).length,
        project_colon: keys.filter(k => k.startsWith('project:')).length,
        project_underscore: keys.filter(k => k.startsWith('project_')).length,
        wallet_colon: keys.filter(k => k.startsWith('wallet:')).length,
        wallet_underscore: keys.filter(k => k.startsWith('wallet_')).length,
      },
      keys: keys.slice(0, 20)
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Admin: Debug - Get single key value
app.get("/make-server-215f78a5/admin/debug-key", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) return c.json({ error: 'Unauthorized' }, 401);

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) return c.json({ error: 'Unauthorized' }, 401);

    const key = c.req.query('key');
    if (!key) return c.json({ error: 'Key parameter required' }, 400);

    const value = await kv.get(key);
    if (!value) return c.json({ error: 'Key not found' }, 404);

    return c.json(value);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ==================== 🔐 管理員管理 API / Admin Management APIs ====================

// Check admin status (public endpoint)
app.post("/make-server-215f78a5/admin/check-status", async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    const isAdmin = await adminService.isAnyAdmin(email);
    const level = await adminService.getAdminLevel(email);
    const isRoot = adminService.isRootAdmin(email);
    const admin = await adminService.getAdminByEmail(email);

    return c.json({
      isAdmin,
      level,
      isRoot,
      admin,
    });
  } catch (error: any) {
    console.error('❌ [Admin] Error checking admin status:', error);
    return c.json({ error: error.message || 'Failed to check admin status' }, 500);
  }
});

// List all admins (requires super admin)
app.get("/make-server-215f78a5/admin/list-all", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const devToken = c.req.header('X-Dev-Token');
    
    console.log('🎯 [List All Admins] Authorization header:', authHeader ? `Bearer ${authHeader.substring(7, 30)}...` : 'MISSING');
    console.log('🎯 [List All Admins] X-Dev-Token header:', devToken ? devToken.substring(0, 30) + '...' : 'MISSING');
    
    // 🧪 DEV MODE: Use dev token if provided
    let accessToken = authHeader?.split(' ')[1];
    if (devToken && devToken.startsWith('dev-user-')) {
      console.log('🧪 [List All Admins] Dev mode detected, using dev token');
      accessToken = devToken;
    }
    
    if (!accessToken) return c.json({ error: 'Unauthorized' }, 401);

    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user?.email) {
      console.log('❌ [List All Admins] Auth error:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is super admin
    const isSuperAdmin = await adminService.isSuperAdmin(user.email);
    if (!isSuperAdmin) {
      return c.json({ error: 'Forbidden: Super admin access required' }, 403);
    }

    const allAdmins = await adminService.getAllAdmins();
    const stats = await adminService.getAdminStats();

    return c.json({
      admins: allAdmins,
      stats,
    });
  } catch (error: any) {
    console.error('❌ [Admin] Error listing admins:', error);
    return c.json({ error: error.message || 'Failed to list admins' }, 500);
  }
});

// Add admin (requires super admin)
app.post("/make-server-215f78a5/admin/add", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const devToken = c.req.header('X-Dev-Token');
    
    // 🧪 DEV MODE: Use dev token if provided
    let accessToken = authHeader?.split(' ')[1];
    if (devToken && devToken.startsWith('dev-user-')) {
      accessToken = devToken;
    }
    
    if (!accessToken) return c.json({ error: 'Unauthorized' }, 401);

    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user?.email) return c.json({ error: 'Unauthorized' }, 401);

    // Check if user is super admin
    const isSuperAdmin = await adminService.isSuperAdmin(user.email);
    if (!isSuperAdmin) {
      return c.json({ error: 'Forbidden: Super admin access required' }, 403);
    }

    const { email, level, name, permissions } = await c.req.json();

    if (!email || !level || !name) {
      return c.json({ error: 'Email, level, and name are required' }, 400);
    }

    const result = await adminService.addAdmin(
      { email, level, name, permissions },
      user.email
    );

    if (!result.success) {
      return c.json({ error: result.message }, 400);
    }

    return c.json({
      success: true,
      message: result.message,
      admin: result.admin,
    });
  } catch (error: any) {
    console.error('❌ [Admin] Error adding admin:', error);
    return c.json({ error: error.message || 'Failed to add admin' }, 500);
  }
});

// Remove admin (requires super admin)
app.post("/make-server-215f78a5/admin/remove", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const devToken = c.req.header('X-Dev-Token');
    
    // 🧪 DEV MODE: Use dev token if provided
    let accessToken = authHeader?.split(' ')[1];
    if (devToken && devToken.startsWith('dev-user-')) {
      accessToken = devToken;
    }
    
    if (!accessToken) return c.json({ error: 'Unauthorized' }, 401);

    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user?.email) return c.json({ error: 'Unauthorized' }, 401);

    // Check if user is super admin
    const isSuperAdmin = await adminService.isSuperAdmin(user.email);
    if (!isSuperAdmin) {
      return c.json({ error: 'Forbidden: Super admin access required' }, 403);
    }

    const { email, reason } = await c.req.json();

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    const result = await adminService.removeAdmin(email, user.email, reason);

    if (!result.success) {
      return c.json({ error: result.message }, 400);
    }

    return c.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('❌ [Admin] Error removing admin:', error);
    return c.json({ error: error.message || 'Failed to remove admin' }, 500);
  }
});

// Update admin (requires super admin)
app.post("/make-server-215f78a5/admin/update", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const devToken = c.req.header('X-Dev-Token');
    
    // 🧪 DEV MODE: Use dev token if provided
    let accessToken = authHeader?.split(' ')[1];
    if (devToken && devToken.startsWith('dev-user-')) {
      accessToken = devToken;
    }
    
    if (!accessToken) return c.json({ error: 'Unauthorized' }, 401);

    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user?.email) return c.json({ error: 'Unauthorized' }, 401);

    // Check if user is super admin
    const isSuperAdmin = await adminService.isSuperAdmin(user.email);
    if (!isSuperAdmin) {
      return c.json({ error: 'Forbidden: Super admin access required' }, 403);
    }

    const { email, updates } = await c.req.json();

    if (!email || !updates) {
      return c.json({ error: 'Email and updates are required' }, 400);
    }

    const result = await adminService.updateAdmin(email, updates, user.email);

    if (!result.success) {
      return c.json({ error: result.message }, 400);
    }

    return c.json({
      success: true,
      message: result.message,
      admin: result.admin,
    });
  } catch (error: any) {
    console.error('❌ [Admin] Error updating admin:', error);
    return c.json({ error: error.message || 'Failed to update admin' }, 500);
  }
});

// Promote admin to super admin (requires super admin)
app.post("/make-server-215f78a5/admin/promote", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const devToken = c.req.header('X-Dev-Token');
    
    // 🧪 DEV MODE: Use dev token if provided
    let accessToken = authHeader?.split(' ')[1];
    if (devToken && devToken.startsWith('dev-user-')) {
      accessToken = devToken;
    }
    
    if (!accessToken) return c.json({ error: 'Unauthorized' }, 401);

    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user?.email) return c.json({ error: 'Unauthorized' }, 401);

    // Check if user is super admin
    const isSuperAdmin = await adminService.isSuperAdmin(user.email);
    if (!isSuperAdmin) {
      return c.json({ error: 'Forbidden: Super admin access required' }, 403);
    }

    const { email, level, permissions } = await c.req.json();

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    console.log(`🔼 [Admin] Promoting admin: ${email} to ${level || 'SUPER_ADMIN'} by ${user.email}`);

    // Use updateAdmin to change level
    const result = await adminService.updateAdmin(
      email, 
      { 
        level: level || adminService.AdminLevel.SUPER_ADMIN,
        permissions: permissions || ['*']
      }, 
      user.email
    );

    if (!result.success) {
      return c.json({ error: result.message }, 400);
    }

    console.log(`✅ [Admin] Successfully promoted: ${email}`);

    return c.json({
      success: true,
      message: result.message,
      admin: result.admin,
    });
  } catch (error: any) {
    console.error('❌ [Admin] Error promoting admin:', error);
    return c.json({ error: error.message || 'Failed to promote admin' }, 500);
  }
});

// Get change logs (requires super admin)
app.get("/make-server-215f78a5/admin/change-logs", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const devToken = c.req.header('X-Dev-Token');
    
    console.log('🎯 [Get Change Logs] Authorization header:', authHeader ? `Bearer ${authHeader.substring(7, 30)}...` : 'MISSING');
    console.log('🎯 [Get Change Logs] X-Dev-Token header:', devToken ? devToken.substring(0, 30) + '...' : 'MISSING');
    
    // 🧪 DEV MODE: Use dev token if provided
    let accessToken = authHeader?.split(' ')[1];
    if (devToken && devToken.startsWith('dev-user-')) {
      console.log('🧪 [Get Change Logs] Dev mode detected, using dev token');
      accessToken = devToken;
    }
    
    if (!accessToken) return c.json({ error: 'Unauthorized' }, 401);

    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user?.email) {
      console.log('❌ [Get Change Logs] Auth error:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is super admin
    const isSuperAdmin = await adminService.isSuperAdmin(user.email);
    if (!isSuperAdmin) {
      return c.json({ error: 'Forbidden: Super admin access required' }, 403);
    }

    const limit = parseInt(c.req.query('limit') || '100');
    const logs = await adminService.getChangeLogs(limit);

    return c.json({
      logs,
      total: logs.length,
    });
  } catch (error: any) {
    console.error('❌ [Admin] Error getting change logs:', error);
    return c.json({ error: error.message || 'Failed to get change logs' }, 500);
  }
});

// Get admin statistics (requires super admin)
app.get("/make-server-215f78a5/admin/stats-duplicate", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) return c.json({ error: 'Unauthorized' }, 401);

    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user?.email) return c.json({ error: 'Unauthorized' }, 401);

    // Check if user is super admin
    const isSuperAdmin = await adminService.isSuperAdmin(user.email);
    if (!isSuperAdmin) {
      return c.json({ error: 'Forbidden: Super admin access required' }, 403);
    }

    const stats = await adminService.getAdminStats();

    return c.json(stats);
  } catch (error: any) {
    console.error('❌ [Admin] Error getting admin stats:', error);
    return c.json({ error: error.message || 'Failed to get admin stats' }, 500);
  }
});

// =====================================================
// 🌟 ENTERPRISE LOGO APIs
// =====================================================

// 🎨 獲取企業 LOGO
app.get("/make-server-215f78a5/enterprise/logo", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const logoUrl = await enterpriseLogoService.getUserEnterpriseLogo(user.id);
    const info = await enterpriseLogoService.getUserEnterpriseInfo(user.id);
    
    return c.json({
      success: true,
      logoUrl: logoUrl || null,
      info: info || null,
    });
  } catch (error: any) {
    console.error('❌ [Enterprise Logo] Error getting logo:', error);
    return c.json({ error: error.message || 'Failed to get logo' }, 500);
  }
});

// 💾 設置企業 LOGO
app.post("/make-server-215f78a5/enterprise/logo", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { logoUrl, companyName } = body;
    
    if (!logoUrl) {
      return c.json({ error: 'logoUrl is required' }, 400);
    }
    
    // 檢查用戶訂閱等級
    const subscriptionKey = `subscription:${user.id}`;
    const subscription = await kv.get(subscriptionKey) as any;
    const subscriptionTier = subscription?.plan || 'free';
    
    // 驗證權限
    if (!enterpriseLogoService.canSetEnterpriseLogo(subscriptionTier)) {
      return c.json({ 
        error: 'Enterprise subscription required',
        message: 'Only Enterprise tier users can set custom email logos',
        currentTier: subscriptionTier,
      }, 403);
    }
    
    // 設置 LOGO
    await enterpriseLogoService.setUserEnterpriseLogo(user.id, logoUrl, companyName);
    
    return c.json({
      success: true,
      message: 'Enterprise logo set successfully',
      logoUrl,
      companyName: companyName || 'Enterprise Client',
    });
  } catch (error: any) {
    console.error('❌ [Enterprise Logo] Error setting logo:', error);
    return c.json({ error: error.message || 'Failed to set logo' }, 500);
  }
});

// 🗑️ 刪除企業 LOGO
app.delete("/make-server-215f78a5/enterprise/logo", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    await enterpriseLogoService.deleteUserEnterpriseLogo(user.id);
    
    return c.json({
      success: true,
      message: 'Enterprise logo deleted successfully',
    });
  } catch (error: any) {
    console.error('❌ [Enterprise Logo] Error deleting logo:', error);
    return c.json({ error: error.message || 'Failed to delete logo' }, 500);
  }
});

// 🔍 公開：獲取指定用戶的企業 LOGO（用於顯示在案件卡片中）
app.get("/make-server-215f78a5/public/enterprise-logo/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    
    if (!userId) {
      return c.json({ error: 'User ID required' }, 400);
    }
    
    // 獲取用戶的企業 LOGO
    const logoUrl = await enterpriseLogoService.getUserEnterpriseLogo(userId);
    
    if (!logoUrl) {
      return c.json({ 
        success: true, 
        hasLogo: false,
        logoUrl: null 
      });
    }
    
    return c.json({
      success: true,
      hasLogo: true,
      logoUrl,
    });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to get logo' }, 500);
  }
});

// 🔍 公開：獲取指定用戶的企業名稱（用於顯示在案件卡片中）
app.get("/make-server-215f78a5/public/enterprise-name/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    
    if (!userId) {
      return c.json({ error: 'User ID required' }, 400);
    }
    
    // 從 KV store 獲取企業資訊（優先從 enterprise_logo 獲取，因為這是最新的數據源）
    let enterpriseInfo = await kv.get(`enterprise_logo_${userId}`);
    
    // 如果沒有找到，嘗試從舊的 enterprise_info 獲取（向後兼容）
    if (!enterpriseInfo) {
      enterpriseInfo = await kv.get(`enterprise_info_${userId}`);
    }
    
    const companyName = enterpriseInfo?.companyName || enterpriseInfo?.name;
    
    if (!companyName) {
      return c.json({ 
        success: true, 
        hasName: false,
        name: null 
      });
    }
    
    return c.json({
      success: true,
      hasName: true,
      name: companyName,
    });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to get name' }, 500);
  }
});

// 📊 管理員：查看所有企業 LOGO（管理員專用）
app.get("/make-server-215f78a5/admin/enterprise-logos", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // 驗證管理員權限
    const profile = await kv.get(`profile:${user.id}`) as any;
    const isAdmin = await adminCheck.getAdminLevelAsync(user.email);
    
    if (!isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const logos = await enterpriseLogoService.getAllEnterpriseLogos();
    const stats = await enterpriseLogoService.getEnterpriseLogoStats();
    
    return c.json({
      success: true,
      logos,
      stats,
    });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to get logos' }, 500);
  }
});

// 📧 測試智能郵件發送
app.post("/make-server-215f78a5/test-smart-email", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { type = 'welcome', language = 'zh' } = body;
    
    // 獲取用戶資訊
    const profile = await kv.get(`profile:${user.id}`) as any;
    const subscription = await kv.get(`subscription:${user.id}`) as any;
    
    const userInfo = {
      userId: user.id,
      email: user.email!,
      name: profile?.name || user.email!.split('@')[0],
      subscriptionTier: subscription?.plan || 'free',
      preferredLanguage: language as 'en' | 'zh',
    };
    
    console.log('📧 [Test Smart Email] Sending:', { type, userInfo });
    
    let result;
    switch (type) {
      case 'welcome':
        result = await smartEmailSender.sendWelcomeEmail(userInfo);
        break;
      
      case 'password-reset':
        result = await smartEmailSender.sendPasswordResetEmail(
          userInfo,
          'https://casewhr.com/reset-password?token=test123'
        );
        break;
      
      case 'monthly-report':
        result = await smartEmailSender.sendMonthlyReportEmail(userInfo, {
          month: '2024年12月',
          stats: {
            totalProjects: 10,
            completedProjects: 7,
            totalEarnings: 15000,
            currency: 'TWD',
          },
        });
        break;
      
      default:
        return c.json({ error: 'Invalid email type' }, 400);
    }
    
    return c.json({
      success: true,
      message: 'Smart email sent successfully',
      result,
      userInfo: {
        tier: userInfo.subscriptionTier,
        hasCustomLogo: subscription?.plan === 'enterprise' && subscription?.status === 'active',
      },
    });
  } catch (error: any) {
    console.error('❌ [Test Smart Email] Error:', error);
    return c.json({ error: error.message || 'Failed to send email' }, 500);
  }
});

// Enterprise Logo APIs, Smart Email Sender, and Admin management APIs registered

// ==========================================
// 🤖 AI SEO Routes
// ==========================================

// AI SEO 健康检查
app.get("/make-server-215f78a5/ai-seo/health", async (c) => {
  try {
    console.log('🏥 [AI SEO] Health check requested');
    const result = await aiSeoService.healthCheck();
    
    return c.json(result);
  } catch (error: any) {
    console.error('❌ [AI SEO] Health check failed:', error);
    return c.json({
      status: 'error',
      apiKeyConfigured: false,
      message: error.message || 'Health check failed',
    }, 500);
  }
});

// 生成 SEO 元数据
app.post("/make-server-215f78a5/ai-seo/generate", async (c) => {
  try {
    // 可选认证 - 如果提供了 token 则验证，否则允许匿名访问（用于测试）
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    let userId = 'anonymous';
    
    if (accessToken) {
      const { user, error: authError } = await getUserFromToken(accessToken);
      if (user?.id) {
        userId = user.id;
        console.log(`🤖 [AI SEO] Authenticated user: ${userId}`);
      } else {
        console.log(`⚠️ [AI SEO] Invalid token, proceeding as anonymous`);
      }
    }

    const body = await c.req.json();
    
    // 🆕 支持 URL 自動生成模式
    if (body.url && body.autoAnalyze) {
      console.log(`🤖 [AI SEO] URL Auto-generate mode for: ${body.url}${body.customKeywords ? ` (Custom Keywords: ${body.customKeywords})` : ''}`);
      
      const pageContexts: Record<string, string> = {
        '/': 'Casewhere 是一個全球接案平台，連接客戶與專業自由工作者。首頁應該突出平台的核心價值、服務範圍和用戶優勢。',
        '/about': '關於我們頁面���紹 Casewhere 平台的使命、願景、團隊和發展歷程。',
        '/services': '服務列表展示平台上可用的各種專業服務類別，包括設計、開發、營銷等。',
        '/pricing': '定價方案頁面說明平台的收費結構、服務費率和價值主張。',
        '/how-it-works': '運作方式頁面解釋如何使用平台發布項目、尋找專家和完成交易。',
        '/for-clients': '客戶專區介紹如何作為客戶在平台上發布項目、選擇專家和管理項目。',
        '/for-freelancers': '接案者專區說明自由工作者如何加入平台、接案和賺取收入。',
        '/contact': '聯絡我們頁面提供與 Casewhere 團隊溝通的方式和管道。',
        '/blog': '部落格頁面分享行業洞察、平台更新和專業知識文章。',
        '/faq': '常見問題頁面回答用戶關於平台使用、付款、安全等常見疑問。',
      };
      
      const pageContext = pageContexts[body.url] || `這是 Casewhere 平台的 ${body.url} 頁面。`;
      
      // 新增：支持自定義關鍵字
      const customKeywordsHint = body.customKeywords 
        ? `\n\n🎯 用戶指定的重點關鍵字: ${body.customKeywords}\n請務必在生成的 SEO 內容中優先使用這些關鍵字。` 
        : '';
      
      const prompt = `請為 Casewhere 接案平台的以下頁面生成 SEO 優化內容：

URL: ${body.url}
頁面上下文: ${pageContext}${customKeywordsHint}

請生成：
1. SEO 標題（title）：50-60 字符，包含核心關鍵詞，吸引點擊
2. SEO 描述（description）：150-160 字符，簡潔有力，包含行動呼籲
3. 關鍵詞列表（keywords）：5-8 個相關關鍵詞，用逗號分隔${body.customKeywords ? '（優先使用用戶指定的關鍵字）' : ''}

請以以下 JSON 格式回應：
{
  "title": "...",
  "description": "...",
  "keywords": "關鍵詞1, 關鍵詞2, 關鍵詞3, ..."
}`;

      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiApiKey) {
        return c.json({ error: 'OpenAI API key not configured' }, 500);
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: '你是一位專業的 SEO 專家，專精於為網站頁面生成高質量的 SEO 元數據。請以 JSON 格式回應。' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [AI SEO] OpenAI error:', errorText);
        throw new Error('OpenAI API request failed');
      }

      const aiResponse = await response.json();
      const generatedText = aiResponse.choices[0].message.content;
      
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      let seoData = {
        title: 'Casewhere - 全球專業接案平台',
        description: '連接全球客戶與專業自由工作者，提供高質量的設計、開發、營銷等專業服務。',
        keywords: '接案平台, 自由工作者, 專業服務, 外包, 遠程工作',
      };
      
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          seoData = {
            title: parsed.title || seoData.title,
            description: parsed.description || seoData.description,
            keywords: parsed.keywords || seoData.keywords,
          };
        } catch (e) {
          console.error('❌ [AI SEO] JSON parse error:', e);
        }
      }
      
      // 🆕 使用時間戳創建唯一報告 ID，不覆蓋舊報告
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const kvKey = `ai_seo_report:${reportId}`;
      
      const reportData = {
        id: reportId,
        url: body.url,
        ...seoData,
        customKeywords: body.customKeywords || null,
        generatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await kv.set(kvKey, JSON.stringify(reportData));
      
      console.log(`✅ [AI SEO] New report created: ${reportId} for ${body.url}`);
      
      return c.json({
        success: true,
        ...reportData,
      });
    }
    
    // 傳統模式
    const { title, description, category, tags, language, targetAudience, projectType } = body;

    if (!title || !description) {
      return c.json({ error: 'Title and description are required (or use url + autoAnalyze mode)' }, 400);
    }

    console.log(`🤖 [AI SEO] Generating SEO for user ${userId}, language: ${language || 'zh-TW'}`);

    const result = await aiSeoService.generateSEO({
      title,
      description,
      category,
      tags,
      language: language || 'zh-TW',
      targetAudience,
      projectType,
    });

    console.log(`✅ [AI SEO] SEO generated successfully - Score: ${result.score}`);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ [AI SEO Generate] Error:', error);
    return c.json({
      error: 'Failed to generate SEO',
      message: error.message || 'Unknown error',
    }, 500);
  }
});

// 🆕 獲取所有 AI SEO 報告列表
app.get("/make-server-215f78a5/ai-seo/reports", async (c) => {
  try {
    console.log('📋 [AI SEO] Fetching all reports...');
    
    // 使用 getByPrefix 獲取所有報告
    const allReports = (await kv.getByPrefix('ai_seo_report:')).map(item => item.value);
    
    console.log(`📊 [AI SEO] Raw reports count: ${allReports?.length || 0}`);
    
    // 解析並排序報告（最新的在前）
    const reports = allReports
      .map((item, index) => {
        try {
          // item is already the JSON string value, need to parse it
          const report = typeof item === 'string' ? JSON.parse(item) : item;
          console.log(`✅ [AI SEO] Loaded report ${index + 1}:`, report?.id);
          return report;
        } catch (e) {
          console.error(`❌ [AI SEO] Failed to load report ${index + 1}:`, e);
          return null;
        }
      })
      .filter(report => report !== null)
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
    
    console.log(`✅ [AI SEO] Found ${reports.length} valid reports`);
    
    return c.json({
      success: true,
      reports,
      total: reports.length,
    });
  } catch (error: any) {
    console.error('❌ [AI SEO Reports] Error:', error);
    return c.json({
      error: 'Failed to fetch reports',
      message: error.message || 'Unknown error',
    }, 500);
  }
});

// 🆕 刪除單個 AI SEO 報告
app.delete("/make-server-215f78a5/ai-seo/reports/:reportId", async (c) => {
  try {
    const reportId = c.req.param('reportId');
    console.log(`🗑️ [AI SEO] Deleting report: ${reportId}`);
    
    const kvKey = `ai_seo_report:${reportId}`;
    await kv.del(kvKey);
    
    console.log(`✅ [AI SEO] Report deleted: ${reportId}`);
    
    return c.json({
      success: true,
      message: 'Report deleted successfully',
      reportId,
    });
  } catch (error: any) {
    console.error('❌ [AI SEO Delete] Error:', error);
    return c.json({
      error: 'Failed to delete report',
      message: error.message || 'Unknown error',
    }, 500);
  }
});

// 关键词研究
app.post("/make-server-215f78a5/ai-seo/keywords", async (c) => {
  try {
    // 可选认证 - 如果提供了 token 则验证，否则允许匿名访问（用于测试）
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    let userId = 'anonymous';
    
    if (accessToken) {
      const { user, error: authError } = await getUserFromToken(accessToken);
      if (user?.id) {
        userId = user.id;
        console.log(`🔍 [AI SEO] Authenticated user: ${userId}`);
      } else {
        console.log(`⚠️ [AI SEO] Invalid token, proceeding as anonymous`);
      }
    }

    const body = await c.req.json();
    const { topic, industry, language, count } = body;

    if (!topic) {
      return c.json({ error: 'Topic is required' }, 400);
    }

    console.log(`🔍 [AI SEO] Researching keywords for user ${userId}, topic: ${topic}`);

    const result = await aiSeoService.researchKeywords({
      topic,
      industry,
      language: language || 'zh-TW',
      count: count || 10,
    });

    console.log(`✅ [AI SEO] Keyword research completed - Found ${result.keywords.length} keywords`);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ [AI SEO Keywords] Error:', error);
    return c.json({
      error: 'Failed to research keywords',
      message: error.message || 'Unknown error',
    }, 500);
  }
});

console.log('✅ [SERVER] AI SEO APIs registered');

// ==========================================
// 🚀 Advanced AI Content Generator APIs
// ==========================================

// 🆕 生成完整文章內容（AI SEO 平台核心功能）
app.post("/make-server-215f78a5/ai-content/generate-full", async (c) => {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    const generator = new (await import('./ai-content-generator.tsx')).AIContentGenerator(openaiApiKey);
    const body = await c.req.json();

    console.log(`🤖 [AI Content] Generating full content for: ${body.url}`);

    const content = await generator.generateFullContent({
      url: body.url,
      title: body.title,
      description: body.description,
      keywords: body.keywords,
      language: body.language || 'zh-TW',
      contentType: body.contentType || 'article',
      targetAudience: body.targetAudience,
      tone: body.tone || 'professional',
      wordCount: body.wordCount || 1200,
    });

    // 保存生成的內容到 KV Store
    const reportId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const kvKey = `ai_content:${reportId}`;
    
    const reportData = {
      id: reportId,
      ...content,
      generatedAt: new Date().toISOString(),
      url: body.url,
    };
    
    await kv.set(kvKey, JSON.stringify(reportData));

    console.log(`✅ [AI Content] Full content generated: ${reportId}`);

    return c.json({
      success: true,
      reportId,
      ...content,
    });
  } catch (error: any) {
    console.error('❌ [AI Content Full] Error:', error);
    return c.json({
      error: 'Failed to generate content',
      message: error.message || 'Unknown error',
    }, 500);
  }
});

// 🆕 生成 FAQ（專門針對 AI 搜尋引擎優化）
app.post("/make-server-215f78a5/ai-content/generate-faq", async (c) => {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    const generator = new (await import('./ai-content-generator.tsx')).AIContentGenerator(openaiApiKey);
    const body = await c.req.json();

    console.log(`❓ [AI Content] Generating FAQ for: ${body.topic}`);

    const faq = await generator.generateFAQ({
      topic: body.topic,
      keywords: body.keywords || [],
      language: body.language || 'zh-TW',
      count: body.count || 8,
    });

    return c.json({
      success: true,
      faq,
      count: faq.length,
    });
  } catch (error: any) {
    console.error('❌ [AI Content FAQ] Error:', error);
    return c.json({
      error: 'Failed to generate FAQ',
      message: error.message || 'Unknown error',
    }, 500);
  }
});

// 🆕 關鍵字研究（進階版）
app.post("/make-server-215f78a5/ai-content/research-keywords", async (c) => {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    const generator = new (await import('./ai-content-generator.tsx')).AIContentGenerator(openaiApiKey);
    const body = await c.req.json();

    console.log(`🔍 [AI Content] Researching keywords for: ${body.topic}`);

    const keywords = await generator.researchKeywords({
      topic: body.topic,
      industry: body.industry || 'freelancing',
      language: body.language || 'zh-TW',
      competitors: body.competitors || [],
    });

    return c.json({
      success: true,
      ...keywords,
    });
  } catch (error: any) {
    console.error('❌ [AI Content Keywords] Error:', error);
    return c.json({
      error: 'Failed to research keywords',
      message: error.message || 'Unknown error',
    }, 500);
  }
});

// 🆕 競爭對手分析
app.post("/make-server-215f78a5/ai-content/analyze-competitors", async (c) => {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    const generator = new (await import('./ai-content-generator.tsx')).AIContentGenerator(openaiApiKey);
    const body = await c.req.json();

    console.log(`🎯 [AI Content] Analyzing competitors: ${body.competitors?.join(', ')}`);

    const analysis = await generator.analyzeCompetitors({
      competitors: body.competitors || [],
      topic: body.topic || 'freelancing platform',
      language: body.language || 'zh-TW',
    });

    return c.json({
      success: true,
      ...analysis,
    });
  } catch (error: any) {
    console.error('❌ [AI Content Competitors] Error:', error);
    return c.json({
      error: 'Failed to analyze competitors',
      message: error.message || 'Unknown error',
    }, 500);
  }
});

// 🆕 SEO 評分和改進建議
app.post("/make-server-215f78a5/ai-content/score-seo", async (c) => {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    const generator = new (await import('./ai-content-generator.tsx')).AIContentGenerator(openaiApiKey);
    const body = await c.req.json();

    console.log(`📊 [AI Content] Scoring SEO for: ${body.url}`);

    const score = await generator.scoreSEO({
      url: body.url,
      title: body.title,
      description: body.description,
      content: body.content,
      keywords: body.keywords || [],
      headings: body.headings || { h2: [], h3: [] },
      language: body.language || 'zh-TW',
    });

    return c.json({
      success: true,
      ...score,
    });
  } catch (error: any) {
    console.error('❌ [AI Content Score] Error:', error);
    return c.json({
      error: 'Failed to score SEO',
      message: error.message || 'Unknown error',
    }, 500);
  }
});

// 🆕 內部連結建議
app.post("/make-server-215f78a5/ai-content/suggest-internal-links", async (c) => {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    const generator = new (await import('./ai-content-generator.tsx')).AIContentGenerator(openaiApiKey);
    const body = await c.req.json();

    console.log(`🔗 [AI Content] Suggesting internal links for: ${body.currentPage}`);

    const links = await generator.suggestInternalLinks({
      currentPage: body.currentPage,
      content: body.content,
      allPages: body.allPages || [],
      language: body.language || 'zh-TW',
    });

    return c.json({
      success: true,
      links,
      count: links.length,
    });
  } catch (error: any) {
    console.error('❌ [AI Content Links] Error:', error);
    return c.json({
      error: 'Failed to suggest internal links',
      message: error.message || 'Unknown error',
    }, 500);
  }
});

// 🆕 獲取所有生成的內容
app.get("/make-server-215f78a5/ai-content/list", async (c) => {
  try {
    console.log('📋 [AI Content] Fetching all generated content...');
    
    const allContent = (await kv.getByPrefix('ai_content:')).map(item => item.value);
    
    const contents = allContent
      .map((item: string) => {
        try {
          return JSON.parse(item);
        } catch (e) {
          return null;
        }
      })
      .filter((item: any) => item !== null)
      .sort((a: any, b: any) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
    
    console.log(`✅ [AI Content] Found ${contents.length} content items`);
    
    return c.json({
      success: true,
      contents,
      total: contents.length,
    });
  } catch (error: any) {
    console.error('❌ [AI Content List] Error:', error);
    return c.json({
      error: 'Failed to fetch content',
      message: error.message || 'Unknown error',
    }, 500);
  }
});

// 🆕 獲取單個生成的內容
app.get("/make-server-215f78a5/ai-content/:contentId", async (c) => {
  try {
    const contentId = c.req.param('contentId');
    console.log(`📄 [AI Content] Fetching content: ${contentId}`);
    
    const kvKey = `ai_content:${contentId}`;
    const content = await kv.get(kvKey);
    
    if (!content) {
      return c.json({ error: 'Content not found' }, 404);
    }
    
    const parsed = typeof content === 'string' ? JSON.parse(content) : content;
    
    return c.json({
      success: true,
      ...parsed,
    });
  } catch (error: any) {
    console.error('❌ [AI Content Get] Error:', error);
    return c.json({
      error: 'Failed to fetch content',
      message: error.message || 'Unknown error',
    }, 500);
  }
});

// 🆕 刪除生成的內容
app.delete("/make-server-215f78a5/ai-content/:contentId", async (c) => {
  try {
    const contentId = c.req.param('contentId');
    console.log(`🗑️ [AI Content] Deleting content: ${contentId}`);
    
    const kvKey = `ai_content:${contentId}`;
    await kv.del(kvKey);
    
    console.log(`✅ [AI Content] Content deleted: ${contentId}`);
    
    return c.json({
      success: true,
      message: 'Content deleted successfully',
    });
  } catch (error: any) {
    console.error('❌ [AI Content Delete] Error:', error);
    return c.json({
      error: 'Failed to delete content',
      message: error.message || 'Unknown error',
    }, 500);
  }
});

console.log('✅ [SERVER] Advanced AI Content Generator APIs registered');

// Check if user is a team member (for enterprise chat access)
app.get("/make-server-215f78a5/check-team-member", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ isTeamMember: false }, 200);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ isTeamMember: false }, 200);
    }

    console.log('🔍 [Check Team Member] Checking membership for user:', user.email);

    // Check if user is a team member
    const allTeamMembers = (await kv.getByPrefix('team_member:') || []).map(item => item.value);
    console.log('🔍 [Check Team Member] Total team members found:', allTeamMembers.length);
    
    const memberRecord = allTeamMembers.find((m: any) => 
      m.email === user.email && m.status === 'active'
    );
    
    console.log('🔍 [Check Team Member] Member record found:', !!memberRecord);
    
    if (memberRecord) {
      console.log('✅ [Check Team Member] User is an active team member');
      console.log('📊 [Check Team Member] Member details:', {
        email: memberRecord.email,
        role: memberRecord.role,
        organizationOwnerId: memberRecord.organization_owner_id
      });
    }

    return c.json({ 
      isTeamMember: !!memberRecord,
      role: memberRecord?.role || null,
      organizationOwnerId: memberRecord?.organization_owner_id || null
    }, 200);
  } catch (error) {
    console.error('❌ [Check Team Member] Error:', error);
    return c.json({ isTeamMember: false }, 200);
  }
});

console.log('✅ [SERVER] Team member check API registered');

console.log('✅ [SERVER] KV diagnostic APIs registered');

// 🔧 平台收入修復端點
app.post('/make-server-215f78a5/admin/fix-platform-revenue', fixPlatformRevenue);
console.log('✅ [SERVER] Platform revenue fix API registered');

// 🔧 PayPal 交易記錄格式修復端點
app.post('/make-server-215f78a5/admin/fix-paypal-transactions', async (c) => {
  try {
    const result = await fixPayPalTransactionKeys();
    return c.json(result);
  } catch (error) {
    console.error('❌ [PayPal Fix] Error:', error);
    return c.json({ 
      success: false, 
      error: String(error),
      migrated: 0,
      errors: [String(error)]
    }, 500);
  }
});

app.get('/make-server-215f78a5/admin/verify-paypal-transactions', async (c) => {
  try {
    const result = await verifyPayPalTransactions();
    return c.json(result);
  } catch (error) {
    console.error('❌ [PayPal Verify] Error:', error);
    return c.json({ 
      totalTransactions: 0,
      correctFormat: 0,
      oldFormat: 0,
      issues: [String(error)]
    }, 500);
  }
});
console.log('✅ [SERVER] PayPal transaction fix APIs registered');

// 📁 新增：檢查並發送即將過期的文件提醒（Cron Job）
app.post('/make-server-215f78a5/deliverables/check-expiring-files', async (c) => {
  try {
    console.log('🔍 [Cron] Checking for expiring deliverable files...');

    // 獲取所有專案的交付物
    const allProjects = (await kv.getByPrefix('project:')).map(item => item.value);
    let emailsSent = 0;
    let filesChecked = 0;

    for (const project of allProjects) {
      const deliverableIds = await kv.get(`deliverables:project:${project.id}`) || [];

      for (const deliverableId of deliverableIds) {
        const deliverable = await kv.get(`deliverable:${deliverableId}`);
        
        if (!deliverable) continue;

        filesChecked++;

        // 計算提交日期和當前日期的差異
        const submittedAt = new Date(deliverable.submitted_at);
        const now = new Date();
        const daysPassed = Math.floor((now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = 15 - daysPassed;

        // 如果剩餘 3 天，發送緊急提醒
        if (daysRemaining === 3 && !deliverable.expiry_reminder_sent) {
          const clientProfile = await kv.get(`profile_${deliverable.client_id}`);
          
          if (clientProfile?.email) {
            // 計算過期日期
            const expiryDate = new Date(submittedAt);
            expiryDate.setDate(expiryDate.getDate() + 15);
            const formattedExpiryDate = expiryDate.toLocaleDateString(
              clientProfile.language === 'en' ? 'en-US' : 'zh-TW',
              { year: 'numeric', month: 'long', day: 'numeric' }
            );

            // 發送郵件
            const emailHtml = deliverableEmails.getFileExpiryReminderEmail({
              name: clientProfile.name || clientProfile.email,
              projectTitle: project.title,
              daysRemaining: 3,
              expiryDate: formattedExpiryDate,
              fileCount: deliverable.files.length,
              language: clientProfile.language || 'zh',
            });

            const subject = clientProfile.language === 'en'
              ? '⚠️ Urgent: Files Expiring in 3 Days - Case Where'
              : '⚠️ 緊急：文件 3 天後過期 - Case Where';

            await emailService.sendEmail({
              to: clientProfile.email,
              subject,
              html: emailHtml,
            });

            // 標記已發送提醒
            deliverable.expiry_reminder_sent = true;
            deliverable.expiry_reminder_sent_at = new Date().toISOString();
            await kv.set(`deliverable:${deliverableId}`, deliverable);

            emailsSent++;
            console.log(`📧 [Cron] Expiry reminder sent to ${clientProfile.email} for project ${project.title}`);
          }
        }

        // 如果超過 15 天，記錄過期（實際刪除可以另外處理）
        if (daysRemaining <= 0 && !deliverable.expired) {
          deliverable.expired = true;
          deliverable.expired_at = new Date().toISOString();
          await kv.set(`deliverable:${deliverableId}`, deliverable);
          console.log(`⏰ [Cron] Marked deliverable ${deliverableId} as expired`);
        }
      }
    }

    return c.json({
      success: true,
      filesChecked,
      emailsSent,
      message: `Checked ${filesChecked} deliverables, sent ${emailsSent} expiry reminders`,
    });
  } catch (error: any) {
    console.error('❌ [Cron] Error checking expiring files:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});
console.log('✅ [SERVER] Deliverable expiry checker API registered');

// ============= KYC VERIFICATION ROUTES =============

// Get KYC data for a user
app.get("/make-server-215f78a5/kyc/:userId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.param('userId');
    
    // Only allow users to view their own KYC or admins to view any
    const isAdmin = await isAdminByEmail(user.email || '');
    if (userId !== user.id && !isAdmin) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const kycKey = `kyc_${userId}`;
    const kyc = await kv.get(kycKey);

    return c.json({ kyc: kyc || { user_id: userId, status: 'not_started' } });
  } catch (error) {
    console.error('Error fetching KYC:', error);
    return c.json({ error: 'Failed to fetch KYC data' }, 500);
  }
});

// Upload KYC document (new endpoint for file uploads)
app.post("/make-server-215f78a5/kyc/upload", async (c) => {
  try {
    console.log('📤 [KYC Upload] Request received');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.log('❌ [KYC Upload] No access token');
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      console.log('❌ [KYC Upload] Auth error:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('✅ [KYC Upload] User authenticated:', user.id);

    // Parse form data
    console.log('📥 [KYC Upload] Parsing form data...');
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    console.log('📥 [KYC Upload] File:', file ? file.name : 'null', 'Type:', type);

    if (!file || !type) {
      console.log('❌ [KYC Upload] Missing file or type');
      return c.json({ error: 'File and type are required' }, 400);
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ [KYC Upload] File too large:', file.size);
      return c.json({ error: 'File size must be less than 5MB' }, 400);
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('❌ [KYC Upload] Invalid file type:', file.type);
      return c.json({ error: 'Only image files are allowed' }, 400);
    }

    const KYC_BUCKET = 'make-215f78a5-kyc-documents';
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;

    console.log('📤 [KYC Upload] Uploading to:', fileName);

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    console.log('📤 [KYC Upload] Buffer size:', buffer.length);

    // Upload using service role key
    const { data, error } = await supabase.storage
      .from(KYC_BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('❌ [KYC Upload] Storage error:', error);
      return c.json({ error: 'Failed to upload file: ' + error.message }, 500);
    }

    console.log('✅ [KYC Upload] File uploaded to storage');

    // Get signed URL
    const { data: signedUrlData } = await supabase.storage
      .from(KYC_BUCKET)
      .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

    if (!signedUrlData?.signedUrl) {
      console.log('❌ [KYC Upload] Failed to get signed URL');
      return c.json({ error: 'Failed to get signed URL' }, 500);
    }

    console.log('✅ [KYC Upload] File uploaded successfully:', fileName);
    return c.json({ url: signedUrlData.signedUrl });
  } catch (error) {
    console.error('❌ [KYC Upload] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return c.json({ error: 'Failed to upload file: ' + errorMessage }, 500);
  }
});

// Submit KYC verification
app.post("/make-server-215f78a5/kyc/submit", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const {
      full_name,
      id_type,
      id_number,
      id_front_url,
      id_back_url,
      selfie_url,
      phone_number,
      address,
      city,
      postal_code,
      country,
      date_of_birth,
    } = body;

    // Validation
    if (!full_name || !id_type || !id_number || !id_front_url || !id_back_url || !selfie_url) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const kycKey = `kyc_${user.id}`;
    const now = new Date().toISOString();
    
    const kyc = {
      user_id: user.id,
      user_email: user.email,
      status: 'pending',
      full_name,
      id_type,
      id_number,
      id_front_url,
      id_back_url,
      selfie_url,
      phone_number,
      address,
      city,
      postal_code,
      country,
      date_of_birth,
      submitted_at: now,
      created_at: now,
      updated_at: now,
    };

    await kv.set(kycKey, kyc);

    console.log(`✅ KYC submitted for user ${user.id}`);

    // 📧 發送郵件通知給所有超級管理員
    try {
      // 獲取超級管理員郵箱列表
      const SUPER_ADMINS = ['davidlai234@hotmail.com', 'admin@casewhr.com'];
      const adminEmails = SUPER_ADMINS;
      
      const idTypeLabels: Record<string, string> = {
        'national_id': 'National ID / 身份證',
        'passport': 'Passport / 護照',
        'driver_license': 'Driver License / 駕照'
      };
      
      // 發送給每個超級管理員
      for (const adminEmail of adminEmails) {
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .info-row:last-child { border-bottom: none; }
    .label { font-weight: bold; color: #6b7280; }
    .value { color: #111827; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 New KYC Verification Submitted</h1>
      <h2>新的 KYC 身份驗證申請</h2>
    </div>
    
    <div class="content">
      <div class="alert">
        <strong>⚠️ Action Required / 需要審核</strong><br>
        A new KYC verification has been submitted and requires your review.<br>
        新的 KYC 身份驗證已提交，需要您的審核。
      </div>
      
      <div class="info-box">
        <h3>📋 Applicant Information / 申請人資訊</h3>
        <div class="info-row">
          <span class="label">User Email / 用戶郵箱:</span>
          <span class="value">${user.email}</span>
        </div>
        <div class="info-row">
          <span class="label">Full Name / 真實姓名:</span>
          <span class="value">${full_name}</span>
        </div>
        <div class="info-row">
          <span class="label">ID Type / 證件類型:</span>
          <span class="value">${idTypeLabels[id_type] || id_type}</span>
        </div>
        <div class="info-row">
          <span class="label">ID Number / 證件號碼:</span>
          <span class="value">${id_number}</span>
        </div>
        <div class="info-row">
          <span class="label">Country / 國家:</span>
          <span class="value">${country}</span>
        </div>
        <div class="info-row">
          <span class="label">Submitted At / 提交時間:</span>
          <span class="value">${new Date(now).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="https://casewhr.com" class="button">
          🔍 Review in Admin Dashboard<br>
          在管理後台審核
        </a>
      </div>
      
      <div class="info-box">
        <h3>📝 Next Steps / 下一步操作</h3>
        <ol>
          <li>Log in to admin dashboard / 登入管理後台</li>
          <li>Navigate to "KYC Verification Management" / 前往「KYC 驗證管理」</li>
          <li>Review the submitted documents / 審核提交的證件文件</li>
          <li>Approve or Reject the application / 批准或拒絕申請</li>
        </ol>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        💡 <strong>Tip:</strong> The application will appear at the top of your "Pending" list.<br>
        💡 <strong>提示：</strong>此申請會顯示在「待審核」列表的最上方。
      </p>
    </div>
    
    <div class="footer">
      <p>
        This is an automated notification from Case Where Platform.<br>
        這是來自 Case Where 平台的自動通知。
      </p>
      <p>© 2025 Case Where. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
        `;

        await emailService.sendEmail({
          to: adminEmail,
          subject: `🔐 New KYC Submitted - ${full_name} (${user.email})`,
          html: emailHtml,
          emailType: 'admin-notification',
          language: 'zh'
        });
        
        console.log(`📧 KYC notification email sent to admin: ${adminEmail}`);
      }
    } catch (emailError) {
      console.error('❌ Failed to send admin notification email:', emailError);
      // 不影響 KYC 提交成功，只記錄錯誤
    }

    return c.json({ success: true, kyc });
  } catch (error) {
    console.error('Error submitting KYC:', error);
    return c.json({ error: 'Failed to submit KYC' }, 500);
  }
});

// Admin: Get all KYC submissions
app.get("/make-server-215f78a5/admin/kyc/all", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check admin permissions
    const isAdmin = await isAdminByEmail(user.email || '');
    if (!isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const allKYC = (await kv.getByPrefix('kyc_')).map(item => item.value);
    const kycList = (allKYC || [])
      .filter((k: any) => k && k.status !== 'not_started')
      .sort((a: any, b: any) => {
        // Sort by status priority (pending first) then by date
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.submitted_at || b.created_at).getTime() - new Date(a.submitted_at || a.created_at).getTime();
      });

    console.log(`✅ Retrieved ${kycList.length} KYC submissions for admin`);

    return c.json({ kyc_list: kycList });
  } catch (error) {
    console.error('Error fetching KYC list:', error);
    return c.json({ error: 'Failed to fetch KYC list' }, 500);
  }
});

// Admin: Get pending KYC count (for notification badge)
app.get("/make-server-215f78a5/admin/kyc/pending-count", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check admin permissions
    const isAdmin = await isAdminByEmail(user.email || '');
    if (!isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const allKYC = (await kv.getByPrefix('kyc_')).map(item => item.value);
    const pendingCount = (allKYC || [])
      .filter((k: any) => k && k.status === 'pending')
      .length;

    console.log(`✅ Pending KYC count: ${pendingCount}`);

    return c.json({ pending_count: pendingCount });
  } catch (error) {
    console.error('Error fetching pending KYC count:', error);
    return c.json({ error: 'Failed to fetch pending KYC count' }, 500);
  }
});

// Admin: Approve KYC
app.post("/make-server-215f78a5/admin/kyc/:userId/approve", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check admin permissions
    const isAdmin = await isAdminByEmail(user.email || '');
    if (!isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const userId = c.req.param('userId');
    const kycKey = `kyc_${userId}`;
    const kyc = await kv.get(kycKey);

    if (!kyc) {
      return c.json({ error: 'KYC not found' }, 404);
    }

    if (kyc.status !== 'pending') {
      return c.json({ error: 'KYC is not pending approval' }, 400);
    }

    kyc.status = 'approved';
    kyc.verified_at = new Date().toISOString();
    kyc.updated_at = new Date().toISOString();
    kyc.rejection_reason = undefined;

    await kv.set(kycKey, kyc);

    // Update user profile to mark as KYC verified
    const profileKey = `profile_${userId}`;
    const profile = await kv.get(profileKey);
    if (profile) {
      profile.kyc_verified = true;
      profile.kyc_verified_at = kyc.verified_at;
      await kv.set(profileKey, profile);
    }

    console.log(`✅ KYC approved for user ${userId}`);

    return c.json({ success: true, kyc });
  } catch (error) {
    console.error('Error approving KYC:', error);
    return c.json({ error: 'Failed to approve KYC' }, 500);
  }
});

// Admin: Reject KYC
app.post("/make-server-215f78a5/admin/kyc/:userId/reject", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check admin permissions
    const isAdmin = await isAdminByEmail(user.email || '');
    if (!isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const userId = c.req.param('userId');
    const body = await c.req.json();
    const { reason } = body;

    if (!reason || !reason.trim()) {
      return c.json({ error: 'Rejection reason is required' }, 400);
    }

    const kycKey = `kyc_${userId}`;
    const kyc = await kv.get(kycKey);

    if (!kyc) {
      return c.json({ error: 'KYC not found' }, 404);
    }

    if (kyc.status !== 'pending') {
      return c.json({ error: 'KYC is not pending approval' }, 400);
    }

    kyc.status = 'rejected';
    kyc.rejection_reason = reason;
    kyc.updated_at = new Date().toISOString();

    await kv.set(kycKey, kyc);

    // Update user profile
    const profileKey = `profile_${userId}`;
    const profile = await kv.get(profileKey);
    if (profile) {
      profile.kyc_verified = false;
      await kv.set(profileKey, profile);
    }

    console.log(`❌ KYC rejected for user ${userId}: ${reason}`);

    return c.json({ success: true, kyc });
  } catch (error) {
    console.error('Error rejecting KYC:', error);
    return c.json({ error: 'Failed to reject KYC' }, 500);
  }
});

console.log('✅ [SERVER] KYC verification routes registered');

// ============= WITHDRAWAL REQUEST ROUTES (NEW SYSTEM) =============
import { registerWithdrawalRequestRoutes } from './withdrawal_request_routes.tsx';
registerWithdrawalRequestRoutes(app, supabase, emailService);

// ============= WALLET RESET ROUTES =============
import { registerWalletResetRoutes } from './wallet_reset_routes.tsx';
registerWalletResetRoutes(app, supabase);

// ============= REVENUE RESET ROUTES =============
import { registerRevenueResetRoutes } from './revenue_reset_routes.tsx';
registerRevenueResetRoutes(app, supabase);

// ============= WHITEPAPER ROUTES =============
import { registerWhitepaperRoutes } from './whitepaper_routes.tsx';
registerWhitepaperRoutes(app);

// ============= SEO CONTENT GENERATION ROUTES =============
import { registerSEOContentRoutes } from './seo_content_service.tsx';
registerSEOContentRoutes(app);

// ============= SEO KEYWORDS ROUTES =============
import { registerKeywordRoutes } from './seo_keywords_service.tsx';
registerKeywordRoutes(app);

// ============= SEO KEYWORD MAP ROUTES =============
import { registerKeywordMapRoutes } from './seo_keyword_map_service.tsx';
registerKeywordMapRoutes(app);

// ============= VIDEO UPLOAD ROUTES =============
// Bucket 已在 Supabase 手動創建，無需初始化

// 上傳影片路由
app.post('/make-server-215f78a5/upload-hero-video', async (c) => {
  try {
    const formData = await c.req.formData();
    const videoFile = formData.get('video') as File;
    
    if (!videoFile) {
      return c.json({ error: '沒有收到影片檔案' }, 400);
    }
    
    // 驗證檔案大小（50MB）
    if (videoFile.size > 50 * 1024 * 1024) {
      return c.json({ error: '影片檔案太大，請使用���於 50MB 的影片' }, 400);
    }
    
    // 驗證檔案類型
    if (!videoFile.type.startsWith('video/')) {
      return c.json({ error: '請上傳影片檔案' }, 400);
    }
    
    // 上傳到 Supabase Storage
    const result = await videoUploadService.uploadHeroVideo(videoFile, videoFile.name);
    
    return c.json({
      success: true,
      url: result.url,
      path: result.path,
      message: '影片上傳成功！'
    });
    
  } catch (error: any) {
    console.error('❌ [Video Upload Route] Error:', error);
    return c.json({ 
      error: error.message || '上傳失敗，請重試'
    }, 500);
  }
});

// 列出已上傳的影片
app.get('/make-server-215f78a5/list-hero-videos', async (c) => {
  try {
    const videos = await videoUploadService.listHeroVideos();
    return c.json({ success: true, videos });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 刪除影片
app.delete('/make-server-215f78a5/delete-hero-video/:path', async (c) => {
  try {
    const path = c.req.param('path');
    await videoUploadService.deleteHeroVideo(path);
    return c.json({ success: true, message: '影片已刪除' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

console.log('✅ [SERVER] Video upload routes registered');

// ============= TALENT POOL & HR ROUTES =============

// 🔥 獲取人才庫列表
app.get("/make-server-215f78a5/talent-pool", async (c) => {
  try {
    console.log('✅ [Talent Pool] Loading freelancers...');

    // 獲取所有用戶
    const allUserKeys = await kv.getByPrefix('user:');
    const users = allUserKeys || [];

    // 🔥 檢查當前用戶的收藏列表
    let currentUserFavorites: string[] = [];
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (accessToken) {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser(accessToken);
        if (currentUser?.id) {
          const favorites = await kv.get(`favorites:${currentUser.id}`) || [];
          currentUserFavorites = Array.isArray(favorites) ? favorites : [];
          console.log(`✅ [Talent Pool] User ${currentUser.id} has ${currentUserFavorites.length} favorites`);
        }
      } catch (error) {
        // 忽略認證錯誤，繼續載入人才庫
        console.log('⚠️ [Talent Pool] User not authenticated or token invalid');
      }
    }

    const freelancers = [];

    for (const user of users) {
      if (!user || !user.id) continue;

      // 檢查是否有接案者資料（profile 或完成的項目）
      const profile = await kv.get(`user_profile:${user.id}`);
      const completedProjectsKey = await kv.get(`freelancer_completed_projects:${user.id}`) || [];
      const reviewsKey = await kv.get(`reviews:freelancer:${user.id}`) || [];
      
      // 獲取作品集數量
      const portfolioData = await kv.get(`portfolio_${user.id}`) || { items: [] };
      const portfolioCount = Array.isArray(portfolioData.items) ? portfolioData.items.length : 0;

      // 計算評分
      let rating = 0;
      let reviewCount = 0;
      if (Array.isArray(reviewsKey) && reviewsKey.length > 0) {
        const reviews = await kv.mget(reviewsKey);
        const validReviews = reviews.filter(r => r && r.rating);
        if (validReviews.length > 0) {
          rating = validReviews.reduce((sum, r) => sum + r.rating, 0) / validReviews.length;
          reviewCount = validReviews.length;
        }
      }

      freelancers.push({
        id: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        avatar: profile?.avatar,
        title: profile?.title || profile?.job_title,
        bio: profile?.bio || profile?.description,
        skills: profile?.skills || [],
        hourly_rate_min: profile?.hourly_rate_min,
        hourly_rate_max: profile?.hourly_rate_max,
        currency: profile?.currency || 'TWD',
        location: profile?.location,
        rating: rating > 0 ? rating : undefined,
        review_count: reviewCount,
        completed_projects: Array.isArray(completedProjectsKey) ? completedProjectsKey.length : 0,
        portfolio_count: portfolioCount, // 🔥 添加作品集數量
        is_favorite: currentUserFavorites.includes(user.id), // 🔥 添加收藏狀態
      });
    }

    console.log(`✅ [Talent Pool] Found ${freelancers.length} freelancers`);
    return c.json({ freelancers });

  } catch (error) {
    console.error('❌ [Talent Pool] Error:', error);
    return c.json({ error: 'Failed to load talent pool' }, 500);
  }
});

// 🔥 獲取接案者詳細檔案
app.get("/make-server-215f78a5/freelancer/:id/profile", async (c) => {
  try {
    const freelancerId = c.req.param('id');
    console.log('✅ [Freelancer Profile] Loading profile for:', freelancerId);

    // 🔥 嘗試從新格式和舊格式獲取 profile
    let profile = await kv.get(`profile_${freelancerId}`);
    if (!profile) {
      profile = await kv.get(`profile:${freelancerId}`);
    }
    
    if (!profile) {
      console.log('❌ [Freelancer Profile] Profile not found for:', freelancerId);
      return c.json({ error: 'Freelancer not found' }, 404);
    }

    console.log('✅ [Freelancer Profile] Profile found:', profile.full_name || profile.email);

    // 🔥 使用 profile 中的 user_id 來讀取作品集（而不是 freelancerId）
    const userId = profile.user_id || freelancerId; // Fallback to freelancerId if user_id not set
    console.log('✅ [Freelancer Profile] Using user_id for portfolio:', userId);
    
    // 獲取作品集（統一使用 portfolio:user: 格式）
    const portfolioData = await kv.get(`portfolio:user:${userId}`) || { items: [] };
    const portfolio = Array.isArray(portfolioData.items) ? portfolioData.items : [];
    console.log('✅ [Freelancer Profile] Portfolio items:', portfolio.length);

    // 獲取評價
    const reviewKeys = await kv.get(`reviews:freelancer:${freelancerId}`) || [];
    const reviews = [];
    if (Array.isArray(reviewKeys) && reviewKeys.length > 0) {
      const reviewData = await kv.mget(reviewKeys);
      for (const review of reviewData) {
        if (review) {
          // 嘗試獲取評論者資訊
          let reviewerName = 'Anonymous';
          const reviewer = await kv.get(`user:${review.reviewer_id}`);
          if (reviewer) {
            reviewerName = reviewer.name || reviewer.email?.split('@')[0] || 'Anonymous';
          } else {
            // 如果 user: 格式找不到，嘗試從 profile 獲取
            const reviewerProfile = await kv.get(`profile_${review.reviewer_id}`) || await kv.get(`profile:${review.reviewer_id}`);
            if (reviewerProfile) {
              reviewerName = reviewerProfile.full_name || reviewerProfile.email?.split('@')[0] || 'Anonymous';
            }
          }
          
          reviews.push({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            reviewer_name: reviewerName,
            created_at: review.created_at,
          });
        }
      }
    }

    // 計算統計數據
    let rating = 0;
    if (reviews.length > 0) {
      rating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    }

    const completedProjectsKey = await kv.get(`freelancer_completed_projects:${freelancerId}`) || [];

    // 檢查是否已收藏（需要登入）
    let isFavorite = false;
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (accessToken) {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser(accessToken);
        if (currentUser?.id) {
          const favorites = await kv.get(`favorites:${currentUser.id}`) || [];
          isFavorite = Array.isArray(favorites) && favorites.includes(freelancerId);
        }
      } catch (error) {
        // 忽略認證錯誤
      }
    }

    const profileData = {
      id: profile.user_id || freelancerId,
      email: profile.email,
      name: profile.full_name || profile.name || profile.email?.split('@')[0] || 'Freelancer',
      avatar: profile.avatar_url || profile.avatar,
      title: profile.job_title || profile.title,
      bio: profile.bio || profile.description,
      skills: Array.isArray(profile.skills) ? profile.skills : [],
      hourly_rate_min: profile.hourly_rate_min,
      hourly_rate_max: profile.hourly_rate_max,
      currency: profile.currency || 'TWD',
      location: profile.location,
      rating: rating > 0 ? rating : undefined,
      review_count: reviews.length,
      completed_projects: Array.isArray(completedProjectsKey) ? completedProjectsKey.length : 0,
      joined_date: profile.created_at,
      portfolio: portfolio.filter(p => p),
      reviews: reviews,
      is_favorite: isFavorite,
    };

    console.log('✅ [Freelancer Profile] Profile loaded');
    return c.json({ profile: profileData });

  } catch (error) {
    console.error('❌ [Freelancer Profile] Error:', error);
    return c.json({ error: 'Failed to load profile' }, 500);
  }
});

// 🔥 添加收藏
app.post("/make-server-215f78a5/favorites/add", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { freelancer_id } = await c.req.json();
    if (!freelancer_id) {
      return c.json({ error: 'Missing freelancer_id' }, 400);
    }

    const favoritesKey = `favorites:${user.id}`;
    const favorites = await kv.get(favoritesKey) || [];
    
    if (!Array.isArray(favorites)) {
      await kv.set(favoritesKey, [freelancer_id]);
    } else if (!favorites.includes(freelancer_id)) {
      favorites.push(freelancer_id);
      await kv.set(favoritesKey, favorites);
    }

    console.log(`✅ [Favorites] User ${user.id} added freelancer ${freelancer_id}`);
    return c.json({ success: true });

  } catch (error) {
    console.error('❌ [Favorites] Error adding:', error);
    return c.json({ error: 'Failed to add favorite' }, 500);
  }
});

// 🔥 移除收藏
app.post("/make-server-215f78a5/favorites/remove", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { freelancer_id } = await c.req.json();
    if (!freelancer_id) {
      return c.json({ error: 'Missing freelancer_id' }, 400);
    }

    const favoritesKey = `favorites:${user.id}`;
    const favorites = await kv.get(favoritesKey) || [];
    
    if (Array.isArray(favorites)) {
      const filtered = favorites.filter(id => id !== freelancer_id);
      await kv.set(favoritesKey, filtered);
    }

    console.log(`✅ [Favorites] User ${user.id} removed freelancer ${freelancer_id}`);
    return c.json({ success: true });

  } catch (error) {
    console.error('❌ [Favorites] Error removing:', error);
    return c.json({ error: 'Failed to remove favorite' }, 500);
  }
});

// 🔥 獲取收藏列表
app.get("/make-server-215f78a5/favorites/list", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const favoritesKey = `favorites:${user.id}`;
    const favorites = await kv.get(favoritesKey) || [];

    console.log(`✅ [Favorites] User ${user.id} has ${Array.isArray(favorites) ? favorites.length : 0} favorites`);
    return c.json({ favorites: Array.isArray(favorites) ? favorites : [] });

  } catch (error) {
    console.error('❌ [Favorites] Error loading list:', error);
    return c.json({ error: 'Failed to load favorites' }, 500);
  }
});

// 🔥 邀請接案者參與項目
app.post("/make-server-215f78a5/invite/:freelancerId/:projectId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const freelancerId = c.req.param('freelancerId');
    const projectId = c.req.param('projectId');

    // 檢查項目是否存在且屬於該用戶
    const project = await kv.get(`project:${projectId}`);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    if (project.user_id !== user.id) {
      return c.json({ error: 'Not your project' }, 403);
    }

    // 檢查接案者是否存在 (使用 profile_ key)
    const freelancer = await kv.get(`profile_${freelancerId}`);
    if (!freelancer) {
      return c.json({ error: 'Freelancer not found' }, 404);
    }

    // 創建邀請記錄
    const invitationId = crypto.randomUUID();
    const invitation = {
      id: invitationId,
      project_id: projectId,
      freelancer_id: freelancerId,
      client_id: user.id,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    await kv.set(`invitation:${invitationId}`, invitation);

    // 添加到接案者的邀請列表
    const freelancerInvitationsKey = `invitations:freelancer:${freelancerId}`;
    const freelancerInvitations = await kv.get(freelancerInvitationsKey) || [];
    if (Array.isArray(freelancerInvitations)) {
      freelancerInvitations.unshift(invitationId);
      await kv.set(freelancerInvitationsKey, freelancerInvitations);
    } else {
      await kv.set(freelancerInvitationsKey, [invitationId]);
    }

    // 🔔 創建通知給接案者
    const notificationId = crypto.randomUUID();
    const notification = {
      id: notificationId,
      user_id: freelancerId,
      type: 'project_invite',
      title: 'New Project Invitation',
      message: `You have been invited to submit a proposal for "${project.title}"`,
      data: {
        project_id: projectId,
        project_title: project.title,
        client_id: user.id,
        invitation_id: invitationId,
      },
      read: false,
      created_at: new Date().toISOString(),
    };

    await kv.set(`notification:${notificationId}`, notification);

    // 添加到接案者的通知列表
    const userNotificationsKey = `notifications:${freelancerId}`;
    const userNotifications = await kv.get(userNotificationsKey) || [];
    if (Array.isArray(userNotifications)) {
      userNotifications.unshift(notificationId);
      await kv.set(userNotificationsKey, userNotifications);
    } else {
      await kv.set(userNotificationsKey, [notificationId]);
    }

    // 📧 發送郵件通知給接案者
    try {
      const clientProfile = await kv.get(`profile_${user.id}`);
      const clientName = clientProfile?.name || 'A client';
      const freelancerEmail = freelancer.email;
      const freelancerName = freelancer.name || 'Freelancer';

      if (freelancerEmail) {
        const brevoApiKey = Deno.env.get('BREVO_API_KEY');
        if (brevoApiKey) {
          const emailData = {
            sender: { name: 'CaseWHR', email: 'noreply@casewhr.com' },
            to: [{ email: freelancerEmail, name: freelancerName }],
            subject: `🎯 New Project Invitation: ${project.title}`,
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">🎯 New Project Invitation</h1>
                </div>
                
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                  <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                    Hi <strong>${freelancerName}</strong>,
                  </p>
                  
                  <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                    <strong>${clientName}</strong> has invited you to submit a proposal for their project:
                  </p>
                  
                  <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                    <h2 style="color: #667eea; margin: 0 0 10px 0; font-size: 22px;">${project.title}</h2>
                    <p style="color: #666; margin: 0; line-height: 1.6;">${project.description || 'No description provided'}</p>
                    
                    ${project.budget ? `
                      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                        <p style="color: #333; margin: 0;">
                          <strong>💰 Budget:</strong> ${project.budget} ${project.currency || 'TWD'}
                        </p>
                      </div>
                    ` : ''}
                    
                    ${project.required_skills && project.required_skills.length > 0 ? `
                      <div style="margin-top: 15px;">
                        <p style="color: #333; margin: 0 0 10px 0;"><strong>🔧 Required Skills:</strong></p>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                          ${project.required_skills.map(skill => 
                            `<span style="background: #ede9fe; color: #7c3aed; padding: 4px 12px; border-radius: 9999px; font-size: 14px;">${skill}</span>`
                          ).join('')}
                        </div>
                      </div>
                    ` : ''}
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://casewhr.com" 
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                      View Invitation & Submit Proposal
                    </a>
                  </div>
                  
                  <p style="font-size: 14px; color: #666; text-align: center; margin: 20px 0 0 0;">
                    This is a great opportunity to work on an exciting project!
                  </p>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                  <p>© 2025 CaseWHR. All rights reserved.</p>
                </div>
              </div>
            `,
          };

          const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'api-key': brevoApiKey,
              'content-type': 'application/json',
            },
            body: JSON.stringify(emailData),
          });

          if (emailResponse.ok) {
            console.log(`✅ [Invite] Email sent to ${freelancerEmail}`);
          } else {
            const errorText = await emailResponse.text();
            console.error(`❌ [Invite] Failed to send email:`, errorText);
          }
        } else {
          console.warn('⚠️ [Invite] BREVO_API_KEY not configured, skipping email');
        }
      }
    } catch (emailError) {
      console.error('❌ [Invite] Error sending email:', emailError);
      // Don't fail the invitation if email fails
    }

    console.log(`✅ [Invite] Client ${user.id} invited freelancer ${freelancerId} to project ${projectId}`);
    console.log(`🔔 [Notification] Created notification ${notificationId} for user ${freelancerId}`);
    return c.json({ success: true, invitation_id: invitationId });

  } catch (error) {
    console.error('❌ [Invite] Error:', error);
    return c.json({ error: 'Failed to send invitation' }, 500);
  }
});

// 🔔 獲取用戶通知列表
app.get("/make-server-215f78a5/notifications", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userNotificationsKey = `notifications:${user.id}`;
    const notificationIds = await kv.get(userNotificationsKey) || [];

    const notifications = [];
    if (Array.isArray(notificationIds)) {
      for (const id of notificationIds) {
        const notification = await kv.get(`notification:${id}`);
        if (notification) {
          notifications.push(notification);
        }
      }
    }

    // 計算未讀數量
    const unreadCount = notifications.filter(n => !n.read).length;

    console.log(`✅ [Notifications] User ${user.id} has ${notifications.length} notifications (${unreadCount} unread)`);
    return c.json({ notifications, unread_count: unreadCount });

  } catch (error) {
    console.error('❌ [Notifications] Error loading:', error);
    return c.json({ error: 'Failed to load notifications' }, 500);
  }
});

// 🔔 標記通知為已讀
app.post("/make-server-215f78a5/notifications/:id/read", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notificationId = c.req.param('id');
    const notification = await kv.get(`notification:${notificationId}`);

    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    if (notification.user_id !== user.id) {
      return c.json({ error: 'Not your notification' }, 403);
    }

    notification.read = true;
    await kv.set(`notification:${notificationId}`, notification);

    console.log(`✅ [Notifications] Marked notification ${notificationId} as read`);
    return c.json({ success: true });

  } catch (error) {
    console.error('❌ [Notifications] Error marking as read:', error);
    return c.json({ error: 'Failed to mark as read' }, 500);
  }
});

// 🔔 標記所有通知為已讀
app.post("/make-server-215f78a5/notifications/read-all", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userNotificationsKey = `notifications:${user.id}`;
    const notificationIds = await kv.get(userNotificationsKey) || [];

    if (Array.isArray(notificationIds)) {
      for (const id of notificationIds) {
        const notification = await kv.get(`notification:${id}`);
        if (notification && !notification.read) {
          notification.read = true;
          await kv.set(`notification:${id}`, notification);
        }
      }
    }

    console.log(`✅ [Notifications] Marked all notifications as read for user ${user.id}`);
    return c.json({ success: true });

  } catch (error) {
    console.error('❌ [Notifications] Error marking all as read:', error);
    return c.json({ error: 'Failed to mark all as read' }, 500);
  }
});

// 🔔 回應項目邀請（接受/拒絕）
app.post("/make-server-215f78a5/invitations/:id/respond", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const invitationId = c.req.param('id');
    const { action } = await c.req.json(); // 'accept' or 'decline'

    const invitation = await kv.get(`invitation:${invitationId}`);
    if (!invitation) {
      return c.json({ error: 'Invitation not found' }, 404);
    }

    if (invitation.freelancer_id !== user.id) {
      return c.json({ error: 'Not your invitation' }, 403);
    }

    if (invitation.status !== 'pending') {
      return c.json({ error: 'Invitation already responded to' }, 400);
    }

    // 更新邀請狀態
    invitation.status = action === 'accept' ? 'accepted' : 'declined';
    invitation.responded_at = new Date().toISOString();
    await kv.set(`invitation:${invitationId}`, invitation);

    // 🔔 發送通知給發案者
    try {
      const freelancerProfile = await kv.get(`profile_${user.id}`) || {};
      const freelancerName = freelancerProfile.display_name || freelancerProfile.full_name || user.email;
      const project = await kv.get(`project:${invitation.project_id}`) || {};
      
      const notificationId = `notification:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const notification = {
        id: notificationId,
        user_id: invitation.client_id, // 發送給發案者
        type: 'invitation_response',
        title: action === 'accept' 
          ? `${freelancerName} accepted your invitation` 
          : `${freelancerName} declined your invitation`,
        message: action === 'accept'
          ? `${freelancerName} has accepted your invitation for project "${project.title}"`
          : `${freelancerName} has declined your invitation for project "${project.title}"`,
        data: {
          invitation_id: invitationId,
          project_id: invitation.project_id,
          project_title: project.title,
          freelancer_id: user.id,
          freelancer_name: freelancerName,
          action: action,
        },
        read: false,
        created_at: new Date().toISOString(),
      };

      await kv.set(notificationId, notification);

      // 將通知 ID 添加到發案者的通知列表
      const clientNotificationsKey = `notifications:${invitation.client_id}`;
      const clientNotifications = await kv.get(clientNotificationsKey) || [];
      clientNotifications.unshift(notificationId);
      await kv.set(clientNotificationsKey, clientNotifications);

      console.log(`✅ [Invitation] Notification sent to client ${invitation.client_id}`);
    } catch (notifError) {
      console.error('❌ [Invitation] Failed to send notification:', notifError);
      // 不阻擋主流程
    }

    // 如果接受邀請，可以自動創建提案或跳轉到提案頁面
    // 這裡先簡單記錄狀態

    console.log(`✅ [Invitation] User ${user.id} ${action}ed invitation ${invitationId}`);
    return c.json({ success: true, status: invitation.status });

  } catch (error) {
    console.error('❌ [Invitation] Error responding:', error);
    return c.json({ error: 'Failed to respond to invitation' }, 500);
  }
});

// 🔔 獲取用戶發送的所有邀請（發案者查看）
app.get("/make-server-215f78a5/invitations/sent", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // 從 KV 獲取所有邀請
    const allInvitations = (await kv.getByPrefix('invitation:') || [])
      .map(item => item.value)
      .filter((inv: any) => inv.client_id === user.id); // 只返回當前用戶發送的邀請

    console.log(`📬 [Invitations] Found ${allInvitations.length} sent invitations for user ${user.id}`);

    // 豐富邀請數據：添加接案者和專案信息
    const enrichedInvitations = await Promise.all(
      allInvitations.map(async (inv: any) => {
        try {
          // 獲取專案信息
          const project = await kv.get(`project:${inv.project_id}`) || {};
          
          // 🔧 優先從 invitation 中獲取 freelancer_email，然後嘗試從多個來源獲取個人資料
          let freelancerName = 'Unknown';
          let freelancerEmail = inv.freelancer_email || 'unknown@example.com';
          
          // 方法 1: 嘗試從 KV 獲取個人資料 (profile_userId)
          const freelancerProfile = await kv.get(`profile_${inv.freelancer_id}`) || null;
          if (freelancerProfile) {
            freelancerName = freelancerProfile.display_name || freelancerProfile.full_name || freelancerName;
            freelancerEmail = freelancerProfile.email || freelancerEmail;
            console.log(`✅ [Invitations] Found profile from KV for ${inv.freelancer_id}:`, freelancerName);
          } else {
            console.log(`⚠️ [Invitations] No profile in KV for ${inv.freelancer_id}, trying auth API`);
            
            // 方法 2: 使用 Supabase Admin API 獲取用戶信息
            try {
              const { data: userData, error: userError } = await supabase.auth.admin.getUserById(inv.freelancer_id);
              if (userData?.user && !userError) {
                freelancerEmail = userData.user.email || freelancerEmail;
                freelancerName = userData.user.user_metadata?.display_name || 
                                userData.user.user_metadata?.full_name || 
                                userData.user.email?.split('@')[0] || 
                                'Unknown';
                console.log(`✅ [Invitations] Found user from Auth API for ${inv.freelancer_id}:`, freelancerName);
              } else {
                console.log(`⚠️ [Invitations] Auth API failed for ${inv.freelancer_id}:`, userError?.message);
              }
            } catch (authError) {
              console.error(`❌ [Invitations] Auth API error for ${inv.freelancer_id}:`, authError);
            }
          }
          
          // 如果還是沒有名字，使用 email 的前綴
          if (freelancerName === 'Unknown' && freelancerEmail !== 'unknown@example.com') {
            freelancerName = freelancerEmail.split('@')[0];
          }
          
          return {
            invitation_id: inv.invitation_id,
            project_id: inv.project_id,
            project_title: project.title || 'Unknown Project',
            freelancer_id: inv.freelancer_id,
            freelancer_name: freelancerName,
            freelancer_email: freelancerEmail,
            status: inv.status || 'pending',
            created_at: inv.created_at,
            responded_at: inv.responded_at,
            message: inv.message,
          };
        } catch (error) {
          console.error('❌ [Invitations] Error enriching invitation:', error);
          return {
            invitation_id: inv.invitation_id,
            project_id: inv.project_id,
            project_title: 'Unknown Project',
            freelancer_id: inv.freelancer_id,
            freelancer_name: inv.freelancer_email?.split('@')[0] || 'Unknown',
            freelancer_email: inv.freelancer_email || 'unknown@example.com',
            status: inv.status || 'pending',
            created_at: inv.created_at,
            responded_at: inv.responded_at,
            message: inv.message,
          };
        }
      })
    );

    // 按創建時間倒序排列
    enrichedInvitations.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    console.log(`✅ [Invitations] Returning ${enrichedInvitations.length} enriched invitations`);
    return c.json({ invitations: enrichedInvitations });

  } catch (error) {
    console.error('❌ [Invitations] Error fetching sent invitations:', error);
    return c.json({ error: 'Failed to fetch sent invitations' }, 500);
  }
});

console.log('✅ [SERVER] Talent pool and HR routes registered');
console.log('✅ [SERVER] Notification routes registered');

// 🔐 SSO Email Verification API
app.post("/make-server-215f78a5/auth/verify-sso-email", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized', approved: false }, 401);
    }

    const { email, provider, user_id } = await c.req.json();
    
    console.log(`🔐 [SSO Verify] Checking email: ${email}, provider: ${provider}, user_id: ${user_id}`);
    
    // Define email validation rules
    const emailValidation = {
      whitelist: [
        'davidlai234@hotmail.com',
        'davidlai117@yahoo.com.tw',
      ],
      whitelistDomains: [],
      blacklist: [],
      blacklistDomains: [
        '@tempmail.com',
        '@guerrillamail.com',
        '@10minutemail.com',
      ],
    };
    
    const emailLower = email?.toLowerCase() || '';
    const emailDomain = emailLower.split('@')[1];
    
    // Check blacklist first
    if (emailValidation.blacklist.includes(emailLower)) {
      console.warn(`⚠️ [SSO Verify] Email ${email} is blacklisted`);
      return c.json({
        approved: false,
        reason: 'This email address is not authorized to access this platform.',
      });
    }
    
    // Check blacklisted domains
    if (emailDomain && emailValidation.blacklistDomains.some(domain => emailDomain.endsWith(domain.replace('@', '')))) {
      console.warn(`⚠️ [SSO Verify] Email domain ${emailDomain} is blacklisted`);
      return c.json({
        approved: false,
        reason: 'Disposable email addresses are not allowed.',
      });
    }
    
    // Check whitelist
    if (emailValidation.whitelist.includes(emailLower)) {
      console.log(`✅ [SSO Verify] Email ${email} is whitelisted`);
      return c.json({
        approved: true,
        reason: 'Email is whitelisted',
      });
    }
    
    // Default: AUTO-APPROVE all SSO logins
    const autoApprove = true;
    
    if (autoApprove) {
      console.log(`✅ [SSO Verify] Email ${email} auto-approved`);
      return c.json({
        approved: true,
        reason: 'Auto-approved',
      });
    }
    
    // Not approved
    return c.json({
      approved: false,
      reason: 'Your account is pending approval.',
    });
    
  } catch (error) {
    console.error('❌ [SSO Verify] Error:', error);
    return c.json({ 
      error: 'Verification failed', 
      approved: false 
    }, 500);
  }
});

console.log('✅ [SERVER] SSO verification route registered');

console.log('🎉 [SERVER] All routes registered, starting server...');

// 禁用 JWT 验证（允许匿名访问测试端点）
Deno.serve({
  onListen: () => console.log('🚀 Server started without JWT verification'),
}, app.fetch);