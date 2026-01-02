// ========== 雙語郵件助手函數 ==========
import * as enhancedEmailTemplates from "./email_templates_enhanced.tsx";
import * as kv from "./kv_store.tsx";

// 🎯 從 KV Store 獲取自定義 LOGO URL
export const getEmailLogoUrl = async (): Promise<string | undefined> => {
  try {
    const logoUrl = await kv.get('system:email:logo-url');
    return logoUrl as string | undefined;
  } catch (error) {
    console.error('❌ [Email Logo] Error fetching logo URL from KV Store:', error);
    return undefined;
  }
};

// 🔐 密碼重設郵件
export const getPasswordResetEmail = async (params: {
  userName: string;
  resetUrl: string;
}): Promise<string> => {
  const { userName, resetUrl } = params;
  
  // 獲取自定義 LOGO URL
  const logoUrl = await getEmailLogoUrl();
  
  return enhancedEmailTemplates.getBilingualEmailTemplate({
    titleZh: '🔐 重設您的密碼',
    titleEn: '🔐 Reset Your Password',
    theme: 'info',
    logoUrl, // 傳入自定義 LOGO URL
    contentZh: `
      <p>親愛的 ${userName}，</p>
      <p>我們收到了重設您密碼的請求。點擊下方按鈕以設置新密碼：</p>
      <div class="alert warning">
        <strong>⚠️ 安全提示：</strong>
        <ul style="margin: 10px 0 0 20px; line-height: 1.8;">
          <li>此連結將在 <strong>1 小時後過期</strong></li>
          <li>如果您沒有請求重設密碼，請忽略此郵件</li>
          <li>請勿與他人分享此連結</li>
        </ul>
      </div>
      <div class="card">
        <h3 style="margin-top: 0;">🔒 為什麼選擇強密碼很重要？</h3>
        <ul style="line-height: 2;">
          <li>至少使用 8 個字符</li>
          <li>包含大小寫字母、數字和特殊符號</li>
          <li>避免使用常見詞彙或個人資訊</li>
        </ul>
      </div>
      <p style="margin-top: 30px;">如果您有任何疑問，請隨時聯繫我們的客服團隊。</p>
    `,
    contentEn: `
      <p>Dear ${userName},</p>
      <p>We received a request to reset your password. Click the button below to set a new password:</p>
      <div class="alert warning">
        <strong>⚠️ Security Notice:</strong>
        <ul style="margin: 10px 0 0 20px; line-height: 1.8;">
          <li>This link will <strong>expire in 1 hour</strong></li>
          <li>If you didn't request a password reset, please ignore this email</li>
          <li>Do not share this link with anyone</li>
        </ul>
      </div>
      <div class="card">
        <h3 style="margin-top: 0;">🔒 Why Strong Passwords Matter?</h3>
        <ul style="line-height: 2;">
          <li>Use at least 8 characters</li>
          <li>Include uppercase, lowercase, numbers, and symbols</li>
          <li>Avoid common words or personal information</li>
        </ul>
      </div>
      <p style="margin-top: 30px;">If you have any questions, feel free to contact our support team.</p>
    `,
    ctaTextZh: '重設密碼',
    ctaTextEn: 'Reset Password',
    ctaUrl: resetUrl
  });
};

// 提交交付物通知郵件（發給案主）
export const getDeliverableSubmittedEmailForClient = (params: {
  clientName: string;
  freelancerName: string;
  projectTitle: string;
}): string => {
  const { clientName, freelancerName, projectTitle } = params;
  
  return enhancedEmailTemplates.getBilingualEmailTemplate({
    titleZh: '📦 收到新的交付物',
    titleEn: '📦 New Deliverable Submitted',
    theme: 'info',
    contentZh: `
      <p>親愛的 ${clientName}，</p>
      <p><strong>${freelancerName}</strong> 已為您的項目「<strong>${projectTitle}</strong>」提交了交付物。</p>
      <div class="card">
        <h3 style="margin-top: 0;">📋 下一步操作</h3>
        <ul style="line-height: 2;">
          <li>仔細審核提交的交付物</li>
          <li>如果滿意，請批准交付物</li>
          <li>如需修改，請提供明確的反饋意見</li>
        </ul>
      </div>
      <div class="alert info">
        <strong>💡 提示：</strong> 清晰的反饋有助於接案者更好地滿足您的需求。
      </div>
    `,
    contentEn: `
      <p>Dear ${clientName},</p>
      <p><strong>${freelancerName}</strong> has submitted a deliverable for your project "<strong>${projectTitle}</strong>".</p>
      <div class="card">
        <h3 style="margin-top: 0;">📋 Next Steps</h3>
        <ul style="line-height: 2;">
          <li>Carefully review the submitted deliverable</li>
          <li>Approve it if you're satisfied</li>
          <li>Request revisions with clear feedback if needed</li>
        </ul>
      </div>
      <div class="alert info">
        <strong>💡 Tip:</strong> Clear feedback helps the freelancer better meet your requirements.
      </div>
    `,
    ctaTextZh: '審核交付物',
    ctaTextEn: 'Review Deliverable',
    ctaUrl: 'https://casewhr.com/dashboard'
  });
};

