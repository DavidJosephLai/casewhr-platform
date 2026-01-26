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
// 💳 ECPay 定期定額 API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ECPAY_MERCHANT_ID = Deno.env.get('ECPAY_MERCHANT_ID') || '';
const ECPAY_HASH_KEY = Deno.env.get('ECPAY_HASH_KEY') || '';
const ECPAY_HASH_IV = Deno.env.get('ECPAY_HASH_IV') || '';
const ECPAY_MODE = Deno.env.get('ECPAY_MODE') || 'production';

// ⚠️ 定期定額專用 API 端點（和一般付款不同！）
const ECPAY_API_BASE = ECPAY_MODE === 'production'
  ? 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5'
  : 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5';

console.log('🔍 [ECPay] Environment Configuration:', {
  mode: ECPAY_MODE,
  merchantId: ECPAY_MERCHANT_ID,
  apiBase: ECPAY_API_BASE,
  hashKeySet: ECPAY_HASH_KEY ? '✅' : '❌',
  hashIVSet: ECPAY_HASH_IV ? '✅' : '❌'
});

/**
 * .NET HttpUtility.UrlEncode 相容函數
 * 必須與 ECPay 後台使用的 .NET 編碼方式一致
 */
function dotNetUrlEncode(str: string): string {
  let encoded = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const code = char.charCodeAt(0);
    
    // 不需要編碼的字元：A-Z a-z 0-9 - _ . ! * ( )
    if (
      (code >= 48 && code <= 57) ||   // 0-9
      (code >= 65 && code <= 90) ||   // A-Z
      (code >= 97 && code <= 122) ||  // a-z
      char === '-' || char === '_' || char === '.' || 
      char === '!' || char === '*' || char === '(' || char === ')'
    ) {
      encoded += char;
    } 
    // 空格編碼為 +
    else if (char === ' ') {
      encoded += '+';
    } 
    // 其他字元編碼為 %XX
    else {
      const bytes = new TextEncoder().encode(char);
      for (const byte of bytes) {
        encoded += '%' + byte.toString(16).toUpperCase().padStart(2, '0');
      }
    }
  }
  return encoded;
}

/**
 * 生成 ECPay 檢查碼
 * ✅ 直接複製一般付款成功的邏輯！
 */
