import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner';

interface PayPalStatus {
  configured: boolean;
  mode: string;
  clientIdSet: boolean;
  clientSecretSet: boolean;
}

export function PayPalConfigChecker() {
  const [status, setStatus] = useState<PayPalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    checkPayPalConfig();
  }, []);

  const checkPayPalConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/paypal/status`
      );

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        toast.error('Failed to check PayPal configuration');
      }
    } catch (error) {
      console.error('Error checking PayPal config:', error);
      toast.error('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`已複製 ${label}`);
    setTimeout(() => setCopied(null), 2000);
  };

  const envVars = [
    {
      name: 'PAYPAL_CLIENT_ID',
      description: '從 PayPal Developer Dashboard 獲取的 Client ID',
      required: true,
      set: status?.clientIdSet,
    },
    {
      name: 'PAYPAL_CLIENT_SECRET',
      description: '從 PayPal Developer Dashboard 獲取的 Secret',
      required: true,
      set: status?.clientSecretSet,
    },
    {
      name: 'PAYPAL_MODE',
      description: '測試環境用 "sandbox"，正式環境用 "live"',
      required: true,
      set: status?.mode ? true : false,
      currentValue: status?.mode,
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">檢查 PayPal 配置中...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 總覽狀態 */}
      <Card className={status?.configured ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status?.configured ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <span className="text-green-900">✅ PayPal 已配置</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-6 w-6 text-yellow-600" />
                <span className="text-yellow-900">⚠️ PayPal 尚未配置</span>
              </>
            )}
          </CardTitle>
          <CardDescription>
            {status?.configured
              ? '您的 PayPal 集成已正確設置，可以開始接收付款。'
              : '請按照下方指南設置 PayPal API 憑證。'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={status?.configured ? 'default' : 'secondary'} className="text-sm">
                {status?.configured ? '✅ 已配置' : '❌ 未配置'}
              </Badge>
              <span className="text-sm text-gray-600">配置狀態</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={status?.mode === 'live' ? 'default' : 'outline'}
                className={status?.mode === 'live' ? 'bg-green-600' : 'bg-yellow-600 text-white'}
              >
                {status?.mode === 'live' ? '🟢 正式環境' : '🟡 測試環境'}
              </Badge>
              <span className="text-sm text-gray-600">運行模式</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={checkPayPalConfig}>
                🔄 重新檢查
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 環境變數清單 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📋 環境變數配置清單
          </CardTitle>
          <CardDescription>確保以下所有環境變數都已在 Supabase 中設置</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {envVars.map((envVar) => (
              <div
                key={envVar.name}
                className={`p-4 rounded-lg border-2 ${
                  envVar.set ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {envVar.set ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <code className="text-sm font-mono font-semibold">{envVar.name}</code>
                      {envVar.required && (
                        <Badge variant="destructive" className="text-xs">
                          必需
                        </Badge>
                      )}
                      {envVar.currentValue && (
                        <Badge variant="outline" className="text-xs">
                          {envVar.currentValue}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 ml-7">{envVar.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(envVar.name, envVar.name)}
                  >
                    {copied === envVar.name ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 設置指南 */}
      {!status?.configured && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              📚 快速設置指南
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-blue-900">步驟 1: 獲取 PayPal API 憑證</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 ml-4">
                <li>
                  訪問{' '}
                  <a
                    href="https://developer.paypal.com/dashboard/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline inline-flex items-center gap-1 hover:text-blue-600"
                  >
                    PayPal Developer Dashboard
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>登入您的 PayPal Business Account</li>
                <li>
                  前往 <strong>"Apps & Credentials"</strong>
                </li>
                <li>
                  選擇 <strong>"Sandbox"</strong> 標籤（測試環境）
                </li>
                <li>
                  點擊 <strong>"Create App"</strong>
                </li>
                <li>應用名稱輸入：Case Where Platform</li>
                <li>複製 Client ID 和 Secret（點擊 Show 顯示）</li>
              </ol>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-blue-900">步驟 2: 配置 Supabase 環境變數</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 ml-4">
                <li>
                  訪問{' '}
                  <a
                    href={`https://supabase.com/dashboard/project/${projectId}/settings/functions`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline inline-flex items-center gap-1 hover:text-blue-600"
                  >
                    Supabase Functions 設置
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>找到 "Secrets" 或 "Environment Variables" 區域</li>
                <li>添加以下三個環境變數：</li>
              </ol>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm mt-3">
                <div>PAYPAL_CLIENT_ID=你的_Client_ID</div>
                <div>PAYPAL_CLIENT_SECRET=你的_Secret</div>
                <div>PAYPAL_MODE=sandbox</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-blue-900">步驟 3: 重新部署</h3>
              <p className="text-sm text-blue-800 ml-4">
                環境變數更新後，需要重新部署 Edge Function 或等待 2-3 分鐘自動更新。
              </p>
            </div>

            <Alert className="bg-blue-100 border-blue-300">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>提示：</strong> 完成設置後，點擊上方的 "🔄 重新檢查" 按鈕驗證配置。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* 測試連結 */}
      {status?.configured && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              ✅ 配置成功！下一步測試
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-green-100 border-green-300">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>PayPal 已正確配置！</strong> 您現在可以開始測試付款功能。
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h3 className="font-semibold text-green-900">推薦測試流程：</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-green-800 ml-4">
                <li>前往 <strong>錢包頁面</strong></li>
                <li>點擊 <strong>充值</strong> 按鈕</li>
                <li>輸入測試金額（例如：$10 USD）</li>
                <li>選擇 <strong>PayPal 付款</strong></li>
                <li>使用 PayPal Sandbox 帳號登入並完成付款</li>
                <li>確認錢包餘額更新</li>
              </ol>
            </div>

            {status.mode === 'sandbox' && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-900 mb-2">
                  <strong>🔔 測試環境提示：</strong>
                </p>
                <p className="text-sm text-yellow-800">
                  當前使用測試環境，請使用 PayPal Sandbox 帳號進行測試。
                  前往{' '}
                  <a
                    href="https://developer.paypal.com/dashboard/accounts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-yellow-600"
                  >
                    PayPal Developer Dashboard
                  </a>{' '}
                  查看您的測試帳號。
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button asChild className="flex-1">
                <a href="/?tab=wallet">前往錢包測試</a>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <a href="/test-paypal.html" target="_blank">
                  使用測試頁面 <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 詳細文檔 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">📖 完整文檔</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            需要更詳細的設置說明？查看完整的 PayPal 集成文檔。
          </p>
          <Button asChild variant="outline">
            <a href="/docs/PAYPAL_SETUP_GUIDE.md" target="_blank">
              查看完整設置指南 <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}