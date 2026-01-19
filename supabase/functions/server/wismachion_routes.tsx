import { Hono } from 'npm:hono@3.11.7';
import * as licenseService from './wismachion_license_service.tsx';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import Stripe from 'npm:stripe@14.10.0';
import * as kv from './kv_store.tsx';
import * as ecpayService from './ecpay_payment_service.tsx';

const wismachion = new Hono();

// ============================================
// PAYMENT CONFIGURATION
// ============================================

// Stripe
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' }) : null;

// PayPal
const PAYPAL_CLIENT_ID = (Deno.env.get('PAYPAL_CLIENT_ID') || '').trim();
const PAYPAL_CLIENT_SECRET = (Deno.env.get('PAYPAL_CLIENT_SECRET') || '').trim();
const PAYPAL_MODE = (Deno.env.get('PAYPAL_MODE') || 'live').trim();
const PAYPAL_API_BASE = PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

// ECPay
const ECPAY_MERCHANT_ID = Deno.env.get('ECPAY_MERCHANT_ID') || '';
const ECPAY_HASH_KEY = Deno.env.get('ECPAY_HASH_KEY') || '';
const ECPAY_HASH_IV = Deno.env.get('ECPAY_HASH_IV') || '';

// Supabase
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const projectId = SUPABASE_URL.replace('https://', '').split('.')[0];

// Base URL
const getBaseUrl = () => {
  return Deno.env.get('DEPLOYMENT_URL') || 'https://wismachion.com';
};

console.log('💳 [Wismachion Payments] Configuration:', {
  stripe: !!STRIPE_SECRET_KEY,
  paypal: !!(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET),
  ecpay: !!ECPAY_MERCHANT_ID
});

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get PayPal Access Token
async function getPayPalAccessToken(): Promise<string> {
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  return data.access_token;
}

