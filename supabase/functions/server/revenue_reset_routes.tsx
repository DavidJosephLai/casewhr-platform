/**
 * Revenue Reset API Routes
 * 平台收入重置 API 路由
 * 管理員專用 - 批量重置收入和備份功能
 */

import * as kv from './kv_store.tsx';

export function registerRevenueResetRoutes(app: any, supabase: any) {
  
  // Get revenue summary
  app.get("/make-server-215f78a5/admin/revenue-summary", async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!accessToken) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user?.id) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Check if user is admin
      const profile = await kv.get(`profile_${user.id}`);
      if (!profile || profile.email !== 'davidlai234@hotmail.com') {
        return c.json({ error: 'Admin access required' }, 403);
      }

      // Get all transactions
      const allTransactions = await kv.getByPrefix('transaction_') || [];
      
      // Filter revenue transactions
      const subscriptionTransactions = allTransactions.filter(
        (t: any) => t.type === 'subscription_revenue' || t.type === 'subscription'
      );
      
      const serviceFeeTransactions = allTransactions.filter(
        (t: any) => t.type === 'service_fee'
      );

      // 🆕 Wismachion 收入
      const wismachionTransactions = allTransactions.filter(
        (t: any) => t.type === 'wismachion_revenue'
      );

      const totalSubscriptionRevenue = subscriptionTransactions.reduce(
        (sum: number, t: any) => sum + (t.amount || 0),
        0
      );

      const totalServiceFeeRevenue = serviceFeeTransactions.reduce(
        (sum: number, t: any) => sum + (t.amount || 0),
        0
      );

      // 🆕 計算 Wismachion 總收入
      const totalWismachionRevenue = wismachionTransactions.reduce(
        (sum: number, t: any) => {
          // 統一換算成 USD
          const amountInUSD = t.currency === 'TWD' ? t.amount / 30 : t.amount;
          return sum + amountInUSD;
        },
        0
      );

      // Get active subscriptions
      const allSubscriptions = await kv.getByPrefix('subscription_') || [];
      const activeSubscriptions = allSubscriptions.filter(
        (s: any) => s.status === 'active'
      );

      const summary = {
        total_subscription_revenue: totalSubscriptionRevenue,
        total_service_fee_revenue: totalServiceFeeRevenue,
        total_wismachion_revenue: totalWismachionRevenue, // 🆕
        total_revenue: totalSubscriptionRevenue + totalServiceFeeRevenue + totalWismachionRevenue, // 🆕 加入 Wismachion
        total_subscription_transactions: subscriptionTransactions.length,
        total_service_fee_transactions: serviceFeeTransactions.length,
        total_wismachion_transactions: wismachionTransactions.length, // 🆕
        total_transactions: subscriptionTransactions.length + serviceFeeTransactions.length + wismachionTransactions.length,
        active_subscriptions: activeSubscriptions.length,
      };

      return c.json({ summary });
    } catch (error) {
      console.error('Error fetching revenue summary:', error);
      return c.json({ error: 'Failed to fetch revenue summary' }, 500);
    }
  });

  // Create revenue backup
  app.post("/make-server-215f78a5/admin/revenue-backup", async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!accessToken) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user?.id) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Check if user is admin
      const profile = await kv.get(`profile_${user.id}`);
      if (!profile || profile.email !== 'davidlai234@hotmail.com') {
        return c.json({ error: 'Admin access required' }, 403);
      }

      // Get all revenue transactions
      const allTransactions = await kv.getByPrefix('transaction_') || [];
      const revenueTransactions = allTransactions.filter(
        (t: any) => t.type === 'subscription_revenue' || t.type === 'subscription' || t.type === 'service_fee'
      );

      // Get all subscriptions
      const allSubscriptions = await kv.getByPrefix('subscription_') || [];

      const backupId = `revenue_backup_${Date.now()}_${user.id}`;
      const now = new Date().toISOString();

      const backup = {
        backup_id: backupId,
        created_at: now,
        created_by: user.id,
        transactions_backed_up: revenueTransactions.length,
        subscriptions_backed_up: allSubscriptions.length,
        transactions: revenueTransactions.map((t: any) => ({
          id: t.id,
          user_id: t.user_id,
          type: t.type,
          amount: t.amount,
          description: t.description,
          status: t.status,
          created_at: t.created_at,
        })),
        subscriptions: allSubscriptions.map((s: any) => ({
          user_id: s.user_id,
          plan: s.plan,
          status: s.status,
          billing_cycle: s.billing_cycle,
          start_date: s.start_date,
          end_date: s.end_date,
          created_at: s.created_at,
        })),
      };

      // Save backup to KV store
      await kv.set(backupId, backup);

      console.log(`✅ Revenue backup created: ${backupId}, ${revenueTransactions.length} transactions`);

      return c.json({ success: true, backup });
    } catch (error) {
      console.error('Error creating revenue backup:', error);
      return c.json({ error: 'Failed to create revenue backup' }, 500);
    }
  });

  // Reset all revenue
  app.post("/make-server-215f78a5/admin/revenue-reset", async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!accessToken) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user?.id) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Check if user is admin
      const profile = await kv.get(`profile_${user.id}`);
      if (!profile || profile.email !== 'davidlai234@hotmail.com') {
        return c.json({ error: 'Admin access required' }, 403);
      }

      const body = await c.req.json().catch(() => ({}));
      const { create_backup = true } = body;

      // Get all revenue transactions
      const allTransactions = await kv.getByPrefix('transaction_') || [];
      const revenueTransactions = allTransactions.filter(
        (t: any) => t.type === 'subscription_revenue' || t.type === 'subscription' || t.type === 'service_fee'
      );

      // Get all subscriptions
      const allSubscriptions = await kv.getByPrefix('subscription_') || [];

      let totalRevenueCleared = 0;
      let backupData = null;
      let backupId = null;

      const subscriptionTransactionsCount = revenueTransactions.filter(
        (t: any) => t.type === 'subscription_revenue' || t.type === 'subscription'
      ).length;
      
      const serviceFeeTransactionsCount = revenueTransactions.filter(
        (t: any) => t.type === 'service_fee'
      ).length;

      // Calculate total revenue
      totalRevenueCleared = revenueTransactions.reduce(
        (sum: number, t: any) => sum + (t.amount || 0),
        0
      );

      // Create backup if requested
      if (create_backup) {
        backupId = `revenue_backup_before_reset_${Date.now()}_${user.id}`;
        const now = new Date().toISOString();

        backupData = {
          backup_id: backupId,
          created_at: now,
          created_by: user.id,
          reason: 'Pre-reset backup',
          transactions_backed_up: revenueTransactions.length,
          subscriptions_backed_up: allSubscriptions.length,
          transactions: revenueTransactions.map((t: any) => ({
            id: t.id,
            user_id: t.user_id,
            type: t.type,
            amount: t.amount,
            description: t.description,
            status: t.status,
            created_at: t.created_at,
          })),
          subscriptions: allSubscriptions.map((s: any) => ({
            user_id: s.user_id,
            plan: s.plan,
            status: s.status,
            billing_cycle: s.billing_cycle,
            start_date: s.start_date,
            end_date: s.end_date,
            created_at: s.created_at,
          })),
        };

        // Save backup to KV store
        await kv.set(backupId, backupData);
        console.log(`💾 Pre-reset revenue backup created: ${backupId}`);
      }

      // Delete all revenue transactions
      for (const transaction of revenueTransactions) {
        await kv.del(`transaction_${transaction.id}`);
      }

      // Cancel all subscriptions
      const now = new Date().toISOString();
      for (const subscription of allSubscriptions) {
        const subscriptionKey = `subscription_${subscription.user_id}`;
        const updatedSubscription = {
          ...subscription,
          status: 'cancelled',
          cancelled_at: now,
          cancelled_by: user.id,
          cancellation_reason: 'Admin revenue reset',
        };
        await kv.set(subscriptionKey, updatedSubscription);
      }

      // Create reset log
      const resetLogKey = `revenue_reset_log_${Date.now()}`;
      await kv.set(resetLogKey, {
        id: resetLogKey,
        reset_at: now,
        reset_by: user.id,
        subscription_transactions_deleted: subscriptionTransactionsCount,
        service_fee_transactions_deleted: serviceFeeTransactionsCount,
        total_transactions_deleted: revenueTransactions.length,
        total_revenue_cleared: totalRevenueCleared,
        subscriptions_cancelled: allSubscriptions.length,
        backup_created: create_backup,
        backup_id: backupId,
      });

      console.log(`🗑️  All revenue reset: ${revenueTransactions.length} transactions deleted, $${totalRevenueCleared.toFixed(2)} cleared, ${allSubscriptions.length} subscriptions cancelled`);

      const result = {
        success: true,
        subscription_transactions_deleted: subscriptionTransactionsCount,
        service_fee_transactions_deleted: serviceFeeTransactionsCount,
        total_transactions_deleted: revenueTransactions.length,
        total_revenue_cleared: totalRevenueCleared,
        subscriptions_cancelled: allSubscriptions.length,
        backup_created: create_backup,
        backup_id: backupId,
      };

      return c.json({ 
        success: true, 
        result,
        backup_data: create_backup ? backupData : undefined,
      });
    } catch (error) {
      console.error('Error resetting revenue:', error);
      return c.json({ error: 'Failed to reset revenue' }, 500);
    }
  });

  // Get reset logs
  app.get("/make-server-215f78a5/admin/revenue-reset-logs", async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!accessToken) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user?.id) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Check if user is admin
      const profile = await kv.get(`profile_${user.id}`);
      if (!profile || profile.email !== 'davidlai234@hotmail.com') {
        return c.json({ error: 'Admin access required' }, 403);
      }

      const logs = await kv.getByPrefix('revenue_reset_log_') || [];
      const sorted = logs.sort((a: any, b: any) => 
        new Date(b.reset_at).getTime() - new Date(a.reset_at).getTime()
      );

      return c.json({ logs: sorted });
    } catch (error) {
      console.error('Error fetching revenue reset logs:', error);
      return c.json({ error: 'Failed to fetch revenue reset logs' }, 500);
    }
  });

  console.log('✅ [REVENUE RESET] Revenue reset routes registered');
}