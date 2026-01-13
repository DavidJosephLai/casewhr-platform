/**
 * Withdrawal Request Routes
 * 提款申請路由系統
 * 新的手動提款申請和審核系統
 */

import * as kv from './kv_store.tsx';

export function registerWithdrawalRequestRoutes(app: any, supabase: any, emailService: any) {
  
  // Update bank account
  app.put("/make-server-215f78a5/bank-accounts/:accountId", async (c: any) => {
    try {
      const accountId = c.req.param('accountId');
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!accessToken) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user?.id) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const bankAccount = await kv.get(accountId);
      
      if (!bankAccount || bankAccount.user_id !== user.id) {
        return c.json({ error: 'Bank account not found' }, 404);
      }

      const body = await c.req.json();
      const updated = {
        ...bankAccount,
        ...body,
        id: accountId,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      await kv.set(accountId, updated);

      console.log(`✅ Bank account updated for user ${user.id}`);

      return c.json({ success: true, bank_account: updated });
    } catch (error) {
      console.error('Error updating bank account:', error);
      return c.json({ error: 'Failed to update bank account' }, 500);
    }
  });

  // Create a withdrawal request
  app.post("/make-server-215f78a5/withdrawal-requests", async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!accessToken) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user?.id) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const body = await c.req.json();
      const { bank_account_id, amount, currency, note } = body;

      if (!bank_account_id) {
        return c.json({ error: 'Bank account required' }, 400);
      }

      if (!amount || amount <= 0) {
        return c.json({ error: 'Invalid amount' }, 400);
      }

      // Verify bank account belongs to user
      const bankAccount = await kv.get(bank_account_id);
      if (!bankAccount || bankAccount.user_id !== user.id) {
        return c.json({ error: 'Invalid bank account' }, 400);
      }

      // Check wallet balance
      const walletKey = `wallet_${user.id}`;
      let wallet = await kv.get(walletKey);

      if (!wallet) {
        return c.json({ error: 'Wallet not found' }, 404);
      }

      // Migrate old wallet structure if needed
      if (wallet.balance !== undefined && wallet.available_balance === undefined) {
        wallet.available_balance = wallet.balance || 0;
        delete wallet.balance;
      }
      if (wallet.locked !== undefined && wallet.pending_withdrawal === undefined) {
        wallet.pending_withdrawal = wallet.locked || 0;
        delete wallet.locked;
      }

      if (wallet.available_balance < amount) {
        return c.json({ error: 'Insufficient balance' }, 400);
      }

      // Create withdrawal request
      const requestId = `withdrawal_request_${Date.now()}_${user.id}`;
      const now = new Date().toISOString();

      const withdrawalRequest = {
        id: requestId,
        user_id: user.id,
        bank_account_id,
        amount, // USD
        currency: currency || 'USD',
        status: 'pending',
        note: note || null,
        admin_note: null,
        processed_by: null,
        processed_at: null,
        created_at: now,
        updated_at: now,
      };

      await kv.set(requestId, withdrawalRequest);

      // Deduct from available balance and add to pending_withdrawal
      wallet.available_balance -= amount;
      wallet.pending_withdrawal = (wallet.pending_withdrawal || 0) + amount;
      wallet.updated_at = now;
      await kv.set(walletKey, wallet);

      // Create transaction record
      const transactionKey = `transaction_${Date.now()}_${user.id}`;
      await kv.set(transactionKey, {
        id: transactionKey,
        user_id: user.id,
        type: 'withdrawal_request',
        amount: -amount,
        description: `Withdrawal request to ${bankAccount.bank_name}`,
        status: 'pending',
        reference_id: requestId,
        created_at: now,
      });

      console.log(`✅ Withdrawal request created: ${requestId} for $${amount}`);

      // Send email notification to user
      try {
        const profile = await kv.get(`profile_${user.id}`);
        if (profile?.email) {
          const language = profile.language || profile.bg_set || profile.lang || 'zh';
          
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">💰 ${language === 'en' ? 'Withdrawal Request Submitted' : '提款申請已提交'}</h2>
              <p>${language === 'en' ? `Hi ${profile.name || profile.full_name || profile.email},` : `${profile.name || profile.full_name || profile.email} 您好，`}</p>
              <p>${language === 'en' ? 'Your withdrawal request has been received and is pending review.' : '您的提款申請已收到，正在等待審核。'}</p>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>${language === 'en' ? 'Request ID:' : '申請編號：'}</strong> ${requestId.slice(0, 16)}</p>
                <p style="margin: 5px 0;"><strong>${language === 'en' ? 'Amount:' : '金額：'}</strong> $${amount.toFixed(2)} ${currency || 'USD'}</p>
                <p style="margin: 5px 0;"><strong>${language === 'en' ? 'Bank:' : '銀行：'}</strong> ${bankAccount.bank_name}</p>
                <p style="margin: 5px 0;"><strong>${language === 'en' ? 'Status:' : '狀態：'}</strong> ${language === 'en' ? 'Pending Review' : '待審核'}</p>
              </div>
              <p>${language === 'en' ? 'Processing time: 1-3 business days' : '處理時間：1-3 個工作天'}</p>
              <p>${language === 'en' ? 'You will receive email notifications when your request is processed.' : '當您的申請被處理時，您將收到郵件通知。'}</p>
            </div>
          `;

          await emailService.sendEmail({
            to: profile.email,
            subject: language === 'en' ? '💰 Withdrawal Request Submitted' : '💰 提款申請已提交',
            html: emailHtml,
          });
          
          console.log(`📧 Withdrawal request email sent to ${profile.email}`);
        }
      } catch (emailError) {
        console.error('❌ Error sending withdrawal request email:', emailError);
      }

      return c.json({ success: true, request: withdrawalRequest });
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      return c.json({ error: 'Failed to create withdrawal request' }, 500);
    }
  });

  // Get user's withdrawal requests
  app.get("/make-server-215f78a5/withdrawal-requests", async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!accessToken) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user?.id) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const allRequests = await kv.getByPrefix('withdrawal_request_') || [];
      const userRequests = allRequests
        .filter((req: any) => req?.user_id === user.id)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Populate bank account details
      for (const request of userRequests) {
        if (request.bank_account_id) {
          const bankAccount = await kv.get(request.bank_account_id);
          if (bankAccount) {
            request.bank_account = {
              bank_name: bankAccount.bank_name,
              account_number: bankAccount.account_number,
              account_name: bankAccount.account_name || bankAccount.account_holder_name,
              branch_name: bankAccount.branch_name,
            };
          }
        }
      }

      return c.json({ requests: userRequests });
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      return c.json({ error: 'Failed to fetch withdrawal requests' }, 500);
    }
  });

  // Admin: Get all withdrawal requests
  app.get("/make-server-215f78a5/withdrawal-requests/admin/all", async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!accessToken) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user?.id) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Check if user is admin (davidlai234@hotmail.com)
      const profile = await kv.get(`profile_${user.id}`);
      if (!profile || profile.email !== 'davidlai234@hotmail.com') {
        return c.json({ error: 'Admin access required' }, 403);
      }

      const allRequests = await kv.getByPrefix('withdrawal_request_') || [];
      const sorted = allRequests.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Populate user and bank account details
      for (const request of sorted) {
        if (request.user_id) {
          const userProfile = await kv.get(`profile_${request.user_id}`);
          if (userProfile) {
            request.user_email = userProfile.email;
            request.user_name = userProfile.name || userProfile.full_name;
          }
        }
        
        if (request.bank_account_id) {
          const bankAccount = await kv.get(request.bank_account_id);
          if (bankAccount) {
            request.bank_account = {
              bank_name: bankAccount.bank_name,
              account_number: bankAccount.account_number,
              account_name: bankAccount.account_name || bankAccount.account_holder_name,
              branch_name: bankAccount.branch_name,
            };
          }
        }
      }

      return c.json({ requests: sorted });
    } catch (error) {
      console.error('Error fetching all withdrawal requests:', error);
      return c.json({ error: 'Failed to fetch withdrawal requests' }, 500);
    }
  });

  // Admin: Approve withdrawal request
  app.post("/make-server-215f78a5/withdrawal-requests/:requestId/approve", async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!accessToken) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user?.id) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Check if user is admin
      const profile = await kv.get(`profile_${user.id}`);
      if (!profile || profile.email !== 'davidlai234@hotmail.com') {
        return c.json({ error: 'Admin access required' }, 403);
      }

      const requestId = c.req.param('requestId');
      const request = await kv.get(requestId);

      if (!request) {
        return c.json({ error: 'Request not found' }, 404);
      }

      if (request.status !== 'pending') {
        return c.json({ error: 'Request cannot be approved' }, 400);
      }

      const body = await c.req.json().catch(() => ({}));
      const { admin_note } = body;

      // Update request status
      request.status = 'approved';
      request.admin_note = admin_note || null;
      request.processed_by = user.id;
      request.processed_at = new Date().toISOString();
      request.updated_at = new Date().toISOString();
      await kv.set(requestId, request);

      console.log(`✅ Withdrawal request approved: ${requestId}`);

      // Send email notification to user
      try {
        const userProfile = await kv.get(`profile_${request.user_id}`);
        if (userProfile?.email) {
          const language = userProfile.language || userProfile.bg_set || userProfile.lang || 'zh';
          
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10b981;">✅ ${language === 'en' ? 'Withdrawal Request Approved' : '提款申請已批准'}</h2>
              <p>${language === 'en' ? `Hi ${userProfile.name || userProfile.full_name || userProfile.email},` : `${userProfile.name || userProfile.full_name || userProfile.email} 您好，`}</p>
              <p>${language === 'en' ? 'Good news! Your withdrawal request has been approved.' : '好消息！您的提款申請已被批准。'}</p>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>${language === 'en' ? 'Request ID:' : '申請編號：'}</strong> ${requestId.slice(0, 16)}</p>
                <p style="margin: 5px 0;"><strong>${language === 'en' ? 'Amount:' : '金額：'}</strong> $${request.amount.toFixed(2)} ${request.currency}</p>
                <p style="margin: 5px 0;"><strong>${language === 'en' ? 'Status:' : '狀態：'}</strong> ${language === 'en' ? 'Approved - Processing Payment' : '已批准 - 處理付款中'}</p>
              </div>
              <p>${language === 'en' ? 'The funds will be transferred to your bank account within 1-2 business days.' : '款項將在 1-2 個工作天內轉入您的銀行帳戶。'}</p>
            </div>
          `;

          await emailService.sendEmail({
            to: userProfile.email,
            subject: language === 'en' ? '✅ Withdrawal Request Approved' : '✅ 提款申請已批准',
            html: emailHtml,
          });
        }
      } catch (emailError) {
        console.error('❌ Error sending approval email:', emailError);
      }

      return c.json({ success: true, request });
    } catch (error) {
      console.error('Error approving withdrawal request:', error);
      return c.json({ error: 'Failed to approve request' }, 500);
    }
  });

  // Admin: Reject withdrawal request
  app.post("/make-server-215f78a5/withdrawal-requests/:requestId/reject", async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!accessToken) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user?.id) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Check if user is admin
      const profile = await kv.get(`profile_${user.id}`);
      if (!profile || profile.email !== 'davidlai234@hotmail.com') {
        return c.json({ error: 'Admin access required' }, 403);
      }

      const requestId = c.req.param('requestId');
      const request = await kv.get(requestId);

      if (!request) {
        return c.json({ error: 'Request not found' }, 404);
      }

      if (request.status !== 'pending') {
        return c.json({ error: 'Request cannot be rejected' }, 400);
      }

      const body = await c.req.json().catch(() => ({}));
      const { admin_note } = body;

      // Update request status
      request.status = 'rejected';
      request.admin_note = admin_note || null;
      request.processed_by = user.id;
      request.processed_at = new Date().toISOString();
      request.updated_at = new Date().toISOString();
      await kv.set(requestId, request);

      // Return amount to available balance
      const walletKey = `wallet_${request.user_id}`;
      const wallet = await kv.get(walletKey);
      if (wallet) {
        wallet.available_balance = (wallet.available_balance || 0) + request.amount;
        wallet.pending_withdrawal = Math.max(0, (wallet.pending_withdrawal || 0) - request.amount);
        wallet.updated_at = new Date().toISOString();
        await kv.set(walletKey, wallet);
      }

      // Update transaction status
      const transactions = await kv.getByPrefix(`transaction_`) || [];
      const relatedTransaction = transactions.find((t: any) => t.reference_id === requestId);
      if (relatedTransaction) {
        relatedTransaction.status = 'cancelled';
        await kv.set(relatedTransaction.id, relatedTransaction);
      }

      console.log(`❌ Withdrawal request rejected: ${requestId}`);

      // Send email notification to user
      try {
        const userProfile = await kv.get(`profile_${request.user_id}`);
        if (userProfile?.email) {
          const language = userProfile.language || userProfile.bg_set || userProfile.lang || 'zh';
          const reason = admin_note || (language === 'en' ? 'No reason provided' : '未提供原因');
          
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #ef4444;">❌ ${language === 'en' ? 'Withdrawal Request Rejected' : '提款申請已拒絕'}</h2>
              <p>${language === 'en' ? `Hi ${userProfile.name || userProfile.full_name || userProfile.email},` : `${userProfile.name || userProfile.full_name || userProfile.email} 您好，`}</p>
              <p>${language === 'en' ? 'Unfortunately, your withdrawal request has been rejected.' : '很抱歉，您的提款申請已被拒絕。'}</p>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>${language === 'en' ? 'Request ID:' : '申請編號：'}</strong> ${requestId.slice(0, 16)}</p>
                <p style="margin: 5px 0;"><strong>${language === 'en' ? 'Amount:' : '金額：'}</strong> $${request.amount.toFixed(2)} ${request.currency}</p>
                <p style="margin: 5px 0;"><strong>${language === 'en' ? 'Reason:' : '原因：'}</strong> ${reason}</p>
              </div>
              <p>${language === 'en' ? 'The amount has been returned to your available balance.' : '金額已退回至您的可用餘額。'}</p>
            </div>
          `;

          await emailService.sendEmail({
            to: userProfile.email,
            subject: language === 'en' ? '❌ Withdrawal Request Rejected' : '❌ 提款申請已拒絕',
            html: emailHtml,
          });
        }
      } catch (emailError) {
        console.error('❌ Error sending rejection email:', emailError);
      }

      return c.json({ success: true, request });
    } catch (error) {
      console.error('Error rejecting withdrawal request:', error);
      return c.json({ error: 'Failed to reject request' }, 500);
    }
  });

  // Admin: Mark withdrawal request as completed
  app.post("/make-server-215f78a5/withdrawal-requests/:requestId/complete", async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!accessToken) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user?.id) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Check if user is admin
      const profile = await kv.get(`profile_${user.id}`);
      if (!profile || profile.email !== 'davidlai234@hotmail.com') {
        return c.json({ error: 'Admin access required' }, 403);
      }

      const requestId = c.req.param('requestId');
      const request = await kv.get(requestId);

      if (!request) {
        return c.json({ error: 'Request not found' }, 404);
      }

      if (request.status !== 'approved' && request.status !== 'processing') {
        return c.json({ error: 'Request cannot be completed' }, 400);
      }

      const body = await c.req.json().catch(() => ({}));
      const { admin_note } = body;

      // Update request status
      request.status = 'completed';
      if (admin_note) request.admin_note = admin_note;
      request.completed_by = user.id;
      request.completed_at = new Date().toISOString();
      request.updated_at = new Date().toISOString();
      await kv.set(requestId, request);

      // Remove from pending_withdrawal
      const walletKey = `wallet_${request.user_id}`;
      const wallet = await kv.get(walletKey);
      if (wallet) {
        wallet.pending_withdrawal = Math.max(0, (wallet.pending_withdrawal || 0) - request.amount);
        wallet.updated_at = new Date().toISOString();
        await kv.set(walletKey, wallet);
      }

      // Update transaction status
      const transactions = await kv.getByPrefix(`transaction_`) || [];
      const relatedTransaction = transactions.find((t: any) => t.reference_id === requestId);
      if (relatedTransaction) {
        relatedTransaction.status = 'completed';
        await kv.set(relatedTransaction.id, relatedTransaction);
      }

      console.log(`✅ Withdrawal request completed: ${requestId}`);

      // Send email notification to user
      try {
        const userProfile = await kv.get(`profile_${request.user_id}`);
        if (userProfile?.email) {
          const language = userProfile.language || userProfile.bg_set || userProfile.lang || 'zh';
          
          const bankAccount = await kv.get(request.bank_account_id);
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10b981;">✅ ${language === 'en' ? 'Withdrawal Completed' : '提款已完成'}</h2>
              <p>${language === 'en' ? `Hi ${userProfile.name || userProfile.full_name || userProfile.email},` : `${userProfile.name || userProfile.full_name || userProfile.email} 您好，`}</p>
              <p>${language === 'en' ? 'Your withdrawal has been completed successfully!' : '您的提款已成功完成！'}</p>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>${language === 'en' ? 'Request ID:' : '申請編號：'}</strong> ${requestId.slice(0, 16)}</p>
                <p style="margin: 5px 0;"><strong>${language === 'en' ? 'Amount:' : '金額：'}</strong> $${request.amount.toFixed(2)} ${request.currency}</p>
                <p style="margin: 5px 0;"><strong>${language === 'en' ? 'Bank:' : '銀行：'}</strong> ${bankAccount?.bank_name || ''}</p>
                <p style="margin: 5px 0;"><strong>${language === 'en' ? 'Account:' : '帳號：'}</strong> ${bankAccount?.account_number || ''}</p>
              </div>
              <p>${language === 'en' ? 'The funds have been transferred to your bank account.' : '款項已轉入您的銀行帳戶。'}</p>
            </div>
          `;

          await emailService.sendEmail({
            to: userProfile.email,
            subject: language === 'en' ? '✅ Withdrawal Completed' : '✅ 提款已完成',
            html: emailHtml,
          });
        }
      } catch (emailError) {
        console.error('❌ Error sending completion email:', emailError);
      }

      return c.json({ success: true, request });
    } catch (error) {
      console.error('Error completing withdrawal request:', error);
      return c.json({ error: 'Failed to complete request' }, 500);
    }
  });

  console.log('✅ [WITHDRAWAL REQUESTS] New withdrawal request routes registered');
}