// 提交交付物確認郵件（發給接案者）
export const getDeliverableSubmittedEmailForFreelancer = (params: {
  freelancerName: string;
  projectTitle: string;
}): string => {
  const { freelancerName, projectTitle } = params;
  
  return enhancedEmailTemplates.getBilingualEmailTemplate({
    titleZh: '✅ 交付物已成功提交',
    titleEn: '✅ Deliverable Submitted Successfully',
    theme: 'success',
    contentZh: `
      <p>親愛的 ${freelancerName}，</p>
      <p>您為項目「<strong>${projectTitle}</strong>」提交的交付物已成功提交。</p>
      <div class="card success">
        <h3 style="margin-top: 0;">📬 接下來會發生什麼？</h3>
        <ul style="line-height: 2;">
          <li>案主將盡快審核您的交付物</li>
          <li>您將收到批准或修改要求的通知</li>
          <li>批准後，項目將進入撥款階段</li>
        </ul>
      </div>
      <p>感謝您的辛勤工作和專業精神！</p>
    `,
    contentEn: `
      <p>Dear ${freelancerName},</p>
      <p>Your deliverable for the project "<strong>${projectTitle}</strong>" has been submitted successfully.</p>
      <div class="card success">
        <h3 style="margin-top: 0;">📬 What Happens Next?</h3>
        <ul style="line-height: 2;">
          <li>The client will review your deliverable shortly</li>
          <li>You'll be notified of approval or revision requests</li>
          <li>Once approved, the project moves to payment release</li>
        </ul>
      </div>
      <p>Thank you for your hard work and professionalism!</p>
    `
  });
};

// 交付物批准郵件（發給接案者）
export const getDeliverableApprovedEmail = (params: {
  freelancerName: string;
  clientName: string;
  projectTitle: string;
}): string => {
  const { freelancerName, clientName, projectTitle } = params;
  
  return enhancedEmailTemplates.getBilingualEmailTemplate({
    titleZh: '🎉 交付物已批准！',
    titleEn: '🎉 Deliverable Approved!',
    theme: 'success',
    contentZh: `
      <p>親愛的 ${freelancerName}，</p>
      <div class="emoji-large">🎊</div>
      <p><strong>好消息！</strong> ${clientName} 已批准您為項目「<strong>${projectTitle}</strong>」提交的交付物。</p>
      <div class="card success">
        <h3 style="margin-top: 0;">💰 撥款流程</h3>
        <ul style="line-height: 2;">
          <li>✅ 項目現已進入<strong>等待撥款</strong>狀態</li>
          <li>💰 案主將很快釋放託管款項</li>
          <li>🏦 款項將直接存入您的錢包</li>
          <li>📧 您將收到撥款確認通知</li>
        </ul>
      </div>
      <div class="alert success">
        <strong>🌟 恭喜您成功完成項目！</strong><br/>
        這次出色的表現將提升您在平台上的聲譽。
      </div>
    `,
    contentEn: `
      <p>Dear ${freelancerName},</p>
      <div class="emoji-large">🎊</div>
      <p><strong>Great news!</strong> ${clientName} has approved your deliverable for the project "<strong>${projectTitle}</strong>".</p>
      <div class="card success">
        <h3 style="margin-top: 0;">💰 Payment Process</h3>
        <ul style="line-height: 2;">
          <li>✅ Project is now in <strong>Pending Payment</strong> status</li>
          <li>💰 Client will release escrow funds soon</li>
          <li>🏦 Funds will be deposited directly to your wallet</li>
          <li>📧 You'll receive a payment confirmation notification</li>
        </ul>
      </div>
      <div class="alert success">
        <strong>🌟 Congratulations on completing the project!</strong><br/>
        This excellent performance will boost your reputation on the platform.
      </div>
    `,
    ctaTextZh: '查看項目',
    ctaTextEn: 'View Project',
    ctaUrl: 'https://casewhr.com/dashboard'
  });
};

