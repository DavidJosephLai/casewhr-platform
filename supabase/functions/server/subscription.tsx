import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import * as emailService from './email_service.tsx';

const subscription = new Hono();

// 獲取用戶訂閱信息
subscription.get('/subscription/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const subscription = await kv.get(`subscription:${userId}`);
    
    if (!subscription) {
      // 返回默認免費方案
      return c.json({
        subscription: {
          user_id: userId,
          plan: 'free',
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: null,
          auto_renew: false,
        },
      });
    }

    return c.json({ subscription: JSON.parse(subscription) });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return c.json({ error: 'Failed to fetch subscription' }, 500);
  }
});

// 升級/購買訂閱
subscription.post('/subscription/upgrade', async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 驗證用戶
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { plan, payment_method } = body;

    if (!['free', 'pro', 'enterprise'].includes(plan)) {
      return c.json({ error: 'Invalid plan' }, 400);
    }

    // 獲取當前訂閱
    const currentSubKey = await kv.get(`subscription:${user.id}`);
    const currentSub = currentSubKey ? JSON.parse(currentSubKey) : null;

    // 計算費用
    const prices: Record<string, number> = {
      free: 0,
      pro: 29,
      enterprise: 99,
    };
    const amount = prices[plan];

    // 如果不是免費方案，需要從錢包扣款
    if (amount > 0) {
      // 獲取用戶錢包 (使用新格式)
      let wallet = await kv.get(`wallet_${user.id}`);
      
      if (!wallet) {
        // 創建新錢包
        wallet = {
          user_id: user.id,
          available_balance: 0,
          pending_withdrawal: 0,
          total_earned: 0,
          total_spent: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      if (wallet.available_balance < amount) {
        return c.json({ error: 'Insufficient balance. Please top up your wallet first.' }, 400);
      }

      // 扣款
      wallet.available_balance -= amount;
      wallet.total_spent += amount;
      wallet.updated_at = new Date().toISOString();
      await kv.set(`wallet_${user.id}`, wallet);

      // 記錄交易
      const transactionId = crypto.randomUUID();
      const transaction = {
        id: transactionId,
        user_id: user.id,
        type: 'subscription_payment',
        amount: -amount,
        status: 'completed',
        description: `Subscription upgrade to ${plan} plan`,
        created_at: new Date().toISOString(),
      };
      
      await kv.set(`transaction:${transactionId}`, transaction);
      
      // 添加到用戶交易列表
      const userTransactions = await kv.get(`transactions:user:${user.id}`) || [];
      userTransactions.unshift(transactionId);
      await kv.set(`transactions:user:${user.id}`, userTransactions);
      
      console.log(`💳 Subscription payment: User ${user.id} paid $${amount} for ${plan} plan`);
    }

    // 創建新訂閱
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 一個月後到期

    const newSubscription = {
      user_id: user.id,
      plan,
      status: 'active',
      start_date: startDate.toISOString(),
      end_date: plan === 'free' ? null : endDate.toISOString(),
      auto_renew: payment_method === 'wallet' ? true : false,
      previous_plan: currentSub?.plan || 'free',
    };

    await kv.set(`subscription:${user.id}`, JSON.stringify(newSubscription));

    console.log(`✅ Subscription upgraded: User ${user.id} upgraded to ${plan} plan`);

    // 📧 發送訂閱升級成功郵件
    try {
      // Get user's profile (with backward compatibility)
      let profile = await kv.get(`profile_${user.id}`);
      if (!profile) {
        // Try old format
        profile = await kv.get(`profile:${user.id}`);
      }
      
      if (profile?.email) {
        const language = profile.language || 'en';
        
        // 格式化下次扣款日期
        const nextBillingFormatted = plan !== 'free' 
          ? endDate.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          : (language === 'en' ? 'N/A' : '無');
        
        let emailHtml = emailService.getSubscriptionSuccessEmail({
          name: profile.name || profile.full_name || profile.email,
          plan: plan,
          amount: amount,
          nextBillingDate: nextBillingFormatted,
          language,
        });

        // 🎨 Apply branding for enterprise users
        const { getUserBranding, injectBranding } = await import('./branded_email_helper.tsx');
        const branding = await getUserBranding(user.id);
        if (branding) {
          console.log('🎨 [Email] Applying branding to subscription email for user:', user.id);
          emailHtml = injectBranding(emailHtml, branding);
        }

        await emailService.sendEmail({
          to: profile.email,
          subject: language === 'en' 
            ? `🎉 Welcome to ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan!` 
            : `🎉 歡迎升級到 ${plan.charAt(0).toUpperCase() + plan.slice(1)} 方案！`,
          html: emailHtml,
        });
        
        console.log(`📧 Subscription success email sent to ${profile.email}${branding ? ' (branded)' : ''}`);
      } else {
        console.log(`⚠️ No profile or email found for user ${user.id}, skipping email`);
      }
    } catch (emailError) {
      console.error('❌ Error sending subscription success email:', emailError);
      // 不因為郵件發送失敗而中斷訂閱流程
    }

    return c.json({
      success: true,
      subscription: newSubscription,
      amount_charged: amount,
    });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    return c.json({ error: 'Failed to upgrade subscription' }, 500);
  }
});

