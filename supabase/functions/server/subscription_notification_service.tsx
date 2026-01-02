import { generateInvoiceHTML, Invoice, InvoiceDetails } from './invoice_service.tsx';
import { getSenderByType } from './email_sender_config.tsx';

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');

interface SubscriptionNotification {
  user_id: string;
  user_email: string;
  tier: string;
  end_date: string;
  days_until_expiry: number;
  notification_type: 'expiring_soon' | 'expiring_very_soon' | 'expiring_tomorrow' | 'expiring_today' | 'expired' | 'grace_period_ending';
  sent_at: string;
}

// Check all subscriptions and send notifications
export async function checkSubscriptionsAndNotify() {
  console.log('[Subscription Notifications] Starting subscription check...');
  
  try {
    // Get all profiles with active subscriptions
    const allProfileKeys = await kv.getByPrefix('profile:');
    let notificationsSent = 0;
    
    for (const profileData of allProfileKeys) {
      const profile = profileData.value;
      
      if (!profile || profile.membership_tier === 'free') {
        continue;
      }

      const result = await checkAndNotifyUser(profile);
      if (result.notificationSent) {
        notificationsSent++;
      }
    }
    
    console.log(`[Subscription Notifications] Check complete. Sent ${notificationsSent} notifications.`);
    return { success: true, notificationsSent };
  } catch (error) {
    console.error('[Subscription Notifications] Error checking subscriptions:', error);
    return { success: false, error: 'Failed to check subscriptions' };
  }
}

// Check individual user and send notification if needed
async function checkAndNotifyUser(profile: any) {
  const userId = profile.user_id;
  const userEmail = profile.email;
  const tier = profile.membership_tier;
  const endDate = profile.subscription_end_date;

  if (!endDate) {
    return { notificationSent: false };
  }

  const now = new Date();
  const expiryDate = new Date(endDate);
  const diffTime = expiryDate.getTime() - now.getTime();
  const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Determine notification type based on days until expiry
  let notificationType: SubscriptionNotification['notification_type'] | null = null;
  
  if (daysUntilExpiry === 7) {
    notificationType = 'expiring_soon';
  } else if (daysUntilExpiry === 3) {
    notificationType = 'expiring_very_soon';
  } else if (daysUntilExpiry === 1) {
    notificationType = 'expiring_tomorrow';
  } else if (daysUntilExpiry === 0) {
    notificationType = 'expiring_today';
  } else if (daysUntilExpiry === -1) {
    notificationType = 'expired';
  } else if (daysUntilExpiry === -6) {
    notificationType = 'grace_period_ending';
  }

  if (!notificationType) {
    return { notificationSent: false };
  }

  // Check if notification already sent today
  const notificationKey = `subscription_notification:${userId}:${notificationType}:${endDate}`;
  const existingNotification = await kv.get(notificationKey);
  
  if (existingNotification) {
    const sentDate = new Date(existingNotification.sent_at);
    const hoursSinceSent = (now.getTime() - sentDate.getTime()) / (1000 * 60 * 60);
    
    // Don't send again if sent in last 23 hours
    if (hoursSinceSent < 23) {
      return { notificationSent: false };
    }
  }

  // Send email notification
  const emailSent = await sendExpiryEmail(userEmail, tier, daysUntilExpiry, notificationType, profile.language || 'en');

  if (emailSent) {
    // Record notification
    const notification: SubscriptionNotification = {
      user_id: userId,
      user_email: userEmail,
      tier,
      end_date: endDate,
      days_until_expiry: daysUntilExpiry,
      notification_type: notificationType,
      sent_at: now.toISOString(),
    };

    await kv.set(notificationKey, notification);

    // Add to user's notification history
    const userNotifications = await kv.get(`subscription_notifications:${userId}`) || [];
    userNotifications.unshift(notification);
    // Keep only last 10 notifications
    if (userNotifications.length > 10) {
      userNotifications.splice(10);
    }
    await kv.set(`subscription_notifications:${userId}`, userNotifications);

    console.log(`[Subscription Notifications] Sent ${notificationType} notification to ${userEmail}`);
    return { notificationSent: true };
  }

  return { notificationSent: false };
}

// Send expiry email
async function sendExpiryEmail(
  email: string,
  tier: string,
  daysUntilExpiry: number,
  notificationType: string,
  language: string
): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.error('[Subscription Notifications] BREVO_API_KEY not configured');
    return false;
  }

  const content = getEmailContent(tier, daysUntilExpiry, notificationType, language);
  
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: getSenderByType('subscription', language as 'en' | 'zh'),
        to: [{
          email: email,
        }],
        subject: content.subject,
        htmlContent: content.html,
      }),
    });

    if (response.ok) {
      console.log(`[Subscription Notifications] Email sent to ${email}`);
      return true;
    } else {
      const errorText = await response.text();
      console.error('[Subscription Notifications] Failed to send email:', errorText);
      return false;
    }
  } catch (error) {
    console.error('[Subscription Notifications] Error sending email:', error);
    return false;
  }
}

