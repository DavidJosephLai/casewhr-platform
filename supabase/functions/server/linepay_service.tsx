import { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// LINE Pay Payment interface
export interface LinePayPayment {
  id: string;
  user_id: string;
  user_email: string;
  payment_type: 'subscription' | 'deposit' | 'project';
  amount_twd: number;
  amount_usd: number;
  region: string; // TW, JP, TH, KR
  currency: string; // TWD, JPY, THB, KRW
  local_amount: number; // Amount in local currency
  exchange_rate?: number;
  status: 'pending' | 'processing' | 'confirmed' | 'failed' | 'cancelled';
  plan?: string; // For subscription type
  project_id?: string; // For project payment
  transaction_id?: string; // LINE Pay transaction ID
  payment_url?: string; // LINE Pay payment URL
  notes?: string;
  created_at: string;
  confirmed_at?: string;
  expires_at?: string;
}

// Helper: Generate unique payment ID
function generatePaymentId(): string {
  return `linepay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper: Get user from access token
async function getUserFromToken(accessToken: string | undefined) {
  if (!accessToken) {
    return { user: null, error: { message: 'No access token provided' } };
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    return { user, error };
  } catch (error) {
    console.error('[LINE Pay] Auth error:', error);
    return { user: null, error: { message: 'Invalid or expired token' } };
  }
}

// Create LINE Pay payment
export async function createLinePayPayment(data: {
  user_id: string;
  user_email: string;
  payment_type: 'subscription' | 'deposit' | 'project';
  amount_twd: number;
  amount_usd: number;
  region: string;
  currency: string;
  local_amount: number;
  plan?: string;
  project_id?: string;
}): Promise<{ success: boolean; payment?: LinePayPayment; error?: string }> {
  try {
    // Create payment record
    const payment: LinePayPayment = {
      id: generatePaymentId(),
      user_id: data.user_id,
      user_email: data.user_email,
      payment_type: data.payment_type,
      amount_twd: data.amount_twd,
      amount_usd: data.amount_usd,
      region: data.region,
      currency: data.currency,
      local_amount: data.local_amount,
      status: 'pending',
      plan: data.plan,
      project_id: data.project_id,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    };

    // In production, you would call LINE Pay API here to get payment URL
    // For now, we'll use a sandbox URL
    payment.payment_url = `https://sandbox-web-pay.line.me/web/payment/wait?transactionReserveId=${payment.id}`;

    // Save to KV store
    await kv.set(`linepay_payment:${payment.id}`, payment);
    
    // Save to user's payment list
    const userPayments = await kv.get(`linepay_payments:user:${data.user_id}`) || [];
    userPayments.unshift(payment.id);
    await kv.set(`linepay_payments:user:${data.user_id}`, userPayments);

    // Save to status list
    const pendingPayments = await kv.get('linepay_payments:status:pending') || [];
    pendingPayments.push(payment.id);
    await kv.set('linepay_payments:status:pending', pendingPayments);

    console.log('[LINE Pay] Payment created:', payment.id);
    return { success: true, payment };
  } catch (error) {
    console.error('[LINE Pay] Error creating payment:', error);
    return { success: false, error: 'Failed to create payment record' };
  }
}

// Get payment by ID
export async function getLinePayPayment(paymentId: string): Promise<LinePayPayment | null> {
  try {
    return await kv.get(`linepay_payment:${paymentId}`);
  } catch (error) {
    console.error('[LINE Pay] Error getting payment:', error);
    return null;
  }
}

