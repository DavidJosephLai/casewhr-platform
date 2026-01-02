// ==================== 💰 ADMIN TRANSACTION MANAGEMENT APIs ====================
// 這個文件包含交易和會員管理的管理員 API
// 需要在 index.tsx 中導入並使用

import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js";
import * as adminCheck from "./admin_check.tsx";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Helper function to safely get user from access token (supports dev mode)
async function getUserFromToken(accessToken: string | undefined) {
  if (!accessToken) {
    return { user: null, error: { message: 'No access token provided' } };
  }
  
  // 🧪 DEV MODE: Handle mock tokens (dev-user-*)
  if (accessToken.startsWith('dev-user-')) {
    console.log('🧪 [Admin getUserFromToken] Dev mode detected:', accessToken.substring(0, 30) + '...');
    
    let mockEmail = 'admin@casewhr.com';
    if (accessToken.includes('||')) {
      const parts = accessToken.split('||');
      mockEmail = parts[1] || mockEmail;
    }
    
    const mockUser = {
      id: accessToken.split('||')[0],
      email: mockEmail,
      user_metadata: { name: 'Dev Mode User' },
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log('✅ [Admin getUserFromToken] Mock user:', { id: mockUser.id, email: mockUser.email });
    return { user: mockUser, error: null };
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error) {
      console.log('ℹ️ [Admin getUserFromToken] Auth error:', error.message);
      return { user: null, error: { message: 'Invalid or expired token' } };
    }
    return { user, error: null };
  } catch (error: any) {
    console.log('⚠️ [Admin getUserFromToken] Error:', error instanceof Error ? error.message : 'Unknown error');
    return { user: null, error: { message: 'Invalid or expired token' } };
  }
}

