// Helper function to send deposit confirmation emails
import * as kv from './kv_store.tsx';
import { sendEmail, getDepositSuccessEmail } from './email_service.tsx';
import { getUserBranding, injectBranding } from './branded_email_helper.tsx';

/**
 * Send deposit confirmation email with user's language preference
 * @param userEmail - User email address
 * @param amount - Deposit amount in USD
 * @param currency - Currency code (e.g., 'USD', 'TWD')
 * @param provider - Payment provider (e.g., 'PayPal', 'ECPay')
 */
export async function sendDepositConfirmation(
  userEmail: string,
  amount: number,
  currency: string = 'USD',
  provider: string = 'PayPal'
): Promise<void> {
  try {
    // Try to find user by email
    const users = await kv.getByPrefix('user:');
    const user = users.find((u: any) => u.email === userEmail);
    
    if (!user) {
      console.warn(`⚠️ [Email] User not found for email: ${userEmail}`);
      // Send email anyway with default values
      const emailHtml = getDepositSuccessEmail({
        name: userEmail.split('@')[0], // Use email prefix as name
        amount,
        newBalance: amount, // We don't know the balance
        language: 'en', // Default to English
      });
      
      const subject = `✅ Deposit Successful - $${amount} ${currency}`;
      await sendEmail(userEmail, subject, emailHtml);
      return;
    }
    
    // Get user's language preference
    const language = (user.language || 'en') as 'en' | 'zh';
    const name = user.full_name || user.email?.split('@')[0] || 'User';
    
    // Get user's wallet to calculate new balance
    const walletKey = `wallet_${user.id}`;
    const wallet = await kv.get(walletKey);
    const newBalance = wallet?.available_balance || amount;
    
    // Generate email HTML with bilingual support
    let emailHtml = getDepositSuccessEmail({
      name,
      amount,
      newBalance,
      language,
    });
    
    // 🎨 Apply branding for enterprise users
    const branding = await getUserBranding(user.id);
    if (branding) {
      console.log('🎨 [Email] Applying branding for user:', user.id, {
        hasLogo: !!branding.logo_url,
        companyName: branding.company_name
      });
      emailHtml = injectBranding(emailHtml, branding);
    }
    
    // Set subject based on language
    const subject = language === 'zh'
      ? `✅ 充值成功 - $${amount} ${currency} (${provider})`
      : `✅ Deposit Successful - $${amount} ${currency} via ${provider}`;
    
    // Send email
    await sendEmail(userEmail, subject, emailHtml);
    
    console.log(`✅ [Email] Deposit confirmation sent to ${userEmail}`, {
      amount,
      currency,
      provider,
      language,
      branded: !!branding
    });
  } catch (error) {
    console.error('❌ [Email] Failed to send deposit confirmation:', error);
    throw error;
  }
}