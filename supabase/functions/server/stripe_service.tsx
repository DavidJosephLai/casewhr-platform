// Stripe Payment Service for Case Where Platform
// Handles Stripe Checkout, Webhooks, and Payment Processing

import Stripe from 'npm:stripe@14.10.0';
import * as kv from './kv_store.tsx';
import * as emailService from './email_service.tsx';

// Check if Stripe is configured
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';
const isStripeConfigured = STRIPE_SECRET_KEY && STRIPE_SECRET_KEY.length > 0;

// Initialize Stripe with API key (only if configured)
const stripe = isStripeConfigured 
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })
  : null;

// Stripe Webhook Secret for verifying webhook signatures
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

// Base URL for redirects (will be set from environment or request)
const getBaseUrl = () => {
  // Try to get from environment variable first
  const deploymentUrl = Deno.env.get('DEPLOYMENT_URL');
  if (deploymentUrl) return deploymentUrl;
  
  // Use production URL for Case Where platform
  const productionUrl = 'https://casewhr.com';
  if (productionUrl) return productionUrl;
  
  return 'http://localhost:5173'; // Fallback for development
};

// ==================== DEPOSIT (Stripe Checkout) ====================

export async function createCheckoutSession(params: {
  userId: string;
  amount: number;
  userEmail: string;
  userName?: string;
  language: 'en' | 'zh';
}) {
  const { userId, amount, userEmail, userName, language } = params;

  console.log('🔵 [Stripe] Creating checkout session:', { userId, amount, userEmail });

  // Check if Stripe is configured
  if (!isStripeConfigured || !stripe) {
    console.warn('⚠️ [Stripe] STRIPE_SECRET_KEY not configured - Stripe payments unavailable');
    return {
      configured: false,
      error: language === 'en'
        ? 'Stripe payment is currently unavailable. This is a demo environment. In production, please configure STRIPE_SECRET_KEY.'
        : 'Stripe 支付目前不可用。這是演示環境。在生產環境中，請配置 STRIPE_SECRET_KEY。',
      sessionId: null,
      url: null,
    };
  }

  // Validate amount
  if (amount < 1 || amount > 1000000) {
    throw new Error('Invalid amount. Must be between $1 and $1,000,000');
  }

  try {
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: language === 'en' 
                ? 'Wallet Deposit - Case Where' 
                : '錢包充值 - Case Where',
              description: language === 'en'
                ? `Add $${amount.toLocaleString()} to your wallet`
                : `充值 $${amount.toLocaleString()} 到您的錢包`,
              images: ['https://casewhere.com/logo.png'], // Optional: Add your logo
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${getBaseUrl()}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getBaseUrl()}/?payment=cancel`,
      customer_email: userEmail,
      metadata: {
        user_id: userId,
        type: 'wallet_deposit',
        amount: amount.toString(),
        user_name: userName || '',
        language: language,
      },
      // Enable billing address collection
      billing_address_collection: 'auto',
      // Session expires in 30 minutes
      expires_at: Math.floor(Date.now() / 1000) + 1800,
    });

    console.log('✅ [Stripe] Checkout session created:', session.id);

    // Save pending payment record
    const paymentKey = `stripe_payment:${session.id}`;
    await kv.set(paymentKey, {
      session_id: session.id,
      user_id: userId,
      amount: amount,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error: any) {
    console.error('❌ [Stripe] Error creating checkout session:', error);
    throw new Error(`Stripe error: ${error.message}`);
  }
}

// ==================== WEBHOOK HANDLER ====================

export async function handleWebhook(params: {
  signature: string;
  body: string;
}) {
  const { signature, body } = params;

  console.log('🔵 [Stripe] Handling webhook...');

  // Check if Stripe is configured
  if (!isStripeConfigured || !stripe) {
    console.error('❌ [Stripe] Cannot handle webhook: Stripe not configured');
    throw new Error('Stripe is not configured');
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      WEBHOOK_SECRET
    );

    console.log('✅ [Stripe] Webhook signature verified:', event.type);
  } catch (error: any) {
    console.error('❌ [Stripe] Webhook signature verification failed:', error.message);
    throw new Error(`Webhook Error: ${error.message}`);
  }

  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'checkout.session.expired':
      await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
      break;

    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      break;

    default:
      console.log(`ℹ️ [Stripe] Unhandled event type: ${event.type}`);
  }

  return { received: true };
}

// Handle successful checkout completion
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('🔵 [Stripe] Processing completed checkout:', session.id);

  const userId = session.metadata?.user_id;
  const amount = parseFloat(session.metadata?.amount || '0');
  const language = (session.metadata?.language || 'en') as 'en' | 'zh';

  if (!userId || !amount) {
    console.error('❌ [Stripe] Missing metadata in session');
    return;
  }

  try {
    // Get or create wallet
    const walletKey = `wallet_${userId}`;
    let wallet = await kv.get(walletKey);

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

    // Add deposit to wallet
    wallet.available_balance += amount;
    wallet.updated_at = new Date().toISOString();
    await kv.set(walletKey, wallet);

    // Record transaction
    const transactionKey = `transaction_${Date.now()}_${userId}`;
    await kv.set(transactionKey, {
      id: transactionKey,
      user_id: userId,
      type: 'deposit',
      amount: amount,
      status: 'completed',
      description: language === 'en' 
        ? `Wallet deposit via Stripe (${session.id})`
        : `Stripe 錢包充值 (${session.id})`,
      created_at: new Date().toISOString(),
      stripe_session_id: session.id,
      payment_intent_id: session.payment_intent,
    });

    // Update payment record
    const paymentKey = `stripe_payment:${session.id}`;
    await kv.set(paymentKey, {
      session_id: session.id,
      user_id: userId,
      amount: amount,
      status: 'completed',
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });

    console.log(`✅ [Stripe] Deposit processed: $${amount} added to wallet for user ${userId}`);

    // Send email notification
    try {
      const profile = await kv.get(`profile_${userId}`);  // 統一使用下劃線格式
      if (profile?.email) {
        let emailHtml = emailService.getDepositSuccessEmail({
          name: profile.name || 'User',
          amount: amount,
          newBalance: wallet.available_balance,
          language: language,
        });

        // 🎨 Apply branding for enterprise users
        const { getUserBranding, injectBranding } = await import('./branded_email_helper.tsx');
        const branding = await getUserBranding(userId);
        if (branding) {
          console.log('🎨 [Stripe Email] Applying branding for user:', userId);
          emailHtml = injectBranding(emailHtml, branding);
        }

        await emailService.sendEmail({
          to: profile.email,
          subject: language === 'en' 
            ? `Deposit Successful - $${amount.toLocaleString()}` 
            : `充值成功 - $${amount.toLocaleString()}`,
          html: emailHtml,
        });

        console.log(`✅ [Stripe] Deposit notification email sent${branding ? ' (branded)' : ''}`);
      }
    } catch (emailError) {
      console.error('⚠️ [Stripe] Failed to send deposit email:', emailError);
      // Don't throw - email failure shouldn't block the deposit
    }

  } catch (error) {
    console.error('❌ [Stripe] Error processing checkout completion:', error);
    throw error;
  }
}

// Handle expired checkout session
async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  console.log('🔵 [Stripe] Processing expired checkout:', session.id);

  const paymentKey = `stripe_payment:${session.id}`;
  await kv.set(paymentKey, {
    session_id: session.id,
    user_id: session.metadata?.user_id,
    amount: parseFloat(session.metadata?.amount || '0'),
    status: 'expired',
    created_at: new Date().toISOString(),
    expired_at: new Date().toISOString(),
  });

  console.log('��� [Stripe] Checkout session marked as expired');
}

// Handle successful payment intent
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('🔵 [Stripe] Payment succeeded:', paymentIntent.id);
  // Additional logic if needed
}

// Handle failed payment intent
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('❌ [Stripe] Payment failed:', paymentIntent.id);
  
  // Send failure notification email if possible
  try {
    const userId = paymentIntent.metadata?.user_id;
    const language = (paymentIntent.metadata?.language || 'en') as 'en' | 'zh';

    if (userId) {
      const profile = await kv.get(`profile_${userId}`);  // 統一使用下劃線格式
      if (profile?.email) {
        const emailHtml = emailService.getPaymentFailedEmail({
          name: profile.name || 'User',
          amount: paymentIntent.amount / 100,
          reason: paymentIntent.last_payment_error?.message || 'Unknown error',
          language: language,
        });

        await emailService.sendEmail({
          to: profile.email,
          subject: language === 'en' ? 'Payment Failed' : '付款失敗',
          html: emailHtml,
        });

        console.log('✅ [Stripe] Payment failure notification sent');
      }
    }
  } catch (emailError) {
    console.error('⚠️ [Stripe] Failed to send payment failure email:', emailError);
  }
}

// ==================== RETRIEVE SESSION ====================

export async function retrieveSession(sessionId: string) {
  // Check if Stripe is configured
  if (!isStripeConfigured || !stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error: any) {
    console.error('❌ [Stripe] Error retrieving session:', error);
    throw new Error(`Failed to retrieve session: ${error.message}`);
  }
}

// ==================== GET PAYMENT STATUS ====================

export async function getPaymentStatus(sessionId: string) {
  const paymentKey = `stripe_payment:${sessionId}`;
  const payment = await kv.get(paymentKey);
  return payment;
}

// ==================== REFUND PAYMENT ====================

export async function refundPayment(params: {
  paymentIntentId: string;
  amount?: number; // Optional: partial refund
  reason?: string;
}) {
  const { paymentIntentId, amount, reason } = params;

  console.log('🔵 [Stripe] Processing refund:', { paymentIntentId, amount });

  // Check if Stripe is configured
  if (!isStripeConfigured || !stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents
      reason: reason as Stripe.RefundCreateParams.Reason || 'requested_by_customer',
    });

    console.log('✅ [Stripe] Refund processed:', refund.id);

    return refund;
  } catch (error: any) {
    console.error('❌ [Stripe] Error processing refund:', error);
    throw new Error(`Refund error: ${error.message}`);
  }
}

// ==================== UTILITY FUNCTIONS ====================

// Format amount for display
export function formatAmount(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

// Validate Stripe configuration
export function validateStripeConfig(): boolean {
  const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!secretKey) {
    console.error('❌ [Stripe] STRIPE_SECRET_KEY not configured');
    return false;
  }

  if (!webhookSecret) {
    console.warn('⚠️ [Stripe] STRIPE_WEBHOOK_SECRET not configured (webhooks will not work)');
  }

  console.log('✅ [Stripe] Configuration validated');
  return true;
}

// Check if Stripe is configured (exported for other modules)
export { isStripeConfigured };

export default {
  createCheckoutSession,
  handleWebhook,
  retrieveSession,
  getPaymentStatus,
  refundPayment,
  formatAmount,
  validateStripeConfig,
  isStripeConfigured,
};