// Helper function to add CORS headers to responses
function addCorsHeaders(response: Response): Response {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export function registerAdminApis(app: Hono) {
  
  // ==================== 💰 TRANSACTIONS ====================
  
  // Get all transactions (Admin) with filtering
  app.get("/make-server-215f78a5/admin/transactions", async (c) => {
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
      if (!adminCheck.isAnyAdmin(user.email)) {
        console.log('❌ [Admin] User', user.email, 'is not an admin');
        return c.json({ error: 'Admin access required' }, 403);
      }

      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '50');
      const type = c.req.query('type');
      const userId = c.req.query('user_id');
      const search = c.req.query('search');
      const amountMin = c.req.query('amount_min');
      const amountMax = c.req.query('amount_max');
      const dateFrom = c.req.query('date_from');
      const dateTo = c.req.query('date_to');

      const allTransactions = await kv.getByPrefix('transaction:') || [];
      
      if (allTransactions.length === 0) {
        return c.json({ transactions: [], total: 0, page, limit });
      }

      let filteredTransactions = allTransactions;

      if (type) {
        filteredTransactions = filteredTransactions.filter((t: any) => t.type === type);
      }

      if (userId) {
        filteredTransactions = filteredTransactions.filter((t: any) => t.user_id === userId);
      }

      if (search) {
        const searchLower = search.toLowerCase();
        filteredTransactions = filteredTransactions.filter((t: any) =>
          t.description?.toLowerCase().includes(searchLower) ||
          t.id?.toLowerCase().includes(searchLower)
        );
      }

      if (amountMin) {
        const min = parseFloat(amountMin);
        filteredTransactions = filteredTransactions.filter((t: any) => 
          Math.abs(t.amount) >= min
        );
      }

      if (amountMax) {
        const max = parseFloat(amountMax);
        filteredTransactions = filteredTransactions.filter((t: any) => 
          Math.abs(t.amount) <= max
        );
      }

      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filteredTransactions = filteredTransactions.filter((t: any) => 
          new Date(t.created_at) >= fromDate
        );
      }

      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filteredTransactions = filteredTransactions.filter((t: any) => 
          new Date(t.created_at) <= toDate
        );
      }

      const enrichedTransactions = await Promise.all(
        filteredTransactions.map(async (transaction: any) => {
          try {
            const userProfile = await kv.get(`profile_${transaction.user_id}`);
            const { data: authUser } = await supabase.auth.admin.getUserById(transaction.user_id);

            return {
              ...transaction,
              user_name: userProfile?.name || 'Unknown',
              user_email: authUser?.user?.email || 'Unknown',
            };
          } catch (err) {
            return transaction;
          }
        })
      );

      enrichedTransactions.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const total = enrichedTransactions.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTransactions = enrichedTransactions.slice(startIndex, endIndex);

      return c.json({
        transactions: paginatedTransactions,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('❌ [Admin] Error fetching transactions:', error);
      return c.json({ error: 'Failed to fetch transactions' }, 500);
    }
  });

  // Get transaction statistics (Admin)
  app.get("/make-server-215f78a5/admin/transactions/stats", async (c) => {
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
      if (!adminCheck.isAnyAdmin(user.email)) {
        console.log('❌ [Admin] User', user.email, 'is not an admin');
        return c.json({ error: 'Admin access required' }, 403);
      }

      const period = c.req.query('period') || 'all';
      const allTransactions = await kv.getByPrefix('transaction:') || [];

      let transactions = allTransactions;
      const now = new Date();

      if (period === 'day') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        transactions = allTransactions.filter((t: any) => 
          new Date(t.created_at) >= startOfDay
        );
      } else if (period === 'week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        transactions = allTransactions.filter((t: any) => 
          new Date(t.created_at) >= startOfWeek
        );
      } else if (period === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        transactions = allTransactions.filter((t: any) => 
          new Date(t.created_at) >= startOfMonth
        );
      }

      const stats = {
        total_amount: transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
        total_count: transactions.length,
        by_type: {
          deposit: {
            count: transactions.filter((t: any) => t.type === 'deposit').length,
            amount: transactions
              .filter((t: any) => t.type === 'deposit')
              .reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
          },
          escrow: {
            count: transactions.filter((t: any) => t.type === 'escrow').length,
            amount: transactions
              .filter((t: any) => t.type === 'escrow')
              .reduce((sum: number, t: any) => sum + Math.abs(t.amount || 0), 0),
          },
          payment: {
            count: transactions.filter((t: any) => t.type === 'payment').length,
            amount: transactions
              .filter((t: any) => t.type === 'payment')
              .reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
          },
          withdrawal: {
            count: transactions.filter((t: any) => t.type === 'withdrawal').length,
            amount: transactions
              .filter((t: any) => t.type === 'withdrawal')
              .reduce((sum: number, t: any) => sum + Math.abs(t.amount || 0), 0),
          },
          refund: {
            count: transactions.filter((t: any) => t.type === 'refund').length,
            amount: transactions
              .filter((t: any) => t.type === 'refund')
              .reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
          },
        },
        today_count: allTransactions.filter((t: any) => {
          const createdAt = new Date(t.created_at);
          return createdAt.toDateString() === now.toDateString();
        }).length,
        this_month_count: allTransactions.filter((t: any) => {
          const createdAt = new Date(t.created_at);
          return createdAt.getMonth() === now.getMonth() && 
                 createdAt.getFullYear() === now.getFullYear();
        }).length,
      };

      return c.json({ stats });
    } catch (error) {
      console.error('❌ [Admin] Error fetching transaction stats:', error);
      return c.json({ error: 'Failed to fetch transaction stats' }, 500);
    }
  });

  // Get single transaction details (Admin)
  app.get("/make-server-215f78a5/admin/transactions/:transactionId", async (c) => {
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
      if (!adminCheck.isAnyAdmin(user.email)) {
        console.log('❌ [Admin] User', user.email, 'is not an admin');
        return c.json({ error: 'Admin access required' }, 403);
      }

      const transactionId = c.req.param('transactionId');
      const transaction = await kv.get(`transaction:${transactionId}`);

      if (!transaction) {
        return c.json({ error: 'Transaction not found' }, 404);
      }

      const userProfile = await kv.get(`profile_${transaction.user_id}`);
      const { data: authUser } = await supabase.auth.admin.getUserById(transaction.user_id);

      let projectInfo = null;
      if (transaction.project_id) {
        const project = await kv.get(`project:${transaction.project_id}`);
        if (project) {
          projectInfo = {
            id: project.id,
            title: project.title,
            status: project.status,
          };
        }
      }

      return c.json({
        transaction: {
          ...transaction,
          user_name: userProfile?.name || 'Unknown',
          user_email: authUser?.user?.email || 'Unknown',
          user_profile: userProfile,
        },
        project: projectInfo,
      });
    } catch (error) {
      console.error('❌ [Admin] Error fetching transaction details:', error);
      return c.json({ error: 'Failed to fetch transaction details' }, 500);
    }
  });

  // ==================== 👑 MEMBERSHIPS ====================

  // Get all memberships/subscriptions (Admin)
  app.get("/make-server-215f78a5/admin/memberships", async (c) => {
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
      if (!adminCheck.isAnyAdmin(user.email)) {
        console.log('❌ [Admin] User', user.email, 'is not an admin');
        return c.json({ error: 'Admin access required' }, 403);
      }

      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '20');
      const tier = c.req.query('tier');
      const status = c.req.query('status');
      const search = c.req.query('search');

      const allSubscriptions = await kv.getByPrefix('subscription_') || [];
      
      if (allSubscriptions.length === 0) {
        return c.json({ memberships: [], total: 0, page, limit });
      }

      let filteredSubs = allSubscriptions;

      if (tier && tier !== 'all') {
        filteredSubs = filteredSubs.filter((s: any) => s.tier === tier);
      }

      if (status && status !== 'all') {
        filteredSubs = filteredSubs.filter((s: any) => s.status === status);
      }

      const enrichedSubs = await Promise.all(
        filteredSubs.map(async (sub: any) => {
          try {
            const userProfile = await kv.get(`profile_${sub.user_id}`);
            const { data: authUser } = await supabase.auth.admin.getUserById(sub.user_id);

            const now = new Date();
            const usageKey = `usage_${sub.user_id}_${now.getFullYear()}_${now.getMonth() + 1}`;
            const usage = await kv.get(usageKey) || { projects: 0, proposals: 0 };

            return {
              ...sub,
              user_name: userProfile?.name || 'Unknown',
              user_email: authUser?.user?.email || 'Unknown',
              current_usage: usage,
            };
          } catch (err) {
            return sub;
          }
        })
      );

      if (search) {
        const searchLower = search.toLowerCase();
        filteredSubs = enrichedSubs.filter((s: any) =>
          s.user_name?.toLowerCase().includes(searchLower) ||
          s.user_email?.toLowerCase().includes(searchLower) ||
          s.user_id?.toLowerCase().includes(searchLower)
        );
      } else {
        filteredSubs = enrichedSubs;
      }

      filteredSubs.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const total = filteredSubs.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedSubs = filteredSubs.slice(startIndex, endIndex);

      return c.json({
        memberships: paginatedSubs,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('❌ [Admin] Error fetching memberships:', error);
      return c.json({ error: 'Failed to fetch memberships' }, 500);
    }
  });

  // Get membership statistics (Admin)
  app.get("/make-server-215f78a5/admin/memberships/stats", async (c) => {
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
      if (!adminCheck.isAnyAdmin(user.email)) {
        console.log('❌ [Admin] User', user.email, 'is not an admin');
        return c.json({ error: 'Admin access required' }, 403);
      }

      const allSubs = await kv.getByPrefix('subscription_') || [];

      const stats = {
        total: allSubs.length,
        by_tier: {
          free: allSubs.filter((s: any) => s.tier === 'free').length,
          professional: allSubs.filter((s: any) => s.tier === 'professional').length,
          enterprise: allSubs.filter((s: any) => s.tier === 'enterprise').length,
        },
        by_status: {
          active: allSubs.filter((s: any) => s.status === 'active').length,
          cancelled: allSubs.filter((s: any) => s.status === 'cancelled').length,
          expired: allSubs.filter((s: any) => s.status === 'expired').length,
        },
        this_month: allSubs.filter((s: any) => {
          const createdAt = new Date(s.created_at);
          const now = new Date();
          return createdAt.getMonth() === now.getMonth() && 
                 createdAt.getFullYear() === now.getFullYear();
        }).length,
        monthly_revenue: allSubs
          .filter((s: any) => s.status === 'active' && s.billing_period === 'monthly')
          .reduce((sum: number, s: any) => {
            const prices = { professional: 29, enterprise: 99 };
            return sum + (prices[s.tier as keyof typeof prices] || 0);
          }, 0),
        annual_revenue: allSubs
          .filter((s: any) => s.status === 'active' && s.billing_period === 'annual')
          .reduce((sum: number, s: any) => {
            const prices = { professional: 290, enterprise: 990 };
            return sum + ((prices[s.tier as keyof typeof prices] || 0) / 12);
          }, 0),
      };

      return c.json({ stats });
    } catch (error) {
      console.error('❌ [Admin] Error fetching membership stats:', error);
      return c.json({ error: 'Failed to fetch membership stats' }, 500);
    }
  });

  // Update user subscription (Admin)
  app.put("/make-server-215f78a5/admin/memberships/:userId", async (c) => {
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
      if (!adminCheck.isAnyAdmin(user.email)) {
        console.log('❌ [Admin] User', user.email, 'is not an admin');
        return c.json({ error: 'Admin access required' }, 403);
      }

      const userId = c.req.param('userId');
      const { tier, end_date, reason } = await c.req.json();

      if (!tier || !reason) {
        return c.json({ error: 'Tier and reason are required' }, 400);
      }

      const validTiers = ['free', 'professional', 'enterprise'];
      if (!validTiers.includes(tier)) {
        return c.json({ error: 'Invalid tier' }, 400);
      }

      const subscriptionKey = `subscription_${userId}`;
      let subscription = await kv.get(subscriptionKey);

      if (!subscription) {
        subscription = {
          user_id: userId,
          tier: 'free',
          status: 'active',
          created_at: new Date().toISOString(),
        };
      }

      const oldTier = subscription.tier;
      subscription.tier = tier;
      subscription.status = 'active';
      subscription.updated_at = new Date().toISOString();
      
      if (end_date) {
        subscription.end_date = end_date;
      }

      subscription.admin_note = reason;
      subscription.last_admin_action = {
        action: 'tier_update',
        admin_id: user.id,
        old_tier: oldTier,
        new_tier: tier,
        timestamp: new Date().toISOString(),
        reason,
      };

      await kv.set(subscriptionKey, subscription);

      console.log('✅ [Admin] Subscription updated:', {
        userId,
        oldTier,
        newTier: tier,
        adminId: user.id,
        reason
      });

      return c.json({ success: true, subscription });
    } catch (error) {
      console.error('❌ [Admin] Error updating subscription:', error);
      return c.json({ error: 'Failed to update subscription' }, 500);
    }
  });

  // Cancel subscription (Admin)
  app.delete("/make-server-215f78a5/admin/memberships/:userId", async (c) => {
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
      if (!adminCheck.isAnyAdmin(user.email)) {
        console.log('❌ [Admin] User', user.email, 'is not an admin');
        return c.json({ error: 'Admin access required' }, 403);
      }

      const userId = c.req.param('userId');
      const { reason } = await c.req.json();

      if (!reason) {
        return c.json({ error: 'Reason is required' }, 400);
      }

      const subscriptionKey = `subscription_${userId}`;
      const subscription = await kv.get(subscriptionKey);

      if (!subscription) {
        return c.json({ error: 'Subscription not found' }, 404);
      }

      subscription.status = 'cancelled';
      subscription.cancelled_at = new Date().toISOString();
      subscription.cancelled_by = user.id;
      subscription.cancellation_reason = reason;

      await kv.set(subscriptionKey, subscription);

      console.log('✅ [Admin] Subscription cancelled:', {
        userId,
        adminId: user.id,
        reason
      });

      return c.json({ success: true, subscription });
    } catch (error) {
      console.error('❌ [Admin] Error cancelling subscription:', error);
      return c.json({ error: 'Failed to cancel subscription' }, 500);
    }
  });

  // ==================== 🏦 BANK ACCOUNTS ====================

  // Get all bank accounts (Admin)
  app.get("/make-server-215f78a5/admin/bank-accounts", async (c) => {
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
      if (!adminCheck.isAnyAdmin(user.email)) {
        console.log('❌ [Admin] User', user.email, 'is not an admin');
        return c.json({ error: 'Admin access required' }, 403);
      }

      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '20');
      const accountType = c.req.query('type');
      const search = c.req.query('search');
      const verifiedFilter = c.req.query('verified');

      // Get all bank accounts (new format: bank_account_*)
      const allBankAccounts = await kv.getByPrefix('bank_account_') || [];
      
      console.log(`🏦 [Admin] Found ${allBankAccounts.length} bank accounts`);

      if (allBankAccounts.length === 0) {
        return c.json({ accounts: [], total: 0, page, limit });
      }

      let filteredAccounts = allBankAccounts;

      if (accountType && accountType !== 'all') {
        filteredAccounts = filteredAccounts.filter((acc: any) => acc.account_type === accountType);
      }

      if (verifiedFilter && verifiedFilter !== 'all') {
        const isVerified = verifiedFilter === 'verified';
        filteredAccounts = filteredAccounts.filter((acc: any) => acc.verified === isVerified);
      }

      const enrichedAccounts = await Promise.all(
        filteredAccounts.map(async (account: any) => {
          try {
            const userProfile = await kv.get(`profile_${account.user_id}`);
            const { data: authUser } = await supabase.auth.admin.getUserById(account.user_id);

            return {
              ...account,
              user_name: userProfile?.name || 'Unknown',
              user_email: authUser?.user?.email || 'Unknown',
            };
          } catch (err) {
            return account;
          }
        })
      );

      if (search) {
        const searchLower = search.toLowerCase();
        filteredAccounts = enrichedAccounts.filter((acc: any) =>
          acc.user_name?.toLowerCase().includes(searchLower) ||
          acc.user_email?.toLowerCase().includes(searchLower) ||
          acc.bank_name?.toLowerCase().includes(searchLower) ||
          acc.masked_account_number?.toLowerCase().includes(searchLower)
        );
      } else {
        filteredAccounts = enrichedAccounts;
      }

      filteredAccounts.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const total = filteredAccounts.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedAccounts = filteredAccounts.slice(startIndex, endIndex);

      return c.json({
        accounts: paginatedAccounts,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('❌ [Admin] Error fetching bank accounts:', error);
      return c.json({ error: 'Failed to fetch bank accounts' }, 500);
    }
  });

  // Get bank account statistics (Admin)
  app.get("/make-server-215f78a5/admin/bank-accounts/stats", async (c) => {
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
      if (!adminCheck.isAnyAdmin(user.email)) {
        console.log('❌ [Admin] User', user.email, 'is not an admin');
        return c.json({ error: 'Admin access required' }, 403);
      }

      // Get all bank accounts (new format: bank_account_*)
      const allBankAccounts = await kv.getByPrefix('bank_account_') || [];
      
      console.log(`📊 [Admin] Calculating stats for ${allBankAccounts.length} bank accounts`);

      const stats = {
        total: allBankAccounts.length,
        by_type: {
          local: allBankAccounts.filter((acc: any) => acc.account_type === 'local').length,
          international: allBankAccounts.filter((acc: any) => acc.account_type === 'international').length,
        },
        by_verified: {
          verified: allBankAccounts.filter((acc: any) => acc.verified === true).length,
          unverified: allBankAccounts.filter((acc: any) => acc.verified !== true).length,
        },
        flagged: allBankAccounts.filter((acc: any) => acc.flagged === true).length,
        this_month: allBankAccounts.filter((acc: any) => {
          const createdAt = new Date(acc.created_at);
          const now = new Date();
          return createdAt.getMonth() === now.getMonth() && 
                 createdAt.getFullYear() === now.getFullYear();
        }).length,
      };

      return c.json({ stats });
    } catch (error) {
      console.error('❌ [Admin] Error fetching bank account stats:', error);
      return c.json({ error: 'Failed to fetch bank account stats' }, 500);
    }
  });

  // Update bank account verification status (Admin)
  app.put("/make-server-215f78a5/admin/bank-accounts/:accountId/verify", async (c) => {
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
      if (!adminCheck.isAnyAdmin(user.email)) {
        console.log('❌ [Admin] User', user.email, 'is not an admin');
        return c.json({ error: 'Admin access required' }, 403);
      }

      const accountId = c.req.param('accountId');
      const { verified, note } = await c.req.json();

      if (typeof verified !== 'boolean') {
        return c.json({ error: 'Verified status is required' }, 400);
      }

      // accountId is already the full key: bank_account_${userId}_${timestamp}
      const account = await kv.get(accountId);

      if (!account) {
        return c.json({ error: 'Bank account not found' }, 404);
      }

      account.verified = verified;
      account.verified_at = verified ? new Date().toISOString() : null;
      account.verified_by = verified ? user.id : null;
      account.admin_note = note || account.admin_note;
      account.updated_at = new Date().toISOString();

      await kv.set(accountId, account);

      console.log('✅ [Admin] Bank account verification updated:', {
        accountId,
        verified,
        adminId: user.id
      });

      return c.json({ success: true, account });
    } catch (error) {
      console.error('❌ [Admin] Error updating bank account verification:', error);
      return c.json({ error: 'Failed to update verification' }, 500);
    }
  });

  // Flag/unflag bank account (Admin)
  app.put("/make-server-215f78a5/admin/bank-accounts/:accountId/flag", async (c) => {
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
      if (!adminCheck.isAnyAdmin(user.email)) {
        console.log('❌ [Admin] User', user.email, 'is not an admin');
        return c.json({ error: 'Admin access required' }, 403);
      }

      const accountId = c.req.param('accountId');
      const { flagged, reason } = await c.req.json();

      if (typeof flagged !== 'boolean') {
        return c.json({ error: 'Flagged status is required' }, 400);
      }

      if (flagged && !reason) {
        return c.json({ error: 'Reason is required when flagging' }, 400);
      }

      // accountId is already the full key: bank_account_${userId}_${timestamp}
      const account = await kv.get(accountId);

      if (!account) {
        return c.json({ error: 'Bank account not found' }, 404);
      }

      account.flagged = flagged;
      account.flagged_at = flagged ? new Date().toISOString() : null;
      account.flagged_by = flagged ? user.id : null;
      account.flag_reason = flagged ? reason : null;
      account.updated_at = new Date().toISOString();

      await kv.set(accountId, account);

      console.log(`${flagged ? '⚠️' : '✅'} [Admin] Bank account ${flagged ? 'flagged' : 'unflagged'}:`, {
        accountId,
        adminId: user.id,
        reason
      });

      return c.json({ success: true, account });
    } catch (error) {
      console.error('❌ [Admin] Error flagging bank account:', error);
      return c.json({ error: 'Failed to flag bank account' }, 500);
    }
  });

  // Delete bank account (Admin)
  app.delete("/make-server-215f78a5/admin/bank-accounts/:accountId", async (c) => {
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
      if (!adminCheck.isAnyAdmin(user.email)) {
        console.log('❌ [Admin] User', user.email, 'is not an admin');
        return c.json({ error: 'Admin access required' }, 403);
      }

      const accountId = c.req.param('accountId');
      const { reason } = await c.req.json();

      if (!reason) {
        return c.json({ error: 'Reason is required' }, 400);
      }

      // accountId is already the full key: bank_account_${userId}_${timestamp}
      const account = await kv.get(accountId);

      if (!account) {
        return c.json({ error: 'Bank account not found' }, 404);
      }

      await kv.del(accountId);

      console.log('🗑️ [Admin] Bank account deleted:', {
        accountId,
        userId: account.user_id,
        adminId: user.id,
        reason
      });

      return c.json({ success: true });
    } catch (error) {
      console.error('❌ [Admin] Error deleting bank account:', error);
      return c.json({ error: 'Failed to delete bank account' }, 500);
    }
  });

  // ==================== 🔄 RESET ADMIN SYSTEM ====================
  
  // Reset admin system initialization (Admin - Super Admin only)
  app.post("/make-server-215f78a5/admin/reset-admin-system", async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!accessToken) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user?.id || !user?.email) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Check if user is super admin (only super admins can reset admin system)
      const isSuperAdmin = await adminCheck.isSuperAdminAsync(user.email);
      if (!isSuperAdmin) {
        console.log('❌ [Admin] User', user.email, 'is not a super admin');
        return c.json({ error: 'Super admin access required' }, 403);
      }

      console.log(`🔄 [Admin] Resetting admin system - Initiated by ${user.email}`);

      // Delete all admin-related keys from KV Store
      await kv.del('system:admins:initialized');
      await kv.del('system:admins:super');
      await kv.del('system:admins:regular');
      await kv.del('system:admins:moderator');
      await kv.del('system:admins:changelog');

      console.log('✅ [Admin] Admin system reset successfully');
      console.log('💡 [Admin] System will reinitialize on next API call');

      return c.json({
        success: true,
        message: 'Admin system reset successfully. It will reinitialize with current ROOT_ADMINS configuration on next API call.',
        reset_by: user.email,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ [Admin] Error resetting admin system:', error);
      return c.json({ 
        error: 'Failed to reset admin system',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });
}