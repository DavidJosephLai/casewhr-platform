// Brevo (Sendinblue) email service - 台灣友好，超級簡單！
export { sendEmail } from './email_service_brevo.tsx';

// Email Templates

export function getSubscriptionSuccessEmail(params: {
  name: string;
  plan: string;
  amount: number;
  nextBillingDate: string;
  language: 'en' | 'zh';
  currency?: string;
}) {
  const { name, plan, amount, nextBillingDate, language, currency = 'USD' } = params;
  
  const planNames = {
    en: { free: 'Free', pro: 'Professional', enterprise: 'Enterprise' },
    zh: { free: '免費', pro: '專業版', enterprise: '企業版' }
  };

  // ⭐ 三幣格式化函數
  const formatAmount = (amount: number, currency: string) => {
    switch (currency) {
      case 'USD':
        return `$${amount.toFixed(2)}`;
      case 'CNY':
        return `¥${Math.round(amount)}`;
      case 'TWD':
      default:
        return `NT$${Math.round(amount)}`;
    }
  };

  const content = language === 'en' ? {
    title: 'Subscription Confirmed! 🎉',
    greeting: `Hi ${name},`,
    message: `Thank you for subscribing to the ${planNames.en[plan as keyof typeof planNames.en]} plan!`,
    details: 'Your subscription details:',
    planLabel: 'Plan',
    amountLabel: 'Amount',
    nextBillingLabel: 'Next Billing Date',
    footer: 'You can manage your subscription anytime from your dashboard.',
    thanks: 'Thank you for choosing Case Where!',
    team: 'The Case Where Team'
  } : {
    title: '訂閱確認成功！🎉',
    greeting: `您好 ${name}，`,
    message: `感謝您訂閱 ${planNames.zh[plan as keyof typeof planNames.zh]} 方案！`,
    details: '您的訂閱詳情：',
    planLabel: '方案',
    amountLabel: '金額',
    nextBillingLabel: '下次扣款日期',
    footer: '您可以隨時從儀表板管理您的訂閱。',
    thanks: '感謝您選擇 Case Where！',
    team: 'Case Where 團隊'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 600; color: #6b7280; }
          .detail-value { color: #111827; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${content.title}</h1>
          </div>
          <div class="content">
            <p>${content.greeting}</p>
            <p>${content.message}</p>
            
            <div class="card">
              <h3>${content.details}</h3>
              <div class="detail-row">
                <span class="detail-label">${content.planLabel}:</span>
                <span class="detail-value">${planNames[language][plan as keyof typeof planNames[typeof language]]}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">${content.amountLabel}:</span>
                <span class="detail-value">$${amount}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">${content.nextBillingLabel}:</span>
                <span class="detail-value">${nextBillingDate}</span>
              </div>
            </div>

            <p>${content.footer}</p>
            <p>${content.thanks}</p>
            <p><strong>${content.team}</strong></p>
          </div>
          <div class="footer">
            © 2024 Case Where 接得準股份有限公司
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getRenewalReminderEmail(params: {
  name: string;
  plan: string;
  amount: number;
  renewalDate: string;
  balance: number;
  language: 'en' | 'zh';
}) {
  const { name, plan, amount, renewalDate, balance, language } = params;
  
  const planNames = {
    en: { free: 'Free', pro: 'Professional', enterprise: 'Enterprise' },
    zh: { free: '免費', pro: '專業版', enterprise: '企業版' }
  };

  const hasEnoughBalance = balance >= amount;

  const content = language === 'en' ? {
    title: hasEnoughBalance ? 'Subscription Renewal Reminder' : '⚠️ Low Balance Alert',
    greeting: `Hi ${name},`,
    message: hasEnoughBalance 
      ? `Your ${planNames.en[plan as keyof typeof planNames.en]} subscription will renew in 3 days.`
      : `Your ${planNames.en[plan as keyof typeof planNames.en]} subscription will renew in 3 days, but your balance is insufficient.`,
    detailsTitle: 'Renewal Details:',
    planLabel: 'Plan',
    amountLabel: 'Amount Due',
    renewalLabel: 'Renewal Date',
    balanceLabel: 'Current Balance',
    actionNeeded: 'Action Needed',
    actionMessage: 'Please add funds to your wallet to ensure uninterrupted service.',
    noActionNeeded: 'No action needed - you have sufficient balance.',
    addFundsButton: 'Add Funds to Wallet',
    footer: 'You can manage your subscription anytime from your dashboard.',
    team: 'The Case Where Team'
  } : {
    title: hasEnoughBalance ? '訂閱續費提醒' : '⚠️ 餘額不足警告',
    greeting: `您好 ${name}，`,
    message: hasEnoughBalance
      ? `您的 ${planNames.zh[plan as keyof typeof planNames.zh]} 訂閱將在 3 天後續費。`
      : `您的 ${planNames.zh[plan as keyof typeof planNames.zh]} 訂閱將在 3 天後續費，但您的餘額不足。`,
    detailsTitle: '續費詳情：',
    planLabel: '方案',
    amountLabel: '應付金額',
    renewalLabel: '續費日期',
    balanceLabel: '目前餘額',
    actionNeeded: '需要採取行動',
    actionMessage: '請儲值到您的錢包以確保服務不中斷。',
    noActionNeeded: '無需操作 - 您的餘額充足。',
    addFundsButton: '儲值到錢包',
    footer: '您可以隨時從儀表板管理您的訂閱。',
    team: 'Case Where 團隊'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${hasEnoughBalance ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)'}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 600; color: #6b7280; }
          .detail-value { color: #111827; }
          .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; background: ${hasEnoughBalance ? '#667eea' : '#f59e0b'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .low-balance { color: #dc2626; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${content.title}</h1>
          </div>
          <div class="content">
            <p>${content.greeting}</p>
            <p>${content.message}</p>
            
            <div class="card">
              <h3>${content.detailsTitle}</h3>
              <div class="detail-row">
                <span class="detail-label">${content.planLabel}:</span>
                <span class="detail-value">${planNames[language][plan as keyof typeof planNames[typeof language]]}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">${content.amountLabel}:</span>
                <span class="detail-value">$${amount}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">${content.renewalLabel}:</span>
                <span class="detail-value">${renewalDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">${content.balanceLabel}:</span>
                <span class="detail-value ${!hasEnoughBalance ? 'low-balance' : ''}">$${balance}</span>
              </div>
            </div>

            ${!hasEnoughBalance ? `
              <div class="alert">
                <strong>${content.actionNeeded}</strong>
                <p>${content.actionMessage}</p>
                <a href="#" class="button">${content.addFundsButton}</a>
              </div>
            ` : `
              <div class="success">
                <p><strong>✓ ${content.noActionNeeded}</strong></p>
              </div>
            `}

            <p>${content.footer}</p>
            <p><strong>${content.team}</strong></p>
          </div>
          <div class="footer">
            © 2024 Case Where 接得準股份有限公司
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getPaymentSuccessEmail(params: {
  name: string;
  plan: string;
  amount: number;
  transactionId: string;
  date: string;
  language: 'en' | 'zh';
}) {
  const { name, plan, amount, transactionId, date, language } = params;
  
  const planNames = {
    en: { free: 'Free', pro: 'Professional', enterprise: 'Enterprise' },
    zh: { free: '免費', pro: '專業版', enterprise: '企業版' }
  };

  const content = language === 'en' ? {
    title: 'Payment Successful ✓',
    greeting: `Hi ${name},`,
    message: 'Your payment has been processed successfully!',
    detailsTitle: 'Payment Details:',
    planLabel: 'Plan',
    amountLabel: 'Amount Paid',
    transactionLabel: 'Transaction ID',
    dateLabel: 'Date',
    footer: 'Thank you for your payment. Your subscription has been renewed.',
    receipt: 'A receipt has been sent to your email.',
    team: 'The Case Where Team'
  } : {
    title: '付款成功 ✓',
    greeting: `您好 ${name}，`,
    message: '您的付款已成功處理！',
    detailsTitle: '付款詳情：',
    planLabel: '方案',
    amountLabel: '付款金額',
    transactionLabel: '交易編號',
    dateLabel: '日期',
    footer: '感謝您的付款。您的訂閱已續費。',
    receipt: '收據已發送到您的郵箱。',
    team: 'Case Where 團隊'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 600; color: #6b7280; }
          .detail-value { color: #111827; }
          .success-badge { background: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${content.title}</h1>
          </div>
          <div class="content">
            <p>${content.greeting}</p>
            <div class="success-badge">✓ ${content.message}</div>
            
            <div class="card">
              <h3>${content.detailsTitle}</h3>
              <div class="detail-row">
                <span class="detail-label">${content.planLabel}:</span>
                <span class="detail-value">${planNames[language][plan as keyof typeof planNames[typeof language]]}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">${content.amountLabel}:</span>
                <span class="detail-value">$${amount}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">${content.transactionLabel}:</span>
                <span class="detail-value">${transactionId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">${content.dateLabel}:</span>
                <span class="detail-value">${date}</span>
              </div>
            </div>

            <p>${content.footer}</p>
            <p><em>${content.receipt}</em></p>
            <p><strong>${content.team}</strong></p>
          </div>
          <div class="footer">
            © 2024 Case Where 接得準股份有限公司
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getPaymentFailedEmail(params: {
  name: string;
  plan: string;
  amount: number;
  reason: string;
  language: 'en' | 'zh';
}) {
  const { name, plan, amount, reason, language } = params;
  
  const planNames = {
    en: { free: 'Free', pro: 'Professional', enterprise: 'Enterprise' },
    zh: { free: '免費', pro: '專業版', enterprise: '企業版' }
  };

  const content = language === 'en' ? {
    title: '⚠️ Payment Failed',
    greeting: `Hi ${name},`,
    message: 'We were unable to process your subscription payment.',
    detailsTitle: 'Failed Payment Details:',
    planLabel: 'Plan',
    amountLabel: 'Amount',
    reasonLabel: 'Reason',
    actionTitle: 'What to do next:',
    action1: 'Check your payment method details',
    action2: 'Ensure you have sufficient balance in your wallet',
    action3: 'Try updating your payment method',
    updateButton: 'Update Payment Method',
    footer: 'Your subscription will be suspended if payment is not completed within 7 days.',
    team: 'The Case Where Team'
  } : {
    title: '⚠️ 付款失敗',
    greeting: `您好 ${name}，`,
    message: '我們無法處理您的訂閱付款。',
    detailsTitle: '失敗的付款詳情：',
    planLabel: '方案',
    amountLabel: '金額',
    reasonLabel: '原因',
    actionTitle: '接下來該做什麼：',
    action1: '檢查您的支付方式詳情',
    action2: '確保您的錢包餘額充足',
    action3: '嘗試更新您的支付方式',
    updateButton: '更新支付方式',
    footer: '如果 7 天內未完成付款，您的訂閱將被暫停。',
    team: 'Case Where 團隊'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 600; color: #6b7280; }
          .detail-value { color: #111827; }
          .alert { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .action-list { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .action-list li { margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${content.title}</h1>
          </div>
          <div class="content">
            <p>${content.greeting}</p>
            <div class="alert">
              <strong>${content.message}</strong>
            </div>
            
            <div class="card">
              <h3>${content.detailsTitle}</h3>
              <div class="detail-row">
                <span class="detail-label">${content.planLabel}:</span>
                <span class="detail-value">${planNames[language][plan as keyof typeof planNames[typeof language]]}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">${content.amountLabel}:</span>
                <span class="detail-value">$${amount}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">${content.reasonLabel}:</span>
                <span class="detail-value">${reason}</span>
              </div>
            </div>

            <div class="action-list">
              <h3>${content.actionTitle}</h3>
              <ol>
                <li>${content.action1}</li>
                <li>${content.action2}</li>
                <li>${content.action3}</li>
              </ol>
              <a href="#" class="button">${content.updateButton}</a>
            </div>

            <p><em>${content.footer}</em></p>
            <p><strong>${content.team}</strong></p>
          </div>
          <div class="footer">
            © 2024 Case Where 接得準股份有限公司
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getLowBalanceEmail(params: {
  name: string;
  balance: number;
  threshold: number;
  language: 'en' | 'zh';
}) {
  const { name, balance, threshold, language } = params;

  const content = language === 'en' ? {
    title: '⚠️ Low Balance Alert',
    greeting: `Hi ${name},`,
    message: `Your wallet balance is running low.`,
    currentBalance: 'Current Balance',
    threshold: 'Recommended Minimum',
    action: 'Add funds to your wallet to ensure uninterrupted service.',
    addFundsButton: 'Add Funds Now',
    footer: 'You can manage your wallet anytime from your dashboard.',
    team: 'The Case Where Team'
  } : {
    title: '⚠️ 餘額不足警告',
    greeting: `您好 ${name}，`,
    message: '您的錢包餘額偏低。',
    currentBalance: '目前餘額',
    threshold: '建議最低餘額',
    action: '請儲值以確保服務不中斷。',
    addFundsButton: '立即儲值',
    footer: '您可以隨時從儀表板管理您的錢包。',
    team: 'Case Where 團隊'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .balance { font-size: 36px; font-weight: 700; color: #dc2626; text-align: center; margin: 20px 0; }
          .threshold { font-size: 18px; color: #6b7280; text-align: center; margin: 10px 0; }
          .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${content.title}</h1>
          </div>
          <div class="content">
            <p>${content.greeting}</p>
            <p>${content.message}</p>
            
            <div class="card">
              <div class="threshold">${content.currentBalance}:</div>
              <div class="balance">$${balance}</div>
              <div class="threshold">${content.threshold}: $${threshold}</div>
            </div>

            <div class="alert">
              <p><strong>${content.action}</strong></p>
              <center>
                <a href="#" class="button">${content.addFundsButton}</a>
              </center>
            </div>

            <p>${content.footer}</p>
            <p><strong>${content.team}</strong></p>
          </div>
          <div class="footer">
            © 2024 Case Where 接得���股份有限公司
          </div>
        </div>
      </body>
    </html>
  `;
}

// ========== PROJECT EMAIL TEMPLATES ==========

export function getProjectCreatedEmail(params: {
  name: string;
  projectTitle: string;
  projectId: string;
  language: 'en' | 'zh';
}) {
  const { name, projectTitle, projectId, language } = params;

  const content = language === 'en' ? {
    title: '✅ Project Posted Successfully',
    greeting: `Hi ${name},`,
    message: `Your project "${projectTitle}" has been posted successfully and is now visible to freelancers!`,
    nextSteps: 'What happens next:',
    step1: 'Freelancers can now view and submit proposals for your project',
    step2: 'You will receive email notifications when proposals are submitted',
    step3: 'Review proposals and hire the best talent for your project',
    viewButton: 'View Project',
    team: 'The Case Where Team'
  } : {
    title: '✅ 項目發布成功',
    greeting: `您好 ${name}，`,
    message: `您的項目「${projectTitle}」已成功發布，現在自由職業者可以看到了！`,
    nextSteps: '接下來會發生什麼：',
    step1: '自由職業者現在可以查看並提交提案',
    step2: '當有提案提交時，您會收到郵件通知',
    step3: '審查提案並聘用最適合的人才',
    viewButton: '查看項目',
    team: 'Case Where 團隊'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${content.title}</h1>
          </div>
          <div class="content">
            <p>${content.greeting}</p>
            <p>${content.message}</p>
            
            <div class="card">
              <h3>${content.nextSteps}</h3>
              <ul>
                <li>${content.step1}</li>
                <li>${content.step2}</li>
                <li>${content.step3}</li>
              </ul>
              <center>
                <a href="#" class="button">${content.viewButton}</a>
              </center>
            </div>

            <p><strong>${content.team}</strong></p>
          </div>
          <div class="footer">
            © 2024 Case Where 接得準股份有限公司
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getNewProposalEmail(params: {
  name: string;
  projectTitle: string;
  freelancerName: string;
  proposedBudget: number;
  language: 'en' | 'zh';
}) {
  const { name, projectTitle, freelancerName, proposedBudget, language } = params;

  const content = language === 'en' ? {
    title: '🎯 New Proposal Received',
    greeting: `Hi ${name},`,
    message: `Good news! You've received a new proposal for your project "${projectTitle}".`,
    freelancerLabel: 'From',
    budgetLabel: 'Proposed Budget',
    action: 'Review this proposal and others in your dashboard.',
    viewButton: 'View Proposals',
    team: 'The Case Where Team'
  } : {
    title: '🎯 收到新提案',
    greeting: `您好 ${name}，`,
    message: `好消息！您的項目「${projectTitle}」收到了新的提案。`,
    freelancerLabel: '來自',
    budgetLabel: '建議預算',
    action: '在儀表板中查看此提案和其他提案。',
    viewButton: '查看提案',
    team: 'Case Where 團隊'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 600; color: #6b7280; }
          .detail-value { color: #111827; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${content.title}</h1>
          </div>
          <div class="content">
            <p>${content.greeting}</p>
            <p>${content.message}</p>
            
            <div class="card">
              <div class="detail-row">
                <span class="detail-label">${content.freelancerLabel}:</span>
                <span class="detail-value">${freelancerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">${content.budgetLabel}:</span>
                <span class="detail-value">$${proposedBudget}</span>
              </div>
            </div>

            <p>${content.action}</p>
            <center>
              <a href="#" class="button">${content.viewButton}</a>
            </center>

            <p><strong>${content.team}</strong></p>
          </div>
          <div class="footer">
            © 2024 Case Where 接得準股份有限公司
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getProposalSubmittedEmail(params: {
  name: string;
  projectTitle: string;
  proposedBudget: number;
  language: 'en' | 'zh';
}) {
  const { name, projectTitle, proposedBudget, language } = params;

  const content = language === 'en' ? {
    title: '✅ Proposal Submitted',
    greeting: `Hi ${name},`,
    message: `Your proposal for "${projectTitle}" has been submitted successfully!`,
    budgetLabel: 'Your Proposed Budget',
    nextSteps: 'What happens next:',
    step1: 'The client will review your proposal',
    step2: 'You will be notified if your proposal is accepted',
    step3: 'You can track your proposal status in your dashboard',
    viewButton: 'View Proposal',
    team: 'The Case Where Team'
  } : {
    title: '✅ 提案已提交',
    greeting: `您好 ${name}，`,
    message: `您對「${projectTitle}」的提案已成功提交！`,
    budgetLabel: '您的建議預算',
    nextSteps: '接下來會發生什麼：',
    step1: '客戶將審查您的提案',
    step2: '如果您的提案被接受，您會收到通知',
    step3: '您可以在儀表板中追蹤提案狀態',
    viewButton: '查看提案',
    team: 'Case Where 團隊'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${content.title}</h1>
          </div>
          <div class="content">
            <p>${content.greeting}</p>
            <p>${content.message}</p>
            
            <div class="card">
              <p><strong>${content.budgetLabel}:</strong> $${proposedBudget}</p>
              <h3>${content.nextSteps}</h3>
              <ul>
                <li>${content.step1}</li>
                <li>${content.step2}</li>
                <li>${content.step3}</li>
              </ul>
              <center>
                <a href="#" class="button">${content.viewButton}</a>
              </center>
            </div>

            <p><strong>${content.team}</strong></p>
          </div>
          <div class="footer">
            © 2024 Case Where 接得準股份有限公司
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getProposalAcceptedEmail(params: {
  name: string;
  projectTitle: string;
  clientName: string;
  budget: number;
  language: 'en' | 'zh';
}) {
  const { name, projectTitle, clientName, budget, language } = params;

  const content = language === 'en' ? {
    title: '🎉 Congratulations! Your Proposal Was Accepted',
    greeting: `Hi ${name},`,
    message: `Great news! Your proposal for "${projectTitle}" has been accepted by ${clientName}!`,
    budgetLabel: 'Project Budget',
    nextSteps: 'Next Steps:',
    step1: 'Start working on the project',
    step2: 'Communicate with the client through the platform',
    step3: 'Complete milestones to receive payments',
    startButton: 'Start Project',
    team: 'The Case Where Team'
  } : {
    title: '🎉 恭喜！您的提案已被接受',
    greeting: `您好 ${name}，`,
    message: `好消息！${clientName} 已接受您對「${projectTitle}」的提案！`,
    budgetLabel: '項目預算',
    nextSteps: '下一步：',
    step1: '開始進行項目',
    step2: '通過平台與客戶溝通',
    step3: '完成里程碑以獲得付款',
    startButton: '開始項目',
    team: 'Case Where 團隊'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .celebration { font-size: 64px; text-align: center; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${content.title}</h1>
          </div>
          <div class="content">
            <div class="celebration">🎉🎊</div>
            <p>${content.greeting}</p>
            <p>${content.message}</p>
            
            <div class="card">
              <p><strong>${content.budgetLabel}:</strong> $${budget}</p>
              <h3>${content.nextSteps}</h3>
              <ol>
                <li>${content.step1}</li>
                <li>${content.step2}</li>
                <li>${content.step3}</li>
              </ol>
              <center>
                <a href="#" class="button">${content.startButton}</a>
              </center>
            </div>

            <p><strong>${content.team}</strong></p>
          </div>
          <div class="footer">
            © 2024 Case Where 接得準股份有限公司
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getProposalRejectedEmail(params: {
  name: string;
  projectTitle: string;
  language: 'en' | 'zh';
}) {
  const { name, projectTitle, language } = params;

  const content = language === 'en' ? {
    title: 'Proposal Update',
    greeting: `Hi ${name},`,
    message: `Thank you for your interest in "${projectTitle}". Unfortunately, the client has decided to move forward with another freelancer.`,
    encouragement: 'Don\'t be discouraged! Keep submitting quality proposals and you\'ll land great projects.',
    tips: 'Tips for improving your proposals:',
    tip1: 'Customize each proposal to the specific project',
    tip2: 'Highlight your relevant experience and skills',
    tip3: 'Provide competitive pricing',
    tip4: 'Respond quickly to new project postings',
    browseButton: 'Browse More Projects',
    team: 'The Case Where Team'
  } : {
    title: '提案更新',
    greeting: `您好 ${name}，`,
    message: `感謝您對「${projectTitle}」的興趣。遺憾的是，客戶決定與另一位自由職業者合作。`,
    encouragement: '不要氣餒！繼續提交高質量的提案，您會找到很棒的項目。',
    tips: '改進提案的建議：',
    tip1: '為每個項目定制提案',
    tip2: '突出相關經驗和技能',
    tip3: '提供有競爭力的價格',
    tip4: '快速回應新的項目發布',
    browseButton: '瀏覽更多項目',
    team: 'Case Where 團隊'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${content.title}</h1>
          </div>
          <div class="content">
            <p>${content.greeting}</p>
            <p>${content.message}</p>
            <p><strong>${content.encouragement}</strong></p>
            
            <div class="card">
              <h3>${content.tips}</h3>
              <ul>
                <li>${content.tip1}</li>
                <li>${content.tip2}</li>
                <li>${content.tip3}</li>
                <li>${content.tip4}</li>
              </ul>
              <center>
                <a href="#" class="button">${content.browseButton}</a>
              </center>
            </div>

            <p><strong>${content.team}</strong></p>
          </div>
          <div class="footer">
            © 2024 Case Where 接得準股份有限公司
          </div>
        </div>
      </body>
    </html>
  `;
}

// ========== REVIEW EMAIL TEMPLATES ==========

export function getNewReviewEmail(params: {
  name: string;
  reviewerName: string;
  rating: number;
  projectTitle: string;
  language: 'en' | 'zh';
}) {
  const { name, reviewerName, rating, projectTitle, language } = params;

  const content = language === 'en' ? {
    title: '⭐ You Received a New Review',
    greeting: `Hi ${name},`,
    message: `${reviewerName} has left you a review for the project "${projectTitle}".`,
    ratingLabel: 'Rating',
    action: 'View your review and respond in your dashboard.',
    viewButton: 'View Review',
    team: 'The Case Where Team'
  } : {
    title: '⭐ 您收到了新評價',
    greeting: `您好 ${name}，`,
    message: `${reviewerName} 為項目「${projectTitle}」給您留下了評價。`,
    ratingLabel: '評分',
    action: '在儀表板中查看評價並回覆。',
    viewButton: '查看評價',
    team: 'Case Where 團隊'
  };

  const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .rating { font-size: 32px; text-align: center; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${content.title}</h1>
          </div>
          <div class="content">
            <p>${content.greeting}</p>
            <p>${content.message}</p>
            
            <div class="card">
              <p><strong>${content.ratingLabel}:</strong></p>
              <div class="rating">${stars}</div>
              <center>
                <p>${content.action}</p>
                <a href="#" class="button">${content.viewButton}</a>
              </center>
            </div>

            <p><strong>${content.team}</strong></p>
          </div>
          <div class="footer">
            © 2024 Case Where 接得準股份有限公司
          </div>
        </div>
      </body>
    </html>
  `;
}

// ========== MILESTONE EMAIL TEMPLATES ==========

export function getMilestoneCompletedEmail(params: {
  name: string;
  projectTitle: string;
  milestoneTitle: string;
  amount: number;
  freelancerName: string;
  language: 'en' | 'zh';
}) {
  const { name, projectTitle, milestoneTitle, amount, freelancerName, language } = params;

  const content = language === 'en' ? {
    title: '✅ Milestone Completed',
    greeting: `Hi ${name},`,
    message: `${freelancerName} has marked the milestone "${milestoneTitle}" as completed for project "${projectTitle}".`,
    amountLabel: 'Milestone Amount',
    action: 'Please review the work and approve payment if you\'re satisfied.',
    approveButton: 'Review & Approve',
    team: 'The Case Where Team'
  } : {
    title: '✅ 里程碑已完���',
    greeting: `您好 ${name}，`,
    message: `${freelancerName} 已將項目「${projectTitle}」的里程碑「${milestoneTitle}」標記為已完成。`,
    amountLabel: '里程碑金額',
    action: '請審查工作，如果滿意請批准付款。',
    approveButton: '審查並批准',
    team: 'Case Where 團隊'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${content.title}</h1>
          </div>
          <div class="content">
            <p>${content.greeting}</p>
            <p>${content.message}</p>
            
            <div class="card">
              <p><strong>${content.amountLabel}:</strong> $${amount}</p>
              <p>${content.action}</p>
              <center>
                <a href="#" class="button">${content.approveButton}</a>
              </center>
            </div>

            <p><strong>${content.team}</strong></p>
          </div>
          <div class="footer">
            © 2024 Case Where 接得準股份有限公司
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getMilestonePaymentEmail(params: {
  name: string;
  projectTitle: string;
  milestoneTitle: string;
  amount: number;
  language: 'en' | 'zh';
  currency?: string; // 🔥 新增：支持多幣種
}) {
  const { name, projectTitle, milestoneTitle, amount, language, currency = 'TWD' } = params;

  // ⭐ 三幣格式化函數
  const formatAmount = (amount: number, currency: string) => {
    switch (currency) {
      case 'USD':
        return `$${amount.toFixed(2)}`;
      case 'CNY':
        return `¥${Math.round(amount)}`;
      case 'TWD':
      default:
        return `NT$${Math.round(amount)}`;
    }
  };

  const content = language === 'en' ? {
    title: '💰 Payment Received',
    greeting: `Hi ${name},`,
    message: `Great news! Payment for milestone "${milestoneTitle}" has been released.`,
    projectLabel: 'Project',
    milestoneLabel: 'Milestone',
    amountLabel: 'Amount Received',
    footer: 'The funds have been added to your wallet.',
    viewButton: 'View Wallet',
    team: 'The Case Where Team'
  } : {
    title: '💰 已收到付款',
    greeting: `您好 ${name}，`,
    message: `好消息！里程碑「${milestoneTitle}」的付款已釋放。`,
    projectLabel: '項目',
    milestoneLabel: '里程碑',
    amountLabel: '收到金額',
    footer: '資金已添加到您的錢包。',
    viewButton: '查看錢包',
    team: 'Case Where 團隊'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .amount { font-size: 36px; font-weight: 700; color: #10b981; text-align: center; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${content.title}</h1>
          </div>
          <div class="content">
            <p>${content.greeting}</p>
            <p>${content.message}</p>
            
            <div class="card">
              <p><strong>${content.projectLabel}:</strong> ${projectTitle}</p>
              <p><strong>${content.milestoneLabel}:</strong> ${milestoneTitle}</p>
              <p><strong>${content.amountLabel}:</strong></p>
              <div class="amount">${formatAmount(amount, currency)}</div>
              <p>${content.footer}</p>
              <center>
                <a href="#" class="button">${content.viewButton}</a>
              </center>
            </div>

            <p><strong>${content.team}</strong></p>
          </div>
          <div class="footer">
            © 2024 Case Where 接得準股份有限公司
          </div>
        </div>
      </body>
    </html>
  `;
}

// 🔥 新增：案主付款確認郵件模板
export function getClientPaymentConfirmationEmail(params: {
  name: string;
  projectTitle: string;
  milestoneTitle: string;
  amount: number;
  freelancerName: string;
  language: 'en' | 'zh';
  currency?: string;
}) {
  const { name, projectTitle, milestoneTitle, amount, freelancerName, language, currency = 'TWD' } = params;

  // ⭐ 三幣格式化函數
  const formatAmount = (amount: number, currency: string) => {
    switch (currency) {
      case 'USD':
        return `$${amount.toFixed(2)}`;
      case 'CNY':
        return `¥${Math.round(amount)}`;
      case 'TWD':
      default:
        return `NT$${Math.round(amount)}`;
    }
  };

  const content = language === 'en' ? {
    title: '✅ Payment Confirmed',
    greeting: `Hi ${name},`,
    message: `You have successfully paid for milestone "${milestoneTitle}".`,
    projectLabel: 'Project',
    milestoneLabel: 'Milestone',
    freelancerLabel: 'Paid to',
    amountLabel: 'Amount Paid',
    footer: 'The funds have been transferred to the freelancer\'s wallet.',
    viewButton: 'View Project',
    team: 'The Case Where Team'
  } : {
    title: '✅ 付款確認',
    greeting: `您好 ${name}，`,
    message: `您已成功支付里程碑「${milestoneTitle}」的款項。`,
    projectLabel: '項目',
    milestoneLabel: '里程碑',
    freelancerLabel: '支付給',
    amountLabel: '付款金額',
    footer: '資金已轉入接案者的錢包。',
    viewButton: '查看項目',
    team: 'Case Where 團隊'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .amount { font-size: 36px; font-weight: 700; color: #3b82f6; text-align: center; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${content.title}</h1>
          </div>
          <div class="content">
            <p>${content.greeting}</p>
            <p>${content.message}</p>
            
            <div class="card">
              <p><strong>${content.projectLabel}:</strong> ${projectTitle}</p>
              <p><strong>${content.milestoneLabel}:</strong> ${milestoneTitle}</p>
              <p><strong>${content.freelancerLabel}:</strong> ${freelancerName}</p>
              <p><strong>${content.amountLabel}:</strong></p>
              <div class="amount">${formatAmount(amount, currency)}</div>
              <p>${content.footer}</p>
              <center>
                <a href="#" class="button">${content.viewButton}</a>
              </center>
            </div>

            <p><strong>${content.team}</strong></p>
          </div>
          <div class="footer">
            © 2024 Case Where 接得準股份有限公司
          </div>
        </div>
      </body>
    </html>
  `;
}

// ========== WALLET EMAIL TEMPLATES ==========

export function getDepositSuccessEmail(params: {
  name: string;
  amount: number;
  newBalance: number;
  language: 'en' | 'zh';
}) {
  const { name, amount, newBalance, language } = params;

  const content = language === 'en' ? {
    title: '✅ Deposit Successful',
    greeting: `Hi ${name},`,
    message: 'Your wallet has been topped up successfully!',
    depositedLabel: 'Amount Deposited',
    newBalanceLabel: 'New Balance',
    footer: 'You can now use these funds for subscriptions and projects.',
    team: 'The Case Where Team'
  } : {
    title: '✅ 充值成功',
    greeting: `您好 ${name}，`,
    message: '您的錢包已成功充值！',
    depositedLabel: '充值金額',
    newBalanceLabel: '新餘額',
    footer: '您現在可以使用這些資金購買訂閱和項目。',
    team: 'Case Where 團隊'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .amount { font-size: 36px; font-weight: 700; color: #10b981; text-align: center; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${content.title}</h1>
          </div>
          <div class="content">
            <p>${content.greeting}</p>
            <p>${content.message}</p>
            
            <div class="card">
              <p><strong>${content.depositedLabel}:</strong></p>
              <div class="amount">+$${amount}</div>
              <p><strong>${content.newBalanceLabel}:</strong> $${newBalance}</p>
            </div>

            <p>${content.footer}</p>
            <p><strong>${content.team}</strong></p>
          </div>
          <div class="footer">
            © 2024 Case Where 接得準股份有限公司
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getWithdrawalRequestEmail(params: {
  name: string;
  amount: number;
  language: 'en' | 'zh';
}) {
  const { name, amount, language } = params;

  const content = language === 'en' ? {
    title: '📤 Withdrawal Request Received',
    greeting: `Hi ${name},`,
    message: 'We have received your withdrawal request.',
    amountLabel: 'Requested Amount',
    processing: 'Your request is being processed and will be completed within 3-5 business days.',
    notification: 'You will receive a notification once the withdrawal is complete.',
    team: 'The Case Where Team'
  } : {
    title: '📤 已收到提現請求',
    greeting: `您好 ${name}，`,
    message: '我們已收到您的提現請求。',
    amountLabel: '請求金額',
    processing: '您的請求正在處理中，將在 3-5 個工作日內完成。',
    notification: '提現完成後您會收到通知。',
    team: 'Case Where 團隊'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .amount { font-size: 36px; font-weight: 700; color: #3b82f6; text-align: center; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${content.title}</h1>
          </div>
          <div class="content">
            <p>${content.greeting}</p>
            <p>${content.message}</p>
            
            <div class="card">
              <p><strong>${content.amountLabel}:</strong></p>
              <div class="amount">$${amount}</div>
              <p>${content.processing}</p>
              <p><em>${content.notification}</em></p>
            </div>

            <p><strong>${content.team}</strong></p>
          </div>
          <div class="footer">
            © 2024 Case Where 得準股份有限公司
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getWithdrawalCompletedEmail(params: {
  name: string;
  amount: number;
  language: 'en' | 'zh';
}) {
  const { name, amount, language } = params;

  const content = language === 'en' ? {
    title: '✅ Withdrawal Completed',
    greeting: `Hi ${name},`,
    message: 'Your withdrawal has been processed successfully!',
    amountLabel: 'Withdrawn Amount',
    footer: 'The funds should appear in your account within 1-2 business days.',
    team: 'The Case Where Team'
  } : {
    title: '✅ 提現完成',
    greeting: `您好 ${name}，`,
    message: '您的提現已成功處理！',
    amountLabel: '提現金額',
    footer: '資金應在 1-2 個工作日內到達您的帳戶。',
    team: 'Case Where 團隊'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .amount { font-size: 36px; font-weight: 700; color: #10b981; text-align: center; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${content.title}</h1>
          </div>
          <div class="content">
            <p>${content.greeting}</p>
            <p>${content.message}</p>
            
            <div class="card">
              <p><strong>${content.amountLabel}:</strong></p>
              <div class="amount">$${amount}</div>
            </div>

            <p><em>${content.footer}</em></p>
            <p><strong>${content.team}</strong></p>
          </div>
          <div class="footer">
            © 2024 Case Where 接得準股份有限公司
          </div>
        </div>
      </body>
    </html>
  `;
}