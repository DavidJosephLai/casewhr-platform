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
                <span class="detail-value">${formatAmount(amount, currency)}</span>
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
