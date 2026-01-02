import { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Payout Account interface
export interface PayoutAccount {
  id: string;
  user_id: string;
  account_type: 'local_taiwan' | 'international_bank' | 'paypal' | 'wise';
  currency: string;
  
  // Taiwan local bank
  bank_name?: string;
  bank_code?: string;
  account_number?: string;
  account_holder?: string;
  
  // International bank
  swift_code?: string;
  iban?: string;
  routing_number?: string;
  bank_address?: string;
  
  // PayPal
  paypal_email?: string;
  
  // Wise
  wise_email?: string;
  
  is_verified: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Withdrawal Request interface
export interface WithdrawalRequest {
  id: string;
  user_id: string;
  account_id: string;
  amount: number;
  fee: number;
  net_amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  processed_at?: string;
  completed_at?: string;
  notes?: string;
}

// Helper: Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    console.error('[InternationalPayout] Auth error:', error);
    return { user: null, error: { message: 'Invalid or expired token' } };
  }
}

// Calculate withdrawal fee
function calculateFee(amount: number, accountType: string): number {
  switch (accountType) {
    case 'local_taiwan':
      return 15 / 30; // NT$15 converted to USD
    case 'international_bank':
      return 25; // Fixed $25 fee + intermediary fees
    case 'paypal':
      return amount * 0.02; // 2% fee
    case 'wise':
      return amount * 0.01; // ~1% fee
    default:
      return 0;
  }
}

// Get all payout accounts for user
export async function getUserAccounts(userId: string): Promise<PayoutAccount[]> {
  try {
    const accountIds = await kv.get(`payout_accounts:user:${userId}`) || [];
    const accounts: PayoutAccount[] = [];
    
    for (const id of accountIds) {
      const account = await kv.get(`payout_account:${id}`);
      if (account) {
        accounts.push(account);
      }
    }
    
    return accounts.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error) {
    console.error('[InternationalPayout] Error getting accounts:', error);
    return [];
  }
}

