import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../lib/LanguageContext';

export function EmailDiagnosticTool() {
  const { user, accessToken } = useAuth();
  const { language } = useLanguage();
  const [email, setEmail] = useState('david.lai18@gmail.com');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);

  const checkEmailStatus = async () => {
    if (!email) {
      toast.error('请输入邮箱地址');
      return;
    }

    setChecking(true);
    setResult(null);

    try {
      console.log('🔍 [Email Diagnostic] Checking email:', email);

      // 1. 检查用户 Profile
      const profileResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/check-user-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      const profileData = await profileResponse.json();

      // 2. 发送测试邮件
      const testEmailResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/test-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email,
            language: language === 'en' ? 'en' : 'zh'
          }),
        }
      );

      const testEmailData = await testEmailResponse.json();

      setResult({
        profile: profileData,
        testEmail: testEmailData,
        timestamp: new Date().toISOString(),
      });

      if (testEmailData.success) {
        toast.success('测试邮件已发送！请检查收件箱');
      } else {
        toast.error('发送测试邮件失败：' + testEmailData.error);
      }

    } catch (error: any) {
      console.error('❌ [Email Diagnostic] Error:', error);
      toast.error('检查失败：' + error.message);
      setResult({
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card className="border-2 border-purple-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          📧 邮件系统诊断工具
        </CardTitle>
        <CardDescription>
          检查用户邮箱配置和系统邮件发送状态
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="diagnostic-email">用户邮箱</Label>
          <Input
            id="diagnostic-email"
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <Button 
          onClick={checkEmailStatus} 
          disabled={checking}
          className="w-full"
        >
          {checking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              检查中...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              开始检查
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-4 mt-6">
            <Alert className={result.error ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}>
              <AlertDescription>
                <div className="space-y-3">
                  <div className="font-semibold text-lg">
                    {result.error ? '❌ 检查失败' : '✅ 检查完成'}
                  </div>

                  {result.error && (
                    <div className="text-red-800">
                      <strong>错误：</strong> {result.error}
                    </div>
                  )}

                  {result.profile && (
                    <div className="bg-white rounded p-3 border">
                      <div className="font-semibold mb-2 flex items-center gap-2">
                        {result.profile.found ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        用户 Profile 状态
                      </div>
                      {result.profile.found ? (
                        <div className="text-sm space-y-1">
                          <div>✅ 找到用户 Profile</div>
                          <div>📧 邮箱：{result.profile.email}</div>
                          <div>👤 姓名：{result.profile.name || '未设置'}</div>
                          <div>🌍 语言：{result.profile.language || '未设置'}</div>
                          <div>🆔 用户ID：{result.profile.user_id}</div>
                        </div>
                      ) : (
                        <div className="text-sm text-red-600">
                          ❌ 未找到该邮箱对应的用户 Profile
                        </div>
                      )}
                    </div>
                  )}

                  {result.testEmail && (
                    <div className="bg-white rounded p-3 border">
                      <div className="font-semibold mb-2 flex items-center gap-2">
                        {result.testEmail.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        测试邮件状态
                      </div>
                      {result.testEmail.success ? (
                        <div className="text-sm space-y-1">
                          <div>✅ 测试邮件已发送</div>
                          <div>📨 邮件ID：{result.testEmail.emailId}</div>
                          <div>📧 服务：{result.testEmail.service}</div>
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                            <AlertCircle className="h-4 w-4 inline mr-1" />
                            <strong>请检查：</strong>
                            <ul className="ml-4 mt-1 text-xs">
                              <li>• 收件箱</li>
                              <li>• 垃圾邮件文件夹</li>
                              <li>• 促销邮件分类（Gmail）</li>
                              <li>• 其他邮件分类</li>
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-red-600 space-y-1">
                          <div>❌ 发送失败</div>
                          <div>错误：{result.testEmail.error}</div>
                          {result.testEmail.details && (
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                              {JSON.stringify(result.testEmail.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    检查时间：{new Date(result.timestamp).toLocaleString('zh-TW')}
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <Alert className="border-blue-300 bg-blue-50">
              <AlertDescription>
                <div className="text-sm text-blue-900">
                  <strong>📋 系统邮件通知功能：</strong>
                  <ul className="ml-4 mt-2 space-y-1 text-xs">
                    <li>✅ 项目发布成功</li>
                    <li>✅ 收到新提案</li>
                    <li>✅ 提案被接受/拒绝</li>
                    <li>✅ 交付物提交</li>
                    <li>✅ 交付物审核结果</li>
                    <li>✅ 款项到账</li>
                    <li>✅ 订阅成功/续费</li>
                    <li>✅ 钱包充值成功</li>
                    <li>✅ 收到新评价</li>
                    <li>✅ 余额不足警告</li>
                  </ul>
                  <p className="mt-3 text-xs">
                    <strong>注意：</strong>所有邮件都从 support@casewhr.com 发送。
                    如果没有收到邮件，请检查垃圾邮件文件夹。
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
