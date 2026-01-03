import { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js";
import { EXCHANGE_RATES, toUSD } from "./exchange_rates.tsx";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🇹🇼 ECPay Configuration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ECPAY_CONFIG = {
  merchantId: Deno.env.get('ECPAY_MERCHANT_ID') || '',
  hashKey: Deno.env.get('ECPAY_HASH_KEY') || '',
  hashIV: Deno.env.get('ECPAY_HASH_IV') || '',
  mode: Deno.env.get('ECPAY_MODE') || 'sandbox', // ✅ 先切回測試環境
  
  // API URLs
  get apiUrl() {
    return this.mode === 'production'
      ? 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5'
      : 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5';
  },
  
  // Query API
  get queryUrl() {
    return this.mode === 'production'
      ? 'https://payment.ecpay.com.tw/Cashier/QueryTradeInfo/V5'
      : 'https://payment-stage.ecpay.com.tw/Cashier/QueryTradeInfo/V5';
  }
};

console.log('[ECPay] Configuration loaded:', {
  merchantId: ECPAY_CONFIG.merchantId,
  mode: ECPAY_CONFIG.mode,
  hashKeyConfigured: !!ECPAY_CONFIG.hashKey,
  hashIVConfigured: !!ECPAY_CONFIG.hashIV,
  apiUrl: ECPAY_CONFIG.apiUrl
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helper: Generate ECPay CheckMacValue
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function generateCheckMacValue(params: Record<string, any>): Promise<string> {
  const { hashKey, hashIV } = ECPAY_CONFIG;
  
  if (!hashKey || !hashIV) {
    throw new Error('ECPay Hash Key or IV not configured');
  }
  
  // Remove CheckMacValue if exists
  const cleanParams = { ...params };
  delete cleanParams.CheckMacValue;
  
  // Sort parameters alphabetically
  const sortedKeys = Object.keys(cleanParams).sort();
  const sortedParams = sortedKeys.map(key => `${key}=${cleanParams[key]}`).join('&');
  
  // Add hash key and IV
  const rawString = `HashKey=${hashKey}&${sortedParams}&HashIV=${hashIV}`;
  
  // URL encode and apply ECPay specific rules
  const encodedString = rawString
    .split('')
    .map(char => {
      const code = char.charCodeAt(0);
      // Keep alphanumeric and specific characters
      if ((code >= 48 && code <= 57) ||   // 0-9
          (code >= 65 && code <= 90) ||   // A-Z
          (code >= 97 && code <= 122) ||  // a-z
          char === '-' || char === '_' || char === '.' ||
          char === '!' || char === '*' || char === '(' || char === ')') {
        return char;
      }
      // Encode others
      return encodeURIComponent(char);
    })
    .join('')
    .replace(/%20/g, '+');  // Space to +
  
  // Convert to lowercase
  const lowerString = encodedString.toLowerCase();
  
  // SHA256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(lowerString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex.toUpperCase();
}

// ECPay Payment interface
export interface ECPayPayment {
  id: string;
  user_id: string;
  user_email: string;
  user_name?: string; // Add user_name field
  payment_type: 'subscription' | 'deposit' | 'project';
  amount_usd: number;
  amount_twd: number;
  currency?: string; // Original currency
  original_amount?: number; // Original amount before conversion
  exchange_rate?: number; // Exchange rate used
  ecpay_transaction_id?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  notes?: string;
  screenshot_url?: string;
  plan?: string; // For subscription type
  created_at: string;
  confirmed_at?: string;
  confirmed_by?: string;
}

// Helper: Generate unique payment ID
function generatePaymentId(): string {
  return `ecpay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper: Get user from access token
async function getUserFromToken(accessToken: string | undefined) {
  if (!accessToken) {
    return { user: null, error: { message: 'No access token provided' } };
  }
  
  // 🧪 DEV MODE: Handle mock tokens (dev-user-*)
  if (accessToken.startsWith('dev-user-')) {
    console.log('[ECPay] Dev mode detected, creating mock user from token:', accessToken);
    
    // Extract email from the token format: "dev-user-{timestamp}||{email}"
    let mockEmail = 'admin@casewhr.com'; // Default to admin email
    if (accessToken.includes('||')) {
      const parts = accessToken.split('||');
      mockEmail = parts[1] || mockEmail;
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
    
    console.log('[ECPay] Mock user created:', { id: mockUser.id, email: mockUser.email });
    return { user: mockUser, error: null };
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    return { user, error };
  } catch (error) {
    console.error('[ECPay] Auth error:', error);
    return { user: null, error: { message: 'Invalid or expired token' } };
  }
}

// Helper: Get user profile by email
async function getUserByEmail(email: string) {
  try {
    // First get user_id from auth
    const { data: users, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('[ECPay] Error listing users:', authError);
      return null;
    }

    const authUser = users.users.find(u => u.email === email);
    if (!authUser) {
      console.error('[ECPay] User not found:', email);
      return null;
    }

    // Get profile from KV store (with backward compatibility)
    let profile = await kv.get(`profile_${authUser.id}`);
    if (!profile) {
      // Try old format
      profile = await kv.get(`profile:${authUser.id}`);
    }
    
    return {
      id: authUser.id,
      email: authUser.email || email,
      name: profile?.full_name || profile?.name || 'User',
    };
  } catch (error) {
    console.error('[ECPay] Error getting user:', error);
    return null;
  }
}

// Get all ECPay payments
export async function getAllPayments(): Promise<ECPayPayment[]> {
  try {
    const payments = await kv.getByPrefix('ecpay_payment:');
    // 🔧 修復：getByPrefix 已經返回 value 數組，不需要再 .map(p => p.value)
    console.log('[ECPay] Raw payments from KV:', payments.length);
    
    // 過濾掉 null 值並排序
    const validPayments = payments.filter(p => p != null);
    console.log('[ECPay] Valid payments after filtering:', validPayments.length);
    
    return validPayments.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error) {
    console.error('[ECPay] Error getting payments:', error);
    return [];
  }
}

// Get payment by ID
export async function getPaymentById(paymentId: string): Promise<ECPayPayment | null> {
  try {
    return await kv.get(`ecpay_payment:${paymentId}`);
  } catch (error) {
    console.error('[ECPay] Error getting payment:', error);
    return null;
  }
}

// Create new payment record
export async function createPayment(data: {
  user_email: string;
  payment_type: 'subscription' | 'deposit' | 'project';
  amount_twd: number;
  amount_usd: number;
  notes?: string;
  ecpay_transaction_id?: string;
  currency?: string; // Original currency
  original_amount?: number; // Original amount before conversion
  exchange_rate?: number; // Exchange rate used
  plan?: string; // For subscription type
}): Promise<{ success: boolean; payment?: ECPayPayment; error?: string }> {
  try {
    // Get user info
    const user = await getUserByEmail(data.user_email);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Create payment record
    const payment: ECPayPayment = {
      id: generatePaymentId(),
      user_id: user.id,
      user_email: user.email,
      user_name: user.name, // Add user_name field
      payment_type: data.payment_type,
      amount_twd: data.amount_twd,
      amount_usd: data.amount_usd,
      currency: data.currency,
      original_amount: data.original_amount,
      exchange_rate: data.exchange_rate,
      ecpay_transaction_id: data.ecpay_transaction_id,
      status: 'pending',
      notes: data.notes,
      plan: data.plan,
      created_at: new Date().toISOString(),
    };

    // Save to KV store
    await kv.set(`ecpay_payment:${payment.id}`, payment);
    
    // Save to user's payment list
    const userPayments = await kv.get(`ecpay_payments:user:${user.id}`) || [];
    userPayments.push(payment.id);
    await kv.set(`ecpay_payments:user:${user.id}`, userPayments);

    // Save to status list
    const pendingPayments = await kv.get('ecpay_payments:status:pending') || [];
    pendingPayments.push(payment.id);
    await kv.set('ecpay_payments:status:pending', pendingPayments);

    console.log('[ECPay] Payment created:', payment.id);
    return { success: true, payment };
  } catch (error) {
    console.error('[ECPay] Error creating payment:', error);
    return { success: false, error: 'Failed to create payment record' };
  }
}

// Process wallet deposit
async function processDeposit(payment: ECPayPayment): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[ECPay] Processing deposit for user ${payment.user_email}: $${payment.amount_usd}`);

    // Get user's wallet - Use underscore format for consistency with the rest of the platform
    let wallet = await kv.get(`wallet_${payment.user_id}`);
    
    if (!wallet) {
      // Create wallet if doesn't exist
      wallet = {
        user_id: payment.user_id,
        available_balance: 0,
        pending_withdrawal: 0,
        total_earned: 0,
        total_spent: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // Add deposit amount
    wallet.available_balance += payment.amount_usd;
    wallet.updated_at = new Date().toISOString();

    // Save updated wallet - Use underscore format
    await kv.set(`wallet_${payment.user_id}`, wallet);

    // Create transaction record
    const transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: payment.user_id,
      type: 'deposit',
      amount: payment.amount_usd,
      status: 'completed',
      description: `ECPay deposit - NT$${payment.amount_twd.toLocaleString()}`,
      created_at: new Date().toISOString(),
      payment_method: 'ecpay',
      ecpay_payment_id: payment.id,
    };

    await kv.set(`transaction:${transaction.id}`, transaction);

    // Add to user's transactions
    const userTransactions = await kv.get(`transactions:${payment.user_id}`) || [];
    userTransactions.unshift(transaction.id);
    await kv.set(`transactions:${payment.user_id}`, userTransactions);

    console.log(`[ECPay] Deposit processed successfully: $${payment.amount_usd}`);
    return { success: true };
  } catch (error) {
    console.error('[ECPay] Error processing deposit:', error);
    return { success: false, error: 'Failed to process deposit' };
  }
}

// Process subscription payment
async function processSubscription(payment: ECPayPayment): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[ECPay] Processing subscription for user ${payment.user_email}: NT$${payment.amount_twd}`);

    // Determine plan based on amount
    let plan = 'free';
    let duration = 'monthly';
    
    if (payment.amount_twd === 300 || payment.amount_usd === 9.9) {
      plan = 'professional';
      duration = 'monthly';
    } else if (payment.amount_twd === 3000 || payment.amount_usd === 99) {
      plan = 'professional';
      duration = 'yearly';
    } else if (payment.amount_twd === 900 || payment.amount_usd === 29) {
      plan = 'enterprise';
      duration = 'monthly';
    } else if (payment.amount_twd === 9000 || payment.amount_usd === 290) {
      plan = 'enterprise';
      duration = 'yearly';
    }

    // Get user's profile (with backward compatibility)
    let profile = await kv.get(`profile_${payment.user_id}`);
    if (!profile) {
      // Try old format
      profile = await kv.get(`profile:${payment.user_id}`);
    }
    
    if (!profile) {
      console.error('[ECPay] Profile not found for user:', payment.user_id);
      return { success: false, error: 'User profile not found' };
    }

    // Calculate subscription end date
    const now = new Date();
    const endDate = new Date(now);
    if (duration === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Update profile with subscription
    profile.membership_tier = plan;
    profile.subscription_end_date = endDate.toISOString();
    profile.subscription_status = 'active';
    profile.payment_method = 'ecpay';
    profile.updated_at = new Date().toISOString();

    // Save with new format
    await kv.set(`profile_${payment.user_id}`, profile);

    // Create membership record
    const membership = {
      id: `membership_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: payment.user_id,
      tier: plan,
      status: 'active',
      start_date: now.toISOString(),
      end_date: endDate.toISOString(),
      payment_method: 'ecpay',
      amount_paid: payment.amount_usd,
      currency: 'USD',
      ecpay_payment_id: payment.id,
      created_at: now.toISOString(),
    };

    await kv.set(`membership:${membership.id}`, membership);

    console.log(`[ECPay] Subscription processed: ${plan} (${duration})`);
    return { success: true };
  } catch (error) {
    console.error('[ECPay] Error processing subscription:', error);
    return { success: false, error: 'Failed to process subscription' };
  }
}