// Add payout account
export async function addPayoutAccount(
  userId: string,
  data: Partial<PayoutAccount>
): Promise<{ success: boolean; account?: PayoutAccount; error?: string }> {
  try {
    // Check if this is the first account (make it default)
    const existingAccounts = await getUserAccounts(userId);
    const isFirst = existingAccounts.length === 0;
    
    const account: PayoutAccount = {
      id: generateId('payout'),
      user_id: userId,
      account_type: data.account_type!,
      currency: data.currency!,
      bank_name: data.bank_name,
      bank_code: data.bank_code,
      account_number: data.account_number,
      account_holder: data.account_holder,
      swift_code: data.swift_code,
      iban: data.iban,
      routing_number: data.routing_number,
      bank_address: data.bank_address,
      paypal_email: data.paypal_email,
      wise_email: data.wise_email,
      is_verified: false, // Needs admin verification
      is_default: isFirst, // First account is default
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Save account
    await kv.set(`payout_account:${account.id}`, account);
    
    // Add to user's account list
    const userAccounts = await kv.get(`payout_accounts:user:${userId}`) || [];
    userAccounts.push(account.id);
    await kv.set(`payout_accounts:user:${userId}`, userAccounts);
    
    console.log('[InternationalPayout] Account added:', account.id);
    return { success: true, account };
  } catch (error) {
    console.error('[InternationalPayout] Error adding account:', error);
    return { success: false, error: 'Failed to add account' };
  }
}

// Create withdrawal request
export async function createWithdrawal(
  userId: string,
  accountId: string,
  amount: number
): Promise<{ success: boolean; withdrawal?: WithdrawalRequest; error?: string }> {
  try {
    // Get account
    const account = await kv.get(`payout_account:${accountId}`);
    if (!account) {
      return { success: false, error: 'Account not found' };
    }
    
    // Verify account belongs to user
    if (account.user_id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }
    
    // Check if account is verified
    if (!account.is_verified) {
      return { success: false, error: 'Account not verified. Please contact support.' };
    }
    
    // Get user wallet
    const wallet = await kv.get(`wallet:${userId}`);
    if (!wallet) {
      return { success: false, error: 'Wallet not found' };
    }
    
    // Check balance
    if (wallet.available_balance < amount) {
      return { success: false, error: 'Insufficient balance' };
    }
    
    // Calculate fee
    const fee = calculateFee(amount, account.account_type);
    const netAmount = amount - fee;
    
    if (netAmount <= 0) {
      return { success: false, error: 'Amount too small after fees' };
    }
    
    // Create withdrawal request
    const withdrawal: WithdrawalRequest = {
      id: generateId('withdrawal'),
      user_id: userId,
      account_id: accountId,
      amount,
      fee,
      net_amount: netAmount,
      currency: account.currency,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    
    // Update wallet (lock funds)
    wallet.available_balance -= amount;
    wallet.pending_withdrawal += amount;
    wallet.updated_at = new Date().toISOString();
    await kv.set(`wallet:${userId}`, wallet);
    
    // Save withdrawal request
    await kv.set(`withdrawal:${withdrawal.id}`, withdrawal);
    
    // Add to user's withdrawal list
    const userWithdrawals = await kv.get(`withdrawals:${userId}`) || [];
    userWithdrawals.unshift(withdrawal.id);
    await kv.set(`withdrawals:${userId}`, userWithdrawals);
    
    // Add to pending list
    const pendingWithdrawals = await kv.get('withdrawals:pending') || [];
    pendingWithdrawals.push(withdrawal.id);
    await kv.set('withdrawals:pending', pendingWithdrawals);
    
    // Create transaction record
    const transaction = {
      id: generateId('txn'),
      user_id: userId,
      type: 'withdrawal',
      amount: -amount,
      status: 'pending',
      description: `Withdrawal to ${account.account_type} (${account.currency})`,
      created_at: new Date().toISOString(),
      withdrawal_id: withdrawal.id,
    };
    
    await kv.set(`transaction:${transaction.id}`, transaction);
    
    const userTransactions = await kv.get(`transactions:${userId}`) || [];
    userTransactions.unshift(transaction.id);
    await kv.set(`transactions:${userId}`, userTransactions);
    
    console.log('[InternationalPayout] Withdrawal created:', withdrawal.id);
    return { success: true, withdrawal };
  } catch (error) {
    console.error('[InternationalPayout] Error creating withdrawal:', error);
    return { success: false, error: 'Failed to create withdrawal' };
  }
}

// Get user's withdrawal history
export async function getUserWithdrawals(userId: string): Promise<WithdrawalRequest[]> {
  try {
    const withdrawalIds = await kv.get(`withdrawals:${userId}`) || [];
    const withdrawals: WithdrawalRequest[] = [];
    
    for (const id of withdrawalIds) {
      const withdrawal = await kv.get(`withdrawal:${id}`);
      if (withdrawal) {
        withdrawals.push(withdrawal);
      }
    }
    
    return withdrawals;
  } catch (error) {
    console.error('[InternationalPayout] Error getting withdrawals:', error);
    return [];
  }
}

// Register API routes
export function registerInternationalPayoutRoutes(app: any) {
  console.log('[InternationalPayout] Registering routes...');
  
  // Get user's payout accounts
  app.get('/make-server-215f78a5/payout-accounts', async (c: Context) => {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    try {
      const accounts = await getUserAccounts(user.id);
      return c.json({ accounts });
    } catch (error) {
      console.error('[InternationalPayout API] Error getting accounts:', error);
      return c.json({ error: 'Failed to get accounts' }, 500);
    }
  });
  
  // Add payout account
  app.post('/make-server-215f78a5/payout-accounts', async (c: Context) => {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    try {
      const body = await c.req.json();
      const result = await addPayoutAccount(user.id, body);
      
      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }
      
      return c.json({ account: result.account });
    } catch (error) {
      console.error('[InternationalPayout API] Error adding account:', error);
      return c.json({ error: 'Failed to add account' }, 500);
    }
  });
  
  // Create withdrawal
  app.post('/make-server-215f78a5/payout-accounts/withdraw', async (c: Context) => {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    try {
      const body = await c.req.json();
      const { account_id, amount } = body;
      
      if (!account_id || !amount) {
        return c.json({ error: 'Missing required fields' }, 400);
      }
      
      const result = await createWithdrawal(user.id, account_id, amount);
      
      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }
      
      return c.json({ withdrawal: result.withdrawal });
    } catch (error) {
      console.error('[InternationalPayout API] Error creating withdrawal:', error);
      return c.json({ error: 'Failed to create withdrawal' }, 500);
    }
  });
  
  // Get withdrawal history
  app.get('/make-server-215f78a5/payout-accounts/withdrawals', async (c: Context) => {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);
    
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    try {
      const withdrawals = await getUserWithdrawals(user.id);
      return c.json({ withdrawals });
    } catch (error) {
      console.error('[InternationalPayout API] Error getting withdrawals:', error);
      return c.json({ error: 'Failed to get withdrawals' }, 500);
    }
  });
  
  console.log('[InternationalPayout] Routes registered successfully');
}