// 交付物需要修改郵件（發給接案者）
export const getDeliverableRevisionRequestedEmail = (params: {
  freelancerName: string;
  clientName: string;
  projectTitle: string;
  reviewNote?: string;
}): string => {
  const { freelancerName, clientName, projectTitle, reviewNote } = params;
  
  return enhancedEmailTemplates.getBilingualEmailTemplate({
    titleZh: '🔄 需要修改',
    titleEn: '🔄 Revision Requested',
    theme: 'warning',
    contentZh: `
      <p>親愛的 ${freelancerName}，</p>
      <p>${clientName} 要求修改您為項目「<strong>${projectTitle}</strong>」提交的交付物。</p>
      ${reviewNote ? `
        <div class="card warning">
          <h3 style="margin-top: 0;">💬 案主反饋</h3>
          <div style="background: white; padding: 16px; border-radius: 6px; border-left: 3px solid #f59e0b;">
            <p style="margin: 0; font-style: italic;">"${reviewNote}"</p>
          </div>
        </div>
      ` : ''}
      <div class="alert warning">
        <strong>📝 下一步：</strong>
        <ul style="margin: 8px 0;">
          <li>仔細閱讀客戶的反饋意見</li>
          <li>進行必要的修改</li>
          <li>重新提交更新後的交付物</li>
        </ul>
      </div>
      <p>別擔心！修改要求是項目流程的正常部分。這是一個確保客戶完全滿意的機會。</p>
    `,
    contentEn: `
      <p>Dear ${freelancerName},</p>
      <p>${clientName} has requested revisions for your deliverable on the project "<strong>${projectTitle}</strong>".</p>
      ${reviewNote ? `
        <div class="card warning">
          <h3 style="margin-top: 0;">💬 Client Feedback</h3>
          <div style="background: white; padding: 16px; border-radius: 6px; border-left: 3px solid #f59e0b;">
            <p style="margin: 0; font-style: italic;">"${reviewNote}"</p>
          </div>
        </div>
      ` : ''}
      <div class="alert warning">
        <strong>📝 Next Steps:</strong>
        <ul style="margin: 8px 0;">
          <li>Carefully review the client's feedback</li>
          <li>Make the necessary revisions</li>
          <li>Resubmit the updated deliverable</li>
        </ul>
      </div>
      <p>Don't worry! Revision requests are a normal part of the project process. This is an opportunity to ensure complete client satisfaction.</p>
    `,
    ctaTextZh: '查看反饋',
    ctaTextEn: 'View Feedback',
    ctaUrl: 'https://casewhr.com/dashboard'
  });
};