// Confirm payment and process
export async function confirmPayment(
  paymentId: string, 
  confirmedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get payment record
    const payment = await getPaymentById(paymentId);
    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    if (payment.status !== 'pending') {
      return { success: false, error: `Payment already ${payment.status}` };
    }

    // Process based on payment type
    let processResult;
    if (payment.payment_type === 'deposit') {
      processResult = await processDeposit(payment);
    } else if (payment.payment_type === 'subscription') {
      processResult = await processSubscription(payment);
    } else if (payment.payment_type === 'project') {
      // TODO: Implement project payment processing
      console.log('[ECPay] Project payment processing not yet implemented');
      processResult = { success: true };
    } else {
      return { success: false, error: 'Unknown payment type' };
    }

    if (!processResult.success) {
      return processResult;
    }

    // Update payment status
    payment.status = 'confirmed';
    payment.confirmed_at = new Date().toISOString();
    payment.confirmed_by = confirmedBy;

    await kv.set(`ecpay_payment:${payment.id}`, payment);

    // Update status lists
    const pendingPayments = await kv.get('ecpay_payments:status:pending') || [];
    const confirmedPayments = await kv.get('ecpay_payments:status:confirmed') || [];
    
    const updatedPending = pendingPayments.filter((id: string) => id !== payment.id);
    confirmedPayments.push(payment.id);
    
    await kv.set('ecpay_payments:status:pending', updatedPending);
    await kv.set('ecpay_payments:status:confirmed', confirmedPayments);

    console.log('[ECPay] Payment confirmed:', payment.id);
    return { success: true };
  } catch (error) {
    console.error('[ECPay] Error confirming payment:', error);
    return { success: false, error: 'Failed to confirm payment' };
  }
}

