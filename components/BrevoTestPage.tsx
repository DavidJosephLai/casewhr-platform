import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle2, XCircle, Mail, Loader2, Server, Zap, Clock } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface BrevoTestPageProps {
  language: 'en' | 'zh';
}

export function BrevoTestPage({ language }: BrevoTestPageProps) {
  const [email, setEmail] = useState('davidlai234@hotmail.com'); // 預填用戶的 Hotmail 郵箱
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const content = language === 'en' ? {
    title: '📧 Brevo Email Test Center',
    subtitle: 'Test your email system with confidence',
    emailLabel: 'Recipient Email Address',
    emailPlaceholder: 'your-email@example.com',
    sendButton: 'Send Test Email Now',
    sending: 'Sending Email...',
    checkInbox: 'Please check your inbox (and spam folder)',
    smtpInfo: {
      title: '✅ SMTP Configuration Status',
      status: 'Ready to Send',
      host: 'Host: smtp-relay.brevo.com',
      port: 'Port: 587 (STARTTLS)',
      login: 'Login: 9d7ac7001@smtp-brevo.com',
      configured: '✅ All SMTP credentials are configured and ready'
    },
    testInfo: {
      title: '📋 What This Test Does',
      step1: '1. Connects to Brevo SMTP server',
      step2: '2. Sends a test email to your address',
      step3: '3. Verifies the email was sent successfully',
      step4: '4. Returns detailed status information'
    },
    quickGuide: {
      title: '🚀 Quick Start Guide',
      item1: '✓ Email is pre-filled with your address',
      item2: '✓ Just click the button below to send',
      item3: '✓ Check your inbox in a few seconds',
      item4: '✓ Look in spam folder if not received'
    }
  } : {
    title: '📧 Brevo 郵件測試中心',
    subtitle: '安心測試您的郵件系統',
    emailLabel: '收件人郵箱地址',
    emailPlaceholder: 'your-email@example.com',
    sendButton: '立即發送測試郵件',
    sending: '正在發送郵件...',
    checkInbox: '請檢查您的收件箱（包括垃圾郵件資料夾）',
    smtpInfo: {
      title: '✅ SMTP 配置狀態',
      status: '準備就緒',
      host: '主機：smtp-relay.brevo.com',
      port: '端口：587 (STARTTLS)',
      login: '登錄：9d7ac7001@smtp-brevo.com',
      configured: '✅ 所有 SMTP 憑證已配置並就緒'
    },
    testInfo: {
      title: '📋 此測試的功能',
      step1: '1. 連接到 Brevo SMTP 伺服器',
      step2: '2. 發送測試郵件到您的郵箱',
      step3: '3. 驗證郵件成功發送',
      step4: '4. 返回詳細狀態信息'
    },
    quickGuide: {
      title: '🚀 快速開始指南',
      item1: '✓ 郵箱已預填為您的地址',
      item2: '✓ 點擊下方按鈕即可發送',
      item3: '✓ 幾秒鐘後檢查收件箱',
      item4: '✓ 如未收到請查看垃圾郵件夾'
    }
  };

  const handleSendTest = async () => {
    if (!email) {
      setResult({
        success: false,
        message: language === 'en' ? 'Please enter an email address' : '請輸入郵箱地址'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/test-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email,
            language,
          }),
        }
      );

      const data = await response.json();
      
      setResult({
        success: response.ok,
        message: data.message || (response.ok ? 'Success!' : 'Failed'),
        details: data
      });
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Network error',
        details: { error: error.message }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-5xl mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {content.title}
        </h1>
        <p className="text-xl text-gray-600">{content.subtitle}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* SMTP Configuration Info */}
        <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Server className="w-6 h-6" />
              {content.smtpInfo.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-bold text-green-900 text-base">{content.smtpInfo.status}</p>
                <p className="text-green-800">{content.smtpInfo.host}</p>
                <p className="text-green-800">{content.smtpInfo.port}</p>
                <p className="text-green-800">{content.smtpInfo.login}</p>
                <p className="text-green-700 font-semibold mt-3">{content.smtpInfo.configured}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Guide */}
        <Card className="border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Zap className="w-6 h-6" />
              {content.quickGuide.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5 text-sm text-blue-900">
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                {content.quickGuide.item1}
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                {content.quickGuide.item2}
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                {content.quickGuide.item3}
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                {content.quickGuide.item4}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* What This Test Does */}
      <Card className="mb-6 border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Clock className="w-6 h-6" />
            {content.testInfo.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3 text-sm text-purple-900">
            <p className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">✓</span>
              {content.testInfo.step1}
            </p>
            <p className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">✓</span>
              {content.testInfo.step2}
            </p>
            <p className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">✓</span>
              {content.testInfo.step3}
            </p>
            <p className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">✓</span>
              {content.testInfo.step4}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Test Form */}
      <Card className="border-2 border-gray-300 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Mail className="w-7 h-7" />
            {content.sendButton}
          </CardTitle>
          <CardDescription className="text-blue-100">
            {content.checkInbox}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-base font-semibold">
                {content.emailLabel}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={content.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="mt-2 text-lg h-12 border-2"
              />
            </div>

            <Button
              onClick={handleSendTest}
              disabled={loading}
              className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {content.sending}
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 mr-2" />
                  {content.sendButton}
                </>
              )}
            </Button>

            {result && (
              <Alert className={`border-2 ${result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                <AlertDescription>
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`font-bold text-lg ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                        {result.message}
                      </p>
                      {result.success && (
                        <p className="text-green-700 mt-2 text-sm">
                          {language === 'en' 
                            ? '✅ Email sent successfully! Please check your inbox.' 
                            : '✅ 郵件發送成功！請檢查您的收件箱。'}
                        </p>
                      )}
                      {result.details && (
                        <details className="mt-3">
                          <summary className="text-sm cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
                            {language === 'en' ? '🔍 View Technical Details' : '🔍 查看技術詳情'}
                          </summary>
                          <pre className="text-xs mt-2 p-3 bg-white rounded border overflow-auto max-h-60">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BrevoTestPage;