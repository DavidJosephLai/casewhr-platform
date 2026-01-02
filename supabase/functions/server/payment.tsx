// Payment and Escrow System for Figma Make
// This module handles wallet management, escrow, and transactions

import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js";
import * as emailService from "./email_service.tsx";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

export const paymentRoutes = new Hono();

// Get wallet balance for a user
paymentRoutes.get("/payment/wallet/:userId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.param('userId');

    // Users can only view their own wallet
    if (user.id !== userId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Get or create wallet using new format
    let wallet = await kv.get(`wallet_${userId}`);
    
    if (!wallet) {
      wallet = {
        user_id: userId,
        available_balance: 0, // Available balance
        pending_withdrawal: 0, // Locked in escrow
        total_earned: 0, // For freelancers
        total_spent: 0, // For clients
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await kv.set(`wallet_${userId}`, wallet);
    }

    return c.json({ wallet });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return c.json({ error: 'Failed to fetch wallet' }, 500);
  }
});

// Deposit money to wallet (模拟充值)
paymentRoutes.post("/payment/wallet/deposit", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { amount } = await c.req.json();

    if (!amount || amount <= 0) {
      return c.json({ error: 'Invalid amount' }, 400);
    }

    // Get or create wallet using new format
    let wallet = await kv.get(`wallet_${user.id}`);
    
    if (!wallet) {
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

    // Update balance using new field name
    wallet.available_balance += amount;
    wallet.updated_at = new Date().toISOString();
    await kv.set(`wallet_${user.id}`, wallet);

    console.log(`💰 Deposit: User ${user.id} deposited ${amount}, new balance: ${wallet.available_balance}`);

    // Create transaction record
    const transactionId = crypto.randomUUID();
    const transaction = {
      id: transactionId,
      user_id: user.id,
      type: 'deposit', // deposit, escrow, release, refund, withdrawal
      amount: amount,
      status: 'completed',
      description: 'Wallet deposit',
      created_at: new Date().toISOString(),
    };

    await kv.set(`transaction:${transactionId}`, transaction);

    // Add to user's transaction list
    const userTransactions = await kv.get(`transactions:user:${user.id}`) || [];
    userTransactions.unshift(transactionId);
    await kv.set(`transactions:user:${user.id}`, userTransactions);

    console.log(`✅ Deposit successful: User ${user.id} deposited ${amount}`);
    
    // 📧 Send deposit success email
    try {
      console.log(`🔍 [DEPOSIT EMAIL] Starting email send process for user ${user.id}`);
      
      let profile = await kv.get(`profile_${user.id}`);
      if (!profile) {
        profile = await kv.get(`profile:${user.id}`);
      }
      console.log(`🔍 [DEPOSIT EMAIL] Profile lookup result:`, profile ? 'Found' : 'Not Found');
      
      if (profile) {
        console.log(`🔍 [DEPOSIT EMAIL] Profile data:`, {
          email: profile.email,
          name: profile.name,
          full_name: profile.full_name,
          language: profile.language
        });
      }
      
      if (profile?.email) {
        // 🔧 兼容多个语言字段名：language, bg_set, lang (默认使用中文)
        const language = profile.language || profile.bg_set || profile.lang || 'zh';
        console.log(`🔍 [DEPOSIT EMAIL] Generating email template in ${language}...`);
        console.log(`🔍 [DEPOSIT EMAIL] Language sources - language: ${profile.language}, bg_set: ${profile.bg_set}, final: ${language}`);
        
        let emailHtml = emailService.getDepositSuccessEmail({
          name: profile.name || profile.full_name || profile.email,
          amount,
          newBalance: wallet.available_balance,
          language,
        });
        
        // 🎨 Apply branding for enterprise users
        const { getUserBranding, injectBranding } = await import('./branded_email_helper.tsx');
        const branding = await getUserBranding(user.id);
        if (branding) {
          console.log('🎨 [Email] Applying branding to deposit email for user:', user.id);
          emailHtml = injectBranding(emailHtml, branding);
        }
        
        console.log(`🔍 [DEPOSIT EMAIL] Email template generated, length: ${emailHtml.length} chars`);
        console.log(`🔍 [DEPOSIT EMAIL] Calling sendEmail to ${profile.email}...`);

        const emailResult = await emailService.sendEmail({
          to: profile.email,
          subject: language === 'en' ? '✅ Deposit Successful' : '✅ 充值成功',
          html: emailHtml,
        });
        
        console.log(`🔍 [DEPOSIT EMAIL] Email send result:`, emailResult);
        console.log(`📧 Deposit success email sent to ${profile.email}`);
      } else {
        console.log(`⚠️ No profile or email found for user ${user.id}, skipping email`);
      }
    } catch (emailError) {
      console.error('❌ Error sending deposit success email:', emailError);
    }
    
    return c.json({ wallet, transaction });
  } catch (error) {
    console.error('Error processing deposit:', error);
    return c.json({ error: 'Failed to process deposit' }, 500);
  }
});