// Reject payment
export async function rejectPayment(paymentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const payment = await getPaymentById(paymentId);
    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    if (payment.status !== 'pending') {
      return { success: false, error: `Payment already ${payment.status}` };
    }

    // Update payment status
    payment.status = 'rejected';
    await kv.set(`ecpay_payment:${payment.id}`, payment);

    // Update status lists
    const pendingPayments = await kv.get('ecpay_payments:status:pending') || [];
    const rejectedPayments = await kv.get('ecpay_payments:status:rejected') || [];
    
    const updatedPending = pendingPayments.filter((id: string) => id !== payment.id);
    rejectedPayments.push(payment.id);
    
    await kv.set('ecpay_payments:status:pending', updatedPending);
    await kv.set('ecpay_payments:status:rejected', rejectedPayments);

    console.log('[ECPay] Payment rejected:', payment.id);
    return { success: true };
  } catch (error) {
    console.error('[ECPay] Error rejecting payment:', error);
    return { success: false, error: 'Failed to reject payment' };
  }
}

// Delete payment record
export async function deletePayment(paymentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const payment = await getPaymentById(paymentId);
    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    // Delete from KV store
    await kv.del(`ecpay_payment:${paymentId}`);

    // Remove from user's payment list
    const userPayments = await kv.get(`ecpay_payments:user:${payment.user_id}`) || [];
    const updatedUserPayments = userPayments.filter((id: string) => id !== paymentId);
    await kv.set(`ecpay_payments:user:${payment.user_id}`, updatedUserPayments);

    // Remove from status list
    const statusPayments = await kv.get(`ecpay_payments:status:${payment.status}`) || [];
    const updatedStatusPayments = statusPayments.filter((id: string) => id !== paymentId);
    await kv.set(`ecpay_payments:status:${payment.status}`, updatedStatusPayments);

    console.log('[ECPay] Payment deleted:', paymentId);
    return { success: true };
  } catch (error) {
    console.error('[ECPay] Error deleting payment:', error);
    return { success: false, error: 'Failed to delete payment' };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helper: Generate auto-submit HTML form
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function generateAutoSubmitForm(action: string, params: Record<string, any>): string {
  const formFields = Object.entries(params).map(([key, value]) => 
    `<input type="hidden" name="${key}" value="${value}">`
  ).join('\n      ');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Redirecting to ECPay...</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .loader {
      text-align: center;
      color: white;
    }
    .spinner {
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top: 4px solid white;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <p>正在跳轉到綠界付款頁面...</p>
    <p>Redirecting to ECPay...</p>
  </div>
  <form id="ecpayForm" action="${action}" method="post">
    ${formFields}
  </form>
  <script>
    document.getElementById('ecpayForm').submit();
  </script>
</body>
</html>`;
}

// Register ECPay API routes
export function registerECPayRoutes(app: any) {
  console.log('[ECPay] Registering ECPay payment routes...');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔧 ECPay Configuration Check Endpoint
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  app.get('/make-server-215f78a5/ecpay/config-check', async (c: Context) => {
    try {
      const configured = !!(
        ECPAY_CONFIG.merchantId &&
        ECPAY_CONFIG.hashKey &&
        ECPAY_CONFIG.hashIV
      );

      return c.json({
        configured,
        mode: ECPAY_CONFIG.mode,
        merchantId: ECPAY_CONFIG.merchantId ? '✅ Set' : '❌ Missing',
        hashKey: ECPAY_CONFIG.hashKey ? '✅ Set' : '❌ Missing',
        hashIV: ECPAY_CONFIG.hashIV ? '✅ Set' : '❌ Missing',
        apiUrl: ECPAY_CONFIG.apiUrl,
        callbackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/make-server-215f78a5/ecpay/callback`,
      });
    } catch (error: any) {
      console.error('[ECPay] Config check error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🆕 Create ECPay Order - 創建綠界訂單
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  app.post('/make-server-215f78a5/ecpay/create-order', async (c: Context) => {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);

    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      const body = await c.req.json();
      const { amount, payment_type = 'deposit', plan } = body;

      if (!amount || amount <= 0) {
        return c.json({ error: 'Invalid amount' }, 400);
      }

      // 轉換為 TWD（ECPay 只支持 TWD）
      const amountTWD = Math.round(amount);
      // ⭐ 使用統一匯率模組轉換為 USD
      const amountUSD = Math.round(toUSD(amount, 'TWD') * 100) / 100;

      // 檢查最低金額
      if (amountTWD < 300) {
        return c.json({ error: 'Minimum amount is NT$300' }, 400);
      }

      // 生成訂單編號
      const merchantTradeNo = `CW${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const tradeDate = new Date().toISOString().replace(/[-:]/g, '').substr(0, 14);

      // 建立付款記錄（pending 狀態）
      const paymentResult = await createPayment({
        user_email: user.email || '',
        payment_type: payment_type,
        amount_twd: amountTWD,
        amount_usd: amountUSD,
        notes: `ECPay Order: ${merchantTradeNo}`,
        ecpay_transaction_id: merchantTradeNo,
        plan: plan,
      });

      if (!paymentResult.success) {
        return c.json({ error: paymentResult.error }, 500);
      }

      // 準備 ECPay 表單參數
      // 🔧 修復：使用正確的 Supabase 生產環境 URL
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://bihplitfentxioxyjalb.supabase.co';
      const returnURL = `${supabaseUrl}/functions/v1/make-server-215f78a5/ecpay/callback`;
      const clientBackURL = `${c.req.header('origin') || 'https://casewhr.com'}/wallet?payment=success&provider=ecpay&orderId=${merchantTradeNo}`;

      console.log('[ECPay] Callback URLs configured:', {
        returnURL,
        clientBackURL,
        environment: Deno.env.get('ECPAY_MODE') || 'production'
      });

      const params: Record<string, any> = {
        MerchantID: ECPAY_CONFIG.merchantId,
        MerchantTradeNo: merchantTradeNo,
        MerchantTradeDate: tradeDate,
        PaymentType: 'aio',
        TotalAmount: amountTWD,
        TradeDesc: payment_type === 'subscription' ? 'Subscription Payment' : 'Wallet Deposit',
        ItemName: payment_type === 'subscription' ? `${plan} Plan` : `Wallet Deposit NT$${amountTWD}`,
        ReturnURL: returnURL, // ECPay 後台通知 URL
        ClientBackURL: clientBackURL, // 用戶支付後跳轉 URL
        ChoosePayment: 'Credit', // 信用卡
        EncryptType: 1,
        // 自定義位 - 儲存 user_id 和 payment_id
        CustomField1: user.id,
        CustomField2: paymentResult.payment?.id,
      };

      // 生成 CheckMacValue
      const checkMacValue = await generateCheckMacValue(params);
      params.CheckMacValue = checkMacValue;

      console.log('[ECPay] Order created:', {
        merchantTradeNo,
        amount: amountTWD,
        user: user.email,
        paymentId: paymentResult.payment?.id,
      });

      // 返回表單資料（前端需要用 POST 提交）
      return c.json({
        success: true,
        orderId: merchantTradeNo,
        paymentId: paymentResult.payment?.id,
        apiUrl: ECPAY_CONFIG.apiUrl,
        formData: params,
        // 或直接返回 HTML form（自動提交）
        autoSubmitForm: generateAutoSubmitForm(ECPAY_CONFIG.apiUrl, params),
      });
    } catch (error: any) {
      console.error('[ECPay] Error creating order:', error);
      return c.json({ error: error.message || 'Failed to create order' }, 500);
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🆕 ECPay Callback - 接收付款通知
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  app.post('/make-server-215f78a5/ecpay/callback', async (c: Context) => {
    try {
      const formData = await c.req.formData();
      const params: Record<string, any> = {};
      
      // 解析表單資料
      for (const [key, value] of formData.entries()) {
        params[key] = value;
      }

      console.log('[ECPay] Callback received:', {
        merchantTradeNo: params.MerchantTradeNo,
        tradeNo: params.TradeNo,
        rtnCode: params.RtnCode,
        amount: params.TradeAmt,
      });

      // 驗證 CheckMacValue
      const receivedCheckMac = params.CheckMacValue;
      const calculatedCheckMac = await generateCheckMacValue(params);

      if (receivedCheckMac !== calculatedCheckMac) {
        console.error('[ECPay] CheckMacValue verification failed');
        return c.text('0|CheckMacValue error');
      }

      // 檢查付款狀態
      if (params.RtnCode !== '1') {
        console.error('[ECPay] Payment failed:', params.RtnMsg);
        
        // 更新付款記錄為失敗
        const paymentId = params.CustomField2;
        if (paymentId) {
          const payment = await getPaymentById(paymentId);
          if (payment) {
            await rejectPayment(paymentId);
          }
        }
        
        return c.text('0|Payment failed');
      }

      // 付款成功 - 自動確認並更新錢包
      const userId = params.CustomField1;
      const paymentId = params.CustomField2;
      const merchantTradeNo = params.MerchantTradeNo;

      console.log('[ECPay] Payment successful:', {
        userId,
        paymentId,
        merchantTradeNo,
        amount: params.TradeAmt,
      });

      // 確認款
      if (paymentId) {
        const result = await confirmPayment(paymentId, 'ECPay Auto Confirm');
        
        if (result.success) {
          console.log('[ECPay] Payment confirmed and wallet updated:', paymentId);
        } else {
          console.error('[ECPay] Failed to confirm payment:', result.error);
        }
      } else {
        console.warn('[ECPay] No payment ID found in callback');
      }

      // 返回成功給 ECPay
      return c.text('1|OK');
    } catch (error: any) {
      console.error('[ECPay] Callback error:', error);
      return c.text('0|Exception: ' + error.message);
    }
  });

  // User: Submit payment (User can submit their own payment)
  app.post('/make-server-215f78a5/ecpay-payments/submit', async (c: Context) => {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);

    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      const body = await c.req.json();
      
      // Use the authenticated user's email
      const result = await createPayment({
        ...body,
        user_email: user.email || body.user_email,
      });

      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      console.log('[ECPay] User submitted payment:', user.email);
      
      // TODO: Send notification email to admin
      
      return c.json({ payment: result.payment });
    } catch (error) {
      console.error('[ECPay API] Error submitting payment:', error);
      return c.json({ error: 'Failed to submit payment' }, 500);
    }
  });

  // User: Get my payments
  app.get('/make-server-215f78a5/ecpay-payments/my-payments', async (c: Context) => {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);

    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      // Get user's payment IDs
      const paymentIds = await kv.get(`ecpay_payments:user:${user.id}`) || [];
      
      // Get all payments
      const payments: ECPayPayment[] = [];
      for (const id of paymentIds) {
        const payment = await kv.get(`ecpay_payment:${id}`);
        if (payment) {
          payments.push(payment);
        }
      }

      // Sort by created_at (newest first)
      payments.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return c.json({ payments });
    } catch (error) {
      console.error('[ECPay API] Error getting user payments:', error);
      return c.json({ error: 'Failed to get payments' }, 500);
    }
  });

  // Get payments (支持按狀態和用戶篩選)
  app.get('/make-server-215f78a5/ecpay-payments', async (c: Context) => {
    const accessToken = c.req.header('X-Dev-Token') || c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);

    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      const status = c.req.query('status'); // pending, confirmed, rejected
      const userEmail = c.req.query('userEmail');

      let payments: ECPayPayment[] = [];

      if (userEmail) {
        // Get specific user's payments
        const userPaymentIds = await kv.get(`ecpay_payments:user:${user.id}`) || [];
        for (const id of userPaymentIds) {
          const payment = await kv.get(`ecpay_payment:${id}`);
          if (payment && payment.user_email === userEmail) {
            payments.push(payment);
          }
        }
      } else {
        // Get all user's payments
        const userPaymentIds = await kv.get(`ecpay_payments:user:${user.id}`) || [];
        for (const id of userPaymentIds) {
          const payment = await kv.get(`ecpay_payment:${id}`);
          if (payment) {
            payments.push(payment);
          }
        }
      }

      // Filter by status if provided
      if (status) {
        payments = payments.filter(p => p.status === status);
      }

      // Sort by created_at (newest first)
      payments.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return c.json({ payments });
    } catch (error) {
      console.error('[ECPay API] Error getting payments:', error);
      return c.json({ error: 'Failed to get payments' }, 500);
    }
  });

  // Get payment by order ID
  app.get('/make-server-215f78a5/ecpay-payments/by-order/:orderId', async (c: Context) => {
    const accessToken = c.req.header('X-Dev-Token') || c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);

    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      const orderId = c.req.param('orderId');
      
      // Search for payment with this ECPay transaction ID
      const allPayments = await kv.getByPrefix('ecpay_payment:');
      const payment = allPayments.find(p => 
        p && p.ecpay_transaction_id === orderId && p.user_id === user.id
      );

      if (!payment) {
        return c.json({ error: 'Payment not found' }, 404);
      }

      return c.json({ payment });
    } catch (error) {
      console.error('[ECPay API] Error getting payment by order ID:', error);
      return c.json({ error: 'Failed to get payment' }, 500);
    }
  });

  // User confirm their own payment
  app.post('/make-server-215f78a5/ecpay-payments/:id/confirm', async (c: Context) => {
    const accessToken = c.req.header('X-Dev-Token') || c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);

    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const paymentId = c.req.param('id');
    
    try {
      // Verify user owns this payment
      const payment = await getPaymentById(paymentId);
      if (!payment) {
        return c.json({ error: 'Payment not found' }, 404);
      }

      if (payment.user_id !== user.id) {
        return c.json({ error: 'Forbidden' }, 403);
      }

      const result = await confirmPayment(paymentId, `User self-confirm: ${user.email}`);

      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json({ 
        success: true,
        payment: await getPaymentById(paymentId)
      });
    } catch (error) {
      console.error('[ECPay API] Error confirming payment:', error);
      return c.json({ error: 'Failed to confirm payment' }, 500);
    }
  });

  // Get all payments (Admin only)
  app.get('/make-server-215f78a5/admin/ecpay-payments', async (c: Context) => {
    // 🧪 支持 dev mode: 優先檢查 X-Dev-Token
    let accessToken = c.req.header('X-Dev-Token') || c.req.header('Authorization')?.split(' ')[1];
    
    console.log('[ECPay API] GET /admin/ecpay-payments request:', {
      hasDevToken: !!c.req.header('X-Dev-Token'),
      hasAuthHeader: !!c.req.header('Authorization'),
      tokenPrefix: accessToken?.substring(0, 20) + '...'
    });
    
    const { user, error } = await getUserFromToken(accessToken);

    if (!user || error) {
      console.error('[ECPay API] Auth failed:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[ECPay API] User authenticated:', { id: user.id, email: user.email });

    // TODO: Check if user is admin
    // For now, allow all authenticated users
    
    try {
      const payments = await getAllPayments();
      console.log('[ECPay API] Payments retrieved:', payments.length);
      return c.json({ payments });
    } catch (error) {
      console.error('[ECPay API] Error getting payments:', error);
      return c.json({ error: 'Failed to get payments' }, 500);
    }
  });

  // Create new payment record (Admin only)
  app.post('/make-server-215f78a5/admin/ecpay-payments', async (c: Context) => {
    // 🧪 支持 dev mode: 優先檢查 X-Dev-Token
    let accessToken = c.req.header('X-Dev-Token') || c.req.header('Authorization')?.split(' ')[1];
    
    console.log('[ECPay API] POST /admin/ecpay-payments request:', {
      hasDevToken: !!c.req.header('X-Dev-Token'),
      hasAuthHeader: !!c.req.header('Authorization'),
      tokenPrefix: accessToken?.substring(0, 20) + '...'
    });
    
    const { user, error } = await getUserFromToken(accessToken);

    if (!user || error) {
      console.error('[ECPay API] Auth failed:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[ECPay API] User authenticated:', { id: user.id, email: user.email });

    try {
      const body = await c.req.json();
      const result = await createPayment(body);

      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json({ payment: result.payment });
    } catch (error) {
      console.error('[ECPay API] Error creating payment:', error);
      return c.json({ error: 'Failed to create payment' }, 500);
    }
  });

  // Confirm payment (Admin only)
  app.post('/make-server-215f78a5/admin/ecpay-payments/:id/confirm', async (c: Context) => {
    // 🧪 支持 dev mode: 優先檢查 X-Dev-Token
    let accessToken = c.req.header('X-Dev-Token') || c.req.header('Authorization')?.split(' ')[1];
    
    console.log('[ECPay API] POST /admin/ecpay-payments/:id/confirm request:', {
      hasDevToken: !!c.req.header('X-Dev-Token'),
      hasAuthHeader: !!c.req.header('Authorization'),
      tokenPrefix: accessToken?.substring(0, 20) + '...'
    });
    
    const { user, error } = await getUserFromToken(accessToken);

    if (!user || error) {
      console.error('[ECPay API] Auth failed:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[ECPay API] User authenticated:', { id: user.id, email: user.email });

    const paymentId = c.req.param('id');
    
    try {
      const result = await confirmPayment(paymentId, user.email || user.id);

      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      // TODO: Send confirmation email to user

      return c.json({ success: true });
    } catch (error) {
      console.error('[ECPay API] Error confirming payment:', error);
      return c.json({ error: 'Failed to confirm payment' }, 500);
    }
  });

  // Reject payment (Admin only)
  app.post('/make-server-215f78a5/admin/ecpay-payments/:id/reject', async (c: Context) => {
    // 🧪 支持 dev mode: 優先檢查 X-Dev-Token
    let accessToken = c.req.header('X-Dev-Token') || c.req.header('Authorization')?.split(' ')[1];
    
    console.log('[ECPay API] POST /admin/ecpay-payments/:id/reject request:', {
      hasDevToken: !!c.req.header('X-Dev-Token'),
      hasAuthHeader: !!c.req.header('Authorization'),
      tokenPrefix: accessToken?.substring(0, 20) + '...'
    });
    
    const { user, error } = await getUserFromToken(accessToken);

    if (!user || error) {
      console.error('[ECPay API] Auth failed:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[ECPay API] User authenticated:', { id: user.id, email: user.email });

    const paymentId = c.req.param('id');
    
    try {
      const result = await rejectPayment(paymentId);

      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      // TODO: Send rejection email to user

      return c.json({ success: true });
    } catch (error) {
      console.error('[ECPay API] Error rejecting payment:', error);
      return c.json({ error: 'Failed to reject payment' }, 500);
    }
  });

  // Delete payment (Admin only)
  app.delete('/make-server-215f78a5/admin/ecpay-payments/:id', async (c: Context) => {
    // 🧪 支持 dev mode: 優先檢查 X-Dev-Token
    let accessToken = c.req.header('X-Dev-Token') || c.req.header('Authorization')?.split(' ')[1];
    
    console.log('[ECPay API] DELETE /admin/ecpay-payments/:id request:', {
      hasDevToken: !!c.req.header('X-Dev-Token'),
      hasAuthHeader: !!c.req.header('Authorization'),
      tokenPrefix: accessToken?.substring(0, 20) + '...'
    });
    
    const { user, error } = await getUserFromToken(accessToken);

    if (!user || error) {
      console.error('[ECPay API] Auth failed:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('[ECPay API] User authenticated:', { id: user.id, email: user.email });

    const paymentId = c.req.param('id');
    
    try {
      const result = await deletePayment(paymentId);

      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json({ success: true });
    } catch (error) {
      console.error('[ECPay API] Error deleting payment:', error);
      return c.json({ error: 'Failed to delete payment' }, 500);
    }
  });

  console.log('[ECPay] Routes registered successfully');
}