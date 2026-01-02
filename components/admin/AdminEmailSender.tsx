import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Send, CheckCircle, XCircle, Loader2, TestTube } from 'lucide-react';
import { toast } from 'sonner';
import { projectId } from '../../utils/supabase/info';

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

export function AdminEmailSender() {
  const { language } = useLanguage();
  const { accessToken } = useAuth();
  const [sending, setSending] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  
  // Form state
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const content = {
    en: {
      title: 'Send Email',
      description: 'Send emails to users',
      testConnection: 'Test SMTP Connection',
      sendTestEmail: 'Send Email',
      recipient: 'Recipient Email',
      recipientPlaceholder: 'user@example.com',
      subject: 'Email Subject',
      subjectPlaceholder: 'Test Email from Case Where',
      message: 'Email Message',
      messagePlaceholder: 'Enter your email content here...',
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
      enterEmail: 'Please enter a recipient email',
      sendFailed: 'Failed to send email',
    },
    'zh-TW': {
      title: '🚀✨ 發送郵件 ✨🚀',
      description: '向用戶發送郵件',
      testConnection: '測試 SMTP 連接',
      sendTestEmail: '發送郵件',
      recipient: '收件人郵箱',
      recipientPlaceholder: 'user@example.com',
      subject: '郵件主旨',
      subjectPlaceholder: 'Case Where 測試郵件',
      message: '郵件內容',
      messagePlaceholder: '在此輸入郵件內容...',
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
      enterEmail: '請輸入收件人郵箱',
      sendFailed: '郵件發送失敗',
    },
  };

  const t = content[language as keyof typeof content] || content['zh-TW'];

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
    if (!toEmail.trim()) {
      toast.error(t.enterEmail);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(toEmail.trim())) {
      toast.error(language === 'en' ? 'Please enter a valid email address' : '請輸入有效的電子郵件地址');
      return;
    }

    setSending(true);
    setEmailLogs([]);
    
    try {
      const testSubject = subject.trim() || (language === 'en' ? 'Test Email from Case Where' : 'Case Where 測試郵件');
      const testMessage = message.trim() || (language === 'en' 
        ? `<p>This is a test email from Case Where Platform.</p><p>If you received this, email delivery is working correctly!</p><p>Sent at: ${new Date().toLocaleString()}</p>`
        : `<p>這是來自 Case Where 平台的測試郵件。</p><p>如果您收到此郵件，表示郵件發送功能正常！</p><p>發送時間：${new Date().toLocaleString('zh-TW')}</p>`
      );
      
      console.log('📧 Sending email to:', toEmail.trim());

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
      
      if (response.ok && data.success) {
        const newLog: EmailLog = {
          timestamp: new Date().toISOString(),
          to: toEmail.trim(),
          subject: testSubject,
          status: 'sent',
          messageId: data.messageId,
          smtpResponse: data.response,
        };
        setEmailLogs(prev => [newLog, ...prev]);
        
        toast.success(t.emailSent, { duration: 5000 });
        
        toast.info((language === 'en'
          ? '⚠️ Check your SPAM folder if you do not see the email'
          : '⚠️ 如果收不到郵件請檢查垃圾郵件文件夾'
        ), { duration: 10000 });

        setToEmail('');
        setSubject('');
        setMessage('');
      } else {
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
      console.error('Error sending email:', error);
      
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* SMTP Connection Test */}
          <div>
            <Button
              onClick={testConnection}
              disabled={testingConnection}
              variant="outline"
              className="w-full"
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
            
            {connectionStatus && (
              <div className={`mt-2 p-3 rounded-lg ${
                connectionStatus.status === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {connectionStatus.status === 'success' ? (
                  <CheckCircle className="inline h-4 w-4 mr-2" />
                ) : (
                  <XCircle className="inline h-4 w-4 mr-2" />
                )}
                {typeof connectionStatus.message === 'string' 
                  ? connectionStatus.message 
                  : JSON.stringify(connectionStatus.message)}
              </div>
            )}
          </div>

          {/* Email Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="toEmail">{t.recipient} *</Label>
              <Input
                id="toEmail"
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder={t.recipientPlaceholder}
              />
            </div>

            <div>
              <Label htmlFor="subject">{t.subject}</Label>
              <Input
                id="subject"
                type="text"
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
          </div>
        </CardContent>
      </Card>

      {/* Email Logs */}
      {emailLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.recentLogs}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emailLogs.map((log, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    log.status === 'sent'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {log.status === 'sent' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium">{log.to}</span>
                      </div>
                      <p className="text-sm text-gray-600">{log.subject}</p>
                      {log.error && (
                        <p className="text-sm text-red-600 mt-1">{log.error}</p>
                      )}
                      {log.smtpResponse && (
                        <p className="text-xs text-gray-500 mt-1">{log.smtpResponse}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}