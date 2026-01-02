// Brevo (Sendinblue) email service - SMTP 版本
// 使用 SMTP 協議發送郵件，更通用更穩定！

import nodemailer from 'npm:nodemailer@6.9.7';
import { getSenderByType, EmailType } from './email_sender_config.tsx';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string; // 🔧 添加可選的 reply-to 參數
  emailType?: EmailType; // 🔧 添加郵件類型以選擇正確的發件人
  language?: 'en' | 'zh'; // 🔧 添加語言參數
}

export async function sendEmail(options: EmailOptions) {
  try {
    // 📧 SMTP 配置 - 使用您的 Brevo SMTP 憑證
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    
    // 檢查 API Key 是否設置
    if (!brevoApiKey) {
      console.error('❌ BREVO_API_KEY environment variable is not set');
      return {
        success: false,
        error: 'BREVO_API_KEY is not configured. Please set it in environment variables.',
      };
    }
    
    const smtpConfig = {
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false, // 587 使用 STARTTLS
      auth: {
        user: '9d7ac7001@smtp-brevo.com',
        pass: brevoApiKey,
      },
    };
    
    console.log('✅ SMTP Configuration:');
    console.log('📧 Host:', smtpConfig.host);
    console.log('📧 Port:', smtpConfig.port);
    console.log('📧 User:', smtpConfig.auth.user);
    console.log('📧 API Key configured:', brevoApiKey ? '✅ Yes' : '❌ No');
    console.log('📧 Sender email: support@casewhr.com');
    console.log('📧 Recipient email:', options.to);
    console.log('📨 Subject:', options.subject);
    
    // 🚀 創建 SMTP 傳輸器
    const transporter = nodemailer.createTransport(smtpConfig);
    
    // 📧 獲取正確的發件人
    const sender = getSenderByType(
      options.emailType || 'default',
      options.language || 'en'
    );
    
    console.log('📧 Using sender:', sender.name, `<${sender.email}>`);
    
    // 📨 郵件選項
    const mailOptions = {
      from: {
        name: sender.name,
        address: sender.email
      },
      to: options.to,
      subject: options.subject,
      html: options.html,
      // 🔧 添加郵件頭以提高送達率（特別針對 Outlook/Hotmail）
      replyTo: options.replyTo || sender.email,
      headers: {
        'X-Priority': '1',  // 改為高優先級（密碼重設是重要郵件）
        'Importance': 'high',  // 標記為重要郵件
        'X-Mailer': 'Case Where Platform',
        'X-Entity-Ref-ID': `casewhr-${Date.now()}`,
        'List-Unsubscribe': '<mailto:unsubscribe@casewhr.com>',
        // 移除 Precedence: bulk - 密碼重設不是群發郵件
        // 添加 Microsoft 特���头部，提高 Outlook 送达率
        'X-MS-Exchange-Organization-SCL': '-1',
        'X-Microsoft-Antispam-PRVS': 'verified',
        // 添加 Authentication-Results 相關標頭提示
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
      },
      // 📝 添加純文字版本（提高送達率）
      text: options.html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
    };
    
    // 📤 發送郵件
    console.log('📤 Sending email via SMTP...');
    console.log('📧 To:', options.to);
    console.log('📧 From:', mailOptions.from);
    console.log('📧 Subject:', options.subject);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully via Brevo SMTP');
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Response:', info.response);
    console.log('📧 Accepted:', JSON.stringify(info.accepted));
    console.log('📧 Rejected:', JSON.stringify(info.rejected));
    console.log('📧 Pending:', JSON.stringify(info.pending));
    console.log('📧 Envelope:', JSON.stringify(info.envelope));
    
    // 🔍 Check if email was actually accepted
    if (info.rejected && info.rejected.length > 0) {
      console.warn('⚠️ Some recipients were rejected:', info.rejected);
    }
    
    return { 
      success: true, 
      data: { 
        id: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
      }
    };
    
  } catch (error: any) {
    console.error('❌ SMTP email sending error:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    
    let errorMessage = error.message || String(error);
    
    // 🔍 SMTP 錯誤碼診斷
    if (error.code === 'EAUTH') {
      errorMessage = '❌ SMTP 認證失敗：請檢查 SMTP 用戶名和密碼';
    } else if (error.code === 'ESOCKET') {
      errorMessage = '❌ 無法連接到 SMTP 服務器：請檢查網絡連接';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = '❌ SMTP 連接超時：請稍後重試';
    } else if (error.responseCode === 550) {
      errorMessage = '❌ 收件人郵箱無效或被拒絕';
    } else if (error.responseCode === 554) {
      errorMessage = '❌ 發件人郵箱未驗證或被拒絕';
    }
    
    return { 
      success: false, 
      error: errorMessage,
      details: {
        code: error.code,
        responseCode: error.responseCode,
        command: error.command,
      }
    };
  }
}

/**
 * Send message notification email
 */
export async function sendMessageNotificationEmail(
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  messageContent: string,
  projectTitle?: string
): Promise<void> {
  const subject = projectTitle 
    ? `New message from ${senderName} about "${projectTitle}"`
    : `New message from ${senderName}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Message</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">💬 New Message</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #1a202c; font-size: 16px; line-height: 1.6;">
                Hi <strong>${recipientName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                You have received a new message from <strong>${senderName}</strong>${projectTitle ? ` about your project "<strong>${projectTitle}</strong>"` : ''}:
              </p>
              
              <!-- Message Box -->
              <div style="background-color: #f7fafc; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0; color: #2d3748; font-size: 15px; line-height: 1.7; font-style: italic;">
                  ${messageContent.length > 200 ? messageContent.substring(0, 200) + '...' : messageContent}
                </p>
              </div>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://casewhere.com/messages" style="display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      View Message
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                💡 <strong>Tip:</strong> Quick responses help build trust and close deals faster!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f7fafc; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; color: #718096; font-size: 13px; text-align: center;">
                This is an automated notification from Case Where Platform
              </p>
              <p style="margin: 0; color: #a0aec0; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Case Where. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  
  await sendEmail({
    to: recipientEmail,
    subject,
    html,
  });
}