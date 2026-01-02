// Team Invitation Email Template and Sender
import { sendEmail } from './email_service_brevo.tsx';

export function getTeamInvitationEmail(params: {
  inviterName: string;
  role: string;
  inviteId: string;
  language?: 'en' | 'zh';
  companyName?: string; // 🎨 Add company name parameter
  inviteeEmail: string; // 🔧 Add invitee email for URL encoding
}) {
  const { inviterName, role, inviteId, language = 'en', companyName = 'Case Where', inviteeEmail } = params;

  const roleNames = {
    en: { admin: 'Administrator', member: 'Member' },
    zh: { admin: '管理員', member: '成員' }
  };

  const content = language === 'en' ? {
    title: '🎉 You\'ve Been Invited to Join a Team',
    greeting: 'Hello!',
    message: `${inviterName} has invited you to join their team on ${companyName} as a ${roleNames.en[role as keyof typeof roleNames.en]}.`,
    whatIsCompany: `What is ${companyName}?`,
    description: companyName === 'Case Where' 
      ? 'Case Where is a professional freelance platform connecting clients with talented professionals worldwide.'
      : `${companyName} uses Case Where, a professional freelance platform connecting clients with talented professionals worldwide.`,
    roleTitle: 'Your Role:',
    roleDesc: role === 'admin' 
      ? 'As an Administrator, you can manage projects, team members, and access all team features.'
      : 'As a Member, you can view and work on team projects.',
    benefits: 'Team Benefits:',
    benefit1: 'Collaborate on projects',
    benefit2: 'Share resources and workload',
    benefit3: 'Team-wide analytics',
    acceptButton: 'Accept Invitation',
    howToAccept: 'How to Accept:',
    step1: `1. Sign in to your account using: <strong>${inviteeEmail}</strong>`,
    step2: `2. If you don't have an account yet, please register first with this email`,
    step3: `3. Click the "Accept Invitation" button above after signing in`,
    expires: 'This invitation will expire in 7 days.',
    footer: 'If you have any questions, please contact our support team.',
    team: companyName === 'Case Where' ? 'The Case Where Team' : `The ${companyName} Team`
  } : {
    title: '🎉 您已被邀請加入團隊',
    greeting: '您好！',
    message: `${inviterName} 邀請您以${roleNames.zh[role as keyof typeof roleNames.zh]}身份加入他們在 ${companyName} 的團隊。`,
    whatIsCompany: `什麼是 ${companyName}？`,
    description: companyName === 'Case Where'
      ? 'Case Where 是一個專業的自由職業平台，連接全球客戶與優秀專業人士。'
      : `${companyName} 使用 Case Where 專業自由職業平台，連接全球客戶與優秀專業人士。`,
    roleTitle: '您的角色：',
    roleDesc: role === 'admin'
      ? '作為管理員，您可以管理項目、團隊成員並訪問所有團隊功能。'
      : '作為成員，您可以查看和處理團隊項目。',
    benefits: '團隊福利：',
    benefit1: '協作處理項目',
    benefit2: '共享資源和工作負載',
    benefit3: '團隊數據分析',
    acceptButton: '接受邀請',
    howToAccept: '如何接受邀請：',
    step1: `1. 使用此電子郵件登入您的帳號：<strong>${inviteeEmail}</strong>`,
    step2: `2. 如果您還沒有帳號，請先使用此電子郵件註冊`,
    step3: `3. 登入後點擊上方的「接受邀請」按鈕`,
    expires: '此邀請將在 7 天後過期。',
    footer: '如有任何問題，請聯繫我們的支援團隊。',
    team: companyName === 'Case Where' ? 'Case Where 團隊' : `${companyName} 團隊`
  };

  // 🔧 NEW: Include invitation details in URL for display without API call
  const acceptUrl = `https://www.casewhr.com/team/accept-invitation?id=${inviteId}&email=${encodeURIComponent(inviteeEmail)}&org=${encodeURIComponent(companyName)}&role=${role}&inviter=${encodeURIComponent(inviterName)}`;
  
  console.log('🔗 [Team Invitation Email] Generated accept URL:', acceptUrl);
  console.log('🔍 [Team Invitation Email] URL Parameters:', {
    inviteId: inviteId,
    inviteIdLength: inviteId?.length || 0,
    inviteeEmail: inviteeEmail,
    companyName: companyName,
    role: role,
    inviterName: inviterName
  });
  
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
          .role-badge { background: #dbeafe; color: #1e40af; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; font-weight: 600; }
          .benefits-list { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .benefits-list li { margin: 10px 0; padding-left: 10px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
          .expires { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; font-size: 14px; }
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
              <h3>${content.whatIsCompany}</h3>
              <p>${content.description}</p>
            </div>

            <div class="card">
              <h3>${content.roleTitle}</h3>
              <div class="role-badge">${roleNames[language][role as keyof typeof roleNames[typeof language]]}</div>
              <p>${content.roleDesc}</p>
            </div>

            <div class="benefits-list">
              <h3>${content.benefits}</h3>
              <ul>
                <li>✓ ${content.benefit1}</li>
                <li>✓ ${content.benefit2}</li>
                <li>✓ ${content.benefit3}</li>
              </ul>
            </div>

            <center>
              <a href="${acceptUrl}" class="button">${content.acceptButton}</a>
            </center>

            <div class="card">
              <h3>${content.howToAccept}</h3>
              <p style="margin: 8px 0;">${content.step1}</p>
              <p style="margin: 8px 0; color: #6b7280;">${content.step2}</p>
              <p style="margin: 8px 0; color: #6b7280;">${content.step3}</p>
            </div>

            <div class="expires">
              ⏱ ${content.expires}
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

export async function sendTeamInvitationEmail(params: {
  to: string;
  inviterName: string;
  role: string;
  inviteId: string;
  ownerId?: string; // Enterprise owner's user ID to fetch branding
}) {
  const { to, inviterName, role, inviteId, ownerId } = params;
  
  console.log('📧 [Team Invitation Email] ========== START ==========');
  console.log('📧 [Team Invitation Email] Received inviteId:', inviteId);
  console.log('📧 [Team Invitation Email] Full params:', {
    to,
    inviterName,
    role,
    inviteId,
    ownerId,
    hasOwnerId: !!ownerId
  });
  
  // Detect language from email or default to English
  const language = to.includes('@') ? 'en' : 'en'; // Could be improved with user preferences
  
  // 🎨 Apply branding for enterprise users (same as other emails)
  let companyName = 'Case Where'; // Default platform name
  let branding: any = null;
  
  if (ownerId) {
    console.log('🎨 [Team Invitation] Owner ID provided, attempting to fetch branding...');
    try {
      const { getUserBranding } = await import('./branded_email_helper.tsx');
      console.log('✅ [Team Invitation] Branding helper imported');
      
      branding = await getUserBranding(ownerId);
      console.log('🔍 [Team Invitation] Branding fetched:', {
        hasBranding: !!branding,
        hasLogo: !!branding?.logo_url,
        logoUrl: branding?.logo_url,
        companyName: branding?.company_name,
        primaryColor: branding?.primary_color,
        secondaryColor: branding?.secondary_color
      });
      
      if (branding?.company_name) {
        companyName = branding.company_name;
        console.log('🎨 [Team Invitation] Using branded company name:', companyName);
      }
    } catch (error) {
      console.error('⚠️ [Team Invitation Email] Failed to fetch branding:', error);
    }
  } else {
    console.log('ℹ️ [Team Invitation] No owner ID provided, skipping branding');
  }
  
  // Generate base email HTML with branded company name
  let htmlContent = getTeamInvitationEmail({
    inviterName,
    role,
    inviteId,
    language,
    companyName, // 🎨 Pass company name to template
    inviteeEmail: to // 🔧 Pass invitee email for URL encoding
  });

  console.log('📧 [Team Invitation] Email HTML generated with company name:', companyName, 'length:', htmlContent.length);

  // 🎨 Apply visual branding (logo, colors) if available
  if (branding) {
    console.log('🎨 [Team Invitation Email] Applying visual branding (logo, colors)...');
    try {
      const { injectBranding } = await import('./branded_email_helper.tsx');
      const beforeLength = htmlContent.length;
      htmlContent = injectBranding(htmlContent, branding);
      const afterLength = htmlContent.length;
      console.log('✅ [Team Invitation] Visual branding injected, HTML length changed from', beforeLength, 'to', afterLength);
    } catch (error) {
      console.error('⚠️ [Team Invitation Email] Failed to apply visual branding:', error);
    }
  }

  // 🎨 Generate subject with branded company name
  const subject = language === 'en' 
    ? `${inviterName} invited you to join their team on ${companyName}`
    : `${inviterName} 邀請您加入 ${companyName} 團隊`;

  console.log('📧 [Team Invitation Email] Sending email with subject:', subject);
  console.log('📧 [Team Invitation Email] Company name used:', companyName);
  console.log('📧 [Team Invitation Email] Final inviteId before sending:', inviteId);
  console.log('📧 [Team Invitation Email] ========== END ==========');

  return await sendEmail({
    to,
    subject,
    html: htmlContent,
  });
}