// Get email content based on notification type
function getEmailContent(tier: string, daysUntilExpiry: number, notificationType: string, language: string) {
  const tierName = language === 'zh' 
    ? (tier === 'professional' ? '專業版' : '企業版')
    : (tier === 'professional' ? 'Professional' : 'Enterprise');

  const days = Math.abs(daysUntilExpiry);
  const renewUrl = 'https://casewhr.com/subscription-upgrade';

  const content: Record<string, any> = {
    en: {
      expiring_soon: {
        subject: `Your ${tierName} subscription expires in 7 days`,
        html: `
          <h2>Subscription Renewal Reminder</h2>
          <p>Hi there,</p>
          <p>Your <strong>${tierName}</strong> subscription will expire in <strong>7 days</strong>.</p>
          <p>Renew now to continue enjoying:</p>
          <ul>
            ${tier === 'professional' ? `
              <li>Priority support</li>
              <li>Advanced analytics</li>
              <li>Featured listings</li>
              <li>10% platform fee</li>
            ` : `
              <li>Team management</li>
              <li>Dedicated account manager</li>
              <li>Custom contracts</li>
              <li>API access</li>
              <li>5% platform fee</li>
            `}
          </ul>
          <p><a href="${renewUrl}" style="display:inline-block;background:#3B82F6;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px;">Renew Now</a></p>
          <p>Best regards,<br>Case Where Team</p>
        `,
      },
      expiring_very_soon: {
        subject: `⚠️ Your ${tierName} subscription expires in 3 days`,
        html: `
          <h2 style="color:#F59E0B;">Action Required: Subscription Expiring</h2>
          <p>Hi there,</p>
          <p>Your <strong>${tierName}</strong> subscription will expire in <strong>3 days</strong>.</p>
          <p>Don't lose access to your premium features!</p>
          <p><a href="${renewUrl}" style="display:inline-block;background:#F59E0B;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px;font-weight:bold;">Renew Now</a></p>
          <p>Best regards,<br>Case Where Team</p>
        `,
      },
      expiring_tomorrow: {
        subject: `🚨 Urgent: Your ${tierName} subscription expires tomorrow`,
        html: `
          <h2 style="color:#EF4444;">Urgent: Subscription Expires Tomorrow</h2>
          <p>Hi there,</p>
          <p>Your <strong>${tierName}</strong> subscription expires <strong>tomorrow</strong>!</p>
          <p>Renew now to avoid service interruption.</p>
          <p><a href="${renewUrl}" style="display:inline-block;background:#EF4444;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px;font-weight:bold;">Renew Immediately</a></p>
          <p>Best regards,<br>Case Where Team</p>
        `,
      },
      expiring_today: {
        subject: `⛔ Your ${tierName} subscription expires today`,
        html: `
          <h2 style="color:#DC2626;">Your Subscription Expires Today</h2>
          <p>Hi there,</p>
          <p>Your <strong>${tierName}</strong> subscription expires <strong>today</strong>!</p>
          <p>Renew now to keep your premium features active.</p>
          <p><a href="${renewUrl}" style="display:inline-block;background:#DC2626;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;margin-top:16px;font-weight:bold;font-size:16px;">Renew Now</a></p>
          <p>Best regards,<br>Case Where Team</p>
        `,
      },
      expired: {
        subject: `Your ${tierName} subscription has expired`,
        html: `
          <h2 style="color:#DC2626;">Subscription Expired</h2>
          <p>Hi there,</p>
          <p>Your <strong>${tierName}</strong> subscription has expired.</p>
          <p>You're now in a 7-day grace period. Reactivate now to restore full access.</p>
          <p><a href="${renewUrl}" style="display:inline-block;background:#DC2626;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;margin-top:16px;font-weight:bold;font-size:16px;">Reactivate Now</a></p>
          <p>Best regards,<br>Case Where Team</p>
        `,
      },
      grace_period_ending: {
        subject: `Final reminder: Grace period ends tomorrow`,
        html: `
          <h2 style="color:#991B1B;">Final Reminder: Grace Period Ending</h2>
          <p>Hi there,</p>
          <p>Your grace period ends <strong>tomorrow</strong>. After that, your account will be downgraded to Free tier.</p>
          <p>Reactivate now to keep your premium features.</p>
          <p><a href="${renewUrl}" style="display:inline-block;background:#991B1B;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;margin-top:16px;font-weight:bold;font-size:16px;">Reactivate Now</a></p>
          <p>Best regards,<br>Case Where Team</p>
        `,
      },
    },
    zh: {
      expiring_soon: {
        subject: `您的${tierName}訂閱將在 7 天後到期`,
        html: `
          <h2>訂閱續訂提醒</h2>
          <p>您好，</p>
          <p>您的<strong>${tierName}</strong>訂閱將在 <strong>7 天</strong>後到期。</p>
          <p>立即續訂以繼續享受：</p>
          <ul>
            ${tier === 'professional' ? `
              <li>優先客服支援</li>
              <li>進階數據分析</li>
              <li>專案置頂顯示</li>
              <li>10% 平台手續費</li>
            ` : `
              <li>團隊管理功能</li>
              <li>專屬客戶經理</li>
              <li>客製化合約</li>
              <li>API 存取權限</li>
              <li>5% 平台手續費</li>
            `}
          </ul>
          <p><a href="${renewUrl}" style="display:inline-block;background:#3B82F6;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px;">立即續訂</a></p>
          <p>祝好，<br>Case Where 團隊</p>
        `,
      },
      expiring_very_soon: {
        subject: `⚠️ 您的${tierName}訂閱將在 3 天後到期`,
        html: `
          <h2 style="color:#F59E0B;">需要處理：訂閱即將到期</h2>
          <p>您好，</p>
          <p>您的<strong>${tierName}</strong>訂閱將在 <strong>3 天</strong>後到期。</p>
          <p>不要失去您的高級功能！</p>
          <p><a href="${renewUrl}" style="display:inline-block;background:#F59E0B;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px;font-weight:bold;">立即續訂</a></p>
          <p>祝好，<br>Case Where 團隊</p>
        `,
      },
      expiring_tomorrow: {
        subject: `🚨 緊急：您的${tierName}訂閱明天到期`,
        html: `
          <h2 style="color:#EF4444;">緊急：訂閱明天到期</h2>
          <p>您好，</p>
          <p>您的<strong>${tierName}</strong>訂閱<strong>明天</strong>到期！</p>
          <p>立即續訂以避免服務中斷。</p>
          <p><a href="${renewUrl}" style="display:inline-block;background:#EF4444;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px;font-weight:bold;">馬上續訂</a></p>
          <p>祝好，<br>Case Where 團隊</p>
        `,
      },
      expiring_today: {
        subject: `⛔ 您的${tierName}訂閱今天到期`,
        html: `
          <h2 style="color:#DC2626;">您的訂閱今天到期</h2>
          <p>您好，</p>
          <p>您的<strong>${tierName}</strong>訂閱<strong>今天</strong>到期！</p>
          <p>立即續訂以保持高級功能激活。</p>
          <p><a href="${renewUrl}" style="display:inline-block;background:#DC2626;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;margin-top:16px;font-weight:bold;font-size:16px;">立即續訂</a></p>
          <p>祝好，<br>Case Where 團隊</p>
        `,
      },
      expired: {
        subject: `您的${tierName}訂閱已過期`,
        html: `
          <h2 style="color:#DC2626;">訂閱已過期</h2>
          <p>您好，</p>
          <p>您的<strong>${tierName}</strong>訂閱已過期。</p>
          <p>您現在處於 7 天寬限期內。立即重新激活以恢復完整訪問。</p>
          <p><a href="${renewUrl}" style="display:inline-block;background:#DC2626;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;margin-top:16px;font-weight:bold;font-size:16px;">立即重新激活</a></p>
          <p>祝好，<br>Case Where 團隊</p>
        `,
      },
      grace_period_ending: {
        subject: `最後提醒：寬限期明天結束`,
        html: `
          <h2 style="color:#991B1B;">最後提醒：寬限期即將結束</h2>
          <p>您好，</p>
          <p>您的寬限期<strong>明天</strong>結束。之後，您的帳戶將降級為免費版。</p>
          <p>立即重新激活以保留高級功能。</p>
          <p><a href="${renewUrl}" style="display:inline-block;background:#991B1B;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;margin-top:16px;font-weight:bold;font-size:16px;">立即重新激活</a></p>
          <p>祝好，<br>Case Where 團隊</p>
        `,
      },
    },
  };

  const lang = language === 'zh' ? 'zh' : 'en';
  return content[lang][notificationType] || content.en.expiring_soon;
}

