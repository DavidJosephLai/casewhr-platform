// Milestone Management Service
// Handles structured milestone-based payments for large projects

import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js";
import * as emailService from "./email_service.tsx"; // 🔥 新增：郵件服務

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

export const milestoneRoutes = new Hono();

// Helper: Get user from access token
async function getUserFromToken(accessToken: string | undefined) {
  if (!accessToken) {
    return { user: null, error: { message: 'No access token provided' } };
  }
  
  // 🧪 DEV MODE: Handle mock tokens (dev-user-*)
  if (accessToken.startsWith('dev-user-')) {
    console.log('🧪 [Milestone getUserFromToken] Dev mode detected!');
    
    // Extract email from token format: "dev-user-{timestamp}||{email}"
    let mockEmail = 'admin@casewhr.com';
    if (accessToken.includes('||')) {
      const parts = accessToken.split('||');
      mockEmail = parts[1] || mockEmail;
    }
    
    const mockUser = {
      id: accessToken.split('||')[0], // Use the dev-user-timestamp part as ID
      email: mockEmail,
      user_metadata: { name: 'Dev Mode User' },
      aud: 'authenticated',
      role: 'authenticated',
    };
    
    console.log('✅ [Milestone getUserFromToken] Mock user created:', mockUser.id);
    return { user: mockUser, error: null };
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    return { user, error };
  } catch (error) {
    console.error('[Milestone] Auth error:', error);
    return { user: null, error: { message: 'Invalid or expired token' } };
  }
}

// Helper function to get access token from request (支援 X-Dev-Token header)
function getAccessToken(c: any): string | undefined {
  // 首先檢查 X-Dev-Token header（開發模式）
  const devToken = c.req.header('X-Dev-Token');
  if (devToken) {
    console.log('🔧 [Milestone getAccessToken] Using X-Dev-Token header');
    return devToken;
  }
  
  // 否則使用標準 Authorization header
  const authHeader = c.req.header('Authorization');
  if (authHeader) {
    return authHeader.split(' ')[1];
  }
  
  return undefined;
}

// Get all milestones for a proposal
milestoneRoutes.get("/milestones/proposal/:proposalId", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      console.error('[Milestone] Unauthorized:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const proposalId = c.req.param('proposalId');
    console.log(`[Milestone] Fetching milestones for proposal ${proposalId}, user: ${user.id} (${user.email})`);
    
    // Get proposal to verify access
    const proposal = await kv.get(`proposal:${proposalId}`);
    if (!proposal) {
      console.error(`[Milestone] Proposal not found: ${proposalId}`);
      return c.json({ error: 'Proposal not found' }, 404);
    }
    
    console.log(`[Milestone] Proposal details:`, {
      client_id: proposal.client_id,
      freelancer_id: proposal.freelancer_id,
      current_user: user.id
    });

    // 🔧 检查特殊用户（开发者账号）
    const SPECIAL_USER_EMAILS = [
      'davidlai117@yahoo.com.tw',
      'davidlai234@hotmail.com'
    ];
    const isSpecialUser = user.email && SPECIAL_USER_EMAILS.includes(user.email.toLowerCase());
    console.log(`[Milestone] Is special user: ${isSpecialUser}`);

    // Only client, freelancer, or special users can view milestones
    if (proposal.client_id !== user.id && proposal.freelancer_id !== user.id && !isSpecialUser) {
      console.error(`[Milestone] Forbidden - user ${user.id} cannot access proposal ${proposalId}`);
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Get milestone IDs
    const milestoneIds = await kv.get(`milestones:proposal:${proposalId}`) || [];
    console.log(`[Milestone] Found ${milestoneIds.length} milestone IDs:`, milestoneIds);
    
    // Get all milestones
    const milestones = milestoneIds.length > 0
      ? await kv.mget(milestoneIds.map((id: string) => `milestone:${id}`))
      : [];
    
    console.log(`[Milestone] Fetched ${milestones.filter(Boolean).length} milestones from ${milestoneIds.length} IDs`);

    // Sort by order
    const sortedMilestones = milestones
      .filter(Boolean)
      .sort((a, b) => a.order - b.order);

    console.log(`✅ [Milestone] Returning ${sortedMilestones.length} sorted milestones`);
    return c.json({ milestones: sortedMilestones });
  } catch (error) {
    console.error('[Milestone] Error fetching milestones:', error);
    return c.json({ error: 'Failed to fetch milestones' }, 500);
  }
});

