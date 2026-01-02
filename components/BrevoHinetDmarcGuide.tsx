import { Copy, CheckCircle2, AlertTriangle, Info, Edit, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export function BrevoHinetDmarcGuide() {
  const [copied, setCopied] = useState(false);
  
  // 當前配置（從截圖看到的）
  const currentRecord = 'v=DMARC1; p=none; rua=mailto:nag@smtp.brevo.com';
  
  // 推薦的新配置（保留 Brevo 報告郵箱）
  const newRecord = 'v=DMARC1; p=quarantine; pct=10; rua=mailto:nag@smtp.brevo.com; ruf=mailto:nag@smtp.brevo.com; fo=1; adkim=r; aspf=r';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('已複製到剪貼簿！');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 重要發現 */}
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-900">
          <span className="font-semibold">✅ 好消息！您已經有 DMARC 記錄了！</span>
          <p className="mt-2">
            我看到您的 Hinet DNS 中已經配置了 DMARC 記錄（第 5 行），並且使用 Brevo 的報告郵箱。
            這是一個很好的起點！現在只需要<strong>更新</strong>（而非新增）記錄即可。
          </p>
        </AlertDescription>
      </Alert>

      {/* 當前狀態分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 當前 DMARC 配置分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 當前配置 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-yellow-50">當前配置</Badge>
                <span className="text-sm text-gray-600">（來自您的 Hinet DNS）</span>
              </div>
              <div className="bg-gray-900 text-gray-100 p-3 rounded-lg">
                <code className="text-sm break-all">{currentRecord}</code>
              </div>
            </div>

            {/* 問題說明 */}
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-900">
                <strong>當前狀態：僅監控模式 (p=none)</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>✅ <strong>優點：</strong>收集報告，了解郵件發送情況</li>
                  <li>❌ <strong>缺點：</strong>沒有實際保護，MX Toolbox 顯示警告</li>
                  <li>❌ <strong>缺點：</strong>Mail Tester 評分較低（可能 7-8 分）</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Brevo 報告說明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">📧 關於 Brevo 報告郵箱</h4>
              <p className="text-sm text-blue-800">
                您使用的 <code className="bg-blue-100 px-1 rounded">rua=mailto:nag@smtp.brevo.com</code> 是 Brevo 的報告收集郵箱。
                這意���著：
              </p>
              <ul className="mt-2 space-y-1 text-sm text-blue-800">
                <li>✅ Brevo 會自動收集和分析 DMARC 報告</li>
                <li>✅ 您可以在 Brevo 後台查看郵件驗證統計</li>
                <li>✅ 不需要手動處理報告郵件</li>
                <li>💡 建議保持使用 Brevo 的郵箱，更方便管理</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 推薦的新配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 推薦的新配置（立即改善）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-green-500">推薦配置</Badge>
                <span className="text-sm text-gray-600">（保留 Brevo 報告郵箱）</span>
              </div>
              <div className="bg-gray-900 text-gray-100 p-3 rounded-lg mb-2">
                <code className="text-sm break-all">{newRecord}</code>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(newRecord)}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    已複製！
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    複製新配置
                  </>
                )}
              </Button>
            </div>

            {/* 改進說明 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">✨ 這個配置的改進：</h4>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowRight className="h-4 w-4 text-green-600" />
                    <span className="font-semibold">策略升級</span>
                  </div>
                  <p className="text-gray-700">
                    <code className="bg-gray-100 px-1 rounded">p=none</code> → 
                    <code className="bg-green-100 px-1 rounded ml-1">p=quarantine</code>
                  </p>
                  <p className="text-xs text-gray-600 mt-1">開始保護域名</p>
                </div>

                <div className="bg-white rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowRight className="h-4 w-4 text-green-600" />
                    <span className="font-semibold">漸進式應用</span>
                  </div>
                  <p className="text-gray-700">
                    新增 <code className="bg-green-100 px-1 rounded">pct=10</code>
                  </p>
                  <p className="text-xs text-gray-600 mt-1">僅影響 10%，安全測試</p>
                </div>

                <div className="bg-white rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowRight className="h-4 w-4 text-green-600" />
                    <span className="font-semibold">詳細報告</span>
                  </div>
                  <p className="text-gray-700">
                    新增 <code className="bg-green-100 px-1 rounded">ruf=...</code>
                  </p>
                  <p className="text-xs text-gray-600 mt-1">失敗時發送詳細報告</p>
                </div>

                <div className="bg-white rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowRight className="h-4 w-4 text-green-600" />
                    <span className="font-semibold">對齊模式</span>
                  </div>
                  <p className="text-gray-700">
                    新增 <code className="bg-green-100 px-1 rounded">adkim=r; aspf=r</code>
                  </p>
                  <p className="text-xs text-gray-600 mt-1">寬鬆對齊，更安全</p>
                </div>
              </div>
            </div>

            {/* 預期效果 */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2">📈 更新後的預期效果：</h4>
              <div className="space-y-2 text-sm text-purple-800">
                <div className="flex items-center justify-between bg-white rounded p-2">
                  <span>MX Toolbox 狀態</span>
                  <span>
                    <span className="text-red-600 line-through">❌ Policy Not Enabled</span>
                    <ArrowRight className="inline h-3 w-3 mx-2" />
                    <span className="text-green-600">✅ Pass</span>
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white rounded p-2">
                  <span>Mail Tester 評分</span>
                  <span>
                    <span className="text-yellow-600">7-8/10</span>
                    <ArrowRight className="inline h-3 w-3 mx-2" />
                    <span className="text-green-600">9-10/10</span>
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white rounded p-2">
                  <span>域名保護</span>
                  <span>
                    <span className="text-gray-600">無</span>
                    <ArrowRight className="inline h-3 w-3 mx-2" />
                    <span className="text-green-600">10% 隔離保護</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hinet DNS 更新步驟 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            如何在 Hinet DNS 中更新記錄
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {/* 步驟 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  1
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">登入 Hinet DNS 管理系統</h3>
                <p className="text-gray-600 mb-2">
                  回到您剛才截圖的頁面：<br/>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                    https://dmngr.hinet.net/DNSHosting/dns_mg_02ms.userdata.paged-client.php
                  </code>
                </p>
              </div>
            </div>

            {/* 步驟 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  2
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">找到第 5 行的 _dmarc 記錄</h3>
                <p className="text-gray-600 mb-2">
                  在列表中找到：
                </p>
                <div className="bg-gray-50 border rounded-lg p-3">
                  <div className="grid grid-cols-[100px_80px_80px_1fr] gap-2 text-sm">
                    <span className="text-gray-600">主機名稱：</span>
                    <span className="col-span-3"><code>_dmarc</code></span>
                    <span className="text-gray-600">TTL：</span>
                    <span className="col-span-3"><code>86400</code></span>
                    <span className="text-gray-600">類型：</span>
                    <span className="col-span-3"><code>TXT</code></span>
                    <span className="text-gray-600">當前值：</span>
                    <span className="col-span-3"><code className="text-xs">v=DMARC1; p=none; rua=mailto:nag@smtp.brevo.com</code></span>
                  </div>
                </div>
              </div>
            </div>

            {/* 步驟 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                  3
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">點擊「編輯」按鈕</h3>
                <p className="text-gray-600 mb-2">
                  在第 5 行的右側，應該有一個「編輯」或「修改」按鈕（可能是藍色或灰色的按鈕）
                </p>
                <Alert className="border-orange-200 bg-orange-50">
                  <Info className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-900 text-sm">
                    <strong>重要：</strong>是「編輯」現有記錄，不是「刪除」或「新增」！
                    刪除舊記錄再新增可能會導致短暫的 DNS 中斷。
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            {/* 步驟 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  4
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">替換記錄值</h3>
                <p className="text-gray-600 mb-3">
                  在記錄值欄位中，將原本的內容替換為新的配置：
                </p>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">🗑️ 刪除舊值：</label>
                    <div className="bg-red-50 border border-red-200 rounded p-2 mt-1">
                      <code className="text-xs text-red-800 break-all">{currentRecord}</code>
                    </div>
                  </div>

                  <div className="text-center">
                    <ArrowRight className="h-5 w-5 mx-auto text-gray-400" />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">✅ 貼上新值：</label>
                    <div className="bg-green-50 border border-green-200 rounded p-2 mt-1">
                      <code className="text-xs text-green-800 break-all">{newRecord}</code>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => copyToClipboard(newRecord)}
                    >
                      <Copy className="h-3 w-3 mr-2" />
                      複製新值
                    </Button>
                  </div>
                </div>

                <Alert className="border-blue-200 bg-blue-50 mt-3">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900 text-sm">
                    <strong>確認要點：</strong>
                    <ul className="mt-1 space-y-1">
                      <li>✓ 主機名稱保持 <code className="bg-blue-100 px-1 rounded">_dmarc</code></li>
                      <li>✓ 類型保持 <code className="bg-blue-100 px-1 rounded">TXT</code></li>
                      <li>✓ TTL 可以保持 86400 或改為 3600</li>
                      <li>✓ 只有「記錄值」需要更新</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            {/* 步驟 5 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  5
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">儲存變更</h3>
                <p className="text-gray-600 mb-2">
                  點擊「儲存」、「確認」或「更新」按鈕
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-900">
                    ✅ 系統應該會顯示「更新成功」的訊息
                  </p>
                </div>
              </div>
            </div>

            {/* 步驟 6 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                  6
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">等待生效並驗證</h3>
                <p className="text-gray-600 mb-2">
                  等待 1-2 小時後，使用工具驗證：
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://mxtoolbox.com/dmarc.aspx', '_blank')}
                  >
                    MX Toolbox
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://www.mail-tester.com', '_blank')}
                  >
                    Mail Tester
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 後續升級路徑 */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 後續升級路徑（1-4 週後）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-gray-600">
              更新為 <code className="bg-gray-100 px-1 rounded">p=quarantine; pct=10</code> 運行 1 週後，
              如果 Brevo 報告顯示一切正常，可以逐步提升保護：
            </p>

            <div className="space-y-2">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="outline">第 1 週</Badge>
                    <span className="ml-2 text-sm">p=quarantine; pct=10</span>
                  </div>
                  <span className="text-xs text-gray-600">← 當前推薦</span>
                </div>
              </div>

              <div className="bg-gray-50 border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="outline">第 2 週</Badge>
                    <span className="ml-2 text-sm">p=quarantine; pct=50</span>
                  </div>
                  <span className="text-xs text-gray-600">提升保護</span>
                </div>
              </div>

              <div className="bg-gray-50 border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="outline">第 3-4 週</Badge>
                    <span className="ml-2 text-sm">p=quarantine; pct=100</span>
                  </div>
                  <span className="text-xs text-gray-600">完整保護</span>
                </div>
              </div>

              <div className="bg-gray-50 border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="outline">未來目標</Badge>
                    <span className="ml-2 text-sm">p=reject; pct=100</span>
                  </div>
                  <span className="text-xs text-gray-600">最高安全性</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 快速總結 */}
      <Alert className="border-purple-200 bg-purple-50">
        <Info className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-900">
          <strong>📝 快速總結：</strong>
          <ol className="mt-2 space-y-1 text-sm list-decimal list-inside">
            <li>您已經有 DMARC 了，只需要<strong>編輯</strong>（不是新增）</li>
            <li>保持使用 Brevo 的報告郵箱（<code className="bg-purple-100 px-1 rounded">nag@smtp.brevo.com</code>）</li>
            <li>只需要更新記錄值，將 <code className="bg-purple-100 px-1 rounded">p=none</code> 改為 <code className="bg-purple-100 px-1 rounded">p=quarantine; pct=10</code></li>
            <li>等待 1-2 小時生效，然後檢查 MX Toolbox</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  );
}