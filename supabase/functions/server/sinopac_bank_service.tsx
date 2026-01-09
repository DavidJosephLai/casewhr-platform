import { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

/**
 * 🏦 永豐銀行寰宇金融 API 集成服務
 * 
 * 功能：
 * 1. 批次代付/代撥款（Batch Payout）
 * 2. 帳戶餘額查詢
 * 3. 交易明細查詢
 * 4. 轉帳狀態查詢
 * 5. 帳戶驗證
 */

// ==================== 環境變數配置 ====================
const SINOPAC_CONFIG = {
  // API 基礎 URL
  apiUrl: Deno.env.get('SINOPAC_API_URL') ?? 'https://api.sinopac.com', // 永豐API地址
  
  // API 認證資訊
  apiKey: Deno.env.get('SINOPAC_API_KEY') ?? '',
  apiSecret: Deno.env.get('SINOPAC_API_SECRET') ?? '',
  merchantId: Deno.env.get('SINOPAC_MERCHANT_ID') ?? '', // 商戶號
  
  // 銀行帳戶資訊
  accountNumber: Deno.env.get('SINOPAC_ACCOUNT_NUMBER') ?? '', // 貴司在永豐的帳號
  accountName: Deno.env.get('SINOPAC_ACCOUNT_NAME') ?? '', // 帳戶名稱
  branchCode: Deno.env.get('SINOPAC_BRANCH_CODE') ?? '', // 分行代碼
  
  // 模式：sandbox（測試）或 production（正式）
  mode: Deno.env.get('SINOPAC_MODE') ?? 'sandbox',
};

// ==================== 介面定義 ====================

/**
 * 永豐銀行轉帳請求
 */
interface SinopacTransferRequest {
  recipient_account: string;      // 收款帳號
  recipient_name: string;          // 收款戶名
  recipient_bank_code: string;     // 收款銀行代碼（例如：807 = 永豐銀行）
  amount: number;                  // 轉帳金額（TWD）
  currency: string;                // 幣別（TWD/USD/CNY）
  note?: string;                   // 備註
  user_reference?: string;         // 平台內部參考號（withdrawal_id）
}

/**
 * 永豐銀行轉帳回應
 */
interface SinopacTransferResponse {
  success: boolean;
  transaction_id?: string;         // 永豐交易ID
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
  error?: string;
  timestamp?: string;
}

/**
 * 帳戶餘額查詢回應
 */
interface SinopacBalanceResponse {
  success: boolean;
  balance?: number;                // 可用餘額
  currency?: string;               // 幣別
  account_number?: string;         // 帳號
  timestamp?: string;
  error?: string;
}

/**
 * 交易明細
 */
interface SinopacTransaction {
  transaction_id: string;          // 交易ID
  type: 'debit' | 'credit';        // 借/貸
  amount: number;                  // 金額
  balance_after: number;           // 交易後餘額
  description: string;             // 描述
  timestamp: string;               // 時間
  status: string;                  // 狀態
}

// ==================== 輔助函數 ====================

/**
 * 生成 API 簽章（根據永豐銀行規範）
 */
function generateSignature(data: any, timestamp: string): string {
  // TODO: 根據永豐銀行 API 文件實作簽章算法
  // 通常是: HMAC-SHA256(apiSecret, timestamp + JSON.stringify(data))
  
  const message = timestamp + JSON.stringify(data);
  // 這裡需要用永豐提供的簽章算法
  // 暫時返回 placeholder
  return `SIGNATURE_${message.length}_${timestamp}`;
}

/**
 * 調用永豐銀行 API
 */
async function callSinopacAPI(
  endpoint: string,
  method: string = 'POST',
  data?: any
): Promise<any> {
  try {
    const timestamp = new Date().toISOString();
    const signature = generateSignature(data, timestamp);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': SINOPAC_CONFIG.apiKey,
      'X-Merchant-ID': SINOPAC_CONFIG.merchantId,
      'X-Timestamp': timestamp,
      'X-Signature': signature,
    };
    
    const url = `${SINOPAC_CONFIG.apiUrl}${endpoint}`;
    
    console.log(`[SinoPac] Calling API: ${method} ${url}`);
    
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error(`[SinoPac] API Error:`, result);
      throw new Error(result.message || 'API request failed');
    }
    
    console.log(`[SinoPac] API Response:`, result);
    return result;
    
  } catch (error) {
    console.error(`[SinoPac] API Call Failed:`, error);
    throw error;
  }
}

// ==================== 核心功能 ====================

/**
 * 1️⃣ 批次代付/轉帳
 */