// Confirm LINE Pay payment
export async function confirmLinePayPayment(
  paymentId: string,
  transactionId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payment = await getLinePayPayment(paymentId);
    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    if (payment.status !== 'pending' && payment.status !== 'processing') {
      return { success: false, error: `Payment already ${payment.status}` };
    }

    // Process based on payment type
    let processResult;
    if (payment.payment_type === 'deposit') {
      processResult = await processDeposit(payment);
    } else if (payment.payment_type === 'subscription') {
      processResult = await processSubscription(payment);
    } else if (payment.payment_type === 'project') {
      processResult = await processProjectPayment(payment);
    } else {
      return { success: false, error: 'Unknown payment type' };
    }

    if (!processResult.success) {
      return processResult;
    }

    // Update payment status
    payment.status = 'confirmed';
    payment.confirmed_at = new Date().toISOString();
    payment.transaction_id = transactionId;

    await kv.set(`linepay_payment:${payment.id}`, payment);

    // Update status lists
    const pendingPayments = await kv.get('linepay_payments:status:pending') || [];
    const confirmedPayments = await kv.get('linepay_payments:status:confirmed') || [];
    
    const updatedPending = pendingPayments.filter((id: string) => id !== payment.id);
    confirmedPayments.push(payment.id);
    
    await kv.set('linepay_payments:status:pending', updatedPending);
    await kv.set('linepay_payments:status:confirmed', confirmedPayments);

    console.log('[LINE Pay] Payment confirmed:', payment.id);
    return { success: true };
  } catch (error) {
    console.error('[LINE Pay] Error confirming payment:', error);
    return { success: false, error: 'Failed to confirm payment' };
  }
}

// Process wallet deposit
async function processDeposit(payment: LinePayPayment): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[LINE Pay] Processing deposit for user ${payment.user_email}: $${payment.amount_usd}`);

    // Get user's wallet
    let wallet = await kv.get(`wallet:${payment.user_id}`);
    
    if (!wallet) {
      wallet = {
        user_id: payment.user_id,
        available_balance: 0,
        pending_withdrawal: 0,
        total_earned: 0,
        total_spent: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // Add deposit amount
    wallet.available_balance += payment.amount_usd;
    wallet.updated_at = new Date().toISOString();

    await kv.set(`wallet:${payment.user_id}`, wallet);

    // Create transaction record
    const transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: payment.user_id,
      type: 'deposit',
      amount: payment.amount_usd,
      status: 'completed',
      description: `LINE Pay deposit - NT$${payment.amount_twd.toLocaleString()}`,
      created_at: new Date().toISOString(),
      payment_method: 'linepay',
      linepay_payment_id: payment.id,
    };

    await kv.set(`transaction:${transaction.id}`, transaction);

    const userTransactions = await kv.get(`transactions:${payment.user_id}`) || [];
    userTransactions.unshift(transaction.id);
    await kv.set(`transactions:${payment.user_id}`, userTransactions);

    console.log(`[LINE Pay] Deposit processed: $${payment.amount_usd}`);
    return { success: true };
  } catch (error) {
    console.error('[LINE Pay] Error processing deposit:', error);
    return { success: false, error: 'Failed to process deposit' };
  }
}

// Process subscription payment
async function processSubscription(payment: LinePayPayment): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[LINE Pay] Processing subscription for user ${payment.user_email}`);

    // Determine plan based on amount
    let plan = 'free';
    let duration = 'monthly';
    
    if (payment.amount_twd === 300 || payment.amount_usd === 9.9) {
      plan = 'professional';
      duration = 'monthly';
    } else if (payment.amount_twd === 3000 || payment.amount_usd === 99) {
      plan = 'professional';
      duration = 'yearly';
    } else if (payment.amount_twd === 900 || payment.amount_usd === 29) {
      plan = 'enterprise';
      duration = 'monthly';
    } else if (payment.amount_twd === 9000 || payment.amount_usd === 290) {
      plan = 'enterprise';
      duration = 'yearly';
    }

    // Get user's profile (with backward compatibility)
    let profile = await kv.get(`profile_${payment.user_id}`);
    if (!profile) {
      // Try old format
      profile = await kv.get(`profile:${payment.user_id}`);
    }
    
    if (!profile) {
      console.error('[LINE Pay] Profile not found for user:', payment.user_id);
      return { success: false, error: 'User profile not found' };
    }

    // Calculate subscription end date
    const now = new Date();
    const endDate = new Date(now);
    if (duration === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Update profile with subscription
    profile.membership_tier = plan;
    profile.subscription_end_date = endDate.toISOString();
    profile.subscription_status = 'active';
    profile.payment_method = 'linepay';
    profile.updated_at = new Date().toISOString();

    // Save with new format
    await kv.set(`profile_${payment.user_id}`, profile);

    console.log(`[LINE Pay] Subscription processed: ${plan} (${duration})`);
    return { success: true };
  } catch (error) {
    console.error('[LINE Pay] Error processing subscription:', error);
    return { success: false, error: 'Failed to process subscription' };
  }
}