// 🔥 GET MILESTONE PLAN (with review status)
milestoneRoutes.get("/milestones/plan/:proposalId", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const proposalId = c.req.param('proposalId');
    
    // Get proposal
    const proposal = await kv.get(`proposal:${proposalId}`);
    if (!proposal) {
      return c.json({ error: 'Proposal not found' }, 404);
    }

    // Only client and freelancer can view plan
    if (proposal.client_id !== user.id && proposal.freelancer_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Get milestone plan status
    const planStatus = await kv.get(`milestone_plan:${proposalId}`) || {
      status: 'not_submitted',
      milestones: [],
      total_amount: 0,
    };

    // Get milestone IDs
    const milestoneIds = await kv.get(`milestones:proposal:${proposalId}`) || [];
    
    // Get all milestones
    const milestones = milestoneIds.length > 0
      ? await kv.mget(milestoneIds.map((id: string) => `milestone:${id}`))
      : [];

    // Calculate total amount
    const total_amount = milestones
      .filter(Boolean)
      .reduce((sum, m) => sum + (m.amount || 0), 0);

    // Sort by order
    const sortedMilestones = milestones
      .filter(Boolean)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const plan = {
      ...planStatus,
      milestones: sortedMilestones,
      total_amount,
    };

    console.log(`✅ [Milestone] Loaded plan for proposal ${proposalId}:`, plan);
    return c.json({ plan });
  } catch (error) {
    console.error('[Milestone] Error fetching plan:', error);
    return c.json({ error: 'Failed to fetch milestone plan' }, 500);
  }
});

// SUBMIT MILESTONE PLAN FOR REVIEW (Freelancer submits plan)
milestoneRoutes.post("/milestones/plan/:proposalId/submit", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const proposalId = c.req.param('proposalId');
    
    // Get proposal
    const proposal = await kv.get(`proposal:${proposalId}`);
    if (!proposal) {
      return c.json({ error: 'Proposal not found' }, 404);
    }

    // Only freelancer can submit plan
    if (proposal.freelancer_id !== user.id) {
      return c.json({ error: 'Only the freelancer can submit the plan' }, 403);
    }

    // Check if milestones exist
    const milestoneIds = await kv.get(`milestones:proposal:${proposalId}`) || [];
    if (milestoneIds.length === 0) {
      return c.json({ error: 'No milestones to submit' }, 400);
    }

    // 🔥 Check if this is a resubmission after revision request
    const existingPlan = await kv.get(`milestone_plan:${proposalId}`);
    const wasRevisionRequested = existingPlan?.status === 'revision_requested';

    // Update plan status
    const planStatus = {
      status: wasRevisionRequested ? 'resubmitted' : 'submitted', // 🔥 區分首次提交和修改後重新提交
      submitted_at: new Date().toISOString(),
      submitted_by: user.id,
      previous_status: existingPlan?.status || null, // 🔥 保存之前的狀態
      revision_count: (existingPlan?.revision_count || 0) + (wasRevisionRequested ? 1 : 0), // 🔥 修改次數
    };

    await kv.set(`milestone_plan:${proposalId}`, planStatus);

    console.log(`✅ [Milestone] Plan ${wasRevisionRequested ? 'resubmitted' : 'submitted'} for proposal ${proposalId}`);
    
    // TODO: Send notification to client
    
    return c.json({ success: true, plan: planStatus });
  } catch (error) {
    console.error('[Milestone] Error submitting plan:', error);
    return c.json({ error: 'Failed to submit plan' }, 500);
  }
});

