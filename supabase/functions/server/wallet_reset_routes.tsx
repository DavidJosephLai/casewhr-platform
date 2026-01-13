/**
 * Wallet Reset API Routes
 * 錢包重置 API 路由
 * 管理員專用 - 批量重置錢包和備份功能
 */

import * as kv from './kv_store.tsx';

export function registerWalletResetRoutes(app: any, supabase: any) {
  
  // Get wallet summary
  app.get("/make-server-215f78a5/admin/wallet-summary", async (c: any) => {
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

      // Get all wallets
      const allWallets = await kv.getByPrefix('wallet_') || [];
      
      let totalBalance = 0;
      let totalPending = 0;
      let usersWithBalance = 0;

      for (const wallet of allWallets) {
        const availableBalance = wallet.available_balance || wallet.balance || 0;
        const pendingWithdrawal = wallet.pending_withdrawal || wallet.locked || 0;
        
        totalBalance += availableBalance;
        totalPending += pendingWithdrawal;
        
        if (availableBalance > 0) {
          usersWithBalance++;
        }
      }

      const summary = {
        total_wallets: allWallets.length,
        total_balance: totalBalance,
        total_pending: totalPending,
        users_with_balance: usersWithBalance,
      };

      return c.json({ summary });
    } catch (error) {
      console.error('Error fetching wallet summary:', error);
      return c.json({ error: 'Failed to fetch wallet summary' }, 500);
    }
  });

  // Create wallet backup
  app.post("/make-server-215f78a5/admin/wallet-backup", async (c: any) => {
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

      // Get all wallets
      const allWallets = await kv.getByPrefix('wallet_') || [];

      const backupId = `backup_${Date.now()}_${user.id}`;
      const now = new Date().toISOString();

      const backup = {
        backup_id: backupId,
        created_at: now,
        created_by: user.id,
        wallets_backed_up: allWallets.length,
        wallets: allWallets.map((wallet: any) => ({
          user_id: wallet.user_id,
          available_balance: wallet.available_balance || wallet.balance || 0,
          pending_withdrawal: wallet.pending_withdrawal || wallet.locked || 0,
          total_earned: wallet.total_earned || 0,
          total_spent: wallet.total_spent || 0,
          created_at: wallet.created_at,
          updated_at: wallet.updated_at,
        })),
      };

      // Save backup to KV store
      await kv.set(backupId, backup);

      console.log(`✅ Wallet backup created: ${backupId}, ${allWallets.length} wallets`);

      return c.json({ success: true, backup });
    } catch (error) {
      console.error('Error creating wallet backup:', error);
      return c.json({ error: 'Failed to create wallet backup' }, 500);
    }
  });

  // Reset all wallets
  app.post("/make-server-215f78a5/admin/wallet-reset", async (c: any) => {
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

      // Get all wallets
      const allWallets = await kv.getByPrefix('wallet_') || [];

      let totalBalanceCleared = 0;
      let totalPendingCleared = 0;
      let backupData = null;
      let backupId = null;

      // Create backup if requested
      if (create_backup) {
        backupId = `backup_before_reset_${Date.now()}_${user.id}`;
        const now = new Date().toISOString();

        backupData = {
          backup_id: backupId,
          created_at: now,
          created_by: user.id,
          reason: 'Pre-reset backup',
          wallets_backed_up: allWallets.length,
          wallets: allWallets.map((wallet: any) => ({
            user_id: wallet.user_id,
            available_balance: wallet.available_balance || wallet.balance || 0,
            pending_withdrawal: wallet.pending_withdrawal || wallet.locked || 0,
            total_earned: wallet.total_earned || 0,
            total_spent: wallet.total_spent || 0,
            created_at: wallet.created_at,
            updated_at: wallet.updated_at,
          })),
        };

        // Save backup to KV store
        await kv.set(backupId, backupData);
        console.log(`💾 Pre-reset backup created: ${backupId}`);
      }

      // Reset all wallets
      const now = new Date().toISOString();
      for (const wallet of allWallets) {
        const availableBalance = wallet.available_balance || wallet.balance || 0;
        const pendingWithdrawal = wallet.pending_withdrawal || wallet.locked || 0;

        totalBalanceCleared += availableBalance;
        totalPendingCleared += pendingWithdrawal;

        // Reset wallet
        const resetWallet = {
          ...wallet,
          available_balance: 0,
          pending_withdrawal: 0,
          balance: undefined, // Remove old field
          locked: undefined, // Remove old field
          updated_at: now,
          last_reset_at: now,
          last_reset_by: user.id,
        };

        await kv.set(`wallet_${wallet.user_id}`, resetWallet);
      }

      // Create reset log
      const resetLogKey = `wallet_reset_log_${Date.now()}`;
      await kv.set(resetLogKey, {
        id: resetLogKey,
        reset_at: now,
        reset_by: user.id,
        wallets_reset: allWallets.length,
        total_balance_cleared: totalBalanceCleared,
        total_pending_cleared: totalPendingCleared,
        backup_created: create_backup,
        backup_id: backupId,
      });

      console.log(`🗑️  All wallets reset: ${allWallets.length} wallets, $${totalBalanceCleared.toFixed(2)} cleared`);

      const result = {
        success: true,
        wallets_reset: allWallets.length,
        total_balance_cleared: totalBalanceCleared,
        total_pending_cleared: totalPendingCleared,
        backup_created: create_backup,
        backup_id: backupId,
      };

      return c.json({ 
        success: true, 
        result,
        backup_data: create_backup ? backupData : undefined,
      });
    } catch (error) {
      console.error('Error resetting wallets:', error);
      return c.json({ error: 'Failed to reset wallets' }, 500);
    }
  });

  // Get reset logs
  app.get("/make-server-215f78a5/admin/wallet-reset-logs", async (c: any) => {
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

      const logs = await kv.getByPrefix('wallet_reset_log_') || [];
      const sorted = logs.sort((a: any, b: any) => 
        new Date(b.reset_at).getTime() - new Date(a.reset_at).getTime()
      );

      return c.json({ logs: sorted });
    } catch (error) {
      console.error('Error fetching reset logs:', error);
      return c.json({ error: 'Failed to fetch reset logs' }, 500);
    }
  });

  // Restore from backup
  app.post("/make-server-215f78a5/admin/wallet-restore", async (c: any) => {
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

      const body = await c.req.json();
      const { backup_id } = body;

      if (!backup_id) {
        return c.json({ error: 'Backup ID required' }, 400);
      }

      // Get backup
      const backup = await kv.get(backup_id);
      if (!backup) {
        return c.json({ error: 'Backup not found' }, 404);
      }

      // Restore wallets
      const now = new Date().toISOString();
      let walletsRestored = 0;

      for (const walletData of backup.wallets) {
        const walletKey = `wallet_${walletData.user_id}`;
        const currentWallet = await kv.get(walletKey);

        if (currentWallet) {
          const restoredWallet = {
            ...currentWallet,
            available_balance: walletData.available_balance,
            pending_withdrawal: walletData.pending_withdrawal,
            updated_at: now,
            restored_at: now,
            restored_from: backup_id,
          };

          await kv.set(walletKey, restoredWallet);
          walletsRestored++;
        }
      }

      console.log(`♻️  Wallets restored from backup ${backup_id}: ${walletsRestored} wallets`);

      return c.json({ 
        success: true, 
        wallets_restored: walletsRestored,
        backup_id,
      });
    } catch (error) {
      console.error('Error restoring wallets:', error);
      return c.json({ error: 'Failed to restore wallets' }, 500);
    }
  });

  console.log('✅ [WALLET RESET] Wallet reset routes registered');
}