export async function executeSinopacTransfer(
  request: SinopacTransferRequest
): Promise<SinopacTransferResponse> {
  try {
    console.log('[SinoPac] Executing transfer:', request);
    
    // 驗證配置
    if (!SINOPAC_CONFIG.apiKey || !SINOPAC_CONFIG.merchantId) {
      return {
        success: false,
        error: '永豐銀行 API 未配置，請設置環境變數'
      };
    }
    
    // 驗證金額
    if (request.amount <= 0) {
      return {
        success: false,
        error: '轉帳金額必須大於 0'
      };
    }
    
    // 調用永豐銀行轉帳 API
    const apiData = {
      from_account: SINOPAC_CONFIG.accountNumber,
      to_account: request.recipient_account,
      to_name: request.recipient_name,
      to_bank_code: request.recipient_bank_code,
      amount: request.amount,
      currency: request.currency,
      note: request.note || '',
      reference_id: request.user_reference || '',
    };
    
    // TODO: 替換為永豐銀行實際 API endpoint
    const result = await callSinopacAPI('/api/v1/transfer', 'POST', apiData);
    
    // 解析回應
    if (result.success || result.status === 'success') {
      return {
        success: true,
        transaction_id: result.transaction_id || result.txn_id,
        status: 'processing',
        message: '轉帳請求已提交',
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        success: false,
        error: result.message || result.error || '轉帳失敗',
        timestamp: new Date().toISOString(),
      };
    }
    
  } catch (error: any) {
    console.error('[SinoPac] Transfer failed:', error);
    return {
      success: false,
      error: error.message || '轉帳失敗',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 2️⃣ 查詢帳戶餘額
 */
export async function getSinopacBalance(): Promise<SinopacBalanceResponse> {
  try {
    console.log('[SinoPac] Querying account balance...');
    
    if (!SINOPAC_CONFIG.apiKey || !SINOPAC_CONFIG.accountNumber) {
      return {
        success: false,
        error: '永豐銀行 API 未配置'
      };
    }
    
    // TODO: 替換為永豐銀行實際 API endpoint
    const result = await callSinopacAPI(
      `/api/v1/account/${SINOPAC_CONFIG.accountNumber}/balance`,
      'GET'
    );
    
    if (result.success) {
      return {
        success: true,
        balance: result.balance || result.available_balance,
        currency: result.currency || 'TWD',
        account_number: SINOPAC_CONFIG.accountNumber,
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        success: false,
        error: result.message || '查詢失敗',
      };
    }
    
  } catch (error: any) {
    console.error('[SinoPac] Balance query failed:', error);
    return {
      success: false,
      error: error.message || '查詢失敗',
    };
  }
}

/**
 * 3️⃣ 查詢轉帳狀態
 */
export async function getSinopacTransactionStatus(
  transactionId: string
): Promise<SinopacTransferResponse> {
  try {
    console.log('[SinoPac] Querying transaction status:', transactionId);
    
    // TODO: 替換為永豐銀行實際 API endpoint
    const result = await callSinopacAPI(
      `/api/v1/transaction/${transactionId}/status`,
      'GET'
    );
    
    if (result.success) {
      return {
        success: true,
        transaction_id: transactionId,
        status: result.status,
        message: result.message,
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        success: false,
        error: result.message || '查詢失敗',
      };
    }
    
  } catch (error: any) {
    console.error('[SinoPac] Status query failed:', error);
    return {
      success: false,
      error: error.message || '查詢失敗',
    };
  }
}

/**
 * 4️⃣ 驗證收款帳戶
 */
export async function verifySinopacAccount(
  accountNumber: string,
  bankCode: string,
  accountName?: string
): Promise<{ success: boolean; verified: boolean; name?: string; error?: string }> {
  try {
    console.log('[SinoPac] Verifying account:', { accountNumber, bankCode });
    
    // TODO: 替換為永豐銀行實際 API endpoint
    const result = await callSinopacAPI('/api/v1/account/verify', 'POST', {
      account_number: accountNumber,
      bank_code: bankCode,
      account_name: accountName,
    });
    
    if (result.success) {
      return {
        success: true,
        verified: result.verified || result.valid,
        name: result.account_name || result.name,
      };
    } else {
      return {
        success: false,
        verified: false,
        error: result.message || '驗證失敗',
      };
    }
    
  } catch (error: any) {
    console.error('[SinoPac] Account verification failed:', error);
    return {
      success: false,
      verified: false,
      error: error.message || '驗證失敗',
    };
  }
}

/**
 * 5️⃣ 處理提現請求（整合到現有系統）
 */
export async function processSinopacWithdrawal(
  withdrawalId: string
): Promise<{ success: boolean; transaction_id?: string; error?: string }> {
  try {
    console.log('[SinoPac] Processing withdrawal:', withdrawalId);
    
    // 獲取提現資料
    const withdrawal = await kv.get(`withdrawal:${withdrawalId}`);
    if (!withdrawal) {
      return { success: false, error: '提現記錄不存在' };
    }
    
    // 獲取收款帳戶資料
    const account = await kv.get(`payout_account:${withdrawal.account_id}`);
    if (!account) {
      return { success: false, error: '收款帳戶不存在' };
    }
    
    // 確認是台灣本地銀行
    if (account.account_type !== 'local_taiwan') {
      return { success: false, error: '此帳戶類型不支援永豐銀行轉帳' };
    }
    
    // 將 USD 轉換為 TWD（從 KV 獲取匯率）
    const exchangeRate = await kv.get('exchange_rate:USD_TWD') || 30.5;
    const amountTWD = Math.round(withdrawal.net_amount * exchangeRate);
    
    // 執行轉帳
    const transferResult = await executeSinopacTransfer({
      recipient_account: account.account_number!,
      recipient_name: account.account_holder!,
      recipient_bank_code: account.bank_code!,
      amount: amountTWD,
      currency: 'TWD',
      note: `Case Where 提現 - ${withdrawalId}`,
      user_reference: withdrawalId,
    });
    
    if (transferResult.success) {
      // 更新提現狀態
      withdrawal.status = 'processing';
      withdrawal.payout_method = 'sinopac_auto';
      withdrawal.payout_transaction_id = transferResult.transaction_id;
      withdrawal.payout_status = transferResult.status;
      withdrawal.processed_at = new Date().toISOString();
      withdrawal.updated_at = new Date().toISOString();
      
      await kv.set(`withdrawal:${withdrawalId}`, withdrawal);
      
      console.log('[SinoPac] Withdrawal processed successfully:', transferResult.transaction_id);
      
      return {
        success: true,
        transaction_id: transferResult.transaction_id,
      };
    } else {
      // 記錄錯誤
      withdrawal.payout_method = 'sinopac_auto_failed';
      withdrawal.payout_error = transferResult.error;
      withdrawal.updated_at = new Date().toISOString();
      
      await kv.set(`withdrawal:${withdrawalId}`, withdrawal);
      
      return {
        success: false,
        error: transferResult.error,
      };
    }
    
  } catch (error: any) {
    console.error('[SinoPac] Withdrawal processing failed:', error);
    return {
      success: false,
      error: error.message || '處理失敗',
    };
  }
}

// ==================== API 路由註冊 ====================

export function registerSinopacRoutes(app: any) {
  console.log('[SinoPac] Registering routes...');
  
  // 測試連接
  app.get('/make-server-215f78a5/sinopac/test', async (c: Context) => {
    try {
      const balance = await getSinopacBalance();
      return c.json({
        service: '永豐銀行寰宇金融 API',
        status: balance.success ? 'connected' : 'disconnected',
        mode: SINOPAC_CONFIG.mode,
        configured: !!(SINOPAC_CONFIG.apiKey && SINOPAC_CONFIG.merchantId),
        balance: balance.success ? balance.balance : null,
        error: balance.error,
      });
    } catch (error: any) {
      return c.json({
        service: '永豐銀行寰宇金融 API',
        status: 'error',
        error: error.message,
      }, 500);
    }
  });
  
  // 查詢帳戶餘額（需要管理員權限）
  app.get('/make-server-215f78a5/sinopac/balance', async (c: Context) => {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // TODO: 驗證管理員權限
    
    try {
      const result = await getSinopacBalance();
      return c.json(result);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });
  
  // 驗證收款帳戶
  app.post('/make-server-215f78a5/sinopac/verify-account', async (c: Context) => {
    try {
      const { account_number, bank_code, account_name } = await c.req.json();
      
      if (!account_number || !bank_code) {
        return c.json({ success: false, error: '缺少必要參數' }, 400);
      }
      
      const result = await verifySinopacAccount(account_number, bank_code, account_name);
      return c.json(result);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });
  
  // 處理提現（管理員觸發）
  app.post('/make-server-215f78a5/sinopac/process-withdrawal', async (c: Context) => {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // TODO: 驗證管理員權限
    
    try {
      const { withdrawal_id } = await c.req.json();
      
      if (!withdrawal_id) {
        return c.json({ success: false, error: '缺少 withdrawal_id' }, 400);
      }
      
      const result = await processSinopacWithdrawal(withdrawal_id);
      return c.json(result);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });
  
  // 查詢轉帳狀態
  app.get('/make-server-215f78a5/sinopac/transaction/:txnId', async (c: Context) => {
    try {
      const txnId = c.req.param('txnId');
      const result = await getSinopacTransactionStatus(txnId);
      return c.json(result);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });
  
  console.log('[SinoPac] Routes registered successfully ✅');
}
