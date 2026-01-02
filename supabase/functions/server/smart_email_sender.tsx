/**
 * 🚀 智能郵件發送服務
 * 
 * 功能：
 * 1. 自動識別用戶訂閱等級
 * 2. 企業版用戶自動使用自定義 LOGO
 * 3. 統一的郵件發送接口
 */

import * as emailTemplates from './email_templates_enhanced.tsx';
import * as emailService from './email_service.tsx';
import * as enterpriseLogoService from './enterprise_logo_service.tsx';
import * as kv from './kv_store.tsx';

// 📊 用戶資訊接口
interface UserInfo {
  userId: string;
  email: string;
  name: string;
  subscriptionTier?: string;  // 'free' | 'professional' | 'enterprise'
  preferredLanguage?: 'en' | 'zh';
}

/**
 * 🎯 獲取用戶訂閱等級
 */
async function getUserSubscriptionTier(userId: string): Promise<string> {
  try {
    // 從 KV Store 獲取用戶的訂閱資訊
    const subscriptionKey = `subscription:${userId}`;
    const subscription = await kv.get(subscriptionKey) as any;
    
    if (subscription && subscription.plan) {
      console.log('📋 [Smart Email] User subscription:', subscription.plan);
      return subscription.plan;
    }
    
    // 默認為免費版
    console.log('📋 [Smart Email] No subscription found, defaulting to free');
    return 'free';
  } catch (error) {
    console.error('❌ [Smart Email] Error getting subscription:', error);
    return 'free';
  }
}

/**
 * 🎨 獲取郵件 LOGO 配置
 */
async function getEmailLogoConfig(userId: string, subscriptionTier: string) {
  // Footer LOGO（所有用戶都使用平台 LOGO）
  const footerLogoUrl = await enterpriseLogoService.getEmailFooterLogo();
  
  // Header LOGO（只有企業版用戶有自定義 LOGO）
  const headerLogoUrl = await enterpriseLogoService.getEmailHeaderLogoBySubscription(
    userId,
    subscriptionTier
  );
  
  const config = {
    logoUrl: footerLogoUrl,      // Footer LOGO
    headerLogoUrl,                // Header LOGO（企業版專屬）
  };
  
  console.log('🎨 [Smart Email] Logo config:', config);
  return config;
}

/**
 * 📧 發送歡迎郵件
 */
export async function sendWelcomeEmail(userInfo: UserInfo) {
  const subscriptionTier = userInfo.subscriptionTier || await getUserSubscriptionTier(userInfo.userId);
  const logoConfig = await getEmailLogoConfig(userInfo.userId, subscriptionTier);
  const language = userInfo.preferredLanguage || 'zh';
  
  const emailHtml = emailTemplates.getWelcomeEmail({
    name: userInfo.name,
    language,
    ...logoConfig,
  });
  
  const subject = language === 'en' 
    ? '🎉 Welcome to Case Where!' 
    : '🎉 歡迎來到 Case Where！';
  
  console.log('📧 [Smart Email] Sending welcome email:', {
    to: userInfo.email,
    tier: subscriptionTier,
    hasCustomLogo: !!logoConfig.headerLogoUrl,
  });
  
  return await emailService.sendEmail({
    to: userInfo.email,
    subject,
    html: emailHtml,
  });
}

/**
 * 📧 發送密碼重設郵件
 */
export async function sendPasswordResetEmail(
  userInfo: UserInfo,
  resetUrl: string
) {
  const subscriptionTier = userInfo.subscriptionTier || await getUserSubscriptionTier(userInfo.userId);
  const logoConfig = await getEmailLogoConfig(userInfo.userId, subscriptionTier);
  const language = userInfo.preferredLanguage || 'zh';
  
  const emailHtml = emailTemplates.getPasswordResetEmail({
    userName: userInfo.name,
    resetUrl,
    language,
    ...logoConfig,
  });
  
  const subject = language === 'en'
    ? '🔐 Reset Your Password'
    : '🔐 重設您的密碼';
  
  console.log('📧 [Smart Email] Sending password reset email:', {
    to: userInfo.email,
    tier: subscriptionTier,
    hasCustomLogo: !!logoConfig.headerLogoUrl,
  });
  
  return await emailService.sendEmail({
    to: userInfo.email,
    subject,
    html: emailHtml,
  });
}

/**
 * 📧 發送月度報告郵件
 */
export async function sendMonthlyReportEmail(
  userInfo: UserInfo,
  reportData: {
    month: string;
    stats: {
      totalProjects: number;
      completedProjects: number;
      totalEarnings: number;
      currency: string;
    };
  }
) {
  const subscriptionTier = userInfo.subscriptionTier || await getUserSubscriptionTier(userInfo.userId);
  const logoConfig = await getEmailLogoConfig(userInfo.userId, subscriptionTier);
  const language = userInfo.preferredLanguage || 'zh';
  
  const emailHtml = emailTemplates.getMonthlyReportEmail({
    name: userInfo.name,
    month: reportData.month,
    stats: reportData.stats,
    language,
    ...logoConfig,
  });
  
  const subject = language === 'en'
    ? `📊 Your ${reportData.month} Report`
    : `📊 您的 ${reportData.month} 月度報告`;
  
  console.log('📧 [Smart Email] Sending monthly report:', {
    to: userInfo.email,
    tier: subscriptionTier,
    hasCustomLogo: !!logoConfig.headerLogoUrl,
  });
  
  return await emailService.sendEmail({
    to: userInfo.email,
    subject,
    html: emailHtml,
  });
}