// 取消訂閱（降級到免費）
subscription.post('/subscription/cancel', async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // 獲取當前訂閱
    const currentSubKey = await kv.get(`subscription:${user.id}`);
    if (!currentSubKey) {
      return c.json({ error: 'No active subscription found' }, 404);
    }

    const currentSub = JSON.parse(currentSubKey);

    // 標記為已取消，但保留到期末
    const cancelledSub = {
      ...currentSub,
      status: 'cancelled',
      auto_renew: false,
      cancelled_at: new Date().toISOString(),
    };

    await kv.set(`subscription:${user.id}`, JSON.stringify(cancelledSub));

    return c.json({
      success: true,
      message: 'Subscription cancelled. You will retain access until the end of your billing period.',
      subscription: cancelledSub,
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return c.json({ error: 'Failed to cancel subscription' }, 500);
  }
});

// 檢查用戶的使用統計（本月已發布專案數、已提交提案數）
subscription.get('/subscription/usage/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    // 獲取本月開始時間
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 獲取用戶專案
    const projectKeys = await kv.getByPrefix('project:');
    const projects = projectKeys
      .map(k => JSON.parse(k))
      .filter(p => p.user_id === userId && new Date(p.created_at) >= monthStart);

    // 獲取用戶提案
    const proposalKeys = await kv.getByPrefix('proposal:');
    const proposals = proposalKeys
      .map(p => JSON.parse(p))
      .filter(p => p.freelancer_id === userId && new Date(p.created_at) >= monthStart);

    return c.json({
      usage: {
        projects_this_month: projects.length,
        proposals_this_month: proposals.length,
        period_start: monthStart.toISOString(),
        period_end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return c.json({ error: 'Failed to fetch usage statistics' }, 500);
  }
});

// 檢查用戶的訂閱限制和使用狀況
subscription.get('/subscription/check-limits/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    // 獲取用戶訂閱
    const subscriptionKey = await kv.get(`subscription:${userId}`);
    const sub = subscriptionKey ? JSON.parse(subscriptionKey) : { plan: 'free', status: 'active' };
    
    // 定義各方案限制
    const planLimits: Record<string, { projects: number; proposals: number }> = {
      free: { projects: 3, proposals: 5 },
      pro: { projects: 20, proposals: 50 },
      enterprise: { projects: 999999, proposals: 999999 },
    };
    
    const limits = planLimits[sub.plan] || planLimits.free;
    
    // 獲取本月使用統計
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 獲取用戶專案（本月發布的）
    const projectKeys = await kv.getByPrefix('project:');
    const projects = projectKeys
      .map(k => JSON.parse(k))
      .filter(p => p.user_id === userId && new Date(p.created_at) >= monthStart);

    // 獲取用戶提案（本月提交的）
    const proposalKeys = await kv.getByPrefix('proposal:');
    const proposals = proposalKeys
      .map(p => JSON.parse(p))
      .filter(p => p.freelancer_id === userId && new Date(p.created_at) >= monthStart);

    const usage = {
      projects: projects.length,
      proposals: proposals.length,
    };

    return c.json({
      plan: sub.plan,
      limits,
      usage,
      canCreateProject: usage.projects < limits.projects,
      canSubmitProposal: usage.proposals < limits.proposals,
    });
  } catch (error) {
    console.error('Error checking subscription limits:', error);
    return c.json({ error: 'Failed to check subscription limits' }, 500);
  }
});

export default subscription;