// 🔥 APPROVE MILESTONE PLAN (Client approves and locks the plan)
milestoneRoutes.post("/milestones/plan/:proposalId/approve", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const proposalId = c.req.param('proposalId');
    
    // Get proposal
    const proposal = await kv.get(`proposal:${proposalId}`);
    if (!proposal) {
      return c.json({ error: 'Proposal not found' }, 404);
    }

    // Only client can approve
    if (proposal.client_id !== user.id) {
      return c.json({ error: 'Only the client can approve the plan' }, 403);
    }

    // 🔥 Get all milestones and validate total amount
    const milestones = await kv.getByPrefix(`milestone:proposal:${proposalId}:`);
    const milestoneIds = milestones.map((m: any) => m.split(':')[3]);
    const milestoneData = await Promise.all(
      milestoneIds.map((id: string) => kv.get(`milestone:${id}`))
    );
    
    const totalMilestoneAmount = milestoneData.reduce((sum: number, m: any) => sum + (m?.amount || 0), 0);
    const projectEscrowAmount = proposal.proposed_budget || 0;
    
    // 🔥 Validate: milestone total must match escrow amount
    if (Math.abs(totalMilestoneAmount - projectEscrowAmount) > 0.01) {
      return c.json({ 
        error: `Milestone total ($${totalMilestoneAmount}) must match project budget ($${projectEscrowAmount})`,
        totalMilestoneAmount,
        projectEscrowAmount
      }, 400);
    }

    // 🔥 NEW: 檢查案主錢包餘額是否足夠
    let clientWallet = await kv.get(`wallet:${user.id}`);
    
    // 如果錢包不存在，創建錢包
    if (!clientWallet) {
      clientWallet = {
        user_id: user.id,
        balance: 0,
        locked: 0,
        total_earned: 0,
        total_spent: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await kv.set(`wallet:${user.id}`, clientWallet);
      console.log(`🆕 [Milestone] Created wallet for client ${user.id}`);
    }
    
    // 檢查可用餘額是否足夠（餘額 - 已鎖定金額）
    const availableBalance = clientWallet.balance - (clientWallet.locked || 0);
    
    if (availableBalance < totalMilestoneAmount) {
      const shortfall = totalMilestoneAmount - availableBalance;
      const currency = proposal.currency || 'TWD';
      
      console.log(`❌ [Milestone] Insufficient balance for client ${user.id}:`, {
        required: totalMilestoneAmount,
        available: availableBalance,
        shortfall,
        currency
      });
      
      return c.json({ 
        error: 'insufficient_balance',
        message: 'Insufficient wallet balance to approve milestone plan',
        required_amount: totalMilestoneAmount,
        available_balance: availableBalance,
        shortfall_amount: shortfall,
        currency,
        // 提供友善的多語言錯誤訊息
        user_message: {
          en: `Insufficient wallet balance. Please deposit at least $${shortfall.toFixed(2)} ${currency} to proceed.`,
          'zh-TW': `錢包餘額不足。請至少充值 ${shortfall.toFixed(2)} ${currency} 以繼續。`,
          'zh-CN': `钱包余额不足。请至少充值 ${shortfall.toFixed(2)} ${currency} 以继续。`
        }
      }, 400);
    }

    // 🔥 NEW: 創建託管並鎖定資金
    const escrowId = crypto.randomUUID();
    const escrow = {
      id: escrowId,
      proposal_id: proposalId,
      project_id: proposal.project_id,
      client_id: user.id,
      freelancer_id: proposal.freelancer_id,
      amount: totalMilestoneAmount,
      currency: proposal.currency || 'TWD',
      status: 'locked', // 資金已鎖定
      milestone_plan: true, // 標記為里程碑計劃託管
      milestone_count: milestoneData.length,
      released_amount: 0, // 已釋放金額
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    await kv.set(`escrow:${escrowId}`, escrow);
    
    // 鎖定案主錢包中的資金
    clientWallet.locked = (clientWallet.locked || 0) + totalMilestoneAmount;
    clientWallet.updated_at = new Date().toISOString();
    await kv.set(`wallet:${user.id}`, clientWallet);
    
    console.log(`🔒 [Milestone] Escrow created and funds locked:`, {
      escrowId,
      amount: totalMilestoneAmount,
      clientId: user.id,
      newLockedBalance: clientWallet.locked
    });
    
    // 創建託管交易記錄
    const transactionId = crypto.randomUUID();
    const transaction = {
      id: transactionId,
      user_id: user.id,
      type: 'escrow_lock',
      amount: -totalMilestoneAmount, // 負數表示鎖定
      currency: proposal.currency || 'TWD',
      status: 'completed',
      description: `Milestone plan escrow for proposal ${proposalId}`,
      proposal_id: proposalId,
      escrow_id: escrowId,
      created_at: new Date().toISOString(),
    };
    
    await kv.set(`transaction:${transactionId}`, transaction);
    
    // 添加到用戶交易列表
    const userTransactions = await kv.get(`transactions:user:${user.id}`) || [];
    userTransactions.unshift(transactionId);
    await kv.set(`transactions:user:${user.id}`, userTransactions);

    // Update plan status to approved
    const existingPlan = await kv.get(`milestone_plan:${proposalId}`) || {};
    const planStatus = {
      ...existingPlan,
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      total_amount: totalMilestoneAmount,
      milestone_count: milestoneData.length,
      escrow_id: escrowId, // 🔥 關聯託管ID
      escrow_status: 'locked', // 🔥 託管狀態
    };

    await kv.set(`milestone_plan:${proposalId}`, planStatus);
    
    // 🔥 更新提案狀態，關聯託管ID
    const updatedProposal = {
      ...proposal,
      milestone_plan_status: 'approved',
      milestone_plan_escrow_id: escrowId,
      milestone_plan_approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await kv.set(`proposal:${proposalId}`, updatedProposal);

    console.log(`✅ [Milestone] Plan approved with escrow for proposal ${proposalId}`, {
      totalMilestones: milestoneData.length,
      totalAmount: totalMilestoneAmount,
      escrowAmount: projectEscrowAmount,
      escrowId,
      clientAvailableBalance: availableBalance - totalMilestoneAmount,
    });
    
    return c.json({ 
      success: true, 
      plan: planStatus,
      escrow: {
        id: escrowId,
        amount: totalMilestoneAmount,
        currency: proposal.currency || 'TWD',
        status: 'locked'
      },
      wallet: {
        available_balance: availableBalance - totalMilestoneAmount,
        locked_balance: clientWallet.locked
      }
    });
  } catch (error) {
    console.error('[Milestone] Error approving plan:', error);
    return c.json({ error: 'Failed to approve plan' }, 500);
  }
});

// 🔥 REQUEST REVISION (Client requests changes to the plan)
milestoneRoutes.post("/milestones/plan/:proposalId/request-revision", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const proposalId = c.req.param('proposalId');
    const { feedback } = await c.req.json();

    if (!feedback || !feedback.trim()) {
      return c.json({ error: 'Feedback is required' }, 400);
    }
    
    // Get proposal
    const proposal = await kv.get(`proposal:${proposalId}`);
    if (!proposal) {
      return c.json({ error: 'Proposal not found' }, 404);
    }

    // Only client can request revision
    if (proposal.client_id !== user.id) {
      return c.json({ error: 'Only the client can request revision' }, 403);
    }

    // Update plan status to revision_requested
    const existingPlan = await kv.get(`milestone_plan:${proposalId}`) || {};
    const planStatus = {
      ...existingPlan,
      status: 'revision_requested',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      feedback: feedback.trim(),
    };

    await kv.set(`milestone_plan:${proposalId}`, planStatus);
    
    // 🔥 同時更新提案的 milestone_plan_status，前端才能檢測到
    const updatedProposal = {
      ...proposal,
      milestone_plan_status: 'revision_requested',
      milestone_plan_feedback: feedback,
      milestone_plan_reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await kv.set(`proposal:${proposalId}`, updatedProposal);

    console.log(`✅ [Milestone] Revision requested for proposal ${proposalId}`);
    
    // TODO: Send notification to freelancer with feedback
    
    return c.json({ success: true, plan: planStatus });
  } catch (error) {
    console.error('[Milestone] Error requesting revision:', error);
    return c.json({ error: 'Failed to request revision' }, 500);
  }
});