async function generateECPayCheckMacValue(params: Record<string, any>): Promise<string> {
  // 1. 移除 CheckMacValue（如果存在）
  const cleanParams = { ...params };
  delete cleanParams.CheckMacValue;
  
  // 2. 參數按照 ASCII 排序
  const sortedKeys = Object.keys(cleanParams).sort();
  
  console.log('🔍 [ECPay CheckMac] Step 1 - Sorted Keys:', sortedKeys);
  
  // 3. 組合參數字串：key1=value1&key2=value2...
  const paramString = sortedKeys
    .map(key => `${key}=${cleanParams[key]}`)
    .join('&');
  
  // 4. 加上 HashKey 和 HashIV
  const rawString = `HashKey=${ECPAY_HASH_KEY}&${paramString}&HashIV=${ECPAY_HASH_IV}`;
  
  console.log('🔍 [ECPay CheckMac] Step 2 - Raw String:', rawString.substring(0, 300) + '...');
  
  // 5. ✅ 使用 .NET HttpUtility.UrlEncode
  const encodedString = dotNetUrlEncode(rawString);
  
  console.log('🔍 [ECPay CheckMac] Step 3 - URL Encoded:', encodedString.substring(0, 300) + '...');
  
  // 6. 轉小寫
  const lowerString = encodedString.toLowerCase();
  
  console.log('🔍 [ECPay CheckMac] Step 4 - Lowercase:', lowerString.substring(0, 300) + '...');
  
  // 7. ✅ 直接使用 SHA256（和一般付款一樣）
  const encoder = new TextEncoder();
  const data = encoder.encode(lowerString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // 8. 轉大寫
  const checkMacValue = hashHex.toUpperCase();
  
  console.log('🔍 [ECPay CheckMac] Step 5 - Final CheckMacValue:', checkMacValue);
  console.log('🔍 [ECPay CheckMac] Config:', {
    merchantId: ECPAY_MERCHANT_ID,
    hashKey: ECPAY_HASH_KEY ? `${ECPAY_HASH_KEY.substring(0, 4)}...` : '❌',
    hashIV: ECPAY_HASH_IV ? `${ECPAY_HASH_IV.substring(0, 4)}...` : '❌',
  });
  
  return checkMacValue;
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
  
  // ✅ 修正：MerchantTradeNo 必須 ≤ 20 字元
  // 格式：S + 10位時間戳 + 6位隨機碼 = 17 字元
  const timestamp = Date.now().toString().slice(-10);
  const randomStr = Math.random().toString(36).substring(2, 8);
  const tradeNo = `S${timestamp}${randomStr}`;
  
  console.log('📦 [ECPay] TradeNo:', tradeNo, '(length:', tradeNo.length, ')');
  
  if (tradeNo.length > 20) {
    throw new Error(`TradeNo too long: ${tradeNo.length} chars (max 20)`);
  }
  
  // ⚠️ PeriodReturnURL 必須使用完整的 Supabase Function URL
  const periodReturnURL = 'https://bihplitfentxioxyjalb.supabase.co/functions/v1/make-server-215f78a5/ecpay-period-callback';
  
  // 🕐 正確的日期時間格式：YYYY/MM/DD HH:mm:ss
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const merchantTradeDate = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  
  console.log('🕐 [ECPay] MerchantTradeDate:', merchantTradeDate);
  console.log('💰 [ECPay] Amount:', amount, 'TWD');
  
  // ⚠️ ClientBackURL - 用戶付款後跳轉的頁面
  const clientBackURL = `${returnUrl}?payment=success&provider=ecpay-subscription&plan=${planType}`;
  
  // ✅ ECPay 定期定額官方規範參數（只包含必要參數，避免衝突）
  const params: Record<string, string> = {
    MerchantID: ECPAY_MERCHANT_ID,
    MerchantTradeNo: tradeNo,
    MerchantTradeDate: merchantTradeDate,
    PaymentType: 'aio',
    TotalAmount: Math.floor(amount).toString(),
    TradeDesc: planType === 'pro' ? 'Pro Plan' : 'Enterprise Plan',
    ItemName: planType === 'pro' ? 'Pro Monthly Plan' : 'Enterprise Monthly Plan',
    ReturnURL: periodReturnURL,
    ChoosePayment: 'Credit',
    EncryptType: '1',
    // ✅ 定期定額必要參數
    PeriodAmount: Math.floor(amount).toString(),
    PeriodType: 'M',
    Frequency: '1',
    ExecTimes: '999',
    PeriodReturnURL: periodReturnURL,
    // ✅ 用戶付款後跳轉（可選但建議加上）
    ClientBackURL: clientBackURL,
  };
  
  console.log('📋 [ECPay] Params:', JSON.stringify(params, null, 2));
  
  // 生成檢查碼
  const checkMacValue = await generateECPayCheckMacValue(params);
  console.log('🔐 [ECPay] CheckMacValue:', checkMacValue);
  
  // ✅ 關鍵 Debug 資訊（隱藏敏感資料）
  console.log('🔍 [ECPAY DEBUG] MerchantID:', ECPAY_MERCHANT_ID);
  console.log('🔍 [ECPAY DEBUG] HashKey:', ECPAY_HASH_KEY ? `${ECPAY_HASH_KEY.substring(0, 4)}****${ECPAY_HASH_KEY.substring(ECPAY_HASH_KEY.length - 4)}` : 'MISSING');
  console.log('🔍 [ECPAY DEBUG] HashIV:', ECPAY_HASH_IV ? `${ECPAY_HASH_IV.substring(0, 4)}****${ECPAY_HASH_IV.substring(ECPAY_HASH_IV.length - 4)}` : 'MISSING');
  console.log('🔍 [ECPAY DEBUG] CheckMacValue:', checkMacValue);
  
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
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
          text-align: center;
          color: white;
        }
        .loader {
          border: 4px solid rgba(255,255,255,0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .debug-info {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255,255,255,0.9);
          color: #333;
          padding: 15px;
          border-radius: 8px;
          font-size: 12px;
          font-family: monospace;
          max-width: 90%;
          text-align: left;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>🔄 正在導向綠界付款...</h2>
        <div class="loader"></div>
        <p>請稍候，即將跳轉至安全付款頁面</p>
      </div>
      
      <div class="debug-info">
        <strong>🔍 Debug Info:</strong><br/>
        MerchantID: ${ECPAY_MERCHANT_ID}<br/>
        TradeNo: ${tradeNo}<br/>
        Amount: ${params.TotalAmount} TWD<br/>
        API: ${ECPAY_API_BASE}<br/>
        CheckMac: ${checkMacValue.substring(0, 20)}...
      </div>
      
      <form id="ecpayForm" method="post" action="${ECPAY_API_BASE}">
        <input type="hidden" name="MerchantID" value="${params.MerchantID}">
        <input type="hidden" name="MerchantTradeNo" value="${params.MerchantTradeNo}">
        <input type="hidden" name="MerchantTradeDate" value="${params.MerchantTradeDate}">
        <input type="hidden" name="PaymentType" value="${params.PaymentType}">
        <input type="hidden" name="TotalAmount" value="${params.TotalAmount}">
        <input type="hidden" name="TradeDesc" value="${params.TradeDesc}">
        <input type="hidden" name="ItemName" value="${params.ItemName}">
        <input type="hidden" name="ReturnURL" value="${params.ReturnURL}">
        <input type="hidden" name="ChoosePayment" value="${params.ChoosePayment}">
        <input type="hidden" name="EncryptType" value="${params.EncryptType}">
        <input type="hidden" name="PeriodAmount" value="${params.PeriodAmount}">
        <input type="hidden" name="PeriodType" value="${params.PeriodType}">
        <input type="hidden" name="Frequency" value="${params.Frequency}">
        <input type="hidden" name="ExecTimes" value="${params.ExecTimes}">
        <input type="hidden" name="PeriodReturnURL" value="${params.PeriodReturnURL}">
        <input type="hidden" name="ClientBackURL" value="${params.ClientBackURL}">
        <input type="hidden" name="CheckMacValue" value="${checkMacValue}">
      </form>
      
      <script>
        console.log('ECPay Form Ready');
        console.log('Submitting in 3 seconds...');
        
        setTimeout(function() {
          console.log('Submitting to ECPay...');
          document.getElementById('ecpayForm').submit();
        }, 3000);
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
    console.error('❌ [ECPay Period] CheckMacValue verification failed!');
    throw new Error('Invalid CheckMacValue');
  }
  
  console.log('✅ [ECPay Period] CheckMacValue verified successfully');
  
  if (RtnCode === '1') {
    // 付款成功
    const pendingData = await kv.get(`ecpay_subscription_pending_${MerchantTradeNo}`);
    
    if (pendingData) {
      const { user_id, plan_type, amount, email } = pendingData;
      
      // 首次訂閱 - 創建訂閱記錄
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
        
        // 🔔 發送訂閱成功郵件
        try {
          const userName = email.split('@')[0];
          const nextBillingDate = new Date(userSubscription.next_billing_date).toLocaleDateString('zh-TW');
          
          const emailHtml = emailService.getSubscriptionSuccessEmail({
            name: userName,
            plan: plan_type,
            amount,
            nextBillingDate,
            language: 'zh',
            currency: 'TWD'
          });
          
          await emailService.sendEmail({
            to: email,
            subject: '✅ 訂閱成功！感謝您的支持',
            html: emailHtml
          });
          
          console.log(`📧 [ECPay] Subscription success email sent to ${email}`);
        } catch (emailError) {
          console.error('❌ [ECPay] Failed to send subscription success email:', emailError);
        }
      } else {
        // 定期扣款成功 - 更新下次扣款日期
        const userSubscription = await kv.get(`subscription_${user_id}`);
        if (userSubscription) {
          const nextBilling = new Date();
          nextBilling.setMonth(nextBilling.getMonth() + 1);
          userSubscription.next_billing_date = nextBilling.toISOString();
          userSubscription.updated_at = new Date().toISOString();
          
          await kv.set(`subscription_${user_id}`, userSubscription);
          console.log(`✅ [ECPay] Recurring payment ${PeriodNo} successful for user ${user_id}`);
        }
      }
    }
  } else {
    // 扣款失敗
    console.error(`❌ [ECPay Period] Payment failed: ${RtnMsg}`);
    
    const pendingData = await kv.get(`ecpay_subscription_pending_${MerchantTradeNo}`);
    if (pendingData) {
      const { user_id, plan_type, amount, email } = pendingData;
      
      // 🔔 發送扣款失敗通知
      try {
        const userName = email.split('@')[0];
        const nextRetryDate = new Date();
        nextRetryDate.setDate(nextRetryDate.getDate() + 3);
        
        const emailHtml = emailService.getRecurringPaymentFailedEmail({
          name: userName,
          plan: plan_type,
          amount,
          currency: 'TWD',
          nextRetryDate: nextRetryDate.toLocaleDateString('zh-TW'),
          reason: RtnMsg || '銀行拒絕交易',
          language: 'zh'
        });
        
        await emailService.sendEmail({
          to: email,
          subject: '⚠️ 定期扣款失敗 - 需要您的注意',
          html: emailHtml
        });
        
        console.log(`📧 [ECPay] Payment failed email sent to ${email}`);
      } catch (emailError) {
        console.error('❌ [ECPay] Failed to send payment failed email:', emailError);
      }
      
      // 記錄失敗次數
      const failKey = `ecpay_payment_failures_${user_id}`;
      const failures = (await kv.get(failKey)) || [];
      failures.push({
        date: new Date().toISOString(),
        reason: RtnMsg,
        amount,
        trade_no: MerchantTradeNo
      });
      await kv.set(failKey, failures);
      
      // 如果失敗次數 >= 3，取消訂閱
      if (failures.length >= 3) {
        const userSubscription = await kv.get(`subscription_${user_id}`);
        if (userSubscription) {
          userSubscription.status = 'cancelled';
          userSubscription.cancelled_at = new Date().toISOString();
          userSubscription.cancel_reason = 'Payment failed 3 times';
          userSubscription.auto_renew = false;
          
          await kv.set(`subscription_${user_id}`, userSubscription);
          console.log(`⚠️ [ECPay] Subscription cancelled after 3 failed payments for user ${user_id}`);
        }
      }
    }
  }
}

