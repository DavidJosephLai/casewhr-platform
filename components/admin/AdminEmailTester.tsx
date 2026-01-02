import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Send, CheckCircle, XCircle, Loader2, TestTube, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { EmailTemplateGuide } from './EmailTemplateGuide';
import { LogoUploader } from './LogoUploader';

interface EmailLog {
  id?: string;
  to: string;
  subject: string;
  status: 'sent' | 'failed';
  timestamp: string;
  messageId?: string;
  smtpResponse?: string;
  response?: string;
  error?: string;
}

export function AdminEmailTester() {
  const { language } = useLanguage();
  const { accessToken } = useAuth();
  const [sending, setSending] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [brevoActivity, setBrevoActivity] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  
  // Form state
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [useTemplate, setUseTemplate] = useState(false);
  
  // New state for enhanced template testing
  const [testingEnhancedEmail, setTestingEnhancedEmail] = useState(false);
  const [enhancedEmailType, setEnhancedEmailType] = useState('password-reset');
  const [enhancedRecipient, setEnhancedRecipient] = useState('');

  const content = {
    en: {
      title: 'Email System Tester',
      description: 'Test and monitor email sending functionality',
      testConnection: 'Test SMTP Connection',
      sendTestEmail: 'Send Test Email',
      recipient: 'Recipient Email',
      recipientPlaceholder: 'user@example.com',
      subject: 'Email Subject',
      subjectPlaceholder: 'Test Email from Case Where',
      message: 'Email Message',
      messagePlaceholder: 'Enter your email content here...',
      useTemplate: 'Use HTML Template',
      sending: 'Sending...',
      testing: 'Testing...',
      testSuccess: 'SMTP connection successful!',
      testFailed: 'SMTP connection failed',
      emailSent: 'Email sent successfully!',
      emailFailed: 'Failed to send email',
      recentLogs: 'Recent Email Logs',
      noLogs: 'No email logs yet',
      status: 'Status',
      timestamp: 'Time',
      response: 'Response',
      quickTemplates: 'Quick Templates',
      template: {
        welcome: 'Welcome Email',
        withdrawal: 'Withdrawal Notification',
        payment: 'Payment Receipt',
        custom: 'Custom Message',
      },
      smtpConfig: 'SMTP Configuration',
      smtpHost: 'Host',
      smtpPort: 'Port',
      smtpUser: 'User',
      smtpSender: 'Sender',
      connected: 'Connected',
      disconnected: 'Disconnected',
      enterEmail: 'Please enter a recipient email',
      sendFailed: 'Failed to send email',
    },
    'zh-TW': {
      title: '郵件系統測試',
      description: '測試和監控郵件發送功能',
      testConnection: '測試 SMTP 連接',
      sendTestEmail: '發送測試郵件',
      recipient: '收件人郵箱',
      recipientPlaceholder: 'user@example.com',
      subject: '郵件主旨',
      subjectPlaceholder: 'Case Where 測試郵件',
      message: '郵件內容',
      messagePlaceholder: '在此輸入郵件內容...',
      useTemplate: '使用 HTML 模板',
      sending: '發送中...',
      testing: '測試中...',
      testSuccess: 'SMTP 連接成功！',
      testFailed: 'SMTP 連接失敗',
      emailSent: '郵件發送成功！',
      emailFailed: '郵件發送失敗',
      recentLogs: '最近郵件記錄',
      noLogs: '暫無郵件記錄',
      status: '狀態',
      timestamp: '時間',
      response: '響應',
      quickTemplates: '快速模板',
      template: {
        welcome: '歡迎郵件',
        withdrawal: '提現通知',
        payment: '付款收據',
        custom: '自定義消息',
      },
      smtpConfig: 'SMTP 配置',
      smtpHost: '主機',
      smtpPort: '端口',
      smtpUser: '用戶',
      smtpSender: '發件人',
      connected: '已連接',
      disconnected: '未連接',
      enterEmail: '請輸入收件人郵箱',
      sendFailed: '郵件發送失敗',
    },
    'zh-CN': {
      title: '邮件系统测试',
      description: '测试和监控邮件发送功能',
      testConnection: '测试 SMTP 连接',
      sendTestEmail: '发送测试邮件',
      recipient: '收件人邮箱',
      recipientPlaceholder: 'user@example.com',
      subject: '邮件主旨',
      subjectPlaceholder: 'Case Where 测试邮件',
      message: '邮件内容',
      messagePlaceholder: '在此输入邮件内容...',
      useTemplate: '使用 HTML 模板',
      sending: '发送中...',
      testing: '测试中...',
      testSuccess: 'SMTP 连接成功！',
      testFailed: 'SMTP 连接失败',
      emailSent: '邮件发送成功！',
      emailFailed: '邮件发送失败',
      recentLogs: '最近邮件记录',
      noLogs: '暂无邮件记录',
      status: '状态',
      timestamp: '时间',
      response: '响应',
      quickTemplates: '快速模板',
      template: {
        welcome: '欢迎邮件',
        withdrawal: '提现通知',
        payment: '付款收据',
        custom: '自定义消息',
      },
      smtpConfig: 'SMTP 配置',
      smtpHost: '主机',
      smtpPort: '端口',
      smtpUser: '用户',
      smtpSender: '发件人',
      connected: '已连接',
      disconnected: '未连接',
      enterEmail: '请输入收件人邮箱',
      sendFailed: '邮件发送失败',
    }
  };

  // ✅ 確保翻譯對象永遠有效，避免 undefined 錯誤
  const t = (language === 'zh-TW' || language === 'zh-CN') ? content['zh-TW'] : content.en;
  
  // Enhanced Email Template Section Component
  const EnhancedEmailTemplateSection = () => {
    const [selectedTemplate, setSelectedTemplate] = useState('welcome');
    const [testEmail, setTestEmail] = useState('');
    const [sending, setSending] = useState(false);

    const templateOptions = [
      { value: 'welcome', label: language === 'en' ? '🎉 Welcome Email' : '🎉 歡迎郵件', emoji: '🎉' },
      { value: 'monthly-report', label: language === 'en' ? '📊 Monthly Report' : '📊 月度報告', emoji: '📊' },
      { value: 'project-recommendation', label: language === 'en' ? '🎯 Project Recommendations' : '🎯 項目推薦', emoji: '🎯' },
      { value: 'milestone-reminder', label: language === 'en' ? '🎊 Milestone Reminder' : '🎊 里程碑提醒', emoji: '🎊' },
      { value: 'message-notification', label: language === 'en' ? '💌 Message Notification' : '💌 訊息通知', emoji: '💌' },
      { value: 'system-notification', label: language === 'en' ? '🔔 System Notification' : '🔔 系統通知', emoji: '🔔' },
    ];

    const sendEnhancedEmail = async () => {
      if (!testEmail.trim()) {
        toast.error(language === 'en' ? 'Please enter a recipient email' : '請輸入收件人郵箱');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(testEmail.trim())) {
        toast.error(language === 'en' ? 'Please enter a valid email address' : '請輸入有效的電子郵件地址');
        return;
      }

      setSending(true);
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/test-enhanced-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              email: testEmail.trim(),
              type: selectedTemplate,
              language: language,
            }),
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          toast.success(
            language === 'en' 
              ? `✅ ${templateOptions.find(t => t.value === selectedTemplate)?.emoji} Enhanced email sent successfully!`
              : `✅ ${templateOptions.find(t => t.value === selectedTemplate)?.emoji} 增強版郵件發送成功！`,
            { duration: 5000 }
          );
          
          toast.info(
            language === 'en'
              ? '💡 Check your email inbox (and spam folder) for the professionally designed template with CaseWHR logo!'
              : '💡 請檢查您的郵箱（包括垃圾郵件文件夾）以查看帶有 CaseWHR 標誌的專業設計模板！',
            { duration: 8000 }
          );

          setTestEmail('');
        } else {
          toast.error(
            language === 'en' 
              ? `Failed to send email: ${data.error}`
              : `發送郵件失敗：${data.error}`
          );
        }
      } catch (error) {
        console.error('Error sending enhanced email:', error);
        toast.error(
          language === 'en' 
            ? 'An error occurred while sending the email'
            : '發送郵件時發生錯誤'
        );
      } finally {
        setSending(false);
      }
    };

    return (
      <div className="space-y-4">
        {/* Template Selection */}
        <div>
          <Label className="mb-2 block text-purple-800">
            {language === 'en' ? 'Select Email Template' : '選擇郵件模板'}
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {templateOptions.map((template) => (
              <Button
                key={template.value}
                variant={selectedTemplate === template.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTemplate(template.value)}
                className={selectedTemplate === template.value ? 'bg-purple-600 hover:bg-purple-700' : 'hover:bg-purple-50'}
              >
                {template.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Template Description */}
        <div className="bg-white p-4 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-900">
            {selectedTemplate === 'welcome' && (language === 'en' 
              ? '🎉 Sends a professional welcome email with CaseWHR branding to new users'
              : '🎉 向新用戶發送帶有 CaseWHR 品牌的專業歡迎郵件')}
            {selectedTemplate === 'monthly-report' && (language === 'en'
              ? '📊 Monthly performance report with statistics and achievements'
              : '📊 包含統計數據和成就的月度績效報告')}
            {selectedTemplate === 'project-recommendation' && (language === 'en'
              ? '🎯 Personalized project recommendations based on user skills'
              : '🎯 基於用戶技能的個性化項目推薦')}
            {selectedTemplate === 'milestone-reminder' && (language === 'en'
              ? '🎊 Project progress updates and milestone reminders'
              : '🎊 項目進度更新和里程碑提醒')}
            {selectedTemplate === 'message-notification' && (language === 'en'
              ? '💌 New message notification from clients or freelancers'
              : '💌 來自客戶或自由職業者的新訊息通知')}
            {selectedTemplate === 'system-notification' && (language === 'en'
              ? '🔔 System announcements and maintenance notices'
              : '🔔 系統公告和維護通知')}
          </p>
        </div>

        {/* Email Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="enhancedEmail" className="text-purple-800">
              {language === 'en' ? 'Recipient Email' : '收件人郵箱'} *
            </Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTestEmail('davidlai117@yahoo.com.tw')}
                className="text-xs text-purple-600 hover:underline"
              >
                Yahoo
              </button>
              <span className="text-xs text-gray-400">|</span>
              <button
                type="button"
                onClick={() => window.open('https://temp-mail.org', '_blank')}
                className="text-xs text-purple-600 hover:underline"
              >
                {language === 'en' ? 'Temp Email' : '臨時郵箱'}
              </button>
            </div>
          </div>
          <Input
            id="enhancedEmail"
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="user@example.com"
            className="border-purple-300 focus:border-purple-500"
          />
        </div>

        {/* Send Button */}
        <Button
          onClick={sendEnhancedEmail}
          disabled={sending}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {sending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {language === 'en' ? 'Sending...' : '發送中...'}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {language === 'en' ? 'Send Enhanced Email with LOGO' : '發送帶 LOGO 的增強版郵件'}
            </>
          )}
        </Button>

        {/* Info Box */}
        <div className="bg-purple-100 border border-purple-300 rounded-lg p-3">
          <p className="text-xs text-purple-900">
            <strong>{language === 'en' ? '✨ What\'s New:' : '✨ 新功能：'}</strong><br/>
            {language === 'en'
              ? '• Professional CaseWHR logo in header\n• Bilingual support (English/中文)\n• Modern, responsive design\n• Consistent branding across all emails'
              : '• 標頭包含專業的 CaseWHR 標誌\n• 雙語支持（English/中文）\n• 現代化響應式設計\n• 所有郵件的一致品牌形象'}
          </p>
        </div>
      </div>
    );
  };

  // Quick template selection
  const handleTemplateSelect = (templateType: string) => {
    switch (templateType) {
      case 'welcome':
        setSubject(language === 'en' ? 'Welcome to Case Where!' : '歡迎來到 Case Where！');
        setMessage(language === 'en' 
          ? 'Welcome to Case Where! We\'re excited to have you on board. Start exploring projects and connecting with professionals today.'
          : '歡迎來到 Case Where！我們很高興您的加入。立即開始探索��目並與專業人士建立聯繫。'
        );
        break;
      case 'withdrawal':
        setSubject(language === 'en' ? 'Withdrawal Approved' : '提現已批准');
        setMessage(language === 'en'
          ? 'Your withdrawal request has been approved. The funds will be transferred to your bank account within 3-5 business days.'
          : '您的提現申請已獲批准。資金將在 3-5 個工日內轉入您的銀行帳戶。'
        );
        break;
      case 'payment':
        setSubject(language === 'en' ? 'Payment Received' : '已收到付款');
        setMessage(language === 'en'
          ? 'We have received your payment. Thank you for your business!'
          : '我們已收到您的付款。感謝您的惠顧！'
        );
        break;
      default:
        setSubject('');
        setMessage('');
    }
  };

  // Fetch Brevo activity
  const fetchBrevoActivity = async () => {
    setLoadingActivity(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/brevo-activity?limit=20`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Brevo activity:', data);
        setBrevoActivity(data.events || []);
        toast.success(language === 'en' 
          ? `Loaded ${data.events?.length || 0} recent emails from Brevo`
          : `已從 Brevo 載入 ${data.events?.length || 0} 封最近的郵件`
        );
      } else {
        const error = await response.json();
        console.error('❌ Failed to fetch Brevo activity:', error);
        
        // Show specific error for wrong API key type
        if (error.error?.includes('SMTP key') || error.error?.includes('Wrong API key type')) {
          toast.error(
            language === 'en' 
              ? `⚠️ Wrong API Key Type!\n\nYou're using an SMTP key (xsmtpsib-...) but need a REST API key (xkeysib-...).\n\nGet it from: https://app.brevo.com/settings/keys/api`
              : `⚠️ API Key 類型錯誤！\n\n您使用的是 SMTP key (xsmtpsib-...) 但需要 REST API key (xkeysib-...)。\n\n請從此處獲取：https://app.brevo.com/settings/keys/api`,
            { duration: 10000 }
          );
        } else {
          toast.error(
            language === 'en' 
              ? `Failed to load Brevo activity: ${error.error || 'Unknown error'}`
              : `無法載入 Brevo 活動：${error.error || '未知錯誤'}`
          );
        }
      }
    } catch (error) {
      console.error('Error fetching Brevo activity:', error);
      toast.error(language === 'en' ? 'Error loading Brevo activity' : '載入 Brevo 活動時出錯');
    } finally {
      setLoadingActivity(false);
    }
  };

  // Test SMTP connection
  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/test-email-connection`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(t.testSuccess);
        console.log('✅ SMTP Test:', data);
        setConnectionStatus({ status: 'success', message: data });
      } else {
        const error = await response.json();
        toast.error(t.testFailed + ': ' + error.error);
        console.error('❌ SMTP Test failed:', error);
        setConnectionStatus({ status: 'failed', message: error.error });
      }
    } catch (error) {
      console.error('Error testing SMTP connection:', error);
      toast.error(t.testFailed);
      setConnectionStatus({ status: 'failed', message: String(error) });
    } finally {
      setTestingConnection(false);
    }
  };

  // Send test email
  const sendTestEmail = async () => {
    // Validate inputs
    if (!toEmail.trim()) {
      toast.error(t.enterEmail);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(toEmail.trim())) {
      toast.error(language === 'en' ? 'Please enter a valid email address' : '請輸入有效的電子郵件地址');
      return;
    }

    setSending(true);
    setEmailLogs([]);
    
    try {
      // Prepare test email content
      const testSubject = subject.trim() || (language === 'en' ? 'Test Email from Case Where' : 'Case Where 測試郵件');
      const testMessage = message.trim() || (language === 'en' 
        ? `<p>This is a test email from Case Where Platform.</p><p>If you received this, email delivery is working correctly!</p><p>Sent at: ${new Date().toLocaleString()}</p>`
        : `<p>這是來自 Case Where 平台的測試郵件。</p><p>如果您收到此郵件，表示郵件發送功能正常！</p><p>發送時間：${new Date().toLocaleString('zh-TW')}</p>`
      );
      
      // 🔍 Enhanced logging
      console.log('📧 ========== EMAIL SENDING DEBUG ==========');
      console.log('📧 Timestamp:', new Date().toISOString());
      console.log('📧 To:', toEmail.trim());
      console.log('📧 Subject:', testSubject);
      console.log('📧 Message length:', testMessage.length);
      console.log('📧 Language:', language);
      console.log('📧 ==========================================');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/send-test-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            to: toEmail.trim(),
            subject: testSubject,
            html: testMessage,
          }),
        }
      );

      const data = await response.json();
      
      // 🔍 Enhanced response logging
      console.log('📬 ========== EMAIL RESPONSE DEBUG ==========');
      console.log('📬 Response status:', response.status);
      console.log('📬 Response OK:', response.ok);
      console.log('📬 Full response data:', JSON.stringify(data, null, 2));
      
      if (response.ok && data.success) {
        console.log('✅ SUCCESS DETAILS:');
        console.log('  - Message ID:', data.messageId);
        console.log('  - Accepted:', JSON.stringify(data.accepted));
        console.log('  - Rejected:', JSON.stringify(data.rejected));
        console.log('  - SMTP Response:', data.response);
        console.log('  - Timestamp:', data.timestamp);
        console.log('📬 ===========================================');

        // Add to logs with detailed info
        const newLog: EmailLog = {
          timestamp: new Date().toISOString(),
          to: toEmail.trim(),
          subject: testSubject,
          status: 'sent',
          messageId: data.messageId,
          smtpResponse: data.response,
        };
        setEmailLogs(prev => [newLog, ...prev]);
        
        toast.success(t.emailSent + '\n' + (language === 'en' 
          ? 'Check Brevo Dashboard to verify delivery status' 
          : '請檢查 Brevo 控制台確認送達狀態'), {
          duration: 5000,
        });
        
        // 🔍 Additional important instructions
        toast.info((language === 'en'
          ? '⚠️ IMPORTANT:\n1. Check your SPAM/JUNK folder\n2. Check Brevo activity below\n3. It may take 1-5 minutes to arrive\n4. Search your inbox for "Case Where"'
          : '⚠️ 重要提醒：\n1. 檢查垃圾郵件文件夾\n2. 檢查下方 Brevo 活動記錄\n3. 可能需要 1-5 分鐘送達\n4. 在收件匣搜尋 "Case Where"'
        ), {
          duration: 10000,
        });

        // Check for rejected recipients
        if (data.rejected && data.rejected.length > 0) {
          toast.warning(`⚠️ ${language === 'en' 
            ? 'Some recipients were rejected by Brevo' 
            : '部分收件人被 Brevo 拒絕'}: ${JSON.stringify(data.rejected)}`, {
            duration: 8000,
          });
        }

        // Clear form
        setToEmail('');
        setSubject('');
        setMessage('');
      } else {
        console.error('❌ FAILURE DETAILS:');
        console.error('  - Error:', data.error);
        console.error('  - Details:', JSON.stringify(data.details));
        console.log('📬 ===========================================');

        const newLog: EmailLog = {
          timestamp: new Date().toISOString(),
          to: toEmail.trim(),
          subject: testSubject,
          status: 'failed',
          error: data.error || 'Unknown error',
        };
        setEmailLogs(prev => [newLog, ...prev]);
        
        toast.error(`${t.sendFailed}: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('💥 ========== EMAIL EXCEPTION ==========');
      console.error('Exception:', error);
      console.error('Error type:', typeof error);
      console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      console.error('💥 ========================================');
      
      const newLog: EmailLog = {
        timestamp: new Date().toISOString(),
        to: toEmail.trim(),
        subject: subject || 'Test Email',
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      };
      setEmailLogs(prev => [newLog, ...prev]);
      
      toast.error(t.sendFailed + ': ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 📸 LOGO Upload Section */}
      <LogoUploader />
      
      {/* 🎨 NEW: Enhanced Email Templates with LOGO */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Sparkles className="h-5 w-5" />
            {language === 'en' ? '🎨 Enhanced Email Templates (With CaseWHR LOGO)' : '🎨 增強版郵件模板（帶 CaseWHR LOGO）'}
          </CardTitle>
          <CardDescription className="text-purple-700">
            {language === 'en' 
              ? 'Test new professional email templates with CaseWHR branding and logo' 
              : '測試帶有 CaseWHR 品牌和標誌的新專業郵件模板'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EnhancedEmailTemplateSection />
        </CardContent>
      </Card>
      
      {/* Email Deliverability Guide */}
      <EmailTemplateGuide />
      
      {/* Troubleshooting Guide */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <AlertCircle className="h-5 w-5" />
            {language === 'en' ? 'Email Not Arriving? Troubleshooting Steps' : '收不到郵件？故障排除步驟'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-900 space-y-4">
          {/* Step 1: Check Brevo Dashboard */}
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <p className="font-semibold mb-2">
              {language === 'en' ? '1. Check Brevo Dashboard (MOST IMPORTANT)' : '1. 檢查 Brevo 控制台（最重要）'}
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
              <li>
                {language === 'en' ? 'Open: ' : '打開：'}
                <a href="https://app.brevo.com/email/transactional" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800">
                  https://app.brevo.com/email/transactional
                </a>
              </li>
              <li>{language === 'en' ? 'Click "Email Activity" tab' : '點擊「Email Activity」標籤'}</li>
              <li>{language === 'en' ? 'Look for your test email in the list' : '在列表中查找您的測試郵件'}</li>
              <li className="font-medium text-blue-700">
                {language === 'en' 
                  ? 'Check the STATUS column: Delivered / Opened / Bounced / Blocked' 
                  : '檢查 STATUS 欄：Delivered（已送達）/ Opened（已打開）/ Bounced（退信）/ Blocked（被阻擋）'}
              </li>
            </ul>
          </div>

          {/* Step 2: Try Different Email */}
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <p className="font-semibold mb-2">
              {language === 'en' ? '2. Try a Different Email Address' : '2. 嘗試不同的郵箱地址'}
            </p>
            <p className="text-xs mb-2">
              {language === 'en' 
                ? 'Yahoo Mail might have strict spam filters. Try sending to:' 
                : 'Yahoo Mail 可能有嚴格的垃圾郵件過濾。嘗試發送到：'}
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
              <li>Gmail (usually more reliable for testing)</li>
              <li>Outlook / Hotmail</li>
              <li>{language === 'en' ? 'A temporary email service like temp-mail.org' : '臨時郵箱服務如 temp-mail.org'}</li>
            </ul>
          </div>

          {/* Step 3: Check Spam Folders */}
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <p className="font-semibold mb-2">
              {language === 'en' ? '3. Check ALL Email Folders' : '3. 檢查所有郵件文件夾'}
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
              <li>{language === 'en' ? 'Spam / Junk folder' : '垃圾郵件文件夾'}</li>
              <li>{language === 'en' ? 'Promotions tab (Gmail)' : '促銷郵件標籤（Gmail）'}</li>
              <li>{language === 'en' ? 'Bulk mail folder (Yahoo)' : '批量郵件文件夾（Yahoo）'}</li>
              <li>{language === 'en' ? 'Wait 5-10 minutes (sometimes delayed)' : '等待 5-10 分鐘（有時會延遲）'}</li>
            </ul>
          </div>

          {/* Step 4: Verify Sender */}
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <p className="font-semibold mb-2">
              {language === 'en' ? '4. Verify Sender in Brevo' : '4. 在 Brevo 驗證發件人'}
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
              <li>
                {language === 'en' ? 'Go to: ' : '前往：'}
                <a href="https://app.brevo.com/settings/senders" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800">
                  Brevo → Settings → Senders
                </a>
              </li>
              <li>{language === 'en' ? 'Make sure support@casewhr.com is verified (green checkmark)' : '確保 support@casewhr.com 已驗證（綠色勾選）'}</li>
              <li>{language === 'en' ? 'If not verified, click "Resend verification email"' : '如果未驗證，點擊「重新發送驗證郵件」'}</li>
            </ul>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-blue-200">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open('https://app.brevo.com/email/transactional', '_blank')}
              className="text-xs"
            >
              {language === 'en' ? '📊 Open Brevo Dashboard' : '📊 打開 Brevo 控制台'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open('https://temp-mail.org', '_blank')}
              className="text-xs"
            >
              {language === 'en' ? '📧 Get Temp Email' : '📧 獲取臨時郵箱'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SMTP Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t.smtpConfig}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-gray-500">{t.smtpHost}</Label>
              <p className="font-mono text-sm">smtp-relay.brevo.com</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">{t.smtpPort}</Label>
              <p className="font-mono text-sm">587</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">{t.smtpUser}</Label>
              <p className="font-mono text-sm">9d7ac7001@smtp-brevo.com</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">{t.smtpSender}</Label>
              <p className="font-mono text-sm">support@casewhr.com</p>
            </div>
          </div>
          
          <div className="mt-4">
            <Button
              onClick={testConnection}
              disabled={testingConnection}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {testingConnection ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.testing}
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  {t.testConnection}
                </>
              )}
            </Button>
          </div>
          
          {connectionStatus && (
            <div className="mt-4">
              {connectionStatus.status === 'success' ? (
                <div className="flex items-start gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">{t.testSuccess}</p>
                    {connectionStatus.message?.config && (
                      <pre className="mt-2 text-xs bg-green-50 p-2 rounded overflow-auto">
                        {JSON.stringify(connectionStatus.message.config, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-red-600">
                  <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">{t.testFailed}</p>
                    <p className="mt-1">{String(connectionStatus.message)}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Composer */}
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Templates */}
          <div>
            <Label className="mb-2 block">{t.quickTemplates}</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTemplateSelect('welcome')}
              >
                {t.template.welcome}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTemplateSelect('withdrawal')}
              >
                {t.template.withdrawal}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTemplateSelect('payment')}
              >
                {t.template.payment}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTemplateSelect('custom')}
              >
                {t.template.custom}
              </Button>
            </div>
          </div>

          {/* Email Form */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="toEmail">{t.recipient} *</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setToEmail('davidlai117@yahoo.com.tw')}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Yahoo
                  </button>
                  <span className="text-xs text-gray-400">|</span>
                  <button
                    type="button"
                    onClick={() => window.open('https://temp-mail.org', '_blank')}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {language === 'en' ? 'Get Temp Email' : '獲取臨時郵箱'}
                  </button>
                </div>
              </div>
              <Input
                id="toEmail"
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder={t.recipientPlaceholder}
              />
              <p className="text-xs text-gray-500 mt-1">
                {language === 'en' 
                  ? '💡 Tip: Try Gmail or a temp email if Yahoo blocks emails' 
                  : '💡 提示：如果 Yahoo 阻擋郵件，請嘗試 Gmail 或臨時郵箱'}
              </p>
            </div>

            <div>
              <Label htmlFor="subject">{t.subject} *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t.subjectPlaceholder}
              />
            </div>

            <div>
              <Label htmlFor="message">{t.message}</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.messagePlaceholder}
                rows={18}
                className="min-h-[400px]"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useTemplate"
                checked={useTemplate}
                onChange={(e) => setUseTemplate(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="useTemplate" className="cursor-pointer">
                {t.useTemplate}
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={sendTestEmail}
                disabled={sending}
                className="w-full"
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.sending}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {t.sendTestEmail}
                  </>
                )}
              </Button>
              
              <Button
                onClick={fetchBrevoActivity}
                disabled={loadingActivity}
                variant="outline"
                className="w-full"
              >
                {loadingActivity ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === 'en' ? 'Loading...' : '載入中...'}
                  </>
                ) : (
                  <>
                    <TestTube className="mr-2 h-4 w-4" />
                    {language === 'en' ? 'Check Brevo Activity' : '檢查 Brevo 活動'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brevo Real Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {language === 'en' ? 'Real Brevo Email Activity (Last 7 Days)' : 'Brevo 實際郵件活動（最近 7 天）'}
            </CardTitle>
            <Button
              onClick={fetchBrevoActivity}
              disabled={loadingActivity}
              size="sm"
              variant="outline"
            >
              {loadingActivity ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'en' ? 'Loading...' : '載入中...'}
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  {language === 'en' ? 'Refresh' : '刷新'}
                </>
              )}
            </Button>
          </div>
          <CardDescription>
            {language === 'en' 
              ? 'This shows ACTUAL emails sent from your Brevo account - if your test emails don\'t appear here, they were never sent to Brevo.'
              : '這顯示從您的 Brevo 帳戶實際發送的郵件 - 如果您的測試郵件沒有出現在這裡示它們從未發送到 Brevo。'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {brevoActivity.length === 0 && !loadingActivity ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="mb-4">
                {language === 'en' 
                  ? 'Click "Refresh" to load recent emails from Brevo'
                  : '點擊「刷新」以從 Brevo 載入最近的郵件'}
              </p>
            </div>
          ) : brevoActivity.length === 0 && loadingActivity ? (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 mx-auto mb-3 animate-spin text-gray-400" />
              <p className="text-gray-500">{language === 'en' ? 'Loading...' : '載入中...'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {brevoActivity.slice(0, 10).map((event: any, index: number) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  <div className="flex-shrink-0 mt-1">
                    {event.event === 'delivered' || event.event === 'sent' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : event.event === 'opened' ? (
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    ) : event.event === 'blocked' || event.event === 'hard_bounce' ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">{event.subject || 'No subject'}</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        event.event === 'delivered' ? 'bg-green-100 text-green-700' :
                        event.event === 'opened' ? 'bg-blue-100 text-blue-700' :
                        event.event === 'blocked' || event.event === 'hard_bounce' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {event.event}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {language === 'en' ? 'To' : '收件人'}: {event.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      {language === 'en' ? 'Date' : '日期'}: {new Date(event.date || event.time).toLocaleString()}
                    </p>
                    {event.reason && (
                      <p className="text-xs text-red-600 mt-1">
                        {language === 'en' ? 'Reason' : '原因'}: {event.reason}
                      </p>
                    )}
                    {event.message_id && (
                      <p className="text-xs text-gray-400 font-mono mt-1">
                        ID: {event.message_id}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Local Email Logs */}
      <Card>
        <CardHeader>
          <CardTitle>{t.recentLogs} ({language === 'en' ? 'Local' : '本地'})</CardTitle>
          <CardDescription>
            {language === 'en'
              ? 'These are logs from this testing session only'
              : '這些是僅來自此測試會話的日誌'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>{t.noLogs}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emailLogs.map((log, idx) => (
                <div
                  key={log.id || idx}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  <div className="flex-shrink-0 mt-1">
                    {log.status === 'sent' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">{log.subject}</p>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {t.recipient}: {log.to}
                    </p>
                    {(log.response || log.smtpResponse) && (
                      <p className="text-xs text-gray-500 font-mono mt-1">
                        {t.response}: {log.response || log.smtpResponse}
                      </p>
                    )}
                    {log.messageId && (
                      <p className="text-xs text-gray-400 font-mono mt-1">
                        Message ID: {log.messageId}
                      </p>
                    )}
                    {log.error && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {log.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}