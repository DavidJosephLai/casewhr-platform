import { Hono } from 'npm:hono@3.11.7';
import * as licenseService from './wismachion_license_service.tsx';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const wismachion = new Hono();

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
    console.log(`License verification: ${licenseKey}, Machine: ${machineId}, Result: ${result.valid}`);
    
    return c.json(result);
  } catch (error) {
    console.error('License verification error:', error);
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
    
    return c.json({ success, message: success ? 'Machine deactivated successfully' : 'License not found' });
  } catch (error) {
    console.error('Deactivation error:', error);
    return c.json({ success: false, message: 'Deactivation failed' }, 500);
  }
});

// ============================================
// CUSTOMER API - Purchase & Management
// ============================================

// Purchase license
wismachion.post('/purchase', async (c) => {
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
    
    // Determine currency based on payment method
    const currency = paymentMethod === 'ecpay' ? 'TWD' : 'USD';
    const amount = currency === 'TWD' ? planPrice.TWD : planPrice.USD;
    
    // For now, create a mock transaction
    // In production, integrate with actual payment gateways
    const transactionId = `MOCK-${Date.now()}`;
    
    // Create license
    const licenseKey = await licenseService.createLicense({
      email,
      name,
      company,
      plan,
      paymentMethod,
      transactionId,
      amount,
      currency
    });
    
    // Send email with license key (integrate with email service)
    console.log(`License created: ${licenseKey} for ${email}`);
    
    // Return license key for demo purposes
    // In production, only send via email
    return c.json({ 
      success: true, 
      licenseKey,
      message: 'Purchase successful! License key has been sent to your email.' 
    });
  } catch (error) {
    console.error('Purchase error:', error);
    return c.json({ error: 'Purchase failed' }, 500);
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
    console.error('Get licenses error:', error);
    return c.json({ error: 'Failed to retrieve licenses' }, 500);
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
    console.error('Get all licenses error:', error);
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
    console.error('Revoke license error:', error);
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
    console.error('Extend license error:', error);
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
      company,
      plan,
      paymentMethod: 'manual',
      transactionId: `MANUAL-${Date.now()}`,
      amount: 0,
      currency: 'USD'
    });
    
    return c.json({ success: true, licenseKey });
  } catch (error) {
    console.error('Generate license error:', error);
    return c.json({ error: 'Failed to generate license' }, 500);
  }
});

export default wismachion;
