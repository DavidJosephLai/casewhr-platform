/**
 * 🔄 訂閱制定期扣款服務
 * Subscription Recurring Payment Service
 * 
 * 支援 PayPal 和 ECPay 的定期扣款功能
 * Supports recurring payments via PayPal and ECPay
 */

import * as kv from './kv_store.tsx';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import * as emailService from './email_service.tsx';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💳 PayPal 訂閱 API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PAYPAL_CLIENT_ID = (Deno.env.get('PAYPAL_CLIENT_ID') || '').trim();
const PAYPAL_CLIENT_SECRET = (Deno.env.get('PAYPAL_CLIENT_SECRET') || '').trim();
const PAYPAL_MODE = (Deno.env.get('PAYPAL_MODE') || 'live').trim();

const PAYPAL_API_BASE = PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

/**
 * 獲取 PayPal Access Token
 */
async function getPayPalAccessToken(): Promise<string> {
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * 創建 PayPal 訂閱方案 (Product & Plan)
 * 
 * @param planType - 'pro' | 'enterprise'
 * @returns Plan ID
 */
export async function createPayPalSubscriptionPlan(planType: 'pro' | 'enterprise'): Promise<string> {
  const accessToken = await getPayPalAccessToken();

  // 1. 創建產品 (Product)
  const productData = {
    name: planType === 'pro' ? 'Case Where Pro Subscription' : 'Case Where Enterprise Subscription',
    description: planType === 'pro' 
      ? 'Monthly Pro subscription for Case Where platform'
      : 'Monthly Enterprise subscription for Case Where platform',
    type: 'SERVICE',
    category: 'SOFTWARE',
  };

  const productResponse = await fetch(`${PAYPAL_API_BASE}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productData),
  });

  if (!productResponse.ok) {
    const error = await productResponse.text();
    console.error('❌ [PayPal] Failed to create product:', error);
    throw new Error('Failed to create PayPal product');
  }

  const product = await productResponse.json();
  const productId = product.id;

  console.log(`✅ [PayPal] Product created: ${productId}`);

  // 2. 創建訂閱方案 (Billing Plan)
  const planPrice = planType === 'pro' ? '15.00' : '45.00';
  
  const planData = {
    product_id: productId,
    name: `${planType === 'pro' ? 'Pro' : 'Enterprise'} Monthly Plan`,
    description: `Monthly subscription plan for ${planType === 'pro' ? 'Pro' : 'Enterprise'} tier`,
    billing_cycles: [
      {
        frequency: {
          interval_unit: 'MONTH',
          interval_count: 1,
        },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0, // 0 = infinite
        pricing_scheme: {
          fixed_price: {
            value: planPrice,
            currency_code: 'USD',
          },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: {
        value: '0.00',
        currency_code: 'USD',
      },
      setup_fee_failure_action: 'CONTINUE',
      payment_failure_threshold: 3,
    },
  };

  const planResponse = await fetch(`${PAYPAL_API_BASE}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(planData),
  });

  if (!planResponse.ok) {
    const error = await planResponse.text();
    console.error('❌ [PayPal] Failed to create billing plan:', error);
    throw new Error('Failed to create PayPal billing plan');
  }

  const plan = await planResponse.json();
  const planId = plan.id;

  console.log(`✅ [PayPal] Billing plan created: ${planId}`);

  // 3. 保存 Plan ID 到 KV
  await kv.set(`paypal_plan_${planType}`, planId);

  return planId;
}

/**
 * 創建 PayPal 訂閱
 * 
 * @param userId - 用戶 ID
 * @param planType - 'pro' | 'enterprise'
 * @param returnUrl - 訂閱成功返回 URL
 * @param cancelUrl - 訂閱取消返回 URL
 * @returns Subscription ID and approval URL
 */
