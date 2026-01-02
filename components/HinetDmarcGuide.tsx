import { Copy, ExternalLink, CheckCircle2, AlertTriangle, Info, Phone, Mail, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export function HinetDmarcGuide() {
  const [copied, setCopied] = useState(false);
  
  const dmarcRecord = 'v=DMARC1; p=quarantine; pct=10; rua=mailto:dmarc-reports@casewhr.com; ruf=mailto:dmarc-reports@casewhr.com; fo=1; adkim=r; aspf=r';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('已複製到剪貼簿！');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 重要通知 */}
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-900">
          <span className="font-semibold">🔴 Hinet DNS 配置需要特別注意！</span>
          <p className="mt-2">
            Hinet（中華電信）的 DNS 管理系統與一般 DNS 服務不同，配置方式較為特殊。
            請仔細按照以下步驟操作，或聯繫 Hinet 技術支援協助。
          </p>
        </AlertDescription>
      </Alert>

      {/* DNS 記錄資訊 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📝 DMARC 記錄資訊
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-gray-400">DNS TXT 記錄</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(dmarcRecord)}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    已複製！
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    複製
                  </>
                )}
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-gray-400">記錄類型：</span>
                <span className="font-mono">TXT</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-gray-400">主機名稱：</span>
                <span className="font-mono">_dmarc.casewhr.com</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-gray-400">記錄值：</span>
                <span className="font-mono break-all">{dmarcRecord}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-gray-400">TTL：</span>
                <span className="font-mono">3600（或預設值）</span>
              </div>
            </div>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900 text-sm">
              <strong>重要提示：</strong>Hinet DNS 介面中，主機名稱欄位可能需要填入完整的 <code className="bg-blue-100 px-1 rounded">_dmarc.casewhr.com</code> 
              或僅填入 <code className="bg-blue-100 px-1 rounded">_dmarc</code>（視 Hinet 系統版本而定）。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Hinet DNS 配置步驟 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔧 Hinet DNS 配置步驟
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* 步驟 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  1
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">登入 Hinet 網域管理系統</h3>
                <p className="text-gray-600 mb-3">
                  前往 Hinet 的網域名稱管理頁面（通常在 Hinet 企業客戶服務平台）
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-900">
                    <strong>⚠️ Hinet 登入資訊：</strong><br/>
                    • 使用您的 Hinet 企業帳號登入<br/>
                    • 或使用域名管理帳號（向 Hinet 申請時取得）
                  </p>
                </div>
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
                <h3 className="font-semibold text-lg mb-2">選擇域名 casewhr.com</h3>
                <p className="text-gray-600 mb-3">
                  在域名列表中找到並點擊 <code className="bg-gray-100 px-2 py-0.5 rounded">casewhr.com</code>
                </p>
                <p className="text-sm text-gray-500">
                  進入 DNS 設定或記錄管理頁面
                </p>
              </div>
            </div>

            {/* 步驟 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  3
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">新增 TXT 記錄</h3>
                <p className="text-gray-600 mb-3">
                  找到「新增記錄」或「Add Record」按鈕，選擇記錄類型為 <strong>TXT</strong>
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">記錄類型</label>
                    <Badge variant="outline">TXT</Badge>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">主機名稱 / Host Name</label>
                    <div className="space-y-2">
                      <div className="bg-white border rounded p-2">
                        <code className="text-sm">_dmarc.casewhr.com</code>
                        <span className="text-xs text-gray-500 ml-2">(完整格式)</span>
                      </div>
                      <div className="text-sm text-gray-600">或</div>
                      <div className="bg-white border rounded p-2">
                        <code className="text-sm">_dmarc</code>
                        <span className="text-xs text-gray-500 ml-2">(簡短格式，系統自動補 .casewhr.com)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">記錄值 / TXT Value</label>
                    <div className="bg-white border rounded p-3">
                      <code className="text-xs break-all">{dmarcRecord}</code>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => copyToClipboard(dmarcRecord)}
                    >
                      <Copy className="h-3 w-3 mr-2" />
                      複製記錄值
                    </Button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">TTL（存活時間）</label>
                    <div className="bg-white border rounded p-2">
                      <code className="text-sm">3600</code>
                      <span className="text-xs text-gray-500 ml-2">(1小時，或使用預設值)</span>
                    </div>
                  </div>
                </div>

                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-900 text-sm">
                    <strong>特別注意：</strong>Hinet 的介面可能與上述描述略有不同。如果找不到對應欄位，請參考 Hinet 提供的說明文件或聯繫客服。
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
                <h3 className="font-semibold text-lg mb-2">儲存並確認</h3>
                <p className="text-gray-600 mb-3">
                  點擊「儲存」或「確認」按鈕，完成記錄新增
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    ✅ 系統可能會顯示確認訊息，請仔細檢查記錄內容是否正確
                  </p>
                </div>
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
                <h3 className="font-semibold text-lg mb-2">等待 DNS 生效</h3>
                <p className="text-gray-600 mb-3">
                  Hinet DNS 更新通常需要 <strong>30 分鐘到 24 小時</strong>
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>一般情況：1-2 小時</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>最長可能：24 小時</span>
                  </div>
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
                <h3 className="font-semibold text-lg mb-2">驗證設定</h3>
                <p className="text-gray-600 mb-3">
                  使用以下工具檢查 DMARC 記錄是否生效
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://mxtoolbox.com/dmarc.aspx', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    MX Toolbox DMARC
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://www.mail-tester.com', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Mail Tester
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hinet 技術支援 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📞 需要協助？聯繫 Hinet 技術支援
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <Info className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                如果您在配置過程中遇到困難，可以直接聯繫 Hinet 客服協助設定 DMARC 記錄。
                Hinet 技術人員通常很樂意協助企業客戶進行 DNS 設定。
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">電話客服</h4>
                </div>
                <p className="text-sm text-blue-800">
                  <strong>企業客服：</strong>0800-080-412<br/>
                  <strong>服務時間：</strong>週一至週五 9:00-18:00
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-900">線上客服</h4>
                </div>
                <p className="text-sm text-purple-800">
                  前往 Hinet 企業客戶服務平台<br/>
                  使用線上表單提交服務請求
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">💡 向客服說明時可以這樣說：</h4>
              <div className="bg-white rounded p-3 text-sm">
                <p className="italic text-gray-700">
                  "您好，我需要在我的域名 <strong>casewhr.com</strong> 新增一筆 DMARC 的 TXT 記錄。<br/>
                  主機名稱是 <strong>_dmarc</strong>，<br/>
                  記錄值我已經準備好了，可以請您協助設定嗎？"
                </p>
              </div>
              <p className="text-xs text-yellow-700 mt-2">
                然後將上面複製的記錄值提供給客服人員即可。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 常見問題 */}
      <Card>
        <CardHeader>
          <CardTitle>❓ Hinet DNS 常見問題</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Q1: 我找不到 Hinet 的 DNS 管理頁面？</h4>
            <p className="text-sm text-gray-600 pl-4">
              A: Hinet 的 DNS 管理通常在「企業客戶服務平台」或「網域名稱管理」區塊。
              如果找不到，請直接聯繫 Hinet 客服，他們會提供登入連結或協助您設定。
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Q2: 主機名稱要填完整的還是簡短的？</h4>
            <p className="text-sm text-gray-600 pl-4">
              A: 這取決於 Hinet 系統版本。建議先嘗試填 <code className="bg-gray-100 px-1 rounded">_dmarc</code>，
              如果系統提示錯誤，再改為 <code className="bg-gray-100 px-1 rounded">_dmarc.casewhr.com</code>。
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Q3: 設定完成後要等多久才會生效？</h4>
            <p className="text-sm text-gray-600 pl-4">
              A: Hinet DNS 更新時間因系統而異，通常 1-2 小時，最長可能需要 24 小時。
              建議設定完成後隔天再用 MX Toolbox 檢查。
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Q4: 我已經有其他 TXT 記錄了，會衝突嗎？</h4>
            <p className="text-sm text-gray-600 pl-4">
              A: 不會！DMARC 使用 <code className="bg-gray-100 px-1 rounded">_dmarc</code> 這個特殊的主機名稱，
              與其他 TXT 記錄（如 SPF、DKIM）是分開的，不會互相衝突。
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Q5: 設定錯誤會影響現有郵件收發嗎？</h4>
            <p className="text-sm text-gray-600 pl-4">
              A: 我們推薦的配置（<code className="bg-gray-100 px-1 rounded">pct=10</code>）影響非常小，
              而且即使設定錯誤，DMARC 記錄也不會影響郵件的正常發送，只會影響驗證結果的報告。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}