// 撥款成功郵件（發給接案者）
export const getPaymentReceivedEmail = (params: {
  freelancerName: string;
  projectTitle: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  feePercentage: number;
}): string => {
  const { freelancerName, projectTitle, grossAmount, platformFee, netAmount, feePercentage } = params;
  
  return enhancedEmailTemplates.getBilingualEmailTemplate({
    titleZh: '💰 款項已到賬！',
    titleEn: '💰 Payment Received!',
    theme: 'success',
    contentZh: `
      <p>親愛的 ${freelancerName}，</p>
      <div class="emoji-large">💸</div>
      <p><strong>好消息！</strong>項目「<strong>${projectTitle}</strong>」的款項已成功釋放。</p>
      <div class="card success">
        <h3 style="margin-top: 0;">💰 款項詳情</h3>
        <div class="detail-row">
          <span class="detail-label">總金額：</span>
          <span class="detail-value">$${grossAmount.toFixed(2)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">平台費用 (${feePercentage}%)：</span>
          <span class="detail-value" style="color: #6b7280;">-$${platformFee.toFixed(2)}</span>
        </div>
        <div class="divider"></div>
        <div class="detail-row" style="border-bottom: none;">
          <span class="detail-label" style="font-size: 18px; color: #10b981;">您收到：</span>
          <span class="detail-value" style="font-size: 24px; color: #10b981; font-weight: 700;">$${netAmount.toFixed(2)}</span>
        </div>
      </div>
      <div class="alert success">
        <strong>✅ 款項已添加到您的錢包</strong><br/>
        您可以隨時提現到您的銀行帳戶。
      </div>
      <p style="text-align: center; font-size: 18px;"><strong>🎉 恭喜您成功完成項目！</strong></p>
    `,
    contentEn: `
      <p>Dear ${freelancerName},</p>
      <div class="emoji-large">💸</div>
      <p><strong>Great news!</strong> Payment for the project "<strong>${projectTitle}</strong>" has been successfully released.</p>
      <div class="card success">
        <h3 style="margin-top: 0;">💰 Payment Details</h3>
        <div class="detail-row">
          <span class="detail-label">Gross Amount:</span>
          <span class="detail-value">$${grossAmount.toFixed(2)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Platform Fee (${feePercentage}%):</span>
          <span class="detail-value" style="color: #6b7280;">-$${platformFee.toFixed(2)}</span>
        </div>
        <div class="divider"></div>
        <div class="detail-row" style="border-bottom: none;">
          <span class="detail-label" style="font-size: 18px; color: #10b981;">You Received:</span>
          <span class="detail-value" style="font-size: 24px; color: #10b981; font-weight: 700;">$${netAmount.toFixed(2)}</span>
        </div>
      </div>
      <div class="alert success">
        <strong>✅ Funds Added to Your Wallet</strong><br/>
        You can withdraw to your bank account anytime.
      </div>
      <p style="text-align: center; font-size: 18px;"><strong>🎉 Congratulations on completing the project!</strong></p>
    `,
    ctaTextZh: '查看錢包',
    ctaTextEn: 'View Wallet',
    ctaUrl: 'https://casewhr.com/wallet'
  });
};

// 撥款成功郵件（發給案主）
export const getPaymentReleasedEmail = (params: {
  clientName: string;
  projectTitle: string;
  amount: number;
  transactionId: string;
}): string => {
  const { clientName, projectTitle, amount, transactionId } = params;
  
  return enhancedEmailTemplates.getBilingualEmailTemplate({
    titleZh: '✅ 款項已成功撥出',
    titleEn: '✅ Payment Released Successfully',
    theme: 'success',
    contentZh: `
      <p>親愛的 ${clientName}，</p>
      <p>您已成功為項目「<strong>${projectTitle}</strong>」撥款。</p>
      <div class="card">
        <h3 style="margin-top: 0;">💼 撥款摘要</h3>
        <div class="detail-row">
          <span class="detail-label">項目：</span>
          <span class="detail-value">${projectTitle}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">撥款金額：</span>
          <span class="detail-value" style="font-size: 20px; color: #3b82f6; font-weight: 600;">$${amount.toFixed(2)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">交易編號：</span>
          <span class="detail-value" style="font-family: monospace; font-size: 12px;">${transactionId}</span>
        </div>
      </div>
      <div class="alert success">
        <strong>🎊 項目已完成！</strong><br/>
        感謝您使用 Case Where 平台。我們希望這次合作體驗愉快。
      </div>
      <p style="text-align: center;">期待您的下一個項目！</p>
    `,
    contentEn: `
      <p>Dear ${clientName},</p>
      <p>You have successfully released payment for the project "<strong>${projectTitle}</strong>".</p>
      <div class="card">
        <h3 style="margin-top: 0;">💼 Payment Summary</h3>
        <div class="detail-row">
          <span class="detail-label">Project:</span>
          <span class="detail-value">${projectTitle}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount Released:</span>
          <span class="detail-value" style="font-size: 20px; color: #3b82f6; font-weight: 600;">$${amount.toFixed(2)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Transaction ID:</span>
          <span class="detail-value" style="font-family: monospace; font-size: 12px;">${transactionId}</span>
        </div>
      </div>
      <div class="alert success">
        <strong>🎊 Project Completed!</strong><br/>
        Thank you for using Case Where. We hope you had a great experience.
      </div>
      <p style="text-align: center;">Looking forward to your next project!</p>
    `,
    ctaTextZh: '發布新項目',
    ctaTextEn: 'Post New Project',
    ctaUrl: 'https://casewhr.com/dashboard'
  });
};