export async function createPayPalSubscription(
  userId: string,
  planType: 'pro' | 'enterprise',
  returnUrl: string,
  cancelUrl: string
): Promise<{ subscriptionId: string; approvalUrl: string }> {
  const accessToken = await getPayPalAccessToken();

  // 獲取或創建 Plan ID
  let planId = await kv.get(`paypal_plan_${planType}`);
  
  if (!planId) {
    console.log(`📋 [PayPal] Plan not found for ${planType}, creating new plan...`);
    planId = await createPayPalSubscriptionPlan(planType);
  }

  // 創建訂閱
  const subscriptionData = {
    plan_id: planId,
    application_context: {
      brand_name: 'Case Where',
      locale: 'en-US',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'SUBSCRIBE_NOW',
      payment_method: {
        payer_selected: 'PAYPAL',
        payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
      },
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(subscriptionData),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ [PayPal] Failed to create subscription:', error);
    throw new Error('Failed to create PayPal subscription');
  }

  const subscription = await response.json();
  const subscriptionId = subscription.id;

  // 找到 approval URL
  const approvalLink = subscription.links.find((link: any) => link.rel === 'approve');
  if (!approvalLink) {
    throw new Error('No approval URL found in PayPal response');
  }

  // 保存訂閱信息到 KV (pending 狀態)
  await kv.set(`paypal_subscription_pending_${subscriptionId}`, {
    subscription_id: subscriptionId,
    user_id: userId,
    plan_type: planType,
    status: 'APPROVAL_PENDING',
    created_at: new Date().toISOString(),
  });

  console.log(`✅ [PayPal] Subscription created: ${subscriptionId}`);

  return {
    subscriptionId,
    approvalUrl: approvalLink.href,
  };
}

/**
 * 啟動 PayPal 訂閱 (用戶批准後調用)
 * 
 * @param subscriptionId - PayPal 訂閱 ID
 */
export async function activatePayPalSubscription(subscriptionId: string): Promise<void> {
  const accessToken = await getPayPalAccessToken();

  // 獲取訂閱詳情
  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal subscription details');
  }

  const subscription = await response.json();

  // 獲取 pending 信息
  const pendingData = await kv.get(`paypal_subscription_pending_${subscriptionId}`);
  if (!pendingData) {
    throw new Error('Subscription pending data not found');
  }

  const { user_id, plan_type } = pendingData;

  // 更新用戶訂閱狀態
  const userSubscription = {
    user_id,
    plan: plan_type,
    status: 'active',
    payment_method: 'paypal',
    paypal_subscription_id: subscriptionId,
    billing_cycle: 'monthly',
    start_date: new Date().toISOString(),
    next_billing_date: subscription.billing_info?.next_billing_time || null,
    auto_renew: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await kv.set(`subscription_${user_id}`, userSubscription);

  // 刪除 pending 數據
  await kv.del(`paypal_subscription_pending_${subscriptionId}`);

  // 保存訂閱 ID 映射 (用於 webhook)
  await kv.set(`paypal_subscription_${subscriptionId}`, {
    user_id,
    plan_type,
    subscription_id: subscriptionId,
  });

  console.log(`✅ [PayPal] Subscription activated for user ${user_id}`);

  // 發送確認郵件
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: userData } = await supabase.auth.admin.getUserById(user_id);
  
  if (userData?.user?.email) {
    await emailService.sendEmail({
      to: userData.user.email,
      subject: 'Subscription Activated - Case Where',
      html: `
        <h2>🎉 Your ${plan_type.toUpperCase()} subscription is now active!</h2>
        <p>Thank you for subscribing to Case Where ${plan_type === 'pro' ? 'Pro' : 'Enterprise'}.</p>
        <p><strong>Subscription Details:</strong></p>
        <ul>
          <li>Plan: ${plan_type === 'pro' ? 'Pro' : 'Enterprise'}</li>
          <li>Billing Cycle: Monthly</li>
          <li>Next Billing Date: ${subscription.billing_info?.next_billing_time ? new Date(subscription.billing_info.next_billing_time).toLocaleDateString() : 'N/A'}</li>
        </ul>
        <p>You can manage your subscription anytime from your dashboard.</p>
      `,
    });
  }
}

/**
 * 取消 PayPal 訂閱
 * 
 * @param userId - 用戶 ID
 * @param reason - 取消原因
 */
export async function cancelPayPalSubscription(userId: string, reason?: string): Promise<void> {
  // 獲取用戶訂閱
  const userSubscription = await kv.get(`subscription_${userId}`);
  if (!userSubscription || userSubscription.payment_method !== 'paypal') {
    throw new Error('No PayPal subscription found for this user');
  }

  const subscriptionId = userSubscription.paypal_subscription_id;
  if (!subscriptionId) {
    throw new Error('PayPal subscription ID not found');
  }

  const accessToken = await getPayPalAccessToken();

  // 取消訂閱
  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason: reason || 'Customer requested cancellation',
    }),
  });

  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    console.error('❌ [PayPal] Failed to cancel subscription:', error);
    throw new Error('Failed to cancel PayPal subscription');
  }

  // 更新本地訂閱狀態
  userSubscription.status = 'cancelled';
  userSubscription.cancelled_at = new Date().toISOString();
  userSubscription.auto_renew = false;
  userSubscription.updated_at = new Date().toISOString();

  await kv.set(`subscription_${userId}`, userSubscription);

  console.log(`✅ [PayPal] Subscription cancelled for user ${userId}`);

  // 發送取消確認郵件
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  
  if (userData?.user?.email) {
    await emailService.sendEmail({
      to: userData.user.email,
      subject: 'Subscription Cancelled - Case Where',
      html: `
        <h2>Subscription Cancelled</h2>
        <p>Your Case Where subscription has been cancelled.</p>
        <p>You will continue to have access to your current plan until the end of your billing period.</p>
        <p>We're sorry to see you go! If you have any feedback, please let us know.</p>
      `,
    });
  }
}

