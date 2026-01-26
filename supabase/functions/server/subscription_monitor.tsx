/**
 * 🔔 訂閱監控服務
 * Subscription Monitoring Service
 * 
 * 定期檢查訂閱到期情況並發送通知
 * Periodically checks subscription expiry and sends notifications
 */

import * as kv from './kv_store.tsx';
import * as emailService from './email_service.tsx';

/**
 * 檢查所有訂閱並發送到期提醒
 * 
 * 觸發時機：
 * - 到期前 7 天：第一次提醒
 * - 到期前 3 天：第二次提醒  
 * - 到期前 1 天：最後提醒
 * - 到期當天：發送已到期通知
 */
export async function checkSubscriptionExpiry(): Promise<{
  checked: number;
  expiringSoon: number;
  expired: number;
  emailsSent: number;
}> {
  console.log('🔍 [Subscription Monitor] Starting subscription expiry check...');
  
  const now = new Date();
  const stats = {
    checked: 0,
    expiringSoon: 0,
    expired: 0,
    emailsSent: 0
  };
  
  try {
    // 獲取所有訂閱
    const allSubscriptions = await kv.getByPrefix('subscription_');
    console.log(`📊 [Subscription Monitor] Found ${allSubscriptions.length} subscriptions`);
    
    for (const subscription of allSubscriptions) {
      stats.checked++;
      
      // 跳過非活動訂閱
      if (subscription.status !== 'active') {
        continue;
      }
      
      // 跳過沒有到期日的訂閱（如終身會員）
      if (!subscription.next_billing_date) {
        continue;
      }
      
      const userId = subscription.user_id;
      const nextBillingDate = new Date(subscription.next_billing_date);
      const daysUntilExpiry = Math.ceil((nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`👤 [Subscription Monitor] User ${userId}: ${daysUntilExpiry} days until expiry`);
      
      // 檢查是否需要發送通知
      const shouldNotify = [7, 3, 1].includes(daysUntilExpiry);
      const lastNotification = await kv.get(`subscription_notification_${userId}_${daysUntilExpiry}d`);
      
      if (shouldNotify && !lastNotification) {
        stats.expiringSoon++;
        
        // 發送即將到期通知
        try {
          // 獲取用戶信息（假設有 user profile）
          const userProfile = await kv.get(`user_profile_${userId}`);
          const userEmail = userProfile?.email || subscription.email || 'unknown@email.com';
          const userName = userProfile?.name || userEmail.split('@')[0];
          
          const emailHtml = emailService.getSubscriptionExpiringEmail({
            name: userName,
            plan: subscription.plan,
            expiryDate: nextBillingDate.toLocaleDateString('zh-TW'),
            daysRemaining: daysUntilExpiry,
            language: 'zh'
          });
          
          await emailService.sendEmail({
            to: userEmail,
            subject: `⏰ 訂閱即將到期 - 還有 ${daysUntilExpiry} 天`,
            html: emailHtml
          });
          
          // 記錄已發送通知（避免重複發送）
          await kv.set(`subscription_notification_${userId}_${daysUntilExpiry}d`, {
            sent_at: now.toISOString(),
            days_remaining: daysUntilExpiry,
            email: userEmail
          });
          
          stats.emailsSent++;
          console.log(`📧 [Subscription Monitor] Expiry notification sent to ${userEmail} (${daysUntilExpiry} days)`);
        } catch (emailError) {
          console.error(`❌ [Subscription Monitor] Failed to send expiry notification for user ${userId}:`, emailError);
        }
      }
      
      // 檢查是否已過期（且未自動續費）
      if (daysUntilExpiry <= 0 && !subscription.auto_renew) {
        stats.expired++;
        
        // 檢查是否已發送過期通知
        const expiredNotification = await kv.get(`subscription_notification_${userId}_expired`);
        
        if (!expiredNotification) {
          try {
            // 更新訂閱狀態為過期
            subscription.status = 'expired';
            subscription.plan = 'free';
            subscription.expired_at = now.toISOString();
            subscription.updated_at = now.toISOString();
            
            await kv.set(`subscription_${userId}`, subscription);
            
            // 發送已到期通知
            const userProfile = await kv.get(`user_profile_${userId}`);
            const userEmail = userProfile?.email || subscription.email || 'unknown@email.com';
            const userName = userProfile?.name || userEmail.split('@')[0];
            
            const emailHtml = emailService.getSubscriptionExpiredEmail({
              name: userName,
              plan: subscription.plan,
              expiredDate: nextBillingDate.toLocaleDateString('zh-TW'),
              language: 'zh'
            });
            
            await emailService.sendEmail({
              to: userEmail,
              subject: '❌ 訂閱已到期 - 已降級為免費方案',
              html: emailHtml
            });
            
            // 記錄已發送過期通知
            await kv.set(`subscription_notification_${userId}_expired`, {
              sent_at: now.toISOString(),
              email: userEmail
            });
            
            stats.emailsSent++;
            console.log(`📧 [Subscription Monitor] Expired notification sent to ${userEmail}`);
          } catch (emailError) {
            console.error(`❌ [Subscription Monitor] Failed to send expired notification for user ${userId}:`, emailError);
          }
        }
      }
    }
    
    console.log('✅ [Subscription Monitor] Check complete:', stats);
    return stats;
    
  } catch (error) {
    console.error('❌ [Subscription Monitor] Error during expiry check:', error);
    throw error;
  }
}

/**
 * 清理過期的通知記錄（每月執行一次）
 * 避免 KV 存儲過多歷史通知記錄
 */
export async function cleanupOldNotifications(): Promise<number> {
  console.log('🧹 [Subscription Monitor] Starting notification cleanup...');
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const notifications = await kv.getByPrefix('subscription_notification_');
  let deletedCount = 0;
  
  for (const notification of notifications) {
    const sentAt = new Date(notification.sent_at);
    
    if (sentAt < thirtyDaysAgo) {
      const key = `subscription_notification_${notification.user_id}_${notification.type}`;
      await kv.del(key);
      deletedCount++;
    }
  }
  
  console.log(`✅ [Subscription Monitor] Cleaned up ${deletedCount} old notifications`);
  return deletedCount;
}
