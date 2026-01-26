/**
 * 檢查訂閱是否有效
 */
export function isSubscriptionActive(subscription: any): boolean {
  if (!subscription) return false;
  
  return subscription.status === 'active' && 
         (subscription.plan === 'pro' || subscription.plan === 'enterprise');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💰 PayPal 訂閱 API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PAYPAL_MODE = Deno.env.get('PAYPAL_MODE') || 'sandbox';
const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID') || '';
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET') || '';

const PAYPAL_API_BASE = PAYPAL_MODE === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

console.log('🔍 [PayPal] Environment Configuration:', {
  mode: PAYPAL_MODE,
  apiBase: PAYPAL_API_BASE,
  clientIdSet: PAYPAL_CLIENT_ID ? '✅' : '❌',
  clientSecretSet: PAYPAL_CLIENT_SECRET ? '✅' : '❌'
});

/**
 * 獲取 PayPal Access Token
 */
async function getPayPalAccessToken(): Promise<string> {
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
    const error = await response.text();
    console.error('❌ [PayPal] Failed to get access token:', error);
    throw new Error('Failed to authenticate with PayPal');
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * 創建 PayPal 訂閱
 * 
 * @param userId - 用戶 ID
 * @param planType - 'pro' | 'enterprise'
 * @param returnUrl - 成功返回 URL
 * @param cancelUrl - 取消返回 URL
 * @returns { subscriptionId, approvalUrl }
 */
export async function createPayPalSubscription(
  userId: string,
  planType: 'pro' | 'enterprise',
  returnUrl: string,
  cancelUrl: string
): Promise<{ subscriptionId: string; approvalUrl: string }> {
  console.log('🟢 [PayPal] Creating subscription:', { userId, planType });

  // ⚠️ 注意：這裡需要先在 PayPal Dashboard 創建 Plan ID
  // Pro Plan: 每月 $15 USD
  // Enterprise Plan: 每月 $45 USD
  const planId = planType === 'pro' 
    ? 'P-XXXXXXXXXXXXXXXXXXXX' // TODO: 替換為實際的 PayPal Plan ID
    : 'P-YYYYYYYYYYYYYYYYYYYY'; // TODO: 替換為實際的 PayPal Plan ID

  const accessToken = await getPayPalAccessToken();

  const subscriptionData = {
    plan_id: planId,
    start_time: new Date(Date.now() + 60000).toISOString(), // 1 分鐘後開始
    application_context: {
      brand_name: 'CaseWHR',
      locale: 'en-US',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'SUBSCRIBE_NOW',
      payment_method: {
        payer_selected: 'PAYPAL',
        payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
      },
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  };

  console.log('📦 [PayPal] Subscription data:', JSON.stringify(subscriptionData, null, 2));

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(subscriptionData),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ [PayPal] Failed to create subscription:', error);
    throw new Error(`Failed to create PayPal subscription: ${error}`);
  }

  const data = await response.json();
  const subscriptionId = data.id;
  const approvalUrl = data.links.find((link: any) => link.rel === 'approve')?.href;

  if (!approvalUrl) {
    throw new Error('PayPal approval URL not found');
  }

  // 保存 pending 訂閱
  await kv.set(`paypal_subscription_pending_${subscriptionId}`, {
    subscription_id: subscriptionId,
    user_id: userId,
    plan_type: planType,
    status: 'PENDING',
    created_at: new Date().toISOString(),
  });

  console.log('✅ [PayPal] Subscription created:', subscriptionId);

  return {
    subscriptionId,
    approvalUrl,
  };
}

/**
 * 激活 PayPal 訂閱（用戶批准後）
 */
export async function activatePayPalSubscription(subscriptionId: string): Promise<void> {
  console.log('🔔 [PayPal] Activating subscription:', subscriptionId);

  const pendingData = await kv.get(`paypal_subscription_pending_${subscriptionId}`);

  if (!pendingData) {
    throw new Error('Pending subscription not found');
  }

  const { user_id, plan_type } = pendingData;

  // 從 PayPal 獲取訂閱詳情
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ [PayPal] Failed to get subscription details:', error);
    throw new Error('Failed to verify PayPal subscription');
  }

  const subscriptionData = await response.json();

  if (subscriptionData.status === 'ACTIVE') {
    // 創建本地訂閱記錄
    const amount = plan_type === 'pro' ? 15 : 45; // USD
    const userSubscription = {
      user_id,
      plan: plan_type,
      status: 'active',
      payment_method: 'paypal',
      paypal_subscription_id: subscriptionId,
      billing_cycle: 'monthly',
      amount,
      start_date: new Date().toISOString(),
      next_billing_date: (() => {
        const next = new Date();
        next.setMonth(next.getMonth() + 1);
        return next.toISOString();
      })(),
      auto_renew: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await kv.set(`subscription_${user_id}`, userSubscription);
    await kv.del(`paypal_subscription_pending_${subscriptionId}`);

    console.log(`✅ [PayPal] Subscription activated for user ${user_id}`);
  } else {
    throw new Error(`PayPal subscription status is ${subscriptionData.status}, expected ACTIVE`);
  }
}

/**
 * 取消 PayPal 訂閱
 */
export async function cancelPayPalSubscription(userId: string): Promise<void> {
  const userSubscription = await kv.get(`subscription_${userId}`);

  if (!userSubscription || userSubscription.payment_method !== 'paypal') {
    throw new Error('No PayPal subscription found for this user');
  }

  const subscriptionId = userSubscription.paypal_subscription_id;

  if (!subscriptionId) {
    throw new Error('PayPal subscription ID not found');
  }

  // 調用 PayPal API 取消訂閱
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason: 'User requested cancellation',
    }),
  });

  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    console.error('❌ [PayPal] Failed to cancel subscription:', error);
    throw new Error('Failed to cancel PayPal subscription');
  }

  // 更新本地訂閱狀態
  userSubscription.status = 'cancelled';
  userSubscription.cancelled_at = new Date().toISOString();
  userSubscription.auto_renew = false;
  userSubscription.updated_at = new Date().toISOString();

  await kv.set(`subscription_${userId}`, userSubscription);

  console.log(`✅ [PayPal] Subscription cancelled for user ${userId}`);
}