// Send License Email
async function sendLicenseEmail(email: string, name: string, licenseKey: string, plan: string) {
  const planNames = {
    standard: 'PerfectComm Standard Edition',
    enterprise: 'PerfectComm Enterprise Edition'
  };

  const subject = `Your ${planNames[plan as keyof typeof planNames]} License Key`;
  
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Thank you for your purchase!</h2>
      
      <p>Dear ${name},</p>
      
      <p>Your PerfectComm license has been successfully activated. Here are your license details:</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">License Key:</h3>
        <div style="font-family: monospace; font-size: 24px; font-weight: bold; color: #1f2937; letter-spacing: 2px;">
          ${licenseKey}
        </div>
        <p style="margin-bottom: 0;"><strong>Plan:</strong> ${planNames[plan as keyof typeof planNames]}</p>
      </div>
      
      <h3>Download PerfectComm:</h3>
      <p>
        <a href="${getBaseUrl()}/download" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Download PerfectComm
        </a>
      </p>
      
      <h3>Installation Instructions:</h3>
      <ol>
        <li>Download and install PerfectComm</li>
        <li>Launch the application</li>
        <li>When prompted, enter your license key</li>
        <li>Click "Activate" to complete the activation</li>
      </ol>
      
      <h3>Need Help?</h3>
      <p>If you have any questions or need assistance, please contact us at <a href="mailto:support@wismachion.com">support@wismachion.com</a></p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #6b7280; font-size: 14px;">
        This is an automated email. Please do not reply to this message.<br>
        © 2024 Wismachion. All rights reserved.
      </p>
    </div>
  `;

  try {
    // Use Case Where's email service
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/make-server-215f78a5/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        to: email,
        subject,
        html: body
      })
    });

    if (response.ok) {
      console.log(`✅ [Email] License email sent to ${email}`);
    } else {
      console.error('❌ [Email] Failed to send license email:', await response.text());
    }
  } catch (error) {
    console.error('❌ [Email] Error sending license email:', error);
  }
}

// ============================================
// PUBLIC API - License Verification
// ============================================

// Verify license key (called by PerfectComm software)
wismachion.post('/verify-license', async (c) => {
  try {
    const { licenseKey, machineId, productVersion } = await c.req.json();
    
    if (!licenseKey) {
      return c.json({ valid: false, message: 'License key is required' }, 400);
    }
    
    const result = await licenseService.verifyLicense(licenseKey, machineId);
    
    // Log verification attempt
    console.log(`✅ [License Verification] ${licenseKey}, Machine: ${machineId}, Valid: ${result.valid}`);
    
    return c.json(result);
  } catch (error) {
    console.error('❌ [License Verification] Error:', error);
    return c.json({ valid: false, message: 'Verification failed' }, 500);
  }
});

// Deactivate machine
wismachion.post('/deactivate-machine', async (c) => {
  try {
    const { licenseKey, machineId } = await c.req.json();
    
    if (!licenseKey || !machineId) {
      return c.json({ success: false, message: 'License key and machine ID are required' }, 400);
    }
    
    const success = await licenseService.deactivateMachine(licenseKey, machineId);
    
    console.log(`✅ [Deactivation] ${licenseKey}, Machine: ${machineId}, Success: ${success}`);
    
    return c.json({ success, message: success ? 'Machine deactivated successfully' : 'License not found' });
  } catch (error) {
    console.error('❌ [Deactivation] Error:', error);
    return c.json({ success: false, message: 'Deactivation failed' }, 500);
  }
});

// ============================================
// PAYMENT API - Create Payment Sessions
// ============================================

// Create payment session
wismachion.post('/create-payment', async (c) => {
  try {
    const { plan, email, name, company, paymentMethod } = await c.req.json();
    
    if (!plan || !email || !name || !paymentMethod) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    const prices = {
      standard: { USD: 100, TWD: 3000 },
      enterprise: { USD: 200, TWD: 6000 }
    };
    
    const planPrice = prices[plan as keyof typeof prices];
    if (!planPrice) {
      return c.json({ error: 'Invalid plan' }, 400);
    }
    
    // Save pending order
    const orderId = `WIS${Date.now().toString().slice(-10)}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    await kv.set(`wismachion:pending-order:${orderId}`, {
      orderId,
      plan,
      email,
      name,
      company,
      paymentMethod,
      createdAt: new Date().toISOString()
    });
    
    // Create payment based on method
    if (paymentMethod === 'stripe') {
      // Stripe Payment
      if (!stripe) {
        return c.json({ error: 'Stripe not configured' }, 500);
      }
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `PerfectComm ${plan === 'standard' ? 'Standard' : 'Enterprise'} Edition`,
              description: 'RS-232 Communication Software License'
            },
            unit_amount: planPrice.USD * 100 // Stripe uses cents
          },
          quantity: 1
        }],
        mode: 'payment',
        success_url: `${getBaseUrl()}/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
        cancel_url: `${getBaseUrl()}/payment/cancel`,
        customer_email: email,
        metadata: {
          orderId,
          plan,
          email,
          name,
          company: company || ''
        }
      });
      
      console.log(`💳 [Stripe] Payment session created: ${session.id}`);
      
      return c.json({ 
        success: true, 
        paymentUrl: session.url,
        orderId
      });
      
    } else if (paymentMethod === 'paypal') {
      // PayPal Payment
      if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        return c.json({ error: 'PayPal not configured' }, 500);
      }
      
      try {
        const accessToken = await getPayPalAccessToken();
        
        console.log(`💰 [PayPal] Creating order for: ${email}, Plan: ${plan}, Amount: $${planPrice.USD}`);
        
        const orderPayload = {
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: 'USD',
              value: planPrice.USD.toString()
            },
            description: `PerfectComm ${plan === 'standard' ? 'Standard' : 'Enterprise'} Edition License`
          }],
          application_context: {
            return_url: `${getBaseUrl()}/payment/paypal-success?order_id=${orderId}`,
            cancel_url: `${getBaseUrl()}/payment/cancel`,
            brand_name: 'Wismachion',
            user_action: 'PAY_NOW'
          }
        };
        
        const order = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(orderPayload)
        });
        
        const orderData = await order.json();
        
        // Check for errors
        if (!order.ok || orderData.error) {
          console.error('❌ [PayPal] API Error:', orderData);
          return c.json({ 
            error: `PayPal Error: ${orderData.message || orderData.error_description || 'Unknown error'}`,
            details: orderData
          }, 500);
        }
        
        const approveLink = orderData.links?.find((link: any) => link.rel === 'approve');
        
        if (!approveLink) {
          console.error('❌ [PayPal] No approve link in response:', orderData);
          return c.json({ error: 'PayPal did not return approval URL' }, 500);
        }
        
        console.log(`✅ [PayPal] Order created: ${orderData.id}`);
        
        return c.json({
          success: true,
          paymentUrl: approveLink.href,
          orderId,
          paypalOrderId: orderData.id
        });
      } catch (paypalError: any) {
        console.error('❌ [PayPal] Exception:', paypalError);
        return c.json({ 
          error: 'Failed to create PayPal order',
          details: paypalError.message 
        }, 500);
      }
      
    } else if (paymentMethod === 'ecpay') {
      // ECPay Payment (Taiwan)
      if (!ECPAY_MERCHANT_ID || !ECPAY_HASH_KEY || !ECPAY_HASH_IV) {
        return c.json({ error: 'ECPay not configured' }, 500);
      }
      
      // Create ECPay payment
      console.log(`💳 [ECPay] Creating payment for order: ${orderId}`);
      
      const itemName = `PerfectComm ${plan === 'standard' ? 'Standard' : 'Enterprise'} Edition`;
      const tradeDesc = 'RS-232 Serial Communication Software License';
      
      const ecpayResult = await ecpayService.createPaymentForm({
        merchantTradeNo: orderId,
        tradeDesc,
        itemName,
        totalAmount: planPrice.TWD,
        returnUrl: `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/wismachion/ecpay-callback`,
        clientBackUrl: `${getBaseUrl()}/payment/success?order_id=${orderId}`,
        customField1: email,
        customField2: name,
        customField3: company || '',
        customField4: plan
      });
      
      if (ecpayResult.success && ecpayResult.formHtml) {
        console.log(`✅ [ECPay] Payment created: ${orderId}`);
        
        // Return the form HTML to be submitted from the frontend
        return c.json({
          success: true,
          paymentUrl: null, // ECPay uses form submission, not redirect URL
          formHtml: ecpayResult.formHtml,
          orderId
        });
      } else {
        console.error(`❌ [ECPay] Failed to create payment:`, ecpayResult.error);
        return c.json({ error: ecpayResult.error || 'Failed to create ECPay payment' }, 500);
      }
      
    } else {
      return c.json({ error: 'Invalid payment method' }, 400);
    }
    
  } catch (error) {
    console.error('❌ [Payment] Error creating payment:', error);
    return c.json({ error: 'Failed to create payment' }, 500);
  }
});

// ============================================
// PAYMENT WEBHOOKS & CALLBACKS
// ============================================

// Stripe Webhook
wismachion.post('/webhook/stripe', async (c) => {
  try {
    const sig = c.req.header('stripe-signature');
    const body = await c.req.text();
    
    if (!stripe) {
      return c.json({ error: 'Stripe not configured' }, 500);
    }
    
    const event = stripe.webhooks.constructEvent(
      body,
      sig!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    );
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const { orderId, plan, email, name, company } = session.metadata;
      
      console.log(`✅ [Stripe Webhook] Payment completed for order: ${orderId}`);
      
      // Create license
      const licenseKey = await licenseService.createLicense({
        email,
        name,
        company: company || '',
        plan,
        paymentMethod: 'stripe',
        transactionId: session.payment_intent,
        amount: session.amount_total / 100,
        currency: session.currency.toUpperCase()
      });
      
      // Send email
      await sendLicenseEmail(email, name, licenseKey, plan);
      
      // Clean up pending order
      await kv.del(`wismachion:pending-order:${orderId}`);
    }
    
    return c.json({ received: true });
  } catch (error) {
    console.error('❌ [Stripe Webhook] Error:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

// PayPal Success Callback
wismachion.post('/payment/paypal-complete', async (c) => {
  try {
    const { paypalOrderId, orderId } = await c.req.json();
    
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return c.json({ error: 'PayPal not configured' }, 500);
    }
    
    const accessToken = await getPayPalAccessToken();
    
    // Capture the payment
    const capture = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const captureData = await capture.json();
    
    if (captureData.status === 'COMPLETED') {
      // Get pending order
      const pendingOrder = await kv.get(`wismachion:pending-order:${orderId}`);
      
      if (!pendingOrder) {
        return c.json({ error: 'Order not found' }, 404);
      }
      
      console.log(`✅ [PayPal] Payment captured for order: ${orderId}`);
      
      // Create license
      const licenseKey = await licenseService.createLicense({
        email: pendingOrder.email,
        name: pendingOrder.name,
        company: pendingOrder.company || '',
        plan: pendingOrder.plan,
        paymentMethod: 'paypal',
        transactionId: captureData.id,
        amount: parseFloat(captureData.purchase_units[0].payments.captures[0].amount.value),
        currency: captureData.purchase_units[0].payments.captures[0].amount.currency_code
      });
      
      // Send email
      await sendLicenseEmail(pendingOrder.email, pendingOrder.name, licenseKey, pendingOrder.plan);
      
      // Clean up pending order
      await kv.del(`wismachion:pending-order:${orderId}`);
      
      return c.json({ 
        success: true, 
        licenseKey,
        message: 'Payment completed! License key sent to your email.'
      });
    } else {
      return c.json({ error: 'Payment not completed' }, 400);
    }
    
  } catch (error) {
    console.error('❌ [PayPal] Error completing payment:', error);
    return c.json({ error: 'Failed to complete payment' }, 500);
  }
});

// ECPay Callback (ReturnURL)
wismachion.post('/ecpay-callback', async (c) => {
  try {
    const formData = await c.req.formData();
    const data: any = {};
    
    // Convert FormData to object
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    console.log('💳 [ECPay Callback] Received:', data);
    
    // Verify callback from ECPay
    const isValid = ecpayService.verifyCallback(data);
    
    if (!isValid) {
      console.error('❌ [ECPay] Invalid callback signature');
      return c.text('0|Invalid signature');
    }
    
    const { MerchantTradeNo, RtnCode, TradeNo, TradeAmt, PaymentType, CustomField1, CustomField2, CustomField3, CustomField4 } = data;
    
    // Check if payment was successful (RtnCode = 1)
    if (RtnCode === '1' || RtnCode === 1) {
      // Get pending order
      const pendingOrder = await kv.get(`wismachion:pending-order:${MerchantTradeNo}`);
      
      if (!pendingOrder) {
        console.error(`❌ [ECPay] Order not found: ${MerchantTradeNo}`);
        return c.text('0|Order not found');
      }
      
      console.log(`✅ [ECPay] Payment successful for order: ${MerchantTradeNo}`);
      
      // Use custom fields or pending order data
      const email = CustomField1 || pendingOrder.email;
      const name = CustomField2 || pendingOrder.name;
      const company = CustomField3 || pendingOrder.company || '';
      const plan = CustomField4 || pendingOrder.plan;
      
      // Create license
      const licenseKey = await licenseService.createLicense({
        email,
        name,
        company,
        plan,
        paymentMethod: 'ecpay',
        transactionId: TradeNo,
        amount: parseInt(TradeAmt),
        currency: 'TWD'
      });
      
      console.log(`✅ [ECPay] License created: ${licenseKey}`);
      
      // Send email
      await sendLicenseEmail(email, name, licenseKey, plan);
      
      // Store license key for order lookup
      await kv.set(`wismachion:order-license:${MerchantTradeNo}`, licenseKey);
      
      // Clean up pending order
      await kv.del(`wismachion:pending-order:${MerchantTradeNo}`);
      
      // ECPay expects "1|OK" response
      return c.text('1|OK');
    } else {
      console.error(`❌ [ECPay] Payment failed for order: ${MerchantTradeNo}, RtnCode: ${RtnCode}`);
      return c.text('0|Payment failed');
    }
    
  } catch (error) {
    console.error('❌ [ECPay Callback] Error:', error);
    return c.text('0|Processing error');
  }
});

// ============================================
// CUSTOMER API - License Management
// ============================================

// Download installer (requires valid license)
wismachion.post('/download-installer', async (c) => {
  try {
    const { licenseKey, architecture } = await c.req.json();
    
    if (!licenseKey) {
      return c.json({ error: 'License key is required' }, 400);
    }
    
    if (!architecture || !['x64', 'x86'].includes(architecture)) {
      return c.json({ error: 'Invalid architecture. Must be x64 or x86' }, 400);
    }
    
    // Verify license is valid and active
    const license = await kv.get(`wismachion:licenses:${licenseKey}`);
    
    if (!license) {
      return c.json({ error: 'Invalid license key' }, 404);
    }
    
    if (license.status !== 'active') {
      return c.json({ error: `License is ${license.status}. Please contact support.` }, 403);
    }
    
    // Check if license has expired
    if (license.expiryDate !== 'lifetime') {
      const expiryDate = new Date(license.expiryDate);
      if (expiryDate < new Date()) {
        return c.json({ error: 'License has expired. Please renew your license.' }, 403);
      }
    }
    
    // Generate download URL from Supabase Storage
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const bucketName = 'make-215f78a5-wismachion-software';
    const fileName = `installers/latest/PerfectComm-Setup-${architecture}.exe`;
    
    // Create signed URL (valid for 24 hours)
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 86400); // 24 hours
    
    if (error) {
      console.error('❌ [Download] Error creating download URL:', error);
      return c.json({ error: 'Failed to generate download URL. Please try again.' }, 500);
    }
    
    if (!data?.signedUrl) {
      return c.json({ error: 'Software installer not found. Please contact support.' }, 404);
    }
    
    // Log download
    const downloadRecord = {
      licenseKey,
      architecture,
      downloadedAt: new Date().toISOString(),
      ipAddress: c.req.header('x-forwarded-for') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown'
    };
    
    await kv.set(`wismachion:download:${Date.now()}`, downloadRecord);
    
    console.log(`📥 [Download] License: ${licenseKey}, Arch: ${architecture}, IP: ${downloadRecord.ipAddress}`);
    
    // Get current software version
    const versionInfo = await kv.get('wismachion:software:current-version') || {
      version: '1.0.0',
      releaseDate: new Date().toISOString(),
      releaseNotes: 'Initial release'
    };
    
    return c.json({
      success: true,
      download_url: data.signedUrl,
      version: versionInfo.version,
      architecture,
      expiresIn: 86400, // 24 hours in seconds
      fileName: `PerfectComm-Setup-${versionInfo.version}-${architecture}.exe`
    });
    
  } catch (error) {
    console.error('❌ [Download] Error:', error);
    return c.json({ error: 'Download failed. Please try again later.' }, 500);
  }
});

// Get customer licenses
wismachion.post('/my-licenses', async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    
    const licenses = await licenseService.getCustomerLicenses(email);
    
    return c.json({ licenses });
  } catch (error) {
    console.error('❌ [Get Licenses] Error:', error);
    return c.json({ error: 'Failed to retrieve licenses' }, 500);
  }
});

// Check order status (for payment confirmation)
wismachion.post('/check-order', async (c) => {
  try {
    const { orderId } = await c.req.json();
    
    if (!orderId) {
      return c.json({ error: 'Order ID is required' }, 400);
    }
    
    // Check if order is still pending
    const pendingOrder = await kv.get(`wismachion:pending-order:${orderId}`);
    
    if (pendingOrder) {
      return c.json({ status: 'pending' });
    }
    
    // Check if license was created for this order
    const licenseKey = await kv.get(`wismachion:order-license:${orderId}`);
    
    if (licenseKey) {
      return c.json({ status: 'completed', licenseKey });
    }
    
    return c.json({ status: 'not_found' });
  } catch (error) {
    console.error('❌ [Check Order] Error:', error);
    return c.json({ error: 'Failed to check order status' }, 500);
  }
});

// ============================================
// ADMIN API - License Management
// ============================================

// Get all licenses (admin only)
wismachion.get('/admin/licenses', async (c) => {
  try {
    // TODO: Add admin authentication
    const licenses = await licenseService.getAllLicenses();
    
    return c.json({ licenses });
  } catch (error) {
    console.error('❌ [Admin] Error getting licenses:', error);
    return c.json({ error: 'Failed to retrieve licenses' }, 500);
  }
});

// Revoke license (admin only)
wismachion.post('/admin/revoke-license', async (c) => {
  try {
    // TODO: Add admin authentication
    const { licenseKey } = await c.req.json();
    
    if (!licenseKey) {
      return c.json({ error: 'License key is required' }, 400);
    }
    
    const success = await licenseService.revokeLicense(licenseKey);
    
    return c.json({ success, message: success ? 'License revoked' : 'License not found' });
  } catch (error) {
    console.error('❌ [Admin] Error revoking license:', error);
    return c.json({ error: 'Failed to revoke license' }, 500);
  }
});

// Extend license (admin only)
wismachion.post('/admin/extend-license', async (c) => {
  try {
    // TODO: Add admin authentication
    const { licenseKey, days } = await c.req.json();
    
    if (!licenseKey || !days) {
      return c.json({ error: 'License key and days are required' }, 400);
    }
    
    const success = await licenseService.extendLicense(licenseKey, days);
    
    return c.json({ success, message: success ? `License extended by ${days} days` : 'License not found' });
  } catch (error) {
    console.error('❌ [Admin] Error extending license:', error);
    return c.json({ error: 'Failed to extend license' }, 500);
  }
});

// Generate manual license (admin only)
wismachion.post('/admin/generate-license', async (c) => {
  try {
    // TODO: Add admin authentication
    const { email, name, company, plan } = await c.req.json();
    
    if (!email || !name || !plan) {
      return c.json({ error: 'Email, name, and plan are required' }, 400);
    }
    
    const licenseKey = await licenseService.createLicense({
      email,
      name,
      company: company || '',
      plan,
      paymentMethod: 'manual',
      transactionId: `MANUAL-${Date.now()}`,
      amount: 0,
      currency: 'USD'
    });
    
    // Send email
    await sendLicenseEmail(email, name, licenseKey, plan);
    
    return c.json({ success: true, licenseKey });
  } catch (error) {
    console.error('❌ [Admin] Error generating license:', error);
    return c.json({ error: 'Failed to generate license' }, 500);
  }
});

export default wismachion;