// 🔥 CREATE MILESTONE (Client creates a new milestone)
milestoneRoutes.post("/milestones", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { proposal_id, title, description, amount, currency, due_date } = await c.req.json();
    
    // Validate required fields
    if (!proposal_id || !title || !amount || !currency) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Get proposal to verify access
    const proposal = await kv.get(`proposal:${proposal_id}`);
    if (!proposal) {
      return c.json({ error: 'Proposal not found' }, 404);
    }

    // 🔥 Both client and freelancer can create milestones
    if (proposal.client_id !== user.id && proposal.freelancer_id !== user.id) {
      return c.json({ error: 'Unauthorized to create milestones for this proposal' }, 403);
    }

    // Get existing milestones to determine order
    const milestoneIds = await kv.get(`milestones:proposal:${proposal_id}`) || [];
    const existingMilestones = milestoneIds.length > 0
      ? await kv.mget(milestoneIds.map((id: string) => `milestone:${id}`))
      : [];
    
    const nextOrder = existingMilestones.filter(Boolean).length + 1;

    // Create milestone
    const milestoneId = crypto.randomUUID();
    
    // 🔥 Calculate deadline_days from due_date
    let deadline_days = null;
    if (due_date) {
      const now = new Date();
      const dueDate = new Date(due_date);
      const diffTime = Math.abs(dueDate.getTime() - now.getTime());
      deadline_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    const milestone = {
      id: milestoneId,
      proposal_id,
      project_id: proposal.project_id,
      client_id: proposal.client_id,
      freelancer_id: proposal.freelancer_id,
      title,
      description: description || '',
      amount: parseFloat(amount),
      currency, // 🔥 使用提案的幣別
      order: nextOrder,
      status: 'pending',
      due_date: due_date || null,
      deadline_days, // 🔥 新增：天數欄位
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save milestone
    await kv.set(`milestone:${milestoneId}`, milestone);

    // Add to proposal's milestone list
    const updatedMilestoneIds = [...milestoneIds, milestoneId];
    await kv.set(`milestones:proposal:${proposal_id}`, updatedMilestoneIds);

    console.log(`✅ [Milestone] Client ${user.id} created milestone ${milestoneId} with currency ${currency}`);
    
    // TODO: Send email notification to freelancer about new milestone
    
    return c.json({ milestone }, 201);
  } catch (error) {
    console.error('[Milestone] Error creating milestone:', error);
    return c.json({ error: 'Failed to create milestone' }, 500);
  }
});

// 🔥 UPDATE MILESTONE (Freelancer/Client updates milestone details)
milestoneRoutes.put("/milestones/:milestoneId", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const milestoneId = c.req.param('milestoneId');
    const milestone = await kv.get(`milestone:${milestoneId}`);
    
    if (!milestone) {
      return c.json({ error: 'Milestone not found' }, 404);
    }

    const { title, description, amount, due_date } = await c.req.json();
    
    // Get proposal to verify access
    const proposal = await kv.get(`proposal:${milestone.proposal_id}`);
    if (!proposal) {
      return c.json({ error: 'Proposal not found' }, 404);
    }

    // Check if milestone plan is approved - if so, don't allow editing
    const milestonePlan = await kv.get(`milestone_plan:${milestone.proposal_id}`);
    if (milestonePlan?.status === 'approved') {
      return c.json({ error: 'Cannot edit milestone after plan is approved' }, 403);
    }

    // Both freelancer and client can edit before plan is approved
    if (proposal.client_id !== user.id && proposal.freelancer_id !== user.id) {
      return c.json({ error: 'Unauthorized to edit this milestone' }, 403);
    }

    // Calculate deadline_days from due_date
    let deadline_days = milestone.deadline_days;
    if (due_date) {
      const now = new Date();
      const dueDate = new Date(due_date);
      const diffTime = Math.abs(dueDate.getTime() - now.getTime());
      deadline_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Update milestone
    const updatedMilestone = {
      ...milestone,
      title: title !== undefined ? title : milestone.title,
      description: description !== undefined ? description : milestone.description,
      amount: amount !== undefined ? parseFloat(amount) : milestone.amount,
      due_date: due_date !== undefined ? due_date : milestone.due_date,
      deadline_days,
      updated_at: new Date().toISOString(),
    };

    await kv.set(`milestone:${milestoneId}`, updatedMilestone);

    console.log(`✅ [Milestone] User ${user.id} updated milestone ${milestoneId}`);
    
    return c.json({ milestone: updatedMilestone });
  } catch (error) {
    console.error('[Milestone] Error updating milestone:', error);
    return c.json({ error: 'Failed to update milestone' }, 500);
  }
});

