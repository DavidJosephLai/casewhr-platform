// ========== 郵件整合服務 ==========
// 將郵件發送功能整合到業務流程中

import * as kv from './kv_store.tsx';
import * as emailService from './email_service.tsx';
import * as emailTemplates from './email_templates_enhanced.tsx';

// 🎯 從 KV Store 獲取自定義 LOGO URL
async function getEmailLogoUrl(): Promise<string | undefined> {
  try {
    const logoUrl = await kv.get('system:email:logo-url');
    console.log('📧 [Email Logo] Retrieved from KV Store:', logoUrl);
    return logoUrl as string | undefined;
  } catch (error) {
    console.error('❌ [Email Logo] Error fetching logo URL from KV Store:', error);
    return undefined;
  }
}

// ========== 1. 用戶註冊 - 歡迎郵件 (雙語版) ==========
export async function sendWelcomeEmail(params: {
  userId: string;
  email: string;
  name: string;
  language?: 'en' | 'zh';
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📧 [Welcome] Sending bilingual welcome email to user ${params.userId} (${params.email})`);
    
    // 🎯 從 KV Store 獲取自定義 LOGO URL
    const logoUrl = await getEmailLogoUrl();
    
    // ✅ 使用雙語模板
    const emailHtml = emailTemplates.getWelcomeEmail({
      name: params.name,
      logoUrl,
    });

    const subject = '🎉 歡迎來到 Case Where | Welcome to Case Where';

    const result = await emailService.sendEmail({
      to: params.email,
      subject,
      html: emailHtml,
    });

    if (result.success) {
      // 記錄郵件發送歷史
      await kv.set(`email:welcome:${params.userId}`, {
        sentAt: new Date().toISOString(),
        email: params.email,
      });
      
      console.log(`✅ [Welcome] Bilingual email sent successfully to ${params.email}`);
    } else {
      console.error(`❌ [Welcome] Failed to send email:`, result.error);
    }

    return result;
  } catch (error: any) {
    console.error(`❌ [Welcome] Error sending welcome email:`, error);
    return { success: false, error: error.message };
  }
}

// ========== 2. 月度報告 - 定期發送 ==========
export async function sendMonthlyReport(params: {
  userId: string;
  email: string;
  name: string;
  month: string;
  stats: {
    projectsPosted?: number;
    proposalsSubmitted?: number;
    projectsCompleted?: number;
    earningsThisMonth?: number;
    totalEarnings?: number;
    newReviews?: number;
    averageRating?: number;
  };
  language?: 'en' | 'zh';
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📧 [Monthly] Sending monthly report to user ${params.userId} for ${params.month}`);
    
    const language = params.language || 'zh';
    const emailHtml = emailTemplates.getMonthlyReportEmail({
      name: params.name,
      month: params.month,
      stats: params.stats,
      language,
    });

    const subject = language === 'en'
      ? `📊 Your ${params.month} Performance Report - Case Where`
      : `📊 您的 ${params.month} 月績效報告 - Case Where`;

    const result = await emailService.sendEmail({
      to: params.email,
      subject,
      html: emailHtml,
    });

    if (result.success) {
      // 記錄月度報告發送
      await kv.set(`email:monthly:${params.userId}:${params.month}`, {
        sentAt: new Date().toISOString(),
        email: params.email,
        stats: params.stats,
      });
      
      console.log(`✅ [Monthly] Report sent successfully to ${params.email}`);
    }

    return result;
  } catch (error: any) {
    console.error(`❌ [Monthly] Error sending monthly report:`, error);
    return { success: false, error: error.message };
  }
}