// Process project payment
async function processProjectPayment(payment: LinePayPayment): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[LINE Pay] Processing project payment for user ${payment.user_email}`);
    
    if (!payment.project_id) {
      return { success: false, error: 'Project ID is required' };
    }

    // Get project
    const project = await kv.get(`project:${payment.project_id}`);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    // Update project payment status
    project.payment_status = 'paid';
    project.payment_method = 'linepay';
    project.linepay_payment_id = payment.id;
    project.updated_at = new Date().toISOString();

    await kv.set(`project:${payment.project_id}`, project);

    // Move funds to escrow
    let escrow = await kv.get(`escrow:${payment.project_id}`);
    if (!escrow) {
      escrow = {
        project_id: payment.project_id,
        client_id: payment.user_id,
        freelancer_id: project.freelancer_id,
        amount: payment.amount_usd,
        status: 'held',
        created_at: new Date().toISOString(),
      };
    } else {
      escrow.amount += payment.amount_usd;
      escrow.updated_at = new Date().toISOString();
    }

    await kv.set(`escrow:${payment.project_id}`, escrow);

    console.log(`[LINE Pay] Project payment processed: ${payment.project_id}`);
    return { success: true };
  } catch (error) {
    console.error('[LINE Pay] Error processing project payment:', error);
    return { success: false, error: 'Failed to process project payment' };
  }
}

// Get user's LINE Pay payments
export async function getUserLinePayPayments(userId: string): Promise<LinePayPayment[]> {
  try {
    const paymentIds = await kv.get(`linepay_payments:user:${userId}`) || [];
    const payments: LinePayPayment[] = [];
    
    for (const id of paymentIds) {
      const payment = await kv.get(`linepay_payment:${id}`);
      if (payment) {
        payments.push(payment);
      }
    }
    
    return payments;
  } catch (error) {
    console.error('[LINE Pay] Error getting user payments:', error);
    return [];
  }
}

// Register LINE Pay API routes
export function registerLinePayRoutes(app: any) {
  console.log('[LINE Pay] Registering LINE Pay routes...');

  // Create payment
  app.post('/make-server-215f78a5/linepay-payments/create', async (c: Context) => {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);

    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      const body = await c.req.json();
      
      const result = await createLinePayPayment({
        user_id: user.id,
        user_email: user.email || '',
        ...body,
      });

      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json({ payment: result.payment });
    } catch (error) {
      console.error('[LINE Pay API] Error creating payment:', error);
      return c.json({ error: 'Failed to create payment' }, 500);
    }
  });

  // Get user's payments
  app.get('/make-server-215f78a5/linepay-payments/my-payments', async (c: Context) => {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);

    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      const payments = await getUserLinePayPayments(user.id);
      return c.json({ payments });
    } catch (error) {
      console.error('[LINE Pay API] Error getting payments:', error);
      return c.json({ error: 'Failed to get payments' }, 500);
    }
  });

  // Confirm payment (webhook or manual)
  app.post('/make-server-215f78a5/linepay-payments/:id/confirm', async (c: Context) => {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);

    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const paymentId = c.req.param('id');
    const body = await c.req.json();
    
    try {
      const result = await confirmLinePayPayment(paymentId, body.transaction_id);

      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json({ success: true });
    } catch (error) {
      console.error('[LINE Pay API] Error confirming payment:', error);
      return c.json({ error: 'Failed to confirm payment' }, 500);
    }
  });

  // Get payment status
  app.get('/make-server-215f78a5/linepay-payments/:id/status', async (c: Context) => {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);

    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const paymentId = c.req.param('id');
    
    try {
      const payment = await getLinePayPayment(paymentId);
      
      if (!payment) {
        return c.json({ error: 'Payment not found' }, 404);
      }

      // Verify payment belongs to user
      if (payment.user_id !== user.id) {
        return c.json({ error: 'Unauthorized' }, 403);
      }

      return c.json({ 
        status: payment.status,
        transaction_id: payment.transaction_id,
        confirmed_at: payment.confirmed_at,
      });
    } catch (error) {
      console.error('[LINE Pay API] Error getting payment status:', error);
      return c.json({ error: 'Failed to get payment status' }, 500);
    }
  });

  console.log('[LINE Pay] Routes registered successfully');
}