// Create escrow when proposal is accepted
paymentRoutes.post("/payment/escrow/create", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { project_id, freelancer_id, amount, description } = await c.req.json();

    if (!project_id || !freelancer_id || !amount || amount <= 0) {
      return c.json({ error: 'Invalid escrow parameters' }, 400);
    }

    // Verify project exists and user is the client
    const project = await kv.get(`project:${project_id}`);
    if (!project || project.user_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Get client wallet
    const wallet = await kv.get(`wallet_${user.id}`);
    
    if (!wallet || wallet.available_balance < amount) {
      return c.json({ error: 'Insufficient balance. Please deposit funds first.' }, 400);
    }

    // Lock funds in escrow
    wallet.available_balance -= amount;
    wallet.pending_withdrawal += amount;
    wallet.updated_at = new Date().toISOString();
    await kv.set(`wallet_${user.id}`, wallet);

    // Create escrow record
    const escrowId = crypto.randomUUID();
    const escrow = {
      id: escrowId,
      project_id,
      client_id: user.id,
      freelancer_id,
      amount,
      status: 'locked', // locked, released, refunded
      description: description || 'Project payment',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await kv.set(`escrow:${escrowId}`, escrow);
    await kv.set(`escrow:project:${project_id}`, escrowId);

    // Create transaction record
    const transactionId = crypto.randomUUID();
    const transaction = {
      id: transactionId,
      user_id: user.id,
      type: 'escrow',
      amount: -amount,
      escrow_id: escrowId,
      status: 'completed',
      description: `Locked in escrow for project: ${project.title}`,
      created_at: new Date().toISOString(),
    };

    await kv.set(`transaction:${transactionId}`, transaction);

    const userTransactions = await kv.get(`transactions:user:${user.id}`) || [];
    userTransactions.unshift(transactionId);
    await kv.set(`transactions:user:${user.id}`, userTransactions);

    console.log(`Escrow created: ${escrowId} for project ${project_id}`);
    return c.json({ escrow, wallet, transaction });
  } catch (error) {
    console.error('Error creating escrow:', error);
    return c.json({ error: 'Failed to create escrow' }, 500);
  }
});

