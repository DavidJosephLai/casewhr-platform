// PayPal Payment Service for Case Where Platform
// Handles PayPal Orders, Payments, and Webhooks

import * as kv from './kv_store.tsx';
import { sendDepositConfirmation } from './deposit_email_helper.tsx';

// PayPal Configuration
const PAYPAL_CLIENT_ID = (Deno.env.get('PAYPAL_CLIENT_ID') || '').trim();
const PAYPAL_CLIENT_SECRET = (Deno.env.get('PAYPAL_CLIENT_SECRET') || '').trim();
const PAYPAL_MODE = (Deno.env.get('PAYPAL_MODE') || 'live').trim(); // 'sandbox' or 'live' - ✅ 生產環境

// PayPal API Base URLs
const PAYPAL_API_BASE = PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Check if PayPal is configured
const isPayPalConfigured = PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET;

console.log('🅿️ [PayPal] Service initialized:', {
  configured: isPayPalConfigured,
  mode: PAYPAL_MODE,
  api_base: PAYPAL_API_BASE,
  clientIdLength: PAYPAL_CLIENT_ID.length,
  secretLength: PAYPAL_CLIENT_SECRET.length,
  clientIdPreview: PAYPAL_CLIENT_ID ? `${PAYPAL_CLIENT_ID.substring(0, 15)}...${PAYPAL_CLIENT_ID.substring(PAYPAL_CLIENT_ID.length - 10)}` : 'NOT SET',
});

/**
 * Get PayPal access token
 */
async function getAccessToken(): Promise<string> {
  if (!isPayPalConfigured) {
    throw new Error('PayPal is not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.');
  }

  console.log('🔐 [PayPal] Attempting to get access token...', {
    clientId: PAYPAL_CLIENT_ID ? `${PAYPAL_CLIENT_ID.substring(0, 10)}...` : 'NOT SET',
    secretSet: !!PAYPAL_CLIENT_SECRET,
    mode: PAYPAL_MODE,
    apiBase: PAYPAL_API_BASE,
    // Show first and last 10 chars to help verify credentials
    clientIdPreview: PAYPAL_CLIENT_ID ? `${PAYPAL_CLIENT_ID.substring(0, 10)}...${PAYPAL_CLIENT_ID.substring(PAYPAL_CLIENT_ID.length - 10)}` : 'NOT SET',
    secretPreview: PAYPAL_CLIENT_SECRET ? `${PAYPAL_CLIENT_SECRET.substring(0, 10)}...${PAYPAL_CLIENT_SECRET.substring(PAYPAL_CLIENT_SECRET.length - 10)}` : 'NOT SET',
  });

  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [PayPal] Failed to get access token:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      clientIdLength: PAYPAL_CLIENT_ID.length,
      secretLength: PAYPAL_CLIENT_SECRET.length,
    });
    
    // Try to parse error details
    try {
      const errorJson = JSON.parse(errorText);
      console.error('❌ [PayPal] Error details:', errorJson);
      
      if (errorJson.error === 'invalid_client') {
        throw new Error('Invalid PayPal credentials. Please check your PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.');
      }
    } catch (e) {
      // Error is not JSON
    }
    
    throw new Error('Failed to authenticate with PayPal. Please check your API credentials.');
  }

  const data = await response.json();
  console.log('✅ [PayPal] Access token obtained successfully');
  return data.access_token;
}

/**
 * Create PayPal Order
 */
export async function createOrder(userId: string, amount: number, origin?: string): Promise<{ orderId: string; approvalUrl: string }> {
  if (!isPayPalConfigured) {
    throw new Error('PayPal is not configured');
  }

  // Validate amount
  if (amount < 1) {
    throw new Error('Minimum deposit amount is $1 USD');
  }

  if (amount > 10000) {
    throw new Error('Maximum deposit amount is $10,000 USD');
  }

  const accessToken = await getAccessToken();

  // Get deployment URL for return/cancel URLs
  // Use origin from request header if available to maintain www/non-www consistency
  const deploymentUrl = Deno.env.get('DEPLOYMENT_URL');
  const productionUrl = 'https://casewhr.com';
  const baseUrl = origin || deploymentUrl || productionUrl || 'http://localhost:5173';

  console.log('🌐 [PayPal] Using base URL:', baseUrl, '(origin:', origin, ')');

  const orderData = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: 'USD',
          value: amount.toFixed(2),
        },
        description: `Case Where 錢包充值 - $${amount} USD`,
        custom_id: userId, // Store user ID for webhook processing
      },
    ],
    application_context: {
      brand_name: 'Case Where 接得準公司',
      landing_page: 'BILLING',
      user_action: 'PAY_NOW',
      return_url: `${baseUrl}/?payment=success&provider=paypal`,
      cancel_url: `${baseUrl}/?payment=cancel&provider=paypal`,
    },
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ [PayPal] Failed to create order:', error);
    throw new Error(error.message || 'Failed to create PayPal order');
  }

  const order = await response.json();
  
  // Find the approval URL
  const approvalUrl = order.links.find((link: any) => link.rel === 'approve')?.href;
  
  if (!approvalUrl) {
    throw new Error('Failed to get PayPal approval URL');
  }

  // Store order in KV for verification
  await kv.set(`paypal_order:${order.id}`, {
    orderId: order.id,
    userId,
    amount,
    status: 'CREATED',
    createdAt: new Date().toISOString(),
  });

  console.log('✅ [PayPal] Order created:', {
    orderId: order.id,
    userId,
    amount,
    approvalUrl,
  });

  return {
    orderId: order.id,
    approvalUrl,
  };
}

