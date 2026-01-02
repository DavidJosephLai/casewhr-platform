import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Helper: Get user from access token
async function getUserFromToken(accessToken: string | undefined) {
  if (!accessToken) {
    return { user: null, error: 'No access token provided' };
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !user) {
    return { user: null, error: 'Unauthorized' };
  }

  return { user, error: null };
}

// Helper: Get current subscription
async function getCurrentSubscription(userId: string) {
  const subscriptions = await kv.getByPrefix(`subscription:${userId}:`);
  
  if (!subscriptions || subscriptions.length === 0) {
    return null;
  }

  // Get the most recent active subscription
  const activeSubscriptions = subscriptions
    .filter((sub: any) => sub.status === 'active')
    .sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  return activeSubscriptions[0] || null;
}

// POST /subscription/subscribe - Create new subscription
app.post('/subscribe', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error: authError } = await getUserFromToken(accessToken);

    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { plan_type, billing_cycle, payment_method, amount } = body;

    // Validate input
    if (!plan_type || !billing_cycle || !payment_method || !amount) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Check if user already has an active subscription
    const existingSubscription = await getCurrentSubscription(user.id);
    if (existingSubscription && existingSubscription.status === 'active') {
      return c.json({ error: 'You already have an active subscription' }, 400);
    }

    // Handle wallet payment
    if (payment_method === 'wallet') {
      // Get wallet balance
      const walletData = await kv.get(`wallet:${user.id}`);
      const currentBalance = walletData?.balance || 0;

      if (currentBalance < amount) {
        return c.json({ error: 'Insufficient wallet balance' }, 400);
      }

      // Deduct from wallet
      const newBalance = currentBalance - amount;
      await kv.set(`wallet:${user.id}`, { balance: newBalance });

      // Record transaction
      const transactionId = crypto.randomUUID();
      await kv.set(`transaction:${transactionId}`, {
        id: transactionId,
        user_id: user.id,
        type: 'subscription_payment',
        amount: -amount,
        balance_after: newBalance,
        created_at: new Date().toISOString(),
        description: `Subscription payment - ${plan_type} (${billing_cycle})`,
      });
    }

    // Create subscription
    const subscriptionId = crypto.randomUUID();
    const startDate = new Date();
    const endDate = new Date();
    
    // Calculate end date based on billing cycle
    if (billing_cycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const subscription = {
      id: subscriptionId,
      user_id: user.id,
      plan_type,
      billing_cycle,
      status: 'active',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      amount,
      payment_method,
      auto_renew: true,
      created_at: new Date().toISOString(),
    };

    await kv.set(`subscription:${user.id}:${subscriptionId}`, subscription);

    // Record payment
    const paymentId = crypto.randomUUID();
    await kv.set(`subscription_payment:${paymentId}`, {
      id: paymentId,
      subscription_id: subscriptionId,
      user_id: user.id,
      amount,
      payment_method,
      status: 'completed',
      created_at: new Date().toISOString(),
    });

    return c.json({ 
      success: true, 
      subscription,
      message: 'Subscription created successfully' 
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    return c.json({ error: 'Failed to create subscription' }, 500);
  }
});

// GET /subscription/current - Get current subscription
app.get('/current', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error: authError } = await getUserFromToken(accessToken);

    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }

    const subscription = await getCurrentSubscription(user.id);

    // Check if subscription has expired
    if (subscription && new Date(subscription.end_date) < new Date()) {
      subscription.status = 'expired';
      await kv.set(`subscription:${user.id}:${subscription.id}`, subscription);
    }

    return c.json({ subscription });

  } catch (error) {
    console.error('Get subscription error:', error);
    return c.json({ error: 'Failed to get subscription' }, 500);
  }
});

// POST /subscription/cancel - Cancel subscription
app.post('/cancel', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error: authError } = await getUserFromToken(accessToken);

    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }

    const subscription = await getCurrentSubscription(user.id);

    if (!subscription) {
      return c.json({ error: 'No active subscription found' }, 404);
    }

    // Update subscription to disable auto-renewal
    subscription.auto_renew = false;
    subscription.status = 'cancelled';
    await kv.set(`subscription:${user.id}:${subscription.id}`, subscription);

    return c.json({ 
      success: true,
      message: 'Subscription cancelled. You will retain access until the end of your billing period.' 
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    return c.json({ error: 'Failed to cancel subscription' }, 500);
  }
});

// GET /subscription/check/:userId - Check if user has active subscription (for permission checks)
app.get('/check/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    const subscription = await getCurrentSubscription(userId);
    
    const isActive = subscription && 
                     subscription.status === 'active' && 
                     new Date(subscription.end_date) > new Date();

    return c.json({ 
      has_subscription: isActive,
      plan_type: isActive ? subscription.plan_type : 'free',
      subscription: isActive ? subscription : null
    });

  } catch (error) {
    console.error('Check subscription error:', error);
    return c.json({ error: 'Failed to check subscription' }, 500);
  }
});

// GET /subscription/payments - Get payment history
app.get('/payments', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error: authError } = await getUserFromToken(accessToken);

    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }

    const payments = await kv.getByPrefix(`subscription_payment:`);
    const userPayments = payments
      ? payments
          .filter((p: any) => p.user_id === user.id)
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      : [];

    return c.json({ payments: userPayments });

  } catch (error) {
    console.error('Get payments error:', error);
    return c.json({ error: 'Failed to get payment history' }, 500);
  }
});

export default app;
