// 📁 交付物相關郵件模板 - Deliverable Email Templates

// 📁 交付物提交通知郵件（給案主）
export function getDeliverableSubmittedEmail(params: {
  name: string;
  projectTitle: string;
  freelancerName: string;
  fileCount: number;
  expiryDate: string;
  language: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}) {
  const { name, projectTitle, freelancerName, fileCount, expiryDate, language } = params;

  const content = language === 'en' ? {
    title: '📁 New Deliverable Submitted',
    greeting: `Hi ${name},`,
    message: `${freelancerName} has submitted deliverables for your project "${projectTitle}".`,
    filesLabel: 'Files Submitted',
    expiryWarningTitle: '⚠️ Important: File Retention Notice',
    expiryWarning: `Files will be available for download for 15 days only. After ${expiryDate}, files will be automatically deleted from our server.`,
    urgentAction: 'Please download the files as soon as possible to avoid data loss.',
    nextSteps: 'What to do next:',
    step1: 'Review the submitted files carefully',
    step2: 'Download all files within 15 days',
    step3: 'Approve or request revisions',
    viewButton: 'View & Download Files',
    footer: 'This is an urgent notification. Please take action before the expiry date.',
    team: 'The Case Where Team'
  } : language === 'zh-CN' ? {
    title: '📁 新交付物已提交',
    greeting: `您好 ${name}，`,
    message: `${freelancerName} 已为您的项目「${projectTitle}」提交了交付物。`,
    filesLabel: '提交的文件数',
    expiryWarningTitle: '⚠️ 重要：文件保留期限通知',
    expiryWarning: `文件仅保留 15 天供下载。${expiryDate} 后，文件将自动从服务器删除。`,
    urgentAction: '请尽快下载文件，避免数据丢失。',
    nextSteps: '接下来的步骤：',
    step1: '仔细审查提交的文件',
    step2: '在 15 天内下载所有文件',
    step3: '批准或要求修订',
    viewButton: '查看并下载文件',
    footer: '这是紧急通知。请在过期日期前采取行动。',
    team: 'Case Where 团队'
  } : {
    title: '📁 新交付物已提交',
    greeting: `您好 ${name}，`,
    message: `${freelancerName} 已為您的專案「${projectTitle}」提交了交付物。`,
    filesLabel: '提交的檔案數',
    expiryWarningTitle: '⚠️ 重要：文件保留期限通知',
    expiryWarning: `文件僅保留 15 天供下載。${expiryDate} 後，文件將自動從伺服器刪除。`,
    urgentAction: '請儘快下載文件，避免數據遺失。',
    nextSteps: '接下來的步驟：',
    step1: '仔細審查提交的文件',
    step2: '在 15 天內下載所有文件',
    step3: '批准或要求修訂',
    viewButton: '查看並下載文件',
    footer: '這是緊急通知。請在過期日期前採取行動。',
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
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .warning-title { color: #b45309; font-weight: 700; margin-bottom: 10px; }
          .warning-text { color: #92400e; }
          .urgent-text { color: #dc2626; font-weight: 600; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 600; color: #6b7280; }
          .detail-value { color: #111827; }
          .steps { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .steps ol { margin: 10px 0; padding-left: 20px; }
          .steps li { margin: 5px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background: #fef3c7; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
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
              <div class="detail-row">
                <span class="detail-label">${content.filesLabel}:</span>
                <span class="detail-value">${fileCount} ${language === 'en' ? 'file(s)' : '個文件'}</span>
              </div>
            </div>

            <div class="warning-box">
              <div class="warning-title">${content.expiryWarningTitle}</div>
              <p class="warning-text">${content.expiryWarning}</p>
              <p class="urgent-text">⏰ ${content.urgentAction}</p>
            </div>

            <div class="steps">
              <strong>${content.nextSteps}</strong>
              <ol>
                <li>${content.step1}</li>
                <li>${content.step2}</li>
                <li>${content.step3}</li>
              </ol>
            </div>

            <center>
              <a href="https://casewhr.com/dashboard" class="button">${content.viewButton}</a>
            </center>

            <p><strong>${content.team}</strong></p>
          </div>
          <div class="footer">
            ${content.footer}<br/>
            © 2024 Case Where 接得準股份有限公司
          </div>
        </div>
      </body>
    </html>
  `;
}

// 📁 文件即將過期提醒郵件（3天前）
export function getFileExpiryReminderEmail(params: {
  name: string;
  projectTitle: string;
  daysRemaining: number;
  expiryDate: string;
  fileCount: number;
  language: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}) {
  const { name, projectTitle, daysRemaining, expiryDate, fileCount, language } = params;

  const content = language === 'en' ? {
    title: '⚠️ Urgent: Files Expiring Soon',
    greeting: `Hi ${name},`,
    message: `This is an urgent reminder: ${fileCount} file(s) for project "${projectTitle}" will be deleted in ${daysRemaining} days.`,
    expiryDateLabel: 'Expiry Date',
    filesLabel: 'Files to Download',
    urgentWarning: `After ${expiryDate}, these files will be permanently deleted and cannot be recovered.`,
    actionNeeded: 'Immediate Action Required',
    actionMessage: 'Download all files NOW to avoid permanent data loss.',
    viewButton: 'Download Files Immediately',
    footer: 'This is the final warning. Please download the files before they are deleted.',
    team: 'The Case Where Team'
  } : language === 'zh-CN' ? {
    title: '⚠️ 紧急：文件即将过期',
    greeting: `您好 ${name}，`,
    message: `紧急提醒：项目「${projectTitle}」的 ${fileCount} 个文件将在 ${daysRemaining} 天后删除。`,
    expiryDateLabel: '过期日期',
    filesLabel: '待下载文件',
    urgentWarning: `${expiryDate} 后，这些文件将被永久删除，无法恢复。`,
    actionNeeded: '需要立即行动',
    actionMessage: '立即下载所有文件，避免永久数据丢失。',
    viewButton: '立即下载文件',
    footer: '这是最后警告。请在文件被删除前下载。',
    team: 'Case Where 团队'
  } : {
    title: '⚠️ 緊急：文件即將過期',
    greeting: `您好 ${name}，`,
    message: `緊急提醒：專案「${projectTitle}」的 ${fileCount} 個文件將在 ${daysRemaining} 天後刪除。`,
    expiryDateLabel: '過期日期',
    filesLabel: '待下載文件',
    urgentWarning: `${expiryDate} 後，這些文件將被永久刪除，無法恢復。`,
    actionNeeded: '需要立即行動',
    actionMessage: '立即下載所有文件，避免永久數據遺失。',
    viewButton: '立即下載文件',
    footer: '這是最後警告。請在文件被刪除前下載。',
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
          .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .danger-box { background: #fee2e2; border: 3px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .danger-title { color: #991b1b; font-weight: 700; font-size: 18px; margin-bottom: 10px; }
          .danger-text { color: #7f1d1d; font-size: 16px; font-weight: 600; }
          .countdown { font-size: 36px; color: #dc2626; font-weight: 700; text-align: center; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 600; color: #6b7280; }
          .detail-value { color: #111827; }
          .footer { text-align: center; padding: 20px; color: #991b1b; font-size: 14px; background: #fee2e2; border-radius: 0 0 8px 8px; font-weight: 600; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-size: 18px; font-weight: 700; }
          .button:hover { background: #b91c1c; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${content.title}</h1>
          </div>
          <div class="content">
            <p>${content.greeting}</p>
            <p><strong>${content.message}</strong></p>
            
            <div class="countdown">
              ⏰ ${daysRemaining} ${language === 'en' ? 'DAYS' : '天'}
            </div>

            <div class="card">
              <div class="detail-row">
                <span class="detail-label">${content.expiryDateLabel}:</span>
                <span class="detail-value" style="color: #dc2626; font-weight: 700;">${expiryDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">${content.filesLabel}:</span>
                <span class="detail-value">${fileCount} ${language === 'en' ? 'file(s)' : '個文件'}</span>
              </div>
            </div>

            <div class="danger-box">
              <div class="danger-title">🚨 ${content.actionNeeded}</div>
              <p class="danger-text">${content.urgentWarning}</p>
              <p class="danger-text">${content.actionMessage}</p>
            </div>

            <center>
              <a href="https://casewhr.com/dashboard" class="button">${content.viewButton}</a>
            </center>

            <p><strong>${content.team}</strong></p>
          </div>
          <div class="footer">
            ${content.footer}<br/>
            © 2024 Case Where 接得準股份有限公司
          </div>
        </div>
      </body>
    </html>
  `;
}
