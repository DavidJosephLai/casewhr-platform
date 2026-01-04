// 🔧 平台收入修復端點
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import * as kv from './kv_store.tsx';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

export async function fixPlatformRevenue(c: any) {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // 只允許平台擁有者執行
    if (user.email !== 'davidlai234@hotmail.com') {
      return c.json({ error: 'Forbidden: Admin only' }, 403);
    }

    console.log('🔧 [Fix Platform Revenue] Starting revenue reconciliation...');

    // 使用當前登入的平台擁有者帳號
    const platformOwner = user;
    console.log(`💰 [Fix] Platform owner: ${platformOwner.email}`);

    // 獲取所有訂閱升級交易
    const allTransactions = await kv.getByPrefix('transaction_') || [];
    const subscriptionUpgrades = allTransactions.filter(
      (t: any) => t.type === 'subscription_upgrade'
    );

    console.log(`🔧 [Fix] Found ${subscriptionUpgrades.length} subscription upgrades`);

    // 獲取所有平台收入交易
    const platformRevenues = allTransactions.filter(
      (t: any) => t.type === 'subscription_revenue'
    );

    console.log(`🔧 [Fix] Found ${platformRevenues.length} platform revenue records`);

    // 檢查每個升級是否有對應的平台收入記錄
    const missingRevenues: any[] = [];
    let totalMissingAmount = 0;

    for (const upgrade of subscriptionUpgrades) {
      const hasRevenue = platformRevenues.some(
        (rev: any) => 
          rev.from_user_id === upgrade.user_id &&
          Math.abs(rev.created_at && upgrade.created_at ? 
            new Date(rev.created_at).getTime() - new Date(upgrade.created_at).getTime() : Infinity
          ) < 5000 // 5秒內的交易視為配對
      );

      if (!hasRevenue) {
        missingRevenues.push(upgrade);
        totalMissingAmount += Math.abs(upgrade.amount || 0);
      }
    }

    console.log(`🔧 [Fix] Found ${missingRevenues.length} missing revenue records`);
    console.log(`🔧 [Fix] Total missing amount: $${totalMissingAmount.toFixed(2)} USD`);

    // 修復遺漏的收入
    const fixed: any[] = [];
    const platformWalletKey = `wallet_${platformOwner.id}`;
    let platformWallet = await kv.get(platformWalletKey);

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

    for (const upgrade of missingRevenues) {
      const amount = Math.abs(upgrade.amount || 0);
      
      // 更新平台錢包
      platformWallet.available_balance = (platformWallet.available_balance || 0) + amount;
      platformWallet.balance = (platformWallet.balance || 0) + amount;
      platformWallet.total_earned = (platformWallet.total_earned || 0) + amount;
      platformWallet.updated_at = new Date().toISOString();

      // 創建平台收入交易記錄
      const platformTransactionKey = `transaction_${Date.now()}_platform_${platformOwner.id}_fix`;
      await kv.set(platformTransactionKey, {
        id: platformTransactionKey,
        user_id: platformOwner.id,
        type: 'subscription_revenue',
        amount: amount,
        currency: 'USD',
        display_currency: upgrade.display_currency || 'USD',
        display_amount: Math.abs(upgrade.display_amount || amount),
        description: `[FIXED] Platform Revenue: ${upgrade.description || 'Subscription upgrade'}`,
        from_user_id: upgrade.user_id,
        created_at: new Date().toISOString(),
      });

      fixed.push({
        upgrade_id: upgrade.id,
        amount: amount,
        user_id: upgrade.user_id,
        description: upgrade.description
      });

      console.log(`✅ [Fix] Created revenue record for upgrade ${upgrade.id}: $${amount}`);
      
      // 添加延遲避免重複的時間戳
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // 保存平台錢包
    await kv.set(platformWalletKey, platformWallet);

    console.log(`🎉 [Fix] Fixed ${fixed.length} missing revenue records`);
    console.log(`💰 [Fix] Platform wallet balance: $${platformWallet.available_balance.toFixed(2)} USD`);

    return c.json({
      success: true,
      fixed: fixed.length,
      total_amount: totalMissingAmount,
      platform_balance: platformWallet.available_balance,
      details: fixed
    });

  } catch (error) {
    console.error('❌ [Fix Platform Revenue] Error:', error);
    return c.json({ error: String(error) }, 500);
  }
}