/**
 * 取消 ECPay 訂閱
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
}

/**
 * 獲取用戶訂閱狀態
 * ✅ 自動檢查是否過期，過期則降級為 free
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
  
  // ✅ 檢查訂閱是否已過期（且未自動續費）
  if (subscription.next_billing_date && subscription.status === 'active') {
    const now = new Date();
    const nextBillingDate = new Date(subscription.next_billing_date);
    
    // 如果已過期且未自動續費，降級為 free
    if (now > nextBillingDate && !subscription.auto_renew) {
      console.log(`⏰ [Subscription] User ${userId} subscription expired, downgrading to free`);
      
      subscription.plan = 'free';
      subscription.status = 'expired';
      subscription.expired_at = now.toISOString();
      subscription.updated_at = now.toISOString();
      
      // 更新資料庫
      await kv.set(`subscription_${userId}`, subscription);
    }
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💰 PayPal 訂閱 API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PAYPAL_MODE = Deno.env.get('PAYPAL_MODE') || 'production'; // ✅ 默認使用正式環境
const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID') || '';
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET') || '';

// ✅ PayPal 訂閱計劃 Plan ID
const PAYPAL_PRO_PLAN_ID = Deno.env.get('PAYPAL_PRO_PLAN_ID') || '';
const PAYPAL_ENTERPRISE_PLAN_ID = Deno.env.get('PAYPAL_ENTERPRISE_PLAN_ID') || '';

// ✅ 支持 'production' 和 'live' 兩種模式名稱
const isProductionMode = PAYPAL_MODE === 'production' || PAYPAL_MODE === 'live';
const PAYPAL_API_BASE = isProductionMode
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

console.log('🔍 [PayPal] Environment Configuration:', {
  mode: PAYPAL_MODE,
  isProduction: isProductionMode,
  apiBase: PAYPAL_API_BASE,
  clientIdSet: PAYPAL_CLIENT_ID ? '✅' : '❌',
  clientSecretSet: PAYPAL_CLIENT_SECRET ? '✅' : '❌',
  proPlanIdSet: PAYPAL_PRO_PLAN_ID ? '✅' : '❌',
  enterprisePlanIdSet: PAYPAL_ENTERPRISE_PLAN_ID ? '✅' : '❌',
});

/**
 * 獲取 PayPal Access Token
 */
