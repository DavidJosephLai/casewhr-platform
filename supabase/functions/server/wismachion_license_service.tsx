import * as kv from './kv_store.tsx';

// License Key Generator
export function generateLicenseKey(plan: 'standard' | 'enterprise' | 'trial'): string {
  // 🆕 試用版授權格式
  if (plan === 'trial') {
    const prefix = 'PC-TRIAL';
    const segments = [];
    
    for (let i = 0; i < 3; i++) {
      const segment = Math.random().toString(36).substring(2, 6).toUpperCase();
      segments.push(segment);
    }
    
    return `${prefix}-${segments.join('-')}`;
  }
  
  // 標準版和企業版授權
  const prefix = plan === 'standard' ? 'PC-STD' : 'PC-ENT';
  const segments = [];
  
  for (let i = 0; i < 3; i++) {
    const segment = Math.random().toString(36).substring(2, 6).toUpperCase();
    segments.push(segment);
  }
  
  return `${prefix}-${segments.join('-')}`;
}

// 🆕 Create trial license (90 days free - EXTENDED!)
export async function createTrialLicense(data: {
  email: string;
  name: string;
  company?: string;
}): Promise<string> {
  // 🔥 RELAXED: Allow multiple trials per email (removed restriction)
  // Check if email already has trial - NOW COMMENTED OUT
  /*
  const existingTrials = await kv.getByPrefix(`wismachion:customer:${data.email}:`);
  if (existingTrials && existingTrials.length > 0) {
    // Check if any existing license is a trial
    for (const trial of existingTrials) {
      const licenseKey = trial as string;
      const license: any = await kv.get(`wismachion:license:${licenseKey}`);
      if (license?.isTrial) {
        throw new Error('You have already used a trial license. Please purchase a license to continue using PerfectComm.');
      }
    }
  }
  */
  
  const licenseKey = generateLicenseKey('trial');
  const now = new Date();
  const expiryDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 🔥 EXTENDED: 90 days (was 30)
  
  const license = {
    licenseKey,
    email: data.email,
    name: data.name,
    company: data.company || '',
    plan: 'trial',
    status: 'active',
    createdAt: now.toISOString(),
    expiryDate: expiryDate.toISOString(),
    maxActivations: 1, // Trial limited to 1 activation
    activations: [],
    paymentMethod: 'trial',
    transactionId: `trial_${Date.now()}`,
    amount: 0,
    currency: 'TWD',
    isTrial: true,
    trialDays: 90
  };
  
  await kv.set(`wismachion:license:${licenseKey}`, license);
  await kv.set(`wismachion:customer:${data.email}:${licenseKey}`, licenseKey);
  
  console.log(`🎁 [Wismachion Trial] Created trial license for ${data.email}: ${licenseKey}`);
  
  return licenseKey;
}

// Create new license
export async function createLicense(data: {
  email: string;
  name: string;
  company?: string;
  plan: 'standard' | 'enterprise';
  paymentMethod: string;
  transactionId: string;
  amount: number;
  currency: string;
}): Promise<string> {
  const licenseKey = generateLicenseKey(data.plan);
  
  const license = {
    licenseKey,
    email: data.email,
    name: data.name,
    company: data.company || '',
    plan: data.plan,
    status: 'active',
    createdAt: new Date().toISOString(),
    expiryDate: data.plan === 'standard' 
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
      : 'lifetime',
    maxActivations: data.plan === 'standard' ? 1 : 5,
    activations: [],
    paymentMethod: data.paymentMethod,
    transactionId: data.transactionId,
    amount: data.amount,
    currency: data.currency
  };
  
  await kv.set(`wismachion:license:${licenseKey}`, license);
  await kv.set(`wismachion:customer:${data.email}:${licenseKey}`, licenseKey);
  
  // 🆕 記錄收入到平台統計系統
  const transactionId = `wismachion_${data.transactionId}_${Date.now()}`;
  const transactionRecord = {
    id: transactionId,
    type: 'wismachion_revenue',
    product: 'wismachion',
    plan: data.plan,
    amount: data.amount,
    currency: data.currency,
    payment_method: data.paymentMethod,
    license_key: licenseKey,
    customer_email: data.email,
    customer_name: data.name,
    transaction_id: data.transactionId,
    created_at: new Date().toISOString(),
    status: 'completed'
  };
  
  await kv.set(`transaction_${transactionId}`, transactionRecord);
  
  console.log(`💰 [Wismachion Revenue] Recorded transaction: ${transactionId}, Amount: ${data.currency} ${data.amount}, Plan: ${data.plan}, Method: ${data.paymentMethod}`);
  
  return licenseKey;
}

