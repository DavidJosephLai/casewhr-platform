import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  CheckCircle2,
  Circle,
  Mail,
  ExternalLink,
  Code,
  TestTube,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Info
} from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  action?: {
    label: string;
    url?: string;
    onClick?: () => void;
  };
  details?: string[];
}

export function AdminEmailNextSteps() {
  const [showCode, setShowCode] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]); // Step 1 已完成

  const toggleStep = (stepId: number) => {
    if (completedSteps.includes(stepId)) {
      setCompletedSteps(completedSteps.filter(id => id !== stepId));
    } else {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const steps: Step[] = [
    {
      id: 1,
      title: '在 Zoho Mail 創建 admin@casewhr.com',
      description: '✅ 已完成！郵箱已在 Zoho Mail 中創建',
      status: 'completed',
      details: [
        '郵箱地址：admin@casewhr.com',
        '顯示名稱：Case Where Admin',
        '可以登入：https://mail.zoho.com',
      ]
    },
    {
      id: 2,
      title: '在 Brevo 中添加並驗證 admin@casewhr.com',
      description: '這是最重要的步驟！必須在 Brevo 中驗證此郵箱才能發送郵件',
      status: completedSteps.includes(2) ? 'completed' : 'current',
      action: {
        label: '前往 Brevo 添加發件人',
        url: 'https://app.brevo.com/settings/senders'
      },
      details: [
        '1. 登入 Brevo 後台',
        '2. 前往 Settings → Senders & IP',
        '3. 點擊「Add a Sender」',
        '4. 填寫 Email: admin@casewhr.com',
        '5. 填寫 Name: Case Where Admin',
        '6. 點擊「Save」',
        '7. Brevo 會發送驗證郵件',
      ]
    },
    {
      id: 3,
      title: '在 Zoho Mail 中接收並驗證郵件',
      description: '登入 admin@casewhr.com 郵箱，點擊 Brevo 發送的驗證連結',
      status: completedSteps.includes(3) ? 'completed' : (completedSteps.includes(2) ? 'current' : 'pending'),
      action: {
        label: '前往 Zoho Mail 查看',
        url: 'https://mail.zoho.com'
      },
      details: [
        '1. 前往 https://mail.zoho.com',
        '2. 登入 admin@casewhr.com',
        '3. 檢查收件箱',
        '4. 找到來自 Brevo 的驗證郵件',
        '5. 點擊郵件中的「Verify Email」按鈕',
        '6. 確認頁面顯示驗證成功',
      ]
    },
    {
      id: 4,
      title: '確認 Brevo 中的驗證狀態',
      description: '返回 Brevo 確認 admin@casewhr.com 顯示為已驗證（綠色勾選）',
      status: completedSteps.includes(4) ? 'completed' : (completedSteps.includes(3) ? 'current' : 'pending'),
      action: {
        label: '檢查 Brevo 驗證狀態',
        url: 'https://app.brevo.com/settings/senders'
      },
      details: [
        '1. 登入 Brevo 後台',
        '2. 前往 Settings → Senders & IP',
        '3. 找到 admin@casewhr.com',
        '4. 確認狀態顯示 ✅ Verified',
        '5. 如果顯示 ❌ Not Verified，點擊「Resend」重新發送驗證郵件',
      ]
    },
    {
      id: 5,
      title: '修改代碼配置（選擇方案）',
      description: '在系統代碼中配置使用 admin@casewhr.com 作為發件人',
      status: completedSteps.includes(5) ? 'completed' : (completedSteps.includes(4) ? 'current' : 'pending'),
      action: {
        label: '查看代碼範例',
        onClick: () => setShowCode(!showCode)
      },
      details: [
        '方案 A（推薦）：動態發件人 - 可根據郵件類型選擇',
        '方案 B（簡單）：固定發件人 - 所有郵件使用 admin@casewhr.com',
        '修改文件：/supabase/functions/server/email_service_brevo.tsx',
      ]
    },
    {
      id: 6,
      title: '測試新發件人',
      description: '發送測試郵件確認 admin@casewhr.com 正常工作',
      status: completedSteps.includes(6) ? 'completed' : (completedSteps.includes(5) ? 'current' : 'pending'),
      action: {
        label: '前往測試郵件',
        onClick: () => {
          // 切換到測試郵件標籤
          const event = new CustomEvent('switchEmailTab', { detail: 'test' });
          window.dispatchEvent(event);
        }
      },
      details: [
        '1. 前往「測試郵件」標籤',
        '2. 發送測試郵件到您的個人郵箱',
        '3. 檢查發件人是否顯示為 admin@casewhr.com',
        '4. 確認郵件未進入垃圾郵件夾',
        '5. 查看郵件頭部確認發件人資訊',
      ]
    },
  ];

  const currentStep = steps.find(s => s.status === 'current');
  const completedCount = steps.filter(s => completedSteps.includes(s.id)).length;
  const progress = (completedCount / steps.length) * 100;

  // 代碼範例
  const codeExampleDynamic = `// 方案 A：動態發件人（推薦）
// 文件：/supabase/functions/server/email_service_brevo.tsx

// 1. 修改 EmailOptions interface
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  senderType?: 'support' | 'admin' | 'noreply' | 'billing'; // ← 新增
}

export async function sendEmail(options: EmailOptions) {
  // ... existing code ...
  
  // 2. 添加發件人選擇函數
  const getSenderInfo = (type?: string) => {
    switch (type) {
      case 'admin':
        return { 
          name: 'Case Where Admin', 
          address: 'admin@casewhr.com' 
        };
      case 'support':
      default:
        return { 
          name: 'Case Where', 
          address: 'support@casewhr.com' 
        };
    }
  };
  
  // 3. 修改 mailOptions
  const mailOptions = {
    from: getSenderInfo(options.senderType), // ← 使用動態發件人
    to: options.to,
    subject: options.subject,
    html: options.html,
    replyTo: options.replyTo || 'support@casewhr.com',
    // ... rest of the code
  };
  
  // ... rest of the code
}

// 使用範例：
// 使用 support@casewhr.com（預設）
await sendEmail({
  to: 'user@example.com',
  subject: '歡迎',
  html: '<h1>歡迎！</h1>'
});

// 使用 admin@casewhr.com
await sendEmail({
  to: 'user@example.com',
  subject: '系統警報',
  html: '<h1>警報</h1>',
  senderType: 'admin' // ← 指定使用 admin
});`;

  const codeExampleFixed = `// 方案 B：固定發件人（簡單）
// 文件：/supabase/functions/server/email_service_brevo.tsx

// 找到第 50-60 行左右，修改 mailOptions：

// 原始代碼：
const mailOptions = {
  from: {
    name: 'Case Where',
    address: 'support@casewhr.com'
  },
  to: options.to,
  subject: options.subject,
  html: options.html,
  replyTo: options.replyTo || 'support@casewhr.com',
  // ...
};

// 修改為：
const mailOptions = {
  from: {
    name: 'Case Where Admin',          // ← 修改這裡
    address: 'admin@casewhr.com'       // ← 修改這裡
  },
  to: options.to,
  subject: options.subject,
  html: options.html,
  replyTo: options.replyTo || 'admin@casewhr.com', // ← 可選：修改回覆地址
  // ...
};

// 這樣所有郵件都會從 admin@casewhr.com 發送`;

  return (
    <div className="space-y-6">
      {/* 慶祝標題 */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-green-900">🎉 太棒了！admin@casewhr.com 已創建！</CardTitle>
              <p className="text-sm text-green-700 mt-1">
                現在讓我們完成剩餘的配置步驟
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 進度條 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>📊 配置進度</span>
            <Badge className="bg-blue-500 text-lg px-3 py-1">
              {completedCount}/{steps.length} 完成
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 text-center">
              {progress === 100 ? '🎉 所有步驟已完成！' : `還有 ${steps.length - completedCount} 個步驟`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 當前步驟提示 */}
      {currentStep && (
        <Alert className="border-blue-200 bg-blue-50">
          <ArrowRight className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>👉 下一步：</strong> {currentStep.title}
            <p className="text-sm mt-1">{currentStep.description}</p>
          </AlertDescription>
        </Alert>
      )}

      {/* 步驟列表 */}
      <Card>
        <CardHeader>
          <CardTitle>📋 完整配置步驟</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`border rounded-lg p-4 transition-all ${
                  completedSteps.includes(step.id)
                    ? 'bg-green-50 border-green-200'
                    : step.status === 'current'
                    ? 'bg-blue-50 border-blue-300 shadow-md'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* 步驟圖標 */}
                  <div className="flex-shrink-0">
                    {completedSteps.includes(step.id) ? (
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                    ) : step.status === 'current' ? (
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
                        <span className="text-white font-bold">{step.id}</span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-bold">{step.id}</span>
                      </div>
                    )}
                  </div>

                  {/* 步驟內容 */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className={`font-semibold ${
                          completedSteps.includes(step.id)
                            ? 'text-green-900'
                            : step.status === 'current'
                            ? 'text-blue-900'
                            : 'text-gray-700'
                        }`}>
                          {step.title}
                        </h3>
                        <p className={`text-sm mt-1 ${
                          completedSteps.includes(step.id)
                            ? 'text-green-700'
                            : step.status === 'current'
                            ? 'text-blue-700'
                            : 'text-gray-600'
                        }`}>
                          {step.description}
                        </p>
                      </div>
                      
                      {/* 狀態標籤 */}
                      {completedSteps.includes(step.id) && (
                        <Badge className="bg-green-500">已完成</Badge>
                      )}
                      {step.status === 'current' && !completedSteps.includes(step.id) && (
                        <Badge className="bg-blue-500">進行中</Badge>
                      )}
                    </div>

                    {/* 詳細步驟 */}
                    {step.details && (
                      <div className="mt-3 p-3 bg-white rounded border">
                        <p className="text-xs font-semibold text-gray-700 mb-2">詳細步驟：</p>
                        <ul className="text-sm space-y-1">
                          {step.details.map((detail, idx) => (
                            <li key={idx} className="text-gray-600 flex items-start gap-2">
                              <span className="text-blue-500 flex-shrink-0">•</span>
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 行動按鈕 */}
                    {step.action && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            if (step.action!.url) {
                              window.open(step.action!.url, '_blank');
                            } else if (step.action!.onClick) {
                              step.action!.onClick();
                            }
                          }}
                          className={
                            completedSteps.includes(step.id)
                              ? ''
                              : step.status === 'current'
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : ''
                          }
                        >
                          {step.action.url ? (
                            <ExternalLink className="h-3 w-3 mr-2" />
                          ) : (
                            <Code className="h-3 w-3 mr-2" />
                          )}
                          {step.action.label}
                        </Button>
                        
                        {/* 標記完成按鈕 */}
                        {!completedSteps.includes(step.id) && step.id !== 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleStep(step.id)}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-2" />
                            標記為完成
                          </Button>
                        )}
                        
                        {/* 取消完成按鈕 */}
                        {completedSteps.includes(step.id) && step.id !== 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleStep(step.id)}
                          >
                            <Circle className="h-3 w-3 mr-2" />
                            取消完成
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 步驟 5 的代碼範例 */}
                {step.id === 5 && showCode && (
                  <div className="mt-4 space-y-4">
                    {/* 方案 A */}
                    <div className="bg-gray-900 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-green-400">方案 A：動態發件人（推薦）</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(codeExampleDynamic);
                            alert('已複製代碼！');
                          }}
                        >
                          複製代碼
                        </Button>
                      </div>
                      <pre className="text-gray-100 text-xs overflow-x-auto">
                        <code>{codeExampleDynamic}</code>
                      </pre>
                    </div>

                    {/* 方案 B */}
                    <div className="bg-gray-900 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-blue-400">方案 B：固定發件人（簡單）</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(codeExampleFixed);
                            alert('已複製代碼！');
                          }}
                        >
                          複製代碼
                        </Button>
                      </div>
                      <pre className="text-gray-100 text-xs overflow-x-auto">
                        <code>{codeExampleFixed}</code>
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 重要提醒 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            重要提醒
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Alert className="border-orange-200 bg-orange-50">
              <Mail className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900">
                <strong>📧 步驟 2-4 最關鍵！</strong>
                <p className="mt-2 text-sm">
                  必須在 Brevo 中驗證 admin@casewhr.com 後才能使用它發送郵件。
                  未驗證的發件人會被 Brevo 拒絕！
                </p>
              </AlertDescription>
            </Alert>

            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>💡 驗證郵件可能需要幾分鐘</strong>
                <p className="mt-2 text-sm">
                  如果沒有立即收到 Brevo 的驗證郵件，請等待 5-10 分鐘。
                  也可以檢查垃圾郵件夾。
                </p>
              </AlertDescription>
            </Alert>

            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>✅ DNS 記錄無需修改</strong>
                <p className="mt-2 text-sm">
                  您的 SPF、DKIM、DMARC 記錄是針對整個域名 casewhr.com 的，
                  所有 @casewhr.com 的郵箱都可以使用，無需額外配置 DNS！
                </p>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* 完成後效果 */}
      {progress === 100 && (
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Sparkles className="h-5 w-5" />
              🎉 恭喜！所有配置已完成！
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-green-800">
                您現在擁有兩個專業的發件人郵箱：
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="font-semibold text-green-900">support@casewhr.com</p>
                  <p className="text-sm text-green-700">客戶支援、一般郵件</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="font-semibold text-green-900">admin@casewhr.com</p>
                  <p className="text-sm text-green-700">管理員通知、系統警報</p>
                </div>
              </div>
              <Button
                className="w-full mt-4"
                onClick={() => {
                  const event = new CustomEvent('switchEmailTab', { detail: 'test' });
                  window.dispatchEvent(event);
                }}
              >
                <TestTube className="h-4 w-4 mr-2" />
                立即測試新發件人
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