async function getPayPalAccessToken(): Promise<string> {
  // ✅ 驗證環境變數
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    console.error('❌ [PayPal] Missing credentials:', {
      clientId: PAYPAL_CLIENT_ID ? 'Set' : 'Missing',
      clientSecret: PAYPAL_CLIENT_SECRET ? 'Set' : 'Missing',
      mode: PAYPAL_MODE
    });
    throw new Error('PayPal credentials not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables.');
  }

  console.log('🔐 [PayPal] Attempting authentication...', {
    mode: PAYPAL_MODE,
    apiBase: PAYPAL_API_BASE,
    clientIdLength: PAYPAL_CLIENT_ID.length,
    clientIdPrefix: PAYPAL_CLIENT_ID.substring(0, 10) + '...'
  });

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
    const error = await response.text();
    console.error('❌ [PayPal] Failed to get access token:', error);
    console.error('❌ [PayPal] Response status:', response.status);
    console.error('❌ [PayPal] API Base:', PAYPAL_API_BASE);
    console.error('❌ [PayPal] Mode:', PAYPAL_MODE);
    
    // 如果是認證錯誤，提供更詳細的說明
    if (error.includes('invalid_client')) {
      throw new Error(
        `PayPal authentication failed. Please verify:\n` +
        `1. PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are correct\n` +
        `2. Credentials match the PAYPAL_MODE (${PAYPAL_MODE})\n` +
        `3. Sandbox credentials for sandbox mode, Live credentials for production mode\n` +
        `Current mode: ${PAYPAL_MODE}, API: ${PAYPAL_API_BASE}`
      );
    }
    
    throw new Error('Failed to authenticate with PayPal');
  }

  const data = await response.json();
  console.log('✅ [PayPal] Authentication successful');
  return data.access_token;
}