// Verify license
export async function verifyLicense(licenseKey: string, machineId?: string): Promise<{
  valid: boolean;
  plan?: string;
  expiryDate?: string;
  daysRemaining?: number;
  activationsRemaining?: number;
  features?: string[];
  message?: string;
}> {
  const license = await kv.get(`wismachion:license:${licenseKey}`);
  
  if (!license) {
    return { valid: false, message: 'Invalid license key' };
  }
  
  // Check status
  if (license.status !== 'active') {
    return { valid: false, message: 'License is not active' };
  }
  
  // Check expiry
  if (license.expiryDate !== 'lifetime') {
    const expiryTime = new Date(license.expiryDate).getTime();
    const now = Date.now();
    
    if (now > expiryTime) {
      return { valid: false, message: 'License has expired' };
    }
    
    const daysRemaining = Math.ceil((expiryTime - now) / (24 * 60 * 60 * 1000));
    
    // Check machine activation
    if (machineId) {
      const activations = license.activations || [];
      const isActivated = activations.some((a: any) => a.machineId === machineId);
      
      if (!isActivated && activations.length >= license.maxActivations) {
        return { 
          valid: false, 
          message: 'Maximum activations reached. Please deactivate on another machine first.' 
        };
      }
      
      // Add activation if not exists
      if (!isActivated) {
        activations.push({
          machineId,
          activatedAt: new Date().toISOString()
        });
        license.activations = activations;
        await kv.set(`wismachion:license:${licenseKey}`, license);
      }
    }
    
    return {
      valid: true,
      plan: license.plan,
      expiryDate: license.expiryDate,
      daysRemaining,
      activationsRemaining: license.maxActivations - (license.activations?.length || 0),
      features: getPlanFeatures(license.plan)
    };
  }
  
  // Lifetime license
  if (machineId) {
    const activations = license.activations || [];
    const isActivated = activations.some((a: any) => a.machineId === machineId);
    
    if (!isActivated && activations.length >= license.maxActivations) {
      return { 
        valid: false, 
        message: 'Maximum activations reached. Please contact support.' 
      };
    }
    
    if (!isActivated) {
      activations.push({
        machineId,
        activatedAt: new Date().toISOString()
      });
      license.activations = activations;
      await kv.set(`wismachion:license:${licenseKey}`, license);
    }
  }
  
  return {
    valid: true,
    plan: license.plan,
    expiryDate: 'lifetime',
    activationsRemaining: license.maxActivations - (license.activations?.length || 0),
    features: getPlanFeatures(license.plan)
  };
}

// Get customer licenses
export async function getCustomerLicenses(email: string): Promise<any[]> {
  const keys = await kv.getByPrefix(`wismachion:customer:${email}:`);
  const licenses = [];
  
  for (const key of keys) {
    const licenseKey = key.value;
    const license = await kv.get(`wismachion:license:${licenseKey}`);
    if (license) {
      licenses.push(license);
    }
  }
  
  return licenses;
}

// Deactivate machine
export async function deactivateMachine(licenseKey: string, machineId: string): Promise<boolean> {
  const license = await kv.get(`wismachion:license:${licenseKey}`);
  
  if (!license) {
    return false;
  }
  
  const activations = license.activations || [];
  license.activations = activations.filter((a: any) => a.machineId !== machineId);
  
  await kv.set(`wismachion:license:${licenseKey}`, license);
  return true;
}

// Get plan features
function getPlanFeatures(plan: string): string[] {
  const features = {
    standard: [
      'rs232-communication',
      'protocol-development',
      'data-logging',
      'multi-port-4',
      'email-support'
    ],
    enterprise: [
      'rs232-communication',
      'protocol-development',
      'advanced-analysis',
      'custom-scripts',
      'unlimited-ports',
      'priority-support',
      'api-access',
      'team-collaboration'
    ]
  };
  
  return features[plan as keyof typeof features] || [];
}

// Admin: Get all licenses
export async function getAllLicenses(): Promise<any[]> {
  const keys = await kv.getByPrefix('wismachion:license:');
  const licenses = [];
  
  for (const key of keys) {
    licenses.push(key.value);
  }
  
  return licenses.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Admin: Revoke license
export async function revokeLicense(licenseKey: string): Promise<boolean> {
  const license = await kv.get(`wismachion:license:${licenseKey}`);
  
  if (!license) {
    return false;
  }
  
  license.status = 'revoked';
  await kv.set(`wismachion:license:${licenseKey}`, license);
  
  return true;
}

// Admin: Extend license
export async function extendLicense(licenseKey: string, days: number): Promise<boolean> {
  const license = await kv.get(`wismachion:license:${licenseKey}`);
  
  if (!license) {
    return false;
  }
  
  if (license.expiryDate === 'lifetime') {
    return true; // Already lifetime
  }
  
  const currentExpiry = new Date(license.expiryDate);
  const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);
  
  license.expiryDate = newExpiry.toISOString();
  await kv.set(`wismachion:license:${licenseKey}`, license);
  
  return true;
}