// 🔥 DELETE MILESTONE (Freelancer/Client deletes milestone before plan approval)
milestoneRoutes.delete("/milestones/:milestoneId", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const milestoneId = c.req.param('milestoneId');
    const milestone = await kv.get(`milestone:${milestoneId}`);
    
    if (!milestone) {
      return c.json({ error: 'Milestone not found' }, 404);
    }

    // Get proposal to verify access
    const proposal = await kv.get(`proposal:${milestone.proposal_id}`);
    if (!proposal) {
      return c.json({ error: 'Proposal not found' }, 404);
    }

    // Check if milestone plan is approved - if so, don't allow deletion
    const milestonePlan = await kv.get(`milestone_plan:${milestone.proposal_id}`);
    if (milestonePlan?.status === 'approved') {
      return c.json({ error: 'Cannot delete milestone after plan is approved' }, 403);
    }

    // Both freelancer and client can delete before plan is approved
    if (proposal.client_id !== user.id && proposal.freelancer_id !== user.id) {
      return c.json({ error: 'Unauthorized to delete this milestone' }, 403);
    }

    // Remove from proposal's milestone list
    const milestoneIds = await kv.get(`milestones:proposal:${milestone.proposal_id}`) || [];
    const updatedMilestoneIds = milestoneIds.filter((id: string) => id !== milestoneId);
    await kv.set(`milestones:proposal:${milestone.proposal_id}`, updatedMilestoneIds);

    // Delete milestone
    await kv.del(`milestone:${milestoneId}`);

    console.log(`✅ [Milestone] User ${user.id} deleted milestone ${milestoneId}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('[Milestone] Error deleting milestone:', error);
    return c.json({ error: 'Failed to delete milestone' }, 500);
  }
});

// Update milestone status (freelancer starts work)
milestoneRoutes.post("/milestones/:milestoneId/start", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const milestoneId = c.req.param('milestoneId');
    const milestone = await kv.get(`milestone:${milestoneId}`);
    
    if (!milestone) {
      return c.json({ error: 'Milestone not found' }, 404);
    }

    // Only freelancer can start work
    if (milestone.freelancer_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Can only start if pending
    if (milestone.status !== 'pending') {
      return c.json({ error: 'Milestone already started' }, 400);
    }

    // Update status
    milestone.status = 'in_progress';
    milestone.started_at = new Date().toISOString();
    milestone.updated_at = new Date().toISOString();
    
    await kv.set(`milestone:${milestoneId}`, milestone);

    console.log(`✅ [Milestone] Freelancer ${user.id} started work on milestone ${milestoneId}`);
    
    return c.json({ milestone });
  } catch (error) {
    console.error('[Milestone] Error starting milestone:', error);
    return c.json({ error: 'Failed to start milestone' }, 500);
  }
});

// Submit milestone work (freelancer submits deliverables)
milestoneRoutes.post("/milestones/:milestoneId/submit", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const milestoneId = c.req.param('milestoneId');
    const { submission_notes, deliverable_urls } = await c.req.json();
    
    const milestone = await kv.get(`milestone:${milestoneId}`);
    
    if (!milestone) {
      return c.json({ error: 'Milestone not found' }, 404);
    }

    // Only freelancer can submit
    if (milestone.freelancer_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Can only submit if in progress
    if (milestone.status !== 'in_progress') {
      return c.json({ error: 'Milestone not in progress' }, 400);
    }

    // Update status
    milestone.status = 'submitted';
    milestone.submitted_at = new Date().toISOString();
    milestone.submission_notes = submission_notes || '';
    milestone.deliverable_urls = deliverable_urls || [];
    milestone.updated_at = new Date().toISOString();
    
    await kv.set(`milestone:${milestoneId}`, milestone);

    console.log(`✅ [Milestone] Freelancer ${user.id} submitted milestone ${milestoneId}`);
    
    // TODO: Send email notification to client
    
    return c.json({ milestone });
  } catch (error) {
    console.error('[Milestone] Error submitting milestone:', error);
    return c.json({ error: 'Failed to submit milestone' }, 500);
  }
});

// Approve milestone and release payment (client approves)
milestoneRoutes.post("/milestones/:milestoneId/approve", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const milestoneId = c.req.param('milestoneId');
    const { feedback } = await c.req.json();
    
    const milestone = await kv.get(`milestone:${milestoneId}`);
    
    if (!milestone) {
      return c.json({ error: 'Milestone not found' }, 404);
    }

    // Only client can approve
    if (milestone.client_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Can only approve if submitted
    if (milestone.status !== 'submitted') {
      return c.json({ error: 'Milestone not submitted yet' }, 400);
    }

    // Update status
    milestone.status = 'approved';
    milestone.approved_at = new Date().toISOString();
    milestone.approval_feedback = feedback || '';
    milestone.payment_status = 'pending'; // 🔥 標記為待支付
    milestone.updated_at = new Date().toISOString();
    
    await kv.set(`milestone:${milestoneId}`, milestone);

    console.log(`✅ [Milestone] Client ${user.id} approved milestone ${milestoneId}, awaiting payment confirmation`);
    
    return c.json({ milestone });
  } catch (error) {
    console.error('[Milestone] Error approving milestone:', error);
    return c.json({ error: 'Failed to approve milestone' }, 500);
  }
});

// Reject milestone and request changes (client rejects)
milestoneRoutes.post("/milestones/:milestoneId/reject", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const milestoneId = c.req.param('milestoneId');
    const { feedback } = await c.req.json();
    
    if (!feedback) {
      return c.json({ error: 'Feedback is required when requesting changes' }, 400);
    }

    const milestone = await kv.get(`milestone:${milestoneId}`);
    
    if (!milestone) {
      return c.json({ error: 'Milestone not found' }, 404);
    }

    // Only client can reject
    if (milestone.client_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Can only reject if submitted
    if (milestone.status !== 'submitted') {
      return c.json({ error: 'Milestone not submitted yet' }, 400);
    }

    // Update status - send back to in_progress
    milestone.status = 'in_progress';
    milestone.rejection_feedback = feedback;
    milestone.rejected_at = new Date().toISOString();
    milestone.updated_at = new Date().toISOString();
    
    await kv.set(`milestone:${milestoneId}`, milestone);

    console.log(`❌ [Milestone] Client ${user.id} rejected milestone ${milestoneId}`);
    
    // TODO: Send email notification to freelancer about required changes
    
    return c.json({ milestone });
  } catch (error) {
    console.error('[Milestone] Error rejecting milestone:', error);
    return c.json({ error: 'Failed to reject milestone' }, 500);
  }
});

// Get milestone statistics for a project
milestoneRoutes.get("/milestones/project/:projectId/stats", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    
    // Get project to verify access
    const project = await kv.get(`project:${projectId}`);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Get accepted proposal for this project
    const proposalIds = await kv.get(`proposals:project:${projectId}`) || [];
    const proposals = proposalIds.length > 0
      ? await kv.mget(proposalIds.map((id: string) => `proposal:${id}`))
      : [];
    
    const acceptedProposal = proposals.find((p: any) => p && p.status === 'accepted');
    
    if (!acceptedProposal) {
      return c.json({ 
        hasMilestones: false,
        stats: null 
      });
    }

    // Get milestones for the accepted proposal
    const milestoneIds = await kv.get(`milestones:proposal:${acceptedProposal.id}`) || [];
    const milestones = milestoneIds.length > 0
      ? await kv.mget(milestoneIds.map((id: string) => `milestone:${id}`))
      : [];

    const validMilestones = milestones.filter(Boolean);

    if (validMilestones.length === 0) {
      return c.json({ 
        hasMilestones: false,
        stats: null 
      });
    }

    // Calculate stats
    const total = validMilestones.length;
    const completed = validMilestones.filter((m: any) => m.status === 'approved').length;
    const inProgress = validMilestones.filter((m: any) => m.status === 'in_progress').length;
    const submitted = validMilestones.filter((m: any) => m.status === 'submitted').length;
    const pending = validMilestones.filter((m: any) => m.status === 'pending').length;

    const totalAmount = validMilestones.reduce((sum: number, m: any) => sum + (m.amount || 0), 0);
    const releasedAmount = validMilestones
      .filter((m: any) => m.status === 'approved')
      .reduce((sum: number, m: any) => sum + (m.amount || 0), 0);

    const progressPercentage = total > 0 ? (completed / total) * 100 : 0;

    return c.json({
      hasMilestones: true,
      stats: {
        total,
        completed,
        inProgress,
        submitted,
        pending,
        totalAmount,
        releasedAmount,
        progressPercentage,
      },
      milestones: validMilestones.sort((a: any, b: any) => a.order - b.order),
    });
  } catch (error) {
    console.error('[Milestone] Error fetching project stats:', error);
    return c.json({ error: 'Failed to fetch milestone stats' }, 500);
  }
});

// 🔥 新增：確認支付端點 - 將已批准的里程碑釋放款項
milestoneRoutes.post("/milestones/:milestoneId/release-payment", async (c) => {
  try {
    const accessToken = getAccessToken(c);
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const milestoneId = c.req.param('milestoneId');
    const milestone = await kv.get(`milestone:${milestoneId}`);
    
    if (!milestone) {
      return c.json({ error: 'Milestone not found' }, 404);
    }

    // Only client can release payment
    if (milestone.client_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // 🔥 可以在待開始或已批准狀態時支付
    if (milestone.status !== 'approved' && milestone.status !== 'pending') {
      return c.json({ error: 'Milestone must be pending or approved to release payment' }, 400);
    }

    // 🔥 檢查是否已經支付過
    if (milestone.payment_status === 'released') {
      return c.json({ 
        error: 'Payment already released',
        milestone 
      }, 400);
    }

    // 💰 Release payment from project escrow
    try {
      // 🔥 Get project escrow
      const escrowKey = await kv.get(`escrow:project:${milestone.project_id}`);
      
      // 🔥 變量聲明（在兩種模式中都需要用到）
      let projectEscrow: any = null;
      
      // 🔥 如果沒有托管賬戶，直接從案主錢包扣款（適用於直接支付模式）
      if (!escrowKey) {
        console.log(`💰 [Milestone] No escrow found, using direct wallet payment for milestone ${milestoneId}`);
        
        // 從案主錢包扣款
        let clientWallet = await kv.get(`wallet:${milestone.client_id}`);
        
        if (!clientWallet) {
          throw new Error('Client wallet not found');
        }
        
        // 🔥 優化錯誤訊息：提供充值引導
        if (clientWallet.balance < milestone.amount) {
          const shortfall = milestone.amount - clientWallet.balance;
          
          throw new Error(`Insufficient wallet balance. You need to add ${formatCurrencyAmount(shortfall, milestone.currency || 'TWD')} to your wallet. Current balance: ${formatCurrencyAmount(clientWallet.balance, milestone.currency || 'TWD')}, Required: ${formatCurrencyAmount(milestone.amount, milestone.currency || 'TWD')}`);
        }
        
        // 扣除案主錢包餘額
        clientWallet.balance -= milestone.amount;
        clientWallet.total_spent = (clientWallet.total_spent || 0) + milestone.amount;
        clientWallet.updated_at = new Date().toISOString();
        await kv.set(`wallet:${milestone.client_id}`, clientWallet);
        
        // 記錄案主的交易（支出）
        const clientTransactionId = crypto.randomUUID();
        const clientTransaction = {
          id: clientTransactionId,
          user_id: milestone.client_id,
          type: 'milestone_payment',
          amount: -milestone.amount, // 負數表示支出
          description: `Milestone payment: ${milestone.title}`,
          milestone_id: milestone.id,
          project_id: milestone.project_id,
          created_at: new Date().toISOString(),
        };
        await kv.set(`transaction:${clientTransactionId}`, clientTransaction);
        
        const clientTransactions = await kv.get(`transactions:user:${milestone.client_id}`) || [];
        clientTransactions.unshift(clientTransactionId);
        await kv.set(`transactions:user:${milestone.client_id}`, clientTransactions);
        
        console.log(`💰 [Milestone] Deducted ${milestone.amount} from client wallet:`, {
          clientId: milestone.client_id,
          newBalance: clientWallet.balance,
          transactionId: clientTransactionId,
        });
      } else {
        // 原有的托管賬戶邏輯
        projectEscrow = await kv.get(`escrow:${escrowKey}`);
        if (!projectEscrow) {
          throw new Error('Project escrow not found');
        }
        
        // 🔥 Check if escrow has enough funds
        const remainingAmount = (projectEscrow.amount || 0) - (projectEscrow.released_amount || 0);
        if (remainingAmount < milestone.amount) {
          throw new Error(`Insufficient escrow funds. Available: $${remainingAmount}, Required: $${milestone.amount}`);
        }
        
        console.log(`💰 [Milestone] Releasing payment from escrow:`, {
          escrowId: projectEscrow.id,
          totalEscrow: projectEscrow.amount,
          previouslyReleased: projectEscrow.released_amount || 0,
          milestoneAmount: milestone.amount,
          remainingAfter: remainingAmount - milestone.amount,
        });
        
        // 🔥 Update escrow: track released amount
        projectEscrow.released_amount = (projectEscrow.released_amount || 0) + milestone.amount;
        projectEscrow.updated_at = new Date().toISOString();
        
        // 🔥 If all funds released, mark escrow as completed
        if (Math.abs(projectEscrow.released_amount - projectEscrow.amount) < 0.01) {
          projectEscrow.status = 'completed';
          projectEscrow.completed_at = new Date().toISOString();
        }
        
        await kv.set(`escrow:${escrowKey}`, projectEscrow);
        
        // 🔥 Store escrow reference in milestone
        milestone.escrow_id = escrowKey;
      }
      
      // 🔥 Common payment logic: Update milestone status
      milestone.payment_status = 'released'; // 🔥 標記為已支付
      milestone.payment_released_at = new Date().toISOString();
      await kv.set(`milestone:${milestoneId}`, milestone);

      // 🔥 Add to freelancer's wallet (using correct wallet key format)
      let wallet = await kv.get(`wallet:${milestone.freelancer_id}`);
      
      if (!wallet) {
        wallet = {
          user_id: milestone.freelancer_id,
          balance: 0,
          locked: 0,
          total_earned: 0,
          total_spent: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      wallet.balance += milestone.amount;
      wallet.total_earned += milestone.amount;
      wallet.updated_at = new Date().toISOString();
      await kv.set(`wallet:${milestone.freelancer_id}`, wallet);

      // 🔥 Create transaction record for freelancer (payment received)
      const transactionId = crypto.randomUUID();
      const transaction = {
        id: transactionId,
        user_id: milestone.freelancer_id,
        type: 'milestone_payment',
        amount: milestone.amount,
        description: `Milestone payment: ${milestone.title}`,
        milestone_id: milestone.id,
        project_id: milestone.project_id,
        escrow_id: milestone.escrow_id,
        created_at: new Date().toISOString(),
      };

      await kv.set(`transaction:${transactionId}`, transaction);
      
      // Add to user's transaction list
      const userTransactions = await kv.get(`transactions:user:${milestone.freelancer_id}`) || [];
      userTransactions.unshift(transactionId);
      await kv.set(`transactions:user:${milestone.freelancer_id}`, userTransactions);

      console.log(`💰 [Milestone] Payment released: $${milestone.amount} to freelancer ${milestone.freelancer_id}`, {
        transactionId,
        escrowRemaining: projectEscrow ? projectEscrow.amount - projectEscrow.released_amount : null,
        freelancerNewBalance: wallet.balance,
      });

      // 🔥 發送郵件通知給案主和接案者
      try {
        // 獲取項目信息
        const project = await kv.get(`project:${milestone.project_id}`);
        const projectTitle = project?.title || 'Project';
        
        // 獲取提案信息以獲取幣種
        const proposal = await kv.get(`proposal:${milestone.proposal_id}`);
        const currency = proposal?.currency || 'TWD';
        
        // 🔥 修正：使用正確的 profile key 格式 (profile_{userId})
        const clientProfile = await kv.get(`profile_${milestone.client_id}`);
        const freelancerProfile = await kv.get(`profile_${milestone.freelancer_id}`);
        
        // 獲取語言偏好（從 profile 或使用預設）
        const clientLanguage = clientProfile?.language || 'zh';
        const freelancerLanguage = freelancerProfile?.language || 'zh';
        
        const clientName = clientProfile?.full_name || clientProfile?.email?.split('@')[0] || 'Client';
        const freelancerName = freelancerProfile?.full_name || freelancerProfile?.email?.split('@')[0] || 'Freelancer';
        
        const clientEmail = clientProfile?.email || user.email; // fallback 使用當前用戶 email
        const freelancerEmail = freelancerProfile?.email;
        
        console.log('📧 [Milestone] Sending payment emails:', {
          clientEmail,
          freelancerEmail,
          clientLanguage,
          freelancerLanguage,
          currency,
        });
        
        // 發送郵件給案主（付款確認）
        if (clientEmail) {
          const clientEmailHtml = emailService.getClientPaymentConfirmationEmail({
            name: clientName,
            projectTitle,
            milestoneTitle: milestone.title,
            amount: milestone.amount,
            freelancerName,
            language: clientLanguage as 'en' | 'zh',
            currency,
          });
          
          const clientEmailSubject = clientLanguage === 'en' 
            ? `✅ Payment Confirmed - ${milestone.title}` 
            : `✅ 付款確認 - ${milestone.title}`;
          
          await emailService.sendEmail({
            to: clientEmail,
            subject: clientEmailSubject,
            html: clientEmailHtml,
          });
          
          console.log('✅ [Milestone] Client payment confirmation email sent to:', clientEmail);
        }
        
        // 發送郵件給接案者（收到付款）
        if (freelancerEmail) {
          const freelancerEmailHtml = emailService.getMilestonePaymentEmail({
            name: freelancerName,
            projectTitle,
            milestoneTitle: milestone.title,
            amount: milestone.amount,
            language: freelancerLanguage as 'en' | 'zh',
            currency,
          });
          
          const freelancerEmailSubject = freelancerLanguage === 'en' 
            ? `💰 Payment Received - ${milestone.title}` 
            : `💰 已收到付款 - ${milestone.title}`;
          
          await emailService.sendEmail({
            to: freelancerEmail,
            subject: freelancerEmailSubject,
            html: freelancerEmailHtml,
          });
          
          console.log('✅ [Milestone] Freelancer payment notification email sent to:', freelancerEmail);
        }
      } catch (emailError) {
        // 📧 郵件發送失敗不應影響付款流程
        console.error('⚠️ [Milestone] Failed to send payment notification emails:', emailError);
      }
      
      return c.json({ 
        success: true,
        milestone,
        payment: {
          amount: milestone.amount,
          released_at: milestone.payment_released_at,
          transaction_id: transactionId,
        }
      });
    } catch (paymentError) {
      console.error('[Milestone] Error processing payment:', paymentError);
      
      // 🔥 Mark payment as failed
      milestone.payment_status = 'failed';
      milestone.payment_error = paymentError.message;
      await kv.set(`milestone:${milestoneId}`, milestone);
      
      return c.json({ 
        error: 'Payment release failed',
        details: paymentError.message,
        milestone 
      }, 500);
    }
  } catch (error) {
    console.error('[Milestone] Error releasing payment:', error);
    return c.json({ error: 'Failed to release payment' }, 500);
  }
});

console.log('[Milestone Service] Routes registered');

// 🔥 Helper function to format currency amount
function formatCurrencyAmount(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  });
  return formatter.format(amount);
}