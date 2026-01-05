/**
 * Password Reset OTP Service
 * 處理密碼重設的 OTP 發送和驗證
 */

import * as kv from './kv_store.tsx';
import { sendEmail } from './email_service_brevo.tsx';
import * as emailTemplates from './email_templates_enhanced.tsx'; // ✅ 使用雙語模板

// 生成 8 位數隨機驗證碼
function generateOTP(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

// OTP 有效期（5 分鐘）
const OTP_EXPIRY_MINUTES = 5;

/**
 * 發送密碼重設 OTP 到用戶郵箱
 */
export async function sendPasswordResetOTP(
  email: string,
  userName: string,
  language: 'en' | 'zh'
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🔐 [密碼重設-OTP] 開始為用戶 ${email} 生成 OTP`);

    // 生成 8 位數驗證碼
    const otp = generateOTP();
    const expiryTime = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;

    // 存儲到 KV store，key 格式: password_reset_otp:{email}
    const key = `password_reset_otp:${email.toLowerCase()}`;
    await kv.set(key, {
      otp,
      expiryTime,
      email: email.toLowerCase(),
      attempts: 0, // 驗證嘗試次數
    });

    console.log(`✅ [密碼重設-OTP] OTP 已生成並存儲，有效期 ${OTP_EXPIRY_MINUTES} 分鐘`);

    // 發送郵件
    const emailSent = await sendPasswordResetEmail(email, userName, otp, language);

    if (!emailSent) {
      throw new Error('Failed to send email');
    }

    console.log(`✅ [密碼重設-OTP] OTP 郵件已發送至 ${email}`);

    return { success: true };
  } catch (error: any) {
    console.error(`❌ [密碼重設-OTP] 發送失敗:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * 驗證 OTP
 */
export async function verifyPasswordResetOTP(
  email: string,
  otp: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    console.log(`🔍 [密碼重設-OTP] 驗證 OTP: ${email}`);

    const key = `password_reset_otp:${email.toLowerCase()}`;
    const data = await kv.get(key);

    if (!data) {
      console.warn(`⚠️ [密碼重設-OTP] OTP 不存在或已過期`);
      return { valid: false, error: 'OTP not found or expired' };
    }

    // 檢查過期時間
    if (Date.now() > data.expiryTime) {
      console.warn(`⚠️ [密碼重設-OTP] OTP 已過期`);
      await kv.del(key); // 刪除過期的 OTP
      return { valid: false, error: 'OTP expired' };
    }

    // 檢查嘗試次數（最多 5 次）
    if (data.attempts >= 5) {
      console.warn(`⚠️ [密碼重設-OTP] 驗證次數超過限制`);
      await kv.del(key);
      return { valid: false, error: 'Too many attempts' };
    }

    // 驗證 OTP
    if (data.otp !== otp) {
      console.warn(`⚠️ [密碼重設-OTP] OTP 不正確`);
      // 增加嘗試次數
      await kv.set(key, {
        ...data,
        attempts: data.attempts + 1,
      });
      return { valid: false, error: 'Invalid OTP' };
    }

    console.log(`✅ [密碼重設-OTP] OTP 驗證成功`);

    // 驗證成功後刪除 OTP
    await kv.del(key);

    return { valid: true };
  } catch (error: any) {
    console.error(`❌ [密碼重設-OTP] 驗證失敗:`, error);
    return { valid: false, error: error.message };
  }
}

/**
 * 發送密碼重設郵件（使用雙語模板）
 */
async function sendPasswordResetEmail(
  email: string,
  userName: string,
  otp: string,
  language: 'en' | 'zh'
): Promise<boolean> {
  const isEnglish = language === 'en';

  // 單語言標題
  const subject = isEnglish
    ? '🔐 Password Reset Verification Code - CaseWHR'
    : '🔐 密碼重設驗證碼 - 接得準';

  // ✅ 使用自定義模板，顯示 OTP 驗證碼
  const resetUrl = `https://casewhr.com/reset-password?code=${otp}`;
  
  // 🎨 創建包含 OTP 的 HTML 郵件模板
  const htmlContent = createPasswordResetOTPEmail({
    userName,
    otp,
    resetUrl,
    language,
  });

  try {
    await sendEmail({
      to: email,
      subject,
      html: htmlContent,
      emailType: 'system',
      language,
    });
    return true;
  } catch (error) {
    console.error('❌ [密碼重設-郵件] 發送失敗:', error);
    return false;
  }
}

/**
 * 🎨 創建包含 OTP 的密碼重設郵件模板
 */
function createPasswordResetOTPEmail(params: {
  userName: string;
  otp: string;
  resetUrl: string;
  language: 'en' | 'zh';
}): string {
  const { userName, otp, resetUrl, language } = params;
  
  const content = language === 'en' ? {
    title: 'Password Reset Verification Code 🔐',
    greeting: `Hi ${userName},`,
    intro: 'We received a request to reset your password. Use the verification code below:',
    codeLabel: 'Your Verification Code:',
    codeInstruction: 'Enter this 8-digit code in the password reset form.',
    orButton: 'Or click the button below to reset your password directly:',
    button: 'Reset Password',
    warning: '⚠️ Important: This code will expire in 5 minutes for security reasons.',
    noRequest: 'If you didn\'t request a password reset, please ignore this email or contact support if you have concerns.',
    security: '🔒 Security Tips:',
    tip1: '• Never share your verification code with anyone',
    tip2: '• Use a strong, unique password',
    tip3: '• Enable two-factor authentication if available',
    team: 'Stay secure!<br/>The CaseWHR Team'
  } : {
    title: '密碼重設驗證碼 🔐',
    greeting: `${userName}，您好！`,
    intro: '我們收到了重設您密碼的請求。請使用以下驗證碼：',
    codeLabel: '您的驗證碼：',
    codeInstruction: '在密碼重設表單中輸入這個 8 位數驗證碼。',
    orButton: '或點擊下方按鈕直接重設密碼：',
    button: '重設密碼',
    warning: '⚠️ 重要：此驗證碼將在 5 分鐘後過期，以確保安全性。',
    noRequest: '如果您未請求重設密碼，請忽略此郵件，或如有疑慮請聯繫客服。',
    security: '🔒 安全提示：',
    tip1: '• 絕不與任何人分享您的驗證碼',
    tip2: '• 使用強且獨特的密碼',
    tip3: '• 如果可用，請啟用雙重驗證',
    team: '保持安全！<br/>接得準團隊'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .email-wrapper {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 40px 30px;
          }
          .otp-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
            text-align: center;
          }
          .otp-label {
            color: white;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .otp-code {
            background: white;
            color: #667eea;
            font-size: 36px;
            font-weight: 700;
            letter-spacing: 8px;
            padding: 20px;
            border-radius: 8px;
            display: inline-block;
            font-family: 'Courier New', monospace;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          .otp-instruction {
            color: white;
            font-size: 13px;
            margin-top: 15px;
            opacity: 0.95;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            transition: transform 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
          }
          .alert {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .divider {
            height: 1px;
            background: #e5e7eb;
            margin: 30px 0;
          }
          .text-center {
            text-align: center;
          }
          .security-tips {
            background: #f0f9ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .security-tips h3 {
            margin-top: 0;
            color: #1e40af;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <h1>${content.title}</h1>
          </div>
          
          <div class="content">
            <p><strong>${content.greeting}</strong></p>
            <p>${content.intro}</p>
            
            <!-- 🔥 OTP 驗證碼區域 -->
            <div class="otp-box">
              <div class="otp-label">${content.codeLabel}</div>
              <div class="otp-code">${otp}</div>
              <div class="otp-instruction">${content.codeInstruction}</div>
            </div>
            
            <div class="alert">
              ${content.warning}
            </div>
            
            <p style="text-align: center; color: #6b7280; margin: 30px 0;">
              ${content.orButton}
            </p>
            
            <div class="text-center">
              <a href="${resetUrl}" class="button">${content.button}</a>
            </div>
            
            <div class="card">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                ${content.noRequest}
              </p>
            </div>
            
            <div class="security-tips">
              <h3>${content.security}</h3>
              <div>
                <div style="margin: 8px 0;">${content.tip1}</div>
                <div style="margin: 8px 0;">${content.tip2}</div>
                <div style="margin: 8px 0;">${content.tip3}</div>
              </div>
            </div>
            
            <div class="divider"></div>
            
            <p class="text-center"><strong>${content.team}</strong></p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} CaseWHR (接得準). All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}