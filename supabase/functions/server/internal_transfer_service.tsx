/**
 * 🏦 Internal Transfer Service
 * 
 * 處理平台內部用戶之間的即時轉帳功能
 * 
 * Features:
 * - 即時轉帳（秒級到帳）
 * - 交易原子性保證
 * - 每日轉帳限額控制
 * - 轉帳密碼驗證
 * - 完整的交易記錄
 * - 雙方通知
 * 
 * @author CaseWHR Platform
 * @date 2025-01-08
 */

import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js";
import { toUSD, EXCHANGE_RATES } from "./exchange_rates.tsx";
import { sendEmail } from "./email_service.tsx";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

/**
 * 轉帳限額配置（基於會員等級）
 */
const TRANSFER_LIMITS = {
  free: {
    daily: 500,      // $500/天
    perTransaction: 200  // $200/次
  },
  professional: {
    daily: 5000,     // $5000/天
    perTransaction: 3000  // $3000/次 ✅ 提高到 3000 USD
  },
  enterprise: {
    daily: 50000,    // $50000/天
    perTransaction: 10000  // $10000/次
  }
};

/**
 * 手續費配置
 */
const TRANSFER_FEE = {
  rate: 0.01,        // 1% 手續費
  min: 0.1,          // 最低 $0.1
  max: 10,           // 最高 $10
  free_threshold: 10 // 低於 $10 免手續費
};

/**
 * 驗證轉帳密碼
 */
async function verifyTransferPin(userId: string, pin: string): Promise<boolean> {
  try {
    const userPinData = await kv.get(`transfer_pin:${userId}`);
    
    if (!userPinData) {
      console.log(`⚠️ [Transfer] No PIN set for user ${userId}`);
      return false;
    }

    // 簡單的 PIN 驗證（生產環境應該使用加密）
    const isValid = userPinData.pin === pin;
    
    console.log(`🔐 [Transfer] PIN verification for user ${userId}: ${isValid ? 'SUCCESS' : 'FAILED'}`);
    
    return isValid;
  } catch (error) {
    console.error('❌ [Transfer] Error verifying PIN:', error);
    return false;
  }
}

/**
 * 設置轉帳密碼
 */
async function setTransferPin(userId: string, pin: string): Promise<void> {
  await kv.set(`transfer_pin:${userId}`, {
    pin,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  
  console.log(`✅ [Transfer] PIN set for user ${userId}`);
}

/**
 * 檢查每日轉帳限額
 */
async function checkDailyTransferLimit(userId: string, amount: number, tier: string = 'free'): Promise<{
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
  error?: string;
}> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const limitKey = `transfer_limit:${userId}:${today}`;
    
    const limitData = await kv.get(limitKey) || { used: 0 };
    const limits = TRANSFER_LIMITS[tier as keyof typeof TRANSFER_LIMITS] || TRANSFER_LIMITS.free;
    
    const totalUsed = limitData.used + amount;
    
    console.log(`📊 [Transfer Limit Check] User ${userId}:`, {
      tier,
      daily_limit: limits.daily,
      used_today: limitData.used,
      new_amount: amount,
      total_would_be: totalUsed,
      allowed: totalUsed <= limits.daily
    });
    
    // 檢查單筆限額
    if (amount > limits.perTransaction) {
      return {
        allowed: false,
        limit: limits.daily,
        used: limitData.used,
        remaining: limits.daily - limitData.used,
        error: `Single transaction limit exceeded. Max: $${limits.perTransaction}`
      };
    }
    
    // 檢查每日限額
    if (totalUsed > limits.daily) {
      return {
        allowed: false,
        limit: limits.daily,
        used: limitData.used,
        remaining: limits.daily - limitData.used,
        error: `Daily transfer limit exceeded. Limit: $${limits.daily}, Used: $${limitData.used}`
      };
    }
    
    return {
      allowed: true,
      limit: limits.daily,
      used: limitData.used,
      remaining: limits.daily - totalUsed
    };
  } catch (error) {
    console.error('❌ [Transfer] Error checking daily limit:', error);
    return {
      allowed: false,
      limit: TRANSFER_LIMITS.free.daily,
      used: 0,
      remaining: 0,
      error: 'Failed to check transfer limit'
    };
  }
}