// ========== 3. 項目推薦 - 智能推薦 ==========
export async function sendProjectRecommendations(params: {
  userId: string;
  email: string;
  name: string;
  projects: Array<{
    title: string;
    budget: string;
    skills: string[];
    deadline: string;
  }>;
  language?: 'en' | 'zh';
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📧 [Recommendations] Sending project recommendations to user ${params.userId}`);
    
    const language = params.language || 'zh';
    const emailHtml = emailTemplates.getProjectRecommendationEmail({
      name: params.name,
      projects: params.projects,
      language,
    });

    const subject = language === 'en'
      ? '🎯 New Projects Matching Your Skills - Case Where'
      : '🎯 符合您技能的新項目 - Case Where';

    const result = await emailService.sendEmail({
      to: params.email,
      subject,
      html: emailHtml,
    });

    if (result.success) {
      await kv.set(`email:recommendations:${params.userId}:${Date.now()}`, {
        sentAt: new Date().toISOString(),
        email: params.email,
        projectCount: params.projects.length,
      });
      
      console.log(`✅ [Recommendations] Email sent with ${params.projects.length} projects`);
    }

    return result;
  } catch (error: any) {
    console.error(`❌ [Recommendations] Error:`, error);
    return { success: false, error: error.message };
  }
}

// ========== 4. 里程碑提醒 ==========
export async function sendMilestoneReminder(params: {
  userId: string;
  email: string;
  name: string;
  projectTitle: string;
  milestonesCompleted: number;
  totalMilestones: number;
  nextMilestone: string;
  daysRemaining: number;
  language?: 'en' | 'zh';
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📧 [Milestone] Sending reminder to user ${params.userId} for "${params.projectTitle}"`);
    
    const language = params.language || 'zh';
    const emailHtml = emailTemplates.getMilestoneReminderEmail({
      name: params.name,
      projectTitle: params.projectTitle,
      milestonesCompleted: params.milestonesCompleted,
      totalMilestones: params.totalMilestones,
      nextMilestone: params.nextMilestone,
      daysRemaining: params.daysRemaining,
      language,
    });

    const urgency = params.daysRemaining <= 3 ? '⏰ ' : '';
    const subject = language === 'en'
      ? `${urgency}Milestone Update: ${params.projectTitle}`
      : `${urgency}里程碑更新：${params.projectTitle}`;

    const result = await emailService.sendEmail({
      to: params.email,
      subject,
      html: emailHtml,
    });

    if (result.success) {
      await kv.set(`email:milestone:${params.userId}:${Date.now()}`, {
        sentAt: new Date().toISOString(),
        email: params.email,
        projectTitle: params.projectTitle,
        daysRemaining: params.daysRemaining,
      });
      
      console.log(`✅ [Milestone] Reminder sent successfully`);
    }

    return result;
  } catch (error: any) {
    console.error(`❌ [Milestone] Error:`, error);
    return { success: false, error: error.message };
  }
}

// ========== 5. 訊息通知 ==========
export async function sendMessageNotification(params: {
  userId: string;
  email: string;
  name: string;
  senderName: string;
  messagePreview: string;
  projectTitle?: string;
  language?: 'en' | 'zh';
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📧 [Message] Sending notification to ${params.email} from ${params.senderName}`);
    
    const language = params.language || 'zh';
    const emailHtml = emailTemplates.getMessageNotificationEmail({
      name: params.name,
      senderName: params.senderName,
      messagePreview: params.messagePreview,
      projectTitle: params.projectTitle,
      language,
    });

    const subject = language === 'en'
      ? `💌 New message from ${params.senderName}`
      : `💌 ${params.senderName} 發來新訊息`;

    const result = await emailService.sendEmail({
      to: params.email,
      subject,
      html: emailHtml,
    });

    if (result.success) {
      await kv.set(`email:message:${params.userId}:${Date.now()}`, {
        sentAt: new Date().toISOString(),
        from: params.senderName,
      });
      
      console.log(`✅ [Message] Notification sent successfully`);
    }

    return result;
  } catch (error: any) {
    console.error(`❌ [Message] Error:`, error);
    return { success: false, error: error.message };
  }
}

// ========== 6. 系統通知 ==========
export async function sendSystemNotification(params: {
  userId: string;
  email: string;
  name: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  actionButton?: {
    text: string;
    url: string;
  };
  language?: 'en' | 'zh';
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📧 [System] Sending ${params.type} notification to ${params.email}`);
    
    const language = params.language || 'zh';
    const emailHtml = emailTemplates.getSystemNotificationEmail({
      name: params.name,
      title: params.title,
      message: params.message,
      type: params.type,
      actionButton: params.actionButton,
      language,
    });

    const typeEmoji = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      danger: '🚨',
    };

    const subject = `${typeEmoji[params.type]} ${params.title}`;

    const result = await emailService.sendEmail({
      to: params.email,
      subject,
      html: emailHtml,
    });

    if (result.success) {
      await kv.set(`email:system:${params.userId}:${Date.now()}`, {
        sentAt: new Date().toISOString(),
        type: params.type,
        title: params.title,
      });
      
      console.log(`✅ [System] Notification sent successfully`);
    }

    return result;
  } catch (error: any) {
    console.error(`❌ [System] Error:`, error);
    return { success: false, error: error.message };
  }
}

