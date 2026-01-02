import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Mail, 
  CheckCircle2, 
  AlertTriangle,
  ExternalLink,
  Copy,
  Info,
  Settings,
  Plus,
  Eye,
  Code
} from 'lucide-react';
import { toast } from 'sonner';

interface SenderEmail {
  email: string;
  name: string;
  purpose: string;
  status: 'active' | 'pending' | 'need-verify';
  configLocation: string;
  brevoVerified: boolean;
}

export function EmailSenderConfig() {
  const [copied, setCopied] = useState<string>('');
  const [showCode, setShowCode] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success('已複製到剪貼簿！');
    setTimeout(() => setCopied(''), 2000);
  };

  // 當前和計劃中的發件人郵箱
  const senderEmails: SenderEmail[] = [
    {
      email: 'support@casewhr.com',
      name: 'Case Where Support',
      purpose: '客戶支援、系統通知、一般郵件',
      status: 'active',
      configLocation: '/supabase/functions/server/email_service_brevo.tsx',
      brevoVerified: true
    },
    {
      email: 'admin@casewhr.com',
      name: 'Case Where Admin',
      purpose: '管理員通知、系統警報、內部郵件',
      status: 'need-verify',
      configLocation: '可在 email_service_brevo.tsx 中配置',
      brevoVerified: false
    },
    {
      email: 'noreply@casewhr.com',
      name: 'Case Where No-Reply',
      purpose: '自動通知、不需回覆的郵件',
      status: 'pending',
      configLocation: '建議添加（可選）',
      brevoVerified: false
    },
    {
      email: 'billing@casewhr.com',
      name: 'Case Where Billing',
      purpose: '帳單、付款、訂閱相關郵件',
      status: 'pending',
      configLocation: '建議添加（可選）',
      brevoVerified: false
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">✅ 已啟用</Badge>;
      case 'pending':
        return <Badge className="bg-gray-500">💡 建議添加</Badge>;
      case 'need-verify':
        return <Badge className="bg-orange-500">⚠️ 需要驗證</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  // 添加 admin@casewhr.com 的代碼範例
  const codeExample = `// 📍 文件位置：/supabase/functions/server/email_service_brevo.tsx

// 方案 A：動態發件人（推薦）
// 可根據郵件類型自動選擇發件人

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  senderType?: 'support' | 'admin' | 'noreply' | 'billing'; // 新增
}

export async function sendEmail(options: EmailOptions) {
  // ... existing code ...
  
  // 🎯 根據 senderType 選擇發件人
  const getSenderInfo = (type?: string) => {
    switch (type) {
      case 'admin':
        return { name: 'Case Where Admin', address: 'admin@casewhr.com' };
      case 'noreply':
        return { name: 'Case Where', address: 'noreply@casewhr.com' };
      case 'billing':
        return { name: 'Case Where Billing', address: 'billing@casewhr.com' };
      case 'support':
      default:
        return { name: 'Case Where', address: 'support@casewhr.com' };
    }
  };
  
  const mailOptions = {
    from: getSenderInfo(options.senderType), // ✨ 使用動態發件人
    to: options.to,
    subject: options.subject,
    html: options.html,
    replyTo: options.replyTo || 'support@casewhr.com',
    // ... rest of the code
  };
  
  // ... rest of the code
}

// 使用範例：
// await sendEmail({
//   to: 'user@example.com',
//   subject: '系統警報',
//   html: '<h1>警報內容</h1>',
//   senderType: 'admin' // ✨ 使用 admin@casewhr.com 發送
// });

// ==========================================

// 方案 B：固定發件人（簡單）
// 直接修改固定的發件人地址

const mailOptions = {
  from: {
    name: 'Case Where Admin', // 修改顯示名稱
    address: 'admin@casewhr.com' // ✨ 修改為 admin@casewhr.com
  },
  to: options.to,
  subject: options.subject,
  html: options.html,
  replyTo: options.replyTo || 'admin@casewhr.com', // 也修改回覆地址
  // ... rest of the code
};`;

  return (
    <div className="space-y-6">
      {/* 標題 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>發件人郵箱管理</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                管理 Case Where 平台的發件人郵箱配置
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 當前配置說明 */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>📍 當前發件人配置位置：</strong>
          <p className="mt-2 font-mono text-sm bg-white p-2 rounded">
            /supabase/functions/server/email_service_brevo.tsx
          </p>
          <p className="mt-2 text-sm">
            目前系統使用 <code className="bg-blue-100 px-2 py-0.5 rounded">support@casewhr.com</code> 作為預設發件人。
            您可以添加更多發件人郵箱以區分不同類型的郵件。
          </p>
        </AlertDescription>
      </Alert>

      {/* 發件人列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📧 發件人郵箱列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {senderEmails.map((sender, index) => (
              <div 
                key={index}
                className={`border rounded-lg p-4 ${
                  sender.status === 'active' 
                    ? 'bg-green-50 border-green-200' 
                    : sender.status === 'need-verify'
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Mail className={`h-5 w-5 ${
                      sender.status === 'active' ? 'text-green-600' :
                      sender.status === 'need-verify' ? 'text-orange-600' :
                      'text-gray-600'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{sender.email}</h3>
                        {getStatusBadge(sender.status)}
                      </div>
                      <p className="text-sm text-gray-600">{sender.name}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(sender.email, sender.email)}
                  >
                    {copied === sender.email ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-2" />
                        已複製
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-2" />
                        複製
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-600 min-w-[80px]">用途：</span>
                    <span className="text-gray-800">{sender.purpose}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-600 min-w-[80px]">配置位置：</span>
                    <code className="text-xs bg-white px-2 py-1 rounded">{sender.configLocation}</code>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-600 min-w-[80px]">Brevo 驗證：</span>
                    <span className={sender.brevoVerified ? 'text-green-600' : 'text-orange-600'}>
                      {sender.brevoVerified ? '✅ 已驗證' : '❌ 需要在 Brevo 中添加並驗證'}
                    </span>
                  </div>
                </div>

                {/* 行動按鈕 */}
                {sender.email === 'admin@casewhr.com' && (
                  <div className="mt-3 pt-3 border-t border-orange-200">
                    <p className="text-sm text-orange-800 mb-2">
                      <strong>⚠️ 需要執行的操作：</strong>
                    </p>
                    <div className="space-y-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open('https://app.brevo.com', '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        1. 在 Brevo 中添加並驗證 admin@casewhr.com
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setShowCode(!showCode)}
                      >
                        <Code className="h-3 w-3 mr-2" />
                        2. {showCode ? '隱藏' : '查看'}代碼配置範例
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 代碼範例 */}
      {showCode && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Code className="h-5 w-5" />
              如何添加 admin@casewhr.com
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <strong>提供兩種方案：</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• <strong>方案 A（推薦）：</strong>動態發件人 - 可根據郵件類型自動選擇</li>
                    <li>• <strong>方案 B（簡單）：</strong>固定發件人 - 直接修改為 admin@casewhr.com</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-gray-100 text-xs">
                  <code>{codeExample}</code>
                </pre>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(codeExample, 'code')}
              >
                {copied === 'code' ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-2" />
                    已複製代碼
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-2" />
                    複製完整代碼
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 添加新發件人的步驟 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            添加新發件人的完整步驟
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 步驟 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">在 Brevo 中添加發件人郵箱</h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                  <p><strong>操作步驟：</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>登入 Brevo 後台：https://app.brevo.com</li>
                    <li>前往：Settings → Senders & IP</li>
                    <li>點擊「Add a Sender」</li>
                    <li>輸入郵箱：<code className="bg-white px-2 py-0.5 rounded">admin@casewhr.com</code></li>
                    <li>輸入名稱：<code className="bg-white px-2 py-0.5 rounded">Case Where Admin</code></li>
                    <li>點擊「Save」</li>
                    <li>Brevo 會發送驗證郵件到您的 Zoho Mail</li>
                  </ol>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => window.open('https://app.brevo.com/settings/senders', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    前往 Brevo Senders 設定
                  </Button>
                </div>
              </div>
            </div>

            {/* 步驟 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">在 Zoho Mail 中驗證</h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                  <p><strong>操作步驟：</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>登入 Zoho Mail：https://mail.zoho.com</li>
                    <li>檢查 admin@casewhr.com 的收件箱</li>
                    <li>找到來自 Brevo 的驗證郵件</li>
                    <li>點擊郵件中的驗證連結</li>
                    <li>確認狀態變為 ✅ Verified</li>
                  </ol>
                  <Alert className="border-orange-200 bg-orange-50 mt-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-900 text-xs">
                      <strong>⚠️ 前提：</strong>您需要先在 Zoho Mail 中創建 admin@casewhr.com 郵箱！
                      如果還沒有創建，請先前往 Zoho Mail 控制台添加。
                    </AlertDescription>
                  </Alert>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => window.open('https://mail.zoho.com', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    前往 Zoho Mail
                  </Button>
                </div>
              </div>
            </div>

            {/* 步驟 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">修改代碼配置</h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                  <p><strong>選擇方案：</strong></p>
                  <div className="space-y-3 mt-2">
                    <div className="bg-white border border-green-200 rounded p-3">
                      <p className="font-semibold text-green-900 mb-1">✅ 方案 A：動態發件人（推薦）</p>
                      <ul className="text-xs text-green-800 space-y-1 ml-4">
                        <li>• 可根據郵件類型自動選擇發件人</li>
                        <li>• 支援多個發件人（support、admin、noreply、billing）</li>
                        <li>• 更靈活，適合大型系統</li>
                        <li>• 需要修改 EmailOptions interface 和 sendEmail 函數</li>
                      </ul>
                    </div>

                    <div className="bg-white border border-blue-200 rounded p-3">
                      <p className="font-semibold text-blue-900 mb-1">✅ 方案 B：固定發件人（簡單）</p>
                      <ul className="text-xs text-blue-800 space-y-1 ml-4">
                        <li>• 直接將所有郵件改為從 admin@casewhr.com 發送</li>
                        <li>• 配置簡單，只需修改 2 行代碼</li>
                        <li>• 適合小型系統或測試</li>
                        <li>• 修改位置：mailOptions.from</li>
                      </ul>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => setShowCode(true)}
                  >
                    <Eye className="h-3 w-3 mr-2" />
                    查看完整代碼範例
                  </Button>
                </div>
              </div>
            </div>

            {/* 步驟 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">測試新發件人</h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                  <p><strong>驗證步驟：</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>前往「郵件管理中心」→「測試郵件」標籤</li>
                    <li>發送測試郵件到您的個人郵箱</li>
                    <li>檢查發件人是否顯示為 admin@casewhr.com</li>
                    <li>確認郵件未進入垃圾郵件夾</li>
                    <li>檢查郵件頭部資訊（可選）</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 注意事項 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            重要注意事項
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-900">
                <strong>🚨 DNS 記錄問題：</strong>
                <p className="mt-2 text-sm">
                  添加新的發件人郵箱（如 admin@casewhr.com）<strong>不需要</strong>修改 DNS 記錄！
                  您的 SPF、DKIM、DMARC 記錄是針對整個域名 <code className="bg-red-100 px-1 rounded">casewhr.com</code>，
                  而不是特定的郵箱地址。
                </p>
                <p className="mt-2 text-sm">
                  只要域名的 DNS 配置正確，所有 @casewhr.com 的郵箱都可以使用。
                </p>
              </AlertDescription>
            </Alert>

            <Alert className="border-orange-200 bg-orange-50">
              <Info className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900">
                <strong>📧 Zoho Mail 郵箱：</strong>
                <p className="mt-2 text-sm">
                  使用新的發件人郵箱前，需要先在 Zoho Mail 中創建對應的郵箱帳號。
                  例如要使用 admin@casewhr.com，需要先在 Zoho 控制台中添加這個郵箱。
                </p>
              </AlertDescription>
            </Alert>

            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>✅ Brevo 驗證：</strong>
                <p className="mt-2 text-sm">
                  在 Brevo 中添加新發件人後，必須完成郵箱驗證（點擊驗證郵件中的連結）。
                  未驗證的發件人無法發送郵件。
                </p>
              </AlertDescription>
            </Alert>

            <Alert className="border-purple-200 bg-purple-50">
              <Settings className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-900">
                <strong>🎯 建議配置順序：</strong>
                <ol className="mt-2 text-sm space-y-1 list-decimal list-inside">
                  <li>先在 Zoho Mail 創建 admin@casewhr.com 郵箱</li>
                  <li>然後在 Brevo 中添加並驗證此郵箱</li>
                  <li>最後修改代碼配置</li>
                  <li>發送測試郵件驗證</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* 快速連結 */}
      <Card>
        <CardHeader>
          <CardTitle>🔗 快速連結</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.open('https://app.brevo.com/settings/senders', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Brevo - Senders 管理
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.open('https://mail.zoho.com', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Zoho Mail 登入
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.open('https://mailadmin.zoho.com', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Zoho Mail 控制台
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.open('https://mxtoolbox.com/SuperTool.aspx', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              MX Toolbox - 驗證工具
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}