/**
 * 創建 PayPal 訂閱
 * 
 * @param userId - 用戶 ID
 * @param planType - 'pro' | 'enterprise'
 * @param returnUrl - 成功返回 URL
 * @param cancelUrl - 取消返回 URL
 * @returns { subscriptionId, approvalUrl }
 */
export async function createPayPalSubscription(
  userId: string,
  planType: 'pro' | 'enterprise',
  returnUrl: string,
  cancelUrl: string
): Promise<{ subscriptionId: string; approvalUrl: string }> {
  console.log('🟢 [PayPal] Creating subscription:', { userId, planType });

  // ✅ 從環境變數讀取 Plan ID
  const planId = planType === 'pro' 
    ? PAYPAL_PRO_PLAN_ID
    : PAYPAL_ENTERPRISE_PLAN_ID;

  // ✅ 驗證 Plan ID 是否已設置
  if (!planId) {
    const missingEnvVar = planType === 'pro' ? 'PAYPAL_PRO_PLAN_ID' : 'PAYPAL_ENTERPRISE_PLAN_ID';
    console.error(`❌ [PayPal] ${missingEnvVar} not configured`);
    throw new Error(
      `PayPal ${planType.toUpperCase()} plan not configured. ` +
      `Please set ${missingEnvVar} environment variable with your PayPal Plan ID. ` +
      `You can create plans at: https://www.paypal.com/billing/plans`
    );
  }

  console.log(`📋 [PayPal] Using Plan ID for ${planType}:`, planId.substring(0, 10) + '...');

  const accessToken = await getPayPalAccessToken();

  const subscriptionData = {
    plan_id: planId,
    start_time: new Date(Date.now() + 60000).toISOString(), // 1 分鐘後開始
    application_context: {
      brand_name: 'CaseWHR',
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

  console.log('📦 [PayPal] Subscription data:', JSON.stringify(subscriptionData, null, 2));

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(subscriptionData),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ [PayPal] Failed to create subscription:', error);
    throw new Error(`Failed to create PayPal subscription: ${error}`);
  }

  const data = await response.json();
  const subscriptionId = data.id;
  const approvalUrl = data.links.find((link: any) => link.rel === 'approve')?.href;

  if (!approvalUrl) {
    throw new Error('PayPal approval URL not found');
  }

  // 保存 pending 訂閱
  await kv.set(`paypal_subscription_pending_${subscriptionId}`, {
    subscription_id: subscriptionId,
    user_id: userId,
    plan_type: planType,
    status: 'PENDING',
    created_at: new Date().toISOString(),
  });

  console.log('✅ [PayPal] Subscription created:', subscriptionId);

  return {
    subscriptionId,
    approvalUrl,
  };
}

/**
 * 激活 PayPal 訂閱（用戶批准後）
 */
export async function activatePayPalSubscription(subscriptionId: string): Promise<void> {
  console.log('🔔 [PayPal] Activating subscription:', subscriptionId);

  const pendingData = await kv.get(`paypal_subscription_pending_${subscriptionId}`);

  if (!pendingData) {
    throw new Error('Pending subscription not found');
  }

  const { user_id, plan_type } = pendingData;

  // 從 PayPal 獲取訂閱詳情
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ [PayPal] Failed to get subscription details:', error);
    throw new Error('Failed to verify PayPal subscription');
  }

  const subscriptionData = await response.json();

  if (subscriptionData.status === 'ACTIVE') {
    // 🎯 從 PayPal 訂閱中提取計費週期和金額
    const planId = subscriptionData.plan_id;
    
    // 根據 Plan ID 判斷計費週期和金額
    let billing_cycle = 'monthly';
    let amount = 15; // 默認 Pro 月付
    
    // Pro 方案
    if (planId === 'P-24193930M7354211WNF33BOA') {
      billing_cycle = 'monthly';
      amount = 15;
    } else if (planId === 'P-8R6038908D0666614NF364XA') {
      billing_cycle = 'yearly';
      amount = 150;
    }
    // Enterprise 方案
    else if (planId === 'P-6R584025SB253261BNF33PDI') {
      billing_cycle = 'monthly';
      amount = 45;
    } else if (planId === 'P-5PG7025386205482MNF367HI') {
      billing_cycle = 'yearly';
      amount = 450;
    }
    
    console.log('🎯 [PayPal] Detected billing cycle:', billing_cycle, 'Amount:', amount);
    
    // 創建本地訂閱記錄
    const userSubscription = {
      user_id,
      plan: plan_type,
      status: 'active',
      payment_method: 'paypal',
      paypal_subscription_id: subscriptionId,
      billing_cycle,
      amount,
      start_date: new Date().toISOString(),
      next_billing_date: (() => {
        const next = new Date();
        if (billing_cycle === 'yearly') {
          next.setFullYear(next.getFullYear() + 1); // ✅ 年付：一年後續訂
        } else {
          next.setMonth(next.getMonth() + 1); // 月付：一個月後續訂
        }
        return next.toISOString();
      })(),
      auto_renew: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await kv.set(`subscription_${user_id}`, userSubscription);
    await kv.del(`paypal_subscription_pending_${subscriptionId}`);

    console.log(`✅ [PayPal] Subscription activated for user ${user_id}:`, {
      plan: plan_type,
      billing_cycle,
      amount,
      next_billing_date: userSubscription.next_billing_date
    });
  } else {
    throw new Error(`PayPal subscription status is ${subscriptionData.status}, expected ACTIVE`);
  }
}

/**
 * 取消 PayPal 訂閱
 */
export async function cancelPayPalSubscription(userId: string): Promise<void> {
  const userSubscription = await kv.get(`subscription_${userId}`);

  if (!userSubscription || userSubscription.payment_method !== 'paypal') {
    throw new Error('No PayPal subscription found for this user');
  }

  const subscriptionId = userSubscription.paypal_subscription_id;

  if (!subscriptionId) {
    throw new Error('PayPal subscription ID not found');
  }

  // 調用 PayPal API 取消訂閱
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason: 'User requested cancellation',
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
}

/**
 * 處理 PayPal Webhook 事件
 * Handles PayPal webhook events and stores them in the database
 */
export async function handlePayPalWebhook(event: any): Promise<void> {
  const eventType = event.event_type;
  const eventId = event.id;
  const timestamp = event.create_time;

  console.log('🔔 [PayPal Webhook] Processing event:', {
    type: eventType,
    id: eventId,
    timestamp
  });

  // ✅ 儲存 webhook 事件到資料庫
  try {
    await kv.set(`paypal_webhook_${eventId}`, {
      event_id: eventId,
      event_type: eventType,
      resource_type: event.resource_type,
      summary: event.summary,
      resource: event.resource,
      create_time: timestamp,
      processed_at: new Date().toISOString(),
      status: 'processing'
    });
    console.log(`✅ [PayPal Webhook] Event ${eventId} saved to database`);
  } catch (error) {
    console.error('❌ [PayPal Webhook] Failed to save event to database:', error);
    throw error;
  }

  // 處理不同類型的 webhook 事件
  try {
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(event);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(event);
        break;

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(event);
        break;

      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await handleSubscriptionExpired(event);
        break;

      case 'BILLING.SUBSCRIPTION.UPDATED':
        await handleSubscriptionUpdated(event);
        break;

      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(event);
        break;

      case 'PAYMENT.SALE.REFUNDED':
        await handlePaymentRefunded(event);
        break;

      default:
        console.log(`ℹ️ [PayPal Webhook] Unhandled event type: ${eventType}`);
    }

    // 更新事件處理狀態
    const webhookData = await kv.get(`paypal_webhook_${eventId}`);
    if (webhookData) {
      webhookData.status = 'completed';
      webhookData.completed_at = new Date().toISOString();
      await kv.set(`paypal_webhook_${eventId}`, webhookData);
    }

    console.log(`✅ [PayPal Webhook] Event ${eventId} processed successfully`);
  } catch (error) {
    console.error(`❌ [PayPal Webhook] Error processing event ${eventId}:`, error);
    
    // 更新事件處理狀態為失敗
    const webhookData = await kv.get(`paypal_webhook_${eventId}`);
    if (webhookData) {
      webhookData.status = 'failed';
      webhookData.error = error.message;
      webhookData.failed_at = new Date().toISOString();
      await kv.set(`paypal_webhook_${eventId}`, webhookData);
    }
    
    throw error;
  }
}

