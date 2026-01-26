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
 * ✅ 使用正確的 .NET HttpUtility.UrlEncode 規則
 * ✅ 支援 SHA256 (EncryptType=1) 和 MD5 (EncryptType=0)
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
  
  // 7. 根據 EncryptType 選擇加密方式
  const encryptType = cleanParams.EncryptType || '1';
  
  let checkMacValue: string;
  
  if (encryptType === '1') {
    // ✅ SHA256 加密 (EncryptType=1 在新版 ECPay 文檔中代表 SHA256)
    const encoder = new TextEncoder();
    const data = encoder.encode(lowerString);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    checkMacValue = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  } else {
    // MD5 加密 (EncryptType=0，舊版)
    const { createHash } = await import('node:crypto');
    const hash = createHash('md5').update(lowerString).digest('hex');
    checkMacValue = hash.toUpperCase();
  }
  
  console.log('🔍 [ECPay CheckMac] Step 5 - Final CheckMacValue:', checkMacValue);
  console.log('🔍 [ECPay CheckMac] Config:', {
    merchantId: ECPAY_MERCHANT_ID,
    hashKey: ECPAY_HASH_KEY ? `${ECPAY_HASH_KEY.substring(0, 4)}...` : '❌',
    hashIV: ECPAY_HASH_IV ? `${ECPAY_HASH_IV.substring(0, 4)}...` : '❌',
    encryptType
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
  
  // ⚠️ CRITICAL FIX: TradeDesc 和 ItemName 不能包含特殊字符
  // 只允許：中文、英文、數字、空格
  const params = {
    MerchantID: ECPAY_MERCHANT_ID,
    MerchantTradeNo: tradeNo,
    MerchantTradeDate: merchantTradeDate,
    PaymentType: 'aio',
    TotalAmount: Math.floor(amount).toString(), // ✅ 確保是整數
    TradeDesc: planType === 'pro' ? 'Pro Plan' : 'Enterprise Plan', // ✅ 移除特殊字符
    ItemName: planType === 'pro' ? 'Pro Monthly Plan' : 'Enterprise Monthly Plan', // ✅ 移除特殊字符
    ReturnURL: periodReturnURL,
    ChoosePayment: 'Credit',
    EncryptType: '1',
    // ✅ 定期定額參數
    PeriodAmount: Math.floor(amount).toString(), // ✅ 必須是整數
    PeriodType: 'M',
    Frequency: '1',
    ExecTimes: '999',
    PeriodReturnURL: periodReturnURL,
    // ✅ 信用卡參數
    CreditInstallment: '0',
    UnionPay: '0',
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
        <input type="hidden" name="CreditInstallment" value="${params.CreditInstallment}">
        <input type="hidden" name="UnionPay" value="${params.UnionPay}">
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
      const { user_id, plan_type, amount } = pendingData;
      
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
      }
    }
  } else {
    console.error(`❌ [ECPay Period] Payment failed: ${RtnMsg}`);
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