/**
 * 📧 發送項目推薦郵件
 */
export async function sendProjectRecommendationEmail(
  userInfo: UserInfo,
  projects: Array<{
    title: string;
    description: string;
    budget: string;
    currency: string;
  }>
) {
  const subscriptionTier = userInfo.subscriptionTier || await getUserSubscriptionTier(userInfo.userId);
  const logoConfig = await getEmailLogoConfig(userInfo.userId, subscriptionTier);
  const language = userInfo.preferredLanguage || 'zh';
  
  const emailHtml = emailTemplates.getProjectRecommendationEmail({
    name: userInfo.name,
    projects,
    language,
    ...logoConfig,
  });
  
  const subject = language === 'en'
    ? '💼 New Projects for You!'
    : '💼 為您推薦新項目！';
  
  console.log('📧 [Smart Email] Sending project recommendations:', {
    to: userInfo.email,
    tier: subscriptionTier,
    projectCount: projects.length,
    hasCustomLogo: !!logoConfig.headerLogoUrl,
  });
  
  return await emailService.sendEmail({
    to: userInfo.email,
    subject,
    html: emailHtml,
  });
}

/**
 * 📧 發送系統通知郵件
 */
export async function sendSystemNotificationEmail(
  userInfo: UserInfo,
  notification: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'danger';
    actionButton?: {
      text: string;
      url: string;
    };
  }
) {
  const subscriptionTier = userInfo.subscriptionTier || await getUserSubscriptionTier(userInfo.userId);
  const logoConfig = await getEmailLogoConfig(userInfo.userId, subscriptionTier);
  const language = userInfo.preferredLanguage || 'zh';
  
  const emailHtml = emailTemplates.getSystemNotificationEmail({
    name: userInfo.name,
    ...notification,
    language,
    ...logoConfig,
  });
  
  const subject = notification.title;
  
  console.log('📧 [Smart Email] Sending system notification:', {
    to: userInfo.email,
    tier: subscriptionTier,
    type: notification.type,
    hasCustomLogo: !!logoConfig.headerLogoUrl,
  });
  
  return await emailService.sendEmail({
    to: userInfo.email,
    subject,
    html: emailHtml,
  });
}

/**
 * 📧 發送里程碑提醒郵件
 */
export async function sendMilestoneReminderEmail(
  userInfo: UserInfo,
  milestoneData: {
    projectTitle: string;
    milestonesCompleted: number;
    totalMilestones: number;
    nextMilestone: string;
    daysRemaining: number;
  }
) {
  const subscriptionTier = userInfo.subscriptionTier || await getUserSubscriptionTier(userInfo.userId);
  const logoConfig = await getEmailLogoConfig(userInfo.userId, subscriptionTier);
  const language = userInfo.preferredLanguage || 'zh';
  
  const emailHtml = emailTemplates.getMilestoneReminderEmail({
    name: userInfo.name,
    ...milestoneData,
    language,
    ...logoConfig,
  });
  
  const subject = language === 'en'
    ? `⏰ Milestone Reminder: ${milestoneData.projectTitle}`
    : `⏰ 里程碑提醒：${milestoneData.projectTitle}`;
  
  console.log('📧 [Smart Email] Sending milestone reminder:', {
    to: userInfo.email,
    tier: subscriptionTier,
    hasCustomLogo: !!logoConfig.headerLogoUrl,
  });
  
  return await emailService.sendEmail({
    to: userInfo.email,
    subject,
    html: emailHtml,
  });
}

/**
 * 📧 發送訊息通知郵件
 */
export async function sendMessageNotificationEmail(
  userInfo: UserInfo,
  messageData: {
    senderName: string;
    messagePreview: string;
    projectTitle?: string;
  }
) {
  const subscriptionTier = userInfo.subscriptionTier || await getUserSubscriptionTier(userInfo.userId);
  const logoConfig = await getEmailLogoConfig(userInfo.userId, subscriptionTier);
  const language = userInfo.preferredLanguage || 'zh';
  
  const emailHtml = emailTemplates.getMessageNotificationEmail({
    name: userInfo.name,
    ...messageData,
    language,
    ...logoConfig,
  });
  
  const subject = language === 'en'
    ? `💬 New Message from ${messageData.senderName}`
    : `💬 ${messageData.senderName} 發送了新訊息`;
  
  console.log('📧 [Smart Email] Sending message notification:', {
    to: userInfo.email,
    tier: subscriptionTier,
    hasCustomLogo: !!logoConfig.headerLogoUrl,
  });
  
  return await emailService.sendEmail({
    to: userInfo.email,
    subject,
    html: emailHtml,
  });
}

/**
 * 📊 發送郵件統計
 */
export async function getEmailStats() {
  const enterpriseStats = await enterpriseLogoService.getEnterpriseLogoStats();
  
  return {
    ...enterpriseStats,
    supportedEmailTypes: [
      'welcome',
      'password-reset',
      'monthly-report',
      'project-recommendation',
      'system-notification',
      'milestone-reminder',
      'message-notification',
    ],
  };
}
