import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Cloud, 
  CloudOff,
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Info,
  ExternalLink,
  Shield,
  Mail,
  Key,
  Globe,
  Settings
} from 'lucide-react';

export function CloudflareEmailDnsGuide() {
  const [checkResult, setCheckResult] = useState<'checking' | 'cloudflare' | 'hinet' | null>(null);

  const checkDnsProvider = async () => {
    setCheckResult('checking');
    
    // 模擬檢查過程
    setTimeout(() => {
      // 這裡應該實際檢查 DNS，但在前端我們提供手動判斷指引
      setCheckResult(null);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* 標題 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg">
              <Cloud className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>CloudFlare 與郵件 DNS 配置指南</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                檢查 CloudFlare 是否影響您的郵件 DNS 設定
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 關鍵問題 */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-900">
          <strong>🔍 關鍵問題：您的域名 DNS 是由誰管理？</strong>
          <div className="mt-2 space-y-1 text-sm">
            <p>• <strong>選項 A：</strong> Hinet DNS（dmngr.hinet.net）</p>
            <p>• <strong>選項 B：</strong> CloudFlare DNS（cloudflare.com）</p>
            <p>• <strong>選項 C：</strong> 其他 DNS 服務商</p>
          </div>
        </AlertDescription>
      </Alert>

      {/* 快速判斷方法 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 快速判斷方法
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">方法 1：檢查您的 DNS 管理介面</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p><strong>如果您是在這個頁面管理 DNS：</strong></p>
                <div className="bg-white rounded p-2 font-mono text-xs break-all">
                  https://dmngr.hinet.net/DNSHosting/dns_mg_02ms.userdata.paged-client.php
                </div>
                <div className="mt-2 p-3 bg-green-100 border border-green-300 rounded">
                  <p className="font-semibold text-green-900">✅ 您使用的是 Hinet DNS（不是 CloudFlare）</p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-blue-800">
                <p><strong>如果您是在這個頁面管理 DNS：</strong></p>
                <div className="bg-white rounded p-2 font-mono text-xs break-all">
                  https://dash.cloudflare.com/
                </div>
                <div className="mt-2 p-3 bg-orange-100 border border-orange-300 rounded">
                  <p className="font-semibold text-orange-900">⚠️ 您使用的是 CloudFlare（需要特別注意）</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-3">方法 2：使用線上工具檢查</h3>
              <div className="space-y-3">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => window.open('https://www.whatsmydns.net/#NS/casewhr.com', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  檢查 casewhr.com 的 NS 記錄
                </Button>
                <div className="text-sm text-purple-800 space-y-2">
                  <p><strong>檢查結果說明：</strong></p>
                  <div className="bg-white rounded p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-semibold">如果顯示 Hinet NS：</p>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
                          ns1.hinet.net<br/>
                          ns2.hinet.net
                        </code>
                        <p className="text-xs text-green-700 mt-1">→ 您使用 Hinet DNS（不受 CloudFlare 影響）</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 mt-3">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                      <div>
                        <p className="font-semibold">如果顯示 CloudFlare NS：</p>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
                          xxx.ns.cloudflare.com<br/>
                          yyy.ns.cloudflare.com
                        </code>
                        <p className="text-xs text-orange-700 mt-1">→ 您使用 CloudFlare DNS（需要特別配置）</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 情況 A：使用 Hinet DNS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudOff className="h-5 w-5 text-green-600" />
            情況 A：使用 Hinet DNS（未使用 CloudFlare）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>✅ 好消息：不受 CloudFlare 影響！</strong>
                <p className="mt-2">
                  如果您的 DNS 是由 Hinet 直接管理，完全不需要擔心 CloudFlare 的問題。
                  您只需要按照之前的 DNS 檢查清單配置即可。
                </p>
              </AlertDescription>
            </Alert>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">您需要做的事：</h4>
              <div className="space-y-2 text-sm text-green-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>前往 Hinet DNS 管理介面</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>按照「DNS 檢查」標籤的指引配置記錄</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>完成 DMARC、SPF、DKIM 設定</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>等待 1-2 小時 DNS 生效</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>💡 提示：</strong> Hinet DNS 的優勢是配置簡單、穩定可靠。
                您不需要擔心代理模式、緩存等複雜問題。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 情況 B：使用 CloudFlare DNS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-orange-600" />
            情況 B：使用 CloudFlare DNS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900">
                <strong>⚠️ 需要特別注意！CloudFlare 會影響郵件 DNS 配置</strong>
                <p className="mt-2">
                  CloudFlare 的「Proxy 代理模式」（橘色雲朵 🟠）會影響某些 DNS 記錄。
                  郵件相關的記錄必須設為「DNS Only 模式」（灰色雲朵 ⚫）。
                </p>
              </AlertDescription>
            </Alert>

            {/* CloudFlare Proxy 模式說明 */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold mb-3">🌐 CloudFlare 兩種模式的區別：</h4>
              
              <div className="grid md:grid-cols-2 gap-4">
                {/* Proxied 模式 */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                    <span className="font-semibold text-orange-900">Proxied（代理）</span>
                  </div>
                  <p className="text-sm text-orange-800 mb-2">橘色雲朵 🟠</p>
                  <ul className="text-xs text-orange-700 space-y-1">
                    <li>✓ 流量經過 CloudFlare</li>
                    <li>✓ 提供 CDN、DDoS 防護</li>
                    <li>✓ 隱藏真實 IP</li>
                    <li>✗ <strong>不適用於郵件記錄</strong></li>
                  </ul>
                </div>

                {/* DNS Only 模式 */}
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full bg-gray-500"></div>
                    <span className="font-semibold text-gray-900">DNS Only</span>
                  </div>
                  <p className="text-sm text-gray-800 mb-2">灰色雲朵 ⚫</p>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>✓ 僅提供 DNS 解析</li>
                    <li>✓ 流量直達源站</li>
                    <li>✓ <strong>郵件記錄必須使用</strong></li>
                    <li>✓ 不影響郵件驗證</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CloudFlare 郵件 DNS 配置步驟 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">📋 CloudFlare 中配置郵件 DNS 的正確步驟：</h4>
              
              <div className="space-y-3">
                {/* 步驟 1 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 mb-1">登入 CloudFlare Dashboard</p>
                    <p className="text-sm text-blue-800">選擇您的域名 casewhr.com</p>
                  </div>
                </div>

                {/* 步驟 2 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 mb-1">進入 DNS 管理頁面</p>
                    <p className="text-sm text-blue-800">點擊左側選單的「DNS」</p>
                  </div>
                </div>

                {/* 步驟 3 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-orange-900 mb-2">
                      <strong>⚠️ 關鍵步驟：</strong> 確保郵件相關記錄是「DNS Only」模式
                    </p>
                    <div className="bg-white rounded p-3 space-y-2 text-sm">
                      <p className="font-semibold text-gray-900">必須設為 DNS Only（灰色雲朵）的記錄：</p>
                      <div className="space-y-1 text-gray-700">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-blue-600" />
                          <code className="bg-gray-100 px-2 py-0.5 rounded">MX 記錄</code>
                          <span className="text-xs">（郵件接收）</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-purple-600" />
                          <code className="bg-gray-100 px-2 py-0.5 rounded">TXT @ (SPF)</code>
                          <span className="text-xs">（發件人驗證）</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-green-600" />
                          <code className="bg-gray-100 px-2 py-0.5 rounded">TXT mail._domainkey (DKIM)</code>
                          <span className="text-xs">（郵件簽章）</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-orange-600" />
                          <code className="bg-gray-100 px-2 py-0.5 rounded">TXT _dmarc (DMARC)</code>
                          <span className="text-xs">（郵件策略）</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 步驟 4 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 mb-2">如何切換為 DNS Only 模式？</p>
                    <div className="bg-white rounded p-3">
                      <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                        <li>找到對應的 DNS 記錄</li>
                        <li>點擊記錄右側的「編輯」按鈕</li>
                        <li>查看「Proxy status」欄位</li>
                        <li>
                          <strong>如果是橘色雲朵 🟠</strong>：點擊切換為灰色雲朵 ⚫
                        </li>
                        <li>儲存變更</li>
                      </ol>
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-xs text-yellow-800">
                          ⚠️ <strong>重要：</strong>MX 和 TXT 記錄通常預設就是 DNS Only，
                          但仍需要檢查確認！
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CloudFlare 特定記錄配置 */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-3">📝 在 CloudFlare 中添加郵件 DNS 記錄：</h4>
              
              <div className="space-y-4">
                {/* SPF */}
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <h5 className="font-semibold">SPF 記錄</h5>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                    <span className="text-gray-600">Type:</span>
                    <code className="bg-gray-100 px-2 py-0.5 rounded">TXT</code>
                    
                    <span className="text-gray-600">Name:</span>
                    <code className="bg-gray-100 px-2 py-0.5 rounded">@</code>
                    
                    <span className="text-gray-600">Content:</span>
                    <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">v=spf1 include:spf.brevo.com ~all</code>
                    
                    <span className="text-gray-600">TTL:</span>
                    <code className="bg-gray-100 px-2 py-0.5 rounded">Auto</code>
                    
                    <span className="text-gray-600">Proxy:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                      <span className="font-semibold text-gray-700">DNS Only</span>
                    </div>
                  </div>
                </div>

                {/* DKIM */}
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="h-4 w-4 text-green-600" />
                    <h5 className="font-semibold">DKIM 記錄</h5>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                    <span className="text-gray-600">Type:</span>
                    <code className="bg-gray-100 px-2 py-0.5 rounded">TXT</code>
                    
                    <span className="text-gray-600">Name:</span>
                    <code className="bg-gray-100 px-2 py-0.5 rounded">mail._domainkey</code>
                    
                    <span className="text-gray-600">Content:</span>
                    <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">（從 Brevo 獲取）</code>
                    
                    <span className="text-gray-600">TTL:</span>
                    <code className="bg-gray-100 px-2 py-0.5 rounded">Auto</code>
                    
                    <span className="text-gray-600">Proxy:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                      <span className="font-semibold text-gray-700">DNS Only</span>
                    </div>
                  </div>
                </div>

                {/* DMARC */}
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-orange-600" />
                    <h5 className="font-semibold">DMARC 記錄</h5>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                    <span className="text-gray-600">Type:</span>
                    <code className="bg-gray-100 px-2 py-0.5 rounded">TXT</code>
                    
                    <span className="text-gray-600">Name:</span>
                    <code className="bg-gray-100 px-2 py-0.5 rounded">_dmarc</code>
                    
                    <span className="text-gray-600">Content:</span>
                    <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">v=DMARC1; p=quarantine; pct=10; rua=mailto:nag@smtp.brevo.com; ruf=mailto:nag@smtp.brevo.com; fo=1; adkim=r; aspf=r</code>
                    
                    <span className="text-gray-600">TTL:</span>
                    <code className="bg-gray-100 px-2 py-0.5 rounded">Auto</code>
                    
                    <span className="text-gray-600">Proxy:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                      <span className="font-semibold text-gray-700">DNS Only</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CloudFlare 常見問題 */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-3">❌ CloudFlare 常見錯誤：</h4>
              <div className="space-y-3 text-sm text-red-800">
                <div className="bg-white rounded p-3">
                  <p className="font-semibold mb-1">錯誤 1：MX 記錄開啟 Proxy 模式</p>
                  <p className="text-xs">結果：無法接收郵件</p>
                  <p className="text-xs text-green-700 mt-1">✓ 解決：將 MX 記錄改為 DNS Only</p>
                </div>

                <div className="bg-white rounded p-3">
                  <p className="font-semibold mb-1">錯誤 2：TXT 記錄（SPF/DKIM）開啟 Proxy</p>
                  <p className="text-xs">結果：郵件驗證失敗，進入垃圾郵件夾</p>
                  <p className="text-xs text-green-700 mt-1">✓ 解決：所有郵件 TXT 記錄都要 DNS Only</p>
                </div>

                <div className="bg-white rounded p-3">
                  <p className="font-semibold mb-1">錯誤 3：CloudFlare 緩存問題</p>
                  <p className="text-xs">結果：DNS 更新後仍顯示舊值</p>
                  <p className="text-xs text-green-700 mt-1">✓ 解決：在 CloudFlare 中「Purge Cache」或等待更長時間</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 驗證工具 */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 驗證您的配置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              無論使用 Hinet 還是 CloudFlare，都可以用以下工具驗證：
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
                onClick={() => window.open('https://www.whatsmydns.net/#NS/casewhr.com', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                檢查 NS 記錄（判斷 DNS 服務商）
              </Button>

              <Button
                variant="outline"
                className="justify-start"
                onClick={() => window.open('https://mxtoolbox.com/spf.aspx', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                SPF 記錄檢查
              </Button>

              <Button
                variant="outline"
                className="justify-start"
                onClick={() => window.open('https://mxtoolbox.com/dkim.aspx', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                DKIM 記錄檢查
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 總結建議 */}
      <Card>
        <CardHeader>
          <CardTitle>📋 總結建議</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">✅ 如果您使用 Hinet DNS：</h4>
              <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                <li>不需要擔心 CloudFlare 問題</li>
                <li>按照「DNS 檢查」標籤的指引配置即可</li>
                <li>配置簡單，穩定可靠</li>
              </ul>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-2">⚠️ 如果您使用 CloudFlare DNS：</h4>
              <ul className="text-sm text-orange-800 space-y-1 list-disc list-inside">
                <li>所有郵件相關記錄必須設為 DNS Only（灰色雲朵）</li>
                <li>包括：MX、TXT (@)、TXT (_dmarc)、TXT (mail._domainkey)</li>
                <li>配置後使用 MX Toolbox 驗證</li>
                <li>注意 CloudFlare 可能有緩存延遲</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">💡 最佳實踐：</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>先確認您使用的是哪個 DNS 服務商</li>
                <li>根據實際情況選擇對應的配置方法</li>
                <li>配置完成後必須驗證（不要假設已生效）</li>
                <li>如有疑問，優先檢查 NS 記錄確認 DNS 服務商</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