// Release escrow when deliverable is approved
paymentRoutes.post("/payment/escrow/release", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { project_id } = await c.req.json();

    if (!project_id) {
      return c.json({ error: 'Project ID is required' }, 400);
    }

    // Get escrow
    const escrowId = await kv.get(`escrow:project:${project_id}`);
    if (!escrowId) {
      return c.json({ error: 'Escrow not found for this project' }, 404);
    }

    const escrow = await kv.get(`escrow:${escrowId}`);
    
    if (!escrow) {
      return c.json({ error: 'Escrow not found' }, 404);
    }

    // Only client can release escrow
    if (escrow.client_id !== user.id) {
      return c.json({ error: 'Forbidden: Only the client can release payment' }, 403);
    }

    if (escrow.status !== 'locked') {
      return c.json({ error: `Escrow already ${escrow.status}` }, 400);
    }

    // Get project for title
    const project = await kv.get(`project:${project_id}`);

    // Update client wallet (unlock funds)
    const clientWallet = await kv.get(`wallet_${escrow.client_id}`);
    if (clientWallet) {
      clientWallet.pending_withdrawal -= escrow.amount;
      clientWallet.total_spent += escrow.amount;
      clientWallet.updated_at = new Date().toISOString();
      await kv.set(`wallet_${escrow.client_id}`, clientWallet);
    }

    // Update freelancer wallet (add funds)
    let freelancerWallet = await kv.get(`wallet_${escrow.freelancer_id}`);
    
    if (!freelancerWallet) {
      freelancerWallet = {
        user_id: escrow.freelancer_id,
        available_balance: 0,
        pending_withdrawal: 0,
        total_earned: 0,
        total_spent: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    freelancerWallet.available_balance += escrow.amount;
    freelancerWallet.total_earned += escrow.amount;
    freelancerWallet.updated_at = new Date().toISOString();
    await kv.set(`wallet_${escrow.freelancer_id}`, freelancerWallet);

    console.log(`✅ Freelancer wallet updated: ${escrow.freelancer_id}`);
    console.log(`   Balance: ${freelancerWallet.available_balance}`);
    console.log(`   Total Earned: ${freelancerWallet.total_earned}`);

    // Update escrow status
    escrow.status = 'released';
    escrow.released_at = new Date().toISOString();
    escrow.updated_at = new Date().toISOString();
    await kv.set(`escrow:${escrowId}`, escrow);

    // 🔥 Update project status to completed
    if (project) {
      project.status = 'completed';
      project.completed_at = new Date().toISOString();
      project.updated_at = new Date().toISOString();
      await kv.set(`project:${project_id}`, project);
      console.log(`Project ${project_id} marked as completed after payment release`);
    }

    // Create transaction for freelancer (receiving payment)
    const freelancerTransactionId = crypto.randomUUID();
    const freelancerTransaction = {
      id: freelancerTransactionId,
      user_id: escrow.freelancer_id,
      type: 'release',
      amount: escrow.amount,
      escrow_id: escrowId,
      project_id: project_id,
      status: 'completed',
      description: `Payment received for project${project ? ': ' + project.title : ''}`,
      created_at: new Date().toISOString(),
    };

    await kv.set(`transaction:${freelancerTransactionId}`, freelancerTransaction);

    const freelancerTransactions = await kv.get(`transactions:user:${escrow.freelancer_id}`) || [];
    freelancerTransactions.unshift(freelancerTransactionId);
    await kv.set(`transactions:user:${escrow.freelancer_id}`, freelancerTransactions);

    // Create transaction for client (payment sent)
    const clientTransactionId = crypto.randomUUID();
    const clientTransaction = {
      id: clientTransactionId,
      user_id: escrow.client_id,
      type: 'release',
      amount: -escrow.amount,
      escrow_id: escrowId,
      project_id: project_id,
      status: 'completed',
      description: `Payment released for project${project ? ': ' + project.title : ''}`,
      created_at: new Date().toISOString(),
    };

    await kv.set(`transaction:${clientTransactionId}`, clientTransaction);

    const clientTransactions = await kv.get(`transactions:user:${escrow.client_id}`) || [];
    clientTransactions.unshift(clientTransactionId);
    await kv.set(`transactions:user:${escrow.client_id}`, clientTransactions);

    console.log(`Escrow released: ${escrowId}, amount: ${escrow.amount}`);
    
    // 📧 Send payment received email to freelancer
    try {
      let freelancerProfile = await kv.get(`profile_${escrow.freelancer_id}`);
      if (!freelancerProfile) {
        freelancerProfile = await kv.get(`profile:${escrow.freelancer_id}`);
      }
      
      if (freelancerProfile?.email && project) {
        const language = freelancerProfile.language || 'en';
        const emailHtml = emailService.getMilestonePaymentEmail({
          name: freelancerProfile.name || freelancerProfile.full_name || freelancerProfile.email,
          projectTitle: project.title,
          milestoneTitle: 'Project completion', // In future this could be actual milestone name
          amount: escrow.amount,
          language,
        });

        await emailService.sendEmail({
          to: freelancerProfile.email,
          subject: language === 'en' ? '💰 Payment Received' : '💰 已收到付款',
          html: emailHtml,
        });
        
        console.log(`📧 Payment received email sent to ${freelancerProfile.email}`);
      }
    } catch (emailError) {
      console.error('❌ Error sending payment received email:', emailError);
    }
    
    return c.json({ 
      escrow, 
      client_wallet: clientWallet,
      freelancer_wallet: freelancerWallet,
      project: project,
      message: 'Payment released successfully'
    });
  } catch (error) {
    console.error('Error releasing escrow:', error);
    return c.json({ error: 'Failed to release escrow' }, 500);
  }
});

