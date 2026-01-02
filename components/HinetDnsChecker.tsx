import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Copy, 
  ExternalLink,
  Search,
  Shield,
  Mail,
  Key,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

interface DnsRecord {
  name: string;
  type: string;
  current: string;
  status: 'good' | 'warning' | 'error' | 'missing';
  recommended?: string;
  explanation: string;
  priority: 'high' | 'medium' | 'low';
  action?: string;
}

export function HinetDnsChecker() {
  const [copied, setCopied] = useState<string>('');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success('已複製到剪貼簿！');
    setTimeout(() => setCopied(''), 2000);
  };

  // 根據截圖和 Brevo 配置分析的 DNS 記錄
  const dnsRecords: DnsRecord[] = [
    {
      name: 'DMARC',
      type: 'TXT (_dmarc)',
      current: 'v=DMARC1; p=none; rua=mailto:nag@smtp.brevo.com',
      status: 'warning',
      recommended: 'v=DMARC1; p=quarantine; pct=10; rua=mailto:nag@smtp.brevo.com; ruf=mailto:nag@smtp.brevo.com; fo=1; adkim=r; aspf=r',
      explanation: '目前僅監控模式 (p=none)，沒有實際保護。需要改為 quarantine 模式。',
      priority: 'high',
      action: '編輯第 5 行記錄，將 p=none 改為 p=quarantine; pct=10'
    },
    {
      name: 'SPF',
      type: 'TXT (@)',
      current: '需要檢查是否存在',
      status: 'warning',
      recommended: 'v=spf1 include:spf.brevo.com ~all',
      explanation: 'SPF 記錄指定哪些伺服器可以代表您的域名發送郵件。使用 Brevo SMTP，必須包含 Brevo 的 SPF。',
      priority: 'high',
      action: '檢查是否有 SPF 記錄。如果沒有，需要新增；如果有，確認包含 include:spf.brevo.com'
    },
    {
      name: 'DKIM (Brevo)',
      type: 'TXT (mail._domainkey)',
      current: '需要檢查是否存在',
      status: 'warning',
      recommended: '需要從 Brevo 後台獲取',
      explanation: 'DKIM 為郵件添加數位簽章，證明郵件確實來自您的域名。Brevo 會提供特定的 DKIM 記錄。',
      priority: 'high',
      action: '1. 登入 Brevo 後台 → Settings → Senders & IP\n2. 找到 casewhr.com 的 DKIM 記錄\n3. 複製並添加到 Hinet DNS'
    },
    {
      name: 'MX 記錄',
      type: 'MX (@)',
      current: '需要檢查',
      status: 'warning',
      recommended: '取決於您使用的郵件服務',
      explanation: 'MX 記錄指定接收郵件的伺服器。如果使用 Google Workspace、Microsoft 365 或其他服務，需要設定對應的 MX 記錄。',
      priority: 'medium',
      action: '確認 MX 記錄指向正確的郵件伺服器'
    },
    {
      name: 'TXT 記錄 (@)',
      type: 'TXT (@)',
      current: '需要檢查根域名的 TXT 記錄',
      status: 'warning',
      recommended: '可能包含多筆記錄（SPF、域名驗證等）',
      explanation: '根域名的 TXT 記錄通常包含 SPF、域名驗證碼等重要資訊。',
      priority: 'medium',
      action: '檢查根域名 (@) 的所有 TXT 記錄'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Search className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-500">高優先</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">中優先</Badge>;
      case 'low':
        return <Badge className="bg-blue-500">低優先</Badge>;
      default:
        return <Badge variant="outline">檢查</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 標題 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
              <Search className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>Hinet DNS 完整健康檢查</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                檢查所有郵件相關的 DNS 記錄配置
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 整體狀態摘要 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 檢查摘要
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-red-900">高優先</span>
              </div>
              <div className="text-2xl font-bold text-red-900">3</div>
              <p className="text-xs text-red-700 mt-1">需要立即處理</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold text-yellow-900">中優先</span>
              </div>
              <div className="text-2xl font-bold text-yellow-900">2</div>
              <p className="text-xs text-yellow-700 mt-1">建議檢查</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-900">總計</span>
              </div>
              <div className="text-2xl font-bold text-green-900">5</div>
              <p className="text-xs text-green-700 mt-1">項目需要檢查</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 詳細檢查項目 */}
      <div className="space-y-4">
        {dnsRecords.map((record, index) => (
          <Card key={index} className={getStatusColor(record.status)}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* 標題行 */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(record.status)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{record.name}</h3>
                        {getPriorityBadge(record.priority)}
                      </div>
                      <p className="text-sm text-gray-600">
                        記錄類型：<code className="bg-white px-2 py-0.5 rounded">{record.type}</code>
                      </p>
                    </div>
                  </div>
                  {record.name === 'DMARC' && (
                    <Shield className="h-6 w-6 text-gray-400" />
                  )}
                  {record.name === 'SPF' && (
                    <Mail className="h-6 w-6 text-gray-400" />
                  )}
                  {record.name.includes('DKIM') && (
                    <Key className="h-6 w-6 text-gray-400" />
                  )}
                  {record.name.includes('MX') && (
                    <Globe className="h-6 w-6 text-gray-400" />
                  )}
                </div>

                {/* 說明 */}
                <Alert className="border-gray-200 bg-white">
                  <AlertDescription className="text-gray-700">
                    {record.explanation}
                  </AlertDescription>
                </Alert>

                {/* 當前狀態 */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    當前配置：
                  </label>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded-lg">
                    <code className="text-sm break-all">{record.current}</code>
                  </div>
                </div>

                {/* 推薦配置 */}
                {record.recommended && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      推薦配置：
                    </label>
                    <div className="bg-green-900 text-green-100 p-3 rounded-lg">
                      <code className="text-sm break-all">{record.recommended}</code>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => copyToClipboard(record.recommended!, record.name)}
                    >
                      {copied === record.name ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-2" />
                          已複製！
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-2" />
                          複製推薦配置
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* 操作建議 */}
                {record.action && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">🔧 需要執行的操作：</h4>
                    <pre className="text-sm text-blue-800 whitespace-pre-wrap font-sans">
                      {record.action}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SPF 檢查詳細說明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            SPF 記錄檢查步驟
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-900">
              <strong>什麼是 SPF？</strong><br />
              SPF (Sender Policy Framework) 指定哪些 IP 或伺服器可以代表您的域名發送郵件。
              這是防止郵件偽造的第一道防線。
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h4 className="font-semibold">在 Hinet DNS 中檢查 SPF：</h4>
            
            <div className="bg-gray-50 border rounded-lg p-4 space-y-2">
              <p className="text-sm"><strong>步驟 1：</strong> 在您的 Hinet DNS 記錄列表中，查找：</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• 主機名稱：<code className="bg-white px-2 py-0.5 rounded">@</code> 或空白</li>
                <li>• 類型：<code className="bg-white px-2 py-0.5 rounded">TXT</code></li>
                <li>• 值包含：<code className="bg-white px-2 py-0.5 rounded">v=spf1</code></li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-yellow-900 mb-2">如果找到 SPF 記錄：</p>
              <p className="text-sm text-yellow-800 mb-2">
                確認記錄中包含 <code className="bg-white px-2 py-0.5 rounded">include:spf.brevo.com</code>
              </p>
              <p className="text-sm text-yellow-800">
                完整記錄範例：
              </p>
              <div className="bg-gray-900 text-gray-100 p-2 rounded mt-2">
                <code className="text-xs">v=spf1 include:spf.brevo.com ~all</code>
              </div>
              <p className="text-xs text-yellow-700 mt-2">
                如果您使用其他郵件服務（如 Google Workspace），記錄可能是：<br />
                <code className="bg-white px-2 py-0.5 rounded">v=spf1 include:_spf.google.com include:spf.brevo.com ~all</code>
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-900 mb-2">如果沒有找到 SPF 記錄：</p>
              <p className="text-sm text-red-800 mb-2">
                需要新增一筆 TXT 記錄：
              </p>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <span className="text-red-700">主機名稱：</span>
                  <code className="bg-white px-2 py-0.5 rounded">@</code>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <span className="text-red-700">類型：</span>
                  <code className="bg-white px-2 py-0.5 rounded">TXT</code>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <span className="text-red-700">值：</span>
                  <code className="bg-white px-2 py-0.5 rounded">v=spf1 include:spf.brevo.com ~all</code>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <span className="text-red-700">TTL：</span>
                  <code className="bg-white px-2 py-0.5 rounded">3600</code>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => copyToClipboard('v=spf1 include:spf.brevo.com ~all', 'SPF')}
              >
                <Copy className="h-3 w-3 mr-2" />
                複製 SPF 記錄值
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DKIM 檢查詳細說明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            DKIM 記錄設定（Brevo）
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-900">
              <strong>什麼是 DKIM？</strong><br />
              DKIM (DomainKeys Identified Mail) 為您的郵件添加數位簽章，
              證明郵件確實來自您的域名且未被篡改。這是郵件驗證的核心技術。
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h4 className="font-semibold">從 Brevo 獲取 DKIM 記錄：</h4>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-2">登入 Brevo 後台</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open('https://app.brevo.com', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    前往 Brevo
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-1">導航到設定頁面</p>
                  <p className="text-sm text-gray-600">
                    Settings → Senders, Domains & Dedicated IPs → Domains
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-1">找到您的域名</p>
                  <p className="text-sm text-gray-600">
                    在列表中找到 <code className="bg-gray-100 px-2 py-0.5 rounded">casewhr.com</code>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-1">查看 DKIM 設定</p>
                  <p className="text-sm text-gray-600 mb-2">
                    點擊域名旁的「Authenticate」或「查看」按鈕
                  </p>
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertDescription className="text-yellow-900 text-sm">
                      Brevo 會顯示需要添加的 DKIM 記錄，通常格式如下：
                      <div className="mt-2 bg-white p-2 rounded text-xs font-mono">
                        Host: mail._domainkey<br />
                        Type: TXT<br />
                        Value: k=rsa; p=MIGfMA0GCSqGSIb3D...（一長串文字）
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
                  5
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-1">添加到 Hinet DNS</p>
                  <p className="text-sm text-gray-600">
                    將 Brevo 提供的 DKIM 記錄添加到您的 Hinet DNS 中
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">💡 重要提示：</h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• DKIM 記錄值很長（通常 200-400 個字元）</li>
              <li>• 必須完整複製，不能有任何遺漏</li>
              <li>• 主機名稱通常是 <code className="bg-white px-1 rounded">mail._domainkey</code></li>
              <li>• 添加後需要在 Brevo 中點擊「驗證」按鈕</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 檢查工具連結 */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 線上檢查工具</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            使用以下工具檢查您的 DNS 記錄配置：
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.open('https://mxtoolbox.com/SuperTool.aspx', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              MX Toolbox - 全方位檢查
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.open('https://mxtoolbox.com/spf.aspx', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              MX Toolbox - SPF 檢查
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.open('https://mxtoolbox.com/dkim.aspx', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              MX Toolbox - DKIM 檢查
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.open('https://mxtoolbox.com/dmarc.aspx', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              MX Toolbox - DMARC 檢查
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.open('https://www.mail-tester.com', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Mail Tester - 整體評分
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.open('https://toolbox.googleapps.com/apps/checkmx/', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Google Check MX
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 優先順序建議 */}
      <Card>
        <CardHeader>
          <CardTitle>📋 建議的處理順序</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <Badge className="bg-red-500 flex-shrink-0">第1優先</Badge>
              <div>
                <p className="font-semibold">更新 DMARC 記錄</p>
                <p className="text-sm text-gray-600">
                  將 p=none 改為 p=quarantine; pct=10（立即改善 MX Toolbox 評分）
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <Badge className="bg-red-500 flex-shrink-0">第2優先</Badge>
              <div>
                <p className="font-semibold">檢查/添加 SPF 記錄</p>
                <p className="text-sm text-gray-600">
                  確保包含 include:spf.brevo.com（必須項目）
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <Badge className="bg-red-500 flex-shrink-0">第3優先</Badge>
              <div>
                <p className="font-semibold">添加 DKIM 記錄</p>
                <p className="text-sm text-gray-600">
                  從 Brevo 後台獲取並添加（完善郵件驗證三要素）
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <Badge className="bg-yellow-500 flex-shrink-0">第4優先</Badge>
              <div>
                <p className="font-semibold">檢查 MX 記錄</p>
                <p className="text-sm text-gray-600">
                  確認郵件接收伺服器配置正確
                </p>
              </div>
            </div>
          </div>

          <Alert className="border-blue-200 bg-blue-50 mt-4">
            <AlertDescription className="text-blue-900 text-sm">
              <strong>📌 預期時間：</strong>
              <ul className="mt-2 space-y-1">
                <li>• 第 1 項（DMARC）：5 分鐘</li>
                <li>• 第 2 項（SPF）：5-10 分鐘</li>
                <li>• 第 3 項（DKIM）：10-15 分鐘</li>
                <li>• 總計：約 20-30 分鐘即可完成所有設定</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}