import { auth } from '../lib/supabase';
import { toast } from 'sonner';

export function GoogleOAuthTester() {
  const { language } = useLanguage();
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const isEnglish = language === 'en';

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [key]: false }));
    }, 2000);
    toast.success(isEnglish ? 'Copied!' : '已複製！');
  };

  const handleTestGoogleOAuth = async () => {
    setTestStatus('testing');
    try {
      await auth.signInWithGoogle();
      // OAuth 會自動跳轉，不需要等待結果
    } catch (error: any) {
      console.error('❌ Google OAuth test failed:', error);
      setTestStatus('error');
      toast.error(
        isEnglish
          ? `Test failed: ${error.message}`
          : `測試失敗：${error.message}`
      );
    }
  };

  const configSteps = [
    {
      id: 'google-console',
      title: isEnglish ? '1. Google Cloud Console' : '1. Google Cloud Console 設定',
      description: isEnglish
        ? 'Configure OAuth 2.0 redirect URI'
        : '配置 OAuth 2.0 重定向 URI',
      url: 'https://console.cloud.google.com/apis/credentials',
      status: 'pending' as const,
      details: [
        {
          label: isEnglish ? 'Redirect URI' : '重定向 URI',
          value: 'https://bihplitfentxioxyjalb.supabase.co/auth/v1/callback',
        },
        {
          label: 'Client ID',
          value: '16224489255-24nkbhbdivbcrru3r48ci5hh70s9656o.apps.googleusercontent.com',
        },
      ],
    },
    {
      id: 'supabase-provider',
      title: isEnglish ? '2. Supabase Google Provider' : '2. Supabase Google 提供商',
      description: isEnglish
        ? 'Enable Google provider and enter credentials'
        : '啟用 Google 提供商並輸入憑證',
      url: 'https://supabase.com/dashboard/project/bihplitfentxioxyjalb/auth/providers',
      status: 'pending' as const,
      details: [
        {
          label: 'Client ID',
          value: '16224489255-24nkbhbdivbcrru3r48ci5hh70s9656o.apps.googleusercontent.com',
        },
        {
          label: 'Client Secret',
          value: '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',
        },
      ],
    },
    {
      id: 'supabase-urls',
      title: isEnglish ? '3. Supabase URL Configuration' : '3. Supabase URL 配置',
      description: isEnglish
        ? 'Set Site URL and Redirect URLs'
        : '設定 Site URL 和重定向 URLs',
      url: 'https://supabase.com/dashboard/project/bihplitfentxioxyjalb/auth/url-configuration',
      status: 'pending' as const,
      details: [
        {
          label: 'Site URL',
          value: 'https://casewhr.com',
        },
        {
          label: 'Redirect URLs',
          value: 'https://casewhr.com/**\nhttps://casewhr.com/auth/callback',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl mb-4">
            🔐 Google OAuth {isEnglish ? 'Configuration Tester' : '配置測試器'}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {isEnglish
              ? 'Follow these steps to complete Google OAuth configuration, then test the integration'
              : '按照以下步驟完成 Google OAuth 配置，然後測試整合功能'}
          </p>
        </div>

        {/* Configuration Steps */}
        <div className="space-y-6 mb-8">
          {configSteps.map((step, index) => (
            <Card key={step.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Circle className="h-5 w-5 text-blue-500" />
                      {step.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {step.description}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(step.url, '_blank')}
                    className="ml-4"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {isEnglish ? 'Open' : '打開'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {step.details.map((detail, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {detail.label}:
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(detail.value, `${step.id}-${idx}`)}
                          className="h-8 px-2"
                        >
                          {copiedStates[`${step.id}-${idx}`] ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <code className="text-xs text-gray-600 break-all block whitespace-pre-wrap">
                        {detail.value}
                      </code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Important Notes */}
        <Card className="mb-8 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">
              ⚠️ {isEnglish ? 'Important Notes' : '重要提醒'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-yellow-700 space-y-2">
            <p>
              {isEnglish
                ? '• Configuration changes in Google Cloud Console may take 5-10 minutes to take effect'
                : '• Google Cloud Console 的配置更改可能需要 5-10 分鐘才能生效'}
            </p>
            <p>
              {isEnglish
                ? '• Make sure to click "Save" after each configuration step'
                : '• 每個配置步驟完成後務必點擊「儲存」'}
            </p>
            <p>
              {isEnglish
                ? '• The redirect URI must exactly match (including https:// and /auth/v1/callback)'
                : '• 重定向 URI 必須完全匹配（包括 https:// 和 /auth/v1/callback）'}
            </p>
          </CardContent>
        </Card>

        {/* Test Section */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">
              🧪 {isEnglish ? 'Test Google OAuth' : '測試 Google OAuth'}
            </CardTitle>
            <CardDescription>
              {isEnglish
                ? 'Click the button below to test Google OAuth login flow'
                : '點擊下方按鈕測試 Google OAuth 登入流程'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={handleTestGoogleOAuth}
                disabled={testStatus === 'testing'}
                size="lg"
                className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              >
                <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {testStatus === 'testing'
                  ? isEnglish
                    ? 'Redirecting to Google...'
                    : '正在重定向到 Google...'
                  : isEnglish
                  ? 'Sign in with Google'
                  : '使用 Google 登入'}
              </Button>

              {testStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-red-900 font-medium mb-1">
                        {isEnglish ? 'Test Failed' : '測試失敗'}
                      </h4>
                      <p className="text-sm text-red-700">
                        {isEnglish
                          ? 'Please check the browser console for detailed error messages'
                          : '請檢查瀏覽器控制台獲取詳細錯誤訊息'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expected Flow */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>
              ✅ {isEnglish ? 'Expected Flow' : '預期流程'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                  1
                </span>
                <span className="text-gray-700">
                  {isEnglish
                    ? 'Click "Sign in with Google" button'
                    : '點擊「使用 Google 登入」按鈕'}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                  2
                </span>
                <span className="text-gray-700">
                  {isEnglish
                    ? 'Redirect to Google login page'
                    : '重定向到 Google 登入頁面'}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                  3
                </span>
                <span className="text-gray-700">
                  {isEnglish
                    ? 'Select Google account and grant permissions'
                    : '選擇 Google 帳號並授予權限'}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                  4
                </span>
                <span className="text-gray-700">
                  {isEnglish
                    ? 'Redirect back to /auth/callback'
                    : '重定向回 /auth/callback'}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                  5
                </span>
                <span className="text-gray-700">
                  {isEnglish
                    ? 'Show "Completing sign in..." loading screen'
                    : '顯示「正在完成登入...」加載畫面'}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                  6
                </span>
                <span className="text-gray-700">
                  {isEnglish
                    ? 'Show "Sign in successful!" confirmation'
                    : '顯示「登入成功！」確認訊息'}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                  7
                </span>
                <span className="text-gray-700">
                  {isEnglish
                    ? 'Auto redirect to Dashboard with user info displayed'
                    : '自動重定向到 Dashboard 並顯示使用者資訊'}
                </span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Documentation Link */}
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => window.open('/GOOGLE_OAUTH_SETUP.md', '_blank')}
          >
            📖 {isEnglish ? 'View Full Documentation' : '查看完整文檔'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default GoogleOAuthTester;