// ========== 7. 項目狀態變更通知 ==========
export async function sendProjectStatusNotification(params: {
  userId: string;
  email: string;
  name: string;
  projectTitle: string;
  status: 'approved' | 'rejected' | 'completed' | 'in_progress';
  message: string;
  language?: 'en' | 'zh';
}): Promise<{ success: boolean; error?: string }> {
  const statusConfig = {
    approved: { type: 'success' as const, emoji: '✅' },
    rejected: { type: 'danger' as const, emoji: '❌' },
    completed: { type: 'success' as const, emoji: '🎉' },
    in_progress: { type: 'info' as const, emoji: '🚀' },
  };

  const config = statusConfig[params.status];
  const language = params.language || 'zh';

  const title = language === 'en'
    ? `${config.emoji} Project Status: ${params.projectTitle}`
    : `${config.emoji} 項目狀態：${params.projectTitle}`;

  return sendSystemNotification({
    userId: params.userId,
    email: params.email,
    name: params.name,
    title,
    message: params.message,
    type: config.type,
    language,
  });
}

// ========== 8. 批量發送月度報告（管理員功能）==========
export async function sendBulkMonthlyReports(params: {
  month: string;
  userReports: Array<{
    userId: string;
    email: string;
    name: string;
    stats: {
      projectsPosted?: number;
      proposalsSubmitted?: number;
      projectsCompleted?: number;
      earningsThisMonth?: number;
      totalEarnings?: number;
      newReviews?: number;
      averageRating?: number;
    };
    language?: 'en' | 'zh';
  }>;
}): Promise<{ 
  success: boolean; 
  sent: number; 
  failed: number;
  results: Array<{ userId: string; success: boolean; error?: string }>;
}> {
  console.log(`📧 [Bulk Monthly] Starting bulk send for ${params.month} to ${params.userReports.length} users`);
  
  let sent = 0;
  let failed = 0;
  const results = [];

  for (const userReport of params.userReports) {
    const result = await sendMonthlyReport({
      userId: userReport.userId,
      email: userReport.email,
      name: userReport.name,
      month: params.month,
      stats: userReport.stats,
      language: userReport.language,
    });

    results.push({
      userId: userReport.userId,
      success: result.success,
      error: result.error,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
    }

    // 防止發送過快，每封郵件間隔 1 秒
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`✅ [Bulk Monthly] Completed: ${sent} sent, ${failed} failed`);

  return {
    success: failed === 0,
    sent,
    failed,
    results,
  };
}

// ========== 9. 獲取用戶郵件歷史 ==========
export async function getUserEmailHistory(userId: string): Promise<any[]> {
  try {
    const prefix = `email:`;
    const allEmails = await kv.getByPrefix(prefix);
    
    // 過濾出該用戶的郵件
    const userEmails = allEmails
      .filter(item => item.key.includes(userId))
      .map(item => ({
        key: item.key,
        ...item.value,
      }))
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    return userEmails;
  } catch (error) {
    console.error('Error fetching email history:', error);
    return [];
  }
}

// ========== 10. 檢查郵件發送統計 ==========
export async function getEmailStats(): Promise<{
  welcome: number;
  monthly: number;
  recommendations: number;
  milestones: number;
  messages: number;
  system: number;
  total: number;
}> {
  try {
    const allEmails = await kv.getByPrefix('email:');
    
    const stats = {
      welcome: allEmails.filter(e => e.key.includes('email:welcome:')).length,
      monthly: allEmails.filter(e => e.key.includes('email:monthly:')).length,
      recommendations: allEmails.filter(e => e.key.includes('email:recommendations:')).length,
      milestones: allEmails.filter(e => e.key.includes('email:milestone:')).length,
      messages: allEmails.filter(e => e.key.includes('email:message:')).length,
      system: allEmails.filter(e => e.key.includes('email:system:')).length,
      total: allEmails.length,
    };

    return stats;
  } catch (error) {
    console.error('Error fetching email stats:', error);
    return {
      welcome: 0,
      monthly: 0,
      recommendations: 0,
      milestones: 0,
      messages: 0,
      system: 0,
      total: 0,
    };
  }
}