// Get escrow status for a project
paymentRoutes.get("/payment/escrow/project/:projectId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');

    // Get escrow
    const escrowId = await kv.get(`escrow:project:${projectId}`);
    
    if (!escrowId) {
      return c.json({ escrow: null });
    }

    const escrow = await kv.get(`escrow:${escrowId}`);
    
    if (!escrow) {
      return c.json({ escrow: null });
    }

    // Only client or freelancer can view escrow
    if (escrow.client_id !== user.id && escrow.freelancer_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    return c.json({ escrow });
  } catch (error) {
    console.error('Error fetching escrow:', error);
    return c.json({ error: 'Failed to fetch escrow' }, 500);
  }
});

// Get transaction history for a user
paymentRoutes.get("/payment/transactions/:userId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.param('userId');

    // Users can only view their own transactions
    if (user.id !== userId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const transactionIds = await kv.get(`transactions:user:${userId}`) || [];
    const transactions = Array.isArray(transactionIds) && transactionIds.length > 0
      ? await kv.mget(transactionIds.map((id: string) => `transaction:${id}`))
      : [];
    const validTransactions = transactions.filter(t => t !== null);

    return c.json({ transactions: validTransactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return c.json({ error: 'Failed to fetch transactions' }, 500);
  }
});

// Withdraw money from wallet (模拟提现)
paymentRoutes.post("/payment/wallet/withdraw", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { amount } = await c.req.json();

    if (!amount || amount <= 0) {
      return c.json({ error: 'Invalid amount' }, 400);
    }

    // Get wallet
    const wallet = await kv.get(`wallet_${user.id}`);
    
    if (!wallet || wallet.available_balance < amount) {
      return c.json({ error: 'Insufficient balance' }, 400);
    }

    // Update balance
    wallet.available_balance -= amount;
    wallet.updated_at = new Date().toISOString();
    await kv.set(`wallet_${user.id}`, wallet);

    // Create transaction record
    const transactionId = crypto.randomUUID();
    const transaction = {
      id: transactionId,
      user_id: user.id,
      type: 'withdrawal',
      amount: -amount,
      status: 'completed',
      description: 'Wallet withdrawal',
      created_at: new Date().toISOString(),
    };

    await kv.set(`transaction:${transactionId}`, transaction);

    const userTransactions = await kv.get(`transactions:user:${user.id}`) || [];
    userTransactions.unshift(transactionId);
    await kv.set(`transactions:user:${user.id}`, userTransactions);

    console.log(`Withdrawal successful: User ${user.id} withdrew ${amount}`);
    
    // 📧 Send withdrawal request email (immediate)
    try {
      let profile = await kv.get(`profile_${user.id}`);
      if (!profile) {
        profile = await kv.get(`profile:${user.id}`);
      }
      
      if (profile?.email) {
        const language = profile.language || 'en';
        const emailHtml = emailService.getWithdrawalRequestEmail({
          name: profile.name || profile.full_name || profile.email,
          amount,
          language,
        });

        await emailService.sendEmail({
          to: profile.email,
          subject: language === 'en' ? '📤 Withdrawal Request Received' : '📤 已收到提現請求',
          html: emailHtml,
        });
        
        console.log(`📧 Withdrawal request email sent to ${profile.email}`);
      }
      
      // 📧 Send withdrawal completed email (simulated - in production this would be after bank transfer)
      // For demo purposes, we send it immediately
      if (profile?.email) {
        const language = profile.language || 'en';
        const emailHtml = emailService.getWithdrawalCompletedEmail({
          name: profile.name || profile.full_name || profile.email,
          amount,
          language,
        });

        await emailService.sendEmail({
          to: profile.email,
          subject: language === 'en' ? '✅ Withdrawal Completed' : '✅ 提現完成',
          html: emailHtml,
        });
        
        console.log(`📧 Withdrawal completed email sent to ${profile.email}`);
      }
    } catch (emailError) {
      console.error('❌ Error sending withdrawal emails:', emailError);
    }
    
    return c.json({ wallet, transaction, message: 'Withdrawal processed successfully' });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return c.json({ error: 'Failed to process withdrawal' }, 500);
  }
});