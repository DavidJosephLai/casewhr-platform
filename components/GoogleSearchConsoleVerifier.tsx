import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, ExternalLink, Copy, Check } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

export function GoogleSearchConsoleVerifier() {
  const [checking, setChecking] = useState(false);
  const [dnsResults, setDnsResults] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const verificationCode = '9Ehf9UQIP35HCGnahNU8JKWqxoGAv17ge72yB4t8yWA';
  const domain = 'casewhr.com';

  const checkDNS = async () => {
    setChecking(true);
    try {
      // 使用 Google DNS API 查詢 TXT 記錄
      const response = await fetch(
        `https://dns.google/resolve?name=${domain}&type=TXT`
      );
      const data = await response.json();
      
      setDnsResults(data);
    } catch (error) {
      console.error('DNS 查詢錯誤:', error);
      setDnsResults({ error: true, message: String(error) });
    } finally {
      setChecking(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const checkVerificationInDNS = () => {
    if (!dnsResults || !dnsResults.Answer) return { found: false, records: [] };
    
    const txtRecords = dnsResults.Answer.filter((record: any) => record.type === 16);
    const verificationRecords = txtRecords.filter((record: any) => 
      record.data && record.data.includes('google-site-verification')
    );
    
    const foundCorrectRecord = verificationRecords.some((record: any) => 
      record.data.includes(verificationCode)
    );

    return {
      found: foundCorrectRecord,
      records: verificationRecords.map((r: any) => r.data)
    };
  };

  const dnsCheck = dnsResults ? checkVerificationInDNS() : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Google Search Console DNS 驗證工具</span>
          </CardTitle>
          <CardDescription>
            檢查您的 DNS TXT 記錄是否已經生效，並提供完整的驗證步驟指引
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 驗證碼信息 */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">驗證碼</h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-100 dark:bg-slate-800 p-3 rounded text-sm overflow-x-auto">
                {verificationCode}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(verificationCode, 'code')}
              >
                {copied === 'code' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* DNS TXT 記錄格式 */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">DNS TXT 記錄格式</h3>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">類型 (Type):</span>
                <code className="bg-white dark:bg-slate-900 px-2 py-1 rounded">TXT</code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">名稱 (Name/Host):</span>
                <code className="bg-white dark:bg-slate-900 px-2 py-1 rounded">@ 或留空</code>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">值 (Value/Data):</span>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white dark:bg-slate-900 px-2 py-1 rounded overflow-x-auto">
                    google-site-verification={verificationCode}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(`google-site-verification=${verificationCode}`, 'txt')}
                  >
                    {copied === 'txt' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">TTL:</span>
                <code className="bg-white dark:bg-slate-900 px-2 py-1 rounded">3600 或預設值</code>
              </div>
            </div>
          </div>

          {/* DNS 檢查按鈕 */}
          <div className="flex flex-col gap-3">
            <Button 
              onClick={checkDNS} 
              disabled={checking}
              className="w-full"
            >
              {checking ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  檢查中...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  檢查 DNS 記錄
                </>
              )}
            </Button>

            {dnsResults && dnsCheck && (
              <Alert variant={dnsCheck.found ? 'default' : 'destructive'}>
                <div className="flex items-start gap-2">
                  {dnsCheck.found ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <AlertDescription>
                      {dnsCheck.found ? (
                        <div className="space-y-2">
                          <p className="font-semibold text-green-700 dark:text-green-400">
                            ✓ DNS TXT 記錄已生效！
                          </p>
                          <p className="text-sm">
                            您的驗證碼已經在 DNS 中找到。現在可以在 Google Search Console 中進行驗證了。
                          </p>
                          {dnsCheck.records.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium mb-1">找到的記錄：</p>
                              {dnsCheck.records.map((record: string, index: number) => (
                                <code key={index} className="block bg-white dark:bg-slate-900 px-2 py-1 rounded text-xs mt-1">
                                  {record}
                                </code>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="font-semibold">
                            ⚠️ DNS TXT 記錄尚未生效
                          </p>
                          <p className="text-sm">
                            DNS 記錄可能需要幾小時到 48 小時才能完全生效。請稍後再試。
                          </p>
                          {dnsCheck.records.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium mb-1">找到的其他 Google 驗證記錄：</p>
                              {dnsCheck.records.map((record: string, index: number) => (
                                <code key={index} className="block bg-white dark:bg-slate-900 px-2 py-1 rounded text-xs mt-1">
                                  {record}
                                </code>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 驗證步驟指引 */}
      <Card>
        <CardHeader>
          <CardTitle>Google Search Console 驗證步驟</CardTitle>
          <CardDescription>
            請按照以下步驟完成 DNS 記錄驗證
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 步驟 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <h3 className="font-semibold">確認 DNS 記錄已添加</h3>
            </div>
            <div className="ml-10 space-y-2 text-sm text-muted-foreground">
              <p>在 HiNET DNS 管理面板中，確認已添加以下 TXT 記錄：</p>
              <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded">
                <p><strong>類型:</strong> TXT</p>
                <p><strong>名稱:</strong> @ (或留空，表示根域名)</p>
                <p><strong>值:</strong> google-site-verification={verificationCode}</p>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  注意：DNS 更新可能需要幾小時到 48 小時才能完全生效。請耐心等待。
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* 步驟 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <h3 className="font-semibold">檢查 DNS 記錄是否生效</h3>
            </div>
            <div className="ml-10 space-y-2 text-sm text-muted-foreground">
              <p>使用上方的「檢查 DNS 記錄」按鈕來確認記錄是否已經生效。</p>
              <p>您也可以使用以下在線工具進行檢查：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <a 
                    href="https://toolbox.googleapps.com/apps/dig/#TXT/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Google Dig Tool
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://mxtoolbox.com/TXTLookup.aspx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    MX Toolbox TXT Lookup
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* 步驟 3 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <h3 className="font-semibold">前往 Google Search Console 驗證</h3>
            </div>
            <div className="ml-10 space-y-3 text-sm text-muted-foreground">
              <p>一旦 DNS 記錄生效，請按照以下步驟在 Google Search Console 中完成驗證：</p>
              
              <div className="space-y-2 bg-slate-100 dark:bg-slate-800 p-4 rounded">
                <p className="font-medium text-foreground">3.1 開啟 Google Search Console</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://search.google.com/search-console', '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  前往 Google Search Console
                </Button>
              </div>

              <div className="space-y-2 bg-slate-100 dark:bg-slate-800 p-4 rounded">
                <p className="font-medium text-foreground">3.2 選擇資源 (Property)</p>
                <p>選擇 casewhr.com 或點擊左上角的下拉選單選擇您的網站</p>
              </div>

              <div className="space-y-2 bg-slate-100 dark:bg-slate-800 p-4 rounded">
                <p className="font-medium text-foreground">3.3 前往「設定」→「擁有權驗證」</p>
                <p>在左側選單中找到「設定」(Settings)，然後點擊「擁有權驗證」(Ownership verification)</p>
              </div>

              <div className="space-y-2 bg-slate-100 dark:bg-slate-800 p-4 rounded">
                <p className="font-medium text-foreground">3.4 選擇 DNS 記錄驗證方法</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>點擊「新增驗證方法」或「驗證」按鈕</li>
                  <li>選擇「<strong>DNS 記錄</strong>」(DNS record) 或「<strong>Domain name provider</strong>」選項</li>
                  <li>如果看到多種驗證方法，<strong>不要</strong>選擇「HTML 標記」或「HTML 文件」</li>
                  <li>確保選擇的是 <strong>TXT 記錄</strong>驗證方法</li>
                </ul>
              </div>

              <div className="space-y-2 bg-slate-100 dark:bg-slate-800 p-4 rounded">
                <p className="font-medium text-foreground">3.5 點擊「驗證」按鈕</p>
                <p>Google 會檢查您的 DNS TXT 記錄。如果記錄已生效，驗證將會成功。</p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>重要提示：</strong>如果之前嘗試使用 HTML 標記方法驗證失敗，請確保切換到「DNS 記錄」驗證方法。Google Search Console 可能會記住您上次使用的方法。
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* 步驟 4 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold">
                4
              </div>
              <h3 className="font-semibold">驗證成功後的後續步驟</h3>
            </div>
            <div className="ml-10 space-y-2 text-sm text-muted-foreground">
              <p>驗證成功後，建議完成以下步驟：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>提交 Sitemap：https://casewhr.com/sitemap.xml</li>
                <li>檢查網站索引狀態</li>
                <li>查看搜索效能報告</li>
                <li>設定網站地圖和檢查行動裝置相容性</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 常見問題 */}
      <Card>
        <CardHeader>
          <CardTitle>常見問題與解決方案</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-semibold">Q: DNS 記錄已添加，但檢查工具顯示未生效？</h4>
            <p className="text-muted-foreground">
              A: DNS 更新需要時間傳播。通常需要幾小時，最長可能需要 48 小時。請耐心等待並定期檢查。
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Q: Google Search Console 一直顯示驗證失敗？</h4>
            <p className="text-muted-foreground">
              A: 確保您在 Google Search Console 中選擇的是「DNS 記錄」驗證方法，而不是「HTML 標記」或「HTML 文件」方法。如果之前嘗試過其他方法，請在驗證設定中切換到 DNS 記錄方法。
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Q: 我應該保留 SEO.tsx 中的 meta 標籤嗎？</h4>
            <p className="text-muted-foreground">
              A: 是的，保留它沒有問題。HTML meta 標籤和 DNS TXT 記錄可以同時存在，互不衝突。但對於驗證來說，只需要其中一種方法成功即可。
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Q: 驗證成功後，可以刪除 DNS TXT 記錄嗎？</h4>
            <p className="text-muted-foreground">
              A: 不建議。為了保持驗證狀態，建議永久保留 DNS TXT 記錄。刪除記錄可能導致失去擁有權驗證。
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Q: 如何確認 HiNET DNS 設定正確？</h4>
            <p className="text-muted-foreground">
              A: 登入 HiNET DNS 管理面板，確認有一條 TXT 記錄，其值為 "google-site-verification=9Ehf9UQIP35HCGnahNU8JKWqxoGAv17ge72yB4t8yWA"。名稱欄位應該是 "@" 或留空（表示根域名）。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 聯繫支援 */}
      <Card>
        <CardHeader>
          <CardTitle>需要協助？</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            如果按照以上步驟仍然無法完成驗證，請聯繫：
          </p>
          <div className="space-y-2">
            <p><strong>HiNET 技術支援：</strong></p>
            <ul className="list-disc list-inside text-muted-foreground ml-4">
              <li>客服專線：0800-080-128</li>
              <li>線上客服：<a href="https://service.hinet.net/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">service.hinet.net</a></li>
            </ul>
          </div>
          <div className="space-y-2">
            <p><strong>Google Search Console 說明中心：</strong></p>
            <ul className="list-disc list-inside text-muted-foreground ml-4">
              <li>
                <a 
                  href="https://support.google.com/webmasters/answer/9008080" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  驗證網站擁有權說明
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GoogleSearchConsoleVerifier;