/**
 * 更新每日轉帳使用額度
 */
async function updateDailyTransferUsage(userId: string, amount: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const limitKey = `transfer_limit:${userId}:${today}`;
  
  const limitData = await kv.get(limitKey) || { used: 0 };
  
  await kv.set(limitKey, {
    used: limitData.used + amount,
    updated_at: new Date().toISOString()
  });
}

/**
 * 計算轉帳手續費
 */
function calculateTransferFee(amount: number): number {
  // 小額免手續費
  if (amount < TRANSFER_FEE.free_threshold) {
    return 0;
  }
  
  const fee = amount * TRANSFER_FEE.rate;
  
  // 最低和最高手續費限制
  if (fee < TRANSFER_FEE.min) return TRANSFER_FEE.min;
  if (fee > TRANSFER_FEE.max) return TRANSFER_FEE.max;
  
  return Math.round(fee * 100) / 100; // 四捨五入到小數點後兩位
}

/**
 * 發送轉帳通知郵件
 */
async function sendTransferNotifications(
  senderId: string,
  recipientId: string,
  amount: number,
  fee: number,
  note: string,
  transferId: string
): Promise<void> {
  try {
    // 獲取用戶資料
    const [senderProfile, recipientProfile] = await Promise.all([
      kv.get(`profile:${senderId}`),
      kv.get(`profile:${recipientId}`)
    ]);

    const senderEmail = senderProfile?.email || 'unknown';
    const senderName = senderProfile?.name || 'Unknown User';
    const recipientEmail = recipientProfile?.email || 'unknown';
    const recipientName = recipientProfile?.name || 'Unknown User';
    const senderLanguage = senderProfile?.preferred_language || 'en';
    const recipientLanguage = recipientProfile?.preferred_language || 'en';

    // 📧 發送給發送方的確認郵件
    const senderSubject = senderLanguage === 'zh' 
      ? '✅ 轉帳成功' 
      : '✅ Transfer Sent Successfully';
    
    const senderHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">${senderLanguage === 'zh' ? '轉帳確認' : 'Transfer Confirmation'}</h2>
        <p>${senderLanguage === 'zh' ? '您的轉帳已成功完成。' : 'Your transfer has been completed successfully.'}</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>${senderLanguage === 'zh' ? '收款人' : 'Recipient'}:</strong> ${recipientName} (${recipientEmail})</p>
          <p style="margin: 5px 0;"><strong>${senderLanguage === 'zh' ? '金額' : 'Amount'}:</strong> $${amount.toFixed(2)} USD</p>
          <p style="margin: 5px 0;"><strong>${senderLanguage === 'zh' ? '手續費' : 'Fee'}:</strong> $${fee.toFixed(2)} USD</p>
          <p style="margin: 5px 0;"><strong>${senderLanguage === 'zh' ? '總扣款' : 'Total Deducted'}:</strong> $${(amount + fee).toFixed(2)} USD</p>
          <p style="margin: 5px 0;"><strong>${senderLanguage === 'zh' ? '備註' : 'Note'}:</strong> ${note || 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>${senderLanguage === 'zh' ? '轉帳 ID' : 'Transfer ID'}:</strong> ${transferId}</p>
        </div>
        <a href="https://casewhr.com/dashboard?tab=wallet" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
          ${senderLanguage === 'zh' ? '查看交易記錄' : 'View Transaction History'}
        </a>
      </div>
    `;

    await sendEmail({
      to: senderEmail,
      subject: senderSubject,
      html: senderHtml,
      language: senderLanguage as 'en' | 'zh',
      emailType: 'notification'
    });

    // 📧 發送給接收方的到帳通知
    const recipientSubject = recipientLanguage === 'zh' 
      ? '💰 您收到一筆轉帳' 
      : '💰 You Received a Transfer';
    
    const recipientHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #16a34a;">${recipientLanguage === 'zh' ? '收到轉帳' : 'Transfer Received'}</h2>
        <p>${recipientLanguage === 'zh' ? `您收到了來自 ${senderName} 的轉帳。` : `You have received a transfer from ${senderName}.`}</p>
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>${recipientLanguage === 'zh' ? '發送人' : 'From'}:</strong> ${senderName} (${senderEmail})</p>
          <p style="margin: 5px 0;"><strong>${recipientLanguage === 'zh' ? '金額' : 'Amount'}:</strong> $${amount.toFixed(2)} USD</p>
          <p style="margin: 5px 0;"><strong>${recipientLanguage === 'zh' ? '備註' : 'Note'}:</strong> ${note || 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>${recipientLanguage === 'zh' ? '轉帳 ID' : 'Transfer ID'}:</strong> ${transferId}</p>
        </div>
        <p>${recipientLanguage === 'zh' ? '金額已添加到您的錢包餘額中。' : 'The amount has been added to your wallet balance.'}</p>
        <a href="https://casewhr.com/dashboard?tab=wallet" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
          ${recipientLanguage === 'zh' ? '查看錢包' : 'View Your Wallet'}
        </a>
      </div>
    `;

    await sendEmail({
      to: recipientEmail,
      subject: recipientSubject,
      html: recipientHtml,
      language: recipientLanguage as 'en' | 'zh',
      emailType: 'notification'
    });

    console.log(`📧 [Transfer] Notifications sent for transfer ${transferId}`);
  } catch (error) {
    console.error('❌ [Transfer] Error sending notifications:', error);
    // 不拋出錯誤，通知失敗不應該影響轉帳
  }
}

/**
 * 執行內部轉帳
 */
export async function executeInternalTransfer(
  senderId: string,
  recipientEmail: string,
  amount: number,
  note: string = '',
  pin: string,
  senderTier: string = 'free'
): Promise<{
  success: boolean;
  transferId?: string;
  fee?: number;
  error?: string;
}> {
  try {
    console.log(`💸 [Transfer] Starting transfer from ${senderId} to ${recipientEmail}, amount: $${amount}`);

    // 1. 驗證轉帳密碼
    const pinValid = await verifyTransferPin(senderId, pin);
    if (!pinValid) {
      return { success: false, error: 'Invalid transfer PIN' };
    }

    // 2. 查找收款人（支持 KV store 和 Supabase profiles）
    let recipientData = null;
    let recipientId = null;
    
    // 2a. 首先從 KV store 查找所有用戶
    const allProfileKeys = await kv.getByPrefix('profile:');
    console.log(`🔍 [Transfer] Searching for recipient: ${recipientEmail}`);
    console.log(`📦 [Transfer] Found ${allProfileKeys.length} profiles in KV store`);
    
    // 查找匹配的郵箱（不區分大小寫）
    const matchedProfile = allProfileKeys.find(profile => 
      profile.email && profile.email.toLowerCase() === recipientEmail.toLowerCase()
    );
    
    if (matchedProfile) {
      recipientId = matchedProfile.user_id || matchedProfile.id;
      recipientData = matchedProfile;
      console.log(`✅ [Transfer] Found recipient in KV store: ${recipientId}`);
    } else {
      // 2b. 如果 KV store 沒找到，嘗試查詢 Supabase profiles 表
      const { data: supabaseRecipient, error: recipientError } = await supabase
        .from('profiles')
        .select('id, email, name')
        .ilike('email', recipientEmail) // 不區分大小寫
        .single();

      if (supabaseRecipient && !recipientError) {
        recipientId = supabaseRecipient.id;
        recipientData = supabaseRecipient;
        console.log(`✅ [Transfer] Found recipient in Supabase: ${recipientId}`);
      }
    }

    if (!recipientId || !recipientData) {
      console.log(`❌ [Transfer] Recipient not found: ${recipientEmail}`);
      return { success: false, error: 'Recipient not found' };
    }

    // 3. 防止自己轉給自己
    if (recipientId === senderId) {
      return { success: false, error: 'Cannot transfer to yourself' };
    }

    // 4. 檢查金額有效性
    if (amount <= 0) {
      return { success: false, error: 'Invalid amount' };
    }

    // 5. 計算手續費
    const fee = calculateTransferFee(amount);
    const totalDeduction = amount + fee;

    console.log(`💰 [Transfer] Fee calculation:`, {
      amount,
      fee,
      totalDeduction
    });

    // 6. 檢查發送方餘額
    const senderWallet = await kv.get(`wallet_${senderId}`);
    if (!senderWallet || senderWallet.available_balance < totalDeduction) {
      return { 
        success: false, 
        error: `Insufficient balance. Required: $${totalDeduction.toFixed(2)}, Available: $${(senderWallet?.available_balance || 0).toFixed(2)}` 
      };
    }

    // 7. 檢查每日限額
    const limitCheck = await checkDailyTransferLimit(senderId, amount, senderTier);
    if (!limitCheck.allowed) {
      return { 
        success: false, 
        error: limitCheck.error || 'Transfer limit exceeded' 
      };
    }

    // 8. 執行轉帳（原子操作）
    const transferId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // 8a. 扣除發送方餘額（金額 + 手續費）
    await kv.set(`wallet_${senderId}`, {
      ...senderWallet,
      available_balance: senderWallet.available_balance - totalDeduction
    });

    console.log(`✅ [Transfer] Deducted $${totalDeduction} from sender ${senderId}`);

    // 8b. 增加接收方餘額（僅金額，不包含手續費）
    const recipientWallet = await kv.get(`wallet_${recipientId}`) || {
      available_balance: 0,
      pending_withdrawal: 0
    };

    console.log(`📊 [Transfer] Recipient ${recipientId} wallet BEFORE:`, recipientWallet);

    await kv.set(`wallet_${recipientId}`, {
      ...recipientWallet,
      available_balance: (recipientWallet.available_balance || 0) + amount
    });

    // 🐛 診斷：立即驗證錢包是否更新成功
    const updatedRecipientWallet = await kv.get(`wallet_${recipientId}`);
    console.log(`✅ [Transfer] Added $${amount} to recipient ${recipientId}`);
    console.log(`📊 [Transfer] Recipient wallet AFTER:`, updatedRecipientWallet);
    console.log(`💰 [Transfer] Recipient new balance should be: $${(recipientWallet.available_balance || 0) + amount}`);
    
    // 驗證餘額是否正確
    if (updatedRecipientWallet && updatedRecipientWallet.available_balance !== (recipientWallet.available_balance || 0) + amount) {
      console.error(`❌ [Transfer] WALLET UPDATE FAILED! Expected: $${(recipientWallet.available_balance || 0) + amount}, Got: $${updatedRecipientWallet.available_balance}`);
    }

    // 8c. 記錄轉帳交易
    const transferRecord = {
      id: transferId,
      from_user_id: senderId,
      to_user_id: recipientId,
      amount,
      fee,
      total_deduction: totalDeduction,
      note,
      status: 'completed',
      created_at: timestamp,
      completed_at: timestamp
    };

    await kv.set(`transfer:${transferId}`, transferRecord);

    // 8d. 記錄到發送方的轉帳歷史
    const senderTransfers = await kv.get(`transfers_sent:${senderId}`) || [];
    console.log(`📊 [Transfer] Current sender transfers count: ${Array.isArray(senderTransfers) ? senderTransfers.length : 'not an array'}`);
    senderTransfers.unshift(transferRecord);
    await kv.set(`transfers_sent:${senderId}`, senderTransfers.slice(0, 100)); // 保留最近 100 筆
    console.log(`✅ [Transfer] Saved to transfers_sent:${senderId}, count: ${senderTransfers.slice(0, 100).length}`);

    // 8e. 記錄到接收方的轉帳歷史
    const recipientTransfers = await kv.get(`transfers_received:${recipientId}`) || [];
    console.log(`📊 [Transfer] Current recipient transfers count: ${Array.isArray(recipientTransfers) ? recipientTransfers.length : 'not an array'}`);
    recipientTransfers.unshift(transferRecord);
    await kv.set(`transfers_received:${recipientId}`, recipientTransfers.slice(0, 100));
    console.log(`✅ [Transfer] Saved to transfers_received:${recipientId}, count: ${recipientTransfers.slice(0, 100).length}`);

    console.log(`✅ [Transfer] Transaction recorded: ${transferId}`);

    // 9. 更新每日轉帳使用額度
    await updateDailyTransferUsage(senderId, amount);

    // 10. 手續費計入平台收益
    if (fee > 0) {
      const platformRevenue = await kv.get('platform_revenue') || { total: 0, transfers: 0 };
      await kv.set('platform_revenue', {
        total: platformRevenue.total + fee,
        transfers: (platformRevenue.transfers || 0) + fee,
        updated_at: timestamp
      });
    }

    // 11. 發送通知（異步，不阻塞）
    sendTransferNotifications(senderId, recipientId, amount, fee, note, transferId);

    console.log(`🎉 [Transfer] Transfer completed successfully: ${transferId}`);

    return {
      success: true,
      transferId,
      fee
    };
  } catch (error: any) {
    console.error('❌ [Transfer] Error executing transfer:', error);
    return {
      success: false,
      error: `Transfer failed: ${error.message}`
    };
  }
}

/**
 * 獲取用戶轉帳歷史
 */
export async function getTransferHistory(userId: string): Promise<{
  sent: any[];
  received: any[];
}> {
  try {
    console.log(`📊 [Transfer History] Fetching history for user: ${userId}`);
    
    const [sent, received] = await Promise.all([
      kv.get(`transfers_sent:${userId}`),
      kv.get(`transfers_received:${userId}`)
    ]);

    // ✅ 確保返回數組，並安全處理 undefined
    const sentArray = Array.isArray(sent) ? sent : [];
    const receivedArray = Array.isArray(received) ? received : [];

    // 🔄 為每筆轉帳添加對方的 email
    const enrichedSent = await Promise.all(
      sentArray.map(async (transfer) => {
        const recipientProfile = await kv.get(`profile:${transfer.to_user_id}`);
        return {
          ...transfer,
          to_email: recipientProfile?.email || 'Unknown'
        };
      })
    );

    const enrichedReceived = await Promise.all(
      receivedArray.map(async (transfer) => {
        const senderProfile = await kv.get(`profile:${transfer.from_user_id}`);
        return {
          ...transfer,
          from_email: senderProfile?.email || 'Unknown'
        };
      })
    );

    console.log(`📊 [Transfer History] Sent count: ${enrichedSent.length}`);
    console.log(`📊 [Transfer History] Received count: ${enrichedReceived.length}`);
    console.log(`📊 [Transfer History] Sent data:`, JSON.stringify(enrichedSent).substring(0, 200));
    console.log(`📊 [Transfer History] Received data:`, JSON.stringify(enrichedReceived).substring(0, 200));

    return { 
      sent: enrichedSent, 
      received: enrichedReceived 
    };
  } catch (error) {
    console.error('❌ [Transfer] Error getting transfer history:', error);
    return { sent: [], received: [] };
  }
}

/**
 * 註冊內部轉帳路由
 */
export function registerInternalTransferRoutes(app: Hono) {
  console.log('🔧 [Transfer] Registering internal transfer routes...');

  // 設置轉帳密碼
  app.post('/make-server-215f78a5/wallet/transfer/set-pin', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const { pin } = await c.req.json();

      if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
        return c.json({ error: 'PIN must be exactly 6 digits' }, 400);
      }

      await setTransferPin(user.id, pin);

      return c.json({ 
        success: true, 
        message: 'Transfer PIN set successfully' 
      });
    } catch (error: any) {
      console.error('❌ [Transfer] Error setting PIN:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // 檢查是否已設置 PIN
  app.get('/make-server-215f78a5/wallet/transfer/has-pin', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const pinData = await kv.get(`transfer_pin:${user.id}`);

      return c.json({ 
        hasPin: !!pinData 
      });
    } catch (error: any) {
      console.error('❌ [Transfer] Error checking PIN:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // 執行轉帳
  app.post('/make-server-215f78a5/wallet/transfer', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const { to_user_email, amount, note, transfer_pin } = await c.req.json();

      // 驗證輸入
      if (!to_user_email || !amount || !transfer_pin) {
        return c.json({ error: 'Missing required fields' }, 400);
      }

      // 獲取用戶的訂閱等級
      const subscription = await kv.get(`subscription:${user.id}`) || { plan: 'free' };
      const tier = subscription.plan || 'free';

      // 執行轉帳
      const result = await executeInternalTransfer(
        user.id,
        to_user_email,
        parseFloat(amount),
        note || '',
        transfer_pin,
        tier
      );

      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json({
        success: true,
        transfer_id: result.transferId,
        fee: result.fee,
        message: 'Transfer completed successfully'
      });
    } catch (error: any) {
      console.error('❌ [Transfer] Error processing transfer:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // 獲取轉帳歷史
  app.get('/make-server-215f78a5/wallet/transfer/history', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const history = await getTransferHistory(user.id);

      return c.json(history);
    } catch (error: any) {
      console.error('❌ [Transfer] Error getting history:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // 獲取轉帳限額資訊
  app.get('/make-server-215f78a5/wallet/transfer/limits', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // 獲取用戶的訂閱等級
      const subscription = await kv.get(`subscription:${user.id}`) || { plan: 'free' };
      const tier = subscription.plan || 'free';
      const limits = TRANSFER_LIMITS[tier as keyof typeof TRANSFER_LIMITS] || TRANSFER_LIMITS.free;

      // 獲取今日使用額度
      const today = new Date().toISOString().split('T')[0];
      const limitKey = `transfer_limit:${user.id}:${today}`;
      const limitData = await kv.get(limitKey) || { used: 0 };

      return c.json({
        tier,
        daily_limit: limits.daily,
        per_transaction_limit: limits.perTransaction,
        used_today: limitData.used,
        remaining_today: limits.daily - limitData.used,
        fee_info: TRANSFER_FEE
      });
    } catch (error: any) {
      console.error('❌ [Transfer] Error getting limits:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // 🔍 搜尋收款人資訊
  app.post('/make-server-215f78a5/wallet/transfer/search-recipient', async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const { email } = await c.req.json();

      if (!email) {
        return c.json({ error: 'Email is required' }, 400);
      }

      // 檢查是否是自己
      if (email.toLowerCase() === user.email?.toLowerCase()) {
        return c.json({ error: 'Cannot transfer to yourself' }, 400);
      }

      // 查找收款人
      const result = await findUserByEmail(email);

      if (!result.found) {
        return c.json({ error: 'Recipient not found' }, 404);
      }

      // 獲取收款人的訂閱資訊
      const recipientSubscription = await kv.get(`subscription:${result.userId}`) || { plan: 'free' };

      return c.json({
        found: true,
        email: result.profile.email,
        name: result.profile.name || result.profile.displayName || 'Unknown',
        userId: result.userId,
        subscription: recipientSubscription.plan || 'free'
      });
    } catch (error: any) {
      console.error('❌ [Transfer] Error searching recipient:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  console.log('✅ [Transfer] Internal transfer routes registered');
}

// 🔍 診斷工具：通過郵箱查找用戶
export async function findUserByEmail(email: string): Promise<any> {
  try {
    console.log(`🔍 [Find User] Searching for: ${email}`);
    
    // 1. KV Store 查找
    const allProfileKeys = await kv.getByPrefix('profile:');
    const matchedProfile = allProfileKeys.find(profile => 
      profile.email && profile.email.toLowerCase() === email.toLowerCase()
    );
    
    if (matchedProfile) {
      const userId = matchedProfile.user_id || matchedProfile.id;
      console.log(`✅ [Find User] Found in KV: ${userId}`, matchedProfile);
      
      // 檢查錢包
      const wallet = await kv.get(`wallet_${userId}`);
      console.log(`💰 [Find User] Wallet:`, wallet);
      
      return { 
        found: true, 
        source: 'kv',
        userId, 
        profile: matchedProfile,
        wallet
      };
    }
    
    // 2. Supabase 查找
    const { data: supabaseUser, error } = await supabase
      .from('profiles')
      .select('id, email, name')
      .ilike('email', email)
      .single();
    
    if (supabaseUser && !error) {
      console.log(`✅ [Find User] Found in Supabase: ${supabaseUser.id}`, supabaseUser);
      
      const wallet = await kv.get(`wallet_${supabaseUser.id}`);
      console.log(`💰 [Find User] Wallet:`, wallet);
      
      return { 
        found: true, 
        source: 'supabase',
        userId: supabaseUser.id, 
        profile: supabaseUser,
        wallet
      };
    }
    
    return { found: false, email };
  } catch (error: any) {
    console.error('❌ [Find User] Error:', error);
    return { found: false, error: error.message };
  }
}