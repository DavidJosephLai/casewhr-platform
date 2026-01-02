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

  // ✅ 使用雙語模板（純中文或純英文）
  const resetUrl = `https://casewhr.com/reset-password?code=${otp}`;
  
  const htmlContent = emailTemplates.getPasswordResetEmail({
    userName,
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
    console.error('❌ [密碼重設-OTP] Brevo 發送失敗:', error);
    return false;
  }
}