// Get user's notification history
export async function getUserNotificationHistory(userId: string) {
  try {
    return await kv.get(`subscription_notifications:${userId}`) || [];
  } catch (error) {
    console.error('[Subscription Notifications] Error getting history:', error);
    return [];
  }
}

// Register subscription notification API routes
export function registerSubscriptionNotificationRoutes(app: any) {
  console.log('[Subscription Notifications] Registering routes...');

  // Manual trigger to check subscriptions (admin only)
  app.post('/make-server-215f78a5/subscriptions/check-and-notify', async (c: Context) => {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      
      if (!user || error) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Check if admin (with backward compatibility)
      let profile = await kv.get(`profile_${user.id}`);
      if (!profile) {
        profile = await kv.get(`profile:${user.id}`);
      }
      if (!profile || profile.admin_level !== 'super_admin') {
        return c.json({ error: 'Admin access required' }, 403);
      }

      const result = await checkSubscriptionsAndNotify();
      return c.json(result);
    } catch (error) {
      console.error('[Subscription Notifications] Error in check endpoint:', error);
      return c.json({ error: 'Failed to check subscriptions' }, 500);
    }
  });

  // Get notification history
  app.get('/make-server-215f78a5/subscriptions/notifications/history', async (c: Context) => {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      
      if (!user || error) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const history = await getUserNotificationHistory(user.id);
      return c.json({ notifications: history });
    } catch (error) {
      console.error('[Subscription Notifications] Error getting history:', error);
      return c.json({ error: 'Failed to get notification history' }, 500);
    }
  });

  console.log('[Subscription Notifications] Routes registered successfully');
}