/**
 * Capture PayPal Payment
 */
export async function capturePayment(orderId: string): Promise<{ success: boolean; userId: string; amount: number }> {
  if (!isPayPalConfigured) {
    throw new Error('PayPal is not configured');
  }

  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ [PayPal] Failed to capture payment:', error);
    throw new Error(error.message || 'Failed to capture PayPal payment');
  }

  const capture = await response.json();
  
  // Verify capture status
  if (capture.status !== 'COMPLETED') {
    throw new Error(`Payment status is ${capture.status}, expected COMPLETED`);
  }

  // Get stored order data from KV store
  let orderData = await kv.get(`paypal_order:${orderId}`);
  
  // If order not found in KV store (edge case), try to extract from PayPal response
  if (!orderData) {
    console.warn('⚠️ [PayPal] Order not found in KV store, attempting to extract from PayPal response');
    
    // Extract user_id from custom_id in PayPal response
    const userId = capture.purchase_units?.[0]?.custom_id;
    const capturedAmount = parseFloat(
      capture.purchase_units[0]?.payments?.captures[0]?.amount?.value || '0'
    );
    
    if (!userId) {
      throw new Error('Order not found and no custom_id in PayPal response');
    }
    
    if (!capturedAmount || capturedAmount <= 0) {
      throw new Error('Invalid captured amount');
    }
    
    // Reconstruct order data from PayPal response
    orderData = {
      orderId: orderId,
      userId: userId,
      amount: capturedAmount,
      status: 'CREATED',
      createdAt: new Date().toISOString(),
    };
    
    console.log('✅ [PayPal] Reconstructed order data from PayPal response:', orderData);
  }

  const { userId, amount } = orderData;

  // Get the actual captured amount
  const capturedAmount = parseFloat(
    capture.purchase_units[0]?.payments?.captures[0]?.amount?.value || '0'
  );

  // Verify amounts match
  if (Math.abs(capturedAmount - amount) > 0.01) {
    console.error('❌ [PayPal] Amount mismatch:', { expected: amount, captured: capturedAmount });
    throw new Error('Payment amount mismatch');
  }

  // Update wallet balance - Use correct wallet key format
  const walletKey = `wallet_${userId}`; // ✅ Fixed: was wallet:${userId}
  let wallet = await kv.get(walletKey);
  
  // Create wallet if it doesn't exist
  if (!wallet) {
    wallet = {
      user_id: userId,
      available_balance: 0,
      pending_withdrawal: 0,
      total_earned: 0,
      total_spent: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  
  // Update balance
  wallet.available_balance = (wallet.available_balance || 0) + amount;
  wallet.updated_at = new Date().toISOString();
  await kv.set(walletKey, wallet);

  console.log('💰 [PayPal] Wallet updated:', {
    userId,
    oldBalance: (wallet.available_balance || 0) - amount,
    newBalance: wallet.available_balance,
    depositAmount: amount,
  });

  // Record transaction
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  await kv.set(`transaction:${transactionId}`, {
    id: transactionId,
    userId,
    type: 'deposit',
    amount,
    currency: 'USD',
    provider: 'paypal',
    paypalOrderId: orderId,
    status: 'completed',
    createdAt: new Date().toISOString(),
  });

  // Update order status
  await kv.set(`paypal_order:${orderId}`, {
    ...orderData,
    status: 'COMPLETED',
    capturedAt: new Date().toISOString(),
    transactionId,
  });

  // Send confirmation email
  try {
    const user = await kv.get(`user:${userId}`);
    if (user?.email) {
      await sendDepositConfirmation(user.email, amount, 'USD', 'PayPal');
    }
  } catch (emailError) {
    console.error('⚠️ [PayPal] Failed to send confirmation email:', emailError);
    // Don't throw - email failure shouldn't fail the payment
  }

  console.log('✅ [PayPal] Payment captured:', {
    orderId,
    userId,
    amount,
    transactionId,
    newBalance: wallet.available_balance,
  });

  return {
    success: true,
    userId,
    amount,
  };
}

/**
 * Verify PayPal Webhook Signature
 */
export async function verifyWebhook(headers: any, body: string): Promise<boolean> {
  // PayPal webhook verification
  // This is a simplified version - in production, you should verify the signature
  // against PayPal's public certificate
  
  const webhookId = Deno.env.get('PAYPAL_WEBHOOK_ID');
  if (!webhookId) {
    console.warn('⚠️ [PayPal] PAYPAL_WEBHOOK_ID not set, skipping webhook verification');
    return true; // In development, accept all webhooks
  }

  // TODO: Implement proper webhook signature verification
  // See: https://developer.paypal.com/docs/api-basics/notifications/webhooks/notification-messages/#verify-webhook-signature
  
  return true;
}

/**
 * Get PayPal configuration status
 */
export function getConfigStatus() {
  return {
    configured: isPayPalConfigured,
    mode: PAYPAL_MODE,
    clientIdSet: !!PAYPAL_CLIENT_ID,
    clientSecretSet: !!PAYPAL_CLIENT_SECRET,
  };
}

/**
 * Get order details
 */
export async function getOrderDetails(orderId: string) {
  return await kv.get(`paypal_order:${orderId}`);
}