/**
 * 處理訂閱激活事件
 */
async function handleSubscriptionActivated(event: any): Promise<void> {
  const subscriptionId = event.resource.id;
  console.log(`✅ [PayPal Webhook] Subscription activated: ${subscriptionId}`);

  // 查找 pending 訂閱
  const pendingData = await kv.get(`paypal_subscription_pending_${subscriptionId}`);
  
  if (pendingData) {
    const { user_id, plan_type } = pendingData;
    const amount = plan_type === 'pro' ? 15 : 45; // USD

    const userSubscription = {
      user_id,
      plan: plan_type,
      status: 'active',
      payment_method: 'paypal',
      paypal_subscription_id: subscriptionId,
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
    await kv.del(`paypal_subscription_pending_${subscriptionId}`);

    console.log(`✅ [PayPal Webhook] User ${user_id} subscription activated`);

    // 發送訂閱成功郵件
    try {
      const userProfile = await kv.get(`user_${user_id}`);
      if (userProfile?.email) {
        const emailHtml = emailService.getSubscriptionSuccessEmail({
          name: userProfile.name || userProfile.email.split('@')[0],
          plan: plan_type,
          amount,
          nextBillingDate: new Date(userSubscription.next_billing_date).toLocaleDateString('en-US'),
          language: 'en',
          currency: 'USD'
        });

        await emailService.sendEmail({
          to: userProfile.email,
          subject: '✅ Subscription Activated - Welcome!',
          html: emailHtml
        });

        console.log(`📧 [PayPal Webhook] Activation email sent to ${userProfile.email}`);
      }
    } catch (emailError) {
      console.error('❌ [PayPal Webhook] Failed to send activation email:', emailError);
    }
  }
}

/**
 * 處理訂閱取消事件
 */
async function handleSubscriptionCancelled(event: any): Promise<void> {
  const subscriptionId = event.resource.id;
  console.log(`⚠️ [PayPal Webhook] Subscription cancelled: ${subscriptionId}`);

  // 查找用戶訂閱
  const users = await kv.getByPrefix('subscription_');
  for (const subscription of users) {
    if (subscription.paypal_subscription_id === subscriptionId) {
      subscription.status = 'cancelled';
      subscription.cancelled_at = new Date().toISOString();
      subscription.auto_renew = false;
      subscription.updated_at = new Date().toISOString();

      await kv.set(`subscription_${subscription.user_id}`, subscription);
      console.log(`✅ [PayPal Webhook] User ${subscription.user_id} subscription cancelled`);
      break;
    }
  }
}

/**
 * 處理訂閱暫停事件
 */
async function handleSubscriptionSuspended(event: any): Promise<void> {
  const subscriptionId = event.resource.id;
  console.log(`⚠️ [PayPal Webhook] Subscription suspended: ${subscriptionId}`);

  const users = await kv.getByPrefix('subscription_');
  for (const subscription of users) {
    if (subscription.paypal_subscription_id === subscriptionId) {
      subscription.status = 'suspended';
      subscription.suspended_at = new Date().toISOString();
      subscription.updated_at = new Date().toISOString();

      await kv.set(`subscription_${subscription.user_id}`, subscription);
      console.log(`✅ [PayPal Webhook] User ${subscription.user_id} subscription suspended`);
      break;
    }
  }
}

/**
 * 處理訂閱過期事件
 */
async function handleSubscriptionExpired(event: any): Promise<void> {
  const subscriptionId = event.resource.id;
  console.log(`⏰ [PayPal Webhook] Subscription expired: ${subscriptionId}`);

  const users = await kv.getByPrefix('subscription_');
  for (const subscription of users) {
    if (subscription.paypal_subscription_id === subscriptionId) {
      subscription.status = 'expired';
      subscription.expired_at = new Date().toISOString();
      subscription.plan = 'free'; // 降級為免費方案
      subscription.updated_at = new Date().toISOString();

      await kv.set(`subscription_${subscription.user_id}`, subscription);
      console.log(`✅ [PayPal Webhook] User ${subscription.user_id} subscription expired, downgraded to free`);
      break;
    }
  }
}

/**
 * 處理訂閱更新事件
 */
async function handleSubscriptionUpdated(event: any): Promise<void> {
  const subscriptionId = event.resource.id;
  console.log(`🔄 [PayPal Webhook] Subscription updated: ${subscriptionId}`);

  const users = await kv.getByPrefix('subscription_');
  for (const subscription of users) {
    if (subscription.paypal_subscription_id === subscriptionId) {
      subscription.updated_at = new Date().toISOString();
      await kv.set(`subscription_${subscription.user_id}`, subscription);
      console.log(`✅ [PayPal Webhook] User ${subscription.user_id} subscription updated`);
      break;
    }
  }
}

/**
 * 處理付款完成事件（定期扣款成功）
 */
async function handlePaymentCompleted(event: any): Promise<void> {
  const saleId = event.resource.id;
  const subscriptionId = event.resource.billing_agreement_id;
  const amount = event.resource.amount.total;

  console.log(`💰 [PayPal Webhook] Payment completed: ${saleId} for subscription ${subscriptionId}`);

  if (subscriptionId) {
    const users = await kv.getByPrefix('subscription_');
    for (const subscription of users) {
      if (subscription.paypal_subscription_id === subscriptionId) {
        // 更新下次扣款日期
        const nextBilling = new Date();
        nextBilling.setMonth(nextBilling.getMonth() + 1);
        subscription.next_billing_date = nextBilling.toISOString();
        subscription.updated_at = new Date().toISOString();

        await kv.set(`subscription_${subscription.user_id}`, subscription);
        
        // 記錄付款歷史
        const paymentHistory = await kv.get(`payment_history_${subscription.user_id}`) || [];
        paymentHistory.push({
          payment_id: saleId,
          amount: parseFloat(amount),
          currency: event.resource.amount.currency,
          date: new Date().toISOString(),
          type: 'recurring',
          status: 'completed'
        });
        await kv.set(`payment_history_${subscription.user_id}`, paymentHistory);

        console.log(`✅ [PayPal Webhook] Payment recorded for user ${subscription.user_id}`);
        break;
      }
    }
  }
}

/**
 * 處理付款退款事件
 */
async function handlePaymentRefunded(event: any): Promise<void> {
  const refundId = event.resource.id;
  const saleId = event.resource.sale_id;
  const amount = event.resource.amount.total;

  console.log(`💸 [PayPal Webhook] Payment refunded: ${refundId} for sale ${saleId}`);

  // 記錄退款
  const refundRecord = {
    refund_id: refundId,
    sale_id: saleId,
    amount: parseFloat(amount),
    currency: event.resource.amount.currency,
    date: new Date().toISOString(),
    status: 'completed'
  };

  await kv.set(`paypal_refund_${refundId}`, refundRecord);
  console.log(`✅ [PayPal Webhook] Refund ${refundId} recorded`);
}