/**
 * 處理 PayPal Webhook 事件
 * 
 * @param event - PayPal webhook 事件
 */
export async function handlePayPalWebhook(event: any): Promise<void> {
  const eventType = event.event_type;
  const resource = event.resource;

  console.log(`🔔 [PayPal Webhook] Received event: ${eventType}`);

  switch (eventType) {
    case 'BILLING.SUBSCRIPTION.ACTIVATED':
      // 訂閱啟動
      await activatePayPalSubscription(resource.id);
      break;

    case 'BILLING.SUBSCRIPTION.CANCELLED':
    case 'BILLING.SUBSCRIPTION.SUSPENDED':
    case 'BILLING.SUBSCRIPTION.EXPIRED':
      // 訂閱取消/暫停/過期
      const subscriptionMapping = await kv.get(`paypal_subscription_${resource.id}`);
      if (subscriptionMapping) {
        const { user_id } = subscriptionMapping;
        const userSubscription = await kv.get(`subscription_${user_id}`);
        
        if (userSubscription) {
          userSubscription.status = eventType.includes('CANCELLED') ? 'cancelled' : 'suspended';
          userSubscription.updated_at = new Date().toISOString();
          await kv.set(`subscription_${user_id}`, userSubscription);
        }
      }
      break;

    case 'PAYMENT.SALE.COMPLETED':
      // 付款成功（定期扣款）
      console.log('💰 [PayPal] Recurring payment completed:', resource.id);
      
      // 更新下次扣款日期
      const billingAgreementId = resource.billing_agreement_id;
      if (billingAgreementId) {
        const mapping = await kv.get(`paypal_subscription_${billingAgreementId}`);
        if (mapping) {
          const { user_id } = mapping;
          const subscription = await kv.get(`subscription_${user_id}`);
          
          if (subscription) {
            // 計算下次扣款日期（30天後）
            const nextBillingDate = new Date();
            nextBillingDate.setDate(nextBillingDate.getDate() + 30);
            
            subscription.next_billing_date = nextBillingDate.toISOString();
            subscription.last_payment_date = new Date().toISOString();
            subscription.updated_at = new Date().toISOString();
            
            await kv.set(`subscription_${user_id}`, subscription);
          }
        }
      }
      break;

    case 'PAYMENT.SALE.DENIED':
    case 'PAYMENT.SALE.REFUNDED':
      // 付款失敗或退款
      console.error('❌ [PayPal] Payment failed or refunded:', resource.id);
      // TODO: 通知用戶更新付款方式
      break;

    default:
      console.log(`ℹ️ [PayPal Webhook] Unhandled event type: ${eventType}`);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💳 ECPay 定期定額 API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ECPAY_MERCHANT_ID = Deno.env.get('ECPAY_MERCHANT_ID') || '';
const ECPAY_HASH_KEY = Deno.env.get('ECPAY_HASH_KEY') || '';
const ECPAY_HASH_IV = Deno.env.get('ECPAY_HASH_IV') || '';
const ECPAY_MODE = Deno.env.get('ECPAY_MODE') || 'production';

const ECPAY_API_BASE = ECPAY_MODE === 'production'
  ? 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5'
  : 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5';

/**
 * 生成 ECPay 檢查碼
 * ⚠️ CRITICAL: ECPay 使用 MD5 (EncryptType=1) 或 SHA256 (EncryptType=0)
 */
async function generateECPayCheckMacValue(params: Record<string, any>): Promise<string> {
  // 1. 移除 CheckMacValue（如果存在）
  const cleanParams = { ...params };
  delete cleanParams.CheckMacValue;
  
  // 2. 參數按照 ASCII 排序
  const sortedKeys = Object.keys(cleanParams).sort();
  
  // 3. 組合字串：HashKey + 參數 + HashIV
  let checkValue = `HashKey=${ECPAY_HASH_KEY}`;
  sortedKeys.forEach(key => {
    checkValue += `&${key}=${cleanParams[key]}`;
  });
  checkValue += `&HashIV=${ECPAY_HASH_IV}`;
  
  // 4. URL encode
  checkValue = encodeURIComponent(checkValue);
  
  // 5. 轉小寫
  checkValue = checkValue.toLowerCase();
  
  // 6. 替換特殊字符（ECPay 特殊要求）
  checkValue = checkValue
    .replace(/%2d/g, '-')
    .replace(/%5f/g, '_')
    .replace(/%2e/g, '.')
    .replace(/%21/g, '!')
    .replace(/%2a/g, '*')
    .replace(/%28/g, '(')
    .replace(/%29/g, ')');
  
  // 7. 根據 EncryptType 選擇加密方式
  const encryptType = cleanParams.EncryptType || '1'; // 預設為 1 (MD5)
  
  console.log('🔐 [ECPay] Generating CheckMacValue:', {
    encryptType,
    checkValueLength: checkValue.length,
    hashKey: ECPAY_HASH_KEY ? '✅ Set' : '❌ Missing',
    hashIV: ECPAY_HASH_IV ? '✅ Set' : '❌ Missing'
  });
  
  if (encryptType === '1') {
    // MD5 加密 - 使用 Node.js crypto module
    const { createHash } = await import('node:crypto');
    const hash = createHash('md5').update(checkValue).digest('hex');
    return hash.toUpperCase();
  } else {
    // SHA256 加密 (EncryptType = 0)
    const encoder = new TextEncoder();
    const data = encoder.encode(checkValue);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }
}

/**
 * 驗證 ECPay 檢查碼
 */
async function verifyECPayCheckMacValue(params: Record<string, any>): Promise<boolean> {
  const receivedCheckMac = params.CheckMacValue;
  if (!receivedCheckMac) {
    console.error('❌ [ECPay] No CheckMacValue in callback');
    return false;
  }
  
  const calculatedCheckMac = await generateECPayCheckMacValue(params);
  const isValid = receivedCheckMac.toUpperCase() === calculatedCheckMac.toUpperCase();
  
  if (!isValid) {
    console.error('❌ [ECPay] CheckMacValue verification failed', {
      received: receivedCheckMac,
      calculated: calculatedCheckMac
    });
  }
  
  return isValid;
}

/**
 * 創建 ECPay 定期定額訂閱
 * 
 * @param userId - 用戶 ID
 * @param planType - 'pro' | 'enterprise'
 * @param email - 用戶 Email
 * @returns HTML form for redirecting to ECPay
 */
export async function createECPaySubscription(
  userId: string,
  planType: 'pro' | 'enterprise',
  email: string,
  returnUrl: string
): Promise<string> {
  const amount = planType === 'pro' ? 480 : 1400; // TWD
  const tradeNo = `SUB${Date.now()}${Math.random().toString(36).substring(2, 9)}`;
  
  // ⚠️ PeriodReturnURL 必須使用完整的 Supabase Function URL（正式環境）
  const periodReturnURL = 'https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/ecpay-period-callback';
  
  const params = {
    MerchantID: ECPAY_MERCHANT_ID,
    MerchantTradeNo: tradeNo,
    MerchantTradeDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
    PaymentType: 'aio',
    TotalAmount: amount.toString(),
    TradeDesc: `Case Where ${planType === 'pro' ? 'Pro' : 'Enterprise'} Subscription`,
    ItemName: `${planType === 'pro' ? 'Pro' : 'Enterprise'} Monthly Plan`,
    ReturnURL: returnUrl,
    ChoosePayment: 'Credit',
    EncryptType: '1',
    // 定期定額參數
    PeriodAmount: amount.toString(),
    PeriodType: 'M', // M = 月
    Frequency: '1', // 每1個月
    ExecTimes: '12', // 執行12次（1年）- 可改為 0 表示無限制
    PeriodReturnURL: periodReturnURL,  // ✅ 使用完整 URL
  };
  
  // 生成檢查碼
  const checkMacValue = await generateECPayCheckMacValue(params);
  
  // 保存訂閱信息
  await kv.set(`ecpay_subscription_pending_${tradeNo}`, {
    trade_no: tradeNo,
    user_id: userId,
    plan_type: planType,
    amount,
    email,
    status: 'PENDING',
    created_at: new Date().toISOString(),
  });
  
  // 生成 HTML form
  const formHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Redirecting to ECPay...</title>
    </head>
    <body>
      <form id="ecpayForm" method="post" action="${ECPAY_API_BASE}">
        ${Object.entries({ ...params, CheckMacValue: checkMacValue }).map(([key, value]) => 
          `<input type="hidden" name="${key}" value="${value}">`
        ).join('\n')}
      </form>
      <script>
        document.getElementById('ecpayForm').submit();
      </script>
    </body>
    </html>
  `;
  
  return formHtml;
}

/**
 * 處理 ECPay 定期定額回調
 */
export async function handleECPayPeriodCallback(params: Record<string, any>): Promise<void> {
  const { MerchantTradeNo, RtnCode, RtnMsg, PeriodType, Frequency, ExecTimes, PeriodNo } = params;
  
  console.log(`🔔 [ECPay Period] Callback received for ${MerchantTradeNo}`);
  console.log('📦 [ECPay Period] Callback params:', JSON.stringify(params, null, 2));
  
  // ✅ 驗證 CheckMacValue
  const isValid = await verifyECPayCheckMacValue(params);
  if (!isValid) {
    console.error('❌ [ECPay Period] CheckMacValue verification failed - possible security breach!');
    throw new Error('Invalid CheckMacValue');
  }
  
  console.log('✅ [ECPay Period] CheckMacValue verified successfully');
  
  if (RtnCode === '1') {
    // 付款成功
    const pendingData = await kv.get(`ecpay_subscription_pending_${MerchantTradeNo}`);
    
    if (pendingData) {
      const { user_id, plan_type, amount } = pendingData;
      
      // 首次訂�� - 創建訂閱記錄
      if (!PeriodNo || PeriodNo === '0') {
        const userSubscription = {
          user_id,
          plan: plan_type,
          status: 'active',
          payment_method: 'ecpay',
          ecpay_trade_no: MerchantTradeNo,
          billing_cycle: 'monthly',
          amount,
          start_date: new Date().toISOString(),
          next_billing_date: (() => {
            const next = new Date();
            next.setMonth(next.getMonth() + 1);
            return next.toISOString();
          })(),
          auto_renew: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        await kv.set(`subscription_${user_id}`, userSubscription);
        await kv.del(`ecpay_subscription_pending_${MerchantTradeNo}`);
        
        console.log(`✅ [ECPay] Subscription activated for user ${user_id}`);
      } else {
        // 定期扣款 - 更新訂閱記錄
        const subscription = await kv.get(`subscription_${user_id}`);
        
        if (subscription) {
          subscription.last_payment_date = new Date().toISOString();
          
          // 計算下次扣款日期
          const nextBillingDate = new Date();
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
          subscription.next_billing_date = nextBillingDate.toISOString();
          subscription.updated_at = new Date().toISOString();
          
          await kv.set(`subscription_${user_id}`, subscription);
          
          console.log(`✅ [ECPay] Recurring payment processed for user ${user_id}, period ${PeriodNo}`);
        }
      }
      
      // 發送確認郵件
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const { data: userData } = await supabase.auth.admin.getUserById(user_id);
      
      if (userData?.user?.email) {
        await emailService.sendEmail({
          to: userData.user.email,
          subject: PeriodNo === '0' ? 'Subscription Activated - Case Where' : 'Payment Successful - Case Where',
          html: `
            <h2>${PeriodNo === '0' ? '🎉 Your subscription is now active!' : '💳 Payment Successful'}</h2>
            <p>Your payment of NT$${amount.toLocaleString()} has been processed successfully.</p>
            ${PeriodNo === '0' ? `
              <p><strong>Subscription Details:</strong></p>
              <ul>
                <li>Plan: ${plan_type === 'pro' ? 'Pro' : 'Enterprise'}</li>
                <li>Billing Cycle: Monthly</li>
                <li>Amount: NT$${amount.toLocaleString()}</li>
              </ul>
            ` : `
              <p>This is your recurring payment for period ${PeriodNo}.</p>
            `}
            <p>You can manage your subscription anytime from your dashboard.</p>
          `,
        });
      }
    }
  } else {
    console.error(`❌ [ECPay Period] Payment failed: ${RtnMsg}`);
    // TODO: 通知用戶付款失敗
  }
}

/**
 * 取消 ECPay 訂閱
 * 注意：ECPay 定期定額無法從商家端直接取消，需要通知用戶從信用卡銀行端取消
 */
export async function cancelECPaySubscription(userId: string): Promise<void> {
  const userSubscription = await kv.get(`subscription_${userId}`);
  
  if (!userSubscription || userSubscription.payment_method !== 'ecpay') {
    throw new Error('No ECPay subscription found for this user');
  }
  
  // 更新本地訂閱狀態
  userSubscription.status = 'cancelled';
  userSubscription.cancelled_at = new Date().toISOString();
  userSubscription.auto_renew = false;
  userSubscription.updated_at = new Date().toISOString();
  
  await kv.set(`subscription_${userId}`, userSubscription);
  
  console.log(`✅ [ECPay] Subscription marked as cancelled for user ${userId}`);
  
  // 發送取消確認郵件（含取消指引）
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  
  if (userData?.user?.email) {
    await emailService.sendEmail({
      to: userData.user.email,
      subject: 'Subscription Cancellation - Case Where',
      html: `
        <h2>Subscription Cancellation Request Received</h2>
        <p>We have received your request to cancel your Case Where subscription.</p>
        
        <p><strong>⚠️ Important: Complete Cancellation Steps</strong></p>
        <p>To fully stop recurring payments, please also cancel the automatic payment authorization with your credit card bank:</p>
        
        <ol>
          <li>Contact your credit card issuing bank</li>
          <li>Request to cancel the recurring payment for "ECPay - Case Where"</li>
          <li>Reference your credit card statement for the merchant name</li>
        </ol>
        
        <p>Your current subscription will remain active until the end of your billing period.</p>
        
        <p>If you have any questions, please contact our support team.</p>
      `,
    });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 訂閱管理通用函數
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 獲取用戶訂閱狀態
 */
export async function getUserSubscription(userId: string): Promise<any> {
  const subscription = await kv.get(`subscription_${userId}`);
  
  if (!subscription) {
    return {
      plan: 'free',
      status: 'active',
      payment_method: null,
      auto_renew: false,
    };
  }
  
  return subscription;
}

/**
 * 檢查訂閱是否有效
 */
export function isSubscriptionActive(subscription: any): boolean {
  if (!subscription) return false;
  
  return subscription.status === 'active' && 
         (subscription.plan === 'pro' || subscription.plan === 'enterprise');
}

/**
 * 檢查並處理過期訂閱
 */
export async function checkExpiredSubscriptions(): Promise<void> {
  console.log('🔍 [Subscription] Checking for expired subscriptions...');
  
  const allSubscriptions = await kv.getByPrefix('subscription_');
  const now = new Date();
  
  for (const item of allSubscriptions) {
    const subscription = item.value;
    
    // 跳過非自動續訂的已取消訂閱
    if (!subscription.auto_renew && subscription.status === 'cancelled') {
      continue;
    }
    
    // 檢查是否已過期
    if (subscription.next_billing_date) {
      const nextBillingDate = new Date(subscription.next_billing_date);
      
      if (now > nextBillingDate && subscription.status === 'active') {
        console.log(`⚠️ [Subscription] Subscription expired for user ${subscription.user_id}`);
        
        // 如果是自動續訂但付款失敗，標記為暫停
        if (subscription.auto_renew) {
          subscription.status = 'suspended';
          subscription.suspended_at = now.toISOString();
        } else {
          subscription.status = 'expired';
          subscription.expired_at = now.toISOString();
        }
        
        subscription.updated_at = now.toISOString();
        await kv.set(item.key, subscription);
        
        // 發送通知郵件
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        const { data: userData } = await supabase.auth.admin.getUserById(subscription.user_id);
        
        if (userData?.user?.email) {
          await emailService.sendEmail({
            to: userData.user.email,
            subject: 'Subscription Status Update - Case Where',
            html: `
              <h2>${subscription.auto_renew ? 'Subscription Payment Failed' : 'Subscription Expired'}</h2>
              <p>Your Case Where subscription has ${subscription.auto_renew ? 'encountered a payment issue' : 'expired'}.</p>
              
              ${subscription.auto_renew ? `
                <p>We were unable to process your recurring payment. Please update your payment method to continue your subscription.</p>
                <p><a href="https://casewhr.com/?view=dashboard">Update Payment Method</a></p>
              ` : `
                <p>Your subscription has ended. You can renew anytime from your dashboard.</p>
                <p><a href="https://casewhr.com/?view=pricing">View Plans</a></p>
              `}
            `,
          });
        }
      }
    }
  }
  
  console.log('✅ [Subscription] Expired subscriptions check completed');
}